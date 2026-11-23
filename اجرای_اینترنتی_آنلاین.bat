@echo off
chcp 65001 >nul
title مرکز آپدیت سپهریار - تونل اینترنتی سراسری
cd /d "%~dp0"
cls
echo ======================================================================
echo    ایجاد لینک اینترنتی سراسری برای مرکز آپدیت سپهریار (Cloudflare)
echo    پشتیبانی از دانلود و آپلود تا ۱ گیگابایت بدون محدودیت
echo ======================================================================
echo.
echo در حال اتصال به شبکه جهانی Cloudflare...
echo پس از چند ثانیه، لینک عمومی (https://...trycloudflare.com) نمایش داده می شود.
echo.

set "CLOUDFLARED="
if exist "D:\ai app\cloudflared.exe" set "CLOUDFLARED=D:\ai app\cloudflared.exe"
if "%CLOUDFLARED%"=="" if exist "D:\Projects\ai app\cloudflared.exe" set "CLOUDFLARED=D:\Projects\ai app\cloudflared.exe"
if "%CLOUDFLARED%"=="" set "CLOUDFLARED=cloudflared"

"%CLOUDFLARED%" tunnel --protocol http2 --url http://127.0.0.1:3000
pause

