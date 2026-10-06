//! Windows 파일 연결 — 기본 앱 설정 창 열기, 현재 `.md` 기본 앱 조회, 등록 여부 확인 (roadmap 1-6).
//!
//! 레지스트리 등록·해제는 설치기(`src-tauri/nsis/hooks.nsh`)가 한다. 여기서는 읽기와 설정 앱 실행만 하고
//! 연결을 직접 쓰지 않는다 — Windows 8+는 `UserChoice`를 해시로 보호하므로 앱이 스스로 기본 앱이 될 수 없고,
//! 설정 앱을 열어 사용자가 고르게 하는 것이 유일한 정식 경로다.
//!
//! ProgId는 `MdEditor.Markdown`(`tauri.conf.json` `bundle.fileAssociations[].name`)이다. 앱 이름이 Frond로 바뀌어도
//! 그대로 둔다 — 사용자가 고른 기본 앱(`UserChoice`)이 이 문자열을 가리키므로 바꾸면 연결이 끊긴다.
//! [`query_default_app`]이 이 문자열을 돌려주면 Frond가 기본 앱이다.

use tauri::{AppHandle, Manager};
use windows::Win32::Foundation::HWND;
use winreg::enums::{HKEY_CURRENT_USER, HKEY_LOCAL_MACHINE};
use winreg::RegKey;

/// `HKCU\Software\RegisteredApplications` 값 이름 — `hooks.nsh`의 `${PRODUCTNAME}`과 같아야 한다.
const REGISTERED_APP: &str = "Frond";
/// 기본 앱을 조회할 확장자.
const QUERY_EXT: &str = ".md";
/// Windows 11 첫 빌드. 이 이상이면 설정 앱이 `registeredAppUser` 쿼리로 앱 페이지를 바로 연다.
const WIN11_MIN_BUILD: u32 = 22000;

/// 빌드 번호에 맞는 기본 앱 설정 URI. 빌드를 모르면 어느 버전에서나 열리는 Win10 형식으로 보수적으로 간다.
fn settings_uri(build: Option<u32>) -> String {
    match build {
        Some(b) if b >= WIN11_MIN_BUILD => {
            format!("ms-settings:defaultapps?registeredAppUser={REGISTERED_APP}")
        }
        _ => "ms-settings:defaultapps".to_owned(),
    }
}

/// `CurrentBuild` 레지스트리 문자열(`"19045"`, `"22631"`)을 숫자로.
fn parse_build(raw: &str) -> Option<u32> {
    raw.trim().trim_end_matches('\0').parse().ok()
}

/// `HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\CurrentBuild`.
fn current_build() -> Option<u32> {
    let key = RegKey::predef(HKEY_LOCAL_MACHINE)
        .open_subkey(r"SOFTWARE\Microsoft\Windows NT\CurrentVersion")
        .ok()?;
    let raw: String = key.get_value("CurrentBuild").ok()?;
    parse_build(&raw)
}

/// `ShellExecuteW(hwnd, "open", target)`. `ms-settings:` 같은 URI 스킴은 이 경로로만 열린다.
pub(crate) fn shell_open(hwnd: Option<HWND>, target: &str) -> Result<(), String> {
    use windows::core::{HSTRING, PCWSTR};
    use windows::Win32::UI::Shell::ShellExecuteW;
    use windows::Win32::UI::WindowsAndMessaging::SW_SHOWNORMAL;

    let verb = HSTRING::from("open");
    let file = HSTRING::from(target);
    // SAFETY: 널 종료 UTF-16 버퍼(HSTRING)가 호출 동안 살아 있고, 나머지 포인터 인수는 널을 허용한다.
    let code = unsafe {
        ShellExecuteW(
            hwnd,
            &verb,
            &file,
            PCWSTR::null(),
            PCWSTR::null(),
            SW_SHOWNORMAL,
        )
    }
    .0 as isize;
    // Win32 규약: 32보다 크면 성공, 이하이면 오류 코드(SE_ERR_*)
    if code > 32 {
        Ok(())
    } else {
        Err(format!("ShellExecuteW({target}) 실패: 코드 {code}"))
    }
}

/// Windows 설정 → 앱 → 기본 앱을 연다. Win11(빌드 22000+)은 Frond 페이지로 바로, Win10은 목록으로.
#[tauri::command]
pub fn open_default_apps_settings(app: AppHandle) -> Result<(), String> {
    // tauri 가 주는 HWND 는 다른 windows 크레이트 버전의 타입일 수 있으므로 포인터만 옮겨 담는다
    let hwnd = app
        .get_webview_window("main")
        .and_then(|w| w.hwnd().ok())
        .map(|h| HWND(h.0));
    shell_open(hwnd, &settings_uri(current_build()))
}

/// 현재 `.md`의 실효 기본 앱 ProgId (`"MdEditor.Markdown"`, `"Applications\notepad.exe"`, `"AppX…"`).
/// 연결이 없으면 `None`.
#[tauri::command]
pub fn query_default_app() -> Result<Option<String>, String> {
    query_current_default(QUERY_EXT)
}

