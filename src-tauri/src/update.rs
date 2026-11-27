//! 앱 안 업데이트 (결정 `20261127-app-update`) — 지원 판정과 재시작 인계 파일.
//!
//! - 게이트는 여기 한 곳이다. 설치기판(`InstallKind::Installed`)이고 `tauri.conf.json` `plugins.updater.pubkey`가 있을
//!   때만 `lib.rs`가 updater 플러그인을 등록한다. Store(MSIX)·Scoop·개발 빌드·공개 키 없는 빌드는 플러그인이 없어서
//!   프런트가 잘못 불러도 실패한다. 시험용 런타임 스위치는 두지 않는다 — E2E는 설치된 격리 빌드로 이 판정을 그대로 탄다
//! - 확인·받기·설치는 플러그인 JS API(`@tauri-apps/plugin-updater`)가 하고, HTTP는 Rust가 한다(CSP 무관)
//! - 인계 파일: Windows `install()`은 NSIS를 띄우고 바로 `exit(0)`한다. 그 직전 세션을 localStorage에만 두면 WebView2가
//!   디스크에 내렸는지 보장이 없어, 프런트가 install 전에 세션·노트를 여기 파일로 남기고 새 앱이 시작할 때 읽고 지운다

use std::path::{Path, PathBuf};

use serde::Serialize;
use tauri::{AppHandle, Manager};

use crate::install::InstallKind;

/// 프런트 `UpdateSupport`와 같은 값
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum Support {
    /// 설치기판 + 공개 키 — updater를 쓴다
    Enabled,
    /// Microsoft Store판 — Store가 업데이트한다
    Store,
    /// Scoop — `scoop update frond`
    Scoop,
    /// 개발 빌드 — 개발 exe를 설치본으로 덮지 않게 끈다
    Dev,
    /// 설치기판인데 공개 키가 빈 빌드(포크 등)
    Nokey,
}

pub fn support(kind: InstallKind, has_pubkey: bool) -> Support {
    match kind {
        InstallKind::Packaged => Support::Store,
        InstallKind::Scoop => Support::Scoop,
        InstallKind::Dev => Support::Dev,
        InstallKind::Installed if has_pubkey => Support::Enabled,
        InstallKind::Installed => Support::Nokey,
    }
}

/// `plugins.updater.pubkey`가 빈 문자열이 아닌지
pub fn has_pubkey(config: &tauri::Config) -> bool {
    config
        .plugins
        .0
        .get("updater")
        .and_then(|u| u.get("pubkey"))
        .and_then(|k| k.as_str())
        .is_some_and(|k| !k.trim().is_empty())
}

pub fn current_support(app: &AppHandle) -> Support {
    support(crate::install::install_kind(), has_pubkey(app.config()))
}

/// 정보·업데이트 탭과 스케줄러 분기용
#[tauri::command]
pub fn get_update_support(app: AppHandle) -> Support {
    current_support(&app)
}

// ---- 재시작 인계 파일 -------------------------------------------------------------------

const HANDOFF: &str = "update-handoff.json";
/// 탭 경로·노트뿐이라 이보다 크면 잘못 쓴 것이다
const HANDOFF_MAX: usize = 1024 * 1024;

/// identifier 폴더(`%LOCALAPPDATA%\com.cykim.mdeditor`) — 시험 빌드(다른 identifier)와 섞이지 않는다
fn handoff_dir(app: &AppHandle) -> Result<PathBuf, String> {
    app.path().app_local_data_dir().map_err(|e| e.to_string())
}

/// 임시 파일에 쓰고 rename — 돌아오면 파일이 남아 있다
fn write_handoff(dir: &Path, json: &str) -> Result<(), String> {
    if json.len() > HANDOFF_MAX {
        return Err(format!("인계 내용이 너무 큽니다 ({} 바이트)", json.len()));
    }
    std::fs::create_dir_all(dir).map_err(|e| e.to_string())?;
    let file = dir.join(HANDOFF);
    let tmp = dir.join(format!("{HANDOFF}.tmp"));
    let written = (|| -> std::io::Result<()> {
        use std::io::Write;
        let mut f = std::fs::File::create(&tmp)?;
        f.write_all(json.as_bytes())?;
        f.sync_all()?;
        std::fs::rename(&tmp, &file)
    })();
    if let Err(e) = written {
        let _ = std::fs::remove_file(&tmp);
        return Err(e.to_string());
    }
    Ok(())
}

