# MdEditor 개발 로드맵

작성: 2026-09-29 · 근거: [참고 자산](references/assets/20260929-typora-md-editors/ASSET.md) · [스택 판정](decisions/ideas/20260929-stack.md) · [엔진 판정](decisions/ideas/20260929-editor-engine.md) · [MVP 3안](decisions/ideation/20260929-mvp-scope.md)

이 문서는 **어느 MVP 안을 골라도 Phase 0–2가 같도록** 짰다. V1(리더 퍼스트)은 Phase 0–2, V2(Typora-lite 분할)는 + Phase 3–4, V3(인라인 하이브리드)는 + Phase 5다. 설정·테마는 Phase와 따로 가는 **셸 트랙**(S-1~S-4)이다.
스택 Tauri 2 + Vite + vanilla TS, 엔진 CodeMirror 6, MVP V1은 2026-09-29에 확정됐다. Phase 0 IME 스파이크가 통과하기 전에는 Phase 1 제품 스캐폴딩을 만들지 않는다.

## 확정된 것 (게이트 0, 2026-09-29)

| 결정 | 확정 | 기록 |
|------|------|------|
| 앱 스택 | Tauri 2 + Vite + TS, `ADOPT_WITH_CHANGES` (IME 스파이크 통과 시 `ADOPT`) | `decisions/ideas/20260929-stack.md` |
| 에디터 엔진 | CM6 + 자체 데코 + 바이트 보존 계층, `ADOPT_WITH_CHANGES` | `decisions/ideas/20260929-editor-engine.md` |
| MVP 범위 | **V1 리더 퍼스트** (Phase 0–2) | `decisions/ideation/20260929-mvp-scope.md` |
| 유사도 | `inspired` | `references/assets/…/ASSET.md` |
| Phase 0 추가 | WPF + WebView2 hello 앱으로 Windows 시작 시간·메모리 비교 측정 | 사용자 선택 |
| RAG 캡처 | MVP(Phase 2) 완료 후 `capture-to-rag` — 2026-10-01 위임으로 MVP 닫을 때 묻지 않고 실행 | 사용자 결정 · `decisions/ideas/20261001-v1-open-decisions.md` D6 |

## Phase 0 — 스파이크와 코어 (구현 전 검증)

**상태: 완료 2026-09-29.** 0-1은 Win10 19045 새 IME 기준 잠정 통과(이전 IME·Win11은 1-7에서 보강). 결과와 수치는 [`decisions/ideas/20260929-stack.md`](decisions/ideas/20260929-stack.md) "Phase 0 결과 기록란". 코어는 `crates/mdeditor-core`(main), 스파이크·hello 앱은 `archived-exp/ime-spike`·`archived-exp/wpf-hello`.

목표: 스택 판정의 조건(IME)을 실측으로 닫고, UI 없이도 검증 가능한 파일 충실도 코어를 만든다.

