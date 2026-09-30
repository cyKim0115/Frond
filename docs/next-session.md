# 다음 세션 인계

작성: 2026-09-28 · 갱신: 2026-09-30 (1-7 1차 실기 결과 반영 — 대용량 수정·관리자 경고·최근 파일 제목, 재확인 대기)
읽는 순서: [`CLAUDE.md`](../CLAUDE.md) → 이 문서 → [`roadmap.md`](roadmap.md) → [`decisions/ideas/INDEX.md`](decisions/ideas/INDEX.md)

이 문서는 **지금 열려 있는 것**을 담는다. 확정된 결정은 system-crew 형식으로 `decisions/`에 남기고 여기서 지운다.

---

## 1. 지금 어디까지 왔나

| 단계 | 상태 |
|---|---|
| 프로젝트 초기세팅 · system-crew 0.9.0 OnDemand | 완료 |
| 참고 조사 | 완료 — [`references/assets/20260929-typora-md-editors/`](references/assets/20260929-typora-md-editors/ASSET.md) |
| 기술 스택 | **확정 `ADOPT`** — Tauri 2 + Vite + vanilla TS ([`decisions/ideas/20260929-stack.md`](decisions/ideas/20260929-stack.md)) |
| 에디터 엔진 | **확정** `ADOPT_WITH_CHANGES` — CodeMirror 6 ([`decisions/ideas/20260929-editor-engine.md`](decisions/ideas/20260929-editor-engine.md)) |
| MVP 범위 | **V1 리더 퍼스트** ([`decisions/ideation/20260929-mvp-scope.md`](decisions/ideation/20260929-mvp-scope.md)) = 로드맵 Phase 0–2 |
| Phase 0 (스파이크·코어·측정·픽스처) | 완료 2026-09-29 — [`decisions/ideas/20260929-stack.md`](decisions/ideas/20260929-stack.md) "Phase 0 결과 기록란" |
| Phase 1 뷰어 MVP — 1-1 스캐폴딩 · 1-2 열기 경로 · 1-3 렌더 · 1-4 UI/테마 · 1-5 외부 변경 · 1-6 설치기 | **구현 완료 2026-09-29** (`main`). 스펙: [`system-spec.md`](references/assets/20260929-typora-md-editors/system-spec.md) |
| 셸 UI 보강 (사용자 요청 2026-09-29) | 커스텀 제목 표시줄(창 테두리 없음), 왼쪽 탐색 영역(최근 파일 탭, 열고 닫기 애니메이션), 목차 폭 조절, 설정 팝업(테마·본문 폭·제목 이동 여백·최근 파일 개수). 최근 파일은 로드맵 2-5를 앞당김 |
| Phase 1-7 검증 | **1차 실기 2026-09-30** — 1·2·4·5·7·9·10 통과, 8 보류(환경 없음). 6(10 MB 느림·토글마다 렉) 수정, 3 확인 방법 보강, 관리자 경고 구현 → **재확인 대기** ← §2 |
| 최근 파일 제목 (사용자 요청 2026-09-30) | 목록 두 줄 [제목] / [파일 이름 폴더]. 제목 = front matter 최상위 `title:` → 첫 H1 (`##` 이하는 쓰지 않음), 120자 저장 상한 — `src/recent.ts` `docTitle`. 저장 형식 `{path, title?}`, 예전 문자열 목록도 읽는다 |
| Phase 2 (편집·저장) | 1-7 통과 후 |
| 셸 트랙 — 설정·테마 (사용자 요청 2026-09-30) | **계획만** — [`roadmap.md`](roadmap.md) "셸 트랙": S-1 설정 카테고리 탭 → S-2 테마 모델 → S-3 테마 전환 연출 → S-4 사용자 테마 가져오기·관리. 1-7 통과 후 Phase 2와 병행 가능. 설정 추가 규칙은 `add-setting` 스킬 |

Phase 1 구현 요약: `npm run app:build` → `target/release/bundle/nsis/MdEditor_0.1.0_x64-setup.exe`(4.2 MB). 확인된 것 — argv·두 번째 인스턴스 열기(릴리스 exe), 외부 변경 감지(내용 해시, 삭제 배너), vitest 34건(렌더: 경로·링크 허용 목록·DOMPurify·하이라이트), cargo 테스트 34건(코어 23 + 백엔드 11), 브라우저 미리보기(`npm run dev` → `http://localhost:1422/?sample=samples/showcase.md`)에서 목차·제목 id·표·체크리스트·각주·코드 하이라이트·한글 keep-all·D2Coding·가로 스크롤 없음. 설치·레지스트리는 2026-09-30 Win10 실기로 확인(연결 프로그램 추천·기본 앱 목록·제거 후 정리).
같은 버전(0.1.0)을 다시 설치하면 설치기가 유지 관리 페이지를 먼저 띄운다 — **추가/재설치**를 골라 끝까지 가야 파일이 바뀐다(창을 닫으면 아무것도 안 바뀜). 페이지 없이 덮어쓰려면 `MdEditor_0.1.0_x64-setup.exe /S`.

1-7 1차에서 고친 것 (2026-09-30):
- 대용량: 10 MB 샘플은 레이아웃만 7.6 s(노드 57만)였고, 탐색 영역 폭 애니메이션이 프레임마다 문서 전체를 재배치(~380 ms)해 렉. 2 MB 초과는 큰 문서 모드(`#app.large-doc`: 블록·목차 줄 `content-visibility: auto`, 패널 애니메이션 끔, 이미지 `loading=lazy`) → 첫 레이아웃 0.86 s, 폭 변경 1회 ~250 ms(브라우저 미리보기 기준). 목차 현재 제목 찾기는 이진 탐색
- 스펙 `largeHardLimit`(10 MB 초과 텍스트 뷰)은 미구현이었다 → **백로그로 내림**(사용자 결정). 10 MB 샘플은 렌더 대상
- 관리자 권한 실행 경고: `src-tauri/src/elevation.rs` `is_elevated` → 상태바 "관리자 권한 실행 중"(툴팁에 UIPI 설명)