/// 읽고 지운다. 없으면 `None`, 너무 크거나 UTF-8이 아니면 지우고 `None`
fn take_handoff(dir: &Path) -> Result<Option<String>, String> {
    let file = dir.join(HANDOFF);
    let bytes = match std::fs::read(&file) {
        Ok(bytes) => bytes,
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => return Ok(None),
        Err(e) => return Err(e.to_string()),
    };
    std::fs::remove_file(&file).map_err(|e| e.to_string())?;
    if bytes.len() > HANDOFF_MAX {
        return Ok(None);
    }
    Ok(String::from_utf8(bytes).ok())
}

#[tauri::command]
pub fn update_handoff_write(app: AppHandle, json: String) -> Result<(), String> {
    write_handoff(&handoff_dir(&app)?, &json)
}

#[tauri::command]
pub fn update_handoff_take(app: AppHandle) -> Result<Option<String>, String> {
    take_handoff(&handoff_dir(&app)?)
}

// ---- 지난 업데이트 임시 폴더 정리 ---------------------------------------------------------
//
// updater 2.14는 받은 설치기를 `%TEMP%\<productName>-<새 버전>-updater-XXXX\`에 두고(`make_temp_dir`의 `keep()`)
// 설치 뒤에도 지우지 않는다(약 7 MB). 새 앱이 시작하고 몇 초 뒤, 자기 productName의 **지금 버전보다 낮은** 폴더만 지운다.
// 지금 버전 폴더는 방금 끝난 설치기가 아직 붙잡고 있을 수 있어 다음 업데이트 때 지운다. 더 높은 버전(설치를 취소한 받기)·
// 다른 앱·이름이 안 맞는 폴더·링크는 건드리지 않는다.

/// 시작 뒤 기다리는 시간 — 설치기가 끝나고 인계 파일을 읽은 다음
const CLEANUP_DELAY: std::time::Duration = std::time::Duration::from_secs(10);

/// `<app>-<버전>-updater-XXXX`에서 버전을 꺼낸다. 이름이 안 맞으면 `None`
fn updater_dir_version(dir_name: &str, app_name: &str) -> Option<semver::Version> {
    let rest = dir_name.strip_prefix(app_name)?.strip_prefix('-')?;
    let (version, suffix) = rest.rsplit_once("-updater-")?;
    if suffix.is_empty() || !suffix.chars().all(|c| c.is_ascii_alphanumeric()) {
        return None;
    }
    semver::Version::parse(version).ok()
}

/// `temp` 바로 아래에서 지울 폴더 — 실제 폴더(링크 아님)이고 버전이 `current`보다 낮은 것
fn stale_updater_dirs(temp: &Path, app_name: &str, current: &semver::Version) -> Vec<PathBuf> {
    let Ok(entries) = std::fs::read_dir(temp) else { return Vec::new() };
    let mut out: Vec<PathBuf> = entries
        .flatten()
        .filter(|e| e.file_type().is_ok_and(|t| t.is_dir() && !t.is_symlink()))
        .filter(|e| {
            e.file_name()
                .to_str()
                .and_then(|n| updater_dir_version(n, app_name))
                .is_some_and(|v| &v < current)
        })
        .map(|e| e.path())
        .collect();
    out.sort();
    out
}

/// 지운 개수. 하나가 실패해도(잠김 등) 나머지는 지운다
fn remove_stale_updater_dirs(temp: &Path, app_name: &str, current: &semver::Version) -> usize {
    stale_updater_dirs(temp, app_name, current)
        .into_iter()
        .filter(|dir| std::fs::remove_dir_all(dir).is_ok())
        .count()
}

