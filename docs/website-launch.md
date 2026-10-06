# 웹사이트(제품 페이지) — 오늘 할 일 (Cursor 핸드오프)

작성: 2026-10-06 · 상태: **대기 — 에이전트 몫(A)은 "실행"이라고 하면 아래 순서대로, 사용자 몫(U)은 도메인을 살 때**
결정: [`decisions/ideas/20261006-website.md`](decisions/ideas/20261006-website.md) · 근거 조사: [Frond 웹사이트 구축 방법](research/reports/Frond%20웹사이트%20구축%20방법.md)
같이 보는 계획: [`gitbook-site.md`](gitbook-site.md)(사용 설명서 = GitBook, 다른 세션) · [`store-launch.md`](store-launch.md)(Store 출시) · [`frond-rename.md`](frond-rename.md)(저장소 이름 `Frond`)

목표: fork.dev처럼 Frond를 소개하고 내려받게 하는 **제품 페이지(홈페이지)**를 만든다 — 사용 장면, 다운로드, 릴리스 노트, 개인정보처리방침.
사용 설명서는 GitBook(`gitbook-site.md`)이 맡고, 이 사이트는 `/docs` 링크로 잇는다.
2026-10-06 사용자 지시: **도메인을 사기 전까지는 모양만 만든다. 사용자 도움 없이 되는 부분을 오늘 할 일로 시킨다.**
그래서 A-0~A-5는 계정·로그인·배포 없이 끝까지 간다. 공개(도메인·Cloudflare 연결)는 사용자 몫 U-1~U-3이다.

## 0. 한눈에

```
저장소 (cyKim0115/Frond — 2026-10-06 MdEditor에서 개명)
├─ website/           제품 페이지, Astro 정적 ──(U-2)──▶ Cloudflare Workers 정적 자산 → https://<도메인>/
│                      /docs → 302 → GitBook        (도메인 전에 공개가 필요하면 frond-site.<계정>.workers.dev)
├─ docs/site/         사용 설명서 (gitbook-site.md) ──▶ GitBook Git Sync → https://cykim.gitbook.io/frond/
│   └─ privacy.md     개인정보처리방침 원본 — GitBook 쪽 + 사이트 /privacy/ + Store 제출 URL이 같이 쓴다
└─ CHANGELOG.md       /releases/ 원본 (새로 만든다)
```

- 폴더 이름은 `website/`다. `docs/site/`(GitBook 원고)와 헷갈리지 않게 `site/`를 쓰지 않는다
- 오늘(에이전트): 사이트를 로컬에서 끝까지 만들고(`astro dev`·`wrangler dev`로 확인), 사용 장면을 찍고, 원고를 쓴다
- 나중(사용자): 도메인 구매·Cloudflare 연결. 그때 에이전트가 고칠 것은 `website/src/config.ts`와 `wrangler.jsonc`의 값 몇 개뿐이다

## 1. 오늘 할 일

| # | 할 일 | 담당 | 사용자 도움 | 상태 |
|---|---|---|---|---|
| A-0 | 작업 공간 — 워크트리 `../MdEditor-web`(`feat/website`) | 에이전트 | 없음 | 대기 |
| A-1 | 사이트 뼈대 — `website/` Astro 정적 + `wrangler.jsonc`(배포는 안 함) + 저장소 위생 | 에이전트 | 없음 | 대기 |
| A-2 | 디자인 — 앱 색 토큰·글꼴·라이트/다크·공통 컴포넌트 | 에이전트 | 없음 | 대기 |
| A-3 | 사용 장면 — 데모 문서·캡처 스크립트·캡처(브라우저 미리보기 경로). GitBook 설명서 그림과 같이 쓴다 | 에이전트 | 없음 | 대기 |
| A-4 | **홈페이지 원고와 페이지** — 홈·다운로드·감사·릴리스 노트·개인정보처리방침·404 (§5) | 에이전트 | 없음 | 대기 |
| A-5 | 검증·리뷰 캡처 → `docs/qa/<날짜>-website/`, next-session §2에 확인 항목 | 에이전트 | 없음 | 대기 |
| A-6 | (선택) 실제 앱 장면 — 폴더 트리·AI 받은 목록·비교·인코딩, 짧은 클립 | 에이전트 | 없음 | 대기 |
| U-1 | 도메인 이름 정하기 (§8 후보) | 사용자 | — | 대기 |
| U-2 | Cloudflare 가입 → 도메인 구매 → Workers Builds로 저장소 연결 | 사용자 | — | 대기 |
| U-3 | (선택) Web Analytics·Email Routing `support@` | 사용자 | — | 대기 |

순서: A-0 → A-1 → A-2 → A-3 → A-4 → A-5. A-6은 시간이 남으면. GitBook 설명서(`gitbook-site.md`)와는 A-3 장면만 겹친다(§7).

## 2. 시작 전 확인 (에이전트)

1. `git status`·`git worktree list` — 2026-10-06 기준 main 폴더를 여러 세션이 같이 쓴다(`feat/ai-hook-settings`, GitBook 설명서 `docs/gitbook`, Store `feat/store` 예정).
   이 작업은 **새 워크트리 `../MdEditor-web`(`feat/website`)**에서 한다: `git worktree add -b feat/website ../MdEditor-web main`. Cursor라면 그 폴더를 연다.
   단계가 끝날 때 `git merge main`으로 따라잡고 main에는 `--ff-only`로 합친다. **main을 푸시하면 GitBook(`docs/site/`)이 바로 공개된다** — 이 작업은 `docs/site/`를 고치지 않지만(§7의 `privacy.md`만 예외) 푸시는 사용자가 정한다
2. Node ≥ 22.12(Astro 7 요구). 이 PC는 Node 24.18, Edge·ffmpeg 9.0이 있다
3. **손대지 않는 것**: 앱 코드(`src/`·`src-tauri/`·`crates/`), `samples/raw/`, 다른 계획의 본문(gitbook-site·store-launch·frond-rename). 예외는 루트 `vite.config.ts` 감시 제외 한 줄, `.gitignore`, CLAUDE.md 구조·빌드 절의 `website/` 줄
4. **하지 않는 것**: `wrangler login`·실제 `wrangler deploy`, Cloudflare·GitBook 계정 작업, `gh release`, 저장소 설정 변경, 공개 배포. 전부 사용자 몫이다
5. 저장소 주소·설명서 주소·도메인은 `website/src/config.ts` 한 곳에만 둔다(저장소 이름이 `Frond`로 바뀌고 도메인이 아직 없다)
6. 커밋은 한국어 `{영역} - {내용}`(영역 `사이트`·`문서`), 단계마다. 끝나면 [`next-session.md`](next-session.md) §1·§3 갱신

