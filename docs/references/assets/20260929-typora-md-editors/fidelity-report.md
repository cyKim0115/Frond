# Fidelity Report: MdEditor V1 MVP (Phase 1·2, 셸 트랙 S-1~S-4, V1.1 다듬기)

- Date: 2026-10-06
- Spec: `docs/references/assets/20260929-typora-md-editors/system-spec.md`. 스펙 버전은 v1.0(2026-09-29)이고 Phase 1만 다룬다. 이 파일의 `Approval`은 `no`, `Status`는 `draft`로 남아 있다. 승인 사실은 로드맵 게이트 0의 2026-09-29 배치 승인 기록으로 갈음한다. Phase 2와 셸 트랙은 별도 system-spec이 없어서 `docs/roadmap.md`의 EARS와 `docs/decisions/ideas/20261001-v1-open-decisions.md`(D1~D7)를 기준으로 삼았다.
- Build / branch notes: main @ `278be65`, 설치본은 `620ab78` 빌드다(MdEditor 0.1.0, NSIS currentUser). `git diff --stat 620ab78 278be65`로 보면 문서만 바뀌었으므로 설치본 코드는 HEAD와 같다. Phase 2 B 실기는 2026-10-01 빌드에서 했다(`4585152`·`b1606f8` 반영). V1.1(`b61f359`~`620ab78`)은 단위 테스트, 헤드리스 Edge, 식별자를 바꾼 디버그 빌드에 CDP를 붙여 확인했다.
- Similarity mode: inspired
- Reviewer context: separate subagent (readonly). 쓰기 금지라 테스트는 다시 돌리지 않았다. 대신 테스트 개수를 정적으로 세어 구현 기록과 대조했다(vitest 104건, cargo `#[test]` 코어 28건·백엔드 24건으로 기록과 일치). `git status samples/raw`가 깨끗한 것은 직접 확인했다.

> 2026-10-06 후속(구현 채팅): 아래 Priority fixes 3·4 중 일부를 같은 날 처리했다 — 맨 아래 "후속 처리" 참조. 판정 본문은 검수 에이전트가 쓴 그대로 둔다.

## Converge check (spec ↔ implementation)

