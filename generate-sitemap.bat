@echo off
setlocal EnableExtensions
title MISSAV-J Sitemap Generator v4.0
cd /d "%~dp0"
if errorlevel 1 (
  echo [ERROR] Cannot open the project directory.
  exit /b 1
)

echo ====================================================
echo   MISSAV-J Deterministic Sitemap Generator v4.0
echo   GitHub Actions checks production sitemaps every day.
echo   This command only generates and validates local files.
echo ====================================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js was not found in PATH.
  exit /b 1
)

py -3 --version >nul 2>nul
if not errorlevel 1 (
  set "PYTHON_CMD=py -3"
  goto python_ready
)

python -c "import sys; sys.exit(0 if sys.version_info[0] == 3 else 1)" >nul 2>nul
if not errorlevel 1 (
  set "PYTHON_CMD=python"
  goto python_ready
)

echo [ERROR] Python 3 was not found; no sitemap files were changed.
exit /b 1

:python_ready
node .\generate_sitemap.js
if errorlevel 1 (
  echo [ERROR] Sitemap generation failed.
  exit /b 1
)

%PYTHON_CMD% .\scripts\validate_sitemaps.py --dir .\sitemaps
if errorlevel 1 (
  echo [ERROR] Sitemap validation failed.
  exit /b 1
)
echo [SUCCESS] Local sitemap generation and validation completed.
exit /b 0
