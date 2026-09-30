//! 관리자 권한(권한 상승) 실행 감지 — 스펙 경계 사례 "관리자 권한으로 실행된 인스턴스" (brief S3, single-instance #3643).
//!
//! 이 창이 권한 상승 상태면 탐색기(보통 권한)에서 더블클릭한 두 번째 인스턴스의 `WM_COPYDATA`를 UIPI가 막는다.
//! 두 번째 프로세스는 single-instance 플러그인 규칙대로 조용히 끝나고 파일은 열리지 않는다.
//! 막을 방법은 없으므로 프런트가 상태바에 경고를 띄운다(`is_elevated`).

use windows::Win32::Foundation::{CloseHandle, HANDLE};
use windows::Win32::Security::{GetTokenInformation, TokenElevation, TOKEN_ELEVATION, TOKEN_QUERY};
use windows::Win32::System::Threading::{GetCurrentProcess, OpenProcessToken};

/// 현재 프로세스 토큰이 권한 상승 상태인지. 조회에 실패하면 `false`(경고를 띄우지 않는다)
#[tauri::command]
pub fn is_elevated() -> bool {
    token_elevated().unwrap_or(false)
}

fn token_elevated() -> windows::core::Result<bool> {
    let mut token = HANDLE::default();
    // SAFETY: GetCurrentProcess는 의사 핸들이라 닫지 않는다. 연 토큰은 아래에서 닫는다
    unsafe { OpenProcessToken(GetCurrentProcess(), TOKEN_QUERY, &mut token)? };
    let mut elevation = TOKEN_ELEVATION::default();
    let mut returned = 0u32;
    // SAFETY: 버퍼는 TOKEN_ELEVATION 크기 그대로 넘긴다
    let result = unsafe {
        GetTokenInformation(
            token,
            TokenElevation,
            Some(std::ptr::from_mut(&mut elevation).cast()),
            size_of::<TOKEN_ELEVATION>() as u32,
            &mut returned,
        )
    };
    // SAFETY: OpenProcessToken이 돌려준 핸들
    let _ = unsafe { CloseHandle(token) };
    result?;
    Ok(elevation.TokenIsElevated != 0)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn token_query_succeeds() {
        // 테스트 실행 권한(보통·관리자)과 관계없이 조회 자체는 성공해야 한다
        assert!(token_elevated().is_ok());
    }
}
