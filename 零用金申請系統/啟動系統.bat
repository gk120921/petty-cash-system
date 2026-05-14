@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
title PettyCash Launcher

echo ==========================================
echo    Petty Cash System - LAN Mode
echo ==========================================

:: 1. Cleanup
echo [1/3] Cleaning up old processes...
taskkill /F /IM node.exe /T 2>nul
timeout /t 1 /nobreak >nul

:: 2. Start Backend
echo [2/3] Starting Backend (Port 3000)...
cd /d "%~dp0"
if not exist "backend\server.js" (
    echo [ERROR] Cannot find backend\server.js
    pause
    exit
)
start "PettyCash-Backend" /min cmd /c "node backend/server.js > server_log.txt 2>&1"

:: 3. Start Frontend
echo [3/3] Starting Frontend (Port 8080)...
if not exist "frontend" (
    echo [ERROR] Cannot find frontend folder
    pause
    exit
)
cd /d "%~dp0\frontend"
start "PettyCash-Frontend" /min cmd /c "npm run dev > ../frontend_log.txt 2>&1"

:: 4. Info
timeout /t 5 /nobreak >nul
echo.
echo ------------------------------------------
echo System started! Use these URLs to connect:
echo.
echo Local:   http://localhost:8080
echo Network: http://192.168.96.93:8080
echo ------------------------------------------
echo.
echo If it fails, check frontend_log.txt in the root.
echo Press any key to close this window...
pause >nul
