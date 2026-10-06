//! 권리 판정 (store-launch A-3) — 무료 / 구매자. 결정 `docs/decisions/ideas/20261006-store-monetization.md`.
//!
//! - Store판(MSIX, `install::InstallKind::Packaged`)만 판다. 구매 확인은 Store 공급자(`StoreContext`)가 맡는다 — 지금은
//!   `[features] store` 자리만 있고 실제 호출은 R-3(Store 제출·결제 실기)에서 만든다. 그 전까지 Store판은 무료로 본다
//! - Store 밖 설치본(NSIS·Scoop·개발 빌드)은 해금을 모두 연다(`Source::Open`) — Files·Krita·Paint.NET 방식
//! - 개발용 공급자: 디버그 빌드에서 환경 변수 `FROND_ENTITLEMENT=free|supporter`로 상태를 흉내 낸다(게이트·권유 시험용)
//! - 라이선스 키 파일(`Source::KeyFile`)은 Store 밖 판매 수요가 보이면 붙인다 — 지금은 이름만
//!
//! 판정은 문서 기능을 막지 않는다. 막는 것은 사용자 테마 만들기(가져오기·복제)와 구매자 전용 테마 적용뿐이다(프런트 `license.ts`).

use std::sync::Mutex;

use serde::Serialize;
use tauri::{AppHandle, Emitter, State};

use crate::install::{install_kind, InstallKind};

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum Tier {
    Free,
    Supporter,
}

/// 권리를 어디서 확인했는지 — 정보 탭에 그대로 보인다. `Store`·`KeyFile`은 그 공급자를 만들 때(R-3·키 파일) 쓰기 시작한다
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
#[allow(dead_code)]
pub enum Source {
    /// Microsoft Store add-on 라이선스
    Store,
    /// 라이선스 키 파일 (아직 없음)
    KeyFile,
    /// 개발용 공급자 (디버그 빌드 + `FROND_ENTITLEMENT`)
    Dev,
    /// Store 밖 설치본 — 모두 열림
    Open,
    /// 확인한 권리 없음 (Store판 비구매자)
    None,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize)]
pub struct Entitlement {
    pub tier: Tier,
    pub source: Source,
}

const FREE: Entitlement = Entitlement { tier: Tier::Free, source: Source::None };
const OPEN: Entitlement = Entitlement { tier: Tier::Supporter, source: Source::Open };

/// 개발용 공급자 — 디버그 빌드에서만 `FROND_ENTITLEMENT` 값을 본다
fn dev_override(debug: bool, value: Option<&str>) -> Option<Entitlement> {
    if !debug {
        return None;
    }
    match value?.trim().to_ascii_lowercase().as_str() {
        "free" => Some(Entitlement { tier: Tier::Free, source: Source::Dev }),
        "supporter" => Some(Entitlement { tier: Tier::Supporter, source: Source::Dev }),
        _ => None,
    }
}

/// Store 공급자 — R-3에서 `StoreContext::GetAppLicenseAsync`의 add-on 라이선스(`frond_supporter`)를 본다.
/// 지금은 자리만: 아무것도 확인하지 못한다
#[cfg(feature = "store")]
fn store_license() -> Option<Entitlement> {
    None
}

#[cfg(not(feature = "store"))]
fn store_license() -> Option<Entitlement> {
    None
}

/// 판정 규칙 — 개발용 흉내가 먼저, 그다음 설치 방식. Store판은 Store가 확인해 준 것만 구매자다
pub fn decide(kind: InstallKind, dev: Option<Entitlement>, store: Option<Entitlement>) -> Entitlement {
    if let Some(dev) = dev {
        return dev;
    }
    match kind {
        InstallKind::Packaged => store.unwrap_or(FREE),
        InstallKind::Scoop | InstallKind::Installed | InstallKind::Dev => OPEN,
    }
}

fn compute() -> Entitlement {
    let env = std::env::var("FROND_ENTITLEMENT").ok();
    let dev = dev_override(cfg!(debug_assertions), env.as_deref());
    let kind = install_kind();
    let store = if dev.is_none() && kind == InstallKind::Packaged { store_license() } else { None };
    decide(kind, dev, store)
}

/// 마지막 판정 — 처음 물을 때 계산한다
pub struct LicenseState(pub Mutex<Option<Entitlement>>);

#[tauri::command]
pub fn get_entitlement(state: State<'_, LicenseState>) -> Entitlement {
    *state.0.lock().expect("license lock").get_or_insert_with(compute)
}

/// 다시 확인한다(구매 뒤·구매 복원). 바뀌었으면 `entitlement-changed`를 보낸다
#[tauri::command]
pub fn refresh_entitlement(app: AppHandle, state: State<'_, LicenseState>) -> Entitlement {
    let next = compute();
    let previous = state.0.lock().expect("license lock").replace(next);
    if previous != Some(next) {
        let _ = app.emit("entitlement-changed", next);
    }
    next
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn outside_the_store_everything_is_open() {
        for kind in [InstallKind::Installed, InstallKind::Scoop, InstallKind::Dev] {
            assert_eq!(decide(kind, None, None), OPEN);
        }
    }

    #[test]
    fn store_build_is_free_until_the_store_says_otherwise() {
        assert_eq!(decide(InstallKind::Packaged, None, None), FREE);
        let bought = Entitlement { tier: Tier::Supporter, source: Source::Store };
        assert_eq!(decide(InstallKind::Packaged, None, Some(bought)), bought);
    }

    #[test]
    fn dev_override_only_in_debug_builds() {
        let free = Entitlement { tier: Tier::Free, source: Source::Dev };
        assert_eq!(dev_override(true, Some(" Free ")), Some(free));
        assert_eq!(dev_override(true, Some("supporter")).map(|e| e.tier), Some(Tier::Supporter));
        assert_eq!(dev_override(true, Some("maybe")), None);
        assert_eq!(dev_override(true, None), None);
        assert_eq!(dev_override(false, Some("free")), None);
        // 흉내가 설치 방식보다 먼저다 — 설치본에서도 무료 화면을 시험할 수 있다
        assert_eq!(decide(InstallKind::Installed, Some(free), None), free);
    }

    #[test]
    fn serializes_like_the_frontend_expects() {
        let json = serde_json::to_string(&Entitlement { tier: Tier::Supporter, source: Source::KeyFile }).unwrap();
        assert_eq!(json, r#"{"tier":"supporter","source":"keyFile"}"#);
        assert_eq!(serde_json::to_string(&OPEN).unwrap(), r#"{"tier":"supporter","source":"open"}"#);
    }
}
