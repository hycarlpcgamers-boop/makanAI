@echo off
setlocal
cd /d "%~dp0"
title MakanAI Real AI Server
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0START-MAKANAI-AI.ps1"
if errorlevel 1 (
  echo.
  echo The AI server did not start. Run SETUP-AI-WINDOWS.bat first.
  pause
)
endlocal
