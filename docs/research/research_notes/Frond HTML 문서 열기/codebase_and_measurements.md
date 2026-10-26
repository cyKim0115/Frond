# Frond 코드·Tauri 2.12 소스·실측 — HTML 보기를 어디에 어떻게 붙이나

> 조사 범위: 로컬 저장소 main `582398b`(2026-10-26), Tauri 2.12.0·wry 0.57.0·webview2-com 0.39.1(`Cargo.lock`), WebView2 런타임 155.0.4283.62, Edge 155(헤드리스).
> 링크는 이 노트 위치에서 저장소 루트(`../../../../`) 기준 상대 경로다. Tauri 소스는 `~/.cargo/registry/src/*/tauri-2.12.0/src/` 기준 파일:줄이다.

## 1. Frond의 문서 경로 — 지금은 Markdown만 가정한다

### Cited Findings
- 문서 읽기는 `load_document`가 맡는다. frond-core로 읽고 인코딩을 감지하고, 문서 폴더(하위 포함)를 asset 프로토콜 범위에 넣는다 — [src-tauri/src/lib.rs:86-110](../../../../src-tauri/src/lib.rs#L86-L110). 확장자는 보지 않아서 HTML도 텍스트로 읽힌다
- 메인 웹뷰 이동은 `tauri.localhost`·`localhost`·`127.0.0.1`만 허용한다 — [src-tauri/src/lib.rs:183-195](../../../../src-tauri/src/lib.rs#L183-L195)
- 앱 CSP는 `default-src 'self'`, `script-src 'self'`(인라인 금지), `style-src 'self' 'unsafe-inline'`, `img-src … asset: http://asset.localhost data: https:`다. `frame-src`·`media-src`는 따로 없어 `default-src`를 따른다 — [src-tauri/tauri.conf.json:16-27](../../../../src-tauri/tauri.conf.json#L16-L27)
- 탭마다 `<article class="markdown-body doc">`를 만들고 렌더링 결과를 넣는다 — [src/main.ts:275-318](../../../../src/main.ts#L275-L318), [src/main.ts:666-714](../../../../src/main.ts#L666-L714)
- 확장자를 가정하는 곳:
  - 열기 필터 [src/main.ts:1854-1862](../../../../src/main.ts#L1854-L1862), 다른 이름으로 저장 필터 [src/main.ts:1218-1221](../../../../src/main.ts#L1218-L1221)
  - 인쇄 제목 [src/main.ts:1900](../../../../src/main.ts#L1900)
  - 링크 정책 `LOCAL_DOC_RE`·`DOC_EXT_RE` [src/render/links.ts:19-20](../../../../src/render/links.ts#L19-L20)
  - 폴더 트리 `DOC_EXTS` [src-tauri/src/tree.rs:19](../../../../src-tauri/src/tree.rs#L19)
  - AI 훅 `Test-ShouldOpen` [integrations/open-new-md.ps1:48-49](../../../../integrations/open-new-md.ps1#L48-L49)
- 소스 편집기는 언어가 Markdown 하나로 고정돼 있다 — [src/editor.ts:113-128](../../../../src/editor.ts#L113-L128). `@codemirror/lang-html`은 `lang-markdown`의 의존성으로 이미 `node_modules`에 있다
- 보기 모드 찾기는 앱 `document`의 TreeWalker·Range·`CSS.highlights`를 쓴다 — [src/find.ts:48-91](../../../../src/find.ts#L48-L91)
- 앱 단축키는 `window` keydown 캡처 하나에 모여 있다 — [src/main.ts:2115-2209](../../../../src/main.ts#L2115-L2209)
- WebView2 COM을 직접 다루는 선례가 있다. 기본 오른쪽 클릭 메뉴의 '인쇄'를 앱 인쇄로 돌린다 — [src-tauri/src/print_menu.rs](../../../../src-tauri/src/print_menu.rs)

## 2. Tauri 2.12 — iframe과 IPC

### Cited Findings
- IPC 커스텀 프로토콜 응답에는 `Access-Control-Allow-Origin: *`가 붙는다 — `ipc/protocol.rs:51`
- IPC 요청에는 `Tauri-Invoke-Key` 헤더가 꼭 있어야 한다. `Origin` 헤더도 URL로 해석돼야 하고, 실패하면 거부한다("Origin header is not a valid URL") — `ipc/protocol.rs:480-494`
- `on_message`는 invoke 키가 실행 때 만든 값과 다르면 버린다 — `webview/mod.rs:2010-2030` 부근
- 로컬 판정 `is_local_url`은 세 경우를 로컬로 본다. **앱이 등록한 커스텀 프로토콜**도 그중 하나다(Windows에서는 `http://<이름>.localhost`) — `webview/mod.rs:1966-2008`
  - `tauri://` 프로토콜
  - `devUrl`·`frontendDist`를 기준으로 한 URL
  - 앱이 등록한 커스텀 프로토콜
- 원격 origin은 ACL(capability)이 없으면 앱 커맨드도 거부한다("ensures remote content can never reach custom commands unless an explicit `remote` capability has been configured") — `webview/mod.rs` `on_message`의 ACL 검사
- Tauri 자체 초기화 스크립트는 전부 `main_frame_script`, 곧 `for_main_frame_only: true`로 **표시**한다 — `manager/webview.rs:159-226`
  - `isTauri`
  - `__TAURI_INTERNALS__`
  - invoke 키 스크립트
  - metadata
  - IPC·pattern
- **그러나 Windows의 wry 0.57은 이 표시를 지키지 못한다** — "**Windows:** scripts are always added to subframes regardless of the `for_main_frame_only` option."(`wry-0.57.0/src/lib.rs:1029`). WebView2 `AddScriptToExecuteOnDocumentCreated`가 모든 frame에 들어가기 때문이다. wry 자신의 `window.ipc` 스크립트도 같다(`webview2/mod.rs:952`). 2026-10-26 실측에서 샌드박스 iframe(불투명 origin) 안에도 `__TAURI_INTERNALS__.invoke`(invoke 키를 닫아 둔 함수)·`window.ipc`·`window.chrome.webview`가 있었다
- wry IPC 처리기는 `CoreWebView2.WebMessageReceived`(최상위 문서의 `postMessage`)에만 붙는다 — `webview2/mod.rs:955-985`
- 플러그인의 `js_init_script`는 메인 frame 전용 표시(`plugin.rs:374`)이고, 모든 frame용은 따로 있다(`plugin.rs:403`). Windows에서는 위와 같이 표시와 상관없이 하위 frame에도 들어간다
- 앱 CSP의 `style-src`에 nonce·해시를 더하는 것은 인라인 스타일 nonce 토큰이나 해시가 있을 때뿐이다 — `manager/mod.rs:96-105`. Frond `index.html`에는 인라인 `<style>`이 없다. 그래서 `'unsafe-inline'`이 살아 있고, `srcdoc` 문서가 물려받는 정책에서도 인라인 `<style>`이 막히지 않는다

### Measured (2026-10-26, Frond 시험 앱 — 개발 빌드, 식별자 `com.cykim.mdeditor.e2etest`)
- 스크립트 허용 frame(불투명 origin, `htmlview` CSP)에서 `__TAURI_INTERNALS__.invoke('write_export', …)`·`invoke('file_exists', …)`는 3초 넘게 응답이 없었고 파일도 생기지 않았다. custom protocol fetch는 CSP `connect-src`에서 막혔고, Tauri가 postMessage로 넘어갔지만 그 메시지도 처리기에 닿지 않았다
- CSP 없이 만든 불투명 origin `srcdoc` frame에서는 같은 호출이 곧바로 거부됐다 — `"Origin header is not a valid URL"`(fetch 응답 500). CSP와 상관없이 Tauri 자신이 `Origin: null`을 거부한다
- iframe 안 `window.ipc.postMessage(…)`(wry 경로)를 직접 불러도 아무 일이 없었다

### Inferences
- **불투명 origin frame**(`sandbox`에 `allow-same-origin` 없음)은 세 겹으로 막힌다. ① Tauri가 `Origin: null`을 거부하고 ② iframe의 postMessage는 wry 처리기(최상위 문서 전용)에 닿지 않고 ③ CSP `connect-src`가 IPC 주소를 뺀다. frame 안에 invoke와 키가 있다는 사실(Windows wry 한계)은 이 셋 때문에 쓸모가 없다. 스크립트를 켜는 모드는 이것을 쓴다.
- 같은 HTML을 커스텀 프로토콜의 **진짜 origin**(`http://htmlview.localhost`)으로 두면 뚫린다. `is_local_url`이 로컬로 치고, Windows에서는 invoke 키까지 frame에 있다. 그래서 `htmlview`의 모든 응답에 CSP `sandbox` 지시어를 붙인다. iframe 속성이 빠져도 이 프로토콜이 낸 문서는 늘 불투명 origin이 된다.
- **같은 origin frame**(`srcdoc` + `allow-same-origin`)은 스크립트가 돌면 자기에게 주입된 invoke로든 `parent.__TAURI_INTERNALS__`로든 바로 IPC에 닿는다(권고문의 Windows 예외와 같은 이야기). 안전 보기는 스크립트가 0줄이어야 성립한다.

## 3. 헤드리스 Edge 155 실측 (2026-10-26)

세션 scratchpad의 Node 스크립트로 쟀다(실험 코드는 저장소에 두지 않는다 — CLAUDE.md 상시 규칙). 구성:
- 부모 페이지(`http://localhost:47001`) 하나에 iframe 둘을 둔다.
  - A: `srcdoc` + `sandbox="allow-same-origin"`. 안에 meta CSP `script-src 'none'`, 인라인 `<script>`, `<img onerror>`, 링크, 입력 칸을 넣었다.
  - B: `sandbox="allow-scripts"`, `src`는 다른 origin(`http://127.0.0.1:47002`). 안의 스크립트가 격리 상태를 `postMessage`로 알린다.
- 입력은 CDP `Input.dispatchMouseEvent`·`dispatchKeyEvent`(실제 입력 경로)로 넣었다.

| 항목 | 결과 |
|---|---|
| A: 부모가 frame DOM 읽기 | 됨 |
| A: 인라인 `<script>` / `onerror` | 둘 다 실행 안 됨 |
| A: 부모가 frame 문서에 단 `click` 리스너(실제 클릭) | 받음(`click:lnk`), `preventDefault`로 이동 안 함(frame이 같은 문서 유지) |
| A: frame 입력 칸에 포커스 뒤 Ctrl+W | 부모가 단 `keydown` 리스너가 받음(`key:ctrl+w`), 포커스는 iframe |
| A: frame 창의 `CSS.highlights` + `Highlight` | 됨 |
| A: frame `documentElement.style.zoom = 2` | 글자 상자 폭 200 → 400 |
| A: `contentWindow.print` | 함수로 보임(대화상자는 헤드리스라 확인 안 함) |
| B: 메시지 `event.origin` | `"null"` |
| B: `parent.document` / `localStorage` / `document.cookie` | 모두 막힘 |
| B: 같은 서버 `fetch('/secret.txt')`(서버가 CORS 헤더 없음) | 막힘(TypeError) |
| B: iframe 요소에 CSS `zoom: 2` | frame 안 `devicePixelRatio` 1 → 2, `innerWidth` 그대로 — 내용이 확대됨(상자도 2배) |

### Inferences
- Chromium에는 foliate-js가 적은 WebKit 버그 218086(샌드박스 frame에서 부모 리스너가 안 도는 문제)이 없다. 그래서 "같은 origin + 스크립트 없음"으로 링크·단축키·찾기·줌을 앱이 직접 처리할 수 있다.
- 불투명 origin frame은 CORS 헤더 없는 응답의 내용을 읽지 못한다. 그래서 `htmlview` 프로토콜이 `Access-Control-Allow-Origin`을 **붙이지 않으면**, 스크립트 허용 문서도 옆 파일을 `fetch`로 빼 갈 수 없다. Chrome이 `file://` 페이지에 하는 제한과 같다.
- 실제 앱(WebView2 + Tauri 프로토콜·CSP)에서는 같은 항목을 E2E로 다시 잰다. 헤드리스 Edge는 Tauri IPC가 없어서 IPC 거부는 앱에서만 확인할 수 있다.

## 4. 앱 E2E — 구현 뒤 실제 앱에서 (2026-10-26, 브랜치 `feat/html-view`)

세션 scratchpad의 CDP 시험 스크립트로 쟀다(저장소에 두지 않음). 앱은 식별자를 `com.cykim.mdeditor.e2etest`로 바꿔 빌드해 설치본과 따로 띄웠다. 시험 문서는 scratchpad 폴더에 두고, 앱에 두 번째 인스턴스(탐색기 더블클릭과 같은 경로)로 넘겼다. 외부 열기 IPC(`open_url`·`open_in_browser`)는 CDP `Fetch`로 가로채 실제 브라우저를 열지 않았다.
- **개발 빌드**(Vite, 앱 CSP 없음): 57개 항목 통과
- **릴리스 빌드**(`tauri build --no-bundle`, 앱 CSP 적용): 59개 항목 통과
  - 앱 CSP가 걸렸다 — DOM에 넣은 인라인 스크립트가 막혔다
  - 스크립트 허용 frame이 `location.href = 'https://example.com/'`으로 가는 이동이 막혔다 — frame 이동 가드. 가드를 넣기 전에는 이동했다

| 묶음 | 확인한 것 |
|---|---|
| 안전 보기 | 샌드박스 값, `srcdoc`, base가 프로토콜 토큰 폴더. 스크립트·`onclick` 없음. 문서 폴더 이미지·CSS 보이고 외부 이미지 막힘. 막은 것 배너, 글자 수. 외부 링크 클릭 → `open_url`(URL 일치)이고 frame은 그대로. frame에 포커스가 있을 때 Ctrl+F → 앱 찾기, frame 안 하이라이트 |
| 스크립트 허용 | 샌드박스·프로토콜 src, 되돌리기 배너, 글자 수 숨김. 문서 스크립트가 돌고 origin은 `null`. 클릭 없는 링크 메시지는 무시. 외부 링크 클릭 → `open_url` 한 번. frame 포커스에서 Ctrl+/ → 소스 모드, HTML 태그가 entity-tag 색. `../` Markdown 링크 → Frond 탭. 안전 보기로 되돌림 |
| 공격(안전 보기) | `parent.PWNED` 못 씀, IPC 파일 쓰기 없음. meta refresh·원래 base·prefetch·`javascript:` 지움. 폼 제출로도 frame 이동 없음. 중첩 로컬 frame(page2) 스크립트 안 돎 |
| 공격(스크립트 허용) | parent 접근·`parent.__TAURI_INTERNALS__` 막힘. frame 자신의 invoke로 파일 쓰기 실패. IPC·asset fetch 막힘. 옆 파일 fetch·XHR·no-cors와 `../` 파일 못 읽음. 저장소·쿠키·팝업·최상위 이동 막힘 |
| 프로토콜 | 문서 폴더 파일 200·CSP sandbox·CORS 헤더 없음. `%2e%2e`·`..%2F`·`..%5C`·드라이브·ADS·끝 점·없는 토큰·토큰 없음은 403/404 |
| 그 밖 | Markdown 안 `.html` 링크 → HTML 탭. 분할 미리보기가 편집을 따라감, 저장할 때 CRLF 보존. 줌 110%(frame 내용 확대, 상자 그대로). 바탕색 없는 문서는 흰 Canvas |

### 시험하며 고친 것
- **가짜 링크 메시지**: 앱 버튼을 누른 직후 5초 안에는 frame이 클릭 없이 보낸 링크 메시지도 받아들였다. 사용자 활성화가 창 전체 기준이기 때문이다. 그래서 "포커스가 그 frame에 있을 때만" 조건을 더했다
- **`../` 링크**: 스크립트 허용에서 문서 폴더 위를 가리키는 링크가 프로토콜 URL(`http://htmlview.localhost/x.md`)로 풀려 폴더를 잃었다. 도우미가 `href` 원문도 보내고, 앱이 안전 보기와 같은 판정을 쓰게 했다
- **frame 스스로의 원격 이동**: 앱 CSP `frame-src`가 막지 못했다(위). WebView2 frame 이동 가드를 더했다

### 시험 도구 함정 (다음 시험 때)
- `window.__TAURI_INTERNALS__.invoke`는 쓰기 금지 속성이라 JS로 감시 함수를 씌울 수 없다. 덮어쓰기가 조용히 실패해 첫 시험에서 실제 `open_url`이 돌았다(기본 브라우저에 example.com이 열림). 그래서 CDP `Fetch`로 가로챈다
- IPC 요청은 앱과 다른 origin이라 CORS 사전 요청(OPTIONS)이 먼저 온다. 여기에 허용 헤더로 답하지 않으면 fetch가 실패한다. 그러면 Tauri가 그 페이지의 IPC를 postMessage로 바꾸고, 가로채기를 지나 실제 명령이 돈다
- 지난 시험이 남긴 초안이 있으면 '저장하지 않은 초안' 팝업이 떠서 단축키가 먹지 않는다(팝업이 열리면 단축키를 받지 않는 기존 동작)
- frame 안 `scrollIntoView`는 앱 쪽 스크롤도 비동기로 움직여 클릭 좌표가 어긋난다. frame 안에서는 `window.scrollTo`를 쓴다

## 5. 사용자 HTML 표본 (`C:\Users\cykim\repo`, 깊이 6)

`node_modules`·`target`·`dist`·`.git`·`Library`·`Temp`·`obj`는 뺐다.
- HTML·HTM 285개 중 `<script>`가 든 것은 159개(56%)다. CDN 스크립트·스타일(`cdn`·`unpkg`·`cdnjs`·`fonts.googleapis`)을 거는 것은 15개다
- AI가 만든 보고서 예:
  - 게임 프로젝트의 결론 보고서(41 KB): 스크립트는 1.5 KB 인쇄 도우미(`beforeprint`에 접힌 내용 펼치기)뿐이다. 스크립트를 빼도 본문 8.8천 자가 보인다
  - 아키텍처 다이어그램 보고서 두 개(87 KB·97 KB, 스크립트 40 KB·47 KB): 클릭형 다이어그램이라 스크립트가 있어야 한다
  - 기기 색 비교 보고서(6.4 MB): 비교 이미지를 base64로 스크립트 안에 들고 있다가 그린다. 스크립트 없이는 글 8.5천 자만 보인다
- architecture-diagram 스킬 템플릿은 Google Fonts CSS를 건다. 안전 보기에서는 시스템 글꼴로 대체된다

### Inferences
- 이 사용자의 HTML은 "스크립트 없이 읽히는 보고서"와 "스크립트가 있어야 하는 다이어그램·이미지 보고서"가 섞여 있다. 그래서 안전 보기만으로는 모자라고, 문서별로 스크립트를 허용하는 길과 브라우저 넘기기가 둘 다 필요하다.
