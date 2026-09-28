@echo off
setlocal
title MISSAV-J Sitemap Generator v4.0
cd /d "%~dp0"

echo ====================================================
echo   MISSAV-J Deterministic Sitemap Generator v4.0
echo   GitHub Actions updates production every Sunday.
echo   This command is an emergency local fallback only.
echo ====================================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js was not found in PATH.
  exit /b 1
)

node .\generate_sitemap.js
if errorlevel 1 exit /b %ERRORLEVEL%

where py >nul 2>nul
if not errorlevel 1 (
  py -3 .\scripts\validate_sitemaps.py --dir .\sitemaps
  exit /b %ERRORLEVEL%
)

where python >nul 2>nul
if not errorlevel 1 (
  python .\scripts\validate_sitemaps.py --dir .\sitemaps
  exit /b %ERRORLEVEL%
)

echo [ERROR] Python 3 was not found; sitemap XML was generated but not validated.
exit /b 1
