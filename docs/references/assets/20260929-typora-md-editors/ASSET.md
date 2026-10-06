# Reference Asset — Typora와 Windows 마크다운 에디터·뷰어 지형 (2026-09)

- Asset id: `20260929-typora-md-editors`
- Title: Typora를 1순위 레퍼런스로 한 Windows 마크다운 에디터·뷰어 경쟁 조사와 기술 스택·엔진·파일 연결·파일 충실도 조사
- Date: 2026-09-29
- Status: `living` — 카탈로그형. 제품 버전·이슈 상태는 갱신되므로 승인 게이트 없이 본문·INDEX만 갱신
- Similarity: `inspired` — 편집 모델·UI 감각은 Typora, 파일 처리·Windows 통합은 프로젝트 요구 우선
- Ceremony: `full` — mixed 요청(참고 조사 + 스택 판정 + MVP 발상 + 로드맵)을 Stage로 나눠 진행
- Tags: `editor`, `typora`, `competitive-landscape`, `windows-shell`, `file-association`, `file-io`, `encoding`, `renderer`, `codemirror`, `tauri`, `webview2`, `ime`, `korean`
- Related systems / features: 뷰어·편집기 전체 (MVP 범위는 `docs/decisions/ideation/20260929-mvp-scope.md`)
- Project notes path: `docs/decisions/ideas/20260929-stack.md` · `docs/decisions/ideas/20260929-editor-engine.md` · `docs/roadmap.md`

## Sources