## 3. 정해진 것 (요약 — 근거는 결정 기록)

| # | 정한 것 | 한 줄 이유 |
|---|---|---|
| W1 | 사이트 둘: 제품 페이지(자체 도메인, Cloudflare) + 사용 설명서(GitBook). 앱·README·사이트는 설명서를 **`<도메인>/docs` 고정 주소**로 가리킨다 | GitBook 무료는 커스텀 도메인·하위 경로가 없다. 고정 주소면 설명서 위치를 바꿔도 링크가 산다 |
| W2 | 제품 페이지 = **Astro 7 정적**, 이 저장소 `website/`. 어댑터·Starlight 없음 | 이미지 최적화(`<Picture>`)·컴포넌트·JS 0. 설명서는 GitBook이 맡는다 |
| W3 | 설명서 = GitBook Free + Git Sync(`docs/site/`) — 사용자 선택, [`gitbook-site.md`](gitbook-site.md) | 조사 1순위였던 Starlight `/docs`는 DEFER(바꿀 조건은 결정 기록) |
| W4 | 호스팅 = **Cloudflare Workers 정적 자산** + Workers Builds(루트 `website`, 감시 `website/*`) | Cloudflare가 새 프로젝트에 Workers를 권장, 정적 요청 무료·무제한 |
| W5 | 도메인 = 사용자가 Cloudflare Registrar에서 구매. 그 전에는 **로컬에서만**(필요하면 `workers.dev` 임시). 무료 도메인 서비스는 안 씀 | 무료 서비스는 심사·평판 문제, `.kr`은 Cloudflare에서 못 산다 |
| W6 | 다운로드 = 상태별 카드(준비 중 → Store 배지 → 직접 설치 → winget). 버전·크기·SHA256은 빌드 때 GitHub API에서 | 손으로 고친 버전은 늦는다(fork.dev 홈 2.21.1, CDN 2.23.1). winget은 리디렉트 주소 금지 |
| W7 | 사용 장면 = 실제 화면 캡처(앱 기본 창 1100×800, DPR 2, 히어로는 라이트/다크), 창 틀은 CSS, 클립은 MP4. GIF·HTML 모형·이미지 속 글자 금지. Store 스크린샷·설명서 그림과 같이 쓴다 | 스크립트로 다시 찍을 수 있다. Store 규격(PNG 1366×768 이상) 만족 |
| W8 | 한국어만 먼저. 영어는 DEFER | 앱 UI가 한국어 |
| W9 | 릴리스 노트 원본 = 루트 `CHANGELOG.md`. 개인정보처리방침 원본 = `docs/site/privacy.md` | 사이트·GitBook·Store·GitHub 릴리스가 같은 글을 쓴다 |
| W10 | 사이트는 OS 라이트/다크만 따른다(전환 버튼 없음) | 장면 이미지를 `<picture>`의 `media`로 바꿀 수 있다 |

## 4. 에이전트 몫

### A-0 작업 공간

- `git worktree add -b feat/website ../MdEditor-web main` → 그 폴더에서 작업. 끝나도 워크트리는 지우지 않는다(사용자가 결과를 본 뒤)

### A-1 사이트 뼈대

- `website/`에 Astro 7 정적 프로젝트. 의존성 `astro`·`@astrojs/sitemap`·`pretendard`(글꼴, OFL). 개발 의존성 `wrangler`(≥ 4.135)·`@astrojs/check`·`typescript`
- `website/package.json` 스크립트: `dev`, `build`(`astro check && astro build`), `preview`, `cf:dev`(`wrangler dev`), `cf:check`(`wrangler deploy --dry-run`)
- `website/astro.config.mjs`: `output: 'static'`, `site`는 `process.env.SITE_URL ?? 'http://localhost:4321'`, sitemap 통합
- `website/wrangler.jsonc` — 지금은 배포하지 않지만 연결 때 그대로 쓴다. 대시보드 Worker 이름이 `name`과 같아야 빌드가 된다. 설정 파일 없이 연결하면 Cloudflare 자동 구성이 SSR 어댑터를 넣으므로 **이 파일을 먼저 커밋**해 둔다:

```jsonc
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "frond-site",
  "compatibility_date": "2026-10-06",
  "assets": { "directory": "./dist", "not_found_handling": "404-page" }
  // 도메인을 사면(U-2): "routes": [{ "pattern": "<도메인>", "custom_domain": true }], "workers_dev": false
}
```

- `website/.nvmrc` = `24`(Workers Builds 기본 Node와 같게). `website/public/_headers`(보안 헤더 + `/_astro/*` 1년 `immutable` 캐시, CSP는 `Report-Only`로 시작).
  `website/public/_redirects`는 빌드 전 스크립트가 `config.ts`로 만든다(`/docs` → 설명서 302. Astro `redirects` 설정은 정적 빌드에서 meta refresh HTML이라 쓰지 않는다)
- `website/src/config.ts` — 공개 상태는 여기서만 바꾼다:

```ts
export const SITE = {
  name: "Frond",
  url: import.meta.env.SITE_URL ?? "http://localhost:4321", // U-2 뒤 https://<도메인>
  repo: "https://github.com/cyKim0115/Frond",               // frond-rename 전이면 MdEditor(GitHub가 넘겨 준다)
  docs: "https://cykim.gitbook.io/frond/",                 // gitbook-site U-1 전에는 "준비 중" 표시
  storeUrl: null as string | null,                          // R-4 공개 뒤 https://apps.microsoft.com/detail/<StoreId>
  wingetId: null as string | null,                          // R-5 뒤 "cyKim.Frond"
  directDownload: false,                                    // R-5 뒤 true → 빌드 때 GitHub API로 최신 릴리스
  purchase: false,                                          // Store add-on 공개 뒤 true
  contact: null as string | null,                           // U-3 뒤 support@<도메인>
};
```

