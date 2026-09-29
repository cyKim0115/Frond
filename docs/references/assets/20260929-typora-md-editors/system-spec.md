# System Spec — Phase 1 뷰어 MVP (더블클릭 → 깔끔한 렌더)

- Title: MdEditor Phase 1 뷰어 MVP — 파일 열기 경로 · 렌더 파이프라인 · UI 기조 · 외부 변경 리로드 · 설치기/파일 연결
- Spec version: 1.0 (2026-09-29)
- Based on brief: [reference-brief.md](reference-brief.md) (Ev# 인용은 이 원장 기준) · [ASSET.md](ASSET.md) · [roadmap.md](../../../roadmap.md) Phase 1 · 스택 판정 [20260929-stack.md](../../../decisions/ideas/20260929-stack.md) Modified approach 2–7(구현 규칙) · MVP 선택 [20260929-mvp-scope.md](../../../decisions/ideation/20260929-mvp-scope.md) V1 · 코어 [crates/mdeditor-core](../../../../crates/mdeditor-core/README.md)
- Similarity: inspired
- Status: draft

## Player-facing summary

탐색기에서 `.md`를 더블클릭하면 1초 안에 툴바 없는 창에 GitHub급으로 렌더된 문서가 뜬다. 목차 사이드바·줌·다크 모드로 읽고, 다른 프로그램이 파일을 고치면 스크롤을 유지한 채 조용히 갱신된다. 편집·저장은 Phase 2.

## Success criteria

로드맵 Phase 1 표의 완료 조건을 그대로 옮겼다. QA는 문장 단위로 Pass/Fail.

1. (1-1) When `pnpm tauri dev`를 실행하면, the 앱 shall 창을 표시한다.
2. (1-2) When 탐색기에서 `.md`를 더블클릭하면, the 앱 shall 1 s 내 렌더된 문서를 보인다.
3. (1-2) When 앱이 떠 있는 상태에서 두 번째 `.md`를 더블클릭하면, the 앱 shall 새 프로세스를 띄우지 않고 기존 창에서 연다.
4. (1-3) When `samples/showcase.md`를 열면, the 렌더 shall 표·체크리스트·코드·이미지·각주를 GitHub 렌더와 동등하게 보이고 `javascript:`·`data:` 링크를 차단한다.
5. (1-4) When 창 너비를 400–1920 px 사이에서 바꾸면, the 뷰 shall 가로 스크롤 없이 표시되고 한글 단어가 음절 중간에서 끊기지 않는다.
6. (1-5) When 다른 편집기가 열린 파일을 저장하면, the 뷰어 shall 3 s 내 새 내용을 보이고 스크롤 위치를 유지한다.
7. (1-6) When 설치 후 `.md`를 우클릭하면, the '연결 프로그램' 추천 목록 shall MdEditor를 보인다.
8. (1-6) When 설치 후 처음 `.md`를 더블클릭하면, Windows shall 선택 프롬프트를 띄우고 '항상'을 고르면 이후 MdEditor로 열린다. 업데이트 설치 후에도 연결이 유지된다 (MarkText #5463 회귀 테스트, brief A10).
9. (1-7) When Win10 19045 + Win11 실기에서 `samples/` 전부·한글 경로 픽스처·관리자 권한 시나리오를 돌리면, the Fidelity QA(readonly 컨텍스트) shall `SHIPPABLE`을 낸다.

가로지르는 규칙 (로드맵 "가로지르는 규칙"):

10. When CI가 돌면, the `crates/mdeditor-core` `samples/raw` 왕복 테스트 shall 바이트 불변으로 통과한다 (brief O22·F11).
11. When 문서를 렌더하면, the 파이프라인 shall DOMPurify(brief R7)·링크 스킴 허용 목록(brief W10)·`on_navigation` 가로채기(brief G15)·asset scope 문서 폴더 비재귀(brief R17·R18)·CSP `img-src 'self' asset: http://asset.localhost`(brief R16)를 모두 적용한다.
12. When 빌드하면, the 잠금 파일 shall tauri ≥ 2.12 / tao ≥ 0.35.4(brief O8) / `tauri-plugin-single-instance` ≥ 2.4.5(brief S3) / `minimumWebview2Version` 150(brief G1·G3)을 만족한다.

## Scope

- In: 로드맵 Phase 1 전부 — 1-1 스캐폴딩, 1-2 파일 열기 경로(argv·single-instance·드롭·Ctrl+O), 1-3 렌더 파이프라인, 1-4 UI 기조(사이드바 TOC·상태바·줌·다크), 1-5 외부 변경 리로드(읽기 전용), 1-6 NSIS 설치기·파일 연결·기본 앱 안내, 1-7 실기 검증·IME 보강 실측
- Out (Phase 번호): 소스 모드 편집·저장·인코딩 변환(Phase 2-1·2-2) · dirty 상태 외부 변경 배너·초안 백업·찾기·이미지 붙여넣기(2-3~2-5) · 탭·폴더 트리·분할 뷰·세션 복원(Phase 3) · KaTeX·Mermaid·Shiki·GitHub Alerts·HTML/PDF 내보내기(Phase 4) · 인라인 라이브프리뷰(Phase 5) · 포터블 exe 등록·`.txt` 등록·무음 PDF(백로그)

## Mechanics

### Inputs

- 탐색기 더블클릭 / '연결 프로그램' → `"mdeditor.exe" "%1"` (brief A15). 다중 선택은 파일당 프로세스 1개 → single-instance가 병합, Phase 1은 마지막 경로만 연다
- 드래그 앤 드롭: `dragDropEnabled: true` → `onDragDropEvent` paths (brief S8). 여러 개면 첫 파일. 페이지 내부 HTML5 DnD는 쓰지 않는다
- Ctrl+O: 파일 열기 대화상자(`tauri-plugin-dialog`, 필터 `md markdown mdown mkd mkdn mdwn`)
- 키(제안): Ctrl+`=`/`-`/`0` 줌(brief T3) · Ctrl+Shift+L 사이드바 토글 · Ctrl+Shift+D 테마 순환(auto→light→dark) · F5 다시 읽기
- 상태바: 줌 % · 인코딩(`UTF-8`/`UTF-8 BOM`/`CP949`) · EOL(`LF`/`CRLF`/`혼합`) · 기본 앱 표시(`query_default_app` 결과가 `MdEditor.Markdown`이면 숨김, 아니면 "기본 앱으로 설정" 버튼 → `open_default_apps_settings`)
- 링크 클릭: `http(s)`·`mailto`는 opener로 외부(brief G15) · 상대 `.md`·`file:` `.md`는 앱 내 열기 · `#앵커`는 스크롤 · 나머지 차단
- 파일 시스템: 열린 파일의 변경·삭제 이벤트(notify)

### State machine / flow

```text
탐색기 더블클릭 → "mdeditor.exe" "C:\…\문서.md"
 ├─ 첫 실행: main() → args_os()(`-` 플래그 스킵, file:// → to_file_path) → pending_paths
 └─ 실행 중: 새 프로세스 → single-instance(WM_COPYDATA, brief S3) → 기존 프로세스 콜백
             → emit "open-file" {paths} + set_focus → 새 프로세스 exit(0)
                                   ↓
main.ts: DOM ready → invoke take_pending_paths() / listen "open-file" → invoke load_document(path)
                                   ↓
lib.rs load_document: 바이트 읽기 → mdeditor-core FileDocument (BOM·인코딩·줄별 EOL 맵)
   → asset_protocol_scope().allow_directory(문서 폴더, recursive=false) → watcher 대상 교체
   → 반환 { text(LF), encoding, bom, eol, finalNewline, lossy, dir, size }
                                   ↓
render/: markdown-it(plugins, data-line) → 이미지 src: dir 기준 절대경로 → convertFileSrc
   → DOMPurify → <article class="markdown-body" lang="ko"> 교체 → TOC(heading 토큰) → 상태바

외부 변경: 다른 편집기 저장 → notify-debouncer-full(2 s) → 내용 해시 ≠ 이전
   → emit "file-changed" → main.ts: scrollTop 저장 → load_document → 재렌더 → scrollTop 복원
```

| State | On event | Guard | Target | Action / effect |
|-------|----------|-------|--------|-----------------|
| Empty (빈 창) | open(path) | — | Loading | 상태바 "여는 중", 창 제목 = 파일명 |
| Loading | loaded | lossy = false | Viewing | 렌더·TOC·상태바 갱신, watcher 시작 |
| Loading | loaded | lossy = true | Viewing+Lossy | 렌더 + 상단 배너 "깨진 바이트 — 읽기 전용", 상태바 인코딩에 ⚠ |
| Loading | load-failed | — | Error | 배너 "파일을 열 수 없음: <원인>", 이전 문서가 있으면 유지 |
| Viewing* | open(path) | 같은 경로 | Viewing | 스크롤 유지 재로드(F5와 동일) |
| Viewing* | open(path) | 다른 경로 | Loading | 문서 교체, 스크롤 0, TOC 재생성, watcher 교체 |
| Viewing* | file-changed | 해시 다름 | Loading(silent) | 스크롤 저장 → 재렌더 → 복원 (brief F16·F17) |
| Viewing* | file-removed | — | Viewing+Missing | 배너 "파일이 삭제·이동됨", 렌더 유지, 폴더 감시로 전환해 재등장 시 복귀 |
| any | window-close | — | — | 즉시 종료 (dirty 개념 없음) |

- Initial state: Empty(인수 없음) 또는 Loading(인수 있음). `Viewing*` = Viewing·Viewing+Lossy·Viewing+Missing
- Parallel regions: 사이드바 open/closed · 테마 auto/light/dark · 줌 — 문서 상태와 독립

### Data (tunables)

| Name | Default | Range | Sheet / SO field | Notes |
|------|---------|-------|------------------|-------|
| `bodyMaxWidth` | 860 px | 720–1200 | `src/theme/tokens.css --body-max-width` | Typora `#write` (brief R22) |
| `baseFontSize` / `lineHeight` | 16 px / 1.6 | 14–20 / 1.5–1.8 | 같은 파일 | brief R22 |
| `bodyPadding` | 30 px | 16–48 | 같은 파일 | 400 px 창에서도 가로 스크롤 금지 |
| `zoom` | 100 % | 50–200, step 10 | `src/main.ts` | 유지 여부는 Open decisions 3 |
| `watchDebounceMs` | 2000 | 500–5000 | `src-tauri/src/watcher.rs` | tauri-plugin-fs 기본값과 동일 (brief F19) |
| `openRenderBudgetMs` | 1000 | — | 측정값 | 더블클릭 → 첫 페인트 (성공 기준 2) |
| `reloadBudgetMs` | 3000 | — | 측정값 | 외부 저장 → 갱신 (성공 기준 6) |
| `largeSoftLimit` | 2 MB | — | `src/render/index.ts` | 초과 시 hljs 생략·이미지 `loading=lazy` (brief T12) |
| `largeHardLimit` | 10 MB | — | 같은 파일 | 초과 시 `<pre>` 텍스트 뷰 + 배너. 이하는 렌더 ≤ 5 s·창 무응답 없음 (brief F27 권고) |
| `minWindowWidth` | 400 px | — | `tauri.conf.json` | 성공 기준 5 |
| `sidebarWidth` | 260 px | 200–400 | `tokens.css` | 드래그 조절은 Phase 3 |
| `linkSchemes` | `http` `https` `mailto` | — | `src/render/links.ts` | 허용 목록, 그 외 차단 (brief W10·G15) |
| `assocExts` | `md markdown`(ProgId 기본값 후보) + `mdown mkd mkdn mdwn`(`OpenWithProgids`만) | — | `tauri.conf.json` + NSIS 훅 | brief A19 |

- 위 값은 CSS 변수·상수 한 곳에만 둔다. 매직넘버 하드코딩 금지.

### Events / messages

- Rust → JS: `open-file {paths: string[]}` (single-instance 콜백·드롭) · `file-changed {path, hash}` · `file-removed {path}` · `elevated-warning` (시작 시 토큰이 관리자면 1회)
- JS → Rust 커맨드: `load_document(path) → DocumentInfo {text, encoding, bom, eol: "lf"|"crlf"|"mixed", finalNewline, lossy, dir, size}` · `take_pending_paths() → string[]` · `open_default_apps_settings()` (Win11: `ms-settings:defaultapps?registeredAppUser=MdEditor`, Win10: `ms-settings:defaultapps`, brief A4) · `query_default_app() → string | null` (ProgId. `IApplicationAssociationRegistration::QueryCurrentDefault`, brief A1·A3; `=== "MdEditor.Markdown"` 비교는 TS) · `is_registered() → boolean` · `watch_document(path, hash)` / `unwatch_document()` (외부 변경) · 외부 링크는 JS가 `@tauri-apps/plugin-opener`로 연다
- 프론트 내부: `render:done {headings, ms}` → TOC·상태바 · `theme:changed` → `<html data-theme>`

## Implementation sketch

- Suggested types / files (기존 위젯 관례: Tauri 2.12 + Vite 6 + vanilla TS, 스택 판정 Modified approach 5):
  - `src/main.ts` — 셸: 사이드바 TOC(기본 열림/접힘은 Open decisions 2), 상태바(줌·인코딩·EOL·기본 앱), 줌, 다크 모드(`prefers-color-scheme` 자동 + 수동 `data-theme`), 드롭·Ctrl+O, 이벤트 구독, 스크롤 보존 재로드
  - `src/render/index.ts` — markdown-it 15 + `markdown-it-cjk-friendly`(brief R24) + `markdown-it-anchor` + task lists + footnote + front matter(brief R25). `renderer.rules` 래핑으로 블록 토큰의 `map[0]`을 `data-line`에 부여(brief R1). `html: false` 유지
  - `src/render/links.ts` — 스킴 허용 목록 검사. `file:`·상대 `.md`는 `href` 대신 `data-open` 속성으로 표시해 클릭 시 앱 내 열기, 그 외 스킴은 `href` 제거(brief R4·W10)
  - `src/render/images.ts` — 상대 경로 → 문서 폴더 기준 절대경로 → `convertFileSrc`. 한글·공백은 `encodeURIComponent` 왕복 안전(brief R18·G13). 폴더 밖(`../`)은 재작성하지 않음
  - `src/render/highlight.ts` — highlight.js core + 언어별 동적 import, 미등록 언어는 plain(brief R13)
  - `src/render/sanitize.ts` — DOMPurify, innerHTML 직전 적용. `data-line`·`data-open`·`id`(앵커)·`class`(task-list) 허용(brief R7)
  - `src/theme/base.css`(github-markdown-css `.markdown-body`, brief R21) · `tokens.css`(860/16/1.6/30 px, `--bg-color` 등 Typora 변수명 차용) · `ko.css`(`:lang(ko) { word-break: keep-all; overflow-wrap: break-word }`, 표 `overflow-wrap: anywhere`, `pre { word-break: normal }`, brief G22) · `fonts.css`(본문 `"Pretendard Variable", Pretendard, "Noto Sans KR", "Malgun Gothic", sans-serif`; 코드 `"D2Coding"` woff2 번들 `@font-face src: local("D2Coding"), url(...)` → `"Sarasa Mono K"`, `"Cascadia Mono"`, Consolas, monospace, brief R23·G23·G24) · `dark.css`(`@media (prefers-color-scheme: dark)` + `[data-theme="dark"]`, brief T5)
  - `src-tauri/src/lib.rs` — 플러그인 등록 순서: single-instance **첫 번째**(brief S3) → dialog → opener. 커맨드 `load_document`(`mdeditor_core::FileDocument` → LF `text()` + 메타, `asset_protocol_scope().allow_directory(dir, false)`(brief R17). fs 플러그인 `readTextFile`은 쓰지 않음, brief F25) · `take_pending_paths`(`std::env::args_os().skip(1)`, `-`로 시작하는 인자 스킵, `file://`는 `Url::to_file_path`, brief S4·A13) · single-instance 콜백(`open-file` emit + `set_focus`)
  - `src-tauri/src/watcher.rs` — notify-debouncer-full 2 s, 이벤트 후 파일 재읽기 → blake3 내용 해시, 이전과 같으면 무시(mtime-only·자기 저장 제외, brief F17·F19·F20). 삭제·이동은 `file-removed`
  - `src-tauri/src/assoc.rs` — `open_default_apps_settings`·`query_default_app`·`is_registered` (관리자 토큰 검사는 백로그)
  - `src-tauri/tauri.conf.json` — `bundle.fileAssociations [{ext:["md","markdown"], name:"MdEditor.Markdown", description:"Markdown 문서", mimeType:"text/markdown", role:"Editor"}]`(brief S1·W7) · `bundle.windows { webviewInstallMode:{type:"downloadBootstrapper"}, nsis:{ installMode:"currentUser", installerHooks:"nsis/hooks.nsh", minimumWebview2Version:"150" } }`(brief S5·G4) · `app.security { csp:"default-src 'self'; img-src 'self' asset: http://asset.localhost; style-src 'self' 'unsafe-inline'; font-src 'self'", assetProtocol:{enable:true, scope:[]} }`(정적 scope 비움, 런타임 `allow_directory`로만 확장, brief R16) · `windows[0] { dragDropEnabled:true, minWidth:400, minHeight:300 }` · `capabilities/default.json`은 `core:default`·`dialog:allow-open`·`opener:allow-open-url`(http/https/mailto)만
  - `src-tauri/nsis/hooks.nsh` — `NSIS_HOOK_POSTINSTALL`: `Software\Classes\.md`·`.markdown`에 `OpenWithProgids\MdEditor.Markdown`, `.mdown/.mkd/.mkdn/.mdwn`은 `OpenWithProgids`만(brief A8·A19) · `Software\Classes\Applications\mdeditor.exe\SupportedTypes`·`FriendlyAppName`(brief A11) · `Software\MdEditor\Capabilities`(`ApplicationName`·`ApplicationDescription` 필수·`FileAssociations\.md=MdEditor.Markdown`) + `Software\RegisteredApplications\MdEditor`(brief A5) · `!insertmacro UPDATEFILEASSOC`(SHChangeNotify, brief A14·S2). `NSIS_HOOK_POSTUNINSTALL`: 자기 ProgId·`OpenWithProgids` 값·Capabilities·RegisteredApplications만 삭제, `.ext` 기본값은 건드리지 않음(brief A9·A10)
  - 루트 `Cargo.toml` 워크스페이스에 `crates/mdeditor-core` + `src-tauri`. `.gitignore`에 `node_modules/ dist/ src-tauri/target/`. Vite `server.watch.ignored: ["**/src-tauri/**"]`(next-session §2). `CLAUDE.md` 구조·빌드 절 채우기
- Dependencies: tauri 2.12+, tauri-plugin-single-instance 2.4.5+, tauri-plugin-dialog, tauri-plugin-opener, notify-debouncer-full, blake3, url, windows(토큰·QueryCurrentDefault), mdeditor-core / markdown-it 15, markdown-it-cjk-friendly, markdown-it-anchor, markdown-it-task-lists, markdown-it-footnote, markdown-it-front-matter, dompurify, highlight.js, github-markdown-css, D2Coding woff2(OFL)
- Vertical slice definition: `pnpm tauri dev`로 창 → `samples/showcase.md`를 인수로 열기 → 1 s 내 렌더 + TOC + 상태바 → VS Code로 같은 파일 저장 → 3 s 내 스크롤 유지 갱신 → 두 번째 인수 실행이 기존 창에서 열림. 여기까지 1-1~1-5, 설치기 1-6은 그 다음

### Verification plan (1-7)

- 렌더: `samples/showcase.md`(표·체크리스트·코드·이미지·각주·front matter)를 GitHub 렌더와 나란히 비교 · `samples/paths/paths.md`의 퍼센트 인코딩·꺾쇠 8개는 필수, "인코딩 없이" 3개는 Open decisions 1
- 바이트 보존: `cd crates/mdeditor-core && cargo test`(단위 12 + 픽스처 11) + `cargo run --example roundtrip -- ../../samples/raw` 후 `git status --short samples/raw` 빈 출력 — CI 필수
- 대용량: `powershell -File samples/gen-large.ps1` → `samples/large/2mb.md`·`10mb.md` 열기 시간·스크롤·프로세스 트리 메모리 기록(Phase 0-3 측정 절차 재사용)
- 실기: Win10 19045 + Win11 24H2/25H2, WebView2 Evergreen 최신. 설치 → 우클릭 추천 목록 → 첫 더블클릭 프롬프트 → '항상' → 같은 버전 재설치·상위 버전 설치 후 유지(brief A10) → 제거 후 `.md` 기본값 고아 없음(brief A9). 설정 > 기본 앱에 MdEditor 노출 여부 기록(next-session §3)
- IME 보강: `git checkout archived-exp/ime-spike` → `spike/ime-spike` 앱으로 이전 IME(`ConfigureImeVersion=1`)·Win11에서 ①–⑧ 재실측, 스택 판정 결과표의 빈 행에 기록. 실패 시 `--tsf-off` → Modified approach 1 (b)(c)로 재판정
- 관리자 실행: 관리자 권한으로 띄운 뒤 탐색기 더블클릭 → 경고 문구 노출 확인(brief S3 #3643)
- Fidelity QA: readonly 컨텍스트가 성공 기준 1–12를 문장 단위로 판정해 `fidelity-report.md` 작성. verdict `SHIPPABLE`이어야 Phase 2 진입

## Edge cases to handle now

| 상황 | 동작 | 근거 |
|------|------|------|
| 파일 없음·권한 없음으로 열기 실패 | Error 배너 + 이전 문서 유지. 프로세스는 남는다 | 두 번째 더블클릭이 앱을 죽이면 안 됨 |
| 보는 중 파일 삭제·이동 | Missing 배너, 렌더 유지, 폴더 감시로 재등장 시 자동 복귀 | brief F20 |
| 손실 디코드(깨진 바이트) | 렌더는 하되 Lossy 배너 "읽기 전용", 상태바 인코딩에 ⚠. Phase 2에서도 편집 저장 금지 | core `SaveError::LossyDocument` |
| CP949·UTF-8 BOM·혼합 EOL | 상태바에 그대로 표시, 바이트는 건드리지 않음 | brief F10·F11, core README |
| 10 MB(`samples/large/10mb.md`) | 2 MB 초과 hljs 생략·이미지 lazy, 10 MB 초과 `<pre>` 텍스트 뷰 + 배너. 창 무응답 없음 | brief T12·F27 |
| 보는 중 외부 변경 | 해시 다르면 조용히 재렌더, `scrollTop` 복원. mtime만 바뀐 경우 무시 | brief F16·F17 |
| 한글·공백·`[`·`#` 이미지 경로 | 퍼센트 인코딩·꺾쇠 8종 모두 표시. scope는 glob이 아닌 `allow_directory`라 `[`에 안전 | brief G13·G14 |
| 상대 `.md`·`file:` `.md` 링크 클릭 | `on_navigation`이 웹뷰 이동을 막고(`false` 반환) 앱 내 `load_document`로 연다(`Url::to_file_path`) | brief G15 |
| `file:`(비 `.md`)·`javascript:`·`data:`·`vbscript:` 링크 | 렌더 단계에서 `href` 제거(비활성 표시), `on_navigation`에서 2차 차단. 셸 실행 없음 | brief W10·R4·W15 |
| 문서 폴더 밖 이미지(`../`) | 비재귀 scope 밖 → 깨진 이미지 + `title="문서 폴더 밖"`. 열려는 시도 없음 | brief R17·R18 |
| 관리자 권한으로 실행된 인스턴스 | 시작 시 토큰 검사 → 상태바 경고 "관리자 권한 실행 중: 탐색기 더블클릭이 이 창에 전달되지 않음(UIPI)". 두 번째 프로세스는 창을 띄우지 않고 종료 | brief S3 #3643 |
| WebView2 런타임 없음·< 150 | NSIS `downloadBootstrapper`가 설치·갱신, 오프라인이면 설치기 안내. 앱은 시작 시 버전 검사 후 150 미만이면 배너 | brief S6·W17·G1 |
| 창 400–1920 px | 본문 `max-width: 860px; width: 100%`, 표·긴 URL은 `overflow-wrap: anywhere`, 코드 블록은 내부 가로 스크롤 | brief G22 |
| 한글 줄바꿈 | `<html lang="ko">` + `:lang(ko) keep-all` → 음절 중간 끊김 없음, 영문 긴 단어는 `break-word` | brief G22 |
| 다중 선택 열기(N 프로세스) | single-instance 콜백 N회 → 마지막 경로만 표시. #3587 레이스로 유실되면 1-7에 빈도 기록 | brief A15·S3 |

## Deferred

- Phase 2: CM6 소스 모드·저장·인코딩 변환 제안·dirty 배너·초안 백업·찾기·이미지 붙여넣기 (스펙 별도, `.cm-cursor`·`.cm-selectionBackground` 색 포함)
- Phase 3: 탭(두 번째 더블클릭 → 새 탭)·폴더 트리·분할 뷰·세션 복원 · Phase 4: KaTeX·Mermaid·Shiki·Alerts·HTML/PDF 내보내기 · Phase 5: 인라인 라이브프리뷰
- 백로그: 포터블 HKCU 등록, `.txt` 등록, 무음 PDF, Focus/Typewriter, 워드카운트, Typora `github.user.css` 호환

### Open decisions (사용자)

1. 인코딩 없는 공백 경로 이미지(`paths.md` "인코딩 없이" 절의 `한글 폴더/한글 그림.png`): CommonMark대로 이미지 아님(GitHub 동일) vs Typora식 관용 허용 — 제안: CommonMark 준수, 결과를 `paths.md` 마지막 줄에 기록
2. TOC 사이드바 첫 실행 기본: 열림 vs 접힘 — 제안: 접힘(Typora 기본 레이아웃, brief T4), 마지막 상태를 앱 데이터에 기억
3. 줌 유지: 세션마다 100 % vs 마지막 값 기억(`%APPDATA%\MdEditor\settings.json`) — 제안: 기억

## Approval

- Approved by user: no
- Date: —
- Batch comments applied: — (Open decisions 3건과 함께 1회 승인 게이트)
