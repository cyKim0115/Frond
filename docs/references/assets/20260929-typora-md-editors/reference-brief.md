# Reference Brief — Typora와 Windows 마크다운 에디터·뷰어 지형

- Date: 2026-09-29
- Similarity target: `inspired` — Typora의 편집 모델·UI 감각을 참고하되, 파일 처리·Windows 통합은 프로젝트 요구(바이트 보존·기본 앱 등록)에 맞춘다
- Asset id: `20260929-typora-md-editors` (`ASSET.md`와 동일)
- Sources: Perplexity Deep Research 4건(Typora `d1b922a5…`, OSS 대안 `24313d38…`, 스택 `fb061fba…`, 에디터 엔진 `d69bc9e1…`) + WebSearch/WebFetch 1차 자료(공식 문서·GitHub 이슈/소스·Microsoft Learn·docs.rs·npm·crates.io) — 상세는 아래 Evidence ledger
- 조사 방법: ultracode 워크플로 2런, 에이전트 35개, 도구 호출 약 1,560회. 8개 각도 조사 → 결정 영향 큰 주장 24건 독립 검증 → 누락 6건 보완 조사. 게임용 템플릿의 Timing/ADSR 절은 소프트웨어 UX 절로 치환했다

## User callouts

사용자가 직접 짚은 포인트. 에이전트 관찰과 섞지 않는다.

| # | Callout | Where | Intent |
|---|---------|-------|--------|
| 1 | "제일 레퍼런스로 삼고싶은것은 typora" | 2026-09-28 요청 | 편집 모델·UI의 1순위 벤치마크는 Typora |
| 2 | "깔끔한 UI에 MD를 띄우는것을 최소 가치" | 같은 요청 | MVP의 최소 가치는 **보기(렌더)**. 편집은 그 위에 얹는다 |
| 3 | "윈도우 프로그램으로 개발" | 같은 요청 | Windows 10/11 데스크톱 앱. 크로스플랫폼은 요구 아님 |
| 4 | "기본 프로그램으로 등록하여 md파일을 열때 사용" | 같은 요청 | 탐색기 더블클릭 → 앱 실행. 파일 연결·기본 앱 등록이 MVP 필수 |
| 5 | "MD파일을 읽거나 편집하는 프로그램" | 같은 요청 | 뷰어가 아니라 **편집기**. 저장 경로가 있다 |
| 6 | 무편집 저장 시 바이트 불변 (인코딩·줄바꿈·파일 끝 개행) | `CLAUDE.md`, `docs/next-session.md` §2-3, `samples/raw/` | 편집기이므로 사용자가 바꾸지 않은 바이트를 바꾸면 안 된다. 픽스처로 검증 |

## Evidence ledger

Method: `doc` 공식 문서·README·릴리스 노트·소스 / `tool` 계측·벤치·API 조회 / `seen` 이슈·포럼·사용자 보고 / `hypothesis` 추정.
Ev# 접두: **T** Typora · **W** Windows 네이티브 · **F** 파일 충실도 · **R** 렌더러 · **O** OSS 대안 · **S** 스택 · **E** 에디터 엔진 · **A** 파일 연결 · **G** 보완 조사 · **V** 독립 검증.

### T — Typora (1순위 레퍼런스)

| Ev# | Source | Where | Observation | Method | Conf | Note |
|-----|--------|-------|-------------|--------|------|------|
| T1 | support.typora.io Quick Start | https://support.typora.io/Quick-Start/ | 인라인 구문(`**`)은 입력 완료 즉시 숨고, 블록 구문(`###`)은 블록이 렌더되면 사라진다. 캐럿이 들어가면 다시 노출. 소스 코드 모드 토글 Ctrl+/ | doc | 0.9 | 1.13(2026-04)부터 소스↔하이브리드 전환 시 스크롤 위치 보존 |
| T2 | Table Editing | https://support.typora.io/Table-Editing/ | 표는 격자로 제자리 편집. Ctrl+T 삽입, Ctrl+Enter 행 추가, 마지막 셀 Tab 행 추가, 드래그로 행·열 재배열 | doc | 0.9 | |
| T3 | Shortcut Keys | https://support.typora.io/Shortcut-Keys/ | 사이드바 Ctrl+Shift+L, Outline Ctrl+Shift+1, File Tree Ctrl+Shift+3, Focus F8, Typewriter F9, 줌 Ctrl+Shift+=/-/0. 워드카운트는 상태바(CJK 1자=1단어) | doc | 0.9 | 파일 트리와 아웃라인은 한 사이드바에서 **전환**(동시 표시 아님) |
| T4 | What's New 1.14 | https://support.typora.io/What's-New-1.14/ | 1.14(2026-07-19): 선택형 플로팅 툴바, 사이드바 파일 필터, 파일 트리 키보드 탐색. 기본 레이아웃은 여전히 툴바 없는 미니멀 | doc | 0.9 | "깔끔함" = 툴바 없음 + 단일 편집면 + 사이드바 접힘 |
| T5 | About Themes | https://support.typora.io/About-Themes/ | 테마 = CSS 파일 1개. 라이트·다크 테마 별도 지정, `prefers-color-scheme` 지원, 커뮤니티 테마 200+ | doc | 0.8 | 본문 컨테이너 `#write`, 변수 `--bg-color` 등 (R29) |
| T6 | Auto-Save | https://support.typora.io/Auto-Save/ | Windows 자동 저장은 선택형, 기본 5분(`autoSaveTimer`). 크래시 시 `Recover Unsaved Drafts`로 `{date}-{filename}.md` 복구 | doc | 0.9 | 자동 저장과 초안 백업이 분리돼 있음 |
| T7 | typora-issues #6618 | https://github.com/typora/typora-issues/issues/6618 | 2026-08, 1.14.9: 편집 중 문서 버퍼가 통째로 비워지고 마지막 저장 이후 내용 소실. open | seen | 0.85 | 초안 복구가 있어도 손실 보고가 이어짐 |
| T8 | Typora on Windows | https://support.typora.io/Typora-on-Windows/ | `Settings → Editor → Default Line Ending`에서 LF/CRLF **기본값**만 선택. 파일별 원본 줄바꿈 보존은 문서화돼 있지 않음 | doc | 0.85 | #556(2017) 개발자 확인 |
| T9 | typora-issues #1316, #5772 | https://github.com/typora/typora-issues/issues/1316 | EOF 개행·후행 공백 옵션은 2018 우산 이슈에 묶여 미구현. #5772: 저장 시 손대지 않은 코드 블록 빈 줄에 공백이 추가돼 diff 오염 | doc | 0.85 | Typora는 문서 모델 재직렬화 → **바이트 보존 아님** |
| T10 | typora-issues #6402, #5030 | https://github.com/typora/typora-issues/issues/6402 | 기본 UTF-8. 비UTF-8은 `Reopen with Encoding`(파일별 기억 안 됨, 2025-08 open). BOM 중복 버그는 1.1에서 수정. CP949 이슈는 검색되지 않음 | doc | 0.85 | 한국어 CP949 케이스 검증 없음 |
| T11 | Images | https://support.typora.io/Images/ | `Allow copy images to given folder`, `Use relative path if possible`, `Ensure ./ Prefix`, 대상 `./assets` 등. YAML `typora-copy-images-to`, `typora-root-url` | doc | 0.9 | 이미지 상대경로 UX의 기준 |
| T12 | typora-issues #6290 | https://github.com/typora/typora-issues/issues/6290 | 4 MB 문서에서 "The file is too large to render". `frame.js` `MAX_FILE_SIZE = 2e6` 하드코딩(비공식) | seen | 0.8 | 인라인 WYSIWYG는 MB급에서 비선형 지연 |
| T13 | typora-issues #5209, #6560 | https://github.com/typora/typora-issues/issues/5209 | 미저장 변경 없으면 외부 변경 즉시 재로드, 있으면 경고. diff/merge 없음. OneDrive/iCloud 폴더 자동 재로드 실패(2026-05 open) | doc | 0.8 | mtime 기반 판정의 오탐(#5208·#1401) |
| T14 | winget appmakes.Typora | https://www.wingetly.io/apps/appmakes/typora | 1.14.10(2026-09-11). Inno Setup exe, x86/x64/arm64, user·machine 스코프, 관리자 권한 불필요. Windows 7/8은 1.5.12에서 중단 | doc | 0.85 | 설치기 ~100 MB |
| T15 | New File in Context | https://support.typora.io/New-File-in-Context/ | 기본 앱 지정은 Windows "연결 프로그램 → 항상" 경로에 의존. 자체 "Open with Typora" 동사는 미문서화. `새로 만들기 → Markdown` ShellNew 등록 버튼 제공(`HKCR\.md`="markdown", `ShellNew NullFile`). CLI `typora file.md` | doc | 0.85 | 파일 연결은 Typora보다 한 단계 더 갈 여지 |
| T16 | typora-issues #5807, #6651 | https://github.com/typora/typora-issues/issues/5807 | 개발자: "no Tab support… new document will always be opened in new window"(2023). 탭 요청은 #257(2016)부터 2026-09까지 지속 | doc | 0.9 | 탭 = 사용자가 가장 오래 요구한 부재 기능 |
| T17 | Markdown Reference | https://support.typora.io/Markdown-Reference/ | GFM 기반(펜스 코드만, 들여쓰기 코드 블록 미지원). 표·작업 목록·각주·`[toc]`·YAML·`:emoji:`·`==highlight==`·GitHub Alerts(1.10). HTML 허용 | doc | 0.9 | |
| T18 | Math | https://support.typora.io/Math/ | 수식은 **MathJax**(1.13에서 v4). 인라인 `$…$`는 설정 필요. Mermaid 11.13(설정에서 켜야 렌더) | doc | 0.9 | KaTeX가 아님 — 방언 차이 |
| T19 | typora-issues #6312, #6508 | https://github.com/typora/typora-issues/issues/6312 | Windows 빌드는 Electron(1.11.5=Electron 35 개발자 확인, 1.14=Electron 42 사용자 보고). Chromium 140+ `text-autospace` 등 CJK 타이포 개선은 Electron 릴리스를 따라가야 함 | doc | 0.75 | WebView2 Evergreen이면 시스템 런타임으로 자동 반영 |
| T20 | typora-issues #6302, #6554, #4251 | https://github.com/typora/typora-issues/issues/6554 | Windows 중국어 IME 커서 점프(2025-03 open), YAML 뒤 첫 문단 후보창 소실(2026-05), 한글 조합이 백틱 뒤에서 자모로 분리(#4251 open) | seen | 0.85 | contenteditable 인라인 편집의 구조적 IME 위험 |
| T21 | What's New 1.0, EULA | https://support.typora.io/What's-New-1.0/ | 1.0(2021-11-23)부터 $14.99 일회 결제, 3대, 15일 체험. 메이저 업데이트는 유료 가능 | doc | 0.9 | |
| T22 | HN 'Typora 1.0' | https://news.ycombinator.com/item?id=29360720 | 찬사: 단일 면 편집의 차분함, 일회 결제, 평문 파일. 불만: Electron 무게, 탭·플러그인·Vim 부재, 온라인 활성화, Obsidian Live Preview로 이탈 | seen | 0.8 | |
| T23 | obgnail/typora_plugin | https://github.com/obgnail/typora_plugin | 4.6k★ 비공식 패치: 다중 탭, 워크스페이스, 접기, 아웃라인 강화, 커맨드 팔레트, 슬래시 명령 | seen | 0.8 | 사용자가 패치해서라도 원하는 기능 목록 |
| T24 | 종합 | — | 분할 창 대비 차별: 이중 화면 없음 → 스크롤 동기 자체가 불필요, 캐럿이 시각 결과 위, 표·체크박스·수식 직접 조작, 문서 폭이 절반으로 안 줄어듦. 대가: 숨은 구문·바이트 비보존 | hypothesis | 0.8 | |

### W — Windows 네이티브·Windows 중심 제품과 OS 기본 동작

