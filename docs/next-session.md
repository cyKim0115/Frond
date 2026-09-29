# 다음 세션 인계

작성: 2026-09-28 · 갱신: 2026-09-29 (조사·판정 초안·로드맵 작성)
읽는 순서: [`CLAUDE.md`](../CLAUDE.md) → 이 문서 → [`roadmap.md`](roadmap.md) → [`decisions/ideas/INDEX.md`](decisions/ideas/INDEX.md)

이 문서는 **지금 열려 있는 것**을 담는다. 확정된 결정은 system-crew 형식으로 `decisions/`에 남기고 여기서 지운다.

---

## 1. 지금 어디까지 왔나

| 단계 | 상태 |
|---|---|
| 전역 Claude Code 환경 | 완료 |
| 프로젝트 초기세팅 | 완료 — git, `CLAUDE.md`, 인계 문서, 샘플 |
| system-crew | 설치 — 0.9.0, OnDemand |
| 참고 조사 | **완료** — [`references/assets/20260929-typora-md-editors/`](references/assets/20260929-typora-md-editors/ASSET.md) (Typora + 경쟁 20종, 스택·엔진·파일 연결·파일 충실도·IME·한국어 타이포, 증거 약 170건, 독립 검증 24건) |
| 기술 스택 | **판정 초안, 확인 대기** — [`decisions/ideas/20260929-stack.md`](decisions/ideas/20260929-stack.md) 권고 `ADOPT_WITH_CHANGES`: Tauri 2 + Vite + TS |
| 에디터 엔진 | **판정 초안, 확인 대기** — [`decisions/ideas/20260929-editor-engine.md`](decisions/ideas/20260929-editor-engine.md) 권고 `ADOPT_WITH_CHANGES`: CodeMirror 6 + 자체 데코 + 바이트 보존 계층 |
| MVP 범위 | **3안 제시, 선택 대기** — [`decisions/ideation/20260929-mvp-scope.md`](decisions/ideation/20260929-mvp-scope.md) V1 리더 퍼스트 / V2 Typora-lite 분할 / V3 인라인 하이브리드 |
| 개발 계획 | **초안** — [`roadmap.md`](roadmap.md) Phase 0(스파이크·코어) ~ 5(인라인 라이브프리뷰) |
| 스캐폴딩·구현 | 시작 전 — 스택이 `ADOPT*`로 확정된 뒤 |

---

## 2. 사용자 확인이 필요한 것 ★ 여기서 시작한다

한 번에 답하면 된다. 답이 오면 판정 문서의 `Status`/`Verdict`를 갱신하고 `roadmap.md` Phase 0으로 넘어간다.

1. **스택** — Tauri 2 + Vite + vanilla TS를 조건부(`ADOPT_WITH_CHANGES`)로 채택할지. 조건은 Phase 0 IME 스파이크 통과, tauri ≥ 2.12 / WebView2 ≥ 150 핀, 파일 I/O Rust 자작, NSIS 훅. 실패 시 폴백은 Electron 또는 WPF + AvalonEdit 분할 뷰
2. **엔진** — CodeMirror 6 노선(ProseMirror 계열·Vditor·Muya 제외)에 동의하는지
3. **MVP** — V1 / V2 / V3 중 하나 (이유는 사용자 말로 기록)
4. **유사도** — `inspired`(Typora UI·편집 감각 참고, 파일 처리·Windows 통합은 프로젝트 요구 우선)로 둬도 되는지
5. **선택 사항** — Phase 0에서 WPF+WebView2 hello 앱도 만들어 시작 시간·메모리를 나란히 잴지(공개 벤치가 전부 macOS라 Windows 수치가 없음)
6. **선택 사항** — 조사·판정 결과를 `capture-to-rag`로 rag 레포에 남길지 (Producer 제안, 강제 아님)

## 3. 확인 직후 할 일

1. `decisions/ideas/20260929-stack.md`, `20260929-editor-engine.md`의 `Status: decided`, `Verdict` 확정, INDEX 갱신. `ideation/20260929-mvp-scope.md` Selection 기록
2. `roadmap.md` Phase 0: `exp/ime-spike` 브랜치에서 IME 스파이크(시나리오 ①–⑧) + `mdeditor-core` 파일 충실도 코어 + `samples/raw` 왕복 테스트
3. 스파이크 결과를 스택 판정 Follow-up에 기록 → 통과 시 Phase 1 스캐폴딩
4. `.gitignore`에 `node_modules/`·`dist/`·`src-tauri/target/` 추가, `CLAUDE.md`의 `구조`·`빌드` 절 채우기
5. 이 문서 §1 표 갱신

## 4. 조사에서 나온 열린 질문 (Phase 0 실측 항목)

[`reference-brief.md` Open questions](references/assets/20260929-typora-md-editors/reference-brief.md#open-questions) 참조. 요약:

- WebView2 한국어 IME: #5625(150+에서 수정 추정)·tauri #15436·#5475가 두벌식에서 재현되는지
- NSIS 훅 등록이 Win11 '연결 프로그램' 추천 목록·기본 앱 설정에 실제로 노출되는지
- chardetng를 [UTF-8, EUC-KR]로 제한했을 때 짧은 `cp949.md` 정확도
- Typora 1.14.x가 `samples/raw`를 무편집 저장할 때 바꾸는 바이트(레퍼런스 실측)
- Windows 콜드 시작·메모리 실측