/// 설치기판(updater 등록)일 때만 `lib.rs`가 부른다
pub fn spawn_temp_cleanup(app: &AppHandle) {
    let info = app.package_info();
    let app_name = info.name.clone();
    let Ok(current) = semver::Version::parse(&info.version.to_string()) else { return };
    std::thread::spawn(move || {
        std::thread::sleep(CLEANUP_DELAY);
        remove_stale_updater_dirs(&std::env::temp_dir(), &app_name, &current);
    });
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn only_installed_with_key_is_enabled() {
        assert_eq!(support(InstallKind::Installed, true), Support::Enabled);
        assert_eq!(support(InstallKind::Installed, false), Support::Nokey);
        for key in [true, false] {
            assert_eq!(support(InstallKind::Packaged, key), Support::Store);
            assert_eq!(support(InstallKind::Scoop, key), Support::Scoop);
            assert_eq!(support(InstallKind::Dev, key), Support::Dev);
        }
    }

    #[test]
    fn pubkey_must_be_non_empty() {
        let mut config = tauri::Config::default();
        assert!(!has_pubkey(&config));
        config.plugins.0.insert("updater".into(), serde_json::json!({ "pubkey": "  " }));
        assert!(!has_pubkey(&config));
        config.plugins.0.insert("updater".into(), serde_json::json!({ "pubkey": "dW50cnVzdGVk" }));
        assert!(has_pubkey(&config));
    }

    #[test]
    fn committed_config_has_updater_section() {
        // 커밋된 설정은 플러그인 설정을 갖고 있어야 한다 — 값의 형식은 release-config.test.ts가 본다
        let conf: serde_json::Value = serde_json::from_str(include_str!("../tauri.conf.json")).unwrap();
        assert!(conf["plugins"]["updater"]["pubkey"].is_string());
    }

    #[test]
    fn handoff_round_trip_and_take_removes() {
        let dir = tempfile::tempdir().unwrap();
        let sub = dir.path().join("com.example");
        assert_eq!(take_handoff(&sub).unwrap(), None);
        write_handoff(&sub, r#"{"v":1,"탭":"한글"}"#).unwrap();
        write_handoff(&sub, r#"{"v":1,"to":"0.2.1"}"#).unwrap();
        assert!(!sub.join("update-handoff.json.tmp").exists());
        assert_eq!(take_handoff(&sub).unwrap().as_deref(), Some(r#"{"v":1,"to":"0.2.1"}"#));
        assert_eq!(take_handoff(&sub).unwrap(), None);
    }

    #[test]
    fn handoff_size_limit() {
        let dir = tempfile::tempdir().unwrap();
        let big = "x".repeat(HANDOFF_MAX + 1);
        assert!(write_handoff(dir.path(), &big).is_err());
        assert!(!dir.path().join(HANDOFF).exists());
        // 밖에서 큰 파일이 생겼으면 읽지 않고 지운다
        std::fs::write(dir.path().join(HANDOFF), big.as_bytes()).unwrap();
        assert_eq!(take_handoff(dir.path()).unwrap(), None);
        assert!(!dir.path().join(HANDOFF).exists());
    }

    #[test]
    fn updater_dir_name_parsing() {
        let v = |s: &str| semver::Version::parse(s).unwrap();
        assert_eq!(updater_dir_version("Frond-0.2.0-updater-AbC123", "Frond"), Some(v("0.2.0")));
        assert_eq!(updater_dir_version("Frond-0.3.0-beta.1-updater-x1", "Frond"), Some(v("0.3.0-beta.1")));
        // 이름에 하이픈이 든 앱
        assert_eq!(updater_dir_version("Frond-E2E-0.9.1-updater-q", "Frond-E2E"), Some(v("0.9.1")));
        assert_eq!(updater_dir_version("Frond-E2E-0.9.1-updater-q", "Frond"), None);
        assert_eq!(updater_dir_version("Frondx-0.2.0-updater-a", "Frond"), None);
        assert_eq!(updater_dir_version("Frond-0.2.0-updater-", "Frond"), None);
        assert_eq!(updater_dir_version("Frond-0.2.0-updater-a.b", "Frond"), None);
        assert_eq!(updater_dir_version("Frond-latest-updater-a", "Frond"), None);
        assert_eq!(updater_dir_version("Frond-0.2.0", "Frond"), None);
    }

    #[test]
    fn removes_only_older_own_dirs() {
        let temp = tempfile::tempdir().unwrap();
        let t = temp.path();
        let make = |name: &str| {
            let d = t.join(name);
            std::fs::create_dir(&d).unwrap();
            std::fs::write(d.join("Frond-x-installer.exe"), b"MZ").unwrap();
            d
        };
        let old1 = make("Frond-0.1.0-updater-a1");
        let old2 = make("Frond-0.2.0-beta.1-updater-b2");
        let current = make("Frond-0.2.0-updater-c3");
        let newer = make("Frond-0.2.1-updater-d4");
        let other = make("Other-0.1.0-updater-e5");
        let e2e = make("Frond-E2E-0.1.0-updater-f6");
        let odd = make("Frond-0.1.0-installer");
        std::fs::write(t.join("Frond-0.0.1-updater-file"), b"not a dir").unwrap();

        let cur = semver::Version::parse("0.2.0").unwrap();
        assert_eq!(stale_updater_dirs(t, "Frond", &cur), vec![old1.clone(), old2.clone()]);
        assert_eq!(remove_stale_updater_dirs(t, "Frond", &cur), 2);
        assert!(!old1.exists() && !old2.exists());
        for kept in [&current, &newer, &other, &e2e, &odd] {
            assert!(kept.exists(), "{kept:?}");
        }
        assert!(t.join("Frond-0.0.1-updater-file").exists());
        // 없는 temp는 조용히 0
        assert_eq!(remove_stale_updater_dirs(&t.join("none"), "Frond", &cur), 0);
    }
}
