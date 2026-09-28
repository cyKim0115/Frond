# 다음 세션 인계

작성: 2026-09-28 · 갱신: 2026-09-28 (초기세팅·system-crew 설치)
읽는 순서: [`CLAUDE.md`](../CLAUDE.md) → 이 문서 → [`decisions/ideas/INDEX.md`](decisions/ideas/INDEX.md)

이 문서는 **지금 열려 있는 것**을 담는다. 확정된 결정은 system-crew 형식으로 `decisions/`에 남기고 여기서 지운다.

---

## 1. 지금 어디까지 왔나

| 단계 | 상태 |
|---|---|
| 전역 Claude Code 환경 | 완료 — `claude-bootstrap` 설치·최신 (origin `d549268`) |
| 프로젝트 초기세팅 | 완료 — git, `CLAUDE.md`, 인계 문서, 샘플 |
| system-crew | 설치 — 0.9.0, OnDemand. 결정 기록은 `decisions/ideas/` 형식으로 통일 |
| 기술 스택 | **미정** ← §2-1 |
| MVP 범위 | **미정** ← §2-2 |
| 스캐폴딩·구현 | 시작 전 |

---

## 2. 첫 세션 안건 ★ 여기서 시작한다

### 2-1. 기술 스택 결정

| 후보 | 장점 | 비용 |
|---|---|---|
| Tauri + Vite + TS | 기존 위젯 3종(`claude-usage-widget` 등)과 같은 툴체인. 렌더러(markdown-it·remark)·에디터(CodeMirror 6·Monaco) 생태계가 가장 두텁다. 설치본이 작다 | Rust 빌드 체인. 파일 연결·파일 감시는 Rust 쪽 플러그인으로 처리 |
| WPF (.NET) | 순수 네이티브, 파일 시스템 API가 자연스럽다. `DiscordForumOps`와 같은 .NET | 미리보기는 WebView2 + Markdig로 결국 HTML 렌더. 에디터 컴포넌트는 AvalonEdit 정도로 선택지가 좁다 |
| WinUI 3 (.NET) | 최신 Fluent 룩 | 도구·배포(MSIX)가 까다롭고 에디터 컴포넌트가 가장 부족하다 |

`system-crew idea`로 판정하고 `decisions/ideas/YYYYMMDD-stack.md` + INDEX 행으로 남긴다.
참고 판정: `cursor-usage-widget`의 [`20260729-stack-tauri.md`](../../cursor-usage-widget/docs/decisions/ideas/20260729-stack-tauri.md) (위젯 기준 — 에디터는 에디터 컴포넌트·렌더러 비중이 크다).

### 2-2. MVP 범위

첫 릴리스에 넣을 것을 고른다. 나머지는 백로그로 둔다.
`system-crew ideation`으로 MVP 묶음 대안 몇 개를 받아 고르면 `decisions/ideation/`에 남는다.

- [ ] 파일 열기·저장 (드래그 앤 드롭 포함)
- [ ] 보기 모드 (렌더링만)
- [ ] 편집 + 실시간 미리보기 분할
- [ ] `.md` 파일 연결 — 탐색기에서 더블클릭으로 열기
- [ ] GFM (표·체크리스트·취소선·자동 링크)
- [ ] 코드 블록 구문 강조
- [ ] 목차(TOC) 사이드바
- [ ] 폴더 트리 사이드바
- [ ] 탭 (여러 파일)
- [ ] 다크 모드
- [ ] 이미지 상대 경로 해석
- [ ] 외부 변경 감지 (다른 프로그램이 파일을 고쳤을 때)
- [ ] 편집·미리보기 스크롤 동기화
- [ ] Mermaid 다이어그램
- [ ] 수식 (KaTeX)
- [ ] 내보내기 (HTML·PDF)

### 2-3. 파일 처리 원칙

뷰어가 아니라 **편집기**이므로, 저장했을 때 사용자가 바꾸지 않은 바이트가 바뀌면 안 된다.
`samples/raw/`의 픽스처로 검증한다.

- 인코딩: UTF-8 / UTF-8 BOM / CP949(EUC-KR) 판별과 **원래 인코딩으로 저장**할지
- 줄바꿈: LF / CRLF 보존 여부 (섞여 있는 파일은 어떻게 할지)
- 파일 끝 개행 유무 보존
- 자동 저장 여부, 저장 안 한 채 닫을 때의 동작
- 대용량 파일(수 MB) 기준

### 2-4. 배포 형태

- 포터블 exe vs 설치본
- `.md` 파일 연결 등록을 설치 시 할지, 앱 안에서 할지

---

## 3. 스택 결정 직후 할 일

1. 스택 판정을 `decisions/ideas/`에 `ADOPT`로 기록
2. 스캐폴딩
3. `.gitignore`에 빌드 산출물 추가 (예: Tauri면 `node_modules/`·`dist/`·`src-tauri/target/`, .NET이면 `bin/`·`obj/`)
4. `CLAUDE.md`의 `구조`·`빌드` 절 채우기
5. 이 문서 §1 표 갱신
