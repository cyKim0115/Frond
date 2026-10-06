# 다른 툴의 제품·다운로드 사이트 해부 (2026-10 기준)

> 조사일 2026-10-06. 대상: Fork(가장 자세히), Typora, Obsidian, Zettlr, Zed, Sublime Text·Merge, iA Writer, Notepad++, MarkText, Joplin, 소규모 Tauri 앱 3개(Yaak·Kanri·Pot), 보조로 Raycast for Windows(Store 배지 사례).
> 방법: Windows Chrome 에이전트로 `curl -sIL`(헤더)·`curl -sL`(HTML·JS)을 받아 읽었고, 서버 쪽 OS 판별은 macOS 에이전트로 다시 받아 비교했다. 렌더링은 하지 않았으므로 섹션 순서는 HTML 기준이다. 설치 파일 크기는 리다이렉트 끝의 `Content-Length`다.
> 표기: **[실측]** = 이번에 직접 페이지를 열거나 curl로 확인한 것. **[Low]** = 블로그·포럼·검색 요약(이번에는 없음). **[해석]** = 사실에서 끌어낸 판단. 긴 문장은 요지만 옮기고, 원문은 제목·버튼 같은 짧은 UI 문구만 적었다.
> 범위 밖: 문서 플랫폼 요금·기능 비교, Cloudflare 배포 방법, 미디어 형식·캡처 도구 모범 사례(다른 조사자 담당).

## Q1. Fork(fork.dev) — Fork 해부도

### Takeaway
Fork는 홈 한 장에 거의 전부를 담았다. 일러스트 로고 → 앱 스크린샷 → 다운로드 띠 → 캐러셀 → 기능 5개 → 기능 목록 → 개발자 가족 소개 → 다운로드 띠 반복 → 푸터 순서다. 다운로드 버튼은 페이지가 아니라 자체 CDN의 버전 붙은 설치 파일 직링크이고, JS는 OS(Mac이냐 아니냐)만 보고 버튼 색·스크린샷·릴리스 노트 링크를 바꾼다. 구매는 `/buy` 한 장(Paddle 오버레이), 릴리스 노트는 OS별 긴 단일 페이지이며, 문서·검색·언어 전환·개인정보처리방침·RSS는 없다.

### 해부도 ① 페이지
| 경로 | 내용 |
|---|---|
| `/` | 홈(②). `nginx/1.18.0 (Ubuntu)` 단독 서버, CDN 헤더 없음. 요소의 `b-r4cc9lzrbl` 속성은 ASP.NET Core Razor CSS 격리 흔적으로 보인다 [해석] |
| `/buy` | 가격 카드 1개 + Paddle 결제(③) |
| `/releasenotes`, `/releasenoteswin` | Mac·Windows 릴리스 노트(④) |
| `/blog/` | Hugo 0.110.0(별도 생성기), 4쪽, 최신 글 2020-08-03 |
| `/about`, `/license` | 소개 2문단 + 얼굴 사진 2장 / 짧은 EULA |
| 없음(404) | `/docs` `/faq` `/support` `/download` `/privacy` `/terms` `/sitemap.xml` `/robots.txt` |

메뉴: 상단 `Home · Release Notes · Blog · About Us · (Twitter 아이콘)`. 푸터는 여기에 `License`, `support@fork.dev`(링크 아닌 글자), `Copyright © 2025 Danil Pristupov`를 더한다. Release Notes의 href는 비어 있고 JS가 OS에 따라 채운다.

### 해부도 ② 홈 섹션 순서 (Windows로 접속)
| # | 섹션 | 문구 요지 | 미디어 | 버튼 |
|---|---|---|---|---|
| 1 | 히어로 | HTML 제목 없음. 앱 아이콘·`Fork`·새 두 마리·`A FAST AND FRIENDLY GIT CLIENT`가 PNG 한 장(650×590, alt 없음)에 들어 있고, 배경은 안개 낀 숲 사진(fixed) | 바로 아래 앱 전체 창 스크린샷(2216×1204 JPG, 다크 테마, 창 틀 포함, CSS 그림자, 아래가 다음 띠에 걸쳐 잘림) | 없음 |
| 2 | 다운로드 띠(회색) | Fork가 날마다 나아진다는 한 문장 | — | `Download Fork for Mac`(작은 줄 `OS X 10.11+`), `Download Fork for Windows`(`Windows 7+`), 각 밑에 `$59.99, free evaluation`(가격만 `/buy` 링크) |
| 3 | 캐러셀 | 기능 이름 4개를 이은 캡션 한 줄 | OS별 5장(라이트 테마, 창 틀·그림자를 이미지에 구움, 2120×1300) | 화살표·점 |
| 4~8 | Merge Conflicts · Interactive Rebase · Image Diffs · History · Blame | 기능마다 제목 + 한 문장 | 스크린샷 1~2장 | — |
| 9 | Feature Overview | 4묶음 목록 약 25줄 | 32px 아이콘 4개 | — |
| 10 | About Us | 가족 개발자, "여가 시간에"를 취소선으로 긋고 "전업"으로 고친 문장 | 원형 얼굴 사진 2장(Swift·Cocoa / .NET·WPF) | — |
| 11 | 다운로드 띠 2 | 아래 버튼으로 받으라는 한 문장 | — | 2번과 같음 |
| 12 | 푸터(파랑) | 메뉴·이메일·저작권 | 작은 로고 | — |

Mac으로 접속하면 그림이 Mac판으로 바뀌고 GitHub Notifications·Advanced Diff Viewer 섹션이 더해진다. 판별은 `navigator.platform`에 Mac·iPhone·iPad가 있는지 한 번 본다. 두 버튼은 늘 보이고 내 OS 버튼만 파랑, 다른 쪽은 회색이다.

### 해부도 ③ /buy
배경 사진 → 로고 → `Fork` → 한 줄 소개 → 둥근 카드 1개(`License`, `$59`+윗첨자 `99`, 목록 3줄: 개인·상업 사용 / 1회 구매 / 1인 동시 최대 3대, 버튼 `Buy Fork`). 버튼은 Paddle Classic(`paddle.js`, vendor 53282, product 573723) 오버레이 결제를 열고 `referring_domain`에 Mac/Windows를 넘긴다. FAQ·환불·통화·세금 안내는 없다.

### 해부도 ④ 릴리스 노트
- 제목 `Release Notes for Windows` + `[Mac] [Windows]` 전환 링크. 항목 = `Fork 2.23` + `25 Sep 2026` + 가로줄 + 줄마다 배지 `New`(초록)·`Improved`(파랑)·`Fixed`(빨강)와 한 줄 설명. 그림은 없고 링크도 거의 없다.
- 마이너 버전만 적는다. CDN에 있는 2.23.1·2.21.1 같은 패치는 항목이 없다.
- 전체 기록이 한 페이지다. Windows 108항목(1.14, 2018-03-29 ~ 2.23, 2026-09-25, 약 390 KB), Mac 170항목(GitClient 1.0.0 ~ Fork 2.70, 2026-09-04, 약 620 KB). 페이지 나누기·버전 앵커·RSS 없음.
- Windows 2.x는 2.0(2024-08-23)부터 2.23(2026-09-25)까지 약 25개월에 24개 버전, 거의 매달 나왔다.

