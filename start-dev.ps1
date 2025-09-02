# Bin2Win Development Server Starter
Write-Host "🚀 Starting Bin2Win Development Servers..." -ForegroundColor Green
Write-Host ""

# Function to check if a port is in use
function Test-Port {
    param([int]$Port)
    try {
        $connection = New-Object System.Net.Sockets.TcpClient
        $connection.Connect("localhost", $Port)
        $connection.Close()
        return $true
    }
    catch {
        return $false
    }
}

# Start Backend Server
Write-Host "📂 Starting Backend Server..." -ForegroundColor Cyan
if (Test-Port 3001) {
    Write-Host "⚠️  Backend port 3001 is already in use" -ForegroundColor Yellow
} else {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm run dev" -WindowStyle Normal
    Write-Host "✅ Backend server starting..." -ForegroundColor Green
}

# Wait a moment for backend to start
Start-Sleep -Seconds 2

# Start Frontend Server
Write-Host "📂 Starting Frontend Server..." -ForegroundColor Cyan
if (Test-Port 3000) {
    Write-Host "⚠️  Frontend port 3000 is already in use" -ForegroundColor Yellow
} else {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm start" -WindowStyle Normal
    Write-Host "✅ Frontend server starting..." -ForegroundColor Green
}

Write-Host ""
Write-Host "🌐 Server URLs:" -ForegroundColor Green
Write-Host "📍 Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "📍 Backend:  http://localhost:3001" -ForegroundColor White
Write-Host "📍 Admin:    http://localhost:3000/admin/login" -ForegroundColor White
Write-Host ""
Write-Host "🔐 Admin Login Credentials:" -ForegroundColor Green
Write-Host "   Username: admin" -ForegroundColor White
Write-Host "   Password: admin123" -ForegroundColor White
Write-Host ""

# Wait for servers to start
Write-Host "⏳ Waiting for servers to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Check server status
Write-Host "🔍 Checking server status..." -ForegroundColor Cyan

# Check Backend
try {
    $backendResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/health" -TimeoutSec 5
    if ($backendResponse.success) {
        Write-Host "✅ Backend is running!" -ForegroundColor Green
    }
}
catch {
    Write-Host "❌ Backend not responding yet" -ForegroundColor Red
}

# Check Frontend
try {
    $frontendResponse = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5 -UseBasicParsing
    if ($frontendResponse.StatusCode -eq 200) {
        Write-Host "✅ Frontend is running!" -ForegroundColor Green
    }
}
catch {
    Write-Host "❌ Frontend not responding yet" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎉 Development environment is ready!" -ForegroundColor Green
Write-Host "Press any key to open browsers or Ctrl+C to exit..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Open browsers
Start-Process "http://localhost:3000"
Start-Process "http://localhost:3001/api/health"
