//! Frond 백엔드 — 파일 열기 경로(argv·두 번째 인스턴스·드롭)와 문서 로드.
//!
//! 파일 I/O는 fs 플러그인을 쓰지 않고 [`frond_core`]만 거친다 (스택 판정 조건 3).

use std::ffi::OsString;
use std::path::{Path, PathBuf};
use std::sync::Mutex;

use serde::Serialize;
use tauri::{AppHandle, Emitter, Manager, State, UserAttentionType, WebviewUrl, WebviewWindowBuilder};

mod appdata;
mod assets;
mod assoc;
mod drafts;
mod elevation;
mod export;
mod print_menu;
mod save;
mod themes;
mod tree;
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
    pub info: frond_core::DocumentInfo,
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

/// blake3 해시 → 소문자 hex. 저장 etag·외부 변경 비교(watch.rs)와 같은 표기
pub fn hash_hex(hash: &[u8; 32]) -> String {
    hash.iter().map(|b| format!("{b:02x}")).collect()
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

/// `encoding`을 주면 감지 대신 그 인코딩으로 해석한다 ("해석만 바꾸기", Encode in — 바이트는 그대로)
#[tauri::command]
fn load_document(app: AppHandle, path: String, encoding: Option<String>) -> Result<DocumentPayload, String> {
    let path = PathBuf::from(&path);
    let path = path.canonicalize().map_err(|e| format!("{}: {e}", path.display()))?;
    let mut doc = frond_core::FileDocument::open(&path).map_err(|e| format!("{}: {e}", path.display()))?;
    if let Some(label) = encoding {
        doc.reinterpret(save::encoding_for(&label)?);
    }
    let dir = path.parent().map(Path::to_path_buf).unwrap_or_else(|| path.clone());
    // 문서 폴더(하위 폴더 포함)를 asset 프로토콜에 허용 — 상대 이미지용 (스택 판정 조건 5).
    // `./images/x.png`처럼 하위 폴더가 흔해 재귀로 두되, 상위 폴더(`../`)는 열지 않는다
    app.asset_protocol_scope()
        .allow_directory(&dir, true)
        .map_err(|e| format!("asset scope: {e}"))?;
    let hash = hash_hex(&doc.content_hash());
    Ok(DocumentPayload {
        path: strip_verbatim(&path),
        dir: strip_verbatim(&dir),
        name: path.file_name().map(|n| n.to_string_lossy().into_owned()).unwrap_or_default(),
        text: doc.text().to_owned(),
        info: doc.info(),
        hash,
    })
}

/// 최근 파일 목록에서 고른 경로가 아직 파일로 있는지. 없으면 프런트가 알리고 목록에서 뺀다
#[tauri::command]
fn file_exists(path: String) -> bool {
    Path::new(&path).is_file()
}

/// WebView2 런타임 버전 — 프런트가 최소 버전(150, `minimumWebview2Version`)보다 낮으면 배너로 알린다.
/// 설치기는 설치 때만 확인하므로 런타임을 되돌리거나 고정 버전을 쓰는 PC를 여기서 잡는다
#[tauri::command]
fn webview_version() -> Option<String> {
    tauri::webview_version().ok()
}

/// AI 훅이 넘긴 인수의 표식 (로드맵 3-6) — `--from-hook=claude` → `claude`, 값 없는 `--from-hook` → `ai`.
/// 탐색기 더블클릭·연결 프로그램(ProgId `"mdeditor.exe" "%1"`)에는 없다. `-` 플래그라 `paths_from_args`는 이미 건너뛴다
pub fn hook_source<S: AsRef<str>>(args: &[S]) -> Option<String> {
    args.iter().find_map(|arg| {
        let rest = arg.as_ref().strip_prefix("--from-hook")?;
        match rest.strip_prefix('=') {
            Some(value) if !value.trim().is_empty() => Some(value.trim().to_lowercase()),
            Some(_) => Some("ai".to_owned()),
            None if rest.is_empty() => Some("ai".to_owned()),
            None => None,
        }
    })
}

/// AI 훅이 보낸 문서 — 프런트가 설정에 따라 받은 목록에 쌓거나 연다
#[derive(Clone, Serialize)]
struct HookFiles {
    paths: Vec<String>,
    source: String,
}

/// 두 번째 인스턴스가 넘긴 인수를 기존 창에 전달하고 창을 앞으로 가져온다.
/// AI 훅이 넘긴 것(`--from-hook`)은 보던 문서·창을 건드리지 않도록 앞으로 가져오지 않고 작업 표시줄만 깜빡인다 (로드맵 3-6)
fn on_second_instance(app: &AppHandle, args: Vec<String>, cwd: String) {
    let source = hook_source(&args);
    let paths = paths_from_args(args.into_iter().map(OsString::from), Some(Path::new(&cwd)));
    let paths: Vec<String> = paths.iter().map(|p| strip_verbatim(p)).collect();
    let window = app.get_webview_window("main");
    if let Some(source) = source {
        if let Some(window) = window {
            let _ = window.request_user_attention(Some(UserAttentionType::Informational));
        }
        let _ = app.emit("hook-file", HookFiles { paths, source });
        return;
    }
    if let Some(window) = window {
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
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
        .manage(watch::WatchState(Mutex::new(Default::default())))
        .manage(tree::TreeWatch(Mutex::new(None)))
        .setup(|app| {
            // 창은 코드로 만든다 — on_navigation 훅은 빌더에만 있다.
            // 웹뷰 안에서의 이동은 앱 자체 URL만 허용. 외부 링크는 프런트가 opener로 연다 (스택 판정 조건 5)
            // 제목 표시줄은 프런트가 그린다(src/titlebar.ts) — 테두리 없는 창도 가장자리 리사이즈·그림자는 런타임이 준다
            let window = WebviewWindowBuilder::new(app, "main", WebviewUrl::default())
                .title("Frond")
                .decorations(false)
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
            print_menu::route_print_to_app(&window);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            take_pending_paths,
            load_document,
            file_exists,
            webview_version,
            watch::watch_document,
            watch::unwatch_document,
            export::write_export,
            export::read_image_bytes,
            tree::list_dir,
            tree::watch_tree,
            tree::unwatch_tree,
            assoc::open_default_apps_settings,
            assoc::query_default_app,
            assoc::is_registered,
            elevation::is_elevated,
            save::save_document,
            save::save_document_as,
            drafts::write_draft,
            drafts::read_draft,
            drafts::delete_draft,
            drafts::list_drafts,
            assets::save_pasted_image,
            assets::copy_image_to_assets,
            themes::list_user_themes,
            themes::read_theme_file,
            themes::save_user_theme,
            themes::delete_user_theme,
            themes::export_theme,
            themes::open_themes_folder,
        ])
        .run(tauri::generate_context!())
        .expect("Frond 실행 실패");
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
    fn hook_flag_is_found_and_skipped_as_path() {
        let args = ["app.exe", "--from-hook=Claude", r"C:\a.md", r"C:\b.md"];
        assert_eq!(hook_source(&args), Some("claude".to_owned()));
        assert_eq!(paths_from_args(os(&args), None), vec![PathBuf::from(r"C:\a.md"), PathBuf::from(r"C:\b.md")]);
        assert_eq!(hook_source(&["app.exe", "--from-hook", "x.md"]), Some("ai".to_owned()));
        assert_eq!(hook_source(&["app.exe", "--from-hook=", "x.md"]), Some("ai".to_owned()));
        assert_eq!(hook_source(&["app.exe", "--from-hookx", "x.md"]), None);
        assert_eq!(hook_source(&["app.exe", r"C:\a.md"]), None);
    }

    #[test]
    fn empty_args_give_nothing() {
        assert!(paths_from_args(os(&["app.exe"]), None).is_empty());
        assert!(paths_from_args(os(&[]), None).is_empty());
    }
}
