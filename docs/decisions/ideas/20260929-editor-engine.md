# Idea Evaluation — 에디터 엔진·편집 아키텍처

- Date: 2026-09-29
- Idea id: `20260929-editor-engine`
- Status: `decided` — 2026-09-29 사용자 승인
- Verdict: `ADOPT_WITH_CHANGES` — CodeMirror 6 + 자체 라이브프리뷰 데코레이션 + 에디터 밖 바이트 보존 계층. MVP V1에서는 CM6 plain 소스 모드까지, 데코레이션은 Phase 5
- Related: [`20260929-stack.md`](20260929-stack.md) · [`docs/references/assets/20260929-typora-md-editors/reference-brief.md`](../../references/assets/20260929-typora-md-editors/reference-brief.md) E·G 절 · [`docs/decisions/ideation/20260929-mvp-scope.md`](../ideation/20260929-mvp-scope.md)

## Proposal (user)

- "제일 레퍼런스로 삼고싶은것은 typora" — 렌더된 문서 위에서 바로 편집하는 인라인 하이브리드 UX를 목표로 두되, 무편집 저장 시 바이트 불변(`samples/raw/`)을 깨지 않는 엔진을 고른다.

## Context

- Goal of this pass: WebView2 안에서 쓸 편집 엔진과, 바이트 보존을 어디서 책임질지 결정
- Constraints: 바이트 보존 하드 요구 · 한국어 IME · 2 MB급 파일 · MIT/Apache 계열 라이선스 선호 · vanilla TS

## Scores — CodeMirror 6 + 자체 데코레이션 (Obsidian Live Preview 방식)

| Axis | Result | Evidence |
|------|--------|----------|
| Feasibility | **Pass** | 소스 텍스트가 문서 자체라 재직렬화가 없음(E14·E15). Obsidian이 같은 방식으로 상용 Live Preview 구현(O21·E14). MIT 공개 구현 6종이 같은 골격(ViewPlugin 마크 숨김 + StateField block 위젯)을 공유 — SoloMD `cm-live-render/blocks/ime-guard`, SilverBullet, codemirror-live-markdown, typora-lite (G9–G11). @lezer/markdown GFM 내장(E6). 뷰포트 렌더링으로 대용량 유리(E11). 번들 ~119 KB gz(E13) |
| Direction fit | **Pass** | 바이트 보존: 무편집 저장은 원본 바이트, 편집 시 변경 줄만 새 EOL(E1·E15). Typora식 "캐럿 진입 시 소스 노출" UX 재현 가능(E14). MVP(V1)는 CM6 plain 소스 모드로 시작하고 데코레이션 계층은 후속 Phase로 얹을 수 있어 MVP 3안 모두와 호환 |
| Efficiency | **Partial** | 이득: 엔진 교체 없이 V1→V3 누적. 비용: (1) Typora식 블록 렌더(표·이미지·수식·Mermaid 위젯)를 직접 구현 — 단 패턴 차용 가능(G9·G10). (2) 각주 확장 자체 구현(E6). (3) IME: 조합 중 데코 재빌드 금지·compositionend 후 flush(E10·G9), 자모 단위 트랜잭션 debounce(G18), `autocorrect="off"` 기본이라 WebView2 <150에서 149 회귀에 걸림(G2) → 최소 150 또는 플래그. (4) `state.doc.toString()`은 항상 `\n`이므로 저장 경로는 `sliceDoc()` + 줄별 EOL 맵(E1). (5) @codemirror/view 최신 핀 필수(G12), 이슈 추적은 code.haverbeke.berlin(E12) |

## Alternatives considered

