@echo off
echo.
echo =====================================
echo   Sepolia Health PM2 Manager
echo =====================================
echo.

:: Dừng tất cả process hiện tại
echo [1/3] Stopping existing PM2 processes...
pm2 delete all >nul 2>&1

:: Chạy backend
echo [2/3] Starting Backend...
cd /d "%~dp0..\Be"
pm2 start dist/main.js --name sepolia-backend --watch false

:: Chạy frontend
echo [3/3] Starting Frontend...
cd /d "%~dp0..\web\apps"
pm2 start node_modules/next/dist/bin/next.js --name sepolia-frontend -- start

:: Hiển thị trạng thái
echo.
echo =====================================
echo   Services Status:
echo =====================================
echo.
pm2 status

echo.
echo ✅ Services started successfully!
echo.
echo Backend  : http://localhost:8000
echo Frontend : http://localhost:3000
echo.
echo To stop all services:
echo   npm run pm2:stop
echo.
echo To view logs:
echo   npm run pm2:logs
echo.

pause