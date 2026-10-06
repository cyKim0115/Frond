# Microsoft Store 제출 경로 — 한국 개인 개발자가 Tauri 2 앱(Frond)을 올리는 방법 (2026-10 기준)

조사일: 2026-10-06. 대상 앱: Frond (Tauri 2.12, NSIS currentUser 설치기, WebView2 `downloadBootstrapper`, 코드 서명 없음, 자동 업데이트 없음, HKCU에 .md/.markdown 연결·RegisteredApplications 등록).
범위 밖(다른 조사자 담당): 코드 서명 인증서 업체·Azure Artifact(Trusted) Signing 상세, winget/Scoop/Chocolatey, MSIX 패키징 내부.
날짜 표기: Learn 문서는 `ms.date`(작성)와 `updated_at`(최종 수정)을 함께 적는다. 2025년 이전 정보는 **[오래됨 가능]**으로 표시.

## 1. 개발자 계정 — 한국 개인이 Partner Center에 등록하는 법, 비용, 본인 확인

### Takeaway
2026-10 현재 개인(Individual)·회사(Company) 계정 모두 등록비가 **무료**다(개인은 2025-09, 회사는 2026-05부터). 개인 계정은 개인 Microsoft 계정(MSA)으로 `storedeveloper.microsoft.com`에서 시작해 **정부 발급 신분증 + 셀피**로 본인 확인을 하며, 전 세계 거의 200개 시장에서 지원된다. Frond처럼 업무·영업과 무관한 취미·개인 프로젝트는 개인 계정 대상이다.

