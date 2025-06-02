@echo off
echo =====================================
echo Water Monitoring Node-RED Server
echo =====================================
echo.

REM Перевірка наявності Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js не знайдено! Будь ласка, встановіть Node.js
    pause
    exit /b 1
)

echo ✅ Node.js знайдено
echo.

REM Перевірка наявності node_modules
if not exist "node_modules" (
    echo 📦 Встановлення залежностей...
    npm install
    echo.
)

echo 🚀 Запуск Node-RED сервера...
echo.
echo Сервер запускається на http://localhost:1880
echo Admin панель: http://localhost:1880/admin  
echo API base: http://localhost:1880/api
echo.
echo Натисніть Ctrl+C для зупинки сервера
echo.

node server.js

pause