### 해부도 ⑤ 다운로드 파일·CDN
- 홈 버튼: `https://cdn.fork.dev/win/Fork-2.21.1.exe`(76,173,864 B ≈ 72.6 MiB, Last-Modified 2026-08-26), `https://cdn.fork.dev/mac/Fork-2.66.7.dmg`. 화면에는 버전 번호가 안 보인다.
- `cdn.fork.dev` = Cloudflare(cf-cache-status HIT, `max-age=3600`) 앞 + DigitalOcean Spaces 뒤(`x-do-cdn-uuid`, `x-rgw-object-type`, 요청 ID의 `ams3`). 루트는 403.
- 같은 경로에 `Fork-2.22.0.exe`·`2.23.0`·`2.23.1`(2026-09-27)이 있는데 홈은 2.21.1을 가리킨다. 블로그 글 속 옛 버튼(`/update/win/ForkInstaller.exe`)은 404다.
- 없는 것: ARM64 선택, 포터블, winget·Store, SHA-256·서명, SmartScreen 안내, 이전 버전 목록, 파일 크기.

```
[nav: Home | Release Notes | Blog | About Us | (tw)]
[히어로: 일러스트 로고 PNG(문구 포함) / 숲 사진 배경]
[앱 창 스크린샷 1장 — 그림자, 아래가 잘림]
[회색 띠: 한 문장 / (Mac) (Windows) / $59.99, free evaluation]
[캐러셀 5장 + 캡션]
[기능: 제목 + 한 문장 + 스크린샷] × 5 (Mac은 7)
[Feature Overview 목록] [About Us 사진 2장]
[회색 띠: 한 문장 / 같은 버튼 2개]
[푸터: 메뉴 · 이메일 · ©]
```

