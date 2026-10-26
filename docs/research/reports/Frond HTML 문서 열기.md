# Frond가 HTML을 열려면 크로미움을 더 넣을 필요가 없고, 비용은 격리 설계에 있다

HTML을 열려고 크로미움(CEF·Electron·Qt WebEngine)을 탑재하는 것은 비효율적이다. Frond는 이미 크로미움 위에서 돈다. Tauri 2는 Windows에서 시스템 WebView2를 쓰고, WebView2는 Edge와 같은 Chromium 엔진이다(이 PC 런타임 155.0.4283.62, 설치기 최소 버전 150). 그래서 HTML을 그리는 데 추가 엔진이 필요 없고 설치 크기도 그대로다. 반대로 크로미움을 따로 넣으면 설치본이 수십~백수십 MB 늘어난다. 크로미움 보안 패치도 직접 따라가야 한다. 정작 핵심 문제인 "남이 만든 HTML을 앱 권한과 떼어 놓기"는 엔진을 바꿔도 풀리지 않는다. 비용의 실체는 엔진이 아니라 격리다. Typora·MarkText·Zettlr·Joplin은 Electron으로 크로미움을 이미 품고 있다. 그런데도 독립 HTML 파일은 열지 않는다. 이 앱들의 보안 사고 다수는 "문서 속 HTML → 스크립트 → 앱 권한(Node·IPC)" 사슬이었다. HTML을 여는 쪽 선례는 공통 규칙을 지킨다. PowerToys Peek·Readest·Foliate·Koodo Reader·메일 클라이언트는 스크립트를 끄고, 외부 리소스를 막고, 문서 폴더 밖 파일은 주지 않는다. 스크립트를 켜는 Markdown Monster·VS Code Live Preview는 "내가 쓰는 HTML"을 미리 보는 도구다. 사용자 PC의 HTML 285개 중 159개(56%)가 `<script>`를 담고 있다. AI가 만든 보고서·아키텍처 다이어그램 일부는 스크립트 없이는 그림이 안 나온다. 그래서 Frond는 세 갈래로 연다. 기본은 **안전 보기**다. 같은 origin 샌드박스 iframe을 쓰고, 스크립트와 외부 리소스를 끄고, 문서 폴더만 연다. 문서별로 **스크립트 허용**을 고를 수 있다. 이때는 불투명 origin 샌드박스와 헤더 CSP를 쓰고, IPC는 닿지 않는다. 언제든 **브라우저로 열기**로 넘길 수 있다. 구현은 Rust 커스텀 프로토콜 하나와 iframe 두 방식이다. 탭·소스 편집·분할 뷰·저장은 기존 것을 그대로 쓴다.

## Frond는 이미 크로미움 위에 있어서 엔진 비용은 0에 가깝다

