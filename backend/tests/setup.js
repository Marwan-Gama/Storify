const { sequelize } = require("../models");

// Global test setup
beforeAll(async () => {
  try {
    // Connect to test database
    await sequelize.authenticate();
    console.log("✅ Test database connected successfully");

    // Sync database models for testing
    await sequelize.sync({ force: true });
    console.log("✅ Test database models synchronized");
  } catch (error) {
    console.error("❌ Test database connection failed:", error);
    throw error;
  }
});

// Global test teardown
afterAll(async () => {
  try {
    // Close database connection
    await sequelize.close();
    console.log("✅ Test database connection closed");
  } catch (error) {
    console.error("❌ Error closing test database connection:", error);
  }
});

// Global test utilities
global.testUtils = {
  // Generate test user data
  generateTestUser: (overrides = {}) => ({
    name: `Test User ${Date.now()}`,
    email: `test_${Date.now()}@example.com`,
    password: "TestPassword123!",
    tier: "free",
    ...overrides,
  }),

  // Generate test file data
  generateTestFile: (overrides = {}) => ({
    name: "Test File",
    originalName: "test.txt",
    mimeType: "text/plain",
    size: 1024,
    extension: ".txt",
    s3Key: "test-file-key",
    s3Url: "https://test-bucket.s3.amazonaws.com/test-file-key",
    ...overrides,
  }),

  // Generate test folder data
  generateTestFolder: (overrides = {}) => ({
    name: "Test Folder",
    description: "Test folder description",
    s3Key: "test-folder-key",
    ...overrides,
  }),

  // Generate JWT token for testing
  generateTestToken: (user) => {
    const jwt = require("jsonwebtoken");
    return jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || "test-secret",
      { expiresIn: "1h" }
    );
  },

  // Clean up test data
  cleanupTestData: async (models) => {
    for (const model of models) {
      await model.destroy({ where: {}, force: true });
    }
  },

  // Create test file buffer
  createTestFileBuffer: (content = "test file content") => {
    return Buffer.from(content);
  },

  // Mock file upload
  mockFileUpload: (filename = "test.txt", content = "test content") => {
    return {
      fieldname: "file",
      originalname: filename,
      encoding: "7bit",
      mimetype: "text/plain",
      buffer: Buffer.from(content),
      size: Buffer.from(content).length,
    };
  },
};

// Suppress console logs during tests unless explicitly needed
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

beforeEach(() => {
  console.log = jest.fn();
  console.error = jest.fn();
});

afterEach(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
});

// Handle unhandled promise rejections in tests
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

// Handle uncaught exceptions in tests
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});
