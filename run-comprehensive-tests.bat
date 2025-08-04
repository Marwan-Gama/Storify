@echo off
setlocal enabledelayedexpansion

echo ========================================
echo Comprehensive E2E Testing Suite
echo ========================================
echo.

:: Set colors for output
set "GREEN=[92m"
set "RED=[91m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "RESET=[0m"

:: Function to print colored output
:print
echo %~1%~2%RESET%
goto :eof

:: Step 1: Kill existing processes
call :print %BLUE% "[1/8] Killing existing processes on ports 3000 and 5000..."
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000') do (
    echo Killing process on port 3000: %%a
    taskkill /F /PID %%a 2>nul
)

for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000') do (
    echo Killing process on port 5000: %%a
    taskkill /F /PID %%a 2>nul
)

:: Step 2: Clean up any existing test files
call :print %BLUE% "[2/8] Cleaning up test environment..."
if exist "test-results" rmdir /s /q "test-results"
if exist "backend\tests\e2e\*.txt" del /q "backend\tests\e2e\*.txt"
if exist "frontend\tests\e2e\*.txt" del /q "frontend\tests\e2e\*.txt"

:: Create test directories
mkdir "test-results" 2>nul
mkdir "test-results\backend" 2>nul
mkdir "test-results\frontend" 2>nul
mkdir "test-results\reports" 2>nul

:: Step 3: Install dependencies
call :print %BLUE% "[3/8] Installing dependencies..."
call npm run install:all > "test-results\install.log" 2>&1
if %errorlevel% neq 0 (
    call :print %RED% "❌ Failed to install dependencies. Check test-results\install.log"
    pause
    exit /b 1
)
call :print %GREEN% "✅ Dependencies installed successfully"

:: Step 4: Set up test environment
call :print %BLUE% "[4/8] Setting up test environment..."

:: Create .env file for testing if it doesn't exist
if not exist "backend\.env" (
    echo Creating backend .env file for testing...
    (
        echo NODE_ENV=test
        echo PORT=5000
        echo JWT_SECRET=test-secret-key
        echo DB_HOST=localhost
        echo DB_USER=root
        echo DB_PASS=
        echo DB_NAME=cloud_storage_test
        echo AWS_ACCESS_KEY_ID=test-key
        echo AWS_SECRET_ACCESS_KEY=test-secret
        echo AWS_REGION=us-east-1
        echo AWS_S3_BUCKET=test-bucket
    ) > "backend\.env"
)

:: Step 5: Start backend server
call :print %BLUE% "[5/8] Starting backend server..."
start /B cmd /c "cd backend && npm start > ..\test-results\backend\server.log 2>&1"

:: Wait for backend to start
call :print %YELLOW% "Waiting for backend to start..."
timeout /t 15 /nobreak > nul

:: Check if backend is running
curl -s http://localhost:5000/health > nul 2>&1
if %errorlevel% neq 0 (
    call :print %RED% "❌ Backend failed to start. Check test-results\backend\server.log"
    type "test-results\backend\server.log"
    pause
    exit /b 1
)
call :print %GREEN% "✅ Backend server started successfully"

:: Step 6: Start frontend server
call :print %BLUE% "[6/8] Starting frontend server..."
start /B cmd /c "cd frontend && npm start > ..\test-results\frontend\server.log 2>&1"

:: Wait for frontend to start
call :print %YELLOW% "Waiting for frontend to start..."
timeout /t 20 /nobreak > nul

:: Check if frontend is running
curl -s http://localhost:3000 > nul 2>&1
if %errorlevel% neq 0 (
    call :print %RED% "❌ Frontend failed to start. Check test-results\frontend\server.log"
    type "test-results\frontend\server.log"
    pause
    exit /b 1
)
call :print %GREEN% "✅ Frontend server started successfully"

:: Step 7: Run E2E tests
call :print %BLUE% "[7/8] Running comprehensive E2E tests..."

:: Run backend E2E tests
call :print %YELLOW% "Running backend E2E tests..."
cd backend
call npm run test:e2e > ..\test-results\backend\e2e-results.txt 2>&1
set BACKEND_EXIT_CODE=%errorlevel%
cd ..

:: Run frontend E2E tests
call :print %YELLOW% "Running frontend E2E tests..."
cd frontend
call npx playwright test > ..\test-results\frontend\e2e-results.txt 2>&1
set FRONTEND_EXIT_CODE=%errorlevel%
cd ..

:: Step 8: Generate comprehensive report
call :print %BLUE% "[8/8] Generating comprehensive test report..."

