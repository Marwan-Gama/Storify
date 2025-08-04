#!/bin/bash

# E2E Test Runner for Cloud Storage Application
# This script runs comprehensive end-to-end tests for both backend and frontend

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a port is in use
port_in_use() {
    lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1
}

# Function to wait for a service to be ready
wait_for_service() {
    local host=$1
    local port=$2
    local max_attempts=30
    local attempt=1
    
    print_status "Waiting for $host:$port to be ready..."
    
    while [ $attempt -le $max_attempts ]; do
        if nc -z $host $port 2>/dev/null; then
            print_success "$host:$port is ready!"
            return 0
        fi
        
        print_status "Attempt $attempt/$max_attempts - $host:$port not ready yet..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_error "Timeout waiting for $host:$port"
    return 1
}

# Function to cleanup background processes
cleanup() {
    print_status "Cleaning up background processes..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    if [ ! -z "$DB_PID" ]; then
        kill $DB_PID 2>/dev/null || true
    fi
}

# Set up cleanup trap
trap cleanup EXIT

# Check prerequisites
print_status "Checking prerequisites..."

# Check if Node.js is installed
if ! command_exists node; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command_exists npm; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

# Check if MySQL is installed (for backend tests)
if ! command_exists mysql; then
    print_warning "MySQL is not installed. Backend tests may fail."
fi

# Check if Playwright is installed
if ! command_exists npx; then
    print_error "npx is not available. Please install Node.js with npm."
    exit 1
fi

print_success "Prerequisites check completed!"

# Create test results directory
mkdir -p test-results
mkdir -p test-results/backend
mkdir -p test-results/frontend
mkdir -p test-results/coverage

# Start database if not running
print_status "Starting database..."
if ! port_in_use 3306; then
    print_warning "MySQL is not running on port 3306. Please start MySQL manually."
    print_status "You can start MySQL with: sudo service mysql start"
else
    print_success "MySQL is already running on port 3306"
fi

# Install dependencies
print_status "Installing dependencies..."

# Backend dependencies
print_status "Installing backend dependencies..."
cd backend
if [ ! -d "node_modules" ]; then
    npm install
else
    npm ci
fi
cd ..

# Frontend dependencies
print_status "Installing frontend dependencies..."
cd frontend
if [ ! -d "node_modules" ]; then
    npm install
else
    npm ci
fi

# Install Playwright browsers
print_status "Installing Playwright browsers..."
npx playwright install --with-deps

cd ..

print_success "Dependencies installed successfully!"

# Set up test environment
print_status "Setting up test environment..."

# Set test environment variables
export NODE_ENV=test
export TEST_DATABASE_URL="mysql://root:password@localhost:3306/cloud_storage_test"
export JWT_SECRET="test-secret-key"
export AWS_ACCESS_KEY_ID="test-access-key"
export AWS_SECRET_ACCESS_KEY="test-secret-key"
export AWS_REGION="us-east-1"
export S3_BUCKET="test-bucket"

# Create test database if it doesn't exist
print_status "Setting up test database..."
if command_exists mysql; then
    mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS cloud_storage_test;" 2>/dev/null || {
        print_warning "Could not create test database. Tests may fail."
    }
fi

# Start backend server for testing
print_status "Starting backend server for testing..."
cd backend
npm run db:migrate 2>/dev/null || print_warning "Database migration failed"
npm run db:seed 2>/dev/null || print_warning "Database seeding failed"

# Start backend in background
npm start &
BACKEND_PID=$!
cd ..

# Wait for backend to be ready
wait_for_service localhost 5000

# Start frontend server for testing
print_status "Starting frontend server for testing..."
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

# Wait for frontend to be ready
wait_for_service localhost 3000

print_success "Test environment is ready!"

# Run backend E2E tests
print_status "Running backend E2E tests..."
cd backend

# Run the E2E tests
if npm run test:e2e > ../test-results/backend/e2e-results.txt 2>&1; then
    print_success "Backend E2E tests passed!"
    BACKEND_TESTS_PASSED=true
else
    print_error "Backend E2E tests failed!"
    BACKEND_TESTS_PASSED=false
fi

cd ..

# Run frontend E2E tests
print_status "Running frontend E2E tests..."
cd frontend

# Run Playwright tests
if npx playwright test --reporter=html,json > ../test-results/frontend/e2e-results.txt 2>&1; then
    print_success "Frontend E2E tests passed!"
    FRONTEND_TESTS_PASSED=true
else
    print_error "Frontend E2E tests failed!"
    FRONTEND_TESTS_PASSED=false
fi

cd ..

# Generate test report
print_status "Generating test report..."

cat > test-results/test-report.html << EOF
<!DOCTYPE html>
<html>
<head>
    <title>E2E Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f0f0f0; padding: 20px; border-radius: 5px; }
        .success { color: green; }
        .error { color: red; }
        .warning { color: orange; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 3px; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Cloud Storage E2E Test Report</h1>
        <p>Generated on: $(date)</p>
    </div>
    
    <div class="section">
        <h2>Test Summary</h2>
        <p><strong>Backend Tests:</strong> 
            <span class="$(if [ "$BACKEND_TESTS_PASSED" = true ]; then echo "success"; else echo "error"; fi)">
                $(if [ "$BACKEND_TESTS_PASSED" = true ]; then echo "PASSED"; else echo "FAILED"; fi)
            </span>
        </p>
        <p><strong>Frontend Tests:</strong> 
            <span class="$(if [ "$FRONTEND_TESTS_PASSED" = true ]; then echo "success"; else echo "error"; fi)">
                $(if [ "$FRONTEND_TESTS_PASSED" = true ]; then echo "PASSED"; else echo "FAILED"; fi)
            </span>
        </p>
    </div>
    
    <div class="section">
        <h2>Backend Test Results</h2>
        <pre>$(cat test-results/backend/e2e-results.txt)</pre>
    </div>
    
    <div class="section">
        <h2>Frontend Test Results</h2>
        <pre>$(cat test-results/frontend/e2e-results.txt)</pre>
    </div>
    
    <div class="section">
        <h2>Test Coverage</h2>
        <p>Check the following directories for detailed coverage reports:</p>
        <ul>
            <li>Backend: <code>backend/coverage/</code></li>
            <li>Frontend: <code>frontend/test-results/</code></li>
        </ul>
    </div>
</body>
</html>
EOF

# Print summary
echo ""
echo "=========================================="
echo "           E2E TEST SUMMARY               "
echo "=========================================="
echo "Backend Tests: $(if [ "$BACKEND_TESTS_PASSED" = true ]; then echo "✅ PASSED"; else echo "❌ FAILED"; fi)"
echo "Frontend Tests: $(if [ "$FRONTEND_TESTS_PASSED" = true ]; then echo "✅ PASSED"; else echo "❌ FAILED"; fi)"
echo ""
echo "Test results saved to: test-results/"
echo "HTML report: test-results/test-report.html"
echo "Backend results: test-results/backend/e2e-results.txt"
echo "Frontend results: test-results/frontend/e2e-results.txt"
echo ""

# Exit with appropriate code
if [ "$BACKEND_TESTS_PASSED" = true ] && [ "$FRONTEND_TESTS_PASSED" = true ]; then
    print_success "All E2E tests passed! 🎉"
    exit 0
else
    print_error "Some E2E tests failed! Please check the test results."
    exit 1
fi 