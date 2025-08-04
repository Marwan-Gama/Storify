# End-to-End (E2E) Testing Guide

This document provides comprehensive information about the E2E testing setup for the Cloud Storage application.

## Overview

The E2E testing suite consists of two main components:

1. **Backend E2E Tests** - API-level tests using Jest and Supertest
2. **Frontend E2E Tests** - Browser-level tests using Playwright

## Test Coverage

### Backend E2E Tests (`backend/tests/e2e/fileOperations.e2e.test.js`)

Tests the complete API flow including:

- **Authentication Flow**

  - User registration and login
  - Token validation
  - Invalid credentials handling

- **Folder Operations**

  - Create folders
  - List user folders
  - Create nested folder structure
  - Update folder metadata
  - Delete folders
  - Folder tree navigation

- **File Operations**

  - Upload single and multiple files
  - Upload files to specific folders
  - Download files
  - Update file metadata
  - Delete files
  - Large file handling
  - File size validation

- **Integration Tests**

  - File and folder organization
  - Folder deletion with files
  - Navigation through folder structure

- **Error Handling**
  - Unauthorized access
  - Invalid file uploads
  - Duplicate folder names
  - File size limits

### Frontend E2E Tests (`frontend/tests/e2e/file-operations.spec.js`)

Tests the complete user interface flow including:

- **Page Navigation**

  - Files page loading
  - Empty state display
  - Breadcrumb navigation

- **Folder Management**

  - Create new folders
  - Navigate folder structure
  - Delete folders with files
  - Nested folder creation

- **File Management**

  - Upload single and multiple files
  - Upload files to specific folders
  - Download files
  - Delete files
  - Rename files
  - Search functionality

- **User Experience**
  - Drag and drop file upload
  - Upload progress indication
  - Error handling
  - Large file uploads

## Prerequisites

### Required Software

1. **Node.js** (v16 or higher)
2. **npm** (comes with Node.js)
3. **MySQL** (for backend tests)
4. **Git** (for cloning the repository)

### Environment Setup

1. **Database Setup**

   ```bash
   # Start MySQL service
   sudo service mysql start  # Linux
   # or
   net start mysql          # Windows
   ```

2. **Environment Variables**
   ```bash
   export NODE_ENV=test
   export TEST_DATABASE_URL="mysql://root:password@localhost:3306/cloud_storage_test"
   export JWT_SECRET="test-secret-key"
   export AWS_ACCESS_KEY_ID="test-access-key"
   export AWS_SECRET_ACCESS_KEY="test-secret-key"
   export AWS_REGION="us-east-1"
   export S3_BUCKET="test-bucket"
   ```

## Running Tests

### Quick Start (Recommended)

Use the automated test runner:

**Windows:**

```bash
run-e2e-tests.bat
```

**Linux/Mac:**

```bash
chmod +x run-e2e-tests.sh
./run-e2e-tests.sh
```

### Manual Testing

#### Backend E2E Tests

1. **Install dependencies:**

   ```bash
   cd backend
   npm install
   ```

2. **Set up test database:**

   ```bash
   npm run db:test:setup
   ```

3. **Run E2E tests:**
   ```bash
   npm run test:e2e
   ```

#### Frontend E2E Tests

1. **Install dependencies:**

   ```bash
   cd frontend
   npm install
   ```

2. **Install Playwright browsers:**

   ```bash
   npx playwright install --with-deps
   ```

3. **Start the backend server:**

   ```bash
   cd ../backend
   npm start
   ```

4. **In another terminal, start the frontend:**

   ```bash
   cd frontend
   npm start
   ```

5. **Run E2E tests:**
   ```bash
   npx playwright test
   ```

### Individual Test Commands

#### Backend Tests

```bash
# Run all backend tests
cd backend
npm test

# Run only E2E tests
npm run test:e2e

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run specific test file
npm test -- fileOperations.e2e.test.js
```

#### Frontend Tests

```bash
# Run all frontend tests
cd frontend
npm test

# Run E2E tests
npx playwright test

# Run E2E tests with UI
npx playwright test --ui

# Run E2E tests in headed mode
npx playwright test --headed

# Run E2E tests in debug mode
npx playwright test --debug

# Run specific test file
npx playwright test file-operations.spec.js
```

## Test Configuration

### Backend Configuration (`backend/jest.config.js`)

```javascript
module.exports = {
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.js"],
  collectCoverageFrom: [
    "controllers/**/*.js",
    "services/**/*.js",
    "models/**/*.js",
    "middleware/**/*.js",
  ],
  coverageDirectory: "coverage",
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
};
```

