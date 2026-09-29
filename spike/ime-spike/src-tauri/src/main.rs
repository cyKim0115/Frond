//! IME 스파이크 — Tauri 2 최소 앱.
//!
//! 창은 코드로 만든다. `--tsf-off` 인수(또는 `IME_SPIKE_TSF_OFF=1`)가 있으면
//! WebView2에 `--disable-features=…,TSFHonorAutocorrectOff`를 넘겨 149 회귀 우회 플래그(G6)를 켠다.

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::Serialize;
use std::path::{Path, PathBuf};
use tauri::{Manager, WebviewUrl, WebviewWindowBuilder};

/// Tauri 기본값. 여기에 `TSFHonorAutocorrectOff`를 덧붙인다.
const DEFAULT_DISABLED: &str = "msWebOOUI,msPdfOOUI,msSmartScreenProtection";

#[derive(Serialize)]
struct EnvInfo {
    windows_build: String,
    windows_display_version: String,
    /// `HKCU\Software\Policies\Microsoft\InputMethod\Settings\KOR\ConfigureImeVersion` — 없으면 새 IME(기본)
    ime_version: String,
    webview2_version: String,
    tauri_version: String,
    tsf_flag_off: bool,
}

fn tsf_off() -> bool {
    std::env::args().any(|a| a == "--tsf-off")
        || std::env::var("IME_SPIKE_TSF_OFF").map(|v| v == "1").unwrap_or(false)
}

fn results_dir() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("../results")
}

fn read_reg_string(hive: winreg::HKEY, path: &str, name: &str) -> Option<String> {
    let key = winreg::RegKey::predef(hive).open_subkey(path).ok()?;
    key.get_value::<String, _>(name)
        .ok()
        .or_else(|| key.get_value::<u32, _>(name).ok().map(|v| v.to_string()))
}

#[tauri::command]
fn env_info() -> EnvInfo {
    use winreg::enums::{HKEY_CURRENT_USER, HKEY_LOCAL_MACHINE};
    let nt = r"SOFTWARE\Microsoft\Windows NT\CurrentVersion";
    let ime = read_reg_string(
        HKEY_CURRENT_USER,
        r"Software\Policies\Microsoft\InputMethod\Settings\KOR",
        "ConfigureImeVersion",
    );
    EnvInfo {
        windows_build: read_reg_string(HKEY_LOCAL_MACHINE, nt, "CurrentBuild").unwrap_or_default(),
        windows_display_version: read_reg_string(HKEY_LOCAL_MACHINE, nt, "DisplayVersion")
            .unwrap_or_default(),
        ime_version: match ime.as_deref() {
            None => "새 IME (레지스트리 없음)".to_owned(),
            Some("1") => "이전 IME (ConfigureImeVersion=1)".to_owned(),
            Some(v) => format!("ConfigureImeVersion={v}"),
        },
        webview2_version: tauri::webview_version().unwrap_or_else(|e| format!("(조회 실패: {e})")),
        tauri_version: tauri::VERSION.to_owned(),
        tsf_flag_off: tsf_off(),
    }
}

#[derive(Serialize)]
struct LoadedDocument {
    text: String,
    info: mdeditor_core::DocumentInfo,
}

/// mdeditor-core로 파일을 읽는다 (CP949 등 raw 샘플을 편집면에 넣어 보기 위함).
#[tauri::command]
fn load_document(path: String) -> Result<LoadedDocument, String> {
    let doc = mdeditor_core::FileDocument::open(&path).map_err(|e| e.to_string())?;
    Ok(LoadedDocument { text: doc.text().to_owned(), info: doc.info() })
}

/// 체크리스트 결과 마크다운을 `spike/ime-spike/results/<name>.md`에 쓴다.
#[tauri::command]
fn save_results(name: String, markdown: String) -> Result<String, String> {
    let safe: String = name
        .chars()
        .map(|c| if c.is_alphanumeric() || c == '-' || c == '_' { c } else { '_' })
        .collect();
    let dir = results_dir();
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let path = dir.join(format!("{safe}.md"));
    mdeditor_core::write_atomic(&path, markdown.as_bytes()).map_err(|e| e.to_string())?;
    Ok(path.canonicalize().unwrap_or(path).to_string_lossy().into_owned())
}

#[tauri::command]
fn repo_root() -> String {
    Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("../../..")
        .canonicalize()
        .map(|p| p.to_string_lossy().trim_start_matches(r"\\?\").to_owned())
        .unwrap_or_default()
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![env_info, load_document, save_results, repo_root])
        .setup(|app| {
            let mut builder = WebviewWindowBuilder::new(app, "main", WebviewUrl::default())
                .title(if tsf_off() { "IME 스파이크 (TSF 플래그 OFF)" } else { "IME 스파이크" })
                .inner_size(1180.0, 940.0)
                .min_inner_size(800.0, 600.0);
            if tsf_off() {
                builder = builder.additional_browser_args(&format!(
                    "--disable-features={DEFAULT_DISABLED},TSFHonorAutocorrectOff"
                ));
            }
            let window = builder.build()?;
            window.set_focus().ok();
            let _ = app.get_webview_window("main");
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("IME 스파이크 실행 실패");
}