| Ev# | Source | Where | Observation | Method | Conf | Note |
|-----|--------|-------|-------------|--------|------|------|
| W1 | Microsoft Q&A | https://learn.microsoft.com/en-us/answers/questions/5788351/md-file-type | Windows 11 클린 설치에서 `.md`는 등록된 형식이 아니라 설정 > 기본 앱에 나타나지 않는다. "연결 프로그램 → 항상 이 앱 사용"으로 지정해야 등록됨 | seen | 0.8 | Windows 10 사용자 PC(19045)도 동일 |
| W2 | Windows Insider 블로그 (2015) | https://blogs.windows.com/windowsexperience/2015/05/20/announcing-windows-10-insider-preview-build-10122-for-pcs/ | Windows 10부터 앱은 스스로 기본 앱 변경 프롬프트를 띄울 수 없다. 새 핸들러 설치 후 파일 더블클릭 시 Windows가 프롬프트 | doc | 0.9 | |
| W3 | Default Programs (Win32) | https://learn.microsoft.com/en-us/windows/win32/shell/default-programs | ProgId(`Software\Classes\<ProgId>`: DefaultIcon, `shell\open\command`) + `Capabilities\FileAssociations` + `RegisteredApplications`. "never reclaim a default without asking the user" | doc | 0.85 | |
| W4 | Launch Settings | https://learn.microsoft.com/en-us/windows/apps/develop/launch/launch-settings | `ms-settings:defaultapps?registeredAppUser=<앱 이름>`로 해당 앱의 기본 앱 페이지 직행(Win11 21H2+ 2023-04 업데이트 이상) | doc | 0.9 | 공식 "사용자에게 선택을 맡기는" 경로 |
| W5 | VS Code code.iss | https://github.com/microsoft/vscode/blob/main/build/win32/code.iss | `associatewithfiles` 태스크(기본 체크): `Software\Classes\.md\OpenWithProgids`=`VSCode.md` + ProgId `VSCode.md`(설명, AppUserModelID, 아이콘, `shell\open\command "Code.exe" "%1"`). 사용자 설치 HKCU / 시스템 설치 HKLM. `.markdown/.mdown/.mdtext/.mdoc` 동일 | doc | 0.9 | "연결 프로그램에 등장하되 기본값 강탈 안 함" 모델 |
| W6 | tauri-bundler FileAssociation.nsh | https://github.com/tauri-apps/tauri/blob/dev/crates/tauri-bundler/src/bundle/windows/nsis/FileAssociation.nsh | Tauri 2 NSIS는 ext마다 `APP_ASSOCIATE`: `Software\Classes\.<ext>` 기본값을 백업 후 ProgId로 **덮어쓰고** DefaultIcon·`shell\open\command` 기록, `SHChangeNotify(SHCNE_ASSOCCHANGED)`. `OpenWithProgids`는 쓰지 않음. 제거 시 백업 복원 | doc | 0.9 | 기본 템플릿만으로는 VS Code식 "예의 바른" 등록이 아님 → hooks 검토 |
| W7 | Tauri 2 config reference | https://v2.tauri.app/reference/config/ | `bundle.fileAssociations[]`: `ext`(필수), `name`, `description`(Windows 탐색기 유형 열), `mimeType`, `role`(기본 Editor), `rank` | doc | 0.9 | isunky/MDView 실사용 예 (W12) |
| W8 | MarkText PR #5463 | https://github.com/marktext/marktext/pull/5463 | 업데이트 시 언인스톨러가 연결을 지우고 무음 재설치가 재등록을 건너뛰어 더블클릭이 조용히 실패. 해결: ProgId 무조건 등록, `OpenWithProgids`, 실제 제거 시만 삭제, 경로 따옴표 | doc | 0.85 | 설치기 설계 교훈 |
| W9 | Windows Insider 블로그 (2025-05-30) + Notepad 릴리스 노트 | https://learn.microsoft.com/en-us/windows-insider/release-notes/apps/notepad | Windows 11 Notepad 11.2504.50.0부터 Markdown 서식(굵게/기울임/링크/목록/제목), 11.2510 표, 11.2606.15.0(2026-07-24) `.md/.markdown` 서식 적용 수정. `.md`를 스스로 등록하지 않음. Windows 10 Notepad에는 없음 | doc | 0.95 | "최소 가치"의 기준선이자 경쟁자 |
| W10 | Q&A 스레드, gridinsoft | https://blog.gridinsoft.com/windows-11-notepad-markdown-file-link-flaw/ | Notepad 재열기 시 서식 손실 보고. CVE-2026-20841: Markdown 모드가 file://·UNC·ms-appinstaller:// 링크를 경고 없이 실행(2026-02 수정) | seen | 0.75 | 렌더러 링크 스킴 정책 설계에 직접 참고 |
| W11 | Markdown Monster 다운로드·Changelog | https://markdownmonster.west-wind.com/download | v4.5.4(2026-09-24), WPF + WebView2 + Markdig + Monaco(4.5.1부터), .NET 10, 설치기 20 MB, 포터블, $99. 문서 탭당 WebView2 → "initial loading… slower and janky"(저자). `LineFeedMode` 기본 Lf, UTF-8 BOM 기본 | doc | 0.85 | WPF+WebView2 후보의 '완성형' 레퍼런스이자 반면교사 |
| W12 | isunky/MDView | https://github.com/isunky/MDView | Tauri 2 + React 19 + TS + Vite, v3.4.3(2026-09-24), MSI+포터블, `fileAssociations: ext ["md","markdown"], name "Markdown Document", mimeType text/markdown, role Editor` | doc | 0.85 | 후보 스택과 동일 조합의 실동작 .md 연결 뷰어 |
| W13 | mdview2026/mdview | https://github.com/mdview2026/mdview | Rust + wry(WebView2) + tao, md4c, 설치기 2.0 MB, 1초 내 열림, 첫 실행 시 .md 자동 연결, `--install/--unbind`, GBK 인코딩 폴백, v1.0.169(2026-09-28) | doc | 0.85 | WebView2 뷰어의 경량 상한선 실증 |
| W14 | PowerToys #45267 | https://github.com/microsoft/PowerToys/issues/45267 | "Windows lacks a native, lightweight, 'read-only' application for sustained reading of Markdown files"(2026-02, open). TOC 사이드바 + Mermaid + GFM 뷰어 제안 | seen | 0.8 | MVP 공백을 그대로 서술 |
| W15 | PowerToys MarkdownPreviewHandlerControl.cs | https://github.com/microsoft/PowerToys/blob/main/src/modules/previewpane/MarkdownPreviewHandler/MarkdownPreviewHandlerControl.cs | 보안 잠금 WebView2: `IsScriptEnabled=false`, `AreHostObjectsAllowed=false`, `AreDevToolsEnabled=false`, `--block-new-web-contents`, 가상 호스트 Deny, 로컬 이미지는 문서 폴더 트리로 제한·원격 차단. Markdig.Signed 0.34.0 | doc | 0.9 | MVP 렌더러 보안 정책으로 차용 |
| W16 | QuickLook MarkdownViewer 플러그인 | https://github.com/QL-Win/QuickLook/tree/master/QuickLook.Plugin/QuickLook.Plugin.MarkdownViewer | WebView2 + `md2html.html`(markdown-it + highlight.js + mermaid + github-markdown.css), UTF.Unknown 인코딩 감지. 4.5.0(2026-04) | doc | 0.9 | 읽기 전용 렌더링 UX의 사실상 표준. 렌더 스택 그대로 이식 가능 |
| W17 | WebView2 Distribution | https://learn.microsoft.com/en-us/microsoft-edge/webview2/concepts/distribution | Evergreen WebView2는 Windows 11에 포함, Windows 10 "vast majority" 설치됨. 부트스트래퍼 ~2 MB. 감지 레지스트리 `…\EdgeUpdate\Clients\{F3017226-…}` pv | doc | 0.95 | Tauri 2·WPF+WebView2 공통 전제 |
| W18 | MarkdownPad 2 FAQ, Markdown Edit README, MarkdownViewer++ | https://github.com/mike-ward/Markdown-Edit | MarkdownPad 2(2013 종료, Win11 24H2 오류), Markdown Edit(WPF, 2018 종료, "use VS Code"), MarkdownViewer++(아카이브). Windows 네이티브 편집기 생태계는 사실상 Markdown Monster 하나 | doc | 0.9 | |
| W19 | NppMarkdownPanel 0.9.3 | https://github.com/mohzy83/NppMarkdownPanel | Markdig + WebView2 소형 오픈소스. 0.9.3(2026-07)에서 임의 코드 실행 취약점 수정 | doc | 0.9 | Markdown→HTML→WebView2 파이프라인의 보안 반면교사 |
| W20 | Windows 10 lifecycle | https://learn.microsoft.com/en-us/lifecycle/products/windows-10-home-and-pro | Windows 10 22H2 지원 종료 2025-10-14. 개발 PC(19045)에는 Notepad Markdown·Peek 없음 | doc | 0.95 | |

### F — 파일 충실도·파일 수명주기

| Ev# | Source | Where | Observation | Method | Conf | Note |
|-----|--------|-------|-------------|--------|------|------|
| F1 | VS Code files.contribution.ts | https://raw.githubusercontent.com/microsoft/vscode/main/src/vs/workbench/contrib/files/browser/files.contribution.ts | `files.encoding` 기본 utf8, `files.autoGuessEncoding` 기본 false, `files.candidateGuessEncodings` 기본 []. 기본 상태에서 CP949는 UTF-8로 잘못 읽힘 | doc | 0.95 | 자동 감지는 opt-in이 업계 기본 |
| F2 | VS Code encoding.ts | https://raw.githubusercontent.com/microsoft/vscode/main/src/vs/workbench/services/textfile/common/encoding.ts | BOM 검사 → jschardet.detect(후보 제한). 샘플 512×8 ~ 512×128 바이트. `euckr` 항목만 있고 cp949 별도 없음(iconv-lite EUC-KR 테이블이 UHC 포함) | doc | 0.9 | |
| F3 | VS Code #336685 | https://github.com/microsoft/vscode/issues/336685 | 2026-09: 짧은 non-UTF-8 파일이 다음 후보로 넘어가지 않고 잘못된 UTF-8로 폴백. 짧은 입력에서 통계 감지 신뢰도 급락 | seen | 0.85 | `samples/raw/cp949.md`처럼 짧은 픽스처는 벤치 필요 |
| F4 | chardetng | https://github.com/hsivonen/chardetng | 1.0.0(2026-03). EUC-KR·Shift_JIS·GBK·Big5 감지, UTF-8은 허용 플래그 필요, TLD 힌트. 한자 5자 이하 GBK는 한국어로 오판 가능, 미매핑 문자 1개로 EUC-KR 탈락 | doc | 0.9 | 후보를 [UTF-8, EUC-KR]로 제한하면 안정 |
| F5 | encoding_rs | https://docs.rs/encoding_rs/latest/encoding_rs/ | 'EUC-KR' = windows-949 전체 테이블 → CP949 손실 없는 디코드. `decode()`는 BOM 제거, `decode_without_bom_handling()`은 안 함. 인코더는 불가 문자를 `&#NNNN;`으로 치환 → `had_errors` 검사 필수 | doc | 0.9 | Tauri 선택 시 1순위 |
| F6 | WHATWG Encoding | https://encoding.spec.whatwg.org/#euc-kr | WebView `TextDecoder('euc-kr')`는 CP949 디코드 가능. `TextEncoder`는 UTF-8 전용 → CP949 **재인코딩은 네이티브**(encoding_rs/.NET) 또는 iconv-lite 필요 | doc | 0.9 | |
| F7 | .NET CodePagesEncodingProvider | https://learn.microsoft.com/en-us/dotnet/api/system.text.codepagesencodingprovider?view=net-9.0 | .NET Core/5+는 CP949 미포함. `Encoding.RegisterProvider(CodePagesEncodingProvider.Instance)` 후 `GetEncoding(949)` | doc | 0.95 | |
| F8 | File.WriteAllText | https://learn.microsoft.com/en-us/dotnet/api/system.io.file.writealltext | `File.ReadAllText`는 BOM 제거, `WriteAllText(string,string)`은 BOM 없는 UTF-8. 편의 API로 열고 저장하면 BOM 소실·CP949 손상 | doc | 0.95 | .NET 선택 시에도 바이트 I/O 직접 구현 |
| F9 | Notepad++ 매뉴얼, #3759 | https://npp-user-manual.org/docs/encoding/ | BOM → 자동감지(uchardet) → UTF-8 유효성 → ANSI 순. 'Encode in'(해석만)/'Convert to'(바이트 변경) 분리. 자동 감지가 UTF-8을 오판해 손상시킨 사례 | doc | 0.85 | 인코딩 메뉴 UX 벤치마크 |
| F10 | Obsidian 도움말·플러그인 | https://forum.obsidian.md/t/viewing-a-file-with-different-line-endings-causes-file-to-save-with-new-line-endings/37955 | Obsidian은 UTF-8 전용. CRLF 파일을 열기만 해도 LF로 재저장(스태프: 버그 아닌 기능 요청) | seen | 0.75 | 레퍼런스 둘 다 못 하는 차별점 |
| F11 | VS Code pieceTreeTextBufferBuilder.ts, #127 | https://raw.githubusercontent.com/microsoft/vscode/main/src/vs/editor/common/model/pieceTreeTextBuffer/pieceTreeTextBufferBuilder.ts | `files.eol` auto: CR+CRLF > 절반이면 CRLF, 아니면 LF로 **다수결 후 전부 정규화**. 혼합 EOL 보존 요청 #127은 2015년부터 Backlog | doc | 0.9 | `samples/raw/mixed-eol.md` 보존은 VS Code도 못 함 |
| F12 | Sublime 포럼 | https://forum.sublimetext.com/t/all-line-endings-are-converted-on-file-save/5507/4 | 열 때 메모리에서 `\n`으로 정규화, 저장 시 설정 하나로 통일. 혼합 보존 옵션 없음 | seen | 0.85 | "메모리 정규화 후 통일 저장" 모델 — 피해야 할 설계 |
| F13 | CodeMirror lineSeparator | https://codemirror.net/docs/ref/#state.EditorState^lineSeparator | CM6 기본은 `\n`,`\r\n`,`\r` 모두 분리자, `toString()`은 `\n`. `lineSeparator` facet을 두면 단일 분리자 왕복 보존. 혼합 파일은 나머지가 줄 내부 제어문자로 남음. Zettlr 개발자도 직접 분리/재결합 | doc | 0.85 | 줄별 EOL 보존 계층은 앱 책임 |
| F14 | Notepad EOL 블로그 | https://devblogs.microsoft.com/commandline/extended-eol-in-notepad/ | Windows Notepad는 1809부터 기존 파일 줄바꿈 형식 유지, 새 파일만 CRLF | doc | 0.7 | OS 기본 앱이 최소 기대치 충족 |
| F15 | VS Code 기본값, MarkText preference.json | https://github.com/marktext/marktext/blob/develop/packages/desktop/static/preference.json | VS Code `insertFinalNewline`/`trimFinalNewlines`/`trimTrailingWhitespace` 기본 false. MarkText `autoGuessEncoding true`, `endOfLine default`, `trimTrailingNewline 2`(자동 감지) | doc | 0.9 | "보존이 기본, 정리는 opt-in" |
| F16 | VS Code #41250, saveConflictResolution | https://github.com/Microsoft/vscode/issues/41250 | dirty 아니면 조용히 리로드, dirty 상태 저장 시 'content on disk is newer' + Compare/Overwrite. 충돌 판정은 etag | seen | 0.85 | 표준 UX |
| F17 | typora-issues #5208, #1401 | https://github.com/typora/typora-issues/issues/5208 | mtime 기반 판정이라 git checkout처럼 타임스탬프만 바뀌어도 충돌, 네트워크 드라이브에서 자기 저장을 외부 변경으로 오인 | seen | 0.85 | 내용 해시로 판정해야 함 |
| F18 | Obsidian Sync 도움말 | https://obsidian.md/help/sync/troubleshoot | 외부 수정 시 diff-match-patch 자동 병합(1.9.7부터 conflict file 옵션). 병합 순간 포커스 손실 보고 | doc | 0.8 | |
| F19 | notify docs, tauri-plugin-fs | https://docs.rs/notify/latest/notify/ | 에디터별 저장 방식이 달라 정밀 이벤트에 의존하지 말고 debouncer 사용. 네트워크 FS는 PollWatcher. `tauri-plugin-fs` 2.6.0 `watch()`는 notify-debouncer-full, `delayMs` 기본 2000 | doc | 0.9 | |
| F20 | .NET FileSystemWatcher, chokidar | https://learn.microsoft.com/en-us/dotnet/api/system.io.filesystemwatcher | 한 작업에 여러 이벤트, 버퍼 초과 시 유실, 8.3 이름 보고 가능. chokidar `atomic`(100 ms), `awaitWriteFinish` 2000/100 | doc | 0.9 | 어느 스택이든 디바운스 + 자기 저장 무시 필수 |
| F21 | VS Code·Obsidian·Typora 자동 저장 | https://support.typora.io/Auto-Save/ | VS Code autoSave 기본 off + hotExit 백업. Obsidian ~2초 저장 + File Recovery 5분 스냅샷 7일. Typora opt-in 5분 + 초안 복구 | doc | 0.9 | |
| F22 | Obsidian 포럼, typora #1213 | https://forum.obsidian.md/t/data-loss-0-byte-files-revisited/17953 | Obsidian 0바이트 파일 손실 반복 보고. Typora #1213: 자동 저장이 수동 저장 체크포인트를 덮어써 되돌릴 수 없음 | seen | 0.7 | 자동 저장과 '이전 저장본 되돌리기'는 분리 |
| F23 | VS Code #98063 | https://github.com/microsoft/vscode/issues/98063 | 저장은 truncate→write 2단계라 크래시 시 빈 파일 위험. 원자 교체는 워처 혼란 트레이드오프 | doc | 0.9 | |
| F24 | ReplaceFileW | https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-replacefilew | 생성시간·ACL·ADS·압축 속성 보존 교체. 같은 볼륨 필요. Rust `std::fs::rename`은 MoveFileExW(보안 설명자 미이전), `NamedTempFile::persist`는 fsync 안 함 | doc | 0.9 | Windows에서는 ReplaceFileW 래핑이 정답 |
| F25 | tauri-plugin-fs commands.rs | https://raw.githubusercontent.com/tauri-apps/plugins-workspace/v2/plugins/fs/src/commands.rs | `write_file`은 truncate 후 직접 쓰기(비원자). `readTextFile`은 fatal 없는 TextDecoder → CP949가 조용히 U+FFFD. `readFile`은 원시 바이트 | doc | 0.9 | Tauri 선택 시 fs 플러그인 그대로 쓰면 안 됨 |
| F26 | onedrive #3439, typora #6560 | https://github.com/abraunegg/onedrive/issues/3439 | temp+rename 저장은 동기화 클라이언트와 충돌 사본을 만들 수 있음. OneDrive Files On-Demand 위 ReplaceFileW는 실측 필요 | hypothesis | 0.6 | |
| F27 | VS Code textModel.ts | https://raw.githubusercontent.com/microsoft/vscode/main/src/vs/editor/common/model/textModel.ts | 20 MB 또는 30만 줄 초과 시 토큰화 중단(largeFileOptimizations), 50 MB 확장 호스트 동기화 중단 | doc | 0.9 | 크기별 기능 축소 단계의 참고 수치 |

