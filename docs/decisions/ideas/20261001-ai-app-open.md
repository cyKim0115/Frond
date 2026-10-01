# Idea Evaluation — AI 앱에서 md를 MdEditor로 열기

- Date: 2026-10-01
- Idea id: `20261001-ai-app-open`
- Status: `decided`
- Verdict: 항목별 (아래 표)
- Related: `integrations/open-new-md.ps1`, `integrations/README.md`, `src-tauri/src/lib.rs`(`on_second_instance`), `src-tauri/nsis/hooks.nsh`(ProgId)

## Proposal (user)

- "클로드나 GPT에서 MD를 열 때 이 프로그램으로 열게 하고 싶다. 오른쪽 사이드에 뜨는 것도 가능하게 하고 싶다."
- 조사 결과를 듣고: "AI 프로그램의 오른쪽 탭에 열리는 것이 내장 프로그램이어야만 하는 거라면 이 부분은 폐기. AI 프로그램에서 내 프로그램으로 여는 기능이라도 추가되면 좋겠음." 여는 시점은 **새 md 파일을 쓸 때만**.

## Context

- Claude 데스크톱 Code 탭: 파일 경로를 누르면 앱 안 오른쪽 파일 창에서 열린다. 우클릭 **Open in**은 설치된 편집기(VS Code·Cursor·Zed 등)만 나오고 다른 앱을 더하는 설정은 문서에 없다 (code.claude.com/docs/en/desktop "Open files and folders")
- Claude Code 훅: PostToolUse가 `tool_input.file_path`를 stdin으로 준다. `Write` 결과에는 `type: "create" | "update"`가 있다 (문서에는 없고 세션 기록·실제 훅에서 확인)
- ChatGPT Windows 앱: **Open** 기본 앱은 정해진 편집기 목록 + 프로젝트 폴더 단위 (learn.chatgpt.com/docs/windows/windows-app). Codex 훅은 `apply_patch`에 PostToolUse를 주고, `tool_input.command`에 패치 본문이 있다 (learn.chatgpt.com/docs/hooks)
- 내려받은 md는 Windows 기본 앱으로 열린다 — 1-6 파일 연결로 이미 된다

## Decisions

| # | 항목 | Verdict | 정한 것 | 이유 |
|---|------|---------|---------|------|
| A1 | AI 앱 오른쪽 창 안에 MdEditor 띄우기 | `REJECT` | 하지 않는다 | Claude·ChatGPT 모두 외부 앱을 오른쪽 창에 넣는 확장 지점이 없다. 사용자가 "내장이어야 하면 폐기"로 정함 |
| A2 | MdEditor 창을 화면 오른쪽에 붙이는 사이드 모드 | `REJECT` | 하지 않는다 | A1을 대신하려던 안. 사용자가 사이드 부분 전체를 폐기 |
| A3 | AI 도구 → MdEditor 열기 | `ADOPT` | PostToolUse 훅 스크립트 하나(`integrations/open-new-md.ps1`)가 Claude Code `Write`(create)와 Codex `apply_patch`(`*** Add File:`)를 둘 다 처리한다. exe는 설치기 ProgId 열기 명령에서 찾는다. 앱 코드는 바꾸지 않는다 — argv·single-instance 경로를 그대로 쓴다 | 앱 쪽 변경 없이 이미 있는 열기 경로(1-2)를 재사용한다. 훅은 사용자 설정이라 끄고 켜기 쉽다 |
| A4 | 여는 시점 | `ADOPT` | **새로 만든 md만**. 덮어쓰기·수정은 열지 않는다(열려 있으면 외부 변경 감지가 갱신). AI 작업용 폴더(`~\.claude`, `~\.codex`, `%TEMP%`)는 제외. 여러 개면 마지막 하나 | 사용자 선택. 이 저장소처럼 docs를 자주 고치는 작업에서 창이 계속 바뀌지 않게 |

## Scores

| Axis | Result | Evidence |
|------|--------|----------|
| Feasibility | Pass | Claude Code 실제 훅으로 한글 이름 새 md → 떠 있던 창이 그 파일로 전환, 덮어쓰기는 다시 열지 않음 (2026-10-01). Codex 형식은 `cmd` 경유 실행까지 확인 |
| Direction fit | Pass | 앱 코드·권한 변경 없음. 파일 I/O는 여전히 앱 코어만 |
| Efficiency | Pass | 스크립트 1개 + 설정 2곳 |

## Open

- Codex(특히 ChatGPT 앱 Codex 모드, `[windows] sandbox = "elevated"`)에서 훅이 실제로 돌고 GUI를 띄울 수 있는지 — 사용자가 Codex로 새 md를 만들어 확인
- MdEditor가 편집 중(dirty)일 때 훅이 열면 저장 확인 팝업이 끼어든다. 거슬리면 "외부 열기 요청은 배너로" 같은 앱 쪽 가드를 검토
