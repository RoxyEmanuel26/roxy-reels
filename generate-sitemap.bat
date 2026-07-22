@echo off
setlocal enabledelayedexpansion
title MISSAV-J — Smart Sitemap Generator v1.0
color 0F

:: Pastikan direktori kerja aktif adalah tempat script berada
cd /d "%~dp0"

echo ====================================================
echo   MISSAV-J Smart Sitemap Generator v1.0
echo   Multi-Type: Pages, Actors, Categories, Studios, Videos
echo ====================================================
echo.

:: 1. Verifikasi File Script
if not exist ".\generate_sitemap.js" (
    color 0C
    echo [ERROR] File 'generate_sitemap.js' tidak ditemukan di direktori aktif!
    echo Silakan pastikan Anda menjalankan file batch ini dari folder ini.
    echo.
    pause
    exit /b 1
)

:: 2. Cek apakah Git terinstal
where git >nul 2>nul
set GIT_AVAILABLE=%ERRORLEVEL%

echo [*] Memulai proses generate sitemap...
echo [*] Waktu Mulai: %DATE% %TIME%
echo.

:: Jalankan Node.js script
node .\generate_sitemap.js
set NODE_ERROR=%ERRORLEVEL%

echo.
if %NODE_ERROR% NEQ 0 (
    color 0C
    echo ====================================================
    echo   [ERROR] Terjadi kesalahan saat menjalankan script!
    echo ====================================================
    echo.
    pause
    exit /b %NODE_ERROR%
)

color 0A
echo ====================================================
echo   [SUCCESS] Pembuatan sitemap selesai dengan sukses!
echo ====================================================
echo Waktu Selesai: %DATE% %TIME%
echo.

:: 3. Tanya upload otomatis ke GitHub
if %GIT_AVAILABLE% EQU 0 (
    echo [SMART] Terdeteksi instalasi Git di komputer Anda.
    set /p CHOICE="Apakah Anda ingin meng-upload sitemap ke GitHub? (Y/N): "
    
    if /i "!CHOICE!"=="Y" (
        echo.
        
        echo [*] Menambahkan file sitemap ke git staging...
        git add sitemaps/
        
        echo [*] Membuat commit...
        git commit -m "chore(sitemap): auto-update sitemaps via generator script"
        
        echo [*] Melakukan push ke GitHub...
        git push
        
        if !ERRORLEVEL! EQU 0 (
            echo.
            echo [SUCCESS] Sitemap berhasil di-upload! Vercel akan otomatis men-deploy.
        ) else (
            color 0C
            echo.
            echo [WARNING] Gagal melakukan push. Silakan push manual nanti.
        )
    ) else (
        echo [*] Lewati proses upload otomatis.
    )
) else (
    echo [INFO] Git tidak ditemukan di PATH.
    echo Silakan commit dan push file sitemap baru secara manual.
)

echo.
echo Selesai! Menutup jendela dalam 5 detik...
timeout /t 5 >nul
