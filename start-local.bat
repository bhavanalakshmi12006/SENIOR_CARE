@echo off
title SeniorCare System Launcher
echo ===================================================
echo   SENIORCARE (SCS) — LAUNCHING LOCAL SYSTEM
echo ===================================================

echo [1/4] Checking and freeing ports (5000 and 5174)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5000" ^| findstr "LISTENING"') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5174" ^| findstr "LISTENING"') do taskkill /f /pid %%a >nul 2>&1

echo [2/4] Starting Backend Server (Port 5000)...
start "SeniorCare Backend (Port 5000)" cmd /k "cd /d \"%~dp0backend\" && npm start"

timeout /t 3 /nobreak >nul

echo [3/4] Starting Frontend Vite Server (Port 5174)...
start "SeniorCare Frontend (Port 5174)" cmd /k "cd /d \"%~dp0frontend\" && npm run dev"

timeout /t 2 /nobreak >nul

echo [4/4] Opening Web Application in Browser...
start http://localhost:5174

echo.
echo ===================================================
echo   SENIORCARE IS RUNNING!
echo   Frontend: http://localhost:5174
echo   Backend:  http://localhost:5000
echo   MongoDB Compass: mongodb://127.0.0.1:27017/senior_care
echo ===================================================
echo.
pause
