# Frond는 GitHub로 먼저 내고 Store는 MSIX로 연다

2026-10-06 기준으로 Frond가 쓸 수 있는 배포 채널은 모두 입장료가 0원이다. Microsoft Store 개인 개발자 등록은 2025-09부터 무료이고 winget·Scoop·Chocolatey·GitHub Releases도 돈이 들지 않는다. 실제 비용과 장벽은 **Authenticode 코드 서명**에 몰려 있다. 지금의 NSIS 설치기를 Store에 EXE로 올리려면 설치기와 그 안의 모든 PE 파일을 Microsoft Trusted Root Program CA 체인 인증서로 서명해야 한다. 그런데 한국 거주 개인은 Azure Artifact Signing을 쓸 수 없고(개인은 미국·캐나다만, 게다가 Store 제출용으로 인정되지 않음), 국내 리셀러는 사업자등록증을 요구한다. 그래서 해외 개인용 인증서(연 €49~$300 이상)를 사거나 무료 오픈소스 경로를 타야 한다. Store가 대신 서명해 주는 **MSIX 경로는 서명비 0원에 Store 자동 업데이트까지 주지만**, NSIS 훅이 실행되지 않고 새 설치의 `%APPDATA%\Frond`가 가상화되며 AI 훅 스크립트가 exe를 찾지 못한다. "설치기가 레지스트리를 쓰고 앱은 읽기만 한다"는 Frond의 지금 구조가 깨지는 셈이다. 권장 순서는 라이선스 결정 → GitHub Releases + tauri-action + Tauri updater → winget(`cyKim.Frond`) → 코드 서명 도입 → (선택) 자체 Scoop 버킷 → 패키지 identity 분기 코드를 넣은 뒤 Store MSIX이고, Chocolatey는 보류한다. 어느 경로든 Store 밖 첫 다운로드의 SmartScreen 경고는 서명 여부와 관계없이 한동안 남는다. 따라서 서명은 "경고를 없애는 수단"이 아니라 "버전 사이에 평판을 이어 붙이는 수단"으로 봐야 한다.

## 입장료는 0원이고 진짜 관문은 한국 개인의 서명 자격이다

