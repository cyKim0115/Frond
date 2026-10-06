# Idea Evaluation — 인라인 라이브프리뷰 실험 (Phase 5)

- Date: 2026-10-06
- Idea id: `20261006-live-preview`
- Status: `draft` — 실험 구현 끝, 사용자 한글 IME 확인 대기
- Verdict: `(pending)` — IME ①–⑧ 통과하면 `ADOPT_WITH_CHANGES`(설정으로 켜는 실험 기능)로 main에 합치고, 못 지키면 `REJECT` → `archived-exp/live-preview`
- Related: [`roadmap.md`](../../roadmap.md) Phase 5 · [`plan.md`](../../plan.md) 단계 6 · 엔진 판정 [`20260929-editor-engine.md`](20260929-editor-engine.md) · MVP 범위 V3 [`../ideation/20260929-mvp-scope.md`](../ideation/20260929-mvp-scope.md) · 브랜치 `exp/live-preview`

## Proposal (user)

- 로드맵 Phase 5 "인라인 라이브프리뷰 — Typora처럼 렌더된 문서 위에서 바로 편집(캐럿 든 줄만 소스 노출)". 2026-10-06 사용자 위임(단계마다 진행, 검증할 것은 목록으로)

## Context

- Goal of this pass: CM6 데코레이션만으로(문서 텍스트는 그대로) 소스 편집기를 렌더된 문서처럼 보이게 하고, 한글 IME·바이트 보존을 깨지 않는지 본다
- Constraints: 로드맵 Phase 5 완료 조건 — V1 체크 전부 + 한글 IME 시나리오 ①–⑧ + 무편집 저장 바이트 불변. 못 지키면 제품 브랜치에 넣지 않는다

## 구현 (`exp/live-preview` `e678bad`)

- `src/live-preview.ts` — ViewPlugin 하나: 보이는 범위(`visibleRanges`)의 Lezer 구문 트리를 훑어
  - 숨김: 제목 `#`, 굵게·기울임·취소선 기호, 인라인 코드 백틱, 링크 `[`·`](주소)`, 인용 `>`, 이스케이프 `\`
  - 위젯: 이미지(문서 폴더 기준 asset URL, 깨지면 대체 글자), 체크박스(누르면 `[ ]`↔`[x]` 한 글자만 바꿈), 글머리 `•`, 구분선
  - 줄 꾸밈: 제목 크기(캐럿 줄에서도 유지 — 줄 높이가 출렁이지 않게), 인용선, 코드 블록 배경, 본문 글꼴
  - 캐럿·선택이 걸친 줄은 원문 그대로 → 입력(조합)이 위젯·숨김 옆에서 일어나지 않는다(시나리오 ⑧ 회피)
  - 조합 중(`view.composing`)에는 데코레이션을 다시 만들지 않고 변경만 옮긴다(map). `compositionend` 뒤 한 번 다시 만든다
  - front matter(`---`…`---`)와 주소 없는 `[글자]`는 꾸미지 않는다(렌더 파이프라인과 같게)
- 설정 편집 탭 **소스 표시 (실험)** = 원문 그대로(기본) / 라이브프리뷰. 소스·분할 모드의 편집기에 적용
- 아직 없는 것: 표·수식·Mermaid 블록 위젯, 표 셀 편집, 자동 링크 꾸밈

## Scores

| Axis | Result | Evidence |
|------|--------|----------|
| Feasibility | Pass | vitest 6건(숨김·위젯·캐럿 줄 원문·겹침 없음·체크박스 토글·문서 불변), 헤드리스 Edge 화면 |
| Direction fit | Partial | Typora 감각에 가깝다. 블록 위젯(표·수식·그림)이 없어 보기 모드와 아직 다르다 |
| Efficiency | (측정 전) | 보이는 범위만 훑는다. 10 MB에서 체감은 사용자 확인 |
| IME (게이트) | **사용자 확인 대기** | 자동 입력은 조합을 건너뛰어 근거가 안 된다 — [`next-session.md`](../../next-session.md) §2 I |

## Decision

- Verdict: `(pending)` — 사용자 IME 확인 뒤 정한다
- What we will do now: `exp/live-preview`에만 둔다. main에 합치지 않는다. 시험용 실행 파일(식별자 `com.cykim.frond.live`, 설치본과 따로 뜬다)을 빌드해 둔다
- What we will not do: 블록 위젯·표 셀 편집은 IME 게이트를 넘은 뒤에

## Follow-up

- Revisit when: 사용자 IME ①–⑧ 결과가 오면 — 통과면 main에 '실험' 설정으로 합치고 블록 위젯(수식·Mermaid·이미지 블록) 다음, 실패면 `archived-exp/live-preview`로 이름 바꿔 보관
- Logged in INDEX: yes
