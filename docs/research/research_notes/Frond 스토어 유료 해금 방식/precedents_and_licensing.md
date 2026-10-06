# 「무료 사용 + 선택적 1회 구매 + 가끔 구매 안내 + 구매자 혜택」 선례와 소스 라이선스 (2026-10-06 기준)

조사일 2026-10-06. 가격·정책은 확인한 날짜와 함께 적었다. "커뮤니티 보고"는 공식 문서가 아니라 포럼·HN·기사에서 나온 것이다.
Frond 저장소 상태 확인: `cyKim0115/MdEditor`는 public, GitHub API의 `license` 필드가 비어 있다(LICENSE 없음) — `gh api repos/cyKim0115/MdEditor` 2026-10-06 실행 결과.

## 1. 선례 앱의 실제 방식 (가격·구매 안내·판매처)

### Takeaway
사용자가 말한 「Fork 방식」은 업계에서 "무기한 평가판(perpetual evaluation) + 가끔 뜨는 구매 안내(nag) + 명예 제도(honor system)"로 불리며 Fork·Sublime Text/Merge·WinRAR·REAPER가 대표 사례다. 기능은 막지 않고 안내만 띄운다. 이 중 **Sublime Merge는 라이선스가 없으면 다크 테마를 막는다** — 「외형만 구매자 전용」의 가장 가까운 선례이고, 불만도 꾸준히 나온다. Microsoft Store에서는 오픈소스 앱(Krita, Files)과 무료 배포 앱(Paint.NET)이 **같은 바이너리를 Store에서만 유료로 파는** 「후원용 Store 판매」 방식이 흔하다.

### Cited Findings

