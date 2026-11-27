# Frond의 앱 안 업데이트는 「조용히 받아 두고, 누를 때 재시작」이 맞고, 위험은 Windows 설치 단계의 강제 종료에 있다

조사일 2026-11-27. 조사 범위: 데스크톱 앱 12종의 업데이트 UX, Tauri 2 updater 구조(공식 문서 + `plugins-workspace` v2 소스), MSIX·Scoop·winget 길.
겹치지 않게 한 것: 채널 선택·서명 비용·winget 제출·MSIX 구조 변경은 [`Frond 윈도우 앱 배포 방법`](Frond%20윈도우%20앱%20배포%20방법.md)(2026-10-06)에 이미 있다. 여기서는 **앱 안 업데이트 흐름과 UX**만 다룬다.
확정한 설계는 결정 기록 [`20261127-app-update`](../../decisions/ideas/20261127-app-update.md)에 있다. 이 보고서의 ⑦ 추천안과 다르게 정한 점(세션 인계 파일, 새 '업데이트' 설정 탭, `tauri-plugin-process` 안 씀, 7일 한 단계 강조, 문구 말투)은 그 기록의 「Modified approach」에 이유와 함께 적었다.
표기: 〔확인〕 공식 문서·소스로 확인, 〔보고〕 포럼·제3자 글, 〔추론〕 근거에서 끌어낸 판단.

---

## ① 요약 (보고용 5줄)

1. 요즘 데스크톱 앱의 주류는 **「조용히 확인 → 백그라운드로 받기 → 눈에 덜 띄는 표시(배지·제목 표시줄 버튼) → 사용자가 고른 때 재시작」**이다(VS Code·Chrome·Zed·Slack·Obsidian). 시작 때 막아서는 강제 업데이트(Discord)나 모달 대화상자(Joplin·MarkText)는 불만이 가장 많다.
2. Tauri 2 updater는 `check()`·`download()`·`install()`을 따로 부를 수 있고 진행률 이벤트를 준다. 그래서 「받아 두고 → 나중에 재시작」 UX를 만들 수 있다. 다만 Windows에서는 `install()`이 NSIS를 띄운 뒤 **`std::process::exit(0)`로 앱을 바로 끈다**(소스 확인). 닫기 핸들러가 돌지 않으므로 **저장·초안·세션 보존은 `install()` 전에 앱이 직접 끝내야 한다**.
3. NSIS `passive` + `currentUser` 설치는 UAC 없이 작은 진행 창만 띄우고, 기본값 `/R`로 **설치 뒤 앱을 다시 띄운다**. 받은 파일은 updater가 직접 HTTP로 받아 임시 폴더에 두므로 MOTW가 붙지 않을 가능성이 높다〔추론, 실기 확인 필요〕.
4. Store(MSIX)판은 OS가 업데이트한다. 앱은 `StoreContext`로 「업데이트 있음」만 알려 줄 수 있다. Scoop판에서는 updater를 끄고 `scoop update frond`를 안내한다. winget(NSIS 설치본)은 앱 안 updater와 함께 써도 된다.
5. **Frond 추천**: NSIS판(Installed)만 켠다. 시작 10초 뒤 + 6시간마다 확인하고, 자동으로 받는다. 제목 표시줄 오른쪽에 작은 「업데이트」 알약을 띄우고, 누르면 확인 팝업 → 저장 안 한 문서 확인 → 세션·초안 저장 → 설치·재시작으로 간다. 「나중에」「이 버전 건너뛰기」와 설정 「업데이트 자동 확인」 끄기도 둔다.

---

## ② 앱별 비교 표

