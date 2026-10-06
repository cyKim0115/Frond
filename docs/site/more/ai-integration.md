---
description: Claude Code·Codex가 새로 만든 md를 Frond의 새 문서 목록에 쌓는 훅 설정과 동작을 설명합니다.
icon: robot
---

# AI 앱 연동

AI 코딩 도구가 `.md` 파일을 **새로 만들면** Frond에 넘깁니다. Frond가 꺼져 있으면 그 파일로 뜨고, 떠 있으면 기존 창에 넘깁니다.

훅은 `--from-hook` 표식을 붙이고, 앱은 이걸 보고 **보던 문서를 바꾸지 않고 창도 앞으로 가져오지 않은 채** 탐색 영역의 **AI가 만든 새 문서** 목록에 쌓습니다(작업 표시줄만 깜빡, 상태바 **새 문서 n**). 같은 파일을 AI가 다시 고치면 [외부 변경 감지](../write/external-changes.md)가 다시 읽습니다.

설정 **탐색** 탭의 **AI 훅이 만든 문서**로 동작을 고릅니다: 목록에 쌓기(기본) / 뒤 탭으로 열기 / 바로 열기. 열린 문서가 없으면 바로 엽니다.

## 지원 범위

| AI 앱 | 방법 |
|---|---|
| Claude Code (CLI·데스크톱 Code 탭) | `Write` 도구 PostToolUse 훅. 새 파일일 때만 동작 |
| Codex (CLI·ChatGPT 앱 Codex) | `apply_patch` PostToolUse 훅. 스크립트 실행은 확인했고, Codex 안에서 실제로 훅이 도는지는 아직 확인하지 못했습니다 |
| Claude Chat·ChatGPT에서 내려받은 md | 훅 없음 — Windows 기본 앱으로 열립니다([기본 앱 지정](../getting-started/default-app.md)) |

## 설치

훅 스크립트(`open-new-md.ps1`)와 Claude Code·Codex 설정 예시는 저장소의 [integrations/README.md](https://github.com/cyKim0115/Frond/blob/main/integrations/README.md)에 있습니다. Frond를 먼저 설치한 뒤 따라 합니다.

## 열지 않는 것

- 덮어쓰기·수정
- `.md`·`.markdown`이 아닌 파일
- AI가 자기 작업용으로 쓰는 폴더(`~\.claude\`, `~\.codex\`, 임시 폴더)

## 끄기

설정 블록을 지웁니다. Claude Code는 `"disableAllHooks": true`로 모든 훅을 한꺼번에 끌 수도 있습니다.
