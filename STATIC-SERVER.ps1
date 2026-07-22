param(
  [Parameter(Mandatory=$true)][int]$Port,
  [Parameter(Mandatory=$true)][string]$Root
)

$ErrorActionPreference = 'Stop'
$Root = [System.IO.Path]::GetFullPath($Root)
$Mime = @{
  '.html' = 'text/html; charset=utf-8'
  '.js'   = 'application/javascript; charset=utf-8'
  '.css'  = 'text/css; charset=utf-8'
  '.json' = 'application/json; charset=utf-8'
  '.png'  = 'image/png'
  '.jpg'  = 'image/jpeg'
  '.jpeg' = 'image/jpeg'
  '.svg'  = 'image/svg+xml'
  '.webp' = 'image/webp'
  '.ico'  = 'image/x-icon'
  '.txt'  = 'text/plain; charset=utf-8'
}

function Send-Response($Stream, [int]$Status, [string]$StatusText, [string]$ContentType, [byte[]]$Body) {
  $Header = "HTTP/1.1 $Status $StatusText`r`nContent-Type: $ContentType`r`nContent-Length: $($Body.Length)`r`nCache-Control: no-cache`r`nConnection: close`r`n`r`n"
  $HeaderBytes = [System.Text.Encoding]::ASCII.GetBytes($Header)
  $Stream.Write($HeaderBytes, 0, $HeaderBytes.Length)
  if ($Body.Length -gt 0) { $Stream.Write($Body, 0, $Body.Length) }
  $Stream.Flush()
}

$Listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $Port)
$Listener.Start()

Clear-Host
Write-Host 'MakanAI World V9 server is running.' -ForegroundColor Green
Write-Host "Address: http://127.0.0.1:$Port/" -ForegroundColor Cyan
Write-Host 'Keep this window open. Press Ctrl+C to stop.' -ForegroundColor Yellow
Write-Host ''

try {
  while ($true) {
    $Client = $Listener.AcceptTcpClient()
    try {
      $Stream = $Client.GetStream()
      $Reader = New-Object System.IO.StreamReader($Stream, [System.Text.Encoding]::ASCII, $false, 4096, $true)
      $RequestLine = $Reader.ReadLine()
      if ([string]::IsNullOrWhiteSpace($RequestLine)) {
        $Client.Close(); continue
      }
      while ($true) {
        $Line = $Reader.ReadLine()
        if ([string]::IsNullOrEmpty($Line)) { break }
      }

      $Parts = $RequestLine.Split(' ')
      $Method = $Parts[0]
      $RawPath = if ($Parts.Length -gt 1) { $Parts[1] } else { '/' }
      $RawPath = $RawPath.Split('?')[0]
      $Decoded = [System.Uri]::UnescapeDataString($RawPath)
      if ($Decoded -eq '/') { $Decoded = '/index.html' }
      $Relative = $Decoded.TrimStart('/').Replace('/', [System.IO.Path]::DirectorySeparatorChar)
      $FilePath = [System.IO.Path]::GetFullPath((Join-Path $Root $Relative))

      if (-not $FilePath.StartsWith($Root, [System.StringComparison]::OrdinalIgnoreCase)) {
        $Body = [System.Text.Encoding]::UTF8.GetBytes('Forbidden')
        Send-Response $Stream 403 'Forbidden' 'text/plain; charset=utf-8' $Body
        continue
      }

      if ([System.IO.Directory]::Exists($FilePath)) { $FilePath = Join-Path $FilePath 'index.html' }
      if (-not [System.IO.File]::Exists($FilePath)) { $FilePath = Join-Path $Root 'index.html' }

      if (-not [System.IO.File]::Exists($FilePath)) {
        $Body = [System.Text.Encoding]::UTF8.GetBytes('Not found')
        Send-Response $Stream 404 'Not Found' 'text/plain; charset=utf-8' $Body
        continue
      }

      $Extension = [System.IO.Path]::GetExtension($FilePath).ToLowerInvariant()
      $ContentType = if ($Mime.ContainsKey($Extension)) { $Mime[$Extension] } else { 'application/octet-stream' }
      $Body = [System.IO.File]::ReadAllBytes($FilePath)
      Send-Response $Stream 200 'OK' $ContentType $Body
    } catch {
      try {
        $Body = [System.Text.Encoding]::UTF8.GetBytes('Server error')
        Send-Response $Stream 500 'Internal Server Error' 'text/plain; charset=utf-8' $Body
      } catch {}
    } finally {
      $Client.Close()
    }
  }
} finally {
  $Listener.Stop()
}
