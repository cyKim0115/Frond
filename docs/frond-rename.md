# 남은 MdEditor 이름 → Frond 정리 (2026-10-06 할 일)

작성: 2026-10-06 · 상태: **1번 완료(2026-10-06), 2번부터 대기 — 사용자가 "실행"이라고 하면 2번부터 이 문서 순서대로 한다**
배경: 앱 표시 이름은 2026-10-06 Frond로 바꿨다([`decisions/ideation/20261006-app-name.md`](decisions/ideation/20261006-app-name.md)).
남은 `MdEditor`는 저장소·크레이트·내부 식별자다. 판단은 2026-10-06 세션에서 했고 이 문서가 그 결과다.

## 범위

기본 범위는 **A + B**다. 사용자가 "A만"이라고 하면 B를 건너뛴다.

| 구분 | 대상 | 판단 |
|---|---|---|
| A | GitHub 저장소 이름, 크레이트·패키지 이름, 렌더 규칙 이름, 임시 파일 접두사, 추천 테마 묶음 id, 주석·아이콘 title·스킬 설명, 지금 쓰는 문서 | 바꾼다 — 저장되는 값이 아니라 사용자 영향 없음 |
| B | localStorage 접두사 `mdeditor.` → `frond.` | 첫 실행 때 옛 키를 옮기는 코드와 함께 바꾼다 |
| B | 앱 크레이트 이름 `mdeditor` → `frond` | 바꾸되 **exe 이름은 `mdeditor.exe`로 고정**(`mainBinaryName`) |

**하지 않는 것**

- ProgId `MdEditor.Markdown` — 사용자 `.md` 기본 앱(`UserChoice`)이 이 문자열을 가리킨다. 바꾸면 기본 앱 지정이 풀리고 Windows가 해시로 막아 앱이 되돌릴 수 없다
- identifier `com.cykim.mdeditor` — WebView2 데이터 폴더 = localStorage 위치. 바꾸면 설정·최근 파일·세션이 사라진다. E2E용 `com.cykim.mdeditor.e2etest`도 그대로
- exe 파일 이름 `mdeditor.exe` — ProgId 명령·`Applications\mdeditor.exe`·훅 폴백 경로·작업 표시줄 고정이 걸려 있다
- 날짜가 붙은 기록물(`docs/decisions/`·`docs/qa/`·`docs/research/`·git 커밋)의 본문 — 당시 기록이다. 경로를 옮겨서 **깨지는 링크만** 고친다
- 로컬 폴더 `C:\Users\cykim\repo\MdEditor`·`MdEditor-v2` — 바꾸면 Claude 훅(`~/.claude/settings.json`)·Codex 훅(`~/.codex/config.toml`)
  경로, 워크트리 연결, 이 프로젝트의 Claude 메모리 폴더가 끊긴다. 하려면 별도 작업으로

## 시작 전 확인

1. `git status` — main이 깨끗한지 (작업과 무관한 미추적 폴더 `docs/research/research_notes/Frond 스토어 유료 해금 방식/`은 건드리지 않는다)
2. `git -C ../MdEditor-v2 status`·`git log --oneline main..v2` — 2026-10-06 판단 시점에는 v2가 main보다 앞선 커밋 0개였다. 그새 v2에 커밋이 생겼으면 사용자에게 알리고 v2를 먼저 main에 합친 뒤 시작한다
3. `exp/live-preview`는 main보다 2커밋 앞서 있다(미병합, IME 게이트 대기). 이번 작업 뒤 합칠 때 크레이트 경로 충돌이 난다 — 마무리에 메모만 남긴다

## 순서

### 1. GitHub 저장소 이름 (A) — 완료 2026-10-06

