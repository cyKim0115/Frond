# GitBook 사용 설명서 — 꾸밀 계획 (2026-10-06 할 일)

작성: 2026-10-06 · 상태: **대기 — 에이전트 몫(A)은 사용자가 "실행"이라고 하면 아래 순서대로, 사용자 몫(U)은 사용자가 직접**
싱크 설정: **사이트 Git Sync** — 루트 [`gitbook-docs.yaml`](../gitbook-docs.yaml)(`a6274be`)이 스페이스 **사용 설명서**(path `guide`, ko, 기본) → [`site/`](site/README.md)를 가리킨다.
2026-10-06 첫 가져오기 success, 스페이스 편집 잠금 확인. 예전 스페이스용 [`.gitbook.yaml`](../.gitbook.yaml)(`c722719`)도 남아 있다. 개발 문서(`docs/` 나머지)는 싱크되지 않는다.
사이트는 아직 **게시 전**(published false) — `cykim.gitbook.io/frond`는 게시해야 열린다
보고: `docs/site/`를 고쳐 푸시한 작업은 웹훅 보고에 **GitBook 링크**를 붙인다 — 게시 뒤엔 공개 주소(해당 페이지까지), 게시 전엔 GitBook 앱의 Frond 사이트 링크(사용자 지시 2026-10-06)
참고 조사(다른 세션, 진행 중): [`research/research_notes/Frond 웹사이트 구축 방법/`](research/research_notes/Frond%20웹사이트%20구축%20방법/docs_platforms.md) —
문서 플랫폼은 Starlight가 권장안, **GitBook Free + Git Sync가 차선안**이다. 이 계획은 사용자가 GitBook을 고른 것(2026-10-06)을 따르되, 나중에 옮기기 쉽게 쓴다

목표: [`README.md`](../README.md)에 몰려 있는 사용법을 **한국어 사용 설명서**로 옮겨 `cykim.gitbook.io/frond`(가칭)에 공개한다.
원본은 저장소 `docs/site/`이고 GitBook에서는 고치지 않는다 — 다른 스페이스(MyUtil·system-crew 등)처럼 **편집 잠금**, 방향은 늘 GitHub → GitBook.

## 무료 플랜에서 꾸밀 수 있는 것

조직 cyKim은 무료(체험 끝, 기존 사이트도 basic으로 적용 중)다. 그래서 꾸미기는 **색·구조·글·그림**으로 한다.

| 됨 | 안 됨 (유료) |
|---|---|
| 주 색, 모서리, 라이트/다크 전환, 언어(ko), 전문 검색, 방문 통계, llms.txt·MCP, 페이지 아이콘·설명 | 커스텀 도메인(Essential 사이트당 연 $780), 로고·글꼴·CSS, AI 어시스턴트, PDF 내보내기. "Powered by GitBook"은 어느 플랜에서도 못 지운다 |

## 오늘 할 일

| # | 할 일 | 담당 | 이게 막는 것 | 상태 |
|---|---|---|---|---|
| 0 | `.gitbook.yaml`·`docs/site/` 뼈대 커밋·푸시 | 에이전트 | U-1 | ✅ 2026-10-06 |
| A-1 | 빈 사이트 **Frond** 만들기 (API, 공개, 스페이스 없이) | 에이전트 | U-1 | ✅ 2026-10-06 (사이트 있음, 공개 설정·게시 전) |
| U-1 | 사이트에 스페이스 추가 → **Git Sync**: `cyKim0115/MdEditor` · `main` · 방향 **GitHub → GitBook** → 편집 잠금 | 사용자 | A-6 확인 | ✅ 2026-10-06 사이트 Git Sync(`gitbook-docs.yaml`)로 연결 |
| U-2 | 블록 방침 정하기 (아래 결정) | 사용자 | A-4 | 대기 (말이 없으면 권장안) |
| A-2 | 꾸밈 설정 (아래 값) | 에이전트 | — | "실행" 대기 |
| A-3 | 목차·페이지 뼈대 — `SUMMARY.md` + 빈 페이지, 페이지마다 frontmatter `icon`·`description` | 에이전트 | A-4 | "실행" 대기 |
| A-4 | 페이지 쓰기 — README 사용법을 옮기고 설명서 말투로 다듬기 | 에이전트 | A-6 | "실행" 대기 |
| A-5 | 스크린샷 다시 찍기 → `docs/site/images/` | 에이전트 | A-6 | "실행" 대기 |
| A-6 | 확인·마무리 (완료 조건) | 에이전트 | — | "실행" 대기 |

## 시작 전 확인 (에이전트)

1. `git status`·`git worktree list` — main 폴더는 다른 세션과 같이 쓴다. A-3~A-5는 **임시 워크트리 `../MdEditor-gitbook`(`docs/gitbook`)**에서 하고,
   다 쓴 뒤 main에 합쳐 **한 번에 푸시**한다. GitBook은 `main`을 싱크하므로 반쯤 쓴 페이지를 main에 푸시하면 그대로 공개된다
2. 설정 페이지는 **AI 연동 탭**(`feat/ai-hook-settings`, [next-session](next-session.md) §3-10)이 main에 들어온 뒤의 모습으로 쓴다. 아직이면 그 탭 절만 비워 두고 나머지를 먼저 쓴다
3. [`frond-rename.md`](frond-rename.md) 1번(저장소 이름 `MdEditor` → `Frond`)을 하면 Git Sync가 새 이름을 따라가는지 GitBook에서 확인한다

## 결정 (U-2) — GitBook 전용 블록을 얼마나 쓸지

