@echo off
setlocal enabledelayedexpansion

REM E2E Test Runner for Cloud Storage Application (Windows)
REM This script runs comprehensive end-to-end tests for both backend and frontend

echo ==========================================
echo    Cloud Storage E2E Test Runner
echo ==========================================

REM Check prerequisites
echo [INFO] Checking prerequisites...

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed. Please install Node.js first.
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm is not installed. Please install npm first.
    exit /b 1
)

echo [SUCCESS] Prerequisites check completed!

REM Create test results directory
if not exist test-results mkdir test-results
if not exist test-results\backend mkdir test-results\backend
if not exist test-results\frontend mkdir test-results\frontend
if not exist test-results\coverage mkdir test-results\coverage

REM Install dependencies
echo [INFO] Installing dependencies...

REM Backend dependencies
echo [INFO] Installing backend dependencies...
cd backend
if not exist node_modules (
    npm install
) else (
    npm ci
)
cd ..

REM Frontend dependencies
echo [INFO] Installing frontend dependencies...
cd frontend
if not exist node_modules (
    npm install
) else (
    npm ci
)

REM Install Playwright browsers
echo [INFO] Installing Playwright browsers...
npx playwright install --with-deps

cd ..

echo [SUCCESS] Dependencies installed successfully!

REM Set up test environment
echo [INFO] Setting up test environment...

REM Set test environment variables
set NODE_ENV=test
set TEST_DATABASE_URL=mysql://root:password@localhost:3306/cloud_storage_test
set JWT_SECRET=test-secret-key
set AWS_ACCESS_KEY_ID=test-access-key
set AWS_SECRET_ACCESS_KEY=test-secret-key
set AWS_REGION=us-east-1
set S3_BUCKET=test-bucket

REM Start backend server for testing
echo [INFO] Starting backend server for testing...
cd backend
start /B npm start
set BACKEND_PID=%ERRORLEVEL%
cd ..

REM Wait for backend to be ready
echo [INFO] Waiting for backend to be ready...
timeout /t 10 /nobreak >nul

REM Start frontend server for testing
echo [INFO] Starting frontend server for testing...
cd frontend
start /B npm start
set FRONTEND_PID=%ERRORLEVEL%
cd ..

REM Wait for frontend to be ready
echo [INFO] Waiting for frontend to be ready...
timeout /t 15 /nobreak >nul

echo [SUCCESS] Test environment is ready!

REM Run backend E2E tests
echo [INFO] Running backend E2E tests...
cd backend
npm run test:e2e > ..\test-results\backend\e2e-results.txt 2>&1
if errorlevel 1 (
    echo [ERROR] Backend E2E tests failed!
    set BACKEND_TESTS_PASSED=false
) else (
    echo [SUCCESS] Backend E2E tests passed!
    set BACKEND_TESTS_PASSED=true
)
cd ..

REM Run frontend E2E tests
echo [INFO] Running frontend E2E tests...
cd frontend
npx playwright test --reporter=html,json > ..\test-results\frontend\e2e-results.txt 2>&1
if errorlevel 1 (
    echo [ERROR] Frontend E2E tests failed!
    set FRONTEND_TESTS_PASSED=false
) else (
    echo [SUCCESS] Frontend E2E tests passed!
    set FRONTEND_TESTS_PASSED=true
)
cd ..

REM Generate test report
echo [INFO] Generating test report...

