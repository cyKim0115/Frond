# Cloudflare 배포·도메인·다운로드 호스팅 (2026-10 기준)

> 조사일 2026-10-06. 대상: Frond 제품·문서 사이트(같은 저장소 `site/`, Astro + Starlight 정적 출력)를 Cloudflare에 올리는 방법 — 제품 선택, Git 연동, 무료 한도, 도메인, 설치기 다운로드 링크, Tauri updater 엔드포인트, 부가 기능, 다른 호스팅 비교.
> 표기: **[실측]** = 이번에 직접 확인한 것(curl 응답 헤더, `gh api`, RDAP, 공개 소스·목록 파싱). **[Low]** = 블로그·포럼·제3자 사이트. **[오래됨?]** = 2025년 이전 정보. **[추론]** = 문서 근거를 이어 붙인 판단.
> 범위 밖: 다른 앱의 사이트 구성, 문서 플랫폼 비교, 스크린샷·동영상 형식(다른 조사자 담당).
> 버전 [실측]: wrangler 4.147.0, astro 7.3.5, @astrojs/starlight 0.42.5, cloudflare/wrangler-action v4.1.3, tauri-action action-v1.0.0(2026-06-29), actions/checkout v7, actions/setup-node v7.
> 저장소는 `cyKim0115/MdEditor`(공개, 릴리스 0개 [실측])이고 `cyKim0115/Frond`로 개명 예정이다([frond-rename.md](../../../frond-rename.md)). 예시는 새 이름과 가짜 도메인 `example.app`을 쓴다.

## Q1. Cloudflare Pages vs Workers(Static Assets)

### Takeaway
Cloudflare는 Pages 문서 첫머리에 "새 프로젝트는 Workers로"라고 적어 두었다. 정적 사이트에 필요한 기능(`_redirects`·`_headers`, 미리보기, 커스텀 도메인, Git 빌드, Deploy Hook)은 Workers에도 다 있고 정적 자산 요청은 무료·무제한이다. Workers의 실질 제약은 도메인 네임서버가 Cloudflare에 있어야 한다는 것 하나다. Astro 정적 출력은 어댑터 없이 `assets.directory`만으로 올라간다.

