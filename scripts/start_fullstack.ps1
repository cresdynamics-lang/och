# Start fullstack application - Windows PowerShell version
# This script requires Docker Desktop to be running

Write-Host "==========================================" -ForegroundColor Green
Write-Host "Starting Ongoza CyberHub Fullstack App" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""

# Kill existing processes on development ports
Write-Host "Killing existing processes on ports 3000, 8000, 8001..." -ForegroundColor Yellow
Get-NetTCPConnection -LocalPort 3000,8000,8001 -ErrorAction SilentlyContinue | ForEach-Object {
    Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
}
Start-Sleep 1

# Navigate to backend directory
Set-Location "$PSScriptRoot\..\backend"

# Start backend services with Docker Compose
Write-Host "Starting backend services (PostgreSQL, Django, FastAPI)..." -ForegroundColor Yellow
docker compose -f docker-compose.yml -f compose.override.dev.yml up -d

# Wait for services to be healthy
Write-Host ""
Write-Host "Waiting for backend services to be ready..." -ForegroundColor Yellow
Start-Sleep 5

# Check service health
Write-Host "Checking service health..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/api/v1/health/" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ Django API is running on http://localhost:8000" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Django API health check failed (may still be starting)" -ForegroundColor Yellow
}

try {
    $response = Invoke-WebRequest -Uri "http://localhost:8001/health" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ FastAPI is running on http://localhost:8001" -ForegroundColor Green
} catch {
    Write-Host "⚠️  FastAPI health check failed (may still be starting)" -ForegroundColor Yellow
}

# Navigate to frontend directory
Set-Location "..\frontend\nextjs_app"

# Start frontend in new window
Write-Host ""
Write-Host "Starting frontend (Next.js)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"

# Wait a moment for frontend to start
Start-Sleep 3

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "✅ Fullstack application started!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Services running:" -ForegroundColor Cyan
Write-Host "  Frontend (Next.js):  http://localhost:3000" -ForegroundColor White
Write-Host "  Django API:          http://localhost:8000" -ForegroundColor White
Write-Host "  FastAPI:             http://localhost:8001" -ForegroundColor White
Write-Host "  Django Admin:        http://localhost:8000/admin" -ForegroundColor White
Write-Host ""
Write-Host "To stop all services:" -ForegroundColor Yellow
Write-Host "  cd backend && docker compose down" -ForegroundColor White
Write-Host "  Close the frontend terminal window" -ForegroundColor White
Write-Host ""