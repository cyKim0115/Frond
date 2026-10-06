# Microsoft Store 커머스로 "무료 앱 + 선택적 1회 해금"을 파는 방법 (Frond, Tauri 2 MSIX, 2026-10 기준)

조사일 2026-10-06. 전제: Frond는 MSIX로 Store에 낸다(Store 커머스는 MSIX 전용 — [Learn: distribute Win32 app](https://learn.microsoft.com/en-us/windows/apps/distribute-through-store/how-to-distribute-your-win32-app-through-microsoft-store), 앞선 조사 `Frond 윈도우 앱 배포 방법/ms_store_submission.md` §7). 앞선 조사와 겹치는 계정·MSIX 패키징 내용은 반복하지 않았다.
범위 밖(다른 조사자): 제3자 결제(Paddle 등) 상세, 한국 국내 세법·사업자 등록, 경쟁 앱 UX.
날짜 표기: Learn 문서는 `ms.date`(작성)/`updated_at`(최종 수정). 2025년 이전 자료는 **[오래됨 가능]**.

## 1. Partner Center 모델 선택 — 무료 앱 + Durable add-on vs 유료 앱 + 무료 체험 vs consumable/subscription, 그리고 가격 설정

### Takeaway
"영원히 무료 + 선택적 1회 해금"에는 **(a) 무료 앱 + Durable add-on(Product lifetime = Forever)**이 가장 맞는다. Durable은 "typically purchased only once … often unlock additional functionality"이고 기본 수명이 Forever라 한 번 사면 끝이다. (b) 유료 앱 + Unlimited trial도 기술적으로 가능하지만 Store상 "유료 앱"이 되고 정책상 '체험'의 범위·조건을 밝혀야 해서 "무료 앱"이라는 포지셔닝과 어긋난다. (c) consumable·subscription은 1회 해금 모델과 맞지 않는다. 가격은 USD 0.99부터의 price tier(60여 통화 환산)로 고르고, 한국 시장만 tier 또는 **KRW 자유 입력 가격**으로 덮어쓸 수 있으며, 할인(sale)·가격 변경 예약은 새 submission으로 한다.

### Cited Findings
**add-on 유형**
- 유형 4가지: Durable("persists for the lifetime that you specify … By default, durable add-ons never expire, in which case they can only be purchased once"), Developer-managed consumable, Store-managed consumable, Subscription("customer continues to be charged at recurring intervals") — [Learn: In-app purchases and trials (updated 2025-11-27)](https://learn.microsoft.com/en-us/windows/uwp/monetize/in-app-purchases-and-trials)
- "Select **Durable** … if your add-on is typically purchased only once. These add-ons often unlock additional functionality in an app. The default **Product lifetime** for a durable add-on is **Forever** … You can set the Product lifetime to a different duration … (with options from 1 to 365 days)" — [Learn: Create an add-on submission (ms.date 2026-08-05, updated 2026-08-17)](https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/add-on/create-app-submission)
- 같은 문서: "You can't change the product type after you save this page"; Product ID는 부모 제품 안에서 고유, "You can't change or delete an add-on's product ID after you publish it", 최대 100자, `< > * % & : \ ? + ,` 금지, 고객에게 안 보임. "In most cases, the certification process takes about an hour." — [Learn: Create an add-on submission](https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/add-on/create-app-submission)
- Store-managed consumable·Subscription은 부모 제품을 먼저 게시(제출)해야 add-on을 게시할 수 있다(작업 시작은 언제든 가능). Durable에는 이런 문구가 없음 — 같은 문서
- 패키지가 딸린 durable(DLC)은 "only available to a restricted set of developers" — [Learn: In-app purchases and trials](https://learn.microsoft.com/en-us/windows/uwp/monetize/in-app-purchases-and-trials)

**무료 체험(Trial) 모델**
- Free trial 드롭다운 기본값은 **No free trial**. 종류: **Time-limited**(1·7·15·30일, "You can limit features … or you can let customers access the full functionality during that period") / **Unlimited**("let customers access your app for free indefinitely. You'll want to encourage them to purchase the full version, so make sure to add code to exclude or limit features in the trial version"). 체험 제공 시작·종료 일시 지정 가능 — [Learn: Set app pricing and availability for MSIX app (updated 2026-08-17)](https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msix/price-and-availability)
- 체험 구현 가이드: "Your trial app can be full-featured, but have in-app ad banners where the paid-for version doesn't. Or, your trial app can disable certain features, or display regular messages asking the user to buy it." 체험이 앱 실행 전에 만료되면 "your app won't launch. Instead, users see a dialog box that gives them the option to purchase" — [Learn: Implement a trial version of your app (ms.date 2017-08-25, updated 2025-06-10) **[본문 오래됨 가능]**](https://learn.microsoft.com/en-us/windows/uwp/monetize/implement-a-trial-version-of-your-app)
- 체험 앱을 정식으로 사는 것도 같은 `RequestPurchaseAsync`(앱의 Store ID)로 처리 — "if the user currently has a trial version of the app, you can use this process to purchase a full license" — [Learn: Enable in-app purchases of apps and add-ons (updated 2025-06-10)](https://learn.microsoft.com/en-us/windows/uwp/monetize/enable-in-app-purchases-of-apps-and-add-ons)

**가격 tier·시장별 가격(KRW)**
- 앱 Base price는 Free 또는 price tier. "Price tiers start at 0.99 USD, with additional tiers available at increasing increments (1.09 USD, 1.19 USD, and so on)." "These price tiers also apply to add-ons. Each price tier has a corresponding value in each of the more than 60 currencies offered by the Store." 환산표는 Partner Center의 **view conversion table**(CSV 다운로드, tier ID 포함) — [Learn: Set app pricing for MSIX app (ms.date 2025-08-21, updated 2026-08-17)](https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msix/schedule-pricing-changes)
- 시장별 덮어쓰기: "override the base price for specific markets, either by selecting a new price tier or by entering a free-form price in the market's local currency." 단일 시장은 "enter any price you like (within a minimum and maximum range)", **시장 그룹에는 자유 가격 불가**(tier만). "If you enter a free-form price, that price will not be adjusted (even if conversion rates change)" — 같은 문서
- "Microsoft does not alter the product pricing you set without your approval. You're in charge of making sure the prices match the current market situations, including currency exchange rates." 기존 제품은 환율 갱신이 가격을 바꾸지 않음. "the price tier you select may include sales or value-added tax that your customers must pay" — 같은 문서
- add-on 가격: Stop acquisition이 아니면 base price 필수, 유료면 tier("starting at $0.99 USD"). 구독 add-on은 게시 후 가격 인상 불가 — [Learn: Set pricing and availability for add-on (updated 2026-08-17)](https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/add-on/price-and-availability)
- ADA 6(a): 가격은 Microsoft가 정한 price point 중에서 고르고, Microsoft는 "that price (or its reasonable equivalent in local currency)"를 청구 — [App Developer Agreement v8.11 (게시 2026-03-17, 발효 2026-04-17)](https://go.microsoft.com/fwlink/?linkid=528905)

**할인·가격 변경**
- Sale: "lower price tier or with a percentage-based discount", 대상 Everyone / Owners of(내 다른 앱 보유자) / Known user group, 시장 그룹 선택, 시작·종료 일시(UTC/Local). Store에 취소선 가격 표시(가격 변경 예약은 할인 표시 없음). 게시된 제품도 **새 submission**이 필요. 구독 add-on은 sale 불가. 프랑스는 "Base price … must be the lowest price that you have charged in the last 30 days" — [Learn: Put apps and add-ons on sale (ms.date 2022-10-30, updated 2025-08-21)](https://learn.microsoft.com/en-us/windows/apps/publish/put-apps-and-add-ons-on-sale)
- 정책 10.8.7: 할인 포함 모든 가격은 법규(FTC Guides Against Deceptive Pricing 등) 준수, "Not be priced irrationally high relative to the features and functionality" — [Microsoft Store Policies v7.20 (게시 2026-09-15, 발효 2026-10-22)](https://learn.microsoft.com/en-us/windows/apps/publish/store-policies)

### Inferences
- **(a) 무료 + Durable(Forever)** 권장. 앱은 Pricing=Free, 체험 없음. add-on 하나("Frond Supporter" 등)를 Durable로 만들고 가격 tier를 고른 뒤, 한국 시장만 KRW 자유 가격(예: ₩9,900)으로 덮어쓰는 구성이 가능하다. 나중에 혜택이 늘어도 같은 add-on의 권리로 묶으면 기존 구매자 처리가 단순하다(add-on 하나 = 라이선스 하나).
- "후원 금액 선택"을 원하면 가격만 다른 Durable add-on을 여러 개 만들고 앱은 "그중 하나라도 보유 시 해금"으로 판정하면 된다(문서상 금지 조항 없음 — 추론).
- **(b) 유료 + Unlimited trial**은 Store 목록에 가격이 붙고 "체험판"으로 표시되는 구조라(Typora 같은 유료 앱 모델) "무료 앱" 이미지와 맞지 않고, 정책 10.8.4의 "scope and terms of any trial experiences" 고지 부담도 생긴다. Time-limited trial은 만료 후 앱이 아예 실행되지 않으므로 "무료로 계속 사용" 요구와 충돌한다.
- **(c)** Store-managed consumable·subscription은 반복 결제·잔액 관리용이라 1회 해금에는 과하다. 구독은 게시 후 가격 인상도 불가.
- Product ID는 게시 후 못 바꾸고 코드에서 `InAppOfferToken`으로 쓰이므로 처음부터 영구 이름(예: `frond_supporter`)으로 정한다.

### Gaps
- KRW tier 실제 값(예: USD 4.99 tier가 몇 원인지)은 Partner Center 로그인 후 환산표에서만 보인다. 공개 문서에서 찾지 못함.
- 무료 앱 + add-on일 때 Store 상세 페이지에 "In-app purchases"/"Offers in-app purchases" 표기가 자동으로 붙는지 공식 문서 확인 못 함(Store 웹 목록에 "$6.69 Offers in app purchases" 같은 표기가 보인다는 검색 스니펫만 있음 — [Microsoft Store web listing](https://www.microsoft.com/en-us/store/new-and-rising/apps/pc?price=5to10), [Support: Make an in-app purchase in Microsoft Store](https://support.microsoft.com/en-us/accounts-billing/make-an-in-app-purchase-in-microsoft-store)).
- 자유 입력 가격의 KRW 최소·최대 범위는 문서에 수치가 없다.

## 2. Windows.Services.Store API를 패키지된 Win32(Tauri/Rust)에서 쓰는 법

### Takeaway
진입점은 `StoreContext::GetDefault()` → `GetAppLicenseAsync()`(앱·add-on 라이선스, 오프라인이면 **캐시값**) / `GetStoreProductsAsync()`·`GetAssociatedStoreProductsAsync()`(상품 정보·가격) / `RequestPurchaseAsync(storeId)`(구매 UI) / `OfflineLicensesChanged`(라이선스 변경 이벤트)다. 데스크톱 앱은 **`IInitializeWithWindow::Initialize(hwnd)`로 소유 창을 지정하지 않으면 "inaccurate data or errors"**가 나고, `RequestPurchaseAsync`는 **UI 스레드에서 호출**해야 하며(아니면 0x80070578), **관리자 권한(elevated) 앱에서는 IAP 미지원**이다. Rust에서는 `windows` 크레이트의 `Services_Store` 기능으로 같은 API를 그대로 부르며, 이미 이를 감싼 Tauri v2 플러그인(`tauri-plugin-iap`)이 있다. 패키지 identity가 없는 NSIS 빌드에서는 Store API가 동작하지 않으므로 `GetCurrentPackageFullName`으로 먼저 판정해 Store 모듈을 끈다.

### Cited Findings
**네임스페이스·기본 제약**
- `Windows.Services.Store`(1607+) 권장. 구형 `Windows.ApplicationModel.Store`는 "not supported in Windows desktop applications that use the Desktop Bridge". "In-app purchase functionality is not currently supported in elevated applications." — [Learn: In-app purchases and trials](https://learn.microsoft.com/en-us/windows/uwp/monetize/in-app-purchases-and-trials)
- 단일 사용자 앱은 `GetDefault`, 다중 사용자 앱은 `GetForUser(user)` — 같은 문서
- Store ID(12자, 예 `9NBLGGH4R315`)와 add-on Product ID는 다르다. Product ID는 `StoreProduct.InAppOfferToken`·`StoreLicense.InAppOfferToken`으로 노출되지만 "most operations … use the Store ID of an add-on instead of the product ID" — 같은 문서
- `Windows.Services.Store`에는 클라이언트 영수증 API가 없고, 서버 검증은 Microsoft Store collection REST API(Azure AD 인증) — 같은 문서

**데스크톱 앱의 소유 창(HWND) 지정**
- "if you have a Win32 desktop application … your application must configure the StoreContext object to specify which application window is the owner window for modal dialogs … If a desktop application does not configure the StoreContext object …, this object will return inaccurate data or errors." C++은 `shobjidl.h`의 `IInitializeWithWindow`로 캐스팅 후 `Initialize(hwnd)`, .NET 6+는 `WinRT.Interop.InitializeWithWindow.Initialize(context, hwnd)` — [Learn: In-app purchases and trials §Using the StoreContext class with the Desktop Bridge](https://learn.microsoft.com/en-us/windows/uwp/monetize/in-app-purchases-and-trials)
- `Windows.Services.Store.StoreContext`는 `IInitializeWithWindow` 구현 클래스 목록에 있음 — [Learn: Display WinRT UI objects that depend on CoreWindow (ms.date 2023-02-28, updated 2026-06-25)](https://learn.microsoft.com/en-us/windows/apps/develop/ui-input/display-ui-objects)
- `RequestPurchaseAsync`: "**This method must be called on the UI thread.**" / "In-app purchase functionality is not supported in elevated applications." 예외 0x80070578(ERROR_INVALID_WINDOW_HANDLE)은 UI 스레드가 아니거나, Desktop Bridge 앱에서 소유 창을 지정하지 않았다는 뜻 — [Learn API: StoreContext.RequestPurchaseAsync (updated 2026-04-30)](https://learn.microsoft.com/en-us/uwp/api/windows.services.store.storecontext.requestpurchaseasync)
- MFC Win32 사례(Q&A): `GetActiveWindow()` HWND로 `IInitializeWithWindow::Initialize` 후 해결. 사용자 보고로 "Full Trust apps … Works correctly / AppContainer apps (Partial Trust): Fails with 0x80070578" — [Microsoft Q&A 2105663](https://learn.microsoft.com/en-us/answers/questions/2105663/issues-with-requestpurchaseasync-in-mfc-c-applicat)

**라이선스·상품 조회·구매 결과**
- `GetAppLicenseAsync` → `StoreAppLicense`(IsActive, IsTrial), durable add-on 라이선스는 `AddOnLicenses`("licenses for durable add-ons … for which the user has an entitlement") — [Learn: Get license info (updated 2025-06-10)](https://learn.microsoft.com/en-us/windows/uwp/monetize/get-license-info-for-apps-and-add-ons)
- **오프라인**: "If this method is called while the device is offline, it returns the cached value of the current licenses on the device. The OfflineLicensesChanged event is raised when the status of the app's license changes." — [Learn API: StoreContext.GetAppLicenseAsync (updated 2026-04-30)](https://learn.microsoft.com/en-us/uwp/api/windows.services.store.storecontext.getapplicenseasync)
- 라이선스 변경 처리: 초기화 때 `GetAppLicenseAsync` + `OfflineLicensesChanged` 구독, 이벤트에서 다시 조회 — [Learn: Implement a trial version](https://learn.microsoft.com/en-us/windows/uwp/monetize/implement-a-trial-version-of-your-app)
- `GetStoreProductsAsync(kinds, storeIds)`는 "regardless of whether the add-ons are currently available for purchase", `GetAssociatedStoreProductsAsync(kinds)`는 "currently available for purchase"만. kinds 문자열 `"Durable"`, `"Consumable"`, `"UnmanagedConsumable"`. 보유 add-on은 `GetUserCollectionAsync`. 실패 시 `ExtendedError`("The user may be offline or there might be some other server failure") — [Learn: Get product info (updated 2025-06-10)](https://learn.microsoft.com/en-us/windows/uwp/monetize/get-product-info-for-apps-and-add-ons)
- `StorePurchaseStatus`: Succeeded / AlreadyPurchased / NotPurchased("The user may have cancelled") / NetworkError / ServerError — [Learn: Enable in-app purchases](https://learn.microsoft.com/en-us/windows/uwp/monetize/enable-in-app-purchases-of-apps-and-add-ons)

**Rust(`windows` 크레이트)**
- windows-rs 문서(crate 0.62.2)의 `StoreContext`: `GetDefault() -> Result<StoreContext>`, `GetForUser`, `GetAppLicenseAsync() -> Result<IAsyncOperation<StoreAppLicense>>`, `GetStoreProductsAsync(productkinds, storeids)`(`Param<IIterable<HSTRING>>`), `GetAssociatedStoreProductsAsync`, `GetStoreProductForCurrentAppAsync`, `RequestPurchaseAsync(&HSTRING)`, `RequestPurchaseByInAppOfferTokenAsync(&HSTRING)`, `OfflineLicensesChanged(handler) -> Result<i64>`, `RemoveOfflineLicensesChanged` — [windows-docs-rs: StoreContext](https://microsoft.github.io/windows-docs-rs/doc/windows/Services/Store/struct.StoreContext.html)
- Frond 현재 의존성: `windows = "0.62"`(features `Win32_Foundation`, `Win32_Security`, `Win32_System_Com`, `Win32_System_Threading`, `Win32_UI_Shell`, `Win32_UI_WindowsAndMessaging`), Cargo.lock은 `windows 0.62.2` + `windows-future 0.3.2` — 로컬 `src-tauri/Cargo.toml`, `Cargo.lock`
- `windows-future 0.3.2`의 `IAsyncOperation`: `join()`("Waits for the IAsyncOperation<T> to finish"), `when()`(완료 콜백), `ready()`, `spawn()`; **`IntoFuture` 구현 → `.await` 가능**(`Output = Result<T, Error>`). `get()`은 없음 — [docs.rs windows-future 0.3.2 IAsyncOperation](https://docs.rs/windows-future/0.3.2/windows_future/struct.IAsyncOperation.html). 최신판은 0.100.0(2026-09-03) — [docs.rs windows-future](https://docs.rs/windows-future/latest/windows_future/)
- Luminous(Tauri 음악 플레이어) 계획: `src-tauri/src/addons/` 모듈, "Enables the `Services_Store` feature on the Windows crate", 메인 창 HWND로 `IInitializeWithWindow`, `GetAssociatedStoreProductsAsync`·`RequestPurchaseAsync`, `#[cfg(windows)]` 아닌 플랫폼은 `Unavailable`, **패키지 여부를 먼저 probe**, 디버그 전용 가짜 entitlement provider — [esoltys/luminous#1414](https://github.com/esoltys/luminous/issues/1414)
- **tauri-plugin-iap**(Choochmeque, MIT, GitHub 81★/21 fork): Tauri v2 IAP 플러그인, iOS·Android·macOS·**Windows(Microsoft Store, StoreContext)**. JS API `getProducts`·`purchase`·`restorePurchases`·`getProductStatus`·`consumePurchase`·`onPurchaseUpdated`. 요구: "App must be associated with Microsoft Store and signed for Store submission" — [Choochmeque/tauri-plugin-iap](https://github.com/Choochmeque/tauri-plugin-iap); 포크 [stippi/tauri-plugin-iap](https://github.com/stippi/tauri-plugin-iap)
  - 그 `src/windows.rs`: `context.cast::<IInitializeWithWindow>()?; init.Initialize(hwnd)?`(HWND는 Tauri 창 `window.hwnd()`), `GetAppLicenseAsync`·`AddOnLicenses`·`GetAssociatedStoreProductsAsync`·`RequestPurchaseAsync`·`ReportConsumableFulfillmentAsync` 사용, `async fn` 안에서 `.and_then(|op| op.join())`으로 대기, **패키지 identity 검사 없음**, `Succeeded | AlreadyPurchased → Purchased` — [tauri-plugin-iap src/windows.rs](https://raw.githubusercontent.com/Choochmeque/tauri-plugin-iap/main/src/windows.rs)
- 다른 Tauri 결제 크레이트 `tauri-plugin-purchases`도 있으나 Windows 지원 여부 미확인 — [docs.rs tauri_plugin_purchases](https://docs.rs/tauri-plugin-purchases/latest/tauri_plugin_purchases/)

**패키지 identity가 없을 때(NSIS 빌드)**
- "`Windows.Services.Store` flatly refuses to do anything inside an ordinary unpackaged Win32 exe (`APPMODEL_ERROR_NO_PACKAGE`)", 판정은 "`GetCurrentPackageFullName()` (a synchronous, side-effect-free Win32 call, no WinRT involved)" — [AdamFull/nx2dm-store (C++ 스토어 추상화 계층)](https://github.com/AdamFull/nx2dm-store)
- `GetCurrentPackageFullName` 반환 `APPMODEL_ERROR_NO_PACKAGE` = "The process has no package identity." (Kernel32, Win8+) — [Learn API: GetCurrentPackageFullName](https://learn.microsoft.com/en-us/windows/win32/api/appmodel/nf-appmodel-getcurrentpackagefullname)
- 패키지는 있지만 Store가 모르는 앱(Partner Center 앱과 연결 안 됨)이면 `ExtendedError` = **0x803F6107** "the Store doesn't have any knowledge about the app" — [Learn: In-app purchases and trials §Test](https://learn.microsoft.com/en-us/windows/uwp/monetize/in-app-purchases-and-trials)
- DesktopBridge 샘플: 일반 디버그 실행에선 "the Store API calls will NOT work until you run your app in the context of an .appx package" — [microsoft/DesktopBridgeToUWP-Samples StoreSample](https://github.com/microsoft/DesktopBridgeToUWP-Samples/tree/master/Samples/StoreSample)
- **충돌(품질 낮음)**: 2023 Q&A의 익명 답변은 "If your app is packaged as MSIX from a exe file … you will not be able to use the feature in the Store"라고 했으나, 다른 답변과 Learn 문서는 Desktop Bridge(=패키지된 Win32) 앱이 `StoreContext`를 쓸 수 있다고 한다 — [Microsoft Q&A 1280704 (2023-05) **[오래됨 가능]**](https://learn.microsoft.com/en-us/answers/questions/1280704/win32-desktop-app-how-to-use-addon-subscription-(n); [Learn: In-app purchases and trials](https://learn.microsoft.com/en-us/windows/uwp/monetize/in-app-purchases-and-trials)

### Inferences
- **Cargo 기능 추가(추정, 크레이트 명명 규칙 기준)**: `Services_Store`(Luminous가 명시), `Foundation`·`Foundation_Collections`(`IIterable<HSTRING>`·`AddOnLicenses`의 `IMapView`), 패키지 판정용 `GetCurrentPackageFullName`이 든 Win32 모듈 기능(예 `Win32_Storage_Packaging_Appx`) 또는 `ApplicationModel`(`Package::Current()`). `IInitializeWithWindow`는 이미 켜진 `Win32_UI_Shell`에 있다. 정확한 기능명은 빌드로 확인 필요.
- **흐름 초안**: 시작 시 ① `GetCurrentPackageFullName`이 `APPMODEL_ERROR_NO_PACKAGE`면 Store 모듈 비활성(NSIS판) → ② 아니면 `StoreContext::GetDefault()` + 메인 창 HWND로 `IInitializeWithWindow::Initialize` → ③ `GetAppLicenseAsync().await`로 `AddOnLicenses`를 훑어 `InAppOfferToken == "frond_supporter"`이고 `IsActive`인 항목이 있으면 해금 → ④ `OfflineLicensesChanged` 구독해 재조회 → ⑤ 구매 버튼은 `RequestPurchaseAsync(addOnStoreId)`를 **메인 스레드에서 시작**(Tauri `run_on_main_thread`)하고 결과 대기는 비동기 태스크에서. 결과가 Succeeded/AlreadyPurchased면 라이선스를 다시 읽어 확정(구매 결과만 믿지 말 것).
- **UI 스레드 요건과 tauri-plugin-iap의 차이**: 플러그인은 async 커맨드(보통 tokio 워커 스레드)에서 `.join()`으로 기다린다. 문서는 "must be called on the UI thread"라 명시하므로, Frond 직접 구현 시에는 메인 스레드 시작을 기본으로 하고 실기에서 확인하는 편이 안전하다. 메인 스레드에서 `.join()`으로 막으면 구매 대화상자(모달)가 메시지 루프를 못 받아 멈출 위험이 있으므로 `.when()`/`.await`를 쓴다(추론, 실측 필요).
- **관리자 권한**: Frond에는 `elevation.rs`(관리자 권한 감지)가 있다. 관리자 실행 시 IAP가 지원되지 않으므로 구매 버튼을 숨기고 안내 문구를 띄운다. 이미 산 라이선스 조회(`GetAppLicenseAsync`)가 elevated에서 되는지는 문서에 없다(Gaps).
- **오프라인**: 라이선스는 캐시값으로 판정되므로 "인터넷 없으면 해금 풀림"을 걱정할 필요는 적다. 그래도 마지막 판정 결과를 로컬에 저장해 Store 호출 실패(ExtendedError) 때 직전 상태를 유지하는 이중 장치를 두는 게 실무적으로 안전하다(로컬 값은 위조 가능하므로 '유예'용으로만).
- **다중 사용자**: 데스크톱 앱은 실행한 사용자 컨텍스트이므로 `GetDefault`로 충분. Store 라이선스는 Windows에 로그인한 사용자의 Store MSA에 묶인다(문서상 "for the current user").
- 직접 구현 vs 플러그인: 필요한 API가 5개 남짓이라 `windows` 크레이트로 직접 쓰는 것이 의존성·스레드 제어 면에서 낫고, tauri-plugin-iap 코드는 참고 구현으로 쓰기 좋다.

### Gaps
- `AddOnLicenses` 딕셔너리의 키 형식(add-on Store ID인지 SKU Store ID인지)을 문서에서 확인하지 못했다 — `InAppOfferToken`으로 비교하면 우회 가능.
- 오프라인 캐시 라이선스가 얼마나 오래 유효한지 공식 수치 없음. **충돌**: 2017 xplorer² 블로그는 Store 라이선스 확인에 "a live internet connection, not just the first time but every time"가 필요했다고 썼다 — API 문서(오프라인이면 캐시값 반환)와 다르다 — [zabkat xplorer² blog (2017-02-21) **[오래됨 가능]**](https://www.zabkat.com/blog/winrt-win32-store-registration.htm)
- elevated 프로세스에서 `GetAppLicenseAsync`(조회만)가 동작하는지 불명.
- `IInitializeWithWindow`를 설정한 상태에서 비UI 스레드 호출이 실제로 실패하는지(tauri-plugin-iap 방식) 실측 자료 없음.

## 3. 테스트 — 공개 전 add-on을 시험하는 방법과 함정

### Takeaway
`Windows.Services.Store`에는 시뮬레이터가 없다. **앱을 Store에 실제로 게시(비공개 가능)**하고, **개발 기기에 Store에서 한 번 설치·실행**해 라이선스를 받은 뒤, 같은 identity로 로컬 빌드를 돌려 시험하는 것이 공식 절차다. 비공개는 **Private audience**(지정한 MSA만 보임) 또는 "not discoverable"로 하고, add-on은 "Hidden in the Store → Available for purchase from within the parent product only"로 숨길 수 있다. 무료 테스트 결제 수단은 공식적으로 확인되지 않았고, 대신 **promotional code**로 add-on을 무료로 받을 수 있다.

### Cited Findings
- "you must publish your app to the Store and download the app to your development device to use its license for testing." 절차: ① WACK 최소 요건 충족 후 제출·인증 통과("You can configure your app so it is not discoverable in the Store while you test it", package flight 설정 주의) ② add-on 생성 ③ VS의 **Associate App with the Store**로 프로젝트와 Partner Center 앱 연결(안 하면 0x803F6107) ④ "install the app from the Store …, run the app once, and then close this app. This ensures that a valid license for the app is installed to your development device." ⑤ 로컬 실행·디버그. "You only need to download the Store version of your app to your development computer once" — [Learn: In-app purchases and trials §Test (updated 2025-11-27)](https://learn.microsoft.com/en-us/windows/uwp/monetize/in-app-purchases-and-trials)
- "The **Windows.Services.Store** namespace does not provide a class that you can use to simulate license info during testing." — 같은 문서
- **Private audience**: 목록이 지정 그룹 외에는 "not be discoverable or available … (even if they were able to type in its Store listing URL)", known user group(MSA 이메일) 필요, 인증 필요한 전용 링크 제공. "If you submit a product with this option set to **Public audience**, you can't choose **Private audience** in a later submission." "if you choose a price other than **Free**, people in your private audience will have to pay that price." package flight로 하위 그룹 배포. private 리뷰는 공개 후에도 목록에 안 실림 — [Learn: Choose visibility options for add-on (updated 2026-07-14)](https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/add-on/visibility-options)
- add-on Discoverability: 기본 "Can be displayed in the parent product's Store listing". 숨김: "**Available for purchase from within the parent product only** … Use this only when the offer is not broadly available, for example during initial periods of internal testing." / "**Stop acquisition** … they can only download it if they owned the product before, or have a promotional code" — 같은 문서
- `GetAssociatedStoreProductsAsync`는 "currently available for purchase"인 add-on만, `GetStoreProductsAsync`는 가용성과 무관하게 반환 → 숨김·미게시 상태 시험에는 Store ID로 `GetStoreProductsAsync`를 쓰는 것이 확실 — [Learn: Get product info](https://learn.microsoft.com/en-us/windows/uwp/monetize/get-product-info-for-apps-and-add-ons)
- add-on 인증은 "In most cases … about an hour" — [Learn: Create an add-on submission](https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/add-on/create-app-submission)
- Promotional Codes(ADA 3(j)): "provide free downloads of your App and In-App Product", 수량·사용 횟수 제한, "You forfeit revenue … if you give out Promotional Codes", 재판매 금지 — [App Developer Agreement v8.11](https://go.microsoft.com/fwlink/?linkid=528905)
- 실무 보고(2017): "There is no way to test the registration logic in a live store listed app. The recommendation is to buy a license (!!)" → 프로모션 코드 사용, Store의 체험 만료 처리가 "broken"이라 "Trial never expires"로 두고 자체 처리 — [zabkat xplorer² blog (2017-02-21) **[오래됨 가능]**](https://www.zabkat.com/blog/winrt-win32-store-registration.htm)
- 실무 보고(Q&A): add-on 조회 문제를 "Store에서 받은 앱 제거 → VS에서 설치"로 해결한 사례(검색 요약 수준) — [Microsoft Q&A 398509](https://learn.microsoft.com/en-us/answers/questions/398509/getassociatedstoreproductsasync-always-returns-err)
- **충돌**: tauri-plugin-iap README는 Windows 테스트에 "Use Microsoft Store sandbox environment", "Windows Dev Center test payment methods"를 쓰라고 하지만, Learn은 시뮬레이터가 없고 실제 게시가 필요하다고만 한다. 비게임 앱용 샌드박스·테스트 결제 수단 공식 문서는 찾지 못함 — [Choochmeque/tauri-plugin-iap](https://github.com/Choochmeque/tauri-plugin-iap) vs [Learn: In-app purchases and trials](https://learn.microsoft.com/en-us/windows/uwp/monetize/in-app-purchases-and-trials)
- 환불: 개발자가 환불·차지백 비용을 부담하고 Microsoft가 "prevailing policies"로 환불 가능(ADA 6(f)) — [ADA v8.11](https://go.microsoft.com/fwlink/?linkid=528905). 소비자 셀프 환불은 "within 14 days … used the title for less than 2 hours"이고 "DLC, season passes, and add-ons are not eligible"라는 보도 — [Windows Central](https://www.windowscentral.com/how-request-microsoft-store-refunds); [Thurrott (2017) **[오래됨 가능]**](https://www.thurrott.com/games/109341/microsoft-offer-refunds-digital-purchases-windows-xbox-stores)

### Inferences
- **Frond 시험 순서(제안)**: (1) Partner Center에서 앱 예약 → MSIX 첫 제출을 **Private audience**(본인 MSA)로 → (2) add-on(Durable) 생성·제출, Discoverability는 처음엔 "Available for purchase from within the parent product only" → (3) 본인 PC에서 Store로 Frond 설치·1회 실행 → (4) 이후 개발 빌드는 manifest `Identity Name/Publisher`를 Partner Center 값과 같게 만들어 `winapp run`(loose layout 등록) 등으로 실행 — VS의 "Associate App with the Store"가 하는 일이 사실상 manifest identity를 맞추는 것이기 때문(추론, 비VS 흐름은 문서에 없음) → (5) 실구매는 프로모션 코드로 무료 획득해 해금 경로 확인, 실제 결제·환불 흐름은 소액 tier로 본인 결제 후 환불 요청으로 한 번 확인.
- Private audience로 첫 제출을 하지 않고 Public으로 내면 되돌릴 수 없으므로, 수익화 기능 시험 전 첫 제출 설정을 신중히 정한다. 단 add-on만 숨길 수도 있어서, 앱 자체는 공개하고 add-on만 "parent product only"로 숨겨 시험하는 경로도 가능하다.
- 앱이 개발 PC에서 라이선스를 못 받으면 0x803F6107(연결 안 됨) vs APPMODEL_ERROR_NO_PACKAGE(패키지 아님)로 원인이 갈리므로, 오류 코드를 로그·진단 화면에 그대로 남기는 것이 디버깅에 유용하다.

### Gaps
- 새 add-on 게시 후 `StoreContext` 조회에 나타나기까지의 전파 지연을 공식 수치로 찾지 못했다("인증 약 1시간"만 확인). Google Play의 "최대 24시간" 같은 문구도 Microsoft에는 없음.
- 비게임 앱이 쓸 수 있는 테스트 계정·테스트 결제 수단(샌드박스) 존재 여부를 공식 문서로 확인하지 못함(Xbox 샌드박스는 게임용).
- loose layout(`winapp run`/`Add-AppxPackage -Register`)으로 등록한 개발 빌드가 Store 설치본의 라이선스를 그대로 읽는지(서명 Publisher 해시 불일치 문제 포함) 1차 자료 없음 — 실측 필요.
- add-on 셀프 환불 가능 여부의 최신(2025–2026) 공식 정책 문서는 확인 못 함.

## 4. 수수료·지급 — 2026 기준 Store Fee, 세금(한국 VAT), 지급 조건, 한국 개인의 세금·지급 프로필

### Takeaway
App Developer Agreement v8.11(2026-04-17 발효) 기준 **비게임 앱과 그 in-app 상품의 Store Fee는 Net Receipts의 15%**(게임 12%, Xbox 콘솔·Windows 8 등 30%), 기프트카드·통신사 결제 건은 **+10% Commerce Expansion Adjustment**. Microsoft는 개발자의 **agent/commissionaire**로 결제·환불·차지백을 처리하고, **한국은 Microsoft-managed 국가**라 한국 고객의 부가세를 Microsoft가 계산·징수·납부한다. 지급은 매월, **최소 USD 50**, 한국은 **은행 송금만(PayPal 불가)**. 유료 add-on을 팔려면 Partner Center에 **미국 세금 양식(비미국인 W-8, 개인은 W-8BEN)과 지급 계좌**를 등록해야 하며, 원천징수는 **미국 내 판매분에만** 적용(기본 30%, 조약 혜택 신청 가능, ITIN 불필요).

### Cited Findings
**수수료(ADA v8.11, 게시 2026-03-17·발효 2026-04-17)**
- 6(b) Store Fee: "i. Fifteen percent (15%) of Net Receipts for any Apps (and any In-App Products in such Apps …)", "ii. Twelve percent (12%) … for any Games", "iii. Thirty percent (30%)" — Xbox 콘솔 앱·게임, 콘솔 in-app 상품, Windows 8/Windows Phone 8 기기 구매 — [ADA v8.11](https://go.microsoft.com/fwlink/?linkid=528905)
- 1(h) Commerce Expansion Adjustment: Microsoft가 추가로 떼는 비율, "(i) 10% for all transactions that are completed by Customers using a gift card or mobile operator billing as their form of payment; or (ii) as specified at http://go.microsoft.com/fwlink/p/?linkid=248127" — 같은 문서
- 1(t) Net Receipts = 고객에게 받은 총액 − Microsoft가 징수해 납부할 sales/use/VAT/GST − 환불·차지백 − 개발자가 Microsoft에 갚을 금액. 1(e) App Proceeds = Net Receipts − Store Fee — 같은 문서
- 5(e): "Purchases made on a third-party commerce engine are not subject to the Store Fee" — 같은 문서. 2026-05 공지도 비게임 앱은 자체 결제로 "retain 100% of revenue" — [Windows Developer Blog 2026-05-07](https://blogs.windows.com/windowsdeveloper/2026/05/07/publish-to-microsoft-store-as-a-company-now-with-free-registration-and-faster-onboarding/)
- 이전 Learn 페이지(2024-07)의 "앱 15%·게임 12%"와 ADA v8.11 수치가 일치 — [Learn: why distribute through Store **[오래됨 가능]**](https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/why-distribute-through-store)

**Microsoft의 역할·세금**
- 4(a): "you appoint Microsoft to act as your agent or commissionaire … you, not Microsoft, are the distributor". Microsoft 커머스 사용 시 Microsoft가 대금 수령, "processing of purchases, returns, and chargebacks", 6(c)에 따라 지급 — [ADA v8.11](https://go.microsoft.com/fwlink/?linkid=528905)
- 6(g): Microsoft 커머스 사용 시 Exhibit A·C에 적힌 국가에서만 sales/VAT 등을 "collect and remit". Exhibit A는 Microsoft-managed 국가 목록을 외부 링크(fwlink 529042)로 지정 — 같은 문서
- 위 링크가 가리키는 세금 페이지(Marketplace와 App Developer Agreement 개발자 공통): **Microsoft-managed 국가에 "South Korea" 포함**. 이 국가들에서 Microsoft는 "agent or commissionaire", "Microsoft assumes responsibility for managing Offer Taxation, including calculating, collecting, and remitting certain taxes", "Microsoft invoices under Microsoft's applicable registration number", 지급액에서 Store 수수료·수수료에 대한 세금·징수 세금·원천징수세를 차감. Reseller 국가는 Brazil, India는 소비자 마켓 Microsoft-managed. Store 수수료 자체에 세금이 붙을 수 있는 나라: Australia·Canada·Mexico·New Zealand·Singapore — [Learn: Tax Responsibilities (ms.date 2026-03-18)](https://learn.microsoft.com/en-us/partner-center/marketplace-offers/tax-details-marketplace) (리다이렉트 경로: [fwlink 529042](http://go.microsoft.com/fwlink/p/?LinkId=529042) → tax-details-for-paid-apps → 이 페이지)
- 같은 페이지: "Microsoft makes no warranties that Microsoft's actions completely satisfy Publisher/Developer obligations in Microsoft-Managed Countries/Regions" — 세무 자문 권고 — 같은 문서
- 6(e): 개발자는 자기 소득세 책임, Store Fee에 붙는 VAT 등 부담, 세금 프로필 정확히 제공. Certificate of Foreign Status 제출 시 "your services are not provided in the U.S."를 진술. 원천징수 필요 시 차감·납부하고 가능하면 영수증 제공, "obtain the lowest tax rates or elimination of such taxes pursuant to the applicable income tax treaties" 협조. 고객 측 원천징수분은 지급액에서 감액 — [ADA v8.11](https://go.microsoft.com/fwlink/?linkid=528905)
- 6(f): 환불·차지백 비용 전액 차감, 지급 후 환불분은 계정에서 차감·상계 — 같은 문서

**지급 조건**
- 6(c): "Payments generally occur on a monthly basis … if they meet the applicable thresholds". 미국 밖이면 "Microsoft may remit payment to you in the local currency of your address for payment, using Microsoft's then current rates". 금융·세금·은행 정보를 유지하지 않으면 "removal of your App or In-App Product from the Store and forfeiture of amounts owed" — [ADA v8.11](https://go.microsoft.com/fwlink/?linkid=528905)
- 지급 국가표: "The payment threshold in all cases is USD $50." **Korea (South): Microsoft Store 지급 Yes, PayPal No.** 도착 소요: PayPal 1영업일, ACH/SEPA 2–3영업일, Wire 7–10영업일. 환율은 매월 계산되어 지급 보고서에 `exchangeRate`·`exchangeRateDate`로 표기 — [Learn: Payout details by region (ms.date 2025-10-22, updated 2026-05-27)](https://learn.microsoft.com/en-us/partner-center/marketplace-offers/payment-thresholds-methods-timeframes) (ADA 6(c)의 지급 기준 링크 [fwlink 2199849](https://go.microsoft.com/fwlink/?linkid=2199849)가 이 페이지로 연결)
- "We typically send payments due by the 15th day of the month" — [Learn: Payout schedules and processes (updated 2026-05-27)](https://learn.microsoft.com/en-us/partner-center/marketplace-offers/payout-policy-details) (Marketplace 중심 문서, Store 앱 전용 일정표는 아님)

**세금·지급 프로필(Partner Center)**
- "You must fill out United States tax forms to sell any transactable offer or add-ons … regardless of your country/region of residence"; 미국 거주 요건자는 W-9, 그 외 W-8. "Withholding applies only to sales that you make into the United States. Sales made into non-US locations aren't subject to withholding." 기본 30%, 조약 국가는 W-8BEN Part II로 감면 신청, "A United States Individual Taxpayer Identification Number (ITIN) isn't required". 조약 적용 시 Tax treaty status = True 표시. 세금·지급 프로필 검증 최대 48시간. 은행 계좌 "Account holder name … exact same name", 지급 통화 선택(은행이 받는 통화인지 확인), "If you only plan to list free offers, you don't need to fill out any tax forms or set up a payout profile." — [Learn: Set up payout and tax profiles (ms.date 2024-08-15, updated 2026-02-25)](https://learn.microsoft.com/en-us/partner-center/account-settings/set-up-your-payout-account) (Marketplace 문서지만 Store 개발자도 같은 Partner Center 설정을 쓴다)
- Store 쪽 FAQ/옛 문서 요약: "You won't be able to submit any paid apps or add-ons until your payout account and tax profile have been completed", 일부 시장 계정은 무료 앱만 가능 — [Learn FAQ: Manage your account (검색 요약)](https://learn.microsoft.com/en-us/windows/apps/publish/faq/manage-your-account); [옛 문서 미러 (검색 요약)](https://docstaging.z5.web.core.windows.net/aleader/notifications-updates/publish/setting-up-your-payout-account-and-tax-forms.html)
- 2026-03 실사례: 첫 유료 앱 제출 시 "You need to update your tax and payout information before you can charge money"가 뜨는데 계정 설정에 추가 버튼이 없음, 지원 티켓 무응답. 답변(AI 생성)은 백엔드 계정 상태 문제로 지원팀 처리 필요라고 봄 — [Microsoft Q&A 5835794 (2026-03-24)](https://learn.microsoft.com/en-us/answers/questions/5835794/unable-to-add-tax-and-payout-information-to-publis)

### Inferences
- **한국 고객 1건 수취액(대략)**: 한국은 Microsoft-managed라 표시가격에 부가세가 포함되고 Microsoft가 납부한다. 부가세율 10%(일반 상식, 이 조사에서 출처 미확인 — 세무 담당 확인)라면 ₩9,900 판매 시 Net Receipts ≈ ₩9,000, Store Fee 15% 차감 후 ≈ ₩7,650(표시가의 약 77%). 미국 판매가 아니므로 미국 원천징수 없음. 기프트카드 결제 건이면 10%p가 더 빠진다.
- **미국 고객 판매분**: W-8BEN Part II로 한·미 조세조약 혜택을 신청하지 않으면 30% 원천징수. 조약 세율·소득 구분(사용료 vs 사업소득)은 세무 담당 조사 범위.
- **USD 50 문턱**: 월 수취액이 USD 50 미만이면 이월된다(문서상 "if they meet the applicable thresholds"). 소규모 후원 모델이면 첫 지급까지 몇 달 걸릴 수 있다.
- **계정 유형 위험**: 개인 계정은 "not in relation to their business, trade, or profession"용이고 정책 10.14는 "any person acting in relation to their trade or profession"에게 회사 계정을 요구한다(5절). 유료 add-on 판매를 반복적·영리적으로 하면 회사 계정 대상이 될 수 있고 개인→회사 전환이 안 되므로, 수익화 전에 계정 유형을 먼저 정하는 것이 중요하다.

### Gaps
- Store 앱 전용 지급 일정(거래 월 → 지급 월)을 명시한 2025–2026 Windows 문서를 찾지 못했다(Marketplace 문서·ADA "monthly"만).
- 한국 개인 계정이 지급 통화로 KRW를 고를 수 있는지, 국내 은행 SWIFT 송금 수수료는 확인 못 함.
- Commerce Expansion Adjustment의 (ii) 국가별 목록(fwlink 248127) 미확인.
- 한·미 조세조약 원천징수율, 한국 내 소득 신고는 범위 밖(다른 조사자).

## 5. 정책 한계 — IAP 관련 조항, 정확한 표시, 업셀 팝업, 제3자 결제 병행

### Takeaway
Store Policies v7.20(2026-10-22 발효)은 **비게임 PC 앱에 Microsoft IAP와 "secure third-party purchase API" 중 선택을 허용**한다(10.8.1). IAP가 있으면 **목록에 IAP 종류와 가격 범위를 밝히고**(10.8.4), ADA도 "prominently disclose … that in-app purchase functionality is available"를 요구한다. **업셀 팝업(nag)을 직접 금지하는 조항은 v7.20에 없다** — 오히려 Microsoft 체험판 가이드는 "display regular messages asking the user to buy it"을 선택지로 든다. 다만 앱은 "fully functional"(10.1.2)이어야 하고, 기능·제한을 정확히 설명(10.1, 10.1.1)하며, 구매를 시작한다는 사실을 분명히 해야 한다(10.8.4). 추가 위험은 **10.14 계정 유형**(영리 판매는 회사 계정)이다.

### Cited Findings
- 정책 버전: v7.20, "Publish date: September 15, 2026", "Effective date: October 22, 2026" — [Microsoft Store Policies](https://learn.microsoft.com/en-us/windows/apps/publish/store-policies)
- 10.1: 메타데이터가 "accurately and clearly reflect the source, functionality, and features of your product". 10.1.1: "accurately describe the functions, features, user experience and any important limitations", "must not in any way attempt to mislead customers", "The value proposition of your product must be clear during the first run experience." — 같은 문서
- 10.1.2: "Your product must be fully functional and must provide appropriate functionality for targeted systems and devices." — 같은 문서
- 10.1.5: "with user consent and after initial download of the primary product, enable acquisition of … Add-ons or extensions … that enhance the functionality of the product." — 같은 문서
- 10.8.1: 게임·Xbox 제품은 Microsoft IAP 의무("including … voluntary donations that result in the user receiving digital goods or services … including but not limited to additional features"). "**Non-game products made available on PC devices may either use a secure third-party purchase API or the Microsoft Store in-product purchase API** for in-app purchases of digital items or services that are consumed or used within the product." Microsoft IAP로 판 디지털 상품은 현금·실물로 교환 불가 — 같은 문서
- 10.8.2: 자발적 기부는 Microsoft payment request API 또는 제3자 API, "However, if the user receives digital goods or services in return, including but not limited to additional features …, you must use the Microsoft Store in-product purchase API instead." 제3자 API 사용 시: 거래 시 결제 제공자 표시·사용자 인증·확인, 매 거래 인증 또는 인앱 거래 끄기 옵션, PCI DSS, 설치 시 결제가 필요하면 앱 안에서(설치 후엔 브라우저로 보낼 수 있음), "You must note the use of a secure third-party purchase API in Partner Center during the submission process." — 같은 문서
  - **해석 충돌**: 10.8.2의 "기능을 주는 후원은 Microsoft IAP를 써야 한다"는 문장과 10.8.1의 "비게임 PC 앱은 제3자 API 허용"이 겹친다. 10.8.1이 비게임 PC 앱 예외를 명시하므로 Frond(비게임 PC)는 제3자 결제도 허용된다고 보는 것이 자연스럽지만, "후원(donation)"으로 이름 붙인 상품은 10.8.2 문구에 걸릴 여지가 있다.
- 10.8.3: 개인 계정 제품은 "cannot require financial information for primary functionality" — 같은 문서
- 10.8.4: "Your product and its associated metadata must provide information about the types of in-product purchases offered and the range of prices. You may not mislead customers and must be clear about the nature of your in-product promotions and offerings including the scope and terms of any trial experiences. If your product restricts access to user-created content during or after a trial, you must notify users in advance. In addition, your product must make it clear to users that they are initiating a purchase option in the product." — 같은 문서
- 10.8.6(구독): "You may add value to a subscription but may not remove value for users who have previously purchased it." — 같은 문서
- 10.9: 시스템 알림 설정 존중, 알림은 제품·자사 제품 관련만, 무관한 홍보 금지 — 같은 문서
- 10.10: 광고 관련(1차 목적이 광고 클릭 유도 금지, 광고는 구분 가능) — 같은 문서
- 10.14: "Company accounts must be used for organizations, businesses, and any person acting in relation to their trade or profession … A company account is required if your product requires financial information for primary functionality … or if a reasonable consumer would interpret your application or publisher name to be that of a business entity." — 같은 문서; 개인 계정 대상: "not in relation to their business, trade, or profession", "Small scale creators producing content for non-commercial purposes" — [Learn: Open a developer account (updated 2026-07-17)](https://learn.microsoft.com/en-us/windows/apps/publish/partner-center/open-a-developer-account)
- v7.20 본문에서 "prompt"·"nag"·"interstitial" 같은 반복 구매 유도 제한 조항은 찾지 못했다(위 정책 전문 텍스트 검색 결과) — [Store Policies v7.20](https://learn.microsoft.com/en-us/windows/apps/publish/store-policies)
- Microsoft 체험판 가이드: "your trial app can disable certain features, or display regular messages asking the user to buy it"; 체험 만료 시 "If the user decides not to buy the app, close it or remind them to buy the app at regular intervals." "Be sure to explain how your app will behave during and after the free trial period" — [Learn: Implement a trial version **[본문 오래됨 가능]**](https://learn.microsoft.com/en-us/windows/uwp/monetize/implement-a-trial-version-of-your-app)
- ADA 5(e): "If your App allows any purchase to be made from within the App you must prominently disclose in your product description that in-app purchase functionality is available." 제3자 커머스도 인증 요건 준수 — [ADA v8.11](https://go.microsoft.com/fwlink/?linkid=528905)
- 가격 모델 선언이 심사 대상인 사례: 무료 앱 + 실물 주문(외부 청구) 앱이 "incorrect pricing model"로 반려(2026-04, MSI/EXE). AI 답변은 Free + "digital goods: No"로 재제출 권고 — [Microsoft Q&A 5854066](https://learn.microsoft.com/en-us/answers/questions/5854066/pricing-model-for-microsoft-store-app)

### Inferences
- **업셀 팝업**: 금지 조항은 없지만 10.1.2(완전 동작)·10.1.1(오도 금지)·10.8.4(구매 시작 명확화)를 지키는 선에서 설계한다. 실무 기준(추론): ① 핵심 기능(보기·편집·저장)을 막거나 지연시키지 않는다 ② 닫기 쉽고 "다시 보지 않기"(또는 일정 기간 숨김)를 둔다 ③ 빈도를 낮게(예: N회 실행마다·주 1회 이하) ④ 구매 버튼은 Store 구매 UI(`RequestPurchaseAsync`)를 띄운다는 것을 문구로 밝힌다 ⑤ Windows 토스트 알림으로 업셀하지 않는다(10.9 관련 위험 회피).
- **목록 문구**: 설명 첫머리 근처에 "무료로 모든 편집 기능 사용 가능, 선택적 Supporter 구매(₩x,xxx, 1회) 시 사용자 테마·전용 테마 해금"처럼 IAP 종류·가격 범위를 적는다(10.8.4·ADA 5(e)). 스크린샷에 유료 테마를 쓰면 "Supporter 전용" 표시를 붙여 10.1 오도 위험을 줄인다.
- **해금 기능은 실제로 동작해야**(10.1.2): Store 장애·오프라인에서 이미 산 사용자가 해금을 잃지 않도록 캐시 라이선스·직전 판정 유지가 필요하다(2절).
- **Store 판에서 제3자 결제 병행**: 10.8.1상 비게임 PC 앱은 제3자 결제도 허용되고 둘 다 쓰는 것을 금지하는 문구는 찾지 못했다. 병행하면 Partner Center에 제3자 API 사용을 표기해야 하고(10.8.2), 제3자 요건(제공자 표시·인증·PCI DSS)을 지켜야 한다. "Supporter/후원"이라는 이름은 10.8.2의 기부 문구에 걸릴 수 있으니 제3자 결제 쪽 상품명은 "라이선스"로 두는 편이 안전하다(추론). 라이선스 키 입력만 받는 형태(외부 구매)는 10.8.2의 "설치 후 브라우저로 안내 가능"에 기대는 구조다.
- **계정 유형**: Frond를 영리 목적으로 팔면 10.14상 회사 계정 대상이 될 수 있다. 한국 개인사업자 등록 여부와 연결되므로 국내 법·사업자 조사 결과와 함께 판단해야 한다.

### Gaps
- Store 인증팀이 업셀 팝업 빈도를 문제 삼은 공개 거절 사례·내부 기준을 찾지 못했다.
- 한 앱이 Microsoft IAP와 제3자 결제를 **동시에** 제공해도 되는지 명시한 공식 문장은 찾지 못했다(금지 문구도 없음).
- Store가 "In-app purchases" 표기와 가격 범위를 add-on 정보로 자동 표시하는지, 개발자가 설명에 직접 써야 하는지 공식 확인 못 함.
- 한국 전기통신사업법(앱 마켓 결제 규정)이 Microsoft Store에 미치는 영향은 범위 밖.

## 6. 실제 선례와 개발자 경험

### Takeaway
오픈소스 Windows 앱의 흔한 패턴은 **"웹은 무료, Store판은 유료(=후원)"**(Paint.NET, Files)이고, **"Store에서 무료 + Durable add-on 후원"**의 대표 사례는 NanaZip($99.99 Sponsor Edition, 혜택은 사실상 명예용)이다. Typora는 Store에 올라와 있지만 자체 라이선스($14.99, 15일 체험)를 쓴다. Tauri 진영에서는 Store IAP용 플러그인(tauri-plugin-iap)과 구현 계획(Luminous)이 있으나, Store add-on을 실제 판매 중인 Tauri 앱의 공개 사례는 확인하지 못했다.

### Cited Findings
- **Paint.NET**: Classic(웹) 무료, Store 릴리스는 유료이며 차이는 "fully automatic updating", Store판 구매로 "provide some financial support" 가능, 웹판은 기부 환영 — [paint.net License and FAQ](https://www.paint.net/license.html); 포럼 "Free app costs $9.99?" — [Paint.NET Forum](https://forums.paint.net/topic/123351-free-app-costs-999/)
- **Files (files-community)**: Store에서 Files App $12.99, Files Preview $9.99, 웹 사이드로드는 무료로 같은 기능, Store 구매는 개발 지원용 선택 — [files.community: Preview now available on the Store](https://files.community/blog/posts/preview-on-store); [files.community Install docs](https://files.community/docs/getting-started/install) (가격은 검색 요약 기준)
- **NanaZip (M2Team, Win32 MSIX)**: Store 무료 앱("NanaZip - Free download") + "$99.99 USD Sponsor Edition addon", 유일한 차이는 툴바의 "Sponsor NanaZip" 버튼이 "Appreciate your sponsorship"으로 바뀌는 것, 기여자·2024-03-30 이전 후원자는 무료(연락 후 처리) — [M2Team/NanaZip SponsorEdition.md](https://github.com/M2Team/NanaZip/blob/main/Documents/SponsorEdition.md); [Kenji Mouri X 게시 (2024-03)](https://x.com/MouriNaruto/status/1774100834294566967); [Store: NanaZip](https://apps.microsoft.com/detail/9n8g7tscl18r?hl=en-US&gl=US)
- **Typora**: 1회 구매 $14.99, 1인 3대, 15일 평가판 — [Typora Store](https://store.typora.io/). Microsoft Store 목록 존재(ID `xpfph15b9dlnzh`), 검색 요약상 "paid app that contains a 15-day free trial" — [Store: Typora](https://apps.microsoft.com/detail/xpfph15b9dlnzh?hl=en-US&gl=US) (페이지 본문은 fetch로 확인 실패)
- **Luminous (Tauri)**: v3.0 add-on 수익화용 Store entitlement 모듈 계획, 사용자 Store ID를 백엔드 키 발급에 활용, 패키지 identity 필수, 구매·환불·취소 수동 시험 계획 — [esoltys/luminous#1414](https://github.com/esoltys/luminous/issues/1414)
- **tauri-plugin-iap**: Tauri v2용, Windows Store 지원, MIT — [Choochmeque/tauri-plugin-iap](https://github.com/Choochmeque/tauri-plugin-iap)
- **xplorer² (C++ Win32, 2017)**: Store판 lite를 "Trial never expires"로 두고 자체 체험 로직, `StoreContext`+`IInitializeWithWindow`+`GetAppLicenseAsync`/`IsTrial`, COM 스레딩 분리 필요, 유료판 다운로드 저조로 상업적으로 실망 — [zabkat xplorer² blog (2017-02-21) **[오래됨 가능]**](https://www.zabkat.com/blog/winrt-win32-store-registration.htm)
- Microsoft 공식 홍보: MSIX는 무료 호스팅·서명·자동 업데이트, 비게임 앱은 자체 커머스로 100% 수익 — [Windows Developer Blog 2025-09-10](https://blogs.windows.com/windowsdeveloper/2025/09/10/free-developer-registration-for-individual-developers-on-microsoft-store/)

### Inferences
- Frond 모델(무료 + 1회 해금으로 실제 기능 혜택)은 NanaZip의 "무료 + Durable add-on" 구조에 실기능(사용자 테마)을 더한 형태다. NanaZip이 같은 구조로 Store 인증을 통과해 운영 중이라는 점은 Win32 MSIX 앱의 Durable add-on 모델이 실무적으로 가능함을 보여 준다.
- Paint.NET·Files식 "Store판 유료 = 후원"은 Store판 전체가 유료라 "무료 앱 + 선택 구매"와 다르다. 다만 웹(NSIS)판 무료 + Store판 유료라는 대안 모델로 비교할 가치는 있다(Store 판매자에게 자동 업데이트가 가치로 작동).
- Typora는 Store 목록 ID가 `XP…`로 시작한다. Win32(MSI/EXE) 목록이 이런 ID를 받는 것으로 알려져 있어(이번 조사에서 1차 출처 미확인) 자체 라이선스·체험을 쓰는 EXE 경로로 보인다. Store 커머스를 쓰지 않는 사례.

### Gaps
- Fork(git 클라이언트)는 Microsoft Store에 없는 것으로 보이며(확인 못 함) Store 메커니즘 선례가 아니다.
- NanaZip이 add-on 라이선스를 어떤 코드로 확인하는지(SponsorEdition.md에 구현 설명 없음) 확인하지 못했다 — NanaZip 소스 열람이 다음 단계.
- Store add-on 판매 수익·전환율 같은 공개 수치는 찾지 못했다.
- 2023–2026 사이 Windows.Services.Store를 Win32에서 쓴 경험을 다룬 블로그·Reddit·HN 글은 찾지 못했다(가장 가까운 것이 2017 xplorer², 2024 Q&A, 2026 GitHub 이슈).
