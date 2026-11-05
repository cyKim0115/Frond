# Reference Brief

- Date:
- Similarity target: faithful | inspired
- Asset id: (docs/references/assets/… 와 동일)
- Sources: (URLs, game titles, timestamps, clips)

## User callouts

사용자가 직접 짚은 포인트 (타임스탬프·문장·UI). 에이전트 관찰과 섞지 않는다.

| # | Callout | Where | Intent |
|---|---------|-------|--------|
| 1 |         |       |        |

## Evidence ledger

관찰의 **근거·방법·신뢰도**를 한 줄씩 남긴다. 아래 표들의 `Ev#`가 이 표를 가리킨다.

Method:
- `seen` — 영상/플레이에서 직접 봄
- `frame-step` — 프레임 단위 스텝 (절차를 Note에 적음: 추출 fps, 구간, 기준 신호)
- `tool` — 계측 도구·리포트·텔레메트리
- `doc` — 공식 자료·위키·패치노트
- `hypothesis` — 추정 (수치는 범위로)

| Ev# | Source | t (s) / frame | Observation | Method | Confidence 0–1 | Note |
|-----|--------|---------------|-------------|--------|----------------|------|
| E1  |        |               |             |        |                |      |

- 프레임 카운트가 필요하면 LLM은 **구간 찾기·라벨링**까지만 한다. 카운팅은 `frame-step` 절차(ffmpeg 추출 → 스텝)를 적고 사람 또는 호스트 도구가 수행한다. 팩은 파이프라인 코드를 싣지 않는다.
- 히트스탑·정지는 "멈춤"만으로 판정하지 않는다. 히트 스파크·HP 변화·카메라 등 **신호 2개 이상**을 근거로 적는다.
- 영상 샘플링 도구를 쓸 때는 fps를 고정하고 구간을 클리핑한다 (기본 1 fps 샘플링은 빠른 동작을 놓친다).

## Observed player verbs

-

## Core loop

1.
2.
3.

## Rules & numbers

| Item | Value / range | Ev# | Method / Confidence |
|------|---------------|-----|---------------------|
|      |               |     |                     |

## Timing & feel

| Aspect | Observation | Ev# |
|--------|-------------|-----|
| Input → response (지연, 버퍼) |  |  |
| ADSR envelope (attack / decay / sustain / release) |  |  |
| Anticipation / active / recovery |  |  |
| Hitstop / freeze |  |  |
| Camera (shake / zoom / follow) |  |  |
| Feedback layers (sound / particle / flash / shake / hitstop / knockback / tween / number-pop 중 관찰된 것) |  |  |

- juice·흔들림·히트스탑 **강도**는 측정 표준이 없다. 수치화하면 `hypothesis`로 두고, 참고 클립과 A/B로 검증한다.
- `inspired`면 이 표는 "참고에서 무엇이 체감을 만들었나"를 적는 용도이며, 그대로 재현 목표가 아니다.

## UI / feedback

-

## States & edge cases

-

## Explicit non-goals (this pass)

-

## Adaptation notes (for current project)

-

## Open questions

-

## Status

- Analyst status: `READY` | `NEEDS_CALLOUT` | `BLOCKED`
- Ready for implementation: yes / no
