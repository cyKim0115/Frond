# Tauri 2 앱(Frond)의 MSIX 패키징과 MSIX가 바꾸는 동작 (2026-10 기준)

> 조사일 2026-10-06. 대상 앱: Frond(`mdeditor.exe`, identifier `com.cykim.mdeditor`, tauri 2.12, NSIS currentUser 설치, 미서명).
> 로컬 근거 파일: `src-tauri/tauri.conf.json`, `src-tauri/nsis/hooks.nsh`, `src-tauri/src/assoc.rs`, `src-tauri/src/appdata.rs`, `src-tauri/src/themes.rs`, `src-tauri/src/lib.rs`, `integrations/open-new-md.ps1`, 그리고 이 저장소의 자동 메모리 `claude-msix-appdata-virtualization.md`(2026-10-06 실측).
> Partner Center 계정·Store 정책·winget 등은 범위 밖(다른 조사자 담당).

## 1. MSIX를 만드는 툴체인은 무엇이 있고 2026년 현재 상태는?

### Takeaway
tauri-cli/tauri-bundler는 2026-10 현재도 MSIX를 만들지 않는다(EXE·MSI만). 실용 경로는 ① Microsoft **winapp CLI**(Public Preview, Tauri 전용 가이드 있음), ② 커뮤니티 **`@choochmeque/tauri-windows-bundle`**(tauri.conf.json을 읽어 Store용 .msix/.msixbundle 생성, 실제 Tauri 앱 CI에서 사용 중), ③ 수동 `AppxManifest.xml` + `makeappx` + `signtool` 세 가지다. MSIX Packaging Tool(설치기 변환)은 Frond의 NSIS 훅이 하는 일을 대신해 주지 못해 비추천.

