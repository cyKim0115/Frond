# 다음 세션 인계

작성: 2026-09-28 · 갱신: 2026-09-29 (스택·엔진·MVP 확정, Phase 0 진입)
읽는 순서: [`CLAUDE.md`](../CLAUDE.md) → 이 문서 → [`roadmap.md`](roadmap.md) → [`decisions/ideas/INDEX.md`](decisions/ideas/INDEX.md)

이 문서는 **지금 열려 있는 것**을 담는다. 확정된 결정은 system-crew 형식으로 `decisions/`에 남기고 여기서 지운다.

---

## 1. 지금 어디까지 왔나

| 단계 | 상태 |
|---|---|
| 프로젝트 초기세팅 · system-crew 0.9.0 OnDemand | 완료 |
| 참고 조사 | 완료 — [`references/assets/20260929-typora-md-editors/`](references/assets/20260929-typora-md-editors/ASSET.md) |
| 기술 스택 | **확정** `ADOPT_WITH_CHANGES` — Tauri 2 + Vite + vanilla TS ([`decisions/ideas/20260929-stack.md`](decisions/ideas/20260929-stack.md)). IME 스파이크 통과 시 `ADOPT`로 갱신 |
| 에디터 엔진 | **확정** `ADOPT_WITH_CHANGES` — CodeMirror 6 + 자체 데코 + 바이트 보존 계층 ([`decisions/ideas/20260929-editor-engine.md`](decisions/ideas/20260929-editor-engine.md)) |
| MVP 범위 | **V1 리더 퍼스트** 선택 ([`decisions/ideation/20260929-mvp-scope.md`](decisions/ideation/20260929-mvp-scope.md)) = 로드맵 Phase 0–2 |
| 개발 계획 | 확정 — [`roadmap.md`](roadmap.md) |
| Phase 0 (스파이크·코어·측정) | **시작 전** ← §2 |
| Phase 1 (뷰어 MVP) | Phase 0 통과 후 |

---

## 2. Phase 0 안건 ★ 여기서 시작한다

모두 `exp/*` 브랜치에서. 제품 스캐폴딩(Phase 1)은 0-1 통과 후.

1. **0-1 IME 스파이크** (`exp/ime-spike`): Tauri 2.12 최소 앱에 `<textarea>` / CM6 plain / CM6 + replace 데코 세 편집면. 시나리오 ①–⑧([`roadmap.md`](roadmap.md#phase-0--스파이크와-코어-구현-전-검증))을 한국어 MS IME 새/이전(`HKCU\Software\Policies\Microsoft\InputMethod\Settings\KOR\ConfigureImeVersion`) × Win10 19045 / Win11에서 실측. **사용자가 직접 타이핑해야 하는 항목** — 에이전트는 앱과 체크리스트를 준비하고, 결과는 사용자가 기록
2. **0-2 바이트 보존 코어** (`exp/core` 또는 스파이크 브랜치의 `crates/mdeditor-core`): `FileDocument` 읽기/쓰기 + `samples/raw/*` 왕복 테스트(`git status` 깨끗) + 한 줄 편집 테스트 + CP949 손실 감지 테스트
3. **0-3 Windows 실측** (`exp/wpf-hello`): WPF + .NET 10 + WebView2 hello와 Tauri hello를 같은 PC에서 콜드/웜 시작·프로세스 트리 RSS 10회 중앙값. 측정 후 WPF 코드 폐기
4. **0-4 픽스처 보강**: 한글·공백·`[`·`#` 경로 이미지, 2 MB·10 MB 샘플 (`-text` 규칙 유지)
5. 결과를 [`decisions/ideas/20260929-stack.md`](decisions/ideas/20260929-stack.md) "Phase 0 결과 기록란"과 ASSET "Rules & numbers"에 기록 → 통과 시 Verdict `ADOPT`

## 3. Phase 0 통과 직후 할 일

1. Phase 1 스캐폴딩(`main`): tauri ≥ 2.12, Vite 6, vanilla TS, single-instance ≥ 2.4.5, `capabilities/`, `.gitignore`에 `node_modules/`·`dist/`·`src-tauri/target/`
2. `CLAUDE.md`의 `구조`·`빌드` 절 채우기
3. Phase 1 스펙을 `references/assets/20260929-typora-md-editors/system-spec.md`로 작성(EARS는 로드맵 표 재사용)
4. 이 문서 §1 표 갱신

## 4. 보류 중인 사용자 결정

- **RAG 캡처**: MVP(Phase 2) 완료 후 `capture-to-rag` 검토 (2026-09-29 사용자: "MVP완료하고")

## 5. 조사에서 나온 열린 질문 (Phase 0 실측 항목)

[`reference-brief.md` Open questions](references/assets/20260929-typora-md-editors/reference-brief.md#open-questions) 참조. 요약:

- WebView2 한국어 IME: #5625(150+에서 수정 추정)·tauri #15436·#5475가 두벌식에서 재현되는지
- NSIS 훅 등록이 Win11 '연결 프로그램' 추천 목록·기본 앱 설정에 실제로 노출되는지 (Phase 1-6)
- chardetng를 [UTF-8, EUC-KR]로 제한했을 때 짧은 `cp949.md` 정확도 (0-2)
- Typora 1.14.x가 `samples/raw`를 무편집 저장할 때 바꾸는 바이트 (레퍼런스 실측, 선택)
- Windows 콜드 시작·메모리 (0-3)
