# Store 출시·선택 구매 — 먼저 할 일 (2026-10-06 할 일)

작성: 2026-10-06 · 상태: **대기 — 에이전트 몫(A)은 사용자가 "실행"이라고 하면 아래 순서대로, 사용자 몫(U)은 사용자가 직접**
결정: [`decisions/ideas/20261006-store-monetization.md`](decisions/ideas/20261006-store-monetization.md)(Store MSIX + Durable add-on) ·
[`decisions/ideas/20261006-license.md`](decisions/ideas/20261006-license.md)(MIT 확정)
근거 조사: [Frond 윈도우 앱 배포 방법](research/reports/Frond%20윈도우%20앱%20배포%20방법.md) · [Frond 스토어 유료 해금 방식](research/reports/Frond%20스토어%20유료%20해금%20방식.md)

목표: Frond를 Microsoft Store에 **무료 앱(MSIX)**으로 올리고 **Durable add-on 하나**로 사용자 테마 만들기·구매자 전용 테마를 판다. 초기 비용 0원, 판매 때만 Store 수수료 15%.
이 문서는 Store에 내기 **전에** 끝내야 하는 것과 그 순서다. 로드맵 위치는 [`roadmap.md`](roadmap.md) "배포 트랙", 계획표는 [`plan.md`](plan.md) 단계 7.

## 오늘 할 일

| # | 할 일 | 담당 | 이게 막는 것 | 상태 |
|---|---|---|---|---|
| 0 | LICENSE(MIT)·`TRADEMARKS.md`·결정 기록 2건·로드맵/계획표 "하지 않는 것"에서 MSIX 빼기 | 에이전트 | — | ✅ 2026-10-06 |
| U-1 | **계정 유형 정하기** — 개인 계정 / 사업자등록 후 회사 계정 | 사용자 | R-3 Partner Center 가입 | 대기 |
| U-2 | **세무사 상담 잡기** — 아래 질문 4개 | 사용자 | 첫 유료 판매(add-on 공개) | 대기 |
| U-3 | 테마 폴더 위치 정하기 — 권장 `Documents\Frond\themes` | 사용자 | A-2 | 대기 (말이 없으면 권장안) |
| A-1 | 설치 방식 판정 함수 | 에이전트 | A-3, R-2 | "실행" 대기 |
| A-2 | 추천 테마 카탈로그 분리 (+ U-3 폴더 이전) | 에이전트 | A-3 | "실행" 대기 |
| A-3 | 권리 판정 뼈대 + 테마 게이트 + '정보' 탭 | 에이전트 | R-3 | "실행" 대기 |
| A-4 | 구매 권유 스케줄러 | 에이전트 | 공개 출시 | "실행" 대기 |
| A-5 | 개인정보처리방침·Store 설명문(한·영) 초안 | 에이전트 | R-3 제출 | "실행" 대기 |

A-1~A-4는 **Store 계정 없이** 만들고 테스트할 수 있다(개발용 공급자로 구매 상태를 흉내 낸다). 계정·세무(U-1·U-2)는 코드와 별개로 병행한다.

## 시작 전 확인 (에이전트)

1. `git status`·`git worktree list` — 2026-10-06 18시 기준 다른 세션이 `MdEditor-ai-hook`(`feat/ai-hook-settings`)에서 작업 중이다.
   이 작업은 **새 워크트리 `../MdEditor-store`(`feat/store`)**에서 하고 단계가 끝날 때 main에 합친다
2. [`frond-rename.md`](frond-rename.md)(크레이트 `mdeditor-core` → `frond-core`, localStorage `mdeditor.` → `frond.`)는 2026-10-06 완료했다.
   (원래 메모) **이름 정리를 먼저 하고** 이 작업을 시작한다 — 순서가 바뀌면 새 Rust 모듈·`Cargo.toml` feature·새 localStorage 키가 이름 정리와 충돌한다.
   이름 정리가 안 됐으면 사용자에게 어느 쪽을 먼저 할지 묻는다
3. 새 localStorage 키는 `prefs.ts`의 접두사를 따른다(하드코딩하지 않는다)

## 사용자 몫

### U-1 계정 유형 (첫 공개 제출 전에)

Store 정책 10.14는 "업으로 하는 사람"에게 회사 계정을 요구하고, **개인 계정은 회사 계정으로 바꿀 수 없다**. 반복 판매를 하면 한국 세법도 사업자등록(사업 개시 20일 안)을 요구한다.

| 선택 | 하는 일 | 비용 |
|---|---|---|
| 개인 계정 | `storedeveloper.microsoft.com`에서 개인 MSA로 가입, 신분증·셀피 확인 | 0원. 판매 시작 뒤 10.14 해석 위험이 남음 |
| 회사 계정 (권장 — 판매할 계획이면) | 사업자등록(업종 722000 응용 소프트웨어 개발 및 공급업) → 회사 계정(D-U-N-S 또는 사업 서류, **회사 도메인 업무 이메일**, 2~5영업일 검토) | 등록 0원. 도메인 이메일이 없으면 도메인 유지비 |