Microsoft Store 개발자 등록비는 **개인 계정이 2025-09-10부터, 회사 계정이 2026-05-07부터 무료**다([Windows Developer Blog 2025-09-10](https://blogs.windows.com/windowsdeveloper/2025/09/10/free-developer-registration-for-individual-developers-on-microsoft-store/); [Windows Developer Blog 2026-05-07](https://blogs.windows.com/windowsdeveloper/2026/05/07/publish-to-microsoft-store-as-a-company-now-with-free-registration-and-faster-onboarding/)). 개인 계정은 개인 Microsoft 계정(MSA)으로만 만들 수 있고 **정부 발급 신분증 촬영과 셀피**로 본인을 확인한다. 무료 흐름은 반드시 `storedeveloper.microsoft.com`에서 시작해야 한다. Partner Center나 Visual Studio로 바로 들어가면 옛(유료) 흐름이 뜬다([Learn: open a developer account](https://learn.microsoft.com/en-us/windows/apps/publish/partner-center/open-a-developer-account)). 개인 계정은 "사업·직업과 관련 없는" 배포를 위한 것이다. 정책 10.14는 게시자 이름이 사업체로 보이거나 금융 정보가 핵심 기능이면 회사 계정을 요구하고, 개인 계정을 회사 계정으로 바꾸는 기능은 없다([Microsoft Store Policies v7.20](https://learn.microsoft.com/en-us/windows/apps/publish/store-policies)). 무료 취미 앱인 Frond는 개인 계정이 맞고, 게시자 이름은 `cyKim`처럼 회사로 보이지 않는 핸들이 안전하다. 다만 두 가지는 확인되지 않았다. 한국이 개인 무료 등록 지원 시장이라는 공식 목록은 없고("nearly 200 markets"라는 표현만 있음), 게시자 표시명이 실명으로 강제되는지도 모른다.

Store 밖 패키지 저장소에서도 서명은 입장 조건이 아니다. winget 저장소 정책에는 코드 서명 조항이 아예 없다([Windows Package Manager repository policies](https://learn.microsoft.com/en-us/windows/package-manager/package/windows-package-manager-policies)). Scoop은 해시만 검증하고, Chocolatey는 VirusTotal·체크섬·설치/제거 검사를 한다([Chocolatey Docs: Moderation](https://docs.chocolatey.org/en-us/community-repository/moderation/)). 결국 돈과 자격이 걸리는 항목은 Authenticode 하나뿐이고, 그 시장은 최근 3년 사이 개인에게 불리해졌다. **2023-06부터 OV 인증서 개인 키는 HSM·USB 토큰·클라우드 HSM에만 둘 수 있어** .pfx 파일 인증서가 사라졌다([Learn: Code signing options](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/code-signing-options)). **2026-03-01 이후 발급 인증서의 유효기간은 최대 460일**이라 사실상 매년 갱신해야 한다([DigiCert 2025-10-15](https://www.digicert.com/blog/understanding-the-new-code-signing-certificate-validity-change)). Microsoft의 저가 서비스 Azure Artifact Signing(옛 이름 Trusted Signing, Basic $9.99/월)은 최신 문서에서도 **"Individual developers must be located in the United States or Canada"**라고 적는다([Learn: Artifact Signing quickstart](https://learn.microsoft.com/en-us/azure/artifact-signing/quickstart)). 게다가 이 CA는 Trusted Root Program에서 빠져 "Store eligible: No"로 표시된다([Learn: Artifact Signing certificate management](https://learn.microsoft.com/en-us/azure/artifact-signing/concept-certificate-management); [Learn: Code signing options](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/code-signing-options)). 국내 리셀러는 영문 사업자등록증을 요구하고 가격은 연 34만~66만 원+VAT다([SecureSign Sectigo](https://www.sslcert.co.kr/products/Sectigo/Code-Signing-Certificates); [CrossCert](https://www.crosscert.com/symantec/02_1_04.jsp)). 사업자가 없는 한국 개인에게 남는 선택지는 아래 표와 같다.

| 서명 경로 | 한국 개인 자격 | 연 비용 | 게시자 표시 | CI 무인 서명 | Store EXE 제출에 사용 |
|---|---|---|---|---|---|
| SignPath Foundation | 가능. OSI 라이선스, 이미 릴리스된 프로젝트, 평판 심사, 팀 전원 MFA, 서명 요청마다 수동 승인 | 0 | "SignPath Foundation" | GitHub Actions 연동(승인 필요) | 미확인 |
| Certum Open Source (SimplySign 클라우드) | 가능. 개인 전용, 신분증 + 본인 명의 공과금 고지서 + 공개 프로젝트 증빙 | €49 | "Open Source Developer, 실명" | 모바일 OTP 방식이라 어려움(추론) | 가능(Trusted Root CA로 추정) |
| SSL.com IV + eSigner | 가능. 정부 신분증, 검증 3~5일 | $129 + eSigner $180~ | 실명 | 가능 | 가능 |
| Sectigo Individual (SignMyCode 리셀러) | 가능. 신분증 + 전화 확인 | $301.99 + 국제 토큰 배송 $130 | 실명 | 토큰이면 불가 | 가능 |
| Azure Artifact Signing 개인 | **불가**(미국·캐나다만) | $9.99/월 | 실명 | 가능 | **불가** |
| 국내 리셀러 OV | **불가**(사업자등록증 필요) | 34만~66만 원+VAT | 회사명 | 토큰이면 불가 | 가능 |
| Store MSIX 재서명 | 가능 | 0 | Store | 해당 없음 | 해당 없음 |

출처: [SignPath Foundation Terms](https://signpath.org/terms), [Certum Shop](https://shop.certum.eu/open-source-code-signing-on-simplysign.html), [Certum 필요 서류](https://support.certum.eu/en/code-signing-required-documents/), [SSL.com IV](https://www.ssl.com/products/software-integrity/code-signing/iv/), [SignMyCode Sectigo Individual](https://signmycode.com/sectigo-individual-code-signing), [Learn: Artifact Signing quickstart](https://learn.microsoft.com/en-us/azure/artifact-signing/quickstart). eSigner $180는 검색 요약에만 있던 수치다.

서명이 실제로 해 주는 일은 기대보다 작다. **EV 인증서가 SmartScreen을 바로 통과하던 특혜는 2024년에 없어졌고**, 지금은 OV·EV·Artifact Signing이 모두 같은 평판 축적 과정을 거친다. 경고가 사라지는 정확한 임계값은 공개되지 않았고, Microsoft는 "몇 주, 넓은 사용자층의 수백 건 정상 설치"가 걸린다고만 설명한다([Learn: SmartScreen reputation](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/smartscreen-reputation)). 같은 문서가 꼽는 서명의 실익은 세 가지다. "알 수 없는 게시자" 대신 이름이 표시된다. 같은 게시자 신원으로 서명한 버전끼리는 평판이 이어진다(비서명 파일은 **버전마다 평판이 0에서 시작**한다). Windows 11 Smart App Control이 평판 없는 비서명 실행 파일을 막을 위험도 줄어든다. 반면 Store로 설치한 앱은 SmartScreen 다운로드 경고를 아예 받지 않는다. 이 비대칭 때문에 1인 개발 앱이 "인증서를 사서 경고를 없앤다"는 계획은 성립하지 않는다. 비용보다 중요한 것은 서명 신원을 한 번 정하면 바꾸지 않는 것이다.

## Store 밖 채널은 지금의 NSIS 설치기를 서명 없이 받는다

아래 표는 여덟 갈래 배포 경로를 Frond 기준으로 나란히 놓은 것이다. 비용은 2026-10 기준이고 "Frond 기능 영향"은 다음 절의 상세 표를 줄인 것이다.

| 채널 | 비용 | 서명 필요 | 패키징 작업 | 심사·소요 | 업데이트 방식 | Frond 기능 영향 |
|---|---|---|---|---|---|---|
| GitHub Releases + Tauri updater | 0원(파일당 2 GiB 미만, 대역폭 무제한) | Authenticode 불필요. updater 전용 Tauri 키는 필수(끌 수 없음) | 지금 NSIS 그대로 + `createUpdaterArtifacts`, updater 플러그인, tauri-action | 없음 | `latest.json` → NSIS `/P /UPDATE` 덮어쓰기 | 거의 없음. 업데이트 때 앱 자동 종료, POSTINSTALL 훅 재실행 |
| 자체 사이트(GitHub Pages 안내) | 0원(Cloudflare R2도 egress 무료) | 불필요 | 다운로드 페이지, SHA256, SmartScreen 안내 | 없음 | 수동 또는 updater | 없음 |
| winget 커뮤니티 저장소 | 0원 | 정책상 요구 없음 | 매니페스트(`nullsoft`, `Scope: user`, 버전 경로 URL, SHA256, `License`) | 자동 + 수동, 표본 중앙값 약 33시간(최대 약 17일) | 버전마다 PR(WinGet Releaser·Komac로 자동화) | 없음 |
| Scoop 자체 버킷 | 0원 | 불필요(해시만) | `frond.json`(`#/dl.7z`, shortcuts, checkver/autoupdate) | 없음 | `scoop update` | **훅 미실행**(파일 연결·기본 앱 목록 없음), WebView2 미설치, updater와 충돌 |
| Scoop Extras | 0원 | 불필요 | 위와 같음 + 이슈 승인 | 메인테이너 승인(GitHub 100 stars/50 forks 조건) | Extras 봇 autoupdate | 위와 같음 |
| Chocolatey | 0원 | 요구 확인 안 됨 | nuspec + `/S` 설치 스크립트, Chocolatey-AU | 며칠~몇 주, trusted가 아니면 버전마다 | Chocolatey-AU(AppVeyor/GHA) | 관리자 셸 실행이 currentUser 설치와 어긋남 |
| Store EXE | 계정 0원 + 인증서 €49~$300 이상/년 | **필수**: 설치기 + 모든 PE를 Trusted Root CA 체인으로(자체 서명·Artifact Signing 불가) | Store 전용 설정(`offlineInstaller`, 약 +127MB), `/S`, 버전별 불변 HTTPS URL | 최대 3영업일 | **Store가 해 주지 않음** → 앱 updater 필수 | 제거 잔여물 검사, 설치기 크기 증가 |
| Store MSIX | 0원(Store가 재서명) | 제출본은 서명하지 않음 | AppxManifest(runFullTrust, 파일 연결, 실행 별칭), tauri-windows-bundle 또는 winapp CLI | 최대 3영업일 | Store 자동(OS가 24시간마다 확인) | 훅 미실행, AppData 가상화, AI 훅 경로, `assoc.rs` 3곳, WebView2 검사, updater 제외 |

**GitHub Releases + Tauri updater**가 모든 채널의 바탕이다. GitHub Releases는 파일당 2 GiB 미만이면 총 용량·대역폭 제한이 없다([GitHub Docs: About releases](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases)). Tauri updater는 Authenticode와 별개인 **Tauri 전용 키쌍**으로 `setup.exe.sig`를 검증하며, 이 검증은 끌 수 없다([Tauri v2: Updater](https://v2.tauri.app/plugin/updater/)). 공개키가 앱에 박히므로 **개인 키를 잃으면 기존 설치본에 업데이트를 보낼 길이 끊긴다**. 키는 GitHub secret과 오프라인 백업 두 곳에 둔다. Windows에서 updater는 NSIS를 `/P /UPDATE /R /ARGS`로 실행한다([plugins-workspace updater.rs](https://github.com/tauri-apps/plugins-workspace/blob/v2/plugins/updater/src/updater.rs)). 템플릿은 업데이트 모드에서 제거 없이 덮어쓰고 WebView2 설치와 바로 가기 생성을 건너뛰지만, **`NSIS_HOOK_POSTINSTALL`은 업데이트 때마다 다시 실행**한다([tauri installer.nsi](https://github.com/tauri-apps/tauri/blob/dev/crates/tauri-bundler/src/bundle/windows/nsis/installer.nsi)). Frond의 `src-tauri/nsis/hooks.nsh`는 등록 작업을 모두 POSTINSTALL에 두고 `UserChoice`는 건드리지 않으므로, 반복 실행되어도 같은 HKCU 값을 다시 쓸 뿐이다. 주의할 점은 Tauri 문서대로 "설치 단계에서 앱이 자동 종료"된다는 것이다. 그래서 업데이트 전에 저장과 초안 백업(`drafts.rs`)을 확인하는 흐름이 필요하다. 설치 모드는 관리자 권한이 필요 없는 기본값 `passive`가 currentUser 설치와 맞는다. 빌드·릴리스·`latest.json` 업로드는 `tauri-action@v1` 하나로 처리된다([tauri-apps/tauri-action](https://github.com/tauri-apps/tauri-action)).

**winget**에 필요한 것은 공개 HTTPS URL, SHA256, 무인 설치, 그리고 필수 필드인 `License`다([Learn: winget manifest](https://learn.microsoft.com/en-us/windows/package-manager/package/manifest)). Tauri NSIS는 `InstallerType: nullsoft`로 등록하면 `/S`가 자동으로 붙고, Frond의 currentUser 설치는 `Scope: user`에 해당한다. ID는 `cyKim.Frond`로 하고, `Publisher`와 `PackageName`은 ARP 값(`cyKim`, `Frond`)과 맞춰야 `winget upgrade`가 연결된다. URL은 **버전이 박힌 `/releases/download/vX.Y.Z/` 경로**를 써야 한다. `/releases/latest/download/`는 리다이렉터라 `Validation-Indirect-URL`에 걸린다([Learn: Submit your manifest](https://learn.microsoft.com/en-us/windows/package-manager/package/repository)). Clash Verge Rev·pot·Obsidian도 모두 버전 경로 GitHub URL로 통과했다. 2026-09 이후 병합된 신규 패키지 PR 40건을 로컬에서 표본 조사한 결과, **생성부터 병합까지 중앙값은 32.6시간, 최대는 약 17일**이었다([winget-pkgs PR 검색](https://github.com/microsoft/winget-pkgs/pulls?q=is%3Apr+is%3Amerged+%22New+package%22+merged%3A%3E2026-09-01)). 첫 버전은 `wingetcreate new`나 `komac new`로 직접 낸다. 이후에는 release publish 이벤트에 WinGet Releaser를 걸면 되는데, classic PAT(`public_repo` + `workflow`)와 winget-pkgs fork가 필요하다([winget-releaser](https://github.com/vedantmgoyal9/winget-releaser)).

**Scoop**의 main 버킷은 GUI 앱을 받지 않는다([Scoop wiki: main criteria](https://github.com/ScoopInstaller/Scoop/wiki/Criteria-for-including-apps-in-the-main-bucket)). Extras 버킷은 **GitHub 100 stars 또는 50 forks** 수준의 인지도와 영어 UI를 요구한다([Extras package request 템플릿](https://github.com/ScoopInstaller/Extras/blob/master/.github/ISSUE_TEMPLATE/package-request.yml)). 지금 Frond에는 심사 없는 자체 버킷이 현실적이다. Tauri 앱의 관례는 NSIS setup.exe를 `#/dl.7z`로 풀어 포터블처럼 놓는 것이다([Extras pot.json](https://github.com/ScoopInstaller/Extras/blob/master/bucket/pot.json)). 이렇게 하면 **`hooks.nsh`의 파일 연결·Default Apps 등록과 WebView2 부트스트래퍼가 실행되지 않는다**. 파일 연결은 vscode 매니페스트처럼 `.reg` 파일을 같이 배포하고 `notes`로 사용자가 직접 가져오게 하는 것이 관례다([Extras vscode.json](https://github.com/ScoopInstaller/Extras/blob/master/bucket/vscode.json)). AI 훅 스크립트도 ProgId 명령과 `%LOCALAPPDATA%\Frond` 폴백을 둘 다 찾지 못하므로 Scoop 경로(`~\scoop\apps\frond\current\mdeditor.exe`)를 추가해야 한다(추론). 또 Scoop 설치본에서 Tauri updater가 NSIS를 실행하면 `%LOCALAPPDATA%` 아래에 **별도 설치본이 하나 더 생긴다**. 그래서 실행 경로에 `\scoop\apps\`가 있으면 updater를 끄는 분기가 필요하다.

**Chocolatey**는 무료이고 지금도 운영 중이다. 다만 자동 검사(Validator·Verifier) 뒤 자원봉사 모더레이터 검토가 "며칠~몇 주" 걸리고, trusted 패키지가 아니면 버전마다 검토가 반복된다([Chocolatey Blog 2025-06](https://blog.chocolatey.org/2025/06/ccr-moderation-behind-the-curtain/)). Chocolatey는 관리자 셸에서 도는 것이 기본이다. 그래서 currentUser NSIS를 `/S`로 돌리면 별도 관리자 계정의 프로필에 설치될 위험이 있다(추론). Verifier 환경이 Windows Server 2019라 WebView2가 없을 가능성도 있다([Chocolatey Package Verifier](https://docs.chocolatey.org/en-us/community-repository/moderation/package-verifier/)). Tauri 선례 중 Chocolatey에 올라간 것은 확인하지 못했다(Clash Verge Rev는 404).

비슷한 앱의 선례가 우선순위를 뒷받침한다. 2026-10-06 로컬 실측에서 Markdown 편집기 다섯 개(Typora·Obsidian·MarkText·Zettlr·Joplin)는 모두 winget에 있었고 대부분 Scoop Extras·Chocolatey에도 있었다. 하지만 Store(msstore 소스)에 있는 것은 Typora(`XPFPH15B9DLNZH`)뿐이었다([Learn: winget source](https://learn.microsoft.com/en-us/windows/package-manager/winget/source)). Tauri 앱은 GitHub Releases의 `*_x64-setup.exe` 하나를 winget(`nullsoft`)과 Scoop(`#/dl.7z`)이 함께 가리키는 패턴이 표준이다. **자체 사이트**는 GitHub Pages에 다운로드 안내·SHA256·SmartScreen "추가 정보 → 실행" 안내를 두고 바이너리는 Releases에 두는 조합이 가장 싸다. 다른 도메인을 주 배포처로 삼으면 winget `InstallerUrl`도 그 도메인이어야 하고 평판을 새로 쌓아야 한다([winget policies](https://learn.microsoft.com/en-us/windows/package-manager/package/windows-package-manager-policies)). 라이선스 없는 공개 저장소는 법적으로 "all rights reserved"다([choosealicense: No License](https://choosealicense.com/no-permission/)). 그래도 winget·Scoop은 `Proprietary`/`Freeware`로도 패키지를 받는다(Typora 선례, [Extras typora.json](https://github.com/ScoopInstaller/Extras/blob/master/bucket/typora.json)). 라이선스가 실제로 막는 것은 무료 서명(SignPath·Certum OSS) 하나다.

## Store EXE 경로는 서명비와 자체 updater를 둘 다 요구한다

Store 제출은 두 갈래다. Microsoft 배포 경로 문서는 MSIX를 서명 "Free (Store re-signs your package)", 업데이트 "Built-in"으로 정리한다. MSI/EXE는 서명 "Publisher must sign the installer and all PE files…", 업데이트 "Manual"이다([Learn: choose a distribution path](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/choose-distribution-path)). Tauri 공식 Store 가이드는 EXE 경로만 다룬다. 이유는 "Currently Tauri only generates EXE and MSI installers"다([Tauri v2: Microsoft Store](https://v2.tauri.app/distribute/microsoft-store/)).

**EXE 경로**의 요건은 정책 10.2.9에 있다. .exe/.msi만 받는다. **설치기와 그 안의 모든 PE 파일**은 Trusted Root Program CA 체인 인증서로 서명해야 하고, 자체 서명은 안 된다. 제출한 버전별 HTTPS URL의 바이너리는 바꾸면 안 된다. 설치는 무음이어야 하고(UAC는 허용), 다운로더 스텁은 금지된다([Store Policies v7.20 §10.2.9](https://learn.microsoft.com/en-us/windows/apps/publish/store-policies)). Tauri 가이드는 여기에 세 가지를 더한다. Store 전용 설정 파일(`tauri.microsoftstore.conf.json`)로 `webviewInstallMode`를 `offlineInstaller`로 바꾸고(**설치기 약 +127MB**), 무음 인자 `/S`(대문자)를 쓰며, publisher가 productName과 달라야 한다([Tauri v2: Microsoft Store](https://v2.tauri.app/distribute/microsoft-store/); [Tauri v2: Windows Installer](https://v2.tauri.app/distribute/windows-installer/)). Frond는 publisher `cyKim`과 productName `Frond`가 달라 마지막 조건은 이미 통과한다. 결정적 약점은 업데이트다. **Store는 EXE 앱의 기존 사용자에게 업데이트를 주지 않는다**([Learn: publish update to your MSI/EXE app](https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msi/publish-update-to-your-app-on-store)). 결국 EXE 경로는 인증서 비용과 Tauri updater 구현을 둘 다 요구하고, Store가 돌려주는 것은 노출과 SmartScreen 없는 첫 설치뿐이다. 인증 시험은 표준 사용자 계정 무음 설치, 시작 메뉴·ARP 등록, **잔여물 없는 제거**, standalone 설치기, 번들웨어 여부를 본다([Learn: MSI/EXE certification process](https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msi/app-certification-process)). Frond의 POSTUNINSTALL 훅은 설치 때 쓴 HKCU 키를 지운다. 하지만 `%APPDATA%\Frond` 사용자 데이터를 남기는 것이 위반인지는 공식 기준이 없다.

**MSIX 경로**에서는 Store가 인증 뒤 패키지를 다시 서명하므로 서명비가 0원이고, Store 관리 업데이트·단계적 출시·차등 다운로드가 따라온다([Learn: choose a distribution path](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/choose-distribution-path)). 2026년 공개 이슈를 보면 Tauri 앱들은 이 무료 서명 때문에 MSIX를 고르는 경향이 뚜렷하다. qrate는 EXE용 Trusted Root 인증서를 구할 수 없어 "MSIX is the only free route"라고 정리했다([devnull03/qrate#137](https://github.com/devnull03/qrate/issues/137)). lasterm은 미리 서명하면 publisher 불일치로 실패하니 **서명하지 않은 채 제출**하라고 적었다([khiops/lasterm#618](https://github.com/khiops/lasterm/issues/618)). Tauri 자체의 MSIX 지원 요청은 2022-08부터 열려 있다([tauri-apps/tauri#4818](https://github.com/tauri-apps/tauri/issues/4818)). 그래서 도구는 셋 중에서 고른다. 첫째, Microsoft **winapp CLI**는 Public Preview이고 Tauri 가이드의 전제가 Windows 11이다([Learn: Using winapp CLI with Tauri](https://learn.microsoft.com/en-us/windows/apps/dev-tools/winapp-cli/guides/tauri)). 둘째, 커뮤니티 **`@choochmeque/tauri-windows-bundle`**은 `tauri.conf.json`의 `fileAssociations`를 읽고 `runFullTrust`·실행 별칭 확장을 붙여 준다([Choochmeque/tauri-windows-bundle](https://github.com/Choochmeque/tauri-windows-bundle)). 셋째는 수동 `makeappx`다([Learn: Generating MSIX package components](https://learn.microsoft.com/en-us/windows/msix/desktop/desktop-to-uwp-manual-conversion)). Frond 개발기는 Windows 10 19045라 winapp이 Win10에서 도는지 확인이 필요하다. tauri-windows-bundle은 tauri-cli 버전에 민감해서, `--locked` 없이 설치했다가 MSIX 빌드가 깨진 사례가 있다([esoltys/luminous#1262](https://github.com/esoltys/luminous/pull/1262)). 매니페스트의 뼈대는 아래와 같다. `Identity`의 Name과 Publisher는 Partner Center 값과 같아야 하고, 버전은 4자리로 쓴다.

```xml
<Identity Name="<Partner Center 값>" Publisher="CN=<Partner Center 값>" Version="0.1.0.0" ProcessorArchitecture="x64" />
<Dependencies>
  <TargetDeviceFamily Name="Windows.Desktop" MinVersion="10.0.19041.0" MaxVersionTested="10.0.26100.0" />
</Dependencies>
<Capabilities><rescap:Capability Name="runFullTrust" /></Capabilities>
<Application Id="Frond" Executable="mdeditor.exe"
             uap10:RuntimeBehavior="packagedClassicApp" uap10:TrustLevel="mediumIL">
  <Extensions>
    <uap:Extension Category="windows.fileTypeAssociation">
      <uap3:FileTypeAssociation Name="markdown">
        <uap:SupportedFileTypes>
          <uap:FileType>.md</uap:FileType><uap:FileType>.markdown</uap:FileType> <!-- + .mdown .mkd .mkdn .mdwn -->
        </uap:SupportedFileTypes>
        <rescap3:MigrationProgIds><rescap3:MigrationProgId>MdEditor.Markdown</rescap3:MigrationProgId></rescap3:MigrationProgIds>
      </uap3:FileTypeAssociation>
    </uap:Extension>
    <uap3:Extension Category="windows.appExecutionAlias" EntryPoint="Windows.FullTrustApplication">
      <uap3:AppExecutionAlias><desktop:ExecutionAlias Alias="mdeditor.exe" /></uap3:AppExecutionAlias>
    </uap3:Extension>
  </Extensions>
</Application>
```

풀 트러스트 앱은 `runFullTrust` 제한 기능을 반드시 선언해야 하고, Store 제출 때는 사유를 적어야 한다([Learn: App capability declarations](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/app-capability-declarations)). `uap10` 속성을 쓰므로 MinVersion은 10.0.19041 이상이어야 한다([Learn: Application element](https://learn.microsoft.com/en-us/uwp/schemas/appxpackage/uapmanifestschema/element-application)).

**두 경로에 공통인 정책**도 있다. Policies v7.20(2026-09-15 게시, **2026-10-22 발효**)에서 Frond에 걸리는 항목은 다음과 같다. Win32 제품은 **항상 개인정보처리방침 URL**이 필요하다(10.5.1). 목록의 **Applicable license terms**는 필수라서, LICENSE 파일이 없어도 최종 사용자 라이선스 문구는 써야 한다. IARC 연령 등급 설문(11.11)을 채워야 하고, 스크린샷은 1장 이상, 1:1 박스 아트도 필요하다. 지원되는 방식과 사용자 동의 없이 Windows 설정을 바꾸면 안 된다(10.2.8)([Store Policies v7.20](https://learn.microsoft.com/en-us/windows/apps/publish/store-policies); [Learn: create app submission (MSI/EXE)](https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msi/create-app-submission)). Frond는 `UserChoice`를 직접 쓰지 않고 설정 앱을 여는 설계라 10.2.8과 맞는다. 이름은 Partner Center에서 예약하는데, **예약 후 3개월 안에 쓰지 않으면 풀린다**([Learn: reserve your app's name](https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msi/reserve-your-apps-name)). Store 웹에서 "Frond" 앱은 찾지 못했지만 다른 플랫폼에 동명 앱이 있어, 예약 가능 여부는 "Check availability"로만 확정된다. 인증은 공식적으로 **최대 3영업일**이고 통과 후 평균 15분 안에 목록이 보인다. 다만 1주 넘게 인증 단계에 머문 질문도 있다([Learn: MSI/EXE certification process](https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msi/app-certification-process)). 나중에 유료화를 생각한다면 기억해 둘 제약도 있다. EXE 경로는 Store 커머스를 쓸 수 없고 자체·제3자 결제만 가능하다([Learn: distribute your Win32 app through Store](https://learn.microsoft.com/en-us/windows/apps/distribute-through-store/how-to-distribute-your-win32-app-through-microsoft-store)).

## MSIX는 무료 서명의 대가로 Frond 구조 일곱 곳을 바꾼다

지금의 Frond는 "설치기(`hooks.nsh`)가 HKCU에 등록하고 앱(`assoc.rs`)은 읽기만 한다"는 구조다. MSIX에는 설치 스크립트가 없다. 설치 폴더(`C:\Program Files\WindowsApps`)는 읽기 전용이고, AppData에 새로 만드는 항목은 패키지 전용 위치로 리디렉션된다([Learn: Understanding how packaged desktop apps run](https://learn.microsoft.com/en-us/windows/msix/desktop/desktop-to-uwp-behind-the-scenes)). 아래 표는 기능별로 채널마다 무엇이 바뀌는지 정리한 것이다. Scoop의 AI 훅 칸과 Chocolatey의 관리자 프로필 칸은 추론이다.

| Frond 기능 | NSIS(GitHub·winget·자체 사이트) | Scoop `#/dl.7z` | Chocolatey | Store EXE | Store MSIX |
|---|---|---|---|---|---|
| 파일 연결·기본 앱 목록(`hooks.nsh`) | 그대로 | 미실행 → `.reg` + notes 안내 | 그대로(관리자 프로필 위험) | 그대로, 제거 잔여물 검사 대상 | 미실행 → manifest FTA + `MigrationProgId` |
| 기본 앱 판정·설정 열기(`assoc.rs`) | 그대로 | `is_registered` 항상 false | 그대로 | 그대로 | 3곳 분기 필요 |
| `%APPDATA%\Frond` 데이터·테마 폴더 | 그대로 | 그대로(`persist` 선택) | 그대로 | 그대로 | 새 설치면 LocalCache로 가상화, 탐색기에서 안 보임, 제거 시 삭제 |
| localStorage 설정·세션 | 그대로 | 그대로 | 그대로 | 그대로 | NSIS판과 분리될 수 있음 |
| AI 훅(`open-new-md.ps1`) | 그대로 | exe 탐색 실패 → Scoop 경로 추가 | 그대로 | 그대로 | 실행 별칭 경로를 1순위로 |
| WebView2 | 부트스트래퍼가 설치 | 설치 안 함 | 부트스트래퍼(검증 VM 네트워크 위험) | `offlineInstaller` 필수 | 시작 시 검사 코드 필요 |
| 업데이트 | Tauri updater | updater 끄기 | Chocolatey-AU | Tauri updater 필수 | updater 제외, Store가 갱신 |
| single-instance | 그대로 | 그대로 | 그대로 | 그대로 | 동작 예상, NSIS판과 교차 전달 가능 |

**파일 연결**은 manifest의 `uap:FileTypeAssociation` 하나로 해결된다. 이것만으로 "연결 프로그램" 목록과 기본 앱 목록에 노출되고, 기존 NSIS 사용자의 `UserChoice=MdEditor.Markdown`은 `rescap3:MigrationProgIds`로 이어받는다([Learn: desktop-to-uwp-extensions](https://learn.microsoft.com/en-us/windows/apps/desktop/modernize/desktop-to-uwp-extensions)). 대신 패키지 앱의 ProgId는 `AppX<해시>` 형태라서 `assoc.rs`의 세 곳이 틀어진다. `is_registered()`는 `RegisteredApplications\Frond`가 없어 항상 false를 돌려준다. `open_default_apps_settings()`는 `registeredAppUser=Frond` 대신 `registeredAUMID=<PFN>!Frond`를 써야 하고, 이때 Win11에서는 `MaxVersionTested`가 10.0.22621.1555 이상이어야 한다([Learn: Launch the Default Apps settings page](https://learn.microsoft.com/en-us/windows/apps/develop/launch/launch-default-apps-settings)). `query_default_app()`의 `MdEditor.Markdown` 비교는 Frond가 기본 앱이어도 아니라고 판정하게 된다. 해법은 하나로 모인다. `Package::Current()` 성공 여부로 패키지 실행을 판정하는 함수를 Rust에 하나 두고 세 모듈이 공유하면, NSIS판과 MSIX판을 한 코드베이스로 유지할 수 있다([Learn: Using winapp CLI with Tauri](https://learn.microsoft.com/en-us/windows/apps/dev-tools/winapp-cli/guides/tauri)).

**데이터 폴더**가 사용자 체감으로는 가장 큰 변화다. Windows 10 1903 이상에서 패키지 앱이 AppData에 **새로 만드는** 파일·폴더는 `%LOCALAPPDATA%\Packages\<PFN>\LocalCache\…`로 가고 앱 안에서만 합쳐 보이며, 패키지를 제거하면 함께 지워진다([Learn: Understanding how packaged desktop apps run](https://learn.microsoft.com/en-us/windows/msix/desktop/desktop-to-uwp-behind-the-scenes)). 2026년 실측 두 건은 "AppData 루트의 새 항목만 리디렉션되고, 이미 있는 실제 폴더 안의 쓰기는 그대로 통과한다"고 보고했다([anthropics/claude-code#89113](https://github.com/anthropics/claude-code/issues/89113); [tox-dev/platformdirs#597](https://github.com/tox-dev/platformdirs/pull/597)). 따라서 새 MSIX 설치에서는 `%APPDATA%\Frond`가 가상 위치에 생긴다. `open_themes_folder`가 탐색기에 넘기는 경로는 패키지 밖 프로세스인 탐색기에게 존재하지 않는 경로가 되고, 초안·테마는 앱 제거와 함께 사라진다. NSIS 시절의 실제 폴더가 이미 있으면 두 설치가 데이터를 공유한다. 반면 `%APPDATA%\MdEditor` → `Frond` 이름 바꾸기는 루트에 새 항목을 만드는 셈이라 가상 쪽만 옮겨져 폴더가 둘로 갈린다. 이 저장소가 Claude 데스크톱 MSIX 컨테이너 안에서 실제로 겪은 것과 같은 패턴이다(로컬 메모 `claude-msix-appdata-virtualization.md`). 대응은 두 가지 중 하나다. 테마처럼 사용자가 손대는 폴더를 `Documents\Frond`로 옮기거나, 탐색기에 넘기기 전에 `std::fs::canonicalize`로 실제 경로를 구한다. Win11의 `ExcludedDirectory`는 `unvirtualizedResources` 제한 기능이 필요한데, 문서가 이 기능을 "게임용이고 다른 시나리오용이 아니다"라고 못 박아 Store 승인을 기대하기 어렵다([Learn: Flexible virtualization](https://learn.microsoft.com/en-us/windows/msix/desktop/flexible-virtualization)). WebView2 데이터(localStorage, `%LOCALAPPDATA%\com.cykim.mdeditor`)에도 같은 규칙이 적용된다. 그래서 NSIS에서 MSIX로 옮길 때 설정과 탭 세션이 초기화될 수 있다.

**AI 훅 스크립트**는 지금 `MdEditor.Markdown\shell\open\command`에서 exe를 찾고, 없으면 `%LOCALAPPDATA%\Frond\mdeditor.exe`로 폴백한다. MSIX 단독 설치에는 둘 다 없다. manifest에 `uap3:AppExecutionAlias`(`mdeditor.exe`)를 넣으면 PATH에 있는 0바이트 reparse 파일 `%LOCALAPPDATA%\Microsoft\WindowsApps\mdeditor.exe`로 인수와 함께 실행할 수 있고, 이렇게 실행된 Frond는 자기 패키지 identity로 돈다([Tyranid's Lair: Windows Execution Aliases](https://www.tiraniddo.dev/2019/09/overview-of-windows-execution-aliases.html)). 스크립트는 이 경로를 1순위로 찾도록 바꾼다. `explorer shell:AppsFolder` 방식은 인수를 넘길 수 없어 `--from-hook`을 쓸 수 없다. 부수 효과도 있다. Claude 데스크톱 컨테이너에서 띄운 앱의 데이터가 Claude 쪽 LocalCache로 새던 문제(지금 WMI로 우회하는 이유)는, Frond가 자기 identity로 돌게 되면 사라질 가능성이 크다(추론).

**WebView2·updater·single-instance**도 손봐야 한다. MSIX는 설치 중에 부트스트래퍼를 돌릴 수 없다. manifest의 `ExternalDependency`(WebView2)는 App Installer로 설치할 때만 적용된다([Learn: win32dependencies:ExternalDependency](https://learn.microsoft.com/en-us/uwp/schemas/appxpackage/uapmanifestschema/element-win32dependencies-externaldependency)). Win11은 런타임을 OS에 포함하고 Win10도 "대다수"가 이미 갖고 있지만 보장은 아니다([Learn: WebView2 distribution](https://learn.microsoft.com/en-us/microsoft-edge/webview2/concepts/distribution)). 그래서 시작할 때 `pv` 레지스트리나 `GetAvailableCoreWebView2BrowserVersionString`으로 런타임을 검사하고, 없으면 안내하는 코드가 필요하다. 설치 폴더가 읽기 전용이므로 Tauri updater는 MSIX 빌드에서 빼야 한다. 실행하면 비패키지 사본이 따로 깔린다. DeskSpawn은 package identity가 있으면 updater를 끄는 방식으로 이 문제를 처리했다([shira022/deskspawn#174](https://github.com/shira022/deskspawn/pull/174)). single-instance 플러그인은 이름 있는 mutex와 창 클래스를 쓰고 BNO 격리는 opt-in이라 그대로 동작할 것으로 보인다([plugins-workspace single-instance](https://github.com/tauri-apps/plugins-workspace/blob/v2/plugins/single-instance/src/platform_impl/windows.rs)). 다만 NSIS판과 MSIX판이 같은 identifier를 쓰면 서로에게 인수를 넘기므로 병행 기간을 짧게 둔다. Store판과 사이드로드 MSIX는 Publisher CN이 달라 서로 다른 앱(PFN)이 된다. 그래서 MSIX는 Store 한 곳에만 낸다. 사이드로드는 어차피 신뢰 인증서 서명이 필요하고, `ms-appinstaller:` 웹 설치 프로토콜도 2023-12부터 기본 비활성이다([MSRC 2023-12](https://www.microsoft.com/en-us/msrc/blog/2023/12/microsoft-addresses-app-installer-abuse)).

## 권장 경로는 라이선스, GitHub, winget, 서명, Store MSIX 순이다

순서의 원칙은 두 가지다. 첫째, 코드 변경 없이 열 수 있는 채널(GitHub Releases·winget)을 먼저 열어 다운로드와 평판을 쌓는다. 둘째, 코드 변경이 필요한 Store MSIX는 패키지 분기 작업이 끝난 뒤에 낸다. 서명은 첫 비서명 릴리스 뒤에 붙인다. SignPath가 "이미 릴리스된" 프로젝트를 요구하고, 서명 신원은 한 번 정하면 바꾸지 않는 편이 평판에 유리하기 때문이다.

| 단계 | 할 일 | 결정 지점·진입 조건 |
|---|---|---|
| 0. 기반 | LICENSE 추가, D2Coding(OFL)·npm·crates 의존성 라이선스 점검, 개인정보처리방침 페이지(GitHub Pages, "로컬 파일만 읽고 쓰며 수집·전송 없음") | 결정 ① 라이선스 |
| 1. GitHub Releases | `tauri-action@v1` 태그 트리거, `createUpdaterArtifacts`, updater 플러그인(`passive`), `tauri signer` 키 이중 백업, 업데이트 전 저장·초안 확인, 다운로드 안내(SHA256·SmartScreen·WebView2) | 결정 ② 첫 릴리스 서명 여부(비서명으로 시작 가능) |
| 2. winget | `wingetcreate new`/`komac new`로 `cyKim.Frond` 첫 제출(`nullsoft`, `Scope: user`, 버전 경로 URL, `ko-KR` 로캘) → WinGet Releaser 자동화 | 1단계 릴리스가 publish 상태일 것, classic PAT |
| 3. 코드 서명 | OSI면 SignPath 신청, 실명 게시자가 필요하면 Certum OSS, 비OSI면 SSL.com IV + eSigner. Tauri `signCommand`(비밀은 환경 변수로) + `timestampUrl` 필수 | 결정 ② 서명 방식 |
| 4. Scoop(선택) | 자체 버킷 `frond.json`(`#/dl.7z`), `\scoop\apps\` 경로면 updater 끄기, 파일 연결 `.reg` + notes, AI 훅 경로 추가 | 결정 ④ 데이터 폴더(`persist` 여부 포함) |
| 5. MSIX 준비 | `Package::Current()` 분기 함수, `assoc.rs` 3곳·`appdata.rs` rename·`themes.rs` 경로 수정, WebView2 검사, MSIX 빌드에서 updater 제외, manifest(FTA·MigrationProgId·실행 별칭), 훅 스크립트 별칭 우선 | 결정 ③ Store 경로, 결정 ④ 테마 폴더 위치 |
| 6. Store 제출 | `storedeveloper.microsoft.com`에서 개인 계정, 이름 예약(3개월 안에 제출), 목록(스크린샷·license terms·개인정보처리방침·IARC·ko/en 설명), Notes for certification에 runFullTrust 사유와 "샘플 .md를 열어 보라"는 안내, 미서명 MSIX 업로드, 제출 전 WACK | 결정 ⑤ MSIX 배포처, 결정 ⑥ 계정·게시자명 |
| 7. 보류 | Scoop Extras(100 stars/50 forks 이후), Chocolatey(currentUser 문제 해결 뒤) | 인지도·수요 |

| 결정 | 선택지 | 판단 기준 | 이 보고서의 권장 |
|---|---|---|---|
| ① 라이선스 | MIT·Apache-2.0 등 OSI 허용형 / GPL 계열 / Proprietary·Freeware + EULA | 무료 서명 자격(SignPath는 OSI + 상업 듀얼 라이선스 금지, Certum OSS는 오픈소스 프로젝트), 유료화 계획, 의존성 호환 | 유료화 계획이 없으면 OSI 허용형. 유료화 여지를 남기려면 Proprietary로 두고 서명은 SSL.com IV |
| ② 서명 방식 | 비서명 / SignPath(0원, 게시자 "SignPath Foundation") / Certum OSS(€49, 실명) / SSL.com IV(+eSigner, CI 무인) | 게시자 표시명, CI 무인 서명, 실명 공개 부담, Store EXE 사용 여부 | 비서명으로 시작 → OSI면 SignPath 신청, 실명 게시자가 중요하면 Certum OSS. 한 번 정하면 유지 |
| ③ Store 경로 | MSIX / EXE | 인증서 보유 여부, 코드 수정 의지, 업데이트 책임 | **MSIX**. EXE는 이미 Trusted Root 인증서가 있고 MSIX 분기 작업을 피해야 할 때만 |
| ④ 테마·사용자 폴더 | `%APPDATA%` 유지 + `canonicalize` / `Documents\Frond`로 이전 / Win11 `ExcludedDirectory` | 탐색기 노출, 제거 후 보존, Store 승인 가능성 | `Documents\Frond`로 이전(MSIX·Scoop 문제를 함께 단순화). 최소 대응은 `canonicalize` |
| ⑤ MSIX 배포처 | Store만 / Store + 사이드로드 | PFN 분리, 사이드로드 서명 비용 | Store만 |
| ⑥ 계정·게시자명 | 개인 / 회사 | 사업 관련성, 게시자명이 회사처럼 보이는지, 개인→회사 전환 불가 | 개인 계정, 핸들형 게시자명 |
| ⑦ 채널 우선순위 | 개발자 우선(GitHub·winget) / 일반 사용자 우선(Store) | 주 사용자층, SmartScreen 경고 허용도 | 개발자 우선. 비개발자 비중이 크면 5~6단계를 2단계 뒤로 당김 |

반대 순서도 성립한다. 주 사용자가 비개발자이고 SmartScreen 경고 자체가 이탈 요인이라면, Store MSIX는 **무료로 경고 없는 설치를 주는 유일한 길**이다. Store에 MSIX가 올라가면 `winget install --source msstore <StoreId>`로도 설치되므로 winget 사용자까지 일부 덮는다([Learn: winget source](https://learn.microsoft.com/en-us/windows/package-manager/winget/source)). 그 대가는 MSIX 분기 작업을 먼저 해야 한다는 것과 NSIS판 사용자와의 데이터 분리를 처음부터 안고 간다는 것이다. 반대로 **Store EXE 경로는 이 앱에 가장 나쁜 조합**이다. 인증서를 사고, 설치기에 127MB를 더 싣고, 그래도 updater를 직접 구현해야 한다. Store 문서와 Tauri 가이드가 모두 EXE를 "변경 없이 올리는 길"처럼 소개하지만, 한국 개인 개발자에게는 가장 비싼 길이다.

## 출처 충돌과 실기로만 닫히는 미확인 항목

조사자들이 기록한 출처 간 충돌과 이 보고서의 판단은 다음과 같다.

| 주제 | 출처 A | 출처 B | 판단 |
|---|---|---|---|
| Store EXE 서명 | 인증 절차 문서: "highly recommended"([certification process](https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msi/app-certification-process)) | 정책 10.2.9·패키지 요건·배포 경로 문서(2026-09): must, 자체 서명 불가([package requirements](https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msi/app-package-requirements)) | 필수로 본다 |
| Win32 개인정보처리방침 | MSI/EXE 제출 체크리스트: 개인정보 접근에 "예"라고 답했을 때만 | 정책 10.5.1: Win32는 항상 | 준비한다 |
| 회사 계정 등록비 | 2025-09 기사들: 유료 유지 | 2026-05-07 블로그·Learn(2026-07-17 수정): 무료 | 무료(최신 기준) |
| Artifact Signing 조직 국가 | Code signing options(2026-08-29): 미국·캐나다·EU·영국 | Quickstart(2026-09-29): 한국·일본 등 추가 | 개인은 두 문서 모두 미국·캐나다만이라 Frond에는 결론이 같다 |
| Artifact Signing 개인 온보딩·조직 이력 | Q&A 답변: 개인 온보딩 중단, 조직 3년 이력([Q&A 5810735](https://learn.microsoft.com/en-us/answers/questions/5810735/cant-create-a-new-trusted-signing-individual-ident)) | MS 직원 답변(2026-08-17): 최소 업력 제한 없음([Q&A 5977141](https://learn.microsoft.com/en-us/answers/questions/5977141/azure-artifact-signing-trusted-signing-is-a-us-llc)) | 1차 문서와 직원 답변을 따른다. 옛 공지 인용은 낡은 정보 |
| Artifact Signing 인증서 수명 | DevClass: 24시간 | MS Learn: 72시간 | 72시간. 어느 쪽이든 타임스탬프가 필수 |
| MSIX 앱의 HKCU 쓰기 가상화 | MS 문서·[claude-code#99059](https://github.com/anthropics/claude-code/issues/99059): HKCU\Software 쓰기가 패키지 전용 hive로 감 | 이 저장소의 2026-10-06 실측 메모: Claude 컨테이너 안 NSIS의 `HKCU\Software\Classes` 쓰기가 사용자 쪽에 보임 | 미해결. Frond MSIX는 런타임에 연결을 쓰지 않으므로 결론에 영향 없음 |
| Tauri의 WACK "Blocked Executables" | [tauri#14935](https://github.com/tauri-apps/tauri/issues/14935): 실패 | [lasterm#618](https://github.com/khiops/lasterm/issues/618): 정보성 경고. EXE 앱은 S 모드 비대상 | 제출 전에 WACK를 돌려 보고 판단 |
| winget 비서명 설치기 | 여러 OSS 경험담: 통과 | 일부 주장: 비서명 MSI 거절(1차 출처 없음) | 정책에 조항이 없으므로 통과를 전제로 하되, 평판 검사로 지연될 수 있음 |
| msstore 카탈로그 규모 | 2020 기사: 엄선된 289개 | 2026-10 로컬 실측: Typora·Notepads 검색됨 | 낡은 기사는 버린다 |

실기나 가입 화면에서만 닫히는 미확인 항목은 다음과 같다. 각 항목이 어느 결정에 걸리는지 함께 적는다.

| 미확인 항목 | 걸리는 결정·단계 | 확인 방법 |
|---|---|---|
| 한국이 Store 개인 무료 등록 지원 시장인지, 게시자 표시명이 실명으로 강제되는지 | ⑥, 6단계 | `storedeveloper.microsoft.com` 가입 화면 |
| Store EXE URL로 GitHub Releases(CDN 리다이렉트)를 받는지, "모든 PE"에 offline WebView2 설치기·NSIS 플러그인·uninstall.exe가 포함되는지 | ③ | Partner Center 시험 제출. Tauri 번들러의 제거기 서명은 changelog 2.7.5로 간접 확인만 됨 |
| `%APPDATA%\Frond`를 남기는 것이 "clean uninstall" 위반인지 | ③, ④ | 인증 보고서 |
| winget·Chocolatey 검증 VM에서 `downloadBootstrapper`가 네트워크로 WebView2를 받는지 | 2단계 | 첫 PR의 검증 결과 |
| Certum이 한국 신분증·한국어 고지서를 받는지, SimplySign을 CI에서 무인으로 쓸 수 있는지 | ② | Certum 지원 문의 |
| SignPath의 심사 기간과 평판 기준 | ② | 신청 |
| OV 재발급(새 키) 때 SmartScreen 평판이 이어지는지 | ② | 공식 설명 없음, 운영하며 관찰 |
| winapp CLI가 Windows 10 19045에서 `pack`을 수행하는지 | 5단계 | 개발기에서 실행 |
| 패키지 FTA가 만드는 `HKCR\AppX<해시>` 키 구조(`query_default_app` 비교용) | 5단계 | Win10·Win11 실기 |
| 실행 별칭(0바이트 reparse 파일)의 `Test-Path` 결과, WMI `Win32_Process.Create`로 실행되는지, 작업 디렉터리 상속 | 5단계 AI 훅 | 실기 |
| `rescap3:MigrationProgIds`가 Store 별도 승인 대상인지, Store 설치가 WebView2 `ExternalDependency`를 처리하는지 | 5~6단계 | 시험 제출 |
| Tauri 번들러가 Authenticode 서명을 updater `.sig` 생성보다 먼저 하는지, updater로 받은 setup.exe에 MOTW가 붙는지 | 1·3단계 | 빌드 산출물 검사 |
| Tauri Store 가이드의 "handle auto-updates" 문구(검색 스니펫으로만 확인), 가이드 최종 수정일(조사자 간 "2026-06-15"와 "미확인"으로 엇갈림) | 참고 | 원문 재확인 |

몇몇 근거는 성격상 따로 짚어 둔다. Store에 오른 Tauri 기반 Markdown 편집기 Inkwell의 사례는 자사 홍보 글이고 경로(MSIX/EXE)는 공개되지 않았다([4worlds.dev Lore #018](https://4worlds.dev/lore/018-best-offline-markdown-editors-windows/)). 공개된 Tauri의 Store 진출 사례 대부분은 "준비·계획" 단계라 최종 인증 결과가 확인되지 않았다. Tauri 앱이 **EXE 경로로** Store 인증을 통과한 공개 후기도 찾지 못했다.

## 결론

이번 조사로 분명해진 것은 2026년 Windows 배포의 장벽이 Store 정책이 아니라 **서명 신원의 지리**라는 점이다. 미국·캐나다 개인은 월 $9.99짜리 Artifact Signing으로 끝나지만, 한국 개인에게는 그 길이 없다. 그 공백을 메우는 것이 Store MSIX 재서명과 SignPath·Certum OSS 같은 오픈소스 전용 경로다. 그래서 Frond에서는 **라이선스 선택이 사실상 서명 비용을 정하는 첫 기술 결정**이 된다. OSI 라이선스를 달면 Store 밖 서명을 0원 또는 €49로 해결할 수 있고, 달지 않으면 연 $130~$300 이상이 든다.

두 번째로, 가장 효율적인 엔지니어링 투자는 특정 채널 대응이 아니라 **"나는 어떻게 설치됐는가"를 런타임에 판정하는 함수 하나**다. 패키지 identity가 있으면 updater를 끄고 `assoc.rs`가 AUMID를 쓰게 하고, `\scoop\apps\` 경로면 updater를 끄고 연결을 안내하게 하는 식이다. 이 분기 하나로 NSIS·Scoop·MSIX를 같은 바이너리 계열로 유지할 수 있다. 테마 폴더를 AppData 밖으로 옮기는 결정도 MSIX 가상화, Scoop persist, 제거 시 데이터 손실을 한꺼번에 줄인다. 따라서 배포 작업의 실제 첫 커밋은 Store 매니페스트가 아니라 이 두 가지 구조 정리가 될 가능성이 크다.

---

근거 노트: `docs/research/research_notes/Frond 윈도우 앱 배포 방법/` (ms_store_submission.md, code_signing.md, other_channels.md, msix_packaging.md). 로컬 확인 파일: `src-tauri/tauri.conf.json`, `src-tauri/nsis/hooks.nsh`. 조사일 2026-10-06.