| # | Type | Title / URL | Section | Notes |
|---|------|-------------|---------|-------|
| 1 | research | Perplexity Deep Research — Typora (`d1b922a5-6d21-4c2b-865f-955860c6d3b2`) | 전체 | 구조 제시. findings 85%는 1차 자료로 재검증 |
| 2 | research | Perplexity Deep Research — OSS Typora 대안 (`24313d38-657f-4f86-9735-f61fce2c3bfb`) | 전체 | |
| 3 | research | Perplexity Deep Research — 앱 스택 (`fb061fba-863e-42de-a2f8-c71916c95bc1`) | 전체 | 반환 본문은 요약뿐, 세부는 WebFetch |
| 4 | research | Perplexity Deep Research — 에디터 엔진 (`d69bc9e1-344e-4d28-a948-0c5ef508dc14`) | 전체 | Cherry Markdown CM5→CM6 등 정정 |
| 5 | doc | support.typora.io (Quick Start, Table Editing, Auto-Save, Images, Math, Export, Themes, Typora on Windows 등 20여 페이지) | Typora | |
| 6 | doc | typora/typora-issues (#556 #891 #1316 #4251 #5030 #5209 #5772 #5807 #6290 #6302 #6402 #6554 #6560 #6618 #6651 …) | Typora | |
| 7 | doc | Microsoft Learn — Default apps platform, Default Programs, fa-file-types, launch-settings, WebView2 distribution/print/user-data-folder, Windows App SDK activation, CodePagesEncodingProvider, FileSystemWatcher, ReplaceFileW, SHChangeNotify | Windows | |
| 8 | doc | tauri-apps/tauri (installer.nsi, FileAssociation.nsh, main.wxs, examples/file-associations, scripts/core.js, protocol/asset.rs, #9803 #10968 #15436 #5234 …), plugins-workspace (single-instance windows.rs, fs commands.rs, #3587 #3643 #1990) | 스택 | |
| 9 | doc | codemirror.net, discuss.codemirror.net 9877/9785, codemirror/view CHANGELOG, codemirror/dev #1684, @lezer/markdown | 엔진 | |
| 10 | doc | Milkdown #1579/#1765, Tiptap #8134/#8294, Lexical #4843, BlockNote docs, 88250/lute, nhn/tui.editor | 엔진 | |
| 11 | doc | MicrosoftEdge/WebView2Feedback #5475 #5625 #5675 #5637 #5680 #5713 #2423, Chromium 523134891 · CL 7917332, ale-160/web-text #2 | IME | |
| 12 | doc | marktext/marktext (#2189 #5043 #5279 #4851 PR #5463 releases), zhitongblog/solomd (PR #123, cm-*.ts, 블로그), markrahq/markra, Razee4315/Paperling, byxiaozhi/Typedown, Zettlr, vnotex/vnote, KDE/ghostwriter | OSS | |
| 13 | doc | microsoft/vscode (code.iss, encoding.ts, files.contribution.ts, pieceTreeTextBufferBuilder.ts, textModel.ts, scroll-sync.ts, #127 #98063 #336685 #337750 #142474 #337197), Obsidian help/forum/plugins, Notepad++ 매뉴얼, Sublime 포럼 | 파일 충실도 | |
| 14 | doc | docs.rs encoding_rs 0.8.42 / chardetng 1.0.0 / notify / tauri-utils, WHATWG Encoding, npm/bundlephobia, crates.io | 라이브러리 | |
| 15 | doc | markdown-it, comrak, pulldown-cmark, markdown-rs, Markdig, Shiki, highlight.js, KaTeX, Mermaid, github-markdown-css, Pretendard, D2Coding, markdown-cjk-friendly, CSSWG #4285 | 렌더러·타이포 | |
| 16 | seen | Windows Insider 블로그(Notepad Markdown), PowerToys #45267 · MarkdownPreviewHandlerControl.cs, QuickLook 플러그인, Markdown Monster 문서·블로그, mdview2026/mdview, isunky/MDView, MS Store PDP API | Windows 네이티브 | |
| 17 | seen | HN 'Typora 1.0', 한국 블로그(extrememanual, haeeul, duplicat), MS Q&A(ko-kr), 클리앙, Obsidian 포럼 한국어 스레드, Mymux #36, Cursor 포럼 | 사용자 보고 | |

증거 원장(Ev#)과 상세 표는 [`reference-brief.md`](reference-brief.md).

## User callouts

| # | Callout (paraphrase) | Where in source | Why it mattered |
|---|----------------------|-----------------|-----------------|
| 1 | Typora가 1순위 레퍼런스 | 2026-09-28 요청 | 편집 모델·UI 벤치마크 |
| 2 | 깔끔한 UI에 MD를 띄우는 것이 최소 가치 | 같은 요청 | MVP는 뷰어 우선 |
| 3 | Windows 프로그램 | 같은 요청 | 크로스플랫폼 요구 없음 |
| 4 | 기본 프로그램으로 등록해 .md를 열 때 사용 | 같은 요청 | 파일 연결·단일 인스턴스 필수 |
| 5 | 읽거나 **편집**하는 프로그램 | 같은 요청 | 저장 경로 존재 |
| 6 | 무편집 저장 시 바이트 불변 | `CLAUDE.md`, `next-session.md` §2-3, `samples/raw/` | 편집기의 신뢰 요건 |

자유 메모:

- 요청은 "조사 + 개발 계획"이었고, 스택·엔진·MVP는 2026-09-29 배치 승인으로 확정됐다 (스택·엔진 `ADOPT_WITH_CHANGES`, MVP V1, 유사도 `inspired`, Phase 0에 WPF hello 비교 측정 추가, RAG 캡처는 MVP 완료 후).

## Distilled analysis

### User verbs

- 더블클릭/드래그/CLI로 열기 → 즉시 렌더 읽기 → 목차·검색·줌 → (편집·저장) → 외부 변경 반영 → 같은 폴더 다른 문서로 이동

### Core loop

1. 탐색기 → 단일 인스턴스가 경로 수신 (argv / WM_COPYDATA)
2. 원시 바이트 → BOM·인코딩·EOL·끝 개행 판별 → 디코드 → 렌더
3. 읽기 (TOC·검색·줌·테마)
4. 편집 → 저장: 원본 메타 유지 재인코딩, 임시파일 + `ReplaceFileW`
5. 외부 변경: 해시 비교 → dirty 아니면 조용히 리로드, dirty면 배너

### 경쟁 제품 비교 (핵심 20종)

| 제품 | 스택 | 편집 모델 | 라이선스 | 상태 (2026-09) | .md 연결 | 바이트 보존 | 시사점 |
|------|------|-----------|----------|----------------|----------|-------------|--------|
| **Typora** 1.14.10 | Electron 42 + contentEditable | 인라인 하이브리드 + 소스 모드 | $14.99 | 활발 | Inno 설치기, OS 표준 경로 | ✗ 재직렬화(#5772·#1316), EOL 기본값만, 2 MB 렌더 한도 | UI·편집 UX 벤치마크. 탭 없음이 최다 불만 |
| Windows 11 Notepad 11.26xx | 인박스 | 서식 보기 ↔ 구문 보기 | 무료 | 활발 | .md 미등록 | ? (재열기 서식 손실 보고) | "최소 가치"의 기준선. Win10엔 없음 |
| Markdown Monster 4.5.4 | WPF + WebView2 + Markdig + Monaco | 소스 + 동기 프리뷰 | $99 | 활발 | 설치기·포터블 HKCU 자기 등록 | ✗ `LineFeedMode` Lf, BOM 기본 | WPF 경로의 완성형. 탭당 WebView2가 "janky" |
| VS Code 1.139 | Electron + Monaco | 소스 + 분할 프리뷰 | 무료 | 활발 | `OpenWithProgids`만(후보 등록) | 혼합 EOL 정규화(#127), 감지 opt-in | 파일 수명주기·연결 등록 모델 |
| Obsidian 1.13.8 / 1.14.2 EA | Electron + CM6 | Live Preview(CM6 데코) | 무료 | 활발 | 1.14.2부터 Open with | ✗ CRLF→LF, UTF-8 전용 | CM6 데코레이션 UX 전례. 반면교사 EOL |
| MarkText 0.19.1 / 0.20 rc | Electron + Muya | 인라인 WYSIWYG | MIT | 부활 | electron-builder(#5463 수정) | ✗ AST 재직렬화(#2189) | 옵션 설계 참고. 엔진 차용 부적합 |
| SoloMD 4.14.4 | Tauri 2 + Vue 3 + CM6 (Windows는 textarea 기본) | Edit/Split/Live Edit/Preview | MIT | 매우 활발 | msi 13.7 MB | ? (frontmatter만 byte-for-byte) | **Tauri+CM6 최근접 선례.** IME 대응 코드 차용 1순위 |
| Markra 2.12.0 | Tauri 2 + React 19 + Milkdown 7 | WYSIWYG/소스/분할 | AGPL | 활발 | setup 12 MB | ✗ | Tauri+ProseMirror 실증. IME 패치 잦음 |
| Paperling 1.0.51 | Tauri 2 + CM6 + React | Reader/Code/Split | Apache-2.0 | 매우 활발 | setup 13.7 MB | ? | 뷰어+분할 구조 참조 |
| Markpad 2.8.0 | Tauri + SvelteKit + Monaco | 분할 | BSD-3 | 활발 | NSIS 8.3 MB | ? | Monaco(숨은 textarea) IME 회피 가설 |
| MDHero 0.2.10 | Tauri 2 + Svelte 5 + markdown-it | 뷰어 우선 | MIT | 활발 | setup 5.4 MB | BOM 버그 수정 사례 | 뷰어 MVP 규모 참고 |
| TizuMark 1.2.3 | Tauri 2.5 + CM5 + pulldown-cmark | 분할 | GPL-3 | 활발 | 10개 확장자 명시 | ? | 확장자 등록 참고 |
| mdview (mdview2026) 1.0.169 | Rust + wry + md4c | 읽기 우선 | Community/Pro $9.99 | 활발 | 첫 실행 자동 연결, `--install/--unbind` | ? GBK 폴백 | 2 MB·1초 — 경량 상한선 |
| isunky/MDView 3.4.3 | Tauri 2 + React 19 + Vite | 읽기 + 소스 편집 | GPL-3 | 활발 | `fileAssociations` md/markdown | ? | 후보 스택 동일 조합 실동작 |
| Typedown | WinUI 3 + WebView2 + Muya | 인라인 WYSIWYG | MIT | 정체(2024-03) | MSIX | ✗ | WinUI 3 유일 선례 |
| Zettlr 4.8.0 | Electron 43 + CM6 | 소스 + 데코, 별도 프리뷰 | GPL-3 | 매우 활발 | 인스톨러 | ? 정책 없음 | CM6 렌더러 설계 참고(GPL) |
| VNote 4.8.0 | Qt 6 네이티브 | 소스 + 프리뷰 | LGPL-3 | 매우 활발 | zip(포터블) | ? | 네이티브 위젯 = IME 무관 |
| QuickLook 4.5.0 | WPF + WebView2 + markdown-it | 보기 전용(Space) | GPL-3 | 활발 | 연결 아님 | — | 렌더 스택 그대로 이식 가능 |
| PowerToys Peek/Preview | WinForms WebView2(잠금) + Markdig | 보기 전용 | MIT | 활발 | 미리보기 핸들러 | — | 보안 정책 차용 |
| Milkdown 7.22.2 / Vditor 4.0.0 / Muya | (엔진) | 인라인 WYSIWYG | MIT | 활발 / 활발 / 아카이브 | — | ✗ 재직렬화 | UX 참고, 채택 부적합 |

### Timing / feel / feedback highlights

- Typora가 "깔끔"한 이유: 단일 편집면, 툴바 없음, 구문 숨김, 860 px 본문·16 px/1.6, Focus/Typewriter (T1·T3·T4·R22)
- 대가: 숨은 구문·공백·바이트 비보존·IME 회귀 (T9·T20·T24)

### Rules & numbers (high signal)

| Item | Value / range | Ev# | Method / Confidence |
|------|---------------|-----|---------------------|
| Windows `.md` 기본 앱 | 없음. 앱은 후보 등록만, 기본값은 사용자 UI | W1·A1 | doc 0.95 |
| Tauri NSIS 기본 등록 범위 | `.ext` 기본값 + ProgId + command. `OpenWithProgids`·Capabilities·SHChangeNotify 없음 | S2 | doc 0.9 |
| Tauri 마크다운 앱 설치기 | 5.4–19.3 MB vs Electron 110.8 MB | O13 | tool 0.95 |
| WebView2 IME 첫 글자 유실 | Chromium 149 회귀, 149.0.7827.158/150+ 수정. 트리거 `autocorrect="off"`(CM6 기본) | G1·G2 | doc 0.9 |
| 한국어 IME 호스트 계층 미해결 | #5475 #5675 #5637, tauri #15436 (모두 중국어 IME 보고, 한국어 미검증) | S14·O7 | seen 0.8 |
| tao 데드락 | ≥ 0.35.4 필요, tauri 2.12.0은 0.37.0 | O8 | seen 0.85 |
| 바이트 보존을 문서화한 편집기 | 없음 | O22·F11·F12 | hyp 0.8 |
| CM6 EOL | `doc.toString()`은 항상 `\n`; 혼합 EOL은 앱 계층 | E1 | doc 0.95 |
| ProseMirror 계열 왕복 | Milkdown 빈 줄, Tiptap 이스케이프·표 파이프 손실 | E2·E3 | doc 0.9 |
| .NET 지원 | 8/9 EOS 2026-11-10 → .NET 10 LTS | S13 | doc 0.95 |
| Typora 렌더 한도 | ≈2 MB | T12 | seen 0.8 |
| Windows 시작 시간 (hello, 유휴 첫 실행 / 웜 중앙값) | Tauri 383 / 371 ms · WPF+WebView2 744 / 732 ms (Win10 19045, WebView2 153) | Phase 0-3 | measured 0.9 (재부팅 콜드 미측정) |
| 프로세스 트리 메모리 (hello, WS / Private 합계, WebView2 6개 포함) | Tauri 300 / 153 MB · WPF 366 / 209 MB | Phase 0-3 | measured 0.9 |
| chardetng 짧은 CP949 감지 | 121 B `cp949.md` → EUC-KR 정확 (`kr` TLD 힌트, UTF-8 후보 제외) | Phase 0-2 | measured 0.9 |
| 무편집 저장 바이트 불변 (자체 코어) | `samples/raw` 6종 제자리 저장 → `git status` 깨끗, 한 줄 편집 시 삽입 바이트 외 불변 | Phase 0-2 | test 0.95 |
| WebView2 153 + CM6 6.43 한국어 IME (Win10 19045 새 IME) | textarea / CM6 plain / CM6+데코 ①–⑧ 전부 통과. 포커스 이탈·Enter·Ctrl+S 시 조합 확정, 유실·중복 없음 | Phase 0-1 | measured 0.85 (이전 IME·Win11 미실측) |

## Decisions

| Decision | Adopt | Defer | Reject | Rationale |
|----------|-------|-------|--------|-----------|
| 뷰어 우선 MVP (더블클릭 → 깔끔한 렌더) | ✓ 확정 2026-09-29 (V1 선택) | | | 콜아웃 2. Notepad·소형 MDView가 노리는 자리, 렌더 품질·바이트 보존으로 차별 (W9·W12·W14) |
| 앱 스택 = Tauri 2 + Vite + TS | ✓ 확정 2026-09-29 (`ADOPT`, Phase 0 IME 스파이크 통과) | | | `ideas/20260929-stack.md`. 이전 IME·Win11은 Phase 1-7에서 보강 |
| 에디터 엔진 = CodeMirror 6 + 자체 데코레이션 + 바이트 보존 계층 | ✓ 확정 2026-09-29 (`ADOPT_WITH_CHANGES`) | | | `ideas/20260929-editor-engine.md` |
| ProseMirror 계열(Milkdown·Tiptap)·Vditor·Muya를 편집 엔진으로 | | | ✓ 권고 | 재직렬화가 바이트 보존과 충돌 (E2–E5·O2·O17) |
| WinUI 3 · Avalonia · Flutter | | | ✓ 권고 | 배포 부담·시작 성능 / HTML 렌더 없음 / 한국어 IME (S17·S18) |
| Electron | | ✓ | | IME 스파이크 실패 시 폴백 (S15·G3) |
| 렌더러 = markdown-it 15 + DOMPurify + hljs(core) → Shiki | ✓ 권고 | | | 줄 매핑·플러그인·동기 API (R1·R7·R13). 세부는 로드맵 Phase 1 |
| 파일 연결 = NSIS currentUser + `fileAssociations` + POSTINSTALL 훅 + `ms-settings` 딥링크 | ✓ 권고 | | | A1·A4·A8·A11·S2 |
| 바이트 보존 계층 = Rust encoding_rs + chardetng + 원본 바이트·줄별 EOL 맵 + ReplaceFileW | ✓ 권고 | | | F5·F24·S10·S11·E15 |
| 인라인 라이브프리뷰(Typora식) | | ✓ | | MVP 이후 Phase. SoloMD/SilverBullet 패턴 (G9·G10) |
| 무음 PDF 내보내기 | | ✓ | | MVP는 HTML + `window.print()` (G20·G21) |
| 포터블 exe 런타임 HKCU 등록 | | ✓ | | Markdown Monster 모델 (A16), 설치본 안정화 후 |
| 한국어 타이포 기본값(`:lang(ko)` keep-all, Pretendard, D2Coding 번들) | ✓ 권고 | | | G22–G24. Typora 대비 차별점 |

## Open questions

`reference-brief.md` "Open questions" 참조 — NSIS 훅 노출(Phase 1-6), Typora 픽스처 실측(선택), PDF 한글 폰트. **답한 것(2026-09-29)**: IME 한국어 재현 → Win10 19045 새 IME에서 textarea/CM6 plain/CM6+데코 ①–⑧ 통과, #15436·#5475 미재현(Phase 0-1; 이전 IME·Win11은 Phase 1-7), chardetng 짧은 파일 정확도 → 121 B `cp949.md` EUC-KR 정확(Phase 0-2), Windows 시작 시간·메모리 → Rules & numbers(Phase 0-3).

## Artifact links

- `reference-brief.md`: [reference-brief.md](reference-brief.md) — Evidence ledger T·W·F·R·O·S·E·A·G·V (약 170행), 규칙·수치, 파일 수명주기 엣지 케이스
- `system-spec.md`: [system-spec.md](system-spec.md) — Phase 1 뷰어 MVP 스펙 (EARS 12건, 파일 열기 경로·렌더·UI·외부 변경·NSIS 훅, 상태표·엣지 케이스, 열린 결정 3건)
- `fidelity-report.md`: [fidelity-report.md](fidelity-report.md) — V1 MVP 검수 2026-10-06 (readonly 서브에이전트), **SHIPPABLE 조건부**(B-2 한글 IME·B-9 탐색기 드래그 사용자 확인). 통과하면 이 자산을 `verified`로
- Implementation / PR / scene notes: [`docs/roadmap.md`](../../../roadmap.md)

## Reuse hints

- Tags overlap: `editor`, `windows-shell`, `file-association`, `encoding`, `ime`, `tauri`, `webview2`
- Similar verbs / loop: "파일 더블클릭 → 렌더 → 편집 → 바이트 보존 저장"이 필요한 Windows 도구
- Do not copy blindly — 제품 버전·이슈 상태는 2026-09-29 기준. WebView2 2주 릴리스(G5)로 IME 상황은 빠르게 바뀐다. 재사용 시 `#5625`, `tauri #15436`, `#3587`, `#9803` 상태를 다시 확인할 것.
