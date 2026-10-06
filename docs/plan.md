# Frond 계획표·로드맵

기준: 2026-10-06 · 정본은 할 일 상세 [`next-session.md`](next-session.md), Phase 정의 [`roadmap.md`](roadmap.md)다.
이 문서는 둘을 한 장으로 줄인 것이고, **날짜는 제안**이다.

---

## 1. 지금 위치

| 트랙 | 상태 | 남은 것 |
|---|---|---|
| Phase 0 스파이크·코어 | 완료 9/29 | — |
| Phase 1 뷰어 | 완료, 1-7 실기 통과 | 8번(Win11·이전 IME) — 환경 대기 |
| Phase 2 편집·저장 | 구현·에이전트 실기 끝 10/1 (B-1 실패 고침) | **사용자 B-2 한글 IME, B-9 탐색기 드래그** |
| V1 검수 (fidelity-report) | **SHIPPABLE 조건부** 10/6 (readonly 서브에이전트) | 조건 = B-2·B-9 통과 |
| 셸 트랙 S-1~S-4 (설정·테마) | 완료, 실기 닫음 10/1 | — |
| AI 앱 연동 (새 md 열기 훅) | 완료, 실기 닫음 10/1 | — |
| V1 보류 결정 D1~D7 | 정리 10/1, 구현 10/2 | D5(줄바꿈 변환·[비교])는 백로그 |
| 앱 아이콘 Hash Caret | 10/2 커밋. 10/6 색 변경(세이지 초록 배경·흰 커서)·재설치 완료 | — |
| 앱 이름 Frond (옛 MdEditor) | 10/6 결정·커밋, 설치 이전 완료(MdEditor 제거 → Frond, 데이터 폴더 이전 확인) | — |
| V2 범위 (단계 3) | **B 쓰임새 순** 10/6 (사용자 위임) | [`decisions/ideation/20261006-v2-scope.md`](decisions/ideation/20261006-v2-scope.md) |
| Phase 3 (단계 4) | **구현 완료 10/6** — 탭·세션 복원·분할 뷰·비교·폴더 트리·AI 훅 받은 목록 | 사용자 실기 [`next-session.md`](next-session.md) §2 G |
| Phase 4 (단계 5) | **구현 완료 10/6** — Mermaid·Alerts·KaTeX·HTML 내보내기·인쇄 손질, Shiki는 DEFER | 사용자 실기 [`next-session.md`](next-session.md) §2 H |
| Phase 5 (단계 6) | **실험 구현 10/6** — `exp/live-preview`(main 미병합) | 사용자 한글 IME [`next-session.md`](next-session.md) §2 I |
| 배포·수익화 (단계 7) | **결정 10/6** — Store MSIX + Durable add-on 선택 구매, 라이선스 MIT 확정. R-0 완료, **R-1(A-1~A-5) 구현 10/6** | 다음 R-2 MSIX [`store-launch.md`](store-launch.md) — 사용자 U-1 계정 유형·U-2 세무사, 실기 [`next-session.md`](next-session.md) §2 L |
| 웹사이트 (제품 페이지) | **결정 10/6, A-0~A-5 구현 10/6** — Astro 정적 `website/` + Cloudflare Workers, 설명서는 GitBook. 도메인 전엔 로컬에서 모양만 | [`website-launch.md`](website-launch.md) — 남은 A-6(실제 앱 장면), 사용자 확인 [`next-session.md`](next-session.md) §2 M, U-1 도메인·U-2 Cloudflare |

> **V1(MVP)은 사용자 확인 2건만 남았다.** 2026-10-06 사용자 지시로 이후 단계는 기다리지 않고 진행하고, 사용자 확인 항목은 [`next-session.md`](next-session.md) §2에 모은다.

---

## 2. 계획표

### 단계 1 — MVP 닫기 (10/6~10/9) — **에이전트 몫 완료 2026-10-06**, 사용자 B-2·B-9 대기