### Cited Findings
- 2025-09-10 Windows Developer Blog: 개인 개발자는 등록비 없이 Store에 앱을 낼 수 있고 "Developers will no longer need a credit card to get started", "now globally available in nearly 200 markets worldwide". 본인 확인은 "scanning a valid government-issued ID and your selfie" — [Windows Developer Blog 2025-09-10](https://blogs.windows.com/windowsdeveloper/2025/09/10/free-developer-registration-for-individual-developers-on-microsoft-store/)
- 이전 개인 등록비는 일회성 USD 19였다 — [Neowin](https://www.neowin.net/news/microsoft-store-now-lets-individual-developers-join-for-free/); [Windows Central](https://www.windowscentral.com/microsoft/windows-11/microsoft-store-drops-fees-for-individual-developers-apple-still-charges-usd99-per-year)
- 무료 개인 등록은 2025-05-19 Build 무렵 예고됐다 — [Windows Developer Blog 2025-05-19](https://blogs.windows.com/windowsdeveloper/2025/05/19/microsoft-store-expands-opportunities-for-windows-app-developers/); [TechCrunch 2025-05-19](https://techcrunch.com/2025/05/19/itll-soon-be-free-to-publish-apps-to-the-microsoft-store/)
- 회사 계정의 USD 99 등록비도 2026-05-07에 폐지: "The $99 onboarding fee for company developer accounts has been removed". Entra ID(업무 계정) 가입, D-U-N-S 번호 또는 사업 서류로 검증 — [Windows Developer Blog 2026-05-07](https://blogs.windows.com/windowsdeveloper/2026/05/07/publish-to-microsoft-store-as-a-company-now-with-free-registration-and-faster-onboarding/); [heise](https://www.heise.de/en/news/Microsoft-Store-Company-developer-accounts-are-now-free-11318012.html)
  - **충돌 정리**: 2025-09 기사들은 "회사 계정 정책은 그대로(유료)"라고 썼으나, 2026-05 공지와 Learn(2026-07-17 수정)은 두 유형 모두 무료라고 한다. 최신 기준은 무료 — [Learn: open a developer account](https://learn.microsoft.com/en-us/windows/apps/publish/partner-center/open-a-developer-account)
- Learn(ms.date 2025-09-17, updated 2026-07-17): "there are **no registration fees** for either account type". 무료 흐름은 `https://storedeveloper.microsoft.com`에서 시작해야만 하며 "Other paths (e.g. direct via Partner Center, Xbox, or Visual Studio) will show the legacy flow" — [Learn: open a developer account](https://learn.microsoft.com/en-us/windows/apps/publish/partner-center/open-a-developer-account)
- 개인 계정 단계: storedeveloper.microsoft.com → "Get started for free" → Individual developer → MSA 로그인/생성 → 정부 발급 신분증 + 셀피(휴대폰으로 원본 촬영) → 프로필 확인 → Partner Center 대시보드 → Apps & Games. 개인 계정은 MSA만 가능(Entra ID 불가) — [Learn: open a developer account](https://learn.microsoft.com/en-us/windows/apps/publish/partner-center/open-a-developer-account)
- 개인 계정 대상: "Independent developers whose distribution of apps through the Store is **not in relation to their business, trade, or profession**", 취미·학교·개인 프로젝트. 회사 계정 대상: 사업·직업과 관련된 개인·프리랜서, 법인·단체 — [Learn: open a developer account](https://learn.microsoft.com/en-us/windows/apps/publish/partner-center/open-a-developer-account)
- 개인 → 회사 계정 전환은 지원되지 않음("Changing a developer account from Individual to Company is not supported"), 회사로 내려면 새 계정 필요 — [Learn: open a developer account](https://learn.microsoft.com/en-us/windows/apps/publish/partner-center/open-a-developer-account)
- 신분증 데이터: 검증에만 쓰고, Publisher name·국가 같은 비PII는 지원·분쟁 대응용으로 보관할 수 있음 — [Learn: open a developer account](https://learn.microsoft.com/en-us/windows/apps/publish/partner-center/open-a-developer-account)
- Store Policies 10.14 Account Type: "Company accounts must be used for organizations, businesses, and any person acting in relation to their trade or profession… A company account is required if your product requires financial information for primary functionality… or if a reasonable consumer would interpret your application or publisher name to be that of a business entity." 회사 계정은 지역에 따라 PDP에 고객 지원 연락처가 표시됨 — [Microsoft Store Policies v7.20](https://learn.microsoft.com/en-us/windows/apps/publish/store-policies)
- 회사 계정 검증: D-U-N-S(권장) 또는 사업 서류, 회사 도메인 업무 이메일 필수(Gmail 등 불가), 수동 검토 2–5 영업일 — [Learn: open a developer account](https://learn.microsoft.com/en-us/windows/apps/publish/partner-center/open-a-developer-account)

### Inferences
- 한국 거주 개인이 "nearly 200 markets"·"supported in all markets worldwide" 범위에 들어갈 가능성이 매우 높다(한국 미지원이라는 언급은 찾지 못함). 한국 신분증(주민등록증·운전면허증·여권) 중 무엇이 받아지는지는 가입 화면에서만 확인 가능.
- Publisher 표시명: 개인 계정은 본인 이름으로 앱을 낸다는 설명이 있어, Store에 보이는 게시자 이름이 "cyKim" 같은 별칭이 될지 실명이 될지는 가입 시 프로필 단계에서 결정된다. Policy 10.14의 "publisher name이 사업체로 보이면 회사 계정 필요" 조항 때문에, 게시자 이름을 회사처럼 짓지 않는 편이 안전하다.
- 나중에 유료화해 "업으로" 판매할 계획이 생기면 10.14상 회사 계정이 맞을 수 있고, 개인→회사 전환이 안 되므로 앱 이전(transfer) 문제가 생길 수 있다. 무료 취미 앱으로 시작하는 지금은 개인 계정이 맞다.

### Gaps
- 한국이 개인 무료 등록 지원 시장 목록에 있는지 명시한 공식 목록은 찾지 못했다(목록 페이지 미발견).
- 개인 계정의 Store 게시자 표시명 규칙(실명 강제 여부, 신분증 이름과 일치해야 하는지)은 공식 문서에서 확인하지 못했다.
- 신분증 확인 거절 시 재시도 횟수·소요 시간(개인 계정)은 문서에 없음.

## 2. 제출 경로 — (a) MSIX vs (b) MSI/EXE 설치기 URL

### Takeaway
경로는 둘이다. **(a) MSIX**: Store가 재서명·호스팅·자동 업데이트를 무료로 해 주지만, Tauri는 MSIX를 공식 생성하지 않아 별도 도구(winapp CLI·makeappx)와 매니페스트 작업이 필요하다. **(b) MSI/EXE**: 지금의 NSIS 설치기를 거의 그대로 쓸 수 있지만, 설치기와 **모든 PE 파일이 Microsoft Trusted Root Program CA에 체인되는 인증서로 서명**돼야 하고(자체 서명 불가), 버전별 고정 HTTPS URL을 직접 호스팅해야 하며, **Store는 기존 사용자에게 업데이트를 주지 않는다**(앱이 스스로 업데이트해야 함).

### Cited Findings
**공통/비교**
- Learn 비교표(Packaged MSIX vs Unpackaged Win32): Hosting — MSIX는 Microsoft 무료 / Win32는 게시자 부담. Code signing — MSIX "Complimentary, provided by Microsoft" / Win32 "Publishers must sign with a certificate issued by a CA that is part of the Microsoft Trusted Root Program and cover associated costs". Auto-Updates — MSIX "The OS will automatically check updates every 24 hours" / Win32 "The application is responsible for managing its own auto-updates". S-Mode·Private app·Package flighting·Share 등 고급 통합 — MSIX만. Windows 11 백업·복원 — Win32는 "Start Menu icons will be restored but will point to the Microsoft Store product page" — [Learn: distribute your Win32 app through Store (updated 2026-07-11)](https://learn.microsoft.com/en-us/windows/apps/distribute-through-store/how-to-distribute-your-win32-app-through-microsoft-store)
- Learn(updated 2026-09-15) 배포 경로 표: Store(MSIX) 서명 "Free (Store re-signs your package)", 업데이트 "Built-in". Store(MSI/EXE) 서명 "Publisher must sign the installer and all PE files with a cert chaining to the Microsoft Trusted Root Program", 업데이트 "Manual (app or installer handles updates)". 본문: MSI/EXE는 "self-signed is not accepted; Store-managed updates are not available for this path"; "the Store downloads and runs the installer from that URL as part of the Store install flow" — [Learn: choose a distribution path](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/choose-distribution-path)
- MSIX 지원 형식: .msix, .msixbundle, .msixupload, .appx, .appxbundle, .appxupload. "MSIX is the recommended format, but traditional EXE/MSI installers are also accepted". EXE/MSI 제출은 2021-06부터 허용 — [Learn: MSI/EXE app package requirements (updated 2026-08-24)](https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msi/app-package-requirements)
- 2025-09 블로그: "We'll also sign your app for free" — 단, 같은 글에서 무료 호스팅·서명·자동 업데이트는 "(MSIX)"로 한정 — [Windows Developer Blog 2025-09-10](https://blogs.windows.com/windowsdeveloper/2025/09/10/free-developer-registration-for-individual-developers-on-microsoft-store/)

**(a) MSIX 경로**
- "MSIX submission — … Microsoft re-signs the package; no cert purchase needed. Includes Store-managed updates, staged rollouts, and differential downloads." — [Learn: choose a distribution path](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/choose-distribution-path)
- winapp CLI Tauri 가이드(ms.date 2026-10-03): Tauri 앱을 `winapp init`(Package.appxmanifest·Assets 생성) → `winapp pack`으로 MSIX화. "The Microsoft Store will sign the MSIX for you, no need to sign before submission." 아키텍처별(x64·Arm64) MSIX가 따로 필요할 수 있음 — [Learn: Using winapp CLI with Tauri](https://learn.microsoft.com/en-us/windows/apps/dev-tools/winapp-cli/guides/tauri)
- winapp CLI는 Electron·Rust·Tauri 등을 지원하며 `winapp store` 명령으로 Store 게시를 지원한다고 소개됨 — [Learn: winapp CLI 개요](https://learn.microsoft.com/en-us/windows/apps/dev-tools/winapp-cli/); [microsoft/winappCli Tauri 가이드](https://github.com/microsoft/winappCli/blob/main/docs/guides/tauri.md)
- Tauri 자체 MSIX 번들 기능 요청(#4818, 2022-08 개설)은 아직 open — [tauri-apps/tauri#4818](https://github.com/tauri-apps/tauri/issues/4818)
- 실사례(lasterm, WebView2 앱 MSIX 제출 계획): "Do not sign it. The Store re-signs the package, and a package signed beforehand fails with a publisher mismatch." `runFullTrust` 선언에 대한 사유 기재 필요 — [khiops/lasterm#618](https://github.com/khiops/lasterm/issues/618)
- 실사례(qrate, 2026-09-20): "Microsoft re-signs MSIX packages submitted to the Store after certification, so a Store build is signed and SmartScreen-free at zero cost." EXE/MSI는 Trusted Root CA 인증서가 필요해 "MSIX is the only free route". `makeappx` + AppxManifest 템플릿, `runFullTrust`·mediumIL 필요 — [devnull03/qrate#137](https://github.com/devnull03/qrate/issues/137)

**(b) MSI/EXE 경로 (Store Policies 10.2.9 = Learn 요건과 동일 문구)**
- "Non-gaming products may submit an HTTPS-enabled download URL (direct link) to the product's installer binaries." 요건: (1) .msi 또는 .exe만, (2) "The binary and all of its Portable Executable (PE) files must be digitally signed with a code signing certificate that chains up to a certificate issued by a Certificate Authority (CA) that is part of the Microsoft Trusted Root Program", (3) 버전별 다운로드 URL을 제출하고 "The binary associated with that URL must not change after submission", (4) 새 바이너리마다 새 버전 URL, URL 유지 책임은 게시자, (5) "Initiating the install must not display an installation user interface (i.e., silent install is required), however a User Account Control (UAC) dialog is allowed", (6) "standalone installer and is not a downloader stub/web installer", (7) PC 전용 — [Microsoft Store Policies v7.20 §10.2.9 (게시 2026-09-15, 발효 2026-10-22)](https://learn.microsoft.com/en-us/windows/apps/publish/store-policies); [Learn: MSI/EXE package requirements](https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msi/app-package-requirements)
  - **충돌**: 인증 절차 문서는 서명을 "It is highly recommended that your EXE/MSI app and the PE files inside of it are digitally signed…"라고 '권장'으로 적는다. Policy 10.2.9·패키지 요건·배포 경로 문서(2026-09)는 모두 '필수'(must, self-signed 불가)이므로 필수로 봐야 한다 — [Learn: MSI/EXE certification process](https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msi/app-certification-process)
- Packages 페이지 필드: Package URL(필수, 예 `https://www.contoso.com/downloads/1.1/setup.exe`), Architecture(x86/x64/neutral/arm/arm64), Languages(ko·en 지원), App type(EXE/MSI), EXE면 Installer parameters 필수("such as /s"), MSI는 Store가 기본 `/qn` 사용. 반환 코드 매핑(Installer handling) 선택 — [Learn: upload app packages (MSI/EXE, updated 2025-08-21)](https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msi/upload-app-packages)
- URL 바이너리를 몰래 바꾸면: "The Store will retain copies of your most recent app packages to distribute in case the app installer hosted by you… is swapped… The Store will also download the new app packages and initiate the process of certification." 통과 못 하면 Partner Center로 제출하라고 통지 — [Learn: upload app packages](https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msi/upload-app-packages)
- 업데이트: "The Store allows existing users to install in-app updates through your app, if your installer supports it. The Store does not provide these updates automatically or manually to existing users." 새 고객이 최신판을 받도록 Store 제출 업데이트를 권장 — [Learn: publish update to your MSI/EXE app](https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msi/publish-update-to-your-app-on-store)
- MSI/EXE 앱은 Windows 10·11 데스크톱에서만 Store 다운로드 가능 — [Learn: upload app packages](https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msi/upload-app-packages)
- MSI/EXE 앱에는 Partner Center 역할·권한이 적용되지 않음(계정 사용자 모두 수정 가능) — [Learn: create app submission (MSI/EXE)](https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msi/create-app-submission)
- Policy 10.4.4: URL 제출 제품은 "must not take an unreasonable amount of time to download and must not have an unreasonably low installation success rate" — [Store Policies v7.20](https://learn.microsoft.com/en-us/windows/apps/publish/store-policies)

### Inferences
- **Frond에 (b) EXE 경로를 쓰려면 바꿀 것**: ① Trusted Root CA 체인 코드 서명(설치기 + 앱 exe + NSIS가 만든 uninstall exe 등 모든 PE) — 비용 발생, ② `webviewInstallMode`를 `offlineInstaller`로(설치기 약 +127MB, Tauri 문서 수치), ③ Installer parameters에 `/S`, ④ 버전별 불변 URL 호스팅(예: GitHub Releases 태그별 자산 URL), ⑤ Store 사용자도 업데이트를 받으려면 앱 내 업데이터(Tauri updater 등) 추가. 현재 Frond는 업데이터가 없으므로 Store로 설치한 사용자는 재설치 전까지 첫 버전에 머문다.
- **(a) MSIX 경로**는 서명 비용 0원·Store 자동 업데이트가 장점이지만, Frond의 NSIS 훅(HKCU 파일 연결·RegisteredApplications)은 MSIX에서 실행되지 않으므로 파일 연결을 매니페스트(`uap:FileTypeAssociation`)로 옮겨야 하고, `runFullTrust` 사유 기재·WACK 경고 대응이 필요하다(상세는 MSIX 담당 조사 참고).
- 비용 관점: 한국 개인이 Trusted Root CA 인증서를 얻는 것이 막히면(qrate 사례처럼) MSIX가 사실상 유일한 무료 경로다. Learn 문서는 Azure Artifact Signing을 "~$10/mo"로 소개한다([Learn: choose a distribution path](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/choose-distribution-path)) — 개인·국가 자격 요건은 서명 담당 조사 범위.
- GitHub Releases 자산 URL은 `github.com/.../releases/download/v0.1.0/...` 형태로 버전이 경로에 들어가고 같은 태그의 자산을 덮어쓰지 않으면 불변성 요건을 만족할 것으로 보인다. 다만 리다이렉트(objects.githubusercontent.com)를 Store 다운로더가 문제없이 따르는지는 확인 못 함(Gaps).

### Gaps
- Store가 URL 리다이렉트(GitHub Releases → CDN)를 허용하는지 공식 문서에서 확인하지 못했다.
- "all of its PE files"에 offline WebView2 설치기(Microsoft 서명)·NSIS 플러그인 DLL·uninstall.exe가 모두 포함되는지, Tauri `signCommand`가 NSIS uninstaller까지 서명하는지 확인하지 못했다.
- Store의 EXE 설치 화면(사용자에게 보이는 진행 UI)이 MSIX와 어떻게 다른지 구체 설명은 찾지 못했다("Store install flow" 안에서 다운로드·무음 실행한다는 수준까지만 확인).

## 3. Tauri 공식 문서 — v2 "Microsoft Store" 배포 가이드가 요구하는 것

### Takeaway
Tauri 공식 가이드는 **MSI/EXE 경로**를 전제로 한다: Partner Center에서 "EXE or MSI app"으로 이름 예약, WebView2를 **offlineInstaller**로 바꾼 Store 전용 설정 파일로 번들, NSIS `/S`(대문자)로 무음 설치, **publisher ≠ productName**, 설치기는 코드 서명·오프라인·자동 업데이트 처리. MSIX는 Tauri가 직접 만들지 않는다.

### Cited Findings
- "To publish apps on the Microsoft Store you must have a Microsoft account and enroll as a developer either as an individual or as a company." — [Tauri v2 docs: Microsoft Store (원문 mdx)](https://github.com/tauri-apps/tauri-docs/blob/v2/src/content/docs/distribute/microsoft-store.mdx)
- "Currently Tauri only generates EXE and MSI installers, so you must create a Microsoft Store application that only links to the unpacked application." 그리고 링크한 설치기는 "must be offline, handle auto-updates and be code signed"(검색 스니펫 기준 문구) — [Tauri v2: Microsoft Store](https://v2.tauri.app/distribute/microsoft-store/)
- "The Windows installer distributed through the Microsoft Store must use the Offline Installer Webview2 installation option." 별도 설정 파일 예: `src-tauri/tauri.microsoftstore.conf.json`에 `{"bundle":{"windows":{"webviewInstallMode":{"type":"offlineInstaller"}}}}`, 빌드는 `tauri build --no-bundle` 후 `tauri bundle --config src-tauri/tauri.microsoftstore.conf.json` — [Tauri v2: Microsoft Store](https://v2.tauri.app/distribute/microsoft-store/); [원문 mdx](https://raw.githubusercontent.com/tauri-apps/tauri-docs/v2/src/content/docs/distribute/microsoft-store.mdx)
- 무음 설치: "Win32 products must install silently." NSIS `-setup.exe`는 `/S`(대문자 S), MSI는 `/quiet` — [Tauri v2: Microsoft Store](https://v2.tauri.app/distribute/microsoft-store/)
- "Your application publisher name cannot match the application product name." publisher를 지정하지 않으면 bundle identifier의 두 번째 부분에서 유도되므로 `bundle.publisher`를 명시하라고 권고(예: productName "Example" + identifier `com.example.app` 은 충돌) — [Tauri v2: Microsoft Store](https://v2.tauri.app/distribute/microsoft-store/)
- 아이콘: `tauri icon /path/to/app-icon.png`로 Store용 포함 모든 아이콘 생성 — [Tauri 원문 mdx](https://github.com/tauri-apps/tauri-docs/blob/v2/src/content/docs/distribute/microsoft-store.mdx)
- WebView2 설치 모드별 크기: downloadBootstrapper +0MB(인터넷 필요), embedBootstrapper 약 +1.8MB(인터넷 필요), **offlineInstaller 약 +127MB**(오프라인 가능), fixedVersion 약 +180MB, skip +0MB(비권장) — [Tauri v2: Windows Installer](https://v2.tauri.app/distribute/windows-installer/)
- NSIS installMode: currentUser(기본, 관리자 권한 없이 `%LOCALAPPDATA%`), perMachine(관리자, Program Files), both — [Tauri v2: Windows Installer](https://v2.tauri.app/distribute/windows-installer/)

### Inferences
- Frond 현재 설정과 대조: productName "Frond" vs publisher "cyKim" → 충돌 없음(통과). identifier `com.cykim.mdeditor`라 publisher 미지정이었어도 "cykim"이 되어 문제 없었을 것. `webviewInstallMode`는 현재 `downloadBootstrapper`라 **Store용 별도 설정 파일로 offlineInstaller 전환 필요**(일반 배포판은 그대로 둘 수 있음). installMode currentUser는 인증 시험의 "standard user account로 설치 가능" 조건에 유리.
- Tauri 가이드는 MSIX 경로를 다루지 않는다. MSIX를 원하면 Microsoft의 winapp CLI Tauri 가이드(2026-10-03)가 사실상 공식 대안이다.
- Tauri 가이드에 페이지 날짜가 표시되지 않아 최신성은 v2 브랜치 원문 기준으로만 확인했다.

### Gaps
- Tauri 가이드 페이지의 마지막 수정일을 확인하지 못했다.
- "handle auto-updates" 문구는 검색 스니펫에서만 확인했고 원문 fetch 요약에는 나오지 않았다(원문 재확인 권장).
- 검색 요약에 "Tauri 번들러가 `bundle.windows.signCommand`를 앱 exe(WiX 패킹 전)와 완성된 .msi에 호출한다"는 설명이 있었으나 출처 원문을 확인하지 못했다. NSIS 경로에서 uninstaller·플러그인 DLL까지 서명되는지는 서명 담당 조사에서 확인 필요.

## 4. Store 정책 중 이 앱에 걸릴 만한 것 (Policies v7.20, 2026-10-22 발효)

### Takeaway
Frond에 실질적으로 걸릴 항목은 ① 10.2.9(서명·무음·오프라인·불변 URL), ② 10.5.1 **Win32는 항상 개인정보처리방침 필요**(URL 준비), ③ 10.2.7·인증 시험의 **깨끗한 제거**(HKCU 연결·Capabilities 레지스트리 정리), ④ 10.2.8 기본 앱 변경은 지원 방식·사용자 동의, ⑤ 10.1.1 고유 이름, ⑥ 11.11 IARC 연령 등급, ⑦ 목록의 필수 항목(스크린샷 1장 이상·1:1 박스 아트·**Applicable license terms**).

### Cited Findings
- 정책 버전: "Document version: 7.20 / Publish date: September 15, 2026 / Effective date: October 22, 2026" — [Microsoft Store Policies](https://learn.microsoft.com/en-us/windows/apps/publish/store-policies)
- 10.1.1: "Your product title or name must be unique and must not contain marketing or descriptive text"; "must not use a name, images, or any other metadata that is the same as that of other products unless the product is also published by you"; "The value proposition of your product must be clear during the first run experience." 10.1.3: 검색어 최대 7개, 다른 제품명 금지 — [Store Policies v7.20](https://learn.microsoft.com/en-us/windows/apps/publish/store-policies)
- 10.2.2: 동적 코드로 기능을 바꾸거나 정책 위반 기능 추가 금지("download a remote script and subsequently execute that script…") — [Store Policies v7.20](https://learn.microsoft.com/en-us/windows/apps/publish/store-policies)
- 10.2.3: 맬웨어 금지, "must not offer to install secondary software that is not developed by you and does not enhance the functionality of your product." — [Store Policies v7.20](https://learn.microsoft.com/en-us/windows/apps/publish/store-policies)
- 10.2.7: "Your product must clearly communicate and enable a user's ability to cleanly uninstall and remove your product from their device." — [Store Policies v7.20](https://learn.microsoft.com/en-us/windows/apps/publish/store-policies)
- 10.2.8: "You are required to use supported methods and must obtain user consent to change any user's Windows settings, preferences, settings UI, or modify the user's Windows experience in any way." 지원 방식 링크는 2023-03 Windows Experience 블로그(앱 고정·기본 앱 원칙) — [Store Policies v7.20](https://learn.microsoft.com/en-us/windows/apps/publish/store-policies); [Windows Experience Blog 2023-03-17 (오래됨 가능)](https://blogs.windows.com/windowsexperience/2023/03/17/a-principled-approach-to-app-pinning-and-app-defaults-in-windows/)
- 10.5.1: 개인정보를 접근·수집·전송하면 개인정보처리방침 URL을 Partner Center에 입력. 그리고 "Product types that inherently have access to Personal Information must always have privacy policies. These include, but are not limited to, Desktop Bridge and Win32 products." — [Store Policies v7.20](https://learn.microsoft.com/en-us/windows/apps/publish/store-policies)
  - **충돌**: MSI/EXE 제출 체크리스트는 Privacy policy URL을 "Only required if you answered yes to the previous question"(개인정보 접근 여부 질문)이라고 한다. 정책 10.5.1의 Win32 조항이 더 강하므로 URL을 준비하는 편이 안전 — [Learn: create app submission (MSI/EXE)](https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msi/create-app-submission)
- 10.7 Localization: 선언한 각 언어로 설명을 현지화해야 함 — [Store Policies v7.20](https://learn.microsoft.com/en-us/windows/apps/publish/store-policies)
- 11.2: 콘텐츠·메타데이터는 직접 만들었거나 라이선스를 받은 것이어야 함 — [Store Policies v7.20](https://learn.microsoft.com/en-us/windows/apps/publish/store-policies)
- 11.11.1: "You must obtain an age rating for your product when you submit it in Partner Center… completing the International Age Rating Coalition (IARC) rating questionnaire" — [Store Policies v7.20](https://learn.microsoft.com/en-us/windows/apps/publish/store-policies)
- MSI/EXE 목록(Store listings) 필드: Description 필수(10,000자), Screenshots 필수(최소 1, 권장 4+, 최대 10), Store logos 필수("1:1 Box art required, 2:3 Poster art recommended"), **Applicable license terms 필수(10,000자)**, Short description·Keywords(7개, 40자/개)·Copyright 선택. Properties: Category 필수, "Does this product access…" 질문 필수 — [Learn: create app submission (MSI/EXE, updated 2026-08-24)](https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msi/create-app-submission)
- 데스크톱 스크린샷 최소 1366×768, 4K(3840×2160) 지원, .png, 50MB 미만(검색 스니펫 기준) — [Learn: screenshots and images (MSI/EXE)](https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msi/screenshots-and-images)
- 이름 예약: Partner Center → New product → "EXE or MSI app" → Check availability → Reserve. "Reserved names not used within three months will have the reservation removed." 여러 이름 예약 가능, 최대 256자, 이모지·특수문자 불가, 상표 이름 사용 시 삭제될 수 있음. 스토어에 안 보여도 다른 개발자가 예약해 둔 이름이면 예약 불가 — [Learn: reserve your MSI/EXE app's name](https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msi/reserve-your-apps-name)
- "Frond" 동명 앱: Google Play·App Store에 "The Frond App"(개인 프로젝트·그룹 여행 계획), "FROND: Information Simplified"(뉴스) 등이 있음. Microsoft Store 웹(apps.microsoft.com)에서 "Frond" 앱은 검색으로 찾지 못함 — [Google Play: The Frond App](https://play.google.com/store/apps/details?id=com.abdelhady154.TheFrondApp); [App Store: The Frond App](https://apps.apple.com/gb/app/the-frond-app/id6740921266); [Google Play: FROND](https://play.google.com/store/apps/details?id=com.frond.digital&hl=en_US)

### Inferences
- **개인정보처리방침**: Frond는 서버 전송이 없어도 Win32라 방침 URL을 준비해야 한다. "로컬 파일만 읽고 쓰며 수집·전송 없음, 설정은 %APPDATA%\Frond·localStorage에만 저장" 정도의 짧은 페이지를 GitHub Pages 등에 두면 된다(DeskSpawn 사례가 같은 방식).
- **깨끗한 제거**: 인증 시험이 "uninstall cleanly without leaving remnants of files, folder, and registry entries"를 보므로, NSIS 훅이 설치 때 쓴 HKCU 키(ProgId `MdEditor.Markdown`, `.md`/`.markdown` OpenWithProgids, `RegisteredApplications\Frond`, Capabilities)를 제거 때 모두 지우는지 확인해야 한다. 사용자 데이터 폴더(%APPDATA%\Frond)를 남기는 게 지적될지는 불명(Gaps).
- **기본 앱(10.2.8)**: Frond는 RegisteredApplications/Capabilities로 "기본 앱 목록에 나타나게"만 하고 `UserChoice`를 직접 바꾸지 않으므로 지원 방식에 해당한다고 본다. 앱이 사용자의 기본 앱을 몰래 바꾸는 코드를 넣으면 안 된다.
- **10.2.2 동적 코드**: Frond의 AI 훅(`integrations/open-new-md.ps1`)은 외부에서 스크립트를 내려받아 실행하는 구조가 아니라 문제 소지는 낮다. 단 설치기가 이 스크립트를 Claude Code 설정에 자동으로 등록하는 식이면 10.2.8(사용자 동의) 관점에서 설명이 필요할 수 있다.
- **Applicable license terms**: 저장소에 LICENSE 파일이 없어도 Store 목록에는 최종 사용자 라이선스 문구를 반드시 적어야 한다. 오픈소스 라이선스(MIT 등)를 정하면 그 문구를, 아니면 간단한 EULA를 준비해야 한다.
- **이름 "Frond"**: Store 내 충돌은 Partner Center "Check availability"로만 확정 가능. 다른 플랫폼에 동명 앱이 있어 상표 분쟁 여지가 조금 있다(Policy 10.1.1·11.2). 예약은 3개월 유효이므로 제출 준비가 거의 끝났을 때 예약하거나, 예약 후 3개월 안에 제출해야 한다.
- 한국어+영어 목록을 모두 선언하면 두 언어 설명·스크린샷을 각각 채워야 한다(10.7).

### Gaps
- 사용자 데이터(%APPDATA%\Frond)를 제거 시 남기는 것이 "clean uninstall" 위반으로 판정되는지 공식 기준을 찾지 못했다.
- MSI/EXE용 1:1 박스 아트의 정확한 픽셀 크기(예 300×300 이상)를 fetch로 확인하지 못했다(screenshots-and-images 페이지 미열람).
- 한국 시장 특유 요구(11.10 Country/Region Specific Requirements의 한국 항목, 게임 아닌 앱의 국내 등급 의무)는 확인하지 못했다. 정책에서 한국은 "Real-world gambling is not permitted" 목록에만 등장.

## 5. 인증(certification)·심사 — 소요 시간, 흔한 거절 사유, 업데이트 제출

### Takeaway
인증은 공식적으로 **최대 3영업일**(보통 수 시간)이고, 통과 후 약 15분 내 Store에 노출된다. MSI/EXE 경로의 자동 시험은 HTTPS URL·맬웨어 스캔·**무음 설치(표준 사용자, 시작 메뉴·Programs 목록 등록, ARP 정보, 깨끗한 제거)**·오프라인 설치기·번들웨어·드라이버 의존성이다. 업데이트는 Partner Center에서 "Update" 제출로 새 버전 URL을 넣고 다시 인증받는다.

### Cited Findings
- "This process can take up to three business days. After your submission passes certification, on an average, customers will be able to see the app's listing within 15 minutes" — [Learn: certification process (MSI/EXE, updated 2026-08-24)](https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msi/app-certification-process)
- 3영업일을 넘겨 1주 이상 "Certification"에 머무는 사례 질문들이 Q&A에 있다 — [Microsoft Q&A: >3 days](https://learn.microsoft.com/en-sg/answers/questions/1595854/submission-for-microsoft-store-taking-more-than-3); [Microsoft Q&A: stuck 1+ week](https://learn.microsoft.com/en-us/answers/questions/1628793/submission-certification-process-stuck-at-certific)
- 보안 시험(MSI/EXE): Package URL(HTTPS·.exe/.msi, 실패 시 다음 단계 불가), Malware test(정적·동적 스캔), **Silent install**: "Can install silently without any user interfaces visible", "Can be successfully installed when logged in with a standard user account", "Can make an entry in the Windows Start menu and Programs list"(필요 없으면 Notes for certification에 기재), ARP에서 ProductName·Publisher·Default Language·Version 조회 가능, "Can uninstall cleanly without leaving remnants of files, folder, and registry entries". 그 외 Standalone/offline installer, Bundleware check, non-Microsoft drivers/NT services — [Learn: certification process (MSI/EXE)](https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msi/app-certification-process)
- 흔한 실패 회피 목록: 설치 중·후 타사 앱 홍보 금지, 미완성 기능·공사 중 링크 금지, 네트워크 없을 때 크래시 금지, ARP 정보 설정, 필요 시 개인정보처리방침, 설명이 실제 기능과 일치, 접근성 검증 없이 accessible 표시 금지 — [Learn: certification process (MSI/EXE)](https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msi/app-certification-process)
- 실패 시 실패 시험·정책이 적힌 보고서를 이메일로 받고, 고친 뒤 새 제출. 게시 후에도 spot check로 문제 시 통지·삭제 가능 — [Learn: certification process (MSI/EXE)](https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msi/app-certification-process)
- 사전 점검 도구로 Windows App Certification Kit(WACK) 사용 권장 — [Learn: certification process (MSI/EXE)](https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msi/app-certification-process)
- Tauri 특유 이슈: 새 Tauri v2(2.9.5) 프로젝트가 WACK "Blocked Executables"(S 모드 호환) 항목에서 `kernel32.dll!CreateProcessW`, `shell32.dll!ShellExecuteW` 참조로 실패한다는 보고(2026-02-13, 미해결·needs triage) — [tauri-apps/tauri#14935](https://github.com/tauri-apps/tauri/issues/14935)
  - **충돌**: lasterm 이슈는 WebView2 앱의 "blocked executables" 경고가 "informational rather than blocking"이라고 기록 — [khiops/lasterm#618](https://github.com/khiops/lasterm/issues/618). 또 MSI/EXE 앱은 원래 S 모드를 지원하지 않는다(Learn 비교표 "S-Mode Support: Not Supported") — [Learn: distribute Win32 app](https://learn.microsoft.com/en-us/windows/apps/distribute-through-store/how-to-distribute-your-win32-app-through-microsoft-store)
- 첫 인증은 "from hours to days"(lasterm 실무 메모) — [khiops/lasterm#618](https://github.com/khiops/lasterm/issues/618)
- EXE 설치 실패를 줄이려 무음 설치 미지원 시 제출이 거절된다는 Tauri 문서 설명(검색 요약) — [Tauri v2: Microsoft Store](https://v2.tauri.app/distribute/microsoft-store/)
- 업데이트 제출: 앱 개요 → Update → 이전 제출 기반 초안에서 Packages 등 수정 → Publish. 새 바이너리는 새 버전 URL 필수 — [Learn: publish update (MSI/EXE)](https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msi/publish-update-to-your-app-on-store); [Store Policies §10.2.9](https://learn.microsoft.com/en-us/windows/apps/publish/store-policies)
- 제출 자동화: Microsoft Store submission API로도 제출 가능 — [Learn: create app submission (MSI/EXE)](https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msi/create-app-submission)
- 10.3.1: 로그인이 필요하면 Notes for certification에 데모 계정 — [Store Policies v7.20](https://learn.microsoft.com/en-us/windows/apps/publish/store-policies)

### Inferences
- Frond의 EXE 제출에서 가장 걸리기 쉬운 지점: (1) 서명 누락·체인 불일치, (2) WebView2 `downloadBootstrapper`(오프라인 설치기 아님 → standalone 시험 실패 가능), (3) 제거 시 HKCU 잔여 키, (4) 무음 모드에서 언어 선택 등 UI가 뜨는 경우(Korean+English 설치기 UI가 `/S`에서 완전히 숨는지 확인 필요), (5) 앱 첫 실행 시 가치 전달(10.1.1) — 빈 창만 뜨면 심사자가 기능을 못 볼 수 있으니 Notes for certification에 "샘플 .md를 열어 보세요" 같은 안내를 쓰는 것이 좋다.
- WACK S 모드 항목은 MSIX 경로에서 더 문제이고, EXE 경로는 애초에 S 모드 비대상이라 영향이 작을 것으로 본다.

### Gaps
- MSI/EXE 제출의 실제 평균 심사 시간 통계(2025–2026)는 찾지 못했다. 공식 수치는 "최대 3영업일"뿐.
- Tauri NSIS 설치기가 정확히 어떤 이유로 거절된 구체 사례(인증 보고서 원문)는 찾지 못했다.

## 6. 실제 선례 — Store에 올라간 Tauri/Electron 앱과 경로

### Takeaway
2026년 들어 Tauri 앱의 Store 진출 사례가 GitHub에 다수 보이며, 공개 이슈 기준으로는 **무료 서명 때문에 MSIX 경로를 고르는 경향**이 뚜렷하다. Tauri 기반 마크다운 편집기 Inkwell이 Store에 있다고 자사 글에서 밝히지만 경로는 불명. Typora·Obsidian·MarkText·Joplin의 Store 등재는 확인하지 못했다.

### Cited Findings
- DeskSpawn(Tauri, Rust+TS+Vite) v0.5.0(2026-10-05 병합) "Microsoft Store submission prep": 실행 시 package identity를 판정해 updater를 끄고, 개인정보처리방침을 GitHub Pages에 게시 — [shira022/deskspawn PR #174](https://github.com/shira022/deskspawn/pull/174)
- lasterm(WebView2 데스크톱 앱): CI가 `Lasterm_<version>_x64.msix` 생성, 서명하지 말 것(Store 재서명), 새 이름으로 제품 예약 권고, 개인정보처리방침·스크린샷(최소 1, 이상적으로 4)·IARC 필요, 승인 후 Store ID(9로 시작)를 자동화 변수로 사용 — [khiops/lasterm#618](https://github.com/khiops/lasterm/issues/618)
- qrate: EXE/MSI는 Trusted Root CA 인증서를 구할 수 없어 MSIX(`makeappx` + 매니페스트 템플릿)로 결정, 2026-09-20 개설 — [devnull03/qrate#137](https://github.com/devnull03/qrate/issues/137)
- 그 밖에 Store 등재 준비 이슈: [fstubner/netscli#466 "List the desktop app in the Microsoft Store"](https://github.com/fstubner/netscli/issues/466), [pountzas/reach-Panel#176 "Distribute ReachPanel on Microsoft Store (MSIX / Store bundle + CI)"](https://github.com/pountzas/reach-Panel/issues/176) (본문 미열람, 제목만 확인)
- Inkwell: "a Tauri v2 (Rust) shell with a vanilla-JS frontend", "installable from the Microsoft Store, winget, Scoop, or as a portable exe". 글 작성자가 "we build Inkwell"이라고 밝힌 자사 홍보 글(2026-07-14) — [4worlds.dev Lore #018](https://4worlds.dev/lore/018-best-offline-markdown-editors-windows/)
- FluentHub의 Store 인증 실패(CertificationFailed) 이슈도 있으나 Tauri 앱이 아님(WinUI) — [0x5bfa/FluentHub#548](https://github.com/0x5bfa/FluentHub/issues/548)
- Microsoft는 Store가 Win32(WPF/WinForms), UWP, PWA, .NET MAUI, Electron 앱을 "no code changes required"로 받는다고 홍보 — [Windows Developer Blog 2025-09-10](https://blogs.windows.com/windowsdeveloper/2025/09/10/free-developer-registration-for-individual-developers-on-microsoft-store/)

### Inferences
- Frond와 구조가 가장 비슷한 선례(Tauri + vanilla 프런트 + 마크다운)는 Inkwell이지만, 경로(MSIX/EXE)는 공개되지 않았다. Store·winget·Scoop·포터블을 함께 내는 점으로 보아 Store 외 배포를 병행하는 전략이 흔하다.
- DeskSpawn처럼 "package identity가 있으면 자체 updater를 끈다"는 패턴은 MSIX 경로에서 Store 업데이트와 자체 업데이터가 충돌하지 않게 하는 실무 해법이다. 반대로 EXE 경로라면 자체 updater를 켜 둬야 Store 사용자도 업데이트를 받는다.

### Gaps
- Tauri로 **MSI/EXE 경로** 통과에 성공한 공개 후기(블로그·Reddit·HN)는 찾지 못했다.
- Typora·Obsidian·Joplin·MarkText의 Microsoft Store 등재 여부와 경로는 확인하지 못했다(검색 결과에서 Store 등재 언급 없음).
- 위 GitHub 사례들은 대부분 "준비·계획" 단계이고 최종 인증 결과는 확인되지 않았다.

## 7. 수익화 옵션(나중에 원할 때)과 한국 관련 메모

### Takeaway
MSI/EXE 제출도 가격 모델로 Free·Freemium·Subscription·Paid를 고를 수 있지만, **결제 처리는 자체·제3자 커머스만** 가능하다(Store 커머스는 MSIX 전용). 게임이 아닌 PC 앱은 자체 결제를 쓰면 수익 100%, Microsoft 커머스를 쓰면 앱 15%(게임 12%) 수수료. 개인 계정은 금융 정보를 핵심 기능으로 요구할 수 없다.

### Cited Findings
- MSI/EXE Availability: Markets(기본 전체, 240여 국가·지역), Discoverability(Store 노출 또는 링크 전용), Pricing "Free, Freemium, Subscription and Paid", Free Trial(Free·Freemium이면 불필요) — [Learn: price and availability (MSI/EXE, updated 2026-08-04)](https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msi/price-and-availability); [Learn: create app submission (MSI/EXE)](https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msi/create-app-submission)
- 커머스: MSIX는 "Use Microsoft Store commerce platform or your own or 3P commerce platform", Unpackaged(Win32)는 "Use your own or 3P commerce platform" — [Learn: distribute Win32 app](https://learn.microsoft.com/en-us/windows/apps/distribute-through-store/how-to-distribute-your-win32-app-through-microsoft-store)
- 수수료: 비게임 앱은 자체 커머스 시 100% 수익, Microsoft 커머스 사용 시 앱 15%·게임 12% — [Learn: why distribute through Store (updated 2024-07-23, **오래됨 가능**)](https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/why-distribute-through-store); 2026-05 회사 계정 공지도 "non-game apps to retain 100% of revenue through proprietary systems"라고 재확인 — [Windows Developer Blog 2026-05-07](https://blogs.windows.com/windowsdeveloper/2026/05/07/publish-to-microsoft-store-as-a-company-now-with-free-registration-and-faster-onboarding/)
- 10.8.1: "Non-game products made available on PC devices may either use a secure third-party purchase API or the Microsoft Store in-product purchase API for in-app purchases of digital items or services". 10.8.2: 기부도 디지털 혜택이 따르면 Microsoft in-product purchase API 사용 의무(다만 비게임 PC 앱은 10.8.1에 따라 제3자 API 허용), 제3자 API 사용 시 Partner Center에 표시 — [Store Policies v7.20](https://learn.microsoft.com/en-us/windows/apps/publish/store-policies)
- 10.8.3: "Products from individual accounts cannot require financial information for primary functionality." — [Store Policies v7.20](https://learn.microsoft.com/en-us/windows/apps/publish/store-policies)
- 10.8.4: 인앱 구매 종류·가격 범위·체험판 조건을 메타데이터에 명시 — [Store Policies v7.20](https://learn.microsoft.com/en-us/windows/apps/publish/store-policies)

### Inferences
- 지금처럼 무료라면 Pricing=Free만 고르면 되고 세금·지급 프로필은 필요 없을 가능성이 크다.
- EXE 경로에서 유료화하려면 Store가 결제를 대신하지 않으므로 Paddle·Lemon Squeezy 같은 자체 결제·라이선스 키를 앱에 넣어야 한다. Store 결제·환불을 쓰고 싶으면 MSIX 경로가 필요하다.
- 사업으로 판매하게 되면 10.14상 회사 계정이 요구될 수 있다(위 1절).

### Gaps
- 한국 개인 개발자의 Partner Center 지급(payout) 프로필, 미국 세금 양식(W-8BEN 등), 한·미 조세조약 원천징수율, 한국 부가세 처리 관련 2025–2026 공식 문서는 이번 조사에서 확인하지 못했다(무료 앱이면 불필요).
- Microsoft 커머스 수수료(15%/12%)를 2025–2026 날짜의 Learn 문서로 재확인하지 못했다(인용 페이지는 2024-07 수정본).