`{% hint %}`·`{% tabs %}`·`{% stepper %}`·카드 표는 GitBook에서는 예쁘지만, 원본을 **GitHub·Frond로 열면 글자 그대로** 보이고 나중에 다른 플랫폼으로 옮길 때 다시 써야 한다.

- **권장안 — 이식 우선**: 본문은 일반 Markdown(표·목록·그림·코드). 알림은 GitHub Alerts(`> [!NOTE]`)를 A-3에서 시험해 GitBook이 알림 상자로 그리면 그걸 쓰고,
  안 그리면 `{% hint %}`를 페이지당 1~2개까지. 카드 표는 첫 페이지에만
- 다른 안 — GitBook 우선: 단계(`stepper`)·탭·카드를 필요한 곳마다. GitBook 화면은 가장 좋지만 Frond로 읽는 원본은 덜 읽힌다

## 꾸밈 값 (A-2)

- 제목 **Frond**, 언어 **ko**, 주소 `cykim.gitbook.io/frond`
- 주 색 = Frond 내장 세이지 차콜 강조색: 라이트 **`#5f8a6f`**, 다크 **`#96bea1`** ([`src/theme/palette.ts`](../src/theme/palette.ts) `sageCharcoalLight`·`sageCharcoalDark`의 `accent` 계산값)
- 라이트/다크 전환 켜기(기본은 시스템), 모서리 rounded
- 헤더 링크: GitHub 저장소 (다운로드 링크는 배포 뒤)
- 사이트 아이콘·파비콘: [`src-tauri/icons/icon.svg`](../src-tauri/icons/icon.svg)를 PNG로. 무료에서 API가 거절하면 뺀다
- 현재 설정을 먼저 읽고 바꿀 값만 고쳐 통째로 다시 쓴다(부분 값 추측 금지)

## 목차 (A-3 안)

| 묶음 | 페이지 | 원본 |
|---|---|---|
| — | **Frond** (첫 페이지) — 무엇인가, 주요 기능, 설치로 가는 링크 | README 머리·주요 기능 |
| 시작하기 | 설치 · `.md` 기본 앱으로 지정 · 화면 둘러보기 | README 설치·화면 구성 |
| 읽기 | 파일 열기와 탭 · 탐색 영역(최근 파일·폴더·새 문서) · 목차와 찾기 · 지원하는 Markdown(Mermaid·Alerts·수식·원문 HTML 범위) | README 사용법 |
| 쓰기 | 편집과 저장 · 인코딩과 줄바꿈 · 다른 프로그램이 파일을 바꿀 때(배너·비교·초안 복구) · 이미지 넣기 | README 편집과 저장·인코딩·줄바꿈·그 밖에 |
| 꾸미기 | 테마 · 테마 파일 만들기 · 설정 | README 테마·테마 파일·설정, [`docs/themes/sepia.json`](themes/sepia.json) |
| 더 하기 | 내보내기와 인쇄 · AI 앱 연동 | README 내보내기·인쇄, [`integrations/README.md`](../integrations/README.md) |
| 참고 | 단축키 · 알아 둘 점·문제 해결 · 라이선스(MIT, 이름·아이콘 별도) | README 단축키·알아 둘 점, [`TRADEMARKS.md`](../TRADEMARKS.md) |

개발(빌드·구조)은 설명서에 넣지 않는다 — GitHub README에 남긴다.

## 쓰기 규칙 (A-4·A-5)

- README와 같은 `~합니다` 말투, 한국어. 화면 글자(메뉴·버튼 이름)는 앱과 똑같이 **굵게**
- 링크는 상대 `.md` 경로. `docs/site/` 밖 파일(`integrations/`·`docs/themes/` 등)은 루트 밖이라 싱크되지 않으니 GitHub 주소로 건다
- 그림은 `docs/site/images/`에 두고 상대 경로로. 지금 [`docs/screenshots/`](screenshots/)는 2026-09-30 GitHub 색이라 **기본 테마 세이지 차콜로 다시 찍는다**
  (설치본을 CDP로 띄워 캡처, 라이트 기본·다크는 테마 페이지에만). 창 크기는 한 가지로 맞춘다
- 바이트 픽스처 `samples/raw/`는 예시로 열지 않는다

## 완료 조건 (A-6)

- `cykim.gitbook.io/frond`에서 목차의 모든 페이지가 열리고 그림이 보인다. 깨진 링크 0 (로컬에서 `docs/site/` 상대 링크 검사 + GitBook 화면)
- Git Sync 상태 success(API로 확인), GitBook 편집 잠금
- 라이트·다크 둘 다에서 주 색이 읽힌다. 한국어 낱말 몇 개로 검색이 되는지 본다
- 원본 `docs/site/`를 Frond로 열어 U-2 방침대로 읽힌다
- 사용자 확인 뒤: 저장소 README 사용법 절을 줄이고 설명서 링크로 바꾼다(두 벌 관리 막기). CLAUDE.md 상시 규칙에
  "사용자에게 보이는 기능·설정을 바꾸면 `docs/site/` 해당 페이지도 고친다" 한 줄
- [`next-session.md`](next-session.md) §1·§3 갱신

## 그다음 (오늘 할 일 아님)

- 개인정보처리방침 페이지 — [`store-launch.md`](store-launch.md) A-5와 합쳐 Store 제출용 공개 URL로 쓴다
- 릴리스 노트 — GitHub Releases 배포가 시작되면
- 영어 variant — 한국어판이 자리 잡은 뒤
- 랜딩·다운로드 사이트와 도메인 — 웹사이트 조사 보고서가 나오면 정한다. GitBook 무료는 `gitbook.io` 주소·배지가 고정이라 랜딩은 따로 둔다