사용자가 GitHub에서 `Frond`로 바꿨다. 에이전트가 `origin`을 새 주소로 바꾸고 `git fetch` 확인, `Cargo.toml` `repository`와
`docs/site/` 안 GitHub 링크를 새 주소로 고쳤다. 남은 확인: GitBook Git Sync·헤더 링크([`gitbook-site.md`](gitbook-site.md) 시작 전 확인 3), 다른 PC의 `origin`


- `gh repo rename Frond -R cyKim0115/MdEditor --yes` (gh가 없거나 인증이 안 되면 사용자가 GitHub 웹 Settings → Repository name에서 바꾼다)
- `git remote set-url origin git@github.com:cyKim0115/Frond.git` — v2 워크트리는 같은 설정을 쓰므로 한 번이면 된다
- `git fetch`로 확인. 옛 주소는 GitHub가 넘겨 주지만 **옛 이름으로 새 저장소를 만들면 넘김이 끊긴다**
- [`Cargo.toml`](../Cargo.toml) `repository` → `https://github.com/cyKim0115/Frond`

### 2. 크레이트·패키지 (A·B)

- `git mv crates/mdeditor-core crates/frond-core` → `Cargo.toml` `name = "frond-core"`·`description`의 MdEditor, 루트 `members`
- `src-tauri/Cargo.toml`: 패키지 `name = "frond"`, lib `name = "frond_lib"`, 의존성 `frond-core = { path = "../crates/frond-core" }`
- `use mdeditor_core` / `mdeditor_core::` → `frond_core` — `src-tauri/src/`(lib·save·themes·assets·drafts·export), `crates/.../examples/roundtrip.rs`, `tests/fixtures.rs`, `src/lib.rs` 문서 주석. `src-tauri/src/main.rs` `mdeditor_lib::run()` → `frond_lib::run()`
- **exe 고정**: `src-tauri/tauri.conf.json`에 `"mainBinaryName": "mdeditor"` 추가. 그래야 설치본·NSIS 훅(`${MAINBINARYNAME}`)·[`open-new-md.ps1`](../integrations/open-new-md.ps1) 폴백 경로가 그대로다.
  dev·`cargo build`의 `target/debug` exe는 `frond.exe`가 된다(이름 고정은 `tauri build` 단계에서만)
- `package.json` `"name": "frond"` → `npm install`로 `package-lock.json` 이름 갱신. `Cargo.lock`은 빌드가 갱신
- `src-tauri/capabilities/default.json` description의 `mdeditor-core`

### 3. 코드 안 이름 (A)

- 렌더 규칙: [`chunks.ts`](../src/render/chunks.ts) `mdeditor_chunks`·`mdeditor_chunk_open/close`, [`render/index.ts`](../src/render/index.ts) `mdeditor_collect` → `frond_*`
- 임시 파일: `atomic.rs` `.{name}.mdeditor-{pid}.tmp`, `export.rs`·`tree.rs` 테스트의 `mdeditor-export-`·`mdeditor-tree-`, `assoc.rs` 테스트 `.mdeditor-assoc-test-none` → `frond-`
  (2026-10-06 확인: 이 접두사로 거르는 감시 코드는 없다)
- 추천 테마 묶음 id: [`recommended.ts`](../src/theme/recommended.ts) `"mdeditor"` → `"frond"` (저장되지 않는 값)
- `src-tauri/icons/icon.svg` `<title>` → Frond (래스터 아이콘에는 영향 없음 — 다시 만들지 않는다)
- `public/fonts/D2Coding-OFL.txt` 첫 줄(우리가 단 머리말)만, `.claude/skills/add-setting/SKILL.md` description, `src/main.ts` 머리 주석
- `src-tauri/nsis/hooks.nsh` 매크로 이름 `MDEDITOR_*`는 선택 — 바꿔도 `MDEDITOR_PROGID` **값** `"MdEditor.Markdown"`은 그대로

### 4. localStorage 접두사 (B)

