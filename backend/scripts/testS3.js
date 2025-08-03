/**
 * S3 Connection Test Script
 * Tests AWS S3 connectivity and configuration
 */

require("dotenv").config();
const s3Service = require("../services/s3Service");

async function testS3Connection() {
  console.log("🔍 Testing AWS S3 Connection...\n");

  // Check environment variables
  console.log("📋 Environment Variables Check:");
  const requiredVars = [
    "AWS_ACCESS_KEY_ID",
    "AWS_SECRET_ACCESS_KEY",
    "AWS_REGION",
    "AWS_S3_BUCKET",
  ];

  const missingVars = [];
  requiredVars.forEach((varName) => {
    if (process.env[varName]) {
      console.log(
        `  ✅ ${varName}: ${varName.includes("SECRET") ? "***" : process.env[varName]}`
      );
    } else {
      console.log(`  ❌ ${varName}: Missing`);
      missingVars.push(varName);
    }
  });

  if (missingVars.length > 0) {
    console.log("\n❌ Missing required environment variables!");
    console.log("Please add the following to your .env file:");
    missingVars.forEach((varName) => {
      console.log(`  ${varName}=your_value_here`);
    });
    throw new Error("Missing required environment variables");
  }

  console.log("\n🚀 Testing S3 Operations...\n");

  try {
    // Test 1: Get bucket stats
    console.log("1️⃣ Testing bucket access...");
    const stats = await s3Service.getBucketStats();
    console.log("   ✅ Bucket access successful!");
    console.log(`   📊 Bucket: ${process.env.AWS_S3_BUCKET}`);
    console.log(`   📈 Total objects: ${stats.totalObjects || "N/A"}`);
    console.log(
      `   💾 Total size: ${stats.totalSize ? `${(stats.totalSize / 1024 / 1024).toFixed(2)} MB` : "N/A"}`
    );

    // Test 2: List files
    console.log("\n2️⃣ Testing file listing...");
    const files = await s3Service.listFiles("", { maxKeys: 5 });
    console.log("   ✅ File listing successful!");
    console.log(`   📁 Files found: ${files.files.length}`);
    console.log(`   📂 Folders found: ${files.folders.length}`);

    // Test 3: Create test folder
    console.log("\n3️⃣ Testing folder creation...");
    const testFolderKey = `test-connection-${Date.now()}`;
    await s3Service.createFolder(testFolderKey);
    console.log("   ✅ Test folder created successfully!");

    // Test 4: Delete test folder
    console.log("\n4️⃣ Testing folder deletion...");
    await s3Service.deleteFolder(testFolderKey);
    console.log("   ✅ Test folder deleted successfully!");

    console.log("\n🎉 All S3 tests passed successfully!");
    console.log("\n📝 Your S3 configuration is working correctly.");
    console.log(
      "   You can now upload, download, and manage files in the cloud."
    );
  } catch (error) {
    console.error("\n❌ S3 connection test failed!");
    console.error(`   Error: ${error.message}`);

    if (error.code === "AccessDenied") {
      console.log("\n🔧 Troubleshooting tips:");
      console.log("   1. Check your AWS IAM permissions");
      console.log("   2. Verify your bucket name is correct");
      console.log("   3. Ensure your bucket exists in the specified region");
      console.log("   4. Check if your access keys are valid");
    } else if (error.code === "NoSuchBucket") {
      console.log("\n🔧 Troubleshooting tips:");
      console.log("   1. Create the S3 bucket first");
      console.log("   2. Verify the bucket name in your .env file");
      console.log("   3. Check if the bucket exists in the correct region");
    } else if (error.code === "InvalidAccessKeyId") {
      console.log("\n🔧 Troubleshooting tips:");
      console.log("   1. Check your AWS_ACCESS_KEY_ID");
      console.log("   2. Verify your access key is correct");
      console.log("   3. Ensure your IAM user has S3 permissions");
    }

    throw error;
  }
}

// Main function to handle the script execution
async function main() {
  try {
    await testS3Connection();
  } catch (error) {
    console.error("Unexpected error:", error);
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }
}

// Run the script
main();
