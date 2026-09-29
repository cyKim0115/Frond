# MdEditor

Markdown(.md) 파일을 보고 편집하는 개인용 Windows 데스크톱 앱.

**현재 단계: 스택 Tauri 2 + Vite + TS, 엔진 CodeMirror 6, MVP V1(리더 퍼스트) 확정(2026-09-29). 다음은 [docs/roadmap.md](docs/roadmap.md) Phase 0 (IME 스파이크·바이트 보존 코어·WPF 비교 측정).**
열려 있는 결정은 [docs/next-session.md](docs/next-session.md) §2, 계획은 [docs/roadmap.md](docs/roadmap.md)를 먼저 본다.

## 상시 규칙

- 스택·엔진은 [docs/decisions/ideas/](docs/decisions/ideas/INDEX.md)에 `ADOPT_WITH_CHANGES`로 기록됐다. Phase 0 IME 스파이크(`exp/ime-spike`)가 통과하기 전에는 Phase 1 제품 스캐폴딩을 만들지 않는다. 스파이크·측정 코드는 `exp/*` 브랜치에만 둔다
- 확정된 결정은 system-crew 형식으로 `docs/decisions/` 아래에 남긴다 (아래 표). 대화로만 정한 것은 다음 세션에 사라진다
- `samples/raw/`는 바이트 단위 테스트 픽스처다. 편집기로 열어 저장하거나 줄바꿈을 정규화하지 않는다
- 커밋은 전역 `korean-git-commit` 룰을 따른다
- Phase 1 스캐폴딩 시 이 파일의 `구조`·`빌드` 절을 채우고 `.gitignore`에 `node_modules/`·`dist/`·`src-tauri/target/`을 추가한다

## system-crew (호출형)

`.cursor/system-crew` 서브모듈, **OnDemand** 모드. 평소 작업에는 적용하지 않는다.
전역 `role-producer` 룰도 이 프로젝트에서는 호출됐을 때만 따른다.

- 호출: `system-crew`, `시스템 크루`, `Producer로`, `아이디어 평가해줘`, `ideation`, `quick으로: …`
- 호출되면 [.cursor/skills/system-crew/SKILL.md](.cursor/skills/system-crew/SKILL.md)를 읽고 따른다
- 게임용 팩이라 `tuning`(지표)·`feedback`(플레이테스트)·충실도 QA는 거의 해당이 없다. 주로 쓰는 것:

| 요청 유형 | 쓰임 | 기록 위치 |
|---|---|---|
| `idea` | 스택·설계 선택 판정 (ADOPT / DEFER / REJECT) | `docs/decisions/ideas/` |
| `ideation` | 대안 N개 제시 → 사용자가 선택 (MVP 범위·UI 배치) | `docs/decisions/ideation/` |
| `reference` | 다른 에디터(Typora·Obsidian 등)를 참고한 재현 | `docs/references/` |

업데이트:

```powershell
git submodule update --remote .cursor/system-crew
powershell -File .cursor/system-crew/scripts/sync-to-project.ps1 -Mode OnDemand
```

## 구조

```
.cursor/system-crew/   system-crew 서브모듈 (직접 고치지 않는다)
.cursor/rules|skills/  sync 산출물 (Cursor용). 로컬 오버라이드는 .cursor/rules/local/
docs/next-session.md   지금 열려 있는 것 (결정 대기·다음 할 일)
docs/roadmap.md        Phase 0~5 개발 계획 (어느 MVP 안이든 Phase 0~2 공통)
docs/decisions/        결정 기록 (system-crew 형식) — ideas/ 판정, ideation/ 대안·선택
docs/references/       참고 자산 — assets/<id>/ASSET.md + reference-brief.md (증거 원장 Ev#)
samples/               렌더링·파일 처리 확인용 마크다운 샘플
```

## 빌드

미정 — 스택 결정 후 작성.