### R — 렌더러·하이라이트·수식·다이어그램·이미지·테마·스크롤 동기화

| Ev# | Source | Where | Observation | Method | Conf | Note |
|-----|--------|-------|-------------|--------|------|------|
| R1 | markdown-it 15.0.2 | https://cdn.jsdelivr.net/npm/markdown-it@15.0.2/dist/markdown-it.mjs | Token `map=[line_begin,line_end]` 기본 제공 → `data-line` 매핑 즉시 가능. `html` 기본 false, `highlight` 훅 동기 | doc | 0.9 | |
| R2 | VS Code scroll-sync.ts | https://github.com/microsoft/vscode/blob/main/extensions/markdown-language-features/preview-src/scroll-sync.ts | `data-line`+`code-line` 부여 후 두 요소 사이를 선형 보간, 역방향은 이진 탐색 | doc | 0.9 | 분할 편집 채택 시 참고 구현 |
| R3 | Joplin sync_scroll 스펙 | https://joplinapp.org/help/dev/spec/sync_scroll/ | 에디터 % → 줄 기반 % → 뷰어 %의 GUI 독립 중간 표현 | doc | 0.85 | |
| R4 | markdown-it validateLink | (R1과 동일) | 기본 `validateLink`가 `file:`·`data:`를 차단 → 로컬 링크는 렌더 규칙에서 재작성 필요 | doc | 0.8 | |
| R5 | marked 문서, macwright | https://marked.js.org/ | marked는 출력 미살균, 커뮤니티 비권장. micromark/remark·markdown-it 권장 | doc | 0.8 | marked 제외 |
| R6 | micromark/remark | https://github.com/micromark/micromark | ESM 전용, 위치정보 포함 AST, 기본 safe. `data-line`은 자체 rehype 플러그인 필요 | doc | 0.8 | markdown-it 대안 |
| R7 | DOMPurify 3.4.16 | https://github.com/cure53/DOMPurify | gz ~11–13 KB, 의존성 0. `html:true`로 raw HTML 통과 시 innerHTML 직전 적용이 표준 | doc | 0.9 | |
| R8 | comrak 0.55.0 | https://raw.githubusercontent.com/kivikakk/comrak/main/src/html.rs | `render.sourcepos` → 블록·인라인에 `data-sourcepos="L:C-L:C"`. 확장 최다(alerts, math, footnotes, front_matter, wikilinks, `cjk_friendly_emphasis`). 기본 raw HTML 스크럽 | doc | 0.9 | Rust 백엔드 렌더 시 1순위 |
| R9 | pulldown-cmark 0.13.4 | https://docs.rs/pulldown-cmark/latest/pulldown_cmark/struct.Options.html | 빠르지만 `into_offset_iter()` 바이트 오프셋으로 직접 매핑. CJK-friendly 강조 미채택 | doc | 0.9 | |
| R10 | Markdig 1.4.0 | https://xoofx.github.io/markdig/docs/advanced/ast/ | `UsePreciseSourceLocation()` + `GetAttributes().AddProperty("data-line")`. 20+ 확장, CJK 강조 규칙 채택. WPF에서 보려면 WebView2 필요(Markdig.Wpf 2024-03 아카이브) | doc | 0.9 | .NET 선택 시 렌더러 확정 후보 |
| R11 | Shiki 4.4.3 | https://shiki.style/guide/bundles | JS RegExp 엔진(3.9.1+ 전 언어)으로 WASM 없이 동기 사용. web 번들 gz 695 KB → fine-grained core + 언어 5~10개 권장. dual theme `--shiki-dark` | doc | 0.9 | 품질 우선 시 |
| R12 | chsm.dev 실측 (2025-01) | https://chsm.dev/blog/2025/01/08/comparing-web-code-highlighters | 압축 번들 Prism 11.7 KiB / hljs 15.6 KiB / Shiki 279.8 KiB(WASM 기준). 블록당 Prism 0.5–0.7 ms, hljs 1.1–1.4 ms, Shiki 3.5–5.0 ms. 정확도는 Shiki | tool | 0.8 | |
| R13 | highlight.js 11.12.0, Prism README | https://github.com/PrismJS/prism | hljs는 core + 언어별 지연 로드. Prism 1.30.0은 v2 작업 중 기능 PR 동결 → 신규 채택 비권장 | doc | 0.85 | MVP 초기 hljs, 후에 Shiki 교체 가능 |
| R14 | KaTeX 0.18.9 / MathJax 4.1.3 | https://katex.org/ | KaTeX 동기 렌더, JS gz 77 KB + CSS + 폰트. MathJax는 커버리지 넓고 Typora가 사용 | doc | 0.85 | 기본 KaTeX. Typora 호환 최우선이면 MathJax |
| R15 | Mermaid 12.0.0 | https://github.com/mermaid-js/mermaid/releases | ES2024 요구, gz 172 KB, tiny 빌드 ~50%. `startOnLoad:false` + `render()`, `securityLevel strict` 기본 | doc | 0.85 | 펜스 감지 시 dynamic import |
| R16 | Tauri asset.rs | https://github.com/tauri-apps/tauri/blob/dev/crates/tauri/src/protocol/asset.rs | `app.security.assetProtocol {enable, scope}`, CSP `img-src asset: http://asset.localhost`. `convertFileSrc`는 Windows에서 `http://asset.localhost/<절대경로>`. 경로 traversal·scope 검사 | doc | 0.9 | |
| R17 | tauri scope/fs.rs | https://docs.rs/tauri/latest/src/tauri/scope/fs.rs.html | `asset_protocol_scope().allow_directory(path, recursive)`로 런타임 확장 가능. dialog 플러그인은 fs scope만 넓히고 asset scope는 안 넓힘(#9946 open) | doc | 0.75 | 앱이 열린 문서 폴더를 직접 asset scope에 추가해야 이미지 표시 |
| R18 | 종합 | https://v2.tauri.app/reference/javascript/api/namespacecore/ | 상대 이미지는 렌더 단계에서 문서 디렉터리 기준 절대경로로 resolve → `convertFileSrc` 재작성. 폴더 `**` 허용은 노출 범위가 넓으니 문서 폴더 단위·비재귀 검토 | hypothesis | 0.7 | |
| R19 | WebView2 local content | https://learn.microsoft.com/en-us/microsoft-edge/webview2/concepts/working-with-local-content | file URL / `NavigateToString`(2 MB 제한) / 가상 호스트 매핑(https origin, 상대 URL 해석) / `WebResourceRequested`(느림) 비교 | doc | 0.9 | |
| R20 | SetVirtualHostNameToFolderMapping | https://learn.microsoft.com/en-us/dotnet/api/microsoft.web.webview2.core.corewebview2.setvirtualhostnametofoldermapping | 매핑 변경은 페이지 reload 필요, 폴더별 고유 호스트 권장, 최소 권한(Deny/DenyCors) | doc | 0.9 | .NET 선택 시 이미지 경로 전략 |
| R21 | github-markdown-css 5.9.0 | https://github.com/sindresorhus/github-markdown-css | `.markdown-body`, 980 px, `prefers-color-scheme` 자동 다크. 코드 하이라이트 스타일 미포함 | doc | 0.9 | MVP 기본 테마 최속 선택 |
| R22 | Typora 테마 문서 + github.css 사본 | https://theme.typora.io/doc/Write-Custom-Theme/ | `#write` max-width 860 px(≥1400 px 1024, ≥1800 px 1200), padding 30 px, html 16 px / line-height 1.6, Open Sans 스택, h1 2.25em·h2 1.75em·h3 1.5em | seen | 0.75 | "Typora풍" 수치 |
| R23 | Pretendard, Noto Sans KR | https://github.com/orioncactus/pretendard | Pretendard 9웨이트 가변 OFL, Noto Sans KR 가변. 폴백 `Pretendard, "Noto Sans KR", "Malgun Gothic", system-ui` | doc | 0.85 | |
| R24 | markdown-cjk-friendly | https://github.com/tats-u/markdown-cjk-friendly | `**강조**。`처럼 CJK 인접 강조가 CommonMark 규칙상 미인식(commonmark-spec#650). markdown-it/remark/comrak/Markdig은 플러그인·옵션 있음, pulldown-cmark·markdown-rs 없음 | doc | 0.85 | 한국어 앱 필수 |
| R25 | markdown-it-anchor, @mdit/plugin-* | https://github.com/valeriangalliat/markdown-it-anchor | 앵커·TOC·alert·tasklist·footnote·katex 플러그인 갖춰짐. TOC 사이드바는 heading 토큰 순회로 자체 생성이 단순 | doc | 0.8 | |
| R26 | MeasureThat 벤치 (2025-05) | https://www.measurethat.net/Benchmarks/Show/34403/1/markdown-parser-performance-comparison-as-of-may-2025 | ~2,000줄 parse: remarkable 7,110 / markdown-it 3,880 / marked 2,327 ops/s. 단일 문서 프리뷰에는 파서가 병목 아님 | tool | 0.6 | |

