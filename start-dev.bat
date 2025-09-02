@echo off
echo 🚀 Starting Bin2Win Development Servers...
echo.

echo 📂 Starting Backend Server...
start "Backend Server" cmd /c "cd backend && npm run dev"

echo 📂 Starting Frontend Server...
start "Frontend Server" cmd /c "cd frontend && npm start"

echo.
echo ✅ Both servers are starting...
echo 📍 Backend:  http://localhost:3001
echo 📍 Frontend: http://localhost:3000
echo 📍 Admin:    http://localhost:3000/admin/login
echo.
echo 🔐 Admin Login Credentials:
echo    Username: admin
echo    Password: admin123
echo.
echo Press any key to check server status...
pause > nul

:check_status
echo.
echo 🔍 Checking server status...
echo.
echo Backend Health Check:
curl -s http://localhost:3001/api/health 2>nul || echo Backend not responding yet...
echo.
echo Frontend Check:
curl -s -I http://localhost:3000 2>nul | findstr "200 OK" >nul && echo Frontend is running! || echo Frontend not responding yet...
echo.
echo Press any key to check again, or close this window to stop monitoring...
pause > nul
goto check_status
