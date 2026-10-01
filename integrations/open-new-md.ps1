# AI 코딩 도구가 새 .md 파일을 만들면 MdEditor로 연다 — PostToolUse 훅 (integrations/README.md)
#
# 입력: 훅 stdin JSON
#   Claude Code  Write 도구 → tool_input.file_path, tool_response.type ("create" | "update")
#   Codex        apply_patch → tool_input.command 안의 "*** Add File: <경로>" 줄 (상대 경로는 cwd 기준)
# 동작: 열 파일이 있으면 마지막 하나를 MdEditor로 연다. 이미 떠 있으면 single-instance가 기존 창에서 연다.
# AI 작업을 막지 않도록 무슨 일이 있어도 exit 0. 판단 결과는 %TEMP%\mdeditor-open-hook.log에 한 줄씩 남긴다.

$ErrorActionPreference = 'Stop'
$LogPath = Join-Path ([System.IO.Path]::GetTempPath()) 'mdeditor-open-hook.log'

function Write-HookLog([string]$Message) {
    try {
        $line = '{0:yyyy-MM-dd HH:mm:ss} {1}' -f (Get-Date), $Message
        [System.IO.File]::AppendAllText($LogPath, $line + [Environment]::NewLine, [System.Text.Encoding]::UTF8)
    } catch { }
}

# stdin을 UTF-8로 읽는다. PowerShell 5.1의 [Console]::In은 OEM 코드 페이지(cp949)라 한글 경로가 깨진다
function Read-HookInput {
    $reader = New-Object System.IO.StreamReader([Console]::OpenStandardInput(), [System.Text.Encoding]::UTF8)
    try { return $reader.ReadToEnd() | ConvertFrom-Json } finally { $reader.Dispose() }
}

# 이번 도구 호출로 새로 생긴 파일 경로들 (절대 경로)
function Get-CreatedPaths($Payload) {
    switch ($Payload.tool_name) {
        'Write' {
            # 덮어쓰기(update)는 열지 않는다 — 이미 열려 있으면 MdEditor의 외부 변경 감지가 다시 읽는다
            if ($Payload.tool_response.type -ne 'create') { return @() }
            return @([string]$Payload.tool_input.file_path)
        }
        'apply_patch' {
            $command = $Payload.tool_input.command
            if ($command -is [array]) { $command = $command -join "`n" }
            $base = if ($Payload.cwd) { [string]$Payload.cwd } else { (Get-Location).Path }
            return @(([string]$command -split "`r?`n") |
                Where-Object { $_ -match '^\*\*\* Add File: (.+)$' } |
                ForEach-Object { [System.IO.Path]::GetFullPath([System.IO.Path]::Combine($base, $Matches[1].Trim())) })
        }
        default { return @() }
    }
}

# 이 파일을 MdEditor로 열지. AI가 자기 작업용으로 쓰는 md(메모리·계획·스크래치)는 열지 않는다
function Test-ShouldOpen([string]$Path) {
    if ($Path -notmatch '\.(md|markdown)$') { return $false }
    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) { return $false }

    # TODO(사용자): 열지 않을 폴더 — 아래는 기본값이다. 필요하면 더하거나 뺀다
    $excluded = @(
        (Join-Path $env:USERPROFILE '.claude'),   # 메모리·계획·스킬·룰
        (Join-Path $env:USERPROFILE '.codex'),
        [System.IO.Path]::GetTempPath()           # 세션 스크래치패드
    )
    foreach ($dir in $excluded) {
        $prefix = $dir.TrimEnd('\') + '\'
        if ($Path.StartsWith($prefix, [System.StringComparison]::OrdinalIgnoreCase)) { return $false }
    }
    return $true
}

# 설치기가 등록한 ProgId의 열기 명령에서 exe 경로를 꺼낸다 ("C:\...\mdeditor.exe" "%1")
function Get-MdEditorExe {
    $key = 'HKCU:\Software\Classes\MdEditor.Markdown\shell\open\command'
    $command = (Get-ItemProperty -LiteralPath $key -ErrorAction SilentlyContinue).'(default)'
    if ($command -match '^\s*"([^"]+)"') { $exe = $Matches[1] }
    else { $exe = Join-Path $env:LOCALAPPDATA 'MdEditor\mdeditor.exe' }
    if (Test-Path -LiteralPath $exe -PathType Leaf) { return $exe }
    return $null
}

try {
    $payload = Read-HookInput
    $targets = @(Get-CreatedPaths $payload | Where-Object { Test-ShouldOpen $_ })
    if ($targets.Count -eq 0) { exit 0 }

    $exe = Get-MdEditorExe
    if (-not $exe) {
        Write-HookLog "MdEditor 설치 경로를 찾지 못함: $($targets[-1])"
        exit 0
    }
    # 창은 하나라 여러 개를 연달아 열어도 마지막만 남는다 — 마지막 하나만 연다
    $target = $targets[-1]
    Start-Process -FilePath $exe -ArgumentList ('"{0}"' -f $target)
    Write-HookLog "열기 ($($payload.tool_name)): $target"
} catch {
    Write-HookLog "오류: $($_.Exception.Message)"
}
exit 0
