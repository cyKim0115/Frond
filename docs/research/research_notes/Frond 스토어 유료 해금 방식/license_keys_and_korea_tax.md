# 자체 라이선스 키(MoR) vs Microsoft Store add-on, 그리고 한국 개인 개발자의 법·세무 의무 (2026-10 기준)

> 조사일 2026-10-06. 대상: Frond(Tauri 2, Windows Markdown 앱), 한국 거주 개인, 사업자등록 없음, 직장인 부업. 배포는 Microsoft Store(MSIX) 위주, GitHub Releases/winget 병행 가능.
> 모델: Fork(fork.dev)처럼 무료로 다 쓰게 하고, 선택적 1회 구매로 사용자 테마·전용 테마를 연다.
> 표기: **[오래됨 가능]** = 2025년 이전 자료. **[2차]** = 검색 요약이나 비공식 블로그라 원문 확인이 덜 됨. **[세무사 확인]** = 출처가 갈리거나 해석이 필요한 대목.
> 이 노트는 법률·세무 자문이 아닙니다. 출처가 말하는 내용을 옮겼고, 판단이 필요한 곳은 [세무사 확인]으로 표시했습니다.
> 범위 밖: Windows.Services.Store API 구현, 구매 권유 팝업 UX(다른 조사자 담당).

## Q1. 한국 개인이 2026년에 쓸 수 있는 MoR 결제 대행사: 가입 자격, 수수료, 한국 정산, 라이선스 키, 세금 처리

### Takeaway
한국 개인(법인·사업자 없음)이 가입하고 한국으로 정산받을 수 있는 MoR은 **Paddle, Lemon Squeezy, Polar, Creem, Gumroad**입니다. 다섯 곳 모두 전 세계 VAT/GST·판매세를 대신 신고·납부합니다. 다만 **라이선스 키 기능이 내장된 곳은 Lemon Squeezy·Polar·Creem·Gumroad이고, 지금의 Paddle Billing에는 없습니다.** Stripe가 Lemon Squeezy를 사서 만든 **Stripe Managed Payments는 한국 소재 사업자를 받지 않습니다.** 기본 수수료는 거래당 5%+$0.50 안팎입니다. 가장 싼 곳은 Creem(3.9%+$0.40)이고 가장 비싼 곳은 Gumroad(10%+$0.50)입니다. 여기에 해외 카드·정산 수수료가 붙는 곳이 있습니다.

### Cited Findings

