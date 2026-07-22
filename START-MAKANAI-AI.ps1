$ErrorActionPreference = 'Stop'
$ProjectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ProjectDir

function Test-PortAvailable([int]$Port) {
  try {
    $Listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $Port)
    $Listener.Start(); $Listener.Stop(); return $true
  } catch { return $false }
}
function Fail([string]$Message) {
  Write-Host ''
  Write-Host $Message -ForegroundColor Red
  Read-Host 'Press Enter to close'
  exit 1
}

$Node = Get-Command node.exe -ErrorAction SilentlyContinue
$Npm = Get-Command npm.cmd -ErrorAction SilentlyContinue
if (-not $Node -or -not $Npm) { Fail 'Node.js is not installed. Run SETUP-AI-WINDOWS.bat first.' }

$EnvFile = Join-Path $ProjectDir '.env'
if (-not (Test-Path $EnvFile)) { Fail 'AI is not configured. Run SETUP-AI-WINDOWS.bat first.' }
$EnvText = Get-Content $EnvFile -Raw
if ($EnvText -notmatch 'OPENAI_API_KEY=sk-.{15,}') { Fail 'The .env file does not contain a valid API key. Run AI setup again.' }

if (-not (Test-Path (Join-Path $ProjectDir 'node_modules'))) {
  Write-Host 'Installing packages for first use...' -ForegroundColor Cyan
  & npm.cmd install --no-audit --no-fund
  if ($LASTEXITCODE -ne 0) { Fail 'npm install failed.' }
}

$Port = $null
foreach ($Candidate in 8000..8020) {
  if (Test-PortAvailable $Candidate) { $Port = $Candidate; break }
}
if (-not $Port) { Fail 'No free port was found between 8000 and 8020.' }

$env:PORT = "$Port"
$Url = "http://127.0.0.1:$Port/"
$StatusUrl = "${Url}api/ai-status"

Write-Host ''
Write-Host 'Starting MakanAI Real AI Server...' -ForegroundColor Cyan
Write-Host "Address: $Url"
Write-Host 'Keep the Node.js server window open while using AI.' -ForegroundColor Yellow

$ServerProcess = Start-Process -FilePath $Node.Source -ArgumentList @('server.js') -WorkingDirectory $ProjectDir -PassThru -WindowStyle Normal
$Ready = $false
foreach ($Attempt in 1..60) {
  Start-Sleep -Milliseconds 350
  try {
    $Response = Invoke-RestMethod -Uri $StatusUrl -TimeoutSec 2
    if ($Response.configured -eq $true) { $Ready = $true; break }
  } catch {
    if ($ServerProcess.HasExited) { break }
  }
}

if (-not $Ready) {
  if (-not $ServerProcess.HasExited) { Stop-Process -Id $ServerProcess.Id -Force -ErrorAction SilentlyContinue }
  Fail 'The AI server could not start. Check the Node.js window for the error.'
}

Start-Process $Url
Write-Host ''
Write-Host 'MakanAI opened in REAL AI mode.' -ForegroundColor Green
Write-Host 'Inside the app, the header should show: AI connected.' -ForegroundColor Green
Start-Sleep -Seconds 2
exit 0
