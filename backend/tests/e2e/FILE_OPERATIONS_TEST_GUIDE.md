# Complete File Operations E2E Test Guide

This guide covers comprehensive end-to-end testing for all file operations in the Storify cloud storage system.

## 📋 Overview

The complete file operations e2e tests cover all aspects of file management including:

- **File Upload Operations** - Single, multiple, public, and folder uploads
- **File Retrieval Operations** - Pagination, search, filtering, and individual file access
- **File Download Operations** - Secure file downloads with access control
- **File Preview Operations** - Image previews and file type validation
- **File Update Operations** - Metadata updates, file moving, and validation
- **File Copy Operations** - File duplication with new names and locations
- **File Delete and Restore Operations** - Soft delete, restore, and permanent deletion
- **File Statistics Operations** - Usage statistics and file type analysis
- **Public File Operations** - Public file access and link management
- **Error Handling and Edge Cases** - Authorization, validation, and concurrent operations
- **File Type and Size Validation** - File size limits and type restrictions

## 🚀 Quick Start

### Running the Complete File Operations Tests

```bash
# Navigate to backend directory
cd backend

# Run all file operations tests
npm run test:e2e -- --testPathPattern=complete-file-operations.e2e.test.js

# Or use the dedicated test runner
node tests/e2e/run-file-operations-tests.js

# Run with coverage
node tests/e2e/run-file-operations-tests.js --coverage

# Run in watch mode
node tests/e2e/run-file-operations-tests.js --watch

# Run with custom timeout (default: 5 minutes)
node tests/e2e/run-file-operations-tests.js --timeout=600000
```

### Prerequisites

1. **Database Setup**: Ensure test database is configured and migrated
2. **Environment Variables**: Set up test environment variables
3. **Dependencies**: Install all required npm packages

```bash
# Setup test environment
npm run db:test:setup

# Install dependencies
npm install
```

## 📁 Test Structure

### Test File: `complete-file-operations.e2e.test.js`

The test file is organized into logical sections:

```
describe("Complete File Operations E2E Tests", () => {
  // Setup and teardown
  beforeAll() - Create test user and folder
  afterAll() - Cleanup all test data
  beforeEach() - Clean files before each test

  describe("File Upload Operations", () => {
    // Single file upload
    // Multiple file upload
    // Public file upload
    // Folder upload
    // Validation tests
  })

  describe("File Retrieval Operations", () => {
    // Pagination
    // Search functionality
    // Folder filtering
    // Individual file access
  })

  describe("File Download Operations", () => {
    // File download
    // Access control
    // Error handling
  })

  describe("File Preview Operations", () => {
    // Image preview
    // Non-previewable files
  })

  describe("File Update Operations", () => {
    // Metadata updates
    // File moving
    // Validation
  })

  describe("File Copy Operations", () => {
    // File copying
    // Name generation
    // Folder placement
  })

  describe("File Delete and Restore Operations", () => {
    // Soft delete
    // Restore functionality
    // Permanent deletion
  })

  describe("File Statistics Operations", () => {
    // Usage statistics
    // File type analysis
  })

  describe("Public File Operations", () => {
    // Public access
    // Link validation
    // Access control
  })

  describe("Error Handling and Edge Cases", () => {
    // Authorization
    // Invalid data
    // Concurrent operations
  })

  describe("File Type and Size Validation", () => {
    // Size limits
    // File type restrictions
  })
})
```

## 🔧 API Endpoints Tested

### File Upload Endpoints

| Endpoint                     | Method | Description          | Test Coverage |
| ---------------------------- | ------ | -------------------- | ------------- |
| `/api/files/upload`          | POST   | Single file upload   | ✅ Complete   |
| `/api/files/upload-multiple` | POST   | Multiple file upload | ✅ Complete   |

### File Retrieval Endpoints

| Endpoint           | Method | Description                    | Test Coverage |
| ------------------ | ------ | ------------------------------ | ------------- |
| `/api/files`       | GET    | Get user files with pagination | ✅ Complete   |
| `/api/files/:id`   | GET    | Get specific file              | ✅ Complete   |
| `/api/files/stats` | GET    | Get file statistics            | ✅ Complete   |

### File Download Endpoints

| Endpoint                  | Method | Description   | Test Coverage |
| ------------------------- | ------ | ------------- | ------------- |
| `/api/files/:id/download` | GET    | Download file | ✅ Complete   |

### File Preview Endpoints