| 앱 | 확인·받기 | 알림 위치 | 재시작·적용 | 끄기·건너뛰기 | 출처 |
|---|---|---|---|---|---|
| **VS Code** | 주기 확인 + 백그라운드 다운로드(Windows) | 왼쪽 아래 **설정 톱니에 배지**. 메뉴 안 「Restart to Update」 | 사용자가 누를 때 재시작. 1.52에서는 재시작 없이 끄기만 하는 버그가 있었다 | `update.mode`: `none`·`manual`·`start`(시작 때만)·`default`. 기업 정책 `UpdateMode` | 〔확인〕[FAQ](https://code.visualstudio.com/docs/supporting/faq) · [Enterprise updates](https://code.visualstudio.com/docs/enterprise/updates) · [1.52 노트](https://code.visualstudio.com/updates/v1_52) |
| **Chrome** | 백그라운드 자동 받기 | 오른쪽 위 메뉴 자리에 **「업데이트」 버튼. 2일 초록 → 4일 주황 → 7일 빨강** | 「다시 시작」을 눌러야 적용. 탭은 복원된다 | 사용자 끄기 없음(정책만) | 〔보고〕[9to5Google](https://9to5google.com/2022/02/21/everything-you-need-to-know-about-updating-google-chrome-for-desktop/) · [U-M Safe Computing](https://safecomputing.umich.edu/security-alerts/check-chrome-pending-updates) |
| **Edge** | 백그라운드 자동 | 메뉴 표시 + 반복 알림. 기간의 2/3가 지나면 색이 바뀐다 | 「유휴 때 다시 시작」 선택 기능(기본 꺼짐). 이때 저장 안 한 작업을 잃을 수 있다고 안내한다 | 정책 `RelaunchNotification`(권장/필수)·`RelaunchNotificationPeriod` | 〔확인〕[RelaunchNotification](https://learn.microsoft.com/en-my/deployEdge/microsoft-edge-policies/relaunchnotification) · [유휴 때 업데이트](https://support.microsoft.com/en-gb/edge/automatically-update-microsoft-edge-when-your-device-is-idle) |
| **Slack** | 자동 받기 | **도움말(?) 아이콘에 배지** → 업데이트 카드 | 카드의 「Restart Slack」을 누를 때. Store판은 Store가, 조직 배포판(MSQ)은 조직이 관리 | 설치 방식별로 길이 나뉜다 | 〔확인〕[Slack Help](https://slack.com/help/articles/360048367814-Update-the-Slack-desktop-app) |
| **Discord** | **시작할 때마다 확인하고 받아야 열린다** + 실행 중 받기 | 실행 중에는 검색창 옆 **초록 다운로드 아이콘** | 시작 때는 강제. 실행 중에는 아이콘을 누를 때까지 미룰 수 있다 | 끌 수 없다. 「시작 때 대신 백그라운드로」 요청 글이 있다 | 〔보고〕[MakeUseOf](https://www.makeuseof.com/windows-discord-launch-update-startup/) · [Discord 요청 글](https://support.discord.com/hc/sv/community/posts/1500000604881-Please-use-background-updates-instead-of-auto-update-on-start) |
| **Obsidian** | 정기 확인, 자동 받기(설정) | 설정 → 일반의 「업데이트 확인」이 **「Relaunch」로 바뀐다** | 재시작 때 적용. **앱(asar)과 설치기(Electron)를 따로 갱신**한다. 설치기 갱신이 필요하면 릴리스 노트에서 알리고 설치기를 다시 받게 한다 | 「자동 업데이트」 토글 | 〔확인〕[Obsidian Help: Updates](https://help.obsidian.md/updates) · 〔보고〕[두 버전 번호 Q&A](https://forum.obsidian.md/t/q-a-why-obsidian-has-two-version-numbers/110663) |
| **Zed** | 자동 확인 + 자동 받기 | **제목 표시줄 아바타 옆 업데이트 버튼**(예전엔 상태 표시줄 「Click to restart and update Zed」). 닫을 수 있다 | 누르면 재시작. 안 누르면 **다음 실행 때 설치** | `auto_update: false`. 2025-09에 설정이 없으면 끈 것으로 처리하는 버그가 나 post-mortem을 썼다 | 〔확인〕[Zed Docs: Update](https://zed.dev/docs/update) · [all-settings](https://zed.dev/docs/reference/all-settings) · [제목 표시줄 이동 커밋](https://git.secluded.site/zed/commit/191b4ccd4fce447bf3fb50030b84ee0308af7548) · [Post-Mortem](https://zed.dev/blog/auto-update-post-mortem) |
| **Typora** | 「자동으로 업데이트 확인」 옵션 | 확인 대화상자(상세 미확인) | 설치기 재실행 | 자동 확인 체크박스(0.9.84에서 Windows에서 끌 수 없던 버그 고침). Win7과 새 Windows의 업데이트 채널을 나눈다 | 〔확인〕[What's New 0.9.84](https://support.typora.io/What's-New-0.9.84) |
| **Notion** | 자동(웹 콘텐츠 갱신에 가깝다) | 따로 표시하지 않음. ? → More에 마지막 갱신 시각 | 며칠 안 바뀌면 Ctrl+R 새로 고침. 큰 변경은 **작업 중이 아니라 재시작 때 바뀌고 열린 탭은 그대로** | 없음. 드물게 재설치가 필요하면 앱이 알린다 | 〔확인〕[Notion for desktop](https://www.notion.com/help/notion-for-desktop) · [New tabs](https://www.notion.com/help/new-tabs-in-the-notion-desktop-app) |
| **Figma** | 시작 때 확인 | 시작 때 「업데이트 있음 → Install now」. 오른쪽 위 메뉴 「Check for Updates」는 새 버전이 있을 때만 보인다 | 업데이트마다 새 버전 폴더(`%LOCALAPPDATA%\Figma\app-x.y.z`)가 생긴다. MSI 배포판은 자동 갱신 없음 | — | 〔보고〕[Figma Forum: 매번 업데이트 요청](https://forum.figma.com/ask-the-community-7/figma-keeps-asking-to-update-every-time-i-open-the-app-42889) · [새 버전 폴더](https://forum.figma.com/suggest-a-feature-11/figma-desktop-app-creates-a-new-versioned-folder-on-every-update-breaking-third-party-app-integrations-e-g-logi-options-58888) |
| **Joplin** (OSS) | 시작 때·주기적으로 릴리스 목록 JSON 확인, **받기는 브라우저로** | 모달 대화상자: 「업데이트가 있습니다. 지금 받을까요?」 + 버전·릴리스 노트 | 사용자가 설치기를 직접 실행 | 버튼 **Download · Skip this version · Full changelog · Cancel**. 건너뛴 버전은 KvStore에 저장하고 백그라운드 확인 때만 적용한다. 수동 확인은 건너뛴 버전도 보여 준다 | 〔확인〕[checkForUpdates.ts](https://github.com/laurent22/joplin/blob/dev/packages/app-desktop/checkForUpdates.ts) · 〔보고〕[「Intrusive updates」 글](https://discourse.joplinapp.org/t/intrusive-updates-on-windows/107) |
| **MarkText** (OSS) | 메뉴 「업데이트 확인」을 누를 때만(electron-updater, `autoDownload=false`) | 대화상자 「업데이트를 찾았습니다. 받아서 설치할까요?」 | 받으면 **「곧 종료합니다」 알린 직후 `quitAndInstall()`**. 재시작 시점을 고르지 못한다 | 확인 자체가 수동 | 〔확인〕[menu/actions/marktext.ts](https://github.com/marktext/marktext/blob/develop/packages/desktop/src/main/menu/actions/marktext.ts) |
| **Logseq** (OSS) | 시작 때 자동 확인 + 자동 받기(설정 `:auto-update`가 false가 아니면). **끌 때 자동 설치는 끔**(`autoInstallOnAppQuit=false`) | 렌더러에 `auto-updater-downloaded` 이벤트 → 앱 UI가 표시 | 사용자가 설치를 고르면 `quitAndInstall` | 설정 `auto-update`, 다운그레이드 금지 | 〔확인〕[electron/updater.cljs](https://github.com/logseq/logseq/blob/master/src/electron/electron/updater.cljs) |
| **Windows Terminal** (Store) | Store가 받는다 | 앱 안 표시 없음 | 실행 중이면 **모든 창을 닫고 다시 열어야** 새 버전이 된다. Store에서 직접 갱신하면 실행 중 프로세스를 닫기도 한다. 사용 중 오류 `0x80073D02` | Store 설정 | 〔보고〕[Ed Tittel: WT Update Requires Restart](https://www.edtittel.com/?p=6042) · 〔확인〕[MSIX servicing while in use](https://devblogs.microsoft.com/insidemsix/msix-servicing-while-in-use/) |

---

## ③ UX 패턴과 권장 기본값

| 항목 | 관찰한 선택지 | 권장 기본값(개인 편집기) | 근거 |
|---|---|---|---|
| 확인 시점 | 시작 때만(VS Code `start`)·시작 + 주기(대부분)·수동만(MarkText) | **시작 10~30초 뒤 1회 + 몇 시간마다**. 시작 직후는 피한다(첫 화면·문서 열기와 경쟁) | 시작 때 막는 Discord는 불만이 많다. Zed·VS Code·Obsidian은 조용히 확인한다 |
| 받기 | 자동(VS Code·Chrome·Zed·Logseq) vs 묻고 받기(Joplin·MarkText) | **자동으로 받기**. 단 종량제 연결이면 묻는다 | 받은 뒤에 알려야 「재시작」 한 번으로 끝난다. Store도 종량제에서는 조용한 받기를 하지 않는다 |
| 알림 위치 | 배지(VS Code 톱니·Slack ?)·제목 표시줄 버튼(Zed·Chrome)·모달(Joplin·Figma)·설정 안 버튼(Obsidian) | **비모달. 항상 보이는 크롬(제목 표시줄)에 작은 버튼** + 설정 정보 탭에 상세 | 모달은 작업을 끊는다(Joplin 「intrusive」 글). 배지는 놓치기 쉽다 |
| 시간에 따른 강조 | Chrome 2·4·7일 색 변화, Edge 2/3 시점 색 변화 | 3일·7일이 지나면 색을 조금 진하게. 팝업은 띄우지 않는다 | 미루는 사람에게 조용히 압박한다 |
| 나중에 | 모든 앱에 있다(닫기·무시) | 「나중에」 = 이번 실행 동안 숨김. 다음 실행 때 다시 보인다 | Zed는 버튼을 닫을 수 있다 |
| 이 버전 건너뛰기 | Joplin(백그라운드 확인에만 적용) | 둔다. 더 새 버전이 나오면 다시 알린다. 수동 「업데이트 확인」은 건너뛴 버전도 보여 준다 | Joplin 소스 |
| 끌 때 자동 설치 | Zed(다음 실행 때)·electron-updater 기본값(끌 때). Logseq는 일부러 껐다 | **기본 끔**. 끌 때 NSIS 창이 뜨고 `/R`로 앱이 다시 켜지는 것은 놀랍다. 넣는다면 설정 옵션으로 | Tauri `install()`은 설치기 창과 재실행이 기본이다(④) |
| 재시작 뒤 「새 기능」 | VS Code 릴리스 노트 탭, Obsidian 변경 내역 | 재시작 뒤 한 번만 **작은 알림**(「0.2.0으로 업데이트했어요 · 바뀐 점 보기」). `CHANGELOG.md` 그 버전 절을 문서로 연다 | Frond는 md 뷰어라 CHANGELOG를 그대로 열 수 있다 |
| 강제 업데이트 | Discord 시작 때, Store 「필수 업데이트」(Microsoft가 강제하지 않음, 앱이 구현) | **없음**. 보안 사고가 나면 `latest.json`에 노트로 알린다 | 개인 앱, 오프라인 편집기 |
| 저장 안 한 편집 | Edge 유휴 재시작은 잃을 수 있다고 경고한다. Chrome·VS Code는 세션·hot exit로 복원한다 | 재시작 전에 **저장 안 한 탭 목록을 보여 주고 고르게 한다**(저장·초안으로 보관·취소). 탭·스크롤·분할 상태는 세션으로 복원한다 | Tauri는 강제 `exit(0)`이라 앱이 먼저 처리해야 한다 |
| 오프라인·실패 | 대부분 조용히 실패하고 수동 확인 때만 오류를 보인다 | 자동 확인 실패는 **조용히 로그만**. 수동 확인 때만 「확인하지 못했어요」 | Joplin도 수동 확인 때만 「최신입니다」를 띄운다 |
| 설정에서 끄기 | VS Code `update.mode`, Zed `auto_update`, Obsidian·Typora·Logseq 토글 | 「업데이트 자동 확인」 하나 + 「지금 확인」 버튼. 끄면 확인 요청도 보내지 않는다 | Zed는 「설정이 없으면 끔」 버그로 사고가 났다. 기본값 처리를 시험해야 한다 |
| 보내는 정보 | Tauri는 URL 변수 `{{current_version}}`·`{{target}}`·`{{arch}}`와 User-Agent `tauri-plugin-updater/<버전>`만 보낸다. 정적 JSON이면 GitHub가 IP·UA를 본다 | 정적 `latest.json`(GitHub Releases)이면 서버가 없어 수집할 것이 없다. 개인정보 처리방침(`docs/site/privacy.md`)에 「업데이트 확인 때 GitHub에 요청을 보냄」을 한 줄 적는다 | updater.rs `UPDATER_USER_AGENT` |

---

## ④ Tauri 2 업데이터 구조

### 흐름 (Windows NSIS, currentUser)

```text
[앱 시작] ─10초─▶ check()  ── GET https://github.com/cyKim0115/Frond/releases/latest/download/latest.json
                    │          (User-Agent tauri-plugin-updater/x.y, 헤더·timeout·proxy 지정 가능)
                    │          latest.json 전체 검증 → semver 비교(update.version > current)
                    ├─ 없음 → 끝 (6시간 뒤 다시)
                    └─ Update{version, date, body}
                          │
                    download(onEvent)  ── Started{contentLength} → Progress{chunkLength}* → Finished
                          │              바이트는 메모리의 Update 객체에 남는다(재시작하면 사라짐 〔추론〕)
                    [제목 표시줄에 「업데이트」 표시]
                          │  사용자가 「재시작해 업데이트」
                    앱: 저장 안 한 탭 처리 → 세션·초안 저장 → (Rust on_before_exit 훅)
                          │
                    install()  ── .sig(minisign) 검증 → 임시 폴더에 setup.exe
                                 → ShellExecuteW("setup.exe /P /UPDATE /ARGS <현재 인수>")
                                 → std::process::exit(0)   ← 앱 즉시 종료
                          │
                    NSIS passive: 작은 진행 창, UAC 없음, 제거 없이 덮어쓰기,
                                  NSIS_HOOK_POSTINSTALL 다시 실행, WebView2·바로 가기 건너뜀
                          │
                    /R(기본): 설치 끝나면 mdeditor.exe 재실행 → 세션 복원 → 「업데이트했어요」 알림
```

〔확인〕 `install_inner`가 ShellExecuteW 뒤 `std::process::exit(0)`을 부르고, `restart_after_install` 기본값이 `true`이며, NSIS 인수는 passive `/P`·quiet `/S`에 `/UPDATE`·`/ARGS`를 붙인다: [plugins-workspace updater.rs](https://github.com/tauri-apps/plugins-workspace/blob/v2/plugins/updater/src/updater.rs) · [config.rs](https://github.com/tauri-apps/plugins-workspace/blob/v2/plugins/updater/src/config.rs). 따라서 **Windows에서는 `tauri-plugin-process`의 `relaunch()`가 필요 없다**. 설치기가 다시 띄운다. `relaunch()`는 설치 없이 재시작할 때(예: 설정 적용)만 쓴다.

### 필요한 설정·키·파일

| 항목 | 값 | 출처 |
|---|---|---|
| 크레이트·패키지 | `tauri-plugin-updater`, `@tauri-apps/plugin-updater` (+ 선택 `tauri-plugin-process`). Rust 1.90 이상 | [Tauri v2 Updater](https://v2.tauri.app/plugin/updater/) |
| 초기화 | `tauri_plugin_updater::Builder::new().build()`. Rust 빌더로 `.on_before_exit(..)`·`.timeout(..)`·`.header(..)`·`.endpoints(..)`·`.version_comparator(..)`(다운그레이드 허용 등)를 줄 수 있다 | 같음 |
| 권한 | `updater:default`(= allow-check·allow-download·allow-install·allow-download-and-install), 재시작용 `process:allow-restart` | 같음 · [Process](https://v2.tauri.app/plugin/process/) |
| `tauri.conf.json` | `bundle.createUpdaterArtifacts: true`, `plugins.updater.pubkey`(키 **내용**), `plugins.updater.endpoints: ["https://github.com/cyKim0115/Frond/releases/latest/download/latest.json"]`, `plugins.updater.windows.installMode: "passive"` | 같음 |
| installMode 셋 | `passive`(기본, 작은 진행 창, 입력 없음) · `basicUi`(사용자가 설치를 끝내야 함) · `quiet`(표시 없음, 관리자 권한 요청 불가. currentUser에서는 되지만 권장하지 않음) | 같음 |
| NSIS 설치 모드 | `bundle.windows.nsis.installMode` 기본 `currentUser` → `%LOCALAPPDATA%`, 관리자 불필요(updater의 installMode와 **다른 키**) | [Windows Installer](https://v2.tauri.app/distribute/windows-installer/) |
| 서명 키 | `npm run tauri signer generate -- -w <키 파일>`(Frond의 키 위치·비밀번호는 결정 기록). 빌드 때 환경 변수 `TAURI_SIGNING_PRIVATE_KEY`(내용이나 경로) + `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`. **`.env`는 안 먹는다**. 키를 잃으면 기존 설치본에 업데이트를 못 보낸다 | [Updater](https://v2.tauri.app/plugin/updater/) |
| 산출물 | `Frond_x.y.z_x64-setup.exe` + `.sig` (MSI를 만들면 `.msi` + `.sig`) | 같음 |
| `latest.json` | `version`(semver, `v` 허용) · `notes` · `pub_date`(RFC 3339) · `platforms."windows-x86_64".{url, signature}`. `signature`는 `.sig` **파일 내용**. 파일 전체를 검증하므로 모든 플랫폼 항목이 완전해야 한다 | 같음 |
| tauri-action | `tauri-apps/tauri-action`이 빌드·릴리스 올리기·`latest.json` 생성을 함께 한다(`includeUpdaterJson`) | [tauri-action](https://github.com/tauri-apps/tauri-action) |
| 로컬 빌드로 올리기 | ① `$env:TAURI_SIGNING_PRIVATE_KEY=...; npm run app:build` ② `.sig` 내용으로 `latest.json` 작성(스크립트) ③ `gh release create vX.Y.Z <setup.exe> <setup.exe.sig> latest.json --notes-file <CHANGELOG 절>` ④ 릴리스가 **Latest**로 표시돼야 `releases/latest/download/`가 그 파일을 가리킨다(draft·pre-release는 안 보임) 〔추론: 공식 절차 아님. 형식은 위 문서 기준〕 | [DEV: latest/download 리다이렉트](https://dev.to/eddie_mate/tauri-v2-auto-updates-without-maintaining-latestjson-14de) |
| 버전 비교 | 기본 semver `>`. 같거나 낮으면 「없음」. 동적 서버면 204로 「없음」. 다운그레이드는 Rust `version_comparator`로만 | [Updater](https://v2.tauri.app/plugin/updater/) |
| 다운그레이드 막기 | NSIS `/P`·`/S`·`/UPDATE`에서 `bundle.windows.allowDowngrades: false`면 막는다(번들러 수정 노트) | [tauri-bundler 릴리스](https://v2.tauri.app/de/release/tauri-bundler/all-versions/) |

### SmartScreen·MOTW

- updater는 `reqwest`로 직접 받아 임시 파일에 쓰고 `ShellExecuteW`로 실행한다(소스). 브라우저나 첨부 파일 API를 거치지 않으므로 **Zone.Identifier(MOTW)를 붙이지 않는다**. 그래서 SmartScreen 「알 수 없는 게시자」 경고는 첫 다운로드(브라우저)에만 뜨고 업데이트 때는 뜨지 않을 가능성이 높다 〔추론. 깨끗한 Win10·Win11에서 실기 확인 필요〕.
- 서명하지 않은 파일은 버전마다 평판이 0부터 시작한다. Windows 11 Smart App Control이 켜진 PC에서는 MOTW와 별개로 평판 없는 비서명 실행 파일을 막을 수 있다 〔확인〕[SmartScreen reputation](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/smartscreen-reputation). Smart App Control이 업데이트 설치기도 막는지는 확인하지 못했다.
- Tauri updater 서명(minisign)은 Authenticode와 별개이고 끌 수 없다.

---

## ⑤ 설치 방식별 길 (`install.rs`의 `InstallKind` 기준)

| InstallKind | 업데이트 길 | 앱이 할 일 |
|---|---|---|
| **Installed** (NSIS, GitHub·winget으로 받은 것) | Tauri updater | ④ 전체. winget으로 깔았어도 같은 NSIS(`Scope: user`)라 앱 안 updater가 갱신하면 `winget upgrade`도 새 버전을 본다 〔추론〕 |
| **Packaged** (Store MSIX) | **OS·Store가 갱신**. updater 플러그인 명령은 부르지 않는다(로드맵 R-2) | 선택: `StoreContext.GetAppAndOptionalStorePackageUpdatesAsync()`로 「Store에 새 버전 있음」을 알리고, `RequestDownloadAndInstallStorePackageUpdatesAsync`(OS 확인 창, 「앱이 종료될 수 있음」)나 `TrySilentDownload…`(자동 업데이트 켜짐·비종량제일 때만)를 부른다. 데스크톱 앱은 UI를 띄우기 전에 창 핸들을 연결하고 UI 스레드에서 불러야 한다. 인증 통과 뒤 API가 새 버전을 알기까지 **최대 하루** 걸린다. 「필수 업데이트」 표시는 Microsoft가 강제하지 않는다 〔확인〕[package-updates-from-store](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/package-updates-from-store) · [StoreContext](https://learn.microsoft.com/en-us/uwp/api/windows.services.store.storecontext.requestdownloadandinstallstorepackageupdatesasync) |
| Packaged — 실행 중 갱신 | 기본은 사용 중이면 갱신 실패(`0x80073D02`)이고, 강제 옵션이면 앱을 끈다. Win11 24H2 이상은 매니페스트 `uap17:UpdateWhileInUse="defer"`로 다음 실행까지 미룰 수 있다. 대기 중인지는 `PackageDeploymentManager.IsPackageRegistrationPending`으로 안다 | MSIX 매니페스트에 `defer`를 넣을지는 R-2 때 정한다(Win10에서는 무시될 것 〔추론〕) 〔확인〕[MSIX servicing while in use](https://devblogs.microsoft.com/insidemsix/msix-servicing-while-in-use/) |
| **Scoop** | `scoop update frond` | updater를 끈다(돌리면 `%LOCALAPPDATA%`에 두 번째 설치본이 생긴다. 기존 배포 조사). 설정 정보 탭에 「Scoop으로 설치됨 — `scoop update frond`로 업데이트」와 복사 버튼. 새 버전 확인만 해서 알릴지는 선택(확인은 해도 설치는 하지 않는다) |
| **Dev** | 없음 | 끈다(개발 빌드가 설치본으로 덮어쓰이지 않게) |

---

## ⑥ 위험·함정

1. **강제 종료로 편집 손실**: Windows `install()` = `exit(0)`. `beforeunload`·창 닫기 이벤트·`drafts.rs` 자동 백업 주기에 기대면 마지막 몇 초가 사라진다. install 전에 저장·초안·세션 쓰기를 **await로 끝낸다**. Rust `on_before_exit`에서 한 번 더 flush하는 것도 고려한다.
2. **편집 중 재시작 유도**: 모달이나 카운트다운 자동 재시작(Edge 유휴 재시작)은 편집기에 맞지 않는다. 재시작은 사용자가 누를 때만 한다.
3. **설치 뒤 재실행 인수**: `/ARGS`로 현재 argv를 넘긴다. 처음에 `파일.md`로 연 프로세스면 재시작 때 그 파일을 다시 연다. `--from-hook` 표식도 다시 붙으므로 AI 훅 받은 목록에 중복으로 들어갈 수 있다 〔추론. 실기 확인〕. 세션 복원과 겹치면 같은 탭이 두 번 열릴 수 있다.
4. **single-instance**: 재실행된 새 프로세스가 아직 덜 꺼진 옛 프로세스에 인수를 넘기고 끝날 가능성. `exit(0)`이 ShellExecute 직후라 짧지만 NSIS가 파일을 덮어쓰려면 옛 exe가 꺼져야 한다(NSIS 템플릿이 실행 중 앱을 기다리거나 끄는지 확인 필요).
5. **키 분실**: 서명 개인 키를 잃으면 업데이트 길이 끊긴다. GitHub secret + 오프라인 백업 두 곳(기존 조사와 같음). 공개키를 바꾸려면 「새 공개키를 담은 마지막 업데이트」를 옛 키로 서명해 보내야 한다.
6. **latest.json 하나가 모든 사용자를 움직인다**: 잘못된 버전을 Latest로 표시하면 바로 퍼진다. 릴리스는 draft로 올려 시험 PC에서 받아 본 뒤 Latest로 바꾼다. 문제가 나면 이전 릴리스를 Latest로 되돌린다(semver `>`라 이미 받은 사람은 되돌아가지 않는다).
7. **설정 기본값 버그**: Zed 사례처럼 「키가 없으면 끔」으로 읽히면 아무도 업데이트를 받지 못한다. 설정 스키마 기본값 시험을 넣는다.
8. **MSIX판에서 updater 호출**: Store판이 Tauri updater를 돌리면 비패키지 사본이 따로 깔린다. `InstallKind`로 막는다(프런트·백엔드 둘 다).
9. **GitHub 요청 제한**: `releases/latest/download/`는 API가 아니라 정적 리다이렉트라 rate limit 걱정이 적다. `api.github.com`을 부르는 방식(Joplin처럼)은 익명 60회/시간 제한이 있으니 쓰지 않는다 〔추론〕.
10. **종량제 연결**: Tauri에는 종량제 감지가 없다. Windows `NetworkInformation.GetInternetConnectionProfile().GetConnectionCost()`로 직접 봐야 한다. 처음에는 「자동 받기」만 끄는 정도로 충분하다(설치기 수 MB).
11. **POSTINSTALL 재실행**: 업데이트마다 `hooks.nsh` 등록이 다시 돈다(기존 조사: 같은 HKCU 값을 다시 쓸 뿐). 사용자가 파일 연결을 바꿔 둔 `UserChoice`는 건드리지 않는다는 회귀 시험을 업데이트 경로에도 넣는다(로드맵 1-6 MarkText #5463).

---

## ⑦ Frond 추천안

조사 시점의 추천이다. 확정안은 결정 기록 [`20261127-app-update`](../../decisions/ideas/20261127-app-update.md).

### 범위

- **Installed(NSIS)에서만 동작**한다. Packaged·Scoop·Dev에서는 updater 명령을 부르지 않는다(`install.rs` 판정을 프런트에 내려 준다).
- Packaged는 1차에서 아무것도 하지 않는다(Store가 갱신). StoreContext 「새 버전 있음」 표시는 R-2 뒤 선택 과제로 둔다.
- Scoop은 설정 정보 탭에 안내 한 줄만 둔다.

### 알림 위치

1. **제목 표시줄 오른쪽, 창 버튼(최소화) 왼쪽에 작은 알약 버튼** `⟳ 업데이트`. 받는 중에는 보이지 않는다. 받기를 마친 뒤에만 나타난다(Zed·Chrome 방식). 색은 테마 강조 토큰을 쓰고, 3일·7일이 지나면 한 단계씩 진하게(Chrome).
2. 설정 → **정보 탭**(`purchase.ts`가 쓰는 탭)에 「현재 버전 · 새 버전 · 바뀐 점 · [재시작해 업데이트] [지금 확인] · 마지막 확인 시각」.
3. 모달·토스트는 자동으로 띄우지 않는다. 오류도 수동 확인 때만 보인다.

### 문구 초안 (짧은 존댓말)

| 자리 | 문구 |
|---|---|
| 제목 표시줄 알약 | `업데이트` (툴팁: `Frond 0.2.0이 준비됐어요. 눌러서 재시작해 업데이트합니다.`) |
| 알약을 누른 팝업 제목 | `Frond 0.2.0으로 업데이트할까요?` |
| 팝업 본문 | 릴리스 노트(`latest.json` `notes`) 3~5줄 + `열린 탭과 초안은 재시작 뒤 그대로 돌아옵니다.` |
| 팝업 버튼 | `재시작해 업데이트` · `나중에` · `이 버전 건너뛰기` · (링크) `바뀐 점 전체 보기` |
| 저장 안 한 문서가 있을 때 | `저장하지 않은 문서가 2개 있어요.` + 목록 + `모두 저장하고 업데이트` · `초안으로 두고 업데이트` · `취소` |
| 설치 중(앱 꺼지기 직전) | `업데이트를 설치하고 다시 열게요…` (NSIS passive 창이 이어받는다) |
| 재시작 뒤 1회 | `0.2.0으로 업데이트했어요. · 바뀐 점 보기` (상태 표시줄 근처 작은 알림, 몇 초 뒤 사라짐. 누르면 CHANGELOG 해당 절을 새 탭으로) |
| 수동 확인 — 최신 | `최신 버전이에요 (0.2.0).` |
| 수동 확인 — 실패 | `업데이트를 확인하지 못했어요. 인터넷 연결을 확인해 주세요.` |
| Scoop | `Scoop으로 설치했어요. 업데이트는 터미널에서 scoop update frond 로 합니다.` [복사] |
| Store | `Microsoft Store가 자동으로 업데이트합니다.` |

### 기본값

| 항목 | 기본값 |
|---|---|
| 자동 확인 | 켬. 시작 10초 뒤 1회 + 6시간마다(창이 열려 있는 동안) |
| 자동 받기 | 켬(받은 뒤에만 알림). 종량제 판정은 2차 |
| 설치 | 사용자가 누를 때만. 끌 때 자동 설치는 1차에 넣지 않는다 |
| 건너뛴 버전 | `prefs`(localStorage `frond.update.skipped`)에 버전 하나만 저장. 더 새 버전이 오면 무시하고 알린다. 수동 확인은 건너뛴 버전도 보여 준다 |
| 「나중에」 | 이번 실행 동안 알약을 흐리게(숨기지는 않는다) |
| 강제 업데이트 | 없음 |
| installMode | `passive` (NSIS `currentUser`, UAC 없음) |
| 엔드포인트 | `https://github.com/cyKim0115/Frond/releases/latest/download/latest.json` 하나 |

### 끄기 설정

- `src/settings.ts` `SETTINGS`에 **「업데이트 자동 확인」**(boolean, 기본 true)을 더하고 `add-setting` 스킬대로 「정보」나 「일반」 탭에 둔다. 끄면 주기 확인과 자동 받기 모두 멈춘다. 「지금 확인」 버튼은 남긴다.
- Installed가 아니면 이 항목을 숨기거나 비활성화하고 사유를 보인다(Store·Scoop 문구).
- 기본값이 true로 읽히는지 단위 시험을 둔다(Zed 사고).

### 재시작 때 탭·초안 보존

1. `재시작해 업데이트` → 열린 탭 중 dirty인 것을 모은다.
2. dirty가 있으면 위 팝업. `모두 저장` = 기존 저장 경로(etag 충돌이면 그 문서에서 멈추고 취소한다). `초안으로 두고` = `drafts.rs`에 지금 내용을 즉시 쓰기(await).
3. `session.ts` 세션 저장을 **즉시** 실행한다(평소 디바운스 무시). 탭 순서·활성 탭·보기/소스/분할 모드·스크롤·폴더 트리 루트를 담는다.
4. 그다음 `update.install()`. Rust 쪽 `on_before_exit`에서 남은 파일 쓰기를 flush한다(가능하면).
5. 재실행 뒤 세션 복원이 탭을 되살린다. 초안이 있는 탭은 기존 초안 복원 흐름을 따른다. 재실행 argv 때문에 같은 파일 탭이 둘 생기지 않게 중복을 막는다(⑥-3).
6. 앱이 「직전 실행 버전 < 지금 버전」을 보면 「업데이트했어요」 알림을 한 번 띄운다(`prefs`에 마지막 실행 버전 저장).

### 릴리스 쪽(참고)

- 처음에는 로컬 빌드 + `gh release create`(④ 표 「로컬 빌드로 올리기」)로 시작하고, 반복되면 `tauri-action`으로 옮긴다.
- `latest.json`의 `notes`는 `CHANGELOG.md` 그 버전 절의 첫 몇 줄에서 만든다(사이트·GitHub 릴리스와 원본 하나).
- 첫 updater 탑재 버전(예: 0.2.0)은 **사용자가 직접 설치**해야 한다. 0.1.0 설치본에는 updater가 없다.
- 시험: 0.2.0 설치 → 0.2.1을 draft로 올리고 시험용 엔드포인트로 받기 → 재시작·세션·초안·파일 연결 유지 확인 → Latest 전환.

---

## 확인하지 못한 것

- 업데이트로 받은 setup.exe에 MOTW가 정말 없는지, Smart App Control(Win11)이 비서명 업데이트 설치기를 막는지 — 실기 필요.
- NSIS 템플릿이 `/UPDATE` 때 실행 중인 옛 프로세스를 기다리는지·끄는지(파일 잠금), `/ARGS` 재실행이 `--from-hook`을 다시 붙이는지 — `installer.nsi` 정독이나 실기 필요.
- VS Code 배지·「Restart to Update」 문구와 Windows 백그라운드 업데이트 설정 이름은 공식 문서에서 원문을 찾지 못했다(FAQ의 `update.mode`만 확인).
- Typora의 현재 업데이트 대화상자 모양, Figma 공식 도움말, Discord 공식 설명은 1차 출처를 찾지 못했다(포럼·제3자 글 기준).
- Store 「자동 업데이트」 주기(기존 조사의 「24시간마다」 외 새 출처 없음).
- `download()` 뒤 받아 둔 바이트를 재시작 너머로 들고 갈 수 있는지(현재 API는 메모리 보관으로 보임).

## ⑧ 출처 목록

**Tauri**
- Tauri v2 Updater — https://v2.tauri.app/plugin/updater/
- Tauri v2 Process — https://v2.tauri.app/plugin/process/
- Tauri v2 Windows Installer — https://v2.tauri.app/distribute/windows-installer/
- plugins-workspace updater.rs (v2) — https://github.com/tauri-apps/plugins-workspace/blob/v2/plugins/updater/src/updater.rs
- plugins-workspace config.rs (v2) — https://github.com/tauri-apps/plugins-workspace/blob/v2/plugins/updater/src/config.rs
- tauri-action — https://github.com/tauri-apps/tauri-action
- tauri-bundler 릴리스 노트 — https://v2.tauri.app/de/release/tauri-bundler/all-versions/
- DEV: latest.json 없이 업데이트(latest/download 리다이렉트 주의) — https://dev.to/eddie_mate/tauri-v2-auto-updates-without-maintaining-latestjson-14de

**Microsoft**
- Package updates from Store — https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/package-updates-from-store
- StoreContext.RequestDownloadAndInstallStorePackageUpdatesAsync — https://learn.microsoft.com/en-us/uwp/api/windows.services.store.storecontext.requestdownloadandinstallstorepackageupdatesasync
- MSIX servicing while in use (2026-09-01) — https://devblogs.microsoft.com/insidemsix/msix-servicing-while-in-use/
- SmartScreen reputation — https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/smartscreen-reputation
- Edge RelaunchNotification — https://learn.microsoft.com/en-my/deployEdge/microsoft-edge-policies/relaunchnotification
- Edge 유휴 때 업데이트 — https://support.microsoft.com/en-gb/edge/automatically-update-microsoft-edge-when-your-device-is-idle
- Ed Tittel: WT Update Requires Application Restart — https://www.edtittel.com/?p=6042

**앱**
- VS Code FAQ — https://code.visualstudio.com/docs/supporting/faq
- VS Code Enterprise updates — https://code.visualstudio.com/docs/enterprise/updates
- VS Code 1.52 릴리스 노트 — https://code.visualstudio.com/updates/v1_52
- Chrome 업데이트 색(9to5Google) — https://9to5google.com/2022/02/21/everything-you-need-to-know-about-updating-google-chrome-for-desktop/
- Chrome 대기 업데이트 확인(U-M) — https://safecomputing.umich.edu/security-alerts/check-chrome-pending-updates
- Slack Help: Update the desktop app — https://slack.com/help/articles/360048367814-Update-the-Slack-desktop-app
- Discord 시작 때 업데이트(MakeUseOf) — https://www.makeuseof.com/windows-discord-launch-update-startup/
- Discord 백그라운드 업데이트 요청 — https://support.discord.com/hc/sv/community/posts/1500000604881-Please-use-background-updates-instead-of-auto-update-on-start
- Obsidian Help: Updates — https://help.obsidian.md/updates
- Obsidian 두 버전 번호 Q&A — https://forum.obsidian.md/t/q-a-why-obsidian-has-two-version-numbers/110663
- Zed Docs: Update — https://zed.dev/docs/update
- Zed all settings — https://zed.dev/docs/reference/all-settings
- Zed 업데이트 버튼 제목 표시줄 이동 커밋(#48467) — https://git.secluded.site/zed/commit/191b4ccd4fce447bf3fb50030b84ee0308af7548
- Zed Auto Update Post-Mortem — https://zed.dev/blog/auto-update-post-mortem
- Typora What's New 0.9.84 — https://support.typora.io/What's-New-0.9.84
- Notion for desktop — https://www.notion.com/help/notion-for-desktop
- Notion new tabs — https://www.notion.com/help/new-tabs-in-the-notion-desktop-app
- Figma Forum: 매번 업데이트 요청 — https://forum.figma.com/ask-the-community-7/figma-keeps-asking-to-update-every-time-i-open-the-app-42889
- Figma Forum: 업데이트마다 새 버전 폴더 — https://forum.figma.com/suggest-a-feature-11/figma-desktop-app-creates-a-new-versioned-folder-on-every-update-breaking-third-party-app-integrations-e-g-logi-options-58888
- Joplin checkForUpdates.ts — https://github.com/laurent22/joplin/blob/dev/packages/app-desktop/checkForUpdates.ts
- Joplin Forum: Intrusive updates on Windows — https://discourse.joplinapp.org/t/intrusive-updates-on-windows/107
- MarkText menu/actions/marktext.ts — https://github.com/marktext/marktext/blob/develop/packages/desktop/src/main/menu/actions/marktext.ts
- Logseq electron/updater.cljs — https://github.com/logseq/logseq/blob/master/src/electron/electron/updater.cljs

**저장소 안 (겹침 확인용)**
- `docs/research/reports/Frond 윈도우 앱 배포 방법.md` — 채널·서명·winget·MSIX 구조
- `docs/roadmap.md` R-2·R-5, `docs/store-launch.md`, `src-tauri/src/install.rs`
