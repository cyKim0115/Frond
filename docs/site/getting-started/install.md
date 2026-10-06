---
description: Frond를 설치하는 방법과 같은 버전을 다시 설치할 때, 예전 MdEditor에서 옮길 때 주의할 점입니다.
icon: download
---

# 설치

Windows 10/11에서 동작합니다. 현재는 설치기를 직접 만들어 설치합니다(배포 채널은 준비 중).

## 설치기 만들기

준비물: [Node.js](https://nodejs.org/) 20 이상, [Rust](https://rustup.rs/)(stable, MSVC).

```powershell
npm install
npm run app:build
```

`target\release\bundle\nsis\Frond_0.1.0_x64-setup.exe`가 만들어집니다. 실행하면 현재 사용자 계정에 설치됩니다(관리자 권한 불필요, `%LOCALAPPDATA%\Frond`). WebView2 런타임이 없으면 설치기가 내려받습니다.

## 같은 버전을 다시 설치할 때

설치기가 "이미 설치됨" 페이지를 먼저 띄웁니다. **추가/재설치**를 골라 끝까지 진행해야 파일이 바뀝니다(창을 닫으면 아무것도 바뀌지 않습니다). 페이지 없이 덮어쓰려면 설치기를 `/S` 옵션으로 실행합니다.

```powershell
Frond_0.1.0_x64-setup.exe /S
```

## MdEditor 이름으로 설치한 적이 있다면

먼저 **설정 → 앱 → MdEditor**에서 제거한 뒤 설치합니다. '앱 데이터 삭제'는 체크하지 않습니다 — Frond와 같은 폴더라 설정이 지워집니다.

이름이 바뀌어 설치 폴더가 달라졌기 때문에, 그냥 설치하면 두 앱이 나란히 남습니다. 설정·최근 파일·`.md` 기본 앱 지정은 그대로 이어지고, 테마·초안 폴더(`%APPDATA%\MdEditor`)는 처음 실행할 때 `%APPDATA%\Frond`로 옮겨집니다.

다음 단계: [`.md` 기본 앱으로 지정](default-app.md)