| Spec item (criterion / edge case / tunable) | In code? | Note |
|---|---|---|
| 핀: tauri ≥ 2.12, tao ≥ 0.35.4, single-instance ≥ 2.4.5, WebView2 ≥ 150 | 예 | `Cargo.lock`: tauri 2.12.0, tao 0.37.1, single-instance 2.5.0, wry 0.57.0. `tauri.conf.json`: `minimumWebview2Version 150.0.0.0` |
| 1-2 argv 처리(`args_os`, `-` 스킵, `file://`→경로), single-instance를 첫 플러그인으로, `set_focus`·`open-file` | 예 | `src-tauri/src/lib.rs`의 `paths_from_args`·`on_second_instance`·`run()`. 단위 테스트 3건 |
| 1-2 드롭 열기, Ctrl+O | 예 | `src/main.ts`의 `onDragDropEvent`·`pickAndOpen` |
| asset scope를 문서 폴더 비재귀로 | **다름** | `lib.rs:94`가 `allow_directory(&dir, true)`로 재귀 허용하고, 세션 동안 연 폴더가 계속 누적된다. 코드 주석에 근거(`./images/`)는 있지만 스펙·로드맵은 갱신되지 않았다 → spec drift |
| 1-3 markdown-it 15, cjk-friendly, anchor, task, footnote, front matter, `data-line`, hljs 지연 로드 | 예 | `src/render/index.ts`·`data-line.ts`·`task-lists.ts`·`highlight.ts` |
| 원문 HTML(스펙은 `html: false`) | 예 (결정으로 변경) | D1에 따라 `html: true`와 허용 목록(`src/render/html.ts`). 결정 문서에는 반영됐고 스펙 본문은 옛 값 그대로다 |
| 링크 스킴 허용 목록, `file:`·상대 `.md`는 앱 안에서 열기 | 예 | `src/render/links.ts`(`data-local-path`). `on_navigation`(`lib.rs:144`)은 앱 origin만 허용한다. 스펙은 "on_navigation이 가로채 연다"로 적었지만 구현은 렌더 단계에서 표시하고 클릭으로 연다. 결과는 같다 |
| DOMPurify | 예 | `src/render/sanitize.ts`. `svg`·`math` 금지를 추가했다 |
| CSP `img-src 'self' asset: http://asset.localhost` | **다름** | 실제 값은 `… data: https:`이고 `links.ts`가 http(s) 이미지를 그대로 둔다(테스트 "http(s) 이미지는 유지"). 원격 이미지를 허용하는 셈이라 brief W15(원격 차단)와 다르고, 결정 기록도 없다 → spec drift |
| 상대 이미지 → 절대 경로 → `convertFileSrc` | 예 | `links.ts`의 `rewriteImage`, `paths.ts` |
| `../` 이미지에 `title="문서 폴더 밖"` | **아니오** | grep 결과 없음. 깨진 이미지로만 보인다 |
| 1-4 860 px / 16 px / 1.6, keep-all, D2Coding 번들, Pretendard 폴백 | 예 | `src/theme/tokens.css`·`ko.css`·`fonts.css`, `public/fonts/D2Coding.woff2`. 본문 여백은 `clamp(16px,5vw,40px)`로 스펙(30 px)과 다르지만 기능은 같다 |
| 줌 50–200 %, 마지막 값 기억(Open decision 3 제안) | 부분 | `main.ts applyZoom`의 범위는 50–300 %이고 세션마다 100 %로 돌아간다 |
| TOC 기본 접힘 + 상태 기억(Open decision 2), 키 Ctrl+Shift+L | 다름 | 제목이 있으면 목차가 보이고, 토글 키는 `Ctrl+\`다. 결정 기록이 없다 |
| 상태바: 줌·인코딩·EOL·기본 앱 버튼·관리자 경고 | 예 | `main.ts`의 `refreshDefaultAppStatus`, `src-tauri/src/assoc.rs`(Win11 `registeredAppUser` 분기, `QueryCurrentDefault`), `elevation.rs` |
| 1-5 debouncer 2 s + blake3, 자기 저장·mtime만 바뀐 경우 무시 | 예 | `src-tauri/src/watch.rs`(폴더를 비재귀로 감시), `main.ts`의 `file-changed` 처리 |
| 파일 삭제 → Missing 배너 → 다시 생기면 복귀 | 부분 | `file-missing` 배너는 있다. 다만 파일이 **같은 내용**으로 다시 생기면 `last` 해시와 같아서 이벤트가 오지 않고 배너가 남을 수 있다 |
| Lossy → 상단 배너 "읽기 전용" + 상태바 ⚠ | 부분 | 상태바가 빨갛게 바뀌고 툴팁이 뜨며, 편집기가 `setReadOnly`로 잠기고, 저장하면 팝업이 뜬다. 상단 배너는 없다(`b5-reopen-utf8-lossy.png`). 표현 차이다 |
| WebView2 < 150이면 시작 배너 | **아니오** | 설치기의 `minimumWebview2Version`만 있다 |
| 1-6 `fileAssociations`, NSIS 훅(OpenWithProgids 6종, Applications, Capabilities, RegisteredApplications, SHChangeNotify, 제거 때 자기 값만 삭제) | 예 | `tauri.conf.json`, `src-tauri/nsis/hooks.nsh` |
| `largeSoftLimit` 2 MB 큰 문서 모드, V1.1 블록 묶음 | 예 | `render/index.ts`의 `LARGE_SOFT_LIMIT`·`LARGE_CHUNK_BLOCKS`, `render/chunks.ts`, `style.css #app.large-doc`. `largeHardLimit`은 스펙에 기록된 대로 백로그다 |
| 2-1 CM6 plain, `Ctrl+/`, `lineSeparator` = 파일의 지배 EOL | 예 (방식 다름) | `src/editor.ts`는 `lineSeparator`를 `\n`로 고정하고 EOL 복원은 코어의 줄별 맵이 맡는다. 바이트 결과는 같다 |
| 2-2 코어 연결, `isComposing` 가드, 손실 시 UTF-8 제안, Encode in / Convert to 분리 | 예 | `main.ts:1172`, `src-tauri/src/save.rs`, `crates/frond-core/src/{document,encoding,eol,atomic}.rs`(`ReplaceFileW`) |
| 2-3 배너 [다시 읽기/유지], 충돌 [덮어쓰기/다른 이름], etag = 내용 해시 | 예 | `main.ts`의 `file-changed`, `save.rs`의 `expected_hash`. [비교]는 D5에 따라 백로그 |
| 2-4 초안을 `%APPDATA%\MdEditor\drafts`에 30 s~2 min 주기로, compositionend flush | 예 | `src-tauri/src/drafts.rs`, `settings.ts draftIntervalSec`(기본 60 s), `main.ts flushComposition`(저장·다른 이름·닫기 전) |
| 2-5 찾기·바꾸기, 이미지 붙여넣기·드롭 → `./assets` | 예 | `src/find.ts`, `src-tauri/src/assets.rs`, `main.ts dropImages` |
| S-1 `SETTING_CATEGORIES`, 세로 탭 | 예 | `src/settings.ts`·`settings-dialog.ts`·`settings.test.ts` |
| S-2 테마 정의, `theme-vars`, 라이트·다크 쌍 토글 | 예 | `src/theme/themes.ts`(`:root`·`.markdown-body`·`.cm-editor`). `highlight.css`에서 `var(--…)`를 17곳 쓴다 |
| S-3 `@property` 보간, reduced-motion, 큰 문서는 View Transition | 예 | `themes.ts:324`, `main.ts:1038-1060` |
| S-4 검증(`CSS.supports`, `url(`·`@import`·`expression` 거부), 백엔드 저장 | 예 | `themes.ts:351-356`, `src-tauri/src/themes.rs` |
| V1.1: `convert_eol`, 메뉴 인쇄, 글자 수, 슬러그, 각주 `data-line` | 예 | `document.rs:168`, `src-tauri/src/print_menu.rs`, `src/wordcount.ts`, `render/index.ts slugify` |
| `samples/raw` 왕복 테스트를 CI에서 | 부분 | `crates/frond-core/tests/fixtures.rs`(15건)는 있지만 CI 러너가 없다(`.github` 없음). 로컬에서 돌린다 |

