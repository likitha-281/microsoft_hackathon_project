@echo off
title FlowOps Memory Launcher
echo ===================================================
echo Starting FlowOps Memory
echo "The AI SRE Agent That Learns From Every Incident"
echo ===================================================

echo [1/2] Launching FastAPI Backend (Port 8000)...
start "FlowOps Memory - Backend" cmd /k "cd /d %~dp0 && python -m uvicorn backend.app.main:app --reload --port 8000"

echo [2/2] Launching React Vite Frontend (Port 5173)...
start "FlowOps Memory - Frontend" cmd /k "cd /d %~dp0 && npm run dev"

echo.
echo Waiting 3 seconds for servers to initialize...
timeout /t 3 /nobreak >nul

echo Opening FlowOps Memory SRE Dashboard in your browser...
start http://localhost:5173

echo ===================================================
echo FlowOps Memory is now running!
echo Frontend: http://localhost:5173
echo Backend API Docs: http://localhost:8000/docs
echo ===================================================

