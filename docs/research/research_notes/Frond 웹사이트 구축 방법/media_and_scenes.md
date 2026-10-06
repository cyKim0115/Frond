# Frond 웹사이트: 사용 장면(스크린샷·동영상) 넣기·캡처 방법·다운로드 부가 요소 (2026-10 기준)

> 조사일 2026-10-06. 대상: Frond 제품·다운로드 사이트(Fork형)와 문서 사이트(Astro+Starlight 유력)에 넣을 사용 장면 미디어, 그 미디어를 다시 찍을 수 있게 하는 캡처 방법, 다운로드 페이지 부가 요소(Store 배지·winget·SmartScreen 안내·SHA256), OG 이미지·파비콘.
> 표기: **[실측]** = 이번에 직접 확인한 것(curl·ffprobe·ffmpeg 9.0·npm view·GitHub API·저장소 코드). **[Low]** = 블로그·포럼·검색 요약. **[오래됨?]** = 2025년 이전 정보.
> 범위 밖: 다른 앱 사이트의 전체 구성(미디어만 봄), 문서 플랫폼 비교, Cloudflare 배포·도메인(다른 조사자). 동영상 배치에 걸리는 Cloudflare 정적 자산 제약(파일 크기·Range)만 Q2에 적었다.
> 앱 전제 **[실측 — 저장소]**: 창 `inner_size(1100, 800)`·`decorations(false)`(`src-tauri/src/lib.rs` 180~185행), capability에 창 크기 변경 권한 없음, 테마 기본값 `system`(`src/settings.ts` 58행)이고 `prefers-color-scheme`·`prefers-reduced-motion` change를 듣는다(`src/main.ts` 1704·1715·1759·1762행), 상태 표시줄에 문서 전체 경로 표시(`src/main.ts` 1380행), UI·본문 글꼴 첫 순위는 번들 안 된 Pretendard(`src/style.css` 28행 — 이 PC엔 미설치), 기존 CDP 캡처는 1100×800 px(`docs/qa/20261001-phase2-b/`, 배율 100%).

## Q1. 데스크톱 앱 랜딩 페이지 미디어 모범 사례

### Takeaway
히어로는 정지 스크린샷이 가장 안전하다(2x, AVIF/WebP, `width`·`height`, `fetchpriority="high"`, 지연 로드 금지). 움직임은 짧은 무음 반복 영상(MP4·H.264 기본)으로, GIF는 쓰지 않는다(같은 10초가 GIF 9.1 MB, MP4 0.36 MB[실측]). `muted`+`playsinline`이면 자동 재생되지만 동작 줄이기 사용자를 위해 스크립트로 조건부 재생하고 멈춤 수단을 둔다. `<picture>`의 `prefers-color-scheme`는 OS 설정만 따른다.