- Spec drift: **spec needs update (→ `NEEDS_SPEC`, 차단하지 않음)**. 해당 항목은 asset scope 재귀·누적, CSP `img-src data: https:`, 줌 범위·기억, TOC 기본값·키, Lossy 표현, `lineSeparator` 방식, CI가 실제로는 로컬이라는 점이다. 스펙의 Approval·Status 미갱신과 Phase 2·셸 트랙 스펙 부재도 함께 손봐야 한다. **missing work(작은 갭)**는 `../` title, WebView2 < 150 배너, 같은 내용으로 다시 생긴 파일의 복귀다.

## Success criteria

| # | Criterion (EARS) | Result | Evidence # | Notes |
|---|---|---|---|---|
| 1 | (1-2) 탐색기 더블클릭 → 1 s 안에 렌더 | Partial (계측 없음, 비차단) | E3·E6 | 1-7 3번은 1차 때 "무엇을 볼지 몰랐음"이었고, 2차는 이미지만 다시 봤다. 더블클릭부터 첫 페인트까지 잰 값이 없다. 간접 근거는 Tauri hello 371–383 ms와 2 MB 조작 1초 안쪽이다 |
| 2 | (1-2) 실행 중 두 번째 더블클릭 → 기존 창에서 열림 | Pass | E3·E8 | Phase 1 릴리스 exe로 확인했다. B 실기 중에 AI 훅이 single-instance로 시험 창에 파일을 연 실제 사례도 있다 |
| 3 | (1-3) showcase가 GitHub 렌더와 동등, `javascript:`·`data:` 차단 | Pass | E5·E3 | `src/render/index.test.ts` 43건(보안·링크·HTML 허용 목록·슬러그)과 1-7 실기. 차단된 링크가 원문 글자로 남는 차이는 기록만 한다 |
| 4 | (1-4) 400–1920 px에서 가로 스크롤 없음, 한글이 음절 중간에서 안 끊김 | Pass | E3·E9 | 1-7 5번(400 px), `ko.css` keep-all, `docs/screenshots/main.png` |
| 5 | (1-5) 외부 저장 → 3 s 안에 갱신, 스크롤 유지 | Pass | E3·E1 | 1-7 4번. B-4에서도 편집하지 않은 상태의 외부 변경은 조용히 다시 읽었다 |
| 6 | (1-6) 설치 후 `.md` 우클릭 → 추천 목록에 MdEditor | Pass (Win10) | E3 | 1-7 2번과 7번(제거 후 정리)으로 확인했다. Win11은 확인하지 못했다 |
| 7 | (1-6) 첫 더블클릭 프롬프트 → '항상' → 이후 MdEditor, 업데이트 후에도 유지 | Partial | E4·E7 | 같은 버전 무인 재설치 뒤 `.md` 연결·RegisteredApplications가 유지됐다(10-06). 첫 프롬프트를 본 기록은 없다. 버전이 0.1.0 그대로라 상위 버전 업그레이드 경로는 시험하지 못했다. `hooks.nsh`는 UserChoice를 건드리지 않게 짜여 있다 |
| 8 | (1-7) Win10·Win11 실기, `samples/` 전부, 한글 경로, 관리자 실행 → `SHIPPABLE` | Partial | E3 | Win10에서 1·2·4·5·7·9·10, 경로 이미지 10개, 관리자 경고를 통과했고 대용량은 조건부 통과다. 8번(이전 IME·Win11)은 환경이 없어 보류했다(사용자 승인) |
| 9 | (2-1) 보기 ↔ 소스 왕복 후 커서·스크롤 유지 | Pass | E1 | B-1은 처음에 144 px 밀려 실패했다. `4585152`로 고친 뒤 재확인해 통과했다(`b1-before-2-back-shifted.png` → `b1-after-back-same.png`) |
| 10 | (2-1·2-2) 소스 모드 한글 IME, 조합 중 Ctrl+S | **Partial (사용자 확인 대기)** | E6 | B-2. Phase 0 스파이크에서 CM6 plain이 ①–⑧을 통과했다(Win10 새 IME). 자동 입력은 IME 조합 단계를 건너뛰므로 근거가 되지 않는다 |
| 11 | (2-2) 무편집 저장 바이트 불변, 한 줄 편집 diff는 그 줄에만 | Pass | E2·E5 | `bytes.txt` B-3: 세 파일 모두 3행만 바뀌고 EOL·BOM이 같다. `fixtures.rs`. V1.1에서 추가된 `eol` 옵션은 None이면 기존 경로를 탄다. V1.1 이후 실제 앱에서 다시 돌린 기록은 없다 |
| 12 | (2-3) mtime 오탐 없음(etag = 내용 해시) | Pass | E1·E2·E7 | `watch.rs`의 blake3, `save.rs`의 `expected_hash`, B-4(취소·덮어쓰기·다시 읽기 바이트 일치). mtime만 바뀐 경우는 코드로만 확인했다 |
| 13 | (2-4) 강제 종료 후 재시작하면 미저장 내용 복구 | Pass | E1·E2 | B-6(`taskkill /F`): 초안 JSON과 복구된 텍스트가 일치한다(`b6-recover-dialog.png`) |
| 14 | (2-5) 찾기·바꾸기, 이미지 붙여넣기 | Pass | E1·E2 | B-8, B-9 붙여넣기(PNG 400×300, `assets/`) |
| 15 | (2-5) 탐색기 이미지 끌어다 놓기 | **Partial (사용자 확인 대기)** | E1·E2 | B-9는 `tauri://drag-drop` 앱 경로만 확인했다. `b9-dropped.png`에는 하네스 1차 시도의 실패 배너가 남아 있다(경로의 `\b`가 이스케이프돼 os error 123). 앱 결함은 아니고 다음 시도가 성공했다(`bytes.txt`). 1-2의 `.md` 드롭 열기도 실제 OS 드래그 기록이 없다 |
| 16 | (S-1) `Ctrl+,` → 왼쪽 탭·오른쪽 항목, 없는 카테고리 id면 테스트 실패 | Pass | E5·E3 | `settings.test.ts` "모든 항목의 section이 SETTING_CATEGORIES에 있는 id", C-1 사용자 종결 |
| 17 | (S-2) 테마 변경 시 셸·본문·코드·선택 영역이 모두 새 색, 인쇄는 라이트 | Pass | E5·E7·E3 | `themes.ts`의 `theme-vars`, `github-markdown.css @media print`, C-2 |
| 18 | (S-3) 설정한 시간 동안 보간하고 끝나면 정확히 새 색, 0 또는 reduced-motion이면 즉시 | Pass | E7·E8·E3 | `@property` 등록, 헤드리스 Edge 보간 확인(9/30), C-3 |
| 19 | (S-4) 가져오기 → 목록·적용, 잘못된 파일 → 이유 표시·저장 안 함, 재시작 후 유지 | Pass | E5·E8·E3 | `themes.test.ts parseThemeFile`, CDP E2E, C-4·C-5 |
| 20 | (가로지르기) `samples/raw` 왕복 테스트를 CI에서 | Partial (spec drift) | E5 | 테스트는 있고 통과 기록도 있다. CI 러너는 없다 |
| 21 | (가로지르기) 보안 세트 | Partial (spec drift) | E7 | DOMPurify·스킴 허용 목록·`on_navigation`·`script-src 'self'`는 충족한다. asset scope 재귀와 원격 이미지 허용이 스펙과 다르다 |
| 22 | (가로지르기) 런타임 핀 | Pass | E7 | 위 Converge 표 참조 |
| 23 | (V1.1) 줄바꿈 LF ↔ CRLF 변환 | Pass | E5·E8 | `fixtures.rs`의 `convert_eol` 4건. 체감은 F-2 |
| 24 | (V1.1) 큰 문서 블록 묶음 | Pass | E8 | 10 MB 조작이 1–5 s에서 0.05–0.6 s로 줄었고, 묶기 전후 블록 위치 차이가 0 px다(헤드리스 Edge) |
| 25 | (V1.1) 오른쪽 클릭 '인쇄'도 1 MB 확인을 거침 | Partial (사용자 확인 대기, F-1) | E8 | CDP와 임시 진단 코드로만 확인했다. 실제 마우스로 해 본 기록은 없다 |
| 26 | (V1.1) 상태바 글자 수, 슬러그 `a--b`, 각주 `data-line` | Pass | E5 | `wordcount.test.ts` 5건, `index.test.ts`의 슬러그·각주 테스트 |

