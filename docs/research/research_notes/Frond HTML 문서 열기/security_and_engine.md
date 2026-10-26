# 엔진 비용과 보안 사고 — 크로미움을 더 넣는 값과 HTML을 여는 값

> 조사일 2026-10-26. 출처: Perplexity 딥리서치 `20261026-174014-1a51` 인용 출처 + Tauri 권고문 원문. 크기·메모리 수치는 계획용 범위다. 내용·GPU·공유 메모리 회계에 따라 바뀐다.

## 1. 엔진 크기·메모리

### Takeaway
WebView2를 다시 쓰면 배포 크기 증가는 0이다. Electron·Qt WebEngine·CEF는 수십~백수십 MB를 더하고 크로미움 보안 패치 책임을 앱 개발자에게 넘긴다. 그래도 문서 격리 문제는 풀지 못한다.

### Cited Findings
- WebView2 Evergreen은 Windows 11에 기본으로 들어 있고 대부분의 Windows 10에 배포돼 있다. 없는 PC용 부트스트래퍼는 약 2 MB다([Learn: Distribution](https://learn.microsoft.com/en-us/microsoft-edge/webview2/concepts/distribution)). Edge 업데이트 경로로 Microsoft가 갱신한다([Learn: Enterprise management](https://learn.microsoft.com/en-us/microsoft-edge/webview2/concepts/enterprise)). 새 런타임을 쓰려면 앱이 WebView2 객체를 다시 만들어야 한다([Learn: Developer guide](https://learn.microsoft.com/en-us/microsoft-edge/webview2/concepts/developer-guide))
- 프로세스 그룹은 browser 하나 + renderer 하나 이상 + GPU·네트워크·오디오 도우미다([Learn: Process model](https://learn.microsoft.com/en-us/microsoft-edge/webview2/concepts/process-model)). origin이 다른 frame은 Site Isolation으로 렌더러를 따로 받을 수 있다([Chromium docs](https://chromium.googlesource.com/chromium/src.git/+/HEAD/docs/process_model_and_site_isolation.md))
- Site Isolation은 탭이 많은 데스크톱 작업에서 전체 메모리를 약 10~13% 늘렸다(작업 전체 측정, [chromium.org](https://www.chromium.org/Home/chromium-security/site-isolation/))
- 별도 WebView2 컨트롤: 옛 MS 엔지니어 추정은 첫 컨트롤 약 250 MB, 추가 100 MB+다. 내용 의존이고 공유 메모리를 겹쳐 셌다([WebView2Feedback#799](https://github.com/MicrosoftEdge/WebView2Feedback/issues/799))
- Electron 빈 앱: 압축 설치기 약 55~75 MB, 설치 후 85~120 MB다. 옛 측정 하나는 압축 77 MB·풀면 181 MB였다([HN](https://news.ycombinator.com/item?id=28141630), [urhoba](https://www.urhoba.net/en/post/packaging-and-distributing-electron-apps))
- Qt WebEngine: 한 Windows 배포가 60 MB → 136 MB(+76 MB, [Qt interest 2025-02](https://lists.qt-project.org/pipermail/interest/2025-February/040098.html))
- Tauri 2: 추가 `WebviewWindow`는 안정 API다. 한 창 안 여러 웹뷰(`Window::add_child`)는 `unstable` 기능 뒤에 있다([Tauri webviewWindow](https://v2.tauri.app/reference/javascript/api/namespacewebviewwindow/), [docs.rs Window](https://docs.rs/tauri/latest/tauri/window/struct.Window.html))

### Inferences
- Frond 실측(2026-10-06 디버그 빌드)은 보통 문서 탭 20개가 +116 MB였다. HTML 탭은 frame 문서 하나를 더 두니 이보다 무겁다. 스크립트 허용 문서는 다른 origin이라 렌더러가 하나 더 붙을 수 있다. 큰 문제는 아니지만 "탭 수 × 무거운 HTML"이면 체감될 수 있다. 큰 문서처럼 오래 안 본 HTML 탭의 frame을 비우는 정리(`trimLargeTabs`)는 필요해지면 붙인다.
- 네이티브 자식 웹뷰는 DOM 위에 그려져 앱 팝업·오른쪽 클릭 메뉴(DOM)를 가린다. 그래서 별도 웹뷰는 별도 창일 때만 실용적이다.

## 2. 보안 사고

### Takeaway
사고의 공통 사슬은 "문서 속 HTML/Markdown → 스크립트 실행 → 앱 권한(Node·IPC·내부 프로토콜)"이다. 정화기(DOMPurify)는 한 겹일 뿐이다. 렌더링 문맥을 앱 권한과 떼어 놓는 것이 근본 대책이다.

### Cited Findings
- **Typora**
  - CVE-2024-33300: 조작한 Markdown → XSS → 임의 코드 실행(1.7까지, [NVD](https://nvd.nist.gov/vuln/detail/CVE-2024-33300), [GHSA-9w5v-j38r-rr4m](https://github.com/advisories/GHSA-9w5v-j38r-rr4m)).
  - 그전 사고: `typora://` 내부 페이지, 잘못된 `file:` URL, MathJax 경로([CVE-2023-2317](https://dbugs.ptsecurity.com/vulnerability/PT-2023-18871), [typora-issues#2226](https://github.com/typora/typora-issues/issues/2226), [CVE-2019-12172](https://nvd.nist.gov/vuln/detail/CVE-2019-12172))
- **MarkText**
  - CVE-2020-27176: 옛 DOMPurify의 mutation XSS → RCE([#2360](https://github.com/marktext/marktext/issues/2360)).
  - CVE-2022-25069·CVE-2023-2318: 붙여넣은 HTML이 메인 창에서 실행됐다([Aqua](https://avd.aquasec.com/nvd/2022/cve-2022-25069/), [CVE-2023-2318](https://www.cve.org/CVERecord?id=CVE-2023-2318), [#2990](https://github.com/marktext/marktext/issues/2990))
- **Zettlr** — CVE-2021-26835: XSS → RCE. iframe/`srcdoc` 경로 사고 뒤 iframe 호스트 허용 목록과 위험 속성 제거로 바꿨다([CVE](https://www.cve.org/CVERecord?id=CVE-2021-26835), [Postmortem](https://www.zettlr.com/post/postmortem-zettlr-first-security-incident), [#1716](https://github.com/Zettlr/Zettlr/issues/1716))
- **VS Code**
  - CVE-2022-41042: 인코딩한 `..`와 접두사 문자열 검사로 `localResourceRoots`를 우회했다([Trail of Bits 2023-02](https://blog.trailofbits.com/2023/02/23/escaping-well-configured-vscode-extensions-for-profit/)).
  - `localResourceRoots`가 `file` 스킴만 받게 하라는 이슈도 있다([vscode#135361](https://github.com/microsoft/vscode/issues/135361))
- **Tauri** — GHSA-57fm-592m-34r7 / CVE-2024-35222([원문](https://github.com/tauri-apps/tauri/security/advisories/GHSA-57fm-592m-34r7)):
  - 원격 origin iframe이 허용 없이 IPC 끝점에 닿았다. "any iframe you add in your Tauri frontend will get access to Tauri APIs, even in isolation mode."
  - 공격에는 "script execution (e.g. XSS) in a script-enabled iFrame"이 필요했다. 응답은 받지 못했다.
  - 영향 범위는 v1 1.6.6 이하와 v2 2.0.0-beta.0~19이고, 1.6.7과 2.0.0-beta.20에서 고쳤다.
  - 고친 뒤에도 iframe의 invoke 접근은 "except on Windows when the origin of the Tauri window and the origin of the iFrame are the same" 열려 있다.
  - macOS에서 IPC 스크립트가 iframe에 주입되던 것은 의도치 않은 동작이었다고 적는다.
- **메일 프라이버시** — 원격 이미지 하나로 열람 시각·IP가 드러난다. Outlook 외부 이미지 차단 설정이 이 때문에 있다([Microsoft Support](https://support.microsoft.com/en-us/outlook/what-is-block-external-images-in-my-settings))

### Inferences
- Frond의 Markdown 원문 HTML은 지금 DOMPurify 허용 목록(결정 D1)으로 앱 문서에 바로 넣는다. 이 경로는 MarkText·Typora와 같은 부류의 위험을 이미 진다. 독립 HTML은 태그 범위가 훨씬 넓다. 그래서 같은 방식(정화 후 앱 DOM에 삽입)으로 열지 않는다. 브라우저가 강제하는 iframe 샌드박스를 경계로 쓴다.
- "Windows에서 같은 origin iframe은 invoke에 닿는다"는 말은 안전 보기 설계의 전제 조건이다. 같은 origin frame에서는 **스크립트가 한 줄도 돌면 안 된다**. 그래서 샌드박스·meta CSP·상속 CSP·DOM 정화 네 겹을 둔다.
- 스크립트를 켤 때는 불투명 origin이 필수다. 커스텀 프로토콜의 진짜 origin(`http://htmlview.localhost`)도 Tauri가 로컬로 치므로 안 된다(codebase_and_measurements.md §2).