- 저장소 위생: 루트 `.gitignore`에 `website/.astro/`·`.wrangler/`(`node_modules/`·`dist/`는 이미 있다). 루트 `vite.config.ts` `server.watch.ignored`에 `"**/website/**"` — Astro 빌드 출력이 앱 Vite 감시를 흔들지 않게(cargo `target/`이 EBUSY를 낸 전례). 루트 `tsconfig.json`·vitest는 `src`만 보므로 그대로. CLAUDE.md 구조·빌드 절에 `website/` 한 줄씩
- 완료 조건: `website/`에서 `npm ci && npm run build` 통과, `npm run cf:check` 통과(로그인 없이 된다 — 2026-10-06 확인), `npm run cf:dev`에서 `/` 200·`/docs` 302·없는 주소 404, 루트 `npm test`·`npx tsc --noEmit` 그대로 통과

### A-2 디자인

- 색은 **앱 셸 토큰 그대로**(`src/style.css` — 앱 화면과 같은 값, 테스트로 지켜진다).
  라이트: `--fg #2c3333` `--bg #fcfdfc` `--muted #515b56` `--line #dae1da` `--accent #567e65` `--on-accent #ffffff` `--sidebar-bg #f0f3f0`.
  다크: `--fg #e4eae4` `--bg #1b2221` `--muted #949a96` `--line #474e4c` `--accent #96bea1` `--on-accent #1b2221` `--sidebar-bg #262e2c`.
  `@media (prefers-color-scheme: dark)`로만 바꾼다(W10). 새 색은 이 토큰에서 `color-mix`로 만든다
- 글꼴: 본문 Pretendard Variable(`pretendard` 패키지의 dynamic subset을 자체 호스팅, OFL 고지 포함) → `Malgun Gothic` → system-ui. 코드는 D2Coding(루트 `public/fonts/D2Coding.woff2`·`D2Coding-OFL.txt`를 복사)
- 아이콘: `src-tauri/icons/icon.svg` → `website/public/favicon.svg`, 180 px PNG(apple-touch), 기본 OG 이미지 1200×630(아이콘 + "Frond" + 한 줄 소개, 정적 PNG)
- 컴포넌트: `Header`(로고·기능·다운로드·사용 설명서↗·릴리스 노트·GitHub↗), `Footer`(§5-1), `Hero`, `Scene`(라이트/다크 장면 + CSS 창 틀 + 캡션), `Clip`(MP4), `Feature`(문구 + 장면, 좌우 교차), `DownloadBand`(버튼 + 아래 한 줄), `DownloadCard`(상태별 §5-3), `CopyCommand`(winget 복사), `Faq`(`<details>`), `Notice`
- 창 틀은 이미지에 굽지 않고 CSS로 입힌다(둥근 모서리 8 px·1 px `--line` 테두리·그림자). 원본 캡처를 그대로 다시 쓸 수 있다
- 완료 조건: 1280·768·375 px 폭, 라이트·다크에서 깨짐 없음, 본문 대비 WCAG AA(4.5:1)

### A-3 사용 장면 (브라우저 미리보기 경로 · 설명서와 공용)

앱의 브라우저 미리보기(루트 `npm run dev` → `http://localhost:1422/?sample=a.md,b.md&mode=source`)는 제목 표시줄·탭 띠·창 버튼까지 실제 앱과 같은 화면을 그린다(`index.html`에 다 있다). 설치본·사용자 설정을 건드리지 않고 찍을 수 있다.

- 데모 문서 `website/scenes/demo/` — 지어낸 한국어 예시만(사용자 파일·실제 경로·실명 금지). 목록은 §6
- 캡처 스크립트 `website/scripts/capture-scenes.mjs`(Node 24 내장 WebSocket으로 CDP):
  1. 루트 Vite가 떠 있는지 확인한다. 1422를 다른 세션이 쓰면 `npx vite --port 1442 --strictPort`로 따로 띄우고 `BASE_URL`로 넘긴다
  2. Edge를 임시 프로필로 띄운다: `msedge.exe --headless=new --remote-debugging-port=9333 --user-data-dir=<임시> --no-first-run --hide-scrollbars about:blank`
  3. 장면마다 `Emulation.setDeviceMetricsOverride { width: 1100, height: 800, deviceScaleFactor: 2, mobile: false }`(앱 기본 창 크기),
     `Emulation.setEmulatedMedia { features: [{ name: "prefers-color-scheme", value: "light" | "dark" }, { name: "prefers-reduced-motion", value: "reduce" }] }`
     — 앱 기본 테마가 '시스템 설정 따르기'라 라이트/다크가 이것으로 바뀐다(localStorage를 건드리지 않는다). 동작 줄이기를 켜 두면 테마 전환 연출이 0이 되어 정지 화면이 흔들리지 않는다(전환 클립만 끈다)
  4. `Page.navigate`로 `?sample=<encodeURIComponent 경로들>&mode=…` → `document.fonts.ready`, 그림(`.mermaid svg`)·수식(`.katex`)이 있으면 그려질 때까지 기다린다
  5. 장면별 조작(분할 `Ctrl+Shift+/`, 스크롤, 찾기 입력 등)은 `Input.dispatchKeyEvent`·`Input.insertText`·`Runtime.evaluate`로
  6. `Page.captureScreenshot { format: "png" }`(기능 장면은 `clip`으로 영역만) → `website/src/assets/scenes/<장면>.<light|dark>@2x.png`. 끝나면 Edge 종료·임시 프로필 삭제
  7. 클립은 `Page.startScreencast` 프레임(`metadata.timestamp`) → ffconcat → ffmpeg:
     `ffmpeg -f concat -i frames.ffconcat -vf "fps=30,scale=1440:-2,format=yuv420p" -c:v libx264 -preset slow -crf 24 -movflags +faststart -an -map_metadata -1 <장면>.light.v1.mp4`
