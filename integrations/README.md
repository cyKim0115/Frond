# AI 앱 연동 — 새 md를 Frond로 열기

AI 코딩 도구가 `.md` 파일을 **새로 만들면** Frond에 넘긴다. 꺼져 있으면 그 파일로 뜨고, 떠 있으면 single-instance로 기존 창에 넘긴다.
훅은 `--from-hook=claude`·`codex` 표식을 붙인다 — 앱은 이걸 보고 **보던 문서를 바꾸지 않고 창도 앞으로 가져오지 않은 채** 탐색 영역 'AI가 만든 새 문서' 목록에 쌓는다(작업 표시줄만 깜빡, 상태바 '새 문서 n'). 설정 탐색 탭 'AI 훅이 만든 문서'로 뒤 탭으로 열기·바로 열기(예전 동작)를 고른다. 열린 문서가 없으면 바로 연다 (로드맵 3-6).
같은 파일을 AI가 다시 고치면 Frond의 외부 변경 감지가 다시 읽는다 — 훅은 새 파일일 때만 돈다.
결정 배경: [`docs/decisions/ideas/20261001-ai-app-open.md`](../docs/decisions/ideas/20261001-ai-app-open.md)

| 파일 | 역할 |
|---|---|
| `open-new-md.ps1` | PostToolUse 훅 본체. stdin JSON에서 새로 생긴 md 경로를 골라 `mdeditor.exe`로 연다. 항상 exit 0 |

## 지원 범위

| AI 앱 | 방법 | 상태 |
|---|---|---|
| Claude Code (CLI·데스크톱 Code 탭) | `Write` 도구 PostToolUse 훅. `tool_response.type`이 `create`일 때만 | 동작 확인 2026-10-01 |
| Codex (CLI·ChatGPT 앱 Codex) | `apply_patch` PostToolUse 훅. 패치의 `*** Add File:` 줄 | 스크립트·`cmd` 경유 실행 확인. **Codex 안에서 실제로 훅이 도는지는 미확인** |
| Claude Chat·ChatGPT 대화에서 내려받은 md | 훅 없음 — Windows 기본 앱으로 열린다 | 설정 → 기본 앱에서 `.md`를 Frond로 (상태바 '기본 앱') |
| Claude Code 오른쪽 파일 창 | 바꿀 수 없음. 우클릭 Open in 목록은 설치된 편집기(VS Code·Cursor·Zed 등)뿐 | — |

## 설치

Frond 설치기로 먼저 설치한다. 훅은 설치기가 등록한 `HKCU\Software\Classes\MdEditor.Markdown\shell\open\command`에서
exe 경로를 읽는다 (없으면 `%LOCALAPPDATA%\Frond\mdeditor.exe`). `.md` 기본 앱이 다른 프로그램이어도 Frond로 연다.

**Claude Code** — `~/.claude/settings.json`의 `hooks`에 추가 (exec 형식, 셸 거치지 않음):

```json
"hooks": {
  "PostToolUse": [
    {
      "matcher": "Write",
      "hooks": [
        {
          "type": "command",
          "if": "Write(*.md)",
          "command": "powershell.exe",
          "args": ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-File",
                   "C:\\Users\\cykim\\repo\\MdEditor\\integrations\\open-new-md.ps1"],
          "async": true,
          "timeout": 15
        }
      ]
    }
  ]
}
```

`if`가 `.md`가 아닌 Write에서는 PowerShell을 띄우지 않게 거른다(`.markdown`은 여기서 빠진다).

**Codex** — `~/.codex/config.toml` 끝에 추가 (훅은 기본으로 켜져 있다. `[features] hooks = false`면 꺼짐):

```toml
[[hooks.PostToolUse]]
matcher = "^apply_patch$"

[[hooks.PostToolUse.hooks]]
type = "command"
command = 'powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "C:\Users\cykim\repo\MdEditor\integrations\open-new-md.ps1"'
timeout = 15
```

저장소 경로가 바뀌면 두 설정의 스크립트 경로를 같이 고친다.

## 열지 않는 것

- 덮어쓰기(Claude `update`)·수정(Codex `Update File`)
- `.md`·`.markdown`이 아닌 파일
- AI가 자기 작업용으로 쓰는 폴더: `~\.claude\`(메모리·계획·스킬), `~\.codex\`, `%TEMP%`(세션 스크래치패드) —
  `open-new-md.ps1`의 `Test-ShouldOpen`에서 고친다
- (2026-10-06부터) 한 번에 여러 개를 만들면 전부 넘긴다 — 예전 설치본은 표식을 건너뛰고 첫 파일만 연다

## 문제 해결

- 판단 기록: `%TEMP%\mdeditor-open-hook.log` (열었을 때·오류일 때만 한 줄, 띄운 방법 `WMI`·`Start-Process`도 남긴다)
- Claude 데스크톱 세션의 훅은 MSIX 컨테이너 안에서 돈다 — 2026-10-06부터 앱을 WMI(`Win32_Process.Create`)로 컨테이너 밖에서 띄워, 훅이 처음 띄운 앱도 사용자가 띄운 앱과 같은 설정·테마·초안을 쓴다. WMI가 막히면 예전처럼 `Start-Process`
- 탭(로드맵 3-1)이 생긴 뒤로는 새 파일이 새 탭으로 열리므로 편집 중이어도 저장 확인 팝업이 뜨지 않는다
- 끄기: 위 설정 블록을 지운다. Claude Code는 `"disableAllHooks": true`로 모든 훅을 한꺼번에 끌 수도 있다
- 스크립트는 한글 주석 때문에 **UTF-8 BOM**으로 저장한다 (PowerShell 5.1이 BOM 없는 파일을 cp949로 읽는다)
