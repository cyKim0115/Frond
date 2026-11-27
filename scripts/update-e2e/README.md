# 발행 없는 앱 안 업데이트 E2E

GitHub 릴리스 없이 앱 안 업데이트(확인 → 받기 → 재시작 → 복원)를 실제 설치본 흐름으로 시험한다(결정 `docs/decisions/ideas/20261127-app-update.md`).
시험용 설치기 세 벌(0.9.0·0.9.1·0.9.2)을 **일회용 시험 키**로 서명해 `127.0.0.1` 서버로 내주고, 설치한 0.9.0을 CDP로 조종한다.

## 돌리기

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\update-e2e\run.ps1 -Work D:\Temp\frond-update-e2e
```

- `-Step build|scenarios|cleanup`으로 나눠 돌릴 수 있다. 시나리오 하나는 `node scripts/update-e2e/e2e.mjs run S8 --work <폴더>`.
- 결과는 `<작업>\results.json`(시나리오별 통과·메모·콘솔), 캡처는 `<작업>\shots\`. 실제 설치본 스냅숏은 `snapshot-before.json`·`snapshot-after.json`.
- 빌드 세 번(릴리스, lto)에 10분 남짓, 시나리오에 15분 남짓 걸린다. 이미 빌드한 버전은 건너뛴다.
- 0.9.2를 따로 빌드하는 까닭: updater 2.14는 서명에 든 버전과 `latest.json`의 `version`이 다르면 받기를 거절한다
  (`The update was signed for version 0.9.1 but the update endpoint announced version 0.9.2`). 같은 설치기를 더 새 버전인 척 내줄 수 없다.

## 격리 — 실제 설치본을 건드리지 않는다

| 항목 | 실제 설치본 | 시험 빌드 |
|---|---|---|
| identifier (single-instance·WebView2 데이터·인계 파일) | `com.cykim.mdeditor` | `com.cykim.mdeditor.updatetest` |
| productName (설치 폴더·제거 키·바로 가기) | `Frond` | `FrondUpdateTest` |
| mainBinaryName (NSIS 실행 중 확인도 이 경로) | `mdeditor` | `mdeditor-updatetest` |
| 파일 연결·NSIS 훅 | `MdEditor.Markdown`, `src-tauri/nsis/hooks.nsh` | 없음(`fileAssociations: []`, 빈 훅 파일) |
| 서명 키 | 진짜 키(비밀번호) | 일회용 시험 키(비밀번호 없음, 작업 폴더에만) |
| 엔드포인트 | https GitHub | `http://127.0.0.1:18733/latest.json` + `dangerousInsecureTransportProtocol` |
| 빌드 폴더 | `target/release` | `target/update-test` |
| 초안 폴더 | `%APPDATA%\Frond\drafts` | 같음 — 시험 문서는 작업 폴더에만 두고 cleanup이 그 초안만 지운다 |

- 덧설정(`conf-<버전>.json`)과 시험 키는 **작업 폴더(저장소 밖)에만** 만들고 `tauri build --config`로만 넘긴다. 저장소에 시험 설정이 없다.
  `run.ps1`·`e2e.mjs build`는 시작·끝에 `git diff --quiet -- src-tauri/`를 본다. 커밋된 설정은 `src/release-config.test.ts`가 지킨다.
- `build`는 생성된 `installer.nsi`에서 PRODUCTNAME·MAINBINARYNAME·BUNDLEID를 확인하고 `MdEditor.Markdown`·저장소 훅·`RegisteredApplications`가 있으면 멈춘다(`isolation.json`).
- 설치기·앱은 Claude 데스크톱 컨테이너 밖에서 돈다(`Invoke-CimMethod Win32_Process Create`) — 안에서 돌리면 AppData 새 파일이 Claude 패키지 LocalCache에만 생긴다.
  CDP 포트는 `cmd /c set WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS=--remote-debugging-port=9339&& start …`로 그 앱에만 준다. 업데이트 뒤 설치기가 다시 띄운 앱도 이 환경을 물려받는다.
- 시작 전·끝난 뒤 실제 설치본(`%LOCALAPPDATA%\Frond\mdeditor.exe` 해시·버전, HKCU `MdEditor.Markdown` 열기 명령·`.md`·`UserChoice`·`RegisteredApplications\Frond`·제거 키, 시작 메뉴·바탕 화면 바로 가기, `%APPDATA%\Frond` 파일)을 컨테이너 밖에서 찍어 비교한다(S14).

## 시나리오

| # | 내용 |
|---|---|
| S1 | 0.9.0 실행 → 10초 뒤 `latest.json` 1회 → 설치기 1회 → 알약. 요청 헤더 기록 |
| S2 | 확인 팝업 `나중에` → 알약 흐림, 팝업 없음 |
| S3 | `이 버전 건너뛰기` → 재실행: 설치기 요청·알약 없음, '지금 확인'은 0.9.1을 받음, `latest.json`을 0.9.2로 바꾸면 다시 알림 |
| S9 | 서버 끔 → 자동은 조용, 수동은 실패 문구 |
| S10 | 자동 확인 끔 → 요청 0 / 설정 키 지움 → 요청 1(기본 켬) |
| S8 | 설치기 1바이트 바꿈(`.sig` 그대로) → 알약 없음, 수동은 서명 문구 |
| S13 | 설치본 exe를 `…\scoop\apps\frond\current\`·`…\target\…`에 복사해 실행 → 요청 0, 사유 문구 |
| S7 · S6 | 저장 안 한 문서 팝업 `취소` / 밖에서 바꾼 파일로 저장 충돌 → 업데이트 멈춤, 앱·인계 파일 그대로 |
| A | S4(초안으로 두고 업데이트 → 탭·활성·모드·줄·초안 복구·`업데이트됨`) + S11('빈 창으로 시작'에서도 한 번 복원, 다음 실행은 빈 창) + S12(파일 인수로 띄운 앱 — 같은 탭 중복 없음). S16 받은 설치기 `Zone.Identifier`, exit(0) 직전 localStorage 표식도 기록 |
| B | S5 모두 저장하고 업데이트 → BOM·CRLF·LF 바이트 보존, 재시작 뒤 dirty 없음 |
| S14 | 실제 설치본 무변경(스냅숏 비교) |
| S17 | 콘솔 오류·CSP 위반 없음(`results.json` `console`) |

S15(설치 진행 창 사이 두 번째 인스턴스)는 돌리지 않는다 — 설치기가 exe를 덮는 동안 새 프로세스가 잡으면 NSIS가 사용자 화면에 모달 오류를 띄울 수 있다.

다시 돌릴 때는 `reset`(시험 앱 데이터·시험 문서 초안·업데이터 임시 폴더 지움)부터.

## 정리

`cleanup`이 시험 설치본 제거기(`/S`)를 돌리고 제거기가 남기는 `HKCU\Software\cyKim\FrondUpdateTest`(설치 경로·언어), 업데이터가 `%TEMP%\FrondUpdateTest-<버전>-updater-*`에 남긴 설치기, `%LOCALAPPDATA%\FrondUpdateTest`·`%LOCALAPPDATA%\com.cykim.mdeditor.updatetest`·`target/update-test`·시험 키·덧설정·시험 문서 초안을 지운 뒤, 제거 키·바로 가기가 남았는지 보인다.