## Reference checklist

| Area | Result | Gap |
|---|---|---|
| Verbs (열기·보기·편집·저장) | Pass | 열기는 더블클릭, 두 번째 인스턴스, Ctrl+O, 최근 파일, `.md` 링크로 확인했다. 보기는 TOC·찾기·줌·테마, 편집은 CM6 소스, 저장은 Ctrl+S·다른 이름으로·인코딩/줄바꿈 변환으로 확인했다. OS 드롭만 실제 드래그 확인이 없다 |
| Core loop (더블클릭 → 읽기 → 고치기 → 저장) | Pass (B-2 조건) | 렌더 → `Ctrl+/` → 편집 → 바이트를 보존하는 저장 → 외부 변경 조용히 재로드까지 실제 앱 증거가 있다. 한글 입력 구간만 사용자 확인을 기다린다 |
| Timing / feel (시작 시간·큰 문서 조작 수치) | Partial | 시작 시간은 hello 기준 371–383 ms로, 실제 앱의 더블클릭부터 첫 페인트까지는 재지 않았다. 10 MB 열기 ≤ 5 s와 2 MB 조작 < 1 s는 사용자가 확인했다. 10 MB 조작 0.05–0.6 s는 헤드리스 수치다. 목차 다시 열기 ~0.3 s, 테마 전환 ~0.5 s가 남아 있다. 외부 변경 반영은 debounce 2 s로 3 s 안이다. 테마 보간은 250 ms다 |
| UI / feedback | Pass | 툴바가 없고 제목 표시줄을 앱이 그린다. 상태바에 보기/소스·인코딩·줄바꿈·줌·글자 수·기본 앱·관리자 표시가 있다. 비모달 배너를 쓰고, 팝업의 처음 포커스는 안전한 쪽(취소·다른 이름으로·저장)이다. Lossy는 배너 대신 상태바로 경고한다(표현 차이) |
| Edge cases (인코딩·EOL·충돌·초안·관리자 권한·경로) | Pass (작은 갭) | B-3·B-4·B-5·B-6·B-10과 1-7(관리자 UIPI 경고, 한글·공백·`[`·`#` 경로 이미지 10개)로 확인했다. 남은 갭은 WebView2 < 150 배너, `../` title, 같은 내용으로 다시 생긴 파일, Win11·이전 IME, 조합 중 `Ctrl+P`가 가드를 우회할 가능성(keydown 조기 return)이다 |