### O — 오픈소스·크로스플랫폼 Typora 대안 (Perplexity Deep Research `24313d38…` + 1차 자료 검증)

| Ev# | Source | Where | Observation | Method | Conf | Note |
|-----|--------|-------|-------------|--------|------|------|
| O1 | MarkText releases | https://github.com/marktext/marktext/releases | v0.19.1 정식(2026-06-06, setup.exe 110.8 MB), v0.20.0-rc.6(2026-09-24)에서 Muya를 TS로 재작성 중. "0.17.1에서 버려짐"은 더 이상 사실 아님 | doc | 0.95 | FOSS 중 유일하게 성숙한 인라인 WYSIWYG + 직접 .md + Windows |
| O2 | marktext #2189, #5043 | https://github.com/marktext/marktext/issues/2189 | 유지보수자: "we don't store the document as string… build the text file when saving". #5043(2026-07): 열기만 해도 빈 줄 삽입·리스트 변환으로 dirty | doc | 0.9 | AST 재직렬화 → 바이트 보존 구조적 불가 |
| O3 | MarkText PREFERENCES.md | https://github.com/marktext/marktext/blob/develop/packages/website/content/docs/end-user/PREFERENCES.md | `endOfLine default/lf/crlf`, `trimTrailingNewline 0–3`, `autoGuessEncoding true`, `defaultEncoding utf8`(35개 enum), `autoNormalizeLineEndings false` | doc | 0.85 | 옵션 설계 참고. "원본 그대로"는 없음 |
| O4 | marktext #5279, #4851 | https://github.com/marktext/marktext/issues/5279 | 2026-09 Shift+Enter 뒤 CJK IME 개행 소실(CompositionEvent에 inputType 없음), 코드펜스 뒤 일본어 IME 깨짐 | doc | 0.9 | 커스텀 contentEditable 엔진은 IME 엣지를 계속 패치 |
| O5 | SoloMD PR #123, 블로그 | https://solomd.app/blog/webview2-ime-why-we-left-contenteditable/ | "A CodeMirror-based editor cannot do reliable CJK IME on WebView2" → v4.7(2026-06)부터 Windows만 `<textarea>` 블록 편집기. 4.14.3에서 CodeMirror 엔진 선택 복귀(기본 Native) | doc | 0.9 | 검증 런타임은 149.0.4022.69 한 버전 (G1 참조) |
| O6 | web-text #2 | https://github.com/ale-160/web-text/issues/2 | Chromium 149.0.7827.103+ / Edge 149.0.4022.62+에서 contenteditable 첫 조합 입력 폐기. Electron v39(Chromium 142)·Firefox 비영향 | seen | 0.75 | 근본 원인은 G1 |
| O7 | tauri #15436 | https://github.com/tauri-apps/tauri/issues/15436 | 기존 텍스트가 있는 textarea·contenteditable 첫 포커스 시 TSF 프리즈(조합창 안 뜸). Win10 19045·Win11, WebView2 148. 우회 전부 실패, needs triage | doc | 0.8 | textarea도 완전 우회 아님. 한국어 재현 미검증 |
| O8 | Mymux #36, tao PR #1215 | https://github.com/ChoiGyber/Mymux/issues/36 | 한국 개발자 앱: 한글 IME 키 처리 + 포커스 전환이 겹치면 tao 0.35.3 이하가 영구 데드락. tao 0.35.4/0.36.0에서 수정(2026-06-10 병합), tauri 2.12.0은 tao 0.37.0 핀 | seen | 0.85 | Tauri 채택 시 tao ≥ 0.35.4 필수 |
| O9 | Obsidian changelog 1.14.2 | https://obsidian.md/changelog/2026-09-15-desktop-v1.14.2/ | Early access: OS 'Open with' 메뉴 등장 + Markdown 기본 앱 지정 가능(최신 인스톨러). 공개판 1.13.8까지는 vault 중심, .md ProgId 없음 | doc | 0.95 | Electron 앱도 인스톨러 갱신으로 연결 구현 |
| O10 | Obsidian 플러그인 Line Ending Controller | https://community.obsidian.md/plugins/line-ending-controller | "Obsidian's editor (CodeMirror 6) normalizes all line endings to LF internally… silently converts" → 저장 후 되돌리는 방식으로 우회 | doc | 0.85 | CM6 채택 시 EOL·BOM 보존 계층은 앱 책임 |
| O11 | Markra package.json, releases | https://github.com/markrahq/markra | Tauri 2 + React 19 + Milkdown 7, AGPL-3.0, v2.12.0(2026-09-24) setup.exe 12 MB. Typora 테마 호환. 2026-09 한 달간 Windows IME 수정 4건(#706·#707·#709·#657) | doc | 0.9 | Tauri+ProseMirror 경로 실증. AGPL이라 코드 차용 불가 |
| O12 | Paperling | https://github.com/Razee4315/Paperling | Tauri 2 + CM6 + React, Apache-2.0, v1.0.51(2026-09-26) 13.7 MB. Reader/Code/Split + 양방향 스크롤 동기, KaTeX 지연 로드, Mermaid, callout. 인라인 WYSIWYG 아님 | doc | 0.9 | 뷰어+분할 MVP 구조의 깨끗한 참조 |
| O13 | GitHub 릴리스 자산 실측 | https://github.com/drl990114/MarkFlowy/releases/tag/v0.101.1 | Tauri 앱 setup.exe: MDHero 5.4 / Markpad 8.3 / TizuMark 9.2 / Markra 12.0 / SoloMD 13.7(msi) / Paperling 13.7 / MarkFlowy 19.3 MB. Electron MarkText 110.8 MB. WebView2 오프라인 동봉 시 233 MB | tool | 0.95 | 경량 배포 목표치 |
| O14 | TizuMark README | https://github.com/tizuio/TizuMark-Markdown-Editor | Tauri 2.5, Windows 전용, `.md/.markdown/.mdown/.mkd` 등 10개 확장자 연결 명시, ~7 MB, 메모리 50 MB 미만 주장 | doc | 0.8 | 확장자 등록 참고 |
| O15 | MDHero 0.2.10 릴리스 노트 | https://github.com/vaibhav-kakde-in/mdhero/releases/tag/v0.2.10 | "Files saved as 'UTF-8 with BOM' render correctly. A file from Windows Notepad lost its first heading" — BOM 미제거 버그 | doc | 0.9 | `samples/raw/utf8-bom.md`가 필요한 이유 |
| O16 | Typedown (byxiaozhi) | https://github.com/byxiaozhi/Typedown | WinUI 3 + WebView2 + Muya 벤더링, MIT, MS Store. 코드 커밋 2023-04, README 2024-03 → 정체. 이슈 69개 미해결 | doc | 0.9 | WinUI 3 후보의 유일한 직접 선례 |
| O17 | @muyajs/core README | https://github.com/marktext/marktext/blob/develop/packages/muya/README.md | contentEditable 블록 트리 + OT, CommonMark 0.31 적합률 87.7% / GFM 86.3%, npm 0.2.0. 독립 저장소는 2026-05-29 아카이브 후 모노레포 흡수 | doc | 0.85 | 의존 대상으로는 보류 |
| O18 | Milkdown 7.22.2, Vditor 4.0.0 | https://github.com/Milkdown/milkdown/releases/tag/v7.22.2 | Milkdown MIT(ProseMirror+remark, Crepe), Vditor MIT(Lute, IR 모드 Typora식, 한국어 로케일). Markditor(Tauri+Vditor)는 WIP "Be careful when editing" | doc | 0.85 | 엔진 후보. E 절에서 판정 |
| O19 | Zettlr 4.8.0, VNote 4.8.0, Ghostwriter 26.08.1 | https://github.com/vnotex/vnote/releases/tag/v4.8.0 | Zettlr Electron 43 + CM6(소스+데코, EOL 정책 없음). VNote Qt 네이티브 텍스트 위젯 → WebView2 IME 무관(프리뷰만 웹), Windows는 zip. Ghostwriter Windows 포터블만 | doc | 0.85 | "네이티브 편집 위젯 + 웹 프리뷰"가 IME 회피 대안임을 보여줌 |
| O20 | SiYuan/Joplin/Logseq/Notesnook | https://github.com/siyuan-note/siyuan | DB·JSON 저장 모델(SiYuan `.sy`, Joplin SQLite, Logseq DB 베타, Notesnook IndexedDB) → 임의 .md 바이트 보존 핸들러 모델 아님 | doc | 0.85 | 참고 대상 제외 |
| O21 | Obsidian 개발자 문서 | https://docs.obsidian.md/Plugins/Editor/Editor+extensions | "Obsidian uses CodeMirror 6 to power the Markdown editor" — Live Preview = CM6 데코레이션/위젯 | doc | 0.9 | Typora형 UX를 contentEditable 블록 엔진 없이 구현한 대표 사례 |
| O22 | 종합 | https://github.com/marktext/marktext/issues/5043 | 조사한 편집기·엔진 중 CRLF/LF/혼합·BOM·끝 개행 보존을 문서화한 곳은 없음. MarkText·Milkdown·Vditor·Muya는 재직렬화, CM6 계열은 내부 LF 정규화 | hypothesis | 0.8 | 프로젝트 핵심 차별점 |

### S — 앱 스택 (Perplexity Deep Research `fb061fba…` + 1차 자료 검증)

