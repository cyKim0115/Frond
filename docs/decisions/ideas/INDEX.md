# Ideas Index

사용자·팀이 검토한 시스템/구현 아이디어 판정 목록이다. 같은 제안을 반복 논의하기 전에 검색한다.

| Idea id | Title / summary | Verdict | Date | Path |
|---------|-----------------|---------|------|------|
| `20260929-stack` | 앱 스택 — Tauri 2 + Vite + TS (Phase 0 IME 스파이크 통과로 승격. 런타임 핀·자체 파일 I/O·NSIS 훅은 구현 규칙) | `ADOPT` | 2026-09-29 | `20260929-stack.md` |
| `20260929-editor-engine` | 에디터 엔진 — CodeMirror 6 + 자체 라이브프리뷰 데코 + 에디터 밖 바이트 보존 계층 (ProseMirror 계열·Vditor·Muya 제외) | `ADOPT_WITH_CHANGES` | 2026-09-29 | `20260929-editor-engine.md` |
| `20260930-theme-file-format` | 사용자 테마 파일 — 색 토큰만 담는 JSON(id·name·base·shell·doc), `%APPDATA%\MdEditor\themes`, 잘못된 값은 저장 안 함. **에이전트 권장안, 사용자 확인 필요** | `ADOPT` (잠정) | 2026-09-30 | `20260930-theme-file-format.md` |

## How to add

1. `.cursor/system-crew/templates/idea-evaluation.md`로 `docs/decisions/ideas/YYYYMMDD-slug.md` 작성
2. 이 INDEX에 한 줄 추가
3. `ADOPT*`면 관련 스펙·reference asset Decisions에도 링크