| Endpoint                 | Method | Description          | Test Coverage |
| ------------------------ | ------ | -------------------- | ------------- |
| `/api/files/:id/preview` | GET    | Get file preview URL | ✅ Complete   |

### File Update Endpoints

| Endpoint              | Method | Description                   | Test Coverage |
| --------------------- | ------ | ----------------------------- | ------------- |
| `/api/files/:id`      | PUT    | Update file metadata          | ✅ Complete   |
| `/api/files/:id/move` | PUT    | Move file to different folder | ✅ Complete   |

### File Copy Endpoints

| Endpoint              | Method | Description | Test Coverage |
| --------------------- | ------ | ----------- | ------------- |
| `/api/files/:id/copy` | POST   | Copy file   | ✅ Complete   |

### File Delete Endpoints

| Endpoint                   | Method | Description           | Test Coverage |
| -------------------------- | ------ | --------------------- | ------------- |
| `/api/files/:id`           | DELETE | Soft delete file      | ✅ Complete   |
| `/api/files/:id/permanent` | DELETE | Permanent delete file | ✅ Complete   |
| `/api/files/:id/restore`   | POST   | Restore deleted file  | ✅ Complete   |

### Public File Endpoints

| Endpoint                        | Method | Description        | Test Coverage |
| ------------------------------- | ------ | ------------------ | ------------- |
| `/api/files/public/:publicLink` | GET    | Access public file | ✅ Complete   |

## 🧪 Test Scenarios

### 1. File Upload Operations

#### Single File Upload

- ✅ Upload file with metadata (description, tags)
- ✅ Upload file to specific folder
- ✅ Upload public file with public link generation
- ✅ Validate file size and type restrictions
- ✅ Handle missing file uploads
- ✅ Handle invalid folder references

#### Multiple File Upload

- ✅ Upload multiple files simultaneously
- ✅ Apply common metadata to all files
- ✅ Handle mixed file types
- ✅ Validate upload limits

### 2. File Retrieval Operations

#### Pagination and Filtering

- ✅ Get files with pagination (page, limit)
- ✅ Filter files by folder
- ✅ Search files by name
- ✅ Sort files by various criteria
- ✅ Handle empty result sets

#### Individual File Access

- ✅ Get specific file by ID
- ✅ Handle non-existent files
- ✅ Validate file ownership

### 3. File Download Operations

#### Secure Downloads

- ✅ Download file with proper headers
- ✅ Validate file ownership before download
- ✅ Handle non-existent file downloads
- ✅ Verify download content integrity

### 4. File Preview Operations

#### Preview Generation

- ✅ Generate preview URLs for images
- ✅ Handle non-previewable file types
- ✅ Validate preview access permissions

### 5. File Update Operations

#### Metadata Updates

- ✅ Update file name and description
- ✅ Update file tags
- ✅ Toggle public/private status
- ✅ Validate update data

#### File Moving

- ✅ Move file between folders
- ✅ Move file to root directory
- ✅ Handle invalid destination folders

### 6. File Copy Operations

#### File Duplication

- ✅ Copy file with new name
- ✅ Copy file to different folder
- ✅ Generate unique names for copies
- ✅ Validate copy permissions

### 7. File Delete and Restore Operations

#### Soft Delete

- ✅ Soft delete file (mark as deleted)
- ✅ Verify file is hidden from normal queries
- ✅ Maintain file data for potential restore

#### Restore Operations

- ✅ Restore soft deleted file
- ✅ Handle restore of non-deleted files
- ✅ Verify restored file accessibility

#### Permanent Delete

- ✅ Permanently delete file
- ✅ Verify complete removal from system
- ✅ Handle cascade deletions

### 8. File Statistics Operations

#### Usage Analytics

- ✅ Get total file count and size
- ✅ Analyze file types distribution
- ✅ Calculate storage usage
- ✅ Track download statistics

### 9. Public File Operations

#### Public Access

- ✅ Access public files without authentication
- ✅ Validate public link format
- ✅ Handle invalid public links
- ✅ Prevent access to private files

### 10. Error Handling and Edge Cases

#### Authorization

- ✅ Handle unauthorized access attempts
- ✅ Validate JWT tokens
- ✅ Handle missing authorization headers

#### Data Validation

- ✅ Validate file ID formats
- ✅ Handle invalid folder IDs
- ✅ Test file size limits
- ✅ Validate file type restrictions

#### Concurrent Operations

