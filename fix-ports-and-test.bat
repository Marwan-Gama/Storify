@echo off
echo ========================================
echo Fixing Port Conflicts and Running E2E Tests
echo ========================================

echo.
echo [1/6] Killing existing processes on ports 3000 and 5000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000') do (
    echo Killing process on port 3000: %%a
    taskkill /F /PID %%a 2>nul
)

for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000') do (
    echo Killing process on port 5000: %%a
    taskkill /F /PID %%a 2>nul
)

echo.
echo [2/6] Installing dependencies...
call npm run install:all

echo.
echo [3/6] Setting up test environment...
if not exist "test-results" mkdir test-results
if not exist "test-results\backend" mkdir test-results\backend
if not exist "test-results\frontend" mkdir test-results\frontend

echo.
echo [4/6] Starting backend server in background...
start /B cmd /c "cd backend && npm start > ..\test-results\backend\server.log 2>&1"

echo Waiting for backend to start...
timeout /t 10 /nobreak > nul

echo.
echo [5/6] Starting frontend server in background...
start /B cmd /c "cd frontend && npm start > ..\test-results\frontend\server.log 2>&1"

echo Waiting for frontend to start...
timeout /t 15 /nobreak > nul

echo.
echo [6/6] Running E2E tests...

echo Running backend E2E tests...
cd backend
call npm run test:e2e > ..\test-results\backend\e2e-results.txt 2>&1
cd ..

echo Running frontend E2E tests...
cd frontend
call npx playwright test > ..\test-results\frontend\e2e-results.txt 2>&1
cd ..

echo.
echo ========================================
echo Test Results Summary
echo ========================================

echo.
echo Backend E2E Test Results:
echo -------------------------
type test-results\backend\e2e-results.txt

echo.
echo Frontend E2E Test Results:
echo --------------------------
type test-results\frontend\e2e-results.txt

echo.
echo ========================================
echo Cleaning up...
echo ========================================

echo Stopping servers...
taskkill /F /IM node.exe 2>nul

echo.
echo ========================================
echo E2E Testing Complete!
echo ========================================
echo.
echo Check the following files for detailed results:
echo - test-results\backend\e2e-results.txt
echo - test-results\frontend\e2e-results.txt
echo - test-results\backend\server.log
echo - test-results\frontend\server.log
echo.
pause 