const fs = require("fs");
const path = require("path");

// Simple test to verify basic functionality
console.log("🧪 Testing Basic File and Folder Operations...\n");

// Test 1: Check if we can create a test folder
console.log("📁 Test 1: Creating test folder...");
const testFolderPath = path.join(__dirname, "test-folder");
try {
  if (!fs.existsSync(testFolderPath)) {
    fs.mkdirSync(testFolderPath);
    console.log("✅ Successfully created test folder");
  } else {
    console.log("✅ Test folder already exists");
  }
} catch (error) {
  console.log("❌ Failed to create test folder:", error.message);
}

// Test 2: Check if we can create a test file
console.log("\n📄 Test 2: Creating test file...");
const testFilePath = path.join(testFolderPath, "test-file.txt");
const testContent = "This is a test file content for E2E testing";
try {
  fs.writeFileSync(testFilePath, testContent);
  console.log("✅ Successfully created test file");
} catch (error) {
  console.log("❌ Failed to create test file:", error.message);
}

// Test 3: Check if we can read the test file
console.log("\n📖 Test 3: Reading test file...");
try {
  const readContent = fs.readFileSync(testFilePath, "utf8");
  if (readContent === testContent) {
    console.log("✅ Successfully read test file with correct content");
  } else {
    console.log("❌ File content does not match expected content");
  }
} catch (error) {
  console.log("❌ Failed to read test file:", error.message);
}

// Test 4: Check if we can create nested folders
console.log("\n📂 Test 4: Creating nested folder structure...");
const nestedFolderPath = path.join(testFolderPath, "nested", "deep", "folder");
try {
  fs.mkdirSync(nestedFolderPath, { recursive: true });
  console.log("✅ Successfully created nested folder structure");
} catch (error) {
  console.log("❌ Failed to create nested folders:", error.message);
}

// Test 5: Check if we can list directory contents
console.log("\n📋 Test 5: Listing directory contents...");
try {
  const contents = fs.readdirSync(testFolderPath);
  console.log("✅ Successfully listed directory contents:", contents);
} catch (error) {
  console.log("❌ Failed to list directory contents:", error.message);
}

// Test 6: Check if we can delete the test file
console.log("\n🗑️ Test 6: Deleting test file...");
try {
  fs.unlinkSync(testFilePath);
  console.log("✅ Successfully deleted test file");
} catch (error) {
  console.log("❌ Failed to delete test file:", error.message);
}

// Test 7: Check if we can delete the test folder
console.log("\n🗑️ Test 7: Deleting test folder...");
try {
  fs.rmSync(testFolderPath, { recursive: true, force: true });
  console.log("✅ Successfully deleted test folder");
} catch (error) {
  console.log("❌ Failed to delete test folder:", error.message);
}

// Test 8: Check if we can create a large file
console.log("\n📊 Test 8: Creating large test file...");
const largeFilePath = path.join(__dirname, "large-test-file.txt");
const largeContent = "x".repeat(1024 * 1024); // 1MB
try {
  fs.writeFileSync(largeFilePath, largeContent);
  const stats = fs.statSync(largeFilePath);
  console.log(`✅ Successfully created large file (${stats.size} bytes)`);

  // Clean up large file
  fs.unlinkSync(largeFilePath);
  console.log("✅ Successfully cleaned up large file");
} catch (error) {
  console.log("❌ Failed to create large file:", error.message);
}

// Test 9: Check if we can create multiple files
console.log("\n📚 Test 9: Creating multiple files...");
const multipleFilesPath = path.join(__dirname, "multiple-files-test");
try {
  fs.mkdirSync(multipleFilesPath);

  for (let i = 1; i <= 5; i++) {
    const filePath = path.join(multipleFilesPath, `file-${i}.txt`);
    fs.writeFileSync(filePath, `Content for file ${i}`);
  }

  const files = fs.readdirSync(multipleFilesPath);
  console.log(`✅ Successfully created ${files.length} files:`, files);

  // Clean up multiple files
  fs.rmSync(multipleFilesPath, { recursive: true, force: true });
  console.log("✅ Successfully cleaned up multiple files");
} catch (error) {
  console.log("❌ Failed to create multiple files:", error.message);
}

// Test 10: Check file system permissions
console.log("\n🔐 Test 10: Checking file system permissions...");
try {
  const tempFile = path.join(__dirname, "temp-permission-test.txt");
  fs.writeFileSync(tempFile, "test");
  fs.accessSync(tempFile, fs.constants.R_OK | fs.constants.W_OK);
  console.log("✅ File system permissions are working correctly");
  fs.unlinkSync(tempFile);
} catch (error) {
  console.log("❌ File system permission issues:", error.message);
}

console.log("\n🎉 Basic functionality tests completed!");
console.log("\n📝 Summary:");
console.log(
  "- If all tests show ✅, your file system operations are working correctly"
);
console.log(
  "- If any tests show ❌, there may be permission or configuration issues"
);
console.log("\n💡 Next steps:");
console.log(
  "1. Run the E2E tests: ./run-e2e-tests.bat (Windows) or ./run-e2e-tests.sh (Linux/Mac)"
);
console.log(
  "2. Check the E2E_TESTING.md file for detailed testing instructions"
);
console.log("3. Review test results in the test-results/ directory");