| Ev# | Source | Where | Observation | Method | Conf | Note |
|-----|--------|-------|-------------|--------|------|------|
| S1 | Tauri 2 config reference, tauri-utils 2.10.0 | https://v2.tauri.app/reference/config/ | `bundle.fileAssociations[]`: `ext`(필수, 점 자동 제거) · `name`(기본 ext[0]; **NSIS에서 ProgId 키 이름으로 그대로 사용**) · `description`(Windows 전용, 탐색기 유형 열; 없으면 `MD File`) · `mimeType`(Windows 미사용) · `role` · `rank` | doc | 0.95 | V1 확인. `name`은 `MdEditor.Markdown`처럼 벤더 접두 권장 |
| S2 | installer.nsi (dev, 2026-09-15), FileAssociation.nsh | https://raw.githubusercontent.com/tauri-apps/tauri/dev/crates/tauri-bundler/src/bundle/windows/nsis/installer.nsi | `APP_ASSOCIATE`가 SHCTX `Software\Classes\.ext` 기본값(+`_backup`)·ProgId·DefaultIcon·`shell\open\command "exe" "%1"`만 기록. `OpenWithProgids`·`Applications\exe`·`Capabilities`·`RegisteredApplications` 없음. `UPDATEFILEASSOC`(SHChangeNotify) 매크로는 정의만 있고 installer.nsi에서 호출 안 함. `NSIS_HOOK_PRE/POSTINSTALL`, `PRE/POSTUNINSTALL` 훅 사용 가능 | doc | 0.9 | V2 확인. 훅으로 표준 등록 보강 |
| S3 | single-instance windows.rs, CHANGELOG | https://raw.githubusercontent.com/tauri-apps/plugins-workspace/v2/plugins/single-instance/src/platform_impl/windows.rs | `{id}-sim` 뮤텍스 → `FindWindowW` → `"{cwd}\|{args}\0"` WM_COPYDATA(1542) → `exit(0)`. 2.4.5부터 `AllowSetForegroundWindow`. args[0]=exe, 더블클릭 경로=args[1]. 반드시 첫 플러그인으로 등록 | doc | 0.9 | V3 확인. 경쟁 조건 #3587(open), 관리자 권한 UIPI #3643 |
| S4 | deep-link 문서, examples/file-associations | https://v2.tauri.app/plugin/deep-linking/ | Windows에서 파일 연결·딥링크는 새 프로세스의 명령줄 인자. 첫 실행 `std::env::args().skip(1)`, 실행 중이면 single-instance 콜백. deep-link `onOpenUrl`은 파일 연결에 발화 안 함(#1990). `args()`는 비유니코드 인자에서 panic → `args_os()` | doc | 0.85 | V4 확인. CLI 플러그인 불필요 |
| S5 | Windows Installer 문서 | https://v2.tauri.app/distribute/windows-installer/ | NSIS `installMode currentUser`(기본, 관리자 불필요, `%LOCALAPPDATA%`)/`perMachine`/`both`. `webviewInstallMode`: downloadBootstrapper(기본) / embedBootstrapper(~1.8 MB) / offlineInstaller(~127 MB) / fixedRuntime(~180 MB) / skip. MSI는 Windows에서만 빌드 | doc | 0.9 | |
| S6 | WebView2 Distribution | https://learn.microsoft.com/en-us/microsoft-edge/webview2/concepts/distribution | Win11 내장, Win10 "vast majority" 설치. 감지 레지스트리 `…\EdgeUpdate\Clients\{F3017226-…}` `pv`. Tauri NSIS/WiX가 동일 키로 감지·설치 처리 | doc | 0.95 | V5 확인 |
| S7 | tauri releases | https://api.github.com/repos/tauri-apps/tauri/releases?per_page=8 | tauri 2.12.0(2026-09-26): Windows 7 지원 종료, `app > appDirectoriesOverride`로 포터블 구성, wry 0.57.0 / tao 0.37.0 핀 | doc | 0.9 | |
| S8 | WindowConfig.dragDropEnabled, wry 0.57.0 | https://docs.rs/tauri-utils/latest/tauri_utils/config/struct.WindowConfig.html | 기본 true. 켜면 wry가 WebView2 IDropTarget을 교체해 `onDragDropEvent`(paths)를 주지만 페이지 내부 HTML5 DnD API 전체가 죽음. 끄면 드롭된 파일의 절대 경로를 얻을 수 없음(WebView2 #501). 런타임 토글 미구현(#13189) | doc | 0.9 | V6 확인. 파일 드롭 열기 ↔ 에디터 내 HTML5 DnD 양자택일. 내부 이동은 pointer 이벤트로 |
| S9 | fs 플러그인 문서 | https://v2.tauri.app/plugin/file-system/ | `capabilities/*.json`에 권한·scope 선언 필수, 누락 시 `forbidden path`. 임의 경로 .md는 Rust 커맨드 직접 I/O가 단순 | doc | 0.9 | |
| S10 | encoding_rs 0.8.42 docs | https://docs.rs/encoding_rs/latest/encoding_rs/struct.Encoding.html | `decode()` BOM 스니핑·제거, `decode_without_bom_handling()`, `for_bom()`. **CP949 왕복은 조건부**: WHATWG EUC-KR은 0x80·오류 바이트열을 U+FFFD로, 인코더는 매핑 불가 문자를 `&#NNNN;`으로 치환하며 BOM을 쓰지 않음 → 원본 바이트 보관 + `*_without_replacement` 계열로 손실 감지 | doc | 0.9 | V7 정정 |
| S11 | chardetng 1.0.0 docs | https://docs.rs/chardetng/latest/chardetng/struct.EncodingDetector.html | 1.0.0(2026-03-30) API: `new(Iso2022JpDetection)`, `feed`, `guess(tld, Utf8Detection::{Allow,Deny})`(bool 아님). UTF-16은 BOM 계층 담당. 실무 순서: BOM → `from_utf8` 검증 → 실패 시 `guess(None, Deny)` | doc | 0.9 | V8 정정 |
| S12 | .NET CodePagesEncodingProvider, 로컬 실측 | https://learn.microsoft.com/en-us/dotnet/api/system.text.codepagesencodingprovider | `System.Text.Encoding.CodePages.dll`은 .NET Core 3.0+ 공유 프레임워크 내장(NuGet 불필요). 등록 후 `GetEncoding(949)` 정상, `"euc-kr"`은 51949로 UHC 확장 한글 손상 → 949 사용. `GetEncoding(0)`이 949로 바뀌는 부작용, `Encoding.Default`는 UTF-8 유지 | tool | 0.95 | V9 정정 (.NET 10.0.9, Win10 19045 실측) |
| S13 | .NET 지원 정책 | https://dotnet.microsoft.com/en-us/platform/support/policy/dotnet-core | .NET 8/9 지원 종료 2026-11-10. .NET 10 LTS(2025-11-11 ~ 2028-11-14). .NET 계열이면 `net10.0-windows` | doc | 0.95 | V10 확인 |
| S14 | WebView2Feedback #5475/#5625/#5675/#5637 | https://github.com/MicrosoftEdge/WebView2Feedback/issues/5625 | 2025-12~2026-08 열린 CJK IME 이슈 4건, MS 직원 댓글 0건. #5475(한글 '하' 조합 중 포커스 이탈 시 크래시, MAUI), #5625(첫 글자 유실, Tauri), #5675(한국어 MS IME 조합창 위치, Tauri), #5637(프로그램적 한/영 전환 무시). "WPF/WinUI 3에도 공통"은 추론(보고는 MAUI·Tauri뿐) | seen | 0.8 | V11 정정. #5625 근본 원인은 G1 |
| S15 | Electron app 문서 | https://www.electronjs.org/docs/latest/api/app | `open-file`은 macOS 전용, Windows는 `process.argv` 파싱. `requestSingleInstanceLock` + `second-instance(argv, cwd)`. 44.4.5(Chromium 152). 번들 244–323 MB, 유휴 100–300 MB | doc | 0.95 | V13 확인. IME 스파이크 실패 시 폴백 |
| S16 | Windows App SDK rich activation | https://learn.microsoft.com/en-us/windows/apps/windows-app-sdk/applifecycle/applifecycle-rich-activation | `ActivationRegistrationManager.RegisterForFileTypeActivation`은 per-user만, 실제로 `HKCU\Software\Classes\App.<exe 해시>.File` ProgId 기록. `AppInstance.FindOrRegisterForKey` + `RedirectActivationToAsync`로 단일 인스턴스. WPF에서도 사용 가능 | doc | 0.9 | V14 정정 |
| S17 | WinUI 3 배포·성능 | https://learn.microsoft.com/en-us/windows/apps/windows-app-sdk/deploy-unpackaged-apps | 비패키지 앱은 Windows App Runtime + VC++ 재배포 + 부트스트래퍼 필요(self-contained 옵션은 있음). 시작 성능 개선 진행 중(사용자 보고 4–5초) | doc | 0.85 | V15 정정. "즉시 뜨는 경량 편집기"와 어긋남 |
| S18 | Flutter #172270, PR #186353 | https://github.com/flutter/flutter/pull/186353 | 한글 캐럿 위치 버그는 3.47.0(2026-08-12)에 수정 병합. 그러나 #191196(조합 상태 누출) 등 잔존, 자체 텍스트 스택이라 시스템 IME와 다름, HTML 렌더·Markdown 생태계 빈약 | doc | 0.85 | V16 정정. 비추 유지 |
| S19 | Better Stack, gethopp 벤치 | https://betterstack.com/community/guides/scaling-nodejs/tauri-vs-electron-vs-deno-vs-electrobun/ | Tauri vs Electron: 번들 57 vs 323 MB, 시작 311 vs 273 ms, 유휴 109 vs 128 MB(모두 macOS). Rust 릴리스 빌드 1m21s vs 15.8s. **Windows 실측 없음** | tool | 0.7 | 프로토타입에서 측정 |
| S20 | Tauri #10968, markdown-reader #248 | https://github.com/petertzy/markdown-reader/issues/248 | 'Open with'에 앱 이름 대신 description 표시(PR #10975로 수정). Tauri .md 리더가 패키지 빌드에서 더블클릭 실패(argv·single-instance·비ASCII 경로 후보) | seen | 0.7 | argv→프론트 전달을 초기에 테스트 |

### E — 에디터 엔진 (Perplexity Deep Research `d69bc9e1…` + 1차 자료 검증)

| Ev# | Source | Where | Observation | Method | Conf | Note |
|-----|--------|-------|-------------|--------|------|------|
| E1 | @codemirror/state 6.7.6 소스 | https://codemirror.net/docs/ref/#state.EditorState^lineSeparator | 기본은 `\n`,`\r\n`,`\r` 모두 분리자 → `\n`으로 합침. `lineSeparator` facet을 줘도 **`state.doc.toString()`은 항상 `\n`**, `state.sliceDoc()`만 지정 분리자 사용. static facet(create 시 확정). 혼합 EOL은 어떤 설정으로도 복원 불가 | doc | 0.95 | V18 정정. 줄별 EOL 맵은 앱 계층 |
| E2 | Milkdown #1579, PR #1765 | https://github.com/Milkdown/milkdown/issues/1579 | 연속 빈 줄이 접힘. 수정은 빈 문단을 `<br />`로 직렬화하는 우회이며 유지보수자 "support `\n\n\n\n` is not the goal"(2025-04) | doc | 0.9 | V19 정정. ProseMirror 계열의 구조적 한계 |
| E3 | Tiptap #8134, #8294 | https://github.com/ueberdosis/tiptap/issues/8134 | `\#`·`1\.` 이스케이프가 직렬화 시 소실(2026-09-29 open, PR #8140 미병합). 표 셀 `\|` 손실은 PR #8295로 2026-09-22 병합됐으나 npm 3.31.3에 미포함 | doc | 0.92 | V20 확인, V21 정정 |
| E4 | Lexical #4843, BlockNote 문서 | https://www.blocknotejs.org/docs/features/import/markdown | Lexical `.trim()` 공백 소실 이력, transformer 재직렬화. BlockNote 공식: Markdown import는 "lossy" | doc | 0.9 | 부적합 |
| E5 | Lute format_renderer.go | https://github.com/88250/lute/blob/master/render/format_renderer.go | Lute는 GopherJS(WASM 아님). 들여쓰기 코드→펜스, 중·서문 공백 삽입, 번호 재부여, CRLF→LF, 앞뒤 공백 제거 후 개행 1개. Vditor IR/WYSIWYG `getValue()`는 DOM→AST→포매터 경유(무편집 저장도 변형, #1938) | doc | 0.85 | V22 정정. 부적합 |
| E6 | @lezer/markdown, @milkdown/preset-gfm | https://github.com/lezer-parser/markdown | Lezer GFM = Table·TaskList·Strikethrough·Autolink(+Sub/Superscript·Emoji), **각주 없음**. Milkdown preset-gfm은 footnote 노드 포함 | doc | 0.9 | CM6 채택 시 각주 확장 자체 구현 |
| E7 | ProseMirror #1551, #1484 | https://github.com/ProseMirror/prosemirror/issues/1551 | #1551(CJK×Windows×Chromium 클릭 시 중복/삭제)은 유지보수자가 3회 재현 실패한 **미확인** 보고. #1484(Chrome 128 한글 Enter 시 마지막 글자 소실)는 1.34.2에서 Windows IME Enter 처리 수정 | seen | 0.8 | V23 정정 |
| E8 | Tiptap·Lexical 이슈 검색 | https://api.github.com/search/issues?q=repo:ueberdosis/tiptap+korean+composition | 2025-08~2026-08 Tiptap 한국어 IME PR·이슈 다수(#7899·#8189 open). Lexical 2026-07~08 한국어 이슈 4건(#8834 open) | seen | 0.8 | ProseMirror 계열은 회귀 반복 |
| E9 | codemirror/dev #1684 | https://github.com/codemirror/dev/issues/1684 | Windows 11 Chrome 148 중국어 IME 삭제 버그는 CodeMirror가 아니라 Chromium 회귀(crbug 498745133, `autocorrect="off"` 처리 CL이 원인, 2026-04 revert). Chrome 148 Beta에서 소멸 확인 후 closed | seen | 0.85 | V24 정정. G1과 같은 계열 |
| E10 | discuss.codemirror.net 9877, 9785 | https://discuss.codemirror.net/t/adjacent-highlightwhitespace-marker-spans-become-one-span-containing-ime-preedit-text-during-composition/9877 | marijn: "for composition, we have to let the browser do its native thing… if the library messes with the DOM near an active composition, the browser will abort it". mark 안 다중 replace 데코레이션이 IME 선택을 깨는 사례 | seen | 0.85 | 라이브프리뷰는 compositionend까지 데코 교체 지연 |
| E11 | CM6 million-lines 예제, ProseMirror 포럼 8860, Zenn | https://codemirror.net/examples/million/ | CM6 뷰포트 렌더링으로 수백만 줄 처리. ProseMirror 가상 스크롤 "quite difficult", Milkdown/Crepe 100 KB 초과에서 성능 저하 보고(2026-02) | doc | 0.85 | 2 MB급 파일 요구에 CM6 유리 |
| E12 | 저장소 상태 | https://github.com/codemirror/dev | ProseMirror/CodeMirror/Lezer GitHub 저장소 2026-04 아카이브 → code.haverbeke.berlin 이전(npm은 계속: view 6.43.13, lang-markdown 6.5.2). TOAST UI Editor 2026-09-02 아카이브. Muya 2026-05-29 아카이브. ink-mde 2024-09 이후 릴리스 없음. tiptap-markdown → 공식 @tiptap/markdown | doc | 0.95 | 이슈 추적은 GitHub 밖 |
| E13 | bundlephobia | https://bundlephobia.com/api/size?package=@milkdown/crepe@7.22.2 | codemirror 메타패키지 118.75 KB gz / @milkdown/crepe 460 KB gz / @mdxeditor/editor 578 KB gz / vditor 70 KB gz(+Lute) | tool | 0.8 | |
| E14 | Obsidian 도움말·개발자 문서 | https://docs.obsidian.md/Plugins/Editor/Editor+extensions | Live Preview: "When your cursor enters formatted content, the underlying syntax becomes visible for editing" — CM6 데코레이션으로 상용 수준 구현 전례 | doc | 0.92 | |
| E15 | 종합 | https://codemirror.net/docs/ref/#state.EditorState^lineSeparator | 바이트 보존 아키텍처: (1) 원본 바이트·인코딩·BOM·줄별 EOL·끝 개행을 앱 계층에 보관, (2) 무편집 저장은 원본 그대로, (3) 편집 시 변경 줄만 파일 지배 EOL 적용, (4) 렌더는 뷰포트+선택 밖에만 replace/widget, 조합 중 갱신 지연. ProseMirror 계열은 한 글자만 고쳐도 전체 재직렬화라 (3) 불가 | hypothesis | 0.75 | E 절 결론 |

