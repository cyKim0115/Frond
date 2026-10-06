# Store 밖 배포 채널: winget · Scoop · Chocolatey · GitHub Releases + Tauri updater · 자체 사이트 (2026-10 기준)

> 조사일 2026-10-06. 대상 앱: Frond (Tauri 2.12, `mdeditor.exe`, identifier `com.cykim.mdeditor`, publisher `cyKim`, v0.1.0, NSIS 전용 `targets: ["nsis"]`, `installMode: currentUser`, `webviewInstallMode: downloadBootstrapper (silent)`, `installerHooks: ./nsis/hooks.nsh`, 서명 없음, updater 없음, 저장소 LICENSE 없음 — `src-tauri/tauri.conf.json` 32~56행과 저장소 루트에서 확인).
> 표기: **[로컬 실측]** = 이 PC에서 2026-10-06에 `winget`/`gh`/`curl`로 직접 조회한 결과. **[오래됨?]** = 2025년 이전 정보라 낡았을 수 있음.
> 범위 밖: Microsoft Store 제출·MSIX(다른 조사자), 코드 서명 인증서 업체 비교(다른 조사자). 여기서는 각 채널이 서명에 대해 *무엇을 요구하는지*만 적었습니다.

## Q1. winget (microsoft/winget-pkgs 커뮤니티 저장소)

### Takeaway
winget은 무료이고 서명을 요구하지 않습니다. 공개 HTTPS 설치 파일 URL(GitHub Releases 가능), SHA256, 무인(silent) 설치만 있으면 됩니다. Tauri NSIS는 `InstallerType: nullsoft` + `Scope: user`로 그대로 들어가고, 신규 패키지 PR은 최근 표본에서 중앙값 약 33시간 만에 병합됐습니다. 첫 버전을 손으로 올린 뒤에는 WinGet Releaser·Komac으로 릴리스마다 PR을 자동화할 수 있습니다.

