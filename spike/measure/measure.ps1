<#
.SYNOPSIS
  Phase 0-3 spike: measure a hello app's time-to-READY and memory footprint.

.DESCRIPTION
  Launches -Exe N times. Each run waits (polling every 5 ms) until the root
  process' main window title becomes "READY" (both hello apps set it right
  after the first painted frame), records ready_ms since process creation,
  waits -SettleMs, then sums WorkingSet64 / PrivateMemorySize64 over the whole
  process tree (root + every descendant, e.g. msedgewebview2.exe children),
  kills the tree, and pauses 1 s before the next run.

  Run 1 is reported separately as "cold-ish"; runs 2..N are summarised as warm
  (min / median / max). A true cold start is the first run after a reboot.

.PARAMETER Exe       Path to the executable (required).
.PARAMETER Label     Row label for CSV/Markdown. Default: exe base name.
.PARAMETER Runs      Number of launches. Default 10.
.PARAMETER SettleMs  Wait after READY before sampling memory. Default 2000.
.PARAMETER OutCsv    Optional CSV to append rows to (header written if new).
.PARAMETER TimeoutSec Seconds to wait for READY before marking the run failed. Default 30.

.EXAMPLE
  powershell -NoProfile -ExecutionPolicy Bypass -File spike/measure/measure.ps1 `
    -Exe spike/tauri-hello/target/release/tauri-hello.exe -Label tauri -Runs 10 `
    -OutCsv spike/measure/results.csv
#>
[CmdletBinding()]
param(
    [string]$Exe,
    [string]$Label = '',
    [int]$Runs = 10,
    [int]$SettleMs = 2000,
    [string]$OutCsv = '',
    [int]$TimeoutSec = 30
)

$ErrorActionPreference = 'Stop'
$inv = [System.Globalization.CultureInfo]::InvariantCulture

# ---------------------------------------------------------------- arguments --
if ([string]::IsNullOrWhiteSpace($Exe)) {
    Write-Host 'Usage: measure.ps1 -Exe <path> [-Label <name>] [-Runs 10] [-SettleMs 2000] [-OutCsv <path>] [-TimeoutSec 30]'
    exit 2
}
$resolved = Resolve-Path -LiteralPath $Exe -ErrorAction SilentlyContinue
if (-not $resolved) {
    Write-Host "ERROR: exe not found: $Exe"
    exit 2
}
$exePath = $resolved.Path
$exeDir = Split-Path -Parent $exePath
if ([string]::IsNullOrWhiteSpace($Label)) {
    $Label = [System.IO.Path]::GetFileNameWithoutExtension($exePath)
}
if ($Runs -lt 1) { $Runs = 1 }
if ($SettleMs -lt 0) { $SettleMs = 0 }
if ($TimeoutSec -lt 1) { $TimeoutSec = 1 }

# ---------------------------------------------------------------- helpers ----
function Format-Num {
    param($Value, [int]$Decimals = 0)
    if ($null -eq $Value) { return '' }
    return ([double]$Value).ToString('F' + $Decimals, $inv)
}

function Get-ProcessTree {
    # Returns the Win32_Process rows for RootId and all of its descendants
    # (breadth-first, root first). Guards against PID reuse by requiring a
    # child to have been created no earlier than its parent.
    param([int]$RootId)

    $all = @(Get-CimInstance -ClassName Win32_Process -ErrorAction SilentlyContinue)
    $byId = @{}
    $byParent = @{}
    foreach ($row in $all) {
        $id = [int]$row.ProcessId
        $parentId = [int]$row.ParentProcessId
        $byId[$id] = $row
        if (-not $byParent.ContainsKey($parentId)) {
            $byParent[$parentId] = New-Object System.Collections.ArrayList
        }
        [void]$byParent[$parentId].Add($row)
    }

    $result = New-Object System.Collections.ArrayList
    $seen = @{}
    $queue = New-Object System.Collections.Queue
    $queue.Enqueue($RootId)
    while ($queue.Count -gt 0) {
        $id = [int]$queue.Dequeue()
        if ($seen.ContainsKey($id)) { continue }
        $seen[$id] = $true
        if (-not $byId.ContainsKey($id)) { continue }
        $node = $byId[$id]
        [void]$result.Add($node)
        if (-not $byParent.ContainsKey($id)) { continue }
        foreach ($child in $byParent[$id]) {
            $childId = [int]$child.ProcessId
            if ($childId -eq $id) { continue }
            $plausible = $true
            if ($null -ne $child.CreationDate -and $null -ne $node.CreationDate) {
                $plausible = ($child.CreationDate -ge $node.CreationDate)
            }
            if ($plausible) { $queue.Enqueue($childId) }
        }
    }
    return ,$result
}

