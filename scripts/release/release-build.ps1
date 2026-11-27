# 서명 릴리스 빌드 (결정 20261127-app-update §5·§6) — 사용자가 자기 터미널에서 돌린다. 발행(gh release)은 하지 않고 명령만 보인다.
#
#   powershell -NoProfile -ExecutionPolicy Bypass -File scripts\release\release-build.ps1 -Version 0.2.1 [-DryRun] [-KeyFile <경로>] [-SecretsFile <경로>]
#
# 키 경로: -KeyFile → 비밀값 파일의 선택 줄 FROND_UPDATER_KEY_PATH= → 기본 $env:USERPROFILE\.tauri\frond-updater.key (공개 키는 + .pub)
# 비밀번호: 비밀값 파일(-SecretsFile, 기본 $env:USERPROFILE\Documents\Sensitive\mcp-secrets.env)의 FROND_UPDATER_KEY_PASSWORD= 줄.
#           없으면 직접 묻는다. 값은 빌드 자식 프로세스 환경에만 넘기고 출력·로그에 남기지 않는다.
# -DryRun: 확인만 한다 — 비밀 키·비밀번호·비밀값 파일을 읽지 않는다(공개 키 일치는 본다). 에이전트가 돌려도 되는 범위.
param(
  [Parameter(Mandatory = $true)][string]$Version,
  [switch]$DryRun,
  [string]$KeyFile,
  [string]$SecretsFile = (Join-Path $env:USERPROFILE 'Documents\Sensitive\mcp-secrets.env')
)

$ErrorActionPreference = 'Stop'
$repo = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$Version = $Version -replace '^v', ''
$errors = New-Object System.Collections.Generic.List[string]
$warnings = New-Object System.Collections.Generic.List[string]
function Fail($m) { $errors.Add($m) }
function Warn($m) { $warnings.Add($m) }

# 비밀값 파일에서 한 줄만 꺼낸다 — 실제 빌드에서만 부른다
function Read-SecretLine([string]$name) {
  if (-not (Test-Path -LiteralPath $SecretsFile)) { return $null }
  foreach ($line in [IO.File]::ReadAllLines($SecretsFile)) {
    if ($line -match "^\s*$([regex]::Escape($name))\s*=(.*)$") { return $Matches[1].Trim().Trim('"') }
  }
  return $null
}

