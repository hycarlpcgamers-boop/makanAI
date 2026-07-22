@echo off
setlocal
cd /d "%~dp0"
title MakanAI Real AI Setup
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0SETUP-AI.ps1"
if errorlevel 1 (
  echo.
  echo AI setup did not finish. Read AI-SETUP-GUIDE.txt.
  pause
)
endlocal
