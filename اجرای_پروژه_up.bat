@echo off
chcp 65001 >nul
title پروژه UP - مرکز آپدیت سپهریار (پورت 3000)
cd /d "%~dp0"
cls
echo ======================================================================
echo    راه‌اندازی مرکز آپدیت سپهریار روی پورت 3000 (پشتیبانی تا 1 گیگابایت)
echo ======================================================================

set "NODE_EXE="
for /d %%D in ("%LOCALAPPDATA%\OpenAI\Codex\runtimes\cua_node\*") do (
    if exist "%%D\bin\node.exe" set "NODE_EXE=%%D\bin\node.exe"
)
if "%NODE_EXE%"=="" set "NODE_EXE=node"

"%NODE_EXE%" scripts/run-framework.mjs dev -H 0.0.0.0 --port 3000
pause