| # | 할 일 | 담당 | 선행 | 완료 조건 |
|---|---|---|---|---|
| 1 | B-2 한글 IME — 소스 모드에서 한글 입력, 조합 중 `Ctrl+S`·버튼 클릭·Alt+Tab, 자동 줄바꿈 경계, 선택 후 Backspace | **사용자** | — | 글자 유실·중복 없음. 조합 중 `Ctrl+S` 뒤 저장 표시가 사라졌는데 파일에 글자가 없으면 실패 |
| 2 | B-9 탐색기의 이미지 파일을 소스 모드에 끌어다 놓기 | **사용자** | — | 놓은 자리에 링크, 문서 옆 `assets/`에 복사본 |
| 3 | ~~새 아이콘 설치본 재설치~~ — 2026-10-06 완료 (V1.1 포함) | 에이전트 | — | 작업 표시줄·탐색기에 새 아이콘 |
| 4 | ~~`fidelity-report.md` 작성~~ — 10/6 [**SHIPPABLE 조건부**](references/assets/20260929-typora-md-editors/fidelity-report.md)(조건 B-2·B-9). 지적된 작은 빈틈·스펙 동기화도 같은 날 처리 | 에이전트 | 1, 2 | 1-7·Phase 2·셸 트랙 판정 `SHIPPABLE` |
| 5 | ~~MVP 닫기 문서~~ — 10/6 세 문서를 "V1 조건부 완료(B-2·B-9 대기)"로 맞춤. `v0.1.0` 태그는 B-2·B-9 통과 뒤(사용자 결정 §4) | 에이전트 | 4 | 세 문서가 "V1 완료"로 일치 |
| 6 | ~~`capture-to-rag`~~ — 10/6 rag `docs/assets/2026-10-06-mdeditor-v1-mvp-lessons.md`(`b47f31e`), Discord RAG ok | 에이전트 | 5 | rag 인박스 기록 + 디스코드 보고 |

1·2가 실패하면 고친 뒤 재설치하고 그 항목만 다시 본다. 실패 때 할 일은 fidelity-report Priority fixes 1·2.

### 단계 2 — V1.1 다듬기 (10/12~10/23) — **완료 2026-10-06** (사용자 요청으로 단계 1보다 먼저)

V1을 쓰면서 바로 체감되는 것부터. 순서는 결정 D5와 1-7 실기 결과를 따랐다.
결과: 1 `b61f359` · 2·3 `c2d8e52` · 4 `be5575b` · 5 `ff4829b` · 6 `620ab78`. 상세는 [`next-session.md`](next-session.md) "2026-10-06 작업". 설치본 재설치 2026-10-06 완료.

| # | 할 일 | 근거 | 크기 |
|---|---|---|---|
| 1 | **줄바꿈 변환 LF ↔ CRLF** — 상태바 줄바꿈 클릭, 코어에 "모든 줄 EOL 강제" API 추가 | D5 "변환 먼저", Phase 2-2에서 뺀 것 | 중 |
| 2 | 10 MB에서 어느 조작이 2 s를 넘는지 측정 (패널 토글·줌·스크롤) | next-session §4 | 소 |
| 3 | **큰 문서 블록 묶음** — 최상위 블록 100개씩 래퍼 + `content-visibility`, 묶음 경계 여백 겹침 처리 | 1-7 10 MB 조작 2 s+ | 중 (2 뒤) |
| 4 | 문서 영역 기본 메뉴의 '인쇄'도 1 MB 확인을 거치게 | 열린 질문 | 소 |
| 5 | 워드카운트 (CJK 1자 = 1단어) 상태바 표시 | 백로그 | 소 |
| 6 | (선택) 렌더 사소한 차이 — 슬러그 `a  b` → `a--b`, 각주 섹션 `data-line` | 렌더 리뷰 기록 | 소 |

완료 조건: vitest·cargo·`samples/raw` 무편집 왕복 통과 → 설치본 재설치 → 바뀐 항목만 실기.

### 단계 3 — V2 범위 결정 게이트 — **B로 진행 2026-10-06** (사용자 위임, 바꿀 수 있음)