- ✅ Handle multiple simultaneous uploads
- ✅ Test concurrent file modifications
- ✅ Validate data consistency

## 📊 Test Coverage Metrics

The complete file operations tests provide comprehensive coverage:

- **API Endpoints**: 100% coverage of file-related endpoints
- **HTTP Methods**: All CRUD operations tested
- **Status Codes**: Success and error responses validated
- **Authentication**: Authorization flows tested
- **Data Validation**: Input validation and error handling
- **Edge Cases**: Boundary conditions and error scenarios
- **Integration**: File-folder relationships and dependencies

## 🔍 Debugging Tests

### Common Issues and Solutions

#### Database Connection Issues

```bash
# Reset test database
npm run db:test:teardown
npm run db:test:setup
```

#### Timeout Issues

```bash
# Increase timeout for slow operations
node tests/e2e/run-file-operations-tests.js --timeout=600000
```

#### S3 Mock Issues

```bash
# Ensure S3 service is properly mocked
npm run test:s3
```

### Debug Mode

```bash
# Run tests with debug output
NODE_ENV=test DEBUG=* npm run test:e2e -- --testPathPattern=complete-file-operations.e2e.test.js
```

### Individual Test Execution

```bash
# Run specific test suite
npm run test:e2e -- --testNamePattern="File Upload Operations"

# Run specific test
npm run test:e2e -- --testNamePattern="should upload single file successfully"
```

## 📈 Performance Considerations

### Test Optimization

- **Parallel Execution**: Tests are designed to run independently
- **Database Cleanup**: Proper cleanup prevents test interference
- **Resource Management**: Efficient file handling and cleanup
- **Timeout Configuration**: Appropriate timeouts for file operations

### Monitoring

- **Test Duration**: Monitor test execution times
- **Memory Usage**: Track memory consumption during file operations
- **Database Performance**: Monitor query performance
- **S3 Operations**: Track upload/download performance

## 🚨 Security Testing

### Authentication and Authorization

- ✅ JWT token validation
- ✅ User ownership verification
- ✅ Public/private file access control
- ✅ Cross-user access prevention

### Input Validation

- ✅ File type validation
- ✅ File size limits
- ✅ Path traversal prevention
- ✅ SQL injection prevention

### Data Protection

- ✅ Secure file storage
- ✅ Encrypted file transfers
- ✅ Access logging
- ✅ Audit trail maintenance

## 📝 Best Practices

### Test Organization

1. **Group Related Tests**: Organize tests by functionality
2. **Clear Test Names**: Use descriptive test names
3. **Proper Setup/Teardown**: Ensure clean test environment
4. **Independent Tests**: Tests should not depend on each other

### Test Data Management

1. **Unique Test Data**: Use unique identifiers for test data
2. **Proper Cleanup**: Clean up all test data after tests
3. **Isolation**: Tests should not interfere with each other
4. **Realistic Data**: Use realistic file sizes and types

### Error Handling

1. **Expected Errors**: Test both success and failure scenarios
2. **Error Messages**: Validate error message content
3. **Status Codes**: Verify correct HTTP status codes
4. **Edge Cases**: Test boundary conditions

## 🔄 Continuous Integration

### CI/CD Integration

```yaml
# Example GitHub Actions workflow
- name: Run File Operations E2E Tests
  run: |
    cd backend
    npm run test:e2e -- --testPathPattern=complete-file-operations.e2e.test.js
    --coverage --ci --watchAll=false
```

### Test Reporting

- **Coverage Reports**: Generate coverage reports for file operations
- **Test Results**: Detailed test result reporting
- **Performance Metrics**: Track test execution performance
- **Failure Analysis**: Detailed failure reporting and debugging

## 📚 Additional Resources

- [Jest Testing Framework](https://jestjs.io/)
- [Supertest HTTP Testing](https://github.com/visionmedia/supertest)
- [Sequelize ORM](https://sequelize.org/)
- [AWS S3 SDK](https://aws.amazon.com/sdk-for-javascript/)

## 🤝 Contributing

When adding new file operations or modifying existing ones:

1. **Update Tests**: Add corresponding test cases
2. **Maintain Coverage**: Ensure 100% test coverage
3. **Document Changes**: Update this guide
4. **Run Full Suite**: Execute complete test suite
5. **Review Performance**: Monitor test execution times

---

**Note**: This guide covers the complete file operations e2e test suite. For unit tests and integration tests, refer to the respective test directories and documentation.
