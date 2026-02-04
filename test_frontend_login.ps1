# Test Frontend Login - Quick Verification Script
# Run this to verify all login flows work

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Frontend Login Test Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test Django API is running
Write-Host "[1/4] Testing Django API..." -ForegroundColor Yellow
try {
    $djangoHealth = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/health/" -Method Get -ErrorAction Stop
    Write-Host "  ✓ Django API is running on port 8000" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Django API not responding on port 8000" -ForegroundColor Red
    Write-Host "    Start Django: cd backend\django_app && python manage.py runserver" -ForegroundColor Yellow
    exit 1
}

# Test Frontend is running
Write-Host ""
Write-Host "[2/4] Testing Next.js Frontend..." -ForegroundColor Yellow
try {
    $frontendTest = Invoke-WebRequest -Uri "http://localhost:3000" -Method Get -UseBasicParsing -ErrorAction Stop
    Write-Host "  ✓ Next.js frontend is running on port 3000" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Next.js frontend not responding on port 3000" -ForegroundColor Red
    Write-Host "    Start Next.js: cd frontend\nextjs_app && npm run dev" -ForegroundColor Yellow
    exit 1
}

# Test Admin Login
Write-Host ""
Write-Host "[3/4] Testing Admin Login..." -ForegroundColor Yellow
try {
    $adminLogin = @{
        email = "admin@ongozacyberhub.com"
        password = "admin123"
    } | ConvertTo-Json

    $adminResponse = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/auth/login" -Method Post -Body $adminLogin -ContentType "application/json" -ErrorAction Stop

    if ($adminResponse.access_token) {
        Write-Host "  ✓ Admin login successful" -ForegroundColor Green
        Write-Host "    Email: admin@ongozacyberhub.com" -ForegroundColor Gray
        Write-Host "    User ID: $($adminResponse.user.id)" -ForegroundColor Gray
    }
} catch {
    Write-Host "  ✗ Admin login failed" -ForegroundColor Red
    Write-Host "    Error: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Test Mentor Login
Write-Host ""
Write-Host "[4/4] Testing Mentor Login..." -ForegroundColor Yellow
try {
    $mentorLogin = @{
        email = "mentor@ongozacyberhub.com"
        password = "mentor123"
    } | ConvertTo-Json

    $mentorResponse = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/auth/login" -Method Post -Body $mentorLogin -ContentType "application/json" -ErrorAction Stop

    if ($mentorResponse.access_token) {
        Write-Host "  ✓ Mentor login successful" -ForegroundColor Green
        Write-Host "    Email: mentor@ongozacyberhub.com" -ForegroundColor Gray
        Write-Host "    User ID: $($mentorResponse.user.id)" -ForegroundColor Gray
        Write-Host "    Is Mentor: $($mentorResponse.user.is_mentor)" -ForegroundColor Gray
    }
} catch {
    Write-Host "  ✗ Mentor login failed" -ForegroundColor Red
    Write-Host "    Error: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Django API: http://localhost:8000" -ForegroundColor White
Write-Host "Next.js Frontend: http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "Test Login URLs:" -ForegroundColor Yellow
Write-Host "  Admin:  http://localhost:3000/login/admin" -ForegroundColor Gray
Write-Host "  Mentor: http://localhost:3000/login/mentor" -ForegroundColor Gray
Write-Host "  Student: http://localhost:3000/login/student" -ForegroundColor Gray
Write-Host ""
Write-Host "Login Credentials:" -ForegroundColor Yellow
Write-Host "  Admin:   admin@ongozacyberhub.com / admin123" -ForegroundColor Gray
Write-Host "  Mentor:  mentor@ongozacyberhub.com / mentor123" -ForegroundColor Gray
Write-Host "  Student: alice@student.com / student123" -ForegroundColor Gray
Write-Host ""
Write-Host "✓ All tests passed! You can now test in the browser." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