- 장면 정의는 스크립트 안 배열이나 `website/scenes/scenes.json`(열 문서·동작·clip·테마·출력 경로)로 둔다 — 다시 찍을 때 이 파일만 고친다
- 글꼴: 캡처 PC에 Pretendard가 깔려 있으면 일반 사용자 화면(맑은 고딕)과 달라진다. 2026-10-06 이 PC에는 없다. Windows 10에서는 아이콘이 Segoe MDL2로 대체된다(Windows 11 화면과 조금 다름)
- 첫 장면을 찍은 뒤 실제 앱 화면과 구성이 같은지 본다(`docs/screenshots/main.png`는 옛 색이라 배치만 비교). 다르면 그 장면은 A-6으로 돌린다
- **설명서와 공용**: `gitbook-site.md` A-5(설명서 스크린샷)도 이 스크립트로 찍는다. 먼저 하는 쪽이 스크립트를 만들고, 설명서용은 라이트판 사본을 `docs/site/images/`에 둔다(GitBook은 `docs/site/` 밖을 못 본다)
- 완료 조건: §6의 브라우저 경로 장면이 라이트·다크 두 벌로 있고, 화면에 사용자 경로·이름이 없다. 스크립트를 다시 돌리면 같은 그림이 나온다

### A-4 홈페이지 원고와 페이지 — §5

- 페이지: `/`(홈), `/download/`, `/download/thanks/`(R-5 전에는 링크하지 않는다), `/releases/`, `/privacy/`, `404`. 원고는 §5, 장면은 §6
- `/releases/`는 루트 `CHANGELOG.md`를 빌드 때 읽어 그린다. 파일이 없으면 §5-4 형식으로 새로 만든다(출시 전이라 "다음 버전(미출시)" 한 절)
- `/privacy/`는 `docs/site/privacy.md`를 빌드 때 읽어 그린다. 없으면 §5-5 뼈대로 **이 작업에서 만든다**(store-launch A-5·gitbook-site "그다음"의 개인정보처리방침과 같은 파일 — 두 번 만들지 않는다).
  이 파일은 GitBook 싱크 대상이라 main에 합치면 설명서에도 나온다(목차 `SUMMARY.md`에 넣을지는 설명서 계획이 정한다)
- 완료 조건: §5의 모든 섹션이 자리를 잡고(장면이 없으면 회색 자리), `config.ts` 값을 바꾸면 다운로드 카드 상태가 바뀐다(§5-3 네 가지를 모두 빌드해 본다)

### A-5 검증·리뷰 캡처

- `website/`: `npm run build`, 내부 링크 검사(빌드 출력의 `href`·`src`가 모두 있는 파일), `npm run cf:dev`로 `_redirects`·404 확인
- 헤드리스 Edge로 `/`·`/download/`·`/releases/`·`/privacy/`·404를 1280 px·375 px, 라이트·다크로 찍어 `docs/qa/<날짜>-website/`에. 다운로드 카드 상태 네 가지도
- §5-6 출시 전 점검표를 돌린다
- [`next-session.md`](next-session.md) §2에 사용자 확인 항목(모양·문구·히어로 제목 고르기·만든 사람 문구)을 더하고 §1·§3을 갱신
- 완료 조건: 위 검사 통과, 리뷰 캡처가 문서에 링크돼 있다

### A-6 (선택) 실제 앱 장면·클립

브라우저 미리보기로 못 그리는 장면(폴더 트리 — `list_dir`, AI 받은 목록 — 훅 이벤트, 비교·인코딩 — 실제 파일)만.

- **설치본은 건드리지 않는다**. 식별자를 바꾼 디버그 빌드: `TAURI_CONFIG='{"identifier":"com.cykim.frond.shots","build":{"devUrl":"http://localhost:1442"}}'`, `CARGO_TARGET_DIR=target/shots`, Vite는 1442.
  실행 때 `WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS=--remote-debugging-port=9229` → `http://127.0.0.1:9229/json/list`의 page 타깃에 CDP. 창 크기는 기본 1100×800