V1 범위는 여기서 끝난다. 계속 갈지, 간다면 무엇부터인지 정한다 (`ideation` → `docs/decisions/ideation/`).
기록: [`decisions/ideation/20261006-v2-scope.md`](decisions/ideation/20261006-v2-scope.md). 실행 순서: 3-6 AI 훅 받은 목록 → 3-1 탭 + 3-5 세션 → 4-1 Mermaid·4-2 Alerts → 3-3 분할·3-4 비교·3-2 트리(단계 4 닫기) → 4-3 KaTeX·4-4 HTML·4-5 인쇄·4-6 Shiki(단계 5 닫기) → 단계 6.

| 안 | 순서 | 장점 | 단점 |
|---|---|---|---|
| A. 로드맵 그대로 | Phase 3 → Phase 4 | 계획과 같다 | Mermaid·내보내기가 늦다 |
| **B. 쓰임새 순 (추천)** | 탭 → Mermaid·Alerts → 분할 뷰·트리 → 내보내기·KaTeX | AI 훅이 md를 연달아 열면 지금은 앞 문서를 바꿔 버린다 → 탭이 가장 급하다. AI가 쓴 md에 Mermaid가 잦다 | Phase 경계가 섞인다 |
| C. V1에서 멈춤 | 다듬기·버그만 | 비용이 가장 적다 | 탭·다이어그램 없음 |

### 단계 4 — Phase 3 탐색 (10/26~11/13, V2) — **구현 완료 2026-10-06** (`v2` 브랜치 → main), 사용자 실기 대기

결과: 3-6 `ba7dca4` · 3-1·3-5 `0601a95`(+ 메모리 상한 `3ede4d0`) · 3-3 `c71d978` · 3-4 `16813b0` · 3-2 `db371fe` · 4-1·4-2 `38704e5`. 실측: 2,000줄 문서 편집 → 분할 뷰 미리보기 갱신 51~89 ms(대기 120 ms 뺀 값, 헤드리스 Edge), 탭 20개(보통 문서) +116 MB · 10 MB 문서 탭 하나 +550 MB(디버그 빌드) → 큰 문서는 최근 2개만 보기 화면을 남긴다. 실제 앱(식별자 분리 디버그 빌드, CDP)에서 탭·뒤 탭 조용히 다시 읽기·편집 중 탭 배너·사라짐/복귀·세션 복원(모드·줄)·AI 훅 목록·비교(고르기 → 충돌 없이 저장)·트리 갱신 확인. 사용자 확인 목록은 [`next-session.md`](next-session.md) §2 G.

| # | 할 일 | 완료 조건 |
|---|---|---|
| 3-6 | **AI 훅 문서 받은 목록** (10/6 사용자 요청, 3-1보다 먼저) — 훅만 `--from-hook` 표식을 붙여 구별, 보던 문서를 바꾸지 않고 탐색 영역 '새 문서' 탭·상태바 배지에 쌓는다. 설계: [`roadmap.md`](roadmap.md) Phase 3 · 3-6 | 보던 중 훅이 와도 문서·스크롤 그대로, 창이 앞으로 안 옴. 탐색기 더블클릭은 지금처럼 |
| 3-1 | 탭 — 문서당 CM6 state 보존. single-instance로 들어온 파일은 새 탭(AI 훅 문서는 3-6 설정에 '뒤 탭으로 열기' 추가) | 탭 20개에서 메모리 상한 확인 |
| 3-2 | 폴더 트리 + 목차 동시 표시, 파일 트리 감시 (notify recursive) | 외부에서 파일 추가·삭제 시 트리 갱신 |
| 3-3 | 분할 뷰 (소스 \| 미리보기) + `data-line` 스크롤 동기 | 2,000줄 문서 편집 → 미리보기 갱신 < 100 ms |
| 3-4 | 외부 변경 배너 [비교] — 분할 뷰 위의 diff (D5) | 디스크 ↔ 편집 중 차이 표시 |
| 3-5 | 세션 복원 (열린 탭·스크롤 위치) | 재시작 후 같은 탭·위치 |

### 단계 5 — Phase 4 확장 렌더·내보내기 (11/16~12/4, V2) — **구현 완료 2026-10-06**, 사용자 실기 대기

