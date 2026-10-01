# Idea Evaluation — 사용자 테마 파일 형식 (로드맵 S-4)

- Date: 2026-09-30
- Idea id: `20260930-theme-file-format`
- Status: `decided` — 에이전트 권장안으로 구현, **2026-10-01 사용자 확정**
- Verdict: `ADOPT`
- Related: `docs/roadmap.md` 셸 트랙 S-4, `src/theme/themes.ts`(`parseThemeFile`·`themeToJson`), `src-tauri/src/themes.rs`, 예제 `docs/themes/sepia.json`

## Proposal (user)

- 설정 "테마" 탭에서 사용자 테마를 가져오고 관리한다 (2026-09-30 셸 트랙 요청). 파일 형식은 S-4 착수 전에 정하기로 했다 (next-session §4).
- 2026-09-30 20:00 사용자 지시: "확인하기 이전에 남은 순서들을 진행" — 자리를 비운 동안 권장안으로 진행.

## Context

- Goal of this pass: 가져오기·목록·내보내기·복제·삭제가 동작할 파일 형식을 정한다.
- Constraints: S-3 전환 연출이 색 토큰을 `@property <color>`로 보간한다 → 테마는 색 값의 집합이어야 한다. 파일 I/O는 백엔드 커맨드만(fs 플러그인 금지). 테마 파일은 남이 만든 것일 수 있다(안전).

## Scores

| Axis | Result | Evidence |
|------|--------|----------|
| Feasibility | Pass | 내장 라이트·다크가 이미 같은 형식(`ThemeDef`: 셸 토큰 8 + 문서 토큰 48)으로 옮겨져 있다(S-2). 검증은 `CSS.supports('color', v)` 한 줄 |
| Direction fit | Pass | 보간·목록 미리보기(색 칩)·"빠진 토큰은 base로 채움"이 모두 토큰 단위라 자연스럽다 |
| Efficiency | Pass | 파서·검증·JSON 직렬화 100줄 안팎. 임의 CSS 테마는 샌드박스·보간 불가 문제를 새로 떠안는다 |

## Alternatives considered

| Alternative | Pros | Cons | Better when |
|-------------|------|------|-------------|
| **색 토큰 JSON (채택)** | 검증 쉬움, 보간 가능, 부분 테마 가능(base로 채움), 안전(`url(`·`@import`·`;{}` 거부) | 레이아웃·글꼴은 못 바꿈. 토큰 이름(github-markdown 변수)을 알아야 함 → 복제·예제로 보완 | 지금 |
| 임의 CSS 파일 | Typora 테마처럼 자유로움 | `url()`·`@import`로 바깥 리소스 호출, 셀렉터로 셸 UI 파괴 가능, S-3 보간 불가 | Typora CSS 호환 레이어(백로그)를 만들 때 |
| `.mdtheme.json` 전용 확장자 | 탐색기에서 구분됨 | 파일 대화상자 필터·연결이 더 필요, 이득 적음 | 테마 파일을 더블클릭으로 설치하게 할 때 |

## Decision

- Verdict: `ADOPT` (2026-10-01 사용자 확정: "테마파일형식도 확정")
- What we will do now:
  - 형식: `{ "id", "name", "base": "light"|"dark", "shell": { 토큰: 색 }, "doc": { 토큰: 색 } }`. 확장자 `.json`. `id`가 없으면 파일 이름. `$schema`·`description` 키는 허용(무시)
  - `id`: 영문·숫자로 시작, 영문·숫자·`-`·`_`, 64자 — 파일 이름이 되므로 백엔드도 같은 규칙으로 막는다. 내장 id(`light`·`dark`)는 금지
  - 값: `CSS.supports('color', v)`가 참이고 `url(`·`@import`·`expression`·`; { } < > \`가 없을 것. 모르는 토큰·키는 경고만 하고 무시. 하나라도 틀리면 **아무것도 저장하지 않고** 어느 키·값인지 보인다
  - 저장 위치 `%APPDATA%\MdEditor\themes\<id>.json`. 폴더가 원본, localStorage `mdeditor.userThemes`는 시작용 캐시
  - 공개 토큰 목록: 셸 `SHELL_TOKENS` 8개 + 문서 `DOC_TOKENS` 48개 전부(README "테마 파일" 절). "복제"가 모든 토큰을 채운 파일을 만들어 출발점이 된다
- What we will not do: 임의 CSS·글꼴·레이아웃 테마, 원격 테마 URL, Typora CSS 호환(백로그 유지)

## Follow-up

- 2026-10-01 사용자 확정 — 형식·확장자(`.json`)·토큰 전부 공개. 추천 테마(`src/theme/recommended.ts`)도 이 형식으로 테마 폴더에 저장된다
- 나중에 바꾸려면 `parseThemeFile`·`themes.rs valid_id`·README 절 세 곳
