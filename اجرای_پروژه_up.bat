@echo off
chcp 65001 >nul
title پروژه UP - سرور پورت 3000
cd /d "%~dp0"
cls
echo ======================================================================
echo    راه‌اندازی پروژه UP روی پورت 3000 (لوکال و شبکه داخلی)
echo ======================================================================
"C:\Users\khodealidr\AppData\Local\OpenAI\Codex\runtimes\cua_node\9c26d707817e90a7\bin\node.exe" scripts/run-framework.mjs dev -H 0.0.0.0 --port 3000
pause