### A — Windows 파일 연결·기본 앱 등록 (심화)

| Ev# | Source | Where | Observation | Method | Conf | Note |
|-----|--------|-------|-------------|--------|------|------|
| A1 | MS 'Default apps platform' (ms.date 2026-09-26) | https://learn.microsoft.com/en-us/windows/apps/develop/windows-integration/default-apps-platform | "Windows does not allow programmatic changes to default apps without user interaction in system UI… Registry-based changes are not supported… protected by UCPD.sys". 앱이 할 일: 타입 등록, `ms-settings:defaultapps` 안내, `IApplicationAssociationRegistration::QueryCurrentDefault`로 현재 기본 조회. 새 앱 설치 후 해당 파일을 열면 Windows가 자동으로 선택 프롬프트 | doc | 0.95 | 공식 입장 |
| A2 | PS-SFTA, kolbi | https://raw.githubusercontent.com/DanysysTeam/PS-SFTA/master/SFTA.ps1 | `FileExts\.md\UserChoice`의 `ProgId`+`Hash`(SID·확장자·ProgId·분 단위 시각·비밀 문자열의 MD5 파생). 틀리면 무시·리셋 | tool | 0.85 | 앱이 쓰면 안 되는 방식(정책 위반) |
| A3 | kolbi 2024/2025 | https://kolbi.cz/blog/2025/04/20/userchoicelatest-microsofts-new-protection-for-file-type-associations/ | UCPD.sys(2024-02)는 http/https/.pdf/.htm/.html/Office만 보호(.md 미포함). 2025-04부터 Win11에 `UserChoiceLatest`(machine ID 포함) A/B 롤아웃 → 레거시 키가 stale일 수 있음 | tool | 0.8 | "내가 기본인가"는 `QueryCurrentDefault`로 |
| A4 | Launch default apps settings | https://learn.microsoft.com/en-us/windows/apps/develop/launch/launch-default-apps-settings | `ms-settings:defaultapps?registeredAppUser=<RegisteredApplications 값 이름>`(per-user) / `registeredAppMachine` / `registeredAUMID`. Win11 21H2+(2023-04 CU) 이상. Win10은 `ms-settings:defaultapps`만 | doc | 0.95 | |
| A5 | Default Programs (Win32) | https://learn.microsoft.com/en-us/windows/win32/shell/default-programs | `Software\<Vendor>\<App>\Capabilities`(`ApplicationDescription` 필수, `ApplicationName`, `FileAssociations\.md=ProgId`) + `HKCU\Software\RegisteredApplications\<App>`. 기본값은 per-user 등록. 이 이름이 ms-settings 딥링크·`LaunchAdvancedAssociationUI`의 `pszAppRegistryName` | doc | 0.8 | |
| A6 | LaunchAdvancedAssociationUI 문서 | https://learn.microsoft.com/en-us/windows/win32/api/shobjidl/nf-shobjidl-iapplicationassociationregistrationui-launchadvancedassociationui | Win10부터 연결 대화상자 대신 "설정에서 바꿀 수 있다" 안내 대화상자만 표시 | doc | 0.95 | |
| A7 | renenyffenegger FileExts | https://renenyffenegger.ch/notes/Windows/registry/tree/HKEY_CURRENT_USER/Software/Microsoft/Windows/CurrentVersion/Explorer/FileExts/index | Open with → Always는 `UserChoice`(ProgId, Hash) + `OpenWithList` MRU 갱신. 미등록 exe를 고르면 ProgId `Applications\<exe>.exe` + `HKCU\Software\Classes\Applications\<exe>\shell\open\command`(경로 고정) | seen | 0.7 | 포터블 exe도 사용자가 고르면 동작 |
| A8 | fa-file-types | https://learn.microsoft.com/en-us/windows/win32/shell/fa-file-types | HKCR = HKCU\Software\Classes(우선) + HKLM 병합. per-user 등록 권장. "Whenever an application takes over this file type by changing the default value, it should also add an entry to [OpenWithProgIds]" | doc | 0.95 | |
| A9 | How to Register a File Type | https://learn.microsoft.com/en-us/windows/win32/shell/how-to-register-a-file-type-for-a-new-application | 언인스톨 시 ProgId 키는 삭제하되 `.ext` 기본값은 건드리지 말 것("Leave the file type mappings unchanged at uninstall time"). 미등록 ProgId는 무시됨 | doc | 0.95 | |
| A10 | MarkText PR #5463, VS Code #337750 | https://github.com/marktext/marktext/pull/5463 | MarkText: 업데이트 시 `.md` 키 통삭제 + `/S` 재등록 누락 → UserChoice가 삭제된 ProgId를 가리켜 더블클릭 무반응. VS Code: User 설치판 제거 후 `.ext` 기본값 고아(2026-09). 교훈: ProgId 이름 불변, 삭제는 자기 ProgId·`OpenWithProgids` 값만 | seen | 0.8 | |
| A11 | tauri #9803 | https://github.com/tauri-apps/tauri/issues/9803 | NSIS 설치 시 '연결 프로그램' 추천 목록에 안 뜨고 '다른 앱 선택'에서만 보임, MSI는 전혀 안 뜸(2024-05 open). `OpenWithProgids`·`Applications\<exe>\SupportedTypes` 미기록과 정합 | seen | 0.8 | 훅 보강 근거 |
| A12 | Tauri main.wxs | https://raw.githubusercontent.com/tauri-apps/tauri/dev/crates/tauri-bundler/src/bundle/windows/msi/main.wxs | MSI는 `InstallScope="perMachine"` 고정(관리자 필요), `Advertise="yes"` 광고 등록, Windows에서만 빌드 | doc | 0.75 | 개인용 per-user 앱에는 NSIS |
| A13 | examples/file-associations main.rs | https://raw.githubusercontent.com/tauri-apps/tauri/dev/examples/file-associations/src-tauri/src/main.rs | Windows: `args().skip(1)`, `-` 시작 인자 스킵, `file://`면 `to_file_path()`, 각 파일 `asset_protocol_scope().allow_file()`, `initialization_script`로 주입(따옴표 이스케이프 없음 → JSON 직렬화 권장) | doc | 0.85 | |
| A14 | SHChangeNotify | https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-shchangenotify | `SHChangeNotify(SHCNE_ASSOCCHANGED, SHCNF_IDLIST\|SHCNF_FLUSH, NULL, NULL)` 없으면 재부팅 전까지 미반영 | doc | 0.95 | 런타임 HKCU 등록 직후에도 호출 |
| A15 | fa-verbs, app-registration | https://learn.microsoft.com/en-us/windows/win32/shell/fa-verbs | `shell\open\command`는 항상 `"exe" "%1"` 따옴표. 탐색기 다중 선택 열기는 파일당 프로세스 1개 → 단일 인스턴스가 N개 병합. argv는 UTF-16 → 한글·공백 경로 안전 | doc | 0.8 | |
| A16 | Rick Strahl 블로그, MM Portable 문서 | https://weblog.west-wind.com/posts/2017/Jul/17/Updating-Windows-Applications-and-Installers-for-nonAdmin-Installation | Inno `PrivilegesRequired=lowest`, HKCU `Software\Classes\.md`/`.markdown` + ProgId. 포터블은 첫 실행 시 `Registry.CurrentUser`에 자기 등록, `mmcli -uninstall`로 제거 | doc | 0.85 | 포터블 + 런타임 HKCU 등록 선례 |
| A17 | VS Code code.iss | https://raw.githubusercontent.com/microsoft/vscode/main/build/win32/code.iss | `Software\Classes\.md\OpenWithProgids` 값 `VSCode.md`(REG_NONE, `deletevalue uninsdeletevalue`) + ProgId `VSCode.md`("Markdown Source File", 아이콘, `"Code.exe" "%1"`). `.md` 기본값을 쓰지 않음 | doc | 0.9 | 후보 등록형. `associatewithfiles` 태스크 기본 체크 여부는 두 조사가 상충(W5: 체크 / A: unchecked) — 설치본에서 확인 |
| A18 | Obsidian 포럼 #314, 108337 | https://forum.obsidian.md/t/in-windows-11-associate-file-extension-md-to-obsidian-strange-behaviour/108337 | 공개판 Obsidian은 `obsidian://`만 등록, .md ProgId 없음, vault 밖 파일 열기 미지원(2020년부터 요청). Early access 1.14.2에서 추가(O9) | seen | 0.75 | |
| A19 | Linguist languages.yml, RFC 7763 | https://raw.githubusercontent.com/github-linguist/linguist/main/lib/linguist/languages.yml | Markdown 확장자 `.md .markdown .mdown .mdwn .mkd .mkdn .mkdown …`, MIME `text/markdown`. 권장: `.md`·`.markdown` = ProgId 기본값 후보 + `OpenWithProgids`; `.mdown/.mkd/.mkdn/.mdwn` = `OpenWithProgids`만; `.txt` = Notepad 기본 유지, `OpenWithProgids`만 | hypothesis | 0.7 | |
| A20 | Typora on Windows, #560 | https://support.typora.io/Typora-on-Windows/ | 설치기가 .md 자동 연결(per-user/admin). 2017 #560 연결 경로로 열면 안 열리던 전력. 고유 ProgId·`OpenWithProgids`·Capabilities 여부 미공개 | doc | 0.6 | 설치 후 레지스트리 덤프로 확인 |

### G — 보완 조사 (누락 점검 6건)

