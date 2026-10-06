# Microsoft Store 제출 문구 초안 (store-launch A-5)

작성: 2026-10-06 · 상태: **초안** — 제출(R-3) 때 Partner Center에 옮겨 넣는다. 가격·계정 이름은 사용자 결정(U-1·가격) 뒤에 채운다
결정: [`decisions/ideas/20261006-store-monetization.md`](decisions/ideas/20261006-store-monetization.md) · 순서: [`store-launch.md`](store-launch.md) · 개인정보처리방침 원본: [`site/privacy.md`](site/privacy.md)

Store 문구 규칙(Partner Center): 짧은 설명 1,000자 안(Xbox용 — 데스크톱은 설명 첫 줄이 검색 결과에 보인다), 설명 10,000자 안,
기능 목록 항목 20개까지·각 200자 안, 검색어 7개까지·각 30자 안, 스크린샷 데스크톱 PNG 1366×768 이상 10장까지(로고·광고 문구를 덧붙이지 않는다).
언어마다 따로 올린다 — 한국어(ko-KR)가 기본, 영어(en-US)를 같이.

## 기본 정보

| 항목 | 값 |
|---|---|
| 앱 이름 | Frond (이름 예약은 R-2 MSIX가 된 뒤 — 예약 뒤 3개월 안에 제출) |
| 분류 | 생산성(Productivity) · 하위 없음 |
| 가격 | 무료 |
| 추가 기능(add-on) | Durable 하나 — 아래 |
| 시스템 요구 | Windows 10 버전 2004(빌드 19041) 이상 또는 Windows 11, x64. Microsoft Edge WebView2 런타임(Windows 11은 기본 포함). MSIX 매니페스트 `MinVersion 10.0.19041.0`(`uap10` 속성의 최소)과 같게 — 웹사이트 받기 쪽도 같은 문구. 개발·실기는 22H2(19045) |
| 개인정보처리방침 URL | 도메인 전: GitBook 설명서의 '개인정보처리방침' 쪽(사이트 게시 뒤 주소 확정) · 도메인 뒤: `https://<도메인>/privacy/` |
| 지원 연락처 | GitHub Issues (`https://github.com/cyKim0115/Frond/issues`) — 이메일은 웹사이트 U-3 뒤 |
| 저작권 | © 2026 cyKim |
| 웹사이트 | 도메인 뒤 `https://<도메인>/` (그 전에는 비움) |

## 짧은 설명

- ko: Markdown 파일을 빠르게 열어 읽고 고치는 Windows 앱. 원본 파일을 바이트 그대로 지킵니다.
- en: A fast Windows app for reading and editing Markdown files — it keeps your files byte-for-byte intact.

## 설명 (ko-KR)

모든 편집 기능은 무료입니다. 원하면 한 번 구매로 사용자 테마 만들기와 구매자 전용 테마가 열립니다.

Frond는 `.md` 파일을 더블클릭하면 바로 깔끔하게 그려 보여 주는 Markdown 뷰어 겸 편집기입니다. 읽는 일이 먼저인 사람을 위해 만들었습니다 — 문서를 열면 목차와 본문이 바로 보이고, 고칠 때만 소스 모드나 분할 뷰로 바꿉니다.

원본을 지킵니다. 고친 줄만 다시 쓰고 인코딩(UTF-8·EUC-KR)·BOM·줄바꿈은 그대로 둡니다. 다른 프로그램이 같은 파일을 바꾸면 알려 주고, 두 내용을 나란히 비교해 고를 수 있습니다. 저장하지 않은 편집은 초안으로 남아 갑자기 꺼져도 되살릴 수 있습니다.

GitHub 스타일 렌더 — 표·체크리스트·각주·코드 구문 강조, Mermaid 다이어그램, GitHub 알림 상자, 수식. 탭과 세션 복원, 폴더 트리와 최근 파일, HTML 내보내기와 인쇄·PDF까지 들어 있습니다.

AI 코딩 도구와 함께 쓰기 좋습니다. Claude Code·Codex가 새로 만든 문서를 보던 화면을 빼앗지 않고 '새 문서' 목록에 쌓아 둡니다.

라이트·다크 테마(세이지 차콜)와 추천 테마 23종은 누구나 씁니다. 구매하면 테마 파일을 가져오거나 복제해 나만의 테마를 만들고, 구매자 전용 테마 4종(고사리 새벽·이끼 밤·한지·먹)을 쓸 수 있습니다. 구매는 앱을 계속 다듬는 데 쓰입니다.

개인정보를 수집하지 않습니다. 문서·설정·초안은 내 PC에만 있습니다.

## Description (en-US)

All editing features are free. An optional one-time purchase unlocks custom themes and supporter-only themes.

Frond is a Markdown viewer and editor for Windows that renders a `.md` file the moment you double-click it. It is built reading-first: the table of contents and the rendered document open right away, and you switch to source or split view only when you want to edit.

Your files stay intact. Frond rewrites only the lines you changed and keeps the encoding (UTF-8, EUC-KR), BOM and line endings as they were. If another program changes the same file, Frond tells you and lets you compare both versions side by side. Unsaved edits are kept as drafts, so you can recover them after a crash.

GitHub-style rendering — tables, task lists, footnotes, syntax highlighting, Mermaid diagrams, GitHub alerts and math. Tabs with session restore, a folder tree and recent files, HTML export and print to PDF are all included.

Works well with AI coding tools: documents that Claude Code or Codex create are collected in a "New documents" list without taking over the one you are reading.

Light and dark themes (Sage Charcoal) and 23 recommended themes are free for everyone. The purchase lets you import or duplicate theme files to make your own, and use four supporter-only themes. It helps keep Frond improving.