### Frontend Configuration (`frontend/playwright.config.js`)

```javascript
module.exports = {
  testDir: "./tests/e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ["html"],
    ["json", { outputFile: "test-results/results.json" }],
    ["junit", { outputFile: "test-results/results.xml" }],
  ],
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
    { name: "Mobile Chrome", use: { ...devices["Pixel 5"] } },
    { name: "Mobile Safari", use: { ...devices["iPhone 12"] } },
  ],
  webServer: {
    command: "npm run start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
};
```

## Test Data Management

### Test Users

The tests automatically create test users with the following pattern:

- Username: `testuser_{timestamp}`
- Email: `test_{timestamp}@example.com`
- Password: `TestPassword123!`

### Test Files

Test files are created dynamically during test execution:

- Small text files for basic operations
- Large files (1MB+) for performance testing
- Multiple files for batch operations

### Cleanup

All test data is automatically cleaned up after each test:

- Test users are deleted
- Test files are removed
- Database is reset between test runs

## Test Reports

### Generated Reports

After running tests, the following reports are generated:

1. **HTML Report** - `test-results/test-report.html`
2. **Backend Results** - `test-results/backend/e2e-results.txt`
3. **Frontend Results** - `test-results/frontend/e2e-results.txt`
4. **Coverage Reports** - `backend/coverage/` and `frontend/test-results/`

### Report Contents

- Test execution summary
- Pass/fail status for each test
- Detailed error messages
- Performance metrics
- Coverage information

## Troubleshooting

### Common Issues

1. **Database Connection Errors**

   ```bash
   # Ensure MySQL is running
   sudo service mysql status

   # Create test database manually
   mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS cloud_storage_test;"
   ```

2. **Port Conflicts**

   ```bash
   # Check if ports are in use
   lsof -i :3000  # Frontend
   lsof -i :5000  # Backend
   lsof -i :3306  # Database

   # Kill processes if needed
   kill -9 <PID>
   ```

3. **Playwright Browser Issues**

   ```bash
   # Reinstall browsers
   npx playwright install --with-deps

   # Clear browser cache
   npx playwright install --force
   ```

4. **Node Modules Issues**
   ```bash
   # Clear node modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

### Debug Mode

For debugging failing tests:

```bash
# Backend tests with debug
cd backend
npm run test:debug

# Frontend tests with debug
cd frontend
npx playwright test --debug
```

### Verbose Output

```bash
# Backend tests with verbose output
npm test -- --verbose

# Frontend tests with verbose output
npx playwright test --reporter=verbose
```

## Continuous Integration

### GitHub Actions Example

```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: password
          MYSQL_DATABASE: cloud_storage_test
        ports:
          - 3306:3306
        options: --health-cmd="mysqladmin ping" --health-interval=10s --health-timeout=5s --health-retries=3

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"

      - name: Install dependencies
        run: |
          cd backend && npm ci
          cd ../frontend && npm ci
          npx playwright install --with-deps

      - name: Run E2E tests
        run: ./run-e2e-tests.sh
        env:
          NODE_ENV: test
          TEST_DATABASE_URL: mysql://root:password@localhost:3306/cloud_storage_test
          JWT_SECRET: test-secret-key

      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: test-results
          path: test-results/
```

## Best Practices

### Writing Tests

1. **Test Isolation**: Each test should be independent and not rely on other tests
2. **Descriptive Names**: Use clear, descriptive test names
3. **Setup/Teardown**: Always clean up test data
4. **Error Handling**: Test both success and failure scenarios
5. **Performance**: Keep tests fast and efficient

### Test Data

1. **Unique Data**: Use timestamps or UUIDs to avoid conflicts
2. **Realistic Data**: Use realistic file sizes and types
3. **Edge Cases**: Test boundary conditions and error scenarios

### Maintenance

1. **Regular Updates**: Keep test dependencies updated
2. **Review Coverage**: Regularly review test coverage
3. **Performance Monitoring**: Monitor test execution time
4. **Documentation**: Keep test documentation updated

## Support

For issues with the E2E testing setup:

1. Check the troubleshooting section above
2. Review the test logs in `test-results/`
3. Run tests in debug mode for detailed information
4. Check the application logs for backend/frontend errors

## Contributing

When adding new features, please:

1. Add corresponding E2E tests
2. Update this documentation
3. Ensure all tests pass
4. Add test coverage for new functionality
