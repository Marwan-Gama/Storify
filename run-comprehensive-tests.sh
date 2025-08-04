#!/bin/bash

echo "========================================"
echo "Comprehensive E2E Testing Suite"
echo "========================================"
echo

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[$1]${NC} $2"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Step 1: Kill existing processes
print_status "1/8" "Killing existing processes on ports 3000 and 5000..."

# Kill processes on port 3000
lsof -ti:3000 | xargs kill -9 2>/dev/null || echo "No processes found on port 3000"

# Kill processes on port 5000
lsof -ti:5000 | xargs kill -9 2>/dev/null || echo "No processes found on port 5000"

# Step 2: Clean up any existing test files
print_status "2/8" "Cleaning up test environment..."
rm -rf test-results
rm -f backend/tests/e2e/*.txt
rm -f frontend/tests/e2e/*.txt

# Create test directories
mkdir -p test-results/backend
mkdir -p test-results/frontend
mkdir -p test-results/reports

# Step 3: Install dependencies
print_status "3/8" "Installing dependencies..."
npm run install:all > test-results/install.log 2>&1
if [ $? -ne 0 ]; then
    print_error "Failed to install dependencies. Check test-results/install.log"
    exit 1
fi
print_success "Dependencies installed successfully"

# Step 4: Set up test environment
print_status "4/8" "Setting up test environment..."

# Create .env file for testing if it doesn't exist
if [ ! -f "backend/.env" ]; then
    echo "Creating backend .env file for testing..."
    cat > backend/.env << EOF
NODE_ENV=test
PORT=5000
JWT_SECRET=test-secret-key
DB_HOST=localhost
DB_USER=root
DB_PASS=
DB_NAME=cloud_storage_test
AWS_ACCESS_KEY_ID=test-key
AWS_SECRET_ACCESS_KEY=test-secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=test-bucket
EOF
fi

# Step 5: Start backend server
print_status "5/8" "Starting backend server..."
cd backend
npm start > ../test-results/backend/server.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
print_warning "Waiting for backend to start..."
sleep 15

# Check if backend is running
if curl -s http://localhost:5000/health > /dev/null 2>&1; then
    print_success "Backend server started successfully"
else
    print_error "Backend failed to start. Check test-results/backend/server.log"
    cat test-results/backend/server.log
    exit 1
fi

# Step 6: Start frontend server
print_status "6/8" "Starting frontend server..."
cd frontend
npm start > ../test-results/frontend/server.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait for frontend to start
print_warning "Waiting for frontend to start..."
sleep 20

# Check if frontend is running
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    print_success "Frontend server started successfully"
else
    print_error "Frontend failed to start. Check test-results/frontend/server.log"
    cat test-results/frontend/server.log
    exit 1
fi

# Step 7: Run E2E tests
print_status "7/8" "Running comprehensive E2E tests..."

# Run backend E2E tests
print_warning "Running backend E2E tests..."
cd backend
npm run test:e2e > ../test-results/backend/e2e-results.txt 2>&1
BACKEND_EXIT_CODE=$?
cd ..

# Run frontend E2E tests
print_warning "Running frontend E2E tests..."
cd frontend
npx playwright test > ../test-results/frontend/e2e-results.txt 2>&1
FRONTEND_EXIT_CODE=$?
cd ..

# Step 8: Generate comprehensive report
print_status "8/8" "Generating comprehensive test report..."

# Create HTML report
cat > test-results/reports/comprehensive-report.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>E2E Test Results</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f0f0f0; padding: 20px; border-radius: 5px; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .success { background: #d4edda; border-color: #c3e6cb; }
        .error { background: #f8d7da; border-color: #f5c6cb; }
        .warning { background: #fff3cd; border-color: #ffeaa7; }
        pre { background: #f8f9fa; padding: 10px; border-radius: 3px; overflow-x: auto; }
        .timestamp { color: #666; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Comprehensive E2E Test Results</h1>
        <p class="timestamp">Generated on: $(date)</p>
    </div>
EOF

# Add backend results
if [ $BACKEND_EXIT_CODE -eq 0 ]; then
    echo '    <div class="section success">' >> test-results/reports/comprehensive-report.html
    echo '        <h2>✅ Backend E2E Tests - PASSED</h2>' >> test-results/reports/comprehensive-report.html
else
    echo '    <div class="section error">' >> test-results/reports/comprehensive-report.html
    echo '        <h2>❌ Backend E2E Tests - FAILED</h2>' >> test-results/reports/comprehensive-report.html
fi

echo '        <h3>Test Output:</h3>' >> test-results/reports/comprehensive-report.html
echo '        <pre>' >> test-results/reports/comprehensive-report.html
cat test-results/backend/e2e-results.txt >> test-results/reports/comprehensive-report.html
echo '        </pre>' >> test-results/reports/comprehensive-report.html
echo '    </div>' >> test-results/reports/comprehensive-report.html

# Add frontend results
if [ $FRONTEND_EXIT_CODE -eq 0 ]; then
    echo '    <div class="section success">' >> test-results/reports/comprehensive-report.html
    echo '        <h2>✅ Frontend E2E Tests - PASSED</h2>' >> test-results/reports/comprehensive-report.html
else
    echo '    <div class="section error">' >> test-results/reports/comprehensive-report.html
    echo '        <h2>❌ Frontend E2E Tests - FAILED</h2>' >> test-results/reports/comprehensive-report.html
fi

echo '        <h3>Test Output:</h3>' >> test-results/reports/comprehensive-report.html
echo '        <pre>' >> test-results/reports/comprehensive-report.html
cat test-results/frontend/e2e-results.txt >> test-results/reports/comprehensive-report.html
echo '        </pre>' >> test-results/reports/comprehensive-report.html
echo '    </div>' >> test-results/reports/comprehensive-report.html

# Add server logs
echo '    <div class="section warning">' >> test-results/reports/comprehensive-report.html
echo '        <h2>📋 Server Logs</h2>' >> test-results/reports/comprehensive-report.html
echo '        <h3>Backend Server Log:</h3>' >> test-results/reports/comprehensive-report.html
echo '        <pre>' >> test-results/reports/comprehensive-report.html
cat test-results/backend/server.log >> test-results/reports/comprehensive-report.html
echo '        </pre>' >> test-results/reports/comprehensive-report.html
echo '        <h3>Frontend Server Log:</h3>' >> test-results/reports/comprehensive-report.html
echo '        <pre>' >> test-results/reports/comprehensive-report.html
cat test-results/frontend/server.log >> test-results/reports/comprehensive-report.html
echo '        </pre>' >> test-results/reports/comprehensive-report.html
echo '    </div>' >> test-results/reports/comprehensive-report.html

# Close HTML
echo '</body>' >> test-results/reports/comprehensive-report.html
echo '</html>' >> test-results/reports/comprehensive-report.html

# Display results summary
echo
echo "========================================"
echo "Test Results Summary"
echo "========================================"

if [ $BACKEND_EXIT_CODE -eq 0 ]; then
    print_success "Backend E2E Tests: PASSED"
else
    print_error "Backend E2E Tests: FAILED"
fi

if [ $FRONTEND_EXIT_CODE -eq 0 ]; then
    print_success "Frontend E2E Tests: PASSED"
else
    print_error "Frontend E2E Tests: FAILED"
fi

# Show detailed results
echo
echo "Backend E2E Test Results:"
echo "-------------------------"
cat test-results/backend/e2e-results.txt

echo
echo "Frontend E2E Test Results:"
echo "--------------------------"
cat test-results/frontend/e2e-results.txt

# Cleanup
print_status "Cleaning up..." "Stopping servers..."
kill $BACKEND_PID 2>/dev/null
kill $FRONTEND_PID 2>/dev/null
pkill -f "node.*server.js" 2>/dev/null
pkill -f "react-scripts start" 2>/dev/null

echo
echo "========================================"
echo "E2E Testing Complete!"
echo "========================================"
echo
echo "📊 Detailed reports available at:"
echo "   - test-results/reports/comprehensive-report.html"
echo "   - test-results/backend/e2e-results.txt"
echo "   - test-results/frontend/e2e-results.txt"
echo "   - test-results/backend/server.log"
echo "   - test-results/frontend/server.log"
echo

if [ $BACKEND_EXIT_CODE -eq 0 ] && [ $FRONTEND_EXIT_CODE -eq 0 ]; then
    print_success "🎉 All tests passed successfully!"
else
    print_error "⚠️  Some tests failed. Check the reports above for details."
fi

echo 