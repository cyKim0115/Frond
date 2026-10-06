# Frond 웹사이트는 Cloudflare의 Astro 제품 페이지와 GitBook 설명서로 나눈다

2026-10-06 기준으로 Frond에 필요한 웹 자산은 두 가지다. 하나는 fork.dev처럼 앱을 소개하고 내려받게 하는 **제품 페이지**이고, 다른 하나는 GitBook으로 읽는 **사용 설명서**다. 조사 결론은 이렇다. 제품 페이지는 저장소 `website/`의 **Astro 정적 사이트**를 **Cloudflare Workers 정적 자산**으로 올리고, 설명서는 사용자가 다른 프로젝트 셋에서 이미 쓰는 **GitBook 무료 + Git Sync(`docs/site/`)**로 둔다. 돈이 드는 곳은 도메인(연 약 $10~15)뿐이다. GitBook 무료는 커스텀 도메인과 `/docs` 하위 경로를 주지 않는다(각각 연 $780, $2,988). 그래서 두 사이트는 링크로 잇고, 앱·README는 설명서를 `<도메인>/docs` 고정 주소(302)로 가리킨다. 다른 툴 사이트 13곳을 실측해 보니 1인 운영에는 fork.dev식 "긴 홈 한 장 + 다운로드 + 릴리스 노트"가 맞았다. 다만 fork.dev가 놓친 것은 따라 하지 않는다. 버전 링크를 손으로 고쳐 늦게 갱신하는 것, 묵은 스크린샷, 글자를 넣은 히어로 이미지, 개인정보처리방침이 없는 것이다. 사용 장면은 앱의 브라우저 미리보기를 헤드리스 Edge와 CDP로 찍는다. 이렇게 하면 설치본을 건드리지 않고 같은 장면을 라이트·다크 두 벌로 다시 만들 수 있다. 사용자가 "도메인을 사기 전까지는 모양만"이라고 했으므로 실행 계획은 [`website-launch.md`](../../website-launch.md)로 나눴다. 사용자 도움 없이 끝까지 할 일과, 도메인을 살 때 사용자가 할 일을 따로 적었다.

## Fork식 배포 페이지는 홈 한 장·직링크·릴리스 노트로 끝난다

