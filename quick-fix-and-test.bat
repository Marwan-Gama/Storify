@echo off
echo ========================================
echo Quick Fix and Test - Port Conflicts
echo ========================================

echo.
echo [1/4] Killing existing processes on ports 3000 and 5000...

:: Kill processes on port 3000
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000') do (
    echo Killing process on port 3000: %%a
    taskkill /F /PID %%a 2>nul
)

:: Kill processes on port 5000
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000') do (
    echo Killing process on port 5000: %%a
    taskkill /F /PID %%a 2>nul
)

echo.
echo [2/4] Installing dependencies...
call npm run install:all

echo.
echo [3/4] Starting servers...

:: Start backend
echo Starting backend server...
start /B cmd /c "cd backend && npm start"

:: Wait for backend
timeout /t 10 /nobreak > nul

:: Start frontend
echo Starting frontend server...
start /B cmd /c "cd frontend && npm start"

:: Wait for frontend
timeout /t 15 /nobreak > nul

echo.
echo [4/4] Running basic functionality test...
node test-basic-functionality.js

echo.
echo ========================================
echo Quick Fix Complete!
echo ========================================
echo.
echo Servers should now be running on:
echo - Backend: http://localhost:5000
echo - Frontend: http://localhost:3000
echo.
echo You can now:
echo 1. Open http://localhost:3000 in your browser
echo 2. Test folder creation and navigation
echo 3. Test file upload and download
echo.
echo Press any key to stop servers...
pause

:: Stop servers
taskkill /F /IM node.exe 2>nul
echo Servers stopped. 