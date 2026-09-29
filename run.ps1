Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "Starting FlowOps Memory" -ForegroundColor Green
Write-Host '"The AI SRE Agent That Learns From Every Incident"' -ForegroundColor Yellow
Write-Host "===================================================" -ForegroundColor Cyan

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "[1/2] Launching FastAPI Backend (Port 8000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$scriptDir'; python -m uvicorn backend.app.main:app --reload --port 8000"

Write-Host "[2/2] Launching React Vite Frontend (Port 5173)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$scriptDir'; npm run dev"

Start-Sleep -Seconds 3

Write-Host "Opening FlowOps Memory SRE Dashboard in your default browser..." -ForegroundColor Green
Start-Process "http://localhost:5173"

Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "FlowOps Memory is now running!" -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "Backend API Docs: http://localhost:8000/docs" -ForegroundColor White
Write-Host "===================================================" -ForegroundColor Cyan

