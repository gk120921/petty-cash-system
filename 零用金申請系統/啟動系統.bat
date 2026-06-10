@echo off
chcp 65001 >nul
setlocal
title Petty Cash Launcher

cd /d "%~dp0"

echo ==========================================
echo    Petty Cash System Launcher
echo ==========================================
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

echo [1/4] Stopping existing Node.js processes...
taskkill /F /IM node.exe /T >nul 2>nul
timeout /t 1 /nobreak >nul

echo [2/4] Starting backend on port 3000...
if not exist "%~dp0backend\server.js" (
    echo [ERROR] Cannot find backend\server.js
    pause
    exit /b 1
)
start "PettyCash Backend" cmd /k "cd /d ""%~dp0backend"" && node server.js"

echo [3/4] Starting frontend on port 5176...
if not exist "%~dp0frontend\package.json" (
    echo [ERROR] Cannot find frontend\package.json
    pause
    exit /b 1
)
start "PettyCash Frontend" cmd /k "cd /d ""%~dp0frontend"" && npm run dev -- --host"

echo [4/4] Waiting for services...
timeout /t 5 /nobreak >nul

echo Opening browser...
start "" "http://localhost:5176"

echo.
echo ------------------------------------------
echo Petty Cash should now be available at:
echo.
echo Local browser: http://localhost:5176
echo API server:    http://localhost:3000
echo.
echo For another PC on the same LAN:
echo http://SERVER-IP:5176
echo.
echo Keep both terminal windows open while using the system.
echo ------------------------------------------
echo.
pause