| Ev# | Source | Where | Observation | Method | Conf | Note |
|-----|--------|-------|-------------|--------|------|------|
| G1 | Chromium 523134891, CL 7917332 | https://chromium-review.googlesource.com/c/chromium/src/+/7917332 | **#5625의 근본 원인은 WebView2 고유가 아니라 Chromium 149 회귀**: `TSFHonorAutocorrectOff` 기능이 IME 입력을 자동교정으로 오판. 수정 "Skip autocorrect detection when IME is active in TSFTextStore"(pranavmodi@microsoft.com) 2026-06-11 main, M149(149.0.7827.158)·M150(150.0.7871.27) 백포트 검증. 즉시 우회 `--disable-features=TSFHonorAutocorrectOff` | doc | 0.9 | 트리거는 편집 요소의 `autocorrect="off"` |
| G2 | codemirror/view editorview.ts, prosemirror-view | https://github.com/codemirror/view/blob/main/src/editorview.ts | CM6는 cm-content에 `spellcheck=false autocorrect=off autocapitalize=off` 기본 설정 → 회귀에 걸림(SoloMD·web-text가 CM6). ProseMirror는 미설정이라 비껴감 | doc | 0.85 | CM6 채택 시 WebView2 ≥150 또는 플래그 |
| G3 | Electron releases, WebView2 릴리스 노트 | https://releases.electronjs.org/ | Electron 42(Chromium 148, 회귀 전)·43(150)·44(152, 수정 후) 모두 무관 → "Electron 면역"은 시점 문제. Electron이 실제로 피하는 건 WebView2 호스트 계층(TSF 브리지) 버그와 Evergreen 자동 갱신 노출. WebView2 150.0.4078.44(2026-07-07)+는 수정본 포함 추정(릴리스 노트에 IME 언급 없음) | doc | 0.7 | 가설 0.7 — 로컬 재검증 필요 |
| G4 | Tauri Windows Installer, MS Fixed Version 목록 | https://developer.microsoft.com/microsoft-edge/api/webview2 | `webviewInstallMode fixedRuntime`은 동작하나(2.8.3 수정) 공식 다운로드는 150.0.4078.105 이상뿐(148.x 불가). +180~250 MB, 보안 패치 상실, Win10 unpackaged는 `icacls *S-1-15-2-2` 필요. 정책 `BrowserExecutableFolder`(v87+)·`DowngradeVersion`(HKLM, N-1/N-2)이 앱별 롤백 수단 | doc | 0.85 | 회귀 발생 시 비상 카드로만 |
| G5 | WebView2Announcements #137, #5680/#5713 | https://github.com/MicrosoftEdge/WebView2Announcements/issues/137 | v152(2026-08-24)부터 2주 릴리스 주기 → 회귀 노출 2배. 151 Japanist 변환 불가, 152 Composition Mode 입력 중단 등 실제 입력 회귀 | doc | 0.85 | 회귀 스모크 테스트 정책 필요 |
| G6 | WindowConfig.additionalBrowserArgs | https://docs.rs/tauri-utils/latest/tauri_utils/config/struct.WindowConfig.html | wry 기본 `--disable-features=msWebOOUI,msPdfOOUI,msSmartScreenProtection`을 덮어쓰므로 우회 플래그는 한 줄로 합쳐야 함. 환경변수 `WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS`가 코드 지정보다 우선(#5571) | doc | 0.85 | |
| G7 | VS Code editContext/ | https://github.com/microsoft/vscode/tree/main/src/vs/editor/browser/controller/editContext | Monaco/VS Code는 contentEditable이 아니라 hidden textarea·EditContext로 입력 → contentEditable 전용 TSF 회귀에서 비껴감 | doc | 0.7 | 소스 편집기 대안 고려 요소 |
| G8 | MS IME 문서, Insider 20H1 | https://learn.microsoft.com/en-us/windows-insider/archive/new-in-20H1 | 새 한국어 IME는 Win10 2004부터 → Win10 22H2(19045)와 Win11은 같은 IME. '이전 버전 IME' 토글(`HKCU\Software\Policies\Microsoft\InputMethod\Settings\KOR\ConfigureImeVersion=1`)은 양쪽에 있으나 회귀는 TSF 경로라 우회 가능성 낮음(가설), 일부 Win11 Home에서 토글 비활성 보고 | doc | 0.85 | 테스트 매트릭스: 새/이전 IME × Win10/Win11 |
| G9 | SoloMD cm-ime-guard.ts, cm-live-render.ts, cm-live-blocks.ts | https://raw.githubusercontent.com/zhitongblog/solomd/main/app/src/lib/cm-ime-guard.ts | MIT. 조합 중 ViewPlugin이 줄 데코를 재빌드하면 WebView2가 조합을 버림('吃字') → `frozenDuringComposition()`(기존 DecorationSet을 map만) + compositionend 후 flush. live-render: 캐럿이 닿은 줄은 원문 노출, `visibleRanges` 한정. live-blocks: 표·이미지·수식·mermaid는 StateField block 위젯 | doc | 0.85 | 패턴 차용 1순위 |
| G10 | SilverBullet util.ts, codemirror-live-markdown, atomic-editor, typora-lite, Zettlr renderers | https://raw.githubusercontent.com/silverbulletmd/silverbullet/main/client/codemirror/util.ts | CM6 인라인 라이브프리뷰 공개 구현 MIT 6종 + GPL 1종. 공통 골격: ViewPlugin(마크 숨김, 뷰포트) + StateField(block 위젯). 조합 처리는 SoloMD·typora-lite(`view.composing`)·SilverBullet(`input.type.compose` 매핑)만. Zettlr·codemirror-live-markdown은 조합 코드 0건 | doc | 0.8 | 포크보다 패턴 차용 + 자체 구현 |
| G11 | EditorView.decorations 문서 | https://raw.githubusercontent.com/codemirror/view/main/src/editorview.ts | ViewPlugin 데코는 뷰포트 계산 후 호출되므로 block 위젯·줄바꿈을 덮는 replace 불가 → block 위젯은 StateField, 인라인 숨김은 ViewPlugin의 2층 구조 | doc | 0.9 | |
| G12 | codemirror/view CHANGELOG | https://raw.githubusercontent.com/codemirror/view/main/CHANGELOG.md | 6.15.3(2023-07) 조합 범위 DOM 고정, 6.28.3 Chrome Windows IME 위치, 6.39.6~6.39.10(2025-12~2026-01) 데코 경계 조합 수정 등 25건+ → @codemirror/view 최신 핀 필수 | doc | 0.8 | |
| G13 | Tauri core.js, asset.rs, single-instance, NSIS | https://github.com/tauri-apps/tauri/blob/dev/crates/tauri/scripts/core.js | 한글 경로는 인코딩상 안전: `convertFileSrc`=`encodeURIComponent`(UTF-8) ↔ `percent_decode().decode_utf8_lossy()`, WM_COPYDATA UTF-8, NSIS `Unicode true`(REG_SZ UTF-16), WebView2 UDF는 `FOLDERID_LocalAppData` 기반 `%LOCALAPPDATA%\{identifier}\EBWebView` 강제 | doc | 0.9 | |
| G14 | tauri #5234, #2423, #12787 | https://github.com/tauri-apps/tauri/issues/5234 | 파일명 `[`가 scope glob을 깨뜨림(이스케이프 필요). fixedRuntime을 CJK 폴더에 두면 GPU 프로세스 실패 보고(미해결) → evergreen 유지. UDF 생성 실패는 창이 조용히 닫힘 | seen | 0.7 | 픽스처에 한글·공백·`[`·`#` 조합 이미지 추가 |
| G15 | url::to_file_path, opener, on_navigation | https://docs.rs/tauri/latest/tauri/webview/struct.WebviewWindowBuilder.html | `file://` 링크는 `Url::to_file_path()` → 경로로 열기(셸 URL 디코딩 의존 회피). 프리뷰의 `<a href>`는 `on_navigation`에서 가로채야 웹뷰가 앱 밖으로 안 나감. opener 기본 권한은 mailto/tel/http(s)만 | doc | 0.7 | |
| G16 | 한국 블로그·MS Q&A·삼성 | https://haeeul.github.io/blog/etc-dev/2025-01-08-vscode_hangeul_error/ | Win11 새 MS IME가 크로미움 계열에서 마지막 글자 중복("로그인"→"로그인인")·사라짐(Alt+Tab)·자소 분리를 일으키고 해법은 '이전 버전 IME'. 클리앙의 옵시디언·타이포라 한글 문제 글은 전부 mac | seen | 0.8 | Windows CM6는 한국 사용자 체감상 비교적 안정(부재 증거) |
| G17 | Obsidian 포럼 114224, 116380, 100910, 47875 | https://forum.obsidian.md/t/fully-synced-but-the-final-10-15-korean-characters-are-missing-unless-the-file-is-manually-saved/116380 | Win11 CM6: 자동 줄바꿈 경계에서 한글 조합 무시(2026-09 미해결), 조합 종료 후 ~2초 내 닫으면 마지막 10~15자 유실(자동 저장 설계), 모달 ESC 시 조합 글자가 본문으로 누출, 조합 중 Backspace 인접 글자 변형 | seen | 0.75 | 테스트 케이스 원천 |
| G18 | yorkie #1372, dc-code-paste #10 | https://github.com/0disoft/dc-code-paste/issues/10 | CM6는 자모 단위로 트랜잭션을 흘리고 조합 종료 API가 없음 → 자동 저장·프리뷰 갱신은 compositionend 기준 debounce. 한글은 마지막 음절이 항상 조합 중이라 Enter/Ctrl+S가 '키 + IME 확정'으로 이중 발화 → 모든 단축키에 `KeyboardEvent.isComposing`(keyCode 229) 가드 | seen | 0.85 | |
| G19 | Obsidian Encoding Auto-Fix, Cursor 포럼 | https://community.obsidian.md/plugins/encoding-autofix | Obsidian은 UTF-8 전용(CP949 즉시 �). 플러그인은 EUC-KR/CP949 파일을 UTF-8로 **덮어쓰는** 파괴적 해법. Cursor 2.5.26에서도 EUC-KR 편집 시 UTF-8 강제 변환·손상 미해결 | doc | 0.85 | 바이트 보존 차별점의 실사용 근거 |
| G20 | MS PrintToPdfAsync, wry webview2/mod.rs, meditor PR #188 | https://learn.microsoft.com/en-us/microsoft-edge/webview2/how-to/print | .NET은 `PrintToPdfAsync` 1급 API. Tauri `print()`는 `window.print()`일 뿐, 공식 무음 PDF 없음(플러그인 이슈 #293 활동 없음, 커뮤니티 플러그인 3종은 프린터용). 무음 PDF는 `with_webview` → webview2-com 0.39.1 `ICoreWebView2_7::PrintToPdf` 직접 호출(meditor PR #188, 2026-09-25 병합, ~100–150줄) | doc | 0.95 | MVP는 HTML 내보내기 + `window.print()` |
| G21 | CoreWebView2PrintSettings, Westwind.WebView | https://learn.microsoft.com/en-us/microsoft-edge/webview2/reference/win32/icorewebview2printsettings | 기본 Letter·여백 1 cm·배경 인쇄 off(코드 블록 배경 빠짐 → on 필요), 헤더/푸터 포맷 고정, 북마크 없음. Typora식 `${pageNo}/${pageCount}`·목차 북마크는 CDP `Page.printToPDF`(headerTemplate/generateDocumentOutline) 경로. 페이지보다 큰 요소에 `page-break-inside: avoid` → 빈 페이지(Chromium 공통) | doc | 0.9 | 2단계 |
| G22 | MDN word-break/overflow-wrap, CSSWG #4285, daleseo, mozilla/bedrock | https://github.com/w3c/csswg-drafts/issues/4285 | github-markdown-css·VS Code·Typora 테마 모두 `keep-all` 없음(글자 단위 줄바꿈). 권장: `:lang(ko)` 스코프 `word-break: keep-all` + `overflow-wrap: break-word`, 표는 `overflow-wrap: anywhere`, `pre { word-break: normal }`, `text-wrap: pretty`. `keep-all`은 일·중문 줄바꿈 기회를 없앰 → `<html lang="ko">` 스코프 | doc | 0.9 | Typora 대비 차별점 |
| G23 | Chromium locale_settings_win.grd, font_fallback_win.cc, MS 폰트 목록 | https://raw.githubusercontent.com/chromium/chromium/main/third_party/blink/renderer/platform/fonts/win/font_fallback_win.cc | Chromium 한글 기본 고정폭은 `Gulimche`(Win10/11에서 'Korean Supplemental Fonts' 선택 기능이라 부재 가능), 폴백 `Noto Sans KR → Noto Sans CJK KR → Malgun Gothic → Gulim`. Malgun Gothic은 비례폭(Fixed pitch False). Cascadia는 Win11만 기본, 한글 미지원 | doc | 0.9 | |
| G24 | naver/d2codingfont, Sarasa-Gothic, Pretendard | https://github.com/naver/d2codingfont/releases | 코드 폰트 스택 권장 `"D2Coding"(OFL, 번들 가능, 1.3.3=바이너리 1.3.2 2018), "NanumGothicCoding", "Sarasa Mono K"(활발), "Cascadia Mono", Consolas, monospace, "Malgun Gothic"(generic 뒤 글리프 폴백)`. 본문 `"Pretendard Variable", Pretendard, "Noto Sans KR", "Malgun Gothic", sans-serif`. Malgun Gothic이 스택 앞에 오면 셀 폭을 정해 ASCII 간격이 벌어짐(herdr PR #9) | doc | 0.85 | |

### V — 독립 검증 결과

결정 영향 `high` 주장 118건 중 24건을 WebSearch/WebFetch로 반박 시도. 결과 **confirmed 11 · corrected 13 · refuted 0 · unverifiable 0**. 나머지 94건은 미검증(위 표의 Conf 값이 조사자 자체 신뢰도). 판정을 바꾼 정정:

| # | 주장 | 정정 |
|---|------|------|
| V7 | encoding_rs로 CP949 왕복 가능 | 유효 바이트열에 한해. 0x80·오류 시퀀스는 U+FFFD→`&#NNNN;`, 인코더는 BOM 미기록 → **원본 바이트 보관 + `*_without_replacement` 손실 감지**가 정답 (S10) |
| V8 | chardetng `guess(tld, allow_utf8: bool)` | 1.0.0은 `Utf8Detection` enum. UTF-8 사전 검증은 선택, **BOM 스니핑은 필수 선행** (S11) |
| V9 | .NET CodePages는 NuGet 패키지 필요 | 공유 프레임워크 내장. `"euc-kr"`(51949)은 UHC 확장 한글 손상 → 949 (S12) |
| V11 | WebView2 CJK IME 버그는 WPF/WinUI 3에도 공통 | 보고는 MAUI·Tauri뿐. 런타임 계층 추론 (S14) |
| V14 | Windows App SDK 등록 API | per-user만, `HKCU\Software\Classes\App.<해시>.File` ProgId (S16) |
| V15 | WinUI 3 비패키지는 런타임 배포 필수 | self-contained 옵션으로 부트스트래퍼 회피 가능 (S17) |
| V16 | Flutter 한글 캐럿 버그 미수정 | 3.47.0에 수정 병합. 다른 IME 이슈는 잔존 (S18) |
| V18 | CM6 `lineSeparator`로 왕복 가능 | `doc.toString()`은 항상 `\n`, `sliceDoc()`만 반영. 혼합 EOL 불가 (E1) |
| V19 | Milkdown #1579 빈 줄 소실 수정됨 | `<br/>` 우회. 원문 보존은 목표 아님 (E2) |
| V22 | Vditor Lute는 WASM, ATX/Setext 통일 | GopherJS, 제목 스타일은 유지. CRLF→LF·공백 정규화는 사실 (E5) |
| V23 | ProseMirror #1551 CJK 클릭 버그 | 유지보수자 3회 재현 실패한 미확인 보고 (E7) |
| V24 | CM6 #1684 미해결 | Chromium 회귀(crbug 498745133)로 closed (E9) |
| V21 | Tiptap #8294 표 파이프 손실 수정 | 병합됐으나 npm 3.31.3 미포함 (E3) |

검증 근거 원문은 워크플로 산출물(`run2-verify.md`, 세션 스크래치패드)에 있으며 저장소에는 요약만 남긴다.

## Observed user verbs