**Paddle**
- 수수료 "5% + 50¢ per Checkout transaction". $10 미만 상품은 "contact us for bespoke pricing". 월 고정비는 없음(가격 페이지 © 2012–2026, 2026-10-06 열람) — [Paddle Pricing](https://www.paddle.com/pricing)
- 판매자 국가: 제재국 26곳을 빼면 전 세계 소프트웨어 사업자를 받음("works with software businesses anywhere in the world with the exception of the unsupported countries"). 북한은 제외 목록에 있고 한국은 제외 목록에 없음 — [Paddle Help: Which countries are supported](https://www.paddle.com/help/start/intro-to-paddle/which-countries-are-supported-by-paddle)
- 개인 가입: 사업자 검증 단계는 "not required for individuals or sole traders"이고, 신원 확인은 별도 단계로 있음 — [Paddle Help: Business verification](https://www.paddle.com/help/start/account-verification/what-is-business-verification); 법인을 따로 세우지 않아도 된다는 설명은 [Boathouse FAQ](https://help.boathouse.co/guides/beginners-guide-to-paddle/faq-can-i-sell-via-paddle-as-an-individual) **[2차]**
- 정산: wire transfer 또는 Payoneer. 정산 통화는 USD/EUR/GBP/AUD/CAD, 주 단위 정산. 대부분 국가는 정산 수수료가 없고 일부 국가에 $15 SWIFT 수수료 — [Paddle Help: Get paid](https://www.paddle.com/help/manage/get-paid) **[2차: 검색 요약 기준, 원문 미열람]**
- 라이선스 키: Paddle Billing에는 라이선스 키 생성 기능이 없고, 키 기능이 있던 Paddle Classic은 정리되는 중 — [Eternal Storms blog 2024-12-18](https://blog.eternalstorms.at/2024/12/18/selling-outside-of-the-mac-app-store-part-ii-lets-meddle-with-paddle/) **[오래됨 가능]**; [dev.to: Why I built my own licensing SDK](https://dev.to/nicodemanez/why-i-built-my-own-licensing-sdk-instead-of-using-paddle-4j98) **[2차]**. 구독에는 webhook으로 내 서버에서 키를 받아 메일로 보내는 "subscription license fulfillment"가 있음 — [Paddle changelog](https://updates.paddle.com/en/subscriptions-can-now-send-license-keys-80988150)
- 한국 결제수단(국내 카드, KakaoPay, Naver Pay, Samsung Pay)을 지원한다는 언급이 있음. "Paddle automatically calculates, collects, and remits taxes for all supported countries" — [Paddle Dev: Supported countries](https://developer.paddle.com/concepts/sell/supported-countries-locales/) (한국 VAT 10% 징수를 명시한 줄은 찾지 못함)

**Lemon Squeezy (2024년 Stripe 인수)**
- 수수료: 기본 5% + 50¢. 미국 밖 거래 +1.5%, PayPal 결제 +1.5%, 구독 +0.5%. 수수료는 "calculated on the total order value". 정산 수수료: Stripe 해외 은행 1%/회, PayPal 해외 3%(회당 상한 $30) — [Lemon Squeezy Docs: Fees](https://docs.lemonsqueezy.com/help/getting-started/fees); [Pricing](https://www.lemonsqueezy.com/pricing)
- 한국 판매자 지원: "Republic of Korea (ROK)"는 Stripe 은행 정산 국가에 들어 있고, PayPal 정산은 200개 이상 국가에서 가능 — [Lemon Squeezy Docs: Supported countries](https://docs.lemonsqueezy.com/help/getting-started/supported-countries)
- 2026년 상태: 2026-01-28 CEO 공지에서 Stripe 통합 기간에는 지원 응답과 제품 업데이트가 느려진다고 밝힘. Managed Payments는 "35+ countries"를 지원하고 목표는 "provide Lemon Squeezy users an easy way to migrate to Stripe Managed Payments". 신규 가입 중단 언급은 없음 — [Lemon Squeezy Blog: 2026 Update](https://www.lemonsqueezy.com/blog/2026-update)
- 라이선스 키: 상품별로 켜면 구매자마다 키를 만듦. 1회 구매 상품은 License Length(유효기간)와 Activation Limit(기기 수)를 정할 수 있음 — [Docs: Generating license keys](https://docs.lemonsqueezy.com/help/licensing/generating-license-keys). License API는 `POST https://api.lemonsqueezy.com/v1/licenses/activate`(`license_key`, `instance_name`), `/validate`, `/deactivate`. 문서에 API 키 요구가 없어 클라이언트 앱에서 직접 부르는 용도로 보이고, 속도 제한은 60 req/min — [Docs: Activate](https://docs.lemonsqueezy.com/api/license-api/activate-license-key); [Docs: License API](https://docs.lemonsqueezy.com/api/license-api)

**Stripe Managed Payments (Lemon Squeezy 후속)**
- 지원 사업자 소재지는 CA, US, 유럽 31개국, AU, HK, JP, SG이고 **KR은 없음**. Connect/Express 계정도 지원하지 않음 — [Stripe Docs: Managed Payments eligibility](https://docs.stripe.com/payments/managed-payments/eligibility)
- 80개국 이상에서 간접세를 대신 처리하고, 상품은 software·digital만 가능 — [Stripe Docs: Managed Payments](https://docs.stripe.com/payments/managed-payments)
- 수수료 6.4% + 30¢, 2026-04-22 GA — [Paritydeals](https://www.paritydeals.com/stripe-managed-payments-vs-lemon-squeezy-fees/); [Dodo Payments blog](https://dodopayments.com/blogs/lemon-squeezy-vs-stripe) **[2차: Stripe 원문으로 확인 못 함]**

**Polar (polar.sh)**
- 수수료 단계: Starter 5%+50¢, Pro 3.8%+40¢, Growth 3.6%+35¢, Scale 3.4%+30¢. 비미국 카드 +1.5%, 분쟁 건당 $15, 환불해도 수수료는 돌려주지 않음. Early Member 요율(+0.5% 구독) 적용은 **2026-05-27**까지였음 — [Polar Docs: Fees](https://polar.sh/docs/merchant-of-record/fees)
- 정산(Stripe 경유): 정산이 있는 달마다 $2, 회당 0.25%+$0.25, 그리고 cross-border 수수료 — [Polar Docs: Fees](https://polar.sh/docs/merchant-of-record/fees)
- 한국: Stripe Connect Express 정산 가능국 150여 곳에 **한국이 포함**됨. 개인을 business type으로 받는지는 나라마다 다르다고 적혀 있음 — [Polar Docs: Supported countries](https://polar.sh/docs/merchant-of-record/supported-countries)
- 라이선스 키: 접두사를 정할 수 있는 키, 활성화 수 제한, N일·월·년 뒤 만료, 사용량 한도를 지원. 클라이언트용 엔드포인트는 `POST /v1/customer-portal/license-keys/activate`, `/validate`이고 `organization_id`가 필수 — [Polar Docs: License keys](https://polar.sh/docs/features/benefits/license-keys)

**Creem (creem.io)**
- "3.9% + $0.40 per successful transaction", "No international card fees", 월·설정 비용 없음. 50개국 이상에서 VAT/GST·판매세를 징수·납부 — [Creem Pricing](https://www.creem.io/pricing)
- 한국은 판매자 지원국 87곳에 포함되고 국내 은행 송금으로 정산. 정산 수수료는 "7 EUR/USD or 1% of the payout amount, whichever is higher". 개인·사업자 구분 제한 표시는 한국에 없음 — [Creem Docs: Supported countries](https://docs.creem.io/merchant-of-record/supported-countries)
- 정산일은 매월 1일·15일, 은행 또는 crypto(USDC) 지갑 — [Creem Pricing](https://www.creem.io/pricing)
- Licenses API로 키 검증·활성화·비활성화, 기기별 instance, 활성화 한도·만료를 지원 — [api-evangelist/creem (GitHub)](https://github.com/api-evangelist/creem) **[2차]**

**Gumroad**
- 수수료: 직접 판매 10% + $0.50, Discover 마켓 경유 30%. "Since January 1, 2025, Gumroad handles ALL your tax obligations"(이날부터 MoR) — [Gumroad Pricing](https://gumroad.com/pricing)
- 정산: 한국은 은행 직접 정산국에 들어 있음. 최소 잔액 US$10, 매주 금요일 지급, 현지 통화로 현지 계좌에 입금 — [Gumroad Help: Getting paid](https://gumroad.com/help/article/13-getting-paid) **[2차: 검색 요약 기준, 원문은 리다이렉트로 못 열었음]**
- 라이선스 키 검증: `POST https://api.gumroad.com/v2/licenses/verify`(`product_id`, `license_key`, `increment_uses_count` 기본값 true). OAuth 앱 없이 호출 가능 — [sevic.dev: License key verification with Gumroad API](https://sevic.dev/notes/license-key-verification-gumroad-api/); [Gumroad Help: License keys](https://gumroad.com/help/article/76-license-keys) **[2차]**

**FastSpring**
- 공개 요율이 없음. "FastSpring's team will work with you to determine simple, flat-rate pricing"(견적 방식), "no minimum transaction volume", MoR로 판매세를 징수·납부. 개인 가입 가능 여부와 정산 방식은 이 페이지에 없음 — [FastSpring Pricing](https://fastspring.com/pricing/)

**Keygen (라이선스만 담당, 결제는 하지 않음)**
- Dev 요금제(무료): "up to 100 active licensed users (ALUs) and 10 product releases". 자체 호스팅 무료판 Keygen CE가 있고, 모든 요금제에 "Offline Licenses" 포함 — [Keygen Pricing](https://keygen.sh/pricing/)
- Std 1 요금: 월 $49(ALU 1,000명, 일 10,000 API 요청) — [Capterra](https://www.capterra.com/p/168916/Keygen/pricing/) **[2차]**. 반면 경쟁사 비교 페이지는 "$99/mo"라고 적음 — [Keymint compare](https://keymint.dev/compare/keygen) **[충돌: 공식 가격표 숫자는 확인 못 함]**

### Inferences
- **$10 1회 구매 기준 수수료 추정(세금 별도, 정산 수수료 제외)**: Paddle $1.00(10%), Lemon Squeezy 비미국 구매자 $1.15, Polar Starter 비미국 카드 $1.15, Creem $0.79, Gumroad $1.50, MS Store add-on $1.50(15%, Q3). 여기에 정산 수수료(Lemon 1%, Creem 최소 $7, Polar 월 $2+0.25%+$0.25)가 붙습니다. 판매가 적으면 Creem의 최소 $7 같은 정산 고정비가 비율로 크게 느껴집니다(위 출처 숫자로 계산한 추정).
- Frond처럼 "키 발급 + 클라이언트 검증"을 결제와 한 곳에서 끝내려면 Lemon Squeezy·Polar·Creem·Gumroad가 맞습니다. Paddle은 키 생성을 직접 만들거나(webhook에서 Ed25519로 서명) Keygen 같은 외부 서비스와 묶어야 합니다.
- Lemon Squeezy는 "Stripe Managed Payments로 옮겨 가는 중"이고 KR은 Managed Payments 대상국이 아닙니다. 이 둘을 합치면, 지금 Lemon Squeezy를 고르면 나중에 강제 이전이나 지원 축소를 맞을 위험이 있습니다(공식 종료 발표는 없음).

### Gaps
- Paddle·Lemon Squeezy·Polar·Creem이 한국 구매자에게 10% VAT를 실제로 매기는지(한국 간편사업자 등록 여부)를 공식 문서로 확인하지 못했습니다.
- 미국 법인인 MoR(Lemon Squeezy·Polar·Gumroad)이 한국 개인에게 W-8BEN을 받고 미국 원천징수를 하는지, Polar·Creem의 개인 계정 심사 기준을 원문으로 확인하지 못했습니다.
- FastSpring의 실제 요율(과거에 흔히 말하던 5.9%+95¢)과 한국 개인 가입 가능 여부는 공개 자료가 없습니다.

---

## Q2. 데스크톱 앱의 라이선스 키 검증: 온라인 활성화 vs 오프라인 서명 파일, 다른 앱 사례, Rust 도구

### Takeaway
방식은 둘입니다. 하나는 **온라인 활성화 API**(Lemon Squeezy·Polar·Gumroad·Keygen)로 기기 수를 셀 수 있지만 네트워크가 필요합니다. 다른 하나는 **Ed25519로 서명한 라이선스 파일·키를 앱에 넣은 공개키로 오프라인 검증**하는 방식(Keygen 서명 키·라이선스 파일, 직접 구현)입니다. 비교 대상 앱들은 대체로 관대합니다. Sublime Text는 평가판에 기한이 없고 저장 몇 번마다 팝업을 띄우며, 라이선스는 사람 단위입니다. Typora는 기기 3대에 15일 체험, 오프라인 활성화를 지원합니다. Fork는 $59.99에 기기 3대이고 무료 평가가 있습니다. Rust에서는 `ed25519-dalek`(docs.rs 최신 v3.0.0)으로 검증 코드를 몇 줄이면 쓸 수 있습니다.

### Cited Findings
- Keygen 권장 서명 방식은 Ed25519: "our recommended signing scheme, due to its smaller signature size and higher security level when compared to 2048-bit RSA". 서명 키 형식은 `key/[base64url 데이터].[base64url 서명]`이고 키는 만든 뒤 바꿀 수 없음(immutable) — [Keygen Docs: Cryptography](https://keygen.sh/docs/api/cryptography/)
- Keygen 라이선스/머신 파일(오프라인용)은 `enc`·`sig`·`alg`(예: `aes-256-gcm+ed25519`) 세 속성과 `issued`·`expiry`·`ttl` 메타를 가짐. 서명 검증 전에는 `enc`를 쓰지 말고, 공개키는 앱 코드에 하드코딩하라고 권고 — [Keygen Docs: Cryptography](https://keygen.sh/docs/api/cryptography/)
- Keygen은 C++·Python 등 Ed25519 오프라인 검증 예제 저장소를 공개 — [keygen-sh/example-cpp-ed25519-verification](https://github.com/keygen-sh/example-cpp-ed25519-verification)
- `ed25519-dalek` v3.0.0(docs.rs 최신, 2026-10-06 열람, BSD-3-Clause). 검증 흐름은 `VerifyingKey::from_bytes(&bytes)?` 다음 `verifying_key.verify(&message, &signature)` — [docs.rs ed25519-dalek](https://docs.rs/ed25519-dalek/latest/ed25519_dalek/)
- Lemon Squeezy: 상품마다 Activation Limit·License Length를 정하고, 앱은 `/v1/licenses/activate`·`/validate`·`/deactivate`를 호출(60 req/min) — [Docs: Generating license keys](https://docs.lemonsqueezy.com/help/licensing/generating-license-keys); [License API](https://docs.lemonsqueezy.com/api/license-api)
- Gumroad: 실행할 때마다 verify를 부르면 사용 횟수가 늘어나므로 `increment_uses_count=false`를 쓰라고 함 — [sevic.dev](https://sevic.dev/notes/license-key-verification-gumroad-api/) **[2차]**
- Paddle류 온라인 검증만 있으면 비행기·방화벽 안·오프라인에서 곤란하다는 개발자 경험담 — [dev.to: Why I built my own licensing SDK](https://dev.to/nicodemanez/why-i-built-my-own-licensing-sdk-instead-of-using-paddle-4j98) **[2차]**
- **Sublime Text**: 라이선스는 "per-user"이고 주 사용자이면 모든 컴퓨터·OS에서 쓸 수 있음. 환불은 구매 후 30일 이내 — [Sublime HQ Sales FAQ](https://www.sublimetext.com/sales_faq). 평가판은 기한 없이 계속 쓸 수 있고 저장 몇 번마다 구매 팝업이 뜸. 입력한 키는 기기에 묶인 이진 형태로 저장돼 백업·동기화로 키가 새는 것을 막음 — [Sublime Forum](https://forum.sublimetext.com/t/so-whats-stopping-me-from-using-the-evaluation-version-and-never-paying-for-it/31436); [Sublime Forum: new computer](https://forum.sublimetext.com/t/license-not-valid-with-new-computer/53279) **[2차, 포럼]**
- **Typora**: 라이선스 1개로 한 사람의 기기 최대 3대, 만료 없음. 같은 기기라도 계정·OS가 다르면 다른 기기로 셈. 15일 무료 체험. 오프라인 활성화는 Machine Code를 store.typora.io/offline에 넣어 Activation Token을 받는 방식이고, 오프라인으로 활성화한 기기는 최소 6개월간 비활성화할 수 없음 — [Typora Support: Offline Activation](https://support.typora.io/Offline-Activation/); [Typora Store](https://store.typora.io/); [Typora: My License](https://support.typora.io/My-License/) **[검색 요약 기준]**
- **Fork**: "$59.99", "up to 3 machines at a time", "Personal and commercial use" — [fork.dev/buy](https://fork.dev/buy); Mac·Windows 모두 "free evaluation" — [fork.dev](https://fork.dev/)

### Inferences
- Frond는 "구매자만 테마를 연다" 정도의 가벼운 해금이므로 **오프라인 Ed25519 서명 라이선스**(구매 webhook → 서버나 MoR 쪽에서 `{email, product, issued}`에 서명 → 앱은 내장 공개키로 검증)가 잘 맞아 보입니다. 오프라인 사용자를 막지 않고, Sublime·Typora처럼 크랙을 어느 정도 감수하는 선택입니다. 기기 수 제한이 필요할 때만 MoR의 activate API를 함께 씁니다.
- MoR 키(Lemon·Polar·Gumroad)만 쓰면 검증할 때마다 그 회사 API에 의존합니다. 첫 활성화 때 한 번만 온라인으로 확인하고, 결과를 앱이 자기 서명 형식으로 캐시하는 혼합 방식이 흔한 절충입니다(Keygen 머신 파일과 같은 구조).

### Gaps
- Fork의 Windows판 결제 대행사, 미구매 시 알림 동작, 키 검증 방식(온·오프라인)은 공식 페이지에 없어 확인하지 못했습니다.
- 인디 앱의 불법 복제율이나 "크랙 감수"에 대한 정량 자료는 찾지 못했습니다(일화 수준만 있음).

---

## Q3. Store에 올린 비게임 앱이 add-on 대신 자체 결제 링크로 해금을 팔아도 되나 (Store Policy 10.8, 수수료, 위험)

### Takeaway
**됩니다.** Store Policies v7.20(ms.date 2026-09-14)의 10.8.1은 "Non-game products made available on PC devices may either use a secure third-party purchase API or the Microsoft Store in-product purchase API"라고 명시합니다. App Developer Agreement v8.10(2025-10-14 시행)은 "Purchases made on a third-party commerce engine are not subject to the Store Fee"라고 해서 **Store 수수료 0%**입니다. 대신 지켜야 할 것이 있습니다. 거래 시 결제 대행사를 밝히고, 사용자 확인을 받고, PCI DSS를 지키고, 제출 때 Partner Center에 제3자 결제 사용을 표시하고, 설명에 인앱 구매가 있다고 적어야 합니다. Microsoft 커머스(add-on)를 쓰면 앱은 **15%**이고, 그 대신 세금·환불·차지백을 Microsoft가 처리합니다(한국은 Microsoft-Managed 세금 국가).

### Cited Findings
- 10.8.1: (a) 게임과 (b) Xbox 제품만 Microsoft IAP가 의무. "Non-game products made available on PC devices may either use a secure third-party purchase API or the Microsoft Store in-product purchase API for in-app purchases of digital items or services that are consumed or used within the product." — [Microsoft Store Policies v7.20 (ms.date 2026-09-14, updated 2026-09-15)](https://learn.microsoft.com/en-us/windows/apps/publish/store-policies)
- 제3자 결제 조건(10.8.2 하단): 거래 시 "identify the commerce transaction provider, authenticate the user, and obtain the user's confirmation", PCI DSS 준수, "After installation of your product is completed, users may be directed to a browser to complete registration or transactions", "You must note the use of a secure third-party purchase API in Partner Center during the submission process" — [Store Policies v7.20](https://learn.microsoft.com/en-us/windows/apps/publish/store-policies)
- **충돌 주의**: 10.8.2 본문에는 "if the user receives digital goods or services in return [for a donation]… you must use the Microsoft Store in-product purchase API instead"라는 문장이 있는데, 10.8.1의 비게임 PC 예외와 겹칩니다. 해금을 "기부"라고 부르지 말고 "구매"로 표현하는 편이 안전합니다 — [Store Policies v7.20](https://learn.microsoft.com/en-us/windows/apps/publish/store-policies)
- 10.8.3: "Products from individual accounts cannot require financial information for primary functionality." — 같은 문서
- 10.8.4: 인앱 구매의 종류와 가격 범위를 메타데이터에 밝히고, 사용자가 구매를 시작한다는 것을 분명히 해야 함 — 같은 문서
- 10.14: "Company accounts must be used for organizations, businesses, and any person acting in relation to their trade or profession. Individual accounts are usually appropriate for a single developer working on their own." — 같은 문서. 개인 계정 대상은 "not in relation to their business, trade, or profession"이고, 개인에서 회사로의 전환은 지원하지 않음 — [Learn: Open a developer account](https://learn.microsoft.com/en-us/windows/apps/publish/partner-center/open-a-developer-account) (이전 조사 노트 `ms_store_submission.md`에서 재인용)
- ADA v8.10(Publish 2025-09-12, Effective 2025-10-14) 5(e): "Purchases made on a third-party commerce engine are not subject to the Store Fee… If your App allows any purchase to be made from within the App you must prominently disclose in your product description that in-app purchase functionality is available." — [Microsoft Store App Developer Agreement v8.10 (PDF)](https://cdn-dynmedia-1.microsoft.com/is/content/microsoftcorp/microsoft/store/documents/legal/ada/fy26/MS.Store.ADAv8.10.EN.US.pdf)
- ADA 6(b) Store Fee: 앱 15%, 게임 12%(2021-08-01 이후), Xbox 콘솔 등은 30%. 기준은 Net Receipts(고객 결제액에서 Microsoft가 징수한 세금 등을 뺀 금액) — 같은 PDF
- ADA 6(h): 자체 결제를 쓰는 앱은 "Microsoft will not be responsible for collecting or remitting any taxes", 필요하면 세금계산서도 개발자가 발행 — 같은 PDF
- ADA 4(a): Microsoft는 개발자의 "agent or commissionaire"이고 "you, not Microsoft, are the distributor". 단 Exhibit C의 reseller 국가(현재 Brazil 등)는 예외 — 같은 PDF; [Learn: Tax Responsibilities (ms.date 2026-03-18)](https://learn.microsoft.com/en-us/partner-center/marketplace-offers/tax-details-marketplace)
- 비게임 앱은 자체 결제를 쓰면 수익 100%라는 점을 2026-05 회사 계정 공지에서 다시 확인함("non-game apps to retain 100% of revenue through proprietary systems") — [Windows Developer Blog 2026-05-07](https://blogs.windows.com/windowsdeveloper/2026/05/07/publish-to-microsoft-store-as-a-company-now-with-free-registration-and-faster-onboarding/)
- MSI/EXE(비MSIX) 제출은 자체·제3자 커머스만 가능하고 Store 커머스는 MSIX 전용 — [Learn: Distribute Win32 app](https://learn.microsoft.com/en-us/windows/apps/distribute-through-store/how-to-distribute-your-win32-app-through-microsoft-store) (이전 조사 노트에서 재인용)

### Inferences
- **비교 요약(개발자 입장)**
  - *MS add-on*: 수수료 15%. 결제·환불·차지백·한국을 포함한 Microsoft-Managed 국가의 VAT 징수는 Microsoft가 하고, 키 서버가 필요 없음(Store 라이선스). 다만 Store 밖(GitHub/winget) 설치본에서는 구매를 확인할 수 없고, 정산은 Partner Center 세금 프로필(W-8BEN)과 은행 정보로 받음.
  - *MoR + 자체 키*: 수수료 5~10%+고정비(Creem은 3.9%). 한 키로 Store판·GitHub판 모두 열 수 있지만 키 발급·검증 코드, 구매 페이지, 환불 정책을 직접 운영해야 함. Store 정책상 결제 대행사 표시, 브라우저 결제, Partner Center 표시가 필요함.
  - 판매가 소액·소량이면 수수료 차이(약 5~10%p)는 연간 금액이 작습니다. 그래서 고르는 기준은 운영 부담과 세무 서류 차이(Q5)가 될 가능성이 큽니다.
- **개인 계정 위험**: 유료 해금을 팔기 시작하면 10.14의 "acting in relation to their trade or profession"에 해당해 회사 계정이 필요하다고 볼 여지가 있습니다. 문구가 모호하고 개인→회사 전환이 안 되므로, 처음 계정을 만들 때 고려할 점입니다.
- 10.8.3의 "financial information for primary functionality"는 선택 구매에는 해당하지 않는다고 읽힙니다(핵심 기능은 무료이므로). 라이선스 키는 예시 목록(카드·계좌·세금 ID·API secret key 등)에 없습니다.

### Gaps
- 자체 결제 링크로 해금을 판 Store 비게임 앱이 인증에서 거절당한 사례나, Microsoft가 이를 따로 해석한 Q&A는 찾지 못했습니다.
- "Store에서 산 사용자는 add-on, 밖에서 산 사용자는 키"처럼 두 방식을 같이 쓰는 것에 대한 정책 문구는 확인하지 못했습니다. 10.8.1이 두 방식을 "either"로만 적고 있습니다.

---

## Q4. 한국: 사업자등록 의무·시점, 업종코드, 간이 vs 일반과세자

### Takeaway
부가가치세법 제8조는 **사업 개시일부터 20일 이내** 사업자등록을 요구하고, 늦으면 **공급가액의 1% 미등록가산세**가 붙습니다. 반복적으로 판매해 수익이 나면 사업자로 보는 것이 원칙입니다. 업종코드는 **722000 응용 소프트웨어 개발 및 공급업(정보통신업)**을 가장 많이 씁니다. 간이과세 기준은 2024-07-01부터 **연 1억 400만원 미만**이고, **4,800만원 미만은 부가세 납부가 면제**됩니다. 간이과세자도 영세율은 적용받지만 매입세액 환급은 받을 수 없습니다. "SW 업종은 간이과세를 잘 안 받아 준다"는 상담 답변도 있으니 [세무사 확인]이 필요합니다.

### Cited Findings
- 부가세법 제8조: "사업장마다… 사업 개시일부터 20일 이내에 사업장 관할 세무서장에게 사업자등록을 신청". 개시 전 신청도 가능 — [law.go.kr 부가가치세법 제8조](https://www.law.go.kr/LSW/lsLawLinkInfo.do?ancYnChk=&chrClsCd=010202&lsJoLnkSeq=1011773243); [일간NTN](https://intn.co.kr/news/articleView.html?idxno=2036452)
- 미등록가산세: 사업 개시일부터 등록 신청 전날까지 공급가액 합계의 1%. 매입세액 불공제, 무신고·납부지연 가산세 위험도 있음 — [thecheck.co.kr](https://thecheck.co.kr/business-registration-twenty-days/); [일간NTN](https://www.intn.co.kr/news/articleView.html?idxno=2001790) **[2차]**
- 외화 플랫폼 수익이 계속 생기면 사업자등록이 원칙. 앱 개발·소프트웨어 용역은 과세사업자에 해당하고, "영세율은 과세사업자에게 적용되는 제도"이므로 면세(940306 1인 미디어) 등록으로는 영세율을 받을 수 없음(최종 검토 2026-06-07) — [watax.kr: 외화 수익 1인 사업자 세금 신고](https://www.watax.kr/income-tax/adsense-platform-foreign-income-tax-zero-rate-guide)
- 업종코드 722000 = 응용 소프트웨어 개발 및 공급업, 상위 분류는 J 정보통신업 › 722 소프트웨어 개발 및 공급 — [indicode.kr 722000 (2025)](https://indicode.kr/explanation/business/2025/722000). 개발자는 722000으로 등록하는 경우가 많고, 정보통신업이면 창업중소기업 세액감면 등 혜택이 있음(2024-08-02, 세무사 신현진) — [택스워치 2024-07-19](https://www.taxwatch.co.kr/article/tax/2024/07/19/0002)
- 722000 경비율(2025 귀속): 단순경비율 75.2%(일반), 기준경비율 24.7%. 단순경비율 대상은 수입금액 3,600만원 미만 — [upjong.co.kr 722000](https://upjong.co.kr/business-code/upjong-722000/) **[2차: 검색 요약 수치, 국세청 원표로 확인 못 함]**
- 간이과세 기준: 2024-07-01부터 8,000만원 미만 → **1억 400만원 미만**(부동산임대·과세유흥은 4,800만원 유지) — [정책브리핑 korea.kr](https://www.korea.kr/news/policyNewsView.do?newsId=148930428); [아시아경제 2024-06-18](https://www.asiae.co.kr/article/2024061810023094125)
- 간이과세자는 1.5~4% 낮은 세율, 매입액의 0.5%만 공제, 연 매출 4,800만원 미만이면 납부 면제 — 위 검색 요약([청구스 블로그](https://www.chungoose.kr/blog/2025%EB%85%84-%EA%B0%84%EC%9D%B4%EA%B3%BC%EC%84%B8%EC%9E%90-%EA%B8%B0%EC%A4%80-%EC%A0%95%EB%A6%AC-8-000%EB%A7%8C%EC%9B%90-1%EC%96%B5-400%EB%A7%8C%EC%9B%90)) **[2차]**
- 간이과세자도 영세율을 적용받을 수 있으나 매입세액 환급은 안 됨 — [택스가이드: 영세율](https://taxguide.im/blog/vat-zero-rated-guide); [국세청 부가가치세 기본정보](https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7693&mi=2272) **[2차: 검색 요약]**
- "소프트웨어 개발 업종의 경우는 간이과세자로 받아주지 않는 경우가 많습니다"라는 상담 답변 — [찾아줘세무사 상담](https://www.findsemusa.com/service/consult/consultView.do?qidx=32664) **[2차, 일화]**

### Inferences
- MoR이나 Store 정산은 "반복적으로 대가를 받는 판매"이므로, 첫 유료 판매를 시작하는 시점을 "사업 개시일"로 보고 그 전후로 등록하는 것이 법 문언에 맞습니다. "정산받기 전까지는 등록 안 해도 된다"는 커뮤니티 글(Q9)은 이 문언과 다릅니다. [세무사 확인]
- 매출 대부분이 해외(영세율)이면 낼 부가세가 거의 없습니다. 그래서 간이과세의 이점(낮은 세율)은 작고, 일반과세자는 매입세액(PC·인증서 등)을 환급받을 수 있습니다. 어느 쪽이 나은지는 국내 매출 비중과 매입 규모에 달렸습니다. [세무사 확인]

### Gaps
- 국세청이 "해외 MoR 경유 소프트웨어 라이선스 판매"를 어느 업종코드로 보라고 한 공식 안내는 찾지 못했습니다. 722000 외에 전자상거래 소매(525101)를 쓰는 경우도 있습니다.
- 2026년 귀속 경비율은 아직 고시 전이거나 확인하지 못했습니다.

---

## Q5. 한국 부가가치세: Store 판매 vs MoR 판매, 해외 구매자(영세율) vs 국내 구매자, 서류

### Takeaway
**앱마켓(대리인 구조)**의 경우, 국세청 해석(부가가치세과-171, 2013)과 세무사 칼럼(2021~2022)은 같은 결론입니다. 국내 개발자가 국외 앱마켓에서 파는 것은 용역의 공급이고, **국외 소비자분은 영세율, 국내 소비자분은 10% 과세**이며, **과세표준은 앱마켓 수수료를 빼기 전 총액**입니다. Microsoft는 ADA상 agent/commissionaire이므로 같은 틀에 들어갈 가능성이 큽니다. 다만 Microsoft는 **한국을 Microsoft-Managed 세금 국가로 지정**해 한국 고객분 VAT를 직접 징수·납부합니다. 2019년 기재부 해석은 "국내 개발자가 미등록이면 국외 오픈마켓이 간편사업자로 신고, 등록했으면 아님"이라고 했습니다. 등록한 국내 개발자의 한국 매출을 누가 신고하는지는 **[세무사 확인]** 1순위입니다.
**MoR(재판매자 구조)**에서는 거래 상대방이 외국 법인(MoR)입니다. 이 경우 영세율 근거는 부가세법 제24조·시행령 제33조②1호(국내사업장 없는 외국법인에 공급하는 정보통신업 용역)이고, **대금을 외국환은행에서 원화로 받아야** 합니다. PayPal로 받은 대금은 영세율이 안 된다는 해석이 있습니다.

### Cited Findings
- **부가가치세과-171(2013-02-19)**: 국외 서버의 앱마켓을 통한 판매에서 국내 소비자분은 과세(공급가액·세액 구분 표시가 없으면 거래금액의 110분의 100이 과세표준), 국외 소비자분은 "국외에서 제공하는 용역으로서" 영세율. 마켓 수수료는 과세표준에 포함(수익분배금이 아닌 전체 거래금액으로 신고). 공급시기는 정산일, 그날 기준환율로 환산 — [ulex: 부가가치세과-171](https://ulex.co.kr/tax/%EB%B6%80%EA%B0%80%EA%B0%80%EC%B9%98%EC%84%B8%EA%B3%BC171-178189?sub_select_type=) **[오래됨 가능: 2015년 국외사업자 전자적 용역 과세 전 해석]**
- 세무사 칼럼(2022-05-24, 류장협): "부가세 신고 때에는 순 정산금액이 아닌 이러한 수수료를 차감하기 전 결제총액을 매출로 신고해야", 국내매출 과세·해외매출 영세율, 공급시기는 플랫폼 정산일 — [택스워치](https://www.taxwatch.co.kr/article/tax/2022/05/16/0002) **[오래됨 가능]**
- 세무법인 블로그(2021-10-21): 오픈마켓 앱 판매는 과세대상 용역이고 "국외 소비자가 다운로드받는 분은 국외에서 제공하는 용역으로서 영세율". 영세율로 신고하면 외화획득명세서와 증빙 서류를 내야 하고, 국가별 다운로드 현황 기록을 권장 — [크리에이티브파트너스 블로그](https://blog.creativepartners.co.kr/69dc8cae-465b-4d87-ac37-121160d5d978) **[오래됨 가능]**
- **기획재정부 부가가치세제과-450(2019-07-17)**: 국내 개발자가 부가세법 제8조의 사업자등록을 하지 않았으면 애플·구글 등 국외 오픈마켓이 간편사업자로 등록해 신고·납부하고, 국내 개발자가 등록했으면 그 대상이 아님(근거 부가세법 제53조의2, 시행령 제96조의2②2호) — [lawmeca 법률QA (2020-08-07)](https://www.lawmeca.com/66617-%EC%95%B1%EC%8A%A4%ED%86%A0%EC%96%B4%EB%82%98-%EA%B5%AC%EA%B8%80%ED%94%8C%EB%A0%88%EC%9D%B4-%EC%95%B1-%EA%B0%9C%EB%B0%9C%EC%9E%90%EA%B0%80-%EC%82%AC%EC%97%85%EC%9E%90%EB%93%B1%EB%A1%9D%EC%9D%84-%ED%95%98%EC%A7%80%EC%95%8A/) **[2차]**
- Google Play: 한국 거주 개발자는 한국 고객 구매분 VAT를 직접 산정·청구·납부할 책임이 있고, 사업자등록번호를 내지 않으면 Google이 서비스 수수료에 10% VAT를 청구 — [Play Console 고객센터: 세율 및 VAT](https://support.google.com/googleplay/android-developer/answer/138000?hl=ko) **[검색 요약 기준]**
- **Microsoft Store**: "South Korea"는 Microsoft-managed countries/regions 목록에 있음(ms.date 2026-03-18). 이 나라들에서는 Microsoft가 agent/commissionaire로서 세금을 계산·징수·납부하고 "invoices under Microsoft's applicable registration number". 다만 "Microsoft makes no warranties that Microsoft's actions completely satisfy Publisher/Developer obligations" — [Learn: Tax Responsibilities for Microsoft Marketplace](https://learn.microsoft.com/en-us/partner-center/marketplace-offers/tax-details-marketplace)
- ADA 6(e): 판매가 Microsoft에 대한 과세 공급으로 보이는 나라에서는 "that supply is deemed to be made to Microsoft exclusive of VAT". ADA 6(g): Microsoft 커머스를 쓰면 Exhibit A·C의 국가에서만 Microsoft가 세금을 징수·납부 — [ADA v8.10 PDF](https://cdn-dynmedia-1.microsoft.com/is/content/microsoftcorp/microsoft/store/documents/legal/ada/fy26/MS.Store.ADAv8.10.EN.US.pdf)
- **영세율(외국법인 상대 용역)**: 부가세법 제24조 + 시행령 제33조제2항제1호 바목(정보통신업). 요건은 (1) 공급받는 자가 국내사업장이 없는 비거주자나 외국법인, (2) "그 대금을 외국환은행에서 원화로 받거나 재정경제부령으로 정하는 방법으로". 첨부는 플랫폼 정산 내역, 외국환은행 외화 입금·환전 내역, 약관·계약서. "영세율은 세율이 0%일 뿐, 신고 의무가 사라지는 것이 아닙니다" — [watax.kr (2026-06-07 검토)](https://www.watax.kr/income-tax/adsense-platform-foreign-income-tax-zero-rate-guide)
- PayPal: "페이팔로 대금을 입금받는 경우 법에서 규정한 외국환은행에서 원화로 받는 경우가 아니기 때문에 영세율을 적용받을 수 없습니다" — [브런치 cppartners (2018-11-24)](https://brunch.co.kr/@cppartners/43) **[오래됨 가능]**
- 국내 제3자(MCN)를 거쳐 원화로 받은 유튜브 광고수익에는 영세율을 적용하지 않는다는 예규. 33조②1호 요건은 엄격히 해석함 — [일간NTN 국세 예규](https://www.intn.co.kr/news/articleView.html?idxno=2025396) **[2차]**
- 한국의 국외사업자 전자적 용역 과세: 2015-07-01부터 B2C 10%, 등록 기준 금액 없음, 판매 시작 20일 이내 등록, 분기별 신고 — [vatcalc](https://www.vatcalc.com/south-korea/south-korea-vat-on-non-resident-digital-services/) **[2차]**

### Inferences
- **MS add-on 경로**: 해외 구매자분은 "용역의 국외공급(국외 소비자)"으로 영세율이 될 가능성이 큽니다(2013 해석 구조). 이 경우 외국환은행 요건은 33조②1호처럼 엄격하지 않을 수 있지만, 실무 칼럼들은 외화획득명세서와 은행 입금 증빙을 함께 내라고 합니다. 한국 구매자분은 총액(수수료 포함)으로 10% 과세가 원칙인데, Microsoft가 한국분 VAT를 이미 징수했다면 이중 과세가 될 수 있습니다. [세무사 확인]
- **MoR 경로**: 개발자 → MoR(외국법인) 공급 하나로 보면 한국 구매자분도 MoR이 한국 소비자에게 판 것이 됩니다. 그러면 개발자 매출 전체가 외국법인 상대 공급이 되어 33조②1호 영세율 후보가 되고, 한국 소비자 VAT는 MoR 몫입니다. 이 구조는 MoR이 진짜 재판매자(merchant of record)라는 계약을 전제로 합니다. 대금을 **외국환은행 계좌로 바로 받아야(wire)** 하고, PayPal·Payoneer를 거치면 영세율이 막힐 수 있습니다. [세무사 확인]
- 따라서 세무 서류만 보면, MoR + 은행 직접 정산이 "전액 영세율 한 줄"이라 Store 경로(국내/국외 구분과 Microsoft 징수분 처리)보다 단순할 수 있습니다. 다만 이것은 해석에 기댄 추론입니다.
- 환산 기준이 출처마다 다릅니다. 2013 해석은 "정산일(공급시기) 기준환율", watax는 "입금일 기준환율". 부가세(공급시기)와 소득세(입금일) 기준이 다를 수 있으니 [세무사 확인].

### Gaps
- 2019 기재부 해석(미등록 개발자 → 앱마켓 간편사업자)이 Microsoft Store에도 그대로 적용되는지, 등록 개발자의 한국 매출에서 Microsoft가 VAT를 떼는지(Partner Center 보고서의 세금 열) 확인하지 못했습니다.
- 시행령 제33조②1호 원문(정보통신업 안에서 뉴스제공업 등 제외 범위, 소프트웨어 개발·공급업 포함 여부)은 law.go.kr이 동적 페이지라 직접 열지 못했습니다. 바목(정보통신업)은 watax 인용에 기댑니다.
- MoR 정산을 Payoneer로 받을 때 영세율이 되는지에 대한 2025~2026 예규는 찾지 못했습니다.

---

## Q6. 종합소득세(사업소득 vs 기타소득)와 직장인 겸업

### Takeaway
플랫폼에서 반복적으로 받는 판매 대금은 **사업소득**이고, 다음 해 **5월에 근로소득과 합산해 종합소득세를 신고**합니다. 2월 회사 연말정산은 근로소득만 다룹니다. 직장인이 사업자등록을 해도 세무서가 회사에 알리지는 않습니다. 다만 **보수 외 소득이 연 2,000만원을 넘으면 건강보험 소득월액보험료**가 따로 나옵니다(고지서는 본인에게 감). 해외 플랫폼은 한국 세금을 원천징수하지 않으므로 국내 프리랜서처럼 "3.3% 원천징수 후 5월 정산"이 되지 않습니다.

### Cited Findings
- "플랫폼에서 반복적으로 받는 광고비·수수료·콘텐츠 판매 대금은 사업소득". 신고는 다음 해 5월 1~31일, 근로소득 등 다른 종합소득과 합산 — [watax.kr](https://www.watax.kr/income-tax/adsense-platform-foreign-income-tax-zero-rate-guide)
- "2월 회사 연말정산은 근로소득만 다루고, 5월 신고에서 비로소 두 소득이 합쳐지는 구조". 사업자등록 자체는 회사에 자동 통보되지 않음. 소득월액보험료 고지서는 "회사 급여 담당 부서로 보내지는 않습니다". 직원을 고용하거나 4대보험이 이중으로 잡히면 회사에 알려질 수 있음(2026-08-19) — [rushmac.com](https://rushmac.com/employee-side-business-registration/) **[2차]**
- 건강보험: 사업소득(순이익)이 연 2,000만원을 넘으면 건보료 추가 — [makewiselife](https://makewiselife.com/%EC%A7%81%EC%9E%A5%EC%9D%B8-%EC%82%AC%EC%97%85%EC%9E%90%EB%93%B1%EB%A1%9D-%EA%B2%B8%EC%97%85/) **[2차: 검색 요약]**
- 미등록이어도 종합소득세 신고 의무는 있고, 간편장부대상자(신규 또는 직전 수입 7,500만원 미만)는 등록 없이 간편장부로 신고하는 사례도 있음 — [a-ha 질문](https://www.a-ha.io/questions/4ec3535874b550b4a509028344658dc5) **[2차, Q&A]**
- 프리랜서(미등록)는 국내 지급처가 3.3%를 원천징수하고, 등록하면 감가상각·창업중소기업세액감면 등을 쓸 수 있음. 수입 7,500만원(성실신고 기준) 이상이면 법인 전환을 검토 — [택스워치 2024-07-19](https://www.taxwatch.co.kr/article/tax/2024/07/19/0002)
- 앱마켓이 3.3%를 떼고 사업자는 1.1%라는 블로그 주장 — [Hitek Software](https://hiteksoftware.co.kr/blog/registration-of-app-development-business/). **[충돌·신뢰 낮음]** 국외 플랫폼이 한국 소득세를 원천징수한다는 근거는 다른 출처에서 확인되지 않음

### Inferences
- 기타소득(일시·우발 소득)으로 신고할 여지는 작습니다. 상시 판매하는 앱 라이선스는 반복성이 있기 때문입니다.
- 회사 겸업 금지 규정은 세법과 별개입니다(사용자 지시대로 세무 쪽만 다룸). 세무상 회사가 알게 되는 경로는 주로 건보료와 4대보험입니다.

### Gaps
- 미국 원천징수액(Q8)을 한국 종합소득세에서 외국납부세액공제로 빼는 절차는 출처를 확보하지 못했습니다.
- 직장인이 부업으로 창업했을 때 창업중소기업세액감면 대상이 되는지는 확인하지 못했습니다. [세무사 확인]

---

## Q7. 통신판매업 신고가 필요한가 (앱마켓·MoR 경유)

### Takeaway
면제 기준은 **직전 연도 통신판매 거래 50회 미만이거나 간이과세자**입니다(2020년 공정위 고시 개정, 옛 기준 "6개월 20회·1,200만원"은 폐지됨). 앱마켓을 보면, **Google Play는 수익화하는 한국 개발자에게 사업자등록번호와 통신판매업 신고번호를 받고, Apple은 2019-11부터 요구**했습니다. **Microsoft Store가 이를 요구한다는 자료는 찾지 못했습니다.** MoR 경유일 때 개발자가 통신판매업자인지(MoR이 판매자인지)는 해석이 갈리는 대목입니다.

### Cited Findings
- 고시 개정: 거래 횟수 기준을 "최근 6개월 20회 미만"에서 "직전 연도 50회 미만"으로, 거래 규모 기준을 "6개월 1,200만원 미만"에서 "간이과세자인 경우"로 바꿈(2020-05-21 발표) — [뉴시스](https://www.newsis.com/view/NISX20200521_0001032006); [ZDNet Korea](https://zdnet.co.kr/view/?no=20200521103601) **[오래됨 가능이지만 현행 기준]**
- **충돌**: 일부 검색 요약은 여전히 "6개월 20회 또는 1,200만원 미만 면제"라고 함(옛 기준) — [bznav](https://ai.bznav.com/contents/325586) 등. 위 고시 개정이 최신임
- Google Play: 유료 앱이나 인앱 상품을 팔 때만 사업자등록번호, 통신판매업 번호, 신고 기관명 입력이 필요. 신고 처리 2~3영업일, 등록면허세는 연 12,000~40,500원 — [swing2app 문서](https://documentation.swing2app.co.kr/knowledgebase/playstore/manage/ecommerce-business) **[2차]**
- Apple: 2019-11 한국 개발자에게 유료 앱·IAP용 사업자등록번호 또는 통신판매업 신고번호를 요구하고, 열흘 안에 안 내면 정산에 차질이 있다고 경고 — [클리앙 2019-11-05](https://www.clien.net/service/board/cm_app/14249370) **[오래됨 가능]**
- 앱마켓에서만 팔고 소비자와 직접 결제 관계가 없으면 플랫폼이 통신판매업자이고 개발자는 신고 의무가 없을 수 있다는 의견 — [bznav](https://ai.bznav.com/contents/325586); [찾아줘세무사](https://www.findsemusa.com/service/consult/consultView.do?qidx=30054) **[2차, 해석 갈림]**

### Inferences
- Frond가 자체 웹 구매 페이지(MoR 결제창)를 운영하면 "통신판매"의 겉모습을 띱니다. 그래서 간이과세자이거나 직전 연도 50회 미만이 아니면 신고하는 쪽이 안전합니다. 신고비(등록면허세)도 작습니다. [세무사·구청 확인]

### Gaps
- Microsoft Partner Center가 한국 개발자에게 통신판매업 정보를 요구하는지 공식 자료를 찾지 못했습니다.
- MoR(해외 재판매자)을 통한 판매에서 국내 개발자의 전자상거래법상 지위에 대한 공정위 해석은 찾지 못했습니다.

---

## Q8. 외화 수령과 미국 원천징수(W-8BEN, 한·미 조세조약)

### Takeaway
Microsoft Store 정산을 받으려면 **미국 세금 양식(W-8BEN)**이 필수입니다. 원천징수는 **미국 내 판매분에만** 기본 30%로 걸리고, W-8BEN Part II로 조약 세율을 청구합니다(ITIN 불필요). 한·미 조약 제14조는 사용료 **15%**, 다만 "literary, dramatic, musical, or artistic work"의 저작권 사용료는 **10%**입니다. 소프트웨어가 어느 쪽인지 조문에 없으므로 **[세무사 확인]**입니다. 한국에서는 Store 정산을 **은행 송금으로만** 받을 수 있습니다(PayPal 불가). 지급 기준액은 US$50입니다.

### Cited Findings
- "You must fill out United States tax forms to sell any transactable offer or add-ons… regardless of your country/region of residence". 무료 앱만 내면 세금·정산 프로필이 필요 없음. 미국 밖 판매자는 W-8 — [Learn: Set up payout and tax profiles (updated 2026-02-25)](https://learn.microsoft.com/en-us/partner-center/account-settings/set-up-your-payout-account)
- "Withholding applies only to sales that you make into the United States… for most publishers registering outside the United States, the default rate is 30%". W-8BEN Part II로 조약 혜택을 받고, 프로필에 Tax treaty status True와 유효한 만료일이 보여야 함. "A United States Individual Taxpayer Identification Number (ITIN) isn't required" — 같은 문서
- ADA 6(e): Certificate of Foreign Status를 내면 "your services are not provided in the U.S."라고 진술하는 셈. Microsoft는 원천징수하면 영수증을 "solely to the extent within Microsoft's ability" 제공 — [ADA v8.10 PDF](https://cdn-dynmedia-1.microsoft.com/is/content/microsoftcorp/microsoft/store/documents/legal/ada/fy26/MS.Store.ADAv8.10.EN.US.pdf)
- 정산: "Korea (South)"는 Microsoft Store 정산 Yes, PayPal No. "The payment threshold in all cases is USD $50". 송금(wire)은 약 7~10영업일. 환율은 월별 적용하고 보고서에 exchangeRate가 표시됨(updated 2026-05-27) — [Learn: Payout details by region](https://learn.microsoft.com/en-us/partner-center/marketplace-offers/payment-thresholds-methods-timeframes)
- ADA 6(c): 미국 밖 판매자에게는 현지 통화로 줄 수 있고, 은행 수수료와 원천징수에 따라 수령액이 달라짐 — [ADA v8.10 PDF](https://cdn-dynmedia-1.microsoft.com/is/content/microsoftcorp/microsoft/store/documents/legal/ada/fy26/MS.Store.ADAv8.10.EN.US.pdf)
- **한·미 조세조약(1976 서명) 제14조**: (1) 사용료 세율은 총액의 15%를 넘지 않음. (2) "Royalties derived from copyrights, or rights to produce or reproduce any literary, dramatic, musical, or artistic work… may not be taxed… at a rate of tax which exceeds 10 percent". (4)(a) 사용료 정의에 "copyrights of literary, artistic, or scientific works"를 포함(소프트웨어를 따로 적지 않음) — [IRS: US–Korea Income Tax Convention (PDF)](https://www.irs.gov/pub/irs-trty/korea.pdf) **[1976 조약, 개정 없음]**
- 앱 수익을 조약상 사용료로 보고 10% 감면을 받는다는 일반 설명. 다만 Korea의 10%/15% 구분은 분류에 달렸다고 함 — [taxesforexpats](https://www.taxesforexpats.com/country-guides/korea/us-korea-tax-treaty.html); [Apple Developer Forums W-8BEN line 10](https://developer.apple.com/forums/thread/708842) **[2차]**
- 외화 수령: 건당 미화 5천달러를 넘는 해외 **송금(지급)**은 증빙 원칙이고, 무증빙 송금 한도는 2023-07부터 연 10만 달러(전 업권 통합은 이후 개정). 이는 **보내는 쪽** 규정임 — [정책브리핑](https://www.korea.kr/news/policyNewsView.do?newsId=148956081); [은행연합회 외환길잡이](https://exchange.kfb.or.kr/page/exchange02.php)
- **받는 쪽**: "미화 2만 달러를 초과하는 송금을 해외로부터… 받게 된다면 영수 확인서를 제출" — 검색 요약(나무위키 등) **[2차·신뢰 낮음: 현행 외국환거래규정 조문으로 확인 못 함]**

### Inferences
- Frond의 미국 매출이 작으면 원천징수 금액도 작습니다. W-8BEN에서 조약을 청구하지 않으면 30%가 떼이므로 Part II(Article 14) 기재는 해 두는 것이 이득입니다. 10%와 15% 중 어느 것이 맞는지는 세무사에게 묻고, Apple·Google 개발자들이 보통 어떻게 쓰는지 확인할 가치가 있습니다.
- MoR 중 Paddle(영국 법인)은 미국 원천징수 대상이 아닐 가능성이 크고, 미국 법인 MoR(Lemon Squeezy·Polar·Gumroad)은 W-8BEN을 받을 수 있습니다. 원천징수 여부는 출처를 찾지 못했습니다.
- 영세율(Q5) 증빙을 생각하면, Store든 MoR이든 **국내 외국환은행 계좌로 직접 송금받는 것**이 서류상 가장 깔끔합니다.

### Gaps
- Microsoft가 Store 앱 수익을 미국 세법상 royalty로 보는지 business income으로 보는지 명시한 2025~2026 문서는 찾지 못했습니다(Store용 tax-details 옛 페이지는 Marketplace 문서로 통합됨).
- 받는 쪽 외화 영수확인서 기준 금액(2만/5만/10만 달러)이 출처마다 달라 확인이 필요합니다.
- KOTRA가 개인 SW 수출자용으로 낸 안내는 찾지 못했습니다.

---

## Q9. 한국 인디 개발자 커뮤니티·실무 글(2023~2026)

### Takeaway
2023~2026년 글은 주로 Google Play·App Store·애드센스 쪽입니다. **Microsoft Store나 MoR로 한국 개인이 판매한 세무 후기는 매우 드뭅니다.** 공통된 조언은 다섯 가지입니다. 사업자등록(722000), 총액 매출 신고, 해외분 영세율 + 외화 입금 증빙, 국내분 10%, 간이과세 검토입니다. 커뮤니티 일부 주장("정산 전까지 등록 불필요", "앱마켓이 3.3% 원천징수")은 법 문언이나 다른 출처와 어긋납니다.

### Cited Findings
- Threads 글: "lemon squeezy쓰면 돈 찾기전까진 사업자 등록필요없습니다. 정산받으려면 입력해야하지만요" — [Threads @dalgom.bami](https://www.threads.com/@dalgom.bami/post/DLdD8nCy6vq) **[일화, 법 문언(사업 개시일 20일)과 충돌]**
- 매쉬업벤처스(2025-03-16): Lemon Squeezy·Paddle 같은 MoR은 "법인 설립 없이 글로벌 결제와 정산이 가능". 한국 법인의 Stripe 가입 제한을 호주 개인 Stripe로 우회한 사례, Payoneer → 한국 계좌 이체 시 환율 약 1.2% 불리 — [매쉬업벤처스](https://www.mashupventures.co/contents/global-payment-solutions-for-saas-startups)
- 해외 결제 솔루션 2026 정리: 한국에서 Stripe 직접 가입은 제한, MoR 사용을 권장 — [인블로그 2026](https://inblog.ai/ko/blog/stripe-in-korea) **[2차]**
- "해외 고객에게 소프트웨어를 파는 것은 수출이므로 영세율… 간이과세자라도 낼 부가세는 0원" — [quasa.io: Gumroad vs Lemon Squeezy 한국 판매자](https://quasa.io/ko/media/gumroad-vs-lemon-squeezy-hangug-gyeoljeneun-gibon-susuryoro-ggeutnaji-anhneunda) **[2차, 영세율 요건(외국환은행)은 언급 없음]**
- 클리앙: 앱스토어 유료 앱 1위 후기 등 수익 사례 — [클리앙](https://www.clien.net/service/board/park/18355746). Apple의 사업자등록 요구(2019) 반응 — [클리앙](https://www.clien.net/service/board/cm_app/14249370) **[오래됨 가능]**
- OKKY: 앱용 사업자등록 질문 — [OKKY](https://okky.kr/articles/687740) **[내용 미열람]**
- 세무사 칼럼(2022): 앱 매출은 플랫폼 수수료를 포함한 총액으로 신고 — [택스워치](https://www.taxwatch.co.kr/article/tax/2022/05/16/0002)

### Inferences
- 실무 글이 앱마켓(대리인 구조) 위주라서, MoR(재판매자 구조)의 영세율 요건(33조②1호, 외국환은행 원화)은 커뮤니티에서 자주 빠집니다. 한국 개인이 MoR로 시작할 때 가장 놓치기 쉬운 지점입니다.

### Gaps
- 디스콰이엇·브런치에서 "Microsoft Store 수익 세금 신고" 후기는 찾지 못했습니다.
- Steam(Valve)으로 판 한국 개인 개발자의 세무 후기는 이번 범위에서 확인하지 못했습니다.
