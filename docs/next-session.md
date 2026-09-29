# 다음 세션 인계

작성: 2026-09-28 · 갱신: 2026-09-29 (Phase 1 구현 완료, 1-7 실기 검증 대기)
읽는 순서: [`CLAUDE.md`](../CLAUDE.md) → 이 문서 → [`roadmap.md`](roadmap.md) → [`decisions/ideas/INDEX.md`](decisions/ideas/INDEX.md)

이 문서는 **지금 열려 있는 것**을 담는다. 확정된 결정은 system-crew 형식으로 `decisions/`에 남기고 여기서 지운다.

---

## 1. 지금 어디까지 왔나

| 단계 | 상태 |
|---|---|
| 프로젝트 초기세팅 · system-crew 0.9.0 OnDemand | 완료 |
| 참고 조사 | 완료 — [`references/assets/20260929-typora-md-editors/`](references/assets/20260929-typora-md-editors/ASSET.md) |
| 기술 스택 | **확정 `ADOPT`** — Tauri 2 + Vite + vanilla TS ([`decisions/ideas/20260929-stack.md`](decisions/ideas/20260929-stack.md)) |
| 에디터 엔진 | **확정** `ADOPT_WITH_CHANGES` — CodeMirror 6 ([`decisions/ideas/20260929-editor-engine.md`](decisions/ideas/20260929-editor-engine.md)) |
| MVP 범위 | **V1 리더 퍼스트** ([`decisions/ideation/20260929-mvp-scope.md`](decisions/ideation/20260929-mvp-scope.md)) = 로드맵 Phase 0–2 |
| Phase 0 (스파이크·코어·측정·픽스처) | 완료 2026-09-29 — [`decisions/ideas/20260929-stack.md`](decisions/ideas/20260929-stack.md) "Phase 0 결과 기록란" |
| Phase 1 뷰어 MVP — 1-1 스캐폴딩 · 1-2 열기 경로 · 1-3 렌더 · 1-4 UI/테마 · 1-5 외부 변경 · 1-6 설치기 | **구현 완료 2026-09-29** (`main`). 스펙: [`system-spec.md`](references/assets/20260929-typora-md-editors/system-spec.md) |
| Phase 1-7 검증 | **실기 검증 대기** ← §2 |
| Phase 2 (편집·저장) | 1-7 통과 후 |

Phase 1 구현 요약: `npm run app:build` → `target/release/bundle/nsis/MdEditor_0.1.0_x64-setup.exe`(4.2 MB). 확인된 것 — argv·두 번째 인스턴스 열기(릴리스 exe), 외부 변경 감지(내용 해시, 삭제 배너), vitest 34건(렌더: 경로·링크 허용 목록·DOMPurify·하이라이트), cargo 테스트 34건(코어 23 + 백엔드 11), 브라우저 미리보기(`npm run dev` → `http://localhost:1422/?sample=samples/showcase.md`)에서 목차·제목 id·표·체크리스트·각주·코드 하이라이트·한글 keep-all·D2Coding·가로 스크롤 없음. NSIS 훅은 makensis 컴파일과 문자열 검사까지만 됐고 **설치·레지스트리 실측은 안 했다**.

---

## 2. 사용자가 할 일 ★ 1-7 실기 검증 (에이전트가 대신 못 하는 항목)

1. `target\release\bundle\nsis\MdEditor_0.1.0_x64-setup.exe` 실행(현재 사용자 설치, `%LOCALAPPDATA%\MdEditor`). WebView2가 없으면 부트스트래퍼가 내려받는다
2. 탐색기에서 `.md` 우클릭 → **연결 프로그램** 목록에 MdEditor가 뜨는지. 설정 → 앱 → 기본 앱에 MdEditor가 있는지 (Win11: 앱 상태바 "기본 앱으로 설정" 버튼이 그 페이지를 연다)
3. `samples/showcase.md` 더블클릭 → 1 s 안에 렌더. 그 상태에서 `samples/paths/paths.md` 더블클릭 → 새 창이 아니라 같은 창이 바뀌는지. 하위 폴더 이미지 4종(한글·공백·`[`·`#`)이 보이는지
4. 다른 편집기로 열린 파일을 고쳐 저장 → 3 s 안에 갱신되고 스크롤이 유지되는지. 파일을 지우면 상단 배너
5. `Ctrl+Shift+D` 다크 전환, `Ctrl+\` 목차 접기, `Ctrl+±/0` 줌, `Ctrl+O` 열기, 창을 400 px까지 줄여도 가로 스크롤 없음, `Ctrl+P` 인쇄 미리보기에서 코드 블록 배경·긴 코드 줄바꿈
6. `samples/gen-large.ps1`로 만든 `samples/large/10mb.md` 열기 시간(목표: 렌더 ≤ 5 s)
7. 제거 후 `.md` 우클릭 목록에서 MdEditor가 사라지는지, 다른 앱 연결이 남는지
8. (가능하면) Win11 PC와 이전 IME에서 `archived-exp/ime-spike` 재실측 (§3)

결과를 알려 주면 에이전트가 `fidelity-report.md`(readonly QA 형식)를 쓰고 로드맵 1-7을 닫는다. 문제가 나오면 그 항목만 고친다.

## 3. Phase 1 안에서 보강할 실측

- **1-7**: 이전 IME(`ConfigureImeVersion=1`)·Win11에서 IME 시나리오 재실측 (Win10 새 IME 결과로 잠정 판정 중). 스파이크 앱 재사용: `git checkout archived-exp/ime-spike` → `cd spike/ime-spike` → `npm install` → `npm run spike`, 절차는 그 브랜치의 `spike/ime-spike/CHECKLIST.md`
- **1-6**: 위 §2 2·7번

## 4. 보류 중인 사용자 결정

- **RAG 캡처**: MVP(Phase 2) 완료 후 `capture-to-rag` 검토 (2026-09-29 사용자: "MVP완료하고")
- **원문 HTML 태그**: 렌더는 `html: false`라 `<details>`·`<img>` 같은 원문 HTML이 글자 그대로 보인다(GitHub과 다름, 뷰어라 안전 우선). 허용 태그 목록과 함께 열지 결정 필요 (`src/render/index.ts`)
- **`www.example.com` 자동 링크**: 파일명(`paths.md`) 오탐을 막으려고 스킴 있는 URL만 자동 링크. GitHub과 다른 점
- **대용량 샘플 커밋 여부**: 생성 스크립트 유지. 커밋 원하면 `.gitignore`의 `samples/large/`를 뺀다
- **EOL 재대응 정책**: `crates/mdeditor-core/src/eol.rs` `remap` (편집 줄은 자기 EOL 유지, 새 줄만 지배 EOL)

## 5. 열린 질문 (갱신)

- NSIS 훅 노출(연결 프로그램 추천 목록·기본 앱 설정): **§2 2·7번 실기로 답한다**
- WebView2 한국어 IME: Win10 새 IME ①–⑧ 통과. 이전 IME·Win11 미실측 (§3)
- Typora 1.14.x 무편집 저장 바이트 (레퍼런스 실측, 선택)
- 재부팅 직후 진짜 콜드 시작 (선택, `archived-exp/wpf-hello`의 `spike/measure`)
- 렌더 리뷰에서 나온 사소한 차이(기록만): 슬러그 `a  b` → `a-b`(GitHub `a--b`), 각주 섹션에 `data-line` 없음, 차단된 스킴 링크는 원문 글자로 남음(GitHub은 href 없는 `<a>`)
