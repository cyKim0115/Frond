# 선례 — HTML 파일을 여는 앱과 열지 않는 앱

> 조사일 2026-10-26. 출처: Perplexity 딥리서치 `20261026-174014-1a51`(소스 537개 중 인용 83개) + 원문 직접 확인 4건(PowerToys Peek 소스, Readest SECURITY.md, foliate-js README, Tauri GHSA-57fm-592m-34r7).
> 표기: "Cited Findings" = 출처가 말하는 사실, "Inferences" = Frond에 대한 해석.

## 1. 여는 쪽 — 보기 전용 문서로 다룬다

### Takeaway
남의 HTML을 보여 주는 앱은 공통으로 세 가지를 한다. 스크립트를 끄고, 외부 리소스를 막고, 문서 폴더(또는 패키지) 밖 파일은 주지 않는다. 엔진은 시스템 WebView(WebView2·WebKitGTK)가 많다.

### Cited Findings
- **PowerToys Peek** (WebView2) — `Peek.FilePreviewer/Controls/BrowserControl.xaml.cs`:
  - `PreviewBrowser.CoreWebView2.Settings.IsScriptEnabled = IsDevFilePreview;` 개발 파일 미리보기일 때만 스크립트를 켠다. 주석에 따르면 Markdown도 true다.
  - NavigationStarting에서 마지막으로 연 URI가 아니면 `args.Cancel = true`.
  - 새 창 요청은 `args.IsUserInitiated`일 때만 처리하고 확인 뒤 밖에서 연다.
  - 개발 파일이 아니면 "Block all other resources including http(s) requests to prevent external tracking" 주석과 함께 원본 파일·그 폴더 밖 요청에 403을 준다.
  - [소스](https://github.com/microsoft/PowerToys/blob/main/src/modules/peek/Peek.FilePreviewer/Controls/BrowserControl.xaml.cs)
- **PowerToys 탐색기 미리보기** — Markdown·SVG는 렌더링하고 `.html`은 흔히 Monaco 소스 미리보기로 보인다. Markdown 처리기는 허용한 이미지를 WebView2 가상 호스트로 내고 경로 포함 여부를 다시 검사한다([Learn: File Explorer add-ons](https://learn.microsoft.com/en-gb/windows/powertoys/file-explorer), [PR #50901](https://github.com/microsoft/PowerToys/pull/50901))
- **Readest** (Tauri, Windows에서 WebView2) — SECURITY.md:
  - "Ebook content is rendered in a sandboxed iframe. External script execution is blocked."
  - "Navigation outside the book context is blocked."
  - "File system access is scoped to the application data directory."
  - CSP 언급은 없다. [SECURITY.md](https://github.com/readest/readest/blob/main/SECURITY.md)
- **foliate-js / Foliate** (WebKitGTK) — README Security:
  - 스크립트 든 EPUB은 지원하지 않는다. 내용을 같은 origin `blob:` URL로 주기 때문에 지금은 안전하게 할 수 없다고 적는다.
  - WebKit 버그 218086 때문에 iframe에 `allow-scripts`가 필요하고, 그러면 샌드박스가 쓸모없어진다.
  - "It is therefore imperative that you use Content Security Policy (CSP) to block all scripts except `'self'`."
  - [README](https://github.com/johnfactotum/foliate-js/blob/main/README.md)
- **Koodo Reader** (Electron) — 책 안 JavaScript 기본 끔([App Store](https://apps.apple.com/us/app/koodo-reader/id6744887779))
- **메일 클라이언트** — Thunderbird는 메시지 JavaScript를 끈다([RHSA-2010:0896](https://access.redhat.com/errata/RHSA-2010:0896.html)). Outlook은 외부 이미지가 열람 추적 비콘이 될 수 있어 차단 설정을 둔다([Microsoft Support](https://support.microsoft.com/en-us/office/what-is-block-external-images-in-settings-dd6b90a7-18d7-4c1c-b4d0-91c205bd1c42))
- **QuickLook (Windows)** — HtmlViewer 플러그인(WebView2), WebViewPlus는 내부 뷰어에 `postMessage`로 내용을 넘긴다([Available Plugins](https://github.com/QL-Win/QuickLook/wiki/Available-Plugins), [QuickLook.WebPlugins](https://github.com/QL-Win/QuickLook.WebPlugins))

## 2. 스크립트를 켜는 쪽 — 내가 쓰는 HTML의 미리보기

### Cited Findings
- **Markdown Monster** (WPF + WebView2)
  - HTML 문서를 편집하면서 내부·별도 창 미리보기로 본다([Working with the HTML Preview](https://markdownmonster.west-wind.com/docs/Features/Working-with-the-HTML-Preview.html)).
  - 미리보기 테마가 JavaScript·온라인 스타일을 쓴다([GitHub](https://github.com/RickStrahl/MarkdownMonster)).
  - 내보낼 때 리소스를 따로 두거나 한 파일에 넣는다([Save as HTML](https://markdownmonster.west-wind.com/docs/Common-Tasks/Save-Markdown-Output-as-HTML.html))
- **VS Code Live Preview**
  - 작업 영역을 로컬 HTTP 서버로 내고 내장 웹뷰나 외부 브라우저로 본다. 작업 영역 밖 파일은 별도 서버 문맥이라 루트 기준 경로가 안 풀릴 수 있다([vscode-livepreview](https://github.com/microsoft/vscode-livepreview)).
  - VS Code 웹뷰는 `localResourceRoots`로 범위를 정하지만 CVE-2022-41042로 우회됐다([Trail of Bits](https://blog.trailofbits.com/2023/02/23/escaping-well-configured-vscode-extensions-for-profit/))
- **Obsidian HTML Reader 계열 플러그인** — `.html`·`.htm`을 등록해 Obsidian 안에서 연다([HTML Direct Reader](https://community.obsidian.md/plugins/html-direct-reader)). 안전 모드는 DOMPurify로 정화하고, 스크립트를 보존하는 "원형" 뷰어는 신뢰하는 로컬 앱용이라고 적는다([obsidian-html-reader-plus](https://github.com/sancodeee/obsidian-html-reader-plus))
- **Notepad++ Preview HTML** — 활성 HTML 문서를 도킹된 WebView2로 미리 본다. 스크립트·원격 정책은 공개 문서에 분명하지 않다([Notepad++ Community](https://community.notepad-plus-plus.org/topic/27533/issues-with-the-preview-html-plugin/14))

## 3. 열지 않는 쪽 — Chromium이 있어도

### Cited Findings
- **Typora**: Markdown 안 HTML과 HTML 내보내기는 되지만 독립 HTML 뷰어는 아니다([Typora Export](https://support.typora.io/Export/))
- **MarkText**: Muya 편집기로 Markdown을 그리고 HTML·PDF로 내보낸다([Architecture](https://marktext.me/docs/dev/architecture))
- **Zettlr**: Pandoc 내보내기 중심이다. "HTML·LaTeX가 정화되지 않을 수 있다"고 경고하고, 신뢰하지 않는 문서에는 렌더러를 끄라고 한다([A Note on Security](https://docs.zettlr.com/en/getting-started/a-note-on-security.html))
- **Joplin**: HTML 노트는 클리핑·가져오기로 생기는 앱 내부 형식이다([Rich Text Editor](https://joplinapp.org/help/apps/rich_text_editor/))

### Inferences
- 위 넷은 Electron이라 HTML을 그릴 엔진이 이미 있다. 그래도 독립 HTML을 열지 않는 이유는 비용이 엔진 쪽이 아니기 때문으로 보인다. 독립 HTML을 열면 스크립트·이동·파일 범위·네트워크·IPC를 모두 새로 책임져야 한다. 이들의 CVE 이력(security_and_engine.md)이 그 비용을 보여 준다.
- Frond에 가장 가까운 선례는 두 가지다. 구조는 **Readest**(Tauri + 샌드박스 iframe), 정책은 **PowerToys Peek**(WebView2, 스크립트 끔, 폴더 밖·원격 차단, 이동 취소)다. 스크립트 허용 모드는 Markdown Monster·VS Code처럼 "사용자가 고른 신뢰 문서" 범주로 둔다.