### Cited Findings
- 홈 구조·버튼 href·OS 분기 JS. Google Analytics 스니펫은 HTML 주석 안이라 분석 스크립트가 없다. 히어로 PNG에 alt 없음. 그림자·둥근 모서리는 CSS(`.main-image-shadow`, `.feature-shadow`) — [Fork 홈](https://fork.dev), [site.css](https://fork.dev/css/site.css) [실측] (accessed 2026-10-06, confidence: High)
- 스크린샷: 히어로는 다크, 캐러셀은 라이트에 그림자를 구워 넣음. Merge Conflicts 그림은 창 제목이 `Fork [DEBUG]`인 옛 UI이고, 히어로·캐러셀 속 커밋 날짜는 2021-04·2020-11 — [image1Win.jpg](https://fork.dev/images/image1Win.jpg), [carousel_mainWin.jpg](https://fork.dev/images/carousel/carousel_mainWin.jpg), [mergeConflictWin1.jpg](https://fork.dev/images/mergeConflictWin1.jpg) [실측] (accessed 2026-10-06, confidence: High)
- 서버·CDN 헤더·파일 크기·날짜 — `curl -sIL` [Fork-2.21.1.exe](https://cdn.fork.dev/win/Fork-2.21.1.exe), [Fork-2.23.1.exe](https://cdn.fork.dev/win/Fork-2.23.1.exe) [실측] (accessed 2026-10-06, confidence: High)
- /buy 카드·Paddle 설정 — [Fork Buy](https://fork.dev/buy) [실측] (accessed 2026-10-06, confidence: High)
- 릴리스 노트 형식·항목 수·날짜 — [Windows](https://fork.dev/releasenoteswin), [Mac](https://fork.dev/releasenotes) [실측] (accessed 2026-10-06, confidence: High)
- 블로그: Hugo, 최신 글 2020-08-03, 글마다 다운로드 버튼(현재 404)과 트윗 버튼, 이슈는 블로그에서만 `ForkIssues/TrackerWin`(열린 이슈 1,179)으로 연결 — [Fork Blog](https://fork.dev/blog/), [TrackerWin](https://github.com/ForkIssues/TrackerWin) [실측] (accessed 2026-10-06, confidence: High)
- 라이선스: 무료로 받아 평가할 수 있고 장기 사용에는 구매가 필요하다는 조항, 한 키로 1인 최대 3대(Mac·Windows 공통), 준거법 체코 — [Fork License](https://fork.dev/license) [실측] (accessed 2026-10-06, confidence: High)
- 옛 도메인 git-fork.com은 리다이렉트 없이 같은 홈을 200으로 낸다 — [git-fork.com](https://git-fork.com) [실측] (accessed 2026-10-06, confidence: High)

### Gaps
- 앱 안 구매 안내의 빈도·문구, 설치 파일 서명 여부는 보지 않았다.
- 홈이 2.21.1을 가리키는 것이 의도(안정판 고정)인지 갱신 누락인지는 알 수 없다. 모바일 배치는 모른다.

## Q2. Typora (typora.io)

### Takeaway
히어로는 글자뿐이고, 기능을 짧은 루프 영상·스크린샷 수십 개로 보여 준 뒤 맨 아래 한 섹션에서 구매와 다운로드를 같이 받는다. 다운로드는 ua-parser로 OS·CPU를 읽어 기본 버튼을 직링크로 바꾸고 나머지는 드롭다운에 둔다. 상점·문서·테마 갤러리를 서브도메인으로 나눴다.

### Cited Findings
- (a)(b)(c) 히어로는 전체 화면 회백색 바탕에 `typora`와 `/* a minimal markdown editor */`(타이핑 효과)뿐이고 버튼은 상단 고정 nav에 있다. 이어서 Readable & Writable(자동재생 mp4, 둥근 모서리+그림자) → Simple, yet Powerful(기능 슬라이더) → Accessibility → Custom Themes(파일명으로 보아 2014~2015년 캡처 6장) → 트윗 후기. 홈 전체 png 30·webm 루프 12·mp4 1, 대부분 라이트 테마 — [Typora 홈](https://typora.io), [index.css](https://typora.io/css/index.css) [실측] (accessed 2026-10-06, confidence: High)
- (d) 하단 `want Typora ?` 섹션에 `Purchase`·`Download` 버튼이 나란히 있다. `ua-parser`로 macOS·Windows x64·ia32를 골라 직링크로 바꾸고, Windows ARM은 드롭다운(macOS / Windows 64·32 bit / ARM / Linux / History Releases)에 둔다. Linux는 오버레이로 apt 저장소 명령(GPG 키)·deb·tar. Windows 10·11 필요 안내와 7/8판 링크가 숨김 상태로 있다 — [main.js](https://typora.io/js/main.js) [실측] (accessed 2026-10-06, confidence: High)
- (d) 파일: `downloads.typora.io/windows/typora-setup-x64.exe`(버전 없는 별칭)와 `typora-setup-x64-1.14.10.exe`가 같은 113,641,648 B(≈108.4 MiB)로 둘 다 있고 Cloudflare가 낸다. SHA·서명·winget·Store 안내는 없다 — [typora-setup-x64.exe](https://downloads.typora.io/windows/typora-setup-x64.exe) [실측] (accessed 2026-10-06, confidence: High)
- (e) `15 days free trial / up to 3 devices`, `$ 14.99 (without tax)`, 수량 ±. 구매 버튼 → 국가 선택 → 국가별로 FastSpring 또는 2Checkout(KR은 2Checkout 쪽) 인라인 결제. 견적서·대체 결제 링크. store.typora.io FAQ: 1회 구매·3대·30일 환불 — [main.js](https://typora.io/js/main.js), [Typora Store](https://store.typora.io) [실측] (accessed 2026-10-06, confidence: High)
- (f) `/releases/stable.html`은 `h2` 버전 + New/Fix + 그 버전 OS별 직링크, 날짜 없음. `/releases/all`은 History·Stable·Dev/Beta·Windows 7,8 탭. 큰 버전은 support의 `What's New 1.x` 문서. RSS 없음 — [Stable](https://typora.io/releases/stable.html), [All](https://typora.io/releases/all) [실측] (accessed 2026-10-06, confidence: High)
- (g)(h) support.typora.io = Jekyll(GitHub Pages)+Cloudflare, lunr 검색, 일부 `/zh/`. 테마 갤러리 theme.typora.io도 GitHub Pages. 푸터 5열(Product·Downloads·Purchase·Contact·About) + 中文站, Issues는 GitHub `typora-issues`, 피드백 폼 Formspree, 프레스 킷 zip 18 MB — [Typora Support](https://support.typora.io), [Themes Gallery](https://theme.typora.io) [실측] (accessed 2026-10-06, confidence: High)
- (i)(j) 영어 + 중국어 별도 도메인(typoraio.cn). typora.io는 Cloudflare 뒤 원 서버 불명이고 helmet류 보안 헤더와 `/api/endpoint` 호출이 Node 서버를 시사한다 [해석]. store는 Next.js on Vercel — `curl -sIL` [실측] (accessed 2026-10-06, confidence: Medium)

### Gaps
- 숨김 처리된 Windows 10·11 안내의 표시 조건은 확인하지 못했다.

## Q3. Obsidian (obsidian.md)

### Takeaway
히어로 아래 앱 화면을 이미지가 아니라 HTML로 그렸고(한국어 페이지에서는 그 속 노트 내용까지 번역), CTA는 `/download` 페이지로 보낸다. 파일은 GitHub Releases 직링크다. 한국어 페이지를 둔 유일한 대상이고(15개 언어, `/ko/` 경로), 도움말은 자사 Obsidian Publish로 언어별 사이트를 둔다. 변경 기록은 항목마다 영구 링크·플랫폼·채널 태그·Atom/JSON 피드가 있다.

### Cited Findings
- (a)(b)(c) `Sharpen your thinking.` + 무료·유연한 개인용 앱이라는 한 줄 + `Get Obsidian for Windows`·`More platforms`(둘 다 `/download`). 히어로 속 파일 트리·노트·상태 표시줄은 DOM 텍스트로 된 모형이고 `graph.js`가 그래프를 그린다(홈 이미지는 jpg 1·png 3·svg 1뿐). 가치 3개 → `Free without limits.` → Links·Graph·Canvas·Plugins → Sync → Publish → 커뮤니티 — [Obsidian 홈](https://obsidian.md), [한국어 홈](https://obsidian.md/ko/) [실측] (accessed 2026-10-06, confidence: High)
- (d) `Download for Windows`가 GitHub Releases의 `Obsidian-1.14.4.exe`(341,331,008 B ≈ 325.5 MiB)를 직접 가리키고, `download.js`가 다른 OS면 링크를 바꾼다. `#os=win` 해시로 바로 받기, 밑에 `Last updated`(빌드 때 넣은 날짜, changelog 링크). 표: iOS·Android(APK)·Windows Universal·Mac Universal·Linux 5종·Web Clipper. 요구사항·이전 버전·winget·Store·SHA 없음 — [Download](https://obsidian.md/download), [download.js](https://obsidian.md/download.js) [실측] (accessed 2026-10-06, confidence: High)
- (e) 가입 없이 무료 무제한. Sync $4~5·Publish $8~10/월, 후원형 Catalyst $25 1회(베타 조기 접근·배지), Commercial $50/인/년(선택), FAQ 6개 — [Pricing](https://obsidian.md/pricing) [실측] (accessed 2026-10-06, confidence: High)
- (f) 항목 = 날짜 + 버전 + `Desktop`/`Mobile` + `public` 태그, 영구 링크 `/changelog/2026-10-05-desktop-v1.14.4/`, 소제목(새 기능·Improvements·No longer broken·Developers). `/changelog.xml`(Atom)·`/changelog.json`, SNS 구독 링크 — [Changelog](https://obsidian.md/changelog/) [실측] (accessed 2026-10-06, confidence: High)
- (g) `help.obsidian.md` → 301 → `obsidian.md/help/` = Obsidian Publish(`customurl: obsidian.md/help`). 원본은 GitHub `obsidianmd/obsidian-docs`, `ko` 포함 약 35개 언어 폴더. 한국어 도움말 `obsidian.md/ko/help`(별도 Publish 사이트) — [Help](https://obsidian.md/help/), [한국어 도움말](https://obsidian.md/ko/help/), [obsidian-docs](https://github.com/obsidianmd/obsidian-docs) [실측] (accessed 2026-10-06, confidence: High)
- (h)(i)(j) 푸터 6열(Get started·제품·Learn·Resources(System status·License·Terms·Privacy·Security)·Community(Brand guidelines·Merch)·Follow us 7개 SNS). 언어 15개(en·ar·bn·de·es·fr·it·ja·ko·pl·pt-BR·ro·ru·sv·zh), 고른 언어를 `localStorage('lang')`에 저장해 다음에 그 경로로 보내고, 저장값 없으면 영어 루트는 자동 이동하지 않는다. GitHub Pages + Cloudflare, Tailwind — [Obsidian 홈](https://obsidian.md) [실측] (accessed 2026-10-06, confidence: High)
- 경쟁 동향: 데스크톱 1.14(2026-10-05)에 볼트 밖 개별 Markdown 파일 열기, OS '연결 프로그램' 등록, `.md` 문서 아이콘이 들어갔다. "md 더블클릭으로 바로 보기"가 더는 Frond만의 차별점이 아님을 시사한다 [해석] — [Changelog](https://obsidian.md/changelog/) [실측] (accessed 2026-10-06, confidence: High)

### Gaps
- 사이트 정적 생성기 이름은 HTML에 표시가 없어 모른다.

## Q4. Zettlr (zettlr.com · docs.zettlr.com)

### Takeaway
서버가 User-Agent로 OS를 판별해 히어로 버튼 문구를 바꾸고, 버튼은 `/download/<플랫폼>` 감사 페이지로 간다. 그 페이지가 3초 뒤 GitHub Releases 파일을 받게 하고 "다음 단계·후원" 모달을 띄운다. 다운로드 페이지는 아키텍처 안내·패키지 관리자 탭(winget 포함)·베타/나이틀리/이전 버전까지 갖춘 가장 친절한 예다.

### Cited Findings
- (a)(b)(c) `Your One-Stop Publication Workbench` + 한 줄 + `Download (Windows 10 or newer)` + `All download options` + 지원 OS·FOSS·후원 한 줄. macOS 에이전트면 버튼이 `Download (macOS 12.0 or newer)`(서버 판별). 스크린샷 png 중심(홈 png 49), 카드 3개 → 후기 2개 → 특징 7개(그림+글, 각자 문서 링크) → Get Started → 연구기관 로고 — [Zettlr 홈](https://zettlr.com) [실측] (accessed 2026-10-06, confidence: High)
- (d) `/download`: `Current Version: 4.8.0` + 새 기능 링크 + x64 대 ARM 안내 + OS별 타일(Windows 10 이상, macOS 12.0 이상) + 패키지 관리자 탭(Homebrew·WinGet `winget install -e --id Zettlr.Zettlr`·APT·Flatpak·Chocolatey·Pacman, 각자 "우리가 관리하지 않음" 고지) + Beta·Nightly·Older + 다음 단계 — [Download](https://zettlr.com/download) [실측] (accessed 2026-10-06, confidence: High)
- (d) `/download/win32`는 "곧 시작, 안 되면 여기" 알림 → 3초 뒤 Matomo `trackLink` 기록 → GitHub `Zettlr-4.8.0-x64.exe`(157,306,080 B ≈ 150.0 MiB)로 이동, 모달로 매뉴얼·설치 안내·포럼·Discord·Patreon/PayPal 안내 — [download/win32](https://zettlr.com/download/win32) [실측] (accessed 2026-10-06, confidence: High)
- (e)(f) `/supporters`: Patreon(권장)·PayPal·후원자 명단. `/changelog`는 저장소 CHANGELOG에서 자동 생성한다고 밝히며 버전별 아코디언, 맨 위 `Upcoming`(베타·나이틀리 반영분), 날짜 표기는 안 보인다. RSS는 블로그만 — [Supporters](https://zettlr.com/supporters), [Changelog](https://zettlr.com/changelog) [실측] (accessed 2026-10-06, confidence: High)
- (g)(i)(j) docs.zettlr.com = VuePress 2.0.0-rc.31, 언어 경로 8개(en·de·es·fr·it·ja·pt·ru, 한국어 없음), 검색 Ctrl K. 사이트는 영어, `Apache/2.4.68 (Debian)` 자체 서버, generator OctoberCMS(푸터 표기 WinterCMS), 자체 Matomo — [Zettlr Docs](https://docs.zettlr.com) [실측] (accessed 2026-10-06, confidence: High)

### Gaps
- changelog 출시일이 접힌 영역 안에 있는지는 렌더링하지 않아 모른다.

## Q5. Zed (zed.dev)

### Takeaway
회사형 사이트지만 다운로드 동선은 단순하다. 히어로 CTA는 `/download`로 가고, 그 페이지 맨 위에 버전·날짜·changelog 링크와 Stable/Preview 전환이 있다. 파일은 자기 도메인 API 주소가 GitHub Releases로 307 리다이렉트한다. 문서는 같은 도메인 `/docs/`의 mdBook이다.

### Cited Findings
- (a)(b)(c) 공지 띠 → `Your last next editor` + 한 줄 + `Download now`(단축키 D, →`/download`)·`Clone source` + 지원 OS. 히어로 아래 에이전트 UI를 HTML로 그린 모형 → 3항목 → 후기 → 기능 카드(영상 포스터 webp를 Cloudflare 이미지 변환 `/cdn-cgi/image/...format=auto`로) — [Zed 홈](https://zed.dev) [실측] (accessed 2026-10-06, confidence: High)
- (d) `/download`: `1.22.0` + `September 30, 2026` + `View changelog` + Stable/Preview + macOS(10.15 이상)·Windows(Intel/AMD)·Linux(`curl -f https://zed.dev/install.sh | sh`) + 내려받으면 약관 동의로 본다는 한 줄 + 뉴스레터. 버튼 href는 클라이언트 렌더 — [Download](https://zed.dev/download) [실측] (accessed 2026-10-06, confidence: High)
- (d) `zed.dev/api/releases/stable/latest/Zed-x86_64.exe` → 307 → GitHub Releases(84,005,568 B ≈ 80.1 MiB). 페이지 버튼이 이 주소를 쓰는지는 미확인. winget 명령(`ZedIndustries.Zed`)과 DirectX 11 요구는 문서에만 있다 — [API 주소](https://zed.dev/api/releases/stable/latest/Zed-x86_64.exe), [Installation](https://zed.dev/docs/installation) [실측] (accessed 2026-10-06, confidence: Medium)
- (e)(f) Personal $0 / Pro $10/월 / Business $30/좌석. `/releases` → 308 → `/releases/stable`, 채널·버전 목록, 매주 출시, RSS `stable-releases.rss` — [Pricing](https://zed.dev/pricing), [Releases](https://zed.dev/releases/stable) [실측] (accessed 2026-10-06, confidence: High)
- (g)(h)(i)(j) `/docs/` = mdBook + elasticlunr 검색. 푸터 4열(Product·Resources·Company(Press·Brand)·Social) + 쿠키 설정. 영어만. Next.js를 OpenNext로 Cloudflare에서(`x-opennext-cache`, `x-nextjs-prerender`) — [Zed Docs](https://zed.dev/docs/) [실측] (accessed 2026-10-06, confidence: High)

### Gaps
- Windows ARM64 버튼 노출 여부는 렌더링하지 않아 모른다.

## Q6. Sublime Text·Sublime Merge

### Takeaway
히어로 미디어에 가장 공을 들인 사례다. 캔버스 애니메이션 위에 Dark/Light와 Windows/Mac/Linux 토글이 있고, OS를 바꾸면 창 제목줄 그림만 OS판으로 갈아 끼운다. 다운로드 버튼은 감사 페이지로 가서 직링크·포터블·서명·다음 단계(문서·Merge 교차 홍보)를 모아 보여 준다. 다운로드 페이지에 평가 기한을 강제하지 않는다고 적어, Fork류 "무기한 평가" 모델을 공개 문구로 밝힌 유일한 대상이다.

### Cited Findings
- (a)(b)(c) `Text Editing, Done Right` + OS별 버튼(Windows면 `Download for Windows`) + `Sublime Text 4 (Build 4215)` + `See What's New`. `<canvas>` 1200×576 애니메이션에 `/images/{OS}_title_bar_{theme}@2x.png` 제목줄을 JS가 갈아 끼우고, 모바일 대역폭을 아끼려 배율을 따로 계산한다. 장면 캡션 4개 → What's New(svg 아이콘+문단 8개) → Merge 교차 홍보. Merge 홈도 같은 틀 — [Sublime Text](https://www.sublimetext.com), [Sublime Merge](https://www.sublimemerge.com) [실측] (accessed 2026-10-06, confidence: High)
- (d) 버튼 → `/download_thanks?target=win-x64`: 감사 제목 + 안 되면 직링크 + Windows 포터블 + Linux 패키지별 서명·키 + 다음 단계(문서·YouTube 튜토리얼·Merge·키 바인딩·Package Control·포럼·이슈·판매 FAQ). 파일 `download.sublimetext.com/sublime_text_build_4215_x64_setup.exe` 21,975,760 B(≈21.0 MiB) — [download_thanks](https://www.sublimetext.com/download_thanks?target=win-x64) [실측] (accessed 2026-10-06, confidence: High)
- (e) 다운로드 페이지에 "무료로 평가할 수 있고 계속 쓰려면 구매해야 하며, 현재 평가 기한을 강제하지 않는다"는 취지의 문장. `/buy` → 301 → `sublimehq.com/store/text`: 개인 $99 1회(3년 업데이트, 한 키로 모든 컴퓨터·OS), Merge 묶음, 기업 좌석 연 $65→$50, 카드·PayPal — [Download](https://www.sublimetext.com/download), [Store](https://www.sublimehq.com/store/text) [실측] (accessed 2026-10-06, confidence: High)
- (f)(g)(i)(j) 변경 기록은 `/download` 아래 `Build 4215` + `25 Sep 2026` + 목록(소제목, `Windows:`·`Mac:` 접두어), RSS는 블로그만. 문서는 `/docs/` 정적 HTML(버전 선택). 영어만, `Server: nginx` 자체 서버 — [Docs](https://www.sublimetext.com/docs/) [실측] (accessed 2026-10-06, confidence: High)

### Gaps
- 감사 페이지가 자동으로 내려받기를 시작하는지는 렌더링하지 않아 모른다.

## Q7. iA Writer (ia.net/writer)

### Takeaway
기기 목업 이미지와 짧은 기능 영상으로 보여 주고, "7일 무료 체험, 카드 불필요" 블록을 한 페이지에 세 번 반복한다. 다운로드 버튼은 링크가 아니라 서버 API에서 파일 주소를 받아 오는 JS 버튼이다. Windows 가격을 Mac과 따로 매긴다.

### Cited Findings
- (a)(b)(c) 제품명 + 손은 키보드에·마음은 글에라는 한 줄 + 데스크톱·iOS 포커스 모드 webp. 그림자를 구운 기기 가족 이미지, mp4 5개(macOS·iOS 별도 클립), Word 비교 슬라이더, 언론 로고. 체험 블록(Mac·Windows `Free Trial`, iPad/iPhone 1회 결제)을 세 번 반복 — [iA Writer](https://ia.net/writer) [실측] (accessed 2026-10-06, confidence: High)
- (d) `download(this, "writer-windows", ...)`가 서버에 주소를 요청해 이동하고 한도 초과·실패 문구를 둔다. `/downloads`: Writer(macOS 10.15 이상, Windows 10 이상)·Presenter·App Store 배지·템플릿 — [download.js](https://ia.net/assets/js/download.js), [Downloads](https://ia.net/downloads) [실측] (accessed 2026-10-06, confidence: High)
- (e) 7일 체험. 1회 결제 Mac $49.99 / Windows $29.99 / iOS $49.99(App Store만), 플랫폼별 결제, 교육 20%, 1회 구매가 평생 업데이트가 아니라는 FAQ — [Pricing](https://ia.net/writer/pricing) [실측] (accessed 2026-10-06, confidence: High)
- (f)(g)(i)(j) `/writer/updates` → 301 → `/topics`(회사 글 목록), 버전별 기록은 못 찾음. 지원은 같은 사이트 `/writer/support`. 언어 en·`/de/`·`/ja/`. Cloudflare(원 서버 불명), 자산은 static.ia.net — [Support](https://ia.net/writer/support) [실측] (accessed 2026-10-06, confidence: Medium)

### Gaps
- Windows판 버전 기록과 다운로드 API가 주는 실제 파일 호스트는 확인하지 못했다.

## Q8. Notepad++ (notepad-plus-plus.org)

### Takeaway
히어로도 스크린샷도 없는 정보형 사이트다. 대신 버전마다 다운로드 페이지가 있고, 출시일·아키텍처 3종 × 설치형/포터블/MSI·파일별 GPG 서명·SHA-256·공개키·릴리스 노트를 한 페이지에 모았다. 무결성 안내가 가장 충실하지만 다운로드 페이지에 광고가 붙는다.

### Cited Findings
- (a)(b) 헤더에 `Current Version 8.9.8.1`, 본문은 무료·GPL 설명 문단과 일러스트, 다크 테마 토글. 앱 스크린샷 없음 — [Notepad++](https://notepad-plus-plus.org) [실측] (accessed 2026-10-06, confidence: High)
- (d)(f) 버전 페이지: `Release Date: 2026-09-24`, x64·x86·ARM64 × Installer·Portable(zip·7z)·Mini-portable·MSI(x64), 파일마다 GPG 서명, SHA-256 목록(+서명), 공개키, 아래 릴리스 노트(취약점·회귀·수정 분류). 목록에는 `(stable: auto-update triggered)`로 자동 업데이트 배포 여부 표시. 파일은 GitHub Releases, x64 설치 파일 6,963,432 B(≈6.6 MiB) — [v8.9.8.1](https://notepad-plus-plus.org/downloads/v8.9.8.1/) [실측] (accessed 2026-10-06, confidence: High)
- (e)(g)(i)(j) 기부(`Donate`) + 다운로드 페이지 광고(AdSense·Carbon·BuySellAds)와 악성 광고 신고 문구. 매뉴얼은 별도 도메인 npp-user-manual.org(Hugo). 영어만, Apache + Hugo 0.57.2, 사이트 RSS `index.xml`, winget·Store 언급 없음 — [Downloads](https://notepad-plus-plus.org/downloads/), [User Manual](https://npp-user-manual.org) [실측] (accessed 2026-10-06, confidence: High)

### Gaps
- 광고가 실제로 어떤 모양·위치로 뜨는지는 렌더링하지 않아 모른다.

## Q9. MarkText (marktext.me)

### Takeaway
옛 공식 도메인 두 개가 남의 손에 넘어갔고, 저장소 홈페이지 필드는 새 도메인을 가리킨다. 새 사이트는 앱 화면을 HTML로 그린 문서·테마 카드로 보여 주고, 다운로드 타일은 모두 GitHub Releases 목록으로 간다. 사이트 버전 배지가 GitHub 최신판보다 늦다.

### Cited Findings
- 옛 도메인: `marktext.app`은 도메인 매물 스크립트·광고 추적이 든 파킹 페이지, `marktext.cc`는 `Redirecting...` 제목에 광고 차단 감지 스크립트가 든 페이지 — [marktext.app](https://marktext.app), [marktext.cc](https://marktext.cc) [실측] (accessed 2026-10-06, confidence: High)
- 저장소: homepage `https://www.marktext.me`, MIT, 별 62k, 최신 v0.20.0(2026-10-02), 자산에 `SHA256SUMS.txt` — [GitHub marktext](https://github.com/marktext/marktext) [실측, gh api] (accessed 2026-10-06, confidence: High)
- (a)(b)(c)(d) 배지 `v0.19.0 Free & open source forever`(최신과 어긋남) → `Write in Markdown. Stay in flow.` + `Download for free`(→GitHub Releases 목록)·`Star on GitHub` + 지원 OS·계정·추적 없음. 예시·테마 카드(33개 내장 중 일부)가 HTML 렌더, png 4개뿐. 마지막 CTA 타일 3개도 GitHub Releases 목록 + Homebrew, 후원은 GitHub Sponsors — [MarkText](https://marktext.me) [실측] (accessed 2026-10-06, confidence: High)
- (g)(j) 문서는 같은 앱 `/docs`(사용자·개발자, ⌘K 검색, GitHub 원본 링크). Next.js를 OpenNext로 Cloudflare에서(`x-opennext: 1`). Windows x64 setup 126,371,001 B(≈120.5 MiB) — [MarkText Docs](https://marktext.me/docs) [실측] (accessed 2026-10-06, confidence: High)

### Gaps
- 옛 도메인이 언제·왜 넘어갔는지는 확인하지 않았다.

## Q10. Joplin (joplinapp.org)

### Takeaway
홈·다운로드·도움말·변경 기록을 Docusaurus 하나로 GitHub Pages에 올렸다. 다운로드 페이지는 OS를 판별해 자동으로 받기를 시작하고, 파일 주소는 자체 도메인 리다이렉터(추적 파라미터 포함)가 GitHub Releases로 넘긴다.

### Cited Findings
- (a)(c) `Free your notes` + 한 줄 + `Download the app`(→`/download/`)·`Sign up with Joplin Cloud`, 히어로 그림 png. 기능 6개가 글+png+CTA로 번갈아 나오고, 프랑스산 대안·언론 보도·후원사 섹션이 뒤따른다 — [Joplin](https://joplinapp.org) [실측] (accessed 2026-10-06, confidence: High)
- (d) `/download/`: "다운로드 진행 중, 안 되면 여기" 제목 → 데스크톱·Cloud·모바일·기타 판 안내. 링크 `objects.joplinusercontent.com/v3.7.21/Joplin-Setup-3.7.21.exe?source=JoplinWebsite&type=New` → 302(nginx) → GitHub Releases(361,008,040 B ≈ 344.3 MiB) — [Download](https://joplinapp.org/download/) [실측] (accessed 2026-10-06, confidence: High)
- (e)(f) 무료 + Joplin Cloud, 기부 배지(PayPal·GitHub Sponsors·Patreon·IBAN). 변경 기록은 플랫폼별 페이지(Desktop·Android·iOS·Terminal·Server), 항목 `v3.7.21 - 2026-09-25T21:31:12Z` + 줄머리 `New:`·`Improved:`·`Fixed:` + 이슈·기여자. RSS·Atom 있음 — [Desktop Changelog](https://joplinapp.org/help/about/changelog/desktop/) [실측] (accessed 2026-10-06, confidence: High)
- (g)(i)(j) Docusaurus v2.4.3, 언어 EN·FR·DE·中文. `Server: GitHub.com`(Fastly), Cloudflare 없음 — `curl -sIL` [실측] (accessed 2026-10-06, confidence: High)

### Gaps
- 리다이렉터가 OS별 파일을 고르는 규칙(JS인지 서버인지)은 자세히 보지 않았다.

## Q11. 소규모 Tauri 앱: Yaak · Kanri · Pot (+ Raycast for Windows)

### Takeaway
Yaak은 서버 쪽 OS 판별, 버전·날짜, Windows x64/ARM64와 사용자용·머신용 NSIS 구분, 자기 도메인 → GitHub 리다이렉트까지 갖춰 Frond에 가장 가까운 본보기다. Kanri는 Astro 한 장에 GitHub 직링크만 둔 최소형이고, Pot은 VitePress 홈 레이아웃을 제품 사이트로 쓰다 유지보수를 끝냈다. Store 배지는 보조 사례 Raycast만 달았다.

### Cited Findings
- **Yaak**(Tauri: 저장소 `crates-tauri/`, 홈에 Rust·Tauri 명시, MIT, 별 19k) 히어로: 릴리스 알약(`v2026.8.0 →` 새 기능) → `The local-first API client` + 한 줄 + `Download`(버튼 옆 숫자 `153k`, 다운로드 수로 보임 [해석]) + `View Docs`. 히어로 그림이 OS별 파일(`hero-yaak-light-windows-*.webp`)이고 Light/Dark 토글이 붙는다. 기능 블록 = 제목 + 한 줄 + 체크 4줄 + 링크 2개 + 라이트 mp4. 최근 릴리스 카드 4개, 트윗 후기 — [Yaak](https://yaak.app) [실측] (accessed 2026-10-06, confidence: High)
- **Yaak** `/download`: 서버 판별(macOS 에이전트면 `Download for macOS (Apple Silicon)`), `Version 2026.8.1 ⋅ Sep 23, 2026`, 베타·이전 판 링크. Windows `Installer (nsis)` x64·ARM64 + `Machine Installer (nsis)` x64·ARM64(모든 사용자용, 보통 관리자 권한 필요 설명), Mac dmg+Homebrew, Linux 3종. 링크 `yaak.app/releases/v2026.8.1/windows-x86_64/Yaak_2026.8.1_x64-setup.exe` → 302 → GitHub(44,642,400 B ≈ 42.6 MiB). 팀 좌석 유료, 호스팅 Railway — [Download Yaak](https://yaak.app/download) [실측] (accessed 2026-10-06, confidence: High)
- **Kanri**(Tauri: `src-tauri/`, GPL-3.0, 별 약 2k, `kanriapp/kanri` 조직 저장소지만 커밋 대부분이 한 사람 — trobonox 1,554회, 다음 사람 42회) `Simplicity in Every Task.` + 한 줄 + `Download Kanri`·`Read Docs` + webp 1장 → 기능 카드 6개(글만) → 개념 설명 → CTA. `/download/`는 판별 없이 목록만, 전부 GitHub 직링크(Windows .msi 4,505,600 B ≈ 4.3 MiB), macOS 서명 경고 우회 명령·Homebrew tap. Astro v5.7.13 on Netlify, 문서·블로그 같은 사이트 — [Kanri](https://www.kanriapp.com), [Download Kanri](https://www.kanriapp.com/download/) [실측] (accessed 2026-10-06, confidence: High)
- **Pot**(Tauri: `src-tauri/`, GPL-3.0, 별 19.4k, 저장소 archived, `README_KR.md` 있음) 사이트 전체가 VitePress v1.3.1(GitHub Pages + Cloudflare). 홈 레이아웃(이름·한 줄·`Download`·`User Guide` + 기능 카드 8개, 스크린샷 없음) 맨 위에 유지보수 종료·후속 앱 안내. 다운로드는 `3.0.7` 제목 + OS·아키텍처별 JS 버튼. 언어 zh·en — [Pot](https://pot-app.com/en/), [pot-desktop](https://github.com/pot-app/pot-desktop) [실측] (accessed 2026-10-06, confidence: High)
- **Raycast for Windows**: 히어로 CTA가 공식 Store 배지 이미지(`get.microsoft.com/images/en-us light.svg`)이고 `ray.so/download-windows` → 302 → `get.microsoft.com/installer/download/9PFXXSHC64H3`(Store 앱 설치 파일)로 간다. 밑에 `v2.6.3.0 | Windows 10+ | Install via WinGet`, FAQ에 `winget install raycast`. Vercel — [Raycast for Windows](https://www.raycast.com/windows) [실측] (accessed 2026-10-06, confidence: High)

### Gaps
- Pot 버튼의 실제 다운로드 주소, Yaak 사이트 프레임워크(`/build/` 경로만 확인)는 특정하지 못했다.

## Q12. 비교 표와 공통 패턴

### Takeaway
1인·소규모 사이트일수록 "홈 한 장 + 다운로드(또는 감사) 페이지 + 릴리스 노트 + 문서 링크"로 끝난다. 자체 CDN은 유료 앱(Fork·Typora·Sublime)뿐이고 오픈소스·인디는 GitHub Releases를 쓰며, 일부는 자기 도메인 리다이렉터를 앞에 둔다. Windows 세부(ARM64, 사용자/머신 설치기, winget, Store, SHA)는 들쭉날쭉하고 SmartScreen 안내는 한 곳도 없다.

### 비교 표
| 사이트 | 히어로 미디어 | 다운로드 동선 | 가격 | 릴리스 노트 | 문서 | 언어 | 호스팅 |
|---|---|---|---|---|---|---|---|
| Fork | 일러스트 PNG + 창 스크린샷(OS별) | OS 버튼 2개 → 자체 CDN exe | $59.99, 무료 평가(기한 미기재) | OS별 한 페이지, 배지 | 없음 | 영어 | nginx + CF·DO Spaces |
| Typora | 글자만 | 하단, OS·CPU 판별 직링크 | $14.99, 15일 | 버전별, 날짜 없음 | support. Jekyll | 영어(+중국) | CF / Vercel / GH Pages |
| Obsidian | HTML 모형 | /download → GitHub | 무료 + 구독·후원 | 영구 링크, Atom·JSON | /help Publish | 15개(ko) | GH Pages + CF |
| Zettlr | 스크린샷 PNG | 서버 판별 → 감사 → GitHub | 무료, 후원 | CHANGELOG 자동 | docs. VuePress | 영어(문서 8) | Apache 자체 |
| Zed | HTML 모형 + 영상 | /download → API → GitHub | 무료 + Pro | 채널별, RSS | /docs mdBook | 영어 | OpenNext on CF |
| Sublime | canvas, OS·테마 토글 | 감사 페이지 | $99, 기한 강제 없음 | /download 안 | /docs 정적 | 영어 | nginx 자체 |
| iA Writer | 기기 목업 + mp4 | 타일 → API | Win $29.99, 7일 | 못 찾음 | 같은 사이트 | en·de·ja | CF |
| Notepad++ | 없음 | 버전 페이지 + GPG·SHA | 무료, 기부·광고 | 다운로드 겸용, RSS | 별도 도메인 | 영어 | Apache·Hugo |
| MarkText | HTML 모형 | GitHub 목록 | 무료 | GitHub | /docs | 영어 | OpenNext on CF |
| Joplin | 스크린샷 PNG | 자동 시작 + 리다이렉터 | 무료 + Cloud | 플랫폼별 | Docusaurus | en·fr·de·zh | GH Pages |
| Yaak | OS별 그림 + 테마 토글 | 서버 판별, 리다이렉터, 사용자/머신 NSIS | 개인 무료 | 카드형 | /docs | 영어 | Railway |
| Kanri | 스크린샷 webp | 목록, GitHub 직링크 | 무료 | GitHub | 같은 Astro | 영어 | Netlify |
| Pot | 없음 | 버전 페이지 JS 버튼 | 무료(종료) | GitHub | VitePress | zh·en | GH Pages + CF |
| Raycast | HTML 모형 | Store 배지 + winget | — | — | — | — | Vercel |

### 공통 패턴 (근거는 위 [실측])
1. **히어로 = 짧은 제목 + 한 줄 + 주 CTA 1개 + 보조 링크 + 지원 OS 작은 글자.** 주 CTA는 OS 이름을 넣은 형태(`Download for Windows` 등)가 가장 흔하다. 예외는 Fork(문구가 이미지 속)와 Typora(글자만).
2. **히어로 미디어 4유형**: 창 틀 포함 스크린샷(Fork·Zettlr·Joplin·Kanri·Yaak), HTML 앱 모형(Obsidian·Zed·MarkText·Raycast), 캔버스 애니메이션(Sublime), 없음(Typora·Notepad++·Pot). OS·테마 변형을 실제로 바꿔 보여 주는 곳은 Fork(OS), Sublime(제목줄·테마), Yaak(OS·라이트/다크).
3. **다운로드 3유형**: 직링크(Fork·Typora·Obsidian·Notepad++·Kanri), 감사·자동 시작 페이지(Zettlr·Sublime·Joplin), 자기 도메인 리다이렉터 → GitHub(Joplin·Yaak·Zed). 버전·날짜를 다운로드 영역에 보여 주는 곳은 Obsidian·Zed·Yaak·Zettlr·Sublime·Notepad++.
4. **Windows 세부**: ARM64 명시(Typora·Zettlr·Yaak·Notepad++·Pot), 사용자/머신 설치기(Yaak), 포터블(Sublime·Notepad++), winget 명령(Zettlr·Zed 문서·Raycast), Store 배지(Raycast), SHA-256·서명(Notepad++). **SmartScreen 안내와 파일 크기 표시는 0곳.**
5. **가격 문구는 다운로드 버튼 바로 밑**: Fork `$59.99, free evaluation`, Typora 구매·다운로드 나란히, iA 타일마다 `Free Trial`. 평가 기한을 강제하지 않는다고 적은 곳은 Sublime(다운로드 페이지)뿐이고, Fork는 기한을 적지 않은 채 "무료 평가, 장기 사용은 구매"라고만 쓴다(라이선스 페이지).
6. **릴리스 노트 3유형**: 배지형 단일 페이지(Fork), 버전별 영구 링크(Obsidian·Notepad++·Zed), 저장소·GitHub 자동 생성(Zettlr·Joplin). 피드는 Obsidian·Zed·Joplin·Notepad++(사이트 RSS) 정도.
7. **문서 위치**: 서브도메인(Typora·Zettlr), 같은 도메인 경로(Zed·MarkText `/docs`, Obsidian·Joplin `/help`, Kanri), 별도 도메인(Notepad++). 생성기는 제각각이다.
8. **언어**: 한국어 사이트는 Obsidian 하나. 번역은 경로 접두사(`/ko/`, `/de/`)가 일반적이다.
9. **실패 사례**: 손으로 고친 버전이 늦음(Fork 2.21.1 대 CDN 2.23.1, MarkText v0.19.0 대 v0.20.0), 옛 블로그 다운로드 링크 404(Fork), 옛 도메인 상실(MarkText), 유지보수 종료(Pot), 개인정보처리방침 없음(Fork).

### Gaps
- 첫 화면 구성·모바일 배치·접근성은 렌더링하지 않아 측정하지 않았다. 분석 도구·쿠키 배너는 일부만 확인했다(Fork 없음, Typora GA·AddThis, Zettlr Matomo, Zed 쿠키 설정).

## Frond에 주는 시사점

모두 [해석]이고 근거는 Q1~Q12의 [실측]이다.

1. **골격은 Fork식 긴 홈 한 장이 1인 운영에 맞다.** 히어로 → 앱 화면 → 다운로드 띠 → 기능 5~7개(제목·한 줄·그림) → 만든 사람 → 다운로드 띠 반복 → 푸터. 여기에 릴리스 노트·문서·`/buy`(나중)만 붙인다. Kanri·Yaak도 비슷한 크기다.
2. **Fork에서 따라 하지 말 것**: 문구를 이미지에 넣은 히어로(검색·번역·다크 모드 불가, alt 없음), 몇 년 묵은 스크린샷(`Fork [DEBUG]` 창), 손으로 고치는 버전 링크, 방치된 블로그·죽은 링크, 개인정보처리방침 부재.
3. **Windows 전용이므로 버튼은 하나.** `Windows용 다운로드` + 작은 줄(Windows 10/11 · x64 · 6.6 MB · 관리자 권한 불필요). 파일 크기를 적는 사이트는 없었지만, Frond 설치 파일(로컬 빌드 `Frond_0.1.0_x64-setup.exe` 6,940,704 B ≈ 6.6 MiB)은 Electron 계열 Markdown 앱(Typora 108·MarkText 121·Zettlr 150·Obsidian 326·Joplin 344 MiB)보다 한 자릿수 작아 그 자체로 차별점이다(Notepad++ 6.6, Kanri 4.3, Yaak 42.6 MiB).
4. **다운로드 주소는 자기 도메인 고정 URL → GitHub Releases(Joplin·Yaak·Zed 방식).** 사이트를 다시 배포하지 않아도 최신판을 가리키고 클릭 수도 셀 수 있다. GitHub `releases/latest/download/<파일명>`은 최신 태그의 같은 이름 자산으로 302한다(MarkText로 실측). 다만 Frond 자산 이름에 버전이 들어가므로(`Frond_0.1.0_x64-setup.exe`) 버전 없는 이름의 자산을 하나 더 올리거나 리다이렉터가 최신 버전을 찾아야 한다. 홈의 버전·날짜도 빌드 때 릴리스 데이터에서 넣는다(Obsidian `Last updated`, Yaak `Version ⋅ 날짜`).
5. **감사 페이지를 둔다(Sublime·Zettlr 방식).** 내려받기 직후 ① 안 되면 직링크 ② 서명 전이면 SmartScreen 경고 넘기는 법(대상 어디에도 없는 빈칸) ③ `.md` 기본 앱 지정 방법 ④ 문서·릴리스 노트 ⑤ 선택 구매·후원을 모은다. 서명 없이 시작하고 기본 앱 지정이 핵심인 Frond에 특히 맞다.
6. **설치 경로 표기**: winget(`cyKim.Frond`) 등록 뒤 Zettlr처럼 명령 한 줄 블록, Store 출시 뒤 Raycast처럼 공식 배지 + `get.microsoft.com/installer/download/<Store ID>` 링크. Yaak처럼 "사용자용 설치, 관리자 권한 불필요"를 밝히면 currentUser 설치인 Frond와 맞는다.
7. **가격은 버튼 밑 한 줄.** Fork의 `$59.99, free evaluation` 자리에 "무료 · 사용자 테마 해금은 선택 구매" 한 줄을 두고 `/buy`로 잇는다. 말투는 Obsidian `Free without limits`, 평가 기한을 강제하지 않는다는 Sublime이 Frond 모델과 맞다. FAQ 없는 Fork `/buy`보다 짧은 결제·환불 FAQ를 붙인다(Typora Store·Obsidian Pricing).
8. **릴리스 노트는 Fork 형식(버전·날짜·새 기능/개선/수정 배지)을 한국어로 쓰고, 버전 앵커와 Atom/RSS를 더한다.** 패치 버전도 남긴다(Fork는 숨김). 같은 원본을 Tauri updater 노트·GitHub Releases 본문에 재사용하면 세 곳이 어긋나지 않는다.
9. **미디어**: OS별 교체는 필요 없다. 라이트·다크(세이지 차콜)를 Sublime·Yaak식 토글이나 두 장으로 보여 주면 테마 소개를 겸한다. HTML로 앱을 다시 그리는 방식(Obsidian·MarkText)은 앱이 바뀔 때마다 고쳐야 해 1인 운영에 부담이고, 창 틀 포함 스크린샷 + CSS 그림자(Fork)가 가장 싸다.
10. **언어·푸터·도메인**: 한국어 UI 데스크톱 Markdown 앱을 한국어 사이트로 소개하는 대상은 없었다. 한국어 기본, 영어는 나중에 `/en/`(Obsidian식). 푸터는 릴리스 노트·문서·GitHub(이슈)·라이선스(MIT)·개인정보처리방침·이메일·저작권 연도. 도메인은 길게 갱신한다(MarkText 옛 도메인이 파킹·광고 페이지가 됨, 다운로드·updater 주소가 도메인에 묶임).

## 요약 표

| 항목 | 관찰 | Frond 제안 [해석] |
|---|---|---|
| 페이지 | 1인·소규모는 홈 + 다운로드/감사 + 노트 + 문서 | 홈 1장 + 감사 페이지 + 릴리스 노트 + 문서 + `/buy`(나중) |
| 히어로 | 짧은 제목 + 한 줄 + `Download for Windows` + 요구사항 줄 | 한국어 제목·한 줄을 HTML 글자로, 버튼 하나 + Windows 10/11·x64·6.6 MB·관리자 권한 불필요 |
| 미디어 | 창 스크린샷 / HTML 모형 / 캔버스 / 라이트·다크 토글 | 창 틀 스크린샷 + CSS 그림자, 라이트·다크 두 장 또는 토글 |
| 다운로드 주소 | 자체 CDN(유료 앱), GitHub 직링크, 자기 도메인 → GitHub | 자기 도메인 고정 URL → GitHub Releases 최신판 |
| 버전 표기 | 손으로 고치면 늦음(Fork·MarkText), 빌드·서버가 넣으면 맞음(Obsidian·Yaak) | 릴리스 데이터에서 자동 |
| Windows 세부 | ARM64·포터블·winget·Store·SHA 제각각, SmartScreen 안내 0곳 | x64 명시, winget 한 줄(등록 후), Store 배지(출시 후), SHA-256, SmartScreen 안내(서명 전) |
| 가격 | 버튼 밑 한 줄(Fork), 평가 기한 미기재(Fork)·강제 없음 명시(Sublime) | "무료 · 테마 해금 선택 구매" 한 줄 + 짧은 FAQ |
| 릴리스 노트 | Fork 배지형(피드 없음), Obsidian 영구 링크·Atom | Fork 형식 한국어판 + 앵커 + Atom/RSS, 패치 포함 |
| 문서 위치 | 서브도메인·경로·별도 도메인 모두 선례 | 다른 조사자 결론을 따름 |
| 언어 | 한국어는 Obsidian뿐, 번역은 경로 접두사 | 한국어 기본, 영어는 나중 `/en/` |
| 피할 것 | 이미지 속 문구, 묵은 스크린샷, 죽은 링크, 개인정보처리방침 부재, 도메인 상실 | 이 다섯 가지를 출시 전 점검 목록으로 |
