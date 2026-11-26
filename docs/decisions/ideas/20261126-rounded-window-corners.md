# Idea Evaluation

- Date: 2026-11-26
- Idea id: `20261126-rounded-window-corners`
- Status: `decided`
- Verdict: `ADOPT`
- Related: `src-tauri/src/lib.rs`(창 빌더), `src/style.css` '창 틀', `src/frame.ts`, `src/theme/print.css`, rag `docs/assets/2026-11-26-win10-rounded-corners-transparent-css-card.md`

## Proposal (user)

- unity-slot-widget에서 한 둥근 모서리 처리를 Frond에도 적용한다(2026-11-26 사용자 지시).

## Context

- Goal of this pass: 테두리 없는(`decorations(false)`) 창의 각진 모서리를 Win10에서도 둥글게.
- Constraints: Win10(19045)에는 DWM 둥근 모서리가 없다. 색은 테마 토큰만 쓴다. 인쇄·HTML 내보내기는 셸을 쓰지 않아야 한다.

## Scores

| Axis | Result (Pass / Partial / Fail) | Evidence |
|------|--------------------------------|----------|
| Feasibility | Pass | unity-slot-widget `f2333a0`에서 같은 Tauri 2·WebView2로 Win10 확인(6배 확대 캡처·최대화·`WM_NCHITTEST`) |
| Direction fit | Pass | 제목 표시줄을 이미 페이지가 그린다(`titlebar.ts`) — 창 틀도 페이지 몫 |
| Efficiency | Pass | Rust 두 줄 + CSS 한 절 + 여백 크기 조절 74줄 |

## Alternatives considered

| Alternative | Pros | Cons | Better when |
|-------------|------|------|-------------|
| **투명 창 + `shadow(false)` + CSS 둥근 카드** (채택) | 모서리 매끄러움, Win10·Win11 같은 모양 | 투명 여백 8px가 클릭을 먹음(→ 크기 조절 테두리로 씀), Aero Snap 반쪽 붙이기 때 틈 | Win10을 지원하는 무테 창 |
| `DwmSetWindowAttribute(DWMWA_WINDOW_CORNER_PREFERENCE)` | OS가 그림 | Win10에서 효과 없음 | Win11 전용 앱 |
| `SetWindowRgn(CreateRoundRectRgn)` | 여백 없음 | 계단 모서리, DWM 그림자 사라짐, 크기 바뀔 때마다 다시 걸기 | — |
| 투명 + Tauri 기본 `shadow(true)` | 그림자를 OS가 그림 | 투명 모서리 뒤로 사각 그림자·1px 흰 테두리 | — |

## Decision

- Verdict: `ADOPT`
- What we will do now: 창을 투명·그림자 없음으로 만들고, `body` 여백 8px 안에 `#app`을 반지름 8px 불투명 카드(1px `--line` 선 + 옅은 그림자)로 그린다. 최대화하면 `<html data-frame="flat">`로 여백·모서리·그림자를 없앤다. 여백은 `startResizeDragging` 크기 조절 테두리(모서리 16px는 두 방향, 커서도 바꿈). 팝업 배경 어둡게 하기는 카드 안만, 인쇄는 틀을 푼다.
- What we will not do: Win11 DWM 경로를 따로 두지 않는다(그림자 없는 무테 창은 Win11에서도 OS가 둥글리지 않아 이중 둥글림 없음 — Tauri 문서 기준, 직접 확인 안 함). 반투명·블러 배경은 쓰지 않는다.

## Follow-up

- Spec / implementation owner: 에이전트(2026-11-26 구현). 사용자 실기 `docs/next-session.md` §2 O
- Revisit when: Aero Snap 틈이 거슬리면 스냅 상태를 알아내 여백을 없애는 방법을 본다
- Logged in INDEX: yes