Tauri 2는 Windows에서 WebView2를 쓴다. WebView2 Evergreen 런타임은 Windows 11에 기본으로 들어 있고, 대부분의 Windows 10에도 Windows Update로 깔려 있다. 없는 PC를 위한 부트스트래퍼는 약 2 MB다([Learn: Distribute your app and the WebView2 Runtime](https://learn.microsoft.com/en-us/microsoft-edge/webview2/concepts/distribution)). Frond 설치기는 이미 `downloadBootstrapper`로 런타임을 챙기고 `minimumWebview2Version` 150을 요구한다. 이 PC의 런타임은 155다(`C:\Program Files (x86)\Microsoft\EdgeWebView\Application\155.0.4283.62`). HTML 렌더링 충실도는 Edge와 같다.

| 방식 | 배포 크기 영향 | 프로세스·메모리 | 보안 업데이트 책임 |
|---|---|---|---|
| **지금 WebView2 + iframe** | 0 (부트스트래퍼 약 2 MB는 이미 포함) | 같은 WebView2 프로세스 그룹. origin이 다른 frame은 Site Isolation으로 렌더러가 하나 더 생길 수 있다. 고정된 "iframe당 MB" 값은 없다([Learn: WebView2 process model](https://learn.microsoft.com/en-us/microsoft-edge/webview2/concepts/process-model), [Chromium: Process model and site isolation](https://chromium.googlesource.com/chromium/src.git/+/HEAD/docs/process_model_and_site_isolation.md)) | Microsoft(Edge 업데이트) |
| 별도 WebView2 창 | 0 | 문서·렌더링 문맥이 하나 더. 옛 MS 엔지니어 추정은 첫 컨트롤 약 250 MB, 추가 100 MB+였다(공유 메모리 회계 탓에 과대, [WebView2Feedback#799](https://github.com/MicrosoftEdge/WebView2Feedback/issues/799)) | Microsoft |
| Electron | 빈 앱 설치기 약 55~75 MB, 설치 후 85~120 MB(측정치 하나는 압축 77 MB·풀면 181 MB, [HN 28141630](https://news.ycombinator.com/item?id=28141630)) | 앱 전용 browser·renderer·GPU 프로세스 | **앱 개발자**가 Chromium 패치마다 새 Electron 배포 |
| Qt WebEngine | 한 사례 60 MB → 136 MB(+76 MB, [Qt interest 2025-02](https://lists.qt-project.org/pipermail/interest/2025-February/040098.html)) | `QtWebEngineProcess` 등 | 앱 개발자 |
| CEF·CefSharp | Electron과 같은 급(로캘·코덱 구성에 따라 다름) | 전용 CEF 프로세스 트리 | 앱 개발자가 CEF 브랜치 추적 |

Chromium Site Isolation은 탭이 많은 데스크톱 작업에서 전체 메모리를 10~13% 늘렸다. 이것은 작업 전체 측정이지 iframe당 비용이 아니다([Chromium: Site Isolation](https://www.chromium.org/Home/chromium-security/site-isolation/)). Frond의 기존 실측은 보통 문서 탭 20개가 +116 MB였다(`main.ts` `MAX_LARGE_RENDERED` 주석, 디버그 빌드). HTML 탭은 탭마다 frame 하나를 더 두므로 이보다 조금 무겁다. 스크립트가 많은 문서는 그 스크립트만큼 더 쓴다.

Tauri 2는 창 안에 웹뷰를 여러 개 두는 API(`Window::add_child`)를 아직 `unstable` 기능으로만 연다([docs.rs: tauri Window](https://docs.rs/tauri/latest/tauri/window/struct.Window.html)). 게다가 네이티브 자식 웹뷰는 DOM 위에 겹쳐 그려진다. 그래서 Frond의 DOM 팝업(설정·확인 팝업·오른쪽 클릭 메뉴)이 그 아래로 숨는다. 이런 이유로 이번 설계는 iframe을 쓴다.

## 비슷한 앱은 HTML을 '보기 전용 문서'로 다루거나 아예 열지 않는다

| 앱 | 엔진 | 독립 HTML 파일 | 스크립트·외부 리소스 | 로컬 리소스·격리 |
|---|---|---|---|---|
| **PowerToys Peek** | WebView2 | 미리보기 | 개발 파일이 아니면 `IsScriptEnabled = false`. 처음 연 URI 밖 이동은 취소한다. "외부 추적 방지"를 위해 원본 파일과 그 폴더 밖 요청은 403이다. 새 창은 사용자가 누른 것만 확인 뒤 밖에서 연다([BrowserControl.xaml.cs](https://github.com/microsoft/PowerToys/blob/main/src/modules/peek/Peek.FilePreviewer/Controls/BrowserControl.xaml.cs)) | 파일 폴더만 |
| **Readest** (Tauri) | WebView2 | EPUB(XHTML 묶음) | "Ebook content is rendered in a sandboxed iframe. External script execution is blocked." | 책 밖 이동 차단, 파일 접근은 앱 데이터 폴더로 한정([SECURITY.md](https://github.com/readest/readest/blob/main/SECURITY.md)) |
| **Foliate / foliate-js** | WebKitGTK | EPUB | 스크립트 미지원. 같은 origin `blob:`로 내용을 주므로 안전하게 지원할 수 없다고 적는다. WebKit 버그 218086 때문에 `allow-scripts`가 필요해 샌드박스가 무력하고, 그래서 CSP로 `'self'` 밖 스크립트를 막으라고 한다([README Security](https://github.com/johnfactotum/foliate-js/blob/main/README.md)) | 같은 origin + CSP |
| **Koodo Reader** | Electron | EPUB 등 | 책 안 JavaScript 기본 끔([App Store 설명](https://apps.apple.com/us/app/koodo-reader/id6744887779)) | 자체 리소스 계층 |
| **메일 클라이언트** | 다양 | HTML 메일 | Thunderbird는 메시지 JavaScript 끔. Outlook은 외부 이미지가 열람 추적에 쓰여 차단 설정을 둔다([Outlook: Block external images](https://support.microsoft.com/en-us/office/what-is-block-external-images-in-settings-dd6b90a7-18d7-4c1c-b4d0-91c205bd1c42)) | 내장(CID) 리소스 우선 |
| **Markdown Monster** | WPF + WebView2 | HTML 편집 + 실시간 미리보기([문서](https://markdownmonster.west-wind.com/docs/Features/Working-with-the-HTML-Preview.html)) | 스크립트 지원. 신뢰하는 내 문서 전제 | 미리보기 문서 기준 |
| **VS Code Live Preview** | Electron | 로컬 HTTP 서버 + 내장 웹뷰([GitHub](https://github.com/microsoft/vscode-livepreview)) | 개발 도구라 작성된 대로 실행 | 작업 영역 루트. `localResourceRoots` 경로 검사 우회(CVE-2022-41042, [Trail of Bits](https://blog.trailofbits.com/2023/02/23/escaping-well-configured-vscode-extensions-for-profit/)) |
| **Obsidian HTML Reader 플러그인** | Electron | `.html`·`.htm` 등록([HTML Direct Reader](https://community.obsidian.md/plugins/html-direct-reader)) | 안전 모드는 DOMPurify, 원형 보존 모드는 신뢰 문서용([html-reader-plus](https://github.com/sancodeee/obsidian-html-reader-plus)) | 플러그인마다 다름 |
| **Notepad++ Preview HTML** | WebView2 플러그인 | 도킹 미리보기 | 하드닝 정책이 공개돼 있지 않음 | 일반 브라우저 base |
| **QuickLook (Windows)** | WebView2 플러그인 | HTML·Markdown 보기([Available Plugins](https://github.com/QL-Win/QuickLook/wiki/Available-Plugins)) | 공통 정책 없음 | 내부 뷰어에 `postMessage`로 내용 전달 |

**하지 않은 선례**도 의미가 있다. Typora·MarkText·Zettlr는 UI가 이미 Chromium인데도 HTML을 Markdown 안 조각이나 가져오기·내보내기로만 다룬다([Typora Export](https://support.typora.io/Export/), [MarkText Architecture](https://marktext.me/docs/dev/architecture), [Zettlr: A Note on Security](https://docs.zettlr.com/en/getting-started/a-note-on-security.html)). Joplin도 마찬가지다. HTML 노트는 클리핑·가져오기로 들어온 앱 내부 형식이다([Joplin Rich Text Editor](https://joplinapp.org/help/apps/rich_text_editor/)). 엔진 탓이 아니다. 독립 HTML을 열면 스크립트·이동·파일 경로·네트워크 프라이버시·IPC를 모두 새로 책임져야 해서 열지 않은 것으로 보인다(추론).

## 위험은 엔진이 아니라 HTML이 앱 권한에 닿는 길이다

| 앱·계층 | 사고 | 교훈 |
|---|---|---|
| Typora | CVE-2024-33300: 조작한 Markdown으로 XSS → 임의 코드 실행(1.7까지, [NVD](https://nvd.nist.gov/vuln/detail/CVE-2024-33300)). 그전에도 `typora://` 내부 페이지·`file:` URL·MathJax 경로 사고([typora-issues#2226](https://github.com/typora/typora-issues/issues/2226)) | 정화만으로는 부족하다. 문서가 내부 프로토콜·앱 전역에 닿으면 끝난다 |
| MarkText | CVE-2020-27176(옛 DOMPurify의 mutation XSS → RCE, [#2360](https://github.com/marktext/marktext/issues/2360)), CVE-2022-25069·CVE-2023-2318(붙여넣은 HTML이 메인 창에서 실행, [CVE-2023-2318](https://www.cve.org/CVERecord?id=CVE-2023-2318)) | 정화기는 최신으로, 붙여넣기도 정화, 렌더링과 Node 권한을 같은 문맥에 두지 않는다 |
| Zettlr | CVE-2021-26835: XSS → RCE. iframe `srcdoc` 경로 사고 뒤 iframe 호스트 허용 목록·속성 제거로 대응([Postmortem](https://www.zettlr.com/post/postmortem-zettlr-first-security-incident)) | iframe 속성을 그대로 통과시키지 않는다 |
| VS Code 웹뷰 | CVE-2022-41042: 인코딩된 `..`와 문자열 접두사 검사로 `localResourceRoots` 밖 파일을 읽음 | 정규화(canonicalize)한 뒤 경로 구성 요소로 포함 여부를 본다. 문자열 접두사 검사는 쓰지 않는다 |
| Tauri | CVE-2024-35222: 원격 origin iframe이 허용 없이 IPC를 부를 수 있었다(1.6.7·2.0.0-beta.20에서 고침). 고친 뒤에도 "Windows에서 창과 iframe의 origin이 같으면" iframe이 invoke에 닿는다([GHSA-57fm-592m-34r7](https://github.com/tauri-apps/tauri/security/advisories/GHSA-57fm-592m-34r7)) | **같은 origin iframe에서 스크립트가 돌면 IPC가 열린다**. 스크립트를 켤 때는 반드시 다른(불투명) origin |

Frond가 쓰는 Tauri 2.12.0·wry 0.57.0 소스를 직접 읽고 시험 앱에서 쟀다. 확인한 것은 다섯 가지다.
1. IPC 요청은 `Tauri-Invoke-Key` 헤더(실행마다 바뀌는 비밀값)와 `Origin` 헤더를 요구한다. `Origin`을 URL로 해석하지 못하면 거부한다(`ipc/protocol.rs`). 불투명 origin frame의 요청은 `Origin: null`이라 여기서 막힌다. CSP 없이 만든 불투명 frame에서 실제로 "Origin header is not a valid URL"로 거부됐다.
2. Tauri는 invoke 키와 `__TAURI_INTERNALS__`를 넣는 초기화 스크립트를 메인 frame 전용으로 **표시**한다(`manager/webview.rs`). 하지만 Windows의 wry는 이 표시와 상관없이 모든 하위 frame에 넣는다. wry 문서가 "scripts are always added to subframes regardless of the `for_main_frame_only` option"이라고 적는다. 실측에서도 샌드박스 iframe 안에 `__TAURI_INTERNALS__.invoke`가 있었다. 그래도 그 invoke로 파일 쓰기를 불렀을 때 아무 일도 일어나지 않았다. fetch는 ①에서 막히고, 대신 쓰는 postMessage는 wry 처리기(최상위 문서 전용)에 닿지 않는다.
3. 앱이 등록한 커스텀 프로토콜(`http://<이름>.localhost`)은 **로컬 origin으로 취급**한다(`webview/mod.rs` `is_local_url`). 스크립트가 도는 HTML을 커스텀 프로토콜의 진짜 origin으로 두면 ②의 invoke 키까지 갖춰져 뚫린다. 그래서 불투명 origin이 핵심 방어선이다.
4. 원격 origin은 `remote` capability 없이 앱 커맨드에 닿지 않는다.
5. IPC 응답은 `Access-Control-Allow-Origin: *`다.

그래서 마지막 방어선은 CSP가 아니라 ①·③·④와 frame postMessage가 닿지 않는 구조다. CSP는 그 앞에 하나 더 두는 겹이다.

## Frond 설계: 안전 보기는 같은 origin·스크립트 없음, 스크립트 허용은 불투명 origin

조사(Perplexity 딥리서치)의 권장은 "아무것도 허용하지 않은 `sandbox` iframe + 커스텀 프로토콜 + 헤더 CSP + 원격 차단"이다. Frond는 기본 보기에서 한 가지를 바꾼다. 스크립트를 끈 채 `allow-same-origin`을 켜서 **앱이 frame 안 DOM에 손을 댈 수 있게** 한다. 이유는 불투명 origin + 스크립트 없음이면 앱이 할 수 있는 것이 없기 때문이다. 링크를 가로채 밖에서 열지 못하고, 단축키(Ctrl+W·Ctrl+Tab·Ctrl+/)도 frame에 포커스가 들어가면 죽는다. 찾기(Ctrl+F)·줌·인쇄·글자 수도 할 수 없다. foliate-js·Readest가 같은 길(같은 origin + 스크립트 차단)을 간다. WebKit은 버그 218086 때문에 이 조합이 막히지만 Chromium에는 그 버그가 없다. 2026-10-26 헤드리스 Edge 155로 직접 확인했다(근거 노트 `codebase_and_measurements.md`).

| | 안전 보기 (기본) | 스크립트 허용 (문서별, 설정으로 항상) |
|---|---|---|
| frame | `<iframe sandbox="allow-same-origin allow-modals" srcdoc>` | `<iframe sandbox="allow-scripts allow-modals" src="http://htmlview.localhost/<토큰>/<파일>">` |
| origin | 앱과 같음(DOM 접근 가능) | 불투명(`null`) — 앱 DOM·저장소·IPC 차단. 프로토콜이 모든 응답에 CSP `sandbox`를 붙여 어떻게 끼워도 불투명 |
| 스크립트 | ① 샌드박스로 막고 ② `srcdoc` 맨 앞 meta CSP `script-src 'none'`로 막는다. ③ 앱 CSP(인라인 금지)를 물려받고 ④ `<script>`·`on*` 속성·`javascript:` URL·meta refresh를 DOM에서 지운다 | 실행. 헤더 CSP가 `ipc.localhost`·`asset.localhost`를 뺀다. frame 안에도 invoke가 주입돼 있지만(Windows wry) `Origin: null` 거부와 postMessage 미전달로 실패한다 |
| 외부 리소스 | 막음(이미지·CSS·글꼴·미디어 모두 문서 폴더·`data:`만) — 열람 추적 방지 | `https:` 허용(CDN 라이브러리) |
| 로컬 리소스 | 문서 폴더(하위 포함)를 커스텀 프로토콜로 | 같음. CORS 헤더를 주지 않아 스크립트가 옆 파일 내용을 읽지 못한다 |
| 링크 | 앱이 클릭을 받아 `http(s)`·`mailto`는 기본 브라우저, `.md`·`.html`은 Frond 탭, `#조각`은 frame 안 이동 | 주입한 작은 도우미 스크립트가 `postMessage`로 넘김. 앱은 보낸 frame과 사용자 활성화를 확인 |
| 단축키·찾기·인쇄 | 앱이 frame 문서에 직접(찾기는 CSS Highlight API) | 단축키·인쇄는 도우미, 찾기는 소스 모드에서 |
| 줌 | 본문 줌(`Ctrl+±`, `<article>`의 CSS `zoom`)이 frame 내용을 키운다 — 상자는 그대로 | 같음 |

실측 요약(헤드리스 Edge 155, `samples` 밖 임시 페이지):
- 안전 보기 조합에서 인라인 `<script>`와 `onerror`는 돌지 않았다.
- 같은 조합에서 부모가 frame 문서에 단 `click`·`keydown` 리스너는 실제 입력(CDP 마우스·키)에 반응했다. 링크 이동도 `preventDefault`로 막혔다.
- frame 안 CSS Highlight와 `zoom`도 됐다.
- 스크립트 허용 조합에서는 `parent.document`·`localStorage`·쿠키가 모두 막혔다.
- 같은 서버의 `secret.txt`를 `fetch`하는 것도 CORS로 막혔다. 메시지 origin은 `"null"`로 왔다.

## 로컬 리소스는 문서 폴더만 주는 프로토콜로 낸다

`file://`로 바로 열면 상대 경로는 저절로 풀린다. 대신 응답 헤더를 못 붙이고, 문서마다 범위를 정할 수 없다. Tauri asset 프로토콜은 이미 문서 폴더(하위 포함)를 허용 범위에 넣고 있다(`lib.rs` `load_document`). 하지만 경로를 통째로 퍼센트 인코딩(`C%3A%5C…`)하므로 HTML 안 상대 경로가 디렉터리로 풀리지 않는다. 문서마다 CSP를 달 수도 없다. 그래서 문서마다 토큰을 주는 커스텀 프로토콜 `htmlview`를 새로 둔다.

1. 문서를 열 때 추측할 수 없는 토큰을 만들고, 문서 폴더를 정규화한 경로 하나를 루트로 기록한다.
2. `http://htmlview.localhost/<토큰>/<경로>`의 경로는 구성 요소마다 한 번만 퍼센트 디코딩한다. `..`·`.`·드라이브·`:`(ADS)·`\`·NUL이 든 구성 요소는 거부한다.
3. 루트와 합친 뒤 `canonicalize`(심볼릭 링크·정션 해소)하고, `Path::starts_with`(구성 요소 비교)로 루트 안인지 다시 본다.
4. 일반 파일만, 크기 상한을 두고, 확장자별 MIME, `nosniff`, `no-store`, HTML이면 모드별 CSP 헤더를 붙인다.
5. 본문 문서는 디스크가 아니라 앱이 넘긴 편집 중 텍스트로 낸다. 분할 뷰 실시간 미리보기용이다.

WebView2의 `SetVirtualHostNameToFolderMapping`도 같은 일을 하지만 폴더 단위로 열려 문서별 CSP·MIME 거르기가 어렵다([Learn](https://learn.microsoft.com/en-us/dotnet/api/microsoft.web.webview2.core.corewebview2.setvirtualhostnametofoldermapping)). 앱 CSP에는 `frame-src`·`media-src`를 새로 두고, `img`·`style`·`font`에 `http://htmlview.localhost`를 더한다. 단, `frame-src`는 앱이 넣는 frame만 거른다. frame이 스스로 원격 사이트로 가는 이동(`location.href = 'https://…'`)은 릴리스 실측에서 막지 못했다. 그래서 WebView2 이벤트로 HTML 탭 frame의 이동마다 주소를 보고, 프로토콜·`srcdoc`·빈 frame 밖이면 취소한다(`FrameCreated` → frame `NavigationStarting`). 취소된 frame에는 오류 페이지가 남고 원격 문서는 열리지 않는다. PowerToys Peek·Readest가 하는 "문서 밖 이동 차단"과 같다.

## 사용 흐름은 기존 Markdown 문서와 같고, 기본 앱은 건드리지 않는다

- 여는 길: Ctrl+O(필터에 HTML 추가)·끌어다 놓기·폴더 트리(`.html`·`.htm` 표시)·최근 파일·세션 복원·Markdown 안 `.html` 링크. 탐색기 더블클릭은 `.html` 기본 앱을 가져오지 않는다. 브라우저가 계속 기본이다(조사 권장과 같음). "연결 프로그램" 목록 등록은 뒤에 고른다.
- 안전 보기에서 스크립트·외부 리소스를 막았으면 배너로 알린다. 버튼은 [스크립트 허용]·[브라우저로 열기]다. 허용한 문서도 배너·상태바 메뉴에서 [안전 보기로] 되돌릴 수 있다. 설정 `HTML 스크립트`의 기본은 '묻기'이고 '항상 허용'을 고를 수 있다.
- 소스(Ctrl+/)·분할(Ctrl+Shift+/)은 기존 CM6를 그대로 쓰고 HTML 문법 색을 입힌다. `@codemirror/lang-html`은 이미 `lang-markdown`의 의존성으로 들어 있다. 저장·인코딩·줄바꿈 보존·초안·외부 변경 감시는 텍스트 공통이라 바로 된다.
- HTML 문서에는 'HTML로 내보내기'를 숨기고 '브라우저로 열기'를 보인다. AI 훅(`integrations/open-new-md.ps1`)은 지금 md만 넘긴다. 그대로 둔다. 훅을 바꾸면 모든 AI 세션의 동작이 바로 바뀌기 때문이다(사용자 결정).

## 남은 위험과 다음에 볼 것

- 안전 보기는 같은 origin이라 Chromium 샌드박스 버그가 있으면 IPC까지 열린다. 그래서 네 겹(샌드박스·meta CSP·상속 CSP·DOM 정화)을 둔다. Tauri·WebView2를 최신으로 유지하는 것이 전제다.
- 스크립트 허용은 브라우저 탭과 같은 위험을 받아들이는 것이다. 문서 자체 내용 유출·추적·피싱 화면이 가능하다. 그래서 문서별 선택과 되돌리기를 둔다.
- 도우미 스크립트는 페이지 스크립트가 흉내 낼 수 있다. 외부 브라우저·탭 열기는 두 조건을 다 볼 때만 받는다. 사용자 활성화(`navigator.userActivation`)가 있고, 포커스가 그 frame에 있어야 한다. 활성화는 창 전체 기준이라 앱 버튼을 누른 직후 5초 안의 가짜 메시지도 통과했다. 시험에서 확인해 포커스 조건을 더했다.
- Windows에서는 Tauri 초기화 스크립트(invoke 키 포함)가 모든 frame에 들어간다(wry 한계). Tauri가 이 한계를 고치기 전까지는 `Origin` 검사와 postMessage 경로 분리가 실제 방어선이다. Tauri·wry를 올릴 때 E2E 공격 시험(근거 노트 `codebase_and_measurements.md` §3·§4)을 다시 돌린다.
- 스크립트 허용 모드의 찾기·목차, HTML 목차, 분할 뷰 스크롤 동기는 이번 범위 밖이다.
- 탐색기 '연결 프로그램' 등록과 AI 훅의 HTML 넘기기는 사용자 결정으로 남긴다.

## 결론

질문의 답은 "크로미움을 넣는다면 비효율적이고, 넣을 필요도 없다"이다. Frond의 WebView2가 이미 Edge급 크로미움이라 HTML을 그리는 비용은 0에 가깝다. 실제 일은 HTML을 앱 권한에서 떼어 놓는 데 있다. 이 일은 엔진을 바꿔도 줄지 않는다. 선례가 가르는 기준은 하나다. 남의 HTML을 '문서'로 볼지 '앱'으로 돌릴지다. Frond는 기본을 문서로 둔다. 스크립트는 사용자가 문서마다 고를 때만, 앱과 다른 origin에서 돌린다.

---

근거 노트: `docs/research/research_notes/Frond HTML 문서 열기/` (precedents.md, security_and_engine.md, codebase_and_measurements.md). 딥리서치: Perplexity `20261026-174014-1a51`(2026-10-26, 7분 54초, 소스 537개). 코드 기준 main `582398b`, Tauri 2.12.0·wry 0.57.0. 조사일 2026-10-26. 결정 기록: [`20261026-html-view`](../../decisions/ideas/20261026-html-view.md).
