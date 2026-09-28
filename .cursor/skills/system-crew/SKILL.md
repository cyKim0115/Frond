---
name: system-crew
description: >-
  On-demand game-system crew: turn user descriptions, reference videos/games,
  playtest feedback, and design constraints into game systems (Producer →
  Analyst → Implementer → Fidelity QA), evidence-backed reference assets,
  objective idea evaluation, metric-driven tuning loops, feedback issue cards,
  and constrained ideation (user picks). Scales ceremony (quick / standard /
  full), splits mixed prompts into ordered Stages, declines out-of-protocol asks
  (skill docs, tooling-only) and reroutes. Use ONLY when the user explicitly
  invokes system-crew / 시스템 크루 / Producer / Systems Analyst / 참고 재현 /
  reference asset / 아이디어 평가 / tuning / feedback 카드 / ideation, or asks
  to build a system from a reference. Do not use for ordinary feature work.
---

# system-crew (on-demand)

이 스킬이 호출되었을 때만 system-crew 프로토콜을 적용한다.  
평소 프로젝트 룰·워크플로를 덮어쓰지 않는다.

## 활성화 시 따를 것

1. `.cursor/system-crew/AGENTS.md`
2. `.cursor/system-crew/workflows/from-reference.md`
3. `.cursor/system-crew/workflows/reference-assets.md`
4. `.cursor/system-crew/workflows/idea-evaluation.md`
5. `.cursor/system-crew/workflows/tuning.md` · `feedback.md` · `ideation.md` (해당 요청 유형일 때)
6. `.cursor/system-crew/workflows/cheap-subagent-handoff.md` (문서 Stage를 값싼 모델에, QA를 readonly 컨텍스트에 넘길 때)
7. 역할 파일: `.cursor/system-crew/roles/`

## 역할

| 요청 | 역할 |
|------|------|
| 범위·규모(ceremony)·라우팅 | Producer |
| 프로토콜 밖(스킬 문서화·일상 툴링 등) | Producer → decline / 프로젝트 스킬로 재라우팅 |
| 참고 분해·증거 원장·스펙·자산화 | Systems Analyst |
| 수치 조정 (지표·파라미터·예산) | Systems Analyst → Implementer → QA (`tuning`) |
| 플레이테스트 피드백 → 이슈 카드 | Systems Analyst → 사용자 우선순위 (`feedback`) |
| 제약 내 대안 N개 → 사용자 선택 | Systems Analyst (`ideation`) |
| 구현 (런타임 검증, `DONE`) | Implementer |
| 충실도 검수 (converge check, readonly 컨텍스트 권장) | Fidelity QA |
| 아이디어 판단 후 적용/거절 | Idea evaluation |

## 요청 유형과 규모

Producer Intake에 `Request type`(`reference | idea | implement | qa | tuning | feedback | ideation | mixed | out_of_scope`)과 `Ceremony`(`quick | standard | full`)를 적는다.

- `quick`: 참고 1개 이하·작은 슬라이스 → `docs/references/assets/<id>/quick.md` 한 파일 + INDEX 행, 승인 1회
- `standard`: ASSET · brief · spec · fidelity
- `full`: mixed / 다중 슬라이스 / 요청 유형 병행 → Stage 계획

## 혼합 요청 → 단계 분할

한 프롬프트에 **성격이 다른 일**이 섞여 있고, 한 패스로 처리하면 범위·역할·승인이 흐려진다고 판단되면 **반드시 단계를 나눈다.** 한꺼번에 전부 수행하지 않는다.

### 분할 트리거 (해당하면 분할)

- 역할이 둘 이상: 분석 / 스펙 / 아이디어 평가 / 구현 / QA
- 시스템·수직 슬라이스가 둘 이상
- 요청 유형이 둘 이상: 참고 재현 + 튜닝, 피드백 정리 + 발상
- "분석만"과 "구현까지", "평가"와 "바로 적용"이 한 문장에 공존
- 참고 재현과 무관한 부가 작업(리팩터, UI, 툴링 등)이 같이 들어옴

### 절차

1. Producer Intake에서 `Request type: mixed`로 표시
2. 일을 **순서 있는 Stage**로 쪼개고, Stage마다 담당 역할·산출물·승인 게이트를 적는다
3. 사용자에게 Stage 계획을 **짧게** 제시한 뒤, **Stage 1만** 진행한다 (사용자가 특정 Stage를 지정하면 그것부터)
4. Stage가 끝나기 전에 다음 Stage로 넘어가지 않는다. 끝나면 Next를 다시 선언한다

### Stage 계획 출력 (짧게)

```markdown
## Stages (mixed)
1. [역할] — 할 일 / 산출물 / 게이트
2. ...
→ Now: Stage 1 only
```

## 승인 게이트

질문·코멘트는 **한 번에 모아서** 받는다. 전략 승인 후 routine(파일 생성·INDEX·런타임 검증·카드별 Stage)은 재승인 없이 진행한다. 범위 확장·되돌리기 어려운 변경·스펙 충돌만 다시 묻는다.

## 프로토콜 밖

요청이 참고 재현·시스템 스펙/구현·아이디어 평가·튜닝·피드백·발상이 아니면 (`roles/01-producer.md` "프로토콜 밖"):

- `Request type: out_of_scope`
- 4역할 루프·`docs/references/` 자산을 **만들지 않음**
- 왜 맞지 않는지 짧게 설명하고 프로젝트 스킬/일반 구현으로 재라우팅

예: "이 채팅의 MCP 검증 습관을 스킬로 남겨줘" → create-skill / project-workflows 경로.  
예: "Webhook/Recorder를 이식해줘" → 호스트 agent-playtest / unity-recorder 스킬 (system-crew 루프 아님).

## 문서 경로

- 참고 자산: `docs/references/`
- 아이디어 판정: `docs/decisions/ideas/`
- 튜닝 / 피드백 / 발상: `docs/decisions/tuning/` · `docs/decisions/feedback/` · `docs/decisions/ideation/`

## RAG 캡처 (선택)

호스트에 **rag**가 있으면(형제 `../rag` / `RAG_ROOT` / `capture-to-rag`), 리서치·아이디어 평가·의미 있는 자산화·튜닝 결과·피드백 해소 **마무리 시** Producer가 `capture-to-rag` **검토**를 제안한다. 강제 저장 아님. 호스트 `docs/`를 대체하지 않는다.
캡처 실행 시 `capture-to-rag` 전체(문서 + 기기당 `DISCORD_RAG_WEBHOOK_URL` Discord)를 따른다.

**예외 — 팩 릴리스:** system-crew 레포에서 `CHANGELOG`+`VERSION`을 올린 프로토콜 변경은 rag가 있으면 **자동** 캡처(적용 판단용).

## 비활성 기본값

사용자가 system-crew를 부르지 않으면 이 스킬·프로토콜을 사용하지 않는다.
