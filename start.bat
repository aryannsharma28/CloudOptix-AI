@echo off
echo =======================================================
echo   CloudOptix AI - Launching FinOps Platform
echo =======================================================
echo.

start "CloudOptix Backend (Port 5000)" cmd /k "cd backend && npm start"
timeout /t 2 /nobreak >nul
start "CloudOptix Frontend (Port 5173)" cmd /k "cd frontend && npm run dev"

echo Services started!
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:5000/api/health
echo.
pause