| Alternative | Pros | Cons | Better when |
|-------------|------|------|-------------|
| **CM6 + 자체 데코레이션 (권고)** | 위 참조 | 위 참조 | 바이트 보존이 하드 요구일 때 |
| Milkdown 7.22 / Crepe (ProseMirror + remark) | Typora에서 영감, GFM 프리셋에 각주·표·작업 목록, KaTeX(Crepe latex feature), Markra가 제품 수준 실증(O11) | 재직렬화 — 빈 줄 접힘은 `<br/>` 우회, 유지보수자 "원문 보존은 목표 아님"(E2). 한 글자만 고쳐도 전체 재직렬화라 "변경 줄만 쓰기" 불가(E15). 100 KB+ 성능 저하 보고(E11), ~460 KB gz(E13). 2026-09 Windows IME 패치 반복(O11) | 바이트 보존을 포기하고 WYSIWYG 완성도만 볼 때 |
| Tiptap 3.31 + @tiptap/markdown | 최대 생태계 | 이스케이프 소실 #8134 open, 표 파이프 손실 #8294 미배포(E3), 셀당 자식 1개, 한국어 IME 이슈 다수(E8) | 채택 근거 없음 |
| Vditor 4.0 (Lute) IR 모드 | Typora와 가장 닮은 기성품, 한국어 로케일, MIT | Lute 포매터가 CRLF→LF·공백·번호 정규화, `getValue()`가 무편집에도 변형(E5) | UX 데모 참고만 |
| Muya (@muyajs/core) | MarkText UX 그대로 | 아카이브·모노레포 흡수, 스펙 적합률 87.7%, 재직렬화(O17) | 채택 근거 없음 |
| Monaco / hidden textarea·EditContext 입력 | contentEditable TSF 경로 회피(G7), Markpad 실사용(ASSET 표) | 인라인 라이브프리뷰 불가, 번들 큼 | IME 스파이크에서 CM6가 실패했을 때 소스 모드 대안 |
| WPF AvalonEdit + WebView2 프리뷰 (분할) | 네이티브 편집 위젯 = WebView2 IME 무관(O19) | 스택 변경(WPF), 인라인 프리뷰 없음 | 스택 판정이 WPF로 뒤집힐 때 |
| Lexical / MDXEditor / BlockNote / Editor.js / Slate / TOAST UI | — | React 종속·lossy 변환·아카이브(E4·E12) | 채택 근거 없음 |

## Decision

- Verdict: `ADOPT_WITH_CHANGES` (승인 2026-09-29, 배치 승인 항목 2)
- What we will do now: Phase 0 스파이크에 `<textarea>` / CM6 plain / CM6 + replace 데코 세 구성을 넣어 한국어 IME 시나리오 ①–⑧ 실측. Phase 2에서 CM6 plain 소스 모드 + `FileDocument` 계층 구현
- What we will not do: ProseMirror 계열·Vditor·Muya를 편집 엔진으로 도입. Typora 렌더 DOM을 contentEditable로 직접 편집하는 자체 엔진 작성
- Modified approach:
  1. **계층 분리**: `FileDocument`(Rust: 원본 바이트, 인코딩, BOM, 줄별 EOL 맵, 끝 개행) ↔ `EditorState`(CM6, LF 정규화 텍스트). 저장 시 dirty 아니면 원본 바이트, dirty면 `sliceDoc()` 줄 배열을 EOL 맵으로 재결합(변경·추가 줄은 파일 지배 EOL) → 재인코딩 → `ReplaceFileW`
  2. **단계적 UX**: Phase 2에서 CM6 plain 소스 모드(`Ctrl+/`), Phase 5에서 라이브프리뷰 데코레이션(ViewPlugin 인라인 마크 숨김은 `visibleRanges`, block 위젯은 StateField). 캐럿이 닿은 줄/노드는 원문 노출
  3. **IME 규칙**: `view.composing` 또는 `input.type.compose` 트랜잭션이면 데코 재빌드 대신 map(G9·G10), compositionend 후 flush. 자동 저장·프리뷰 갱신은 compositionend 기준 debounce. 모든 단축키 `KeyboardEvent.isComposing` 가드(G18). `@codemirror/view` 최신 핀, WebView2 ≥ 150 또는 `TSFHonorAutocorrectOff` 비활성 플래그(G2·G6)
  4. **GFM**: @lezer/markdown GFM + 각주 확장 자체 구현(E6). 렌더 뷰는 markdown-it(스택 판정 6항)과 데코레이션 뷰가 공존 — 두 파서의 방언 차이는 픽스처로 회귀 관리
  5. **참고 구현 라이선스**: SoloMD·SilverBullet·codemirror-live-markdown·typora-lite(MIT)에서 패턴 차용, Zettlr(GPL)·Markra(AGPL)는 설계 참고만

## Follow-up

- Spec / implementation owner: Implementer (Phase 2 소스 모드, Phase 5 라이브프리뷰)
- Revisit when: IME 스파이크에서 CM6가 실패(→ textarea/EditContext 또는 Monaco) · code.haverbeke.berlin 이전 후 릴리스 정체 시 · MarkText 0.20 Muya TS 재작성이 round-trip identity를 달성했다고 확인될 때
- Logged in INDEX: yes
