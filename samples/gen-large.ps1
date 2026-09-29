<#
.SYNOPSIS
  samples/large/2mb.md, 10mb.md 생성 (결정적, UTF-8 without BOM, LF).
.DESCRIPTION
  대용량 렌더·바이트 보존 성능 확인용. 저장소에는 넣지 않는다 (.gitignore samples/large/).
  같은 스크립트를 다시 돌리면 같은 바이트가 나온다.
#>
param([string]$OutDir = (Join-Path $PSScriptRoot 'large'))

$ErrorActionPreference = 'Stop'
New-Item -ItemType Directory -Force $OutDir | Out-Null
$utf8 = New-Object System.Text.UTF8Encoding($false)

$block = @'
## 절 {0}

한글 문단 {0}. 바이트 보존 코어와 렌더러의 대용량 성능을 재기 위한 반복 문장이다. **굵게**, *기울임*, `코드`, [링크](https://example.com/{0}) 를 섞는다. 가나다라마바사아자차카타파하 abcdefghijklmnopqrstuvwxyz 0123456789.

- 항목 {0}-1
- 항목 {0}-2
  - 하위 {0}

| 열 | 값 |
|---|---|
| {0} | 값 {0} |

```text
코드 블록 {0}
```

> 인용 {0}

'@
$block = $block -replace "`r`n", "`n"

foreach ($t in @(@{ name = '2mb.md'; bytes = 2MB }, @{ name = '10mb.md'; bytes = 10MB })) {
    $sb = New-Object System.Text.StringBuilder
    $head = "# 대용량 샘플 $($t.name)`n`n생성: samples/gen-large.ps1`n`n"
    [void]$sb.Append($head)
    $bytes = $utf8.GetByteCount($head)
    $i = 0
    while ($bytes -lt $t.bytes) {
        $i++
        $chunk = $block -f $i
        [void]$sb.Append($chunk)
        $bytes += $utf8.GetByteCount($chunk)
    }
    $path = Join-Path $OutDir $t.name
    [System.IO.File]::WriteAllText($path, $sb.ToString(), $utf8)
    "{0}: {1:N0} bytes, {2} sections" -f $path, (Get-Item $path).Length, $i
}
