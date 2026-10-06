# Frond는 Store add-on 하나로 0원 수익화를 연다

초기 비용 0원으로 수익화할 수 있다. Frond를 Microsoft Store에 **무료 앱(MSIX) + Durable add-on 하나(Product lifetime = Forever)**로 올리면 개발자 등록, MSIX 서명, add-on 등록·인증, 세금·지급 프로필, 사업자등록 신청까지 모두 돈이 들지 않는다. 돈은 판매가 일어날 때만 나간다. Microsoft가 **Net Receipts의 15%**를 떼고, 한국 고객분 부가세는 Microsoft가 직접 징수·납부한다. 그래서 ₩9,900에 팔면 개발자 몫은 약 ₩7,650(표시가의 77%)이다. 자체 라이선스 키(MoR, 결제 대행사가 판매자 역할을 맡는 방식)는 수수료가 4~10%대로 더 싸다. 대신 키 검증 코드, 구매 페이지, 정산 서류를 직접 챙겨야 한다. 그래서 Store가 주 배포처라면 add-on을 먼저 붙이고, MoR은 Store 밖(NSIS·winget) 판매 수요가 확인된 뒤에 더한다. 상품 경계는 이렇게 긋는다. 편집·보기·저장, 내장 다크 테마, 추천 테마는 무료로 둔다. **사용자 테마 가져오기·복제와 구매자 전용 테마**만 판다. 가격은 직접 경쟁작 Typora($14.99)보다 낮은 ₩9,900~12,900대가 선례에 맞는다. 0원을 깨뜨리는 것은 돈이 아니라 규칙 충돌이다. 반복 판매를 시작하면 한국 부가세법은 20일 안에 사업자등록을 요구한다. Store 정책 10.14는 "업으로 하는 사람"에게 회사 계정을 요구하는데, 개인 계정을 회사 계정으로 바꿀 수는 없다. 또 README와 Cargo.toml에 MIT라고 적힌 공개 저장소라서 해금은 명예 제도 이상이 될 수 없다. 구매자 전용 테마를 비공개로 묶으면 SignPath 무료 서명 자격도 깨진다. 코드 쪽 일은 Rust 권리 판정 모듈 하나와 `effectiveTheme()` 게이트로 모인다. 다만 지금은 추천 테마와 가져온 테마가 같은 폴더에 저장되므로, 이 둘을 먼저 갈라야 한다.

## 0원으로 수익화가 가능한가: 입장료는 0원이고 판매 때만 수수료가 나간다

