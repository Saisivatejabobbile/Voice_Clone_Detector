Write-Host "`n=== VOICESHIELD STATUS CHECK ===" -ForegroundColor Cyan -BackgroundColor Black
Write-Host ""

# Check Backend
$backend = Get-Process -Name "python" -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*SIH_2026*" }
if ($backend) {
    Write-Host "? BACKEND: Running (PID: $($backend.Id))" -ForegroundColor Green
    Write-Host "   URL: http://localhost:8000" -ForegroundColor DarkGray
} else {
    Write-Host "? BACKEND: Not Running" -ForegroundColor Red
    Write-Host "   Run: cd backend; uvicorn app.main:app --reload" -ForegroundColor Yellow
}

# Check Frontend
$frontend = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*SIH_2026*" }
if ($frontend) {
    Write-Host "? FRONTEND: Running (PID: $($frontend.Id))" -ForegroundColor Green
    Write-Host "   URL: http://localhost:5173" -ForegroundColor DarkGray
} else {
    Write-Host "? FRONTEND: Not Running" -ForegroundColor Red
    Write-Host "   Run: cd frontend; npm run dev" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "????????????????????????????????????" -ForegroundColor DarkGray
Write-Host "QUICK TEST:" -ForegroundColor Yellow
Write-Host "1. Browser Tab 1: http://localhost:5173" -ForegroundColor White
Write-Host "   Login: sai@gmail.com / password123" -ForegroundColor DarkGray
Write-Host "2. Browser Tab 2 (incognito): http://localhost:5173" -ForegroundColor White
Write-Host "   Login: raya123@gmail.com / password123" -ForegroundColor DarkGray
Write-Host "3. Sai ? Contacts ? Click 'Call' on Raya" -ForegroundColor White
Write-Host "4. Raya should see incoming call modal" -ForegroundColor White
Write-Host "????????????????????????????????????" -ForegroundColor DarkGray
Write-Host ""