| 작업 | 산출물 | 완료 조건 (EARS) |
|------|--------|------------------|
| 0-1 IME 스파이크 (`exp/ime-spike`) | Tauri 2 최소 앱: `<textarea>` / CM6 plain / CM6 + replace 데코 세 편집면 | When 한국어 MS IME(새·이전 각각)로 아래 시나리오를 Win10 19045·Win11에서 수행하면, the 세 편집면 중 최소 CM6 plain shall 글자 유실·중복·자소 분리 없이 입력을 받는다 |
| | 시나리오: ① 기존 텍스트가 있는 편집면 첫 클릭 후 즉시 한글 입력(tauri #15436) ② 조합 중 버튼 클릭·Alt+Tab(#5475, G16) ③ 조합 중 Enter·Ctrl+S(G18) ④ 자동 줄바꿈 경계에서 입력(G17) ⑤ 선택+Backspace 후 입력(T20) ⑥ YAML front matter 직후 문단(T20) ⑦ 백틱·`**` 뒤 한글(#4251) ⑧ 데코 위젯 바로 앞에서 조합 | 결과표를 `docs/decisions/ideas/20260929-stack.md` Follow-up에 기록. 실패 시 플래그(G6) → textarea/EditContext(G7) → Electron 순으로 재판정 |
| 0-2 파일 충실도 코어 (Rust crate `mdeditor-core`) | `FileDocument` 읽기/쓰기: BOM 스니핑 → UTF-8 검증 → chardetng(EUC-KR 후보) → 디코드, 줄별 EOL 맵·끝 개행 플래그, 무편집 저장 = 원본 바이트, 편집 저장 = 재결합·재인코딩(`*_without_replacement` 손실 검사) → 임시파일 + `ReplaceFileW`(실패 시 in-place) | When `samples/raw/*.md`를 열고 편집 없이 저장하면, the 코어 shall 바이트를 1도 바꾸지 않는다 (`git status` 깨끗, CI 테스트). When 한 줄만 편집해 저장하면, shall 그 줄 외의 바이트·EOL·BOM·끝 개행을 보존한다. When CP949로 표현 불가한 문자를 넣고 저장하면, shall 조용히 손상하지 않고 UTF-8 변환 여부를 묻는 오류를 돌려준다 |
| 0-3 Windows 실측 | Tauri hello vs **WPF + .NET 10 + WebView2 hello** 같은 PC에서 콜드/웜 시작 시간·프로세스 트리 RSS(WebView2 프로세스 포함) 각 10회 중앙값 | 콜드 시작 < 1 s 목표치 확인. 수치는 ASSET "Rules & numbers"와 스택 판정 Follow-up에 기록. WPF 코드는 측정 후 폐기(`exp/wpf-hello`) |
| 0-4 픽스처 보강 | 한글·공백·`[`·`#` 경로 이미지 픽스처(`samples/paths/`), 2 MB·10 MB 대용량 샘플(`samples/gen-large.ps1` 생성, 미커밋) | (바이트 픽스처 `samples/raw/`는 `-text` 규칙 유지) |

## Phase 1 — 뷰어 MVP (더블클릭 → 깔끔한 렌더)

**상태: 구현 완료 2026-09-29, 1-7 실기 2026-09-30·10-01 — 8번(이전 IME·Win11, 환경 없음) 빼고 통과.** 10 MB는 열기 통과·조작 2 s+ 지연(알려진 한계), 큰 문서 인쇄는 확인 팝업으로 가드(결정 D7).

| 작업 | 내용 | 완료 조건 |
|------|------|-----------|
| 1-1 스캐폴딩 | tauri ≥ 2.12(tao ≥ 0.35.4), Vite 6, vanilla TS, `tauri-plugin-single-instance` ≥ 2.4.5(첫 플러그인), `capabilities/` 최소 권한, `.gitignore`에 `node_modules/ dist/ src-tauri/target/`, `CLAUDE.md` 구조·빌드 절 | `pnpm tauri dev`로 창 표시 |
| 1-2 파일 열기 경로 | argv(`args_os`, `-` 플래그 스킵, `file://`→`to_file_path`) · single-instance 콜백(`set_focus`) · `onDragDropEvent` paths · 파일 열기 대화상자. 열린 문서 폴더를 `asset_protocol_scope().allow_directory(비재귀)` | When 탐색기에서 `.md`를 더블클릭하면, the 앱 shall 1 s 내 렌더된 문서를 보인다. When 앱이 떠 있는 상태에서 두 번째 `.md`를 더블클릭하면, shall 새 프로세스를 띄우지 않고 기존 창에서 연다 |
| 1-3 렌더 파이프라인 | markdown-it 15 + `markdown-it-cjk-friendly` + anchor + task lists + footnote + front matter, `data-line` 부여, DOMPurify, highlight.js core(언어 지연 로드), 링크 스킴 허용 목록(`http(s)`·`mailto`; `file:`·상대 `.md`는 `on_navigation`에서 가로채 앱 내 열기), 이미지는 문서 폴더 기준 절대경로 → `convertFileSrc` | `samples/showcase.md`의 표·체크리스트·코드·이미지·각주가 GitHub 렌더와 동등. `javascript:`·`data:` 차단 |
| 1-4 UI 기조 | 툴바 없음, 접히는 사이드바(TOC), 상태바(줌·인코딩·EOL 표시), 다크 모드(`prefers-color-scheme` + 수동), 줌 Ctrl+±/0, Typora 수치(860 px, 16 px/1.6) 기반 테마 CSS + 한국어 오버라이드(`html lang=ko`, `:lang(ko)` keep-all, `overflow-wrap: break-word`, 표 `anywhere`, Pretendard 폴백 스택, D2Coding woff2 번들 + `local()` 우선) | 창 크기 400–1920 px에서 가로 스크롤 없음. 한글 단어가 음절 중간에서 끊기지 않음 |
| 1-5 외부 변경(읽기) | notify-debouncer-full(2 s) + 내용 해시로 자기 저장·mtime-only 변경 무시 → dirty 아니면 조용히 리로드(스크롤 위치 유지) | When 다른 편집기가 파일을 저장하면, the 뷰어 shall 3 s 내 새 내용을 보이고 스크롤 위치를 유지한다 |
| 1-6 설치기·파일 연결 | NSIS `currentUser`, `fileAssociations [{ext:["md","markdown"], name:"MdEditor.Markdown", description:"Markdown 문서", mimeType:"text/markdown", role:"Editor"}]`, `NSIS_HOOK_POSTINSTALL`: `.md/.markdown` `OpenWithProgids`, `.mdown/.mkd/.mkdn/.mdwn` `OpenWithProgids`만, `Applications\mdeditor.exe\SupportedTypes`·`FriendlyAppName`, `Software\MdEditor\Capabilities`(`ApplicationDescription` 필수) + `RegisteredApplications`, `UPDATEFILEASSOC`; `POSTUNINSTALL`: 자기 ProgId·`OpenWithProgids` 값만 삭제. `minimumWebview2Version: 150`. 앱 내 "기본 앱으로 설정" → `ms-settings:defaultapps?registeredAppUser=MdEditor`(Win10은 `ms-settings:defaultapps`), 현재 기본값은 `QueryCurrentDefault`로 표시 | When 설치 후 `.md`를 우클릭하면, the '연결 프로그램' 추천 목록 shall MdEditor를 보인다. When 설치 후 처음 `.md`를 더블클릭하면, Windows shall 선택 프롬프트를 띄우고 '항상'을 고르면 이후 MdEditor로 열린다. 업데이트 설치 후에도 연결이 유지된다(MarkText #5463 회귀 테스트) |
| 1-7 검증 | Win10 19045 + Win11 실기, `samples/` 전부, 한글 경로 픽스처, 관리자 권한 실행 시나리오(UIPI로 두 번째 인수 유실 → 경고 문구) | Fidelity QA(readonly 컨텍스트) `SHIPPABLE` |

## Phase 2 — 편집·저장 (V1 완성)

**상태: 구현 완료 2026-09-30(야간), 에이전트 실기 끝 2026-10-01 — 남은 것은 사용자 B-2 한글 IME·B-9 탐색기 드래그([`next-session.md`](next-session.md) §2 B).** 뺀 것: 2-3 [비교] → 백로그(결정 D5: 비교는 Phase 3 분할 뷰와). 2-2 줄바꿈 클릭 변환은 2026-10-06 V1.1에서 구현.

| 작업 | 내용 | 완료 조건 |
|------|------|-----------|
| 2-1 소스 모드 | CM6 plain(`@codemirror/lang-markdown`, GFM), `Ctrl+/` 렌더 ↔ 소스 전환 시 스크롤 위치 보존(T1), `lineSeparator`는 파일 지배 EOL, 저장 경로는 `sliceDoc()` + EOL 맵 | 전환 왕복 후 커서·스크롤 유지 |
| 2-2 저장 | Phase 0-2 코어 연결, Ctrl+S(`isComposing` 가드), 인코딩 손실 시 UTF-8 변환 제안, 상태바 인코딩/EOL 클릭으로 "해석만 바꾸기"(Notepad++ `Encode in`) vs "변환"(`Convert to`) 분리 | `samples/raw` 무편집 저장 바이트 불변(CI). 한 줄 편집 시 diff가 그 줄에만 |
| 2-3 외부 변경(편집) | dirty 상태에서 외부 변경 → 비모달 배너 [다시 읽기 / 유지 / 비교], 저장 충돌 시 [덮어쓰기 / 다른 이름], etag=내용 해시 | Typora #5208류 mtime 오탐 없음 |
| 2-4 초안 백업 | 자동 저장 off 기본, `%APPDATA%\MdEditor\drafts`에 30 s~2 min 주기 dirty 스냅샷, 크래시 후 복구 제안. 창 닫기 전 compositionend flush(G17) | 강제 종료 후 재시작 시 미저장 내용 복구 |
| 2-5 편집 보조 | 찾기/바꾸기, 이미지 붙여넣기 → `./assets` 복사 + 상대경로(T11), ~~최근 파일~~(2026-09-29 셸 보강에서 먼저 구현 — 왼쪽 탐색 영역) | |

## 셸 트랙 — 설정·테마 (사용자 요청 2026-09-30)

Phase 번호와 따로 가는 셸 작업이다. MVP 안(V1–V3)과 관계없이 들어간다. 1-7 통과 후 Phase 2와 병행할 수 있고, 순서는 S-1 → S-2 → S-3 → S-4다.
**상태: S-1~S-4 구현 완료 2026-09-30(야간), 실기 검증 대기 — [`next-session.md`](next-session.md) §2 C.** 테마 파일 형식은 [`decisions/ideas/20260930-theme-file-format.md`](decisions/ideas/20260930-theme-file-format.md) — 2026-10-01 사용자 확정.
설정 항목·카테고리를 추가할 때는 [`add-setting` 스킬](../.claude/skills/add-setting/SKILL.md)을 따른다.

| 작업 | 내용 | 완료 조건 (EARS) |
|------|------|------------------|
| S-1 설정 카테고리 탭 | 설정 팝업을 **왼쪽 세로 탭(카테고리) + 오른쪽 선택된 카테고리의 항목만** 보이는 구조로 바꾼다. 카테고리 id·라벨·순서는 `SETTING_CATEGORIES` 한 곳에서 정하고 `SettingDef.section`이 그 id를 가리킨다. 스키마로 못 그리는 UI(테마 목록 등)는 카테고리별 커스텀 패널로 붙인다. 탭은 ARIA `tablist`(세로, ↑↓ 이동), 마지막으로 연 탭은 `prefs`에 기억 | When 설정(`Ctrl+,`)을 열면, the 팝업 shall 왼쪽에 카테고리 탭을, 오른쪽에 선택한 카테고리의 항목만 보인다. When `SETTINGS`에 없는 카테고리 id를 쓰면, the 테스트 shall 실패한다 (vitest) |
| S-2 테마 모델 | 내장 라이트·다크를 사용자 테마와 같은 **테마 정의 형식**(`id`·`name`·`base: light\|dark`·셸 토큰·문서 팔레트 토큰, 빠진 토큰은 `base` 값으로 채움)으로 옮긴다. 적용은 `<style id="theme-vars">`에 `:root`·`.markdown-body` 변수 한 벌을 쓰는 방식. 설정 `theme` = `system` \| 테마 id, `system`일 때 쓸 **라이트 쪽·다크 쪽 테마 쌍**을 설정에 둔다. `Ctrl+Shift+D`는 쌍 사이 토글. `SelectDef`에 동적 선택지(테마 목록) 지원 추가 | When 테마를 바꾸면, the 셸·본문·코드 하이라이트·선택 영역 shall 모두 새 테마 색을 쓴다. `print.css`는 테마와 관계없이 라이트 유지 |
| S-3 테마 전환 연출 | 테마가 바뀌면 요소 색이 새 테마 색으로 **서서히 변한다**. 기본안: 색 토큰을 `@property`(`<color>`)로 등록해 토큰 자체를 보간한다. 10 MB 샘플에서 프레임이 떨어지면 View Transitions 크로스페이드로 바꾼다(S-3 착수 때 측정해 결정). 지속 시간은 설정 `themeTransitionMs`(0 = 끔), `prefers-reduced-motion`이면 0. 앱 시작 시 첫 적용은 연출 없이(`no-anim` 패턴). 설정 팝업·`Ctrl+Shift+D`·OS 다크 모드 전환 모두 같은 연출 | When 테마를 바꾸면, the 앱 shall 설정한 시간 동안 색을 보간하고 끝나면 새 테마 색과 정확히 같다. When 지속 시간이 0이거나 동작 줄이기가 켜져 있으면, shall 즉시 바꾼다 |
| S-4 사용자 테마 가져오기·관리 | 설정 "테마" 탭에 테마 목록(색 칩 미리보기·선택·이름·삭제·내보내기·복제해서 새로 만들기)과 **가져오기** 버튼. 파일 대화상자로 테마 파일을 골라 검증(값마다 `CSS.supports('color', v)`, `url(`·`@import`·`expression` 거부, 모르는 키 무시) 후 `%APPDATA%\MdEditor\themes\`에 복사. 읽기·쓰기는 백엔드 커맨드(코어 경유, fs 플러그인 금지). "테마 폴더 열기"로 직접 넣은 파일도 목록에 뜬다. 내장 테마는 삭제 불가, 선택된 테마를 지우면 `base` 쪽 내장 테마로 | When 올바른 테마 파일을 가져오면, the 목록 shall 즉시 그 테마를 보이고 선택하면 S-3 연출로 적용된다. When 잘못된 파일이면, shall 알림 팝업에 이유(어느 키·값)를 보이고 아무것도 저장하지 않는다. 재시작 후에도 가져온 테마와 선택이 남는다 |

## Phase 3 — 탐색 (V2 요소)

- 탭(문서당 CM6 state 보존, 두 번째 더블클릭은 새 탭), 폴더 트리 + TOC 동시 표시(Typora 최다 요구 T16·T23), 분할 뷰(소스 | 미리보기) + `data-line` 스크롤 동기(R2·R3), 파일 트리 감시(notify recursive), 세션 복원
- 완료 조건: 2,000줄 문서에서 편집 → 미리보기 갱신 < 100 ms, 탭 20개에서 메모리 상한 확인

## Phase 4 — 확장 렌더·내보내기 (V2 요소)

- KaTeX(펜스·`$` 감지 시 지연 로드, 폰트 번들), Mermaid 12 tiny(`securityLevel strict`, 지연 로드), highlight.js → Shiki(JS 엔진, fine-grained 5~10개 언어, dual theme) 교체 검토, GitHub Alerts
- HTML 내보내기(테마 CSS 인라인, 이미지 상대/base64 옵션 — Typora Export 사양 T·G21), `window.print()`로 PDF(인쇄 CSS: `@page`, 코드 블록 배경, 긴 `pre`에는 `break-inside: avoid` 금지)
- 무음 PDF·헤더/푸터·북마크는 백로그(webview2-com `PrintToPdf` / CDP `Page.printToPDF`, G20·G21)

## Phase 5 — 인라인 라이브프리뷰 (V3, `exp/live-preview`)

- CM6 데코레이션 2층: ViewPlugin(인라인 마크 숨김, `visibleRanges`, 캐럿 줄 원문 노출) + StateField(표·이미지·수식·Mermaid·코드펜스 block 위젯). SoloMD `cm-live-render/blocks/ime-guard`·SilverBullet 패턴 차용(MIT)
- IME: 조합 중 데코 map만, compositionend 후 flush, 위젯 앞 조합 회피. Phase 0 시나리오 ⑧ 재검증
- 표 셀 편집(중첩 EditorView 또는 contentEditable 셀), 체크박스 클릭 토글, 이미지 위젯 상대경로
- 완료 조건: V1 체크 전부 + 한글 IME 시나리오 ①–⑧ 통과 + 무편집 저장 바이트 불변 유지. 실패하면 제품 브랜치에 머지하지 않고 `archived-exp`

## 가로지르는 규칙

- **테스트 매트릭스**: Windows 10 19045(개발 PC) + Windows 11 24H2/25H2, 한국어 MS IME 새/이전(`ConfigureImeVersion`), WebView2 Evergreen 최신. WebView2 2주 릴리스(G5)마다 IME 스모크 테스트
- **핀**: tauri ≥ 2.12 / tao ≥ 0.35.4 / single-instance ≥ 2.4.5 / `@codemirror/view` 최신 / WebView2 ≥ 150. `webviewInstallMode: downloadBootstrapper`
- **보안**: DOMPurify, 링크 스킴 허용 목록, `on_navigation` 가로채기, asset scope 문서 폴더 비재귀, CSP `img-src 'self' asset: http://asset.localhost`
- **바이트 보존 CI**: `samples/raw` 왕복 테스트는 모든 Phase에서 필수 통과
- **기록**: Phase마다 `docs/next-session.md` §1 갱신, 스펙은 `docs/references/assets/…/system-spec.md`, QA는 readonly 컨텍스트로 `fidelity-report.md`. MVP(Phase 2) 완료 시 Producer가 `capture-to-rag` 검토 제안

## 하지 않는 것

- 크로스플랫폼 빌드 · 노트 앱 기능(볼트·백링크·동기화) · 플러그인 시스템 · MSI/MSIX 패키징 · Typora 테마 100% 호환(변수명 `--bg-color` 등은 따르되 보장 안 함. 사용자 테마는 S-4의 자체 토큰 형식) · 임의 CSS 테마 가져오기(S-4는 색 토큰만) · 클라우드 동기화 충돌 병합

## 백로그

- 포터블 exe 런타임 HKCU 등록/해제(Markdown Monster 모델, A16) — exe 이동 시 재등록 정책 필요
- `.txt` `OpenWithProgids` 등록
- 무음 PDF(webview2-com), 헤더/푸터·북마크(CDP)
- Focus/Typewriter 모드 (워드카운트는 2026-10-06 상태바 글자 수로 구현 — 한글·영문은 띄어쓰기 단위, 한자·가나는 1자=1단어)
- Shiki dual theme, Mermaid ELK
- fixedRuntime 비상 절차 문서화(G4)
- Typora `github.user.css` 호환 레이어
- 10 MB 초과 텍스트 뷰(스펙 `largeHardLimit`) — 2026-09-30 백로그. 큰 문서 모드로 10 MB도 렌더되므로 더 큰 파일을 실측한 뒤 상한을 정한다
- 외부 변경 배너의 [비교] — 디스크 내용과 편집 중 내용의 차이 보기 (2-3에서 뺌)
- ~~줄바꿈 변환(LF ↔ CRLF)~~ — 2026-10-06 구현 (`FileDocument::convert_eol`, 상태바 줄바꿈 클릭)
- ~~큰 문서 블록 묶음~~ — 2026-10-06 구현 (`render/chunks.ts`). 10 MB 조작 1~5 s → 0.05~0.6 s. 남은 큰 비용은 목차 다시 열기 ~0.3 s(목차 링크 2만 3천 개)·테마 전환 ~0.5 s