- 탐색기에서 `.md` 더블클릭 → 즉시 렌더된 문서 읽기 (W1·W14)
- 목차(아웃라인)로 이동, 검색, 줌 (T3)
- 렌더된 문서 위에서 바로 편집 / 소스 모드로 전환 (T1)
- 표·체크박스·이미지 직접 조작 (T2·T11)
- 저장 (Ctrl+S) — 자동 저장은 선택 (T6)
- 다른 프로그램(git·VS Code·동기화)이 파일을 바꿨을 때 다시 읽기 (T13·F16)
- 같은 폴더의 다른 문서로 이동 (파일 트리) (T3)

## Core loop

1. 더블클릭(또는 드래그 앤 드롭·CLI) → 앱이 파일 경로를 받아 단일 인스턴스에서 연다
2. 원시 바이트 읽기 → 인코딩·EOL·끝 개행 메타 판별 → 디코드 → 렌더
3. 읽기 (TOC·검색·줌·테마)
4. (선택) 편집 → 저장: 원본 메타 그대로 재인코딩·원자 교체
5. 외부 변경 감지 → dirty 아니면 조용히 리로드, dirty면 비모달 배너

## Rules & numbers

| Item | Value / range | Ev# | Method / Confidence |
|------|---------------|-----|---------------------|
| Typora 최신 버전 | 1.14.10 (2026-09-11) | T14 | doc 0.85 |
| Typora 가격 | $14.99 일회, 3대 | T21 | doc 0.9 |
| Typora 렌더 한도 | ≈2 MB (`MAX_FILE_SIZE = 2e6`) | T12 | seen 0.8 |
| Typora 자동 저장 기본 | Windows off, 켜면 5분 | T6 | doc 0.9 |
| Typora 본문 폭 | 860 px, 16 px / 1.6 | R22 | seen 0.75 |
| Windows `.md` 기본 앱 | 없음(미등록 형식) | W1 | seen 0.8 |
| 앱의 기본 앱 자동 설정 | 불가(Win10+). `ms-settings:defaultapps?registeredAppUser=` 딥링크로 유도 | W2·W4 | doc 0.9 |
| VS Code 등록 방식 | `OpenWithProgids` + ProgId (기본값 강탈 안 함) | W5 | doc 0.9 |
| Tauri NSIS 기본 등록 | `.ext` 기본값 덮어쓰기 + 백업, `OpenWithProgids` 없음 | W6 | doc 0.9 |
| WebView2 런타임 | Win11 내장, Win10 대다수 설치. 부트스트래퍼 ~2 MB | W17 | doc 0.95 |
| 경량 WebView2 뷰어 크기 | 2.0 MB 설치기, 1초 내 열림 (mdview) | W13 | doc 0.85 |
| VS Code 인코딩 자동 감지 | 기본 off, 후보 제한 가능 | F1·F2 | doc 0.95 |
| 혼합 EOL 보존하는 주류 에디터 | 없음 (VS Code·Sublime 정규화, Obsidian LF 재저장). Notepad++·Windows Notepad만 유지 | F11·F12·F10·F14 | doc/seen 0.85 |
| 외부 변경 디바운스 | tauri-plugin-fs 기본 2000 ms; chokidar atomic 100 ms | F19·F20 | doc 0.9 |
| 대용량 임계 (VS Code) | 20 MB / 30만 줄 토큰화 중단 | F27 | doc 0.9 |
| 하이라이터 번들 | Prism 11.7 / hljs 15.6 / Shiki 279.8 KiB(WASM) | R12 | tool 0.8 |
| KaTeX / Mermaid | gz 77 KB + 폰트 / gz 172 KB (tiny ~50%) | R14·R15 | doc 0.85 |
| Tauri 2 마크다운 앱 설치기 | 5.4–19.3 MB (MarkText Electron 110.8 MB) | O13 | tool 0.95 |
| Tauri 최신 | 2.12.0 (2026-09-26), tao 0.37.0 / wry 0.57.0 | S7 | doc 0.9 |
| WebView2 IME 첫 글자 유실 수정 | Chromium 149.0.7827.158 / 150.0.7871.27 → WebView2 150.0.4078.44+ 추정 | G1·G3 | doc 0.9 / hyp 0.7 |
| tao 데드락 수정 | tao ≥ 0.35.4 (2026-06-10) | O8 | seen 0.85 |
| 에디터 엔진 번들 | codemirror 119 KB gz / Crepe 460 KB / MDXEditor 578 KB | E13 | tool 0.8 |
| 독립 검증 | 24건 중 confirmed 11 · corrected 13 · refuted 0 | V | — |

## UX / feel highlights (Typora가 "깔끔"한 이유)

| Aspect | Observation | Ev# |
|--------|-------------|-----|
| 단일 편집면 | 소스·미리보기 이중 화면 없음. 캐럿이 시각 결과 위에 있고 문서 폭이 절반으로 안 줄어듦 | T1·T24 |
| 크롬 최소화 | 기본 툴바 없음, 사이드바는 접힘, 상태바 선택 | T4·T3 |
| 구문 숨김 | 비활성 구문은 숨기고 캐럿이 든 요소만 노출 | T1 |
| 타이포그래피 | 860 px 본문, 16 px/1.6, 여백 30 px, 테마 CSS 1파일 | R22·T5 |
| 몰입 모드 | Focus(F8)·Typewriter(F9) | T3 |
| 직접 조작 | 표 격자 편집, 체크박스 클릭, 이미지 붙여넣기 → assets 복사 | T2·T11 |
| 대가 | 숨은 구문·공백·HTML을 소스 모드 전까지 모름, 바이트 비보존, IME 회귀 | T9·T20·T24 |

## UI / feedback

- 사이드바: 파일 트리 ↔ 아웃라인 전환(동시 표시 불가는 오래된 불만, T3·T23)
- 탭 없음 → 문서당 창 1개 (T16). 사용자 요구 1순위
- 외부 변경: 즉시 재로드(dirty 아닐 때), 경고(dirty), diff/merge 없음 (T13)
- 파일 연결: OS 표준 경로에만 의존, ShellNew 등록 버튼만 제공 (T15)

## States & edge cases (파일 수명주기)

- 인코딩: UTF-8 / UTF-8 BOM / CP949. 짧은 파일은 통계 감지가 불안정 → 후보를 [UTF-8, EUC-KR]로 제한하고 UTF-8 유효성 우선 (F3·F4)
- EOL: LF / CRLF / 혼합. 주류 에디터는 혼합을 정규화 → 줄별 EOL 보존은 직접 구현 (F11–F13)
- 파일 끝 개행: 있음/없음 보존. 정리는 opt-in (F15)
- 저장: 같은 볼륨 임시파일 + `ReplaceFileW` → 실패 시 in-place 폴백 (F23·F24)
- 외부 변경: 내용 해시 비교로 자기 저장·타임스탬프만 변경을 걸러냄 (F17), dirty 아니면 조용히 리로드 (F16)
- 자동 저장: 기본 off, 앱 데이터에 초안 백업. 자동 저장과 '이전 저장본 되돌리기' 분리 (F21·F22)
- 대용량: 2 MB 초과 시 미리보기 기능 축소, 10 MB 초과 시 읽기 전용 텍스트 뷰 (T12·F27, 권고)
- 두 번째 더블클릭: 단일 인스턴스가 인수를 받아 탭/창으로 연다 (A 절에서 심화)

## Explicit non-goals (this pass)

- Typora의 `faithful` 재현 (플러그인·테마 생태계·Pandoc 내보내기 전체)
- 크로스플랫폼(macOS/Linux) 빌드
- 노트 앱 기능(볼트·백링크·동기화)
- 메모리·시작 시간의 자체 계측 (스택 결정 후 프로토타입에서 측정)

## Adaptation notes (for MdEditor)

1. **뷰어 우선 MVP**: 최소 가치(콜아웃 2)는 "더블클릭 → 깔끔한 렌더". Windows 11 Notepad(W9)와 소형 MDView들(W12·W13)이 이 자리를 노리므로 렌더 품질(코드·표·TOC·이미지)과 바이트 보존으로 차별화
2. **바이트 보존 계층은 처음부터**: 어느 스택이든 "원시 바이트 → 자체 디코드 → 메타 보관 → 동일 규칙 재인코딩". Tauri fs 플러그인·.NET 편의 API를 그대로 쓰면 안 됨 (F8·F25)
3. **파일 연결은 VS Code 모델**: ProgId + `OpenWithProgids` + `Capabilities/RegisteredApplications`, 기본값은 `ms-settings` 딥링크로 사용자에게 (W3–W6)
4. **인라인 하이브리드 편집은 CM6 데코레이션 노선**: ProseMirror 계열은 재직렬화라 바이트 보존과 충돌(E2–E5), CM6는 소스가 진실(E14·E15). MVP는 렌더 + CM6 소스 편집, 인라인 라이브프리뷰는 SoloMD/SilverBullet 패턴(G9·G10)으로 후속 Phase
5. **IME는 스택이 아니라 WebView2 런타임 변수**: #5625는 Chromium 149 회귀로 150+에서 수정(G1·G3), 남는 건 호스트 계층 한국어 이슈 4건(S14)과 tao 데드락(O8). 스택 확정 전 한국어 MS IME(새/이전) × Win10/Win11 스파이크 필수. 조합 중 데코 동결(G9), 자모 단위 트랜잭션 debounce(G18), 단축키 `isComposing` 가드(G18)
6. **렌더 보안**: PowerToys 정책(W15) + DOMPurify(R7) + 링크 스킴 허용 목록(W10) + `on_navigation` 가로채기(G15)
7. **한국어**: CJK-friendly 강조(R24), `:lang(ko)` keep-all(G22), Pretendard 본문·D2Coding 코드 폰트 번들(G23·G24), CP949 후보 제한(F4·S11), 한글 경로 픽스처(G14)
8. **파일 연결은 NSIS + 훅**: 기본 템플릿(S2)에 `OpenWithProgids`·`Applications\exe\SupportedTypes`·`Capabilities`+`RegisteredApplications`·`SHChangeNotify`를 POSTINSTALL 훅으로 보강(A5·A8·A11·A14). 기본 앱 승격은 불가(A1) → `ms-settings:defaultapps?registeredAppUser=`(A4). MSI는 부적합(A12)
9. **PDF는 2단계**: MVP는 HTML 내보내기 + `window.print()`. 무음 PDF는 webview2-com COM 어댑터(G20), 헤더/푸터·북마크는 CDP(G21)

## Open questions

실측이 필요한 것(로드맵 Phase 0 스파이크 항목). **2026-09-29 Phase 0 결과**: IME(Win10 새 IME ①–⑧ 통과, 이전 IME·Win11 미실측), 바이트 보존(chardetng 121 B 정확, 혼합 EOL 줄별 복원 테스트 통과), 성능(Tauri 371 ms / WPF 732 ms)은 `docs/decisions/ideas/20260929-stack.md` 기록란 참조. 파일 연결·레퍼런스 실측·렌더·OneDrive는 열림:

- **IME**: #5625(첫 글자 유실)·tauri #15436(기존 텍스트 첫 포커스 TSF 프리즈)·#5475(조합 중 포커스 이탈 크래시)가 **한국어 두벌식 MS IME**에서 재현되는지 — 보고는 전부 중국어 IME. 현재 WebView2 Evergreen(150+)에서 #5625가 실제로 사라졌는지. textarea / CM6 plain / CM6+데코레이션 세 구성 × 새/이전 IME × Win10 19045/Win11
- **파일 연결**: Tauri NSIS 기본 등록 + POSTINSTALL 훅(`OpenWithProgids`, `Capabilities`/`RegisteredApplications`)으로 Win11 '연결 프로그램' 추천 목록·설정 > 기본 앱에 나타나는지. `installer.nsi`가 `UPDATEFILEASSOC`를 정말 호출하지 않는지(두 조사 상충). `.md` 다중 선택 열기 시 single-instance가 N개 WM_COPYDATA를 모두 받는지(#3587 레이스 빈도)
- **바이트 보존**: chardetng를 [UTF-8, EUC-KR]로 제한했을 때 짧은 `samples/raw/cp949.md` 정확도. CM6에서 혼합 EOL 파일을 줄별로 복원하는 구현의 안정성. OneDrive Files On-Demand 위 `ReplaceFileW`
- **레퍼런스 실측**: Typora 1.14.x가 `samples/raw` 픽스처를 무편집 저장할 때 실제로 바꾸는 바이트. Typora 설치기가 쓰는 ProgId·`OpenWithProgids` 여부(레지스트리 덤프)
- **렌더**: comrak/markdown-it 소스 위치가 한글 인라인에서 문자 단위인지. WebView2 PrintToPdf에서 한글 폰트 서브셋 임베드·긴 코드 블록 페이지 분할. `keep-all` + `overflow-wrap: anywhere`가 표 셀·긴 URL에서 기대대로 동작하는지
- **성능**: Tauri 2.12 vs WPF+WebView2(.NET 10) 소형 편집기의 Windows 콜드 스타트·프로세스 트리 메모리(공개 벤치는 전부 macOS)

## Status

- Analyst status: `READY` — T·W·F·R·O·S·E·A·G·V 전 절 반영, 검증 24건 요약 포함
- Ready for implementation: no — 스택·엔진 판정(`docs/decisions/ideas/20260929-stack.md`, `20260929-editor-engine.md`)과 MVP 선택(`docs/decisions/ideation/20260929-mvp-scope.md`)에 대한 사용자 확인 후 `docs/roadmap.md` Phase 0부터
