# Idea Evaluation — V1 보류 결정 일괄 정리 (사용자 위임)

- Date: 2026-10-01
- Idea id: `20261001-v1-open-decisions`
- Status: `decided`
- Verdict: 항목별 (아래 표)
- Related: `docs/next-session.md`(구 §4 "보류 중인 사용자 결정"), `src/render/index.ts`, `crates/mdeditor-core/src/eol.rs`, `docs/roadmap.md` 백로그

## Proposal (user)

- 2026-10-01 실기 테스트 보고와 함께: "보류중인 사용자 결정은 너가 알아서 해줘바" — next-session §4의 결정 6건을 에이전트가 정한다.
- 같은 보고의 1-7 A-2: 10 MB 문서는 조작에 2초 이상 지연, `Ctrl+P` 인쇄 미리보기는 10 MB에서 너무 오래 멈춰 강제 종료했고 2 MB도 내용이 보이기까지 오래 걸린다. "그정도 대용량을 프린트 할일은 없을듯" → 인쇄 가드(D7)를 같이 정한다.

## Context

- Goal of this pass: V1(MVP)을 닫기 전에 열린 결정을 없애고, 구현이 필요한 것은 다음 작업으로 넘긴다.
- Constraints: 개인용 로컬 뷰어·편집기(남의 파일도 열 수 있음 → 렌더 안전은 유지), 바이트 보존 원칙, DOMPurify가 이미 파이프라인 끝에 있다.

## Decisions

| # | 항목 | Verdict | 정한 것 | 이유 |
|---|------|---------|---------|------|
| D1 | 원문 HTML 태그 | `ADOPT_WITH_CHANGES` | **허용 목록 태그만** 렌더한다: `details` `summary` `img` `br` `kbd` `sub` `sup` `mark` `ins` `del` `s` `u` `abbr` `div` `p` `span` `a` `table` `thead` `tbody` `tr` `th` `td` `hr`. 속성은 `align` `width` `height` `alt` `title` `href` `src` `open` `colspan` `rowspan`만. `style`·이벤트 속성·`script` `style` `iframe` `object` `embed` `form` `input` `svg`는 버린다. **목록에 없는 태그는 지금처럼 글자 그대로** 둔다. `img src`·`a href`는 마크다운 링크·이미지와 같은 재작성(스킴 허용 목록, 상대 경로 → `toAssetUrl`)을 거친다 | README류 문서의 `<details>`·`<img width>`·`<br>`·`<kbd>`가 글자로 보이는 게 가장 큰 GitHub 차이다. GitHub처럼 모르는 태그를 지우면 산문 속 `List<String>`이 사라지므로, 목록 밖 태그는 이스케이프가 더 낫다. DOMPurify가 이미 있어 이중 방어 |
| D2 | `www.example.com` 자동 링크 | `ADOPT` | GFM 확장 autolink 범위만: **`www.`로 시작하는 주소**를 링크로. 스킴도 `www.`도 없는 맨 도메인(`paths.md`, `example.com`)은 계속 글자 | GFM 스펙과 같아지고, 파일명 오탐(이 결정을 미뤘던 이유)은 그대로 막힌다. linkify-it에는 `www.` 전용 옵션이 없다 → `fuzzyLink`를 켜고 원문이 `www.`로 시작하지 않는 스킴 없는 매치를 버리는 방식 |
| D3 | 대용량 샘플 커밋 | `REJECT` | 커밋하지 않는다. `samples/gen-large.ps1` 생성 스크립트와 `.gitignore`의 `samples/large/` 유지 | 10 MB 텍스트가 히스토리에 영구히 남는다. 스크립트로 언제든 같은 파일을 만든다 |
| D4 | EOL 재대응 정책 | `ADOPT` (현행 유지) | 편집한 줄은 자기 EOL 유지, 새 줄만 문서 지배 EOL (`eol.rs` `remap`) | 바이트 보존(diff가 고친 줄에만)과 맞는다. 실기 B-3이 최종 확인 |
| D5 | Phase 2에서 뺀 것 | `DEFER` | 백로그 유지. 순서: **줄바꿈 변환(LF↔CRLF)** 먼저(코어에 전체 EOL 강제 API 추가), 외부 변경 배너 **[비교]**는 Phase 3 분할 뷰 때 | 변환은 상태바 표시와 짝이라 요구가 바로 생긴다. 비교는 diff 뷰 UI가 필요해 분할 뷰와 묶는 게 싸다 |
| D6 | RAG 캡처 시점 | `ADOPT` | MVP를 닫을 때(B·C 실기 통과 + fidelity-report) 에이전트가 **묻지 않고** `capture-to-rag`를 실행한다. 범위: 스택·엔진 판정, Phase 0 IME 결과, 바이트 보존 코어 설계, CDP 실제 앱 E2E 기법, 테마 토큰 형식·팔레트→테마 파생 | 사용자가 "MVP완료하고"로 시점을 정했고, 이번에 실행 판단을 위임했다 |
| D7 | 큰 문서 인쇄 (A-2 실기) | `ADOPT` | `Ctrl+P`를 앱이 가로챈다. 문서가 큰 문서 모드(2 MB 초과)면 확인 팝업 "큰 문서는 인쇄 미리보기가 오래 멈추거나 응답하지 않을 수 있습니다" [계속 / 취소], 기본 포커스는 취소. 작은 문서는 지금처럼 바로 인쇄 | 사용자는 대용량을 인쇄하지 않는다. 막는 목적은 강제 종료로 편집 중 내용을 잃는 사고 방지 |

## Scores

| Axis | Result | Evidence |
|------|--------|----------|
| Feasibility | Pass | D1·D2는 `src/render/index.ts` 안(markdown-it 렌더 규칙·linkify 후처리), D7은 `main.ts` 키 처리 + `showChoice` |
| Direction fit | Pass | GitHub 렌더와의 차이를 줄이되 안전·바이트 보존 원칙은 유지 |
| Efficiency | Pass | 각 작업 반나절 이하. 새 의존성 없음 |

## Alternatives considered

| Alternative | Pros | Cons | Better when |
|-------------|------|------|-------------|
| D1 `html: true` + DOMPurify만 (GitHub 방식) | 구현 한 줄 | 산문 속 `<T>` 같은 글자가 사라진다 | 원문을 GitHub과 똑같이 보여야 할 때 |
| D1 현행 유지(`html: false`) | 가장 안전 | `<details>`·`<img width>`가 글자로 보인다 | 남의 문서를 주로 열 때 |
| D2 맨 도메인까지 자동 링크 | 더 많이 링크 | `paths.md`·`a.md` 오탐 | 없음 |
| D7 큰 문서 인쇄 금지 | 단순 | 정말 필요할 때 막힌다 | — |

## Follow-up

- 구현 순서는 `docs/next-session.md` "에이전트 다음 할 일"
- D1 구현 때 `samples/showcase.md`에 허용·비허용 태그 예시 절을 더하고 vitest로 이스케이프·속성 제거를 고정한다
- D7의 10 MB 조작 지연(2 s+)은 별도 — 로드맵 백로그 "큰 문서 블록 묶음"