### Cited Findings
**Tauri 본체(네이티브 지원 없음)**
- Tauri 공식 Microsoft Store 문서(2026-06-15 갱신): "Currently Tauri only generates EXE and MSI installers" — Store에는 EXE/MSI 링크 방식만 안내하며 MSIX 언급 없음. Store용 EXE/MSI는 `webviewInstallMode: offlineInstaller`·무인 설치(`/S`)·코드 서명 필요 — [v2.tauri.app/distribute/microsoft-store](https://v2.tauri.app/distribute/microsoft-store/)
- 이슈 #4818 "[feat] Windows - Build MSIX Packages to Support Package Extensions": 2022-08-01 개설, **Open**, 라벨 `scope: bundler`, 마일스톤·담당자 없음. 제안은 sparse package(Win10 2004+) 또는 full MSIX — [tauri-apps/tauri#4818](https://github.com/tauri-apps/tauri/issues/4818)
- 이슈 #8548 "[feat] Add the ability to generate .msix or .appx"(2024-01-05) → **Closed as not planned** — [tauri-apps/tauri#8548](https://github.com/tauri-apps/tauri/issues/8548)
- 2026년 tauri-bundler 변경 기록(2.9.x)에는 NSIS/MSI 개선만 있고 MSIX 타깃 추가는 보이지 않음 — [tauri-bundler changelog](https://v2.tauri.app/release/tauri-bundler/) (검색 요약 기준, 전체 changelog 정독은 안 함)

**winapp CLI (Microsoft, Windows App Development CLI)**
- 상태: README에 "Status: Public Preview — … experimental and in active development" — [microsoft/winappCli](https://github.com/microsoft/winappCli)
- 명령: `init`, `restore`, `update`, `pack`(MSIX 생성), `run`(패키지처럼 실행), `create-debug-identity`(sparse identity), `manifest`, `cert`, `sign`, `az-sign`(Azure Trusted Signing), `store`(Microsoft Store Developer CLI), `unregister` 등. Rust·Tauri 가이드 제공 — [microsoft/winappCli](https://github.com/microsoft/winappCli)
- Tauri 가이드(ms.date 2026-10-03) 전제 조건: **Windows 11**, Node.js, Rust, `winget install microsoft.winappcli --source winget` — [Learn: Using winapp CLI with Tauri](https://learn.microsoft.com/en-us/windows/apps/dev-tools/winapp-cli/guides/tauri)
- 절차(같은 문서):
  - `winapp init` → `Package.appxmanifest`와 `Assets` 폴더 생성(패키지 이름·Publisher·Version 1.0.0.0·Entry point `tauri-app.exe` 질문, "Do not setup SDKs" 선택 — Tauri는 Rust `windows` 크레이트를 쓰므로 `winapp.yaml` 없음)
  - 디버그: `cargo build … && copy target\debug\tauri-app.exe dist\ && winapp run .\dist` → loose layout 패키지를 등록하고 identity로 실행(인증서 불필요). 정리는 `winapp unregister`
  - 패키징: `npm run tauri -- build && copy target\release\tauri-app.exe dist\ && winapp pack .\dist --cert .\devcert.pfx`
  - 인증서: `winapp cert generate --if-exists skip`(manifest의 Publisher를 자동으로 읽음), 관리자 권한으로 `winapp cert install .\devcert.pfx`(인증서당 1회), 설치 `Add-AppxPackage .\tauri-app.msix`
  - 재패키징 시 manifest `Version`을 올려야 업데이트 설치 가능. "The Microsoft Store will sign the MSIX for you, no need to sign before submission." 아키텍처별(x64, Arm64) 패키지 별도
  — [Learn: Using winapp CLI with Tauri](https://learn.microsoft.com/en-us/windows/apps/dev-tools/winapp-cli/guides/tauri)

**@choochmeque/tauri-windows-bundle (커뮤니티)**
- "Create Windows Store ready MSIX bundles for Tauri apps with multiarch and extension support". `npx @choochmeque/tauri-windows-bundle@latest init` → `src-tauri/gen/windows/bundle.config.json`, `AppxManifest.xml.template`, `Assets/` 생성. 빌드 `pnpm tauri:windows:build` / `--arch x64,arm64` / `--debug` — [Choochmeque/tauri-windows-bundle](https://github.com/Choochmeque/tauri-windows-bundle)
- `tauri.conf.json`의 `bundle.fileAssociations`를 읽음(`bundle.config.json` 값이 우선). `runFullTrust` 자동 추가, MinVersion 기본 `10.0.17763.0`. 서명: PFX(`MSIX_PFX_PASSWORD`) 또는 `bundle.windows.certificateThumbprint`. 확장: `extension add file-association`, `extension add app-execution-alias`, 프로토콜·Share Target·Startup Task·Context Menu·Background Task. 내부적으로 `msixbundle-cli`(Rust `msixbundle-rs`) 사용 — [Choochmeque/tauri-windows-bundle](https://github.com/Choochmeque/tauri-windows-bundle), [Choochmeque/msixbundle-rs](https://github.com/Choochmeque/msixbundle-rs)
- 버전: 0.1.28 → 0.2.0 릴리스(템플릿 저장소의 dependabot PR) — [abusayed0206/tauri#24](https://github.com/abusayed0206/tauri/pull/24), [release v0.2.0](https://github.com/Choochmeque/tauri-windows-bundle/releases/tag/v0.2.0)

**수동(makeappx/signtool)**
- `appxmanifest.xml`을 직접 쓰고 `MakeAppx.exe`로 패키지 생성. 비주얼 자산을 바꾸면 `makepri.exe createconfig /cf priconfig.xml /dq en-US` → `makepri.exe new /pr <폴더> /cf <폴더>\priconfig.xml`로 resources.pri 재생성. 패키징 전 테스트 `Add-AppxPackage –Register AppxManifest.xml` — [Learn: Generating MSIX package components](https://learn.microsoft.com/en-us/windows/msix/desktop/desktop-to-uwp-manual-conversion)

**MSIX Packaging Tool (설치기 변환)**
- MSI·EXE·ClickOnce·App-V·Script·수동 설치를 캡처해 MSIX로 변환. CLI는 관리자 명령창에서 `MsixPackagingTool.exe create-package --template <xml>` — [Learn: package-conversion-command-line](https://learn.microsoft.com/en-us/windows/msix/packaging-tool/package-conversion-command-line), [Learn: create-app-package](https://learn.microsoft.com/en-us/windows/msix/packaging-tool/create-app-package)
- 패키지에 담긴 레지스트리는 "visible only inside its container - … other apps, including the OS cannot 'see' the registry" — [Advanced Installer: MSIX Registry](https://www.advancedinstaller.com/hub/msix-packaging/registry.html)

### Inferences
- Frond에는 **tauri-windows-bundle**이 가장 손이 덜 간다: 이미 있는 `bundle.fileAssociations`(md/markdown, ProgId 이름 `MdEditor.Markdown`)와 `productName`·`version`을 그대로 쓰고, 실행 별칭도 CLI로 추가된다. 단 커뮤니티 1인 프로젝트(0.x)라 버전 고정·생성 manifest 직접 검토가 필요하다.
- **winapp**은 Microsoft 공식이지만 Public Preview이고 가이드 전제가 Windows 11이다. 개발 기기는 Windows 10 19045이므로 Win10에서 `winapp pack`이 도는지 확인이 필요하다(문서상 확인 못 함).
- Tauri 릴리스 exe는 프런트(`dist`)를 실행 파일에 내장하므로, 가이드처럼 `mdeditor.exe` 하나 + `Assets` + manifest만으로 레이아웃이 성립한다. NSIS가 하던 WebView2 부트스트랩·레지스트리 훅은 MSIX 레이아웃에 들어가지 않는다.
- MSIX Packaging Tool로 NSIS 설치기를 캡처하면 hooks.nsh의 HKCU 쓰기가 패키지 내부 hive로 들어가 셸에 안 보이므로, 결국 manifest에 `uap:FileTypeAssociation`을 직접 넣어야 한다 → 변환 도구의 이점이 거의 없다.

### Gaps
- winapp CLI의 최신 버전 번호·릴리스 날짜, Windows 10 지원 여부는 확인 못 함.
- cargo-packager, Advanced Installer 무료 등급의 MSIX 지원 현황은 조사하지 않음(시간 제약).
- tauri-bundler 전체 changelog를 MSIX 키워드로 정독하지 않음 — 검색 요약 기준으로 "없음".

## 2. 풀 트러스트 Win32 데스크톱 앱의 최소 AppxManifest는?

### Takeaway
`runFullTrust` 제한 기능 + `Application Executable="mdeditor.exe" uap10:RuntimeBehavior="packagedClassicApp" uap10:TrustLevel="mediumIL"`(= 옛 `EntryPoint="Windows.FullTrustApplication"`) + `TargetDeviceFamily Name="Windows.Desktop"`이 뼈대다. `uap10`을 쓰면 MinVersion은 10.0.19041.0 이상이어야 한다. Store 제출 시 `Identity Name/Publisher`는 Partner Center 값과 같아야 하고, 사이드로드면 서명 인증서 Subject와 같아야 한다.

### Cited Findings
- Microsoft 수동 패키징 템플릿: `Identity(Name, Version, Publisher, ProcessorArchitecture)`, `Properties(DisplayName, PublisherDisplayName, Description, Logo)`, `Resources`, `Dependencies/TargetDeviceFamily Name="Windows.Desktop" MinVersion MaxVersionTested`, `Capabilities/rescap:Capability Name="runFullTrust"`, `Application Id Executable uap10:RuntimeBehavior="packagedClassicApp" uap10:TrustLevel="mediumIL"`, `uap:VisualElements DisplayName Description Square150x150Logo Square44x44Logo BackgroundColor` — [Learn: Generating MSIX package components](https://learn.microsoft.com/en-us/windows/msix/desktop/desktop-to-uwp-manual-conversion)
- "If you've reserved your application name in the Microsoft Store, you can obtain the Name and Publisher by using Partner Center. If you plan to sideload … the publisher name that you choose matches the name on the certificate you use to sign your app." — 같은 문서
- "A packaged application always runs as an interactive user, and any drive that you install your packaged application on to must be formatted to NTFS format." — 같은 문서
- `uap10:RuntimeBehavior`/`uap10:TrustLevel`은 Windows 10 2004(19041)에 도입. 더 낮은 OS에 설치하려면 `EntryPoint="windows.fullTrustApplication"`(= packagedClassicApp + mediumIL)을 대신 쓴다. 둘을 같이 쓰면 중복이고 서로 모순되면 오류 — [Learn: Application element](https://learn.microsoft.com/en-us/uwp/schemas/appxpackage/uapmanifestschema/element-application)
- 풀 트러스트 앱(mediumIL)은 AppContainer에서 돌지 않으며 **runFullTrust를 반드시 선언**해야 한다. `Makeappx.exe`가 누락을 검증해 오류를 낸다 — [Learn: App capability declarations](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/app-capability-declarations)
- 제한 기능은 사이드로드에는 승인이 필요 없고 Store 제출 때만 승인 필요 — 같은 문서
- `Application`의 `uap16/uap17:BaseNamedObjectsIsolation`(none|package)은 선택 속성(BNO 격리 opt-in), `uap11:CurrentDirectoryPath`로 시작 디렉터리 지정 가능 — [Learn: Application element](https://learn.microsoft.com/en-us/uwp/schemas/appxpackage/uapmanifestschema/element-application)
- 버전은 4자리(quad) 표기. winapp 기본 `1.0.0.0` — [Learn: winapp Tauri guide](https://learn.microsoft.com/en-us/windows/apps/dev-tools/winapp-cli/guides/tauri)
- tauri-windows-bundle 기본 MinVersion `10.0.17763.0` — [Choochmeque/tauri-windows-bundle](https://github.com/Choochmeque/tauri-windows-bundle)

### Inferences
Frond용 초안(문서 템플릿 + 아래 3·5절 확장 합성. 값 `<…>`는 Partner Center 또는 인증서에서 채움):

```xml
<?xml version="1.0" encoding="utf-8"?>
<Package
  xmlns="http://schemas.microsoft.com/appx/manifest/foundation/windows10"
  xmlns:uap="http://schemas.microsoft.com/appx/manifest/uap/windows10"
  xmlns:uap3="http://schemas.microsoft.com/appx/manifest/uap/windows10/3"
  xmlns:uap10="http://schemas.microsoft.com/appx/manifest/uap/windows10/10"
  xmlns:desktop="http://schemas.microsoft.com/appx/manifest/desktop/windows10"
  xmlns:rescap="http://schemas.microsoft.com/appx/manifest/foundation/windows10/restrictedcapabilities"
  xmlns:rescap3="http://schemas.microsoft.com/appx/manifest/foundation/windows10/restrictedcapabilities/3"
  IgnorableNamespaces="uap uap3 uap10 desktop rescap rescap3">
  <Identity Name="<PartnerCenter Package/Identity/Name>" Publisher="CN=<PartnerCenter Publisher>"
            Version="0.1.0.0" ProcessorArchitecture="x64" />
  <Properties>
    <DisplayName>Frond</DisplayName>
    <PublisherDisplayName>cyKim</PublisherDisplayName>
    <Logo>Assets\StoreLogo.png</Logo>
  </Properties>
  <Resources><Resource Language="ko-KR" /><Resource Language="en-US" /></Resources>
  <Dependencies>
    <TargetDeviceFamily Name="Windows.Desktop" MinVersion="10.0.19041.0" MaxVersionTested="10.0.26100.0" />
  </Dependencies>
  <Capabilities><rescap:Capability Name="runFullTrust" /></Capabilities>
  <Applications>
    <Application Id="Frond" Executable="mdeditor.exe"
                 uap10:RuntimeBehavior="packagedClassicApp" uap10:TrustLevel="mediumIL">
      <uap:VisualElements DisplayName="Frond" Description="Markdown 문서 뷰어·편집기"
        BackgroundColor="transparent"
        Square150x150Logo="Assets\Square150x150Logo.png" Square44x44Logo="Assets\Square44x44Logo.png" />
      <Extensions>
        <uap:Extension Category="windows.fileTypeAssociation">
          <uap3:FileTypeAssociation Name="markdown">
            <uap:DisplayName>Markdown 문서</uap:DisplayName>
            <uap:SupportedFileTypes>
              <uap:FileType>.md</uap:FileType><uap:FileType>.markdown</uap:FileType>
              <uap:FileType>.mdown</uap:FileType><uap:FileType>.mkd</uap:FileType>
              <uap:FileType>.mkdn</uap:FileType><uap:FileType>.mdwn</uap:FileType>
            </uap:SupportedFileTypes>
            <rescap3:MigrationProgIds>
              <rescap3:MigrationProgId>MdEditor.Markdown</rescap3:MigrationProgId>
            </rescap3:MigrationProgIds>
          </uap3:FileTypeAssociation>
        </uap:Extension>
        <uap3:Extension Category="windows.appExecutionAlias" EntryPoint="Windows.FullTrustApplication">
          <uap3:AppExecutionAlias><desktop:ExecutionAlias Alias="mdeditor.exe" /></uap3:AppExecutionAlias>
        </uap3:Extension>
      </Extensions>
    </Application>
  </Applications>
</Package>
```
- `tauri.conf.json`의 `version` "0.1.0"은 MSIX에서 "0.1.0.0"처럼 4자리로 바꿔야 한다.
- `Application Id`는 AUMID(`<PFN>!Frond`)의 일부가 되므로 Store 게시 뒤 바꾸지 않는다(문서: ID 변경 시 Start 타일 위치가 깨짐 — [Application element](https://learn.microsoft.com/en-us/uwp/schemas/appxpackage/uapmanifestschema/element-application)).

### Gaps
- StoreLogo 50x50 등 자산별 정확한 픽셀 크기·scale 변형 목록은 이번에 가져온 문서에서 확인하지 못함(`winapp init`/tauri-windows-bundle이 Assets를 생성).
- Store가 Version의 4번째(revision) 자리를 0으로 요구하는지 이번 조사에서 확인 못 함(Store 정책 조사자 몫).
- `rescap3:MigrationProgIds`가 Store 인증에서 별도 승인 대상인지 확인 못 함.

## 3. 파일 연결은 MSIX에서 어떻게 바뀌나? (기본 앱 목록·레지스트리 쓰기·IApplicationAssociationRegistration·ProgId·기존 UserChoice)

### Takeaway
MSIX에서는 NSIS 훅이 돌지 않으므로 파일 연결은 **manifest의 `uap:FileTypeAssociation`**으로만 등록한다. 패키지 앱은 Windows가 만든 `AppX<해시>` ProgId를 받고 Default Apps에 자동으로 오르며, Win11 딥링크는 `registeredAUMID=<AUMID>`를 쓴다. 앱이 런타임에 `HKCU\Software\Classes`·`RegisteredApplications`에 쓰는 값은 문서상 패키지 전용 hive로 가상화돼 셸이 보지 못한다(실측 충돌 있음, 아래). 기존 사용자의 `UserChoice=MdEditor.Markdown`은 **`rescap3:MigrationProgIds`**로 이어받는다. `assoc.rs`의 `is_registered`·`query_default_app` 비교·`registeredAppUser` URI 세 군데가 패키지 실행 시 틀어진다.

### Cited Findings
**manifest 선언**
- `windows.fileTypeAssociation` 확장으로 확장자를 연결하면 탐색기 "Open with" 추천에 뜬다. XML: `<uap:Extension Category="windows.fileTypeAssociation"><uap3:FileTypeAssociation Name="…"><uap:SupportedFileTypes><uap:FileType>.avi</uap:FileType>…`. Name은 소문자·공백 없음 — [Learn: desktop-to-uwp-extensions](https://learn.microsoft.com/en-us/windows/apps/desktop/modernize/desktop-to-uwp-extensions)
- 동사(Verb)에 `Parameters="/e &quot;%1&quot;"` 형태로 명령줄 지정 가능, `UseUrl="true" Parameters="%1"`, `MultiSelectModel` 속성 존재 — 같은 문서
- `uap:FileTypeAssociation` 속성: `desktop2:UseUrl`(false면 ShellExecuteEx가 문서를 로컬 파일로 받아 그 경로로 실행), `desktop2:AllowSilentDefaultTakeOver`("will appear in an 'Open With' list, but it won't be the default app"), 자식 `DisplayName`, `Logo`, `InfoTip`, `EditFlags`, `SupportedFileTypes`, `rescap3:MigrationProgIds`, `desktop7:ProgId` 등. 최소 OS Win10 1511 — [Learn: uap:FileTypeAssociation](https://learn.microsoft.com/en-us/uwp/schemas/appxpackage/uapmanifestschema/element-uap-filetypeassociation)
- **기존 연결 이어받기**: "Make your packaged application open files instead of your desktop app … specify the ProgID of each application from which you want to inherit file associations" — `<rescap3:MigrationProgIds><rescap3:MigrationProgId>Foo.Bar.1</rescap3:MigrationProgId>…` (namespace `uap/windows10/3`, `restrictedcapabilities/3`) — [Learn: desktop-to-uwp-extensions](https://learn.microsoft.com/en-us/windows/apps/desktop/modernize/desktop-to-uwp-extensions)
- 데스크톱판 바로가기 이전: `rescap3:DesktopAppMigration`(`AumId`, `ShortcutPath`) — 같은 문서

**기본 앱 목록·딥링크**
- `ms-settings:defaultapps` 쿼리 3종: `registeredAppUser`(HKCU\Software\RegisteredApplications 값 이름), `registeredAppMachine`(HKLM), **`registeredAUMID`** — "Use when the app was registered with Package Manager using a manifest declaring that the app handles File Types (uap:FileTypeAssociation) or URI schemes". Win11 21H2/22H2(2023-04 누적 업데이트)·23H2 이상 — [Learn: Launch the Default Apps settings page](https://learn.microsoft.com/en-us/windows/apps/develop/launch/launch-default-apps-settings)
- "To get the registeredAUMID query string parameter to work after an OS upgrade, an app may need to increment its TargetDeviceFamily…MaxVersionTested" — 21H2는 `10.0.22000.1817`, 22H2는 `10.0.22621.1555` 이상 — 같은 문서
- 사용자 로그온 시 Windows가 AppX 패키지를 열거해 FileTypeAssociations 등을 사용자 프로필에 설정 — [ControlUp blog](https://www.controlup.com/resources/blog/appx-packages-slowing-you-down/) (2차 출처)

**ProgId·UserChoice**
- Store/패키지 앱의 ProgId는 `AppX4ztfk9wxr86nxmzzq47px0nh0e58b8fw`처럼 기계 생성값. UserChoice는 ProgId+Hash로 저장되고 해시 알고리즘은 비공개라 직접 쓰면 셸이 되돌림 — [endpointweekly: Default Apps and File Associations](https://endpointweekly.com/blog/default-apps-file-associations-dism-xml.html) (2차 출처)
- 로컬 코드도 같은 가정: `assoc.rs`의 `query_default_app` 주석이 반환값 예로 `"AppX…"`를 들고, `"MdEditor.Markdown"`이면 Frond가 기본 앱이라고 판정 — `src-tauri/src/assoc.rs`
- MS Q&A 답변(2024-01-08, 외부 지원 인력): 패키지 앱을 기본 처리기로 만들려면 "you need to set it as the default app in the windows Settings" — [Microsoft Q&A 1346579](https://learn.microsoft.com/en-us/answers/questions/1346579/how-can-i-associate-file-types-with-a-storeapp-usi) (품질 낮은 답변, 참고만)

**런타임 레지스트리 쓰기(가상화)**
- 공식: "All writes under HKCU are copied on write to a private per-user, per-app location." 앱 제거 시에만 삭제 — [Learn: Understanding how packaged desktop apps run](https://learn.microsoft.com/en-us/windows/msix/desktop/desktop-to-uwp-behind-the-scenes) (ms.date 2025-09-09)
- 공식: HKCU 런타임 쓰기는 "a separate per-app, per-user private hive … Keys in the virtualized hive are only visible to the app" — [Learn: Flexible virtualization](https://learn.microsoft.com/en-us/windows/msix/desktop/flexible-virtualization)
- 패키지 레지스트리는 컨테이너 안에서만 보이고 OS가 보지 못함 → 런타임에 `HKCU\Software\Classes`에 쓴 연결은 셸에 반영되지 않음 — [Advanced Installer: Registry](https://www.advancedinstaller.com/hub/msix-packaging/registry.html)
- 2026 실측(Win11 25H2 26200, 2026-10-02): Claude 데스크톱 MSIX 안에서 돈 PowerShell·reg.exe의 `HKCU\Software\…` 쓰기가 `…\Packages\Claude_pzs8sxrjxfjjc\SystemAppData\Helium\User.dat`로 들어감. manifest에 `desktop6:RegistryWriteVirtualization=disabled`가 있어도 Win11 flexible virtualization(`ExcludedKeys` 12개) 선언이 이겨서 나머지 HKCU\Software가 가상화된 것으로 보임. 예외로 `HKCU\Environment`는 비가상화 — [anthropics/claude-code#99059](https://github.com/anthropics/claude-code/issues/99059)
- **충돌**: 이 저장소의 2026-10-06 실측 메모는 "레지스트리(HKCU)는 가상화되지 않는다" — 같은 Claude 컨테이너 안에서 돈 NSIS 설치기의 레지스트리 쓰기(HKCU\Software\Classes 등)는 사용자 쪽에 보였다("레지스트리만 Frond를 가리켰다") — `memory/claude-msix-appdata-virtualization.md`. 키 위치(Classes는 별도 hive) 또는 Claude 앱 버전 차이일 수 있으나 확인 못 함.
- 공식 opt-out: `unvirtualizedResources` 제한 기능 + `desktop6:RegistryWriteVirtualization=disabled`, Win11은 `virtualization:ExcludedKeys`(HKCU 아래만). 단 이 기능은 "designed for certain types of desktop PC games … It is not intended to be used for other scenarios" — [Learn: Flexible virtualization](https://learn.microsoft.com/en-us/windows/msix/desktop/flexible-virtualization), [Learn: App capability declarations](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/app-capability-declarations)

### Inferences
Frond 코드별 영향(로컬 코드 + 위 출처 종합):
- **hooks.nsh 전체**(OpenWithProgids, `Applications\mdeditor.exe`, `Software\Frond\Capabilities`, `RegisteredApplications\Frond`, SHChangeNotify): MSIX에는 설치 스크립트가 없으므로 실행되지 않는다. 대신 manifest FTA 하나로 "Open with"·Default Apps 노출이 해결된다. 앱(`assoc.rs`)은 레지스트리를 **읽기만** 하므로 쓰기 가상화의 직접 피해는 없다.
- **`is_registered()`**(HKCU\Software\RegisteredApplications\Frond 존재 확인): 패키지 설치만 있는 기기에서는 항상 false → "등록 안 됨" 경고가 잘못 뜬다. 패키지 실행 시(`Package::Current()` 성공) 등록된 것으로 간주하도록 분기해야 한다.
- **`open_default_apps_settings()`**: Win11에서 `registeredAppUser=Frond`는 패키지 앱에 맞지 않는다. 패키지 실행 시 `ms-settings:defaultapps?registeredAUMID=<URI-escape(PFN!Frond)>`로 바꾸고, manifest `MaxVersionTested`를 22621.1555 이상으로 둔다.
- **`query_default_app()`**: 패키지 Frond가 기본 앱이면 `QueryCurrentDefault`가 `AppX…` ProgId를 돌려주므로 프런트의 `== "MdEditor.Markdown"` 판정이 거짓 음성이 된다. 패키지 실행 시 비교 대상을 "자기 패키지의 ProgId"로 바꿔야 한다(예: `HKCR\<ProgId>\Application\AppUserModelID`를 읽어 자기 AUMID와 비교 — 키 구조는 미검증).
- **기존 NSIS 사용자**: UserChoice가 `MdEditor.Markdown`을 가리킨다. MSIX만 설치하고 NSIS를 지우면 템플릿 제거기가 ProgId 키를 지워 연결이 끊긴다. `MigrationProgId=MdEditor.Markdown`을 넣으면 패키지 앱이 그 연결을 이어받는다(문서 의도). NSIS와 MSIX를 동시에 두면 두 개의 "Frond"가 Open with·Default Apps에 나란히 뜰 수 있다.
- 앱이 스스로 기본 앱이 되는 경로는 MSIX에서도 없다(UserChoice 해시) — 지금 설계(설정 앱 열기)가 그대로 맞다.

### Gaps
- 패키지 FTA가 등록하는 `HKCR\AppX<hash>` 키의 정확한 구조(`Application\AppUserModelID` 값 존재 여부, `shell\open\command` 대신 DelegateExecute를 쓰는지)는 1차 출처를 찾지 못함.
- `AppX<hash>` 해시 산출 방식(PFN·FTA Name 기반?)은 비공개로 보이며 확인 못 함.
- `HKCU\Software\Classes` 쓰기가 Helium 가상화 대상인지(문서·#99059) 아닌지(로컬 실측)의 충돌은 미해결. Frond 설계상 런타임 연결 쓰기를 하지 않으므로 결정적이지는 않음.
- `MultiSelectModel` 기본값(여러 .md 동시 선택 시 프로세스 1개에 인수 여러 개인지, 파일마다 프로세스인지) 확인 못 함 — single-instance가 어느 쪽이든 흡수하지만 실기 확인 필요.

## 4. AppData 파일 시스템 가상화: 언제 리디렉션되고, 테마 폴더·NSIS 데이터 이전에 무슨 일이 생기나?

### Takeaway
Windows 10 1903 이상에서 패키지 풀 트러스트 앱이 **AppData(Roaming/Local) 루트에 새로 만드는 파일·폴더**는 `%LOCALAPPDATA%\Packages\<PFN>\LocalCache\{Roaming,Local}\…`로 리디렉션되고 앱 안에서만 합쳐 보인다. **이미 실제로 있는 하위 폴더 안의 쓰기(새 파일 포함)는 실제 경로로 간다**(2026 실측 2건). 새로 설치한 MSIX Frond의 `%APPDATA%\Frond`(테마·초안·이미지)는 가상 쪽에 생기므로 탐색기에서 "테마 폴더 열기"가 실패하거나 빈 경로를 보이고, 앱 제거 시 함께 지워진다. 대응은 실제 경로 해석(canonicalize)·Documents 같은 AppData 밖 폴더로 이동·Win11 전용 ExcludedDirectory(제한 기능) 중 택일.

### Cited Findings
- 공식(1903+): "All newly created files and folders in the user's AppData folder … are written to a private per-user, per-app location; but merged at runtime to appear in the real AppData location." "Modifications to existing files under the user's AppData folder is allowed" — [Learn: Understanding how packaged desktop apps run](https://learn.microsoft.com/en-us/windows/msix/desktop/desktop-to-uwp-behind-the-scenes)
- 공식 표: 리디렉션 대상 디렉터리는 `Local`, `Local\Microsoft`, `Roaming`, `Roaming\Microsoft`, `Roaming\Microsoft\Windows\Start Menu\Programs`. 파일 열기 시 패키지 위치를 먼저 보고 없으면 실제 AppData. "If the file is opened from the real AppData location, then no virtualization for that file occurs." 삭제는 권한 있으면 허용. 1903 미만은 모든 쓰기를 copy-on-write — 같은 문서
- 공식: "When a package is uninstalled … any redirected writes to AppData or the registry … are removed" — 같은 문서
- 공식(flexible virtualization 문서의 기본 동작 표): 1809 초과에서 새 파일·폴더는 private 위치, 기존 파일 수정은 비가상화 파일에 적용, "Files in the virtualized location are visible only to the app", "Apart from AppData, the app can write to any location where the user has write access, including other parts of %userprofile%" — [Learn: Flexible virtualization](https://learn.microsoft.com/en-us/windows/msix/desktop/flexible-virtualization)
- 2026 실측 ①(Win11 Pro 26200, 2026-08-24): "Creating a new entry directly at the %APPDATA% or %LOCALAPPDATA% root — a new file, or a new directory — is silently redirected" → `…\Packages\Claude_pzs8sxrjxfjjc\LocalCache\Roaming\newdir-probe\inner.txt` 등. "Writes inside a subdirectory that already exists in the real filesystem pass through normally, including creating new files there." 우회: 사용자가 폴더를 미리 만들어 두기, 패키지 밖 셸에서 확인 — [anthropics/claude-code#89113](https://github.com/anthropics/claude-code/issues/89113)
- 2026 실측 ②(platformdirs, windows-2025 러너, 2026-09-26 병합): "only new files and folders go to LocalCache\Local, while a file written into a folder that already exists at the real path stays there", 경로가 새/기존 폴더에 따라 달라지므로 `os.path.realpath()` 사용 권고 유지 — [tox-dev/platformdirs#597](https://github.com/tox-dev/platformdirs/pull/597)
- 로컬 실측(2026-10-06, Claude MSIX 컨테이너 안): 앱이 `%APPDATA%\MdEditor`→`%APPDATA%\Frond` 이름 바꾸기를 했을 때 "가상 쪽만 옮겨져 폴더가 둘로 갈렸다". 컨테이너 안에서 `Test-Path`는 성공처럼 보이고 `Get-Item`의 `Target`이 `…\LocalCache\…`이면 가상 — `memory/claude-msix-appdata-virtualization.md`
- opt-out: Windows 11부터 `virtualization:FileSystemWriteVirtualization/ExcludedDirectories/ExcludedDirectory`로 `$(KnownFolder:RoamingAppData)\Fabrikam\Widgets` 같은 AppData 하위만 비가상화 지정 가능(구 OS에서는 무시되고 `desktop6:FileSystemWriteVirtualization=disabled`가 적용). 둘 다 `rescap:Capability Name="unvirtualizedResources"` 필요(1903+) — [Learn: Flexible virtualization](https://learn.microsoft.com/en-us/windows/msix/desktop/flexible-virtualization)
- `unvirtualizedResources`: "designed for certain types of desktop PC games … It is not intended to be used for other scenarios, because it could compromise the system's ability to uninstall cleanly." Store 제출 시 제한 기능 승인 절차 필요 — [Learn: App capability declarations](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/app-capability-declarations)
- 패키징 준비 문서: "After conversion, AppData is redirected to the local app data store, which is a private store for each app." / "Your application writes to the AppData folder or to the registry with the intention of sharing data with another app"를 수정 대상 항목으로 나열 — [MicrosoftDocs/msix-docs: desktop-to-uwp-prepare](https://github.com/microsoftdocs/msix-docs/blob/main/msix-src/desktop/desktop-to-uwp-prepare.md)
- Frond 데이터 위치: `appdata.rs` `root()` = `app.path().data_dir()`(= `%APPDATA%`) + `Frond`; 테마 `%APPDATA%\Frond\themes\<id>.json`; `open_themes_folder`는 그 경로 문자열을 `ShellExecuteW`로 탐색기에 넘김; WebView2 데이터·localStorage(`mdeditor.*`)는 identifier `com.cykim.mdeditor` 기반 — `src-tauri/src/appdata.rs`, `src-tauri/src/themes.rs`, `CLAUDE.md`

### Inferences
- **새 MSIX 설치(옛 NSIS 데이터 없음)**: `%APPDATA%\Frond`가 AppData 루트의 새 항목이라 `LocalCache\Roaming\Frond`로 간다. 앱 자체(테마 목록·저장·초안)는 합쳐진 보기로 정상 동작한다. 그러나 `open_themes_folder`가 넘긴 `C:\Users\<u>\AppData\Roaming\Frond\themes`는 패키지 밖 프로세스인 탐색기에게 존재하지 않는 경로 → 실패 또는 오류. 사용자가 탐색기로 직접 `%APPDATA%`를 열어도 Frond 폴더가 안 보여 "테마 CSS를 넣어 두라"는 안내가 깨진다.
- **대응 후보** (권장 순):
  1. 탐색기에 넘기기 전에 `std::fs::canonicalize`(내부적으로 `GetFinalPathNameByHandleW`, Python `realpath`와 같은 계열)로 실제 `LocalCache` 경로를 얻어 넘긴다. platformdirs가 realpath를 권하는 근거와 같음. UI에 실제 경로를 표시. 앱 제거 시 사용자 테마가 지워진다는 점은 남는다.
  2. 사용자가 손대는 폴더(테마)를 `Documents\Frond\themes`처럼 AppData 밖으로 옮긴다 — 문서상 AppData 밖은 비가상화. 제거 후에도 남는다.
  3. `ExcludedDirectory $(KnownFolder:RoamingAppData)\Frond` + `unvirtualizedResources` — Win11 전용(개발기 Win10은 all-or-nothing `desktop6`으로 떨어짐), Store 승인 가능성 낮음(문서가 게임·외부 위치 패키지용으로 한정).
- **NSIS → MSIX 이전**: NSIS 시절의 실제 `%APPDATA%\Frond`가 있으면 그 "기존 하위 폴더" 안의 쓰기는 실제 경로로 가므로 두 설치가 데이터를 공유하고, MSIX 제거 시에도 지워지지 않는다(유리). `%APPDATA%\MdEditor`만 있고 `Frond`가 없으면 `appdata.rs`의 rename이 루트에 새 항목을 만드는 셈이라 가상 쪽만 옮겨져 둘로 갈린다(로컬 실측과 같은 패턴) → 패키지 실행 시에는 rename 대신 "옛 폴더를 그대로 계속 쓰기" 또는 실제 경로 확인 후 복사가 안전하다.
- **WebView2 데이터·localStorage**도 `%LOCALAPPDATA%\com.cykim.mdeditor`가 새 항목이면 가상화된다 → NSIS판과 MSIX판의 설정·탭 세션이 따로 논다(기존 폴더가 있으면 공유). Frond 설정이 localStorage에 있으므로 "업그레이드했더니 설정이 초기화" 현상이 날 수 있다.
- **초안 백업**이 LocalCache에 있으면 앱 제거와 함께 사라진다 — 제거 전 경고·내보내기 고려.

### Gaps
- 리디렉션 기준이 "AppData 루트(및 표의 5개 디렉터리) 바로 아래 새 항목"인지, 깊은 새 하위 폴더 전체인지 공식 문서 표현이 모호하다(실측 2건은 "루트의 새 항목만"). 
- Tauri가 WebView2 user data folder를 정확히 어디에 두는지(identifier 폴더 아래 `EBWebView`)는 Tauri 1차 문서로 확인하지 않음(CLAUDE.md 기재 기준).
- 패키지 밖 탐색기가 `ShellExecute`로 받은 가상 경로를 어떻게 처리하는지(오류 대화상자 vs 다른 폴더) 실측 없음.

## 5. 밖에서 실행하기: 실행 별칭·argv·single-instance·AI 훅 스크립트는?

### Takeaway
패키지 exe는 `C:\Program Files\WindowsApps`(사용자 접근 차단·읽기 전용)에 있으므로 외부 스크립트는 **`uap3:AppExecutionAlias`**로 노출된 `%LOCALAPPDATA%\Microsoft\WindowsApps\mdeditor.exe`(0바이트 reparse point, PATH에 포함)를 실행해야 한다. 이 경로로 띄우면 패키지 활성화 토큰이 붙어 Frond 자신의 identity로 돈다. 현재 훅 스크립트(`MdEditor.Markdown\shell\open\command` → `%LOCALAPPDATA%\Frond\mdeditor.exe` 폴백)는 MSIX 단독 설치에서 exe를 못 찾는다. single-instance 플러그인(이름 붙은 mutex + FindWindow + WM_COPYDATA)은 BNO 격리가 opt-in이라 패키지에서도 동작할 것으로 보이며, NSIS판과 동시 설치 시 서로에게 인수를 넘길 수 있다.

### Cited Findings
- 설치 위치: 기본 `C:\Program Files\WindowsApps\<package_full_name>`; 배포 후 파일은 읽기 전용이고 변조 시 실행 차단. "Writes to files/folders in the app package aren't allowed." — [Learn: Understanding how packaged desktop apps run](https://learn.microsoft.com/en-us/windows/msix/desktop/desktop-to-uwp-behind-the-scenes)
- WindowsApps 폴더는 관리자라도 열람 시 접근 거부 — [Microsoft Q&A: Access to WindowsApps](https://learn.microsoft.com/en-us/answers/questions/3866113/access-to-c-program-fileswindowsapps)
- 실행 별칭 XML: `<uap3:Extension Category="windows.appExecutionAlias" EntryPoint="Windows.FullTrustApplication"><uap3:AppExecutionAlias><desktop:ExecutionAlias Alias="contosoapp.exe" /></uap3:AppExecutionAlias></uap3:Extension>`. 사용자는 설정의 "App execution aliases" 페이지에서 별칭을 끌 수 있음 — [Learn: desktop-to-uwp-extensions](https://learn.microsoft.com/en-us/windows/apps/desktop/modernize/desktop-to-uwp-extensions)
- 같은 문서: Insider 21313+에서 IFEO `AppExecutionAliasRedirect=1`/`AppExecutionAliasRedirectPackages=<PFN>`로 **비패키지 exe 실행을 패키지 앱으로 리디렉션**하는 기능(HKLM 쓰기 필요) — [Learn: desktop-to-uwp-extensions](https://learn.microsoft.com/en-us/windows/apps/desktop/modernize/desktop-to-uwp-extensions)
- 별칭 동작: `%LOCALAPPDATA%\Microsoft\WindowsApps`의 0바이트 파일, reparse tag `IO_REPARSE_TAG_APPEXECLINK`(0x8000001B)에 Package ID·Entry Point·Executable 저장. `CreateProcess`가 `STATUS_IO_REPARSE_TAG_NOT_HANDLED`로 실패하면 `LoadAppExecutionAliasInfoEx`로 정보를 읽고 AppInfo 서비스 `RAiGetPackageActivationToken`으로 활성화 토큰을 받아 실행. 명령줄 인수 전달 가능("as if it was a command line application") — [Tyranid's Lair: Overview of Windows Execution Aliases](https://www.tiraniddo.dev/2019/09/overview-of-windows-execution-aliases.html)
- tauri-windows-bundle는 `extension add app-execution-alias` 지원 — [Choochmeque/tauri-windows-bundle](https://github.com/Choochmeque/tauri-windows-bundle)
- single-instance 플러그인(Windows 구현): `CreateMutexW(…, "{id}-sim")`, `ERROR_ALREADY_EXISTS`면 두 번째 인스턴스. `FindWindowW("{id}-sic", "{id}-siw")`로 첫 창을 찾아 `WM_COPYDATA`(dwData 1542)로 `"{cwd}|{args}"` 전달 — [plugins-workspace single-instance windows.rs](https://github.com/tauri-apps/plugins-workspace/blob/v2/plugins/single-instance/src/platform_impl/windows.rs)
- single-instance v2.4.5: 두 번째 인스턴스가 종료 전 첫 인스턴스가 창을 앞으로 가져오도록 허용 — [release single-instance-v2.4.5](https://github.com/tauri-apps/plugins-workspace/releases/tag/single-instance-v2.4.5). 문서: snap/flatpak 샌드박스에서는 기본으로 의도대로 동작 안 함(MSIX 언급 없음) — [v2.tauri.app/plugin/single-instance](https://v2.tauri.app/plugin/single-instance/)
- `uap16/uap17:BaseNamedObjectsIsolation`(none|package)은 선택 속성 — [Learn: Application element](https://learn.microsoft.com/en-us/uwp/schemas/appxpackage/uapmanifestschema/element-application)
- 작업 디렉터리: "your packaged desktop application won't get the same working directory that you previously specified in your desktop .LNK shortcut"; PowerShell·cmd 같은 유틸리티 실행은 피하라고 권고 — [msix-docs: desktop-to-uwp-prepare](https://github.com/microsoftdocs/msix-docs/blob/main/msix-src/desktop/desktop-to-uwp-prepare.md)
- 훅 스크립트 현재 동작: `HKCU:\Software\Classes\MdEditor.Markdown\shell\open\command`에서 exe 경로를 꺼내고 없으면 `%LOCALAPPDATA%\Frond\mdeditor.exe`; `--from-hook=<claude|codex>`와 경로를 붙여 `Invoke-CimMethod Win32_Process Create`(실패 시 `Start-Process`)로 실행 — `integrations/open-new-md.ps1`
- MS Q&A의 대안: ProgId 명령에 `explorer.exe shell:AppsFolder\<PFN>!<AppId>` — [Microsoft Q&A 1346579](https://learn.microsoft.com/en-us/answers/questions/1346579/how-can-i-associate-file-types-with-a-storeapp-usi) (인수 전달 불가, 참고만)

### Inferences
- **훅 스크립트 수정안**: `Get-MdEditorExe`에 ① `"$env:LOCALAPPDATA\Microsoft\WindowsApps\mdeditor.exe"` 존재 확인(별칭) → ② 기존 ProgId 명령 → ③ NSIS 기본 경로 순으로 찾는다. 별칭은 0바이트 reparse 파일이라 `Test-Path -PathType Leaf`가 참이어야 하지만 실기 확인 필요. `explorer shell:AppsFolder`는 인수를 못 넘겨 `--from-hook`가 불가능하다.
- 별칭으로 띄운 Frond는 활성화 토큰으로 **Frond 패키지 identity**를 갖는다 → 지금 Claude 데스크톱(MSIX) 안에서 훅이 앱을 새로 띄울 때 생기던 "Claude 패키지 LocalCache로 테마·초안이 새는" 문제(WMI 우회의 이유)는 Frond가 MSIX일 때는 사라질 가능성이 크다. 다만 그 Frond의 AppData 쓰기는 이번엔 Frond 자신의 LocalCache로 간다(4절).
- **single-instance**: 기본은 BNO 격리 없음 → 같은 세션의 패키지 인스턴스끼리 mutex·창 클래스를 공유하므로 기존처럼 동작할 것. 두 인스턴스 모두 mediumIL이라 UIPI도 막지 않음. NSIS판과 MSIX판이 같은 identifier(`com.cykim.mdeditor`)를 쓰면 서로를 "첫 인스턴스"로 인식해 한쪽이 다른 쪽으로 인수를 넘기고 종료한다 → 이전 기간 동안 의도치 않은 쪽 창이 열릴 수 있다. `uap16:BaseNamedObjectsIsolation="package"`를 켜면 플러그인이 깨질 수 있으니 켜지 않는다.
- 탐색기 더블클릭(FTA)은 경로가 절대 경로라 cwd 차이 영향이 없다. 별칭을 터미널에서 상대 경로로 부를 때 `paths_from_args`가 쓰는 `current_dir`가 호출자 cwd인지 확인 필요.

### Gaps
- `C:\Program Files\WindowsApps\…\mdeditor.exe`를 전체 경로로 직접 `CreateProcess`하면 실행되는지·identity를 갖는지(2026 Win10/11) 1차 출처를 찾지 못함 — 별칭 사용이 안전한 기본값.
- WMI `Win32_Process.Create`로 별칭(reparse point)을 실행했을 때의 동작 실측 없음.
- 별칭으로 실행 시 작업 디렉터리 상속 여부 확인 못 함.

## 6. 업데이트: Store 관리 업데이트 vs Tauri updater, 사이드로드용 App Installer

### Takeaway
MSIX 설치 폴더는 읽기 전용이라 Tauri updater(NSIS/MSI를 내려받아 실행)는 패키지 설치를 갱신할 수 없고, 실행하면 별도의 비패키지 사본을 깔게 된다 → MSIX 빌드에서는 updater를 넣지 않는다(Frond는 현재 updater 없음). Store판은 Store가 갱신하고, 사이드로드판은 `.appinstaller` 파일의 `UpdateSettings`(OnLaunch, HoursBetweenUpdateChecks 0–255, 기본 24)로 자동 갱신한다. 2023-12-28부터 `ms-appinstaller:` 웹 설치 프로토콜이 기본 비활성이라 사용자는 파일을 먼저 내려받아야 한다.

### Cited Findings
- 패키지 내부 쓰기 불가, 패키지 파일 변조 시 실행 차단 — [Learn: Understanding how packaged desktop apps run](https://learn.microsoft.com/en-us/windows/msix/desktop/desktop-to-uwp-behind-the-scenes)
- 같은 패키지 업데이트는 manifest `Version`이 더 높아야 함 — [Learn: winapp Tauri guide](https://learn.microsoft.com/en-us/windows/apps/dev-tools/winapp-cli/guides/tauri)
- Tauri Store 문서는 EXE/MSI 링크 방식에 대해 앱이 updater 플러그인 등으로 업데이트를 직접 처리하라고 안내(MSIX 경로는 다루지 않음) — [v2.tauri.app/distribute/microsoft-store](https://v2.tauri.app/distribute/microsoft-store/)
- `.appinstaller`: 서버에 MSIX와 함께 두는 XML. `UpdateSettings` 아래 `OnLaunch`, `HoursBetweenUpdateChecks`(0–255, 기본 24), `ShowPrompt`·`UpdateBlocksActivation`은 2021 스키마 필요 — [Advanced Installer: App Installer file](https://www.advancedinstaller.com/application-packaging-training/msix-packaging/ebook/app-installer-file.html), [Learn: update settings](https://learn.microsoft.com/en-us/windows/msix/app-installer/update-settings)
- MSRC: App Installer 1.21.3421.0+에서 `ms-appinstaller` URI 처리기를 기본 비활성(2023-12-28), 다운로드 후 실행하도록 강제. 관리자는 정책 `EnableMSAppInstallerProtocol`로 재활성 가능 — [MSRC blog](https://www.microsoft.com/en-us/msrc/blog/2023/12/microsoft-addresses-app-installer-abuse), [Learn: Installing Windows apps from a web page](https://learn.microsoft.com/en-us/windows/msix/app-installer/installing-windows10-apps-web)

### Inferences
- Store판·사이드로드판 모두 빌드 구성에서 updater 플러그인을 빼고, 앱 안의 "업데이트 확인" UI가 생기면 `Package::Current()`로 패키지 여부를 보고 숨긴다.
- NSIS판 updater를 나중에 붙이면, 그 updater가 MSIX 사용자에게 NSIS 설치기를 내려 주지 않도록 패키지 실행 시 비활성화해야 한다(병행 배포 시).

### Gaps
- `.appinstaller`의 정확한 XML 예시(`MainPackage Uri`, `UpdateSettings` 스키마 2021)는 1차 문서 본문을 가져오지 않음.
- Store의 "앱 스스로 업데이트 금지" 정책 문구는 범위 밖(Store 정책 조사자 몫).

## 7. WebView2 의존성: MSIX에서 Evergreen 런타임이 보장되나?

### Takeaway
보장되지 않는다. Windows 11에는 Evergreen 런타임이 OS에 포함되고 Windows 10도 "대다수"에 있지만 일부 기기에는 없다. MSIX는 설치 중 부트스트래퍼를 실행할 수 없고, manifest의 `win32dependencies:ExternalDependency Name="Microsoft.WebView2"`는 **App Installer로 설치할 때만** 적용된다(PowerShell·PackageManager·Intune 등 다른 경로는 무시). 따라서 앱 시작 시 런타임 존재를 검사하고 없으면 안내하는 코드가 필요하다. 지금의 `webviewInstallMode: downloadBootstrapper`는 NSIS 전용이라 MSIX에 효과가 없다.

### Cited Findings
- "The Evergreen WebView2 Runtime will be included as part of the Windows 11 operating system … some devices might not have the Runtime pre-installed, so it's a good practice to check whether the Runtime is present" — [Learn: Distribute your app and the WebView2 Runtime](https://learn.microsoft.com/en-us/microsoft-edge/webview2/concepts/distribution) (updated_at 2026-10-02)
- "The vast majority of Windows 10 devices have the WebView2 Runtime installed already … A small number of Windows 10 devices don't" → 프로그램으로 배포하거나 다운로드 페이지로 안내 — 같은 문서
- 감지 방법: 레지스트리 `pv`(HKLM `SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}` / HKCU 동일 경로), 또는 `GetAvailableCoreWebView2BrowserVersionString`이 nullptr인지 — 같은 문서
- "If you're using App Installer to deploy MSIX applications, you can specify the WebView2 Runtime as a dependency" — 같은 문서
- `win32dependencies:ExternalDependency`: "applies only to installs that use the Microsoft App Installer app. If a package is installed using any other mechanism, such as the PackageManager API, or a Powershell cmdlet, or Microsoft Intune … is ignored." makeappx는 검증하지 않음. App Installer 1.16.12651.0+ 필요. 허용 목록은 WebView2 하나: `Name="Microsoft.WebView2" Publisher="CN=Microsoft Windows, O=Microsoft Corporation, L=Redmond, S=Washington, C=US" MinVersion="…" Optional="true|false"` — [Learn: win32dependencies:ExternalDependency](https://learn.microsoft.com/en-us/uwp/schemas/appxpackage/uapmanifestschema/element-win32dependencies-externaldependency)
- Fixed Version 런타임(250MB+)을 패키지에 넣는 방법도 있으며, Win10의 v120+ ACL(`icacls … S-1-15-2-1/2`) 요구는 "doesn't affect … packaged apps" — [Learn: WebView2 distribution](https://learn.microsoft.com/en-us/microsoft-edge/webview2/concepts/distribution)
- Tauri `webviewInstallMode`는 설치기(NSIS/MSI) 옵션이며 Store용 EXE/MSI는 `offlineInstaller` 요구 — [v2.tauri.app/distribute/microsoft-store](https://v2.tauri.app/distribute/microsoft-store/), 로컬 `tauri.conf.json`(`downloadBootstrapper`, `minimumWebview2Version: 150.0.0.0`)

### Inferences
- Store 설치는 App Installer 앱 경로가 아니므로 ExternalDependency가 무시될 가능성이 높다(문서 문구 기준). 사이드로드 `.msix`를 더블클릭(App Installer)으로 설치할 때만 체인 설치된다.
- Frond는 `minimumWebview2Version 150`을 NSIS에서 강제하고 있으므로, MSIX판에서는 시작 시 `pv` 레지스트리(또는 WebView2 로더 API)로 버전을 검사해 미달·부재 시 네이티브 메시지 박스로 다운로드 페이지를 안내하는 코드를 Rust 쪽에 넣는 것이 대응이다. Win11 대상이면 실질 위험은 낮다.

### Gaps
- Tauri(wry) 런타임이 WebView2 부재 시 어떤 오류를 내는지, `minimumWebview2Version`을 런타임에서 검사하는지 확인 못 함.
- Store 설치 경로가 ExternalDependency를 처리하는지 명시한 문서는 찾지 못함(위는 문구 기반 추론).

## 8. Store 밖 사이드로드에는 무엇이 필요한가? (서명)

### Takeaway
MSIX는 반드시 서명돼야 설치된다. 사이드로드는 사용자 기기가 신뢰하는 인증서로 서명해야 하고, 자체 서명 인증서면 사용자가 관리자 권한으로 인증서를 신뢰 저장소에 먼저 설치해야 한다. manifest `Publisher`는 서명 인증서 Subject와 정확히 같아야 한다. Store 제출본은 Store가 서명한다.

### Cited Findings
- "MSIX packages must be signed. For local testing, generate a self-signed development certificate" (`winapp cert generate`), "The certificate's publisher must match the Publisher in your Package.appxmanifest", 설치 전 관리자 권한으로 `winapp cert install .\devcert.pfx`, "sign your MSIX with a code signing certificate from a Certificate Authority so your users don't have to install a self-signed certificate", "The Microsoft Store will sign the MSIX for you" — [Learn: winapp Tauri guide](https://learn.microsoft.com/en-us/windows/apps/dev-tools/winapp-cli/guides/tauri)
- 사이드로드 시 publisher 이름은 서명 인증서 이름과 일치해야 함 — [Learn: Generating MSIX package components](https://learn.microsoft.com/en-us/windows/msix/desktop/desktop-to-uwp-manual-conversion)
- winapp `az-sign`(Azure Trusted Signing), tauri-windows-bundle의 PFX/thumbprint 서명 — [microsoft/winappCli](https://github.com/microsoft/winappCli), [Choochmeque/tauri-windows-bundle](https://github.com/Choochmeque/tauri-windows-bundle)
- 제한 기능(runFullTrust 등)은 사이드로드에 승인 불필요 — [Learn: App capability declarations](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/app-capability-declarations)

### Inferences
- Store 패키지와 사이드로드 패키지는 Publisher(CN)가 달라 PFN이 달라진다 → 두 판은 서로 다른 앱으로 설치되고 데이터(LocalCache)·AUMID·FTA ProgId도 따로다. 한쪽만 배포하는 편이 단순하다.

### Gaps
- Windows 10/11의 사이드로드 기본 허용 정책(개발자 모드 불필요 여부)은 이번에 1차 출처로 확인하지 않음.

## 9. 실제 Tauri→MSIX 사례와 파이프라인은?

### Takeaway
2025–2026년 공개 사례는 대부분 **tauri-windows-bundle** 기반이다(템플릿 abusayed0206/tauri, 실제 앱 esoltys/luminous). Microsoft winapp 저장소에도 공식 Tauri 샘플이 있다.

### Cited Findings
- abusayed0206/tauri: "Tauri v2 Windows MSIX template — x64 only, NSIS + Store-ready MSIX, CI/CD, Dependabot". `@choochmeque/tauri-windows-bundle`로 `npm run msix:build`; manifest 템플릿 `src-tauri/gen/windows/AppxManifest.xml.template`(`{{PUBLISHER}}`, `{{VERSION}}`, `{{PACKAGE_NAME}}`, `{{EXECUTABLE}}` 치환); `ci.yml`(타입·lint·빌드), `release.yml`(`v*` 태그 → 미서명 NSIS .exe + x64 MSIX bundle → GitHub Release); Store 제출 시 Partner Center의 Publisher CN·Package Name을 `bundle.config.json`과 `tauri.conf.json` `identifier`·`bundle.publisher`에 맞추고 미서명 업로드(Store가 재서명) — [abusayed0206/tauri](https://github.com/abusayed0206/tauri)
- esoltys/luminous `release.yml`: `run: bun run tauri:windows:build`(tauri-windows-bundle, `--runner bun`), `CARGO_TARGET_DIR: ${{ github.workspace }}/target`, 산출물 `target/msix/*.msix`, `target/msix/*.msixbundle`을 Release에 업로드. Store 제출 단계는 없음 — [esoltys/luminous release.yml](https://github.com/esoltys/luminous/blob/main/.github/workflows/release.yml)
- 같은 프로젝트 PR #1262(2026-09-27): `cargo install tauri-cli --version 2.11.4`가 `--locked` 없이 새 tauri-bundler(2.10+, `WindowsSettings.bundle_vc_runtime` 필드 추가)를 끌어와 Windows MSIX 빌드가 깨짐 → `--locked`로 고정 — [esoltys/luminous#1262](https://github.com/esoltys/luminous/pull/1262), 후속 [#1264](https://github.com/esoltys/luminous/pull/1264)
- Microsoft 공식 샘플: [microsoft/winappCli samples/tauri-app](https://github.com/microsoft/winappCli/blob/main/samples/tauri-app/README.md)
- 계획 단계 이슈(본문 미확인): [pountzas/reach-Panel#176](https://github.com/pountzas/reach-Panel/issues/176), [o2csi/candeo#126](https://github.com/o2csi/candeo/issues/126)

### Inferences
- luminous 사례가 보여 주듯 tauri-windows-bundle은 tauri-cli/bundler 버전에 민감하다 → Frond에서 쓰면 tauri-cli를 lockfile로 고정하고 tauri 업그레이드 때 MSIX 빌드를 함께 확인한다.

### Gaps
- 파일 연결·실행 별칭까지 쓰는 Tauri MSIX 공개 사례(그리고 그 manifest 실물)는 찾지 못함.

## 10. Frond 기능별로 무엇이 깨지고 어떻게 대응하나? (요약 표)

### Takeaway
MSIX로 가면 "설치기가 레지스트리를 쓰고 앱은 읽는다"는 현재 구조가 "manifest가 선언하고 앱은 패키지 여부로 분기한다"로 바뀐다. 코드 수정이 필요한 곳은 `assoc.rs`(3곳), `appdata.rs`(이름 바꾸기 이전), `themes.rs`(폴더 열기 경로), 훅 스크립트(exe 찾기), WebView2 부재 검사다. 폴더 감시·임의 경로 읽기/쓰기·관리자 감지는 풀 트러스트라 대체로 그대로다.

### Cited Findings
- 풀 트러스트(mediumIL) 앱은 AppContainer가 아니며, AppData 밖은 사용자 권한대로 쓰기 가능 — [Learn: App capability declarations](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/app-capability-declarations), [Learn: Flexible virtualization](https://learn.microsoft.com/en-us/windows/msix/desktop/flexible-virtualization)
- 패키지 앱은 항상 대화형 사용자로 실행; "Your application always runs with elevated security privileges"는 수정 대상; HKLM 키 생성은 access denied; 자동 상승은 `allowElevation` 제한 기능(Store 승인 엄격) — [Learn: manual conversion](https://learn.microsoft.com/en-us/windows/msix/desktop/desktop-to-uwp-manual-conversion), [msix-docs: prepare](https://github.com/microsoftdocs/msix-docs/blob/main/msix-src/desktop/desktop-to-uwp-prepare.md), [Learn: App capability declarations](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/app-capability-declarations)
- 패키지 identity 확인 방법: `windows::ApplicationModel::Package::Current()` → `Id().FamilyName()`, 실패 시 "No package identity" — [Learn: winapp Tauri guide](https://learn.microsoft.com/en-us/windows/apps/dev-tools/winapp-cli/guides/tauri)

| Frond 기능 (로컬 파일) | MSIX에서의 변화 | 대응 |
|---|---|---|
| 파일 연결 등록 (`hooks.nsh`) | 훅 미실행. 패키지 FTA는 `AppX…` ProgId로 자동 등록, Default Apps 자동 노출 | manifest `uap:FileTypeAssociation`(md 등 6개) + `rescap3:MigrationProgId MdEditor.Markdown` |
| 기본 앱 설정 열기 (`assoc.rs` `open_default_apps_settings`) | `registeredAppUser=Frond` 대상 없음 | 패키지면 `registeredAUMID=<PFN>!Frond`, `MaxVersionTested` ≥ 22621.1555 |
| 기본 앱 여부 (`query_default_app`) | 반환값이 `AppX…`라 `MdEditor.Markdown` 비교 실패 | 패키지면 자기 ProgId/AUMID와 비교(키 구조 실기 확인) |
| 등록 여부 (`is_registered`) | `RegisteredApplications\Frond` 없음 → 항상 false | 패키지면 true로 간주 |
| 데이터 폴더 (`appdata.rs`, `%APPDATA%\Frond`) | 새 설치면 `LocalCache\Roaming\Frond`로 가상화, 제거 시 삭제. 기존 실제 폴더면 공유 | 패키지면 MdEditor→Frond rename 생략·실제 경로 확인, 제거 시 초안 손실 안내 |
| 테마 폴더 열기 (`themes.rs` `open_themes_folder`) | 탐색기는 가상 경로를 못 봄 | `canonicalize`한 실제 경로를 넘기거나 테마를 Documents로 이동 |
| 설정·세션 (localStorage, WebView2 데이터) | `%LOCALAPPDATA%\com.cykim.mdeditor` 새 항목이면 가상화 → NSIS판과 분리 | 이전 시 설정 초기화 가능성 안내 또는 내보내기/가져오기 |
| single-instance (`lib.rs`) | BNO 격리 기본 없음 → 동작 예상. NSIS판과 동시 설치 시 교차 전달 | 격리 옵션 켜지 않음, 병행 기간 짧게 |
| AI 훅 (`open-new-md.ps1`) | ProgId 명령·`%LOCALAPPDATA%\Frond` 경로 없음 → exe 못 찾음 | 실행 별칭 `mdeditor.exe` 추가, 스크립트가 `%LOCALAPPDATA%\Microsoft\WindowsApps\mdeditor.exe` 우선 사용 |
| 관리자 감지 (`elevation.rs`) | 대화형 사용자로 실행이 기본 → 경고 거의 안 뜸 | 그대로(무해) |
| 폴더 트리 감시·임의 경로 저장 | 풀 트러스트라 그대로 | 그대로 (AppData 루트 새 항목만 예외) |
| WebView2 (`webviewInstallMode`) | MSIX에 부트스트래퍼 없음 | 시작 시 `pv`/API 검사 후 안내, 사이드로드는 ExternalDependency(App Installer 한정) |
| 업데이트 (현재 없음) | 설치 폴더 읽기 전용 | updater 넣지 않음, Store 또는 `.appinstaller` |

### Inferences
- 패키지 여부 분기(`Package::Current()` 성공 여부)를 Rust에 한 곳 만들어 `assoc.rs`·`appdata.rs`·`themes.rs`가 공유하면 NSIS판과 MSIX판을 한 코드베이스로 유지할 수 있다.
- 가장 큰 사용자 체감 변화는 "테마 폴더가 탐색기에서 안 보임"과 "앱 제거 시 초안·테마가 함께 삭제"다. 테마 폴더를 AppData 밖으로 옮기는 결정이 나머지를 단순하게 만든다.

### Gaps
- 패키지 앱을 "관리자 권한으로 실행"할 수 있는지(allowElevation 없이) 확인 못 함.
- 위 표의 "예상" 항목(single-instance, 별칭 Test-Path, canonicalize 결과, HKCR AppX 키 구조)은 Win10 19045·Win11 실기 검증이 필요하다.
