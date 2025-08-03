// Set test environment variables
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-jwt-secret-key";
process.env.DB_NAME = "cloud_storage_test";
process.env.DB_NAME_TEST = "cloud_storage_test";
process.env.DB_USER = "root";
process.env.DB_PASSWORD = "";
process.env.DB_HOST = "localhost";
process.env.DB_PORT = "3306";

// AWS S3 test configuration
process.env.AWS_ACCESS_KEY_ID = "test-access-key";
process.env.AWS_SECRET_ACCESS_KEY = "test-secret-key";
process.env.AWS_REGION = "us-east-1";
process.env.AWS_S3_BUCKET = "test-bucket";

// Email configuration
process.env.EMAIL_HOST = "smtp.test.com";
process.env.EMAIL_PORT = "587";
process.env.EMAIL_USER = "test@example.com";
process.env.EMAIL_PASS = "test-password";

// App configuration
process.env.APP_URL = "http://localhost:3000";
process.env.PORT = "5000";

// File upload limits
process.env.MAX_FILE_SIZE = "104857600"; // 100MB
process.env.ALLOWED_FILE_TYPES =
  "image/*,video/*,audio/*,application/pdf,text/plain";
process.env.FREE_TIER_LIMIT = "1073741824"; // 1GB
process.env.PREMIUM_TIER_LIMIT = "10737418240"; // 10GB

// Rate limiting
process.env.RATE_LIMIT_WINDOW_MS = "900000"; // 15 minutes
process.env.RATE_LIMIT_MAX_REQUESTS = "100";

// Disable logging during tests
process.env.LOG_LEVEL = "error";
