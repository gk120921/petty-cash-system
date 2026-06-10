@echo off
chcp 65001 >nul
title Petty Cash - 自動化測試工具

echo ==========================================
echo    零用金系統 - 自動化測試 (Playwright)
echo ==========================================
echo.
echo 請確保系統已經啟動 (http://localhost:8080)
echo.
echo [1] 執行完整測試 (背景執行)
echo [2] 開啟測試介面 (UI 模式，可看見操作畫面)
echo [3] 安裝/修復測試環境
echo.
set /p opt="請輸入選項 (1-3): "

if "%opt%"=="1" (
    echo 正在執行測試...
    npx playwright test
)
if "%opt%"=="2" (
    echo 正在開啟 UI 介面...
    npx playwright test --ui
)
if "%opt%"=="3" (
    echo 正在更新環境...
    npm install
    npx playwright install chromium
)

echo.
echo 執行完畢。
pause
