//! 사용자 테마 파일 (로드맵 S-4) — `%APPDATA%\MdEditor\themes\<id>.json`.
//!
//! 형식 검증(토큰 이름·색 값)은 프런트(src/theme/themes.ts `parseThemeFile`)가 한다 — CSS 색 문법 판정이
//! 웹뷰의 `CSS.supports`에 있기 때문이다. 여기서는 파일 이름으로 쓰는 id만 검사해 폴더 밖으로 나가지 못하게 한다.

use std::path::{Path, PathBuf};

use serde::Serialize;
use tauri::{AppHandle, Manager};

/// 테마 파일 하나의 크기 상한 — 토큰 60여 개짜리 JSON은 수 KB다
const MAX_THEME_BYTES: u64 = 256 * 1024;
const MAX_THEME_FILES: usize = 200;

fn themes_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let base = app.path().data_dir().map_err(|e| e.to_string())?;
    Ok(base.join("MdEditor").join("themes"))
}

/// 파일 이름이 되는 id — 영문·숫자로 시작하고 영문·숫자·`-`·`_`만, 64자까지
pub fn valid_id(id: &str) -> bool {
    let mut chars = id.chars();
    matches!(chars.next(), Some(c) if c.is_ascii_alphanumeric())
        && id.len() <= 64
        && chars.all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_')
}

fn theme_path(dir: &Path, id: &str) -> Result<PathBuf, String> {
    if !valid_id(id) {
        return Err(format!("테마 id에는 영문·숫자·-·_만 쓸 수 있습니다: {id}"));
    }
    Ok(dir.join(format!("{id}.json")))
}

/// 텍스트 파일을 코어로 읽는다(BOM·인코딩 감지). 너무 크면 거절
fn read_text(path: &Path) -> Result<String, String> {
    let size = std::fs::metadata(path).map_err(|e| format!("{}: {e}", path.display()))?.len();
    if size > MAX_THEME_BYTES {
        return Err(format!("테마 파일이 너무 큽니다 ({size} B > {MAX_THEME_BYTES} B)"));
    }
    let doc = mdeditor_core::FileDocument::open(path).map_err(|e| format!("{}: {e}", path.display()))?;
    Ok(doc.text().to_owned())
}

#[derive(Serialize)]
pub struct ThemeFileText {
    /// 확장자를 뺀 파일 이름 — JSON에 id가 없으면 이것을 쓴다
    pub stem: String,
    pub text: String,
}

fn list_in(dir: &Path) -> Vec<ThemeFileText> {
    let Ok(entries) = std::fs::read_dir(dir) else { return Vec::new() };
    let mut files: Vec<PathBuf> = entries
        .filter_map(Result::ok)
        .map(|e| e.path())
        .filter(|p| p.extension().is_some_and(|x| x.eq_ignore_ascii_case("json")))
        .collect();
    files.sort();
    files
        .into_iter()
        .take(MAX_THEME_FILES)
        .filter_map(|p| {
            let text = read_text(&p).ok()?;
            let stem = p.file_stem()?.to_string_lossy().into_owned();
            Some(ThemeFileText { stem, text })
        })
        .collect()
}

/// 테마 폴더의 `*.json` 전부 (직접 넣은 파일 포함). 폴더가 없으면 빈 목록
#[tauri::command]
pub fn list_user_themes(app: AppHandle) -> Result<Vec<ThemeFileText>, String> {
    Ok(list_in(&themes_dir(&app)?))
}

/// 가져오기 — 사용자가 고른 파일을 읽기만 한다. 검증 뒤 `save_user_theme`로 폴더에 쓴다
#[tauri::command]
pub fn read_theme_file(path: String) -> Result<ThemeFileText, String> {
    let path = PathBuf::from(path);
    let stem = path.file_stem().map(|s| s.to_string_lossy().into_owned()).unwrap_or_default();
    Ok(ThemeFileText { stem, text: read_text(&path)? })
}

fn save_in(dir: &Path, id: &str, json: &str) -> Result<(), String> {
    let path = theme_path(dir, id)?;
    std::fs::create_dir_all(dir).map_err(|e| format!("{}: {e}", dir.display()))?;
    mdeditor_core::write_atomic(&path, json.as_bytes()).map_err(|e| format!("{}: {e}", path.display()))?;
    Ok(())
}

#[tauri::command]
pub fn save_user_theme(app: AppHandle, id: String, json: String) -> Result<(), String> {
    save_in(&themes_dir(&app)?, &id, &json)
}

fn delete_in(dir: &Path, id: &str) -> Result<(), String> {
    match std::fs::remove_file(theme_path(dir, id)?) {
        Ok(()) => Ok(()),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(()),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub fn delete_user_theme(app: AppHandle, id: String) -> Result<(), String> {
    delete_in(&themes_dir(&app)?, &id)
}

/// 내보내기 — 사용자가 저장 대화상자에서 고른 경로에 쓴다
#[tauri::command]
pub fn export_theme(path: String, json: String) -> Result<(), String> {
    let path = PathBuf::from(path);
    mdeditor_core::write_atomic(&path, json.as_bytes()).map_err(|e| format!("{}: {e}", path.display()))?;
    Ok(())
}

/// 탐색기로 테마 폴더를 연다 (없으면 만든다) — 직접 넣은 파일도 목록에 뜬다
#[tauri::command]
pub fn open_themes_folder(app: AppHandle) -> Result<(), String> {
    let dir = themes_dir(&app)?;
    std::fs::create_dir_all(&dir).map_err(|e| format!("{}: {e}", dir.display()))?;
    crate::assoc::shell_open(None, &dir.to_string_lossy())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn ids_cannot_escape_the_folder() {
        assert!(valid_id("sepia"));
        assert!(valid_id("my_theme-2"));
        assert!(!valid_id(""));
        assert!(!valid_id("-x"));
        assert!(!valid_id("../evil"));
        assert!(!valid_id("a/b"));
        assert!(!valid_id("세피아"));
        assert!(!valid_id(&"a".repeat(65)));
    }

    #[test]
    fn save_list_delete_roundtrip() {
        let dir = tempfile::tempdir().unwrap();
        let themes = dir.path().join("themes");
        save_in(&themes, "sepia", r#"{"name":"세피아"}"#).unwrap();
        std::fs::write(themes.join("notes.txt"), "not a theme").unwrap();
        let listed = list_in(&themes);
        assert_eq!(listed.len(), 1);
        assert_eq!(listed[0].stem, "sepia");
        assert!(listed[0].text.contains("세피아"));
        assert!(save_in(&themes, "../x", "{}").is_err());
        delete_in(&themes, "sepia").unwrap();
        delete_in(&themes, "sepia").unwrap();
        assert!(list_in(&themes).is_empty());
    }
}
