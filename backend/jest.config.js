module.exports = {
  // Test environment
  testEnvironment: "node",

  // Test file patterns
  testMatch: [
    "**/tests/**/*.test.js",
    "**/__tests__/**/*.js",
    "**/?(*.)+(spec|test).js",
  ],

  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    "controllers/**/*.js",
    "services/**/*.js",
    "middleware/**/*.js",
    "models/**/*.js",
    "routes/**/*.js",
    "!**/node_modules/**",
    "!**/coverage/**",
    "!**/tests/**",
    "!**/__tests__/**",
  ],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },

  // Coverage reporters
  coverageReporters: ["text", "lcov", "html"],

  // Setup files
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],

  // Test timeout
  testTimeout: 30000,

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks between tests
  restoreMocks: true,

  // Module name mapping for mocks
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },

  // Environment variables for tests
  setupFiles: ["<rootDir>/tests/env.js"],
};
