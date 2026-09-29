# 다음 세션 인계

작성: 2026-09-28 · 갱신: 2026-09-29 (Phase 0 진행 — 코어·측정·픽스처 완료, IME 실측 대기)
읽는 순서: [`CLAUDE.md`](../CLAUDE.md) → 이 문서 → [`roadmap.md`](roadmap.md) → [`decisions/ideas/INDEX.md`](decisions/ideas/INDEX.md)

이 문서는 **지금 열려 있는 것**을 담는다. 확정된 결정은 system-crew 형식으로 `decisions/`에 남기고 여기서 지운다.

---

## 1. 지금 어디까지 왔나

| 단계 | 상태 |
|---|---|
| 프로젝트 초기세팅 · system-crew 0.9.0 OnDemand | 완료 |
| 참고 조사 | 완료 — [`references/assets/20260929-typora-md-editors/`](references/assets/20260929-typora-md-editors/ASSET.md) |
| 기술 스택 | **확정** `ADOPT_WITH_CHANGES` — Tauri 2 + Vite + vanilla TS ([`decisions/ideas/20260929-stack.md`](decisions/ideas/20260929-stack.md)). IME 스파이크 통과 시 `ADOPT` |
| 에디터 엔진 | **확정** `ADOPT_WITH_CHANGES` — CodeMirror 6 ([`decisions/ideas/20260929-editor-engine.md`](decisions/ideas/20260929-editor-engine.md)) |
| MVP 범위 | **V1 리더 퍼스트** ([`decisions/ideation/20260929-mvp-scope.md`](decisions/ideation/20260929-mvp-scope.md)) = 로드맵 Phase 0–2 |
| 개발 계획 | 확정 — [`roadmap.md`](roadmap.md) |
| Phase 0-2 바이트 보존 코어 | **완료** — `exp/core` `crates/mdeditor-core` (205aaa2). 테스트 23개 통과, `samples/raw` 제자리 저장 → `git status` 깨끗 |
| Phase 0-3 Windows 실측 | **완료** — `exp/wpf-hello` `spike/measure/results-20260929.md` (548df71). Tauri 371 ms / WPF 732 ms |
| Phase 0-4 픽스처 | **완료** — `samples/paths/`, `samples/gen-large.ps1` (main) |
| Phase 0-1 IME 스파이크 | **앱 준비 완료, 사용자 실측 대기** — `exp/ime-spike` `spike/ime-spike` (29c5eb4) ← §2 |
| Phase 1 (뷰어 MVP) | 0-1 통과 후 |

결과 요약은 [`decisions/ideas/20260929-stack.md`](decisions/ideas/20260929-stack.md) "Phase 0 결과 기록란"에 있다.

브랜치는 선형으로 쌓여 있다: `main` → `exp/core` → `exp/ime-spike` → `exp/wpf-hello`. `exp/wpf-hello`를 체크아웃하면 Phase 0 산출물이 전부 있다.

---

## 2. 사용자가 할 일 ★ IME 실측 (에이전트가 대신 못 하는 항목)

1. `git checkout exp/wpf-hello` → `cd spike/ime-spike` → `npm install` → `npm run spike`
2. [`spike/ime-spike/CHECKLIST.md`](../spike/ime-spike/CHECKLIST.md)대로 시나리오 ①–⑧을 A/B/C 편집면에서 두벌식으로 타이핑. 오른쪽 체크리스트에 통과/부분/실패 + 증상
3. **결과 내보내기** → `spike/ime-spike/results/<라벨>.md` (라벨 예: `win10-19045-newIME`)
4. 이전 IME로 바꿔(체크리스트의 설정 경로 또는 레지스트리) 반복. Win11 PC가 있으면 거기서도. 없으면 Win10 결과로 잠정 판정하고 Win11은 Phase 1-7 검증 때 보강
5. 결과표를 [`decisions/ideas/20260929-stack.md`](decisions/ideas/20260929-stack.md) 기록란에 붙인다. **B면(CM6 plain) ①–⑦ 전부 통과 → Verdict `ADOPT`.** 실패 셀은 `npm run spike:tsf-off`로 재시도 → 그래도 실패면 Modified approach 1의 (b) textarea/EditContext (c) Electron 순으로 재판정 요청

에이전트에게 "IME 결과 기록해줘"라고 하면 results/*.md를 읽어 기록란·Verdict·INDEX·이 문서를 갱신한다.

## 3. Phase 0 통과 직후 할 일 (에이전트)

1. 브랜치 정리: `exp/core`를 `main`에 머지(`crates/`, `.gitignore`). `exp/ime-spike`·`exp/wpf-hello`는 결과 기록 뒤 `archived-exp/*`로 이름을 바꾸거나 삭제 — 로드맵 규칙대로 WPF 코드는 폐기, 스파이크 앱은 Phase 5(`exp/live-preview`) 때 데코·IME 가드 패턴만 재활용
2. Phase 1 스캐폴딩(`main`): tauri ≥ 2.12, Vite 6, vanilla TS, single-instance ≥ 2.4.5, `capabilities/`, `.gitignore`에 `node_modules/`·`dist/`·`src-tauri/target/`. `mdeditor-core`를 워크스페이스 멤버로
3. `CLAUDE.md`의 `구조`·`빌드` 절 채우기
4. Phase 1 스펙을 `references/assets/20260929-typora-md-editors/system-spec.md`로 작성(EARS는 로드맵 표 재사용)
5. 이 문서 §1 표 갱신

## 4. 보류 중인 사용자 결정

- **RAG 캡처**: MVP(Phase 2) 완료 후 `capture-to-rag` 검토 (2026-09-29 사용자: "MVP완료하고")
- **대용량 샘플 커밋 여부**: 로드맵은 `samples/raw/`에 2 MB·10 MB를 두라 했지만 저장소 12 MB 부담 때문에 생성 스크립트(`samples/gen-large.ps1`)로 대체했다. 커밋을 원하면 `.gitignore`의 `samples/large/`를 빼면 된다
- **재부팅 직후 진짜 콜드 시작 측정**: 선택. `spike/measure/README.md`대로 1회 돌리면 된다 (현재 수치는 유휴 첫 실행)
- **EOL 재대응 정책**: 편집한 줄은 자기 줄바꿈을 유지하고 새로 끼어든 줄만 지배 EOL을 쓴다(`crates/mdeditor-core/src/eol.rs` `remap`). 다른 정책을 원하면 그 함수 하나만 바꾸면 된다

## 5. 조사에서 나온 열린 질문 (갱신)

[`reference-brief.md` Open questions](references/assets/20260929-typora-md-editors/reference-brief.md#open-questions) 참조.

- WebView2 한국어 IME: #5625·tauri #15436·#5475가 두벌식에서 재현되는지 — **0-1 실측으로 답한다**
- NSIS 훅 등록이 Win11 '연결 프로그램' 추천 목록·기본 앱 설정에 실제로 노출되는지 (Phase 1-6)
- ~~chardetng를 [UTF-8, EUC-KR]로 제한했을 때 짧은 `cp949.md` 정확도~~ → 0-2: `kr` 힌트로 121 B 파일 정확 감지. 영문 위주에 한글 몇 자만 있는 더 짧은 파일은 미확인 — Phase 2에서 픽스처 추가
- Typora 1.14.x가 `samples/raw`를 무편집 저장할 때 바꾸는 바이트 (레퍼런스 실측, 선택)
- ~~Windows 콜드 시작·메모리~~ → 0-3: 유휴 첫 실행 Tauri 383 ms / WPF 744 ms, 트리 메모리 300 / 366 MB. 재부팅 콜드는 미측정
