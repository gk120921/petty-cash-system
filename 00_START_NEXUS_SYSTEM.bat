@echo off
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
timeout /t 8 /nobreak >nul

echo.
echo ==================================================
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