function Stop-ProcessTree {
    # Kill descendants first (deepest first), the root last, then wait until
    # every PID is gone (up to 10 s).
    param($Tree, [int]$RootId)

    $ids = New-Object System.Collections.ArrayList
    foreach ($node in $Tree) {
        $id = [int]$node.ProcessId
        if (-not $ids.Contains($id)) { [void]$ids.Add($id) }
    }
    if (-not $ids.Contains($RootId)) { [void]$ids.Add($RootId) }

    $children = New-Object System.Collections.ArrayList
    foreach ($id in $ids) { if ($id -ne $RootId) { [void]$children.Add($id) } }
    $children.Reverse()
    foreach ($id in $children) { Stop-Process -Id $id -Force -ErrorAction SilentlyContinue }
    Stop-Process -Id $RootId -Force -ErrorAction SilentlyContinue

    $deadline = [DateTime]::Now.AddSeconds(10)
    while ([DateTime]::Now -lt $deadline) {
        $left = @(Get-Process -Id ([int[]]$ids.ToArray()) -ErrorAction SilentlyContinue)
        if ($left.Count -eq 0) { return $true }
        Start-Sleep -Milliseconds 50
    }
    return $false
}

function Invoke-OneRun {
    param([int]$Run)

    $timestamp = Get-Date -Format 'yyyy-MM-ddTHH:mm:ss'
    $t0 = Get-Date
    $p = $null
    try {
        $p = Start-Process -FilePath $exePath -WorkingDirectory $exeDir -PassThru
    } catch {
        return [pscustomobject]@{
            run = $Run; status = 'launch-failed'; ready_ms = $null
            procs = 0; ws_mb = $null; private_mb = $null; timestamp = $timestamp
        }
    }

    # 1. poll until the main window title is READY ------------------------
    $status = 'ok'
    $readyAt = $null
    $timeoutMs = $TimeoutSec * 1000
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    while ($true) {
        $exited = $false
        try { $exited = $p.HasExited } catch { $exited = $true }
        if ($exited) { $status = 'exited-early'; break }

        $title = ''
        try { $p.Refresh(); $title = $p.MainWindowTitle } catch { $title = '' }
        if ($title -eq 'READY') { $readyAt = [DateTime]::Now; break }

        if ($sw.ElapsedMilliseconds -ge $timeoutMs) { $status = 'timeout'; break }
        Start-Sleep -Milliseconds 5
    }

    $startAt = $t0
    try { $startAt = $p.StartTime } catch { $startAt = $t0 }
    $readyMs = $null
    if ($null -ne $readyAt) {
        $readyMs = [math]::Round(($readyAt - $startAt).TotalMilliseconds, 0)
    }

    # 2. settle, then sample the whole process tree ---------------------
    $procs = 0
    $wsMb = $null
    $privMb = $null
    $alive = $false
    try { $alive = -not $p.HasExited } catch { $alive = $false }

    if ($alive) {
        if ($status -eq 'ok' -and $SettleMs -gt 0) { Start-Sleep -Milliseconds $SettleMs }

        $tree = Get-ProcessTree -RootId $p.Id
        [long]$ws = 0
        [long]$priv = 0
        foreach ($node in $tree) {
            try {
                $gp = Get-Process -Id ([int]$node.ProcessId) -ErrorAction Stop
                $ws += $gp.WorkingSet64
                $priv += $gp.PrivateMemorySize64
                $procs++
            } catch { }
        }
        if ($procs -gt 0) {
            $wsMb = [math]::Round($ws / 1MB, 1)
            $privMb = [math]::Round($priv / 1MB, 1)
        }

        # 3. kill the tree ----------------------------------------------
        $clean = Stop-ProcessTree -Tree $tree -RootId $p.Id
        if (-not $clean) { Write-Host "  warning: run $Run left processes behind after 10 s" }
    }

    return [pscustomobject]@{
        run = $Run; status = $status; ready_ms = $readyMs
        procs = $procs; ws_mb = $wsMb; private_mb = $privMb; timestamp = $timestamp
    }
}

