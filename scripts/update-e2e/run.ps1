# 발행 없는 앱 안 업데이트 E2E — 전체 순서 (결정 20261127-app-update §7, 돌리는 법 README.md)
#
#   powershell -NoProfile -ExecutionPolicy Bypass -File scripts\update-e2e\run.ps1 [-Work <저장소 밖 폴더>] [-Step all|build|scenarios|cleanup]
#
# - 일회용 시험 키(비밀번호 없음)·격리 덧설정은 -Work 폴더에만 만들고 끝나면 지운다. 진짜 서명 키·비밀값 파일은 읽지 않는다
# - 시험 설치기·앱은 Claude 데스크톱 컨테이너 밖(WMI)에서 돈다. 조종은 CDP만(실제 마우스·키보드 없음)
# - 시작·끝에 src-tauri/가 깨끗한지(git diff) 보고, 실제 설치본 스냅숏을 비교한다(S14)
param(
  [string]$Work = (Join-Path $env:TEMP ("frond-update-e2e\" + (Get-Date -Format 'yyyyMMdd-HHmmss'))),
  [ValidateSet('all', 'build', 'scenarios', 'cleanup')]
  [string]$Step = 'all'
)

$ErrorActionPreference = 'Stop'
$repo = Resolve-Path (Join-Path $PSScriptRoot '..\..')
$e2e = Join-Path $PSScriptRoot 'e2e.mjs'
if ($Work.StartsWith($repo.Path, [StringComparison]::OrdinalIgnoreCase)) { throw '작업 폴더는 저장소 밖이어야 합니다' }
if ($env:TAURI_CONFIG) { throw 'TAURI_CONFIG가 남아 있습니다 — 비우고 돌립니다' }
New-Item -ItemType Directory -Force $Work | Out-Null

function Invoke-E2e {
  & node $e2e @args --work $Work
  if ($LASTEXITCODE -ne 0) { throw "e2e.mjs $($args -join ' ') 실패 ($LASTEXITCODE)" }
}

Push-Location $repo
try {
  git diff --quiet -- src-tauri/
  if ($LASTEXITCODE -ne 0) { throw 'src-tauri/에 커밋 안 한 변경이 있습니다' }

  if ($Step -in 'all', 'build') {
    Invoke-E2e snapshot before
    Invoke-E2e build
  }
  if ($Step -in 'all', 'scenarios') {
    Invoke-E2e serve start
    Invoke-E2e reset
    Invoke-E2e install 0.9.0
    Invoke-E2e run S1 S2 S3
    Invoke-E2e run S9
    Invoke-E2e run S10
    Invoke-E2e run S8
    Invoke-E2e run S13
    Invoke-E2e run S7S6
    Invoke-E2e run A          # S4 + S11 + S12 (0.9.0 → 0.9.1)
    Invoke-E2e install 0.9.0  # 다시 내려 깔고
    Invoke-E2e run B          # S5
    Invoke-E2e serve stop
  }
  if ($Step -in 'all', 'cleanup') {
    Invoke-E2e cleanup
    Invoke-E2e snapshot after
    Invoke-E2e compare before after
  }

  git diff --quiet -- src-tauri/
  if ($LASTEXITCODE -ne 0) { throw '시험 뒤 src-tauri/가 바뀌었습니다 — 시험 설정이 저장소에 쓰였는지 확인' }
  Write-Host "결과: $(Join-Path $Work 'results.json') · 캡처: $(Join-Path $Work 'shots')"
} finally {
  Pop-Location
}