결과: 4-1·4-2 `38704e5` · 4-3 `0332fea` · 4-4·4-5 `fda852c` · 4-6 `0d1307d`(판정 DEFER). 지연 로드 청크: Mermaid tiny 2.8 MB·KaTeX 262 KB·내보내기 79 KB(시작 번들 밖). Shiki 실측(10개 언어): 번들 886 KB vs highlight.js 67 KB, TS 300줄 강조 81.7 ms vs 3.2 ms → 유지([`decisions/ideas/20261006-shiki.md`](decisions/ideas/20261006-shiki.md)). 사용자 확인 목록은 [`next-session.md`](next-session.md) §2 H.

| # | 할 일 |
|---|---|
| 4-1 | Mermaid (tiny, `securityLevel strict`, 지연 로드) |
| 4-2 | GitHub Alerts (`> [!NOTE]` 등) |
| 4-3 | KaTeX (`$`·펜스 감지 시 지연 로드, 폰트 번들) |
| 4-4 | HTML 내보내기 (테마 CSS 인라인, 이미지 상대 경로/base64 선택) |
| 4-5 | PDF — `window.print()` + 인쇄 CSS (`@page`, 코드 블록 배경, 긴 `pre`에 `break-inside: avoid` 금지) |
| 4-6 | (검토) highlight.js → Shiki dual theme |

### 단계 6 — Phase 5 인라인 라이브프리뷰 (12월~, 실험·선택) — **실험 구현 2026-10-06**, IME 게이트 대기

`exp/live-preview` `e678bad`: 설정 편집 탭 '소스 표시 (실험)'으로 켜면 캐럿 없는 줄의 서식 기호를 숨기고 이미지·체크박스·글머리·구분선을 위젯으로 그린다(문서 텍스트 불변). 조합 중에는 데코레이션을 다시 만들지 않는다. 표·수식·Mermaid 블록 위젯은 아직 없다. 시험용 실행 파일 `C:\Users\cykim\repo\MdEditor\target\exp-live\FrondLive.exe`(식별자 `com.cykim.frond.live` — 설치본과 따로 뜬다). 판정 기록 [`decisions/ideas/20261006-live-preview.md`](decisions/ideas/20261006-live-preview.md).

`exp/live-preview` 브랜치에서만. 한글 IME 시나리오 ①–⑧과 무편집 저장 바이트 불변을 못 지키면 머지하지 않고 `archived-exp`로 보낸다.

### 단계 7 — 배포·수익화 (Store MSIX + 선택 구매) — **계획 2026-10-06**, 오늘 할 일 [`store-launch.md`](store-launch.md)

결정: [`decisions/ideas/20261006-store-monetization.md`](decisions/ideas/20261006-store-monetization.md) · [`decisions/ideas/20261006-license.md`](decisions/ideas/20261006-license.md). 트랙 정의는 [`roadmap.md`](roadmap.md) "배포 트랙".
무료로 다 쓰고, Store add-on 하나로 사용자 테마 만들기·구매자 전용 테마를 해금한다. 비구매자에게는 드물게 구매 권유. 초기 비용 0원(판매 때 Store 15%).

| # | 할 일 | 담당 | 선행 | 완료 조건 |
|---|---|---|---|---|
| R-0 | ~~LICENSE(MIT)·`TRADEMARKS.md`·결정 기록·이 계획~~ — 10/6 완료 | 에이전트 | — | — |
| U-1 | 계정 유형(개인 / 사업자등록 + 회사 계정) — 개인 → 회사 전환 불가 | **사용자** | — | 첫 공개 제출 전 |
| U-2 | 세무사 상담(한국분 부가세·사업 개시일·원천징수·겸업) | **사용자** | — | 첫 유료 판매 전 |
| R-1 | ~~A-1 설치 방식 판정 → A-2 추천 테마 카탈로그 분리 → A-3 권리 판정·테마 게이트·정보 탭 → A-4 구매 권유 → A-5 개인정보처리방침·설명문~~ — 10/6 구현(단위 테스트 통과, 실제 앱 무료 ↔ 구매자 전환은 next-session §2 L-4) | 에이전트 | [`frond-rename.md`](frond-rename.md) 먼저 | 개발용 공급자로 무료 ↔ 구매자 전환 확인 |
| R-2 | MSIX 로컬 패키지 + MSIX 분기 | 에이전트 | A-1 | 로컬 MSIX 설치본 실기 |
| R-3 | Store Private 제출·add-on·Store 공급자 | 에이전트 + 사용자(가입) | R-2, U-1 | 프로모션 코드로 해금·복원 |
| R-4 | 가격·공개 | **사용자** | V1 닫기, U-2 | Store Public |

