# Ideas Index

사용자·팀이 검토한 시스템/구현 아이디어 판정 목록이다. 같은 제안을 반복 논의하기 전에 검색한다.

| Idea id | Title / summary | Verdict | Date | Path |
|---------|-----------------|---------|------|------|
| `20260929-stack` | 앱 스택 — Tauri 2 + Vite + TS (Phase 0 IME 스파이크 통과로 승격. 런타임 핀·자체 파일 I/O·NSIS 훅은 구현 규칙) | `ADOPT` | 2026-09-29 | `20260929-stack.md` |
| `20260929-editor-engine` | 에디터 엔진 — CodeMirror 6 + 자체 라이브프리뷰 데코 + 에디터 밖 바이트 보존 계층 (ProseMirror 계열·Vditor·Muya 제외) | `ADOPT_WITH_CHANGES` | 2026-09-29 | `20260929-editor-engine.md` |
| `20260930-theme-file-format` | 사용자 테마 파일 — 색 토큰만 담는 JSON(id·name·base·shell·doc), `%APPDATA%\MdEditor\themes`, 잘못된 값은 저장 안 함. 2026-10-01 사용자 확정 | `ADOPT` | 2026-09-30 | `20260930-theme-file-format.md` |
| `20261001-v1-open-decisions` D1 | 원문 HTML — 허용 목록 태그·속성만 렌더, 목록 밖 태그는 글자 그대로 | `ADOPT_WITH_CHANGES` | 2026-10-01 | `20261001-v1-open-decisions.md` |
| `20261001-v1-open-decisions` D2 | 자동 링크 — `www.` 시작 주소 추가(GFM 범위), 맨 도메인은 계속 글자 | `ADOPT` | 2026-10-01 | `20261001-v1-open-decisions.md` |
| `20261001-v1-open-decisions` D3 | 대용량 샘플(`samples/large/`) 커밋 — 안 함, 생성 스크립트 유지 | `REJECT` | 2026-10-01 | `20261001-v1-open-decisions.md` |
| `20261001-v1-open-decisions` D4 | EOL 재대응 — 편집 줄은 자기 EOL, 새 줄만 지배 EOL (현행 유지) | `ADOPT` | 2026-10-01 | `20261001-v1-open-decisions.md` |
| `20261001-v1-open-decisions` D5 | 줄바꿈 변환·[비교] — 백로그, 변환 먼저 / 비교는 Phase 3 분할 뷰와 | `DEFER` | 2026-10-01 | `20261001-v1-open-decisions.md` |
| `20261001-v1-open-decisions` D6 | RAG 캡처 — MVP 닫을 때 묻지 않고 실행 | `ADOPT` | 2026-10-01 | `20261001-v1-open-decisions.md` |
| `20261001-v1-open-decisions` D7 | 큰 문서(1 MB 이상, 2026-10-02 사용자 지정) `Ctrl+P` — 확인 팝업 후 인쇄 | `ADOPT` | 2026-10-01 | `20261001-v1-open-decisions.md` |
| `20261001-ai-app-open` A1·A2 | AI 앱 오른쪽 창에 MdEditor 넣기 / 화면 오른쪽 사이드 모드 — 폐기 | `REJECT` | 2026-10-01 | `20261001-ai-app-open.md` |
| `20261001-ai-app-open` A3·A4 | Claude Code·Codex PostToolUse 훅으로 **새로 만든 md만** MdEditor로 열기 (`integrations/`) | `ADOPT` | 2026-10-01 | `20261001-ai-app-open.md` |

## How to add

1. `.cursor/system-crew/templates/idea-evaluation.md`로 `docs/decisions/ideas/YYYYMMDD-slug.md` 작성
2. 이 INDEX에 한 줄 추가
3. `ADOPT*`면 관련 스펙·reference asset Decisions에도 링크
