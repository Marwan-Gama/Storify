/**
 * Test Runner for Complete File Operations E2E Tests
 *
 * This script runs comprehensive end-to-end tests for all file operations
 * including upload, download, update, delete, restore, copy, move, preview,
 * statistics, and public file access.
 */

const { spawn } = require("child_process");
const path = require("path");

// Test configuration
const TEST_CONFIG = {
  testFile: "complete-file-operations.e2e.test.js",
  timeout: 300000, // 5 minutes
  verbose: true,
  coverage: false,
  watch: false,
};

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  verbose: args.includes("--verbose") || args.includes("-v"),
  coverage: args.includes("--coverage") || args.includes("-c"),
  watch: args.includes("--watch") || args.includes("-w"),
  timeout:
    args.find((arg) => arg.startsWith("--timeout="))?.split("=")[1] ||
    TEST_CONFIG.timeout,
};

console.log("🚀 Starting Complete File Operations E2E Tests...\n");

// Build Jest command
const jestArgs = [
  "--testPathPattern=tests/e2e/complete-file-operations.e2e.test.js",
  "--testTimeout=" + options.timeout,
  "--verbose=" + options.verbose,
  "--detectOpenHandles",
  "--forceExit",
];

if (options.coverage) {
  jestArgs.push("--coverage");
}

if (options.watch) {
  jestArgs.push("--watch");
}

// Environment setup
const env = {
  ...process.env,
  NODE_ENV: "test",
  TEST_MODE: "e2e",
  JEST_TIMEOUT: options.timeout.toString(),
};

console.log("📋 Test Configuration:");
console.log(`   Test File: ${TEST_CONFIG.testFile}`);
console.log(`   Timeout: ${options.timeout}ms`);
console.log(`   Verbose: ${options.verbose}`);
console.log(`   Coverage: ${options.coverage}`);
console.log(`   Watch Mode: ${options.watch}`);
console.log("");

// Run the tests
const jestProcess = spawn("npx", ["jest", ...jestArgs], {
  stdio: "inherit",
  env,
  cwd: path.resolve(__dirname, "../.."),
});

jestProcess.on("close", (code) => {
  console.log("\n📊 Test Results:");

  if (code === 0) {
    console.log("✅ All file operations tests passed successfully!");
    console.log("\n🎉 Test Summary:");
    console.log(
      "   ✓ File Upload Operations (single, multiple, public, folder uploads)"
    );
    console.log(
      "   ✓ File Retrieval Operations (pagination, search, by folder, by ID)"
    );
    console.log("   ✓ File Download Operations (download, access control)");
    console.log(
      "   ✓ File Preview Operations (image preview, non-previewable files)"
    );
    console.log("   ✓ File Update Operations (metadata, move, validation)");
    console.log("   ✓ File Copy Operations (copy with new name, to folder)");
    console.log(
      "   ✓ File Delete and Restore Operations (soft delete, restore, permanent delete)"
    );
    console.log("   ✓ File Statistics Operations (stats, file types)");
    console.log("   ✓ Public File Operations (public access, access control)");
    console.log(
      "   ✓ Error Handling and Edge Cases (unauthorized, invalid data, concurrent ops)"
    );
    console.log(
      "   ✓ File Type and Size Validation (oversized files, different types)"
    );
  } else {
    console.log(
      "❌ Some tests failed. Please check the output above for details."
    );
    throw new Error(`Tests failed with exit code ${code}`);
  }
});

jestProcess.on("error", (error) => {
  console.error("❌ Failed to start test process:", error.message);
  throw new Error(`Failed to start test process: ${error.message}`);
});

// Handle process termination
process.on("SIGINT", () => {
  console.log("\n🛑 Stopping tests...");
  jestProcess.kill("SIGINT");
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Stopping tests...");
  jestProcess.kill("SIGTERM");
});