### Cited Findings
**제출 절차·구조**
- 매니페스트를 만들 때는 `wingetcreate new`(대화형, 마지막 단계에서 PR 자동 제출), winget-pkgs `Tools/YAMLCreate.ps1`, 수동 작성 중 하나를 씁니다. 설치: `winget install wingetcreate` — [MS Learn: Create your package manifest (ms.date 2026-09-14)](https://learn.microsoft.com/en-us/windows/package-manager/package/manifest)
- 현재 문서 예시는 `ManifestVersion: 1.12.0`입니다. 설치 파일이나 로캘이 둘 이상이면 multi-file(최소 3개 파일: `version`, `defaultLocale`, `installer` + 추가 `locale`)을 써야 합니다. singleton은 단일 설치 파일·단일 로캘일 때만 쓸 수 있습니다 — [MS Learn: manifest](https://learn.microsoft.com/en-us/windows/package-manager/package/manifest)
- 지원 스키마는 1.12.0·1.10.0·1.9.0이고, 1.7.0 이하는 deprecated입니다 — [winget-pkgs doc/manifest/README.md](https://github.com/microsoft/winget-pkgs/blob/master/doc/manifest/README.md) (검색 스니펫 기준, 원문은 열어 보지 않음)
- 최소 필수 필드: `PackageIdentifier`(Publisher.Package 형식), `PackageVersion`, `PackageLocale`, `Publisher`, `PackageName`, **`License`**, `ShortDescription`, `Installers[].Architecture/InstallerType/InstallerUrl/InstallerSha256`, `ManifestType`, `ManifestVersion` — [MS Learn: manifest](https://learn.microsoft.com/en-us/windows/package-manager/package/manifest)
- InstallerType 열거값: `exe, msi, msix, inno, wix, nullsoft, appx, font`. 문서 원문: "If your installer is an .exe and it was built using Nullsoft or Inno… the client will automatically set the silent and silent with progress install behaviors". Nullsoft의 silent 스위치는 `/S`입니다 — [MS Learn: manifest](https://learn.microsoft.com/en-us/windows/package-manager/package/manifest)
- 규칙: "All tools must support a silent install". `PackageName`과 `Publisher`는 Add/Remove Programs(ARP) 항목과 맞춰야 `upgrade`·`export`가 연결됩니다. 이미 있는 publisher 폴더와 겹치는 폴더를 새로 만들지 않습니다(Contoso / Contoso Ltd. 예) — [MS Learn: manifest](https://learn.microsoft.com/en-us/windows/package-manager/package/manifest)
- 폴더 구조는 `manifests/<소문자 첫 글자>/<publisher>/<application>/<version>`이고, 경로가 `PackageIdentifier`·`PackageVersion`과 맞아야 합니다. PR 하나에 매니페스트(패키지 버전) 하나만 허용됩니다 — [MS Learn: Submit your manifest (ms.date 2024-11-21, updated_at 2026-07-14)](https://learn.microsoft.com/en-us/windows/package-manager/package/repository)
- 제출 전에 로컬에서 `winget validate <path>`와 `.\Tools\SandboxTest.ps1 <manifest>`(Windows Sandbox 설치 시험)로 확인할 수 있습니다 — [MS Learn: repository](https://learn.microsoft.com/en-us/windows/package-manager/package/repository)

**검증 파이프라인(자동 + 수동)**
- PR이 올라오면 자동 검증이 돕니다(스키마, 정책, 악성 여부). 끝나면 "your submission will be manually reviewed by a moderator". 문서 원문: "Microsoft reserves the right to refuse a submission for any reason." — [MS Learn: repository](https://learn.microsoft.com/en-us/windows/package-manager/package/repository)
- 제출 기대치(원문 요지): 매니페스트 URL은 안전한 사이트여야 함, virus free, "installs and uninstalls correctly for both administrators and non-administrators", "supports non-interactive modes", "The installer comes directly from the publisher's website" — [MS Learn: repository](https://learn.microsoft.com/en-us/windows/package-manager/package/repository)
- 오류 라벨로 본 검사 항목: `Binary-Validation-Error`(여러 AV 엔진으로 PUA·malware를 보는 Installers Scan), `Validation-Defender-Error`(동적 설치 뒤 Defender 전체 검사), `URL-Validation-Error`(HTTP 403/404 또는 **URL reputation test 실패**), `Validation-HTTP-Error`(HTTPS 아님), `Validation-Indirect-URL`(redirector 사용 금지), `Validation-Domain`·`Validation-Unapproved-URL`(ISV 배포 위치가 아님), `Validation-Unattended-Failed`(무인 설치 시간 초과), `Validation-Uninstall-Error`(제거 뒤 잔여물), `Validation-Executable-Error`(주 실행 파일을 못 찾음), `Error-Hash-Mismatch`. `Needs-Author-Feedback` 상태로 10일 동안 응답이 없으면 봇이 PR을 닫습니다 — [MS Learn: repository](https://learn.microsoft.com/en-us/windows/package-manager/package/repository)
- 정책 1.1.4: "The InstallerUrl must be the ISV's release location… Products from download websites will not be allowed." 정책 1.2.2는 malware 금지입니다. 정책 문서 전체(Document version 1.0, 2021-05-22, 페이지 갱신 2026-08-30)에 **코드 서명(Authenticode) 요구 조항은 없습니다** — [MS Learn: Windows Package Manager repository policies](https://learn.microsoft.com/en-us/windows/package-manager/package/windows-package-manager-policies) [정책 본문 날짜는 2021이지만 지금도 v1.0 그대로 게시 중]
- "winget은 서명을 요구하지 않는다, 서명이 없으면 SmartScreen 평판과 검증 단계의 Defender 검사에서 손해를 볼 뿐"이라는 주장은 2차 출처(타 프로젝트 이슈·PR)에만 있었습니다. 근거로 든 PR도 1차 출처 링크 없이 경험과 추론만 적었습니다 — [wslkit/skrog PR #362](https://github.com/wslkit/skrog/pull/362), [dbelokursky/tunl PR #460](https://github.com/dbelokursky/tunl/pull/460) (신뢰도 낮음, 아래 Gaps 참고)

**PackageIdentifier·Scope**
- 형식은 `Publisher.Package`이고, 두 번째 점으로 더 나누기도 합니다(예: `Zettlr.Zettlr.Beta`) — [MS Learn: manifest FAQ](https://learn.microsoft.com/en-us/windows/package-manager/package/manifest)
- installer 스키마 1.12.0 문서에 `Scope`(user/machine) 등 설치 파일 필드가 정의돼 있습니다 — [winget-pkgs schema 1.12.0 installer.md](https://github.com/microsoft/winget-pkgs/blob/master/doc/manifest/schema/1.12.0/installer.md) (링크만 확인, 본문은 열어 보지 않음)

**리뷰·병합 시간 [로컬 실측]**
- `gh pr list -R microsoft/winget-pkgs --search '"New package" is:merged merged:>2026-09-01'`로 40건을 표본 조사했습니다. 생성부터 병합까지 **중앙값 32.6시간, 최소 0.8시간, 최대 413.8시간(약 17일)**이었고, 1~4시간·20~55시간·100~270시간 세 구간으로 나뉩니다. 예: `RC.Webbit 0.1.0` 128시간, `dividebysandwich.TorrentOxide 0.3.1` 175시간 — [GitHub PR 검색](https://github.com/microsoft/winget-pkgs/pulls?q=is%3Apr+is%3Amerged+%22New+package%22+merged%3A%3E2026-09-01)

**업데이트 자동화**
- **WinGet Releaser**(GitHub Action, `vedantmgoyal9/winget-releaser`, 보관 처리 안 됨, 마지막 push 2026-09-20) 조건: "At least one version of your package should already be present" in winget-pkgs. *classic* PAT(`public_repo` + `workflow` scope)가 필요하고, fine-grained PAT는 지원하지 않습니다. 같은 계정에 winget-pkgs fork가 있어야 하고, "only work when the release is published (not a draft)". 원문: "pull requests that are trusted amongst the community, often expediting the amount of time it takes for a submission to be reviewed" — [winget-releaser README](https://github.com/vedantmgoyal9/winget-releaser) [로컬 실측: `gh api`]
- **Komac**: Rust로 만든 크로스플랫폼 CLI입니다. `komac new` / `komac update` / `--submit`을 지원하고 "classic GitHub token… `public_repo` scope"가 필요합니다. 설치 파일 분석으로 Inno·**Nullsoft**·MSI·Burn을 판별하고, WinGet Releaser가 내부에서 Komac을 호출합니다 — [russellbanks/Komac](https://github.com/russellbanks/Komac)

**msstore 소스(Store에 등록되면 winget으로도 설치되는가)**
- 기본 소스는 세 개입니다: "**msstore** - The Microsoft Store catalog", "**winget** - The WinGet Community Repository for applications", "**winget-font**"(explicit). msstore 인수는 `https://storeedgefd.dsx.mp.microsoft.com/v9.0`입니다 — [MS Learn: winget source (ms.date 2026-07-19)](https://learn.microsoft.com/en-us/windows/package-manager/winget/source)
- [로컬 실측] `winget search --source msstore`로 `Typora`를 찾으면 **`XPFPH15B9DLNZH`**(XP 접두 = Store에 올린 Win32 앱), `Notepads App`를 찾으면 `9NHL4NSC67WM`이 나왔습니다. Obsidian·Joplin·MarkText·Zettlr·Cherry Studio는 msstore에 없었습니다. 따라서 Store에 등록하면 `winget install --source msstore <StoreId>`로 설치할 수 있습니다 — [MS Learn: winget source](https://learn.microsoft.com/en-us/windows/package-manager/winget/source), 실측 명령 결과
- 설치 문법은 `winget install --id <StoreId> --source msstore`이고, msstore 소스는 device-wide 설치를 거부합니다(Store 패키지는 per-user) — [Fleet 블로그](https://fleetdm.com/articles/build-your-own-windows-self-service-with-winget-and-script-only-packages) (2차 출처)
- "msstore에는 엄선된 289개 앱만 있다"는 서술은 2020년 기사입니다 — [BleepingComputer](https://www.bleepingcomputer.com/news/microsoft/windows-10-package-manager-can-now-install-microsoft-store-apps/) **[오래됨 — 위 실측(Typora·Notepads 검색됨)과 맞지 않음]**. WinGet 1.8부터 Store 앱 *다운로드*도 됩니다 — [MS Tech Community (2024)](https://techcommunity.microsoft.com/blog/windows-itpro-blog/use-winget-1-8-to-download-microsoft-store-apps/4204522) [오래됨?]

**Tauri 앱 선례의 winget 매니페스트 [로컬 실측: `winget show`]**
- `ClashVergeRev.ClashVergeRev` 2.5.7: InstallerType **nullsoft**, URL `github.com/clash-verge-rev/clash-verge-rev/releases/download/v2.5.7/Clash.Verge_2.5.7_x64-setup.exe`(Tauri NSIS 이름 규칙), License GPL-3.0 — [winget-pkgs manifests/c/ClashVergeRev](https://github.com/microsoft/winget-pkgs/tree/master/manifests/c/ClashVergeRev/ClashVergeRev)
- `Pylogmon.pot` 3.0.7: **nullsoft**, `github.com/pot-app/pot-desktop/releases/download/3.0.7/pot_3.0.7_x64-setup.exe` — [winget-pkgs manifests/p/Pylogmon/pot](https://github.com/microsoft/winget-pkgs/tree/master/manifests/p/Pylogmon/pot)
- `spacedrive.Spacedrive` 0.4.3: **wix**(MSI), URL `https://www.spacedrive.com/api/releases/desktop/stable/windows/x86_64`(버전이 안 붙은 API URL) — [winget-pkgs manifests/s/spacedrive](https://github.com/microsoft/winget-pkgs/tree/master/manifests/s/spacedrive/Spacedrive)

### Inferences
- Frond 매니페스트 초안: `PackageIdentifier: cyKim.Frond`(폴더 `manifests/c/cyKim/Frond/0.1.0/`), `Publisher: cyKim`(Tauri `bundle.publisher`, ARP Publisher와 같게), `PackageName: Frond`(productName = ARP DisplayName), `InstallerType: nullsoft`, `Scope: user`(installMode currentUser → `%LOCALAPPDATA%`), `Architecture: x64`, `InstallerUrl: https://github.com/cyKim0115/MdEditor/releases/download/v0.1.0/Frond_0.1.0_x64-setup.exe`(파일 이름은 Tauri 규칙으로 추정), `License`는 아래 Q6에서 정할 값. 한·영 UI이므로 `ko-KR` locale 파일을 추가하면 정책 1.7(localization)과도 맞습니다.
- `InstallerUrl`에는 **버전이 붙은 `/releases/download/vX.Y.Z/...` 경로**를 써야 합니다. `/releases/latest/download/...`는 리다이렉트용 vanity URL이라 `Validation-Indirect-URL`에 걸리거나, 다음 릴리스 때 해시가 달라져 `Validation-Hash-Verification-Failed`가 날 수 있습니다. 실제로 Clash Verge Rev·pot·Obsidian 모두 버전 경로 GitHub URL로 통과했습니다.
- 서명 없는 설치 파일은 정책상 막히지 않습니다. 다만 신규 퍼블리셔·신규 바이너리는 `URL-Validation-Error`(reputation)나 AV 오탐(Defender/PUA)으로 수동 검토에 넘어갈 수 있고, 이것이 병합 시간 분포에서 100시간 넘는 꼬리의 한 원인일 수 있습니다(인과는 확인 안 함).
- 검증 VM에 WebView2가 없으면 Tauri `downloadBootstrapper`가 설치 중에 인터넷에서 부트스트래퍼를 받습니다. 검증 환경에서 네트워크가 막혀 있으면 `Validation-Unattended-Failed`가 날 위험이 있습니다(미확인).
- winget은 ARP의 DisplayVersion으로 `winget upgrade`를 판단합니다. 나중에 Tauri updater도 넣으면 업데이트 경로가 둘(winget upgrade / 앱 내 updater)이 되지만, 둘 다 같은 NSIS를 덮어쓰기로 설치하므로 충돌하지 않을 것으로 봅니다.
- 첫 제출은 `wingetcreate new` 또는 `komac new`로 손으로 하고, 이후 버전은 `release: published` 트리거에 WinGet Releaser를 거는 구성이 가장 손이 덜 갑니다. 대가로 classic PAT를 저장소 secret에 둬야 합니다.

### Gaps
- Microsoft 1차 문서에 "unsigned installers are accepted"를 명시한 문장은 찾지 못했습니다(정책에 서명 조항이 없다는 사실만 확인). winget-cli 메인테이너 발언 원문 링크도 못 찾았습니다.
- 검증 파이프라인이 SmartScreen 평판을 따로 조회하는지는 문서에 "URL reputation test"만 있어 불명확합니다.
- 서명 없는 Tauri NSIS 신규 패키지가 실제로 몇 시간 만에 통과하는지 사례별 추적은 하지 않았습니다(표본 40건은 서명 여부를 구분하지 않음).
- `winget install` 단계에서 클라이언트가 MOTW·SmartScreen 경고를 띄우는지는 확인하지 못했습니다.

## Q2. Scoop

### Takeaway
Scoop `main` 버킷은 GUI 앱을 받지 않습니다. `extras`는 "GitHub 100 stars and/or 50 forks" 수준의 인지도를 요구하므로 지금의 Frond에는 사실상 자체 버킷이 현실적입니다. Scoop은 Tauri NSIS setup.exe를 `#/dl.7z`로 *풀어서* 포터블처럼 설치하는 것이 관례입니다. 이때 NSIS 훅(파일 연결·Default Apps 등록)과 WebView2 부트스트래퍼는 돌지 않습니다.

### Cited Findings
- **main 기준**: "reasonably well-known and widely used developer tool (e.g. if it's a GitHub project, it should have at least 500 stars and 150 forks)", "a fairly standard install", "**a non-GUI tool**" — [Scoop wiki: Criteria for including apps in the main bucket](https://github.com/ScoopInstaller/Scoop/wiki/Criteria-for-including-apps-in-the-main-bucket) (날짜 표시 없음)
- **extras 기준**(Package Request 이슈 템플릿, 2026-10-06 master 기준, [로컬 실측: `gh api`]): 필수 체크 항목은 "Reasonably well-known and widely used (e.g. if it's a GitHub project, it should have **at least 100 stars and/or 50 forks**)", "**English interface (or at least English documentation)**", "Latest stable version". 선택 항목은 "Full version", "Fairly standard install". 요청 시 "Some Indication of Popularity/Repute"를 반드시 적어야 합니다 — [ScoopInstaller/Extras .github/ISSUE_TEMPLATE/package-request.yml](https://github.com/ScoopInstaller/Extras/blob/master/.github/ISSUE_TEMPLATE/package-request.yml)
- extras README 원문: "For manifests that don't fit the Main criteria." — [ScoopInstaller/Extras](https://github.com/ScoopInstaller/Extras)
- 기여 절차: 먼저 이슈를 열고 메인테이너 승인을 받은 뒤 PR을 냅니다. `license`는 SPDX 식별자, "Portable configuration is highly preferred (by using `persist`)", checkver/autoupdate로 자동 갱신되는지 확인해야 합니다 — [ScoopInstaller/.github CONTRIBUTING.md](https://github.com/ScoopInstaller/.github/blob/main/.github/CONTRIBUTING.md)
- 매니페스트 `license` 허용값: SPDX 식별자, 라이선스 URL, 또는 "'Freeware', 'Proprietary', 'Public Domain', 'Shareware', or 'Unknown'". `innosetup: true`로 Inno 설치 파일을 풀 수 있고, URL에 `#/dl.7z` fragment를 붙이면 exe를 7z로 내려받아 자동으로 풉니다. `persist`·`shortcuts`·`installer.script`를 지원하고, wiki에는 레지스트리·파일 연결 지침이 없습니다 — [Scoop wiki: App Manifests](https://github.com/ScoopInstaller/Scoop/wiki/App-Manifests)
- **Tauri NSIS 선례 [로컬 실측: Extras raw JSON]**:
  - `pot`: `"url": ".../pot_3.0.7_x64-setup.exe#/dl.7z"`, `post_install`에서 `$dir\$*`, `Uninstall*`을 지웁니다(NSIS 플러그인 폴더·언인스톨러 제거). `shortcuts`는 `pot.exe`, `checkver.github`·`autoupdate`를 씁니다 — [Extras/bucket/pot.json](https://github.com/ScoopInstaller/Extras/blob/master/bucket/pot.json)
  - `clash-verge-rev`("A Clash Meta GUI based on Tauri"): 같은 `#/dl.7z` 방식이고, `installer.script`에서 `$env:APPDATA\io.github.clash-verge-rev.clash-verge-rev`(Tauri identifier 이름의 데이터 폴더)를 `$persist_dir`로 옮긴 뒤 junction으로 연결합니다 — [Extras/bucket/clash-verge-rev.json](https://github.com/ScoopInstaller/Extras/blob/master/bucket/clash-verge-rev.json)
  - `typora`: `"innosetup": true`, `license: {"identifier": "Proprietary", ...}`. 비오픈소스 앱도 Extras에 들어가 있습니다 — [Extras/bucket/typora.json](https://github.com/ScoopInstaller/Extras/blob/master/bucket/typora.json)
- **파일 연결 처리 관례**: `vscode` 매니페스트는 `.reg` 파일을 같이 배포하고, `notes`로 사용자에게 `reg import "$dir\install-associations.reg"`를 직접 실행하라고 안내합니다(opt-in). 재설치 때 HKCU `Software\Classes\...` 연결을 다시 등록하는 스크립트도 있습니다 — [Extras/bucket/vscode.json](https://github.com/ScoopInstaller/Extras/blob/master/bucket/vscode.json)

### Inferences
- Frond는 GUI라서 main에는 못 들어갑니다. Extras는 영어 UI 조건은 맞지만 GitHub 100 stars / 50 forks 조건을 지금은 못 맞출 가능성이 큽니다(현재 star 수는 조회하지 않음). 그래서 **자체 버킷**(예: `cyKim0115/scoop-bucket` 저장소에 `bucket/frond.json`, 사용자는 `scoop bucket add cykim https://github.com/cyKim0115/scoop-bucket` → `scoop install cykim/frond`)이 현실적입니다. 자체 버킷은 심사가 없고 무료입니다(Scoop wiki Buckets 페이지는 이번에 열지 않았음).
- `#/dl.7z`로 Tauri NSIS를 풀면 `mdeditor.exe`와 리소스만 `~\scoop\apps\frond\<ver>\`에 놓입니다. **`hooks.nsh`의 HKCU `.md` 연결·RegisteredApplications·Default Apps 등록은 실행되지 않고**, 시작 메뉴는 Scoop `shortcuts`로만 생기며, WebView2 부트스트래퍼도 돌지 않습니다. 대부분의 Win10/11에는 WebView2 런타임이 이미 있지만 보장은 안 됩니다.
- 앱 안의 `assoc.rs`(파일 연결·기본 앱)가 설치 경로와 무관하게 현재 exe 경로로 HKCU 연결을 등록할 수 있다면, Scoop 사용자는 앱 설정에서 연결을 켜면 됩니다. 그게 아니면 vscode처럼 `.reg` + `notes`로 안내해야 합니다. Scoop의 `current` junction 경로(`~\scoop\apps\frond\current\mdeditor.exe`)를 등록하면 버전이 바뀌어도 연결이 유지됩니다.
- Frond 데이터 폴더는 `%APPDATA%\Frond`(`appdata.rs`)와 WebView2 데이터(identifier `com.cykim.mdeditor` 기준 `%LOCALAPPDATA%`)입니다. clash-verge-rev처럼 `persist` + junction을 쓸지, 그냥 `%APPDATA%`에 두고 Scoop 재설치 영향 밖에 둘지 정해야 합니다. 후자가 단순합니다.
- 앱 안의 Tauri updater와 Scoop은 충돌합니다. Scoop 설치본에서 updater가 NSIS setup을 실행하면 `%LOCALAPPDATA%\Frond`에 **별도 설치본이 하나 더 생깁니다**. Scoop 빌드에서는 updater를 끄거나(예: 설치 경로가 `\scoop\apps\`면 비활성) 안내가 필요합니다.

### Gaps
- Tauri가 공식 "portable exe" 산출물을 만드는지는 확인하지 못했습니다(Windows Installer 문서에는 portable 언급이 없음 — [Tauri: Windows Installer](https://v2.tauri.app/distribute/windows-installer/)). `target/release/mdeditor.exe` 단독 실행이 리소스·WebView2 측면에서 충분한지는 실험이 필요합니다.
- Scoop wiki의 Buckets(자체 버킷 생성) 페이지와 BucketTemplate 저장소는 이번에 열어 보지 않았습니다.
- Spacedrive는 Extras에 없습니다(404). 다른 버킷에 있는지는 찾지 않았습니다.

## Q3. Chocolatey (Community Repository)

### Takeaway
무료이고 지금도 운영 중입니다(Joplin 패키지가 2026-09-26에 3.7.21로 갱신됨). 다만 자원봉사 수동 검토가 "며칠~몇 주" 걸리고, 매 버전이 (trusted가 아니면) 다시 검토를 거칩니다. 관리자 권한 실행이 기본이라 Frond의 per-user(currentUser) NSIS와는 궁합이 좋지 않습니다. 1인 개발자에게 우선순위는 낮습니다.

### Cited Findings
- 모더레이션은 세 단계입니다. **Validator**(요구사항·가이드라인 품질 검사, "unit testing"), **Verifier**(실제 설치·제거, "integration testing"), **Cleaner**(20일 무응답 'waiting' 패키지를 정리하고 총 35일이면 자동 거절). 그다음 사람 모더레이터가 봅니다. 제출 뒤 자동 검토 시작까지 약 30분이 걸립니다(CDN 동기화) — [Chocolatey Docs: Moderation](https://docs.chocolatey.org/en-us/community-repository/moderation/)
- "A moderator cannot hold up a package based on guidelines/suggestions alone." **Trusted packages**(신뢰 출처·소프트웨어 벤더 본인)는 자동 검사를 통과하면 사람 검토를 건너뜁니다 — [Chocolatey Docs: Moderation](https://docs.chocolatey.org/en-us/community-repository/moderation/)
- 메타데이터: `projectUrl` 필수, 라이선스가 있으면 `licenseUrl` 필수, `authors`는 패키저가 아니라 소프트웨어 벤더여야 함, description은 30자 이상. 바이너리를 포함(embed)하려면 배포권이 있어야 합니다 — [Chocolatey Docs: Moderation](https://docs.chocolatey.org/en-us/community-repository/moderation/)
- 검토 시간: "a few days to a few weeks". 지난 12개월 동안 6,000개 넘는 패키지를 수동 검토했고, 대부분의 모더레이터는 자원봉사자입니다. 첫 메인테이너의 신규 패키지는 첫 피드백까지 검토만 1시간쯤 걸릴 수 있습니다 — [Chocolatey Blog: CCR moderation behind the curtain (2025-06)](https://blog.chocolatey.org/2025/06/ccr-moderation-behind-the-curtain/)
- Verifier 환경은 Windows Server 2019, .NET 3.5/4.8, "Windows Updates current through May 2024"이고 Vagrant VM에서 작업당 20분 제한으로 설치·제거를 시험합니다 — [Chocolatey Docs: Package Verifier](https://docs.chocolatey.org/en-us/community-repository/moderation/package-verifier/) [환경 서술이 2024년 기준이라 낡았을 수 있음]
- Package Scanner(바이러스 검사) 문서는 "This is a Work in Progress"라서 내용이 없습니다 — [Chocolatey Docs: Package Scanner](https://docs.chocolatey.org/en-us/community-repository/moderation/package-scanner/)
- NSIS 패키지 작성: `Install-ChocolateyPackage -PackageName 'x' -FileType 'exe' -SilentArgs '/S' -Url ... -Url64bit ...`에 `checksum`/`checksumType 'sha256'`을 씁니다. 파일을 포함할 때는 `Install-ChocolateyInstallPackage`를 쓰고, 이 함수는 "Administrative Access Required"입니다 — [Chocolatey Docs: Install-ChocolateyPackage](https://docs.chocolatey.org/en-us/create/functions/install-chocolateypackage/)
- 자동 업데이트: **Chocolatey-AU**("This PowerShell module is maintained by the Chocolatey Community as the original maintainer archived the repository"). 패키지마다 `update.ps1`을 두고 AppVeyor(권장)나 GitHub Actions, 로컬 예약 작업으로 돌립니다 — [chocolatey-community/chocolatey-au](https://github.com/chocolatey-community/chocolatey-au)
- [로컬 실측] community.chocolatey.org 패키지 페이지 HTTP 200: `typora`, `obsidian`, `marktext`, `zettlr`, `joplin`, `cherry-studio`. 404: `clash-verge-rev`. OData API 기준 `joplin` 최신 3.7.21, 갱신 2026-09-26(winget 버전과 같음) — [Chocolatey: joplin](https://community.chocolatey.org/packages/joplin)

### Inferences
- Chocolatey는 기본적으로 관리자(elevated) 셸에서 돕니다. 그래서 Frond의 `installMode: currentUser` NSIS를 `/S`로 돌리면 **관리자 계정 프로필의 `%LOCALAPPDATA%`·HKCU에 설치**될 수 있습니다(UAC로 같은 사용자가 승격하면 같은 프로필이지만, 별도 관리자 계정이면 어긋남). Chocolatey 쪽에서는 `perMachine`/`both`가 더 자연스럽습니다.
- 매 버전 수동 검토(며칠~몇 주)가 반복되고 Chocolatey-AU 인프라(AppVeyor 등)도 따로 운영해야 합니다. 사용자 기반이 개발자·관리자 중심이라 Markdown 뷰어 1인 개발 앱에는 비용 대비 효용이 낮습니다. winget·자체 Scoop 버킷 뒤의 후순위로 봅니다.
- Verifier는 Windows Server 2019 VM이라 WebView2가 없을 가능성이 높습니다. 그러면 `downloadBootstrapper`가 설치 중에 네트워크로 런타임을 받아 와야 해서 20분 제한·네트워크 정책에 걸릴 위험이 있습니다(미확인).

### Gaps
- 2026년의 실제 평균 모더레이션 시간 통계(커뮤니티 허브 월간 공지)는 접근하지 못했습니다.
- Package Scanner(VirusTotal 연동) 동작과 서명 없는 설치 파일 취급은 문서가 미완성이라 확인하지 못했습니다.
- `pot`의 Chocolatey 존재 여부는 조회하지 않았습니다.

## Q4. GitHub Releases + tauri-plugin-updater (+ tauri-action)

### Takeaway
Tauri v2 updater는 **Tauri 전용 서명 키쌍**(`tauri signer generate`, 끌 수 없음)으로 `setup.exe.sig`를 검증합니다. Authenticode와는 별개라서 SmartScreen 경고를 줄여 주지 않습니다. Windows에서는 `latest.json`이 가리키는 NSIS setup을 `/P /UPDATE /R /ARGS …`로 실행해 기존 설치 위에 덮어씁니다. `NSIS_HOOK_PREINSTALL/POSTINSTALL`은 업데이트 때마다 다시 돌고, 언인스톨 훅은 돌지 않습니다. `tauri-action@v1`이 빌드·릴리스·`latest.json` 업로드를 한 번에 해 줍니다.

### Cited Findings
**updater 플러그인(공식 문서)**
- 키 생성은 "the Tauri CLI provides the `signer generate` command"입니다. 빌드 때 환경 변수 `TAURI_SIGNING_PRIVATE_KEY`(경로 또는 내용)와 선택 사항 `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`가 필요하고, ".env files do not work"입니다. 서명 검증은 끌 수 없습니다 — [Tauri v2: Updater plugin](https://v2.tauri.app/plugin/updater/)
- `tauri.conf.json`의 `"bundle": { "createUpdaterArtifacts": true }`를 켜면 Windows에서 `myapp-setup.exe` + `myapp-setup.exe.sig`(MSI도 같은 방식)가 나옵니다. 서명은 JSON에 `.sig` **파일 내용**을 그대로 넣어야 합니다("A path or URL does not work!") — [Tauri v2: Updater](https://v2.tauri.app/plugin/updater/)
- 정적 JSON 필수 필드는 `version`, `platforms.<OS-ARCH>.url`, `platforms.<OS-ARCH>.signature`이고, 선택 필드는 `notes`, `pub_date`(RFC 3339)입니다. 키 예: `windows-x86_64`. 동적 서버는 업데이트가 없으면 204, 있으면 200 + JSON을 돌려줍니다. endpoint URL 변수는 `{{current_version}}`, `{{target}}`, `{{arch}}`이고 "TLS is enforced in production mode"입니다 — [Tauri v2: Updater](https://v2.tauri.app/plugin/updater/)
- Windows `installMode`: `"passive"`(기본, "a small window with a progress bar"), `"basicUi"`(사용자 상호작용 필요), `"quiet"`(진행 표시 없음, 관리자 권한이 이미 있어야 함). 원문: "On Windows the application is automatically exited when the install step is executed due to a limitation of Windows installers." — [Tauri v2: Updater](https://v2.tauri.app/plugin/updater/)
- JS API는 `check()` → `update.downloadAndInstall(cb)`, Rust API는 `app.updater()?.check().await?` → `download_and_install` → `app.restart()`입니다 — [Tauri v2: Updater](https://v2.tauri.app/plugin/updater/)

**NSIS 업데이트 흐름(소스 코드 확인, 2026-10-06 기준 브랜치)**
- updater는 NSIS 인자를 `install_mode.nsis_args()`(Passive → `/P`, Quiet → `/S`, BasicUi → 없음) + **`/UPDATE`**로 만들고, 재시작이 필요하면 `/R`(BasicUi 제외) + `/ARGS <현재 exe 인자>`를 붙여 `ShellExecuteW`로 실행합니다 — [plugins-workspace v2: updater/src/updater.rs L982-1012](https://github.com/tauri-apps/plugins-workspace/blob/v2/plugins/updater/src/updater.rs), [config.rs L41-56](https://github.com/tauri-apps/plugins-workspace/blob/v2/plugins/updater/src/config.rs)
- NSIS 템플릿 `installer.nsi`의 `/UPDATE` 동작:
  - "In update mode, always proceeds without uninstalling"(재설치/제거 선택 페이지를 건너뛰고 덮어씀, L319-322)
  - WebView2 설치 단계 "Skip if updating"(L559-562)
  - 시작 메뉴·바탕화면 바로 가기를 다시 만들지 않음(L936-946)
  - 언인스톨 쪽에서는 UpdateMode일 때 바로 가기·HKCU Run 자동 시작·앱 데이터 삭제를 건너뜀(L824-875)
  - `/P` passive일 때 설치 페이지를 자동으로 닫고, `/R`이면 `.onInstSuccess`에서 `nsis_tauri_utils::RunAsUser`로 앱을 다시 실행함(L729-755)
  - 출처: [tauri dev: crates/tauri-bundler/src/bundle/windows/nsis/installer.nsi](https://github.com/tauri-apps/tauri/blob/dev/crates/tauri-bundler/src/bundle/windows/nsis/installer.nsi)
- `Section Install` 안에서 `NSIS_HOOK_PREINSTALL`(L642-644)과 `NSIS_HOOK_POSTINSTALL`(L734-736)은 **UpdateMode 조건 없이 항상 실행**됩니다. `NSIS_HOOK_PREUNINSTALL/POSTUNINSTALL`은 언인스톨 섹션에만 있습니다 — [installer.nsi](https://github.com/tauri-apps/tauri/blob/dev/crates/tauri-bundler/src/bundle/windows/nsis/installer.nsi)
- 공식 문서의 훅 설명: PREINSTALL "Runs before copying files, setting registry key values and creating shortcuts", POSTINSTALL "Runs after the installer has finished copying all files" — [Tauri v2: Windows Installer](https://v2.tauri.app/distribute/windows-installer/)
- 템플릿이 파싱하는 플래그: `/S`, `/P`, `/UPDATE`, `/R`, `/ARGS`, `/NS`(바로 가기 생성 안 함) — [installer.nsi L479-491, L749-773](https://github.com/tauri-apps/tauri/blob/dev/crates/tauri-bundler/src/bundle/windows/nsis/installer.nsi). 2차 요약: [mrn1522/OpenChat PR #41](https://github.com/mrn1522/OpenChat/pull/41)
- 참고 이슈: NSIS 재설치 때 `externalBin` sidecar가 교체되지 않는 문제 — [tauri #15134](https://github.com/tauri-apps/tauri/issues/15134). passive 모드는 [tauri #6955](https://github.com/tauri-apps/tauri/issues/6955) → [commit df89ccc](https://github.com/tauri-apps/tauri/commit/df89ccc1912db6b81d43d56c9e6d66980ece2e8d)에서 도입됐습니다.

**tauri-action**
- "This GitHub Action builds your Tauri application… and optionally upload it to a GitHub Release." 현재 예시는 `tauri-apps/tauri-action@v1`입니다. 입력: `tagName`, `releaseDraft`, `uploadUpdaterJson`(기본 true, `latest.json` 생성·업로드), `updaterJsonPreferNsis`(NSIS·MSI가 둘 다 있을 때 NSIS 우선), `uploadUpdaterSignatures`(.sig 업로드) — [tauri-apps/tauri-action](https://github.com/tauri-apps/tauri-action)
- 공식 파이프라인 가이드: `permissions: contents: write`가 없으면 "Resource not accessible by integration"이 나고, `GITHUB_TOKEN`은 자동 발급됩니다. 트리거는 `release` 브랜치 push나 `app-v*` 태그 예시입니다 — [Tauri v2: GitHub pipeline](https://v2.tauri.app/distribute/pipelines/github/)
- 크로스 컴파일한 Windows 설치 파일의 (Authenticode) 서명에는 "requires an external signing tool"이 필요합니다. Authenticode 서명 절차는 updater 문서가 아니라 별도 서명 문서에서 다룹니다 — [Tauri v2: Windows Installer](https://v2.tauri.app/distribute/windows-installer/), [Tauri v2: Windows code signing](https://v2.tauri.app/distribute/sign/windows/)

**GitHub Releases 한도**
- "Each file included in a release must be under 2 GiB." 릴리스당 asset 최대 1000개, "There is no limit on the total size of a release, nor bandwidth usage." — [GitHub Docs: About releases](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases)
- 최신 릴리스 asset은 `/releases/latest/download/<asset>` 형태로 직접 링크할 수 있습니다 — [GitHub Docs: Linking to releases](https://docs.github.com/en/repositories/releasing-projects-on-github/linking-to-releases) (이번에 열어 보지 않은 문서, 일반 지식 기반)

### Inferences
- **Tauri updater 서명 ≠ Authenticode**:
  - Tauri updater 서명: Tauri CLI로 만든 개인키로 업데이트 파일에 서명하고, 앱에 내장된 공개키(`plugins.updater.pubkey`)로 *앱 자신*이 검증합니다. 목적은 "업데이트 서버나 GitHub 계정이 털려도 가짜 바이너리를 설치하지 않게" 하는 것입니다. 무료이고 인증기관이 없습니다.
  - Authenticode: CA가 발급한 코드 서명 인증서로 PE 파일에 서명하고, *Windows*(SmartScreen, UAC 퍼블리셔 표시, AV 평판)가 검증합니다.
  - 따라서 updater를 넣어도 첫 다운로드의 "Windows protected your PC" 경고는 그대로입니다. 반대로 Authenticode만 있어도 updater 서명은 여전히 필요합니다.
- 공개키가 앱에 내장되므로 **updater 개인키를 잃으면 기존 설치본에는 더 이상 업데이트를 보낼 수 없습니다**(새 키로 서명한 업데이트를 옛 앱이 거부함). 키와 비밀번호는 GitHub Actions secret과 오프라인 백업 두 곳에 둬야 합니다.
- Frond `hooks.nsh`(HKCU `.md` 연결·Default Apps 등록)가 PREINSTALL/POSTINSTALL에 있다면 updater 업데이트 때마다 다시 실행됩니다. HKCU 쓰기가 멱등이면 문제없고, 사용자가 *다른 앱으로 바꿔 둔* 기본 앱(`UserChoice`)을 훅이 덮어쓰지 않는지 확인해야 합니다(Windows는 UserChoice를 해시로 보호하므로 보통 덮어쓸 수 없음 — 미확인). 언인스톨 훅은 업데이트 경로에서 돌지 않으므로 "업데이트 중 연결이 일시 삭제되는" 문제는 없습니다.
- `installMode: passive`(기본)가 currentUser NSIS와 잘 맞습니다(관리자 불필요). `quiet`는 "pre-existing admin privileges"를 요구하므로 피합니다.
- 최소 구성:
  1. `bundle.createUpdaterArtifacts: true`
  2. `plugins.updater.endpoints: ["https://github.com/cyKim0115/MdEditor/releases/latest/download/latest.json"]`, `pubkey`
  3. `tauri-plugin-updater` + capabilities 권한
  4. `tauri-action@v1`(태그 트리거, `TAURI_SIGNING_PRIVATE_KEY(_PASSWORD)` secret)
  5. 릴리스를 publish하면 winget-releaser 실행(Q1)
- 파일 I/O를 `mdeditor-core`로만 하는 규칙(CLAUDE.md)과 updater 다운로드·실행은 별개 경로입니다. 다만 저장 안 된 편집 내용이 있을 때 "install 단계에서 앱 자동 종료"가 일어나므로 업데이트 전에 저장·초안 백업(`drafts.rs`)을 확인하는 흐름이 필요합니다.

### Gaps
- `tauri signer`의 서명 형식(minisign 계열 여부)과 키 분실 경고 문구는 공식 문서 원문에서 직접 확인하지 못했습니다(가져온 요약에 없었음).
- tauri-action이 SHA256SUMS 같은 체크섬 파일을 자동으로 만드는지는 확인하지 못했습니다.
- 업데이트로 들어온 setup.exe(인터넷 다운로드)에 MOTW가 붙어 SmartScreen 경고가 다시 뜨는지는 확인하지 못했습니다(`ShellExecuteW` 직접 실행이라 보통 영향이 적다고 알려져 있으나 출처 없음).

## Q5. 자체 사이트 / 직접 다운로드

### Takeaway
제일 싸고 간단한 조합은 "GitHub Releases에 바이너리, GitHub Pages(또는 README)에 다운로드 안내 + SHA256"입니다. 대역폭 제한이 없고 무료입니다. Cloudflare R2는 egress가 무료라 GitHub 밖 미러로 쓸 수 있습니다. 어느 경로든 서명 없는 exe는 SmartScreen "Windows protected your PC" 경고를 받습니다(상세는 서명 담당 조사자).

### Cited Findings
- GitHub Releases: 파일당 2 GiB 미만, 릴리스당 asset 1000개, 총 용량·대역폭 제한 없음, 태그 시점 소스 zip/tarball 자동 첨부 — [GitHub Docs: About releases](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases)
- Cloudflare R2 무료 구간: 저장 10 GB-month/월, Class A 100만 요청, Class B 1,000만 요청, **egress 무료**. 넘으면 $0.015/GB-month, Class A $4.50/백만, Class B $0.36/백만입니다 — [Cloudflare R2 Pricing](https://developers.cloudflare.com/r2/pricing/)
- winget 정책상 `InstallerUrl`은 "the ISV's release location"이어야 하고 다운로드 사이트(제3자 미러)는 허용되지 않습니다. 리다이렉터를 쓰면 `Validation-Indirect-URL`, 예상 도메인과 다르면 `Validation-Domain`이 붙습니다 — [MS Learn: policies](https://learn.microsoft.com/en-us/windows/package-manager/package/windows-package-manager-policies), [MS Learn: repository](https://learn.microsoft.com/en-us/windows/package-manager/package/repository)
- Obsidian(상용 비공개 소스)도 설치 파일을 GitHub Releases(`github.com/obsidianmd/obsidian-releases/releases/download/v1.14.4/Obsidian-1.14.4.exe`)에 두고 winget이 그 URL을 씁니다 [로컬 실측: `winget show Obsidian.Obsidian`] — [winget-pkgs manifests/o/Obsidian](https://github.com/microsoft/winget-pkgs/tree/master/manifests/o/Obsidian/Obsidian)
- Typora는 자체 도메인(`downloads.typora.io/windows/typora-setup-x64-1.14.10.exe`)에 둡니다 [로컬 실측] — [winget-pkgs manifests/a/appmakes/Typora](https://github.com/microsoft/winget-pkgs/tree/master/manifests/a/appmakes/Typora)

### Inferences
- 다운로드 페이지에 넣을 것:
  1. 버전·날짜
  2. 직접 링크(버전 경로)
  3. SHA256(`Get-FileHash`) — winget `InstallerSha256`, Scoop `hash`, Chocolatey `checksum`과 같은 값
  4. "SmartScreen 경고가 뜨면 '추가 정보 → 실행'" 안내와 스크린샷
  5. WebView2 필요 안내(downloadBootstrapper라 설치 중 인터넷 필요)
  6. winget·Scoop 설치 명령
- R2나 자체 도메인을 *주 배포처*로 쓰면 winget `InstallerUrl`도 그 도메인이어야 합니다. 그러면 SmartScreen·URL reputation을 새 도메인으로 쌓아야 하므로, 처음에는 GitHub Releases 하나로 시작하는 쪽이 평판 면에서 유리할 수 있습니다(추정).
- GitHub Pages 사이트는 같은 저장소의 `docs/`나 `gh-pages` 브랜치로 무료로 운영할 수 있지만, 바이너리는 Pages가 아니라 Releases에 둡니다.

### Gaps
- GitHub Pages 용량·대역폭 한도(일반적으로 1 GB 사이트, 월 100 GB soft limit로 알려짐)는 이번에 원문으로 확인하지 않았습니다.
- SmartScreen 평판 축적 방식(다운로드 수·기간, EV/OV 차이)은 서명 담당 조사자 범위라 다루지 않았습니다. 확인용 1차 출처 후보: [MS Learn: Microsoft Defender SmartScreen overview](https://learn.microsoft.com/en-us/windows/security/operating-system-security/virus-and-threat-protection/microsoft-defender-smartscreen/).

## Q6. 라이선스 영향 (공개 저장소 + LICENSE 없음)

### Takeaway
LICENSE가 없으면 법적으로 "all rights reserved"라서 타인은 보고 fork만 할 수 있습니다. winget·Scoop·Chocolatey는 OSI 라이선스를 요구하지 않고 `License: Proprietary`/`Freeware`로도 등록됩니다(Typora 선례). 하지만 **무료 코드 서명(SignPath Foundation)은 OSI 승인 라이선스가 필수**라서, 서명 비용을 줄이려면 MIT/Apache-2.0 같은 OSI 라이선스를 정하는 것이 사실상 선행 조건입니다.

### Cited Findings
- 라이선스가 없으면 "the work is under exclusive copyright by default"이고 "nobody else can copy, distribute, or modify your work without being at risk of take-downs, shake-downs, or litigation"입니다. GitHub 약관상 "you allow others to view and fork your repository"까지만 허용됩니다 — [choosealicense.com: No License](https://choosealicense.com/no-permission/)
- winget: `License`는 최소 필수 필드입니다 — [MS Learn: manifest](https://learn.microsoft.com/en-us/windows/package-manager/package/manifest). 정책 2.2: 콘텐츠는 "originally created by the application provider, appropriately licensed…" — [MS Learn: policies](https://learn.microsoft.com/en-us/windows/package-manager/package/windows-package-manager-policies). 선례: `appmakes.Typora` License "Proprietary", `Obsidian.Obsidian` License "Proprietary" [로컬 실측]
- Scoop: 라이선스는 SPDX이거나 'Freeware' / 'Proprietary' / 'Public Domain' / 'Shareware' / 'Unknown' — [Scoop wiki: App Manifests](https://github.com/ScoopInstaller/Scoop/wiki/App-Manifests). Extras `typora.json`이 `"identifier": "Proprietary"`로 실제 등록돼 있습니다 — [Extras/bucket/typora.json](https://github.com/ScoopInstaller/Extras/blob/master/bucket/typora.json)
- Chocolatey: "licenseUrl: required if license exists", `authors`는 실제 벤더, 바이너리를 포함하려면 배포권이 필요합니다 — [Chocolatey Docs: Moderation](https://docs.chocolatey.org/en-us/community-repository/moderation/)
- SignPath Foundation(무료 OSS 코드 서명):
  - "The project must use an **OSI-approved Open Source license without commercial dual-licensing** for all components"
  - 시스템 라이브러리를 빼면 "proprietary, non open-source component" 금지
  - "actively maintained", 이미 서명 대상 형태로 "released"
  - 팀 전원 MFA
  - 다운로드 페이지에 "Free code signing provided by SignPath.io, certificate by SignPath Foundation" 표기
  - 출처: [SignPath Foundation: Terms](https://signpath.org/terms)

### Inferences
- Frond에 영향이 있는 것은 "SignPath Foundation을 쓸 것인가" 하나입니다. 쓸 거라면 OSI 라이선스(MIT/Apache-2.0/GPL-3.0 등)를 정하고, 번들 자산(D2Coding OFL-1.1, npm·crates 의존성)이 "proprietary component"에 해당하지 않는지 점검해야 합니다. OFL은 OSI 목록에 있는 라이선스로 알려져 있지만 이번에 확인하지 않았습니다. 쓰지 않을 거라면 `Proprietary`/`Freeware`로도 세 채널 모두 등록할 수 있습니다.
- 라이선스 없이 패키지 매니저에 올리는 것 자체는 문제가 없습니다. 다만 Scoop Extras나 winget 커뮤니티 메인테이너가 *제3자로서* 매니페스트를 갱신해 주는 데에는 명시적 라이선스가 있는 편이 수월합니다(추정).
- 선례 Tauri 앱(Clash Verge Rev, pot)은 GPL-3.0, Spacedrive는 AGPL-3.0입니다 [로컬 실측: winget show]. OSS Tauri 앱은 copyleft 계열이 흔합니다.

### Gaps
- D2Coding(OFL-1.1) 번들 조건(라이선스 파일 동봉, 폰트 단독 판매 금지 등)과 OFL의 OSI 승인 여부는 원문을 확인하지 않았습니다.
- npm/crates 의존성 전체의 라이선스 감사(cargo-about, license-checker 등)는 하지 않았습니다.
- Scoop Extras가 "Proprietary + 무료" 앱을 새로 받을 때 추가 조건(배포권 확인 등)이 있는지는 템플릿에 없어서 확인하지 못했습니다.

## Q7. 선례: 비슷한 앱은 Windows에서 어떻게 배포하나

### Takeaway
Markdown 에디터(Typora·Obsidian·MarkText·Zettlr·Joplin)와 주요 Tauri 앱(Clash Verge Rev·pot·Spacedrive)은 **거의 모두 winget에 있고, 대부분 Scoop Extras에도 있습니다**. Chocolatey는 Electron 계열 에디터만 있고 Tauri 앱은 드뭅니다. Store(msstore)는 Typora 정도뿐입니다. Tauri 앱은 GitHub Releases의 NSIS `*_x64-setup.exe`를 winget(`nullsoft`)과 Scoop(`#/dl.7z`)이 같이 가리키는 패턴이 표준입니다.

### Cited Findings
**[로컬 실측 2026-10-06]** — `winget search/show --source winget`, `winget search --source msstore`, Scoop Extras raw JSON HTTP 코드, community.chocolatey.org 페이지 HTTP 코드

| 앱 | winget ID (버전, InstallerType, URL 호스트) | Scoop Extras | Chocolatey | msstore |
|---|---|---|---|---|
| Typora | `appmakes.Typora` (1.14.10, inno, downloads.typora.io) | 있음 (`innosetup`, Proprietary) | 있음 | 있음 `XPFPH15B9DLNZH` |
| Obsidian | `Obsidian.Obsidian` (1.14.4, nullsoft, GitHub Releases) | 있음 | 있음 | 없음 |
| MarkText | `MarkText.MarkText` (0.20.0) | 있음 | 있음 | 없음 |
| Zettlr | `Zettlr.Zettlr` (4.8.0) + `Zettlr.Zettlr.Beta` | 있음 | 있음 | 없음 |
| Joplin | `Joplin.Joplin` (3.7.21) + `Joplin.Joplin.Pre-release` | 있음 | 있음 (3.7.21, 2026-09-26) | 없음 |
| Clash Verge Rev (Tauri) | `ClashVergeRev.ClashVergeRev` (2.5.7, nullsoft, GitHub Releases) | 있음 (`#/dl.7z` + persist junction) | 없음 (404) | — |
| pot (Tauri) | `Pylogmon.pot` (3.0.7, nullsoft, GitHub Releases) | 있음 (`#/dl.7z`) | 미조회 | — |
| Spacedrive (Tauri) | `spacedrive.Spacedrive` (0.4.3, wix, spacedrive.com API URL) | 없음 (404) | 미조회 | — |
| Cherry Studio | `kangfenmao.CherryStudio` (2.1.4) | 있음 | 있음 | 없음 |

- 출처(매니페스트 위치):
  - winget-pkgs: [appmakes/Typora](https://github.com/microsoft/winget-pkgs/tree/master/manifests/a/appmakes/Typora), [Obsidian/Obsidian](https://github.com/microsoft/winget-pkgs/tree/master/manifests/o/Obsidian/Obsidian), [MarkText/MarkText](https://github.com/microsoft/winget-pkgs/tree/master/manifests/m/MarkText/MarkText), [Zettlr/Zettlr](https://github.com/microsoft/winget-pkgs/tree/master/manifests/z/Zettlr/Zettlr), [Joplin/Joplin](https://github.com/microsoft/winget-pkgs/tree/master/manifests/j/Joplin/Joplin), [ClashVergeRev](https://github.com/microsoft/winget-pkgs/tree/master/manifests/c/ClashVergeRev/ClashVergeRev), [Pylogmon/pot](https://github.com/microsoft/winget-pkgs/tree/master/manifests/p/Pylogmon/pot), [spacedrive](https://github.com/microsoft/winget-pkgs/tree/master/manifests/s/spacedrive/Spacedrive), [kangfenmao/CherryStudio](https://github.com/microsoft/winget-pkgs/tree/master/manifests/k/kangfenmao/CherryStudio)
  - Scoop: [ScoopInstaller/Extras bucket](https://github.com/ScoopInstaller/Extras/tree/master/bucket)
  - Chocolatey: [community.chocolatey.org/packages](https://community.chocolatey.org/packages)
  - winget-pkgs 경로는 문서 규칙(`manifests/<letter>/<publisher>/<app>`)으로 구성했고, 존재 여부는 `winget search` 결과로 확인했습니다.
- winget Publisher 필드에서 보듯, publisher 폴더 이름은 개인·조직 핸들을 그대로 쓰는 경우가 흔합니다(`Pylogmon`, `kangfenmao`, `appmakes`). 개인 개발자 핸들 ID(`cyKim.Frond`)도 관례에 맞습니다 [로컬 실측].
- Clash Verge Rev의 Scoop 매니페스트 설명에 "A Clash Meta GUI based on Tauri"라고 적혀 있습니다 — [Extras/bucket/clash-verge-rev.json](https://github.com/ScoopInstaller/Extras/blob/master/bucket/clash-verge-rev.json)

### Inferences
**채널 비교 요약** (Q1~Q6 근거 종합; 비용은 모두 0원, 서명은 어느 채널도 필수 아님)

| 채널 | 들어가는 조건 | 심사·소요 | 업데이트 흐름 | Tauri NSIS 적합도 | Frond에서 따로 손볼 것 |
|---|---|---|---|---|---|
| GitHub Releases + updater | 없음 | 없음 | `latest.json` → `/P /UPDATE` 덮어쓰기, tauri-action 자동 | 그대로 씀 | updater 키 보관, 저장 안 된 편집 처리 |
| winget | 공개 HTTPS·SHA256·silent·ISV URL | 자동 + 수동, 표본 중앙값 약 33시간(최대 약 17일) | 버전마다 PR(WinGet Releaser·Komac 자동화) | `nullsoft` + `Scope: user` | classic PAT, 버전 경로 URL |
| Scoop 자체 버킷 | 없음 | 없음 | `checkver.github` + `autoupdate`(Excavator Action 또는 수동) | `#/dl.7z` 풀기(훅 미실행) | 파일 연결 대체 수단, updater 끄기 |
| Scoop Extras | 100★/50 fork, 영어, 이슈 먼저 | 메인테이너 승인 | Extras 봇 autoupdate | 위와 같음 | 인지도 확보 뒤 |
| Chocolatey | projectUrl·licenseUrl·checksum | 며칠~몇 주, 버전마다 검토 | Chocolatey-AU(AppVeyor/GHA) | 관리자 실행 ↔ currentUser 부조화 | per-machine 고려 |
| 자체 사이트 | 없음 | 없음 | 수동 또는 updater 연동 | 그대로 씀 | SHA256·SmartScreen 안내 |

- 권장 순서(추정):
  1. LICENSE 결정
  2. GitHub Releases + tauri-action + updater
  3. winget(`cyKim.Frond`) 첫 제출 → WinGet Releaser 자동화
  4. 자체 Scoop 버킷(선택)
  5. (인지도가 생기면) Scoop Extras
  6. Chocolatey는 보류
- Tauri 선례 중 **Chocolatey에 있는 것은 확인하지 못했습니다**(Clash Verge Rev 404). Tauri 생태계에서는 winget + Scoop Extras가 사실상 표준인 것으로 보입니다.
- Spacedrive만 MSI(wix)를 쓰는데, 이는 Tauri v1 시절 기본값의 흔적으로 보입니다. Tauri v2 앱은 NSIS(nullsoft)가 주류입니다(표본 3개라 일반화에 한계가 있음).

### Gaps
- 선례 앱들의 **Authenticode 서명 여부**는 확인하지 못했습니다. 설치 파일을 내려받아 `Get-AuthenticodeSignature`로 봐야 하는데, 파일 다운로드는 이번 범위에서 하지 않았습니다. "Obsidian·Typora·Joplin은 서명, 소형 Tauri OSS는 미서명"이라는 통념은 미검증입니다.
- MarkText·Zettlr·Joplin·Cherry Studio의 winget InstallerType과 호스트는 `winget show`로 조회하지 않았습니다(Typora·Obsidian·Tauri 3종만 조회).
- Chocolatey 페이지 HTTP 200은 패키지가 *존재*한다는 뜻일 뿐, 최신 승인 상태(예: 오래 방치됐는지)는 Joplin 외에는 확인하지 못했습니다.
- Scoop Extras의 신규 GUI 앱 요청이 실제로 얼마 만에 받아들여지는지(이슈 → 병합 시간)는 측정하지 않았습니다.
