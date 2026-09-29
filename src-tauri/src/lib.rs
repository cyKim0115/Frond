//! MdEditor 백엔드 — 파일 열기 경로(argv·두 번째 인스턴스·드롭)와 문서 로드.
//!
//! 파일 I/O는 fs 플러그인을 쓰지 않고 [`mdeditor_core`]만 거친다 (스택 판정 조건 3).

use std::ffi::OsString;
use std::path::{Path, PathBuf};
use std::sync::Mutex;

use serde::Serialize;
use tauri::{AppHandle, Emitter, Manager, State, WebviewUrl, WebviewWindowBuilder};

mod assoc;
mod watch;

/// 앱이 뜨기 전에 argv로 받은 파일들. 프런트가 준비되면 `take_pending_paths`로 가져간다.
pub struct Pending(Mutex<Vec<PathBuf>>);

/// 프런트에 넘기는 문서.
#[derive(Serialize)]
pub struct DocumentPayload {
    /// 정규화된 절대 경로
    pub path: String,
    /// 문서 폴더 — 상대 이미지 경로 기준, asset 프로토콜 허용 범위
    pub dir: String,
    pub name: String,
    /// LF 정규화 텍스트
    pub text: String,
    pub info: mdeditor_core::DocumentInfo,
    /// 원본 바이트 blake3 (외부 변경 감지용)
    pub hash: String,
}

/// argv에서 열 파일 경로만 고른다. `-`로 시작하는 플래그는 건너뛰고, `file://` URL은 경로로 바꾸며,
/// 상대 경로는 `cwd` 기준으로 만든다. 첫 인수(실행 파일)는 호출자가 이미 뺐다고 가정하지 않는다.
pub fn paths_from_args<I>(args: I, cwd: Option<&Path>) -> Vec<PathBuf>
where
    I: IntoIterator<Item = OsString>,
{
    args.into_iter()
        .skip(1)
        .filter_map(|arg| {
            let lossy = arg.to_string_lossy();
            if lossy.starts_with('-') || lossy.trim().is_empty() {
                return None;
            }
            let path = if lossy.starts_with("file://") {
                tauri::Url::parse(&lossy).ok()?.to_file_path().ok()?
            } else {
                PathBuf::from(&arg)
            };
            Some(match (path.is_relative(), cwd) {
                (true, Some(base)) => base.join(path),
                _ => path,
            })
        })
        .collect()
}

fn strip_verbatim(path: &Path) -> String {
    let s = path.to_string_lossy();
    s.strip_prefix(r"\\?\").unwrap_or(&s).to_owned()
}

#[tauri::command]
fn take_pending_paths(pending: State<'_, Pending>) -> Vec<String> {
    let mut guard = pending.0.lock().expect("pending lock");
    guard.drain(..).map(|p| strip_verbatim(&p)).collect()
}

#[tauri::command]
fn load_document(app: AppHandle, path: String) -> Result<DocumentPayload, String> {
    let path = PathBuf::from(&path);
    let path = path.canonicalize().map_err(|e| format!("{}: {e}", path.display()))?;
    let doc = mdeditor_core::FileDocument::open(&path).map_err(|e| format!("{}: {e}", path.display()))?;
    let dir = path.parent().map(Path::to_path_buf).unwrap_or_else(|| path.clone());
    // 문서 폴더만(비재귀) asset 프로토콜에 허용 — 상대 이미지용 (스택 판정 조건 5)
    app.asset_protocol_scope()
        .allow_directory(&dir, false)
        .map_err(|e| format!("asset scope: {e}"))?;
    let hash = doc.content_hash().iter().map(|b| format!("{b:02x}")).collect();
    Ok(DocumentPayload {
        path: strip_verbatim(&path),
        dir: strip_verbatim(&dir),
        name: path.file_name().map(|n| n.to_string_lossy().into_owned()).unwrap_or_default(),
        text: doc.text().to_owned(),
        info: doc.info(),
        hash,
    })
}

/// 두 번째 인스턴스가 넘긴 인수를 기존 창에 전달하고 창을 앞으로 가져온다.
fn on_second_instance(app: &AppHandle, args: Vec<String>, cwd: String) {
    let paths = paths_from_args(args.into_iter().map(OsString::from), Some(Path::new(&cwd)));
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
    let paths: Vec<String> = paths.iter().map(|p| strip_verbatim(p)).collect();
    let _ = app.emit("open-file", paths);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let initial = paths_from_args(std::env::args_os(), std::env::current_dir().ok().as_deref());

    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(on_second_instance))
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .manage(Pending(Mutex::new(initial)))
        .manage(watch::WatchState(Mutex::new(None)))
        .setup(|app| {
            // 창은 코드로 만든다 — on_navigation 훅은 빌더에만 있다.
            // 웹뷰 안에서의 이동은 앱 자체 URL만 허용. 외부 링크는 프런트가 opener로 연다 (스택 판정 조건 5)
            WebviewWindowBuilder::new(app, "main", WebviewUrl::default())
                .title("MdEditor")
                .inner_size(1100.0, 800.0)
                .min_inner_size(400.0, 300.0)
                .center()
                .on_navigation(|url| {
                    matches!(url.scheme(), "tauri" | "http" | "https")
                        && matches!(
                            url.host_str(),
                            Some("tauri.localhost") | Some("localhost") | Some("127.0.0.1")
                        )
                })
                .build()?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            take_pending_paths,
            load_document,
            watch::watch_document,
            watch::unwatch_document,
            assoc::open_default_apps_settings,
            assoc::query_default_app,
            assoc::is_registered,
        ])
        .run(tauri::generate_context!())
        .expect("MdEditor 실행 실패");
}

#[cfg(test)]
mod tests {
    use super::*;

    fn os(items: &[&str]) -> Vec<OsString> {
        items.iter().map(OsString::from).collect()
    }

    #[test]
    fn skips_exe_and_flags_and_joins_relative() {
        let cwd = Path::new(r"C:\work");
        let got = paths_from_args(os(&["app.exe", "--flag", "-v", "notes.md", r"D:\a b\한글.md"]), Some(cwd));
        assert_eq!(got, vec![PathBuf::from(r"C:\work\notes.md"), PathBuf::from(r"D:\a b\한글.md")]);
    }

    #[test]
    fn file_url_becomes_path() {
        let got = paths_from_args(os(&["app.exe", "file:///C:/Users/a%20b/%ED%95%9C.md"]), None);
        assert_eq!(got, vec![PathBuf::from(r"C:\Users\a b\한.md")]);
    }

    #[test]
    fn empty_args_give_nothing() {
        assert!(paths_from_args(os(&["app.exe"]), None).is_empty());
        assert!(paths_from_args(os(&[]), None).is_empty());
    }
}