---

## 2. 사용자가 할 일 ★ 1-7 재확인

1차 결과(2026-09-30): 1 설치 ✅ · 2 연결 프로그램·기본 앱 ✅ · 3 ❓ 무엇을 볼지 몰랐음 · 4 외부 변경 ✅ · 5 단축키·400 px·인쇄 ✅ · 6 ❌ 10 MB 5 s 초과 + 연 뒤 토글마다 렉 · 7 제거 ✅ · 8 ⏸ 실측 환경 없음(§3) · 9 제목 표시줄 ✅ · 10 탐색 영역·설정 ✅

새 설치기(`target\release\bundle\nsis\MdEditor_0.1.0_x64-setup.exe`)로 **추가/재설치**(또는 `/S`) 후:

1. (3번) `samples/paths/paths.md` → 64 px 단색 정사각형(빨강·초록·파랑·주황)이 위 두 절에 4개씩, "인코딩 없이" 절에 2개(대괄호·해시) = **10개**. 마지막 `![한글 raw](…)` 줄은 글자 그대로
2. (6번) `samples/large/10mb.md` 열기 ≤ 5 s. 연 뒤 탐색 영역(`Ctrl+Shift+E`)·목차(`Ctrl+\`)·줌·스크롤에 긴 멈춤이 없는지. 2 MB 초과 문서는 패널 애니메이션 없이 바로 열리고 닫히는 게 정상. `Ctrl+P` 미리보기에 문서 끝까지 나오는지
3. (신규) 관리자 경고: 시작 메뉴 MdEditor 우클릭 → 관리자 권한으로 실행 → 상태바에 빨간 "관리자 권한 실행 중", 마우스를 올리면 이유. 그 상태에서 탐색기 `.md` 더블클릭이 이 창에 안 열리는 건 예상 동작(UIPI). 일반 실행에서는 경고가 없어야 한다
4. (신규) 최근 파일 제목: 목록 첫 줄에 문서 제목, 둘째 줄에 파일 이름·폴더. 제목 없는 문서는 예전처럼 파일 이름·폴더. 전에 연 항목은 다시 열면 제목이 붙는다

결과를 알려 주면 에이전트가 `fidelity-report.md`(readonly QA 형식)를 쓰고 로드맵 1-7을 닫는다. 8번(IME)은 보류 사유로 적는다.

## 3. Phase 1 안에서 보강할 실측

- **1-7 (8번, 보류 2026-09-30 — Win11 PC·이전 IME 환경 없음)**: 이전 IME(`ConfigureImeVersion=1`)·Win11에서 IME 시나리오 재실측 (Win10 새 IME 결과로 잠정 판정 중). 환경이 생기면 한다. 스파이크 앱 재사용: `git checkout archived-exp/ime-spike` → `cd spike/ime-spike` → `npm install` → `npm run spike`, 절차는 그 브랜치의 `spike/ime-spike/CHECKLIST.md`

## 4. 보류 중인 사용자 결정

- **RAG 캡처**: MVP(Phase 2) 완료 후 `capture-to-rag` 검토 (2026-09-29 사용자: "MVP완료하고")
- **원문 HTML 태그**: 렌더는 `html: false`라 `<details>`·`<img>` 같은 원문 HTML이 글자 그대로 보인다(GitHub과 다름, 뷰어라 안전 우선). 허용 태그 목록과 함께 열지 결정 필요 (`src/render/index.ts`)
- **`www.example.com` 자동 링크**: 파일명(`paths.md`) 오탐을 막으려고 스킴 있는 URL만 자동 링크. GitHub과 다른 점
- **대용량 샘플 커밋 여부**: 생성 스크립트 유지. 커밋 원하면 `.gitignore`의 `samples/large/`를 뺀다
- **사용자 테마 파일 형식** (S-4 착수 전): 권장은 색 토큰만 담는 JSON(`id`·`name`·`base`·`shell`·`doc` 토큰, 빠진 값은 `base`로 채움) — 검증이 쉽고 S-3 색 보간과 맞는다. 임의 CSS는 `url()`·`@import`로 바깥을 부를 수 있고 보간도 안 돼서 뺐다(Typora CSS 호환은 백로그). 확장자(`.json` / `.mdtheme.json`)와 토큰 키 목록 공개 범위도 그때 정한다
- **EOL 재대응 정책**: `crates/mdeditor-core/src/eol.rs` `remap` (편집 줄은 자기 EOL 유지, 새 줄만 지배 EOL)

## 5. 열린 질문 (갱신)

- NSIS 훅 노출(연결 프로그램 추천 목록·기본 앱 설정): **Win10 실기로 확인 2026-09-30** (Win11은 미확인)
- WebView2 한국어 IME: Win10 새 IME ①–⑧ 통과. 이전 IME·Win11 미실측 (§3)
- Typora 1.14.x 무편집 저장 바이트 (레퍼런스 실측, 선택)
- 재부팅 직후 진짜 콜드 시작 (선택, `archived-exp/wpf-hello`의 `spike/measure`)
- 렌더 리뷰에서 나온 사소한 차이(기록만): 슬러그 `a  b` → `a-b`(GitHub `a--b`), 각주 섹션에 `data-line` 없음, 차단된 스킴 링크는 원문 글자로 남음(GitHub은 href 없는 `<a>`)