function Get-Stats {
    param([double[]]$Values)
    $sorted = @($Values | Sort-Object)
    $n = $sorted.Count
    if ($n -eq 0) { return $null }
    if ($n % 2 -eq 1) {
        $median = $sorted[[int][math]::Floor($n / 2)]
    } else {
        $median = ($sorted[($n / 2) - 1] + $sorted[$n / 2]) / 2
    }
    return [pscustomobject]@{ n = $n; min = $sorted[0]; median = $median; max = $sorted[$n - 1] }
}

function Format-StatCells {
    param($Stats, [int]$Decimals)
    if ($null -eq $Stats) { return @('-', '-', '-') }
    return @(
        (Format-Num $Stats.min $Decimals),
        (Format-Num $Stats.median $Decimals),
        (Format-Num $Stats.max $Decimals)
    )
}

# ---------------------------------------------------------------- main -------
Write-Host ''
Write-Host "measure.ps1  label=$Label  runs=$Runs  settle=${SettleMs}ms  timeout=${TimeoutSec}s"
Write-Host "  exe: $exePath"
Write-Host ''

$results = New-Object System.Collections.ArrayList
for ($run = 1; $run -le $Runs; $run++) {
    $r = Invoke-OneRun -Run $run
    [void]$results.Add($r)
    Write-Host ("  run {0,2}  {1,-12} ready={2,6} ms  procs={3,2}  ws={4,7} MB  private={5,7} MB" -f `
        $r.run, $r.status, (Format-Num $r.ready_ms 0), $r.procs, (Format-Num $r.ws_mb 1), (Format-Num $r.private_mb 1))
    if ($run -lt $Runs) { Start-Sleep -Seconds 1 }
}

# per-run table
Write-Host ''
$results | Format-Table run, status, ready_ms, procs, ws_mb, private_mb, timestamp -AutoSize | Out-String | Write-Host

# summary
$cold = $results[0]
$warmOk = @($results | Where-Object { $_.run -ge 2 -and $_.status -eq 'ok' })
$failed = @($results | Where-Object { $_.status -ne 'ok' })

$stReady = Get-Stats -Values @($warmOk | ForEach-Object { [double]$_.ready_ms })
$stWs    = Get-Stats -Values @($warmOk | Where-Object { $null -ne $_.ws_mb } | ForEach-Object { [double]$_.ws_mb })
$stPriv  = Get-Stats -Values @($warmOk | Where-Object { $null -ne $_.private_mb } | ForEach-Object { [double]$_.private_mb })
$stProcs = Get-Stats -Values @($warmOk | Where-Object { $_.procs -gt 0 } | ForEach-Object { [double]$_.procs })

$coldReady = if ($cold.status -eq 'ok') { Format-Num $cold.ready_ms 0 } else { $cold.status }
$coldWs    = if ($null -ne $cold.ws_mb) { Format-Num $cold.ws_mb 1 } else { '-' }
$coldPriv  = if ($null -ne $cold.private_mb) { Format-Num $cold.private_mb 1 } else { '-' }
$coldProcs = if ($cold.procs -gt 0) { [string]$cold.procs } else { '-' }

$readyCells = Format-StatCells $stReady 0
$wsCells    = Format-StatCells $stWs 1
$privCells  = Format-StatCells $stPriv 1
$procCells  = Format-StatCells $stProcs 0

Write-Host "Summary [$Label]"
Write-Host ("  cold-ish (first run):  ready={0} ms  ws={1} MB  private={2} MB  procs={3}" -f $coldReady, $coldWs, $coldPriv, $coldProcs)
if ($warmOk.Count -gt 0) {
    Write-Host ("  warm (runs 2..{0}, n={1}):" -f $Runs, $warmOk.Count)
    Write-Host ("    ready_ms    min={0,8}  median={1,8}  max={2,8}" -f $readyCells[0], $readyCells[1], $readyCells[2])
    Write-Host ("    ws_mb       min={0,8}  median={1,8}  max={2,8}" -f $wsCells[0], $wsCells[1], $wsCells[2])
    Write-Host ("    private_mb  min={0,8}  median={1,8}  max={2,8}" -f $privCells[0], $privCells[1], $privCells[2])
    Write-Host ("    procs       min={0,8}  median={1,8}  max={2,8}" -f $procCells[0], $procCells[1], $procCells[2])
} else {
    Write-Host '  warm: no successful runs 2..N'
}
if ($failed.Count -gt 0) {
    Write-Host ("  failed runs: {0} ({1})" -f $failed.Count, (($failed | ForEach-Object { "#$($_.run)=$($_.status)" }) -join ', '))
}

# markdown
Write-Host ''
Write-Host '--- Markdown ---'
Write-Host ("| {0} | cold-ish (run 1) | warm min | warm median | warm max | warm n |" -f $Label)
Write-Host '|---|---:|---:|---:|---:|---:|'
Write-Host ("| ready_ms | {0} | {1} | {2} | {3} | {4} |" -f $coldReady, $readyCells[0], $readyCells[1], $readyCells[2], $warmOk.Count)
Write-Host ("| ws_mb | {0} | {1} | {2} | {3} | {4} |" -f $coldWs, $wsCells[0], $wsCells[1], $wsCells[2], $warmOk.Count)
Write-Host ("| private_mb | {0} | {1} | {2} | {3} | {4} |" -f $coldPriv, $privCells[0], $privCells[1], $privCells[2], $warmOk.Count)
Write-Host ("| procs | {0} | {1} | {2} | {3} | {4} |" -f $coldProcs, $procCells[0], $procCells[1], $procCells[2], $warmOk.Count)
Write-Host ''
Write-Host ("exe: ``{0}``  runs={1}  settle={2} ms  measured {3}" -f $exePath, $Runs, $SettleMs, (Get-Date -Format 'yyyy-MM-dd HH:mm'))

# csv
if (-not [string]::IsNullOrWhiteSpace($OutCsv)) {
    $csvDir = Split-Path -Parent $OutCsv
    if ($csvDir -and -not (Test-Path -LiteralPath $csvDir)) {
        New-Item -ItemType Directory -Path $csvDir | Out-Null
    }
    if (-not (Test-Path -LiteralPath $OutCsv)) {
        Set-Content -LiteralPath $OutCsv -Value 'label,run,ready_ms,procs,ws_mb,private_mb,timestamp' -Encoding UTF8
    }
    foreach ($r in $results) {
        $line = '{0},{1},{2},{3},{4},{5},{6}' -f `
            $Label, $r.run, (Format-Num $r.ready_ms 0), $r.procs, (Format-Num $r.ws_mb 1), (Format-Num $r.private_mb 1), $r.timestamp
        Add-Content -LiteralPath $OutCsv -Value $line -Encoding UTF8
    }
    Write-Host ''
    Write-Host ("appended {0} rows to {1}" -f $results.Count, (Resolve-Path -LiteralPath $OutCsv).Path)
}

if ($failed.Count -eq $results.Count) { exit 1 }
exit 0
