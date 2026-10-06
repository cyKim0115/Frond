//! 설치 방식 판정 (store-launch A-1) — MSIX(Store) / Scoop / 설치기(NSIS) / 개발 빌드.
//!
//! 이 함수 하나를 MSIX 분기(updater 끄기·파일 연결 `assoc.rs`·데이터 폴더)와 권리 판정(`license.rs`)이 같이 쓴다.
//! 패키지 여부는 `GetCurrentPackageFullName`이 `APPMODEL_ERROR_NO_PACKAGE`를 돌려주는지로, Scoop은 실행 경로의
//! `\scoop\apps\`로 본다. 개발 빌드는 디버그 빌드이거나 cargo 출력 폴더(`target\…`)에서 돈 exe다.

use std::path::Path;

use serde::Serialize;
use windows::core::PWSTR;
use windows::Win32::Foundation::{APPMODEL_ERROR_NO_PACKAGE, ERROR_INSUFFICIENT_BUFFER, ERROR_SUCCESS};
use windows::Win32::Storage::Packaging::Appx::GetCurrentPackageFullName;

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum InstallKind {
    /// MSIX 패키지(Store) — 패키지 identity가 있다
    Packaged,
    /// Scoop 버킷으로 설치
    Scoop,
    /// NSIS 설치기로 설치 (`%LOCALAPPDATA%\Frond` 등)
    Installed,
    /// 디버그 빌드, 또는 cargo 출력 폴더에서 바로 띄운 exe
    Dev,
}

#[derive(Clone, Debug, Serialize)]
pub struct InstallInfo {
    pub kind: InstallKind,
    /// MSIX일 때만 — 패키지 전체 이름(이름_버전_아키텍처__게시자ID)
    pub package: Option<String>,
}

/// 판정 규칙 — 패키지 identity가 가장 먼저, 그다음 Scoop 경로, 개발 빌드, 나머지는 설치기
pub fn classify(package: Option<&str>, exe: Option<&Path>, debug: bool) -> InstallKind {
    if package.is_some() {
        return InstallKind::Packaged;
    }
    let exe = exe.map(|p| p.to_string_lossy().replace('/', "\\").to_lowercase()).unwrap_or_default();
    if exe.contains("\\scoop\\apps\\") {
        return InstallKind::Scoop;
    }
    if debug || exe.contains("\\target\\") {
        return InstallKind::Dev;
    }
    InstallKind::Installed
}

/// 지금 프로세스의 패키지 전체 이름. 패키지가 아니면(`APPMODEL_ERROR_NO_PACKAGE`) 또는 조회에 실패하면 None
fn package_full_name() -> Option<String> {
    let mut len = 0u32;
    // SAFETY: 길이만 묻는 첫 호출 — 버퍼 없이 필요한 길이(끝 NUL 포함)를 받는다
    let first = unsafe { GetCurrentPackageFullName(&mut len, None) };
    if first == APPMODEL_ERROR_NO_PACKAGE || first != ERROR_INSUFFICIENT_BUFFER || len == 0 {
        return None;
    }
    let mut buf = vec![0u16; len as usize];
    // SAFETY: 위에서 받은 길이만큼의 버퍼를 넘긴다
    let second = unsafe { GetCurrentPackageFullName(&mut len, Some(PWSTR(buf.as_mut_ptr()))) };
    if second != ERROR_SUCCESS {
        return None;
    }
    let end = buf.iter().position(|&c| c == 0).unwrap_or(buf.len());
    Some(String::from_utf16_lossy(&buf[..end]))
}

/// 한 번만 판정한다 — 프로세스가 사는 동안 바뀌지 않는다
pub fn install_info() -> &'static InstallInfo {
    static INFO: std::sync::OnceLock<InstallInfo> = std::sync::OnceLock::new();
    INFO.get_or_init(|| {
        let package = package_full_name();
        let exe = std::env::current_exe().ok();
        InstallInfo { kind: classify(package.as_deref(), exe.as_deref(), cfg!(debug_assertions)), package }
    })
}

pub fn install_kind() -> InstallKind {
    install_info().kind
}

/// 정보 탭·디버그 표시용
#[tauri::command]
pub fn get_install_info() -> InstallInfo {
    install_info().clone()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn package_identity_wins() {
        let exe = Path::new(r"C:\Program Files\WindowsApps\Frond_0.1.0.0_x64__abc\mdeditor.exe");
        assert_eq!(classify(Some("Frond_0.1.0.0_x64__abc"), Some(exe), true), InstallKind::Packaged);
    }

    #[test]
    fn scoop_path_is_scoop() {
        let exe = Path::new(r"C:\Users\a\scoop\apps\frond\current\mdeditor.exe");
        assert_eq!(classify(None, Some(exe), false), InstallKind::Scoop);
        let exe = Path::new("D:/Scoop/Apps/frond/0.1.0/mdeditor.exe");
        assert_eq!(classify(None, Some(exe), false), InstallKind::Scoop);
    }

    #[test]
    fn dev_and_installed() {
        let installed = Path::new(r"C:\Users\a\AppData\Local\Frond\mdeditor.exe");
        assert_eq!(classify(None, Some(installed), false), InstallKind::Installed);
        assert_eq!(classify(None, Some(installed), true), InstallKind::Dev);
        let built = Path::new(r"C:\repo\frond\target\release\mdeditor.exe");
        assert_eq!(classify(None, Some(built), false), InstallKind::Dev);
        assert_eq!(classify(None, None, false), InstallKind::Installed);
    }

    #[test]
    fn this_test_process_is_not_packaged() {
        // cargo test는 패키지 밖에서 돈다 — 조회가 패키지 없음으로 끝나야 한다
        assert_eq!(package_full_name(), None);
        assert_eq!(install_kind(), InstallKind::Dev);
    }
}