### 상시 — 환경이 생기면

- Win11·이전 IME(`ConfigureImeVersion=1`) 실측 — 1-7 8번, IME 시나리오 ①–⑧
- Win11에서 설치기 훅 노출 (연결 프로그램 추천 목록·기본 앱 설정)
- WebView2 2주 릴리스마다 IME 스모크 테스트
- 모든 단계: `samples/raw` 무편집 왕복 바이트 불변

---

## 3. 로드맵

```
           10/5  10/12 10/19 10/26 11/2  11/9  11/16 11/23 11/30 12/7~
V1 MVP     [==]
V1.1             [==========]
Gate                         *
Phase 3                      [================]
Phase 4                                        [================]
Phase 5                                                          [.....
```

| 마일스톤 | 목표 | 내용 | 버전 (제안) |
|---|---|---|---|
| M1 V1 MVP 완료 | 10/9 | 뷰어 + 편집·저장 + 설정·테마 | v0.1.0 |
| M2 V1.1 | 10/23 | 줄바꿈 변환·큰 문서 개선 | v0.2.0 |
| M3 V2 범위 결정 | 10/23 | 단계 3 게이트 | — |
| M4 탭·분할 뷰 | 11/13 | Phase 3 | v0.3.0 |
| M5 다이어그램·내보내기 | 12/4 | Phase 4 | v0.4.0 |
| M6 라이브프리뷰 | 미정 | Phase 5 실험 | — |
| M7 Store 출시 | 미정 (U-1·U-2·V1 닫기 뒤) | 배포 트랙 R-1~R-4 — MSIX + 선택 구매 | 공개 시점 버전 |

날짜는 지금까지 속도(Phase 0~2·셸 트랙 구현이 9/29~10/2 나흘)에 사용자 실기 대기 시간을 더해 잡은 제안이다. 단계 3에서 B안을 고르면 M4·M5 내용이 섞인다.

---

## 4. 사용자에게 필요한 것

1. **B-2 한글 IME**, **B-9 탐색기 드래그** 실기 — MVP를 닫는 유일한 조건 (fidelity-report의 조건)
2. ~~새 아이콘 설치본으로 재설치~~ — 2026-10-06 완료
3. ~~단계 3 — V2 방향 (A·B·C)~~ — 사용자 위임으로 B 진행. 바꾸려면 말하기
4. (선택) 버전 태그를 `v0.1.0`부터 붙일지 — B-2·B-9 통과 뒤
5. 단계마다 쌓이는 실기 목록 — [`next-session.md`](next-session.md) §2 G(단계 4)·H(단계 5)·I(단계 6 라이브프리뷰 IME)
6. 라이브프리뷰(단계 6)를 main에 넣을지 — §2 I의 한글 IME 결과로 정한다
7. **단계 7 Store 출시** — U-1 계정 유형(개인 / 사업자등록 + 회사), U-2 세무사 상담, U-3 테마 폴더 위치(말이 없으면 `Documents\Frond\themes`), 나중에 가격. 상세 [`store-launch.md`](store-launch.md)

하지 않는 것(크로스플랫폼·노트 앱 기능·플러그인·MSI·Store EXE 제출·사이드로드 MSIX·임의 CSS 테마·클라우드 동기화)은 [`roadmap.md`](roadmap.md) 그대로다. MSIX는 2026-10-06 Store 배포용으로만 하기로 바꿨다.