- 데모 폴더는 짧은 중립 경로(예: `C:\FrondDemo\`)에 복사해 쓴다 — 상태바에 파일 전체 경로가 보이고, 지금 QA 캡처에도 `C:\Users\cykim\…`가 찍혀 있다
- AI 받은 목록: 두 번째 인스턴스를 `--from-hook=claude <데모 파일>`로 띄운다. `feat/ai-hook-settings`가 main에 합쳐졌으면 그 경로(설정 'AI 연동' 탭)로
- 클립: `Page.startScreencast` 프레임 또는 ffmpeg `gdigrab -i title=Frond` → MP4(H.264, 6~10초, 소리 없음) + 첫 프레임 포스터
- 끝나면 `target/shots`·`%LOCALAPPDATA%\com.cykim.frond.shots`·데모 폴더를 지운다. Claude 데스크톱 세션에서 띄우면 앱 데이터가 Claude 패키지 LocalCache로 가니 그 폴더도 본다

## 5. 홈페이지 원고

fork.dev 구조(홈 한 장 + 다운로드 + 릴리스 노트)를 따르되, fork.dev가 놓친 것(글자가 든 히어로 이미지, 몇 년 묵은 스크린샷, 손으로 고친 버전 링크, 죽은 블로그 링크, 개인정보처리방침 없음)은 따라 하지 않는다.

### 5-1 사이트맵

| 주소 | 내용 | 원본 |
|---|---|---|
| `/` | 소개 — 히어로, 사용 장면, 기능, 원본 보존, FAQ, 다운로드 띠 | §5-2 |
| `/download/` | 받기 — 상태별 카드, 요구 사항, 설치 뒤 할 일 | §5-3 |
| `/download/thanks/` | 직접 설치 뒤 안내(R-5 뒤 링크) | §5-3 |
| `/releases/` | 릴리스 노트 | `CHANGELOG.md` |
| `/privacy/` | 개인정보처리방침(Store 제출 URL) | `docs/site/privacy.md` |
| `/docs` | → 설명서 302 | `config.ts` |
| `404` | 길 잃음 + 홈·설명서 링크 | — |

머리: 로고(아이콘 + Frond) · 기능 · 다운로드 · 사용 설명서↗ · 릴리스 노트 · GitHub↗
꼬리: 사용 설명서 · 릴리스 노트 · GitHub · 문제 신고(GitHub Issues) · 개인정보처리방침 · 라이선스(MIT, `LICENSE`) · 상표(`TRADEMARKS.md`) · 연락처(U-3 뒤) · "© 2026 cyKim"

### 5-2 홈 섹션과 문구 초안

사용자에게 보이는 글이라 짧은 존댓말로 쓴다. 아래는 초안이고 사용자 확인(A-5)에서 고른다. 제목·문구는 **HTML 글자**로 둔다(이미지에 넣지 않는다).

| # | 섹션 | 내용 |
|---|---|---|
| 1 | 히어로 | 제목 + 부제 + 주 버튼 + "사용 설명서" + 작은 줄. 아래에 장면 S1(라이트/다크 자동, 창 틀) |
| 2 | 다운로드 띠 | 버튼(§5-3 상태) + 아래 한 줄: 지금은 "무료", `purchase` 뒤 "무료 · 테마 기능은 선택 구매" |
| 3~8 | 기능 6개 | 아래 표. 제목 + 두 줄 + 장면, 좌우 교차, 각자 설명서 쪽 링크 |
| 9 | 원본을 지킵니다 | 다섯 칸(아이콘 + 한 줄) |
| 10 | 숫자 띠 | 근거 있는 숫자만 |
| 11 | 만든 사람 | 한두 문장(사용자가 쓴다 — 임시: "한국의 1인 개발자가 만들고 있습니다." + GitHub 링크) |
| 12 | FAQ | 아래 |
| 13 | 다운로드 띠 2 | 2번과 같음 |

**히어로 제목**(추천 1): ① **마크다운을 문서처럼** ② 읽기 좋게 열고, 원본 그대로 저장합니다 ③ AI가 쓴 문서를 편하게 읽는 곳
**부제**: "`.md` 파일을 더블클릭하면 바로 읽기 좋은 화면으로 열립니다. 고친 줄만 저장해 나머지는 원본 그대로 남습니다."
**작은 줄**: "Windows 10·11 · 무료 · 관리자 권한 필요 없음 · 문서를 밖으로 보내지 않음"(설치 크기는 출시 빌드로 잰 뒤 더한다)

| # | 제목 | 설명(두 줄) | 장면 | 설명서 |
|---|---|---|---|---|
| 1 | 더블클릭하면 바로 읽기 좋은 문서 | 표·체크리스트·각주·코드 강조를 GitHub처럼 그립니다. 목차를 누르면 그 제목으로 갑니다. | S1·S2 | 화면 둘러보기 |
| 2 | 여러 문서는 탭으로 | 더블클릭할 때마다 새 창 대신 탭이 늘어납니다. 다음에 켜면 보던 탭과 자리로 돌아옵니다. | S3(·S9) | 파일 열기와 탭 |
| 3 | 고치면서 바로 보기 | 왼쪽은 원문, 오른쪽은 미리보기. 스크롤이 서로 따라오고 고친 부분만 다시 그립니다. | S4(클립) | 편집과 저장 |
| 4 | AI가 만든 문서를 놓치지 않게 | Claude Code가 새 문서를 만들면 보던 화면은 그대로 두고 '새 문서' 목록에 모아 둡니다. | S10(A-6) | AI 앱 연동 |
| 5 | 다이어그램과 수식도 | Mermaid 순서도, 수식, 알림 상자를 문서 안에서 바로 그립니다. | S5 | 지원하는 Markdown |
| 6 | 눈에 편한 색 | 라이트·다크 기본 테마와 추천 테마 23종을 바로 고릅니다. | S6 | 테마 |

**원본을 지킵니다**: 고친 줄만 저장(줄바꿈·BOM·인코딩 그대로) · EUC-KR 문서도 그대로 · 다른 편집기가 바꾸면 알리고 차이를 보여 줌(S11) · 저장 안 한 편집은 자동 백업 · 문서를 밖으로 보내지 않음
**숫자 띠**: "10 MB 문서도 열립니다" · "2,000줄 미리보기 갱신 0.1초 안" · "관리자 권한 필요 없음" — 근거 README·next-session 실측. 설치 크기는 출시 빌드로 다시 재서 쓴다(README의 "약 5 MB"는 옛 값, 2026-10-06 NSIS는 6.6 MiB — Electron 계열 Markdown 앱 108~344 MiB보다 한 자릿수 작다)
**FAQ**:
- 무료인가요? → 문서를 열고 고치고 저장하는 기능은 모두 무료입니다. (`purchase` 뒤) 선택 구매는 테마 기능만 엽니다
- Mac이나 Linux에서도 되나요? → Windows 10·11 전용입니다
- 내 문서를 어디로 보내나요? → 보내지 않습니다. 파일은 내 PC에서만 읽고 씁니다(개인정보처리방침 링크)
- 다른 편집기와 같이 써도 되나요? → 네. 고친 줄만 저장하고, 다른 프로그램이 파일을 바꾸면 알려 드립니다
- 오픈소스인가요? → 소스 코드는 MIT입니다. "Frond" 이름과 아이콘은 따로 보유합니다
- (`directDownload` 뒤) 설치할 때 'Windows의 PC 보호' 창이 떠요 → **추가 정보** → **실행**. Store판은 이 창이 뜨지 않습니다

**쓰지 않는 말**(확인 전): 한글 입력 "완벽" 같은 IME 주장(B-2 사용자 확인 대기), 라이브프리뷰(실험, main 미병합), Codex 연동(실제 동작 미확인 — 확인되면 "Claude Code·Codex"), 다른 제품 이름을 든 비교, 출시 전 가격, "md 더블클릭으로 바로 보기"를 유일한 장점처럼 쓰기(Obsidian 1.14가 2026-10-05에 단일 파일 열기를 더했다 — 가벼움·원본 보존·한국어·AI 받은 목록을 앞에 둔다)

### 5-3 다운로드 카드 상태와 감사 페이지

| 상태 | 조건(`config.ts`) | 보이는 것 |
|---|---|---|
| 준비 중(지금) | 모두 비어 있음 | "Microsoft Store 출시를 준비하고 있습니다" + GitHub 저장소 링크(소스·소식). 가짜 Store 배지를 쓰지 않는다 |
| Store | `storeUrl` | 공식 배지 웹 컴포넌트 `ms-store-badge`(`language="ko"` — 한국어 SVG는 `ko` 경로만 있고 `ko-kr`은 404, 배경에 맞춘 theme) → `storeUrl`. "업데이트는 Store가 알아서 합니다". 배지를 직접 그리거나 고치지 않는다 |
| 직접 설치 | `directDownload` | 버전·날짜·크기·SHA256(빌드 때 GitHub API `releases/latest`의 `digest`) + 검증 예 `(Get-FileHash .\Frond_x.y.z_x64-setup.exe).Hash`(대소문자만 다를 수 있음) + 버튼(버전 경로 URL) → 누르면 `/download/thanks/` + 이전 버전(GitHub Releases) |
| winget | `wingetId` | `winget install --id cyKim.Frond -e --source winget` 복사 칸(프롬프트 기호 없이) |

- 공통: 요구 사항(Windows 10 19041 이상·11, WebView2 — 없으면 설치기가 받음), 설치 뒤 할 일(`.md` 기본 앱 지정 → 설명서 링크)
- 릴리스가 없으면 GitHub API가 404를 주므로 "준비 중"으로 빌드돼야 한다. API는 빌드 때 한 번만 부른다(비인증 시간당 60회)
- `/download/thanks/`(Sublime·Zettlr 방식, 조사한 사이트 어디에도 SmartScreen 안내가 없었다): ① 다운로드가 안 되면 직링크 ② 'Windows의 PC 보호' 안내 — 이 사이트·GitHub에서 받았고 SHA256이 같은지 확인한 뒤 **추가 정보** → **실행**(번호 붙인 그림 한 장). SmartScreen을 끄라고 하지 않는다. 스마트 앱 컨트롤이 켜진 Windows 11은 '실행' 버튼 없이 막힐 수 있다는 한 줄 ③ `.md` 기본 앱 지정 ④ 설명서·릴리스 노트 ⑤ (`purchase` 뒤) 응원

### 5-4 `CHANGELOG.md` 형식

```markdown
# 변경 기록

## 다음 버전 (미출시)

### 새 기능
- 탭·세션 복원, 분할 뷰, 폴더 트리, …

### 개선
- …

### 고침
- …
```

- 버전 절 제목은 `## 0.1.0 — 2026-10-xx`, 분류는 `새 기능 / 개선 / 고침` 세 가지(fork.dev의 New·Improved·Fixed 배지). 사용자에게 보이는 변화만 쓴다. 패치 버전도 남긴다
- 첫 내용은 README "주요 기능"과 next-session 작업 기록에서 사용자 눈높이로 요약한다
- 사이트는 절 제목에서 버전·날짜를 읽어 목록과 앵커(`#0.1.0`)를 만들고 분류를 배지로 그린다. 같은 절을 나중에 GitHub 릴리스 본문·updater 노트에 쓴다(R-5)

### 5-5 `docs/site/privacy.md` 뼈대

시행일 / 수집하는 정보: 없음 / 앱이 다루는 것: 사용자가 연 파일·폴더, 앱 데이터 폴더(`%APPDATA%\Frond` — 설정·초안·테마)는 내 PC에만 /
네트워크: 문서에 든 원격 이미지를 볼 때 그 주소에 접속(그 서버에 IP가 남을 수 있음), (R-5 뒤) 업데이트 확인 /
AI 연동: 켜면 Claude Code·Codex 설정 파일에 Frond 항목만 넣고 뺀다(내 PC 안) / 구매: Microsoft Store가 처리, Frond는 결제 정보를 받지 않음 /
웹사이트: Cloudflare Web Analytics(쿠키 없음, 개인 식별 안 함 — U-3에서 켤 때) / 문의: GitHub Issues(U-3 뒤 이메일) / 바뀌면 이 쪽에 날짜와 함께 알림.
GitBook 페이지로도 읽히니 GitBook 전용 블록은 쓰지 않는다

### 5-6 출시 전 점검표 (A-5에서 돌린다)

- 제목·문구가 이미지 속에 없다(검색·번역·다크 모드·대체 텍스트)
- 장면이 지금 버전 화면이다(스크립트로 다시 찍었다), 개인 경로·이름이 없다
- 버전·크기·날짜·링크를 손으로 쓴 곳이 없다(`config.ts`·빌드 데이터에서)
- 깨진 링크 0, 404 페이지 있음, `/privacy/` 있음
- (U-2 뒤) 도메인 자동 갱신 켜짐 — 다운로드·updater 주소가 도메인에 묶인다

## 6. 사용 장면 목록

원본은 앱 기본 창 1100×800 CSS px를 DPR 2로 찍은 **2200×1600 PNG**다(Store 데스크톱 스크린샷 규격 PNG·1366×768 이상을 그대로 만족, 문구를 덧붙이지 않는다).

| 용도 | 표시 크기 | 캡처 | 형식·넣는 법 | 용량 예산 | 라이트/다크 |
|---|---|---|---|---|---|
| 히어로 정지 | 최대 1100 px | 창 전체 → 2200×1600 | Astro `<Picture>` AVIF+WebP, `priority`(eager·fetchpriority high), `width`·`height` | AVIF 250 KB 이하 | 두 벌(`<picture>` `media`) |
| 기능 정지 | 520~720 px | 영역 clip(예 720×480 → 1440×960) | `<Picture>` lazy | 60~150 KB | 한 벌(라이트), 테마 섹션만 두 벌 |
| 기능 클립 | 520~720 px | 영역 녹화 → 폭 1080~1440 | MP4 H.264, CRF 23~28, yuv420p, faststart, 무음, 3~8초 | 300~900 KB | 한 벌 |
| 설명서 그림 | 720 px 이하 | 영역 clip ×2 | PNG → `docs/site/images/` | 40~150 KB | 라이트 한 벌(테마 쪽만 두 벌) |
| OG·소셜 | 1200×630 | 앱 장면 일부 + 제목 합성 | PNG | 300 KB 이하 | 한 벌 |

- 클립: `<video muted loop playsinline preload="none" poster=… data-autoplay>` + 화면에 보일 때만 재생하는 짧은 스크립트(`IntersectionObserver`), `prefers-reduced-motion: reduce`면 포스터만. 5초를 넘게 반복하므로 멈춤 버튼을 둔다(WCAG 2.2.2). GIF는 쓰지 않는다(같은 10초가 GIF 9.1 MB, MP4 0.36 MB)
- 동영상 파일은 `website/public/media/<장면>.<테마>.v1.mp4`처럼 버전을 붙인다. Cloudflare 정적 자산은 Range 요청에 200을 준다 → **배포 뒤 iPhone Safari 재생을 확인**하고, 안 되면 포스터만 보여도 깨지지 않게 둔다(R2로 옮기는 건 그때 판단)
- 대체 텍스트는 장면을 문장으로("Frond 창: 탭 세 개와 왼쪽 목차, 표와 코드가 그려진 문서")
- **개인정보 점검(찍기·커밋 전)**: 상태바 전체 경로·탭·폴더 트리 이름에 사용자 이름·실제 프로젝트가 없는가 / 최근 파일·'새 문서' 목록·초안 배너·설정 팝업의 테마 폴더 경로가 데모 데이터뿐인가 / 데스크톱이 찍히면 작업 표시줄·알림·터미널 프롬프트 / 영상 메타데이터 제거(`-map_metadata -1`)

| # | 장면 | 경로 | 데모 문서·조작 | 쓰는 곳 |
|---|---|---|---|---|
| S1 | 읽기 — 보기 모드, 목차 보임 | 브라우저 | `소개.md`(제목 3단·표·체크리스트·코드·인용·작은 Mermaid) | 히어로, Store 1번, 설명서 첫 쪽 |
| S2 | 목차 이동·찾기 강조 | 브라우저 | `소개.md`, `Ctrl+F` 한 단어 | 기능 1 |
| S3 | 탭 4개 | 브라우저 | `?sample=` 네 문서 | 기능 2, Store |
| S4 | 분할 편집(+클립: 표 한 줄 입력 → 미리보기 갱신) | 브라우저 | `릴리스 노트 초안.md`, `Ctrl+Shift+/` | 기능 3, Store |
| S5 | 다이어그램·수식·알림 상자 | 브라우저 | `설계 메모.md`(Mermaid 순서도·시퀀스, 블록 수식, Alerts 3종), 다크 | 기능 5, Store |
| S6 | 테마 — 추천 테마 팝업, 또는 같은 문서를 세 테마로 | 브라우저(팝업은 된다. 테마 적용이 안 되면 A-6) | `소개.md`, 설정 → 테마 → 추천 테마… | 기능 6, Store |
| S7 | 소스 모드(D2Coding) | 브라우저 | `릴리스 노트 초안.md`, `?mode=source`, 다크 | 설명서 편집 쪽 |
| S8 | 설정 팝업 | 브라우저 | `Ctrl+,` | 설명서 설정 쪽 |
| S9 | 폴더 트리 + 목차 | 실제 앱(A-6) | 데모 폴더 | 기능 2 보강 |
| S10 | AI가 만든 새 문서 목록(+클립: 배지가 늘어남) | 실제 앱(A-6) | `회의록.md` 등 3개를 훅 표식으로 | 기능 4, Store |
| S11 | 비교(디스크 빨강·편집 초록) | 실제 앱(A-6) | 편집 중 데모 파일을 밖에서 바꿈 | 원본을 지킵니다 |
| S12 | 인코딩 메뉴(EUC-KR) | 실제 앱(A-6) | `samples/raw/cp949.md` **복사본** | 원본을 지킵니다 |

데모 문서(지어낸 내용): `소개.md`(Frond를 소개하는 가상의 README), `회의록.md`(AI가 정리한 회의 요약 — 결정·할 일 체크리스트·`> [!NOTE]`), `설계 메모.md`, `릴리스 노트 초안.md`, `여행 준비.md`(표·체크리스트 위주). 사람·회사 이름은 가상.
Store 스크린샷은 S1·S3·S4·S5·S6·S10에서 고른다(Store 지침: 로고·광고 문구를 덧붙이지 않고 핵심은 위쪽 2/3, 언어별로 따로 올린다).

## 7. 설명서(GitBook)와 나누는 것

| 항목 | 정한 것 |
|---|---|
| 설명서 주소 | `config.ts` `docs` 한 곳. 사이트 머리·꼬리·기능 섹션·FAQ가 모두 이 값과 `/docs` 302를 쓴다. 앱 '정보' 탭·README도 `<도메인>/docs`를 가리키게(도메인 뒤) |
| 장면 그림 | A-3 스크립트 하나로 찍는다. 원본 `website/src/assets/scenes/`, 설명서용 라이트판 사본 `docs/site/images/`. 창 크기는 1100×800 하나 |
| 개인정보처리방침 | `docs/site/privacy.md` 하나 — 설명서(GitBook)·사이트 `/privacy/`·Store 제출 URL이 같이 쓴다. 도메인 전에는 GitBook 주소를 Store에 넣을 수 있다 |
| 색 | 둘 다 세이지 차콜. 사이트는 셸 토큰(`--accent #567e65`/`#96bea1`), GitBook 주 색은 `gitbook-site.md` 값 |
| 릴리스 노트 | 사이트 `/releases/`가 원본(`CHANGELOG.md`)을 그린다. 설명서는 링크만 |

## 8. 사용자 몫 (도메인을 살 때)

**도메인 후보**(2026-10-06 RDAP·DNS 조회. 구매 가능 여부는 Cloudflare 검색으로 최종 확인):

| 후보 | 상태 | 메모(가격은 제3자 집계, Low) |
|---|---|---|
| `frond.page` | 기록 없음 | 짧다. HTTPS 강제 TLD(문제없음), 갱신 약 $10.2 |
| `getfrond.app` | 기록 없음 | 앱이라는 뜻이 분명. 첫해 약 $8.2·갱신 약 $14.2 |
| `frondapp.dev` · `frondmd.app` | 기록 없음 | |
| `frondeditor.com` · `frondmd.com` | 기록 없음 | `.com` 약 $10.5 |
| `frond.app` · `frond.dev` · `frond.com` · `frond.io` | **이미 등록됨** | |
| `.kr` | Cloudflare에서 못 삼 | 국내 등록처에서 사서 네임서버만 Cloudflare로 |

**무료 도메인은 쓰지 않는다** — `is-a.dev`·`js.org`·`eu.org`·`dpdns.org`·`pp.ua`는 심사(며칠~몇 달)나 평판(회사 필터) 문제가 있다.
도메인 전에 공개가 먼저 필요하면 U-2의 1·4단계만 하고 `frond-site.<계정>.workers.dev`로 먼저 연다(Cloudflare는 운영에 자체 도메인을 권한다). 도메인을 사면 같은 Worker에 붙인다.

**U-1** 도메인 이름 정하기 → 에이전트에게 알려 주면 `config.ts`·`wrangler.jsonc`를 고친다

**U-2** Cloudflare (화면 이름은 2026-10 Cloudflare 문서 기준)
0. (선행) 저장소 이름 바꾸기 — [`frond-rename.md`](frond-rename.md) 1번. 4번(연결) 전에 끝낸다
1. `dash.cloudflare.com` 가입 → 이메일 인증 → **My Profile**에서 2단계 인증
2. **Domains → Register domains** → 검색 → **Purchase** → 기간 → 연락처(영문) → 결제 → **Complete purchase** → 등록자 인증 메일 확인 → **Auto-renew** 켜짐·DNSSEC 켜기
3. (에이전트) `wrangler.jsonc`에 `routes`(custom_domain)·`workers_dev: false`, `config.ts`의 `url`
4. **Workers & Pages → Create application → Import a repository → Get started** → GitHub 연결("Cloudflare Workers and Pages" 앱, **Only select repositories**) → 저장소 → 이름 `frond-site` → Root directory `website` → Build `npm run build` → Deploy `npx wrangler deploy` → **Save and Deploy**
5. Worker → **Settings → Build**: Build watch paths include `website/*`, **Enable Preview Builds**, **Deploy Hooks** 하나(이름 `release`, 브랜치 `main`) → URL을 GitHub 비밀 `CF_SITE_DEPLOY_HOOK`에(R-5 릴리스 워크플로 끝에서 부른다)
6. `www`: **DNS → Records**에 A `www` → `192.0.2.1` **Proxied** → **Rules → Create rule → Redirect Rule** 템플릿 "Redirect from WWW to root"
7. 확인: `https://<도메인>/` 200, `https://www.<도메인>/` 301, `/docs` 302

**U-3** (선택) **Web Analytics → Add a site → Manage site → "Enable with JS Snippet installation"** → 스니펫을 에이전트에게 주면 공통 레이아웃과 CSP에 넣는다.
**Compute → Email Service → Email Routing → Onboard Domain** → 받을 개인 메일 인증 → 규칙 `support` → Send to an email(받기만 된다. Store 회사 계정에 필요한 업무 이메일로도 쓸 수 있다)

비용: 도메인 값(연 약 $10~15)만. Workers·Web Analytics·Email Routing·인증서는 무료 구간이다.

## 9. 그다음 (오늘 할 일 아님 — 순서만)

| 때 | 할 일 |
|---|---|
| 도메인을 사면(U-2) | `config.ts` `url`, `wrangler.jsonc` routes, Store 개인정보처리방침 URL을 `https://<도메인>/privacy/`로 |
| GitBook 공개 뒤(gitbook-site U-1) | 사이트 '사용 설명서' 링크의 "준비 중" 표시 떼기 |
| Store 공개(R-4) | `storeUrl`(공식 배지), `purchase` 켜기, Store 스크린샷 = §6 장면 |
| GitHub Releases(R-5) | `directDownload`, `/download/windows` 302를 빌드 때 생성(README용 — winget InstallerUrl은 GitHub 버전 경로), 릴리스 워크플로 끝에서 Deploy Hook 호출(GITHUB_TOKEN으로 publish하면 `release` 이벤트가 안 생긴다), `wingetId` |
| updater(R-5, v0.1.0 전에 확정) | 엔드포인트 두 줄: `https://<도메인>/update/{{target}}/{{arch}}/{{current_version}}`(→ 302 GitHub `latest.json`) 먼저, GitHub `latest.json` 다음. 도메인 자동 갱신 필수(만료 뒤 파킹 페이지가 200이면 다음 주소로 안 넘어간다). tauri-action v1의 `latest.json`은 다운로드 주소가 GitHub API(비인증 시간당 60회)라 브라우저 다운로드 URL로 바꿔 다시 올린다 |
| 나중 | 영어 페이지 `/en/`(W8), 릴리스 노트 Atom 피드 |

## 10. 완료 조건 (오늘 할 일 A-0~A-5)

- `website/`: `npm ci && npm run build`·`npm run cf:check` 통과, `npm run cf:dev`에서 `/` 200·`/docs` 302·404
- 루트: `npm test`·`npx tsc --noEmit` 통과, `samples/raw` 그대로, 앱 코드 변경 없음(`vite.config.ts` 감시 제외 한 줄 말고)
- 장면: §6 브라우저 경로 장면 라이트·다크, 개인 경로 없음, 스크립트로 다시 만들 수 있음
- 원고: §5 섹션 전부, `CHANGELOG.md`·`docs/site/privacy.md` 있음
- 리뷰 캡처 `docs/qa/<날짜>-website/`(1280·375, 라이트·다크, 다운로드 카드 네 상태), §5-6 점검표 통과, next-session §2에 사용자 확인 항목
- 커밋은 단계마다, main에는 `--ff-only`로(푸시는 사용자가 정한다)

## 11. Cursor에 줄 첫 지시문

```text
docs/website-launch.md를 읽고 §2 시작 전 확인부터 한 뒤 A-0~A-5를 순서대로 해 줘.
계정·로그인·배포(wrangler login/deploy, Cloudflare, GitBook, gh release)는 하지 말고,
막히는 결정은 §3 표와 docs/decisions/ideas/20261006-website.md를 따르되 그래도 모르면 멈추고 물어봐.
단계마다 한국어 `{영역} - {내용}` 형식으로 커밋하고, main 푸시는 하지 마.
```