### Cited Findings
- Pages 문서 원문: "Workers supports most Pages use cases and offers a broader feature set. It is Cloudflare's primary platform for building applications. Start new projects with Workers."(2026-08-25 갱신) — [Cloudflare Pages](https://developers.cloudflare.com/pages/) (accessed 2026-10-06, confidence: High)
- 이전 안내: 정적 자산 요청은 Pages처럼 무료. 빌드 출력 폴더는 `assets.directory`로, Pages의 404·SPA 자동 판단은 `not_found_handling`(`"404-page"`/`"single-page-application"`) 명시로 바뀐다. `_headers`·`_redirects`는 "supported natively". 호환표상 Workers 전용: 점진 배포, Workers Logs, Cron, 경로 단위 서빙. Pages 전용: "Custom domains outside Cloudflare zones". 원문 "Unlike Pages, Workers does not support any domain whose nameservers are not managed by Cloudflare." — [Migrate from Pages to Workers](https://developers.cloudflare.com/workers/static-assets/migration-guides/migrate-from-pages/) (accessed 2026-10-06, confidence: High)
- 원문 "Requests to static assets are free and unlimited", 저장 비용 없음. `run_worker_first`를 켜면 그 요청은 Worker 호출로 과금되고 무료 한도 초과 시 429. — [Billing and Limitations](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/) (accessed 2026-10-06, confidence: High)
- Workers Cache(`"cache": {"enabled": true}`)를 켜면 정적 자산을 포함한 모든 요청이 Workers 단가로 과금된다 → 켜지 않는다. `"404-page"`는 가장 가까운 `404.html`을 404로 준다. — [Workers Cache](https://developers.cloudflare.com/workers/cache/), [SSG and custom 404 pages](https://developers.cloudflare.com/workers/static-assets/routing/static-site-generation/) (accessed 2026-10-06, confidence: High)
- Cloudflare Astro 가이드: 정적 사이트는 `main` 없이 `assets.directory: "./dist"`만. 설정 파일 없이 `wrangler deploy`하면 자동 구성이 `@astrojs/cloudflare` 어댑터·`main`·`nodejs_compat`을 넣는다 → `wrangler.jsonc`를 먼저 커밋한다 [추론]. — [Cloudflare Docs: Astro](https://developers.cloudflare.com/workers/framework-guides/web-apps/astro/) (accessed 2026-10-06, confidence: High)
- Astro 공식: 어댑터는 "If your site uses on-demand rendering"일 때만. "Cloudflare recommends using Cloudflare Workers for new projects." — [Astro Docs: Deploy to Cloudflare](https://docs.astro.build/en/guides/deploy/cloudflare/) (accessed 2026-10-06, confidence: High, 원본 mdx 확인)

```jsonc
// site/wrangler.jsonc — 정적 전용(main 없음 → Worker 호출 0)
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "frond-site",                       // 대시보드 Worker 이름과 같아야 함
  "compatibility_date": "2026-10-06",
  "assets": { "directory": "./dist", "not_found_handling": "404-page" },
  "routes": [{ "pattern": "example.app", "custom_domain": true }],
  "workers_dev": false,
  "preview_urls": true,
  "previews": {}
}
```

### Gaps
- Pages 지원 종료 일정은 없다. 정적 전용 Worker에 `previews: {}`가 꼭 필요한지는 문서에 없다(이전 안내 예시를 따름).

## Q2. Git 연동

### Takeaway
Workers Builds(대시보드 Git 연동)가 가장 손이 덜 간다. 루트 디렉터리 `site`, 감시 경로 `site/*`를 넣으면 main push는 운영 배포, 다른 브랜치는 Preview URL이 된다. 무료는 월 3,000 빌드 분, 동시 1개, 20분 제한이다. 릴리스 직후 재빌드는 Deploy Hook(인증 헤더 없는 POST URL)을 릴리스 워크플로 끝에서 부른다. GitHub Actions + `wrangler-action@v4`도 되지만 Cloudflare 토큰을 GitHub에 둬야 한다.

### Cited Findings
- 연결: **Workers & Pages → Create application → Import a repository(Get started) → Git account → 저장소 → Save and Deploy**. 원문 "the Worker name in the Cloudflare dashboard must match the `name` in the Wrangler configuration file in the specified root directory, or the build will fail". 설정 파일이 없으면 autoconfig가 PR을 연다. — [Builds](https://developers.cloudflare.com/workers/ci-cd/builds/) (accessed 2026-10-06, confidence: High)
- **Settings > Build** 항목: Git branch(기본 `main`), Build command, Deploy command(기본 `npx wrangler deploy`), Preview command(기본 `npx wrangler preview`), Root directory, API token(기본 자동 생성: Workers Scripts·KV·R2 edit, 모든 존 Workers Routes edit 등), Build variables and secrets(런타임엔 안 보임). Wrangler는 `package.json` 버전을 쓴다. 주입 변수 `WORKERS_CI_BRANCH`·`WORKERS_CI_COMMIT_SHA` 등. — [Configuration](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/) (accessed 2026-10-06, confidence: High)
- **Build watch paths**: 기본 include `[*]`. exclude 먼저, 그다음 include. 변경 0개·3000개 이상·20커밋 이상 push는 무조건 빌드. 예 `project-a/*`. — [Build watch paths](https://developers.cloudflare.com/workers/ci-cd/builds/build-watch-paths/) (accessed 2026-10-06, confidence: High)
- 모노레포는 Worker마다 루트 디렉터리를 자기 `wrangler.jsonc` 위치로 둔다. — [Advanced setups](https://developers.cloudflare.com/workers/ci-cd/builds/advanced-setups/) (accessed 2026-10-06, confidence: High)
- 무료 한도: 빌드 월 3,000분, 동시 1(계정), 20분, Deploy Hook 분당 Worker 10·계정 100, 2 vCPU·8 GB, 환경 변수 64개. 월 빌드 횟수 한도는 표에 없다(Pages는 월 500회). — [Limits & pricing](https://developers.cloudflare.com/workers/ci-cd/builds/limits-and-pricing/) (accessed 2026-10-06, confidence: High)
- Node 기본 24.18.0, `NODE_VERSION` 빌드 변수나 루트 디렉터리 `.nvmrc`로 고정(Ubuntu 24.04). 미리보기는 **Settings > Build > Branch control → Enable Preview Builds**. — [Build image](https://developers.cloudflare.com/workers/ci-cd/builds/build-image/), [Build branches](https://developers.cloudflare.com/workers/ci-cd/builds/build-branches/) (accessed 2026-10-06, confidence: High)
- Preview URL `<preview-name>-<worker-name>.<subdomain>.workers.dev`(이름 기본값 = 브랜치), 배포별 고정 URL 따로. workers.dev 미리보기는 `X-Robots-Tag: noindex`. 기본 공개. 무료는 Worker당 Preview 100개(넘치면 오래된 것 삭제). Wrangler 4.135.0+. — [Previews](https://developers.cloudflare.com/workers/previews/), [Get started](https://developers.cloudflare.com/workers/previews/get-started/) (accessed 2026-10-06, confidence: High)
- GitHub 연동: PR 댓글(상태·Preview URL), check run. 앱 이름 "Cloudflare Workers and Pages", **Only select repositories** 가능. "A GitHub account should only point to one Cloudflare account." — [GitHub integration](https://developers.cloudflare.com/workers/ci-cd/builds/git-integration/github-integration/) (accessed 2026-10-06, confidence: High)
- Deploy Hook: **Settings > Builds > Deploy Hooks**에서 이름·브랜치 → URL. `curl -X POST "https://api.cloudflare.com/client/v4/workers/builds/deploy_hooks/<ID>"`, 원문 "No `Authorization` header is needed"(URL이 비밀). 대기 빌드가 있으면 중복 생성 안 함. — [Deploy Hooks](https://developers.cloudflare.com/workers/ci-cd/builds/deploy-hooks/) (accessed 2026-10-06, confidence: High)
- Actions 대안: `cloudflare/wrangler-action@v4` + 비밀 `CLOUDFLARE_API_TOKEN`·`CLOUDFLARE_ACCOUNT_ID`. 토큰은 **Account API tokens → Create Token → Edit Cloudflare Workers** 템플릿(Zone Workers Routes Write; Account Workers Scripts·KV·R2 Write, Tail Read, Account Settings Read; User Details·Memberships Read)으로 만들고 계정·존을 좁힌다. — [GitHub Actions](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/), [API token templates](https://developers.cloudflare.com/fundamentals/api/reference/template/) (accessed 2026-10-06, confidence: High)
- wrangler-action 입력 `workingDirectory`, `command`(기본 deploy, `preview`는 Wrangler ≥ 4.136.3), 출력 `deployment-url`·`preview-url`. — [action.yml](https://github.com/cloudflare/wrangler-action/blob/main/action.yml) (accessed 2026-10-06, confidence: High, `gh api` 원문)
- 함정: 원문 "events triggered by the `GITHUB_TOKEN` will not create a new workflow run"(예외 `workflow_dispatch`·`repository_dispatch`). tauri-action이 GITHUB_TOKEN으로 publish하면 `on: release: types: [published]`는 돌지 않는다. 사람이 UI에서 draft를 publish하면 돈다 [추론]. — [GITHUB_TOKEN](https://docs.github.com/en/actions/concepts/security/github_token), [Events that trigger workflows](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows) (accessed 2026-10-06, confidence: High)
- 공개 저장소의 GitHub-hosted runner는 무료. — [Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions) (accessed 2026-10-06, confidence: High)

```yaml
# release.yml 끝(tauri-action 다음, releaseDraft: false일 때). draft를 사람이 publish한다면
# 같은 단계를 `on: release: types: [published]` 워크플로에 둔다.
      - name: 사이트 재빌드
        if: success()
        run: curl -fsS -X POST "$HOOK"
        env:
          HOOK: ${{ secrets.CF_SITE_DEPLOY_HOOK }}
```

```yaml
# 대안: .github/workflows/site.yml (Actions로 전부)
on:
  push: { branches: [main], paths: ['site/**'] }
  workflow_dispatch:            # release.yml이 GITHUB_TOKEN으로 `gh workflow run site.yml` 가능
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with: { node-version: 24 }
      - run: npm ci && npm run build
        working-directory: site
        env: { GITHUB_TOKEN: '${{ secrets.GITHUB_TOKEN }}' }   # 빌드 중 릴리스 API(시간당 1,000회)
      - uses: cloudflare/wrangler-action@v4
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          workingDirectory: site
```

| | Workers Builds | Actions + wrangler-action |
|---|---|---|
| 비밀 | GitHub에는 Deploy Hook URL만 | Cloudflare 토큰을 GitHub에 |
| 미리보기 | 브랜치마다 자동 + PR 댓글 | `command: preview`, 댓글은 직접 |
| 설정 위치 | 대시보드 | 저장소 YAML |
| 빌드 중 GitHub API | 비인증 60회/시/IP → 토큰을 빌드 비밀로 | GITHUB_TOKEN 1,000회/시 |

### Gaps
- Workers Builds 빌드 머신의 공유 IP가 GitHub 비인증 한도(60회)에 걸리는지는 문서에 없다.
- `routes`의 `custom_domain: true` 생성에 필요한 정확한 토큰 권한은 문서에서 못 찾았다(자동 토큰으로 충분한지 실기 확인 필요).
- 빌드 실패 시 운영 배포가 그대로 남는다는 것은 [추론]이다(Deploy command가 안 돎).

## Q3. 무료 플랜 한도

### Takeaway
`main`이 없는 정적 Worker는 하루 10만 요청 한도와 무관하고 대역폭 요금도 없다. 실제로 걸릴 한도는 파일 20,000개, 파일당 25 MiB, `_headers` 100규칙, `_redirects` 2,100개다. 소개 + 문서 사이트는 한참 못 미친다.

### Cited Findings
- Workers Free: 요청 하루 100,000(넘으면 Error 1027), 정적 자산 파일 버전당 20,000(유료 100,000, Wrangler 4.34.0+), 파일당 25 MiB, `_headers` 100규칙·줄당 2,000자, `_redirects` 정적 2,000 + 동적 100·규칙당 1,000자, 존당 Custom Domain 100·Route 1,000. — [Workers Limits](https://developers.cloudflare.com/workers/platform/limits/) (accessed 2026-10-06, confidence: High)
- 각주 "Requests to static assets are free and unlimited." 유료는 월 $5부터, "no additional charges for data transfer (egress) or throughput (bandwidth)". — [Workers Pricing](https://developers.cloudflare.com/workers/platform/pricing/) (accessed 2026-10-06, confidence: High)
- 참고 Pages Free: 월 500 빌드, 20,000 파일, 25 MiB, 미리보기 무제한, 25 MiB 초과 파일은 R2 권고. — [Pages Limits](https://developers.cloudflare.com/pages/platform/limits/) (accessed 2026-10-06, confidence: High)
- 약관: Free CDN은 웹 페이지용이고 동영상·큰 파일은 "Paid Services (e.g., the Developer Platform ...)"를 쓰라고 한다. Developer Platform(Workers·Pages·R2) 조항 원문 "Unlike most Cloudflare products, the Developer Platform can be used to host content."(2026-09-28 갱신) — [Application Services terms](https://www.cloudflare.com/service-specific-terms-application-services/), [Developer Platform terms](https://www.cloudflare.com/service-specific-terms-developer-platform/) (accessed 2026-10-06, confidence: High)

### Gaps
- 정적 자산 총용량 한도는 문서에 없다. CDN 조항의 "Paid Services"에 무료 구간 Developer Platform이 포함되는지는 모호하다(6.6 MiB 몇 개는 문제될 규모가 아니라고 봄 [추론]).

## Q4. 도메인

### Takeaway
Cloudflare Registrar는 원가 판매이고 네임서버가 자동으로 Cloudflare라 Workers Custom Domain까지 가장 짧다. `.kr`은 팔지 않는다. `.app`·`.dev`·`.page`는 TLD 전체가 HSTS preload(HTTPS 강제)지만 인증서 자동 발급이라 문제없다. `frond.app`·`frond.dev`·`frond.com`은 이미 남의 것이다 [실측]. 구조는 apex Custom Domain + `www`→apex 301 Redirect Rule + 같은 Worker의 `/docs/`가 가장 단순하다.

### Cited Findings
- Registrar 원문 "will only charge you what is paid to the registry for your domain. No markup." 기본 자동 갱신(레지스트리 정가), 원클릭 DNSSEC. — [Cloudflare Registrar](https://developers.cloudflare.com/registrar/) (accessed 2026-10-06, confidence: High)
- 조건: Registrar 도메인은 Cloudflare 네임서버 고정, IDN 불가, 계정 이메일 인증 필수, ICANN 등록자 이메일 인증 안 하면 보류, 연락처는 ASCII만(한글 주소는 영문으로). 절차 **Register domains → 검색 → Purchase → Payment option(기간) → 연락처 → 결제 → Complete purchase**. — [Register a new domain](https://developers.cloudflare.com/registrar/get-started/register-domain/) (accessed 2026-10-06, confidence: High)
- [실측] TLD Policies 페이지 397개 항목에 `app`·`dev`·`page`·`com`·`io`는 있고 `kr`·`co.kr`은 없다. — [TLD Policies](https://www.cloudflare.com/tld-policies/), [Top Level Domains supported](https://developers.cloudflare.com/registrar/top-level-domains/) (accessed 2026-10-06, confidence: High)
- 가격: 공식 가격은 로그인한 대시보드 검색에만 있다(FAQ가 가리키는 학습 페이지는 봇에 403). 제3자 집계: `.com` 등록·갱신 $10.46, `.dev` $12.20, `.app` 첫해 $8.20·갱신 $14.20, `.page` $10.20, `.io` $32·$50. — [cfdomainpricing.com prices.json](https://cfdomainpricing.com/prices.json), [domainnameservices.net](https://domainnameservices.net/registrars/cloudflare) (accessed 2026-10-06, confidence: **Low**). 등록·갱신비는 환불 불가 — [Registrar FAQ](https://developers.cloudflare.com/registrar/faq/) (High)
- 이전: 도메인이 먼저 Cloudflare에서 Active, 등록·이전 후 60일 경과, gTLD는 1년 연장분 원가 지불. — [Transfer to Cloudflare](https://developers.cloudflare.com/registrar/get-started/transfer-domain-to-cloudflare/) (accessed 2026-10-06, confidence: High)
- 외부 등록처 도메인: **Domains → Onboard a domain** → 플랜 → 레코드 검토 → 옛 등록처 DNSSEC 끄기 → 네임서버 2개를 "copied exactly" 교체 → 최대 24시간 → **Active** 메일 → DNSSEC 다시 켜기. Free는 이 full 방식만. — [Full setup](https://developers.cloudflare.com/dns/zone-setups/full-setup/setup/) (accessed 2026-10-06, confidence: High)
- Custom Domain은 Worker가 오리진이고 DNS 레코드·인증서를 Cloudflare가 만든다(기존 CNAME 호스트에는 불가). 경로 **Workers & Pages → Worker → Settings > Domains & Routes > Add > Custom Domain** 또는 `routes`의 `"custom_domain": true`. Route는 `example.com/blog/*` 같은 경로 패턴용이고 Workers는 자산을 경로 아래 서빙할 수 있다(Pages 불가). — [Routes and domains](https://developers.cloudflare.com/workers/configuration/routing/), [Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/), [Serving a subdirectory](https://developers.cloudflare.com/workers/static-assets/routing/advanced/serving-a-subdirectory/) (accessed 2026-10-06, confidence: High)
- 원문 "If you change your routes in the dashboard, Wrangler will override them in the next deploy". 대시보드로만 관리하려면 `routes` 키를 빼고 `workers_dev = false`. workers.dev를 대시보드에서만 끄면 다음 배포에 다시 켜진다. — [Wrangler: Source of truth](https://developers.cloudflare.com/workers/wrangler/configuration/#source-of-truth), [workers.dev](https://developers.cloudflare.com/workers/configuration/routing/workers-dev/) (accessed 2026-10-06, confidence: High)
- apex↔www: `_redirects`는 도메인 단위 리디렉트 ❌. `www`에 아무 IP(`192.0.2.1`)의 **Proxied** A 레코드 + Single Redirect. **Rules > Overview > Create rule > Redirect Rule**, 템플릿 "Redirect from WWW to root"(`https://www.*` → `https://${1}`, 301, 쿼리 유지). Free 존 규칙 10개. — [Workers Redirects](https://developers.cloudflare.com/workers/static-assets/redirects/), [Manage subdomains](https://developers.cloudflare.com/fundamentals/manage-domains/manage-subdomains/), [Redirect from WWW to root](https://developers.cloudflare.com/rules/url-forwarding/examples/redirect-www-to-root/), [Redirects availability](https://developers.cloudflare.com/rules/url-forwarding/) (accessed 2026-10-06, confidence: High)
- [실측] Chromium preload 목록에 `{"name": "app"|"dev"|"page", "mode": "force-https", "include_subdomains": true}`. → HTTP로는 안 열리고 인증서가 생겨야 접속된다 [추론]. — [transport_security_state_static.json](https://chromium.googlesource.com/chromium/src/+/main/net/http/transport_security_state_static.json) (accessed 2026-10-06, confidence: High)
- [실측, RDAP] 등록됨: `frond.app`(2021-03-08), `frond.dev`(2026-06-28), `frond.com`, `getfrond.com`, `frondapp.com`, `usefrond.com`, `frond.site`. 기록 없음(404): `frond.page`, `getfrond.app`, `getfrond.dev`, `frondapp.dev`, `frondmd.app`, `frondmd.dev`, `frondeditor.com`, `frondmd.com`. 404가 구매 가능을 보장하지는 않는다(프리미엄·예약). — [rdap.org](https://rdap.org/) (accessed 2026-10-06, confidence: High/Medium)
- `/docs/` 경로면 Worker·빌드·`_headers`·분석 사이트가 하나다. 나눠야 하면 Route `example.app/docs/*`로 별도 Worker도 된다. `docs.` 하위 도메인이면 Worker 2개다. Web Analytics는 같은 apex 하위 도메인끼리 site tag를 공유할 수 있다. — [Serving a subdirectory](https://developers.cloudflare.com/workers/static-assets/routing/advanced/serving-a-subdirectory/), [Web Analytics FAQ](https://developers.cloudflare.com/web-analytics/faq/) (accessed 2026-10-06, confidence: High)

### Gaps
- Cloudflare 공식 TLD 가격은 로그인 없이 확인 못 했다. `.kr`은 국내 등록처에서 사서 네임서버를 바꿔야 하며 그 절차는 조사 안 했다.

## Q5. 설치기 다운로드 링크 전략

### Takeaway
바이너리는 GitHub Releases에 두고, 사이트 빌드 때 GitHub API로 최신 릴리스의 버전 경로 URL·크기·SHA256(`digest`)을 받아 버튼·표에 박는 방식이 가장 단단하다. 짧은 고정 링크는 같은 데이터로 `public/_redirects`에 `/download/windows` 302를 생성한다. `releases/latest/download/<이름>`은 tauri-action의 `releaseAssetNamePattern`으로 버전 없는 이름을 만들 때만 쓸 수 있다. R2 + `dl.`은 무료 구간 안이지만 업로드 단계가 늘고 GitHub `download_count`를 잃는다. winget `InstallerUrl`은 GitHub 버전 경로 URL로 둔다.

### Cited Findings
**(a) GitHub 직링크**
- 최신 자산 직링크는 `/releases/latest/download/asset-name.zip`. — [Linking to releases](https://docs.github.com/en/repositories/releasing-projects-on-github/linking-to-releases) (accessed 2026-10-06, confidence: High)
- [실측] `github.com/microsoft/winget-cli/releases/latest/download/<파일>` → 302 → `/releases/download/v1.29.380/<파일>` → 302 → `release-assets.githubusercontent.com`. 웹 경로에는 `X-RateLimit-*` 헤더가 없다.
- latest = "the most recent non-prerelease, non-draft release, sorted by the `created_at` attribute". — [REST: Releases](https://docs.github.com/en/rest/releases/releases) (accessed 2026-10-06, confidence: High)
- tauri-action v1 입력 **`releaseAssetNamePattern`**(1.0.0에서 `assetNamePattern` 개명). 변수 `[name]`·`[mainBinaryName]`·`[version]`·`[platform]`·`[arch]`·`[ext]`·`[mode]`·`[setup]`·`[_setup]`·`[bundle]`, 기본은 CLI 이름 유지. 소스상 `latest.json`만 이름 고정, `.sig`에도 같은 패턴. — [tauri-action action.yml·README·CHANGELOG·src/utils.ts](https://github.com/tauri-apps/tauri-action) (accessed 2026-10-06, confidence: High)
- 예 `'[name]_[arch][_setup][ext]'` → `Frond_x64_setup.exe`(+`.sig`)라 `.../releases/latest/download/Frond_x64_setup.exe`가 늘 최신이 된다. 기본 이름을 지키려면 `gh release upload`로 버전 없는 사본을 따로 올린다 [추론].

**(b) 빌드 때 API로 받기**
- 자산 스키마에 `digest`(string or null). [실측] `gh api repos/cli/cli/releases/latest` 자산에 `digest: "sha256:afe49e…"`, `size`, `download_count`, `browser_download_url`. — [REST: Release assets](https://docs.github.com/en/rest/releases/assets) (accessed 2026-10-06, confidence: High)
- 한도: 비인증 IP당 시간 60회, 개인 토큰 5,000회, GITHUB_TOKEN 저장소당 1,000회. — [REST rate limits](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api) (accessed 2026-10-06, confidence: High)
- 릴리스가 없으면 `/releases/latest`는 404 → "준비 중"으로 빌드돼야 한다. 토큰 없이 하려면 릴리스 워크플로가 `download.json`(버전·파일·크기·SHA256·URL)을 자산으로 올리고 사이트가 `github.com/.../releases/latest/download/download.json`(API 아님)을 읽는다 [추론].

```ts
// 빌드 때 1회(Astro frontmatter)
const h: Record<string, string> = { Accept: 'application/vnd.github+json' };
if (process.env.GITHUB_TOKEN) h.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
const r = await fetch('https://api.github.com/repos/cyKim0115/Frond/releases/latest', { headers: h });
const rel = r.ok ? await r.json() : null;
const exe = rel?.assets.find((a: any) => a.name.endsWith('_x64-setup.exe'));
// exe.browser_download_url / exe.size / exe.digest / rel.tag_name / rel.published_at
```

**(c) `/download/windows` 리디렉트**
- `_redirects` 형식 `[source] [destination] [code?]`, 기본 302, 외부 URL·splat·placeholder ✅, 쿼리 매칭·도메인 단위 ❌. 원문 "Redirects are always followed, regardless of whether or not an asset matches". 정적 규칙을 동적 규칙 위에. 프레임워크의 `public/`이 "the perfect place". — [Workers Redirects](https://developers.cloudflare.com/workers/static-assets/redirects/) (accessed 2026-10-06, confidence: High)
- Astro `redirects` 설정은 정적 빌드에서 meta refresh HTML을 만들고, `src/pages`의 `_` 접두 파일은 빌드에서 빠진다 → `public/_redirects`를 빌드 전 스크립트로 생성한다. — [Astro Routing](https://docs.astro.build/en/guides/routing/) (accessed 2026-10-06, confidence: High)

**(d) R2 + `dl.`**
- 무료(월): 저장 10 GB-month, Class A 100만, Class B 1,000만, egress 무료(Standard만). 초과 $0.015/GB-month, A $4.50/백만, B $0.36/백만. — [R2 Pricing](https://developers.cloudflare.com/r2/pricing/) (accessed 2026-10-06, confidence: High)
- 먼저 **Storage & databases > R2 > Overview**에서 R2 구독 checkout. — [R2 Get started](https://developers.cloudflare.com/r2/get-started/) (accessed 2026-10-06, confidence: High)
- `r2.dev`는 "rate-limited and should only be used for development"(수백 rps 넘으면 429, 대역폭 조절, 캐시 불가). 운영은 같은 계정 존의 커스텀 도메인: **R2 → 버킷 → Settings → Custom Domains → Add**. — [Public buckets](https://developers.cloudflare.com/r2/buckets/public-buckets/), [R2 Limits](https://developers.cloudflare.com/r2/platform/limits/) (accessed 2026-10-06, confidence: High)
- 기본 캐시 확장자에 `EXE` 포함, HTML·JSON은 미포함 → 키에 버전을 넣는다 [추론]. — [Default cache behavior](https://developers.cloudflare.com/cache/concepts/default-cache-behavior/) (accessed 2026-10-06, confidence: High)
- 업로드 `wrangler r2 object put <bucket>/<key> --file <path> --remote`(`--content-type` 등). Actions에서는 wrangler-action `command:`로, 토큰에 Workers R2 Storage Write. — [Wrangler R2 commands](https://developers.cloudflare.com/workers/wrangler/commands/r2/) (accessed 2026-10-06, confidence: High)

**winget과의 관계**
- 정책 1.1.4 "The InstallerUrl must be the ISV's release location for the Product. Products from download websites will not be allowed."(2026-08-30) — [winget policies](https://learn.microsoft.com/en-us/windows/package-manager/package/windows-package-manager-policies) (accessed 2026-10-06, confidence: High)
- `Validation-Indirect-URL` "a redirector has been used. This is not allowed"; `Validation-Domain` "comes directly from the ISV's release location"; `URL-Validation-Error`에 "URL reputation test failed" 포함; `Validation-Hash-Verification-Failed`는 vanity URL 뒤 설치기가 바뀐 경우. — [Submit your manifest](https://learn.microsoft.com/en-us/windows/package-manager/package/repository) (accessed 2026-10-06, confidence: High)
- → `/download/windows`(302)는 InstallerUrl 불가. 자기 도메인 직접 파일(`dl.example.app/v0.1.0/...`)은 문구상 허용될 수 있으나 새 도메인 평판은 미지수 [추론]. GitHub 버전 경로는 선례로 검증됨(앞선 배포 조사).
- 불변 릴리스는 publish 뒤 자산·태그를 잠그고, 권장 흐름은 draft → 자산 첨부 → publish. winget 해시 안정에 도움 [추론]. — [Immutable releases](https://docs.github.com/en/code-security/supply-chain-security/understanding-your-software-supply-chain/immutable-releases) (accessed 2026-10-06, confidence: High)

### Gaps
- R2 도메인 URL로 winget을 통과한 선례는 확인 안 했다. Web Analytics는 사용자 정의 이벤트가 없어("Not yet") 다운로드 수는 GitHub `download_count`가 가장 쉬운 출처다.

## Q6. Tauri updater 엔드포인트

### Takeaway
updater는 리디렉트를 따라가고(reqwest 기본 10홉) 엔드포인트를 순서대로 시도하며, 비-2xx나 네트워크 오류일 때만 다음으로 넘어간다. 그래서 "자기 도메인(302 → GitHub)을 첫째, GitHub `latest.json`을 둘째"가 성립한다. 주의 두 가지: tauri-action v1은 `latest.json`에 `api.github.com/.../releases/assets/<id>`를 써서 다운로드가 비인증 API 한도(IP당 시간 60회)를 쓴다 [실측]. 2xx인데 JSON이 아니면(도메인 만료 후 파킹 페이지 등) 다음 엔드포인트로 넘어가지 않고 검사가 실패한다(소스).

### Cited Findings
- 문서: 원문 "TLS is enforced in production mode. Tauri will only continue to the next url if a non-2XX status code is returned!" 변수 `{{current_version}}`, `{{target}}`(linux·windows·darwin), `{{arch}}`(x86_64·i686·aarch64·armv7). 정적 예 `https://github.com/user/repo/releases/latest/download/latest.json`. 필수 키 `version`·`platforms.[target].url/signature`. 동적 서버는 업데이트 없으면 204. Rust에서 런타임 `.endpoints()`. — [Tauri v2 Updater](https://v2.tauri.app/plugin/updater/) (accessed 2026-10-06, confidence: High)
- 소스(tauri-plugin-updater 2.13.1): 검사는 `ClientBuilder::new()`(리디렉트 정책 미설정) + `Accept: application/json`, 다운로드는 `Accept: application/octet-stream`. 문서에 없는 `{{bundle_type}}` 치환도 있다. 2xx면 `res.json().await?`라 JSON 파싱 실패는 즉시 오류로 끝난다. — [updater.rs](https://github.com/tauri-apps/plugins-workspace/blob/v2/plugins/updater/src/updater.rs) (accessed 2026-10-06, confidence: High)
- reqwest 원문 "By default, a `Client` will automatically handle HTTP redirects, having a maximum redirect chain of 10 hops." — [reqwest::redirect](https://docs.rs/reqwest/latest/reqwest/redirect/index.html) (accessed 2026-10-06, confidence: High)
- tauri-action 1.0.0 원문 "The download urls in `latest.json` will now use the github url instead of the browser download url." 소스는 `${githubBaseUrl}/repos/${owner}/${repo}/releases/assets/${id}`(기본 `https://api.github.com`). 동기는 비공개 저장소이고 관리자도 "maybe it has different rate limits ... idk". — [CHANGELOG](https://github.com/tauri-apps/tauri-action/blob/dev/CHANGELOG.md), [upload-version-json.ts](https://github.com/tauri-apps/tauri-action/blob/action-v1.0.0/src/upload-version-json.ts), [issue #1297](https://github.com/tauri-apps/tauri-action/issues/1297) (accessed 2026-10-06, confidence: High)
- [실측] tauri-action@v1 사용 저장소 2곳(wlphp/cloudhub-tools v0.1.36, Naitik4516/AMUS v0.9.0)의 `latest.json` URL이 모두 `https://api.github.com/repos/<owner>/<repo>/releases/assets/<id>`.
- [실측] 비인증 `curl -H "Accept: application/octet-stream" https://api.github.com/repos/cli/cli/releases/assets/<id>` → 302, `X-RateLimit-Limit: 60`, `X-RateLimit-Resource: core`. IP를 공유하는 회사·학교에서는 실패할 수 있다 [추론]. 문서도 "API clients should handle both a 200 or 302 response". — [REST: Release assets](https://docs.github.com/en/rest/releases/assets) (High)
- 저장소 개명 시 웹 트래픽은 넘어가지만 "do not reuse the original name ... redirects ... will no longer work". — [Renaming a repository](https://docs.github.com/en/repositories/creating-and-managing-repositories/renaming-a-repository) (accessed 2026-10-06, confidence: High)
- 업데이트 파일은 앱에 박힌 Tauri 공개키로 서명 검증(끌 수 없음) → 엔드포인트를 남이 차지해도 악성 설치기는 못 넣고 업데이트를 막는 정도 [추론]. — [Tauri v2 Updater](https://v2.tauri.app/plugin/updater/) (High)

| 방식 | 장점 | 단점 |
|---|---|---|
| GitHub `latest.json` 직접 | 인프라 0, 만료 위험 없음 | 저장소·계정에 묶임 |
| 자기 도메인 302 → GitHub | 앱 수정 없이 호스팅 교체, 나중에 Worker로 204·단계 배포 가능(URL에 변수) | 도메인 계속 갱신, 파킹 200이면 실패 |
| 자기 도메인 정적 파일 | GitHub 장애와 분리 | 릴리스·빌드 동기화 |

```txt
# site/public/_redirects (정적 규칙 먼저, 빌드 전 스크립트가 버전을 채움)
/download/windows  https://github.com/cyKim0115/Frond/releases/download/v0.1.0/Frond_0.1.0_x64-setup.exe  302
/update/:target/:arch/:version  https://github.com/cyKim0115/Frond/releases/latest/download/latest.json  302
```

```json
"plugins": { "updater": { "pubkey": "…", "endpoints": [
  "https://example.app/update/{{target}}/{{arch}}/{{current_version}}",
  "https://github.com/cyKim0115/Frond/releases/latest/download/latest.json"
] } }
```

API 한도를 피하려면 tauri-action 뒤(draft 상태에서) `latest.json` URL을 브라우저 다운로드 URL로 바꿔 다시 올린다. Frond는 Windows x64 NSIS 하나라 모든 키가 같은 파일을 가리킨다 [추론, 예시]:

```bash
TAG="v${V}"; gh release download "$TAG" -p latest.json --clobber
URL="https://github.com/${GITHUB_REPOSITORY}/releases/download/${TAG}/Frond_${V}_x64-setup.exe"
jq --arg u "$URL" '.platforms |= map_values(.url = $u)' latest.json > l.json && mv l.json latest.json
gh release upload "$TAG" latest.json --clobber
```

### Gaps
- 개명 뒤 `releases/latest/download/...` 경로가 넘어가는지는 문서에 명시가 없다. v0.1.0 전에 개명하면 질문이 사라진다. 60회 한도가 실사용자에게 문제 되는 빈도는 측정 안 했다.

## Q7. 부가 기능

### Takeaway
Web Analytics는 무료이고 쿠키·localStorage·핑거프린팅을 쓰지 않는다. 하지만 "동의 배너가 필요 없다"는 문장을 Cloudflare가 직접 쓰지는 않았다. Worker 서빙 페이지에 자동 삽입이 안 됐다는 보고가 있어 스니펫을 직접 넣는다. Email Routing은 무료 수신 전달만 되고, `support@`로 아무에게나 보내려면 Workers Paid($5/월)의 Email Sending(베타)이 필요하다. 폼이 없으면 Turnstile은 필요 없다. 도메인 말고는 0원이다.

### Cited Findings
- 원문 "Cloudflare Web Analytics does not collect or use your visitors' personal data." / "does not use any client-side state, such as cookies or localStorage ... We also don't "fingerprint" individuals". — [About](https://developers.cloudflare.com/web-analytics/about/), [Cloudflare Web Analytics](https://www.cloudflare.com/web-analytics/) (accessed 2026-10-06, confidence: High)
- **Web Analytics → Add a site**. 프록시 사이트는 자동 설정이 기본, **Manage site**에서 "Enable with JS Snippet installation" 등 선택. Pages의 **Metrics → Enable** 같은 Workers용 항목은 문서에 없다. — [Get started](https://developers.cloudflare.com/web-analytics/get-started/) (accessed 2026-10-06, confidence: High)
- CSP: `script-src https://static.cloudflareinsights.com/beacon.min.js`, 수동 삽입이면 `connect-src cloudflareinsights.com`. 광고 차단기가 막음, 사용자 정의 이벤트 없음, 사이트 10개 소프트 한도. — [Web Analytics FAQ](https://developers.cloudflare.com/web-analytics/faq/) (accessed 2026-10-06, confidence: High)
- 2026-10-02 PR 원문 "the beacon was never injected into the pages (they're served by the Worker ...)" → 수동 삽입 + "Enable with JS Snippet installation". — [maxbkelly/max-portfolio#62](https://github.com/maxbkelly/max-portfolio/pull/62) (accessed 2026-10-06, confidence: **Low**). 정적 자산 Worker에서 자동 설정을 전제한 반대 사례 — [nickolaj-jepsen/walldye#20](https://github.com/nickolaj-jepsen/walldye/pull/20) (**Low**)
- Cloudflare 봇 쿠키 `__cf_bm`은 Bot Fight Mode·Bot Management를 켰을 때만. Cloudflare는 이 쿠키들을 "strictly necessary"로 보고 고객에게 고지를 권한다. — [Cloudflare Cookies](https://developers.cloudflare.com/fundamentals/reference/policies-compliances/cloudflare-cookies/) (accessed 2026-10-06, confidence: High)
- Email Routing은 Free·Paid 모두, Email Sending(Beta)은 Workers Paid(월 3,000통 포함 후 1,000통당 $0.35), 수신 무제한, 인증된 수신 주소로 보내기는 무료. — [Email Service](https://developers.cloudflare.com/email-service/), [Pricing](https://developers.cloudflare.com/email-service/platform/pricing/) (accessed 2026-10-06, confidence: High)
- **Compute > Email Service > Email Routing → Onboard Domain**이 MX(`route1~3.mx.cloudflare.net`)·SPF·DKIM을 자동 추가 → **Destination Addresses** 인증 → **Routing Rules → Create routing rule**(Send to an email/Worker/Drop), Catch-all 선택. 한도: 도메인당 규칙 200, 수신 25 MiB. 받은편지함 저장은 없다. — [Domain configuration](https://developers.cloudflare.com/email-service/configuration/domains/), [Routing rules and addresses](https://developers.cloudflare.com/email-service/configuration/email-routing-addresses/), [Limits](https://developers.cloudflare.com/email-service/platform/limits/), [Developer Platform terms](https://www.cloudflare.com/service-specific-terms-developer-platform/) (accessed 2026-10-06, confidence: High)
- `_headers`: 기본 헤더(`Cache-Control: public, max-age=0, must-revalidate`, `ETag`) 덮어쓰기, `! 이름`으로 제거, 100규칙, Worker 코드 응답에는 미적용. 예시 헤더 `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, CSP. — [Headers](https://developers.cloudflare.com/workers/static-assets/headers/) (accessed 2026-10-06, confidence: High)
- Turnstile은 프록시 없이도 붙고 Free는 위젯 20개·챌린지 무제한. — [Turnstile plans](https://developers.cloudflare.com/turnstile/plans/) (accessed 2026-10-06, confidence: High)

```txt
# site/public/_headers — CSP는 Report-Only로 먼저 시험(Web Analytics FAQ 권고)
/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  X-Frame-Options: DENY
  Content-Security-Policy-Report-Only: default-src 'self'; script-src 'self' https://static.cloudflareinsights.com; connect-src 'self' https://cloudflareinsights.com; img-src 'self' data:; frame-ancestors 'none'
/_astro/*
  Cache-Control: public, max-age=31536000, immutable
```

**비용**: Workers·Web Analytics·Email Routing·DNS·인증서 0원 → 도메인만(연 약 $10~15, [Low]). R2는 무료 구간이어도 구독 checkout이 필요하고, 발신 메일은 Workers Paid $5/월부터.

### Gaps
- 동의 배너의 법적 필요성(한국 개인정보보호법, EU ePrivacy)은 분석 안 했다. 개인정보처리방침에 Web Analytics 사용을 적는 것이 무난하다 [추론]. 정적 자산 Worker의 자동 삽입 여부는 보고가 엇갈린다. R2 checkout에 결제 수단이 필수인지는 문서에 없다.

## Q8. 비교 (짧게)

### Takeaway
GitHub Pages는 예비안으로 충분하다. Netlify 무료는 월 300 크레딧 하드 한도(운영 배포 1회 15크레딧)라 빠듯하다. Vercel Hobby는 비상업 전용이고 "제품·서비스 판매 광고"도 상업으로 보므로 Store add-on을 소개할 Frond 사이트에는 맞지 않는다.

### Cited Findings
- GitHub Pages: "not intended for or allowed to be used ... to run your online business, e-commerce site, or any other website that is primarily directed at either facilitating commercial transactions or providing commercial software as a service". 사이트 1 GB, 월 100 GB 소프트, 빌드 시간당 10회(Actions 게시 제외), 배포 10분. apex·`www` 커스텀 도메인, 비 Jekyll은 Actions 게시 권장. — [Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits), [About custom domains](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/about-custom-domains-and-github-pages), [Publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) (accessed 2026-10-06, confidence: High)
- Netlify Free: 300 크레딧, 운영 배포 15, 대역폭 GB당 20, 요청 1만 건당 2. 원문 "When a site reaches its monthly usage limits, it enters a paused state until the start of the next billing cycle ... all projects on your account will be paused." — [Netlify Pricing](https://www.netlify.com/pricing/) (accessed 2026-10-06, confidence: High)
- Vercel 원문 "**Hobby teams** are restricted to non-commercial personal use only." 상업 예: "Any method of requesting or processing payment from visitors of the site", "Advertising the sale of a product or service". 기부 요청은 예외(2026-09-14 갱신). — [Fair use guidelines](https://vercel.com/docs/limits/fair-use-guidelines), [Hobby plan](https://vercel.com/docs/plans/hobby) (accessed 2026-10-06, confidence: High)
- Cloudflare 문서·서비스별 약관(CDN·Developer Platform 조항)에서는 비상업 전용 조건을 보지 못했다.

### Gaps
- Netlify 상업 조건, GitHub Pages의 사용자 정의 헤더·서버 리디렉트 지원은 확인 안 했다.

## Frond에 주는 시사점

1. **Workers 정적 자산(정적 전용).** `main`·`run_worker_first`·`cache`를 안 쓰면 요청 과금이 없다. Pages로 얻는 것은 외부 DNS CNAME 하나뿐이다.
2. **도메인은 Registrar로 사서 Cloudflare DNS에.** `frond.app/.dev/.com`은 남의 것이라 후보는 `frond.page`·`getfrond.app`·`frondapp.dev` 같은 RDAP 미등록 이름이다(대시보드 검색으로 최종 확인).
3. **apex + `/docs/` + `www`→apex 301**이 가장 싸다. `dl.`은 R2를 쓸 때만.
4. **CI는 Workers Builds + Deploy Hook.** 재빌드는 `release.yml` 마지막 단계의 curl(GITHUB_TOKEN publish는 `release` 이벤트를 안 만든다).
5. **설치기는 GitHub Releases.** 사이트가 빌드 때 URL·크기·SHA256을 박고, `/download/windows` 302는 README·블로그용(winget엔 금지).
6. **updater 엔드포인트는 v0.1.0 전에 확정**, 그 전에 저장소 개명. 권장 `[자기 도메인 /update/{{target}}/{{arch}}/{{current_version}}, GitHub latest.json]` → 도메인 자동 갱신이 운영 규칙이 된다. tauri-action v1 API URL은 `latest.json` 치환으로 피한다.
7. **`/privacy`를 둔다.** Store 제출과 winget `PrivacyUrl`에 쓰고 Web Analytics(쿠키 없음) 사용을 적는다.
8. **`support@`는 수신 전달만.** 답장은 개인 주소로 나간다.

## 사용자가 직접 할 단계(순서·화면 이름)

0. **GitHub(선행)**: 저장소 **Settings → General → Repository name**을 `Frond`로 **Rename**. 옛 이름으로 새 저장소를 만들지 않는다. 그 뒤 v0.1.0을 낸다.
1. **Cloudflare 계정**: `dash.cloudflare.com` 가입 → 이메일 인증(Registrar 필수) → **My Profile**에서 2단계 인증.
2. **도메인**: **Domains → Register domains** → 검색 → **Purchase** → **Payment option**(기간) → 연락처(영문) → 결제 → **Complete purchase** → 등록자 인증 메일 확인 → **Auto-renew** 켜짐 확인·DNSSEC 켜기. 외부 도메인이면 **Domains → Onboard a domain** → Free → 옛 등록처 DNSSEC 끄기 → 네임서버 교체 → **Active** 대기.
3. **저장소(Cursor)**: `site/package.json`(devDependencies `wrangler` ≥ 4.135.0), `site/wrangler.jsonc`(Q1), `site/.nvmrc`(`24`), `site/public/_redirects`·`_headers` 커밋.
4. **Workers + GitHub**: **Workers & Pages → Create application → Import a repository → Get started** → **Git account**에서 GitHub 연결("Cloudflare Workers and Pages" 앱, **Only select repositories**) → 저장소 → 이름 = `wrangler.jsonc`의 `name` → Root directory `site` → Build `npm run build` → Deploy `npx wrangler deploy` → **Save and Deploy**.
5. **빌드 설정**(Worker → **Settings → Build**): **Build watch paths** include `site/*` / **Branch control** 운영 `main` + **Enable Preview Builds** / **Build variables and secrets**에 (API를 쓰면) `GITHUB_TOKEN` / **Deploy Hooks** 이름 `release`·브랜치 `main` → URL을 GitHub **Settings → Secrets and variables → Actions → New repository secret** `CF_SITE_DEPLOY_HOOK`에.
6. **커스텀 도메인**: 첫 배포 뒤 Worker → **Settings → Domains & Routes**에 apex가 보이는지 확인(없으면 **Add → Custom Domain**, 그때는 `routes` 키 삭제). `www`: 존 **DNS → Records**에 A `www` → `192.0.2.1` **Proxied** → **Rules → Overview → Create rule → Redirect Rule** → 템플릿 "Redirect from WWW to root" → **Deploy**.
7. **Web Analytics**: **Web Analytics → Add a site** → 호스트 선택 → **Manage site** → "Enable with JS Snippet installation" → 스니펫을 공통 레이아웃에, CSP에 허용 추가.
8. **Email Routing**: **Compute → Email Service → Email Routing → Onboard Domain** → DNS 추가 승인 → **Destination Addresses**에 개인 메일 + **Verify email address** → **Routing Rules → Create routing rule** `support` → Send to an email.
9. **(선택) R2**: **Storage & databases → R2 → Overview** checkout → **Create bucket** → **Settings → Custom Domains → Add** `dl.<도메인>`. Actions용 토큰은 **Account API tokens → Create Token → Edit Cloudflare Workers**(계정·존 한정) → `CLOUDFLARE_API_TOKEN`·`CLOUDFLARE_ACCOUNT_ID` 비밀.
10. **확인**: `curl -I https://<도메인>/`(200), `https://www.<도메인>/`(301), `https://<도메인>/download/windows`(302 → GitHub), PR을 열어 Preview URL 댓글 확인.

## 요약 표

| 항목 | 권장 | 근거·수치 | 남는 위험 |
|---|---|---|---|
| 호스팅 | Workers 정적 자산(`main`·어댑터 없음) | "Start new projects with Workers", 정적 요청 무료·무제한, 파일 20,000·25 MiB | 네임서버가 Cloudflare여야 함 |
| CI | Workers Builds(root `site`, watch `site/*`) + Deploy Hook | 월 3,000분, 동시 1, 20분 | GITHUB_TOKEN publish는 `release` 이벤트 없음 |
| 도메인 | Registrar, apex + `/docs/`, `www`→apex 301 | 원가, `.kr` 미지원 [실측], `.app/.dev/.page` HTTPS 강제 [실측] | 공식 가격 미확인([Low] `.com` $10.46, `.app` 갱신 $14.20) |
| 다운로드 | GitHub Releases + 빌드 때 URL·크기·SHA256, `/download/windows` 302 | `digest` [실측], 비인증 API 60회/시 | 빌드 API 한도 → 토큰 또는 `download.json` |
| winget | GitHub 버전 경로 URL | 정책 1.1.4, `Validation-Indirect-URL` | 사이트 리디렉트·새 도메인 금지·미지수 |
| updater | `[자기 도메인 302, GitHub latest.json]` | 10홉 추종, 비-2xx면 다음 URL | 파킹 200 HTML이면 실패, v1 API URL 한도 |
| 분석·메일 | Web Analytics 수동 스니펫, Email Routing 수신 | 쿠키 없음, 수신 무료 | 배너 문구 없음, 발신은 Workers Paid |
| 비용 | 도메인만(연 약 $10~15) | 나머지 무료 구간 | R2·발신 메일 쓰면 별도 |
| 대안 | GitHub Pages(예비) | 1 GB, 월 100 GB 소프트 | Vercel Hobby 판매 광고 금지, Netlify 300 크레딧 |
