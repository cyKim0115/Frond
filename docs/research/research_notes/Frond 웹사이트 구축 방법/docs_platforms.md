# 문서 사이트 플랫폼: GitBook 호스팅 vs 정적 사이트 생성기(Starlight 등) (2026-10 기준)

> 조사일 2026-10-06. 대상: Frond 사용자 문서 사이트("GitBook처럼 읽히는 문서"). GitBook(gitbook.com)을 그대로 쓰는 안과 Astro Starlight 등 정적 생성기로 직접 만드는 안을 비교한다. 판단 조건: 한국어 우선(영어는 나중), 1인 개발, 0원 지향, Cloudflare 호스팅, 같은 저장소의 Markdown을 PR로 관리, 랜딩+문서 동시 운영, 문서 원본을 Frond로 열어 편집(도그푸딩).
> 표기: **[실측]** = 이번에 직접 확인·실행한 것. 실험 폴더 `D:\Temp\claude\C--Users-cykim-repo-MdEditor\dfe4b606-d912-448b-a458-af661e2e6661\scratchpad\docs-test\`(`pf-ko\` Pagefind 한국어 시험, `sl-ko\` Starlight 시험 사이트, `raw\` 내려받은 원문). 환경 Node 24.18.0, pagefind 1.5.2, astro 7.3.5, @astrojs/starlight 0.42.5. **[Low]** = 블로그·포럼·검색 요약. **[오래됨?]** = 2025년 이전 정보.
> 범위 밖: 다른 앱의 제품·다운로드 사이트 구성, Cloudflare 배포·도메인·다운로드 호스팅 세부, 스크린샷·동영상 형식(다른 조사자 담당).

## Q1. GitBook(gitbook.com) 2026 현재

### Takeaway
GitBook 무료 플랜으로도 Git Sync·전문 검색·언어별 variant·방문 통계가 되는 사이트를 개수 제한 없이 올릴 수 있다. 다만 주소는 `*.gitbook.io`로 고정되고, "Powered by GitBook" 링크는 어떤 플랜에서도 지울 수 없으며, CSS·HTML·JS도 넣을 수 없다. 커스텀 도메인은 Essential(사이트당 월 $65, 연 결제)부터, `example.com/docs` 하위 경로는 Ultimate(사이트당 월 $249, 연 결제)부터 된다. 무료 Community 플랜은 협업이 필요한 오픈소스용이고, 광고형 Sponsored 사이트는 주 언어가 영어가 아니면 거절 사유가 된다. Git Sync는 저장소 하위 폴더를 원본으로 쓸 수 있다. 하지만 GitBook이 브랜치에 직접 커밋하므로 보호 브랜치라면 규칙 우회를 허용해야 하고, GitHub PR과 GitBook 변경 요청은 서로 이어지지 않는다.

### Cited Findings
**요금제와 무료 플랜**(가격표 HTML의 텍스트·FAQ JSON-LD를 직접 뽑아 확인 **[실측]**)
- 연 결제 기준 월액: Free $0(사용자 1명), Essential 사이트당 $65, Ultimate 사이트당 $249, 사용자 추가는 월 $12, Enterprise 별도. 원문 "Premium starts at $65 per site/month and Ultimate at $249 per site/month when billed annually". AI 크레딧은 사이트당 월 2,000(Essential)·10,000(Ultimate). 환불 없음 — [GitBook Pricing](https://www.gitbook.com/pricing) (accessed 2026-10-06, confidence: High)
- Essential은 예전 Premium의 새 이름이다(비교표 문구에는 아직 "Premium") — [Plans](https://gitbook.com/docs/account-and-billing/plans) (accessed 2026-10-06, confidence: High)
- Free 포함: 트래픽 무제한, Git Sync, Full text search, Site variants, Page view analytics, Preview deployments, Basic customization(주 색·모서리·라이트/다크 토글), llms.txt·.md 버전, MCP server, GitBook Agent 주 10메시지 — [GitBook Pricing](https://www.gitbook.com/pricing) (accessed 2026-10-06, confidence: High)
- 원문 "GitBook offers unlimited basic sites for free." variant 여러 개(한국어·영어)인 사이트도 청구상 1개 — [Site and member costs](https://gitbook.com/docs/account-and-billing/billing-faq/plan-and-member-costs) (accessed 2026-10-06, confidence: High)
- Essential부터: Custom domain, 고급 꾸미기(로고·글꼴·푸터), 리디렉트, Search analytics, User feedback, PDF export, AI Assistant Ask, 자동 번역. Ultimate부터: Site sections, Custom subdirectory, Custom fonts, Authenticated access — [GitBook Pricing](https://www.gitbook.com/pricing) (accessed 2026-10-06, confidence: High)
- 어떤 플랜에서도 불가: 배치 변경, CSS·HTML·JS 삽입, 배지 제거("It’s not possible to remove the small “Powered by GitBook” link") — [Customization](https://gitbook.com/docs/manage-your-site/customization) (accessed 2026-10-06, confidence: High)

**오픈소스·비영리 무료 프로그램**
- Community 플랜: 비영리·오픈소스·교육 그룹 무료, "all Ultimate plan features except SAML SSO". 오픈소스 조건은 GitHub/GitLab 공개, "not associated with a for-profit or venture-backed company", `README.md`·`CONTRIBUTING.md`·`LICENSE`·`CODE_OF_CONDUCT.md` 필수다. 조직 URL과 저장소 링크를 메신저나 support@gitbook.com으로 보내 신청하고, 거절 사유는 자세히 알려 주지 않는다. 협업이 필요 없으면 "your needs should be covered by our Free plan!"이라고 Free를 권한다 — [Community plan](https://gitbook.com/docs/account-and-billing/plans/community) (accessed 2026-10-06, confidence: High)
- Sponsored site(광고를 다는 대신 Ultimate 기능 무료)는 Community 플랜 사용자만 쓴다. 공개 7일 뒤 심사하며, 거절 사유에 "The site is not published in English as it's primary language"와 최소 페이지뷰 미달이 있다 — [Sponsored site plan](https://gitbook.com/docs/account-and-billing/plans/community/sponsored-site-plan) (accessed 2026-10-06, confidence: High)

**Git Sync**
- 양방향: GitBook에서 병합한 변경 요청은 저장소 커밋으로, 저장소 커밋은 GitBook으로 간다 — [Git Sync](https://gitbook.com/docs/docs-as-code/git-sync) (accessed 2026-10-06, confidence: High)
- 설정 파일 셋: 사이트 단위 `gitbook-docs.yaml`(space↔디렉터리, `key`를 바꾸면 새 space가 생겨 링크가 깨짐), space 단위 `.gitbook.yaml`(`root` 기본 `./`, `structure.readme` 기본 README.md, `structure.summary` 기본 SUMMARY.md, `redirects`), 목차 `SUMMARY.md`(없으면 폴더로 추정하고 GitBook이 만들거나 고침) — [Content configuration](https://gitbook.com/docs/docs-as-code/git-sync/content-configuration) (accessed 2026-10-06, confidence: High)
- 하위 폴더는 Project directory나 `.gitbook.yaml`의 `root: ./docs/`로 지정한다. space 폴더마다 `.gitbook.yaml`·README.md·SUMMARY.md·`.gitbook/assets/`(업로드 이미지)가 놓이고 space끼리 자산을 공유하지 않는다 — [Monorepos](https://gitbook.com/docs/docs-as-code/git-sync/monorepos), [Write & Edit Docs skill](https://gitbook.com/docs/skill/write-docs) (accessed 2026-10-06, confidence: High)
- 운영 제약: 보호 브랜치면 `gitbook-com` 앱의 규칙 우회를 허용해야 한다("Require a pull request before merging" 포함). "Does Git Sync also sync pull requests? No." README는 저장소에서만 관리하고, GitBook이 기존 파일 대신 새 파일을 만들 수 있으며, 파일당 100MB, `.js` 같은 "unsafe" 파일은 동기화를 막는다 — [Troubleshooting](https://gitbook.com/docs/docs-as-code/git-sync/troubleshooting) (accessed 2026-10-06, confidence: High). 가져오기는 5,000쪽까지 — [Import](https://gitbook.com/docs/getting-started/import) (accessed 2026-10-06, confidence: High)
- GitBook이 내보낼 때 Markdown을 자기 규칙(예: 글머리표는 늘 `*`)으로 정규화하고 다른 표기는 다음 동기화에 되돌린다는 제3자 정리 **[Low]** — [git-sync-normalization](https://github.com/StephenDaDev/git-sync-normalization) (accessed 2026-10-06, confidence: Low)

**GitBook 전용 블록이 GitHub·일반 뷰어에서 보이는 모양 [실측]**
- 문법: `{% hint style="info" %}…{% endhint %}`, `{% tabs %}{% tab title="…" %}…{% endtab %}{% endtabs %}` — [Hints](https://gitbook.com/docs/create-content/blocks/hint), [Tabs](https://gitbook.com/docs/create-content/blocks/tabs) (accessed 2026-10-06, confidence: High)
- GitHub Markdown API(`POST /markdown`, `gfm`)로 렌더하면 `{% hint %}`·`{% tabs %}`와 Starlight `:::note`는 문단 글자로 그대로 보이고, `> [!NOTE]`만 알림 상자(`markdown-alert-note`)가 된다 — [GitHub REST: Markdown](https://docs.github.com/en/rest/markdown/markdown) (accessed 2026-10-06, confidence: High)
- Frond 렌더러도 GitHub Alerts 5종만 처리하고 `{% %}`·`:::`는 처리하지 않는다(`src/render/alerts.ts`, `src/render/index.ts`) **[실측]** (confidence: High)

**다국어·검색**
- variants로 언어·버전별 space를 한 사이트에 올리고 언어를 지정하면 오른쪽 위 언어 선택기가 된다. Free 포함 — [Content variants](https://gitbook.com/docs/manage-your-site/site-structure/variants) (accessed 2026-10-06, confidence: High)
- 자동 번역은 AI 크레딧을 쓴다(Essential 1천 단어당 30크레딧, Ultimate 포함). $25/월 add-on은 legacy 전용이고 번역본은 편집할 수 없다 — [Plans](https://gitbook.com/docs/account-and-billing/plans), [Translations](https://gitbook.com/docs/gitbook-agent/translations) (accessed 2026-10-06, confidence: High)
- UI 현지화는 "Localize user interface" 설정 — [Extra configuration](https://gitbook.com/docs/manage-your-site/customization/extra-configuration) (accessed 2026-10-06, confidence: High). 공개 렌더러에 `ko.ts` 있음(PR #3986, 2026-02-10 병합) **[실측]** — [GitbookIO/gitbook translations](https://github.com/GitbookIO/gitbook/tree/main/packages/gitbook/src/intl/translations) (accessed 2026-10-06, confidence: High)
- 전문 검색은 "Ask or search" 상자. GitBook AI는 색인하려고 콘텐츠를 OpenAI로 보낸다(학습 미사용, 반영 최대 1시간) — [Searching](https://gitbook.com/docs/create-content/searching-your-content), [GitBook AI](https://gitbook.com/docs/create-content/searching-your-content/gitbook-ai) (accessed 2026-10-06, confidence: High). AI 채팅의 한·중·일 IME Enter 오전송 이슈 #3941은 닫힘 — [#3941](https://github.com/GitbookIO/gitbook/issues/3941) (accessed 2026-10-06, confidence: Medium)

**도메인·하위 경로·종속**
- 기본 주소 `[subdomain].gitbook.io`. 커스텀 도메인은 CNAME이고, Cloudflare면 프록시를 끈 "DNS only", CAA가 있으면 `pki.goog` 허용 — [Set a custom domain](https://gitbook.com/docs/publish/custom-domain) (accessed 2026-10-06, confidence: High)
- `example.com/docs`는 GitBook의 프록시 URL로 fetch하는 Cloudflare Worker로 연결하며 Ultimate 이상 — [Subdirectory with Cloudflare](https://gitbook.com/docs/publish/custom-domain/setting-a-custom-subdirectory/configuring-a-subdirectory-with-cloudflare) (accessed 2026-10-06, confidence: High)
- Git Sync 원본은 Markdown과 `.gitbook/assets`로 저장소에 남지만 블록·SUMMARY.md·`.gitbook/*`는 GitBook 전용이다. PDF 내보내기는 Essential·Ultimate 사이트만 — [PDF export](https://gitbook.com/docs/publish/pdf-export) (accessed 2026-10-06, confidence: High)
- 공개 렌더러(GPL-3.0, Next.js)는 "the rendering portion"만 셀프 호스팅할 수 있어 콘텐츠는 여전히 GitBook에서 온다 — [GitbookIO/gitbook](https://github.com/GitbookIO/gitbook) (accessed 2026-10-06, confidence: High)

### Gaps
- GitBook 공개 사이트에서 한국어 검색이 얼마나 잘 되는지(조사 붙은 어절, 부분 일치) 공식 문서나 사례를 찾지 못했다. 검색이 서버 측 API를 거쳐서 curl로는 시험할 수 없었다.
- `> [!NOTE]`(GitHub Alerts)를 Git Sync로 가져오면 hint로 바뀌는지, 인용문으로 남는지 공식 문서에 없다.
- 월 결제 단가 원문을 확인하지 못했다(제3자 요약은 Essential 월 결제 $79 **[Low]** — [documentation.ai](https://documentation.ai/blog/gitbook-pricing), accessed 2026-10-06, confidence: Low). UI 현지화 설정의 플랜 제한 여부도 문서에 없다.
- Frond가 Store에서 유료 add-on을 팔 경우 Community 플랜의 "for-profit과 무관" 조건을 통과할지 알 수 없다. 신청해 봐야 안다.

## Q2. Astro Starlight 2026 현재

### Takeaway
Starlight 0.42.5(2026-10-01, Astro 7 기반)는 한국어 UI 문자열이 내장돼 있다. `root` 로캘을 쓰면 접두사 없는 한국어 단일 언어 사이트가 된다. Pagefind 검색, 다크 모드, 사이드바 자동 생성, 편집 링크, 마지막 수정일, sitemap, 이미지 최적화가 기본으로 들어 있다. 문서는 `src/content/docs/docs/`에, 랜딩·다운로드 페이지는 `src/pages/`에 두는 "하위 경로" 구성이 공식 문서에 있다. 이번 실측에서도 빌드 한 번으로 `/`(자체 랜딩)와 `/docs/…`(Starlight)가 함께 나왔다. 대가는 0.x 버전이라 마이너마다 깨짐 변경이 1~3건씩 나오고, Astro 메이저도 2026년에만 두 번(6·7) 바뀌었다는 점이다.

### Cited Findings
**버전 [실측] `npm view`**
- @astrojs/starlight 0.42.5(2026-10-01), astro 7.3.5(2026-09-24). peer `astro ^7.2.10`, 의존성에 `pagefind ^1.5.2`·`@pagefind/default-ui`·`@astrojs/sitemap`·`remark-directive` — [npm @astrojs/starlight](https://www.npmjs.com/package/@astrojs/starlight) (accessed 2026-10-06, confidence: High)
- 마이너 릴리스 0.38.0(2026-03-11)·0.39.0(05-07)·0.40.0(06-09)·0.41.0(06-23)·0.42.0(09-02). CHANGELOG의 "BREAKING"은 0.38~0.42에서 마이너마다 1~2건 — [Starlight CHANGELOG](https://github.com/withastro/starlight/blob/main/packages/starlight/CHANGELOG.md) (accessed 2026-10-06, confidence: High). Astro 메이저는 6.0.0(2026-03-10)·7.0.0(2026-06-22) — [npm astro](https://www.npmjs.com/package/astro) (accessed 2026-10-06, confidence: High)

**기능**(공식 문서를 GitHub 원본 MDX로 확인)
- i18n: `locales`·`defaultLocale`, 미번역 쪽 대체 콘텐츠와 안내, RTL. `root` 로캘(`lang` 필수)은 접두사 없이 서비스되고, "To create a single language site in another language, set it as the `root`"하면 언어 선택기 없이 그 언어 UI가 된다 — [Internationalization](https://starlight.astro.build/guides/i18n/) (accessed 2026-10-06, confidence: High)
- 한국어 UI 내장: `ko.json` 31개 문자열이 영어 키 28개를 모두 덮는다(검색·목차·페이지 편집·마지막 업데이트·참고/팁/주의/위험·어두운/밝은/자동 테마 등) — [ko.json](https://github.com/withastro/starlight/blob/main/packages/starlight/src/translations/ko.json) (accessed 2026-10-06, confidence: High). **[실측]** 빌드 결과 `<html lang="ko">`, "검색·목차·콘텐츠로 이동·페이지 편집·다음 페이지" 출력
- 검색은 기본 Pagefind(설정 불필요, `pagefind: false`·`data-pagefind-ignore`로 제외), Algolia는 공식 플러그인 `@astrojs/starlight-docsearch` — [Site Search](https://starlight.astro.build/guides/site-search/) (accessed 2026-10-06, confidence: High)
- 사이드바는 수동 링크·그룹 또는 `items: [{ autogenerate: { directory } }]`(기본 파일 id 알파벳순) — [Sidebar](https://starlight.astro.build/guides/sidebar/) (accessed 2026-10-06, confidence: High)
- `editLink.baseUrl`(편집 링크), `lastUpdated`(기본 false, Git 기록 기반이라 얕은 클론 배포에선 부정확할 수 있다고 명시), `credits`("Built with Starlight", 기본 false), `customCss`·`head`·`components`(덮어쓰기)·`plugins` — [Configuration](https://starlight.astro.build/reference/configuration/) (accessed 2026-10-06, confidence: High)
- sitemap은 `site`를 설정하면 자동 — [Customization](https://starlight.astro.build/guides/customization/) (accessed 2026-10-06, confidence: High). 이미지는 Astro 최적화를 쓰고 상대 경로를 지원 — [Authoring Content](https://starlight.astro.build/guides/authoring-content/) (accessed 2026-10-06, confidence: High). **[실측]** `sitemap-index.xml` 생성, md 옆 `./shot.png` → `/_astro/shot.*.webp`(width·height 자동)
- 컴포넌트(Tabs·Card·CardGrid·Steps·Aside·FileTree·LinkCard·LinkButton·Badge·Icon·Code)는 MDX·Markdoc에서만 import해서 쓴다. `.md`에선 `:::note`·`:::tip[제목]` aside 지시문뿐 — [Using Components](https://starlight.astro.build/components/using-components/) (accessed 2026-10-06, confidence: High)
- frontmatter `template: 'splash'`는 "a wider layout without any sidebars designed for landing pages", `hero`와 함께 씀 — [Frontmatter](https://starlight.astro.build/reference/frontmatter/) (accessed 2026-10-06, confidence: High)

**문서 밖 페이지(랜딩·다운로드·가격·릴리스 노트)**
- `src/pages/`에 Astro 파일 라우팅 페이지(`.astro`·`.html`)를 섞는다. Starlight 모양이 필요하면 `<StarlightPage>`로 감싼다(자동 사이드바 그룹에는 안 들어감) — [Pages](https://starlight.astro.build/guides/pages/) (accessed 2026-10-06, confidence: High)
- 공식 "Use Starlight at a subpath": 문서를 `src/content/docs/`의 하위 폴더에 모두 넣으면 그 경로 아래에만 Starlight가 생긴다. "In the future, we plan to support this use case better to avoid the need for the extra nested directory" — [Manual Setup](https://starlight.astro.build/manual-setup/#use-starlight-at-a-subpath) (accessed 2026-10-06, confidence: High)
- **[실측]** `src/pages/index.astro`(자체 랜딩) + `src/content/docs/docs/index.md`·`docs/guides/themes.md` + `root: { label: '한국어', lang: 'ko' }`를 빌드하니 `/index.html`·`/docs/index.html`·`/docs/guides/themes/index.html`·`/404.html`·sitemap·Pagefind 색인(ko 2쪽, 랜딩은 `data-pagefind-body`가 없어 제외)이 나왔다. `dist` 904KB. `editLink.baseUrl`을 `…/edit/main/site/`로 두면 `…/site/src/content/docs/docs/guides/themes.md`로 이어진다
- Tailwind를 Starlight 페이지와 자체 페이지에 다르게 적용하는 방법도 문서에 있다 — [CSS & Tailwind](https://starlight.astro.build/guides/css-and-tailwind/) (accessed 2026-10-06, confidence: High)

**색·플러그인**
- 색은 `--sl-color-accent-low`·`--sl-color-accent`·`--sl-color-accent-high`, `--sl-color-white`, `--sl-color-gray-1`~`6`, `--sl-color-black` 등을 덮어써서 바꾼다. 문서 안 색 테마 편집기(WCAG 대비 선택)로 CSS를 뽑아 `customCss`에 넣는다 — [CSS & Tailwind](https://starlight.astro.build/guides/css-and-tailwind/), [props.css](https://github.com/withastro/starlight/blob/main/packages/starlight/src/style/props.css) (accessed 2026-10-06, confidence: High)
- 공식 목록의 플러그인(버전 **[실측]** npm): starlight-blog 0.30.0, starlight-links-validator 0.26.0, starlight-image-zoom 0.16.0, starlight-github-alerts 0.5.0, starlight-llms-txt 0.12.0, starlight-changelogs 0.7.0, starlight-versions 등. Mermaid는 astro-mermaid — [Plugins](https://starlight.astro.build/resources/plugins/) (accessed 2026-10-06, confidence: High)

**같은 원본을 GitHub·Frond·사이트에서 쓰는 실험 [실측]**
- `starlight-github-alerts`를 넣으면 `> [!NOTE]`가 Starlight aside("참고")로 렌더된다. 같은 원본이 세 곳 모두에서 알림 상자로 보인다.
- 상대 링크 `[…](./guides/themes.md)`는 기본 빌드에서 `href` 그대로 나와 사이트에서 깨진다. `astro-rehype-relative-markdown-links` 0.19.2(`collectionBase: false`, `trailingSlash: 'always'`)를 넣으니 `/docs/guides/themes/`가 됐다(기본값이면 `/docs/docs/…`로 틀림).
- Astro 7은 기본 Markdown 처리기가 Sätteri라서 `markdown.rehypePlugins`를 쓰려면 `@astrojs/markdown-remark`를 따로 설치해야 한다(빌드 오류 원문 "…no longer installed by default now that Sätteri is the default Markdown processor"). KaTeX(remark-math·rehype-katex)도 이 경로를 탄다.
- 0.39.0부터 `autogenerate`에 `label`을 붙인 그룹 표기가 없어져 빌드가 멈췄다(오류가 새 표기를 안내). 실제로 겪은 깨짐 변경이다.

**실제로 쓰는 곳 [실측]** `<meta name="generator">`·자산 경로·헤더
- v2.tauri.app: Astro 7.3.2 + Starlight 0.42.0, Netlify, 랜딩도 Starlight, 언어 de/es/fr/ja/zh-CN. docs.astro.build: Starlight 0.42.0. biomejs.dev: 0.42.5.
- opencode.ai/docs: Starlight 0.34.3(Astro 5.7.13). 루트 랜딩은 다른 스택(`/_build/`)이고 `/docs`만 Starlight, 앞단 Cloudflare — 랜딩과 문서를 경로로 나눈 실례.
- developers.cloudflare.com: 이제 Starlight가 아니다. generator "Astro v7.3.5"·"Nimbus v0.2.2", `/_nimbus/` 자산, package.json에 `@cloudflare/nimbus-docs` 0.15.0(npm 설명 "Docs, for humans and agents", 2026-07-16 생성) — [cloudflare-docs package.json](https://github.com/cloudflare/cloudflare-docs/blob/production/package.json) (accessed 2026-10-06, confidence: High)

**Cloudflare 배포 안내**(세부는 Cloudflare 담당)
- 정적 Astro는 어댑터 없이 `wrangler.jsonc`의 `"assets": { "directory": "./dist" }`로 Workers 정적 자산 배포, 새 프로젝트엔 Workers 권장 — [Astro: Deploy to Cloudflare](https://docs.astro.build/en/guides/deploy/cloudflare/), [Cloudflare: Astro](https://developers.cloudflare.com/workers/framework-guides/web-apps/astro/) (accessed 2026-10-06, confidence: Medium, WebFetch 요약)

### Gaps
- Starlight 검색 모달의 Pagefind UI 문구가 한국어로 나오는지 브라우저로 확인하지 못했다. ko.json에는 `pagefind.*` 키가 없어 Pagefind UI 자체의 ko 번역에 의존한다.
- Cloudflare 빌드가 얕은 클론이면 `lastUpdated`가 틀릴 수 있다. 클론 깊이는 Cloudflare 담당이 확인해야 한다.
- astro-mermaid, remark-math·rehype-katex를 실제로 넣어 빌드해 보지는 않았다.

## Q3. 한국어 검색

### Takeaway
Pagefind 1.5.2는 한국어를 공백 단위 어절로 색인하고(형태소 분석·어간 추출 없음), 검색어는 앞부분 일치로 찾는다. 그래서 "테마"로 "테마를·테마의"가 든 쪽을 찾는다 **[실측]**. 반대로 "저장하다"로 "저장합니다"를 찾지 못하고, 어절 가운데인 "마를"이나 붙여 쓴 "문서테마"의 "테마"도 찾지 못한다. 또 기본 발음 구별 기호 정규화(NFD)가 한글 음절을 자모로 풀기 때문에 "새"가 "색"에, "가"가 "각·간격"에 걸리는 잡음이 생긴다. `exactDiacritics: true`면 이 잡음이 사라지지만 Starlight 설정으로는 이 옵션을 넘길 수 없다. 대신 Starlight의 순위 기본값(`termSimilarity: 9`)이 가까운 어절을 앞에 놓는다. 수십 쪽 규모인 Frond 문서에는 Pagefind 기본값으로 충분하다. 더 필요하면 Algolia DocSearch(한국어 사전 기반 분할, 무료 심사)가 대안이다.

### Cited Findings
**Pagefind 공식 문서**
- `<html lang>`별로 따로 색인하고, 브라우저에서도 같은 lang의 색인을 불러온다. 지원 언어면 어간 추출도 한다 — [Multilingual search](https://pagefind.app/docs/multilingual/) (accessed 2026-10-06, confidence: High)
- 언어표에서 Korean `ko`는 UI Translations ✅, Word Stemming ❌이다. 원문 "If word stemming is unsupported, search results won't match across root words." 한·중·일은 "Specialized languages"로 분류되고, extended 릴리스(npx 기본)에서 공백 없는 단어 분할을 지원한다고 적혀 있다 — [Multilingual search](https://pagefind.app/docs/multilingual/) (accessed 2026-10-06, confidence: High)
- 앞부분 일치: `termSimilarity` 설명에 "if searching for `part`, a result of `party` will boost a page higher than one containing `partition`" — [Ranking](https://pagefind.app/docs/ranking/) (accessed 2026-10-06, confidence: High)
- 기본값은 발음 구별 기호 정규화("cafe"↔"café")이고, `exactDiacritics: true`면 끈다 — [Search config](https://pagefind.app/docs/search-config/) (accessed 2026-10-06, confidence: High)

**이슈·소스로 본 실제 동작**
- PR #1212(2026-06-22 열림, 06-27 병합 없이 닫힘). 원문: "Korean was tokenized on whitespace only (should_segment covered just zh/ja/th), so an 어절 such as 서울은 was indexed as a single token". 닫은 이유는 `Intl.Segmenter('ko')`가 형태소를 나누지 않아 질의 쪽과 맞출 수 없어서다 — [Pagefind#1212](https://github.com/Pagefind/pagefind/pull/1212) (accessed 2026-10-06, confidence: High)
- **[실측]** pagefind.js 1.5.2 소스에서 `needsWordSegmentation`은 `["zh","ja","th"]`만 질의를 분할한다. 한국어는 질의도 공백 단위다. 문서 언어표의 "specialized" 설명과 실제 동작이 다르다.
- 이슈 #987: 1.5.0에서 브라우저 쪽 분할이 들어갔다. 메인테이너 원문: "This won't handle sub-word searching… this is true for all Pagefind languages and isn't going to change." — [Pagefind#987](https://github.com/Pagefind/pagefind/issues/987) (accessed 2026-10-06, confidence: High)
- 이슈 #1211(열림, 2026-06-22): 한국어 색인은 아무리 커도 청크 1개로 묶여 검색할 때마다 전체 색인을 받는다(5천 쪽 위키에서 9.8MiB 중 9.1MiB). Frond 규모에서는 영향이 작다 — [Pagefind#1211](https://github.com/Pagefind/pagefind/issues/1211) (accessed 2026-10-06, confidence: High)
- IME: 새 `<pagefind-searchbox>` 컴포넌트 UI는 조합 중 Enter로 결과 이동하는 버그(#1283)가 있었고, 수정 PR #1284는 2026-09-13 병합(1.5.2 이후라 미출시) — [#1283](https://github.com/Pagefind/pagefind/issues/1283) (accessed 2026-10-06, confidence: High). Starlight가 쓰는 `@pagefind/default-ui`는 Enter에 `preventDefault`만 하고, Escape는 조합 여부를 보지 않고 검색어를 지운다 **[실측]** `svelte/ui.svelte`

**[실측] Pagefind 1.5.2 한국어 시험**
- 방법: `<html lang="ko">` 4쪽과 `lang="en"` 1쪽을 만들고 `npx pagefind --site site`로 색인했다(출력 "Indexed 2 languages", "Pagefind doesn't support stemming for the language ko"). Node에서 `pagefind.js`를 ESM으로 불러 fetch를 파일 읽기로 바꾼 뒤 `search()`를 불렀다. 스크립트는 `docs-test\pf-ko\search.mjs`, `search_exact.mjs`.

| 검색어 | 찾은 쪽(본문 어절) | 해석 |
|---|---|---|
| 테마 | 테마·테마를 쪽, 테마의 쪽 | 조사가 붙은 어절을 앞부분 일치로 찾음 |
| 토큰 / 줄바꿈 / 인코딩 / 세션 | 토큰은·토큰을 / 줄바꿈을 / 인코딩은 / 세션을 | 같음 |
| 테마를 | 테마를 쪽만 | 질의보다 긴 어절만 일치 |
| 마를 | 없음 | 어절 가운데는 일치하지 않음 |
| 테마 → "문서테마" 쪽 | 못 찾음 | 붙여 쓴 복합어의 뒷부분은 못 찾음 |
| 저장하다 / 복원하기 / 바꾸다 | 없음 | 어간 추출 없음("바꾸"는 찾음) |
| "새 테마를"(따옴표) | 해당 쪽 | 구절 일치는 동작 |
| 새 / 테 / 가 | 색·색상 / 텍스트 / 각·간격·갈피 | NFD로 자모 단위 앞부분 일치 → 잡음 |
| 같은 질의 + `exactDiacritics: true` | 새 / 테마 쪽만 / 없음 | 자모 잡음이 사라짐 |
| lang=en에서 "테마", lang=ko에서 "theme" | 없음 | 언어별 색인이 분리됨 |

- **[실측]** Starlight 시험 사이트(`docs-test\sl-ko`)의 색인에서도 "테마·토큰·렌더링·더블클릭"으로 각각 "테마를·토큰은·렌더링해·더블클릭하면"이 든 쪽을 찾았다.
- **[실측]** Starlight 스키마(`dist/schemas/pagefind.js`)는 `indexWeight`·`ranking`·`mergeIndex`만 받는다. 기본값은 `termSimilarity: 9`, `diacriticSimilarity: 0.8`, `pageLength: 0.1`, `termFrequency: 0.1`, `termSaturation: 2`다. `exactDiacritics`를 넣을 자리가 없어 쓰려면 Search 컴포넌트를 덮어써야 한다.

**대안: Algolia DocSearch**
- 공개된 기술 문서와 기술 블로그는 무료로 쓸 수 있다. "production ready"가 아니거나 비기술 콘텐츠면 보통 거절된다(문서 갱신일 2026-08-06) — [DocSearch: Who can apply](https://docsearch.algolia.com/docs/who-can-apply/) (accessed 2026-10-06, confidence: Medium, WebFetch 요약)
- Korean `ko`: Segmentation Supported, Plurals Basic, Stop words Yes. 한·중·일을 제대로 쓰려면 `queryLanguages`의 첫 항목이 `ko`여야 한다(사전 기반 분할) — [Algolia: Supported languages](https://www.algolia.com/doc/guides/managing-results/optimize-search-results/handling-natural-languages-nlp/in-depth/supported-languages), [queryLanguages](https://www.algolia.com/doc/api-reference/api-parameters/queryLanguages) (accessed 2026-10-06, confidence: Medium)
- Starlight는 공식 플러그인이 있고, Docusaurus는 Algolia를 "first-class"로 지원한다. 크롤러는 주 1회 돈다 — [Site Search](https://starlight.astro.build/guides/site-search/), [Docusaurus Search](https://docusaurus.io/docs/search) (accessed 2026-10-06, confidence: High)

**대안: VitePress local search(MiniSearch)**
- MiniSearch 기본 토크나이저는 공백·구두점(`/[\n\r\p{Z}\p{P}]+/u`) 분리, VitePress 검색 상자 기본값은 `fuzzy: 0.2, prefix: true`, 문서에는 `miniSearch.options` 교체 지점만 있고 CJK 언급 없음 — [MiniSearch 소스](https://github.com/lucaong/minisearch/blob/master/src/MiniSearch.ts), [VPLocalSearchBox.vue](https://github.com/vuejs/vitepress/blob/main/src/client/theme-default/components/VPLocalSearchBox.vue), [VitePress Search](https://vitepress.dev/reference/default-theme-search) (accessed 2026-10-06, confidence: High)
- **[실측-부분]** minisearch 7.2.0 + VitePress 기본 옵션으로 같은 문장을 검색했다. "테마"→테마를·테마의, "바꾸다"→바꾸지·바꾸면(퍼지)은 찾고 "저장하다"·"마를"은 못 찾았다. VitePress 자체 빌드는 안 함(`docs-test\pf-ko\mini.mjs`).

### Gaps
- 한국어 형태소 분석(조사 떼기 등)을 하는 정적 검색 대안(Orama 한국어 토크나이저 등)은 확인하지 못했다.
- 한국어 전용 사이트가 Algolia DocSearch 심사를 통과한 사례는 찾지 못했다.
- GitBook 검색과 같은 문장으로 비교하지 못했다(Q1 Gap).

## Q4. 그 밖의 후보(짧게)

### Takeaway
Frond 조건(한국어, 0원, 랜딩 자유도, GitHub에서도 읽히는 Markdown)에서 Starlight와 겨룰 만한 후보는 VitePress와 Docusaurus다. VitePress는 GitHub Alerts를 기본 지원하지만 안정판이 2025-08의 1.6.4에 머물고 2.0은 알파다. Docusaurus는 React 기반이고 한국어 UI가 내장돼 있지만 로컬 검색은 커뮤니티 플러그인에 기대야 한다. 나머지는 이렇다. Material for MkDocs는 유지보수 모드라 새로 시작하기에 맞지 않고, mdBook은 다국어와 한·중·일 검색이 약하다. Mintlify는 호스팅에 묶이고, Retype은 무료판에서 브랜딩을 뗄 수 없다.

### Cited Findings
| 후보 | 최신 버전 **[실측]** | 한국어 UI·i18n | 검색(CJK) | 랜딩 자유도 | 런타임 | 비용·상태 |
|---|---|---|---|---|---|---|
| VitePress | 1.6.4(2025-08-05), next 2.0.0-alpha.20(2026-09-04) | `locales` 내장, UI 문구는 직접 지정 | MiniSearch(위 실측), Algolia | `layout: home`(hero·features)+Vue | Node·Vue | MIT, 저장소 활발 |
| Docusaurus | 3.10.2(2026-07-10), v4 canary | 내장, theme-translations에 `ko` | 공식 Algolia, 로컬은 커뮤니티(lunr `ko`) | React `src/pages`, 블로그 내장 | Node·React | MIT |
| Material for MkDocs | 9.7.7(2026-07-17), Zensical 0.0.68(2026-10-05) | 내장 | lunr, `search.lang: ko` | 테마 덮어쓰기 | Python | 유지보수 모드 |
| Mintlify | 호스팅 | `languages`에 `ko` | 호스팅 검색 | 문서 플랫폼 안 | 호스팅 | Starter $0(편집자 5석·커스텀 도메인) |
| Retype | 4.6.0(2026-05-25) | `locale: ko` | 문서에 CJK 언급 없음 | 제한적 | .NET CLI | 무료판에 "Powered by Retype" |
| mdBook | v0.5.4(2026-07-06) | 책 하나에 `language` 하나 | elasticlunr, CJK 이슈 열림 | 없음(책 형식) | Rust 바이너리 | MPL-2.0 |
| Fumadocs | 16.16.2(2026-10-05) | Next.js i18n | Orama(Unicode 단어 분할), 정적 검색 지원 | Next.js 앱 그대로 | Node·Next.js | MIT |
| Nextra | 4.6.1(2025-12-04) | Next.js i18n | Pagefind(postbuild) | Next.js | Node·Next.js | MIT, 마지막 push 2026-07-31 |

- VitePress: GitHub-flavored Alerts(`> [!NOTE]`) 기본 렌더, i18n은 `locales`의 `root`·`lang`, 기본 테마 문구는 `DefaultTheme.Config`에서 직접 지정 — [VitePress Markdown](https://vitepress.dev/guide/markdown#github-flavored-alerts), [VitePress i18n](https://vitepress.dev/guide/i18n) (accessed 2026-10-06, confidence: High)
- Docusaurus: theme-translations에 `ko` 폴더가 있다 — [locales](https://github.com/facebook/docusaurus/tree/main/packages/docusaurus-theme-translations/locales) (High). 검색은 Algolia만 공식이고 로컬은 커뮤니티 — [Docusaurus Search](https://docusaurus.io/docs/search) (High). 로컬 플러그인 `@easyops-cn/docusaurus-search-local` 0.55.3은 lunr-languages(`lunr.ko.js` 있음)를 쓴다 — [README](https://github.com/easyops-cn/docusaurus-search-local) (Medium). GitHub식 알림 요청 #7471은 2022-05부터 열려 있다 — [docusaurus#7471](https://github.com/facebook/docusaurus/issues/7471) (Medium). 모두 accessed 2026-10-06
- Material for MkDocs: 2025-11-11에 "entering maintenance mode"를 알리고 "critical bugs and security issues for 12 month at least, no new features"를 약속했으며 "MkDocs 1.x unmaintained"라고 적었다. Zensical(MIT)을 권한다 — [Material blog](https://squidfunk.github.io/mkdocs-material/blog/2025/11/11/insiders-now-free-for-everyone/) (accessed 2026-10-06, confidence: Medium, WebFetch 요약). **[실측]** PyPI mkdocs 1.6.1(2024-08 릴리스 [오래됨?]), Zensical 0.0.68(아직 0.0.x). 검색 `lang: ko`는 lunr-languages가 지원 — [Search plugin](https://squidfunk.github.io/mkdocs-material/plugins/search/) (accessed 2026-10-06, confidence: High)
- Mintlify **[실측]** HTML 텍스트: Starter $0("5 editor seats", "Custom domain"), Pro $450/월, White labeling은 Starter·Pro에 없음 — [Mintlify Pricing](https://www.mintlify.com/pricing) (accessed 2026-10-06, confidence: High). `languages`에 `ko` — [Navigation](https://www.mintlify.com/docs/organize/navigation) (accessed 2026-10-06, confidence: Medium)
- Retype: 무료판도 상업·오픈소스 사용 가능, 쪽 수 무제한, "Powered by Retype" 고정. Pro는 3년 $149(영구 $298) — [Retype Pro](https://retype.com/pro/) (accessed 2026-10-06, confidence: High). `locale: ko` 지원 — [Project config](https://retype.com/configuration/project/) (accessed 2026-10-06, confidence: Medium). **[실측]** npm `retypeapp`은 OS별 네이티브 바이너리, NuGet 도구로도 배포. GitHub `retypeapp/retype`은 문서 저장소(라이선스 "Other")라 엔진 소스는 비공개로 보인다(Medium)
- mdBook: 책 하나에 `language` 하나 — [mdBook config](https://rust-lang.github.io/mdBook/format/configuration/general.html) (High). "Support CJK (mutiple language) search" #2052(2023-03~)가 열려 있다 — [mdBook#2052](https://github.com/rust-lang/mdBook/issues/2052) (accessed 2026-10-06, confidence: High)
- Fumadocs: "the default `multilingual` mode uses Unicode word segmentation", 정적 사이트용 `staticGET`·`staticClient` 제공, 큰 사이트는 색인 내려받기 비용 경고 — [Fumadocs: Orama](https://www.fumadocs.dev/docs/headless/search/orama) (accessed 2026-10-06, confidence: Medium). Nextra 4는 postbuild에서 Pagefind로 색인 — [Nextra Search](https://nextra.site/docs/guide/search) (accessed 2026-10-06, confidence: Medium)
- 참고: HonKit(GitBook 옛 CLI 포크, 6.2.2)은 `SUMMARY.md` 형식을 유지하지만 옛 GitBook 모양이라 뺐다 **[실측]** npm

### Gaps
- Fumadocs·Nextra에 한국어 UI 기본 번역이 있는지, Mintlify 하위 경로(/docs)가 어느 플랜부터인지, Zensical의 한국어 검색은 확인하지 못했다.
- VitePress 2.0 정식 일정은 찾지 못했다.

## Q5. 다른 툴 문서가 실제로 쓰는 것 [실측]

### Takeaway
Markdown·에디터 계열 앱의 문서는 대부분 정적 생성기로 직접 만든 사이트였다(Jekyll, VuePress, Docusaurus, mdBook, Starlight). Obsidian만 자사 제품(Obsidian Publish)으로 문서를 내는 도그푸딩 사례였다. Zed와 opencode는 제품 도메인의 `/docs` 하위 경로에 문서를 두고 Cloudflare 앞단을 쓴다.

### Cited Findings
`curl -sL`로 HTML과 응답 헤더를 받아 `<meta name="generator">`, 자산 경로, `Server` 헤더를 확인했다(2026-10-06, confidence: High. 생성기 추정은 Medium).

| 사이트 | 생성기 흔적 | 호스팅 흔적 | 비고 |
|---|---|---|---|
| [support.typora.io](https://support.typora.io/) | Jekyll(저장소 `typora/support.typora.io` gh-pages의 `_config.yml`: jekyll-redirect-from·jekyll-feed·jekyll-last-modified-at) | `x-github-request-id`(GitHub Pages) + `Server: cloudflare` | 원본 저장소 공개(gh-pages) |
| [help.obsidian.md](https://help.obsidian.md/) | Obsidian Publish(`<base href="https://publish.obsidian.md">`, `publish.js`) | `obsidian.md/help/`로 리디렉트, Cloudflare | 자사 제품으로 문서 운영 |
| [docs.zettlr.com](https://docs.zettlr.com/) | `VuePress 2.0.0-rc.31` | `Server: Apache/2.4.68 (Debian)` | 자체 서버 |
| [zed.dev/docs](https://zed.dev/docs) | mdBook(`book.js`·`elasticlunr.min.js`, 저장소 `docs/book.toml`의 `site-url = "/docs/"`, 사용자 렌더러 `zed-html`) | Cloudflare | 제품 도메인의 하위 경로 |
| [joplinapp.org/help](https://joplinapp.org/help/) | `Docusaurus v2.4.3`, DocSearch 흔적 | `Server: GitHub.com`(GitHub Pages) | Docusaurus 2를 계속 씀 |
| [v2.tauri.app](https://v2.tauri.app/) | `Astro v7.3.2` + `Starlight v0.42.0`, Pagefind | `Server: Netlify` | 랜딩까지 Starlight |
| [developers.cloudflare.com](https://developers.cloudflare.com/) | `Astro v7.3.5` + `Nimbus v0.2.2`(`/_nimbus/`) | Cloudflare | Starlight에서 자체 프레임워크로 옮김 |

### Gaps
- GitBook으로 호스팅하는 데스크톱 앱 문서 사례는 따로 찾지 않았다.
- 각 사이트가 생성기를 고른 이유는 확인하지 않았다.

## Frond에 주는 시사점

1. **GitBook 무료안은 "0원·관리 부담 0"이지만 Frond 조건 가운데 Cloudflare 호스팅, 랜딩과의 통합(같은 도메인·같은 디자인), 브랜드(gitbook.io 주소, 지울 수 없는 배지)를 맞추지 못하고 PR 관리에도 제약이 있다.** 돈으로 풀면 커스텀 도메인 Essential은 연 $780, `/docs` 하위 경로 Ultimate는 연 $2,988(연 결제 월액×12)이다. Community 플랜은 협업용이고 영리성 판단이 불분명하며, Sponsored는 한국어 우선이라 맞지 않는다.
2. **정적 생성기라면 Starlight가 조건에 가장 잘 맞는다.** Astro 프로젝트 하나에 랜딩·다운로드·가격 페이지(`src/pages/*.astro`)와 문서(`src/content/docs/docs/*.md` → `/docs/…`)를 같이 둘 수 있다 **[실측]**. 한국어 UI가 내장돼 있고, 결과물이 정적 파일이라 Cloudflare에 그대로 올릴 수 있다.
3. **도그푸딩 규칙**(실측 근거):
   - 문서는 `.md`로만 쓴다. MDX 컴포넌트는 랜딩 같은 특수 페이지에만 쓴다.
   - 알림은 GitHub Alerts(`> [!NOTE]`)로 쓴다. 사이트에서는 starlight-github-alerts가 렌더한다. `:::note`와 `{% hint %}`는 GitHub와 Frond에서 글자로 보이니 쓰지 않는다.
   - 링크는 상대 `.md` 경로로 쓴다. 사이트에서는 astro-rehype-relative-markdown-links가 바꿔 주고, Astro 7에서는 `@astrojs/markdown-remark`를 함께 설치해야 한다.
   - 이미지는 md 옆에 두고 상대 경로로 건다.
   - Starlight가 요구하는 frontmatter `title`은 Frond가 이미 탭 제목으로 쓴다(`src/recent.ts` `docTitle`). front matter 블록도 Frond 미리보기에서 보이지 않는다.
   - 이렇게 하면 같은 파일이 GitHub·Frond·사이트에서 거의 같게 보인다. 단 Mermaid(astro-mermaid)와 KaTeX(remark-math·rehype-katex)는 사이트 쪽에서 따로 켜야 한다.
4. **한국어 검색은 Pagefind 기본값을 받아들이되 글쓰기로 보완한다.** 핵심 명사는 띄어 쓴다("문서 테마"). 붙여 쓴 복합어의 뒷부분은 검색되지 않기 때문이다. 동사 기본형으로는 찾지 못하므로 제목과 첫 문단에 명사형 키워드를 둔다. 자모 잡음은 Starlight 순위 기본값이 줄여 준다. 그래도 거슬리면 Search 컴포넌트를 덮어써 `exactDiacritics`를 켠다.
5. **유지보수 부담은 버전 고정으로 줄인다.** `package-lock`으로 고정하고 분기에 한 번 묶어서 올린다. CI에 starlight-links-validator를 둔다. 0.x에서 깨짐 변경이 잦다는 점(0.39 사이드바 표기 등)은 받아들인다.
6. **AI 친화 기능**: GitBook은 llms.txt·MCP 서버를 무료로 준다. Starlight는 starlight-llms-txt 플러그인으로 llms.txt를 만들 수 있다(선택 사항).

**결정 매트릭스**(◎ 매우 좋음, ○ 좋음, △ 조건부, × 맞지 않음, ? 미확인)

| 기준 | GitBook Free | GitBook Essential/Ultimate | Starlight | VitePress | Docusaurus | mdBook |
|---|---|---|---|---|---|---|
| 비용(0원) | ◎ $0 | × 연 $780 / $2,988 | ◎ | ◎ | ◎ | ◎ |
| 한국어 검색 | ? | ? | ○ 조사 붙은 어절 앞부분 일치 **[실측]** | ○ 앞부분+퍼지 **[실측-부분]** | △ Algolia 심사·커뮤니티 플러그인 | × CJK 이슈 열림 |
| 한국어 UI | ○ ko 번역 | ○ | ◎ 내장 **[실측]** | △ 직접 지정 | ◎ 내장 | × |
| 랜딩 자유도·브랜드 | × CSS/JS 불가, 배지 고정, gitbook.io | △ 도메인·하위 경로 가능, 배지 고정 | ◎ 같은 프로젝트 `src/pages` | ○ home 레이아웃+Vue | ◎ React 페이지 | × |
| Cloudflare 호스팅 | × GitBook 호스팅 | △ DNS only·Worker 프록시 | ◎ 정적 | ◎ | ◎ | ◎ |
| 유지보수 부담 | ◎ 없음 | ◎ | △ 0.x 깨짐 변경, Astro 메이저 | △ 1.x 정체·2.0 알파 | △ React 스택·v4 예정 | ◎ 단일 바이너리 |
| 종속(lock-in) | △ 블록·구조·렌더러 전용 | △ | ◎ MIT·정적 HTML | ◎ | ◎ | ◎ |
| Markdown 이식성 | △ `{% %}` 블록 | △ | ○ .md + Alerts·링크 플러그인 | ◎ Alerts 기본 | △ MDX 기본, Alerts 없음 | ◎ 순수 md |
| GitHub 원본 가독성 | ○ README·SUMMARY 친화, 블록은 글자 | ○ | ○ `:::`만 피하면 됨 | ○ | ○ | ◎ |
| PR로 관리 | △ GitBook이 브랜치에 직접 커밋, PR↔변경 요청 단절 | △ | ◎ 일반 PR·빌드 | ◎ | ◎ | ◎ |
| 도그푸딩(Frond로 원본 편집) | △ 블록은 렌더 안 됨 | △ | ◎ 규칙대로 쓰면 동일 | ◎ | ○ | ◎ |

- **권장안: Astro + Starlight, 같은 저장소의 `site/`(가칭)에 랜딩과 `/docs`를 함께 둔다.** 로캘은 `root: ko`로 하고, 영어는 나중에 `en` 로캘(`/en/docs/…`)로 더한다. 검색은 Pagefind 기본, 원본은 위 3번 규칙의 `.md`로 쓴다. 0원이고 Cloudflare에 정적으로 올리며 PR로 관리하고 Frond로 편집할 수 있다. 비교한 안 가운데 조건을 모두 만족하는 것은 이 안뿐이다.
- **차선안: GitBook Free + Git Sync(`.gitbook.yaml`의 `root: ./docs/`).** GitBook 모양과 관리 부담 0을 가장 중시하고, `frond.gitbook.io` 같은 주소와 배지를 받아들일 때 고른다. 랜딩은 Cloudflare에 따로 두고 문서는 링크로 연결한다. 블록 문법을 쓰지 않으면 나중에 Starlight로 옮기기 쉽다. 정적 생성기 안에서의 차선은 VitePress다(Alerts 기본 지원, Starlight의 깨짐 변경이 부담일 때).
- **사용자 확인이 필요한 결정**:
  - 문서 주소: `frond.예시/docs` 하위 경로로 할지, `docs.` 서브도메인으로 할지. Starlight는 어느 쪽이든 된다.
  - GitBook의 "편집기 UI로 쓰는 경험"이 필요한지. 필요하면 차선안을 고른다.

## 요약 표

| 항목 | GitBook(호스팅) | Starlight(정적, 권장) |
|---|---|---|
| 최신 상태 | Free/Essential $65/Ultimate $249(사이트당 월, 연 결제), 사용자당 $12 | 0.42.5(2026-10-01), Astro 7.3.5 **[실측]** |
| 0원으로 되는 것 | 사이트 무제한, Git Sync, 검색, variants, 통계, llms.txt·MCP | 전부(정적 빌드·Pagefind·i18n·sitemap) |
| 0원으로 안 되는 것 | 커스텀 도메인(Essential), /docs(Ultimate), 배지 제거(불가), CSS/JS(불가) | 없음(호스팅비는 Cloudflare 담당 노트) |
| 한국어 | UI ko 있음, 검색 품질 미확인 | UI ko 내장, Pagefind 앞부분 일치·어간 추출 없음·자모 잡음 **[실측]** |
| 저장소 형식 | Markdown + `{% %}` 블록 + SUMMARY.md + `.gitbook/assets` | `.md`(frontmatter `title`) + 플러그인으로 Alerts·상대 링크 **[실측]** |
| 랜딩 통합 | 디자인 통합 불가(별도 사이트), 같은 도메인 `/docs`는 Ultimate부터 | 같은 프로젝트 `src/pages` + `/docs` 하위 경로 **[실측]** |
| 운영 위험 | 브랜치 보호 우회, PR 미연동, 정규화 재작성 [Low] | 0.x 깨짐 변경(마이너마다 1~3건), Astro 7 Markdown 처리기 변경 **[실측]** |
| 실제 사례 | (데스크톱 앱 문서 사례 미조사) | Tauri v2, Astro docs, Biome, opencode /docs **[실측]**; Cloudflare는 Nimbus로 이탈 |
| 결론 | 차선안(관리 0·GitBook UX 우선 시) | 권장안 |