### Cited Findings
**GIF 대신 동영상·코덱**
- 예시 GIF 3.7 MB → MP4 551 KB·WebM 341 KB, GIF 대용 영상은 `autoplay loop muted playsinline` — [web.dev: Replace animated GIFs with video](https://web.dev/articles/replace-gifs-with-videos) (accessed 2026-10-06, confidence: Medium) [오래됨? 2018-11]
- [실측] Raycast 클립(1280×720 H.264) 앞 10초를 폭 960px로: GIF(15fps 256색) 9,089,866 B / H.264 CRF28(60fps 무음) 355,888 B / VP9 CRF40 382,249 B / AV1(SVT) CRF40 345,582 B. 원본이 손실 영상이라 재인코딩에 유리했고 코덱 간 CRF는 같은 화질이 아니다 — 로컬 ffmpeg 9.0 (accessed 2026-10-06, confidence: High)
- 한 형식만 낸다면 ① WebM+AV1 ② MP4+H.264(모든 주요 브라우저 지원). AV1은 Safari에서 하드웨어 디코더 기기(M3 이후 Mac, iPhone 15 Pro·16 이후)만 — [MDN: Web video codec guide](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Video_codecs) (accessed 2026-10-06, confidence: High)
- x264 CRF 0~51(기본 23, 실용 17~28, +6이면 용량 약 절반), 웹용 `-movflags +faststart`, 호환 `-pix_fmt yuv420p` — [FFmpeg Wiki: Encode/H.264](https://trac.ffmpeg.org/wiki/Encode/H.264) (accessed 2026-10-06, confidence: Medium)

**자동 재생·preload·지연 로드**
- 자동 재생은 음소거·사용자 상호작용·허용 목록·Permissions Policy 중 하나면 허용, 오디오 트랙이 없거나 음소거면 차단 대상이 아님, Safari는 `playsinline` 필요, 실패는 `play()`의 `NotAllowedError`나 `navigator.getAutoplayPolicy()`로 감지 — [MDN: Autoplay guide (2026-09-10)](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay) (accessed 2026-10-06, confidence: High). Chrome도 음소거 자동 재생은 항상 허용 — [Chrome: Autoplay policy](https://developer.chrome.com/blog/autoplay) (accessed 2026-10-06, confidence: Medium) [오래됨? 2017]
- `<video>`: 불리언 속성은 제거해야 꺼짐, `poster` 없으면 첫 프레임까지 빈 화면, `preload`(none/metadata/auto) 기본은 브라우저마다(스펙 권고 metadata)이고 `autoplay`가 우선, `width`·`height`는 지연 로드 영상의 레이아웃 이동 방지에 중요, `loading="lazy"`면 다운로드·포스터·자동 재생을 뷰포트 근처까지 미룸, 캡션은 `<track>` — [MDN: `<video>` (2026-07-16)](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/video) (accessed 2026-10-06, confidence: High)
- Chrome 148(2026-05-05)부터 `<video>`·`<audio>`의 `loading` 속성 — [New in Chrome 148](https://developer.chrome.com/blog/new-in-chrome-148) (accessed 2026-10-06, confidence: High). Firefox·WebKit은 구현 검토 중, 미지원 브라우저는 무시하므로 안전, 감지는 `'loading' in HTMLMediaElement.prototype` — [Squarespace Engineering (2026-04, 05 갱신)](https://engineering.squarespace.com/blog/2026/how-to-use-standard-html-video-and-audio-lazy-loading-on-the-web-today) (accessed 2026-10-06, confidence: Medium)
- 비자동 재생 영상은 `preload="none"`+`poster`, GIF 대용 영상은 `autoplay` 없이 IntersectionObserver로 보일 때 재생 — [web.dev: Lazy loading video (2026-07-02)](https://web.dev/articles/lazy-loading-video) (accessed 2026-10-06, confidence: High)

**동작 줄이기·접근성**
- `prefers-reduced-motion`은 Windows 10 "Windows에서 애니메이션 표시", Windows 11 "시각 효과 > 애니메이션 효과"와 연동 — [MDN: prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion) (accessed 2026-10-06, confidence: High). `<picture>`의 `<source media="(prefers-reduced-motion: no-preference)">`에 움직이는 버전을 두는 패턴 — [web.dev: prefers-reduced-motion](https://web.dev/articles/prefers-reduced-motion) (accessed 2026-10-06, confidence: Medium) [오래됨? 2019]
- WCAG 2.2.2(A): 자동 시작·5초 초과·다른 콘텐츠와 병렬로 움직이는 정보에는 멈춤·정지·숨김 수단 — [W3C Understanding 2.2.2](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html) (accessed 2026-10-06, confidence: High)
- WCAG 1.2.1(A): 무음 녹화 영상엔 동등한 텍스트 대체(또는 오디오)가 필요, 텍스트의 미디어 대체물로 표시하면 예외 — [W3C Understanding 1.2.1](https://www.w3.org/WAI/WCAG22/Understanding/audio-only-and-video-only-prerecorded.html); 정보 이미지의 alt는 핵심을 짧게 — [W3C WAI: Informative Images](https://www.w3.org/WAI/tutorials/images/informative/) (accessed 2026-10-06, confidence: High)

**LCP·CLS**
- LCP 후보는 `<img>`(애니메이션은 첫 프레임), `<video>`는 포스터 로드와 첫 프레임 중 이른 시각, 배경 이미지, 텍스트 블록. 목표 p75 2.5초 — [web.dev: LCP (2025-09-04)](https://web.dev/articles/lcp) (accessed 2026-10-06, confidence: High). 2018년 GIF 글의 "포스터 없는 영상은 후보 아님"과 어긋나므로 최신 문서를 따른다.
- 뷰포트 안 이미지도 레이아웃 전엔 낮은 우선순위라 LCP 이미지에 `fetchpriority="high"`(힌트), 지원 Chrome·Edge 102+, Firefox 132+, Safari 17.2+ — [web.dev: Fetch Priority](https://web.dev/articles/fetch-priority) (accessed 2026-10-06, confidence: Medium)
- 첫 화면·LCP 이미지는 지연 로드 금지 — [web.dev: Browser-level lazy loading (2024-08)](https://web.dev/articles/browser-level-image-lazy-loading) (accessed 2026-10-06, confidence: High). 지연 로드 페이지 LCP 중앙값 624 ms 느림, WordPress 실험에서 끄자 13~15% 개선 — [web.dev: Too much lazy-loading](https://web.dev/articles/lcp-lazy-loading) (accessed 2026-10-06, confidence: Medium) [오래됨? 2022]
- img·video에 `width`·`height`를 주면 로드 전에 비율을 잡는다(CSS `width:100%; height:auto`), art direction은 `<source>`에도 지정 가능 — [web.dev: Optimize CLS (2025-02)](https://web.dev/articles/optimize-cls) (accessed 2026-10-06, confidence: High)

**형식·srcset·라이트/다크**
- 래스터는 WebP·AVIF 우선+`<picture>` 폴백, 스크린샷·도표는 무손실 권장(글자 번짐), WebP·AVIF 모두 무손실 모드 있음, AVIF는 Chrome 85·Edge 121·Firefox 93·Safari 16.1부터 — [MDN: Image file type and format guide (2026-09-22)](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Image_types) (accessed 2026-10-06, confidence: High)
- [실측] UI 스크린샷(Obsidian `publish-example-dark.png` 2899×1757, 원본 256색 PNG 213,097 B): 풀컬러 PNG 447,134 B / WebP 무손실 159,954 B / WebP q90 182,916 B / WebP q75 127,508 B / AVIF 4:4:4 CRF20 115,925 B / AVIF 4:2:0 CRF30 90,184 B / JPEG 334,775 B. 원본이 256색이라 일반 캡처보다 잘 줄어드는 조건 (accessed 2026-10-06, confidence: High)
- `srcset` 밀도 서술자 `2x`(없으면 1x, w·x 혼용 금지) — [MDN: `<img>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/img); `<source media="(prefers-color-scheme: dark)">`로 라이트·다크 교체 — [MDN: `<picture>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/picture) (accessed 2026-10-06, confidence: High)
- 이 미디어 쿼리는 사이트 테마 버튼을 따르지 않아, 전환 때 JS로 `<source>`의 `media`를 `all`/`none`으로 바꾸는 기법 — [Lars Magnus 블로그 (2022)](https://larsmagnus.co/blog/how-to-make-images-react-to-light-and-dark-mode) (accessed 2026-10-06, confidence: Low) **[Low][오래됨?]**
- `display:none`인 `loading="lazy"` 이미지는 주요 브라우저가 받지 않는다는 서술 — [OpenReplay 블로그](https://blog.openreplay.com/native-image-lazy-loading-html/) (accessed 2026-10-06, confidence: Low) **[Low]**. eager 이미지는 숨겨도 받는다(Q2 Starlight Hero).

### Gaps
- 절전 모드(Safari 저전력 등)의 자동 재생 차단은 1차 자료 미확인 — 포스터는 항상 둔다.
- `<picture>` 안 `fetchpriority` 위치(`<img>`)는 관행이며 web.dev가 직접 다루지 않는다.
- AVIF 4:2:0이 색 있는 글자에 주는 번짐은 눈으로 비교하지 않았다.

## Q2. Astro·Starlight에서 이미지·동영상 다루기

### Takeaway
astro 7.3.5, @astrojs/starlight 0.42.5[실측]. 스크린샷 원본은 `src/assets/`에 두고 `<Picture formats={['avif','webp']}>`로 빌드 때 변환하며 히어로엔 `priority`. 동영상은 Astro가 처리하지 않아 `public/`에 두는데, Cloudflare Pages는 Range 요청에 200을 준다고 공식 문서가 적고 Workers 정적 자산도 같았다[실측] — Safari 재생은 배포 후 실기 확인. Starlight는 로고·히어로만 라이트/다크 변형을 지원하므로 본문 이미지는 작은 컴포넌트로, 확대는 starlight-image-zoom 0.16.0.

### Cited Findings
- [실측] `npm view`: astro 7.3.5(2026-10-02), @astrojs/starlight 0.42.5(peer astro ^7.2.10), @astrojs/mdx 8.0.2, starlight-image-zoom 0.16.0(peer starlight >=0.42.0), astro-og-canvas 0.13.2(peer astro ^5‖^6‖^7), satori 0.35.0, @resvg/resvg-js 2.6.2, sharp 0.35.5 (accessed 2026-10-06, confidence: High)
- `src/` 이미지는 변환·최적화·번들, `public/`은 그대로 복사(최적화·반응형 없음). Markdown `![alt](상대경로)`, MDX는 `<Image>`·`<Picture>` import. 네이티브 동영상 지원은 없고 호스팅 서비스를 권함(가이드: Cloudinary·ImageKit·Mux) — [Astro Docs: Images](https://docs.astro.build/en/guides/images/) (accessed 2026-10-06, confidence: High)
- `<Image>`: alt 필수, `format` 기본 webp, `densities` 또는 `widths`+`sizes`, `quality`(프리셋·0~100), `priority`(5.10+: eager·sync·fetchpriority high), `layout`. `<Picture>`: `formats` 기본 `['webp']`, `fallbackFormat`은 원본 종류(정지 이미지 png 등), `pictureAttributes` — [Astro: astro:assets reference](https://docs.astro.build/en/reference/modules/astro-assets/) (accessed 2026-10-06, confidence: High)
- 기본 생성 속성 loading lazy·decoding async, `image.layout`·`responsiveStyles`(5.10+), `image.breakpoints` 기본 `[640, 750, 828, 1080, 1280, 1668, 2048, 2560]` — [Astro: Configuration reference](https://docs.astro.build/en/reference/configuration-reference/) (accessed 2026-10-06, confidence: High)
- Starlight Markdown 이미지는 Astro 자산 최적화를 그대로 씀 — [Starlight: Authoring content](https://starlight.astro.build/guides/authoring-content/); `hero.image`의 `dark`·`light` — [Frontmatter reference](https://starlight.astro.build/reference/frontmatter/); 로고 `logo.light`·`logo.dark` — [Customization](https://starlight.astro.build/guides/customization/) (accessed 2026-10-06, confidence: High)
- [실측] Starlight 소스: `Hero.astro`는 두 `<Image>`를 모두 `loading: 'eager'`로 그리고 `light:sl-hidden`·`dark:sl-hidden`으로 하나를 숨긴다(`util.css`의 `[data-theme='light'|'dark']` 선택자로 `display:none`). `ThemeProvider.astro` 인라인 스크립트가 localStorage `starlight-theme` 또는 `prefers-color-scheme`로 렌더 전에 `<html data-theme>`를 정한다 — [Hero.astro](https://github.com/withastro/starlight/blob/main/packages/starlight/src/components/Hero.astro), [util.css](https://github.com/withastro/starlight/blob/main/packages/starlight/src/style/util.css), [ThemeProvider.astro](https://github.com/withastro/starlight/blob/main/packages/starlight/src/components/ThemeProvider.astro) (accessed 2026-10-06, confidence: High — `sl-hidden`은 문서화된 공개 API 아님)
- Starlight Tailwind 통합은 `dark:` 변형을 Starlight 다크 모드에 맞춘다 — [Starlight: CSS & Tailwind](https://starlight.astro.build/guides/css-and-tailwind/) (accessed 2026-10-06, confidence: High)
- [실측] 본문 폭 `--sl-content-width: 45rem`(720px) — `props.css`. 1100px 창 전체 캡처를 넣으면 약 65%로 줄어 앱 글자가 9px 안팎(추론) (accessed 2026-10-06, confidence: High)
- starlight-image-zoom: 공식 플러그인 목록 등재, `plugins: [starlightImageZoom()]`, Markdown·HTML·`<Image>`/`<Picture>` 지원, `showCaptions` 기본 true(확대 시 alt를 캡션으로), `data-zoom-off`로 제외 — [Starlight: Plugins](https://starlight.astro.build/resources/plugins/), [starlight-image-zoom 문서](https://starlight-image-zoom.vercel.app/getting-started/) (accessed 2026-10-06, confidence: High)
- Cloudflare 정적 자산 파일당 25 MiB, 파일 수 무료 20,000·유료 100,000 — [Workers limits](https://developers.cloudflare.com/workers/platform/limits/), [Pages limits](https://developers.cloudflare.com/pages/platform/limits/) (accessed 2026-10-06, confidence: High)
- Pages는 HTTP Range 요청에 현재 `200`을 주고 206은 작업 중 — [Cloudflare Pages: Serving Pages](https://developers.cloudflare.com/pages/configuration/serving-pages/) (accessed 2026-10-06, confidence: High). Workers 정적 자산 기본 헤더는 `Cache-Control: public, max-age=0, must-revalidate`+ETag, `_headers`로 변경 — [Workers: Static assets headers](https://developers.cloudflare.com/workers/static-assets/headers/) (accessed 2026-10-06, confidence: High)
- Safari는 동영상에 Range(206) 응답을 요구하며, Pages에서 iOS 재생이 안 돼 Function으로 206을 구현한 사례 — [LogRocket](https://blog.logrocket.com/streaming-video-in-safari/), [seanrh34/34cats PR #6](https://github.com/seanrh34/34cats/pull/6) (accessed 2026-10-06, confidence: Low) **[Low]**
- [실측] `curl -r 0-1`: hono.dev(Workers 정적 자산 — `wrangler.jsonc`에 `assets`·`run_worker_first`)와 developers.cloudflare.com은 `200`+전체 길이, starlight.astro.build(Netlify)와 obsidian.md(Cloudflare 프록시 캐시)는 `206` (accessed 2026-10-06, confidence: Medium — 2곳 관찰)

### Gaps
- Astro 7 Sharp의 WebP/AVIF 기본 품질과 무손실 옵션 노출은 문서에서 못 찾았다(시험 빌드로 정한다).
- Workers 정적 자산 Range 처리의 공식 문서는 없다. R2 커스텀 도메인·Worker 206 처리는 후보일 뿐 미확인(Cloudflare 담당과 맞출 것).
- `display:none`+`loading="lazy"` 미다운로드는 블로그 근거뿐이다.

## Q3. 실제 사이트가 사용 장면을 보여 주는 방식(미디어만) [실측]

### Takeaway
여섯 곳 모두 실제 앱 화면을 쓰되 셋으로 갈린다: ① 캡처 정지 이미지+CSS 그림자(Fork), ② 기능별 짧은 녹화(Typora 3~5초 WebM, Raycast 15~28초 MP4, Zed 13~20초 HLS), ③ HTML로 다시 그린 UI(Obsidian 히어로, Linear). 그림자·모서리는 CSS로 입히거나(Fork·Typora·Obsidian) 배경에 합성해 굽는다(Zed·Raycast). 라이트/다크 두 벌은 없었고 Fork만 OS별(Mac/Win) 두 벌을 JS로 바꾼다.

### Cited Findings
모두 2026-10-06 홈(또는 지정 페이지) HTML을 curl로 받아 미디어 태그를 뽑고 파일을 ffprobe·HEAD로 잰 결과 (accessed 2026-10-06, confidence: High — 서버 렌더 HTML 기준).

| 사이트 | 주 미디어 | 형식·크기·길이 | 프레임·그림자 | 변형 |
|---|---|---|---|---|
| [fork.dev](https://fork.dev/) | 실제 캡처 JPG(히어로·기능·캐러셀 10장), 영상 없음 | `image1Win.jpg` 2216×1204 244,895 B, 기능 1692~2148px 94~249 KB. 표시 폭 약 1,100px → 약 2x | 앱 제목 표시줄 포함·그림자 없이 저장. CSS box-shadow 2겹+1px 테두리, Mac만 radius 6~9px | `navigator.platform`으로 Mac/Win 교체 |
| [typora.io](https://typora.io/) | 히어로 MP4+포스터, 기능 클립 10여 개 | `beta.mp4` H.264 1146×1014 27.7 s 396,285 B. 클립은 WebM(VP8/VP9)만, 폭 282~720px, 2.7~4.9 s, 23~363 KB, 50fps | 포스터에 macOS 창 프레임, CSS radius 8px+그림자 | 없음 |
| [obsidian.md](https://obsidian.md/) | 히어로는 HTML/CSS로 그린 앱 창(`aria-hidden`, `data-nosnippet`), 가짜 macOS 신호등은 Windows에서 JS로 숨김 | Publish 예시 PNG 2899×1757(256색) 213,097 B | CSS rounded·shadow·ring | 다크 한 벌 |
| [zed.dev](https://zed.dev/) | Cloudflare Stream HLS+WebP 포스터 | 12.6·20.0 s, 최대 1800×1080 60fps H.264, 평균 0.34/0.81 Mbps. 포스터 1674~2152px 50~95 KB, `/cdn-cgi/image/…format=auto` srcset+preload | 실제 창을 그라데이션 배경에 얹고 잘라 구움 | 사이트는 테마 전환 있음, 미디어 한 벌, 파비콘만 흑/백 |
| [linear.app](https://linear.app/) | 제품 UI를 HTML로 렌더, 큰 이미지 2장은 장식 | Cloudflare Images `f=auto`: Accept에 avif가 있어도 WebP(63,904·25,958 B), `*/*`면 PNG | — | — |
| [raycast.com/windows](https://www.raycast.com/windows) | 기능 벽 MP4 7개 | 1280×720 H.264 60fps, 14.8~28.1 s, 339 KB~1.78 MB, AAC 트랙 있음, `loop muted playsInline aria-hidden`(autoplay 속성 없음 — 스크립트 재생 추정), S3 `Accept-Ranges: bytes` | 실제 녹화를 배경화면 위에서 잘라냄 | 다크 한 벌 |

### Gaps
- 서버 렌더 HTML만 봤다(Raycast 홈 히어로처럼 나중에 붙는 미디어는 못 봄). 화질은 일부 프레임만 눈으로 봤다.

## Q4. Windows에서 Tauri(WebView2) 앱 화면을 일정하게 캡처하는 방법

### Takeaway
정지 화면은 CDP `Page.captureScreenshot`이 가장 재현성이 좋다(OS 그림자·커서·다른 창이 안 찍힘). `setDeviceMetricsOverride`(deviceScaleFactor 2)와 `setEmulatedMedia`(`prefers-color-scheme`·`prefers-reduced-motion`)로 해상도·테마·전환 연출을 고정하며, Frond는 테마 기본값 `system`의 change를 들으므로[실측 코드] 같은 장면을 두 벌로 찍을 수 있다(WebView2 실동작은 파일럿 확인). 동영상은 CDP `Page.startScreencast` → ffconcat → ffmpeg, OS가 낀 장면은 ffmpeg 8.1+ `gfxcapture`. gdigrab은 권하지 않고 수동 도구는 일회성용이다.

### Cited Findings
**CDP(WebView2)**
- 원격 디버깅은 `WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS=--remote-debugging-port=<포트>`(앱이 상속해야 함) 또는 HKCU 정책 레지스트리, `/json`으로 타깃 확인 — [MS Learn: Debug WebView2 apps with VS Code](https://learn.microsoft.com/en-us/microsoft-edge/webview2/how-to/debug-visual-studio-code) (accessed 2026-10-06, confidence: High). Playwright도 붙는다 — [playwright.dev/docs/webview2](https://playwright.dev/docs/webview2) (accessed 2026-10-06, confidence: Medium)
- 저장소 기존 방식: 위 변수로 띄운 앱의 `http://127.0.0.1:9229/json/list` page 타깃(`http://tauri.localhost/`)에 Node 24 WebSocket으로 붙고, `captureScreenshot`은 창이 가려져도 찍힌다. 식별자를 바꾼 시험 빌드로 설치본 localStorage·single-instance와 분리하며, WMI로 띄우면 변수가 안 넘어가 CDP가 없다 — 프로젝트 메모리 `app-e2e-cdp.md` (accessed 2026-10-06, confidence: High)
- `Page.captureScreenshot`: format jpeg/png/webp(기본 png), quality(정의상 jpeg 전용), clip(x·y·width·height·scale, DIP), fromSurface(실험, 기본 true), captureBeyondViewport(실험, 기본 false) — [devtools-protocol Page.pdl](https://github.com/ChromeDevTools/devtools-protocol/blob/master/pdl/domains/Page.pdl) (accessed 2026-10-06, confidence: High)
- `Emulation.setDeviceMetricsOverride`: width·height·deviceScaleFactor(0이면 해제)·mobile 필수, 나머지(scale·dontSetVisibleSize·viewport 등)는 실험적. `setEmulatedMedia`(media, features) — [devtools-protocol Emulation.pdl](https://github.com/ChromeDevTools/devtools-protocol/blob/master/pdl/domains/Emulation.pdl) (accessed 2026-10-06, confidence: High)
- `Page.startScreencast`(실험): format jpeg/png, quality, maxWidth·maxHeight, everyNthFrame, maxFramesInFlight(기본 3). `screencastFrame`(data, metadata.timestamp)마다 `screencastFrameAck`(sessionId)를 보내야 다음 프레임이 온다 — [Page.pdl](https://github.com/ChromeDevTools/devtools-protocol/blob/master/pdl/domains/Page.pdl) (accessed 2026-10-06, confidence: High)
- [실측] `docs/qa/20261001-phase2-b/b1-after-source-toc.png`(1100×800)의 상태 표시줄에 `C:\Users\cykim\AppData\Local\Temp\…\b1-long.md`가 그대로 찍혀 있다 — 공개 캡처에서 사용자 이름이 새는 실례 (accessed 2026-10-06, confidence: High)
- Windows 11 앱 창 모서리 8px(최대화·스냅 때 0) — [MS Learn: Geometry in Windows 11](https://learn.microsoft.com/en-us/windows/apps/design/signature-experiences/geometry) (accessed 2026-10-06, confidence: High)
- Tauri CLI `build`에 `--no-bundle`과 `--config <JSON|파일>`(기본 설정에 병합) — 캡처용 식별자 빌드에 사용 가능 — [Tauri v2 CLI reference](https://v2.tauri.app/reference/cli/) (accessed 2026-10-06, confidence: High)

**ffmpeg**
- gdigrab: `desktop`·`title=`·`hwnd=`, draw_mouse 기본 1, framerate 기본 29.97, offset은 주 모니터 기준 — [FFmpeg devices: gdigrab](https://ffmpeg.org/ffmpeg-devices.html#gdigrab) (accessed 2026-10-06, confidence: High). GPU 가속 창(Chrome 등)이 검게·정지 화면으로 찍힌다는 보고 — [gist](https://gist.github.com/james-jhang/73c59ad12c2c425f531285582c7a3a50) (accessed 2026-10-06, confidence: Low) **[Low][오래됨?]**
- ddagrab(6.0+): Desktop Duplication, 모니터 단위, `hwdownload` 필요, framerate 기본 30 — [FFmpeg filters: ddagrab](https://ffmpeg.org/ffmpeg-filters.html#ddagrab) (accessed 2026-10-06, confidence: High)
- gfxcapture(8.1+): Windows.Graphics.Capture, `window_title`·`window_class`·`window_exe` 정규식 또는 `hwnd`, `capture_cursor` 기본 켬, `capture_border` 기본 끔, `max_framerate` 기본 60, FPS 비고정(fps 필터로 고정), `hwdownload,format=bgra` 필요 — [FFmpeg filters: gfxcapture](https://ffmpeg.org/ffmpeg-filters.html#gfxcapture), [Changelog](https://github.com/FFmpeg/FFmpeg/blob/master/Changelog) (accessed 2026-10-06, confidence: High). WGC는 가려진 창도 찍고 최소화 창은 못 찍는다는 서술 — [va1erian/win32ui #111](https://github.com/va1erian/win32ui/issues/111) (accessed 2026-10-06, confidence: Low) **[Low]**
- [실측] 이 PC ffmpeg 9.0(Gyan full)에 ddagrab·gfxcapture·libx264·libsvtav1·libaom·libvpx-vp9·libwebp 있음 (accessed 2026-10-06, confidence: High)
- concat demuxer는 `file`·`duration`으로 프레임별 길이 지정 — [FFmpeg formats: concat](https://ffmpeg.org/ffmpeg-formats.html#concat-1); 마지막 이미지는 duration 없이 한 번 더 적고, `-pattern_type glob`은 Windows 빌드에 없다 — [FFmpeg Wiki: Slideshow](https://trac.ffmpeg.org/wiki/Slideshow) (accessed 2026-10-06, confidence: Medium)

**수동 도구**
- [실측 GitHub API] ShareX 21.0.0(2026-07-03, GPL-3.0), ScreenToGif 2.43.2(2026-07-28, MS-PL), OBS Studio 32.2.2(2026-08-14, GPL-2.0) (accessed 2026-10-06, confidence: High)
- OBS 창 캡처는 BitBlt·WGC 방식 선택, Capture Cursor 기본 켬, WGC에 Client Area 옵션 — [OBS KB: Window Capture](https://obsproject.com/kb/window-capture-sources) (accessed 2026-10-06, confidence: Medium). Windows 캡처 도구 녹화는 영역 지정·Clipchamp 연계(창 단위 아님) — [Microsoft Support: Snipping Tool](https://support.microsoft.com/en-us/windows/use-snipping-tool-to-capture-screenshots-00246869-1843-655f-f220-97299b865f6b) (accessed 2026-10-06, confidence: Medium)

**방법 비교(근거+추론)**

| 방법 | 재현성 | 해상도·DPI | OS 그림자·모서리 | 커서 | 창이 가려질 때 | 쓸 곳 |
|---|---|---|---|---|---|---|
| CDP `captureScreenshot` | 높음 | DSF 2 고정(파일럿 확인) | 안 찍힘 → CSS | 없음 | 찍힘[저장소] | 정지 화면 전부 |
| CDP screencast→ffmpeg | 높음 | DSF 따름(미확인) | 안 찍힘 | 없음(필요하면 DOM 가짜 커서) | 미확인 | 앱 안 동작 클립 |
| ffmpeg `gfxcapture` | 중간(실시간) | 물리 px | `capture_border=0` | 선택 | 찍힘[Low] | 탐색기 등 OS 장면 |
| ffmpeg `gdigrab` | 낮음 | 어긋날 수 있음 | — | 선택 | 검은 화면[Low] | 비추천 |
| ShareX·ScreenToGif·OBS·캡처 도구 | 낮음 | 모니터 배율 | 도구마다 | 도구마다 | 앞에 있어야 | 일회성 |

### Gaps
- 화면에 떠 있는 WebView2에서 DSF 2 오버라이드 시 2배로 다시 래스터되는지, 창 표시가 일그러지는지 미확인(파일럿 1순위). HiDPI에서 스크린캐스트 프레임이 흐리다는 보고가 있다 — [sorryhyun/yaar #148](https://github.com/sorryhyun/yaar/issues/148) **[Low]**.
- `setEmulatedMedia`가 Frond의 `matchMedia` change를 실제로 일으키는지, 1100×800 외 크기로 창을 고정하는 방법(Win32 `MoveWindow` 또는 에뮬레이션 크기), ClearType 색 번짐 여부는 미확인.

## Q5. 다운로드 페이지 부가 요소

### Takeaway
① Store 배지는 공식 웹 컴포넌트 `ms-store-badge`(`language="ko"`)나 공식 SVG(`ko` 경로, `ko-kr`은 404[실측]). Store Web Installer(direct)는 무료 앱만 되므로 "무료+선택 구매"인 Frond에 맞다. ② winget은 `winget install --id cyKim.Frond -e --source winget`+복사 버튼. ③ SmartScreen은 MS 문서대로 초기 사용자에게 경고 가능성과 출처 확인을 알린다(예: Espanso 번호 붙인 스크린샷, Upscayl README 한 줄). 스마트 앱 컨트롤은 미서명 파일을 모든 경로에서 막으므로 winget으로도 막힐 수 있다. ④ GitHub Releases의 자산별 SHA256 digest[실측]를 빌드 때 받아 표시하고 `Get-FileHash` 예를 둔다.

### Cited Findings
**Microsoft Store 배지**
- `ms-store-badge`: 스크립트+`<ms-store-badge productid="…">`, 옵션 productid·productname·cid·window-mode(`direct` 기본|`full`)·theme(`dark` 기본|`light`|`auto`, 밝은 배경엔 dark)·animation·language(빈 값이면 브라우저 언어, 지원 목록에 `ko`). 크기는 `ms-store-badge::part(img)`. JS 없는 곳은 링크+`https://get.microsoft.com/images/en-us%20dark.svg`(자동 테마·언어·OS별 동작 없음). 웹 컴포넌트는 현지화·Edge 보안 프롬프트 감소·비 Windows 공유 시트 제공 — [microsoft/app-store-badge README](https://github.com/microsoft/app-store-badge/blob/main/README.md) (accessed 2026-10-06, confidence: High)
- [실측] `get.microsoft.com/images/ko%20dark.svg`·`ko%20light.svg` 200(161×44, 21,127 B), `ko-kr%20dark.svg` 404, `ms-store-badge.bundled.js` 12,745 B (accessed 2026-10-06, confidence: High)
- Store Web Installer: 배지 생성기에서 Launch mode Direct. 무료 MSIX·Store Win32 앱 가능, 유료 콘텐츠·MSIXVC 불가, 관리자가 `get.microsoft.com`을 막으면 차단. 링크 `https://apps.microsoft.com/store/detail/<StoreID>`, `ms-windows-store://pdp/?ProductId=<StoreID>` — [MS Learn: Store Web Installer (2026-09-14)](https://learn.microsoft.com/en-us/windows/apps/distribute-through-store/how-to-use-store-web-installer-for-distribution) (accessed 2026-10-06, confidence: High)
- Store 스크린샷: 데스크톱 1366×768 이상(4K까지) PNG, 50 MB 이하, 최대 10장, 캡션 200자, 로고·마케팅 문구 덧붙이기 금지. 트레일러 1920×1080 MP4(H.264) — [MS Learn: App screenshots, images, and trailers](https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msix/screenshots-and-images) (accessed 2026-10-06, confidence: High)

**winget 표시·복사**
- 질의는 기본이 대소문자 무시 부분 일치, `--id`+`-e`가 하나로 좁히는 가장 확실한 방법, 소스가 여럿이면 `--source winget` — [MS Learn: winget install (2026-07-19)](https://learn.microsoft.com/en-us/windows/package-manager/winget/install) (accessed 2026-10-06, confidence: High)
- [실측] Warp: `$`는 `select-none`으로 복사 제외, 명령은 `<el-copyable>`, 버튼은 `command="--copy" commandfor=…`+클릭 추적 — [warp.dev/download](https://www.warp.dev/download). Raycast Windows: Store 배포, FAQ에 Store가 막힌 회사용 `winget install raycast` — [raycast.com/windows](https://www.raycast.com/windows). PowerToys 문서 `winget install --id Microsoft.PowerToys --source winget` — [MS Learn](https://learn.microsoft.com/en-us/windows/powertoys/install) (accessed 2026-10-06, confidence: High)
- `navigator.clipboard.writeText()`는 HTTPS 필요, Promise, 거부 시 `NotAllowedError` — [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/writeText). Expressive Code `showCopyToClipboardButton`·`removeCommentsWhenCopyingTerminalFrames` 기본 true, `powershell` 등은 터미널 프레임 — [Expressive Code: Frames](https://expressive-code.com/key-features/frames/) (accessed 2026-10-06, confidence: High)

**SmartScreen 안내**
- SmartScreen은 게시자 평판·파일 해시 평판을 본다. 미서명 파일은 "Windows protected your PC" 뒤 "Run anyway"를 골라야 하고 기업 정책은 진행을 막을 수 있다. EV도 즉시 평판을 주지 않는다. Store 앱은 경고 없음. Artifact Signing은 월 9.99달러부터. 평판은 수 주·수백 건 설치가 걸리고 미서명은 버전마다 0부터. 초기 사용자에게 경고 가능성과 게시자·출처 확인을 알리라고 권함. Windows 11 스마트 앱 컨트롤은 평판 없는 미서명 파일을 막고 인터넷에서 받은 파일만이 아니라 모든 실행 파일에 적용 — [MS Learn: SmartScreen reputation (2026-05-04)](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/smartscreen-reputation) (accessed 2026-10-06, confidence: High)
- 한국어 대화상자 "Windows의 PC 보호", "추가 정보" → "실행" — [OPC 스토리](https://www.opcstory.com/2024/04/windows-pc.html), [insideBOX](https://comeinsidebox.com/unprotect-your-pc-in-windows/) (accessed 2026-10-06, confidence: Low) **[Low]**. 이런 블로그는 SmartScreen 끄기까지 안내하지만 Frond 페이지는 권하지 않는다.
- 예 1 Espanso: 'More info'(1) → 'Run anyway'(2)를 번호 붙인 스크린샷으로 안내, 체크섬 없음 — [espanso.org/docs/install/win](https://espanso.org/docs/install/win/) (accessed 2026-10-06, confidence: Medium). 예 2 Upscayl README: 설치 단계 중 한 줄 — [upscayl/upscayl](https://github.com/upscayl/upscayl) (accessed 2026-10-06, confidence: High)
- 예 3(상용) Markdown Monster(2026-06-01): 서명해도 새 버전마다 평판이 다시 시작, 다운로드 페이지에 Chocolatey·WinGet 대안 링크, 패키지 관리자 경로는 Mark of the Web이 없어 대개 SmartScreen을 피한다는 주장 — [West Wind blog](https://markdownmonster.west-wind.com/blog/posts/2026/Jun/01/Windows-Protected-your-PC-Dealing-with-Windows-SmartScreen-on-Installation) (accessed 2026-10-06, confidence: Low) **[Low]**

**SHA256·릴리스 정보**
- GitHub는 2025-06-03부터 업로드 시점에 자산별 SHA256 digest를 계산해 Releases UI(자산 옆)·REST·GraphQL·gh CLI에 보여 준다 — [GitHub Changelog](https://github.blog/changelog/2025-06-03-releases-now-expose-digests-for-release-assets/) (accessed 2026-10-06, confidence: High)
- [실측] `GET /repos/{owner}/{repo}/releases/latest`의 `assets[].digest` = `sha256:<소문자 hex>`(ShareX·ScreenToGif·OBS 최신 릴리스) (accessed 2026-10-06, confidence: High)
- Immutable releases(2025-10-28 GA): 게시 후 자산 변경 불가·태그 보호·Sigstore attestation, 설정에서 켜면 이후 릴리스부터 — [GitHub Changelog](https://github.blog/changelog/2025-10-28-immutable-releases-are-now-generally-available/) (accessed 2026-10-06, confidence: High)
- REST 한도: 비인증 60회/시간, `GITHUB_TOKEN` 저장소당 1,000회/시간 — [GitHub Docs: Rate limits](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api) (accessed 2026-10-06, confidence: High)
- [실측] KeePassXC는 파일마다 "PGP Signature"·"SHA-256 Digest" 링크+검증 안내 페이지 — [keepassxc.org/download](https://keepassxc.org/download/) (accessed 2026-10-06, confidence: High)
- `Get-FileHash` 기본 SHA256(대문자 hex 출력) — [MS Learn: Get-FileHash](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.utility/get-filehash) (accessed 2026-10-06, confidence: High)

### Gaps
- Microsoft Store 앱 배지의 현행 사용 규칙(최소 크기·여백·변형 금지) 1차 문서를 못 찾았다(생성기는 SPA, 검색엔 Edge Add-ons·Marketplace 배지 규칙만).
- 한국어 배지의 실제 문구(글자가 path), SmartScreen·스마트 앱 컨트롤 한국어 대화상자 문구는 1차 자료로 확인 못 함 — 스크린샷은 직접 찍어야 정확하다.

## Q6. OG 이미지·소셜 카드·파비콘

### Takeaway
OG는 1200×630 PNG/JPG 한 장이 페이스북·X·카카오톡에 두루 맞고, 카카오톡은 2:1로 크롭하므로 글자는 가운데에 둔다. Starlight는 og:image만 자동으로 안 넣으므로 `head`(전체 기본)나 route data 미들웨어(페이지별)로 더한다. 자동 생성은 astro-og-canvas(1200×630 고정, 한글 폰트 직접 지정) 또는 satori+resvg. 파비콘은 ico(32)·svg·apple-touch-icon(180)·manifest(192·512·maskable)이고 기존 `src-tauri/icons/icon.svg`·`icon.ico`를 다시 쓴다.

### Cited Findings
- OGP 필수 og:title·og:type·og:image·og:url, og:image의 width·height·alt 구조 속성, og:image를 두면 alt도 두라는 권고 — [ogp.me](https://ogp.me/) (accessed 2026-10-06, confidence: High)
- Facebook: 1200×630 이상 권장, 1.91:1에 가깝게, 최소 200×200, 8 MB 이하 — [Meta: Images in link shares](https://developers.facebook.com/docs/sharing/webmasters/images/) (accessed 2026-10-06, confidence: High). X `summary_large_image`는 2:1, 최소 300×157, 5 MB 미만 — 검색 요약 (accessed 2026-10-06, confidence: Low) **[Low]**
- 카카오톡: 800×400(2:1)에 최적화, 내부 스마트 크롭으로 변환 — [Kakao DevTalk 직원 답변 (2024-09-11)](https://devtalk.kakao.com/t/og-image-og/139618) (accessed 2026-10-06, confidence: Medium) [오래됨?]
- [실측] 참고 사이트 og:image: obsidian 1200×688 PNG 139,853 B, fork 741×450 JPG 75,069 B, linear 동적 1200×630 PNG 765,509 B, raycast 2400×1260 PNG 3,093,516 B, zed 3600×1890 WebP 368,518 B (accessed 2026-10-06, confidence: High)
- [실측] Starlight `src/utils/head.ts` 기본: og:title, og:type(article), og:url(site 설정 시), og:locale, og:description, og:site_name, twitter:card=summary_large_image. og:image 없음 — [head.ts](https://github.com/withastro/starlight/blob/main/packages/starlight/src/utils/head.ts) (accessed 2026-10-06, confidence: High)
- route data 미들웨어(`defineRouteMiddleware`, 설정 `routeMiddleware`)로 페이지별 데이터 수정 — [Starlight: Route Data](https://starlight.astro.build/guides/route-data/) (accessed 2026-10-06, confidence: High). 레시피: astro-og-canvas로 `src/pages/og/[...slug].ts`를 만들고 미들웨어로 og:image·twitter:image 추가, `site` 필수(2026-06-30 갱신) — [HiDeoo: Add Open Graph images to Starlight](https://hideoo.dev/notes/starlight-og-images) (accessed 2026-10-06, confidence: Medium)
- [실측] astro-og-canvas 0.13.2 소스: `[1200, 630]` 고정, 기본 PNG·quality 90, 기본 폰트 Fontsource `noto-sans/latin-400`, 캐시 `node_modules/.astro-og-canvas`. README: `fonts`·`families`(폰트 스택)로 다른 문자 체계 지원 — [delucis/astro-og-canvas](https://github.com/delucis/astro-og-canvas) (accessed 2026-10-06, confidence: High). [실측] Noto Sans KR `korean-700-normal.ttf` 2,474,464 B(jsDelivr)
- satori: TTF·OTF·WOFF만(WOFF2 불가), 글자가 있으면 폰트 필수, `loadAdditionalAsset`로 누락 글리프 동적 로드, 결과는 SVG(PNG는 resvg 등) — [vercel/satori](https://github.com/vercel/satori) (accessed 2026-10-06, confidence: High)
- 파비콘(2026-01-21): `favicon.ico` 32, `icon.svg`, `apple-touch-icon.png` 180, manifest에 192·512·512 maskable, SVG 안 `prefers-color-scheme`로 다크 대응 — [Evil Martians: How to Favicon in 2026](https://evilmartians.com/chronicles/how-to-favicon-in-2021-six-files-that-fit-most-needs) (accessed 2026-10-06, confidence: Medium). Starlight `favicon` 기본 `'/favicon.svg'`, 추가 변형은 `head` — [Starlight: Configuration](https://starlight.astro.build/reference/configuration/#favicon) (accessed 2026-10-06, confidence: High)

### Gaps
- X 카드 규격 원문, 카카오 미리보기 이미지 용량 상한, 네이버 블로그·카페 링크 미리보기 규격은 확인하지 못했다.

## Frond에 주는 시사점

**결론**
1. 히어로 = 실제 앱 창 정지 캡처(1100×800 CSS px → DSF 2로 2200×1600)+CSS 8px 모서리·그림자·1px 테두리(Fork 방식). 영상 히어로는 쓰지 않는다 — LCP·용량·동작 줄이기가 모두 쉬워진다.
2. 움직임은 기능 섹션의 3~8초 무음 클립(Typora처럼 관련 영역만). MP4/H.264로 시작하고 AV1 WebM은 용량 이득이 확인되면 추가.
3. UI가 웹 기술이라 CDP로 테마·DPR·전환 연출을 제어해 "같은 장면 두 벌"·"추천 테마 갤러리"를 무인으로 다시 찍는다.
4. 라이트/다크: 참고 사이트는 모두 한 벌. 제품 사이트가 OS 테마만 따르면 `<picture media>` 하나, 수동 테마 버튼이 있으면 JS로 media 재작성. 문서는 라이트 한 벌, 테마 페이지만 두 벌.
5. 문서 본문 이미지는 영역 clip(본문 720px), alt는 확대 캡션이 되므로 문장으로.
6. 2x 캡처는 Store 스크린샷 규격(1366×768 이상 PNG)도 만족(문구 덧붙이기 금지).
7. 동영상은 `public/media/`에 버전 붙은 이름으로, 배포 직후 `curl -r 0-1 -I`·iPhone Safari 재생 확인.

**장면 목록 초안**

| 장면 | 보여 줄 것 | 방법 |
|---|---|---|
| 히어로 | 탭 2~3개·목차·표·코드·Mermaid가 렌더된 문서 | CDP 정지, 라이트·다크 |
| 바로 열기 | 탐색기에서 .md 더블클릭 → 바로 렌더 | gfxcapture, 깨끗한 데스크톱(Windows Sandbox 등 — 사용자가 켜야 함) |
| 분할 뷰 | 소스 편집 → 미리보기 동기 스크롤 | CDP screencast(`Input.insertText`) |
| 테마 | 라이트↔다크 전환 연출, 추천 테마 3종 | CDP screencast+정지 갤러리 |
| 외부 변경·바이트 보존 | 비교 화면, 상태 표시줄 인코딩·줄바꿈 | CDP clip(`samples/raw/cp949.md` 등) |
| Mermaid·KaTeX·Alerts | 렌더 결과 | CDP clip(렌더 완료 대기) |
| AI 훅 | Claude Code가 만든 md가 '새 문서'에 뜸 | 앱은 CDP 정지, 터미널은 별도 연출(프롬프트 경로 주의) |

**미디어 규격 표(권장안 — 용량 예산은 실측 비율로 잡은 추론)**

| 용도 | 표시 크기(CSS px) | 캡처 크기 | DPR | 형식 | 용량 예산 | 라이트/다크 |
|---|---|---|---|---|---|---|
| 히어로 정지 | 최대 1100×800 | 창 1100×800 → 2200×1600 PNG 원본 | 2 | `<Picture>` AVIF+WebP, `priority` | AVIF 250 KB 이하 | 두 벌 |
| 기능 섹션 정지 | 520~720 폭 | 영역 clip(예 720×480) → 1440×960 | 2 | AVIF/WebP, lazy | 60~150 KB | 한 벌(테마 섹션만 두 벌) |
| 기능 클립 | 520~720 폭 | 영역 녹화 → 폭 1080~1440 | 1.5~2 | MP4 H.264 CRF 23~28, yuv420p, faststart, 무음, 30~60fps, 3~8초 | 300~900 KB/개 | 한 벌 |
| 문서 본문 | 720 이하 | 영역 clip → ×2 | 2 | Astro 기본 WebP(또는 AVIF), zoom | 40~150 KB | 라이트 한 벌 |
| OG·소셜 | 1200×630 | 디자인 합성(캡처 일부+제목) | 1 | PNG/JPG | 300 KB 이하 | 한 벌 |
| Store 스크린샷 | — | 히어로·기능 2x PNG 재사용 | 2 | PNG | 50 MB 이하 | 자유 |
| 파비콘 | 16~512 | `icon.svg`·`icon.ico` 재사용 | — | ICO·SVG·PNG | — | SVG 내부 media |

**캡처 파이프라인 권장안(스크립트형 — 수동보다 재현성·두 벌·재촬영 비용에서 우위)**
1. 캡처 빌드: 식별자를 바꿔 설치본의 localStorage·최근 파일·single-instance와 분리(예 `tauri build --no-bundle --config '{"identifier":"com.cykim.mdeditor.capture"}'`). AI 훅은 설치본으로 가므로 캡처 창에 사용자 파일이 안 열린다.
2. 실행: `WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS=--remote-debugging-port=9230`을 준 셸에서 띄운다(WMI 실행은 CDP 없음). 창은 기본 1100×800 그대로.
3. 고정 입력: 데모 문서(가칭 `site/capture/fixtures/`, 자체 작성)를 짧은 중립 경로(예 `C:\FrondDemo\`)로 복사해 연다. 설정(테마 system·줌 100%)과 최근 목록을 localStorage에 넣고 새로고침. Pretendard가 설치된 PC는 피하고(일반 사용자와 글꼴이 달라짐), Windows 10은 아이콘이 Segoe MDL2로 대체되므로(`style.css` 460행) 가능하면 Windows 11에서.
4. 장면 정의 파일(가칭 `scenes.json`): 열 문서·동작(eval/key/type/click)·clip·테마·출력 경로. `document.fonts.ready`와 Mermaid·KaTeX 렌더 완료를 기다린 뒤 촬영.
5. 정지: PNG 원본을 `site/src/assets/shots/<장면>.<light|dark>@2x.png`로. 저장소 용량이 부담되면 원본을 WebP 무손실로(풀컬러 PNG의 약 1/3, 실측 비율).
6. 동영상: 앱 안 동작은 screencast 프레임+`metadata.timestamp` → ffconcat → ffmpeg, OS가 낀 장면만 `gfxcapture`. 포스터는 첫 프레임을 `src/assets/posters/`에 두고 Astro가 최적화.
7. 검수: 아래 개인정보 체크리스트 통과분만 커밋, 영상은 `-map_metadata -1`.
8. 수동 촬영은 SmartScreen 대화상자처럼 앱 밖 화면만, 깨끗한 환경에서.

CDP 호출(공식 파라미터, 값은 예시) — 정지 화면은 `prefers-reduced-motion: reduce`로 테마 전환 연출(`themeTransitionMs`)을 0으로 만들어 고정하고, 전환 클립만 `no-preference`:
```json
{"id":1,"method":"Emulation.setDeviceMetricsOverride","params":{"width":1100,"height":800,"deviceScaleFactor":2,"mobile":false}}
{"id":2,"method":"Emulation.setEmulatedMedia","params":{"features":[{"name":"prefers-color-scheme","value":"dark"},{"name":"prefers-reduced-motion","value":"reduce"}]}}
{"id":3,"method":"Page.captureScreenshot","params":{"format":"png","clip":{"x":0,"y":40,"width":720,"height":480,"scale":1}}}
{"id":4,"method":"Page.startScreencast","params":{"format":"png","everyNthFrame":1}}
{"id":5,"method":"Page.screencastFrameAck","params":{"sessionId":1}}
```
```powershell
# 프레임 → 웹용 MP4 (frames.ffconcat: file/duration 쌍, 마지막 file 한 번 더)
ffmpeg -f concat -i frames.ffconcat -vf "fps=30,scale=1440:-2,format=yuv420p" -c:v libx264 -preset slow -crf 24 -movflags +faststart -an -map_metadata -1 split-view.light.v1.mp4
# OS가 낀 장면 실시간 녹화 (FFmpeg 8.1+)
ffmpeg -filter_complex "gfxcapture=window_exe='^explorer\.exe$':capture_cursor=1,hwdownload,format=bgra,fps=60,format=yuv420p" -c:v libx264 -crf 18 raw-open.mp4
```
```astro
---
import { Picture } from 'astro:assets';
import hero from '../assets/shots/hero.light@2x.png'; // 2200×1600
---
<Picture src={hero} formats={['avif', 'webp']} width={1100} densities={[1, 2]} priority
  alt="Frond 창: 탭 세 개와 왼쪽 목차, 표와 코드가 렌더된 문서" class="app-shot" />
```
```html
<video muted loop playsinline preload="none" width="720" height="450" data-autoplay
       poster="/media/split-view.light.v1.webp" aria-describedby="cap-split">
  <source src="/media/split-view.light.v1.mp4" type="video/mp4">
</video>
<p id="cap-split">분할 뷰 — 왼쪽 소스를 고치면 오른쪽 미리보기가 같이 움직입니다</p>
<script>
  const ok = matchMedia('(prefers-reduced-motion: no-preference)');
  const io = new IntersectionObserver((es) => es.forEach(({ target: v, isIntersecting }) =>
    isIntersecting && ok.matches ? v.play().catch(() => {}) : v.pause()));
  document.querySelectorAll('video[data-autoplay]').forEach((v) => io.observe(v));
</script>
```
반복 클립은 누적 5초를 넘으므로 멈춤 버튼(또는 `controls`)을 함께 둔다(WCAG 2.2.2 해석 — 추론). AV1 WebM을 더할 땐 codecs를 명시한 `<source>`를 MP4 앞에 둔다.

**다운로드 페이지 구성(초안)**
- 주 버튼: 배포 단계에 따라 GitHub 릴리스 설치 파일 → Store 등록 후 배지 병기(`language="ko"`, 배경에 맞춘 theme).
- winget 블록: `winget install --id cyKim.Frond -e --source winget`+복사 버튼(프롬프트 기호 제외). Starlight에선 `powershell` 코드 블록이면 자동.
- 릴리스 정보: 빌드 때 `releases/latest`에서 버전·날짜·크기·`digest` 표시(CI는 `GITHUB_TOKEN`, 첫 릴리스 전엔 숨김), 검증 예 `(Get-FileHash .\Frond_x.y.z_x64-setup.exe).Hash` — 대소문자만 다르다고 명시.
- SmartScreen(접힘 상세): 처음 몇 주는 'Windows의 PC 보호'가 뜰 수 있음 → 이 사이트·GitHub에서 받았고 SHA256이 같은지 확인 후 '추가 정보' → '실행', SmartScreen은 끄지 말 것. 번호 붙인 한국어 스크린샷 1장. 스마트 앱 컨트롤이 켜진 Windows 11은 '실행' 버튼 없이 막힐 수 있다는 한 줄.

**개인정보 체크리스트(촬영·커밋 전)**
- 상태 표시줄 전체 경로, 제목 표시줄·탭 파일 이름, 폴더 트리 이름에 사용자 이름·회사·실제 프로젝트가 없는가.
- '최근 파일', AI 훅 '새 문서' 목록, 초안 복구 배너, 외부 변경 비교 내용, 설정 팝업의 사용자 테마 폴더 경로가 데모 데이터뿐인가.
- 데스크톱이 찍히는 장면의 작업 표시줄·바탕 화면 아이콘·알림·터미널 프롬프트.
- 데모 문서가 자체 작성 글인가(실제 문서·대화 기록 금지), 영상 메타데이터를 지웠는가.

## 요약 표

| 질문 | 결론 | 확신 |
|---|---|---|
| Q1 정지·영상·GIF | 히어로 2x 정지(AVIF/WebP·크기 지정·fetchpriority high·eager), 움직임은 3~8초 무음 MP4, GIF 금지 | High |
| Q1 자동 재생 | `muted playsinline`(오디오 트랙 제거)+JS 조건부 재생, 멈춤 수단, 포스터 | High |
| Q1 라이트/다크 | `<picture media>`는 OS만 따름 → 수동 토글이면 JS media 재작성·CSS 토글 | High/Low |
| Q2 Astro·Starlight | `src/assets`+`<Picture>`, 히어로 `priority`, 본문 다크 이미지는 직접 컴포넌트, starlight-image-zoom | High |
| Q2 동영상 호스팅 | `public/` 가능, Cloudflare가 Range에 200 → Safari 실기 확인 | High/Medium |
| Q3 참고 사이트 | 캡처+CSS 그림자(Fork), 짧은 클립(Typora·Raycast·Zed), HTML 목업(Obsidian·Linear) | High |
| Q4 캡처 | 정지·앱 내부는 CDP, OS 장면은 gfxcapture, gdigrab 비추천 | High/Medium |
| Q5 다운로드 부가 | `ms-store-badge`(`ko`), winget `--id … -e --source winget`+복사, GitHub `digest`+`Get-FileHash`, SmartScreen 안내(끄기 금지) | High(배지 규칙 Gap) |
| Q6 OG·파비콘 | 1200×630 한 장(카카오 2:1 크롭 대비), Starlight엔 og:image만 추가, 파비콘은 앱 아이콘 재사용 | High/Medium |
