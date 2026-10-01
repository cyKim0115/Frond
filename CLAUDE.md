# MdEditor

Markdown(.md) 파일을 보고 편집하는 개인용 Windows 데스크톱 앱.

**현재 단계: [docs/roadmap.md](docs/roadmap.md) Phase 1 뷰어 + Phase 2 편집·저장 + 셸 트랙 S-1~S-4 구현 완료 (2026-09-30), 1-7 실기 통과 (2026-10-01, 8번 제외). 셸 트랙·AI 연동 실기는 2026-10-01 사용자 확인으로 닫음. 남은 것은 Phase 2 실기([docs/next-session.md](docs/next-session.md) §2 B) — B-2 한글 IME는 사용자가, 나머지는 에이전트가 컴퓨터 제어·CDP로 확인하고, 에이전트는 §3 순서로 진행한다. 통과하면 MVP(V1) 완료.**
할 일·열린 결정은 [docs/next-session.md](docs/next-session.md) §2·§3, 계획은 [docs/roadmap.md](docs/roadmap.md)를 먼저 본다.

## 상시 규칙

- 스택은 `ADOPT`, 엔진은 `ADOPT_WITH_CHANGES`로 [docs/decisions/ideas/](docs/decisions/ideas/INDEX.md)에 기록됐다. Phase 0 IME 스파이크는 2026-09-29 통과(Win10 새 IME). 이전 IME·Win11 실측은 Phase 1-7에서 보강한다. 실험·측정 코드는 `archived-exp/*` 브랜치에만 있고 main에 올리지 않는다
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
samples/               렌더링·파일 처리 확인용 마크다운 샘플 (raw/ 바이트 픽스처, paths/ 경로 픽스처, large/ 생성형)
Cargo.toml             루트 워크스페이스 (crates/mdeditor-core + src-tauri). release 프로필 lto·opt-level s
crates/mdeditor-core   바이트 보존 파일 코어 (Rust). 파일 I/O는 전부 여기를 거친다 — fs 플러그인 금지
src-tauri/             Tauri 2 백엔드. lib.rs(창·argv·single-instance·load_document), watch.rs(외부 변경),
                       assoc.rs(파일 연결·기본 앱), elevation.rs(관리자 권한 감지), save.rs(저장·etag 충돌·인코딩 변환),
                       drafts.rs(초안 백업), assets.rs(붙여넣은 이미지), themes.rs(사용자 테마 폴더),
                       nsis/hooks.nsh(설치기 레지스트리 훅), capabilities/(최소 권한)
src/                   프런트(vanilla TS). main.ts 셸(열기·보기/소스 모드·저장·초안·외부 변경·목차·상태바·줌·설정 적용),
                       editor.ts(CM6 소스 편집기), find.ts(보기 모드 찾기), render/(markdown-it 파이프라인, types.ts가 계약),
                       theme/(문서 CSS·폰트, themes.ts 테마 모델·토큰·테마 파일 검증), theme-panel.ts(설정 테마 목록),
                       theme/recommended.ts·recommended-dialog.ts(추천 테마 — 세피아·웨딩 팔레트, 팔레트→토큰 파생),
                       style.css(셸 CSS·대체 색 토큰)
                       titlebar.ts(창 테두리 없음 + 열별 머리 띠 = 제목 표시줄), nav.ts(왼쪽 탐색 영역·최근 파일),
                       recent.ts(최근 목록 순수 함수·문서 제목 추출),
                       resize.ts(목차 폭), settings.ts(설정 스키마 — 항목을 더하면 팝업에 자동 표시), settings-dialog.ts,
                       dialog.ts(알림·확인 팝업), context-menu.ts(오른쪽 클릭 메뉴), prefs.ts(UI 상태 localStorage)
public/fonts/          D2Coding woff2 (OFL) 번들
integrations/          AI 앱 연동 — open-new-md.ps1(Claude Code·Codex PostToolUse 훅: 새 md를 MdEditor로 열기). UTF-8 BOM 유지
spike/                 (main에 없음) Phase 0 실험 앱·측정 — archived-exp/ime-spike, archived-exp/wpf-hello
```

## 빌드

```powershell
npm install                       # 처음 한 번 (Rust는 cargo가 알아서)
npm run app:dev -- -- 파일.md      # Tauri dev (Vite 1422 + cargo run). 인수는 argv 열기 경로 테스트
npm run app:build                 # 릴리스 + NSIS 설치기 → target/release/bundle/nsis/
npm test                          # vitest (src/**/*.test.ts, 렌더 파이프라인)
npx tsc --noEmit                  # 타입 검사
cargo test                        # 코어 + 백엔드 단위 테스트
cd crates/mdeditor-core; cargo run --example roundtrip -- ../../samples/raw   # 제자리 무편집 저장 → git status 깨끗
```

- Vite `server.watch.ignored`에 `src-tauri`·`target`이 빠지면 cargo가 쓰는 exe 때문에 dev 서버가 EBUSY로 죽는다
- 창은 `lib.rs`에서 코드로 만든다 (`on_navigation` 훅 때문). `tauri.conf.json`의 `app.windows`는 비워 둔다
- 창은 `decorations(false)`. 제목 표시줄 버튼·드래그는 프런트가 그리고, 창 API를 새로 쓰면 `capabilities/default.json`에 권한을 더한다
- 색은 테마 토큰(`src/theme/themes.ts` 셸 8·문서 48)만 쓴다. 새 색이 필요하면 토큰을 늘리고 내장 라이트·다크 둘 다 채운다
- 사용자 조절 값은 `src/settings.ts`의 `SETTINGS`에 추가하고 `main.ts` `applySetting`에서 적용한다 (하드코딩 금지).
  설정 팝업은 왼쪽 카테고리 탭 구조 — 항목·기능을 더할 때는 `add-setting` 스킬(`.claude/skills/add-setting/`)을 따른다
- CM6·다크 모드에서 `.cm-cursor` 색은 반드시 테마에서 지정한다 (기본 검정이라 안 보임 — Phase 0 발견)