- localStorage 직접 접근은 [`prefs.ts`](../src/prefs.ts)뿐이다(2026-10-06 확인 — 실행 때 `git grep localStorage -- src`로 다시 본다)
- `PREFIX = "frond."`. 앱 시작 때 한 번: `frond.` 키가 하나도 없고 `mdeditor.` 키가 있으면 전부 `frond.`로 복사한다. 옛 키는 지우지 않는다(옛 설치본으로 돌아가도 동작)
- 테스트: `settings.test.ts`·`recent.test.ts`·`inbox.test.ts`의 `mdeditor.` 키를 `frond.`로, 옮기기 테스트 추가(옛 키만 → 복사됨, 새 키 있음 → 안 건드림)

### 5. 문서 (A)

- 지금 쓰는 문서: [`README.md`](../README.md)(4행 "저장소·크레이트 이름은 그대로" 문구, 크레이트 링크), [`CLAUDE.md`](../CLAUDE.md)(제목, 구조의 크레이트 경로,
  빌드 절 roundtrip 명령·내부 식별자 목록 → 남는 것은 ProgId·identifier·exe 이름), `crates/frond-core/README.md`, [`samples/README.md`](../samples/README.md),
  [`roadmap.md`](roadmap.md)·[`plan.md`](plan.md) 제목과 크레이트 경로, [`integrations/README.md`](../integrations/README.md)(exe·ProgId 설명은 그대로)
- 스펙·검수: `references/assets/20260929-typora-md-editors/system-spec.md`·`fidelity-report.md`의 `crates/mdeditor-core` 경로·링크만
- 기록물: 상대 링크가 `crates/mdeditor-core`를 가리키면 그 링크만 고친다
- 결정 기록: [`20261006-app-name.md`](decisions/ideation/20261006-app-name.md) Follow-up에 이번 범위(바꾼 것·남긴 것과 이유) 한 줄
- 메모리(`~/.claude/projects/C--Users-cykim-repo-MdEditor/memory/`): `app-e2e-cdp.md`의 `cargo build -p mdeditor` → `-p frond`, `mdeditor.recent` 등 키 이름

### 6. 검증

- `cargo test` · `npm test` · `npx tsc --noEmit`
- `cd crates/frond-core; cargo run --example roundtrip -- ../../samples/raw` → `git status` 깨끗
- `npm run app:build` → 설치기 안 exe가 `mdeditor.exe`인지 확인
- 설치본 재설치(MSIX 컨테이너 밖에서 — `Invoke-CimMethod Win32_Process Create`, `/S /NS`) → 설정·최근 파일·세션이 남아 있는지(localStorage 옮기기),
  탐색기 `.md` 더블클릭이 Frond로 열리는지(ProgId 유지). 사용자 문서가 열려 있으면 재설치는 사용자에게 묻는다
- `git grep -i mdeditor`로 남은 곳을 보고, 위 "하지 않는 것"과 기록물 말고는 없는지 확인

### 7. 커밋·마무리

- 관심사별로 나눠 커밋(`grouped-git-commit`). 예:
  - `패키지 - 크레이트 이름 frond-core·frond로 변경, 설치본 exe 이름은 mdeditor로 고정`
  - `시스템 - localStorage 접두사 frond.로 변경, 첫 실행 때 옛 mdeditor. 키 복사`
  - `시스템 - 렌더 규칙·임시 파일·추천 테마 묶음 id 이름 Frond로 정리`
  - `문서 - 저장소·크레이트 이름 Frond 반영, 남긴 내부 식별자와 이유 기록`
- 푸시는 사용자가 `+커푸`라고 할 때만
- v2 워크트리에서 `git merge main`(빨리 감기) — v2 담당 세션이 작업 중이면 사용자에게 먼저 묻는다
- [`next-session.md`](next-session.md) §3 8번을 닫고, `exp/live-preview`를 합칠 때 크레이트 경로 충돌을 풀어야 한다고 §2 I에 한 줄
- 이 문서는 끝나면 상태를 **완료**로 바꾸고 남겨 둔다