echo ^<!DOCTYPE html^> > test-results\test-report.html
echo ^<html^> >> test-results\test-report.html
echo ^<head^> >> test-results\test-report.html
echo     ^<title^>E2E Test Report^</title^> >> test-results\test-report.html
echo     ^<style^> >> test-results\test-report.html
echo         body { font-family: Arial, sans-serif; margin: 20px; } >> test-results\test-report.html
echo         .header { background: #f0f0f0; padding: 20px; border-radius: 5px; } >> test-results\test-report.html
echo         .success { color: green; } >> test-results\test-report.html
echo         .error { color: red; } >> test-results\test-report.html
echo         .warning { color: orange; } >> test-results\test-report.html
echo         .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; } >> test-results\test-report.html
echo         pre { background: #f5f5f5; padding: 10px; border-radius: 3px; overflow-x: auto; } >> test-results\test-report.html
echo     ^</style^> >> test-results\test-report.html
echo ^</head^> >> test-results\test-report.html
echo ^<body^> >> test-results\test-report.html
echo     ^<div class="header"^> >> test-results\test-report.html
echo         ^<h1^>Cloud Storage E2E Test Report^</h1^> >> test-results\test-report.html
echo         ^<p^>Generated on: %date% %time%^</p^> >> test-results\test-report.html
echo     ^</div^> >> test-results\test-report.html
echo     ^<div class="section"^> >> test-results\test-report.html
echo         ^<h2^>Test Summary^</h2^> >> test-results\test-report.html
echo         ^<p^>^<strong^>Backend Tests:^</strong^> >> test-results\test-report.html
if "%BACKEND_TESTS_PASSED%"=="true" (
    echo             ^<span class="success"^>PASSED^</span^> >> test-results\test-report.html
) else (
    echo             ^<span class="error"^>FAILED^</span^> >> test-results\test-report.html
)
echo         ^</p^> >> test-results\test-report.html
echo         ^<p^>^<strong^>Frontend Tests:^</strong^> >> test-results\test-report.html
if "%FRONTEND_TESTS_PASSED%"=="true" (
    echo             ^<span class="success"^>PASSED^</span^> >> test-results\test-report.html
) else (
    echo             ^<span class="error"^>FAILED^</span^> >> test-results\test-report.html
)
echo         ^</p^> >> test-results\test-report.html
echo     ^</div^> >> test-results\test-report.html
echo     ^<div class="section"^> >> test-results\test-report.html
echo         ^<h2^>Backend Test Results^</h2^> >> test-results\test-report.html
echo         ^<pre^> >> test-results\test-report.html
type test-results\backend\e2e-results.txt >> test-results\test-report.html
echo         ^</pre^> >> test-results\test-report.html
echo     ^</div^> >> test-results\test-report.html
echo     ^<div class="section"^> >> test-results\test-report.html
echo         ^<h2^>Frontend Test Results^</h2^> >> test-results\test-report.html
echo         ^<pre^> >> test-results\test-report.html
type test-results\frontend\e2e-results.txt >> test-results\test-report.html
echo         ^</pre^> >> test-results\test-report.html
echo     ^</div^> >> test-results\test-report.html
echo     ^<div class="section"^> >> test-results\test-report.html
echo         ^<h2^>Test Coverage^</h2^> >> test-results\test-report.html
echo         ^<p^>Check the following directories for detailed coverage reports:^</p^> >> test-results\test-report.html
echo         ^<ul^> >> test-results\test-report.html
echo             ^<li^>Backend: ^<code^>backend\coverage\^</code^>^</li^> >> test-results\test-report.html
echo             ^<li^>Frontend: ^<code^>frontend\test-results\^</code^>^</li^> >> test-results\test-report.html
echo         ^</ul^> >> test-results\test-report.html
echo     ^</div^> >> test-results\test-report.html
echo ^</body^> >> test-results\test-report.html
echo ^</html^> >> test-results\test-report.html

REM Print summary
echo.
echo ==========================================
echo           E2E TEST SUMMARY
echo ==========================================
if "%BACKEND_TESTS_PASSED%"=="true" (
    echo Backend Tests: ✅ PASSED
) else (
    echo Backend Tests: ❌ FAILED
)
if "%FRONTEND_TESTS_PASSED%"=="true" (
    echo Frontend Tests: ✅ PASSED
) else (
    echo Frontend Tests: ❌ FAILED
)
echo.
echo Test results saved to: test-results\
echo HTML report: test-results\test-report.html
echo Backend results: test-results\backend\e2e-results.txt
echo Frontend results: test-results\frontend\e2e-results.txt
echo.

REM Cleanup background processes
echo [INFO] Cleaning up background processes...
taskkill /f /im node.exe >nul 2>&1

REM Exit with appropriate code
if "%BACKEND_TESTS_PASSED%"=="true" if "%FRONTEND_TESTS_PASSED%"=="true" (
    echo [SUCCESS] All E2E tests passed! 🎉
    exit /b 0
) else (
    echo [ERROR] Some E2E tests failed! Please check the test results.
    exit /b 1
) 