Frond does not collect personal data. Your documents, settings and drafts stay on your PC.

## 기능 목록 (20개까지)

| # | ko | en |
|---|---|---|
| 1 | `.md` 더블클릭으로 바로 렌더, 이미 떠 있으면 새 탭 | Double-click a .md file to render it instantly, in a new tab if Frond is open |
| 2 | 고친 줄만 저장 — 인코딩·BOM·줄바꿈 그대로 | Saves only what you changed — encoding, BOM and line endings preserved |
| 3 | 탭과 세션 복원 | Tabs with session restore |
| 4 | 분할 뷰 — 소스와 미리보기, 스크롤 동기 | Split view with synced scrolling |
| 5 | 목차·찾기, 폴더 트리, 최근 파일 | Table of contents, find, folder tree and recent files |
| 6 | 표·체크리스트·각주·코드 강조 (GitHub 스타일) | GitHub-style tables, task lists, footnotes and code highlighting |
| 7 | Mermaid 다이어그램·GitHub 알림 상자·수식 | Mermaid diagrams, GitHub alerts and math |
| 8 | 외부 변경 알림과 나란히 비교 | External change detection with side-by-side compare |
| 9 | 초안 백업·복구 | Draft backup and recovery |
| 10 | UTF-8·EUC-KR 자동 판별과 변환 | UTF-8 / EUC-KR detection and conversion |
| 11 | 이미지 붙여넣기·끌어다 놓기 | Paste or drop images into a document |
| 12 | HTML 내보내기, 인쇄·PDF | HTML export, print and PDF |
| 13 | AI 앱 연동 — Claude Code·Codex가 만든 문서 목록 | AI app integration — collects documents created by Claude Code and Codex |
| 14 | 라이트·다크와 추천 테마 23종 | Light, dark and 23 recommended themes |
| 15 | (구매) 사용자 테마 만들기·구매자 전용 테마 4종 | (Purchase) Custom themes and four supporter-only themes |
| 16 | 개인정보 수집 없음 | No personal data collected |

## 검색어 (7개까지)

- ko: 마크다운, 마크다운 편집기, md 뷰어, 메모, 문서
- en: markdown, markdown editor

## 추가 기능 (add-on)

| 항목 | 값 |
|---|---|
| 종류 | Durable (영구) |
| Product ID | `frond_supporter` — 영구 이름, 바꿀 수 없다 |
| 수명 | Forever |
| 이름 | ko: Frond 서포터 · en: Frond Supporter |
| 설명 | ko: 사용자 테마 만들기(가져오기·복제)와 구매자 전용 테마 4종을 엽니다. 한 번 구매로 계속 씁니다. · en: Unlocks custom themes (import and duplicate) and four supporter-only themes. Buy once, keep it. |
| 가격 | 사용자 결정 (조사 권장 ₩9,900~12,900) |
| 공개 | 처음에는 "parent product only"로 숨겨 만든다 — R-3 실기 뒤 공개(R-4) |

## 스크린샷 (웹사이트 §6 장면을 같이 쓴다)

원본 2200×1600 PNG(앱 1100×800 × DPR 2). 문구를 덧붙이지 않는다. 한국어판·영어판을 따로 올린다(영어판은 영어 데모 문서로 다시 찍는다 — 앱 UI는 한국어라 W8 영어 DEFER 동안은 한국어판만).

| 순서 | 장면 | 비고 |
|---|---|---|
| 1 | S1 읽기 — 보기 모드, 목차 | 대표 |
| 2 | S3 탭 4개 | |
| 3 | S4 분할 편집 | |
| 4 | S5 다이어그램·수식·알림 상자 (다크) | |
| 5 | S10 AI가 만든 새 문서 목록 | 실제 앱 장면(A-6) |
| 6 | S6 테마 — 추천 테마 팝업 | 팝업 아래 '구매자 전용' 묶음이 보이면 그대로 둔다(잠금 배지가 "구매자 기능"을 밝힌다) |
| 7 | 구매자 전용 테마 적용 화면(한지 또는 먹) | 캡션 대신 Store 설명에 "구매자 전용"을 적는다 — 이미지에 글자를 넣지 않는다 |

개인정보 점검: 상태바 경로·탭 이름·최근 파일·테마 폴더 경로가 데모 데이터뿐인지(웹사이트 §6 점검표).

## 연령 등급 (IARC 설문 메모)

| 질문 | 답 |
|---|---|
| 앱 종류 | 게임이 아님 — 생산성(문서 편집) |
| 폭력·성적 내용·욕설·약물·도박 | 없음 |
| 사용자 간 소통·사용자 생성 콘텐츠 공유 | 없음 (문서는 내 PC에서만 열고 저장한다) |
| 위치 공유 | 없음 |
| 디지털 상품 구매 | 있음 — 추가 기능 1개(Durable) |
| 제한 없는 웹 접근 | 없음 — 문서 링크는 기본 브라우저로 넘긴다. 앱 안 웹뷰는 앱 자체 화면만 연다 |
| 예상 등급 | 전체 이용가 (IARC 3+ / Everyone) |

## 제출 메모 (인증 담당에게)

- 무료로 모든 문서 기능을 쓴다. 추가 기능을 사면 설정 → 테마의 '가져오기·복제'와 '추천 테마…' 팝업 아래 '구매자 전용' 테마가 열린다
- 관리자 권한으로 실행하면 Store 구매 창이 뜨지 않을 수 있다 — 일반 권한으로 시험해 달라
- 시험용 문서: 아무 `.md` 파일. 기본 앱 지정은 Windows 설정 → 기본 앱에서
