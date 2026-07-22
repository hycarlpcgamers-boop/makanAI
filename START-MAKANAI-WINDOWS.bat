@echo off
setlocal
cd /d "%~dp0"
title MakanAI World V9.1 Launcher
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0START-MAKANAI.ps1"
if errorlevel 1 (
  echo.
  echo MakanAI did not start. Read AI-SETUP-GUIDE.txt.
  pause
)
endlocal
