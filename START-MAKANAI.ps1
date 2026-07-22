$ErrorActionPreference = 'Stop'
$ProjectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ProjectDir

$EnvFile = Join-Path $ProjectDir '.env'
$Node = Get-Command node.exe -ErrorAction SilentlyContinue
$UseAI = $false
if ($Node -and (Test-Path $EnvFile)) {
  $EnvText = Get-Content $EnvFile -Raw
  if ($EnvText -match 'OPENAI_API_KEY=sk-.{15,}') { $UseAI = $true }
}

if ($UseAI) {
  Write-Host 'AI configuration detected. Starting Real AI mode...' -ForegroundColor Green
  & (Join-Path $ProjectDir 'START-MAKANAI-AI.ps1')
  exit $LASTEXITCODE
}

Write-Host 'Real AI is not configured. Starting normal demo mode.' -ForegroundColor Yellow
Write-Host 'Run SETUP-AI-WINDOWS.bat whenever you are ready to enable AI.' -ForegroundColor Yellow

function Test-PortAvailable([int]$Port) {
  try {
    $Listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $Port)
    $Listener.Start(); $Listener.Stop(); return $true
  } catch { return $false }
}

$Port = $null
foreach ($Candidate in 8000..8020) {
  if (Test-PortAvailable $Candidate) { $Port = $Candidate; break }
}
if (-not $Port) {
  Write-Host 'No free port was found between 8000 and 8020.' -ForegroundColor Red
  Read-Host 'Press Enter to close'; exit 1
}

$Url = "http://127.0.0.1:$Port/"
$ServerScript = Join-Path $ProjectDir 'STATIC-SERVER.ps1'
$PowerShell = (Get-Command powershell.exe -ErrorAction Stop).Source
$ServerProcess = Start-Process -FilePath $PowerShell -ArgumentList @(
  '-NoProfile','-ExecutionPolicy','Bypass','-File',"`"$ServerScript`"",'-Port',"$Port",'-Root',"`"$ProjectDir`""
) -WorkingDirectory $ProjectDir -PassThru -WindowStyle Normal

$Ready = $false
foreach ($Attempt in 1..40) {
  Start-Sleep -Milliseconds 250
  try {
    $Response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2
    if ($Response.StatusCode -eq 200) { $Ready = $true; break }
  } catch {
    if ($ServerProcess.HasExited) { break }
  }
}
if ($Ready) { Start-Process $Url; exit 0 }
Write-Host 'The local server could not start.' -ForegroundColor Red
Read-Host 'Press Enter to close'; exit 1
