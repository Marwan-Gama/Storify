#!/bin/bash

echo "========================================"
echo "Fixing Port Conflicts and Running E2E Tests"
echo "========================================"

echo
echo "[1/6] Killing existing processes on ports 3000 and 5000..."

# Kill processes on port 3000
lsof -ti:3000 | xargs kill -9 2>/dev/null || echo "No processes found on port 3000"

# Kill processes on port 5000
lsof -ti:5000 | xargs kill -9 2>/dev/null || echo "No processes found on port 5000"

echo
echo "[2/6] Installing dependencies..."
npm run install:all

echo
echo "[3/6] Setting up test environment..."
mkdir -p test-results/backend
mkdir -p test-results/frontend

echo
echo "[4/6] Starting backend server in background..."
cd backend
npm start > ../test-results/backend/server.log 2>&1 &
BACKEND_PID=$!
cd ..

echo "Waiting for backend to start..."
sleep 10

echo
echo "[5/6] Starting frontend server in background..."
cd frontend
npm start > ../test-results/frontend/server.log 2>&1 &
FRONTEND_PID=$!
cd ..

echo "Waiting for frontend to start..."
sleep 15

echo
echo "[6/6] Running E2E tests..."

echo "Running backend E2E tests..."
cd backend
npm run test:e2e > ../test-results/backend/e2e-results.txt 2>&1
cd ..

echo "Running frontend E2E tests..."
cd frontend
npx playwright test > ../test-results/frontend/e2e-results.txt 2>&1
cd ..

echo
echo "========================================"
echo "Test Results Summary"
echo "========================================"

echo
echo "Backend E2E Test Results:"
echo "-------------------------"
cat test-results/backend/e2e-results.txt

echo
echo "Frontend E2E Test Results:"
echo "--------------------------"
cat test-results/frontend/e2e-results.txt

echo
echo "========================================"
echo "Cleaning up..."
echo "========================================"

echo "Stopping servers..."
kill $BACKEND_PID 2>/dev/null
kill $FRONTEND_PID 2>/dev/null
pkill -f "node.*server.js" 2>/dev/null
pkill -f "react-scripts start" 2>/dev/null

echo
echo "========================================"
echo "E2E Testing Complete!"
echo "========================================"
echo
echo "Check the following files for detailed results:"
echo "- test-results/backend/e2e-results.txt"
echo "- test-results/frontend/e2e-results.txt"
echo "- test-results/backend/server.log"
echo "- test-results/frontend/server.log"
echo 