답은 "가능하다"이다. 계정 등록은 **개인이 2025-09-10부터, 회사가 2026-05-07부터 무료**다([Windows Developer Blog 2025-09-10](https://blogs.windows.com/windowsdeveloper/2025/09/10/free-developer-registration-for-individual-developers-on-microsoft-store/); [Windows Developer Blog 2026-05-07](https://blogs.windows.com/windowsdeveloper/2026/05/07/publish-to-microsoft-store-as-a-company-now-with-free-registration-and-faster-onboarding/)). MSIX는 Store가 인증 뒤 다시 서명해 주므로 서명비가 0원이다([Learn: choose a distribution path](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/choose-distribution-path)). Store 커머스(add-on)는 MSIX 앱에서만 쓸 수 있다. MSIX 경로 자체의 비용 구조와 코드 영향은 [앞선 보고서](Frond%20윈도우%20앱%20배포%20방법.md)에서 다뤘으므로 여기서는 수익화에 새로 붙는 항목만 정리한다.

| 구분 | 항목 | 비용 | 근거 |
|---|---|---|---|
| **0원** | Store 개인·회사 계정 등록 | 무료(회사는 D-U-N-S 또는 사업 서류, 회사 도메인 업무 이메일 필요) | [Learn: open a developer account](https://learn.microsoft.com/en-us/windows/apps/publish/partner-center/open-a-developer-account) |
| **0원** | MSIX 서명 | Store가 재서명 | [Learn: choose a distribution path](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/choose-distribution-path) |
| **0원** | Durable add-on 생성·인증(대개 약 1시간) | 무료 | [Learn: create an add-on submission](https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/add-on/create-app-submission) |
| **0원** | 세금(W-8BEN)·지급 프로필, ITIN 불필요 | 무료 | [Learn: payout and tax profiles](https://learn.microsoft.com/en-us/partner-center/account-settings/set-up-your-payout-account) |
| **0원** | 해금 시험용 프로모션 코드 | 무료(그만큼 매출 포기) | [ADA v8.11 3(j)](https://go.microsoft.com/fwlink/?linkid=528905) |
| **0원** | MoR 가입(Paddle·Polar·Creem·Gumroad·Lemon Squeezy) | 월·설정 비용 없음 | [Paddle Pricing](https://www.paddle.com/pricing); [Creem Pricing](https://www.creem.io/pricing) |
| **0원** | 라이선스 판정(Store 라이선스 또는 앱 내장 공개키로 오프라인 Ed25519 검증) | 서버 불필요 | [Learn: in-app purchases and trials](https://learn.microsoft.com/en-us/windows/uwp/monetize/in-app-purchases-and-trials); [docs.rs ed25519-dalek](https://docs.rs/ed25519-dalek/latest/ed25519_dalek/) |
| **0원** | 사업자등록 신청 | 수수료 없음(일반 상식, 이 조사에서 출처 미확인) | — |
| 판매 때만 | Store Fee | 비게임 앱 **Net Receipts의 15%**, 기프트카드·통신사 결제 건은 +10% | [ADA v8.11 6(b), 1(h)](https://go.microsoft.com/fwlink/?linkid=528905) |
| 판매 때만 | MoR 수수료 | Creem 3.9%+$0.40 ~ Gumroad 10%+$0.50, Polar·Lemon Squeezy는 비미국 카드 +1.5% | [Creem](https://www.creem.io/pricing); [Gumroad](https://gumroad.com/pricing); [Polar Fees](https://polar.sh/docs/merchant-of-record/fees); [Lemon Squeezy Fees](https://docs.lemonsqueezy.com/help/getting-started/fees) |
| 판매 때만 | MoR 정산 수수료 | Creem 최소 7 USD/EUR 또는 1%, Polar 월 $2+회당 0.25%+$0.25, Lemon Squeezy 1% | [Creem countries](https://docs.creem.io/merchant-of-record/supported-countries); [Polar Fees](https://polar.sh/docs/merchant-of-record/fees) |
| 판매 때만 | 미국 원천징수 | 미국 판매분만. 조약을 청구하지 않으면 30% | [Learn: payout and tax profiles](https://learn.microsoft.com/en-us/partner-center/account-settings/set-up-your-payout-account) |
| 조건부·나중 | 세무사 기장·신고 대행 | 선택. 간편장부로 직접 신고하는 사례 있음(비용은 미확인) | [a-ha Q&A](https://www.a-ha.io/questions/4ec3535874b550b4a509028344658dc5) |
| 조건부·나중 | Store 밖(NSIS·winget) 코드 서명 | OSI 라이선스면 SignPath 0원, Certum OSS €49(상업 배포에 쓰면 폐지), SSL.com IV $129+ | [SignPath Terms](https://signpath.org/terms); [Certum](https://support.certum.eu/en/code-signing-required-documents/) |
| 조건부·나중 | 회사 계정이 요구될 때 회사 도메인 이메일 | 도메인 유지비(Gmail 불가) | [Learn: open a developer account](https://learn.microsoft.com/en-us/windows/apps/publish/partner-center/open-a-developer-account) |
| 조건부·나중 | 통신판매업 신고(자체 웹 결제를 열 때) | 등록면허세 연 12,000~40,500원 | [swing2app 문서](https://documentation.swing2app.co.kr/knowledgebase/playstore/manage/ecommerce-business) (2차) |
| 조건부·나중 | 사업자 미등록가산세 | 공급가액의 1% | [thecheck](https://thecheck.co.kr/business-registration-twenty-days/) (2차) |
| 조건부·나중 | 라이선스 서버(Keygen 등) | Dev 요금제 무료(활성 사용자 100명), 그 이상 유료 | [Keygen Pricing](https://keygen.sh/pricing/) |

0원이 성립하는 조건은 네 가지다. 첫째, **Store add-on만 판다.** Store 밖에서 팔지 않으면 유료 서명도, 키 서버도 필요 없다. 둘째, **계정 유형 문제를 비용 없이 푼다.** 개인 계정을 유지하거나, 회사 계정에 쓸 도메인 이메일이 이미 있어야 한다. 셋째, **세무 신고를 직접 한다.** 넷째, **지급 문턱을 기다릴 수 있다.** Store 지급은 월 단위이고 문턱은 USD 50이다. 한국은 은행 송금만 되고 PayPal은 안 된다([Learn: payout details by region](https://learn.microsoft.com/en-us/partner-center/marketplace-offers/payment-thresholds-methods-timeframes)). 판매가 적으면 첫 지급이 몇 달 미뤄진다. 돈이 아닌 위험도 있다. 환불·차지백 비용은 개발자가 부담한다([ADA v8.11 6(f)](https://go.microsoft.com/fwlink/?linkid=528905)). 2026-03에는 첫 유료 제출에서 세금·지급 정보를 추가하는 버튼이 보이지 않아 지원 티켓에 기대야 했던 사례가 있다([Microsoft Q&A 5835794](https://learn.microsoft.com/en-us/answers/questions/5835794/unable-to-add-tax-and-payout-information-to-publis)). Store add-on은 시뮬레이터가 없어 **앱을 실제로 게시해야 시험할 수 있다**. 그래서 결제 흐름 실기에는 본인 소액 결제와 환불 요청이 한 번 필요할 수 있다.

## Store add-on이 먼저이고 MoR 키는 Store 밖 수요가 생기면 붙인다

"영원히 무료 + 선택적 1회 해금"에 맞는 Partner Center 모델은 **Pricing=Free, 체험 없음, Durable add-on 하나**다. Durable은 "typically purchased only once … often unlock additional functionality"인 상품이고, 기본 수명이 Forever라 한 번 사면 끝난다([Learn: create an add-on submission](https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/add-on/create-app-submission)). 다른 모델은 맞지 않는다. 유료 앱 + Unlimited trial은 Store 목록에 가격이 붙는 "유료 앱"이 되고, 정책 10.8.4의 체험 조건 고지 부담이 생긴다. Time-limited trial은 기간이 끝나면 앱이 아예 실행되지 않는다([Learn: implement a trial version](https://learn.microsoft.com/en-us/windows/uwp/monetize/implement-a-trial-version-of-your-app)). Consumable·subscription은 반복 결제용이다. Product ID는 게시 후 바꾸거나 지울 수 없고 코드에서 `InAppOfferToken`으로 쓰이므로, 처음부터 `frond_supporter` 같은 영구 이름으로 정한다. 가격은 USD 0.99부터 시작하는 price tier를 고르면 60개 넘는 통화로 환산된다. 한국 시장 하나만 **KRW 자유 입력 가격**으로 덮어쓸 수 있고, 이 가격은 환율이 바뀌어도 조정되지 않는다([Learn: set app pricing](https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msix/schedule-pricing-changes)). NanaZip은 같은 구조(Store 무료 앱 + $99.99 Durable "Sponsor Edition" add-on)로 Win32 MSIX 앱이 인증을 통과해 운영 중이라는 것을 보여 준다([M2Team/NanaZip SponsorEdition.md](https://github.com/M2Team/NanaZip/blob/main/Documents/SponsorEdition.md)).

Store 쪽 돈의 흐름은 단순하다. App Developer Agreement v8.11(2026-04-17 발효)에서 Microsoft는 개발자의 **agent/commissionaire**로서 결제·환불·차지백을 처리하고, 비게임 앱과 그 in-app 상품에서 15%를 뗀다([ADA v8.11 4(a), 6(b)](https://go.microsoft.com/fwlink/?linkid=528905)). **한국은 Microsoft-managed 국가**라 한국 고객분 부가세를 Microsoft가 계산·징수·납부하고, 청구서도 "Microsoft's applicable registration number"로 발행한다([Learn: Tax Responsibilities](https://learn.microsoft.com/en-us/partner-center/marketplace-offers/tax-details-marketplace)). 한국 B2C 디지털 서비스 부가세율 10%를 적용하면([vatcalc](https://www.vatcalc.com/south-korea/south-korea-vat-on-non-resident-digital-services/)), ₩9,900 판매 1건의 흐름은 이렇다. 부가세를 뺀 Net Receipts가 약 ₩9,000이고, 15%를 떼면 개발자 몫은 **약 ₩7,650**이다. 미국 밖 판매에는 미국 원천징수가 없다. 유료 add-on을 팔려면 Partner Center에 W-8BEN과 은행 계좌를 먼저 등록해야 한다([Learn: payout and tax profiles](https://learn.microsoft.com/en-us/partner-center/account-settings/set-up-your-payout-account)).

MoR 쪽은 2026년 들어 한국 개인에게 선택지가 좁아졌다. Stripe가 Lemon Squeezy를 인수해 만든 **Stripe Managed Payments는 한국 소재 사업자를 받지 않는다**([Stripe Docs: eligibility](https://docs.stripe.com/payments/managed-payments/eligibility)). Lemon Squeezy는 2026-01 공지에서 사용자를 Managed Payments로 옮기는 것이 목표라고 밝혔다([Lemon Squeezy 2026 Update](https://www.lemonsqueezy.com/blog/2026-update)). 두 사실을 합치면, 지금 Lemon Squeezy로 시작하는 것은 나중에 이전이나 지원 축소를 떠안는 선택이다. Paddle은 한국 판매자를 받지만 Paddle Billing에는 라이선스 키 생성 기능이 없다([Eternal Storms 2024-12](https://blog.eternalstorms.at/2024/12/18/selling-outside-of-the-mac-app-store-part-ii-lets-meddle-with-paddle/)). 키 기능이 내장되어 있고 한국 은행으로 정산하는 곳은 Polar, Creem, Gumroad다([Polar License keys](https://polar.sh/docs/features/benefits/license-keys); [Creem countries](https://docs.creem.io/merchant-of-record/supported-countries); [Gumroad Pricing](https://gumroad.com/pricing)). $10 1회 구매 기준 수수료는 Creem이 약 $0.79로 가장 싸고, Polar Starter(비미국 카드)가 $1.15, Gumroad가 $1.50이다. 다만 Creem의 정산 수수료 최소 7 USD/EUR는 소량 판매에서 비율이 커진다. Store 15%와의 차이는 건당 몇백 원이라, 판매량이 작으면 연간 차액도 작다. 그래서 실제 선택 기준은 수수료가 아니라 운영 부담과 세무 서류가 된다.

정책은 둘 다 허용한다. Store Policies v7.20(2026-10-22 발효) 10.8.1은 "Non-game products made available on PC devices may either use a secure third-party purchase API or the Microsoft Store in-product purchase API"라고 명시하고, ADA 5(e)는 제3자 커머스 거래에 Store Fee를 매기지 않는다([Store Policies v7.20](https://learn.microsoft.com/en-us/windows/apps/publish/store-policies); [ADA v8.11](https://go.microsoft.com/fwlink/?linkid=528905)). 그런데 10.8.2에는 "기부의 대가로 추가 기능 같은 디지털 혜택을 주면 Microsoft Store IAP를 써야 한다"는 문장이 있다. 구매자 혜택이 있는 "후원" 상품을 제3자 결제로 팔면 이 두 조항이 서로 다르게 읽힌다. **Store add-on은 어느 쪽으로 읽어도 문제가 없는 유일한 길**이다. 이 점이 수수료 차이보다 무겁다.

| 항목 | Store add-on (Durable) | 자체 라이선스 키 (MoR) | 둘 다 (Store판은 add-on, NSIS판은 키) |
|---|---|---|---|
| 수수료 | Net Receipts의 15%(+기프트카드 10%) | 3.9%+$0.40 ~ 10%+$0.50, 정산 수수료 별도 | 채널별로 다름 |
| 해외 VAT·판매세 | Microsoft가 징수(한국 포함 Microsoft-managed 국가) | MoR이 징수 | 둘 다 위임 |
| 한국 부가세 서류 | 국내분·국외분 구분과 Microsoft 징수분 처리가 쟁점 [세무사 확인] | 외국법인 공급 영세율 후보. 외국환은행 원화 수령 요건 | 두 구조를 모두 신고 |
| 정산 | 월 1회, USD 50 문턱, 한국은 은행 송금만 | Creem 매월 1·15일, Gumroad 매주 금요일($10 이상), Polar는 Stripe 경유 | 두 곳 |
| 적용 채널 | Store MSIX판만(패키지 identity 필수) | 모든 채널 | 전부 |
| 구현 | `windows` 크레이트 StoreContext API 5개 남짓, HWND 연결, UI 스레드 | 키 입력 UI. Rust HTTP(CSP가 프런트 외부 요청을 막음) 또는 오프라인 서명 검증, 구매 페이지 | 공급자 추상화 필요 |
| 오프라인 | 캐시된 라이선스를 돌려줌 | 서명 파일이면 무관, 온라인 활성화면 첫 1회 필요 | — |
| 정책 요건 | 10.8.4 고지, ADA 5(e) | 10.8.2 제3자 요건(결제 제공자 표시·사용자 확인·PCI DSS·Partner Center 표기), "기부" 명칭 회피 | 병행을 허용·금지하는 문구 모두 없음 |
| Store 밖 구매자 | 확인 불가 | 확인 가능 | 확인 가능 |
| 초기 비용 | 0 | 0(MoR 내장 키를 쓰면 서버 없음) | 0 |
| 고유 위험 | 시험하려면 실제 게시 필요 | Lemon Squeezy 이전 위험, 운영 부담 | 복잡도 두 배 |

권장 순서는 **Store add-on 단독으로 시작**하는 것이다. NSIS·winget판에서는 Store 구매를 확인할 방법이 없다. Store 라이선스는 패키지 identity와 Store 계정에 묶여 있기 때문이다. 그래서 NSIS판에는 두 길만 있다. 하나는 해금 기능을 모두 열어 두는 길이다. Files·Krita·Paint.NET처럼 "Store에서 사는 것 = 후원"으로 두는 방식이고, 비용과 서버가 0이다([files.community](https://files.community/download); [Krita FAQ](https://docs.krita.org/en/KritaFAQ.html); [paint.net](https://www.paint.net/license.html)). 다른 하나는 나중에 MoR 키를 붙이는 길이다. MIT 공개 저장소에서는 어차피 누구나 게이트를 지운 빌드를 만들 수 있다. 그래서 첫 번째 길이 잃는 매출은 생각보다 작다.

## 편집과 다크 테마는 무료로 두고 사용자 테마와 전용 테마만 판다

사용자가 말한 "Fork 방식"을 정확히 보면 Frond 계획과 한 가지가 다르다. Fork는 $59.99 일회성, 기기 3대 라이선스이고, "free evaluation"을 사실상 무기한 허용하며 드물게 활성화 안내만 띄운다([fork.dev/buy](https://fork.dev/buy); [fork-dev/TrackerWin #2157](https://github.com/fork-dev/TrackerWin/issues/2157)). **구매 판과 미구매 판의 기능 차이가 없다.** 그래서 "무엇에 돈을 내는가"라는 질문이 실제로 나온다([TrackerWin #2390](https://github.com/fork-dev/TrackerWin/issues/2390)). Fork는 Microsoft Store에 없고 winget·Chocolatey로 배포된다([winstall: Fork.Fork](https://winstall.app/apps/Fork.Fork)). Frond는 여기에 실제 혜택(테마)을 붙이므로 Sublime Merge에 더 가깝다. Sublime Merge는 미등록 판에서 다크 테마를 막았는데, 2019년부터 2024년까지 "실제 작업 환경에서 써 볼 수 없다"는 불만이 이어졌다. 2022년 "다크 모드는 접근성 기능"이라는 이슈는 지금도 열려 있다([Sublime Forum 43720](https://forum.sublimetext.com/t/dark-theme-requires-license/43720); [sublime_merge #1409](https://github.com/sublimehq/sublime_merge/issues/1409)). 반대로 Bear는 다크 테마를 포함한 3종을 무료로 남기고 나머지 테마를 Pro로 묶어 이 불만을 피했다([Bear FAQ](https://bear.app/faq/about-free-and-pro-themes-in-bear/)). Raycast도 Custom Themes를 Pro 전용으로 둔다([Raycast Pricing](https://www.raycast.com/pricing)). Obsidian은 테마를 전부 무료로 두고, 후원 혜택을 조기 접근·배지 같은 비기능 요소로만 준다([Obsidian Pricing](https://obsidian.md/pricing)). 정리하면 이렇다. 외형을 유료 혜택으로 두는 것은 흔하고 반발도 기능 잠금보다 작다. 하지만 **다크 테마처럼 접근성과 엮인 외형은 잠그면 안 된다.**

| 앱 | 방식 | 가격(2026-10-06 확인) |
|---|---|---|
| Typora | 15일 체험 후 구매, 기기 3대 | $14.99 ([store.typora.io](https://store.typora.io/)) |
| Fork | 무기한 평가 + 드문 안내 | $59.99 ([fork.dev/buy](https://fork.dev/buy)) |
| Obsidian Catalyst | 앱 무료 + 후원 등급 | $25부터 ([Obsidian Pricing](https://obsidian.md/pricing)) |
| iA Writer (Windows) | 7일 체험 | $29.99 ([ia.net](https://ia.net/writer/pricing)) |
| Paint.NET Store판 | 웹판 무료, Store판 유료(차이는 자동 업데이트) | $9.99 ([Paint.NET Forum](https://forums.paint.net/topic/123351-free-app-costs-999/)) |
| Files Store판 | 사이드로드 무료, Store판 유료 | $12.99 (검색 요약, [files.community](https://files.community/blog/posts/preview-on-store)) |
| NanaZip Sponsor Edition | Store 무료 + Durable add-on, 버튼 문구만 다름 | $99.99 ([SponsorEdition.md](https://github.com/M2Team/NanaZip/blob/main/Documents/SponsorEdition.md)) |

Frond에서 유료가 되는 것은 편집기 전체가 아니라 꾸미기 기능뿐이다. 그래서 가격 기준점은 Typora $14.99의 절반에서 2/3 정도로 잡는다. 권장 범위는 **base tier USD 6.99~9.99, 한국 시장 자유 가격 ₩9,900~12,900**이다. Paint.NET·Files처럼 "Store에서 사서 응원하는" 앱들이 $10 안팎이라는 점도 이 범위를 뒷받침한다. 더 내고 싶은 사람을 위해 가격만 다른 Durable add-on을 두세 개 만들고, 그중 하나라도 있으면 해금하는 구성도 가능하다. 문서에 금지 조항은 없지만 이는 추론이다. KRW tier의 실제 환산값과 자유 가격의 최소·최대 범위는 Partner Center에 로그인해야 보인다.

| 기능 | 비구매자 | 구매자 | 근거·메모 |
|---|---|---|---|
| 보기·편집·저장·탭·분할·비교·HTML 내보내기·인쇄 | 사용 | 사용 | Store 10.1.2 "fully functional", 사용자 문서는 절대 막지 않음 |
| 내장 라이트·다크(세이지 차콜) | 사용 | 사용 | Sublime Merge 반발 회피, Bear 구조 |
| 추천 테마 23종(세피아·GitHub 2·웨딩 20) | 사용(권장) | 사용 | 지금은 가져온 테마와 같은 폴더에 저장됨 → 분리 필요 |
| 테마 가져오기·폴더 열기·복제(사용자 테마 만들기) | 버튼은 보이고, 누르면 구매 안내 | 사용 | `src/theme-panel.ts:79-83`, `:121-128` |
| 폴더에 이미 있는 사용자 테마 적용 | 같은 base의 내장 테마로 대신 보임, 설정값 보존 | 사용 | `src/main.ts:1706-1711` 대체 구조 재사용 |
| 테마 JSON 내보내기 | 결정 필요(D5) | 사용 | 내보내기가 열려 있으면 전용 테마가 파일로 퍼짐 |
| 구매자 전용 테마 묶음 | 색 칩·이름만 미리 보기 + 잠금 배지 | 사용 | 숨기지 않고 잠금으로 보이는 쪽이 발견성에 좋음 |
| (선택) 팔레트 5색으로 테마 만들기 UI | — | 사용 | `palette.ts`의 `paletteTheme` 재사용, 지금은 UI 없음 |

경계를 그을 때 가장 큰 걸림돌은 저장 구조다. 추천 테마를 "추가"하면 가져오기와 똑같은 `save_user_theme`로 `%APPDATA%\Frond\themes`에 복사된다(`src/theme-panel.ts:162-180`, `src/theme/recommended.ts:1-9`). 그리고 `ThemeDef`에는 출처나 잠금 필드가 없다(`src/theme/themes.ts:85-94`). 이대로 "폴더 테마 = 유료"로 막으면 무료여야 할 추천 테마까지 잠긴다. 구현 절의 카탈로그 분리가 먼저 필요한 이유다. 반대로 공개 사용자에 대한 소급 적용(grandfathering) 문제는 거의 없다. 0.1.0이 아직 공개 릴리스 전이라 "무료였던 사용자 테마를 거둬들인다"는 Evernote식 반발이 생길 일이 없고([TechCrunch 2016-06-28](https://techcrunch.com/2016/06/28/evernote-tweaks-features-in-free-plan-and-raises-prices-in-paid-ones/)), 개발자 본인 폴더의 테마 3개(sepia·wedding 2개)는 모두 추천 카탈로그 id다. 전용 테마는 기존 결정(색 토큰만 담는 JSON, `docs/decisions/ideas/20260930-theme-file-format.md`)을 그대로 따른다. 글꼴을 넣을 때는 OFL 규칙을 지킨다. D2Coding 같은 OFL 글꼴은 소프트웨어 번들로는 팔 수 있지만 **글꼴만 따로 팔 수는 없으므로**([OFL FAQ](https://openfontlicense.org/ofl-faq/)), 전용 테마 묶음은 색 구성이 주된 가치여야 한다. Store 스크린샷에 전용 테마를 쓰면 "구매자 전용"이라고 표시해 10.1의 오도 금지 조항을 피한다.

## 구매 권유는 첫 주를 건너뛰고 2주에 한 번, 입력이 멈췄을 때만 띄운다

선례의 권유 방식은 세 가지다. Sublime Text는 **저장 약 30회마다** 띄운다([MakeUseOf 2026-05](https://www.makeuseof.com/winrar-made-the-endless-free-trial-famous-but-these-apps-did-better/)). WinRAR은 40일 뒤 **실행할 때마다** 띄운다([win-rar.com](https://www.win-rar.com/license-perpetual-subscription.html?L=0)). REAPER는 60일 동안 "full functionality, and no strings attached"를 준다([reaper.fm](https://www.reaper.fm/purchase.php)). 불만이 가장 많이 몰린 것은 Sublime의 "저장할 때 뜬다"는 점이다. 2016년과 2024년에 같은 불만이 반복됐다([Sublime Forum 5289](https://forum.sublimetext.com/t/this-is-an-unregistered-copy-message/5289); [Sublime Forum 72671](https://forum.sublimetext.com/t/purchase-nag-screen-in-a-non-commercial-version/72671)). 같은 스레드에는 "짜증 나지 않으면 등록할 사람이 거의 없다"는 반론도 있다. 하지만 Frond는 기능 혜택이 따로 있으므로 권유를 세게 할 필요가 없다. 공개된 전환율 수치는 어느 선례에서도 찾지 못했다. 빈도 상한의 기준으로 삼을 만한 것은 Apple StoreKit이 리뷰 요청을 365일에 3회로 강제하는 규칙 정도다([Apple: RequestReviewAction](https://developer.apple.com/documentation/storekit/requestreviewaction)). Store Policies v7.20에는 권유 빈도를 다루는 조항이 없다. Microsoft 체험판 가이드는 오히려 "display regular messages asking the user to buy it"을 선택지로 든다([Learn: implement a trial version](https://learn.microsoft.com/en-us/windows/uwp/monetize/implement-a-trial-version-of-your-app)). 그래서 기준은 정책이 아니라 사용자 신뢰다.

| 규칙 | 제안값 | 근거 |
|---|---|---|
| 첫 실행 유예 | 첫 실행 뒤 7일, 실행 5회 전에는 띄우지 않음 | REAPER 60일·Typora 15일 체험, 10.1.1 "value proposition … clear during the first run" |
| 최소 간격 | 마지막 표시 뒤 14일. "나중에"를 누를 때마다 14→30→60일로 늘림 | Fork의 "rare", Apple 연 3회 상한 비유 |
| 트리거 | 앱 시작 3~10분 뒤 유휴 시점에 시도. 저장은 카운터만 올림 | Sublime 저장 시 권유에 대한 반복 불만 |
| 띄우지 않는 때 | 첫 실행, IME 조합 중, 마지막 입력 뒤 5~10초 안, 저장·인쇄·내보내기 진행 중, 다른 팝업이 열려 있을 때, 창에 포커스가 없을 때, 창을 닫을 때, 관리자 권한으로 실행 중일 때 | 아래 코드 위험, IAP는 elevated 미지원 |
| 형식 | 기본은 비모달 배너(`showBanner`). 모달(`showChoice`)은 세 번째 권유부터 | 단계적 강도. 비모달은 작업을 끊지 않음 |
| 버튼 | "구매하기(Microsoft Store 구매 창이 열립니다)", "이미 구매함(복원)", "나중에". Esc·바깥 클릭은 "나중에" | 10.8.4 "make it clear … initiating a purchase", 등록했는데 미등록 메시지가 뜨는 불만([Sublime Forum 25963](https://forum.sublimetext.com/t/your-copy-of-sublime-is-not-registered-message-even-though-ive-registered-it/25963)) |
| 하지 않는 것 | 닫기 카운트다운, Windows 토스트 알림, 설정 팝업의 "권유 끄기" 항목, 문서 열기·저장 제한 | REAPER 5초·Process Lasso 카운트다운은 압박용([Process Lasso 2009](https://processlasso.blogspot.com/2009/06/nag-screen-changes.html)), 10.9 알림 조항, 10.8.4 사용자 콘텐츠 조항 |
| 상시 진입점 | 설정 '정보' 탭, 문서 메뉴 "Frond 정보·후원…", (선택) 비구매자 상태바의 작은 버튼 | `#status-default` 패턴 재사용 |
| 저장 위치 | localStorage `mdeditor.supportNag = { firstSeenAt, launches, saves, lastShownAt, shownCount, snoozeLevel }` | `src/prefs.ts:1-25`, 잃어도 되는 상태 |

이 가드가 필요한 이유는 Frond 코드에 있다. `showChoice`는 **이미 열린 `#app-dialog`를 먼저 닫는다**(`src/dialog.ts:44`). 권유 모달이 아무 때나 뜨면 저장 충돌이나 인코딩 질문(`src/main.ts:1140-1185`)을 조용히 취소시켜 사용자 결정을 날릴 수 있다. 그래서 `document.querySelector("dialog[open]")` 검사는 선택이 아니라 필수다. 단축키 처리도 이미 같은 방식으로 팝업에 양보하고 있다(`src/main.ts:2072`, `:2084`). 한글 IME 조합 중에 포커스를 빼앗기면 음절이 확정되거나 사라질 수 있으므로 `editor.view.composing`(`src/main.ts:1076-1082`)도 확인한다. 지금 코드에는 유휴 감지와 첫 실행 표식이 둘 다 없다. 그래서 `onEditorChange`(`src/main.ts:900-930`)에서 `lastInputAt`을 기록하고, `firstSeenAt`이 없으면 첫 실행으로 보고 기록만 한다. 권유 주기는 사용자 설정이 아니므로 `SETTINGS`에 넣지 않고 `src/license.ts`의 상수로 둔다. 설정에 넣으면 "끄기"가 생겨 의미가 없어지고, "모두 기본값으로"(`src/settings.ts:252-254`)와도 엮인다.

## 정책 10.14와 MIT 표기가 돈보다 먼저 부딪힌다

### 계정 유형: 판매를 시작하는 순간 개인 계정의 전제가 흔들린다

정책 10.14는 "Company accounts must be used for organizations, businesses, and any person acting in relation to their trade or profession"이라고 쓴다. 게시자 이름이 사업체로 보여도 회사 계정이 필요하다([Store Policies v7.20](https://learn.microsoft.com/en-us/windows/apps/publish/store-policies)). 개인 계정의 대상은 "not in relation to their business, trade, or profession"인 개발자와 "Small scale creators producing content for non-commercial purposes"다. **개인 계정을 회사 계정으로 바꾸는 기능은 없다**([Learn: open a developer account](https://learn.microsoft.com/en-us/windows/apps/publish/partner-center/open-a-developer-account)). 개인 계정으로 유료 add-on을 내는 것을 직접 막는 문구는 없다. 세금·지급 프로필만 채우면 기술적으로는 제출할 수 있다. 하지만 "반복적 영리 판매"라는 같은 사실 하나가 세 가지를 동시에 끌어낸다. 한국 세법은 사업자등록을 요구하고(아래 세무 절), 전자상거래법은 통신판매업 신고 여부를 묻고, Store 정책은 회사 계정을 요구한다. 사업자등록증을 받은 사람이 개인 계정으로 판매하는 것은 10.14 문언과 맞지 않는다. 회사 계정 등록도 무료지만 Entra ID, D-U-N-S 번호나 사업 서류, **회사 도메인 업무 이메일(Gmail 불가)**이 필요하고 2~5영업일 수동 검토를 거친다. 개인 계정에 올린 앱을 회사 계정으로 옮길 수 있는지는 확인하지 못했다. 결론은 이렇다. 수익화를 Store 첫 공개와 함께 할 계획이면 사업자등록 → 회사 계정 순서로 시작하는 것이 문언에 맞다. 무료로 먼저 내고 반응을 볼 계획이어도, 이 결정만은 첫 공개 전으로 당겨야 한다. 10.8.3("individual accounts cannot require financial information for primary functionality")은 핵심 기능이 무료라 해당하지 않는다.

같은 정책에서 지켜야 할 것은 세 가지다. 첫째, 목록과 앱에 **in-app 구매의 종류와 가격 범위**를 밝힌다. 둘째, 사용자가 구매를 시작한다는 것을 분명히 한다(10.8.4). 셋째, 설명문에 in-app 구매가 있다는 사실을 눈에 띄게 적는다([ADA v8.11 5(e)](https://go.microsoft.com/fwlink/?linkid=528905)). 가격 모델 선언은 심사 대상이다. 2026-04에는 무료 앱인데 외부 주문이 있는 앱이 "incorrect pricing model"로 반려된 사례가 있다([Microsoft Q&A 5854066](https://learn.microsoft.com/en-us/answers/questions/5854066/pricing-model-for-microsoft-store-app)). 그래서 설명 첫머리 가까이에 "모든 편집 기능 무료, 선택적 1회 구매(₩x,xxx)로 사용자 테마·전용 테마 해금"이라고 적는다. 첫 제출을 Public audience로 내면 나중에 Private audience로 되돌릴 수 없다([Learn: visibility options](https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/add-on/visibility-options)). 따라서 수익화 시험 전에 첫 제출 설정을 정한다.

### 소스 라이선스: 공개 MIT 저장소에서 파는 것은 접근이 아니라 편의다

현재 상태는 어정쩡하다. `README.md:289-291`와 `Cargo.toml`의 `license = "MIT"`는 MIT라고 적지만 LICENSE 파일은 없고, GitHub도 라이선스를 감지하지 못한다. 저장소는 공개 상태다. GitHub 문서는 라이선스가 없으면 기본 저작권법이 적용되어 복제·배포·2차 저작이 금지된다고 설명한다([GitHub Docs: Licensing a repository](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository)). 하지만 README가 MIT를 명시하고 있으므로 "모든 권리 보유"로 단정하기도 어렵다. 이미 받아 간 사람이 그 버전을 MIT로 주장할 여지도 있다. 이 부분은 추론이며 법률 확인이 필요하다. 어느 쪽이든, 소스가 보이는 이상 해금 검사는 지울 수 있다. 라이선스를 닫아도 우회는 생긴다. Typora 체험 리셋 스크립트가 그 예다([TyporaIO-Infinite-Trial](https://github.com/Stupeflip/TyporaIO-Infinite-Trial)). 라이선스를 닫으면 포크가 갈라져 나간다는 것도 선례로 확인된다. Aseprite는 GPL을 닫자 마지막 GPL판에서 LibreSprite가 갈라졌다([Wikipedia: LibreSprite](https://en.wikipedia.org/wiki/LibreSprite)).

무료 서명 자격은 이 결정에 직접 걸린다. SignPath Foundation은 "OSI-approved Open Source license without commercial dual-licensing for all components"와 "may not contain any proprietary, non open-source component"를 요구한다([SignPath Terms](https://signpath.org/terms)). Certum Open Source 인증서는 "software distributed commercially"에 쓰면 폐지된다([Certum 필요 서류](https://support.certum.eu/en/code-signing-required-documents/)). 반면 Microsoft는 2022년에 넣었던 "오픈소스로 돈 벌기 금지" 문구를 반발 끝에 철회했다([TechCrunch 2022-07-19](https://techcrunch.com/2022/07/19/microsoft-u-turns-on-policy-that-wouldve-banned-commercial-open-source-apps/)). 그래서 OSI 앱을 Store에서 파는 것 자체는 막히지 않는다.

| 선택지 | 해금 판매 | SignPath 무료 서명 | Certum OSS | 포크·우회 | 선례 |
|---|---|---|---|---|---|
| **MIT 확정(LICENSE 추가), 전용 테마도 저장소에 공개** | 가능(명예 제도) | 자격 유지 가능성 있음(IAP 코드 포함 여부는 문의 필요) | 상업 배포에 쓰면 폐지 위험 | 쉬움 | Krita·Files·Stretchly([Stretchly sponsor](https://hovancik.net/stretchly/sponsor/)) |
| Proprietary(EULA, All rights reserved) | 충돌 없음 | 불가 | 불가 | 소스가 공개되어 있으면 여전히 쉬움 | Paint.NET·Aseprite |
| 오픈 코어(비공개 전용 테마·해금 모듈) | 가능 | 불가("No proprietary code") | 불가 | 본체는 쉬움, 빌드 두 벌 | — |
| 소스 공개형(PolyForm·FSL) | 가능 | 불가(비OSI) | 불확실 | 재배포를 법으로 막음 | [PolyForm](https://github.com/polyformproject/polyform-licenses), [FSL](https://fsl.software/) |

Store가 주 배포처이고 Store가 MSIX에 서명해 주므로, 무료 서명 자격이 필요한 곳은 NSIS·winget판뿐이다. 그 NSIS판을 "해금 전부 열림"으로 두면 상업 배포라는 성격도 약해진다. 그래서 권장은 **MIT를 LICENSE 파일로 확정하고, 전용 테마도 저장소에 공개하는 것**이다. 판매하는 것은 비밀 콘텐츠가 아니라 "앱 안에서 편하게 받고 쓰는 권리와 응원"이다. 복제판을 막을 지렛대는 코드가 아니라 이름과 아이콘에 둔다. Joplin은 코드는 AGPL로 공개하지만 로고·아이콘은 "all rights reserved"로 따로 묶었다([joplin LICENSE](https://github.com/laurent22/joplin/blob/dev/LICENSE)). Frond도 브랜드 자산을 따로 두면, 이름을 바꾸지 않은 복제판을 Store 11.2 지식재산 신고 경로로 다룰 근거가 생긴다. 이것은 추론이며 법률 확인이 필요하다. 마지막으로 계획 문서가 걸린다. `docs/plan.md:147`과 `docs/roadmap.md:127`은 "MSI/MSIX 패키징"을 "하지 않는 것"에 적어 두었으므로, Store 판매를 하려면 `docs/decisions/ideas/`에 판정을 새로 남겨 이 결정을 고쳐야 한다. 같은 목록의 "임의 CSS 테마 가져오기"는 임의 CSS를 뜻하고 색 토큰 테마(S-4)와는 별개다. 그래서 전용 테마를 토큰 형식으로만 유지하면 이 항목과는 충돌하지 않는다.

## 한국 세무는 첫 판매 20일 안 사업자등록에서 시작한다

부가가치세법 제8조는 **사업 개시일부터 20일 이내** 사업자등록을 요구하고, 늦으면 공급가액의 1%가 미등록가산세로 붙는다([law.go.kr 부가가치세법 제8조](https://www.law.go.kr/LSW/lsLawLinkInfo.do?ancYnChk=&chrClsCd=010202&lsJoLnkSeq=1011773243); [thecheck](https://thecheck.co.kr/business-registration-twenty-days/)). "정산받기 전까지는 등록이 필요 없다"는 커뮤니티 글([Threads](https://www.threads.com/@dalgom.bami/post/DLdD8nCy6vq))은 이 문언과 어긋난다. 그래서 첫 유료 판매를 시작하는 날을 사업 개시일로 보고 그 전후로 등록하는 것이 안전하다. 가장 까다로운 것은 Store 경로의 한국 고객분 부가세다. 읽는 방법이 셋이고 서로 결론이 다르다. 첫째, 국세청 해석 부가가치세과-171(2013)은 앱마켓이 대리인 구조라고 보고 **국외 소비자분은 영세율, 국내 소비자분은 개발자가 수수료를 빼기 전 총액으로 10% 과세**라고 했다([ulex: 부가가치세과-171](https://ulex.co.kr/tax/%EB%B6%80%EA%B0%80%EA%B0%80%EC%B9%98%EC%84%B8%EA%B3%BC171-178189?sub_select_type=)). 둘째, 2019년 기획재정부 해석은 국내 개발자가 사업자등록을 했으면 국외 오픈마켓은 그 매출의 간편사업자 신고 대상이 아니라고 했다([lawmeca](https://www.lawmeca.com/66617-%EC%95%B1%EC%8A%A4%ED%86%A0%EC%96%B4%EB%82%98-%EA%B5%AC%EA%B8%80%ED%94%8C%EB%A0%88%EC%9D%B4-%EC%95%B1-%EA%B0%9C%EB%B0%9C%EC%9E%90%EA%B0%80-%EC%82%AC%EC%97%85%EC%9E%90%EB%93%B1%EB%A1%9D%EC%9D%84-%ED%95%98%EC%A7%80%EC%95%8A/), 2차). 셋째, Microsoft는 한국을 Microsoft-managed 국가로 지정해 한국분 VAT를 직접 징수·납부하면서도, 그것이 개발자의 의무를 완전히 충족한다고 보증하지 않는다("makes no warranties", [Learn: Tax Responsibilities](https://learn.microsoft.com/en-us/partner-center/marketplace-offers/tax-details-marketplace)). 여기에 ADA 6(e)는 판매가 Microsoft에 대한 공급으로 간주되는 나라에서는 그 공급을 "exclusive of VAT"로 본다고 쓴다([ADA v8.10 PDF](https://cdn-dynmedia-1.microsoft.com/is/content/microsoftcorp/microsoft/store/documents/legal/ada/fy26/MS.Store.ADAv8.10.EN.US.pdf)). 이 문장은 외국법인에 공급한 것으로 보고 전체를 영세율로 처리하는 넷째 해석의 근거가 될 수도 있다. 등록한 개발자가 한국 매출을 다시 10%로 신고하면 Microsoft가 이미 낸 세금과 겹칠 수 있다. 그래서 이 항목이 세무사 질문 1순위다.

| 항목 | 내용 | 근거 | 확인 |
|---|---|---|---|
| 사업자등록 시점 | 첫 유료 판매(사업 개시일) 20일 안. 개시 전 신청도 가능 | [부가세법 제8조](https://www.law.go.kr/LSW/lsLawLinkInfo.do?ancYnChk=&chrClsCd=010202&lsJoLnkSeq=1011773243) | [세무사 확인] 개시일 판단 |
| 업종코드 | 722000 응용 소프트웨어 개발 및 공급업(정보통신업) | [indicode 722000](https://indicode.kr/explanation/business/2025/722000); [택스워치 2024-07-19](https://www.taxwatch.co.kr/article/tax/2024/07/19/0002) | 전자상거래 소매(525101)와 비교 |
| 간이 vs 일반과세 | 간이 기준 연 1억 400만원 미만(2024-07-01부터), 4,800만원 미만은 부가세 납부 면제. 간이도 영세율 적용 가능하나 매입세액 환급은 불가 | [정책브리핑](https://www.korea.kr/news/policyNewsView.do?newsId=148930428); [택스가이드](https://taxguide.im/blog/vat-zero-rated-guide) | [세무사 확인] "SW 업종은 간이를 잘 안 받아 준다"는 상담 답변([찾아줘세무사](https://www.findsemusa.com/service/consult/consultView.do?qidx=32664)) |
| Store 경로 부가세 | 국외분 영세율, 국내분 처리가 쟁점(위 네 가지 해석). 매출은 수수료를 빼기 전 총액, 공급시기는 정산일 | [부가가치세과-171](https://ulex.co.kr/tax/%EB%B6%80%EA%B0%80%EA%B0%80%EC%B9%98%EC%84%B8%EA%B3%BC171-178189?sub_select_type=); [택스워치 2022](https://www.taxwatch.co.kr/article/tax/2022/05/16/0002) | **[세무사 확인] 1순위** |
| MoR 경로 부가세 | 외국법인(MoR)에 공급한 것으로 보아 시행령 제33조②1호 영세율 후보. **대금을 외국환은행에서 원화로** 받아야 하고, PayPal 입금은 영세율이 안 된다는 해석이 있음 | [watax.kr](https://www.watax.kr/income-tax/adsense-platform-foreign-income-tax-zero-rate-guide); [브런치 cppartners](https://brunch.co.kr/@cppartners/43) | [세무사 확인] Payoneer 경유 시 |
| 영세율 서류 | 외화획득명세서, 플랫폼 정산 내역, 외화 입금·환전 내역, 약관. 국가별 판매 기록 보관 | [크리에이티브파트너스](https://blog.creativepartners.co.kr/69dc8cae-465b-4d87-ac37-121160d5d978); [watax.kr](https://www.watax.kr/income-tax/adsense-platform-foreign-income-tax-zero-rate-guide) | Partner Center 보고서에 국가·세금 열이 있는지 |
| 환율 기준 | 2013 해석은 정산일 기준환율, watax는 입금일 기준 | 위 두 출처 | [세무사 확인] |
| 종합소득세 | 반복 판매 대금은 사업소득. 다음 해 5월에 근로소득과 합산 신고. 해외 플랫폼은 한국 세금을 원천징수하지 않음 | [watax.kr](https://www.watax.kr/income-tax/adsense-platform-foreign-income-tax-zero-rate-guide) | "앱마켓이 3.3%를 뗀다"는 블로그 주장은 다른 근거 없음 |
| 경비율 | 722000 단순경비율 75.2%(2025 귀속, 수입 3,600만원 미만) | [upjong.co.kr](https://upjong.co.kr/business-code/upjong-722000/) (2차) | [세무사 확인] 국세청 원표 |
| 직장인 겸업 | 사업자등록이 회사에 자동 통보되지는 않음. 보수 외 소득이 연 2,000만원을 넘으면 건강보험 소득월액보험료 | [rushmac](https://rushmac.com/employee-side-business-registration/) (2차); [makewiselife](https://makewiselife.com/%EC%A7%81%EC%9E%A5%EC%9D%B8-%EC%82%AC%EC%97%85%EC%9E%90%EB%93%B1%EB%A1%9D-%EA%B2%B8%EC%97%85/) (2차) | 회사 겸업 규정은 별개 |
| 통신판매업 | 면제 기준은 직전 연도 50회 미만이거나 간이과세자(2020 고시). Microsoft가 신고번호를 요구한다는 자료는 없음. 자체 웹 결제를 열면 신고 검토 | [뉴시스 2020-05-21](https://www.newsis.com/view/NISX20200521_0001032006) | [세무사·구청 확인] |
| 미국 원천징수 | W-8BEN 필수, 미국 판매분만 기본 30%. Part II로 한·미 조약 제14조 청구(사용료 15%, 문학·예술 저작물 저작권 10%). 소프트웨어가 어느 쪽인지 조문에 없음 | [Learn: payout and tax profiles](https://learn.microsoft.com/en-us/partner-center/account-settings/set-up-your-payout-account); [IRS: US–Korea treaty](https://www.irs.gov/pub/irs-trty/korea.pdf) | [세무사 확인] 10/15%와 외국납부세액공제 |
| 외화 수령 | Store는 은행 송금 7~10영업일, USD 50 문턱, 환율은 지급 보고서에 표시 | [Learn: payout details by region](https://learn.microsoft.com/en-us/partner-center/marketplace-offers/payment-thresholds-methods-timeframes) | KRW 지급 통화 선택 가능 여부, 수취 수수료 |
| 창업 감면 | 정보통신업 등록 시 창업중소기업 세액감면 등 혜택 언급 | [택스워치 2024-07-19](https://www.taxwatch.co.kr/article/tax/2024/07/19/0002) | [세무사 확인] 직장인 부업 창업이 대상인지 |

세무 서류만 놓고 보면 구조가 갈린다. MoR + 국내 외국환은행 직접 정산은 "전액 외국법인 공급, 영세율" 한 줄로 끝날 수 있다. 반면 Store 경로는 국내·국외 구분과 Microsoft 징수분 처리라는 쟁점을 안는다. 이 차이 때문에 Store add-on을 권장하는 판단 자체가 바뀌지는 않는다. 다만 세무사 상담 한 번으로 정리될 쟁점이므로 첫 판매 전에 묻는다. 한국 개인이 Microsoft Store나 MoR로 판매한 세무 후기는 2023~2026년에도 거의 없다. 실무 글은 Google Play·App Store·애드센스 위주다. 그래서 위 표의 상당 부분은 앱마켓 해석을 유추한 것이다.

## 구현은 Rust 권리 판정 하나와 effectiveTheme 게이트로 모인다

설계 원칙은 세 가지다. 첫째, **권리(entitlement) 판정의 원본은 Rust**에 둔다. 프런트에는 커맨드로 상태만 넘긴다. 둘째, 판정은 공급자 순서로 시도한다. Store 공급자는 패키지 identity가 있을 때만 쓰고, 그다음 키 파일 공급자(MoR 도입 시), 마지막으로 개발용 공급자 순이다. 셋째, 테마 게이트는 **`listThemes()`가 아니라 `effectiveTheme()`에** 건다. 설정 모듈은 import 시점에 `load()`를 돌려 선택지에 없는 저장값을 기본값으로 정규화한다(`src/settings.ts:205-234`). 비구매자에게서 사용자 테마를 목록에서 빼 버리면, 비동기 라이선스 확인이 끝나기도 전에 저장된 테마 선택이 지워진다. `effectiveTheme()`은 이미 "못 찾은 테마를 같은 모드의 내장 테마로 보이되 설정값은 두는" 구조라서(`src/main.ts:1706-1711`) 그대로 재사용할 수 있다. 라이선스가 돌아오면 원래 테마가 자동으로 되살아난다. 패키지 판정 함수는 앞선 보고서의 MSIX 분기(updater 끄기, `assoc.rs` 3곳)와 같은 것을 공유한다.

| # | 파일:줄 | 변경 | 메모 |
|---|---|---|---|
| 0 | `docs/plan.md:147`, `docs/roadmap.md:127`, `docs/decisions/ideas/` | MSIX·Store 판매 도입 판정(system-crew `idea`)을 기록 | CLAUDE.md 상시 규칙 |
| 1 | `src-tauri/Cargo.toml:34`, 새 `[features]` | `windows` 기능에 `Services_Store`, `Foundation`, `Foundation_Collections`, 패키지 판정용 모듈(`Win32_Storage_Packaging_Appx`로 추정)을 추가. `[features] store = [...]` | 정확한 기능 이름은 빌드로 확인. `IInitializeWithWindow`는 이미 켜진 `Win32_UI_Shell`에 있음 |
| 2 | 새 `src-tauri/src/license.rs` | `is_packaged()`: `GetCurrentPackageFullName`이 `APPMODEL_ERROR_NO_PACKAGE`면 false. `Entitlement { tier: Free\|Supporter, source: Store\|KeyFile\|Dev\|None, channel: store\|direct, checked_at }`, `trait LicenseProvider` | 실패하면 안전한 기본값을 돌려주는 `elevation.rs:11-37` 패턴 |
| 3 | `license.rs` StoreProvider (`cfg(feature="store")`) | `StoreContext::GetDefault()` → 메인 창 HWND로 `IInitializeWithWindow::Initialize` → `GetAppLicenseAsync().await` → `AddOnLicenses`에서 `InAppOfferToken == "frond_supporter"` && `IsActive` → `OfflineLicensesChanged` 구독 후 프런트에 이벤트 | HWND를 연결하지 않으면 "inaccurate data or errors"([Learn](https://learn.microsoft.com/en-us/windows/uwp/monetize/in-app-purchases-and-trials)) |
| 4 | `license.rs` 구매 | `request_store_purchase`: `run_on_main_thread`에서 `RequestPurchaseAsync(storeId)` 시작, `.await`/`.when()`으로 대기(메인 스레드에서 `.join()` 금지), `Succeeded`/`AlreadyPurchased`면 라이선스를 다시 읽어 확정 | "must be called on the UI thread", elevated 미지원([Learn API](https://learn.microsoft.com/en-us/uwp/api/windows.services.store.storecontext.requestpurchaseasync)) |
| 5 | `src-tauri/src/lib.rs:197-227` | `get_entitlement`, `refresh_entitlement`, `request_store_purchase`, `app_version`(MoR을 쓰면 `activate_license`)을 `generate_handler!`에 등록 | 자체 커맨드라 capabilities 수정은 불필요할 것으로 추정 |
| 6 | 새 `src/license.ts` | 첫 화면용 캐시 `mdeditor.entitlement`(판정 근거 아님), `getEntitlement()`, `onEntitlementChange()`, 순수 함수 `canUseTheme`·`isCatalogTheme`·`canImport`·`shouldNag`, 권유 상수 | `src/prefs.ts:1-25` |
| 7 | `src/theme/recommended.ts:17-31`, `src/theme/themes.ts:251-281` | 추천 테마를 폴더 복사 없이 "카탈로그 테마"로 `listThemes()`에 직접 싣는다(내장 → 카탈로그 → 사용자 순). 전용 묶음 `{ id: "supporter" }`과 `exclusive?: true` 추가 | 최소 변경안은 카탈로그 id 집합 + `themeToJson` 내용 비교. 테마 폴더 이전(앞선 보고서 결정 ④)과 함께 하면 이주 작업이 한 번으로 끝남 |
| 8 | `src/main.ts:1706-1711`, `:1724-1748` | `effectiveTheme`을 순수 함수로 빼고, `canUseTheme`이 거짓이면 같은 base의 내장 테마로 대체(설정값 보존). 권리가 바뀌면 `applyEffectiveTheme()` 재호출 | 목록에서 빼지 않는 것이 핵심 |
| 9 | `src/theme-panel.ts:79-83`, `:121-128`, `:190`, `:232`, `:250` | 가져오기·폴더 열기·복제(·내보내기)를 게이트. 잠긴 버튼은 보이고, 누르면 `showChoice`로 구매 안내. 대체 중인 테마 항목에 "구매자 기능 — 지금은 내장 테마로 보입니다" 표시 | "다시 읽기"는 유지. 우회는 막지 못함(명예 제도) |
| 10 | `src/recommended-dialog.ts:49-90`, `:107-114` | 전용 테마는 칩·이름을 보이고 잠금 배지와 "구매…" 버튼 표시. "모두 추가" 개수에서 제외 | 배지 색은 `--accent`/`--on-accent`(`src/style.css:243-258`) |
| 11 | `src/settings.ts:10-18`, `src/settings-dialog.ts:189-220`, `.claude/skills/add-setting/SKILL.md:11-30` | `SETTING_CATEGORIES`에 `{ id: "about", label: "정보" }`를 추가하고, `license-panel.ts`(버전, 상태 "무료/구매자 — Store", 구매하기, 구매 복원, 관리자 실행 안내)를 `addPanel`로 붙임. 문서 메뉴 `src/main.ts:1937` 옆에 "Frond 정보·후원…" | `SETTINGS` 밖에 두어 "모두 기본값으로"의 영향을 받지 않게 함. 지금 앱 버전을 보여 주는 UI는 없음 |
| 12 | `src/main.ts:2303`, `:1133`, `:900-930` | `checkWebviewVersion()` 다음에 `scheduleSupportNag()`, 저장 성공 시 카운터만 증가, `onEditorChange`에서 `lastInputAt` 기록 | 가드는 권유 절의 표 |
| 13 | `src-tauri/tauri.conf.json:30-58`, 새 `tauri.store.conf.json` | Store 빌드 overlay(번들 대상, updater 제외), `tauri build --features store` | 앞선 보고서의 MSIX 5단계와 합침 |

Store API를 쓸 때 주의할 점은 Rust에서도 그대로 적용된다. `windows-future` 0.3.2의 `IAsyncOperation`은 `IntoFuture`를 구현하므로 `.await`할 수 있다([docs.rs windows-future](https://docs.rs/windows-future/0.3.2/windows_future/struct.IAsyncOperation.html)). Tauri v2 플러그인 tauri-plugin-iap(MIT)는 같은 API를 감싸고 있어 참고 구현으로 좋다. 다만 이 플러그인은 패키지 identity를 검사하지 않고, 워커 스레드에서 `.join()`으로 기다린다([tauri-plugin-iap windows.rs](https://raw.githubusercontent.com/Choochmeque/tauri-plugin-iap/main/src/windows.rs)). 필요한 API가 다섯 개 남짓이므로 직접 구현해서 스레드를 통제하는 편이 낫다. Luminous(Tauri)의 계획도 같은 구조다. 패키지 여부를 먼저 확인하고, 디버그용 가짜 entitlement 공급자를 둔다([esoltys/luminous#1414](https://github.com/esoltys/luminous/issues/1414)). 오프라인이면 `GetAppLicenseAsync`가 캐시값을 돌려주므로([Learn API: GetAppLicenseAsync](https://learn.microsoft.com/en-us/uwp/api/windows.services.store.storecontext.getapplicenseasync)), 구매자가 인터넷 없이 해금을 잃을 걱정은 작다. Store 호출이 실패하면 직전 판정을 유지하되, 그 값은 유예용으로만 쓴다. 관리자 권한으로 실행 중이면 구매 버튼을 숨기고 안내 문구를 띄운다. MoR을 더할 때는 사정이 다르다. CSP가 `connect-src 'self' ipc: http://ipc.localhost`라서(`src-tauri/tauri.conf.json:15-23`) 프런트가 MoR API를 직접 부를 수 없다. 그래서 Rust 쪽 HTTP 호출을 쓰거나, 앱 내장 공개키로 서명 파일을 오프라인 검증한다(Keygen 권장 Ed25519, [Keygen Cryptography](https://keygen.sh/docs/api/cryptography/)). 서버 없이 0원을 유지하려면 MoR 내장 키를 첫 1회만 온라인 활성화하고 결과를 `%APPDATA%\Frond\license.json`에 캐시한다. Gumroad를 쓴다면 `increment_uses_count=false`로 호출해 사용 횟수가 늘지 않게 한다.

테스트는 지금 vitest 139건·cargo 34건 위에 더한다. 새로 만들 것은 `src/license.test.ts`다. `canUseTheme`, `shouldNag`의 시간 경계와 가드(대화상자 열림·IME·최근 입력을 인자로 받는 순수 함수)를 검사한다. 그리고 "비구매자 + 저장된 사용자 테마 → 내장 테마로 대체, 설정값 보존" 회귀 테스트를 둔다. 기존 테스트도 바뀐다. 카탈로그 테마를 `listThemes()`에 싣는 안을 고르면 `src/theme/themes.test.ts:98-106`의 순서 기대값을 `[내장, 카탈로그, 사용자]`로 바꿔야 한다. `src/theme/recommended.test.ts:5-13`은 전용 묶음을 `RECOMMENDED_GROUPS`에 더하면 통과하고, `:22-32`의 WCAG 대비 검사는 전용 테마에도 품질 게이트로 그대로 둔다. "정보" 탭은 `src/settings.test.ts:14-24`가 자동으로 검사한다. Rust에서는 `cargo test` 환경에서 `is_packaged()`가 false인지, Dev 공급자가 동작하는지, 키 파일을 도입하면 Ed25519 검증(정상·변조·만료)이 맞는지 시험한다.

Store 실기 시험은 순서가 정해져 있다. `Windows.Services.Store`에는 라이선스 시뮬레이터가 없다. 그래서 다음 순서를 밟는다. ① 앱을 Private audience(본인 MSA)로 제출해 인증을 받는다. ② add-on을 "Available for purchase from within the parent product only"로 숨겨 만든다. ③ 개발 PC에서 Store로 한 번 설치·실행해 라이선스를 받는다. ④ 같은 `Identity`로 개발 빌드를 돌린다([Learn: in-app purchases and trials §Test](https://learn.microsoft.com/en-us/windows/uwp/monetize/in-app-purchases-and-trials); [Learn: visibility options](https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/add-on/visibility-options)). 해금 경로는 프로모션 코드로 무료로 확인하고, 실제 결제와 환불은 소액으로 한 번만 본다. 오류 코드를 진단 화면에 남기면 원인이 바로 갈린다. 0x803F6107은 "Store가 이 앱을 모른다"(연결 안 됨)이고, `APPMODEL_ERROR_NO_PACKAGE`는 패키지가 아니라는 뜻이다. 숨김 상태의 add-on은 `GetAssociatedStoreProductsAsync`에 나오지 않으므로, Store ID로 `GetStoreProductsAsync`를 써서 조회한다([Learn: get product info](https://learn.microsoft.com/en-us/windows/uwp/monetize/get-product-info-for-apps-and-add-ons)).

## 개발자가 정할 일, 출처 충돌, 아직 닫히지 않은 항목

| 결정 | 선택지 | 판단 기준 | 이 보고서의 권장 |
|---|---|---|---|
| D1 Store 계정 유형 | 개인 / 회사 | 10.14 문언, 사업자등록 여부, 회사 도메인 이메일 보유, 개인→회사 전환 불가 | 수익화를 첫 공개와 함께 하면 사업자등록 → 회사 계정. 아니어도 결정은 첫 공개 전에 |
| D2 사업자등록 시점·과세 유형 | 첫 판매 전 / 첫 판매 20일 안, 간이 / 일반 | 미등록가산세, 국내 매출 비중, 매입 규모 | 첫 판매 전 등록, 722000. 간이 여부는 세무사와 함께 |
| D3 결제 수단 | Store add-on만 / + MoR 키(NSIS판) / NSIS판은 전부 열기 | 운영 부담, Store 밖 수요, 정책 해석 | Store add-on만 + NSIS판 전부 열기로 시작. NSIS 수요가 보이면 Polar·Creem·Gumroad 중에서 MoR 추가(Lemon Squeezy는 피함) |
| D4 소스 라이선스 | MIT 확정 / Proprietary / 오픈 코어 / 소스 공개형 | 무료 서명 자격, 기존 MIT 표기, 포크 위험 | MIT를 LICENSE로 확정하고 전용 테마도 공개. 이름·아이콘은 따로 보유 [법률 확인] |
| D5 무료 범위 | 추천 테마 무료·유료, 테마 JSON 내보내기 허용 여부 | 접근성 반발, 해금 가치, 전용 테마 확산 | 추천 테마·다크 무료. 내보내기는 사용자 테마만 허용하고 전용 테마는 끄기 |
| D6 가격·등급 | 단일 ₩9,900~12,900 / 여러 등급 | Typora $14.99, Store 후원형 $10 안팎 | 단일 Durable로 시작. 등급은 판매 데이터를 본 뒤 |
| D7 권유 강도 | 비모달만 / 단계적(비모달 → 모달) / 처음부터 모달 | 사용자 신뢰, 사용자가 원한 "가끔 팝업" | 단계적. 첫 7일 유예, 14일 간격, "나중에"를 누를수록 간격 확대 |
| D8 카탈로그 구조 | 카탈로그 테마로 분리 / id 집합 + 내용 비교 | 테스트 수정량, 폴더 이전 계획 | 카탈로그 분리를 테마 폴더 이전(앞선 보고서 결정 ④)과 함께 |
| D9 전용 테마 위치 | JS 번들 / Rust `include_str!` + 권리 확인 커맨드 | 노출 정도(어느 쪽이든 막지는 못함) | Rust 쪽에 두되 저장소에는 공개(D4와 일관) |

| 주제 | 출처 A | 출처 B | 판단 |
|---|---|---|---|
| 혜택을 주는 후원의 결제 수단 | 10.8.1: 비게임 PC 앱은 제3자 API 또는 Store IAP | 10.8.2: 기부 대가로 디지털 혜택을 주면 Store IAP를 써야 함([Store Policies v7.20](https://learn.microsoft.com/en-us/windows/apps/publish/store-policies)) | Store add-on은 두 읽기를 모두 만족. MoR 상품은 "라이선스"로 이름 붙임 |
| 개인 계정의 유료 판매 | Partner Center: 세금·지급 프로필을 채우면 유료 add-on 제출 가능 | 10.14: 업으로 하는 사람은 회사 계정 | 금지 문구는 없지만 해석 위험. D1 |
| 한국 고객분 부가세 | Microsoft: 한국은 Microsoft-managed, Microsoft 등록번호로 청구·납부 | 부가가치세과-171: 국내분은 개발자가 10%, 2019 기재부: 등록 개발자분은 해외 마켓 대상 아님. ADA 6(e): Microsoft에 대한 VAT 제외 공급 | 이중과세 가능성. 세무사 1순위 |
| 사업자등록 시점 | 부가세법 제8조: 사업 개시 20일 안 | 커뮤니티: 정산받기 전까지 불필요 | 법 문언을 따름 |
| 앱마켓 원천징수 | 블로그: 앱마켓이 3.3%를 원천징수([Hitek](https://hiteksoftware.co.kr/blog/registration-of-app-development-business/)) | 다른 출처: 해외 플랫폼은 한국 세금을 떼지 않음 | 블로그 주장은 버림 |
| 통신판매업 면제 기준 | 옛 기준: 6개월 20회·1,200만원 | 2020 고시: 직전 연도 50회 미만 또는 간이과세자 | 2020 고시를 따름 |
| 현재 소스 라이선스 | README·Cargo.toml: MIT | LICENSE 파일 없음, GitHub 미감지, GitHub Docs: 라이선스가 없으면 모든 권리 보유 | 상태가 모호함. LICENSE 파일로 확정 |
| `RequestPurchaseAsync` 스레드 | Learn: UI 스레드 필수 | tauri-plugin-iap: 워커 스레드에서 `.join()` | 메인 스레드에서 시작하고 실측으로 확인 |
| IAP 시험 수단 | tauri-plugin-iap README: 샌드박스·테스트 결제 수단 | Learn: 시뮬레이터 없음, 실제 게시 필요 | Learn을 따름 |
| 오프라인 라이선스 | xplorer² 2017: 매번 인터넷 필요([zabkat](https://www.zabkat.com/blog/winrt-win32-store-registration.htm)) | API 문서: 오프라인이면 캐시값 | API 문서를 따르고 직전 판정을 유지 |
| 패키지된 Win32의 Store IAP | 2023 Q&A 익명 답변: exe를 MSIX로 감싸면 불가 | Learn·NanaZip: Desktop Bridge 앱에서 동작 | 가능 |
| ADA 버전 | 일부 노트: v8.10(2025-10-14 발효) | v8.11(2026-04-17 발효) | 15%·제3자 면제 조항은 같음. v8.11 기준 |

| 미확인 항목 | 걸리는 결정 | 확인 방법 |
|---|---|---|
| KRW tier 실제 값, 자유 가격 최소·최대 | D6 | Partner Center 환산표 |
| Store가 "In-app purchases" 표기를 자동으로 붙이는지 | 목록 문구 | 시험 제출 |
| 개인 계정 앱을 회사 계정으로 옮길 수 있는지 | D1 | Partner Center 지원 문의 |
| 한국이 개인 무료 등록 지원 시장인지, 게시자 이름이 실명으로 강제되는지 | D1 | `storedeveloper.microsoft.com` 가입 화면 |
| Partner Center가 한국 개발자에게 통신판매업 정보를 요구하는지 | 세무 | 세금 프로필 화면 |
| Store 판매분이 미국 세법상 royalty인지 business income인지, 조약 10%/15% | W-8BEN | 세무사 |
| 지급 통화로 KRW를 고를 수 있는지, 국내 은행 수취 수수료 | 정산 | 지급 프로필 화면·은행 |
| `AddOnLicenses` 키 형식, 오프라인 캐시 유효 기간, elevated 상태에서 `GetAppLicenseAsync`가 동작하는지 | 구현 | `InAppOfferToken` 비교로 우회, 실측 |
| loose layout 개발 빌드가 Store 설치본의 라이선스를 읽는지, add-on 게시 후 조회까지 걸리는 시간 | 시험 | 실측 |
| `windows` 0.62의 정확한 기능 이름 | 구현 1번 | 빌드 |
| SignPath가 IAP 코드를 포함한 OSI 프로젝트를 받는지, Certum의 "distributed commercially" 정의 | D4 | 각 기관 문의 |
| MoR이 한국 구매자에게 10% VAT를 매기는지, 미국 법인 MoR의 원천징수 | D3 | MoR 문의 |
| Fork의 권유 빈도·문구, 인디 데스크톱 앱 전환율 | D7 | 공개 자료 없음, 운영하며 관찰 |
| add-on 셀프 환불 정책(보도로는 add-on 제외, [Windows Central](https://www.windowscentral.com/how-request-microsoft-store-refunds)) | 운영 | 최신 공식 문서 |
| 사업자등록 신청 무수수료 | 0원 표 | 홈택스·세무서 |

## 결론

이번 조사로 바뀐 이해는 이렇다. "0원으로 팔 수 있는가"의 답을 정하는 것은 돈이 아니라 **분류**다. 반복 판매라는 같은 사실 하나가 세법의 사업자, 전자상거래법의 통신판매업자, Store 정책의 회사 계정을 한꺼번에 끌어낸다. 이 중 Store 계정 유형만은 나중에 바꿀 수 없다. 그래서 수익화의 첫 작업은 코드도 가격표도 아니다. 첫 공개 전에 "나는 사업자로 파는가"를 정하고, 계정 유형과 사업자등록 시점을 그 답에 맞추는 일이다. 같은 이유로 Store add-on은 수수료가 더 비싸도 먼저 고를 길이다. 정책 10.8.1과 10.8.2가 어느 쪽으로 읽혀도 문제가 없고, 해외 판매세를 Microsoft가 처리하고, 서버 없이 라이선스를 확인할 수 있는 길은 이것 하나뿐이다.

또 하나는 MIT 공개 저장소에서 파는 것의 성격이다. 여기서 해금은 보안 장치가 아니라 **정직한 사용자를 위한 동선**이다. 그래서 게이트는 파일이 아니라 UI 경로(가져오기·복제·전용 테마 적용)에 걸고, 권유는 드물고 끄기 쉽게 만들고, 다크 테마와 추천 테마는 무료로 남긴다. 이렇게 하면 Sublime Merge식 반발과 포크 동기를 함께 줄일 수 있다. 엔지니어링으로 보면 첫 커밋은 Store 매니페스트가 아니다. 앞선 보고서의 "나는 어떻게 설치됐는가" 판정 함수, 권리 판정 모듈, 추천 테마의 카탈로그 분리를 한 번에 정리하는 작업이 첫 커밋이 된다. 이 셋이 MSIX 대응과 유료 해금을 같은 구조 위에 올린다.

---

근거 노트: `docs/research/research_notes/Frond 스토어 유료 해금 방식/` (store_commerce.md, license_keys_and_korea_tax.md, precedents_and_licensing.md, codebase_theme_gating.md). 이전 조사: [Frond 윈도우 앱 배포 방법](Frond%20윈도우%20앱%20배포%20방법.md). 코드 기준 main `e8dc25a`. 조사일 2026-10-06. 이 문서는 법률·세무 자문이 아니며, [세무사 확인]·[법률 확인] 표시는 출처가 갈리거나 해석이 필요한 대목이다.
