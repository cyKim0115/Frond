# Idea Evaluation — 앱 안 업데이트 (있음 표시 → 받기 → 재시작해 적용)

- Date: 2026-11-27
- Idea id: `20261127-app-update`
- Status: `decided` — 서명 키 방식(비밀번호 유무)만 사용자 답 대기([사용자 결정](#사용자-결정)), 그 전까지 U-1~U-4 진행
- Verdict:
  - `ADOPT_WITH_CHANGES`: 설치기판(NSIS)에 Tauri updater — 조용한 확인·자동 받기·제목 표시줄 알약·사용자가 누를 때 재시작, 재시작 전 문서 보존, 설정 '업데이트' 탭, 로컬 빌드 + 서명 + `latest.json` 스크립트, 발행 없는 E2E
  - `DEFER`: Store판 `StoreContext` 「새 버전 있음」 표시(R-2 뒤), 종량제 연결 판정, 확인만 하고 받기는 누를 때(`notify` 선택지), GitHub Actions `tauri-action` 릴리스, Scoop 새 버전 알림
  - `REJECT`: Store·Scoop·개발 빌드의 updater, 시작 때 막는 강제 업데이트, 자동 모달·카운트다운 재시작, 끌 때 자동 설치, `api.github.com` 호출·앱 버전을 URL에 넣는 동적 엔드포인트, 프런트 `fetch`로 GitHub 직접 호출, `tauri-plugin-process`, 시험용 런타임 스위치
- Related: 조사 [`Frond 앱 안 업데이트`](../../research/reports/Frond%20앱%20안%20업데이트.md) · 배포 조사 [`Frond 윈도우 앱 배포 방법`](../../research/reports/Frond%20윈도우%20앱%20배포%20방법.md) · [`20261006-store-monetization`](20261006-store-monetization.md)(Store판은 Store가 갱신) · [`roadmap.md`](../../roadmap.md) R-2·R-5 · `src-tauri/src/install.rs`

## Proposal (user)

- 「다른 프로그램들을 보면 업데이트가 있으면 업데이트 표시를 띄우고 업데이트를 받은뒤 재시작하게하고 하잖아? 그런 구조와 ux에 대해서 리서치를 하고 우리도 도입할 계획을 세운다음 공유하고 적용하고 업데이트해줘.」(2026-11-27)
- 같은 날 범위: 구현 뒤 origin/main push와 이 PC 설치본 재설치까지. **GitHub 릴리스는 발행하지 않고** 업데이트 흐름은 로컬 시험 서버로 확인한다.

## Context

- Goal of this pass: NSIS 설치본이 새 버전을 스스로 알고 받아서, 사용자가 고른 때 재시작 한 번으로 적용. 편집 중인 글·탭을 잃지 않는다.
- Constraints:
  - 지금 버전 0.1.0, GitHub 릴리스 0개, `.github/` 없음, updater 의존성·설정 없음.
  - 설치 방식 판정 `install_kind()`가 이미 있다(Packaged·Scoop·Installed·Dev).
  - Windows에서 Tauri updater `install()`은 NSIS를 띄운 뒤 **앱을 바로 `exit(0)`으로 끈다**(Tauri 문서 「install 단계에서 앱이 자동 종료」, plugins-workspace 소스). 저장 안 한 탭 확인은 `main.ts` `onCloseRequested` 한 곳뿐이라 이 경로를 타지 않는다.
  - Store판에는 updater를 넣지 않는다(R-2). Scoop판에서 돌리면 두 번째 설치본이 생긴다.
  - 색은 테마 토큰만, 설정은 `add-setting` 스킬 규칙, identifier·`mainBinaryName`은 바꾸지 않는다(세션·설정·ProgId 연속).

## Scores

| Axis | Result (Pass / Partial / Fail) | Evidence |
|------|--------------------------------|----------|
| Feasibility | Pass | `check`·`download`·`install`을 따로 부를 수 있어 「받아 두고 나중에 재시작」이 된다. NSIS `passive` + `currentUser`는 UAC 없이 설치 뒤 앱을 다시 띄운다(`/R`) |
| Direction fit | Pass | R-5 「GitHub Releases + Tauri updater(NSIS판)」 그대로. 설치 방식 판정 함수가 이 분기를 위해 만들어져 있다 |
| Efficiency | Partial | 앱 코드는 단위 3개(중 규모). 서명 키 관리·릴리스 스크립트·격리 E2E가 따로 든다. 0.1.0 설치본에는 updater가 없어 0.2.0은 직접 설치해야 한다 |

## Alternatives considered

| Alternative | Pros | Cons | Better when |
|-------------|------|------|-------------|
| **조용한 확인 + 자동 받기 + 제목 표시줄 알약 + 누를 때 재시작** (채택, VS Code·Chrome·Zed형) | 작업을 끊지 않음, 받은 뒤 알려 재시작 한 번으로 끝 | 알약을 놓칠 수 있음 → 7일 넘게 미루면 강조, 설정 탭에도 상태 | 편집기·뷰어 |
| 모달로 묻고 받기 (Joplin·MarkText형) | 확실히 보임 | 작업·한글 조합을 끊는다(Joplin 「intrusive」 불만) | 거의 안 켜는 도구 |
| 시작 때 강제 (Discord형) | 모두 최신 | 열기가 느려지고 오프라인에서 막힘 | 서버와 버전을 맞춰야 하는 앱 |
| 끌 때 자동 설치 (electron-updater 기본·Zed) | 클릭 없음 | 끌 때 NSIS 창이 뜨고 앱이 다시 켜져 놀람 | 설치기 창이 안 보이는 플랫폼 |
| 알림 위치: 오른쪽 아래 카드(구매 권유 배너 방식) | 이미 있는 UI | 문서를 가린다. 닫으면 다시 찾을 곳이 따로 필요 | 한 번 보고 끝나는 알림 |
| 알림 위치: 상태 표시줄 버튼 | 조용함 | 눈에 덜 띔 | 상태 중심 앱 |
| 세션 보존: localStorage 즉시 저장만 | 코드 적음 | `exit(0)`으로 호스트가 갑자기 죽을 때 WebView2가 방금 쓴 값을 내렸는지 보장 없음〔추론〕 | 정상 종료 경로 |

## Decision

- Verdict: 머리의 Verdict와 같다.
- What we will do now:
  1. **게이트는 Rust 한 곳**: `update::support(kind, has_pubkey)` → `enabled | store | scoop | dev | nokey`. `enabled`(Installed + 공개 키 있음)일 때만 `setup`에서 updater 플러그인을 등록한다. 프런트는 `get_update_support`로 화면만 나눈다.
  2. 설정: `plugins.updater` = 엔드포인트 `https://github.com/cyKim0115/Frond/releases/latest/download/latest.json` 하나, `windows.installMode: "passive"`, 공개 키. 권한은 `updater:default`만. `bundle.createUpdaterArtifacts`는 기본 설정에 넣지 않고 릴리스 덧설정 `src-tauri/tauri.release.conf.json`에만(키 없으면 `npm run app:build`가 깨지므로).
  3. 동작 기본값: 시작 10초 뒤 + 6시간마다 확인(자동 확인은 1시간에 한 번까지, 지난 결과가 「있음」이면 예외), 새 버전은 자동으로 받고 받은 뒤에만 알림, 설치는 누를 때만, 자동 확인 실패는 조용히·수동 확인 때만 문구, 강제 업데이트 없음.
  4. UX: 제목 표시줄 `#open-settings`와 창 버튼 사이에 `업데이트` 알약(받은 뒤에만, 포커스 안 가져감, 좁은 창에서는 아이콘). 색은 `--accent`(기본)·`--accent`/`--on-accent` 채움(같은 버전을 7일 넘게 미룸)·`--muted`(나중에)만. 누르면 확인 팝업 `재시작해 업데이트`·`이 버전 건너뛰기`·`나중에`. 「나중에」 = 이번 실행 동안 흐리게, 「건너뛰기」 = 그 버전만(더 새 버전·수동 확인은 다시 보임). 재시작 뒤 알약 자리에 `업데이트됨`을 20초, 누르면 노트. 문구는 앱 말투(`~합니다`).
  5. 설정: 새 탭 **`update`(업데이트)**를 `file`과 `about` 사이에 — 항목 `updateCheck`(`auto` 자동으로 확인하고 받기·`off` 끔, **기본 `auto`**, 저장값이 없거나 이상해도 `auto`) + 상태·`지금 확인`·건너뛴 버전·바뀐 점 링크 패널. '정보' 탭은 구매·버전 커스텀 패널 전용이라 섞지 않는다. 설치 방식별로 항목을 숨기려고 스키마에 `available?: () => boolean`을 더한다.
  6. **재시작 순서**(Windows `exit(0)` 전에 모두 await): 한글 조합 확정 → 저장 중이면 기다림 → 저장 안 한 문서가 있으면 `모두 저장하고 업데이트`·`초안으로 두고 업데이트`·`취소`(**버리기 선택지 없음**, 저장 하나라도 실패하면 업데이트 멈춤) → 세션 즉시 저장 → Rust가 **재시작 인계 파일**(identifier 데이터 폴더의 `update-handoff.json`: 세션·이전/새 버전·노트)을 쓴다 → `install()`. 실패하면 인계 파일을 지우고 앱은 그대로.
  7. 새 앱 시작: 인계 파일이 있으면(24시간 안) 설치기가 다시 넘긴 **옛 argv 경로를 무시**하고, 설정 `restoreSession`과 무관하게 세션을 **한 번** 복원한다. 초안은 기존 복구 제안 흐름. `lastRunVersion`으로 설치기 직접 설치 뒤에도 `업데이트됨`.
  8. 서명 키: 비밀 키 `%USERPROFILE%\.tauri\frond-updater.key`(저장소 밖), 공개 키 **내용만** `tauri.conf.json`에 커밋. 빌드 환경 변수 `TAURI_SIGNING_PRIVATE_KEY`(경로)·`TAURI_SIGNING_PRIVATE_KEY_PASSWORD`. 백업 두 곳(이 PC + 오프라인), GitHub secret은 다시 읽을 수 없어 백업이 아니다. 키를 잃으면 기존 설치본은 앱 안 업데이트를 영영 못 받는다.
  9. 릴리스: 버전은 `package.json`(+lock)·`tauri.conf.json`·`src-tauri/Cargo.toml`(+`Cargo.lock`)을 `scripts/release/bump-version.mjs`로 함께(`frond-core`는 앱 버전과 따로). `CHANGELOG.md`의 `## <버전> — 날짜` 절이 `latest.json` `notes`와 GitHub 릴리스 본문. `scripts/release/release-build.ps1`이 확인 → 서명 빌드 → `make-latest-json.mjs` → 올릴 `gh release create --draft` 명령만 출력. 발행은 사용자 지시로 따로(draft → 시험 → Latest, 문제면 이전 릴리스를 Latest로).
  10. 시험: vitest(판정 순수 함수·설정 기본값·**기본 설정 가드** — 엔드포인트가 https GitHub 하나뿐, `dangerousInsecureTransportProtocol` 없음, `createUpdaterArtifacts` 없음, identifier·`mainBinaryName` 그대로, 버전 일치), `cargo test`(지원 판정·인계 파일). **발행 없는 E2E**: 일회용 시험 키로 서명한 격리 빌드(identifier `com.cykim.mdeditor.updatetest`, 설치 폴더·exe 이름 다름, 파일 연결·NSIS 훅 없음) 두 벌을 `127.0.0.1` 서버로 내고 CDP로 받기·건너뛰기·초안·저장·충돌·서명 위조·오프라인·설정 끔·옛 argv·Scoop 흉내를 본다. 시험 덧설정은 임시 파일로만 만들어 커밋하지 않는다.
  11. 개인정보: 요청은 GitHub 정적 파일뿐, 앱 버전·문서 정보는 안 실린다(URL 변수 안 씀). 개발자는 받은 횟수만 볼 수 있다. `docs/site/privacy.md`의 자리표시 줄을 실제 문구로 바꾼다. CSP `connect-src`는 그대로(HTTP는 Rust가 한다).
  12. 이번 버전 **0.2.0**(첫 공개 버전이 된다, 0.1.0은 발행된 적 없음). 0.1.0 설치본에는 updater가 없어 0.2.0은 설치기로 직접 설치한다.
- What we will not do: 위 `REJECT`. 그리고 이번에는 GitHub 릴리스를 만들지 않는다.
- Modified approach (조사 추천안과 다른 점):
  - `tauri-plugin-process` 안 씀 — Windows에서는 설치기가 다시 띄운다.
  - 세션을 localStorage에만 맡기지 않고 Rust 인계 파일을 더한다(`exit(0)` 때 WebView2 기록 보장 없음〔추론〕, E2E에서 잰다).
  - 시간 강조는 3·7일 두 단계 대신 7일 한 단계.
  - 재시작 뒤 「바뀐 점」은 CHANGELOG 탭 대신 인계 파일의 노트 팝업 + GitHub 릴리스 링크(설치본에 CHANGELOG가 없고 탭은 파일 경로가 필요).
  - 설정은 '정보' 탭 대신 새 '업데이트' 탭.
  - 업데이트 흐름에서 「저장 안 함(버리기)」을 뺀다 — 닫기 확인의 버리기는 초안까지 지운다.
  - 시험용 디버그 스위치 없이 「설치된 격리 빌드」로 E2E — 릴리스 바이너리에 시험 경로가 남지 않는다.

## 구현 계획

| 단위 | 내용 | 완료 기준 |
|---|---|---|
| U-1 | 의존성·Rust 게이트(`update.rs`)·인계 파일 커맨드·updater 설정·권한, `src/update.ts` 순수 함수·스케줄러, 기본 설정 가드 시험 | `cargo test`·`npm test`·`tsc` 통과, 키 없이 `npm run app:build` 성공, 개발 빌드에서 요청 0 |
| U-2 | 제목 표시줄 알약, 설정 '업데이트' 탭(항목·패널), 스키마 `available`, 브라우저 미리보기 `?update=` 상태 흉내, `add-setting` 표·README 설정 표 | 상태마다 라이트·다크·좁은 창 확인, 포커스 안 가져감 |
| U-3 | `restartToUpdate()` 보존 순서, 시작 때 인계 처리(옛 argv 무시·강제 복원·업데이트됨), 설치 실패 복구 | 단위 시험 통과, 실제 흐름은 U-4 |
| U-4 | `scripts/update-e2e/`(시험 키·격리 덧설정·서버·CDP), `scripts/release/make-latest-json.mjs` | 필수 시나리오 통과, 실제 설치본·파일 연결 무변경, 정리 끝 |
| U-5 | 공개 키, 릴리스 덧설정, `release-build.ps1`·`bump-version.mjs`, 0.2.0, 문서(개인정보·설명서·CHANGELOG·README·CLAUDE.md·roadmap·next-session) | 가드 시험(공개 키 필수)·`-DryRun` 통과, `Frond_0.2.0_x64-setup.exe` |

- U-1~U-4는 실제 서명 키 없이 한다. **U-5는 공개 키 파일이 있어야 시작한다** — 없으면 묻고 멈춘다. 「키 없이 진행」을 고르면 공개 키를 비운 0.2.0이 `nokey`로 업데이트를 끈 채 나가고, 그 설치본은 키가 든 판을 한 번 더 직접 설치해야 한다.
- 커밋은 단위마다 하나(U-5는 코드·문서 둘).

## 사용자 결정

1. **서명 키 방식**: A 비밀번호 없음(사용자 허락 뒤 에이전트가 만들고 릴리스 빌드까지 돌릴 수 있음, 파일만 새도 서명 가능) / B 비밀번호 있음(사용자가 자기 터미널에서 만들고 릴리스 빌드도 직접, 파일만으로는 서명 불가 — 다른 기기·클라우드 백업에 안전). U-5 전에 필요.
2. 키 백업 둘째 자리(비밀번호 관리자·USB 등) — 사용자가 직접 둔다. 첫 실제 릴리스 전.
3. 첫 GitHub 릴리스 시점 — 이번엔 안 함.
4. 기본값·문구는 위 결정대로 진행(2026-10-06 「이후 단계는 사용자 확인을 기다리지 않고 진행」). 바꾸고 싶으면 알려 주면 된다.

## Follow-up

- Spec / implementation owner: 에이전트(2026-11-27 다음 세션, U-1~U-5). 사용자 실기는 `docs/next-session.md` §2 P(구현 때 추가)
- Revisit when: 첫 GitHub 릴리스를 낼 때(서명 산출물·draft 시험·Latest 전환), 릴리스가 잦아지면 `tauri-action`으로, R-2 MSIX 때 `StoreContext` 알림, Win11에서 업데이트 설치기 SmartScreen·Smart App Control 실측
- Logged in INDEX: yes

## 근거

- Tauri v2 Updater(설정 키 `dangerousInsecureTransportProtocol`·`installMode`, 환경 변수, 「Windows에서는 install 때 앱이 자동 종료」) — https://v2.tauri.app/plugin/updater/
- plugins-workspace updater 소스(`install_inner`의 `ShellExecuteW` 뒤 `std::process::exit(0)`, `/P /UPDATE /ARGS`, 재실행 기본값) — https://github.com/tauri-apps/plugins-workspace/blob/v2/plugins/updater/src/updater.rs
- 앱별 UX 비교·패턴 표·위험 목록은 조사 보고서 [`Frond 앱 안 업데이트`](../../research/reports/Frond%20앱%20안%20업데이트.md)
