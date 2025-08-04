# Comprehensive E2E Testing Guide

## 🎯 Overview

This guide provides comprehensive end-to-end (E2E) testing for your Cloud Storage application. The testing suite addresses the specific issues you encountered:

- **Port conflicts** (ports 3000 and 5000 already in use)
- **Folder creation and navigation** issues
- **File upload and download** problems
- **Authentication and authorization** flows

## 🚀 Quick Start

### Windows Users

```bash
# Run the comprehensive test suite
run-comprehensive-tests.bat
```

### Linux/Mac Users

```bash
# Make script executable (Linux/Mac only)
chmod +x run-comprehensive-tests.sh

# Run the comprehensive test suite
./run-comprehensive-tests.sh
```

## 📁 Test Files Created

### 1. Backend E2E Tests

- **`backend/tests/e2e/comprehensive.e2e.test.js`** - Comprehensive API-level tests
- **`backend/tests/e2e/fileOperations.e2e.test.js`** - Original file operation tests

### 2. Frontend E2E Tests

- **`frontend/tests/e2e/comprehensive-ui.spec.js`** - Comprehensive UI tests
- **`frontend/tests/e2e/file-operations.spec.js`** - Original UI tests

### 3. Test Runners

- **`run-comprehensive-tests.bat`** - Windows comprehensive test runner
- **`run-comprehensive-tests.sh`** - Linux/Mac comprehensive test runner
- **`fix-ports-and-test.bat`** - Windows port fixer and basic test runner
- **`fix-ports-and-test.sh`** - Linux/Mac port fixer and basic test runner

## 🔧 What the Test Suite Fixes

### Port Conflict Resolution

The test runners automatically:

1. **Kill existing processes** on ports 3000 and 5000
2. **Clean up test environment** before running
3. **Start servers in background** with proper logging
4. **Verify server health** before running tests

### Comprehensive Test Coverage

#### Backend Tests Cover:

✅ **Authentication Flow**

- User registration and login
- Token validation
- Invalid credentials handling

✅ **Folder Operations**

- Create folders with verification
- List user folders
- Create nested folder structure
- Update folder metadata
- Delete folders with cascade
- Folder tree navigation

✅ **File Operations**

- Upload single and multiple files
- Upload files to specific folders
- Download files with proper headers
- Update file metadata
- Delete files
- Large file handling
- File size validation

✅ **Integration Tests**

- File and folder organization
- Folder deletion with files
- Navigation through folder structure

✅ **Error Handling**

- Unauthorized access
- Invalid file uploads
- Duplicate folder names
- File size limits
- Network errors

✅ **Performance Tests**

- Multiple concurrent uploads
- Large number of folders
- Rapid operations

#### Frontend Tests Cover:

✅ **Page Navigation**

- Files page loading
- Empty state display
- Breadcrumb navigation

✅ **Folder Management**

- Create new folders
- Navigate folder structure
- Delete folders with files
- Nested folder creation

✅ **File Management**

- Upload single and multiple files
- Upload files to specific folders
- Download files
- Delete files
- Rename files
- Search functionality

✅ **User Experience**

- Drag and drop file upload
- Upload progress indication
- Error handling
- Large file uploads

✅ **Advanced Features**

- Search and filter operations
- Breadcrumb navigation
- Performance testing
- Error handling

## 🛠️ Manual Testing Options

### Backend Tests Only

```bash
# Kill port conflicts first
# Windows
for /f "tokens=5" %a in ('netstat -aon ^| findstr :5000') do taskkill /F /PID %a

# Linux/Mac
lsof -ti:5000 | xargs kill -9

# Run backend tests
cd backend
npm run test:e2e
```

### Frontend Tests Only

```bash
# Kill port conflicts first
# Windows
for /f "tokens=5" %a in ('netstat -aon ^| findstr :3000') do taskkill /F /PID %a

# Linux/Mac
lsof -ti:3000 | xargs kill -9

# Run frontend tests
cd frontend
npx playwright test
```