정하면 에이전트에게 알려 주면 된다. 가입·신원 확인·이름 예약은 사용자가 직접 한다(이름 예약은 3개월 안에 제출해야 풀리지 않으므로 R-2 MSIX가 된 뒤에).

### U-2 세무사 질문 (첫 유료 판매 전)

1. Microsoft Store가 한국 고객분 부가세를 직접 징수·납부한다. 사업자등록한 개발자가 그 매출을 다시 10%로 신고해야 하나, 국외 공급(영세율)으로 보나 — 출처 해석이 셋으로 갈린다
2. 사업 개시일을 언제로 보나(add-on 공개일 / 첫 판매일 / 첫 정산일), 간이과세가 되나(SW 업종)
3. 미국 판매분 원천징수 — W-8BEN 조약 세율(사용료 15% / 저작권 10%)과 외국납부세액공제
4. 직장인 겸업으로 종합소득세 사업소득 합산 신고, 통신판매업 신고 필요 여부(Store만 쓸 때)

### U-3 테마 폴더 위치

MSIX로 새로 설치하면 `%APPDATA%\Frond`가 패키지 전용 위치로 가상화돼 **탐색기에서 테마 폴더가 안 보이고 앱을 지우면 테마·초안이 함께 지워진다**.

- 권장: 사용자가 손대는 테마 폴더만 `Documents\Frond\themes`로 옮긴다(첫 실행 때 옛 폴더에서 이전). 초안은 `%APPDATA%`에 둔다
- 대안: `%APPDATA%` 유지 + 탐색기에 넘길 때 실제 경로로 바꿔 주기(최소 변경, 제거 시 삭제 문제는 남음)

## 에이전트 몫 (순서대로)

### A-1 설치 방식 판정 함수

- `src-tauri/src/install.rs`(새): `install_kind() -> Packaged | Scoop | Installed | Dev`. 패키지 여부는 `GetCurrentPackageFullName`이 `APPMODEL_ERROR_NO_PACKAGE`인지로, Scoop은 실행 경로의 `\scoop\apps\`로
- 이 함수 하나를 MSIX 분기(updater 끄기·`assoc.rs`·데이터 폴더)와 권리 판정이 같이 쓴다
- 프런트에 커맨드로 노출(정보 탭·디버그 표시용)
- 확인: `cargo test`에서 `Dev`/`Installed`, `windows` 크레이트 feature 이름은 빌드로 확정

### A-2 추천 테마 카탈로그 분리 (+ U-3)

지금은 추천 테마를 "추가"하면 가져오기와 같은 `save_user_theme`(`src-tauri/src/themes.rs`)로 사용자 테마 폴더에 복사되고, 테마 정의에 출처 필드가 없다 → "사용자 테마 = 유료"로 막으면 무료여야 할 추천 테마까지 잠긴다.

- 추천 테마(`src/theme/recommended.ts`)를 폴더 복사 없이 `listThemes()`(`src/theme/themes.ts`)에 직접 싣는다 — 순서 내장 → 추천 → 사용자
- 이미 폴더에 복사된 추천 테마(id·내용이 같은 것)는 목록에서 한 번만 보이게. 사용자가 고친 사본은 사용자 테마로 남긴다
- 추천 팝업의 "추가"는 "적용"만 남기거나 즐겨찾기 성격으로 바꾼다
- U-3이 권장안이면 같은 작업에서 테마 폴더를 옮긴다(이주는 한 번만)
- 바뀌는 테스트: `src/theme/themes.test.ts`(목록 순서), `src/theme/recommended.test.ts`(개수·가져오기 통과)

### A-3 권리 판정 뼈대 + 테마 게이트 + '정보' 탭

- Rust `src-tauri/src/license.rs`: `Entitlement { tier: Free | Supporter, source: Store | KeyFile | Dev | None }`, 공급자 추상화.
  지금은 **개발용 공급자만**(디버그 빌드 + 환경 변수로 Supporter 흉내). Store 공급자는 `[features] store`로 빈 자리만 — 실제 `StoreContext` 호출은 R-3
- 커맨드 `get_entitlement`·`refresh_entitlement`를 `lib.rs` `generate_handler!`에 등록
- 프런트 `src/license.ts`: 순수 함수 `canUseTheme`·`canImport`, 권리 변경 이벤트
- **테마 게이트는 `effectiveTheme()`(`src/main.ts`)에 건다** — `listThemes()`에서 빼면 `settings.ts` `load()`가 시작할 때 저장된 테마 선택을 기본값으로 지운다.
  `effectiveTheme()`은 이미 "못 찾은 테마는 같은 모드의 내장 테마로 보이되 설정값은 둔다" 구조라 재사용한다. 권리가 돌아오면 원래 테마가 다시 보인다
- 테마 패널(`src/theme-panel.ts`): 가져오기·복제는 버튼을 보이고 누르면 구매 안내. 대체 중인 사용자 테마에 "구매자 기능 — 지금은 내장 테마로 보입니다"
- 구매자 전용 테마 묶음: 색 토큰 JSON(기존 형식), 잠금 배지로 미리보기만. 저장소에 공개(결정 `20261006-license`)
- 설정 '정보' 탭: `SETTING_CATEGORIES`에 추가하고 패널은 `addPanel`로 — 버전, 상태(무료 / 구매자 — Store), 구매하기·구매 복원(지금은 비활성), 관리자 실행 안내. [`add-setting` 스킬](../.claude/skills/add-setting/SKILL.md)을 따른다
- 테스트: 새 `src/license.test.ts` — "비구매자 + 저장된 사용자 테마 → 내장 테마로 보이고 설정값 보존" 회귀 포함

### A-4 구매 권유 스케줄러

- `src/license.ts`의 순수 함수 `shouldNag(state, now, guards)` + 상수(첫 실행 뒤 7일·실행 5회 유예, 14일 간격, "나중에"마다 14 → 30 → 60일)
- 가드: IME 조합 중(`editor.view.composing`), 마지막 입력 뒤 10초 안, 저장·인쇄·내보내기 중, **`dialog[open]`이 있을 때**(`showChoice`가 열린 팝업을 닫아 저장 충돌 질문을 취소시킨다 — `src/dialog.ts`), 창 포커스 없음, 관리자 실행
- 시점: 시작 흐름 끝(`checkWebviewVersion()` 다음)에서 3~10분 뒤 유휴 때 시도. 저장 성공은 카운터만 올린다. 창 닫을 때는 띄우지 않는다
- 상태는 localStorage(잃어도 되는 값), 권유 끄기 설정은 두지 않는다
- 비구매자에게만, Store판(`Packaged`)에서만 켠다 — NSIS판은 해금을 모두 연다(결정)
- 테스트: 시간 경계·가드 조합

### A-5 개인정보처리방침·Store 설명문 초안

- `docs/privacy.md` — "로컬 파일만 읽고 쓰며 수집·전송하지 않음, 구매는 Microsoft Store가 처리". Win32 앱은 Store 정책 10.5.1상 항상 필요. 공개 URL은 GitHub Pages 또는 저장소 링크
  — 2026-10-06 바뀜(결정 [`20261006-website`](decisions/ideas/20261006-website.md) W9): 위치는 **`docs/site/privacy.md`**(GitBook 설명서·웹사이트 `/privacy/`·Store가 같이 쓴다).
  공개 URL은 도메인 전엔 GitBook 주소, 도메인 뒤엔 `https://<도메인>/privacy/`. 웹사이트 작업([`website-launch.md`](website-launch.md) A-4)이 먼저 만들 수 있다 — 먼저 하는 쪽이 만든다.
  스크린샷 목록은 웹사이트 §6 장면을 같이 쓴다
