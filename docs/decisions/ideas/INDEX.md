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
| `20261001-ai-app-open` A3·A4 | Claude Code·Codex PostToolUse 훅으로 **새로 만든 md만** MdEditor로 열기 (`integrations/`). 2026-10-26 `.html`·`.htm`과 Cursor `afterFileEdit` 추가(사용자 지시) | `ADOPT` | 2026-10-01 | `20261001-ai-app-open.md` |
| `20261006-shiki` | 코드 강조 highlight.js → Shiki 교체 — 300줄 강조 81.7 ms vs 3.2 ms, 번들 886 KB vs 67 KB, 테마 토큰과 분리 → 유지 | `DEFER` | 2026-10-06 | `20261006-shiki.md` |
| `20261006-license` | 소스 라이선스 — MIT를 LICENSE 파일로 확정, "Frond" 이름·앱 아이콘은 별도 보유(`TRADEMARKS.md`), 구매자 전용 테마도 공개 | `ADOPT` | 2026-10-06 | `20261006-license.md` |
| `20261006-store-monetization` | Microsoft Store(MSIX) 배포 + Durable add-on 선택 구매 — 사용자 테마 만들기·전용 테마 해금, 드문 구매 권유. 문서 기능·다크·추천 테마는 무료. 계정 유형·가격은 사용자 결정 | `ADOPT_WITH_CHANGES` | 2026-10-06 | `20261006-store-monetization.md` |
| `20261006-website` | 웹사이트 — Astro 정적 제품 페이지(`website/`, Cloudflare Workers 정적 자산) + GitBook 설명서(`docs/site/`), 설명서는 `<도메인>/docs` 302, 도메인 전엔 로컬만(무료 도메인 REJECT), Starlight `/docs`는 DEFER, 버전·SHA256은 빌드 때 GitHub API, 사용 장면은 CDP 스크립트 캡처 | 항목별 (`ADOPT`·`DEFER`·`REJECT`) | 2026-10-06 | 2026-10-07 비공개 웹사이트 저장소로 옮김 |
| `20261006-live-preview` | 인라인 라이브프리뷰 실험 — CM6 데코레이션만(텍스트 불변), 캐럿 줄 원문, 조합 중 재빌드 안 함. `exp/live-preview`에만, IME ①–⑧ 사용자 확인 대기 | `(pending)` | 2026-10-06 | `20261006-live-preview.md` |
| `20261026-html-view` | HTML 문서 열기 — 크로미움 탑재는 REJECT(WebView2가 이미 Chromium, +55~180 MB·패치 책임). 기존 WebView2로 안전 보기(같은 origin·스크립트 없는 iframe, 외부 리소스 차단, 문서 폴더만) + 문서별 스크립트 허용(불투명 origin) + 브라우저로 열기, `.html` 기본 앱은 안 가져옴 | `ADOPT_WITH_CHANGES` | 2026-10-26 | `20261026-html-view.md` |
| `20261104-json-view` | JSON 파일 열기 — 소스 우선 ADOPT_WITH_CHANGES(문서 종류 `doc-kind.ts`로 모음, 읽기 전용 CM6 보기·소스, jsonc-parser `visit` 검사, 누를 때만 서식 맞추기, 20MB 읽기 전용·200MB 거절, 폴더 트리 문서형만). 트리 보기·JSONL 목록·표·`.json5`는 DEFER(써 본 뒤 관문 G). 자동 서식·vanilla-jsoneditor·AI 훅 기본 넘기기·`.json` 기본 앱은 REJECT. 사용자 결정 6건 대기 | `(pending)` | 2026-11-04 | `20261104-json-view.md` |
| `20261127-app-update` | 앱 안 업데이트 — 설치기판(NSIS)만 Tauri updater, 조용히 확인·자동 받기 → 제목 표시줄 '업데이트' 알약 → 누를 때 재시작, 재시작 전 저장·초안·세션 인계 파일(Windows install은 앱을 바로 끔), 설정 '업데이트' 탭, 로컬 서명 빌드·`latest.json` 스크립트, 발행 없는 격리 E2E. Store·Scoop·개발 빌드 updater·강제 업데이트·자동 모달 REJECT, StoreContext 알림·tauri-action DEFER. 서명 키 비밀번호 유무는 사용자 결정 대기 | `ADOPT_WITH_CHANGES` | 2026-11-27 | `20261127-app-update.md` |
| `20261126-rounded-window-corners` | 창 둥근 모서리 — 투명 창 + `shadow(false)` + 페이지가 그리는 둥근 불투명 카드(여백 8px·반지름 8px), 최대화 때 각지게, 여백은 크기 조절 테두리. DWM(Win10 무효)·`SetWindowRgn`(계단·그림자 없음)은 안 씀. unity-slot-widget에서 가져옴 | `ADOPT` | 2026-11-26 | `20261126-rounded-window-corners.md` |

## How to add

1. `docs/templates/idea-evaluation.md`로 `docs/decisions/ideas/YYYYMMDD-slug.md` 작성
2. 이 INDEX에 한 줄 추가
3. `ADOPT*`면 관련 스펙·reference asset Decisions에도 링크