**Fork (git 클라이언트, 체코, Dan·Tanya Pristupov 부부 2인 개발)**
- 가격 $59.99, "One-time purchase", "Personal and commercial use", "1 user, up to 3 machines at a time" (2026-10-06 확인) — [fork.dev/buy](https://fork.dev/buy)
- Mac·Windows 같은 가격 $59.99, "free evaluation" 제공. 평가 기간 길이는 사이트에 안 적혀 있다 — [fork.dev](https://fork.dev/)
- EULA: "You can download and evaluate the Software for free, but need to purchase a license for long-term use." 라이선스 키는 "one user on up to 3 machines at a time on both Mac and Windows", 체코 법 준거 — [fork.dev/license](https://fork.dev/license)
- 가격 이력: 2020-03 유료 전환 때 $50 일회성 — [HN "Fork is now paid with free evaluation" (2020-03-22)](https://news.ycombinator.com/item?id=22654605). 2024-03-01 가격 변경(→ $59.99) 직전 사용자가 "free evaluation"이 유지되는지 물었고, 질문 본문은 이를 "rare nag screen asking to activate Fork"로 묘사했다. 개발자 답글은 확인되지 않고 이슈는 닫혔다 — [fork-dev/TrackerWin #2157 (2024-02-16)](https://github.com/fork-dev/TrackerWin/issues/2157)
- HN 2020 스레드에서 평가 기간을 "a seemingly eternal evaluation period"로 표현. 반응은 대체로 긍정("well worth the small price", 구독형 GitKraken·Tower 대비 일회성이라 좋다) — [HN 22654605](https://news.ycombinator.com/item?id=22654605)
- 개발자 Dan Pristupov(2022-05-31 HN): "we don't need too much money to survive"(부부 둘이 개발, 관리 비용 없음), "a one-time purchase which includes future updates", 유료 메이저 업그레이드 계획 없음 — [HN 31567702](https://news.ycombinator.com/item?id=31567702)
- 2024-12 사용자 질문 "what am I paying 50 dollars for compared to the fork I'm using now?" — 활성화 안내를 받은 뒤 가치에 의문. 즉 미구매 판과 구매 판의 **기능 차이가 없다**는 점이 사용자에게도 보인다 — [fork-dev/TrackerWin #2390](https://github.com/fork-dev/TrackerWin/issues/2390)
- 커뮤니티 요약: "free evaluation"은 팝업만 보이고 사실상 계속 쓸 수 있다 — [검색 결과 요약; dev.to·alternativeto 등](https://dev.to/cadams/why-git-fork-is-my-favorite-git-client-19fe) (1차 출처 아님)
- Windows 배포: winget `Fork.Fork`, Chocolatey `git-fork`, 공식 사이트 — [winstall.app](https://winstall.app/apps/Fork.Fork). **Microsoft Store 등록은 찾지 못함**(아래 Gaps).

**Sublime Text / Sublime Merge (Sublime HQ, 호주)**
- Sublime Text 개인 라이선스 $99, "3 years of updates. After 3 years, an upgrade will be required"; 비즈니스는 좌석당 연 $65(1~10석)~$50 구독. "Sublime Text may be downloaded and evaluated for free, however a license must be purchased for continued use." (2026-10-06) — [sublimehq.com/store/text](https://sublimehq.com/store/text)
- 개인 라이선스는 만료 없음, 3년 안에 나온 마지막 버전을 계속 사용; 비즈니스 라이선스는 구독 — [Sublime HQ Sales FAQ](https://www.sublimehq.com/sales_faq)
- "proprietary software, but can be downloaded for free and used as an evaluation version with no time limit"; Sublime Merge도 같은 모델, 두 제품 번들 가능 — [Wikipedia: Sublime Text](https://en.wikipedia.org/wiki/Sublime_Text)
- 구매 안내 빈도(커뮤니티 보고): 저장 약 30회마다 "This is an unregistered copy" 팝업. 2016-01 사용자 불만 "20-40 saves per 20 minutes"면 자주 본다; 다른 사용자 "If this message wasn't annoying I think very few people would be motivated to register" — [Sublime Forum 5289 (2016)](https://forum.sublimetext.com/t/this-is-an-unregistered-copy-message/5289). 2024-06에도 "every few save an annoying NAG screen appears" 불만, 무료 커뮤니티판 요구 — [Sublime Forum 72671 (2024-06-25)](https://forum.sublimetext.com/t/purchase-nag-screen-in-a-non-commercial-version/72671). 2026-05 기사도 "after about every 30 saves" — [MakeUseOf (2026-05-15)](https://www.makeuseof.com/winrar-made-the-endless-free-trial-famous-but-these-apps-did-better/)
- **Sublime Merge: 미등록판은 다크 테마 사용 불가** — 2019-04 사용자 "poma": 무료판에서 다크 테마를 막아 실제 작업 환경(전부 다크)에서 써 볼 수 없어 SourceTree로 돌아갔다; 2020·2024에도 같은 불만. 반면 사용자 facelessuser: "I honestly would have probably lingered on the trial longer if they gave me the dark theme out of the box." 스태프의 정책 해명 답글은 없음 — [Sublime Forum "Dark theme requires license" (2019-04~2025-08)](https://forum.sublimetext.com/t/dark-theme-requires-license/43720)
- 2022-02 GitHub 이슈: 다크 모드는 "a necessary accessibility feature"라며 미등록 사용자에게도 열어 달라는 요청, 2026-10 기준 Open, 스태프 답 없음 — [sublimehq/sublime_merge #1409](https://github.com/sublimehq/sublime_merge/issues/1409)
- 검색 요약상 테마 "선택"만 막고 package resource override는 막지 않아 커뮤니티 우회 테마가 존재 — [countzero/sublime_merge_dark](https://github.com/countzero/sublime_merge_dark) (검색 결과 요약, 저장소 본문 미확인)

**WinRAR**
- "We offer all users a 40-day free trial, after which time the use of WinRAR without a valid license is in violation of our EULA." "WinRAR licenses are perpetual and valid for a lifetime." 업데이트는 12개월 "Support & Maintenance Package" — [win-rar.com 라이선스 FAQ](https://www.win-rar.com/license-perpetual-subscription.html?L=0)
- 실제 동작(2차 출처): 40일 뒤에도 기능은 그대로, 실행할 때마다 구매 팝업. 단일 라이선스 약 $29~30 — [Tech With Muchiri](https://techwithmuchiri.com/winrar-and-its-40-day-trial/), [prosteit.pl](https://prosteit.pl/en/winrar-without-license-legality/) (가격은 2차 출처, 공식 페이지에서 확인 못함)
- 주의: 공식 문구는 "명예 제도"가 아니라 **40일 뒤 무단 사용은 EULA 위반**이다. 수익원은 개인이 아니라 라이선스를 준수해야 하는 기업이라는 해석이 널리 퍼져 있음 — [X @elormkdaniel (2026)](https://x.com/elormkdaniel/status/2021600554510651531) (의견)

**REAPER (Cockos, DAW)**
- "You get 60 days of evaluation free, with full functionality, and no strings attached." 할인 라이선스 $60(개인·연매출 $20,000 이하·교육/비영리), 상업 $225, "free upgrades through REAPER version 8.99" — [reaper.fm/purchase](https://www.reaper.fm/purchase.php) (2026-10-06)
- 60일 뒤 기능 제한 없이 알림 화면만 — [nolabelnoproducernolimits.com](https://nolabelnoproducernolimits.com/indie/production/reaper/reaper-license/) (2차). 커뮤니티 보고: 안내 화면에서 약 5초 기다리면 "Still evaluating" 버튼이 활성화되고 평가 일수를 보여 준다 — [ReasonTalk 포럼 (검색 결과 요약, 본문 403)](https://forum.reasontalk.com/viewtopic.php?t=7522188&start=25)
- HN에서 REAPER 라이선스 방식을 "an amazing breath of [fresh air]"로 호평 — [HN 35955593](https://news.ycombinator.com/item?id=35955593) (제목 일부만 확인)

**Typora (Markdown 에디터, Frond와 직접 경쟁)**
- "$ 14.99(without tax)", "15 days free trial", 라이선스당 "at most 3 devices at one time", 30일 환불 — [store.typora.io](https://store.typora.io/) (2026-10-06)
- 공식 문서: 체험 기간에는 기능 차이 없고 상태 표시줄 trial 표시·활성화 대화상자가 뜰 수 있다; "we may show a 'trial button', disable certain features or shorten trial time in the future, but most functions will be kept." — [support.typora.io/purchase](https://support.typora.io/purchase/). 체험 종료 뒤 정확한 동작(읽기 전용 여부)은 공식 문서에 명시가 없다(아래 Gaps).
- 체험 리셋 스크립트가 GitHub에 공개돼 있다(우회 존재) — [Stupeflip/TyporaIO-Infinite-Trial](https://github.com/Stupeflip/TyporaIO-Infinite-Trial)
- Microsoft Store 등록 페이지 존재(ID `XPFPH15B9DLNZH`) — [apps.microsoft.com](https://apps.microsoft.com/detail/xpfph15b9dlnzh?hl=en-US&gl=US). 가격·체험 표기는 페이지가 JS 렌더라 추출 실패.

**Obsidian (클로즈드 소스, 무료 + 후원)**
- 앱은 "Free without limits. No sign-up required." Catalyst 일회성 $25부터, 혜택 "Early access to beta versions", "Community badges", "Exclusive channels" — [obsidian.md/pricing](https://obsidian.md/pricing) (2026-10-06)
- Catalyst 3단계: Insider $25 / Supporter $50 / VIP $100, 모두 "Early access to new versions of Obsidian"·"Access to exclusive development channels", Supporter 이상은 lounge 채널, 등급별 배지; 상위 등급은 차액만 내고 업그레이드 — [Obsidian Help: Catalyst license](https://obsidian.md/help/Licenses+and+payment/Catalyst+license)
- 2025-02-20 Commercial license를 선택 사항으로 전환("Obsidian is now free for work"), 지금은 $50/사용자/년 후원 성격 — [Obsidian 블로그](https://obsidian.md/blog/free-for-work/), [obsidian.md/pricing](https://obsidian.md/pricing). CEO kepano: 회사 단위 라이선스는 "wasn't enforceable since Obsidian has no required signup", 위반 기업이 수만 명 규모였다 — [X @kepano](https://x.com/kepano/status/2085050151463485443)
- 시사점: Obsidian은 **테마·앱 기능을 구매자 전용으로 막지 않고** 혜택을 조기 접근·배지·커뮤니티로만 준다(테마는 무료 커뮤니티 마켓).

**Beyond Compare (Scooter Software)**
- Standard $35, Pro $70(1~4명 사용자당), 일회성, 한 사람이 여러 컴퓨터 사용 가능; "may be evaluated for free, but a license must be purchased for continued use" — [scootersoftware.com/shop](https://www.scootersoftware.com/shop) (2026-10-06). 체험 30일(사용일 기준)은 페이지에서 확인하지 못함.

**iA Writer**
- Windows $29.99, Mac $49.99 일회성, "7-Day Free Trial", "One-Time ≠ Lifetime"(메이저 업데이트 유료 가능) — [ia.net/writer/pricing](https://ia.net/writer/pricing) (2026-10-06). 검색 요약상 Microsoft Store에도 있으나 Store판이 구버전(1.4)이었다는 보고 — [iA Writer 검색 결과(Thurrott 등)](https://www.thurrott.com/windows/windows-11/317338/ia-writer-2-0-for-windows-is-now-available) (요약, 미검증)

**오픈소스 Markdown/노트 앱 (후원형)**
- MarkText: MIT, 별 62k, 2026-10 활동 중, README "If MarkText improves your workflow, please consider sponsoring the project" — [GitHub API·README marktext/marktext](https://github.com/marktext/marktext)
- Zettlr: GPL-3.0 — [GitHub Zettlr/Zettlr](https://github.com/Zettlr/Zettlr) (GitHub API). 후원 방식은 확인 안 함.
- Joplin: 저장소 기본 라이선스 AGPL-3.0-or-later, `packages/server`는 별도 라이선스, 로고·아이콘 "all rights reserved", "Joplin®" EU 상표 — [joplin LICENSE](https://github.com/laurent22/joplin/blob/dev/LICENSE)

**Microsoft Store 위 무료·후원형 Windows 앱**
- Notepads(MIT): README "You can get the latest version of Notepads here for free: Microsoft Store", 후원 요청은 리뷰·후원 링크 — [0x7c13/Notepads](https://github.com/0x7c13/Notepads)
- ScreenToGif(MS-PL): Microsoft Store 배포 + PayPal·Patreon·Ko-fi·Steam 위시리스트 후원 — [NickeManarin/ScreenToGif](https://github.com/NickeManarin/ScreenToGif)
- ShareX: GPL-3.0 — [GitHub API ShareX/ShareX](https://github.com/ShareX/ShareX)

**「Store에서만 유료」 후원형 (같은 바이너리)**
- Files(MIT, 별 45k): "Purchasing Files through the Microsoft Store helps support the developers…", 기부·스폰서 링크 별도 — [files.community/download](https://files.community/download). 검색 요약상 Store가 $12.99, 클래식 설치기(winget·scoop·choco)는 무료 — [검색 요약](https://www.xda-developers.com/ditched-windows-file-explorer-free-open-source-alternative/) (가격 1차 미확인). "Files App. Not free??" 포럼 스레드가 있을 정도로 혼란을 낳음 — [ElevenForum](https://www.elevenforum.com/t/files-app-not-free.11517/) (본문 403)
- Krita(GPL-3.0): "Krita on Steam and in the Windows Store is still Free and Open Source software; the binaries are exactly the ones you can also download from krita.org. We've put a price tag on downloading Krita from either store to support Krita's development." 수익이 "the full-time involvement with Krita of four developers"를 지원 — [Krita FAQ](https://docs.krita.org/en/KritaFAQ.html). Microsoft Store·Steam·Epic·Mac App Store 유료판 — [krita.org/download](https://krita.org/en/download/). 가격 $9.99는 검색 요약만(미검증).
- Paint.NET(**프리웨어, 오픈소스 아님**): 웹사이트 "Classic" 무료 / Store판 유료, 차이는 Store판의 "fully automatic updating"뿐, 기부도 환영 — [paint.net/license](https://www.paint.net/license.html). 개발자가 Store 수수료 때문에 웹 기부를 더 선호한다는 보도 — [gHacks (2017-10-01)](https://www.ghacks.net/2017/10/01/paint-net-lands-in-windows-store-but-is-not-free/)
- Maccy(macOS, MIT): "It is and will always be free." App Store판은 같은 앱의 후원용 유료 판 — [maccy.app](https://maccy.app/), [검색 요약](https://apps.apple.com/us/app/maccy/id1527619437?mt=12)

**오픈소스 + 후원자 전용 기능 (명예 제도형)**
- Stretchly(BSD-2-Clause, 휴식 알림 앱): "Stretchly is free but you can support it by contributing code, translations or money." 후원·기여자에게 "Contributor Preferences, Sync Preferences" (Patreon은 Discord 채팅 추가). 앱 설정 "Love Stretchly"에서 GitHub·Patreon 인증으로 해금 — [hovancik.net/stretchly/sponsor](https://hovancik.net/stretchly/sponsor/), [GitHub hovancik/stretchly](https://github.com/hovancik/stretchly). 설정은 JSON 파일이라 직접 고칠 수 있다고 README에 적혀 있다(= 사실상 우회 가능, 명예 제도).

**외형(테마·아이콘)을 유료 혜택으로 둔 사례 (구독형)**
- Raycast: "Custom Themes" Free "Not included" / Pro "Included", Pro $10/월 또는 $96/년 — [raycast.com/pricing](https://www.raycast.com/pricing) (2026-10-06)
- Bear: 무료 테마 3종(Red Graphite, High Contrast, Dark Graphite), Pro로 "over a dozen more themes" — [Bear FAQ](https://bear.app/faq/about-free-and-pro-themes-in-bear/); Pro $2.99/월·$29.99/년 — [검색 요약](https://bear.app/faq/features-and-price-of-bear-pro/)
- Drafts Pro: "Dark, solarized and themes with automatic switching. Customize the app home screen icons on iOS." $19.99/년 또는 $1.99/월 — [docs.getdrafts.com/draftspro](https://docs.getdrafts.com/draftspro)

### Inferences
- 사용자 요구(가끔 구매 안내 + 구매자는 사용자 테마 해금 + 전용 테마)는 **Fork(안내) + Sublime Merge(외형 잠금) + Obsidian Catalyst(조기 접근·배지 같은 비기능 혜택)** 의 조합에 해당한다. 일회성 구매 + 외형 잠금을 함께 쓰는 대표 사례는 Sublime Merge뿐이고, Raycast·Bear·Drafts는 구독형이다.
- Typora($14.99, 15일 체험)가 Frond의 직접 가격 기준점이다. Fork·Sublime·REAPER는 $59~99대지만 개발 도구·DAW라 직접 비교가 어렵다.
- Store에서 「같은 바이너리를 Store에서만 유료로」 파는 방식(Krita·Files·Paint.NET)은 Windows Store에서 이미 정착된 관행이다. 다만 Frond처럼 Store가 **주 배포처**이면 이 방식은 사실상 유료 앱이 되어 사용자의 「무료로 쓰되 선택 구매」 의도와 다르다.

### Gaps
- Fork의 정확한 안내 빈도·문구(며칠마다, 실행 시점인지)는 공식 문서·개발자 답변에서 찾지 못했다. "rare"라는 커뮤니티 표현뿐.
- Fork·Sublime Text의 Microsoft Store 등록은 찾지 못했다(winget·Chocolatey·공식 사이트 배포만 확인).
- Typora 체험 종료 뒤 동작(읽기 전용인지, 계속 편집 가능한지)과 Store판 가격·체험 여부는 1차 출처로 확인하지 못했다.
- Files·Krita의 현재 Store 가격은 검색 요약만 있고 Store 페이지는 JS 렌더라 추출 실패.
- 어느 선례도 구매 전환율·매출 수치를 공개한 1차 자료를 찾지 못했다(Krita의 "개발자 4명 상근 지원"이 유일한 정량 단서).

## 2. 구매 안내(nag) UX: 빈도·문구·피해야 할 것

### Takeaway
선례의 안내 트리거는 세 종류다 — **저장 횟수**(Sublime, 약 30회), **실행**(WinRAR, 체험 뒤 매 실행), **평가 기간 뒤 실행 시 지연 버튼**(REAPER, 약 5초). 가장 많은 불만은 "작업 흐름 중(저장할 때) 뜬다"는 것이다. 공개된 전환율 수치는 찾지 못했다. 빈도 상한의 공신력 있는 비유는 Apple 리뷰 요청 상한(365일에 3회)이다. Microsoft Store 정책에 "구매 안내 빈도" 조항은 없지만 체험·구매 고지 조항(10.8.4)이 있다.

### Cited Findings
- Sublime Text: 저장 약 30회마다 → 자주 저장하는 사용자는 20분에 여러 번 보게 되어 불만(2016, 2024 반복) — [Sublime Forum 5289](https://forum.sublimetext.com/t/this-is-an-unregistered-copy-message/5289), [Sublime Forum 72671](https://forum.sublimetext.com/t/purchase-nag-screen-in-a-non-commercial-version/72671)
- 같은 스레드의 반대 의견: 짜증 나지 않으면 등록할 동기가 거의 없다("If this message wasn't annoying…") — [Sublime Forum 5289](https://forum.sublimetext.com/t/this-is-an-unregistered-copy-message/5289)
- WinRAR: 40일 체험 뒤 실행할 때마다 팝업, 기능 제한 없음 — [Tech With Muchiri](https://techwithmuchiri.com/winrar-and-its-40-day-trial/) (2차)
- REAPER: 60일은 "full functionality, and no strings attached" — [reaper.fm/purchase](https://www.reaper.fm/purchase.php); 그 뒤 알림 화면 + 약 5초 뒤 "Still evaluating" 버튼(커뮤니티 보고) — [ReasonTalk (검색 요약)](https://forum.reasontalk.com/viewtopic.php?t=7522188&start=25)
- Fork: 커뮤니티가 "rare nag screen"이라고 부름(빈도 미공개) — [TrackerWin #2157](https://github.com/fork-dev/TrackerWin/issues/2157)
- Typora 체험 중: "display a trial label on status bar and may prompt activation dialog" — [Typora purchase 검색 요약](https://support.typora.io/purchase/)
- Process Lasso 개발자는 2009년 전환율을 높이려고 안내 창의 빠른 닫기를 없애고 카운트다운을 끝까지 기다리게 바꿨다(검색 요약) — [Process Lasso blog (2009-06)](https://processlasso.blogspot.com/2009/06/nag-screen-changes.html) (본문 추출 실패, 효과 수치 없음)
- 빈도 상한 비유: Apple StoreKit 리뷰 요청은 "a maximum of three times within a 365-day period"로 시스템이 강제 — [Apple 문서 인용(검색 요약)](https://developer.apple.com/documentation/storekit/requestreviewaction), [Apple Developer Forums 115193](https://developer.apple.com/forums/thread/115193)
- 결제 미완료 고객에게 다시 알릴 때 "do it very sparingly. Most people nowadays hate getting nag-mail out of the blue" — [Eternal Storms 블로그 (2024-12-18)](https://blog.eternalstorms.at/2024/12/18/selling-outside-of-the-mac-app-store-part-ii-lets-meddle-with-paddle/) (검색 요약)
- Microsoft Store Policies v7.20(ms.date 2026-09-14) 10.8.4: 체험의 범위·조건을 명확히 하고 오도 금지, "If your product restricts access to user-created content during or after a trial, you must notify users in advance", 구매를 시작한다는 것을 사용자에게 분명히 — [Microsoft Store Policies](https://learn.microsoft.com/en-us/windows/apps/publish/store-policies)
- 같은 정책 10.9: 알림은 시스템 알림 설정을 존중하고 꺼져도 앱이 동작해야 한다 — [Microsoft Store Policies](https://learn.microsoft.com/en-us/windows/apps/publish/store-policies)

### Inferences
- 선례에서 뽑은 설계 원칙(근거 → 제안):
  - **입력·저장 중에는 띄우지 않는다** — Sublime의 반복 불만이 「저장할 때 뜨는 것」에 집중. Frond는 저장(Ctrl+S)·IME 조합 중 트리거를 피하고 앱 시작 뒤 유휴 시점이나 닫을 때 비모달로 띄우는 편이 안전하다.
  - **횟수보다 시간 기준 상한** — Apple 365일 3회 비유. "N일마다 최대 1회 + 첫 N일은 안 띄움(REAPER 60일·WinRAR 40일 같은 유예)"이 Fork의 "rare"에 가깝다.
  - **닫기 지연(카운트다운) 금지** — REAPER 5초·Process Lasso 카운트다운은 전환 압박용이나, 「선택 구매」를 표방하면 맞지 않는다.
  - **「이미 구매함(복원)」·「나중에」 버튼** — Store IAP는 복원이 필요하므로 안내창에 복원 경로를 두면 구매자 오탐 불만(Sublime Forum 25963 같은 "등록했는데 미등록 메시지")을 줄인다 — [Sublime Forum 25963](https://forum.sublimetext.com/t/your-copy-of-sublime-is-not-registered-message-even-though-ive-registered-it/25963) (제목만 확인)
  - **사용자 내용(문서)을 절대 막지 않는다** — Store 10.8.4는 체험 중·후 사용자 생성 콘텐츠 제한 시 사전 고지를 요구하므로, 문서 열기·저장은 항상 무료로 두면 이 조항과 무관해진다.
- 「오픈소스 + 후원 팝업」은 포크에서 팝업만 지운 빌드가 나올 수 있다(아래 §4). 팝업 강도를 높일수록 포크 동기가 커진다.

### Gaps
- 인디 데스크톱 앱의 nag 전환율(예: 미구매 → 구매 %) 공개 데이터는 찾지 못했다. Sublime HQ·Fork·Cockos 모두 수치 비공개.
- Fork의 안내 문구 원문·스크린샷은 확인하지 못했다.
- Microsoft Store 정책에 nag 빈도를 직접 다루는 조항은 없었다(정책 상세는 다른 조사자 담당).

## 3. 외형(테마) 잠금 선례와 「무료였던 기능을 유료로 돌리는」 반발

### Takeaway
외형을 유료 혜택으로 두는 것은 흔하다(Raycast Custom Themes, Bear Pro themes, Drafts Pro themes·icons, Sublime Merge 다크 테마). 기능 잠금보다 반발이 작지만, **다크 테마처럼 접근성·눈 피로와 엮이는 외형은 "접근성 기능을 돈 받고 판다"는 불만**을 부른다(Sublime Merge). 무료였던 것을 거둬들이면 반발이 크다(Evernote 2016). Frond는 0.1.0 미공개라 지금 정하면 「거둬들이기」 문제가 거의 없다.

### Cited Findings
- Sublime Merge 다크 테마 라이선스 잠금 → 2019~2024 반복 불만, 2022 "necessary accessibility feature" 이슈 Open, 스태프 무응답; 일부 사용자는 오히려 잠금이 구매 동기라고 옹호 — [Sublime Forum 43720](https://forum.sublimetext.com/t/dark-theme-requires-license/43720), [GitHub #1409](https://github.com/sublimehq/sublime_merge/issues/1409)
- Raycast: Custom Themes Pro 전용 — [raycast.com/pricing](https://www.raycast.com/pricing)
- Bear: 무료 3종(라이트·하이 콘트라스트·**다크** 포함) + Pro 다수 — [Bear FAQ](https://bear.app/faq/about-free-and-pro-themes-in-bear/). 즉 다크 테마 하나는 무료로 남겨 접근성 불만을 피한 구조.
- Drafts Pro: 테마·앱 아이콘이 Pro 혜택 — [Drafts Pro](https://docs.getdrafts.com/draftspro)
- Obsidian·Typora·MarkText는 테마를 무료로 두고(Obsidian은 커뮤니티 테마 마켓) 후원 혜택은 조기 접근·배지 — [obsidian.md/pricing](https://obsidian.md/pricing)
- 무료 기능 축소 반발: Evernote 2016-06-28 무료 Basic을 2대로 제한 + 가격 인상 → "Public response was highly negative"(AppleInsider 보도), 사용자 이탈 위협 — [TechCrunch (2016-06-28)](https://techcrunch.com/2016/06/28/evernote-tweaks-features-in-free-plan-and-raises-prices-in-paid-ones/), [AppleInsider (2016-06-29)](https://appleinsider.com/articles/16/06/29/users-upset-by-evernote-price-hikes-two-device-limit-for-free-basic-customers). 검색 요약상 기존 초과 사용자에게 30일 유예 — [AppleInsider](https://appleinsider.com/articles/16/06/29/users-upset-by-evernote-price-hikes-two-device-limit-for-free-basic-customers)
- 라이선스를 닫으면 포크가 생긴다: Aseprite가 2016-08 GPLv2 → 독자 EULA로 바꾸자 마지막 GPL판에서 LibreSprite 포크 — [Wikipedia: LibreSprite](https://en.wikipedia.org/wiki/LibreSprite), [Aseprite FAQ](https://www.aseprite.org/faq/). LibreSprite는 2026-10에도 활동 중(GPL-2.0, 별 8.5k) — [GitHub LibreSprite](https://github.com/LibreSprite/LibreSprite)
- Microsoft Store 10.8.6(구독): "You may add value to a subscription but may not remove value for users who have previously purchased it." — [Microsoft Store Policies](https://learn.microsoft.com/en-us/windows/apps/publish/store-policies) (일회성 구매에 직접 적용되는 조항은 아니지만 Store의 방향을 보여 준다)

### Inferences
- Frond에 맞는 선 긋기: **내장 라이트·다크(세이지 차콜)와 추천 테마는 계속 무료**, 구매자 혜택은 「사용자 테마 폴더 불러오기·테마 편집기」와 「구매자 전용 테마 팩」 — Bear 구조(다크 무료 + 추가 테마 유료)와 같아 Sublime Merge식 접근성 반발을 피한다.
- 0.1.0이 공개 전이면 「사용자 테마 무료 → 유료」 전환은 대외적으로 거둬들이기가 아니다. 다만 저장소가 public이라 이미 받은 사람이 있다면, 첫 공개 릴리스 전에 정책을 확정하고 사전 빌드 사용자는 사용자 테마를 유지(grandfathering)하는 것이 Evernote류 반발을 피하는 선례적 방법이다.
- 사용자 테마가 "CSS 토큰 JSON 파일"이면 무료 사용자가 파일을 직접 바꿔 넣는 우회는 막기 어렵다(Stretchly가 JSON 설정을 막지 않는 것과 같은 명예 제도). 해금은 기술적 보호보다 「구매자는 편한 UI(편집기·가져오기)」를 받는 쪽으로 설계하는 편이 현실적이다.

### Gaps
- 「테마를 유료화했다가 반발로 되돌린」 데스크톱 앱 사례는 찾지 못했다.
- Bear Pro 구독이 끊긴 뒤 Pro 테마가 어떻게 되는지는 FAQ에 없었다.

## 4. 공개 저장소에서 해금을 팔 때의 라이선스 선택지와 무료 코드 서명 자격

### Takeaway
SignPath Foundation 무료 서명은 **OSI 라이선스 + "commercial dual-licensing" 금지 + 독점(비공개) 구성요소 금지**가 조건이라, 「비공개 해금 모듈」이나 「유료 전용 비공개 테마 팩을 앱에 포함」하는 순간 자격이 깨진다. Certum Open Source 인증서는 "software distributed commercially"에 쓰면 폐지된다. 반면 **OSI(GPL/MIT) + Store에서 같은 바이너리를 유료 판매**는 Krita·Files·Maccy가 쓰는 정착된 방식이고, Microsoft는 2022-07 오픈소스 판매 금지 문구를 철회했다. 소스 공개형(PolyForm·FSL·BUSL)은 OSI가 아니므로 무료 서명 자격이 없다. 지금 LICENSE가 없는 public 저장소는 법적으로 "모든 권리 보유"지만 GitHub 약관상 열람·포크는 허용된다.

### Cited Findings

**현재 상태(라이선스 없음 + public)**
- "Without a license, the default copyright laws apply, meaning that you retain all rights to your source code and no one may reproduce, distribute, or create derivative works from your work." 단 GitHub ToS에 따라 다른 사용자는 "view and fork" 가능 — [GitHub Docs: Licensing a repository](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository)

**(a) 독점 유지 — 공개 프리웨어 + Store 유료 (Paint.NET)**
- Paint.NET은 오픈소스가 아니며 "You may not modify, adapt, rent, lease, loan, sell, or create derivative works", 무료 재배포는 무상일 때만 허용 — [paint.net/license](https://www.paint.net/license.html)
- Aseprite: 소스는 공개하되 EULA로 "you cannot redistribute Aseprite to third parties", 직접 빌드해 개인 사용은 허용, 바이너리 $19.99 + Steam 키 — [Aseprite FAQ](https://www.aseprite.org/faq/). GitHub API상 라이선스 필드 없음(독자 EULA) — [aseprite/aseprite](https://github.com/aseprite/aseprite)

**(b) 소스 공개형(source-available), 비OSI**
- PolyForm 계열: Strict = 사용만, 변경·배포 불가; Noncommercial = 비상업 목적의 사용·변경·배포; Small-Business·Internal-Use·Free-Trial·Perimeter·Shield 등 — [polyformproject/polyform-licenses](https://github.com/polyformproject/polyform-licenses)
- FSL(Functional Source License, Sentry 제작): "Fair Source license that converts to Apache 2.0 or MIT after two years", 버전마다 2년 — [fsl.software](https://fsl.software/). Competing Use = "making the Software available to others in a commercial product or service that: (1) substitutes for the Software…(3) offers the same or substantially similar functionality" — [FSL-1.1-MIT 템플릿](https://fsl.software/FSL-1.1-MIT.template.md)
- (BUSL은 이번에 1차 출처를 확인하지 못함 — Gaps)

**(c) 오픈 코어 — OSI 본체 + 비공개 유료 부분**
- SignPath Foundation 조건 원문: "OSS License: The project must use an OSI-approved Open Source license without commercial dual-licensing for all components." / "No proprietary code: The project may not contain any proprietary, non open-source component" (GPLv3 정의의 시스템 라이브러리만 예외) / "Released: … already be released in the form that should be signed" / 서명은 저장소 소스에서 자동 빌드된 바이너리임을 확인. 그 밖에 MFA, 역할(Authors·Reviewers·Approvers), 코드 서명 정책 공개 — [signpath.org/terms](https://signpath.org/terms) (페이지 머리에 "Draft" 표시, 날짜 없음)
- → 앱 안에 비공개 해금 모듈·비공개 유료 테마를 넣으면 "No proprietary code"에 걸린다. 오픈 코어로 가면 SignPath 서명은 오픈소스 본체만 서명할 수 있고, 유료 부분을 포함한 빌드는 대상이 아니다(추론, 아래).
- Certum Open Source Code Signing: 개인에게만 발급, CN에 "Open Source Developer", €49부터, 월 5,000서명 상한 — [Certum Shop](https://shop.certum.eu/open-source-code-signing-on-simplysign.html). "If Certum determines that the certificate is being used to sign software distributed commercially, the certificate will be revoked." 공개된 오픈소스 프로젝트 주소와 신청자 관계 증빙 필요 — [Certum 필요 서류](https://support.certum.eu/en/code-signing-required-documents/)

**(d) 완전 OSI + 편의 바이너리 판매**
- Krita(GPL-3.0): Store·Steam 유료판이 krita.org 무료판과 같은 바이너리, 수익으로 개발자 4명 상근 — [Krita FAQ](https://docs.krita.org/en/KritaFAQ.html)
- Files(MIT): Store 구매가 개발 지원, 그 밖의 설치 경로는 무료 — [files.community/download](https://files.community/download)
- Maccy(MIT): "It is and will always be free", App Store 유료판 병행 — [maccy.app](https://maccy.app/)
- Ardour(GPL-2.0): 소스 무료, ardour.org 완성 바이너리는 유료(최소 $1, 월 $1/$4/$10/$50 구독), 무료 데모 바이너리는 일정 시간 뒤 재생 중단; 리눅스 배포판은 무료 바이너리 제공 — [community.ardour.org/download](https://community.ardour.org/download), [HN 36703005](https://news.ycombinator.com/item?id=36703005) (가격은 HN 요약)
- Stretchly(BSD-2): 오픈소스 앱 안에서 후원자 인증으로 "Contributor Preferences" 해금 — [Stretchly sponsor](https://hovancik.net/stretchly/sponsor/)

**Microsoft Store의 오픈소스 판매 입장**
- 2022-06-16 정책 10.8.7에 "attempt to profit from open-source or other software that is otherwise generally available for free" 금지 문구 추가 → 원저작자도 못 팔게 된다는 반발 → 2022-07 시행 연기 후 "removed any mention of open source software", 11.2에 지식재산 침해 신고 링크 추가 — [TechCrunch (2022-07-19)](https://techcrunch.com/2022/07/19/microsoft-u-turns-on-policy-that-wouldve-banned-commercial-open-source-apps/), [gHacks (2022-06-17)](https://www.ghacks.net/2022/06/17/microsoft-store-no-astronomical-pricing-and-paid-open-source-or-free-copycat-applications-anymore/), [The Register (2022-07-08)](https://www.theregister.com/2022/07/08/microsoft_store_open_source_webkit/)
- 현행(v7.20, 2026-09-14) 10.8.7은 가격이 법령 준수 + "Not be priced irrationally high relative to the features and functionality provided"만 요구, 오픈소스 언급 없음. 11.2: 콘텐츠는 직접 만들었거나 적법하게 라이선스된 것이어야 하고 권리자는 침해 신고 가능 — [Microsoft Store Policies](https://learn.microsoft.com/en-us/windows/apps/publish/store-policies)
- 후원과 혜택의 결제 방식(다른 조사자 담당이나 충돌 표시): 10.8.2 "voluntary donations … if the user receives digital goods or services in return, including but not limited to additional features …, you must use the Microsoft Store in-product purchase API", 한편 10.8.1은 PC 비게임 앱이 디지털 아이템에 "secure third-party purchase API" 또는 Store IAP를 쓸 수 있다고 함 — [Microsoft Store Policies](https://learn.microsoft.com/en-us/windows/apps/publish/store-policies). **두 조항이 후원+혜택 상황에서 서로 다르게 읽힌다** — 다른 조사자의 확인 필요.

**포크·우회 위험**
- Aseprite → LibreSprite(라이선스를 닫자 마지막 GPL판에서 포크, 2026에도 유지) — [Wikipedia: LibreSprite](https://en.wikipedia.org/wiki/LibreSprite)
- Typora 체험 리셋 스크립트 공개(클로즈드 소스여도 우회는 생김) — [TyporaIO-Infinite-Trial](https://github.com/Stupeflip/TyporaIO-Infinite-Trial)
- Sublime Merge 다크 테마 잠금도 리소스 오버라이드로 우회됨 — [countzero/sublime_merge_dark](https://github.com/countzero/sublime_merge_dark) (요약)

### Inferences
- Frond 선택지 정리(사실 → 추론):
  1. **독점 유지(LICENSE에 All rights reserved 명시, 저장소 public 유지 또는 private 전환)** — 해금 판매와 충돌이 없다. 대신 SignPath·Certum 무료 서명은 불가 → Store(MSIX, Store가 서명) 외 채널은 유료 인증서나 무서명. public 유지 시 해금 검사 코드가 보이므로 우회는 쉽다(Stretchly·Sublime Merge 수준의 명예 제도로 받아들여야 함).
  2. **OSI(MIT/GPL) 전체 공개 + Store판에서 IAP 해금(같은 소스)** — Stretchly형. SignPath 조건상 "commercial dual-licensing"·"proprietary component"가 없으므로 형식상 자격 유지 가능성이 있다. 다만 (i) 구매자 전용 테마 파일도 저장소에 공개해야 하고(비공개면 proprietary component), (ii) 누구나 해금 검사를 지운 포크를 빌드할 수 있으며, (iii) Certum은 "software distributed commercially" 서명 시 폐지라 Store 판매와 같은 바이너리를 Certum으로 서명하면 위험하다. 무료 채널 빌드에는 해금 기능 자체를 넣지 않는 식의 분리도 생각할 수 있으나 SignPath가 이를 어떻게 보는지는 확인 못 했다.
  3. **오픈 코어(OSI 본체 + 비공개 테마 팩·해금 모듈)** — SignPath "No proprietary code"에 정면으로 걸린다(유료 부분을 뺀 빌드만 서명 대상). 빌드 두 벌 관리 부담.
  4. **소스 공개형(PolyForm Strict/Noncommercial, FSL)** — 포크 재배포·경쟁 판매를 막지만 OSI가 아니라 SignPath 자격 없음. Certum도 "Open Source project" 증빙이 필요해 불확실.
- 「Store가 주 배포처」라는 전제에서는 Store가 MSIX에 서명하므로 무료 서명 자격의 가치가 비Store 채널(winget·GitHub Releases)에 한정된다. 해금 판매가 목표의 중심이면 (1)이나 (2)가 단순하고, 무료 서명이 중요하면 (2)만 남는다 — 이때 「구매자 전용 테마」는 소스에 공개된 채로 "편하게 받는 권리"를 파는 것이 된다(Krita·Files처럼).
- 지금 LICENSE가 없는 상태로 오래 두면 기여자가 생겼을 때 나중에 라이선스를 정하기 어려워진다(기여분 저작권). 결정 전까지 외부 PR을 받지 않는 편이 안전하다(추론, 출처 없음).

### Gaps
- BUSL(MariaDB) 원문과 Elastic License는 이번에 1차 출처로 확인하지 못했다.
- SignPath가 "OSI 소스 + Store판 IAP 해금"(같은 소스에 결제 코드 포함)을 허용하는지 명시 문구는 없다. 조건 문구상 금지 대상은 "commercial dual-licensing"과 "proprietary component"뿐이다. 실제 판단은 SignPath에 문의 필요.
- Certum의 "distributed commercially"가 「무료 배포 + 선택적 IAP」에 해당하는지 정의를 찾지 못했다.
- Microsoft Store가 「같은 오픈소스 앱을 제3자가 Store에 올려 파는 경우」 원작자를 어떻게 보호하는지는 11.2 신고 경로 외에 확인 못 함.

## 5. 테마에 넣는 글꼴·제3자 자산 라이선스 (간단히)

### Takeaway
OFL 글꼴(D2Coding 등)은 유료 앱·유료 테마 팩에 번들할 수 있지만 **글꼴 자체만 따로 팔 수는 없다**. 번들 시 저작권 표시·라이선스 문구·라이선스 전문을 함께 넣고, 수정하면 Reserved Font Name을 쓰면 안 된다.

### Cited Findings
- 상용 소프트웨어 번들 허용("text editors, word processors, design and publishing applications" 등에 원본·수정본 모두) — [OFL FAQ](https://openfontlicense.org/ofl-faq/)
- 글꼴 단독 판매 불가: 의도는 "keep people from making money by simply redistributing the fonts" — [OFL FAQ](https://openfontlicense.org/ofl-faq/)
- 번들 시 최소 "the copyright statement, the license notice and the license text", 앱 About에 원 패키지 링크를 두는 방식도 인정 — [OFL FAQ](https://openfontlicense.org/ofl-faq/)
- 수정 시 Reserved Font Name이 선언돼 있으면 "change the internal names of the font to your own font name" — [OFL FAQ](https://openfontlicense.org/ofl-faq/)
- 테마·템플릿에 통합 가능, 단 글꼴은 "as part of a software bundle"로만 판매 — [OFL FAQ](https://openfontlicense.org/ofl-faq/)
- Store 11.2: 모든 콘텐츠는 직접 만들었거나 적법하게 라이선스된 것이어야 함 — [Microsoft Store Policies](https://learn.microsoft.com/en-us/windows/apps/publish/store-policies)
- 테마 이름·팔레트 주의: Joplin은 코드가 AGPL이어도 로고·아이콘은 "all rights reserved"로 분리 — [joplin LICENSE](https://github.com/laurent22/joplin/blob/dev/LICENSE) (오픈소스여도 브랜드 자산은 따로 묶을 수 있다는 선례)

### Inferences
- 구매자 전용 테마에 OFL 글꼴을 넣는 것은 가능하나, 「글꼴만 들어 있는 유료 팩」처럼 보이면 안 된다 — 테마(색·레이아웃) 가치가 주이고 글꼴은 부속이어야 한다.
- 다른 에디터의 유명 테마(Dracula, Nord, Catppuccin, Solarized 등)를 구매자 전용으로 옮길 때는 각 테마의 라이선스(대부분 MIT)를 확인해야 한다 — Bear가 Pro 테마로 Dracula·Nord·Catppuccin 등을 제공한다는 점은 이런 테마의 유료 번들이 흔하다는 정황 — [Bear 검색 요약](https://blog.bear.app/2020/02/bear-101-pro-is-closing-in-on-20-themes/).

### Gaps
- D2Coding의 Reserved Font Name 선언 여부는 이번에 확인하지 않았다(번들 수정 시 확인 필요).
- 인기 테마 팔레트(Dracula·Nord 등) 개별 라이선스는 확인하지 않았다.
