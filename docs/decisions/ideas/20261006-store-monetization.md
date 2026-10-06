# Idea Evaluation — Microsoft Store(MSIX) 배포 + 선택 구매로 테마 해금

- Date: 2026-10-06
- Idea id: `20261006-store-monetization`
- Status: `decided`
- Verdict: `ADOPT_WITH_CHANGES`
- Related: [`20261006-license.md`](20261006-license.md) · [`store-launch.md`](../../store-launch.md)(먼저 할 일) · [`roadmap.md`](../../roadmap.md) 배포 트랙 · 조사 [Frond 윈도우 앱 배포 방법](../../research/reports/Frond%20윈도우%20앱%20배포%20방법.md) · [Frond 스토어 유료 해금 방식](../../research/reports/Frond%20스토어%20유료%20해금%20방식.md)

## Proposal (user)

- 2026-10-06 "스토어에 올리고 fork처럼 사람들의 선택으로 구매할 수 있도록" — 무료로 다 쓰되, 비구매자에게는 가끔 구매 권유 팝업, 구매자에게는 커스텀 테마 기능 해금과 구매자 전용 테마
- 같은 날 "계획문서도 수정해줘" — 로드맵·계획표의 "하지 않는 것: MSI/MSIX 패키징"을 고친다

## Context

- 지금 배포물은 서명 없는 NSIS 설치기 하나(currentUser). 로드맵 "하지 않는 것"에 MSI/MSIX가 있었다
- 한국 거주 개인은 Azure Artifact Signing을 쓸 수 없고 국내 OV는 사업자등록증이 필요하다. Store에 EXE로 내려면 Trusted Root CA 서명이 필수이고 Store가 업데이트도 주지 않는다 → **Store는 MSIX로**(Microsoft 재서명 0원, Store 자동 업데이트)
- Store 커머스(add-on)는 패키지 identity가 있는 MSIX에서만 동작
- 초기 비용 0원: Store 개인·회사 계정 등록 무료(2025-09·2026-05), MSIX 재서명, add-on 등록·인증, W-8BEN·지급 프로필. 판매 때만 Net Receipts의 15%(비게임), 한국 고객 부가세는 Microsoft가 징수

## Scores

| Axis | Result | Evidence |
|------|--------|----------|
| Feasibility | Partial | Tauri는 MSIX를 직접 만들지 않는다(tauri#4818) → `@choochmeque/tauri-windows-bundle` 또는 winapp CLI(Public Preview, Win11 전제). `windows` 크레이트로 `StoreContext` 호출 가능. add-on은 시뮬레이터가 없어 실제 게시(Private audience) 뒤에만 시험 |
| Direction fit | Partial | MSIX에서 NSIS 훅이 돌지 않고 AppData가 가상화되며 AI 훅 스크립트가 exe를 못 찾는다 → `assoc.rs` 3곳·`appdata.rs`·`themes.rs`·훅 스크립트 분기 필요. 정책 10.14(업으로 하는 사람은 회사 계정, 개인→회사 전환 불가) |
| Efficiency | Pass | 서버·서명비 없이 라이선스 확인(`GetAppLicenseAsync`, 오프라인 캐시). 정책 10.8.1/10.8.2 해석 충돌을 add-on은 둘 다 만족 |

## Alternatives considered

| Alternative | Pros | Cons | Better when |
|-------------|------|------|-------------|
| **Store MSIX + Durable add-on (채택)** | 0원 시작, 서명·VAT·업데이트를 Store가 처리, 정책 해석 안전 | 15% 수수료, MSIX 분기 작업, 실제 게시 전 시험 불가 | Store가 주 배포처일 때 |
| Store EXE(지금 NSIS) | 패키징 변경 없음 | 서명 인증서 연 €49~$300+, offline WebView2 +127MB, Store 업데이트 없음, Store 결제 불가 | Trusted Root 인증서가 이미 있을 때 |
| 자체 라이선스 키(MoR: Polar·Creem·Gumroad) | 수수료 4~10%, 모든 채널 | 키 UI·검증·구매 페이지, 10.8.2 해석 위험, Stripe Managed Payments 한국 미지원 | Store 밖 판매 수요가 확인된 뒤 |
| 유료 앱 + Unlimited trial | Store 기본 구조 | Store에 "유료 앱"으로 표시, 체험 고지 부담 | 무료 사용을 원하지 않을 때 |

## Decision

- Verdict: `ADOPT_WITH_CHANGES`
- What we will do now:
  - 배포: Microsoft Store는 **MSIX**(무료 앱). Store 밖은 지금 NSIS 유지(GitHub Releases·winget은 배포 트랙 뒤쪽)
  - 결제: Store **Durable add-on 하나**(Product ID 영구 이름, 예 `frond_supporter`, 수명 Forever). NSIS판은 해금을 모두 열어 둔다(Files·Krita·Paint.NET 방식) — MoR 키는 Store 밖 수요가 보이면
  - 무료로 남길 것: 보기·편집·저장 등 모든 문서 기능, 내장 라이트·다크(세이지 차콜), 추천 테마
  - 해금: 테마 가져오기·복제(사용자 테마 만들기), 구매자 전용 테마 묶음(저장소에 공개, `20261006-license`)
  - 구매 권유: 첫 실행 뒤 7일·실행 5회 유예, 14일 간격(나중에 → 14·30·60일), 비모달 배너 먼저. IME 조합 중·입력 직후·저장/인쇄/내보내기 중·다른 팝업이 열려 있을 때·창 닫을 때·관리자 실행 중에는 띄우지 않음. 권유 끄기 설정은 두지 않고 주기는 코드 상수
  - 구현: Rust 권리 판정 모듈(Store·키 파일·개발용 공급자 추상화) + `effectiveTheme()` 게이트(목록에서 빼지 않음 — `settings.ts` `load()`가 저장값을 지운다) + 추천 테마 카탈로그 분리 + 설치 방식 판정 함수(MSIX 분기·updater와 공유)
- What we will not do: Store EXE 제출, 문서 열기·저장 제한, 닫기 카운트다운·Windows 토스트 권유, 다크 테마 잠금, 사이드로드 MSIX 배포(Store와 PFN이 갈림)
- Modified approach: 계정 유형(개인/회사)과 사업자등록 시점은 **첫 공개 제출 전에** 사용자가 정한다(10.14, 계정 전환 불가). 가격은 add-on 만들 때 사용자가 정한다(조사 권장 ₩9,900~12,900). 한국 고객분 부가세 처리는 첫 판매 전 세무사 확인

## Follow-up

- 먼저 할 일·순서: [`docs/store-launch.md`](../../store-launch.md) (2026-10-06 할 일)
- 사용자 결정 대기: 계정 유형·사업자등록 시점(세무사 상담), 가격, 테마 폴더 위치(`%APPDATA%` 유지 + 실제 경로 / `Documents\Frond`)
- 공개 출시 조건: V1 닫기(B-2·B-9) + MSIX 실기 + Store Private audience 실기
- Revisit when: Store 밖 다운로드가 Store보다 많아질 때(MoR 키 추가), 정책 10.8.x 문구가 바뀔 때, Tauri가 MSIX를 직접 지원할 때
- Logged in INDEX: yes
