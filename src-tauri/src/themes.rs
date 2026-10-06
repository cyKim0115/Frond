//! 사용자 테마 파일 (로드맵 S-4) — `문서\Frond\themes\<id>.json`.
//!
//! 2026-10-06(store-launch A-2·U-3)부터 테마 폴더는 사용자 문서 폴더 아래다. MSIX로 설치하면 `%APPDATA%`가 패키지 전용 위치로
//! 가상화돼 탐색기에서 안 보이고 앱을 지우면 같이 지워지기 때문이다. 초안(`drafts`)은 `%APPDATA%\Frond`(appdata.rs)에 남는다.
//! 예전 폴더(`%APPDATA%\Frond\themes`)가 있고 새 폴더가 없으면 처음 부를 때 한 번 옮긴다(`migrate`).
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
    let docs = app.path().document_dir().map_err(|e| e.to_string())?;
    let old = crate::appdata::root(app)?.join("themes");
    Ok(migrate(&old, &docs.join("Frond").join("themes")))
}

/// 예전 테마 폴더를 새 위치로 한 번 옮긴다. 새 폴더가 이미 있으면(옮겼거나 사용자가 만들었으면) 다시 하지 않는다.
/// 같은 볼륨이면 이름 바꾸기 한 번, 문서 폴더가 다른 드라이브(OneDrive 등)면 폴더째 복사한 뒤 옛 폴더를 지운다.
/// 옮기지 못하면 이번에는 옛 폴더를 쓴다 — 테마를 잃지 않는 쪽
fn migrate(old: &Path, new: &Path) -> PathBuf {
    if new.exists() || !old.is_dir() {
        return new.to_path_buf();
    }
    if let Some(parent) = new.parent() {
        if std::fs::create_dir_all(parent).is_err() {
            return old.to_path_buf();
        }
    }
    if std::fs::rename(old, new).is_ok() {
        return new.to_path_buf();
    }
    match copy_tree(old, new) {
        Ok(()) => {
            let _ = std::fs::remove_dir_all(old);
            new.to_path_buf()
        }
        Err(_) => {
            let _ = std::fs::remove_dir_all(new);
            old.to_path_buf()
        }
    }
}

/// 앱은 맨 위 `*.json`만 읽지만, 사용자가 테마 폴더에 둔 다른 파일·하위 폴더도 같이 옮겨야 옛 폴더를 지울 수 있다.
/// 일반 파일·폴더가 아닌 항목(심볼릭 링크 등)이 있으면 실패로 돌려 옛 폴더를 그대로 쓴다
fn copy_tree(from: &Path, to: &Path) -> std::io::Result<()> {
    std::fs::create_dir_all(to)?;
    for entry in std::fs::read_dir(from)? {
        let entry = entry?;
        let kind = entry.file_type()?;
        let dest = to.join(entry.file_name());
        if kind.is_dir() {
            copy_tree(&entry.path(), &dest)?;
        } else if kind.is_file() {
            std::fs::copy(entry.path(), dest)?;
        } else {
            return Err(std::io::Error::other("일반 파일·폴더가 아닌 항목"));
        }
    }
    Ok(())
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
    let doc = frond_core::FileDocument::open(path).map_err(|e| format!("{}: {e}", path.display()))?;
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
    frond_core::write_atomic(&path, json.as_bytes()).map_err(|e| format!("{}: {e}", path.display()))?;
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
    frond_core::write_atomic(&path, json.as_bytes()).map_err(|e| format!("{}: {e}", path.display()))?;
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
    fn migrates_old_folder_once() {
        let base = tempfile::tempdir().unwrap();
        let old = base.path().join("appdata").join("Frond").join("themes");
        let new = base.path().join("docs").join("Frond").join("themes");
        save_in(&old, "sepia", "{}").unwrap();

        assert_eq!(migrate(&old, &new), new);
        assert_eq!(std::fs::read_to_string(new.join("sepia.json")).unwrap(), "{}");
        assert!(!old.exists());

        // 새 폴더가 생긴 뒤에는 옛 폴더가 다시 생겨도 건드리지 않는다
        save_in(&old, "old-only", "{}").unwrap();
        assert_eq!(migrate(&old, &new), new);
        assert!(old.join("old-only.json").exists());
        assert!(!new.join("old-only.json").exists());
    }

    #[test]
    fn copies_when_rename_is_not_possible() {
        let base = tempfile::tempdir().unwrap();
        let old = base.path().join("old");
        let new = base.path().join("new");
        save_in(&old, "a", "1").unwrap();
        save_in(&old, "b", "2").unwrap();
        // 사용자가 따로 둔 하위 폴더도 같이 옮긴다 — 옛 폴더를 통째로 지우기 때문
        save_in(&old.join("backup"), "c", "3").unwrap();
        copy_tree(&old, &new).unwrap();
        let mut names: Vec<_> = list_in(&new).into_iter().map(|t| t.stem).collect();
        names.sort();
        assert_eq!(names, ["a", "b"]);
        assert_eq!(std::fs::read_to_string(new.join("backup").join("c.json")).unwrap(), "3");
    }

    #[test]
    fn fresh_install_points_to_new_folder() {
        let base = tempfile::tempdir().unwrap();
        let new = base.path().join("docs").join("Frond").join("themes");
        assert_eq!(migrate(&base.path().join("none"), &new), new);
        assert!(!new.exists());
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
