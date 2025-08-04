const { test, expect } = require("@playwright/test");
const path = require("path");

test.describe("File Operations E2E Tests", () => {
  let authToken;
  let testUser;

  test.beforeAll(async ({ request }) => {
    // Create test user and get auth token
    const userData = {
      username: `testuser_${Date.now()}`,
      email: `test_${Date.now()}@example.com`,
      password: "TestPassword123!",
    };

    // Register user
    const registerResponse = await request.post("/api/auth/register", {
      data: userData,
    });
    expect(registerResponse.ok()).toBeTruthy();

    // Login to get token
    const loginResponse = await request.post("/api/auth/login", {
      data: {
        email: userData.email,
        password: userData.password,
      },
    });
    expect(loginResponse.ok()).toBeTruthy();

    const loginData = await loginResponse.json();
    authToken = loginData.token;
    testUser = loginData.user;
  });

  test.beforeEach(async ({ page }) => {
    // Set auth token in localStorage
    await page.addInitScript((token) => {
      localStorage.setItem("token", token);
    }, authToken);
  });

  test("should navigate to files page and see empty state", async ({
    page,
  }) => {
    await page.goto("/files");

    // Wait for page to load
    await page.waitForSelector('[data-testid="files-container"]', {
      timeout: 10000,
    });

    // Check if empty state is shown
    const emptyState = page.locator("text=No files found");
    await expect(emptyState).toBeVisible();
  });

  test("should create a new folder", async ({ page }) => {
    await page.goto("/files");

    // Click create folder button
    await page.click('[data-testid="create-folder-btn"]');

    // Fill folder name
    await page.fill('[data-testid="folder-name-input"]', "Test Folder");
    await page.fill(
      '[data-testid="folder-description-input"]',
      "Test folder description"
    );

    // Submit form
    await page.click('[data-testid="create-folder-submit"]');

    // Wait for folder to be created
    await page.waitForSelector("text=Test Folder", { timeout: 10000 });

    // Verify folder is visible
    const folderElement = page.locator("text=Test Folder");
    await expect(folderElement).toBeVisible();
  });

  test("should upload a file", async ({ page }) => {
    await page.goto("/files");

    // Create test file
    const testFilePath = path.join(__dirname, "test-file.txt");
    const fs = require("fs");
    fs.writeFileSync(testFilePath, "This is a test file content");

    // Click upload button
    await page.click('[data-testid="upload-file-btn"]');

    // Upload file
    await page.setInputFiles('[data-testid="file-input"]', testFilePath);

    // Wait for upload to complete
    await page.waitForSelector("text=test-file.txt", { timeout: 30000 });

    // Verify file is visible
    const fileElement = page.locator("text=test-file.txt");
    await expect(fileElement).toBeVisible();

    // Clean up test file
    fs.unlinkSync(testFilePath);
  });

  test("should upload multiple files", async ({ page }) => {
    await page.goto("/files");

    // Create test files
    const fs = require("fs");
    const testFiles = [];

    for (let i = 1; i <= 3; i++) {
      const testFilePath = path.join(__dirname, `test-file-${i}.txt`);
      fs.writeFileSync(testFilePath, `Content for file ${i}`);
      testFiles.push(testFilePath);
    }

    // Click upload button
    await page.click('[data-testid="upload-file-btn"]');

    // Upload multiple files
    await page.setInputFiles('[data-testid="file-input"]', testFiles);

    // Wait for all uploads to complete
    for (let i = 1; i <= 3; i++) {
      await page.waitForSelector(`text=test-file-${i}.txt`, { timeout: 30000 });
    }

    // Verify all files are visible
    for (let i = 1; i <= 3; i++) {
      const fileElement = page.locator(`text=test-file-${i}.txt`);
      await expect(fileElement).toBeVisible();
    }

    // Clean up test files
    testFiles.forEach((file) => fs.unlinkSync(file));
  });

  test("should upload file to specific folder", async ({ page }) => {
    await page.goto("/files");

    // First create a folder
    await page.click('[data-testid="create-folder-btn"]');
    await page.fill('[data-testid="folder-name-input"]', "Upload Folder");
    await page.click('[data-testid="create-folder-submit"]');
    await page.waitForSelector("text=Upload Folder");

    // Click on the folder to open it
    await page.click("text=Upload Folder");

    // Create test file
    const testFilePath = path.join(__dirname, "folder-test-file.txt");
    const fs = require("fs");
    fs.writeFileSync(testFilePath, "File in folder");

    // Upload file to folder
    await page.click('[data-testid="upload-file-btn"]');
    await page.setInputFiles('[data-testid="file-input"]', testFilePath);

    // Wait for upload to complete
    await page.waitForSelector("text=folder-test-file.txt", { timeout: 30000 });

    // Verify file is in the folder
    const fileElement = page.locator("text=folder-test-file.txt");
    await expect(fileElement).toBeVisible();

    // Clean up test file
    fs.unlinkSync(testFilePath);
  });

  test("should download a file", async ({ page }) => {
    await page.goto("/files");

    // First upload a file
    const testFilePath = path.join(__dirname, "download-test-file.txt");
    const fs = require("fs");
    fs.writeFileSync(testFilePath, "Download test content");

    await page.click('[data-testid="upload-file-btn"]');
    await page.setInputFiles('[data-testid="file-input"]', testFilePath);
    await page.waitForSelector("text=download-test-file.txt", {
      timeout: 30000,
    });

    // Set up download listener
    const downloadPromise = page.waitForEvent("download");

    // Click download button
    await page.click('[data-testid="download-file-btn"]');

    // Wait for download to start
    const download = await downloadPromise;

    // Verify download filename
    expect(download.suggestedFilename()).toBe("download-test-file.txt");

    // Clean up test file
    fs.unlinkSync(testFilePath);
  });

  test("should delete a file", async ({ page }) => {
    await page.goto("/files");

    // First upload a file
    const testFilePath = path.join(__dirname, "delete-test-file.txt");
    const fs = require("fs");
    fs.writeFileSync(testFilePath, "Delete test content");

    await page.click('[data-testid="upload-file-btn"]');
    await page.setInputFiles('[data-testid="file-input"]', testFilePath);
    await page.waitForSelector("text=delete-test-file.txt", { timeout: 30000 });

    // Click delete button
    await page.click('[data-testid="delete-file-btn"]');

    // Confirm deletion
    await page.click('[data-testid="confirm-delete-btn"]');

    // Wait for file to be removed
    await page.waitForSelector("text=delete-test-file.txt", {
      state: "hidden",
    });

    // Verify file is no longer visible
    const fileElement = page.locator("text=delete-test-file.txt");
    await expect(fileElement).not.toBeVisible();

    // Clean up test file
    fs.unlinkSync(testFilePath);
  });

  test("should delete a folder with files", async ({ page }) => {
    await page.goto("/files");

    // Create folder
    await page.click('[data-testid="create-folder-btn"]');
    await page.fill('[data-testid="folder-name-input"]', "Folder to Delete");
    await page.click('[data-testid="create-folder-submit"]');
    await page.waitForSelector("text=Folder to Delete");

    // Open folder and upload file
    await page.click("text=Folder to Delete");

    const testFilePath = path.join(__dirname, "folder-delete-test.txt");
    const fs = require("fs");
    fs.writeFileSync(testFilePath, "File in folder to delete");

    await page.click('[data-testid="upload-file-btn"]');
    await page.setInputFiles('[data-testid="file-input"]', testFilePath);
    await page.waitForSelector("text=folder-delete-test.txt", {
      timeout: 30000,
    });

    // Go back to root
    await page.click('[data-testid="breadcrumb-root"]');

    // Delete folder
    await page.click('[data-testid="delete-folder-btn"]');
    await page.click('[data-testid="confirm-delete-btn"]');

    // Wait for folder to be removed
    await page.waitForSelector("text=Folder to Delete", { state: "hidden" });

    // Verify folder is no longer visible
    const folderElement = page.locator("text=Folder to Delete");
    await expect(folderElement).not.toBeVisible();

    // Clean up test file
    fs.unlinkSync(testFilePath);
  });

  test("should rename a file", async ({ page }) => {
    await page.goto("/files");

    // First upload a file
    const testFilePath = path.join(__dirname, "rename-test-file.txt");
    const fs = require("fs");
    fs.writeFileSync(testFilePath, "Rename test content");

    await page.click('[data-testid="upload-file-btn"]');
    await page.setInputFiles('[data-testid="file-input"]', testFilePath);
    await page.waitForSelector("text=rename-test-file.txt", { timeout: 30000 });

    // Click rename button
    await page.click('[data-testid="rename-file-btn"]');

    // Fill new name
    await page.fill('[data-testid="rename-input"]', "renamed-file.txt");
    await page.click('[data-testid="confirm-rename-btn"]');

    // Wait for rename to complete
    await page.waitForSelector("text=renamed-file.txt");

    // Verify new name is visible
    const fileElement = page.locator("text=renamed-file.txt");
    await expect(fileElement).toBeVisible();

    // Verify old name is not visible
    const oldFileElement = page.locator("text=rename-test-file.txt");
    await expect(oldFileElement).not.toBeVisible();

    // Clean up test file
    fs.unlinkSync(testFilePath);
  });

  test("should search for files", async ({ page }) => {
    await page.goto("/files");

    // Upload multiple files with different names
    const fs = require("fs");
    const testFiles = [
      { path: path.join(__dirname, "search-test-1.txt"), content: "Content 1" },
      { path: path.join(__dirname, "search-test-2.txt"), content: "Content 2" },
      {
        path: path.join(__dirname, "other-file.txt"),
        content: "Other content",
      },
    ];

    testFiles.forEach((file) => {
      fs.writeFileSync(file.path, file.content);
    });

    // Upload all files
    await page.click('[data-testid="upload-file-btn"]');
    await page.setInputFiles(
      '[data-testid="file-input"]',
      testFiles.map((f) => f.path)
    );

    // Wait for all uploads
    for (const file of testFiles) {
      await page.waitForSelector(`text=${path.basename(file.path)}`, {
        timeout: 30000,
      });
    }

    // Search for "search-test"
    await page.fill('[data-testid="search-input"]', "search-test");
    await page.keyboard.press("Enter");

    // Wait for search results
    await page.waitForTimeout(1000);

    // Verify only search-test files are visible
    await expect(page.locator("text=search-test-1.txt")).toBeVisible();
    await expect(page.locator("text=search-test-2.txt")).toBeVisible();
    await expect(page.locator("text=other-file.txt")).not.toBeVisible();

    // Clean up test files
    testFiles.forEach((file) => fs.unlinkSync(file.path));
  });

  test("should handle large file upload", async ({ page }) => {
    await page.goto("/files");

    // Create a large test file (1MB)
    const testFilePath = path.join(__dirname, "large-test-file.txt");
    const fs = require("fs");
    const largeContent = "x".repeat(1024 * 1024);
    fs.writeFileSync(testFilePath, largeContent);

    // Click upload button
    await page.click('[data-testid="upload-file-btn"]');

    // Upload large file
    await page.setInputFiles('[data-testid="file-input"]', testFilePath);

    // Wait for upload progress
    await page.waitForSelector('[data-testid="upload-progress"]', {
      timeout: 10000,
    });

    // Wait for upload to complete
    await page.waitForSelector("text=large-test-file.txt", { timeout: 60000 });

    // Verify file is visible
    const fileElement = page.locator("text=large-test-file.txt");
    await expect(fileElement).toBeVisible();

    // Clean up test file
    fs.unlinkSync(testFilePath);
  });

  test("should handle drag and drop file upload", async ({ page }) => {
    await page.goto("/files");

    // Create test file
    const testFilePath = path.join(__dirname, "drag-drop-test.txt");
    const fs = require("fs");
    fs.writeFileSync(testFilePath, "Drag and drop test content");

    // Get the drop zone
    const dropZone = page.locator('[data-testid="drop-zone"]');

    // Drag and drop file
    await dropZone.setInputFiles(testFilePath);

    // Wait for upload to complete
    await page.waitForSelector("text=drag-drop-test.txt", { timeout: 30000 });

    // Verify file is visible
    const fileElement = page.locator("text=drag-drop-test.txt");
    await expect(fileElement).toBeVisible();

    // Clean up test file
    fs.unlinkSync(testFilePath);
  });

  test("should show upload progress", async ({ page }) => {
    await page.goto("/files");

    // Create a moderately large test file
    const testFilePath = path.join(__dirname, "progress-test-file.txt");
    const fs = require("fs");
    const content = "x".repeat(100 * 1024); // 100KB
    fs.writeFileSync(testFilePath, content);

    // Click upload button
    await page.click('[data-testid="upload-file-btn"]');

    // Upload file
    await page.setInputFiles('[data-testid="file-input"]', testFilePath);

    // Wait for progress indicator
    await page.waitForSelector('[data-testid="upload-progress"]', {
      timeout: 10000,
    });

    // Verify progress is shown
    const progressElement = page.locator('[data-testid="upload-progress"]');
    await expect(progressElement).toBeVisible();

    // Wait for upload to complete
    await page.waitForSelector("text=progress-test-file.txt", {
      timeout: 30000,
    });

    // Clean up test file
    fs.unlinkSync(testFilePath);
  });

  test("should handle upload errors gracefully", async ({ page }) => {
    await page.goto("/files");

    // Try to upload without selecting a file
    await page.click('[data-testid="upload-file-btn"]');
    await page.click('[data-testid="upload-submit"]');

    // Check for error message
    const errorMessage = page.locator('[data-testid="upload-error"]');
    await expect(errorMessage).toBeVisible();
  });

  test("should navigate folder structure", async ({ page }) => {
    await page.goto("/files");

    // Create nested folder structure
    await page.click('[data-testid="create-folder-btn"]');
    await page.fill('[data-testid="folder-name-input"]', "Parent Folder");
    await page.click('[data-testid="create-folder-submit"]');
    await page.waitForSelector("text=Parent Folder");

    // Open parent folder
    await page.click("text=Parent Folder");

    // Create child folder
    await page.click('[data-testid="create-folder-btn"]');
    await page.fill('[data-testid="folder-name-input"]', "Child Folder");
    await page.click('[data-testid="create-folder-submit"]');
    await page.waitForSelector("text=Child Folder");

    // Open child folder
    await page.click("text=Child Folder");

    // Verify breadcrumb shows correct path
    const breadcrumb = page.locator('[data-testid="breadcrumb"]');
    await expect(breadcrumb).toContainText("Parent Folder");
    await expect(breadcrumb).toContainText("Child Folder");

    // Navigate back to parent
    await page.click('[data-testid="breadcrumb-parent"]');

    // Verify we're back in parent folder
    await expect(page.locator("text=Child Folder")).toBeVisible();

    // Navigate back to root
    await page.click('[data-testid="breadcrumb-root"]');

    // Verify we're back at root
    await expect(page.locator("text=Parent Folder")).toBeVisible();
  });
});