### Individual Test Files

```bash
# Backend comprehensive tests
cd backend
npm test -- tests/e2e/comprehensive.e2e.test.js

# Frontend comprehensive tests
cd frontend
npx playwright test tests/e2e/comprehensive-ui.spec.js
```

## 📊 Test Reports

After running the comprehensive test suite, you'll get:

### HTML Report

- **Location**: `test-results/reports/comprehensive-report.html`
- **Features**: Color-coded results, server logs, detailed test output

### Text Reports

- **Backend**: `test-results/backend/e2e-results.txt`
- **Frontend**: `test-results/frontend/e2e-results.txt`
- **Server Logs**: `test-results/backend/server.log`, `test-results/frontend/server.log`

### Coverage Information

- Test execution time
- Pass/fail statistics
- Error details
- Performance metrics

## 🔍 Troubleshooting

### Common Issues and Solutions

#### 1. Port Already in Use

```bash
# The test runners automatically handle this, but if manual:
# Windows
netstat -ano | findstr :5000
taskkill /F /PID <PID>

# Linux/Mac
lsof -i :5000
kill -9 <PID>
```

#### 2. Database Connection Issues

```bash
# Ensure MySQL is running
# Windows
net start mysql

# Linux/Mac
sudo systemctl start mysql
```

#### 3. Node Modules Issues

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
cd backend && npm install
cd ../frontend && npm install
```

#### 4. Playwright Issues

```bash
# Install Playwright browsers
cd frontend
npx playwright install
```

#### 5. Test Environment Setup

```bash
# Create test environment file
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
```

### Debug Mode Testing

#### Backend Debug

```bash
cd backend
npm run test:debug
```

#### Frontend Debug

```bash
cd frontend
npx playwright test --debug
```

## 🎯 Specific Issue Testing

### Test Folder Creation and Navigation

```bash
# Run specific folder tests
cd backend
npm test -- --testNamePattern="Folder Operations"
```

### Test File Upload and Download

```bash
# Run specific file tests
cd backend
npm test -- --testNamePattern="File Operations"
```

### Test Authentication

```bash
# Run authentication tests
cd backend
npm test -- --testNamePattern="Authentication"
```

## 📈 Performance Testing

The comprehensive test suite includes performance tests for:

- **Large file uploads** (up to 100MB)
- **Multiple concurrent uploads** (5 files simultaneously)
- **Large number of folders** (10+ folders)
- **Rapid operations** (quick succession of actions)

## 🔒 Security Testing

The tests cover security aspects:

- **Authentication bypass** attempts
- **Unauthorized access** to files/folders
- **Token validation** failures
- **Cross-user access** prevention

## 🚀 CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: "16"
      - run: chmod +x run-comprehensive-tests.sh
      - run: ./run-comprehensive-tests.sh
      - uses: actions/upload-artifact@v2
        with:
          name: test-results
          path: test-results/
```

## 📞 Support

If you encounter issues:

1. **Check the test logs** in `test-results/` directory
2. **Run tests in debug mode** for detailed information
3. **Verify environment setup** (Node.js, MySQL, etc.)
4. **Check port availability** before running tests

## 🎉 Success Criteria

Your E2E testing setup is complete when:

- ✅ All backend tests pass
- ✅ All frontend tests pass
- ✅ File upload/download works correctly
- ✅ Folder creation/navigation works correctly
- ✅ Error handling works as expected
- ✅ Performance is acceptable for large files
- ✅ No port conflicts occur
- ✅ Comprehensive reports are generated

## 📝 Next Steps

1. **Run the comprehensive test suite** to verify everything works
2. **Review test results** in the generated reports
3. **Fix any issues** that the tests reveal
4. **Integrate into your workflow** - Run tests before deployments
5. **Set up CI/CD** using the provided GitHub Actions example

---

**🎯 The comprehensive E2E testing suite will ensure that your folder and file operations work correctly and help you identify and fix any issues!**
