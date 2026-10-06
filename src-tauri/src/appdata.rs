//! 앱 데이터 폴더 — `%APPDATA%\Frond\` (초안 `drafts\`, 사용자 테마 `themes\`).
//!
//! 앱 이름이 MdEditor였던 2026-10-06 전에는 `%APPDATA%\MdEditor\`였다. 새 폴더가 없고 옛 폴더만 있으면 처음 부를 때
//! 통째로 옮긴다(같은 볼륨이라 이름 바꾸기 한 번). 옮기지 못하면(탐색기가 잡고 있는 등) 이번에는 옛 폴더를 쓰고
//! 다음에 다시 시도한다 — 초안·테마를 잃지 않는 쪽.

use std::path::{Path, PathBuf};

use tauri::{AppHandle, Manager};

const DIR: &str = "Frond";
const OLD_DIR: &str = "MdEditor";

pub fn root(app: &AppHandle) -> Result<PathBuf, String> {
    let base = app.path().data_dir().map_err(|e| e.to_string())?;
    Ok(resolve(&base))
}

fn resolve(base: &Path) -> PathBuf {
    let dir = base.join(DIR);
    let old = base.join(OLD_DIR);
    if !dir.exists() && old.is_dir() && std::fs::rename(&old, &dir).is_err() {
        return old;
    }
    dir
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn moves_old_folder_once() {
        let base = tempfile::tempdir().unwrap();
        std::fs::create_dir_all(base.path().join("MdEditor").join("themes")).unwrap();
        std::fs::write(base.path().join("MdEditor").join("themes").join("sepia.json"), "{}").unwrap();

        let dir = resolve(base.path());
        assert_eq!(dir, base.path().join("Frond"));
        assert_eq!(std::fs::read_to_string(dir.join("themes").join("sepia.json")).unwrap(), "{}");
        assert!(!base.path().join("MdEditor").exists());
        assert_eq!(resolve(base.path()), dir);
    }

    #[test]
    fn keeps_new_folder_when_both_exist() {
        let base = tempfile::tempdir().unwrap();
        std::fs::create_dir_all(base.path().join("MdEditor").join("drafts")).unwrap();
        std::fs::create_dir_all(base.path().join("Frond")).unwrap();

        assert_eq!(resolve(base.path()), base.path().join("Frond"));
        assert!(base.path().join("MdEditor").join("drafts").is_dir());
    }

    #[test]
    fn fresh_install_does_not_create_anything() {
        let base = tempfile::tempdir().unwrap();
        assert_eq!(resolve(base.path()), base.path().join("Frond"));
        assert!(!base.path().join("Frond").exists());
    }
}