## Game QA

해당하지 않는다. 에디터라 밸런스·익스플로잇 축이 없다. 성능은 위 Timing 행에서 다뤘다.

## Intentional differences

- 편집 모델: Typora의 인라인 하이브리드 대신 보기/소스 두 모드를 쓴다(`Ctrl+/` 키는 같다). 인라인 라이브프리뷰는 Phase 5로 미뤘다(MVP V1 선택).
- 파일 충실도: Typora는 재직렬화하고(T9·#5772) 줄바꿈은 기본값만 정한다(T8). MdEditor는 무편집이면 원본 바이트를 그대로 쓰고, 줄별 EOL·BOM·끝 개행을 지키며, 줄바꿈 변환은 사용자가 명시할 때만 한다.
- 인코딩: Typora의 'Reopen with Encoding' 대신 chardetng 자동 감지와 상태바의 Encode in / Convert to를 둔다. 표현할 수 없는 문자는 UTF-8 변환을 묻는다.
- 외부 변경: mtime(T13·F17) 대신 내용 해시로 판정한다.
- 저장: Typora의 opt-in 5분 자동 저장 대신 자동 저장 없이 60 s 초안 백업과 복구 팝업을 둔다.
- 큰 문서: Typora의 2 MB 렌더 한도(T12) 대신 2 MB를 넘으면 큰 문서 모드로 10 MB까지 렌더한다. 1 MB 이상은 인쇄 전에 확인한다(D7).
- 원문 HTML: 허용 목록 태그만 렌더하고 나머지는 글자로 남긴다(D1). `www.` 자동 링크만 허용한다(D2).
- 테마: Typora의 CSS 파일 대신 색 토큰 JSON을 쓴다(임의 CSS 금지). 전환은 보간한다.
- 글자 수: Typora는 CJK 1자를 1단어로 센다(T3). MdEditor는 한글을 어절 단위로 세고, 한자·가나만 1자를 1단어로 센다.
- 단축키: 줌은 `Ctrl+=/-/0`(Typora는 `Ctrl+Shift+=`), 목차는 `Ctrl+\`, 탐색 영역은 `Ctrl+Shift+E`다.
- 파일 연결: OS의 '항상'에만 기대지 않고 OpenWithProgids, Capabilities, RegisteredApplications 등록과 앱 안의 '기본 앱' 버튼을 둔다(Typora T15보다 한 단계 더 간다).
- 한국어 타이포(keep-all, D2Coding 번들)는 추가 차별점이다. 탭 없음(T16)은 Typora와 같고 Phase 3에서 다룬다. 수식·Mermaid는 Phase 4다.

## Evidence used

| # | Type | Path | What it proves |
|---|---|---|---|
| E1 | screenshot | `docs/qa/20261001-phase2-b/` 아래 B-1·B-4~B-10 캡처 18장(`b1-*.png` … `b10-*.jpg`) | 실제 앱(설치본 0.1.0)의 B 항목 상태. 표본으로 `b4-conflict-dialog`·`b6-recover-dialog`·`b5-reopen-utf8-lossy`·`b9-dropped`·`b1-after-back-same`을 직접 열어 봤다 |
| E2 | telemetry (바이트 로그) | `docs/qa/20261001-phase2-b/bytes.txt` | B-3·B-4·B-5·B-6·B-9·B-10 바이트 판정 |
| E3 | runtime (사용자 실기 기록) | `docs/next-session.md` §1·§2 C/D. 1-7 1차·2차 결과는 git `5efcc50`·`5469432`의 `docs/next-session.md` | 1-7, 셸 트랙, AI 연동 종결. 기록은 텍스트뿐이고 캡처는 없다 |
| E4 | runtime (재설치) | `docs/next-session.md` §2 머리말(2026-10-06 `620ab78` 재설치) | 같은 버전에서 연결이 유지됨 |
| E5 | test (정적 집계, 재실행 안 함) | `crates/frond-core/tests/fixtures.rs`, `src/render/index.test.ts`, `src/settings.test.ts`, `src/theme/themes.test.ts`, `src/wordcount.test.ts` | vitest 104건, cargo 52건이 기록과 일치. `samples/raw`가 깨끗함 |
| E6 | telemetry (Phase 0) | `docs/decisions/ideas/20260929-stack.md`의 "Phase 0 결과 기록란", `ASSET.md`의 Rules & numbers | IME ①–⑧ 통과(Win10 새 IME), hello 시작 시간 |
| E7 | code inspection | `src-tauri/src/{lib,watch,save,assoc,elevation,print_menu}.rs`, `src-tauri/tauri.conf.json`, `src-tauri/nsis/hooks.nsh`, `src/render/*.ts`, `src/main.ts`, `src/theme/themes.ts`, `Cargo.lock` | Converge check 근거 |
| E8 | runtime (CDP·헤드리스 Edge) | `docs/next-session.md` §1 "2026-10-06 작업"·"2026-10-01 작업" | V1.1 수치, 메뉴 인쇄, S-3 보간. 저장된 파일 증거가 없는 텍스트 기록이라 상대적으로 약하다 |
| E9 | screenshot | `docs/screenshots/main.png` 외 7장 | UI 기조, 한글 keep-all |

## Verdict

- Status: **SHIPPABLE (조건부)**. 조건은 사용자가 **B-2 한글 IME**와 **B-9 탐색기 드래그**를 통과하는 것이다. 둘 다 통과하면 조건이 풀린다. 하나라도 실패하면 그 항목이 `NEEDS_FIX`가 된다.
  - 근거: 핵심 루프, 바이트 보존, 충돌, 초안, 설정·테마의 성공 조건이 실제 앱 증거(캡처와 바이트 로그)로 충족됐다. 발견한 괴리는 스펙 동기화(`NEEDS_SPEC` 급)와 작은 엣지 갭이고, 모두 차단 사유가 아니다.
  - 비차단 Partial이 몇 개 남는다. 1 s 열기는 간접 근거만 있다. 상위 버전 업그레이드는 버전 0.1.0이 그대로라 아직 시험할 수 없다. 1-7 8번과 Win11은 사용자가 승인한 보류다. F-1 실제 마우스 확인도 남아 있다.
- Next owner: Producer. 사용자에게서 B-2·B-9 결과를 받아 MVP를 닫고 D6를 진행한다. 병행할 비차단 작업은 Systems Analyst(스펙 동기화)와 Implementer(작은 갭)가 맡는다.
- Asset status to set: 지금은 `living`을 유지한다. B-2·B-9가 통과하면 `verified`로 바꾸고, `ASSET.md`의 Artifact links에 `fidelity-report.md`를 연결한다.
- Priority fixes:

1. **[B-2 실패 시, Implementer]**
   - 조합 중 `Ctrl+S` 뒤에 파일에 마지막 글자가 없으면 keydown(`main.ts:1172`)을 고친다. 지금은 조합 중 키를 무시하는데, 이를 `flushComposition()` → `save()` 순서로 받게 한다. flush 대기(60 ms)도 조정한다.
   - CM6에서 글자가 유실되거나 중복되면 스택 판정 Modified approach 1의 순서를 따른다. G6 플래그부터 시도하고, 다음은 textarea/EditContext다.
2. **[B-9 실패 시, Implementer]**
   - OS → `onDragDropEvent` 전달을 확인한다(빌더에 드롭 비활성화가 없음은 확인했다).
   - `dropImages`의 좌표 변환은 `position / devicePixelRatio`인데 편집기 CSS 줌(`--editor-zoom`)을 반영하지 않는다. 100 %가 아닌 DPI·줌에서 다시 확인한다.
   - B-9를 할 때 `.md` 파일을 보기 화면에 떨어뜨려 1-2 드롭 열기도 함께 본다.
3. **[NEEDS_SPEC, Systems Analyst, 차단하지 않음]** `system-spec.md`를 실제 구현에 맞춘다.
   - asset scope 재귀·누적과 CSP `img-src data: https:`(원격 이미지는 열 때 추적 픽셀이 될 수 있다)는 의도를 결정해 스펙에 적거나 코드를 좁힌다.
   - Open decisions 2·3의 실제 결과를 적는다(TOC 표시 규칙과 `Ctrl+\`, 줌을 기억하지 않음과 50–300 % 범위).
   - Lossy 표시는 상태바 경고로, `html` 정책은 D1로, CI는 "로컬 `cargo test` 필수"로 고친다.
   - Approval·Status를 갱신하고, Phase 2·셸 트랙은 로드맵 EARS를 스펙으로 갈음한다고 명기한다.
4. **[작은 갭, Implementer, 차단하지 않음]**
   - WebView2 < 150이면 시작 배너를 띄운다.
   - `../` 이미지에 `title="문서 폴더 밖"`을 단다.
   - 삭제된 파일이 같은 내용으로 다시 생기면 Missing 배너를 거둔다(`watch.rs` `last` 처리).
   - 드롭 실패 배너가 다음 성공 뒤에도 남지 않게 한다.
   - 조합 중 `Ctrl+P`가 기본 인쇄로 가드를 우회하는지 확인한다.
5. **[증거 보강, 차단하지 않음]**
   - 더블클릭부터 첫 페인트까지 한 번 잰다.
   - 첫 버전을 올릴 때(0.1.x → 0.2.0) 업그레이드 후 연결 유지를 한 번 확인한다.
   - V1.1 이후 실제 앱에서 B-3 바이트 보존을 한 번 다시 돌린다.
   - `b9-dropped.png`에 하네스 실패 배너라는 주석을 단다.
   - 1-7과 V1.1 CDP 확인은 캡처를 `docs/qa/`에 남긴다.

## 후속 처리 (2026-10-06, 구현 채팅)

| Priority fix | 처리 |
|---|---|
| 1 조합 중 `Ctrl+S` | B-2 결과를 기다리지 않고 먼저 고쳤다 — 조합 중 `Ctrl+S`·`Ctrl+Shift+S`는 글자를 확정(`flushComposition`)한 뒤 저장하고 편집기로 포커스를 돌린다. B-2에서 다시 본다 |
| 3 `NEEDS_SPEC` | `system-spec.md` "구현 반영" 절 — asset scope 재귀·누적, CSP 원격 이미지, Open decisions 1~3, Lossy 표현, LF 고정, 로컬 테스트 필수를 결정으로 닫고 Approval·Status 갱신 |
| 4 WebView2 < 150 | 시작 때 `webview_version` → 150 미만이면 배너 |
| 4 `../` 이미지 | 문서 폴더(하위 포함) 밖 이미지에 이유를 `title`로 (`links.ts`, 테스트 1건) |
| 4 같은 내용으로 다시 생긴 파일 | 사라질 때 감시의 마지막 해시를 비워 다시 생기면 `file-changed`가 오고, 프런트가 사라짐 배너를 거둔다 |
| 4 드롭 실패 배너 | 다음 붙여넣기·끌어다 놓기 때 지난 이미지 실패 배너를 거둔다 |
| 4 조합 중 `Ctrl+P` | 조합 중에도 앱이 가로채 글자를 확정한 뒤 큰 문서 확인(D7)을 거친다 |
| 2·5 | 그대로 — B-9 결과·다음 버전 올림 때 |

