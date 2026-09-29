# 다음 세션 인계

작성: 2026-09-28 · 갱신: 2026-09-29 (Phase 0 통과, Phase 1 진입 대기)
읽는 순서: [`CLAUDE.md`](../CLAUDE.md) → 이 문서 → [`roadmap.md`](roadmap.md) → [`decisions/ideas/INDEX.md`](decisions/ideas/INDEX.md)

이 문서는 **지금 열려 있는 것**을 담는다. 확정된 결정은 system-crew 형식으로 `decisions/`에 남기고 여기서 지운다.

---

## 1. 지금 어디까지 왔나

| 단계 | 상태 |
|---|---|
| 프로젝트 초기세팅 · system-crew 0.9.0 OnDemand | 완료 |
| 참고 조사 | 완료 — [`references/assets/20260929-typora-md-editors/`](references/assets/20260929-typora-md-editors/ASSET.md) |
| 기술 스택 | **확정 `ADOPT`** — Tauri 2 + Vite + vanilla TS ([`decisions/ideas/20260929-stack.md`](decisions/ideas/20260929-stack.md)). 2026-09-29 Phase 0 IME 스파이크 통과로 승격 |
| 에디터 엔진 | **확정** `ADOPT_WITH_CHANGES` — CodeMirror 6 ([`decisions/ideas/20260929-editor-engine.md`](decisions/ideas/20260929-editor-engine.md)) |
| MVP 범위 | **V1 리더 퍼스트** ([`decisions/ideation/20260929-mvp-scope.md`](decisions/ideation/20260929-mvp-scope.md)) = 로드맵 Phase 0–2 |
| 개발 계획 | 확정 — [`roadmap.md`](roadmap.md) |
| Phase 0 (스파이크·코어·측정·픽스처) | **완료 2026-09-29** — 결과는 [`decisions/ideas/20260929-stack.md`](decisions/ideas/20260929-stack.md) "Phase 0 결과 기록란". 코어는 main `crates/mdeditor-core`, 실험 앱은 `archived-exp/ime-spike`·`archived-exp/wpf-hello` |
| Phase 1 (뷰어 MVP) | **시작 전** ← §2 |

Phase 0 요약: 코어 테스트 23개 통과·`samples/raw` 무편집 저장 바이트 불변 / Tauri hello 371 ms vs WPF 732 ms / IME 시나리오 ①–⑧ 세 편집면 모두 통과(Win10 19045 새 IME, WebView2 153) / 경로·대용량 픽스처.

---

## 2. 다음 할 일 ★ Phase 1 스캐폴딩 (`main`)

사용자가 "Phase 1 시작"이라고 하면:

1. 스캐폴딩: tauri ≥ 2.12, Vite 6, vanilla TS, `tauri-plugin-single-instance` ≥ 2.4.5, `capabilities/` 최소 권한, `.gitignore`에 `node_modules/`·`dist/`·`src-tauri/target/`, 루트 Cargo 워크스페이스에 `crates/mdeditor-core` 포함
2. `CLAUDE.md`의 `구조`·`빌드` 절 채우기
3. Phase 1 스펙을 `references/assets/20260929-typora-md-editors/system-spec.md`로 작성(EARS는 로드맵 표 재사용)
4. 로드맵 1-2 ~ 1-7 순서대로. 스파이크에서 가져올 것: Vite `server.watch.ignored: ["**/src-tauri/**"]`(없으면 cargo가 쓰는 exe에 EBUSY로 dev가 죽음), CM6 테마에서 `.cm-cursor`·`.cm-selectionBackground` 색 지정(기본 검정 커서는 다크 모드에서 안 보임), `deco.ts`의 IME 가드·front matter 처리 패턴(Phase 5용)
5. 이 문서 §1 표 갱신

## 3. Phase 1 안에서 보강할 실측

- **1-7**: 이전 IME(`ConfigureImeVersion=1`)·Win11에서 IME 시나리오 재실측 (2026-09-29 사용자: Win10 새 IME 결과로 잠정 판정). 스파이크 앱 재사용: `git checkout archived-exp/ime-spike` → `cd spike/ime-spike` → `npm install` → `npm run spike`, 절차는 그 브랜치의 `spike/ime-spike/CHECKLIST.md`
- **1-6**: NSIS 훅 등록이 Win11 '연결 프로그램' 추천 목록·기본 앱 설정에 노출되는지

## 4. 보류 중인 사용자 결정

- **RAG 캡처**: MVP(Phase 2) 완료 후 `capture-to-rag` 검토 (2026-09-29 사용자: "MVP완료하고")
- **대용량 샘플 커밋 여부**: `samples/gen-large.ps1` 생성식으로 대체(저장소 12 MB 부담). 커밋을 원하면 `.gitignore`의 `samples/large/`를 빼면 된다
- **재부팅 직후 진짜 콜드 시작 측정**: 선택. `archived-exp/wpf-hello`의 `spike/measure/README.md`대로 1회
- **EOL 재대응 정책**: 편집한 줄은 자기 줄바꿈 유지, 새로 끼어든 줄만 지배 EOL (`crates/mdeditor-core/src/eol.rs` `remap`). 다른 정책을 원하면 그 함수만 바꾼다

## 5. 조사에서 나온 열린 질문 (갱신)

[`reference-brief.md` Open questions](references/assets/20260929-typora-md-editors/reference-brief.md#open-questions) 참조.

- ~~WebView2 한국어 IME 재현~~ → Win10 새 IME: ①–⑧ 통과, #15436·#5475 미재현. 이전 IME·Win11은 §3
- NSIS 훅 노출 (Phase 1-6)
- ~~chardetng 짧은 파일 정확도~~ → 121 B `cp949.md` 정확. 영문 위주에 한글 몇 자만 있는 파일은 Phase 2에서 픽스처 추가
- Typora 1.14.x 무편집 저장 바이트 (레퍼런스 실측, 선택)
- ~~Windows 콜드 시작·메모리~~ → 유휴 첫 실행 Tauri 383 ms / WPF 744 ms. 재부팅 콜드는 선택