/// `IApplicationAssociationRegistration::QueryCurrentDefault(ext, AT_FILEEXTENSION, AL_EFFECTIVE)`.
/// COM은 호출마다 초기화·해제한다.
fn query_current_default(ext: &str) -> Result<Option<String>, String> {
    use windows::core::{HRESULT, HSTRING};
    use windows::Win32::Foundation::{
        ERROR_FILE_NOT_FOUND, ERROR_NO_ASSOCIATION, RPC_E_CHANGED_MODE,
    };
    use windows::Win32::System::Com::{
        CoCreateInstance, CoInitializeEx, CoTaskMemFree, CoUninitialize, CLSCTX_INPROC_SERVER,
        COINIT_APARTMENTTHREADED, COINIT_DISABLE_OLE1DDE,
    };
    use windows::Win32::UI::Shell::{
        ApplicationAssociationRegistration, IApplicationAssociationRegistration, AL_EFFECTIVE,
        AT_FILEEXTENSION,
    };

    /// 초기화에 성공한 경우에만 `CoUninitialize`로 짝을 맞춘다.
    struct ComGuard(bool);
    impl Drop for ComGuard {
        fn drop(&mut self) {
            if self.0 {
                // SAFETY: 같은 스레드에서 성공한 CoInitializeEx와 1:1로 대응한다.
                unsafe { CoUninitialize() }
            }
        }
    }

    // "연결 없음"으로 취급할 코드: 문서상 ERROR_NO_ASSOCIATION, 실측으로는 ProgId 키가 없을 때 ERROR_FILE_NOT_FOUND
    let no_association = [
        HRESULT::from_win32(ERROR_NO_ASSOCIATION.0),
        HRESULT::from_win32(ERROR_FILE_NOT_FOUND.0),
    ];

    // SAFETY: COM 규약대로 STA 초기화 → 인스턴스 생성 → 호출 → CoTaskMemAlloc 문자열 해제 → 해제 순으로 진행한다.
    // 이미 다른 모드로 초기화된 스레드(RPC_E_CHANGED_MODE)는 그대로 쓰되 해제하지 않는다.
    unsafe {
        let hr = CoInitializeEx(None, COINIT_APARTMENTTHREADED | COINIT_DISABLE_OLE1DDE);
        if hr.is_err() && hr != RPC_E_CHANGED_MODE {
            return Err(format!("CoInitializeEx 실패: {hr}"));
        }
        let _guard = ComGuard(hr.is_ok());

        let registration: IApplicationAssociationRegistration = CoCreateInstance(
            &ApplicationAssociationRegistration,
            None,
            CLSCTX_INPROC_SERVER,
        )
        .map_err(|e| format!("ApplicationAssociationRegistration 생성 실패: {e}"))?;
        let query = HSTRING::from(ext);
        match registration.QueryCurrentDefault(&query, AT_FILEEXTENSION, AL_EFFECTIVE) {
            Ok(prog_id) => {
                let text = prog_id.to_string();
                CoTaskMemFree(Some(prog_id.as_ptr().cast()));
                text.map(Some)
                    .map_err(|e| format!("ProgId UTF-16 변환 실패: {e}"))
            }
            Err(e) if no_association.contains(&e.code()) => Ok(None),
            Err(e) => Err(format!("QueryCurrentDefault({ext}) 실패: {e}")),
        }
    }
}

/// 설치기가 `HKCU\Software\RegisteredApplications\Frond`를 썼는지 — 기본 앱 UI에 Frond가 뜨는 조건.
#[tauri::command]
pub fn is_registered() -> bool {
    RegKey::predef(HKEY_CURRENT_USER)
        .open_subkey(r"Software\RegisteredApplications")
        .and_then(|key| key.get_raw_value(REGISTERED_APP))
        .is_ok()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn win11_build_targets_app_page() {
        let expected = "ms-settings:defaultapps?registeredAppUser=Frond";
        assert_eq!(settings_uri(Some(22000)), expected);
        assert_eq!(settings_uri(Some(26100)), expected);
    }

    #[test]
    fn win10_or_unknown_build_targets_list() {
        assert_eq!(settings_uri(Some(19045)), "ms-settings:defaultapps");
        assert_eq!(settings_uri(Some(21999)), "ms-settings:defaultapps");
        assert_eq!(settings_uri(None), "ms-settings:defaultapps");
    }

    #[test]
    fn parses_current_build_strings() {
        assert_eq!(parse_build("19045"), Some(19045));
        assert_eq!(parse_build(" 22631\0"), Some(22631));
        assert_eq!(parse_build("10.0.19045"), None);
        assert_eq!(parse_build(""), None);
    }

    #[test]
    fn reads_a_plausible_build_from_registry() {
        // Windows 10 RTM(10240) 이상에서만 의미 있는 값
        let build = current_build().expect("CurrentBuild 읽기");
        assert!(build >= 10240, "CurrentBuild = {build}");
    }

    #[test]
    fn unknown_extension_has_no_default() {
        assert_eq!(query_current_default(".frond-assoc-test-none"), Ok(None));
    }

    #[test]
    fn known_extension_query_does_not_error() {
        // .txt 는 어느 Windows 에나 연결이 있다 — 값은 환경마다 다르므로 오류만 아니면 된다
        let got = query_current_default(".txt").expect(".txt 조회");
        assert!(got.as_deref().map_or(true, |s| !s.is_empty()), "{got:?}");
    }

    #[test]
    fn is_registered_reads_without_panicking() {
        let _ = is_registered();
    }
}
