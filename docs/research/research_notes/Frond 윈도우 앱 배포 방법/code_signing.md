# Windows 코드 서명(Authenticode)·SmartScreen — 한국 거주 개인 개발자가 Tauri 2 앱(Frond)을 서명하는 방법 (2026-10 기준)

> 조사일 2026-10-06. 가격은 출처 표기 통화·시점 그대로 적었다. 2025년 이전 자료는 [STALE?] 표시. 출처끼리 충돌하면 [CONFLICT]로 표시했다.

## 1. Azure Artifact Signing(옛 이름 Trusted Signing) — 상태·자격·가격·신원 확인·인증서 수명·Tauri/CI 연동

### Takeaway
Trusted Signing은 2026-01-14 GA와 함께 "Azure Artifact Signing"으로 이름이 바뀌었고 Basic $9.99/월이다. 하지만 2026-09 기준 Microsoft 공식 문서에서 **개인(Individual) Public Trust는 미국·캐나다 거주자만** 된다. 따라서 한국 거주 개인은 쓸 수 없다. 조직은 최신 quickstart에 South Korea가 추가됐지만 법인 같은 legal business entity가 있어야 하고, 다른 MS 문서와 충돌한다.

### Cited Findings
**이름·GA**
- Microsoft가 2026-01-14 GA를 발표했고, 프리뷰 때 이름 "Trusted Signing"을 "Azure Artifact Signing"으로 바꿨다 — [DevClass 2026-01-14](https://www.devclass.com/security/2026/01/14/code-signing-windows-apps-may-be-easier-and-more-secure-with-new-azure-artifact-service/4079554)
- MS Learn 문서는 "Azure Artifact Signing (formerly Trusted Signing)"으로 표기하고, 리소스 공급자는 `Microsoft.CodeSigning`, CLI 확장은 `az extension add --name artifact-signing`이다 — [MS Learn Quickstart (ms.date 2026-05-21, updated 2026-09-29)](https://learn.microsoft.com/en-us/azure/artifact-signing/quickstart)

**자격(국가)**
- 최신 quickstart 원문: "Public Trust certificates are available to organizations in the United States, Canada, the European Union, the United Kingdom, Australia, New Zealand, Japan, South Korea, Singapore, Switzerland, Norway, and Israel. Individual developers must be located in the United States or Canada. These geographic restrictions do not apply to Private Trust certificates." — [MS Learn Quickstart (updated 2026-09-29)](https://learn.microsoft.com/en-us/azure/artifact-signing/quickstart)
- [CONFLICT] Windows 앱 개발 문서(2026-08-29)는 아직 "available to organizations in the USA, Canada, the European Union, and the United Kingdom. Individual developers are currently limited to the USA and Canada"라고 적어 South Korea 등 확장 국가가 빠져 있다 — [MS Learn: Code signing options (2026-08-29)](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/code-signing-options). 두 문서 모두 "개인은 미국·캐나다만"이라는 점은 같다.
- 2026-03 Microsoft Q&A에서 프랑스 개인 개발자가 Individual identity 국가 목록에 프랑스가 없다고 물었고, 답변은 "expected behavior"였다. 그 답변은 "individual developer onboarding has been paused", "organizations based in the United States and Canada with at least three years of verifiable history"라는 옛 공지도 인용했다 — [MS Q&A 5810735 (2026-03-06)](https://learn.microsoft.com/en-us/answers/questions/5810735/cant-create-a-new-trusted-signing-individual-ident). [CONFLICT/STALE?] 2025년 제한 공지를 그대로 옮긴 것으로 보이며, 최신 quickstart와 맞지 않는다.
- 조직의 "3년 이력" 요건: 2026-08-17 Q&A에서 MS 직원(Meha-MSFT)은 "Artifact Signing has country/region onboarding pre-reqs, no minimum org age restrictions"라고 답했다. 같은 스레드의 AI 생성 답변은 "3년 tax history 필요"라고 해서 서로 충돌한다 — [MS Q&A 5977141 (2026-08-17)](https://learn.microsoft.com/en-us/answers/questions/5977141/azure-artifact-signing-trusted-signing-is-a-us-llc)

**개인 신원 확인 절차(미국·캐나다 개인 기준)**
- 개인 Public Trust 검증은 구독에 연결된 Azure billing account에서 신원 정보를 가져온다. billing account의 Account Type이 **Individual**이어야 하고, legal name·sold-to address가 정부 발급 신분증과 일치해야 한다 — [MS Learn Quickstart](https://learn.microsoft.com/en-us/azure/artifact-signing/quickstart)
- 절차: 포털에서 Identity validation → Individual → Public을 만들고, 제3자 AU10TIX에서 신분증 촬영과 얼굴 확인을 거쳐 Microsoft Authenticator에 Verified ID를 추가한 뒤 공유한다. 신분증은 여권, 운전면허, 국가 ID 카드를 받고, 주소 증빙으로 utility bill이나 은행 명세서를 쓴다 — [MS Learn Quickstart](https://learn.microsoft.com/en-us/azure/artifact-signing/quickstart)
- 조직 검증 처리 시간은 "1 to 20 business days" — [MS Learn Quickstart](https://learn.microsoft.com/en-us/azure/artifact-signing/quickstart)
- 인증서 CN·O는 바꿀 수 없다. CSBR에 따라 검증된 법적 이름만 들어간다 — [MS Learn Artifact Signing FAQ (updated 2026-10-06)](https://learn.microsoft.com/en-us/azure/artifact-signing/faq)
- 무료, 체험, 후원 Azure 구독으로는 쓸 수 없고 유료(pay-as-you-go 등) 구독이 필요하다 — [FAQ](https://learn.microsoft.com/en-us/azure/artifact-signing/faq)

**가격**
- Basic $9.99/월(월 5,000 서명, 인증서 프로필 1개), Premium $99.99/월(월 100,000 서명, 프로필 10개) — [DevClass 2026-01-14](https://www.devclass.com/security/2026/01/14/code-signing-windows-apps-may-be-easier-and-more-secure-with-new-azure-artifact-service/4079554). 초과분은 서명당 $0.005라는 수치는 검색 요약에만 있었다 — [Azure pricing page](https://azure.microsoft.com/en-us/pricing/details/artifact-signing/). 가격 페이지를 직접 받아 보니 금액 자리가 비어("$-") 있었다. 동적으로 렌더링되는 페이지로 보이며 쿼터(5,000 / 100,000)만 확인됐다.
- MS 문서도 "Starts at $9.99/month"라고 적는다 — [MS Learn: SmartScreen reputation](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/smartscreen-reputation)
- 일할 계산 없이 생성 시점에 SKU 전액이 청구된다 — [FAQ](https://learn.microsoft.com/en-us/azure/artifact-signing/faq)

**인증서 수명·EV 여부**
- "Artifact Signing certificates are renewed daily and are valid for only 72 hours." 타임스탬프 countersign이 필수이고 TSA는 `http://timestamp.acs.microsoft.com` — [MS Learn: Certificate management (2026-09-30)](https://learn.microsoft.com/en-us/azure/artifact-signing/concept-certificate-management). signing-integrations 문서도 "three-day validity"라고 한다 — [MS Learn: Signing integrations](https://learn.microsoft.com/en-us/azure/artifact-signing/how-to-signing-integrations)
- [CONFLICT] DevClass 기사는 "24-hour validity, renewed daily"라고 썼다 — [DevClass](https://www.devclass.com/security/2026/01/14/code-signing-windows-apps-may-be-easier-and-more-secure-with-new-azure-artifact-service/4079554). MS 1차 문서(72시간)를 따른다.
- 인증서가 매일 바뀌므로 프로필별 고유 EKU(`1.3.6.1.4.1.311.97.*`)를 durable identity로 쓴다 — [Certificate management](https://learn.microsoft.com/en-us/azure/artifact-signing/concept-certificate-management)
- "Artifact Signing doesn't issue Extended Validation (EV) certificates. There's no plan to issue EV certificates in the future." — [FAQ](https://learn.microsoft.com/en-us/azure/artifact-signing/faq)
- **중요**: "Artifact Signing code-signing certificate authorities (CAs) are scheduled for removal from the Common CA Database (CCADB). Although Microsoft no longer includes these CAs in the Trusted Root Program, they remain on the Windows Platform Trust List." — [Certificate management (2026-09-30)](https://learn.microsoft.com/en-us/azure/artifact-signing/concept-certificate-management). 이 때문인지 code-signing-options 표에서 Artifact Signing의 "Store eligible"이 ❌ No로 되어 있다 — [Code signing options](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/code-signing-options)

**도구·CI 연동**
- 지원 통합: SignTool(+dlib), GitHub Actions(`azure/artifact-signing-action`), Azure DevOps task(`AzureArtifactSigning@`), PowerShell 모듈 `ArtifactSigning`, SDK — [Signing integrations (updated 2026-08-03)](https://learn.microsoft.com/en-us/azure/artifact-signing/how-to-signing-integrations)
- SignTool 명령: `signtool.exe sign /v /debug /fd SHA256 /tr "http://timestamp.acs.microsoft.com" /td SHA256 /dlib "<...>\x64\Azure.CodeSigning.Dlib.dll" /dmdf "<...>\metadata.json" <file>`. metadata.json 키는 `Endpoint`, `CodeSigningAccountName`, `CertificateProfileName`(+선택 `CorrelationId`, `ExcludeCredentials`). 필요한 것: SignTool 10.0.2261.755 이상, .NET 8 Runtime, VC++ Redist. `winget install -e --id Microsoft.Azure.ArtifactSigningClientTools`로 한 번에 설치할 수 있다 — [Signing integrations](https://learn.microsoft.com/en-us/azure/artifact-signing/how-to-signing-integrations)
- 서명 주체에는 "Artifact Signing Certificate Profile Signer" 역할이 필요하다. 인증은 DefaultAzureCredential(`AZURE_TENANT_ID`/`AZURE_CLIENT_ID`/`AZURE_CLIENT_SECRET`) — [FAQ](https://learn.microsoft.com/en-us/azure/artifact-signing/faq)
- 지원 리전에 **Korea Central**(`https://krc.codesigning.azure.net`)이 있다. 리전은 데이터센터 위치일 뿐 신원 확인 자격과는 별개다 — [Quickstart](https://learn.microsoft.com/en-us/azure/artifact-signing/quickstart)
- Tauri 공식 문서 예시: `"signCommand": "artifact-signing-cli -e https://wus2.codesigning.azure.net -a MyAccount -c MyProfile -d MyApp %1"`, 환경 변수 `AZURE_CLIENT_ID`/`AZURE_CLIENT_SECRET`/`AZURE_TENANT_ID` — [Tauri v2: Windows Code Signing](https://v2.tauri.app/distribute/sign/windows/). 설치는 `cargo install artifact-signing-cli`(검색 요약 기준)이다.

### Inferences
- Frond 개발자는 한국 거주 개인이라 **Artifact Signing Public Trust를 개인 자격으로 쓸 수 없다**(두 MS 문서가 일치).
- 조직 경로는 최신 quickstart 기준 한국 조직이 대상이다. 다만 한국 legal business entity(법인, 또는 개인사업자가 인정될지 여부)와 사업자 식별번호, 도메인 이메일, 웹사이트가 필요하다. "개인사업자"가 organization validation을 통과하는지는 확인하지 못했다. 그리고 Artifact Signing 인증서는 Store EXE/MSI 제출에 쓸 수 없다고 표시돼 있다.
- 72시간 인증서라 타임스탬프를 빠뜨리면 3일 뒤 서명이 무효가 된다. Tauri `timestampUrl`/signCommand에 TSA를 반드시 넣어야 한다.

### Gaps
- Korea Central 리전과 한국 조직 지원이 언제 추가됐는지, 공식 발표 글은 찾지 못했다(문서 diff로만 확인).
- 한국 개인사업자(사업자등록증 보유 개인)가 organization identity validation을 통과한 사례가 없다.
- 가격 페이지가 동적 렌더링이라 초과 서명 단가를 MS 1차 출처로 확인하지 못했다.

## 2. 전통 CA의 OV/EV 인증서 — 개인용 발급, HSM 의무, 가격, 유효기간 단축

### Takeaway
2023-06부터 개인 키를 HSM, USB 토큰, 클라우드 HSM에만 둘 수 있어 파일(.pfx) 인증서가 없어졌다. 2026-03-01부터는 새 인증서의 최대 유효기간이 460일이라 사실상 1년 단위로 갱신한다. 한국 거주 개인이 사업자 없이 살 수 있는 현실적 선택지는 해외 CA·리셀러의 "개인(IV/Individual)" 인증서다: Certum, SSL.com IV, Sectigo Individual. 가격은 대략 €49~$300+/년이고, 토큰을 쓰면 배송비가 붙는다.

### Cited Findings
**HSM 의무**
- "As of June 2023, the CA/Browser Forum requires private keys for OV certificates to be stored on a hardware security module (HSM) or hardware token. Most CAs provide a compatible USB token or cloud HSM option." — [MS Learn: Code signing options](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/code-signing-options)
- Tauri 문서도 OV 가이드(pfx 가져오기)가 "certificates acquired before June 1st, 2023"에만 해당한다고 경고한다 — [Tauri v2 Windows signing](https://v2.tauri.app/distribute/sign/windows/)
- 한국 리셀러도 "이제 OV 코드서명 인증서는 USB Token으로 발급됩니다"라고 공지하고 USB 토큰·해외 배송비를 이유로 가격을 올렸다(GlobalSign 390,000→475,000원, Sectigo 140,000→700,000원, DigiCert 390,000→600,000원, 2023-04~06 시행) — [KoreaSSL 공지 [STALE? 2023]](https://www.koreassl.com/support/notice/OV-%EC%BD%94%EB%93%9C%EC%84%9C%EB%AA%85-Code-Signing-%EC%9D%B8%EC%A6%9D%EC%84%9C-%EA%B0%80%EA%B2%A9%EB%B3%80%EB%8F%99-%EC%95%88%EB%82%B4)

**유효기간 460일**
- CA/B Forum Ballot CSC-31(2025-10-14 가결로 알려짐)에 따라 2026-03-01 이후 발급되는 코드 서명 인증서는 최대 460일이다(이전 39개월) — [DigiCert 블로그 2025-10-15](https://www.digicert.com/blog/understanding-the-new-code-signing-certificate-validity-change); [GlobalSign 뉴스](https://www.globalsign.com/en/company/news-events/news/businesses-must-prepare-two-significant-certificate-lifecycle-reductions-march-2026); [CA/B Forum CSBR](https://cabforum.org/working-groups/code-signing/requirements/) (투표일·번호는 검색 요약 기준)
- CA별 실제 상한: DigiCert는 459일 — [DigiCert KB](https://knowledge.digicert.com/alerts/code-signing-certificates-459-day-validity). Certum은 2026-02-27부터 459일이고 2·3년 상품은 무상 재발급으로 처리한다(검색 요약) — [Certum Shop](https://shop.certum.eu/open-source-code-signing.html). SignMyCode(Sectigo)는 2026-02-15부터 최대 1년이며 다년 상품은 "Install on Existing HSM"일 때만 가능하다 — [SignMyCode Sectigo Individual](https://signmycode.com/sectigo-individual-code-signing). 한국 리셀러는 "2026/02/01~ 부터 2/3년 인증서 발급은 더 이상 제공되지 않습니다"라고 공지했다 — [SecureSign Sectigo](https://www.sslcert.co.kr/products/Sectigo/Code-Signing-Certificates)

**개인 발급 가능한 해외 상품과 가격**
- **Certum Open Source Code Signing in the Cloud(SimplySign)**: €49.00 gross/1년. 인증서 주체는 "natural person data prefixed with 'Open Source Developer'". 키는 FIPS 140-2 L3 / CC EAL4+ 클라우드에 있고 월 5,000 서명 한도가 있다 — [Certum Shop (조회 2026-10)](https://shop.certum.eu/open-source-code-signing-on-simplysign.html). 다른 스토어(certum.store)는 "$58.00 gross"로 표시된다(검색 요약) — [Certum Store](https://certum.store/open-source-code-signing-on-simplysign.html)
- Certum Open Source는 "issued only for individuals"다. 신원 확인은 자동 신원 확인(권장), 대면, 공증, 신분증 들고 찍은 사진 중 하나이고, 본인 명의 utility bill과 공개 프로젝트 참여를 보여 주는 웹사이트 주소가 필요하다. Standard Code Signing(개인)도 신원 확인 방식은 같고 utility bill이 필요하다 — [Certum: required documents](https://support.certum.eu/en/code-signing-required-documents/)
- Certum OSS 실사용기(영국, 2025-10): 카드+리더 세트 €69 + 배송 €35 = €104, 갱신은 €29 예상. 운전면허 양면 촬영과 IDNow 영상 확인을 거쳤고, 프로젝트 증빙 PDF(웹사이트·GitHub·라이선스 링크)와 수도 요금 고지서를 냈다. 처리 2일, 배송 1일. 드라이버·키 연결 문제로 고생했고 "SignTool Error: No certificates were found"가 났다. 주체는 "CN=Open Source Developer, Piers Finlayson", 발급자는 Certum Code Signing 2021 CA, 유효 1년 — [piers.rocks 2025-10-30](https://piers.rocks/2025/10/30/certum-open-source-code-sign.html)
- **SSL.com IV(Individual Validated)**: $129.00/년(5년이면 $96.75/년). 키 보관은 eSigner 클라우드, YubiKey 토큰(+$379.00), 클라우드 HSM(attestation $500~1,500) 중 선택. "government-issued ID required", 검증 3~5일. eSigner로 CI(GitHub Actions 등)에서 서명할 수 있다 — [SSL.com IV](https://www.ssl.com/products/software-integrity/code-signing/iv/). eSigner 구독은 $180/년(연 240회)부터라는 수치는 검색 요약에만 있었다 — [SSL.com eSigner pricing](https://www.ssl.com/guide/esigner-pricing-for-code-signing/)
- **Sectigo Individual Code Signing(SignMyCode 리셀러)**: 1년 $301.99/년, 2년 $254.99/년, 3년 $219.99/년. "Token & international shipping: $130.00"이고, "Install on existing HSM"은 $0. 정부 발급 사진 신분증과 전화 확인이 필요하고, 발급까지 1~5일. "Your name as a software publisher will be seen and not a company name" — [SignMyCode](https://signmycode.com/sectigo-individual-code-signing)
- MS 문서의 일반 시세: OV "$150–300/year", EV "$400+/year" — [Code signing options](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/code-signing-options)
- 클라우드 서명 서비스로는 DigiCert KeyLocker도 있다(유효기간 단축 영향이 적다고 소개) — [DigiCert 블로그](https://www.digicert.com/blog/understanding-the-new-code-signing-certificate-validity-change)

### Inferences
- Frond(무료·공개 저장소)라면 **Certum Open Source(€49/년, 클라우드)**가 가장 싸다. 단 OSI 라이선스를 달아야 하고, 인증서 이름은 "Open Source Developer, <실명>"으로 나온다.
- CI 자동 서명이 목표라면 SSL.com eSigner($129+$180~/년)처럼 API형 클라우드 서명이 Certum SimplySign보다 낫다. SimplySign은 모바일 앱 OTP로 가상 카드에 연결하는 방식이라 무인 CI에는 맞지 않을 가능성이 크다(추론).
- 토큰형을 고르면 해외 배송비($130 등)와 드라이버 설정 부담이 붙는다.

### Gaps
- Certum이 한국어 utility bill(관리비·통신비 고지서)을 받는지, 번역·공증이 필요한지는 공개 문서에 없다.
- SimplySign을 CI에서 무인으로 쓸 수 있는지 공식 확인하지 못했다.
- SSL.com IV·Sectigo Individual의 국가 제한이나 한국 신분증 처리 경험담은 찾지 못했다.

## 3. EV는 아직 의미가 있나 — SmartScreen 평판이 쌓이는 방식과 첫 다운로드 경험

### Takeaway
2024년부터 EV도 SmartScreen을 바로 통과하지 못한다. 서명 방식과 상관없이(OV, EV, Artifact Signing) 새 파일은 처음에 "인식되지 않은 앱" 경고를 받을 수 있다. 서명이 주는 이점은 세 가지다. 게시자 이름이 표시되고, 같은 서명 신원으로 버전 간 평판이 이어지며, Windows 11 Smart App Control에 덜 막힌다. 비서명 파일은 버전마다 평판이 0부터 시작한다.

### Cited Findings
- "EV certificates no longer bypass SmartScreen... Paying a premium for EV solely to avoid SmartScreen warnings is no longer justified." — [MS Learn: SmartScreen reputation (ms.date 2026-05-04, updated 2026-08-17)](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/smartscreen-reputation)
- "That behavior was removed in 2024. EV-signed files now go through the same reputation-building process as OV certificates." — [Code signing options](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/code-signing-options); Tauri 문서도 "Microsoft removed the special treatment of EV code signing certificates from its Trusted Root Program in 2024"라고 쓴다 — [Tauri](https://v2.tauri.app/distribute/sign/windows/)
- DigiCert: "Microsoft no longer guarantees that EV-signed applications will avoid SmartScreen warnings automatically." 평판 요인으로 "download volume, install success, user interactions, publisher history, file reputation"을 든다 — [DigiCert KB ALERT91 (2026-06-02 수정)](https://knowledge.digicert.com/alerts/ev-signed-application-showing-microsoft-defender-smartscreen-warnings)
- SmartScreen의 두 신호: (1) Publisher reputation(서명 여부, 인증서), (2) File hash reputation. "When a file is not signed, SmartScreen reputation must build for each new version of your files, starting with zero reputation. Reputation cannot transfer from previous versions unless both were signed using the same publisher identity." — [SmartScreen reputation](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/smartscreen-reputation)
- 첫 다운로드에서 보이는 것: Store는 경고 없음. OV/EV 서명은 "Warning — app flagged as unrecognized until reputation accumulates; verified publisher name is displayed". 비서명은 "Windows protected your PC", 사용자가 "Run anyway"를 눌러야 하고 기업 정책으로 진행 자체를 막을 수 있음. 자체 서명은 비서명과 같다 — [SmartScreen reputation](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/smartscreen-reputation)
- 경고가 없어지는 시점: "There is no exact threshold, but it can take several weeks and hundreds of clean installs from a wide audience." 소비자용 수동 제출 경로는 없다("no need (or mechanism) to manually submit"). 기업 관리자는 WDSI 포털로 제출할 수 있다 — [SmartScreen reputation](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/smartscreen-reputation). Artifact Signing FAQ는 경고가 계속되면 서명 파일을 Microsoft Security Intelligence에 제출해 보라고 권한다 — [FAQ](https://learn.microsoft.com/en-us/azure/artifact-signing/faq)
- Artifact Signing도 "does **not** provide instant SmartScreen trust". 같은 publisher/signing identity로 연속 릴리스를 서명하면 평판이 쌓여 이후 릴리스가 물려받을 수 있다 — [Code signing options](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/code-signing-options). OV는 "functionally equivalent to Azure Artifact Signing for SmartScreen purposes" — 같은 문서
- **Smart App Control(Windows 11)**: "Smart App Control will block execution of unsigned files unless the file has a positive reputation... signature checks apply to all executable files, not just those downloaded from the Internet." — [SmartScreen reputation](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/smartscreen-reputation)
- 권장 사항: 모든 릴리스에 서명하기, 서명한 뒤 파일 수정하지 않기, 서명 신원 바꾸지 않기, PUA 동작 서명하지 않기(인증서에 부정 평판이 쌓일 수 있음), 초기 사용자에게 경고가 뜰 수 있다고 미리 알리기 — [SmartScreen reputation](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/smartscreen-reputation)

### Inferences
- 다운로드가 적은 개인 앱(Frond)은 어떤 인증서를 써도 한동안 SmartScreen 경고가 남을 가능성이 높다. 서명의 실익은 다음과 같다. ① "알 수 없는 게시자" 대신 실명 표시, ② v1.0.1, v1.1처럼 업데이트할 때마다 평판이 0으로 돌아가지 않음, ③ Smart App Control이 켜진 Win11에서 실행 차단 위험이 줄어듦, ④ 백신 오탐이 줄어듦(경험적·간접).
- Artifact Signing은 인증서가 매일 바뀌지만 SmartScreen이 "publisher identity"로 이어 준다는 MS 설명이 있다. 반면 OV를 매년 재발급하면 키나 인증서가 바뀔 때 평판이 어떻게 되는지는 공식 설명이 없다(Gaps).
- "Run anyway" 경고 자체는 비서명보다 서명 쪽이 문구가 덜 위협적이다(게시자 이름 표시). 그래도 클릭 단계는 남는다(MS 표 기준).

### Gaps
- EV 특혜가 없어진 정확한 월(흔히 2024-03으로 알려짐)은 1차 출처에서 확인하지 못했다. MS·Tauri 문서는 "2024"라고만 쓴다.
- OV 인증서를 갱신하거나 재발급할 때(새 키) publisher 평판이 그대로 이어지는지 MS 공식 설명이 없다.
- "몇 주·수백 설치" 외에 구체적인 임계값은 공개되지 않았다.

## 4. 오픈소스용 무료·저가 경로 — SignPath Foundation, Certum OSS, Microsoft Store(MSIX)

### Takeaway
무료 경로는 두 가지다. ① **SignPath Foundation**: OSI 라이선스, 공개 저장소, CI 빌드, 프로젝트 평판, MFA, 요청마다 수동 승인이 필요하다. 게시자 이름이 "SignPath Foundation"으로 나온다. ② **Microsoft Store에 MSIX로 제출**: Store가 다시 서명해 주므로 무료이고 SmartScreen 경고도 없다. Store에 EXE/MSI로 내면 개발자가 Trusted Root Program CA 인증서로 직접 서명해야 한다. 저가로는 Certum OSS(€49/년)가 있다.

### Cited Findings
**SignPath Foundation**
- 조건: "OSI-approved Open Source license" 및 상업적 듀얼 라이선스 없음, 독점 코드 금지. "Binary artifacts must be built from source code in a verifiable way". 프로젝트가 "actively maintained"이고 서명할 형태로 "already released"되어 있어야 하며, 다운로드 페이지에 기능 설명이 있어야 한다. SignPath가 "initial verification of project reputation and control"을 한다 — [SignPath Foundation Terms](https://signpath.org/terms)
- 팀 보안: 모든 팀원이 SignPath와 소스 저장소 모두에 MFA를 켜야 한다. Authors/Reviewers/Approvers 역할을 정하고 "Each signing request must be approved by a team member" — [SignPath Terms](https://signpath.org/terms)
- 개인정보: 프라이버시 정책 링크를 두거나 "This program will not transfer any information to other networked systems unless specifically requested by the user"라고 명시해야 한다 — [SignPath Terms](https://signpath.org/terms)
- 인증서는 "issued to SignPath Foundation"이고 "SignPath Foundation is the publisher of the OSS project"이다. 금지 사항은 malware/PUP, 경고 없는 시스템 설정 변경, 제거 불가 — [SignPath Terms](https://signpath.org/terms)
- 현재 Apply 버튼이 있어 신청을 받고 있다. Stellarium, LiteDB, Flameshot, GitExtensions 등을 지원한다 — [signpath.org](https://signpath.org/)
- MS 문서도 오픈소스용으로 SignPath Foundation을 소개한다("OV-level certificate signing through a managed pipeline") — [Code signing options](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/code-signing-options)
- 일본 개인 개발자의 신청기(2026-02-16): 신청서에 저장소 URL, 라이선스, 다운로드 URL, 설명을 적는다. 승인 전에는 README와 릴리스 노트에 "Free code signing provided by SignPath.io, certificate by SignPath Foundation" 문구를 넣을 계획이었다. 승인 결과는 글이 나온 시점에 미정 — [Zenn 신청기](https://zenn.dev/shm_7ec/articles/signpath-oss-code-signing?locale=en). GitHub Actions에서는 `signpath/github-action-submit-signing-request`로 연동한다(검색 요약, 여러 OSS 이슈) — 예: [GordianXI #279](https://github.com/jimmy58663/GordianXI/issues/279)

**Certum Open Source**: 1번 절과 2번 절 참조(€49/년, 개인 전용, 주체 "Open Source Developer, <이름>") — [Certum Shop](https://shop.certum.eu/open-source-code-signing-on-simplysign.html)

**Microsoft Store**
- "If you publish your app as an **MSIX package** through the Microsoft Store, code signing is free and handled for you automatically — Microsoft re-signs the package after certification... If you publish as an **MSI/EXE installer** through the Store, you are responsible for Authenticode signing your installer before submission." — [Code signing options](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/code-signing-options)
- Store MSI/EXE 요건: "The binary and all of its Portable Executable (PE) files must be digitally signed with a code signing certificate that chains up to a certificate issued by a Certificate Authority (CA) that is part of the Microsoft Trusted Root Program." 자체 서명은 안 된다. 그 밖에 버전별 고정 다운로드 URL, silent install, 오프라인(standalone) 설치기가 필요하다 — [MS Learn: MSI/EXE app package requirements (updated 2026-08-24)](https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msi/app-package-requirements)
- Store MSIX의 이점으로 "Free Microsoft code signing and CDN hosting"을 든다 — 같은 문서
- Store 설치 앱은 "never subject to SmartScreen download warnings" — [SmartScreen reputation](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/smartscreen-reputation). Store MSI/EXE 경로도 "No SmartScreen prompts during Store install (UAC may still appear)" — [Code signing options](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/code-signing-options)

### Inferences
- Frond는 아직 라이선스 파일이 없다. SignPath와 Certum OSS 모두 **OSI 라이선스(MIT, Apache-2.0 등)를 먼저 추가**해야 한다. SignPath는 "이미 릴리스된 상태"와 평판 검토도 요구하므로, 첫 비서명 릴리스를 GitHub Releases에 낸 뒤 신청하는 순서가 자연스럽다.
- SignPath를 쓰면 게시자가 "SignPath Foundation"으로 표시된다. 본인 이름으로 평판을 쌓을 수는 없다. 대신 비용은 0이고 자격 국가 제한이 없다(신청기 사례가 일본 개인).
- Store는 MSIX로 내면 서명 문제가 사라진다. Store에서 받는 사용자에 한해 SmartScreen 문제도 사라진다. Store를 Tauri NSIS(EXE) 그대로 내려면 Trusted Root Program CA의 OV 등 인증서가 필요하다. Artifact Signing은 Store 대상이 아니라고 표시돼 있다.

### Gaps
- SignPath Foundation 심사 기간, 거절률, "평판"의 정량 기준(스타 수, 다운로드 수)은 공개되지 않았다.
- SignPath의 Tauri NSIS 구성 사례(설치기와 내부 exe를 둘 다 서명하는 흐름)는 이번 조사에서 확인하지 못했다.

## 5. 배포 채널별 서명 요구 정리 — Store, winget, Scoop/Chocolatey, Tauri updater

### Takeaway
서명이 **필수**인 곳은 Microsoft Store에 EXE/MSI로 낼 때뿐이다(Trusted Root CA). winget, Chocolatey, Scoop 정책에는 서명 요건이 없다. 대신 winget은 URL SmartScreen 평판과 악성코드 정적 분석을, Chocolatey는 VirusTotal과 체크섬을 본다. Tauri updater 서명은 자체 minisign 키 쌍이라 Authenticode와 별개이고 끌 수 없다.

### Cited Findings
- Store MSIX: Store가 재서명하고 무료 — [Code signing options](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/code-signing-options). Store EXE/MSI: Trusted Root Program CA 체인 서명 필수 — [MSI/EXE requirements](https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msi/app-package-requirements)
- winget 저장소 정책(Document date 2021-05-22, 페이지 updated 2026-08-30)에는 코드 서명 요건이 없다. 보안 조항은 malware 금지, 동적 코드 포함 금지, "InstallerUrl must be the ISV's release location"(다운로드 사이트 불가) 정도다 — [Windows Package Manager repository policies](https://learn.microsoft.com/en-us/windows/package-manager/package/windows-package-manager-policies)
- winget 검증 오류 안내: "SmartScreen validation errors indicate that the URL you provided has a bad reputation." "Binary validation errors indicate that the installer failed static analysis"(해시 불일치, URL 무효, 악성코드 판정 포함) — [winget-pkgs-submission-test Troubleshoot.md](https://github.com/microsoft/winget-pkgs-submission-test/blob/master/Troubleshoot.md)
- [약한 출처] 여러 OSS 이슈에서 "unsigned installers pass winget validation but trigger SmartScreen", "Validation-Executable-Error는 비서명 게시자의 AV/SmartScreen 평판 문제로 보이며 평판이 쌓이면 풀린다"는 경험담이 나온다. 반대로 "unsigned MSI가 moderation에서 거절됐다"는 주장도 있다(검색 요약, 1차 출처 없음) — 예: [vim-win32-installer #319](https://github.com/vim/vim-win32-installer/issues/319)
- Chocolatey Community Repository: 모든 패키지가 moderation(품질, 설치·제거 검증, VirusTotal, 체크섬)을 거친다. 2021-04-27부터 VirusTotal 스캔 완료가 승인 조건이다. 서명 요건은 확인되지 않았다 — [Chocolatey Security docs](https://docs.chocolatey.org/en-us/information/security/), [Chocolatey 블로그 2021-04 [STALE?]](https://blog.chocolatey.org/2021/04/package-moderation-added-to-moderation-process/)
- Tauri updater: "Tauri's updater needs a signature to verify that the update is from a trusted source. This cannot be disabled." 키는 `tauri signer generate -w ~/.tauri/myapp.key`로 만들고, 빌드할 때 `TAURI_SIGNING_PRIVATE_KEY`(+`_PASSWORD`) 환경 변수가 필요하다(.env는 안 됨). NSIS 업데이트 installMode는 passive(기본), basicUi, quiet — [Tauri v2 Updater plugin](https://v2.tauri.app/plugin/updater/)

### Inferences
- winget은 사용자가 CLI로 설치하면 브라우저 다운로드 경로(MOTW)를 거치지 않는다. 그래서 SmartScreen 프롬프트가 보통 안 뜬다는 경험담이 있지만, 1차 출처로 확인하지 못했다(Gaps). 제출 단계의 "URL 평판" 검사는 GitHub Releases URL이면 대체로 문제가 없을 것으로 본다(추론).
- Tauri updater 키는 Authenticode 인증서와 따로 관리해야 한다. 업데이트 파일(NSIS 설치기)에 Authenticode 서명도 함께 하려면 빌드 순서상 Authenticode 서명이 먼저이고 updater 서명(.sig)이 그 결과물에 대해 만들어져야 한다(추론. Tauri 번들러가 순서를 처리하는지는 Gaps).

### Gaps
- winget-pkgs에서 비서명 EXE(NSIS)가 실제로 문제없이 머지되는지 공식 문서 근거가 없다(경험담만 있음).
- Scoop 메인/엑스트라 버킷의 서명 요건 문서는 이번 조사에서 확인하지 못했다(범위상 생략. 일반적으로 해시만 검증).
- Tauri 번들러가 Authenticode 서명을 updater .sig 생성 전에 끝내는지 명시한 문서는 찾지 못했다.

## 6. Tauri v2 서명 설정 — 설정 키, exe·NSIS·제거기 서명, 함정

### Takeaway
`bundle.windows`의 `certificateThumbprint`+`digestAlgorithm`+`timestampUrl`(+`tsp`)을 쓰면 인증서 저장소(토큰, 가상 카드) 방식이다. 클라우드 서명(Artifact Signing, Azure Key Vault, eSigner 등)은 `signCommand`(`%1` 자리표시자)로 붙인다. 둘 중 하나가 설정되면 번들러가 메인 exe(패치 후 재서명), NSIS/WiX 플러그인 DLL, 리소스 DLL, 설치기, NSIS 제거기(`!uninstfinalize`)까지 서명한다.

### Cited Findings
- 설정 예: `"windows": { "certificateThumbprint": "A1B1...", "digestAlgorithm": "sha256", "timestampUrl": "http://timestamp.comodoca.com" }` — [Tauri v2: Windows Code Signing](https://v2.tauri.app/distribute/sign/windows/)
- 구성 스키마: `certificateThumbprint: string|null`, `digestAlgorithm: string|null`, `timestampUrl: string|null`, `tsp: boolean (default false)`, `signCommand: CustomSignCommandConfig|null`(문자열이면 `"%1"`을 바이너리 경로로 치환, 경로나 인수에 공백이 있으면 `{ "cmd", "args" }` 객체 표기). NSIS 설정에는 서명 전용 필드가 없다 — [Tauri v2 Config reference](https://v2.tauri.app/reference/config/); 객체 표기는 2.0.1-rc.3에서 추가 — [tauri-bundler changelog](https://v2.tauri.app/release/tauri-bundler/all-versions/)
- signCommand 목적: "use `osslsigncode` on non-Windows or use hardware tokens and HSM or even using Azure Trusted Signing"(2.0.1-beta.15). Linux·macOS에서 크로스 빌드할 때도 필요하다 — [changelog](https://v2.tauri.app/release/tauri-bundler/all-versions/); [Tauri 문서](https://v2.tauri.app/distribute/sign/windows/)
- Azure Key Vault 예: `relic`으로 `"signCommand": "relic sign --file %1 --key azure --config relic.conf"` — [Tauri 문서](https://v2.tauri.app/distribute/sign/windows/)
- GitHub Actions(pfx 방식, 2023-06 이전 인증서만 해당): base64 pfx를 secret으로 넣고 `certutil -decode` → `Import-PfxCertificate` → thumbprint로 서명 — [Tauri 문서](https://v2.tauri.app/distribute/sign/windows/)
- 번들러 서명 관련 변경 이력: 2.4.0 "Sign NSIS and WiX DLLs when bundling" / "Sign DLLs from resources", 2.5.2 "signs the main binary after patching it for every package type", 2.6.0 비바이너리·이미 서명된 파일은 건너뜀, 2.7.0 `--no-sign` 플래그, 2.7.5 "Skip signing for NSIS uninstaller when using `--no-sign`" / "Fix NSIS plugins not being signed due to wrong path handlings", 2.10.0 `--no-binary-patching`(패치와 재서명 생략), 2.0.1-rc.2 `TAURI_WINDOWS_SIGNTOOL_PATH` — [tauri-bundler changelog](https://v2.tauri.app/release/tauri-bundler/all-versions/)
- NSIS 제거기는 `!uninstfinalize '${UNINSTALLERSIGNCOMMAND}'`로 서명한다. signCommand 문자열(인수 포함)은 target/ 아래 생성된 installer.nsi에 기록된다(검색 요약, 제3자 PR 분석) — [KyberDot PR #16](https://github.com/KyberDot/DebridDownloader/pull/16). 과거에는 "windows NSIS uninstall.exe is not code signed" 이슈가 있었다 — [tauri #7348 [STALE?]](https://github.com/tauri-apps/tauri/issues/7348)
- Artifact Signing은 인증서 수명이 72시간이라 타임스탬프가 필수다. TSA는 `http://timestamp.acs.microsoft.com` — [Certificate management](https://learn.microsoft.com/en-us/azure/artifact-signing/concept-certificate-management)
- MS는 "Do not modify signed files"라고 권고한다(서명 깨짐) — [SmartScreen reputation](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/smartscreen-reputation)

### Inferences
- **함정 1: 타임스탬프 누락.** 인증서 만료(460일, Artifact Signing은 72시간) 뒤 서명이 무효가 된다. `timestampUrl`을 반드시 넣는다. RFC 3161 TSA(예: SSL.com, Microsoft ACS)를 쓰면 `tsp: true`가 필요할 수 있다(필드는 확인. RFC 3161 의미는 일반 지식이라 문서 문구는 미확인).
- **함정 2: signCommand 비밀 노출.** signCommand 문자열이 installer.nsi에 그대로 기록되므로 비밀번호나 토큰을 인수에 넣지 말고 환경 변수로 넘긴다(위 PR 분석 기반 추론).
- **함정 3: 바이너리 패치.** Tauri는 메인 exe에 번들 타입 정보를 패치한 뒤 다시 서명한다(2.5.2). 빌드 후 외부 도구로 exe를 따로 서명하면 순서가 꼬일 수 있으니 signCommand로 번들러 안에서 서명하게 하는 편이 안전하다.
- Frond는 tauri 2.12라서 위 수정(2.4~2.10)이 모두 들어간 번들러를 쓸 것으로 보인다. 정확한 tauri-bundler 버전은 lock 파일로 확인해야 한다.
- Certum SimplySign이나 USB 토큰은 Windows 인증서 저장소에 인증서가 보이므로 `certificateThumbprint` 방식으로 로컬 빌드할 때 쓰기 좋다(추론. piers.rocks는 thumbprint로 signtool을 썼다).

### Gaps
- `tsp`·`digestAlgorithm`·`timestampUrl` 필드 설명 원문을 config 레퍼런스에서 받지 못했다(동적 렌더링).
- Tauri 2.12와 함께 쓰이는 tauri-bundler에서 제거기 서명이 기본 동작인지 공식 문서 문구로는 확인하지 못했다(changelog의 2.7.5 항목으로 간접 확인).

## 7. 한국 특화 — 국내 CA·리셀러, KRW 가격, 해외 CA 신원 확인 마찰

### Takeaway
국내 리셀러(한국전자인증 CrossCert, SecureSign, KoreaSSL 등)는 영문 사업자등록증을 요구한다. 가격도 연 34만~86만 원 선이라 **사업자가 없는 한국 개인에게는 사실상 맞지 않는다**. 개인은 해외 CA(Certum, SSL.com, Sectigo 리셀러)의 개인용 상품을 직접 사거나, SignPath·Store MSIX 같은 무료 경로를 쓰는 것이 현실적이다.

### Cited Findings
- 한국전자인증(CrossCert) DigiCert CodeSign: 1년 340,000원, 2년 590,000원, 3년 800,000원. EV는 1년 670,000원 등. EV는 "영문사업자등록증"이 필요하고 게시자명은 "사업자등록증상의 영문 회사명". EV 토큰 배송에 2~3주가 추가된다 — [CrossCert 코드사인 페이지](https://www.crosscert.com/symantec/02_1_04.jsp). [STALE?] 2·3년 상품이 아직 표시돼 2026-02 이후 정책과 맞지 않는다. 페이지가 갱신되지 않았을 수 있다.
- SecureSign(sslcert.co.kr) Sectigo Code Signing: "￦ 660,000 +VAT(10%)" 1년, SafeNet USB 토큰 배송. 서류는 "영문 사업자등록증명(홈택스, 최근 3개월내)", "114 전화 검색 결과". 2026-02-01부터 2·3년 발급 중단 — [SecureSign Sectigo CS](https://www.sslcert.co.kr/products/Sectigo/Code-Signing-Certificates). Sectigo EV는 페이지 제목 기준 780,000원(+VAT) — [SecureSign Sectigo EV](https://www.sslcert.co.kr/products/Sectigo/EV-Code-Signing-Certificates)
- KoreaSSL은 2023년 USB 토큰 의무화로 OV 가격을 크게 올렸다(Sectigo 140,000→700,000원 등) — [KoreaSSL 공지 [STALE? 2023]](https://www.koreassl.com/support/notice/OV-%EC%BD%94%EB%93%9C%EC%84%9C%EB%AA%85-Code-Signing-%EC%9D%B8%EC%A6%9D%EC%84%9C-%EA%B0%80%EA%B2%A9%EB%B3%80%EB%8F%99-%EC%95%88%EB%82%B4)
- 한국 개인 개발자 경험담: 국내 업체가 "사업자 등록증"을 당연히 요구해서 개인은 해외(Comodo 리셀러 K Software, 3년 $245)에서 샀다. 결과적으로 백신 오탐 해결에는 별 효과가 없었다고 적었다 — [Naraeon 블로그 [STALE? 2015]](https://www.naraeon.net/en/personal-codesign-choosing-ca/)
- 해외 개인용 상품은 국가 제한을 명시하지 않는다. SSL.com IV는 "government-issued ID required" — [SSL.com IV](https://www.ssl.com/products/software-integrity/code-signing/iv/). Sectigo Individual(SignMyCode)은 "Individual software developers worldwide"를 대상으로 하며, 사진 신분증과 전화 확인이 필요하고, 국제 토큰 배송비 $130 — [SignMyCode](https://signmycode.com/sectigo-individual-code-signing). Certum은 본인 명의 utility bill이 필요하다 — [Certum docs](https://support.certum.eu/en/code-signing-required-documents/)
- Artifact Signing: 개인은 미국·캐나다만. 최신 문서상 조직은 South Korea 포함. 리전 Korea Central 존재 — [MS Quickstart](https://learn.microsoft.com/en-us/azure/artifact-signing/quickstart)

### Inferences
**Frond 관점 선택지 요약(2026-10, 출처는 위 각 절)**

| 경로 | 한국 개인 자격 | 연 비용(출처 통화) | 게시자 표시 | CI 자동화 | Store EXE 제출에 쓸 수 있나 |
|---|---|---|---|---|---|
| Artifact Signing 개인 | ❌ (US/CA만) | $9.99/월 | 본인 실명 | ◎ | ❌ (Store eligible: No) |
| Artifact Signing 조직 | △ 한국 법인 필요(문서 충돌) | $9.99/월 | 법인명 | ◎ | ❌ |
| SignPath Foundation | ○ (OSI 라이선스, 평판 심사) | 0 | "SignPath Foundation" | ○ (GitHub Actions, 요청마다 수동 승인) | 미확인 |
| Certum Open Source (클라우드) | ○ (개인 전용, utility bill) | €49 | "Open Source Developer, 실명" | △ (모바일 OTP) | ○ (Trusted Root CA로 추정) |
| SSL.com IV + eSigner | ○ (ID) | $129 + eSigner $180~ | 실명 | ◎ | ○ |
| Sectigo Individual (리셀러) | ○ (ID, 전화) | $301.99 (+국제 토큰 $130) | 실명 | 토큰이면 ✕ | ○ |
| 국내 리셀러 OV | ❌ (사업자등록증) | 34만~66만 원+VAT | 회사명 | 토큰이면 ✕ | ○ |
| Store MSIX | ○ | 0 (Store가 재서명) | Store | 해당 없음 | 해당 없음 |
| 비서명 | — | 0 | "알 수 없는 게시자" | — | ❌ |

- 개인 사용자 규모라면 비용 대비 우선순위는 이렇다. (a) MIT 등 라이선스를 추가하고 GitHub Releases를 비서명으로 시작한다. (b) SignPath Foundation 신청과 Certum OSS(€49) 중 하나를 고른다. (c) Store를 쓰려면 MSIX 경로를 검토한다. 어느 쪽이든 SmartScreen 초기 경고는 완전히 없앨 수 없다는 점을 문서에 적어 둔다(3절).
- Certum 인증서의 주체에 실명이 들어간다. 그래서 개인정보(실명, 도시 등)가 서명에 공개되는 점도 고려해야 한다. Artifact Signing 개인은 도시·주·국가가 인증서에 표시된다 — [MS Quickstart](https://learn.microsoft.com/en-us/azure/artifact-signing/quickstart).

### Gaps
- 국내 리셀러 중 **개인(비사업자)**에게 코드사인을 파는 곳은 찾지 못했다. 나무위키·블로그의 "개인 불가" 서술은 오래됐다.
- 한국 신분증(주민등록증, 운전면허)과 한국어 고지서를 해외 CA가 받는지, 번역·아포스티유가 필요한지 공개 정보가 없다(경험담 미발견).
- CrossCert의 2026년 현행 가격은 확인하지 못했다(페이지가 옛 다년 가격 표시).
