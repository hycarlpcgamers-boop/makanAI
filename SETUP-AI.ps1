$ErrorActionPreference = 'Stop'
$ProjectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ProjectDir

function Stop-WithMessage([string]$Message) {
  Write-Host ''
  Write-Host $Message -ForegroundColor Red
  Read-Host 'Press Enter to close'
  exit 1
}

Write-Host ''
Write-Host '=========================================' -ForegroundColor Cyan
Write-Host ' MakanAI World V9.1 - Real AI Setup' -ForegroundColor Cyan
Write-Host '=========================================' -ForegroundColor Cyan
Write-Host ''
Write-Host 'Your API key will be stored only in the local .env file.' -ForegroundColor Yellow
Write-Host 'Never upload or share the .env file.' -ForegroundColor Yellow
Write-Host ''

$Node = Get-Command node.exe -ErrorAction SilentlyContinue
$Npm = Get-Command npm.cmd -ErrorAction SilentlyContinue
if (-not $Node -or -not $Npm) {
  Write-Host 'Node.js LTS is required for real AI mode.' -ForegroundColor Yellow
  $Winget = Get-Command winget.exe -ErrorAction SilentlyContinue
  if ($Winget) {
    $Choice = Read-Host 'Install Node.js LTS automatically using winget? (Y/N)'
    if ($Choice -match '^[Yy]') {
      & winget.exe install --id OpenJS.NodeJS.LTS --exact --accept-package-agreements --accept-source-agreements
      Write-Host ''
      Write-Host 'Node.js installation requested. Close this window, then run SETUP-AI-WINDOWS.bat again.' -ForegroundColor Green
      Read-Host 'Press Enter to close'
      exit 0
    }
  }
  Stop-WithMessage 'Install Node.js LTS from nodejs.org, restart Windows Terminal, then run this setup again.'
}

$SecureKey = Read-Host 'Paste your OpenAI API key (the input is hidden)' -AsSecureString
$Pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecureKey)
try {
  $ApiKey = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($Pointer)
} finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($Pointer)
}

if ([string]::IsNullOrWhiteSpace($ApiKey) -or -not $ApiKey.StartsWith('sk-') -or $ApiKey.Length -lt 20) {
  Stop-WithMessage 'That does not look like a valid OpenAI API key.'
}

$Model = Read-Host 'Model name [press Enter for gpt-5]'
if ([string]::IsNullOrWhiteSpace($Model)) { $Model = 'gpt-5' }

$EnvContent = @(
  "OPENAI_API_KEY=$ApiKey",
  "OPENAI_MODEL=$Model",
  'PORT=8000'
) -join [Environment]::NewLine
[IO.File]::WriteAllText((Join-Path $ProjectDir '.env'), $EnvContent, [Text.UTF8Encoding]::new($false))

Write-Host ''
Write-Host 'Installing server packages...' -ForegroundColor Cyan
& npm.cmd install --no-audit --no-fund
if ($LASTEXITCODE -ne 0) { Stop-WithMessage 'npm install failed. Check your internet connection and try again.' }

Write-Host ''
Write-Host 'AI setup is complete.' -ForegroundColor Green
Write-Host 'Starting the secure AI server...' -ForegroundColor Green
& (Join-Path $ProjectDir 'START-MAKANAI-AI.ps1')
