# Phase 0-3 — Tauri vs WPF hello 시작 시간·메모리 측정

[docs/roadmap.md](../../docs/roadmap.md) Phase 0-3 "WPF 비교 측정"용 스파이크입니다.
두 hello 앱 모두 800×600 창에 `<h1>Hello</h1>` 한 장을 띄우고, **첫 프레임이 그려진 뒤**
(DOMContentLoaded → rAF → rAF) 창 제목을 `READY`로 바꿉니다. `measure.ps1`은 그 제목 변경을
폴링해서 시작 시간을 재고, 프로세스 트리 전체(WebView2 자식 포함)의 메모리를 합산합니다.

## 빌드 (반드시 Release)

```powershell
# Tauri 2.12 — spike/tauri-hello/target/release/tauri-hello.exe
cd spike/tauri-hello
cargo build --release

# WPF + .NET 10 + WebView2 — spike/wpf-hello/publish/WpfHello.exe
cd spike/wpf-hello
dotnet publish -c Release -r win-x64 --self-contained false -p:PublishReadyToRun=true -o publish
```

## 측정

리포지토리 루트에서 앱마다 한 번씩 실행합니다. `-OutCsv`는 같은 파일에 계속 append됩니다.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File spike/measure/measure.ps1 -Exe spike/tauri-hello/target/release/tauri-hello.exe -Label tauri -Runs 10 -OutCsv spike/measure/results.csv
powershell -NoProfile -ExecutionPolicy Bypass -File spike/measure/measure.ps1 -Exe spike/wpf-hello/publish/WpfHello.exe -Label wpf -Runs 10 -OutCsv spike/measure/results.csv
```

| 인자 | 기본 | 뜻 |
|---|---|---|
| `-Exe` | (필수) | 실행 파일 경로 |
| `-Label` | exe 이름 | CSV·Markdown 행 라벨 |
| `-Runs` | 10 | 실행 횟수 |
| `-SettleMs` | 2000 | READY 뒤 메모리 샘플링까지 대기 |
| `-OutCsv` | 없음 | 결과를 append할 CSV (`label,run,ready_ms,procs,ws_mb,private_mb,timestamp`) |
| `-TimeoutSec` | 30 | READY를 못 보면 실패 처리 |

출력: 실행별 표 → 요약(1회차 = `cold-ish`, 2..N회차 = warm min/median/max) → 문서에 붙일 Markdown 표.

## 읽을 때 주의

- **콜드 스타트는 재부팅 직후 첫 실행**을 따로 재야 합니다. 스크립트의 1회차는 파일 캐시가 남은
  "cold-ish"일 뿐이고, 2..N회차는 warm입니다. 측정 중에는 다른 빌드·브라우저를 돌리지 않습니다.
- `ready_ms`는 프로세스 생성 시각(`Process.StartTime`)부터 폴링이 `READY`를 본 순간까지입니다.
  폴링은 5 ms 간격이지만 Windows 타이머 해상도 때문에 실제 간격은 ~15 ms까지 벌어질 수 있습니다.
- `ws_mb`·`private_mb`는 루트 + 모든 자손 프로세스의 `WorkingSet64`·`PrivateMemorySize64` 합입니다.
  WebView2는 `msedgewebview2.exe` 여러 개를 띄우므로 `procs`도 같이 봅니다. 이 PC에는 다른 앱의
  msedgewebview2가 수십 개 떠 있어 이름이 아니라 **부모 PID 트리**로만 집계합니다.
- **공정성 한계**: WPF는 framework-dependent + ReadyToRun(런타임 로드·일부 JIT 포함), Tauri는 정적
  단일 exe입니다. 둘 다 같은 WebView2 Runtime을 쓰므로 렌더러 비용은 동일하고, 차이는 호스트 쪽
  (Rust/tao vs .NET/WPF) 부팅 비용입니다. WPF self-contained나 NativeAOT는 별도 측정이 필요합니다.
- WebView2 사용자 데이터 폴더: Tauri `%LOCALAPPDATA%\com.cykim.tauri-hello\EBWebView`,
  WPF `%LOCALAPPDATA%\WpfHello`. 첫 실행은 프로필 생성 비용이 섞이므로 1회차와 분리해서 봅니다.