Push-Location $repo
try {
  # ---- 1. 확인 ---------------------------------------------------------------------------
  if ($Version -notmatch '^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$') { throw "semver가 아닙니다: $Version" }
  if ($env:TAURI_CONFIG) { Fail 'TAURI_CONFIG가 남아 있습니다 — 다른 덧설정이 끼지 않게 비웁니다' }
  if (git status --porcelain) { Fail '작업 트리가 깨끗하지 않습니다' }
  $branch = (git rev-parse --abbrev-ref HEAD).Trim()
  if ($branch -ne 'main') { Fail "main이 아닙니다 ($branch)" }

  & node scripts/release/bump-version.mjs --check $Version
  if ($LASTEXITCODE -ne 0) { Fail "버전 파일이 $Version로 맞지 않습니다 (bump-version.mjs $Version)" }

  $changelog = [IO.File]::ReadAllText((Join-Path $repo 'CHANGELOG.md'))
  $section = [regex]::Match($changelog, "(?ms)^## $([regex]::Escape($Version)) — [^\r\n]*\r?\n(.*?)(?=^## |\z)")
  if (-not $section.Success) {
    $m = "CHANGELOG.md에 '## $Version — 날짜' 절이 없습니다 ('## 다음 버전 (미출시)' 제목을 바꿉니다)"
    if ($DryRun) { Warn $m } else { Fail $m }
  }

  # 5.1의 Get-Content는 BOM 없는 UTF-8을 ANSI로 읽어 한글이 깨진다 — .NET으로 읽는다
  $releaseConf = [IO.File]::ReadAllText((Join-Path $repo 'src-tauri\tauri.release.conf.json')) | ConvertFrom-Json
  if ($releaseConf.bundle.createUpdaterArtifacts -ne $true) { Fail 'src-tauri/tauri.release.conf.json에 createUpdaterArtifacts: true가 없습니다' }

  if (-not $KeyFile -and -not $DryRun) { $KeyFile = Read-SecretLine 'FROND_UPDATER_KEY_PATH' }
  if (-not $KeyFile) { $KeyFile = Join-Path $env:USERPROFILE '.tauri\frond-updater.key' }
  $KeyFile = [IO.Path]::GetFullPath($KeyFile)
  if ($KeyFile.StartsWith($repo, [StringComparison]::OrdinalIgnoreCase)) { Fail '서명 키가 저장소 안에 있습니다 — 저장소 밖으로 옮깁니다' }
  if (-not (Test-Path -LiteralPath $KeyFile)) { Fail "서명 키가 없습니다: $KeyFile" }
  $pubFile = "$KeyFile.pub"
  $conf = [IO.File]::ReadAllText((Join-Path $repo 'src-tauri\tauri.conf.json')) | ConvertFrom-Json
  if (-not (Test-Path -LiteralPath $pubFile)) {
    Fail "공개 키 파일이 없습니다: $pubFile"
  } elseif (([IO.File]::ReadAllText($pubFile)).Trim() -ne "$($conf.plugins.updater.pubkey)".Trim()) {
    Fail 'tauri.conf.json의 pubkey가 서명 키의 .pub와 다릅니다 (시험 키가 섞였거나 비어 있음)'
  }

  & npx vitest run src/release-config.test.ts --reporter=dot
  if ($LASTEXITCODE -ne 0) { Fail '기본 설정 가드 시험(src/release-config.test.ts)이 실패했습니다' }

  foreach ($w in $warnings) { Write-Host "주의: $w" -ForegroundColor Yellow }
  if ($errors.Count) {
    foreach ($e in $errors) { Write-Host "멈춤: $e" -ForegroundColor Red }
    exit 1
  }
  if ($DryRun) {
    Write-Host "DryRun 통과 — $Version, 키 $KeyFile (공개 키 일치). 비밀 키·비밀번호는 읽지 않았습니다."
    exit 0
  }

  # ---- 2·3. 서명 빌드 ---------------------------------------------------------------------
  $password = Read-SecretLine 'FROND_UPDATER_KEY_PASSWORD'
  if ($null -eq $password) {
    $secure = Read-Host '서명 키 비밀번호' -AsSecureString
    $password = [Runtime.InteropServices.Marshal]::PtrToStringBSTR([Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure))
  }
  $psi = New-Object System.Diagnostics.ProcessStartInfo
  $psi.FileName = 'cmd.exe'
  $psi.Arguments = '/c npm run app:build -- --config src-tauri/tauri.release.conf.json'
  $psi.WorkingDirectory = $repo
  $psi.UseShellExecute = $false
  # 서명 값은 이 자식 프로세스 환경에만
  $psi.EnvironmentVariables['TAURI_SIGNING_PRIVATE_KEY'] = $KeyFile
  $psi.EnvironmentVariables['TAURI_SIGNING_PRIVATE_KEY_PASSWORD'] = $password
  try {
    $p = [Diagnostics.Process]::Start($psi)
    $p.WaitForExit()
    if ($p.ExitCode -ne 0) { throw "app:build 실패 ($($p.ExitCode))" }
  } finally {
    $psi.EnvironmentVariables.Remove('TAURI_SIGNING_PRIVATE_KEY_PASSWORD')
    $psi.EnvironmentVariables.Remove('TAURI_SIGNING_PRIVATE_KEY')
    $password = $null
    $secure = $null
  }

  # ---- 4. latest.json ---------------------------------------------------------------------
  $bundle = Join-Path $repo 'target\release\bundle\nsis'
  $setup = Join-Path $bundle "Frond_$($Version)_x64-setup.exe"
  if (-not (Test-Path -LiteralPath "$setup.sig")) { throw "서명 파일이 없습니다: $setup.sig" }
  $notesFile = Join-Path $bundle "release-notes-$Version.md"
  [IO.File]::WriteAllText($notesFile, $section.Groups[1].Value.Trim() + "`n", (New-Object Text.UTF8Encoding $false))
  $latest = Join-Path $bundle 'latest.json'
  $url = "https://github.com/cyKim0115/Frond/releases/download/v$Version/Frond_$($Version)_x64-setup.exe"
  & node scripts/release/make-latest-json.mjs --version $Version --notes-file $notesFile --sig "$setup.sig" --url $url --out $latest
  if ($LASTEXITCODE -ne 0) { throw 'latest.json을 만들지 못했습니다' }

  # ---- 5. 올릴 명령만 보인다 ---------------------------------------------------------------
  Write-Host ''
  Write-Host '올리기(이 스크립트는 실행하지 않음 — 개인 저장소라 cyKim0115 토큰을 그 명령에만):'
  Write-Host "  gh release create v$Version --repo cyKim0115/Frond --draft --title `"Frond $Version`" --notes-file `"$notesFile`" `"$setup`" `"$setup.sig`" `"$latest`""
} finally {
  Pop-Location
}