:: Create HTML report
(
    echo ^<!DOCTYPE html^>
    echo ^<html^>
    echo ^<head^>
    echo     ^<title^>E2E Test Results^</title^>
    echo     ^<style^>
    echo         body { font-family: Arial, sans-serif; margin: 20px; }
    echo         .header { background: #f0f0f0; padding: 20px; border-radius: 5px; }
    echo         .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
    echo         .success { background: #d4edda; border-color: #c3e6cb; }
    echo         .error { background: #f8d7da; border-color: #f5c6cb; }
    echo         .warning { background: #fff3cd; border-color: #ffeaa7; }
    echo         pre { background: #f8f9fa; padding: 10px; border-radius: 3px; overflow-x: auto; }
    echo         .timestamp { color: #666; font-size: 0.9em; }
    echo     ^</style^>
    echo ^</head^>
    echo ^<body^>
    echo     ^<div class="header"^>
    echo         ^<h1^>Comprehensive E2E Test Results^</h1^>
    echo         ^<p class="timestamp"^>Generated on: %date% %time%^</p^>
    echo     ^</div^>
) > "test-results\reports\comprehensive-report.html"

:: Add backend results
if %BACKEND_EXIT_CODE% equ 0 (
    echo     ^<div class="section success"^> >> "test-results\reports\comprehensive-report.html"
    echo         ^<h2^>✅ Backend E2E Tests - PASSED^</h2^> >> "test-results\reports\comprehensive-report.html"
) else (
    echo     ^<div class="section error"^> >> "test-results\reports\comprehensive-report.html"
    echo         ^<h2^>❌ Backend E2E Tests - FAILED^</h2^> >> "test-results\reports\comprehensive-report.html"
)
echo         ^<h3^>Test Output:^</h3^> >> "test-results\reports\comprehensive-report.html"
echo         ^<pre^> >> "test-results\reports\comprehensive-report.html"
type "test-results\backend\e2e-results.txt" >> "test-results\reports\comprehensive-report.html"
echo         ^</pre^> >> "test-results\reports\comprehensive-report.html"
echo     ^</div^> >> "test-results\reports\comprehensive-report.html"

:: Add frontend results
if %FRONTEND_EXIT_CODE% equ 0 (
    echo     ^<div class="section success"^> >> "test-results\reports\comprehensive-report.html"
    echo         ^<h2^>✅ Frontend E2E Tests - PASSED^</h2^> >> "test-results\reports\comprehensive-report.html"
) else (
    echo     ^<div class="section error"^> >> "test-results\reports\comprehensive-report.html"
    echo         ^<h2^>❌ Frontend E2E Tests - FAILED^</h2^> >> "test-results\reports\comprehensive-report.html"
)
echo         ^<h3^>Test Output:^</h3^> >> "test-results\reports\comprehensive-report.html"
echo         ^<pre^> >> "test-results\reports\comprehensive-report.html"
type "test-results\frontend\e2e-results.txt" >> "test-results\reports\comprehensive-report.html"
echo         ^</pre^> >> "test-results\reports\comprehensive-report.html"
echo     ^</div^> >> "test-results\reports\comprehensive-report.html"

:: Add server logs
echo     ^<div class="section warning"^> >> "test-results\reports\comprehensive-report.html"
echo         ^<h2^>📋 Server Logs^</h2^> >> "test-results\reports\comprehensive-report.html"
echo         ^<h3^>Backend Server Log:^</h3^> >> "test-results\reports\comprehensive-report.html"
echo         ^<pre^> >> "test-results\reports\comprehensive-report.html"
type "test-results\backend\server.log" >> "test-results\reports\comprehensive-report.html"
echo         ^</pre^> >> "test-results\reports\comprehensive-report.html"
echo         ^<h3^>Frontend Server Log:^</h3^> >> "test-results\reports\comprehensive-report.html"
echo         ^<pre^> >> "test-results\reports\comprehensive-report.html"
type "test-results\frontend\server.log" >> "test-results\reports\comprehensive-report.html"
echo         ^</pre^> >> "test-results\reports\comprehensive-report.html"
echo     ^</div^> >> "test-results\reports\comprehensive-report.html"

:: Close HTML
echo ^</body^> >> "test-results\reports\comprehensive-report.html"
echo ^</html^> >> "test-results\reports\comprehensive-report.html"

:: Display results summary
echo.
echo ========================================
echo Test Results Summary
echo ========================================

if %BACKEND_EXIT_CODE% equ 0 (
    call :print %GREEN% "✅ Backend E2E Tests: PASSED"
) else (
    call :print %RED% "❌ Backend E2E Tests: FAILED"
)

if %FRONTEND_EXIT_CODE% equ 0 (
    call :print %GREEN% "✅ Frontend E2E Tests: PASSED"
) else (
    call :print %RED% "❌ Frontend E2E Tests: FAILED"
)

:: Show detailed results
echo.
echo Backend E2E Test Results:
echo -------------------------
type "test-results\backend\e2e-results.txt"

echo.
echo Frontend E2E Test Results:
echo --------------------------
type "test-results\frontend\e2e-results.txt"

:: Cleanup
call :print %BLUE% "Cleaning up..."
taskkill /F /IM node.exe 2>nul

echo.
echo ========================================
echo E2E Testing Complete!
echo ========================================
echo.
echo 📊 Detailed reports available at:
echo    - test-results\reports\comprehensive-report.html
echo    - test-results\backend\e2e-results.txt
echo    - test-results\frontend\e2e-results.txt
echo    - test-results\backend\server.log
echo    - test-results\frontend\server.log
echo.

if %BACKEND_EXIT_CODE% equ 0 if %FRONTEND_EXIT_CODE% equ 0 (
    call :print %GREEN% "🎉 All tests passed successfully!"
) else (
    call :print %RED% "⚠️  Some tests failed. Check the reports above for details."
)

echo.
pause 