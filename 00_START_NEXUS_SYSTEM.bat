@echo off
<<<<<<< HEAD
chcp 65001 >nul
setlocal
title Nexus ERP System - Regional Launcher

cd /d "%~dp0"

echo ==================================================
echo    Nexus ERP System - Taiwan / India Launcher
echo ==================================================
echo.

where node >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH.
    echo Install Node.js 20 LTS first, then run this launcher again.
    pause
    exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
    echo [ERROR] npm is not installed or not in PATH.
    echo Install Node.js 20 LTS first, then run this launcher again.
    pause
    exit /b 1
)

echo [1/5] Stopping existing Node.js processes...
taskkill /F /IM node.exe /T >nul 2>nul
timeout /t 2 /nobreak >nul

echo [2/5] Starting main portal backend...
if exist "%~dp0backend\server.js" (
    start "Nexus Main Backend" cmd /k "cd /d ""%~dp0backend"" && node server.js"
) else (
    echo [WARN] backend\server.js not found.
)

echo [3/5] Starting main portal frontend...
if exist "%~dp0frontend\package.json" (
    start "Nexus Main Frontend" cmd /k "cd /d ""%~dp0frontend"" && npm run dev -- --host"
) else (
    echo [WARN] frontend\package.json not found.
)

echo [4/5] Starting module launchers...
if exist "%~dp0採購審查流程系統\啟動系統.bat" (
    start "Procurement Launcher" cmd /c "cd /d ""%~dp0採購審查流程系統"" && call ""啟動系統.bat"""
) else (
    echo [WARN] 採購審查流程系統\啟動系統.bat not found.
)

if exist "%~dp0零用金申請系統\啟動系統.bat" (
    start "Petty Cash Launcher" cmd /c "cd /d ""%~dp0零用金申請系統"" && call ""啟動系統.bat"""
) else (
    echo [WARN] 零用金申請系統\啟動系統.bat not found.
)

if exist "%~dp0印度採購管理系統\啟動系統.bat" (
    start "India WMS Launcher" cmd /c "cd /d ""%~dp0印度採購管理系統"" && call ""啟動系統.bat"""
) else (
    echo [WARN] 印度採購管理系統\啟動系統.bat not found.
)

echo [5/5] Waiting for services to initialize...
=======
title Nexus ERP System - One Click Startup
chcp 65001 >nul

echo ==================================================
echo    Nexus ERP System Integration - Launcher
echo ==================================================
echo.
echo [1/3] Terminating any existing Node.js processes...
taskkill /F /IM node.exe /T 2>nul
timeout /t 2 /nobreak >nul

echo [2/3] Starting all modules (Backends and Frontends)...
echo       This will open in a single terminal using concurrently.
echo.

:: Start the system
start "Nexus-Core-System" cmd /c "npm.cmd start"

echo [3/3] Waiting for servers to initialize...
>>>>>>> bbd756e05194dd7d7ea507746d11df41652b91cc
timeout /t 8 /nobreak >nul

echo.
echo ==================================================
<<<<<<< HEAD
echo    Launch started
echo ==================================================
echo Main Portal:    http://localhost:5173
echo Procurement:    http://localhost:5173 or its module window
echo Petty Cash:     http://localhost:5176
echo India WMS:      check the WMS window after startup
echo.
echo Notes:
echo - Use localhost on the same computer in Taiwan or India.
echo - For another PC on the same LAN, use that server PC's IP address.
echo - Keep the opened terminal windows running.
echo.
pause
=======
echo    System is now starting!
echo ==================================================
echo.
echo Main Portal:    http://localhost:5173
echo Procurement:    http://localhost:5175
echo WMS System:     http://localhost:5174
echo Petty Cash:     http://localhost:5176
echo.
echo Opening Main Portal in your browser...
start http://localhost:5173

echo.
echo Done! Please keep the other terminal window open.
echo Press any key to close this launcher...
pause >nul
>>>>>>> bbd756e05194dd7d7ea507746d11df41652b91cc
