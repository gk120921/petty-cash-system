@echo off
title 印度倉庫系統 - 核心啟動程式 (India WMS v2.2)
color 0B

echo ============================================================
echo      AI 優化實驗室 - 印度倉庫系統 (India WMS)
echo                一鍵啟動程序正在執行...
echo ============================================================
echo.

:: 1. 檢查 Node.js 環境
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [錯誤] 找不到 Node.js 環境，請先安裝 Node.js！
    pause
    exit
)

:: 2. 檢查並安裝依賴 (如果 node_modules 不存在)
if not exist "node_modules\" (
    echo [資訊] 偵測到首次啟動，正在安裝系統依賴...
    call npm install
)

:: 3. 啟動 Vite 開發伺服器與資料庫引擎
echo [資訊] 正在啟動網頁介面與資料庫引擎...
echo [資訊] 啟動後請勿關閉此視窗。
echo.

:: 在新視窗開啟瀏覽器
start http://localhost:5173

:: 執行開發指令
call npm run dev

pause