- `docs/store-listing.md` — 한·영 설명(첫머리에 "모든 편집 기능 무료, 선택적 1회 구매로 사용자 테마·전용 테마"), 기능 목록, 스크린샷 목록(전용 테마 화면은 "구매자 전용" 표시), IARC 설문 메모

## 그다음 (오늘 할 일 아님 — 순서만)

| 단계 | 할 일 | 조건 |
|---|---|---|
| R-2 MSIX 로컬 패키지 | `@choochmeque/tauri-windows-bundle` / winapp CLI 중 Win10 19045에서 되는 것 고르기, 매니페스트(파일 연결 + `MigrationProgId MdEditor.Markdown`, 실행 별칭 `mdeditor.exe`), `assoc.rs` 3곳 분기, 데이터 폴더 이름 이전 분기, WebView2 런타임 검사, AI 훅 스크립트가 별칭 경로를 먼저 찾게. 시험용 자체 서명으로 로컬 설치(설치·실행은 WMI로 컨테이너 밖) | A-1 |
| R-3 Store 제출·결제 실기 | 가입·이름 예약(U-1) → **Private audience**로 첫 제출(Public으로 내면 되돌릴 수 없음) → add-on "parent product only"로 숨겨 생성 → Store 공급자 구현(`StoreContext`, HWND 연결, 구매는 UI 스레드) → Store로 설치한 뒤 프로모션 코드로 해금 확인 | R-2, A-3, A-5, U-1 |
| R-4 공개 | 가격(사용자 결정, 조사 권장 ₩9,900~12,900) → add-on 공개 → 앱 Public | V1 닫기(B-2·B-9), U-2 |

Store 밖(GitHub Releases + updater → winget → 코드 서명)은 [`roadmap.md`](roadmap.md) 배포 트랙 뒤쪽이다.

## 완료 조건 (오늘 할 일 A-1~A-5)

- vitest·`cargo test`·타입 검사 통과, `samples/raw` 무편집 왕복 깨끗
- 개발용 공급자로 무료 ↔ 구매자를 바꾸면: 사용자 테마가 내장 테마로 대체됐다가 돌아오고 설정값이 안 바뀐다, 가져오기·복제가 잠겼다 풀린다, 추천 테마는 늘 쓸 수 있다
- 권유: 가드 조건에서 안 뜨고 간격을 지킨다(테스트), 실제 앱에서 저장 충돌 팝업과 겹치지 않는다
- 마무리: [`next-session.md`](next-session.md) §1·§3 갱신, 사용자 실기 목록을 §2에