fork.dev는 홈 한 장에 거의 전부를 담는다. 순서는 일러스트 히어로 → 앱 창 스크린샷 → 다운로드 띠(`Download Fork for Windows`, 밑에 `$59.99, free evaluation`) → 캐러셀 5장 → 기능 5개(제목·한 문장·그림) → 기능 목록 → 개발자 가족 소개 → 다운로드 띠 반복 → 푸터다. 구매는 Paddle 카드 한 장인 `/buy`가 맡고, 릴리스 노트는 OS별 긴 단일 페이지다(버전·날짜·`New`/`Improved`/`Fixed` 배지). 문서·검색·언어 전환·개인정보처리방침·RSS는 없다([fork.dev](https://fork.dev), [releasenoteswin](https://fork.dev/releasenoteswin), [buy](https://fork.dev/buy)). 실측에서 두 가지 약점이 드러났다. 홈 버튼은 `cdn.fork.dev/win/Fork-2.21.1.exe`를 가리키는데 같은 CDN에 2.23.1이 이미 있었고, 블로그의 옛 다운로드 버튼은 404였다. 손으로 고치는 버전 링크가 늦어지는 전형적인 사례다. 히어로의 제목 글자는 alt 없는 PNG 안에 들어 있고, 기능 그림 속 커밋 날짜는 2020~2021년이다.

| 사이트 | 히어로 미디어 | 다운로드 동선 | 릴리스 노트 | 문서 | 언어 | 호스팅 |
|---|---|---|---|---|---|---|
| Fork | 일러스트 PNG + 창 스크린샷 | OS 버튼 → 자체 CDN exe | OS별 한 페이지, 배지 | 없음 | 영어 | nginx + Cloudflare·DO Spaces |
| Typora | 글자만 | OS·CPU 판별 직링크 | 버전별 | support. Jekyll | 영어(+중국어) | Cloudflare 등 |
| Obsidian | HTML 모형 | `/download` → GitHub | 영구 링크, Atom | `/help` Publish | 15개(**ko**) | GitHub Pages + Cloudflare |
| Zettlr | 스크린샷 | 판별 → 감사 페이지 → GitHub | CHANGELOG 자동 | docs. VuePress | 영어 | Apache |
| Zed | HTML 모형 + 영상 | `/download` → API → GitHub | 채널별, RSS | `/docs` mdBook | 영어 | Cloudflare |
| Joplin | 스크린샷 | 자동 시작 + 리디렉터 | 플랫폼별 | Docusaurus | 4개 | GitHub Pages |
| Yaak(Tauri) | OS별 그림 + 테마 토글 | 서버 판별, 리디렉터, 사용자/머신 NSIS | 카드형 | `/docs` | 영어 | Railway |

출처: 각 사이트 HTML·헤더 실측(2026-10-06), 상세는 근거 노트 `site_survey.md`.

공통 패턴은 네 가지다. 첫째, 히어로는 짧은 제목·한 줄·주 버튼 하나·보조 링크·지원 OS 작은 글자로 이뤄진다. 둘째, 다운로드는 세 갈래로 나뉜다. 직링크, 감사·자동 시작 페이지(Zettlr·Sublime·Joplin), 자기 도메인 리디렉터 → GitHub Releases(Joplin·Yaak·Zed)다. 셋째, Windows 세부 안내는 들쭉날쭉하다. winget 명령은 Zettlr·Zed 문서·Raycast만, Store 배지는 Raycast만 보여 준다. **SmartScreen 안내와 설치 파일 크기 표시는 13곳 중 한 곳도 없었다.** 넷째, 한국어 사이트는 Obsidian(`/ko/`) 하나뿐이다. Frond에는 Windows 버튼 하나와 "무료" 한 줄, 그리고 직접 설치 뒤의 감사 페이지(SmartScreen·기본 앱 지정 안내)가 맞다. 설치 파일 크기도 강점이다. 6.6 MiB는 Electron 계열 Markdown 앱(Typora 108·MarkText 121·Zettlr 150·Obsidian 326·Joplin 344 MiB)보다 한 자릿수 작다(리디렉트 끝 `Content-Length` 실측). 경쟁 지형도 하나 바뀌었다. Obsidian 1.14(2026-10-05)가 단일 md 파일 열기와 기본 앱 등록을 더했다. 그래서 "md 더블클릭으로 바로 보기"만으로는 차별점이 약하다. 가벼움, 원본 보존, 한국어, AI 받은 목록을 앞에 둔다.

## 설명서는 GitBook 무료로 충분하지만 주소·블록·PR 흐름을 내준다

사용자의 GitBook 조직 cyKim은 무료 플랜이다(체험은 2026-08-11 종료, GitBook MCP로 확인). 조직은 사이트 4개를 공개 운영하고, 그중 3개는 저장소의 `docs/site`를 GitHub → GitBook 방향 Git Sync로 싣는다. 루트 `.gitbook.yaml`에는 `root: ./docs/site/`와 "사람용 문서만"이라는 주석이 있다. 같은 날 다른 세션이 Frond도 이 방식으로 연결했다([`gitbook-site.md`](../../gitbook-site.md), 아직 게시 전). GitBook 무료는 사이트 수 제한 없이 Git Sync·전문 검색·언어 variant·방문 통계·llms.txt·MCP를 준다. 대신 주소는 `*.gitbook.io`로 고정되고, "Powered by GitBook"은 어떤 플랜에서도 지울 수 없고, CSS·HTML·JS도 넣을 수 없다([GitBook Pricing](https://www.gitbook.com/pricing), [Customization](https://gitbook.com/docs/manage-your-site/customization)). 커스텀 도메인은 Essential(사이트당 월 $65, 연 결제, 옛 이름 Premium)부터, `example.com/docs` 하위 경로는 Ultimate(월 $249)부터다. 무료 Community 플랜은 협업이 필요한 오픈소스용이고 `CONTRIBUTING.md`·`CODE_OF_CONDUCT.md`와 "영리 회사와 무관"을 요구한다. 광고를 다는 Sponsored 사이트는 "주 언어가 영어가 아님"이 거절 사유라 한국어 우선인 Frond에는 맞지 않는다([Community plan](https://gitbook.com/docs/account-and-billing/plans/community), [Sponsored site plan](https://gitbook.com/docs/account-and-billing/plans/community/sponsored-site-plan)).

운영에서 걸리는 점은 둘이다. 하나는 Git Sync가 양방향이라는 것이다. GitBook에서 병합한 변경은 저장소 브랜치에 바로 커밋되고, GitHub PR과 GitBook 변경 요청은 서로 이어지지 않는다([Git Sync](https://gitbook.com/docs/docs-as-code/git-sync), [Troubleshooting](https://gitbook.com/docs/docs-as-code/git-sync/troubleshooting)). 그래서 사용자의 다른 프로젝트처럼 GitBook 쪽은 편집 잠금으로 둔다. 다른 하나는 블록 문법이다. GitHub Markdown API로 렌더해 보니 `{% hint %}`·`{% tabs %}`는 글자 그대로 보이고 `> [!NOTE]`만 알림 상자가 된다. Frond 렌더러도 GitHub Alerts만 그린다(실측). 반대로 GitBook이 `> [!NOTE]`를 알림 상자로 바꿔 주는지는 공식 문서에 없다. 블록 방침은 설명서 계획의 사용자 결정(U-2)으로 남겼다. Mermaid는 GitBook이 직접 그린다([Mermaid blocks](https://gitbook.com/docs/create-content/blocks/mermaid-blocks)).

문서 플랫폼 조사자의 1순위는 **Starlight**였다. Astro 프로젝트 하나에 랜딩(`src/pages/`)과 `/docs/`(Starlight)를 같이 두는 구성이 공식 문서에 있다. 실제 빌드에서도 `/`·`/docs/…`·`404`·sitemap·Pagefind 색인이 한 번에 나왔다. 한국어 UI 문자열(`ko.json`)도 내장돼 있다([Manual Setup: subpath](https://starlight.astro.build/manual-setup/#use-starlight-at-a-subpath), [i18n](https://starlight.astro.build/guides/i18n/)). 한국어 검색도 실측했다. Pagefind 1.5.2는 한국어를 공백 단위 어절로 색인하고 질의를 앞부분 일치로 찾는다. 그래서 "테마"로 "테마를·테마의"는 찾지만, "저장하다"로 "저장합니다"는 못 찾고 어절 가운데("마를")도 못 찾는다. 기본 발음 구별 기호 정규화 때문에 "새"가 "색"에 걸리는 잡음도 있다([Multilingual search](https://pagefind.app/docs/multilingual/), [Pagefind#1212](https://github.com/Pagefind/pagefind/pull/1212)). 수십 쪽 설명서에는 충분한 수준이다. Starlight의 대가는 0.x라는 점이다. 0.38~0.42에서 마이너마다 깨짐 변경이 1~3건 나왔고, Astro 메이저도 2026년에만 두 번 바뀌었다([Starlight CHANGELOG](https://github.com/withastro/starlight/blob/main/packages/starlight/CHANGELOG.md)). 이 보고서는 사용자의 선택(GitBook)을 따르고, Starlight는 다시 볼 조건과 함께 `DEFER`로 남긴다. 조건은 GitBook 한국어 검색이 기본 질의에 실패할 때, 설명서를 자체 도메인에 둬야 할 때, Git Sync가 저장소 작업과 부딪힐 때다.

| 기준 | GitBook Free(채택) | Starlight(대안) |
|---|---|---|
| 비용 | 0원 | 0원 |
| 주소·디자인 | `cykim.gitbook.io/frond`, 배지 고정, CSS 불가 | 제품 페이지와 같은 도메인·디자인 |
| 한국어 | UI ko 있음, 검색 품질 미확인 | UI ko 내장, 앞부분 일치 검색 실측 |
| 원본 이식성 | `{% %}` 블록은 GitHub·Frond에서 글자 | GitHub Alerts·상대 링크를 플러그인으로 그대로 |
| 운영 | 관리 0, 편집 잠금 필요, PR 미연동 | 버전 고정·분기마다 갱신, 일반 PR |
| 사용자 관례 | 다른 프로젝트 3개와 같음 | 새로 익힘 |

## 호스팅은 Cloudflare Workers 정적 자산이고 돈은 도메인에만 든다

Cloudflare는 Pages 문서 첫머리에 "Start new projects with Workers"라고 적어 두었다. Workers는 정적 사이트에 필요한 `_redirects`·`_headers`·미리보기·커스텀 도메인·Git 빌드·Deploy Hook을 모두 갖췄고, Worker 스크립트 없이 정적 파일만 올리면 요청은 무료·무제한이다([Cloudflare Pages](https://developers.cloudflare.com/pages/), [Static assets billing](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/)). Astro 정적 출력은 어댑터 없이 `wrangler.jsonc`의 `assets.directory`만으로 올라간다([Cloudflare Docs: Astro](https://developers.cloudflare.com/workers/framework-guides/web-apps/astro/)). Workers의 실질 제약은 도메인 네임서버가 Cloudflare에 있어야 한다는 것 하나다. 무료 한도는 파일 20,000개, 파일당 25 MiB, `_redirects` 2,100개, `_headers` 100규칙, 빌드 월 3,000분·동시 1·20분이다([Workers Limits](https://developers.cloudflare.com/workers/platform/limits/), [Builds limits](https://developers.cloudflare.com/workers/ci-cd/builds/limits-and-pricing/)). 제품 페이지는 이 한도에 한참 못 미친다. Git 연동(Workers Builds)은 루트 디렉터리를 `website`로 두고 감시 경로를 `website/*`로 두면 된다. 그러면 main push는 운영 배포가 되고 다른 브랜치는 Preview URL이 된다. 대시보드의 Worker 이름은 `wrangler.jsonc`의 `name`과 같아야 하고, 설정 파일 없이 연결하면 자동 구성이 SSR 어댑터를 넣으므로 설정 파일을 먼저 커밋한다([Builds](https://developers.cloudflare.com/workers/ci-cd/builds/)). 이 PC에서 확인한 바로는 `wrangler deploy --dry-run`이 로그인 없이 통과했다. `wrangler dev`에서는 `_redirects`의 `/docs` 302와 `not_found_handling: "404-page"`가 그대로 동작했다(wrangler 4.147.0). 따라서 계정 없이도 배포 설정을 끝까지 검증할 수 있다.

다른 호스팅은 Frond에 덜 맞다. Vercel Hobby는 "Hobby teams are restricted to non-commercial personal use only"이고 "제품·서비스 판매 광고"도 상업으로 본다. Store add-on을 소개할 사이트에는 맞지 않는다([Vercel fair use](https://vercel.com/docs/limits/fair-use-guidelines)). Netlify 무료는 월 300 크레딧을 넘기면 계정 전체가 멈춘다([Netlify Pricing](https://www.netlify.com/pricing/)). GitHub Pages는 예비안으로는 충분하다. 다만 "online business, e-commerce site" 용도를 금지하는 문구가 있고 경로가 `/MdEditor/`가 된다([Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)).

도메인은 Cloudflare Registrar가 원가로 팔고 네임서버도 자동으로 잡아 주므로 Workers 커스텀 도메인까지 가는 길이 가장 짧다. `.kr`은 팔지 않는다(TLD Policies 397개 항목 실측, [Registrar](https://developers.cloudflare.com/registrar/)). `frond.app`·`frond.dev`·`frond.com`·`frond.io`는 이미 남의 것이다(RDAP·DNS 실측). 기록이 없는 후보는 `frond.page`·`getfrond.app`·`frondapp.dev`·`frondmd.app`·`frondeditor.com`·`frondmd.com`이다. 가격은 공식 표가 로그인 뒤에만 보여 제3자 집계만 확인했다(`.com` $10.46, `.app` 갱신 $14.20, `.page` $10.20 — Low). 무료 도메인은 쓰지 않는다. `workers.dev`는 무료지만 Cloudflare가 "personal or hobby projects"용이라고 하고 운영에는 자체 도메인을 권한다([workers.dev](https://developers.cloudflare.com/workers/configuration/routing/workers-dev/)). 그래서 도메인을 사기 전에 공개가 먼저 필요할 때만 임시로 쓴다. `is-a.dev`는 자원봉사 심사라 24~72시간에서 2주가 걸리고 루트 이름은 소프트웨어 개발 관련이어야 한다([is-a.dev FAQ](https://docs.is-a.dev/faq/)). `js.org`는 JavaScript 생태계 프로젝트만 받는다. `eu.org`는 승인이 며칠에서 몇 달까지 걸린다. `dpdns.org`·`pp.ua` 같은 무료 하위 도메인은 회사 필터·평판에서 불리할 수 있다(Perplexity 요약, Low). 설치 파일을 배포하는 사이트에서는 평판이 비용보다 무겁다.

## 다운로드·업데이트 주소는 빌드 데이터와 자기 도메인으로 묶는다

설치 파일은 GitHub Releases에 둔다. 버전·크기·SHA256은 사이트 빌드 때 GitHub API `releases/latest`에서 받아 버튼과 표에 넣는다. 자산마다 `digest: "sha256:…"`가 있다(`gh api` 실측, [REST: Release assets](https://docs.github.com/en/rest/releases/assets)). 손으로 고치는 fork.dev식 버전 링크가 늦어지는 문제를 이렇게 피한다. 릴리스가 없으면 API가 404를 주므로 사이트는 "준비 중"으로 빌드돼야 한다. 비인증 API는 IP당 시간 60회라 빌드 때 한 번만 부른다. 짧은 링크 `/download/windows`(302)는 README·블로그용으로만 쓴다. winget 정책은 `InstallerUrl`이 ISV 배포 위치여야 하고 리디렉터는 `Validation-Indirect-URL`로 거절하기 때문이다([winget policies](https://learn.microsoft.com/en-us/windows/package-manager/package/windows-package-manager-policies), [Submit your manifest](https://learn.microsoft.com/en-us/windows/package-manager/package/repository)). 릴리스 직후 재배포에는 함정이 하나 있다. tauri-action이 `GITHUB_TOKEN`으로 릴리스를 publish하면 `on: release: published` 워크플로가 돌지 않는다("events triggered by the GITHUB_TOKEN will not create a new workflow run"). 그래서 릴리스 워크플로 마지막 단계에서 Workers Builds의 Deploy Hook URL을 직접 호출한다([GITHUB_TOKEN](https://docs.github.com/en/actions/concepts/security/github_token), [Deploy Hooks](https://developers.cloudflare.com/workers/ci-cd/builds/deploy-hooks/)).

Tauri updater 엔드포인트는 앱에 박히므로 v0.1.0 전에 정한다. updater는 reqwest 기본값대로 리디렉트를 최대 10홉 따라가고, 비-2xx일 때만 다음 엔드포인트로 넘어간다([Tauri v2 Updater](https://v2.tauri.app/plugin/updater/), [updater.rs](https://github.com/tauri-apps/plugins-workspace/blob/v2/plugins/updater/src/updater.rs)). 그래서 `[자기 도메인 /update/{{target}}/{{arch}}/{{current_version}} → 302 GitHub latest.json, GitHub latest.json]` 두 줄이 성립하고, 앱을 고치지 않고 호스팅을 바꿀 수 있다. 대가가 두 가지 있다. 첫째, 도메인이 만료된 뒤 파킹 페이지가 200 HTML을 주면 JSON 파싱 오류로 끝나 다음 주소로 넘어가지 않는다. 그래서 자동 갱신이 운영 규칙이 된다. 둘째, tauri-action v1은 `latest.json`의 다운로드 주소에 `api.github.com/.../releases/assets/<id>`를 쓰고, 이 주소는 비인증 API 한도를 쓴다. 그래서 브라우저 다운로드 URL로 바꿔 다시 올린다([tauri-action CHANGELOG](https://github.com/tauri-apps/tauri-action/blob/dev/CHANGELOG.md), 다른 저장소 2곳의 `latest.json` 실측). 이 항목은 Store판에는 updater가 없으므로 R-5(Store 밖 배포)에서 적용한다.

Store가 열리면 다운로드 카드는 공식 웹 컴포넌트 `ms-store-badge`(`language="ko"`)를 쓴다. 한국어 배지 SVG는 `ko` 경로만 있고 `ko-kr`은 404다([microsoft/app-store-badge](https://github.com/microsoft/app-store-badge/blob/main/README.md), 실측). winget은 `winget install --id cyKim.Frond -e --source winget` 한 줄에 복사 버튼을 붙인다. SmartScreen 안내는 Microsoft 문서대로 처음 얼마간 경고가 뜰 수 있음을 알린다. 이 사이트·GitHub에서 받았는지와 SHA256(`Get-FileHash`)을 확인한 뒤 '추가 정보' → '실행'을 누르게 하고, SmartScreen을 끄라고는 하지 않는다. 스마트 앱 컨트롤이 켜진 Windows 11은 서명 없는 설치기를 경로와 관계없이 막을 수 있다([SmartScreen reputation](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/smartscreen-reputation)).

## 사용 장면은 스크립트로 다시 찍는 실제 화면이다

참고 사이트의 미디어는 세 갈래다. 실제 캡처 + CSS 그림자(Fork), 기능별 짧은 클립(Typora·Raycast·Zed), HTML로 다시 그린 앱 모형(Obsidian·Linear)이다. HTML 모형은 앱이 바뀔 때마다 고쳐야 해 1인 운영에 부담이다. Frond는 UI가 웹 기술이라 CDP로 테마·배율·연출을 제어할 수 있다. 앱의 브라우저 미리보기(`?sample=a.md,b.md&mode=source`)는 제목 표시줄·탭 띠·창 버튼까지 `index.html`에 있어 실제 앱과 같은 화면을 그린다. 앱 기본 테마가 '시스템 설정 따르기'이므로 `Emulation.setEmulatedMedia`의 `prefers-color-scheme`만 바꾸면 같은 장면을 라이트·다크 두 벌로 찍는다. `prefers-reduced-motion: reduce`를 켜면 테마 전환 연출이 0이 되어 정지 화면이 흔들리지 않는다. 원본은 앱 기본 창 1100×800 CSS px(`lib.rs` `inner_size`)를 DPR 2로 찍은 2200×1600 PNG다. 이 크기는 Store 데스크톱 스크린샷 규격(PNG, 1366×768 이상, 최대 10장, 문구를 덧붙이지 말 것)을 그대로 만족한다([MS Learn: screenshots](https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msix/screenshots-and-images)). 폴더 트리·AI 받은 목록·비교·인코딩 메뉴는 Tauri 커맨드나 실제 파일이 있어야 하므로, 식별자를 바꾼 디버그 빌드로 따로 찍는다.

규격은 이렇게 잡는다. 히어로는 정지 화면 한 장을 Astro `<Picture>` AVIF/WebP로 넣고 `priority`를 주며 250 KB 이하로 맞춘다. 영상 히어로는 LCP·용량·동작 줄이기에 모두 불리하다([web.dev: LCP](https://web.dev/articles/lcp), [Fetch Priority](https://web.dev/articles/fetch-priority)). 움직임은 기능별 3~8초 무음 MP4(H.264, CRF 23~28, faststart, 300~900 KB)로 보여 준다. GIF는 쓰지 않는다. 같은 10초 클립이 GIF로는 9.1 MB, MP4로는 0.36 MB였다(실측, [web.dev: Replace GIFs with video](https://web.dev/articles/replace-gifs-with-videos)). 자동 재생은 `muted playsinline`에 화면에 보일 때만 재생하는 스크립트를 붙인다. 동작 줄이기 설정이면 포스터만 보이고, 5초 넘게 반복하므로 멈춤 버튼을 둔다([MDN: Autoplay](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay), [prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)). 걸리는 점이 하나 있다. Cloudflare Pages 문서는 Range 요청에 200을 준다고 적고 있고, Workers 정적 자산도 같았다(실측 2곳). Safari는 동영상에 206을 기대하므로 배포 뒤 iPhone 재생을 확인해야 한다([Serving Pages](https://developers.cloudflare.com/pages/configuration/serving-pages/)). 개인정보도 점검한다. 상태바에 파일 전체 경로가 보이고, 기존 QA 캡처에는 `C:\Users\cykim\…`가 찍혀 있다. 그래서 데모 문서는 지어낸 내용으로 쓰고 `C:\FrondDemo\` 같은 중립 경로에서 연다.

## 출처 충돌과 판단

| 주제 | 출처 A | 출처 B | 판단 |
|---|---|---|---|
| Pagefind 한국어 분할 | Perplexity 요약: `Intl.Segmenter`로 "테마를"을 "테마+를"로 나눈다 | 실측·소스: 한국어는 공백 단위, 질의 분할은 zh·ja·th만, PR #1212 닫힘 | 실측을 따른다. 찾는 이유는 분할이 아니라 앞부분 일치다 |
| 문서 플랫폼 1순위 | 조사자: Starlight(조건을 모두 만족) | 사용자: GitBook 선택, 다른 프로젝트 3개 관례 | GitBook 채택, Starlight는 조건부 DEFER |
| GitBook 유료 플랜 이름 | 비교표 문구 "Premium" | 가격표 "Essential" | 같은 플랜(월 $65, 연 결제). 이름만 바뀌는 중 |
| 정적 사이트에 Pages vs Workers | Perplexity 요약: 제품 사이트는 `pages.dev`가 낫다 | Cloudflare Pages 문서: "Start new projects with Workers" | 1차 문서를 따른다 |
| 무료 도메인 평판 | 무료 하위 도메인은 회사 필터에 불리할 수 있다(Perplexity, Low) | 공식 차단 목록 근거 없음 | 설치 파일 배포 사이트라 보수적으로 쓰지 않는다 |
| 라이트/다크 두 벌 사례 | 사이트 조사: Yaak·Sublime이 테마 토글 | 미디어 조사: 본 6곳은 모두 한 벌 | 둘 다 맞다(본 사이트가 다름). Frond는 히어로만 두 벌 |
| 캡처 창 크기 | 계획 초안 1280×800 | 앱 기본 창 1100×800(`lib.rs`) | 1100×800 — 실제 첫 화면과 같고 글자가 같은 크기로 보인다 |

## 실기·가입 화면에서만 닫히는 항목

| 미확인 | 걸리는 것 | 확인 방법 |
|---|---|---|
| GitBook 공개 사이트의 한국어 검색 품질 | W3-alt(Starlight 전환) | 게시 뒤 "테마·인코딩·기본 앱" 검색 |
| GitBook이 `> [!NOTE]`를 알림 상자로 그리는지 | 설명서 블록 방침(U-2) | 설명서 계획 A-3에서 시험 |
| 브라우저 미리보기 화면이 실제 앱 첫 화면과 같은지(아이콘 글꼴·창 버튼) | 사용 장면 경로 | 첫 캡처를 실제 앱 캡처와 비교 |
| Cloudflare 정적 자산의 Range 응답과 iPhone Safari 재생 | 기능 클립 | 배포 뒤 `curl -r 0-1 -I`·실기 |
| Cloudflare Registrar 공식 가격, 후보 도메인 구매 가능 여부 | U-1·U-2 | 대시보드 검색 |
| Web Analytics가 Worker 서빙 페이지에 자동 삽입되는지(보고 엇갈림) | U-3 | 스니펫 직접 삽입으로 회피 |
| Workers Builds의 저장소 클론 깊이(설명서 쪽 `lastUpdated`·Git 기록) | Starlight로 옮길 때만 | 빌드 로그 |
| Store 배지 사용 규칙의 1차 문서 | Store 공개 뒤 다운로드 카드 | Partner Center·배지 생성기 |
| 저장소 이름 변경(`Frond`) 뒤 Git Sync·Workers Builds 연결이 이어지는지 | U-2, 설명서 | 이름을 먼저 바꾸고 연결 |

## 결론

이번 조사로 분명해진 것은, Frond 웹사이트에서 정할 것이 기술 선택보다 **주소를 어디에 묶느냐**라는 점이다. 설치 파일·updater·설명서·개인정보처리방침 주소는 한 번 퍼지면 Store 목록, winget 매니페스트, 이미 설치된 앱 안에 남는다. 그래서 자기 도메인 하나를 사서 `/docs`, `/privacy/`, `/download/windows`, `/update/…`를 모두 그 아래 고정 주소로 두고, 실제 위치(GitBook, GitHub Releases)는 리디렉트 뒤에 숨긴다. 이렇게 하면 나중에 GitBook을 Starlight로 바꾸거나 바이너리를 R2로 옮겨도 밖에 퍼진 링크는 깨지지 않는다. 그 대가로 도메인 자동 갱신이 운영 규칙이 된다.

두 번째로, 1인 운영 사이트가 신뢰를 잃는 길은 화려함이 모자라서가 아니라 **낡아서**다. fork.dev도 홈 버튼이 두 버전 늦었고 스크린샷이 몇 년 묵었다. Frond는 버전·크기·SHA256을 빌드 데이터에서 넣고, 사용 장면을 스크립트로 다시 찍는다. 그러면 "출시할 때마다 사이트가 저절로 맞는" 구조가 된다. 사용 장면 스크립트는 설명서 그림과 Store 스크린샷까지 같은 원본으로 채운다. 그래서 오늘 할 일의 첫 실질 작업은 페이지 디자인이 아니라 장면 캡처 스크립트다.

---

근거 노트: `docs/research/research_notes/Frond 웹사이트 구축 방법/` (site_survey.md — 사이트 13곳, docs_platforms.md — GitBook·Starlight·Pagefind 한국어 실측, cloudflare_deploy.md — Workers·도메인·다운로드·updater, media_and_scenes.md — 미디어 규격·캡처·다운로드 부가 요소).
이 세션의 직접 확인: GitBook 조직·사이트·Git Sync 상태(GitBook MCP, 읽기만), 도메인 RDAP·DNS 조회, `wrangler deploy --dry-run`·`wrangler dev`(`/docs` 302·404), Store 스크린샷 규격(MS Learn), 앱 기본 창 크기(`src-tauri/src/lib.rs`), 브라우저 미리보기 구조(`src/main.ts`·`index.html`), Perplexity 교차 질의 4건(GitBook 무료 범위, Cloudflare Workers·Registrar, Starlight·Pagefind·updater 리디렉트, 무료 도메인).
실행 계획: [`website-launch.md`](../../website-launch.md) · 결정: [`decisions/ideas/20261006-website.md`](../../decisions/ideas/20261006-website.md). 조사일 2026-10-06. 가격·약관은 바뀔 수 있으니 구매·가입 직전에 다시 확인한다.
