const { test, expect } = require("@playwright/test");

test.describe("Comprehensive UI E2E Tests - File and Folder Operations", () => {
  let authToken;
  let testUser;

  test.beforeAll(async ({ request }) => {
    // Create test user via API
    const userResponse = await request.post("/api/auth/register", {
      data: {
        email: "uitest@example.com",
        password: "UITestPassword123!",
        firstName: "UI",
        lastName: "Test",
        isActive: true,
      },
    });

    if (userResponse.ok()) {
      testUser = await userResponse.json();
    } else {
      // If registration fails, try login
      const loginResponse = await request.post("/api/auth/login", {
        data: {
          email: "uitest@example.com",
          password: "UITestPassword123!",
        },
      });

      if (loginResponse.ok()) {
        const loginData = await loginResponse.json();
        authToken = loginData.token;
      }
    }
  });

  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto("http://localhost:3000");

    // Wait for the page to load
    await page.waitForLoadState("networkidle");
  });

  test.describe("Authentication Flow", () => {
    test("should display login form", async ({ page }) => {
      // Check if login form is visible
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test("should login successfully", async ({ page }) => {
      // Fill login form
      await page.fill('input[type="email"]', "uitest@example.com");
      await page.fill('input[type="password"]', "UITestPassword123!");

      // Submit form
      await page.click('button[type="submit"]');

      // Wait for navigation to files page
      await page.waitForURL("**/files");

      // Verify we're on the files page
      await expect(page.locator("h1")).toContainText("Files");
    });

    test("should show error for invalid credentials", async ({ page }) => {
      // Fill login form with wrong credentials
      await page.fill('input[type="email"]', "uitest@example.com");
      await page.fill('input[type="password"]', "wrongpassword");

      // Submit form
      await page.click('button[type="submit"]');

      // Check for error message
      await expect(
        page.locator('.error-message, .alert, [data-testid="error"]')
      ).toBeVisible();
    });
  });

  test.describe("Folder Operations", () => {
    test("should create new folder", async ({ page }) => {
      // Login first
      await page.fill('input[type="email"]', "uitest@example.com");
      await page.fill('input[type="password"]', "UITestPassword123!");
      await page.click('button[type="submit"]');
      await page.waitForURL("**/files");

      // Click create folder button
      await page.click(
        '[data-testid="create-folder-btn"], button:has-text("New Folder"), .create-folder-btn'
      );

      // Fill folder name
      await page.fill(
        'input[placeholder*="folder"], input[name="folderName"], #folder-name',
        "Test Folder"
      );

      // Submit
      await page.click('button:has-text("Create"), button[type="submit"]');

      // Verify folder is created
      await expect(page.locator("text=Test Folder")).toBeVisible();
    });

    test("should navigate into folder", async ({ page }) => {
      // Login first
      await page.fill('input[type="email"]', "uitest@example.com");
      await page.fill('input[type="password"]', "UITestPassword123!");
      await page.click('button[type="submit"]');
      await page.waitForURL("**/files");

      // Create a folder first
      await page.click(
        '[data-testid="create-folder-btn"], button:has-text("New Folder"), .create-folder-btn'
      );
      await page.fill(
        'input[placeholder*="folder"], input[name="folderName"], #folder-name',
        "Navigation Test"
      );
      await page.click('button:has-text("Create"), button[type="submit"]');

      // Click on the folder to navigate into it
      await page.click("text=Navigation Test");

      // Verify we're inside the folder
      await expect(page.locator(".breadcrumb, .path-indicator")).toContainText(
        "Navigation Test"
      );
    });

    test("should delete folder", async ({ page }) => {
      // Login first
      await page.fill('input[type="email"]', "uitest@example.com");
      await page.fill('input[type="password"]', "UITestPassword123!");
      await page.click('button[type="submit"]');
      await page.waitForURL("**/files");

      // Create a folder
      await page.click(
        '[data-testid="create-folder-btn"], button:has-text("New Folder"), .create-folder-btn'
      );
      await page.fill(
        'input[placeholder*="folder"], input[name="folderName"], #folder-name',
        "Delete Test"
      );
      await page.click('button:has-text("Create"), button[type="submit"]');

      // Right-click or use menu to delete
      await page.click("text=Delete Test", { button: "right" });
      await page.click('text=Delete, .delete-btn, [data-testid="delete-btn"]');

      // Confirm deletion
      await page.click(
        'button:has-text("Confirm"), button:has-text("Delete"), .confirm-btn'
      );

      // Verify folder is deleted
      await expect(page.locator("text=Delete Test")).not.toBeVisible();
    });

    test("should create nested folder structure", async ({ page }) => {
      // Login first
      await page.fill('input[type="email"]', "uitest@example.com");
      await page.fill('input[type="password"]', "UITestPassword123!");
      await page.click('button[type="submit"]');
      await page.waitForURL("**/files");

      // Create parent folder
      await page.click(
        '[data-testid="create-folder-btn"], button:has-text("New Folder"), .create-folder-btn'
      );
      await page.fill(
        'input[placeholder*="folder"], input[name="folderName"], #folder-name',
        "Parent Folder"
      );
      await page.click('button:has-text("Create"), button[type="submit"]');

      // Navigate into parent folder
      await page.click("text=Parent Folder");

      // Create child folder
      await page.click(
        '[data-testid="create-folder-btn"], button:has-text("New Folder"), .create-folder-btn'
      );
      await page.fill(
        'input[placeholder*="folder"], input[name="folderName"], #folder-name',
        "Child Folder"
      );
      await page.click('button:has-text("Create"), button[type="submit"]');

      // Verify child folder exists
      await expect(page.locator("text=Child Folder")).toBeVisible();
    });
  });

  test.describe("File Operations", () => {
    test("should upload single file", async ({ page }) => {
      // Login first
      await page.fill('input[type="email"]', "uitest@example.com");
      await page.fill('input[type="password"]', "UITestPassword123!");
      await page.click('button[type="submit"]');
      await page.waitForURL("**/files");

      // Create test file
      const testFilePath = "test-file.txt";
      await page.evaluate(() => {
        const fs = require("fs");
        fs.writeFileSync(testFilePath, "Test file content");
      });

      // Upload file
      await page.setInputFiles('input[type="file"], .file-input', testFilePath);

      // Wait for upload to complete
      await page.waitForSelector(
        '.upload-progress, .success-message, [data-testid="upload-success"]',
        { timeout: 30000 }
      );

      // Verify file is uploaded
      await expect(page.locator("text=test-file.txt")).toBeVisible();
    });

    test("should upload multiple files", async ({ page }) => {
      // Login first
      await page.fill('input[type="email"]', "uitest@example.com");
      await page.fill('input[type="password"]', "UITestPassword123!");
      await page.click('button[type="submit"]');
      await page.waitForURL("**/files");

      // Create test files
      const testFiles = ["file1.txt", "file2.txt", "file3.txt"];
      for (const fileName of testFiles) {
        await page.evaluate((name) => {
          const fs = require("fs");
          fs.writeFileSync(name, `Content for ${name}`);
        }, fileName);
      }

      // Upload multiple files
      await page.setInputFiles('input[type="file"], .file-input', testFiles);

      // Wait for uploads to complete
      await page.waitForSelector(
        '.upload-progress, .success-message, [data-testid="upload-success"]',
        { timeout: 30000 }
      );

      // Verify all files are uploaded
      for (const fileName of testFiles) {
        await expect(page.locator(`text=${fileName}`)).toBeVisible();
      }
    });

    test("should upload file to specific folder", async ({ page }) => {
      // Login first
      await page.fill('input[type="email"]', "uitest@example.com");
      await page.fill('input[type="password"]', "UITestPassword123!");
      await page.click('button[type="submit"]');
      await page.waitForURL("**/files");

      // Create folder
      await page.click(
        '[data-testid="create-folder-btn"], button:has-text("New Folder"), .create-folder-btn'
      );
      await page.fill(
        'input[placeholder*="folder"], input[name="folderName"], #folder-name',
        "Upload Folder"
      );
      await page.click('button:has-text("Create"), button[type="submit"]');

      // Navigate into folder
      await page.click("text=Upload Folder");

      // Create test file
      const testFilePath = "folder-upload-test.txt";
      await page.evaluate(() => {
        const fs = require("fs");
        fs.writeFileSync("folder-upload-test.txt", "File for folder upload");
      });

      // Upload file
      await page.setInputFiles('input[type="file"], .file-input', testFilePath);

      // Wait for upload to complete
      await page.waitForSelector(
        '.upload-progress, .success-message, [data-testid="upload-success"]',
        { timeout: 30000 }
      );

      // Verify file is uploaded in the folder
      await expect(page.locator("text=folder-upload-test.txt")).toBeVisible();
    });

    test("should download file", async ({ page }) => {
      // Login first
      await page.fill('input[type="email"]', "uitest@example.com");
      await page.fill('input[type="password"]', "UITestPassword123!");
      await page.click('button[type="submit"]');
      await page.waitForURL("**/files");

      // Upload a file first
      const testFilePath = "download-test.txt";
      await page.evaluate(() => {
        const fs = require("fs");
        fs.writeFileSync("download-test.txt", "Content to download");
      });

      await page.setInputFiles('input[type="file"], .file-input', testFilePath);
      await page.waitForSelector(
        '.upload-progress, .success-message, [data-testid="upload-success"]',
        { timeout: 30000 }
      );

      // Click download button
      await page.click("text=download-test.txt");
      await page.click(
        '.download-btn, [data-testid="download-btn"], button:has-text("Download")'
      );

      // Verify download starts (this is hard to test in Playwright, but we can check for no errors)
      await expect(page.locator(".error-message, .alert")).not.toBeVisible();
    });

    test("should delete file", async ({ page }) => {
      // Login first
      await page.fill('input[type="email"]', "uitest@example.com");
      await page.fill('input[type="password"]', "UITestPassword123!");
      await page.click('button[type="submit"]');
      await page.waitForURL("**/files");

      // Upload a file
      const testFilePath = "delete-test.txt";
      await page.evaluate(() => {
        const fs = require("fs");
        fs.writeFileSync("delete-test.txt", "File to delete");
      });

      await page.setInputFiles('input[type="file"], .file-input', testFilePath);
      await page.waitForSelector(
        '.upload-progress, .success-message, [data-testid="upload-success"]',
        { timeout: 30000 }
      );

      // Right-click or use menu to delete
      await page.click("text=delete-test.txt", { button: "right" });
      await page.click('text=Delete, .delete-btn, [data-testid="delete-btn"]');

      // Confirm deletion
      await page.click(
        'button:has-text("Confirm"), button:has-text("Delete"), .confirm-btn'
      );

      // Verify file is deleted
      await expect(page.locator("text=delete-test.txt")).not.toBeVisible();
    });

    test("should rename file", async ({ page }) => {
      // Login first
      await page.fill('input[type="email"]', "uitest@example.com");
      await page.fill('input[type="password"]', "UITestPassword123!");
      await page.click('button[type="submit"]');
      await page.waitForURL("**/files");

      // Upload a file
      const testFilePath = "rename-test.txt";
      await page.evaluate(() => {
        const fs = require("fs");
        fs.writeFileSync("rename-test.txt", "File to rename");
      });

      await page.setInputFiles('input[type="file"], .file-input', testFilePath);
      await page.waitForSelector(
        '.upload-progress, .success-message, [data-testid="upload-success"]',
        { timeout: 30000 }
      );

      // Right-click or use menu to rename
      await page.click("text=rename-test.txt", { button: "right" });
      await page.click('text=Rename, .rename-btn, [data-testid="rename-btn"]');

      // Enter new name
      await page.fill(
        'input[placeholder*="name"], input[name="fileName"], #file-name',
        "renamed-file.txt"
      );
      await page.click('button:has-text("Save"), button[type="submit"]');

      // Verify file is renamed
      await expect(page.locator("text=renamed-file.txt")).toBeVisible();
      await expect(page.locator("text=rename-test.txt")).not.toBeVisible();
    });
  });

  test.describe("Drag and Drop Operations", () => {
    test("should upload file via drag and drop", async ({ page }) => {
      // Login first
      await page.fill('input[type="email"]', "uitest@example.com");
      await page.fill('input[type="password"]', "UITestPassword123!");
      await page.click('button[type="submit"]');
      await page.waitForURL("**/files");

      // Create test file
      const testFilePath = "drag-drop-test.txt";
      await page.evaluate(() => {
        const fs = require("fs");
        fs.writeFileSync("drag-drop-test.txt", "Drag and drop test content");
      });

      // Find drop zone
      const dropZone = page.locator(
        '.drop-zone, .upload-area, [data-testid="drop-zone"]'
      );

      // Simulate drag and drop
      await dropZone.hover();
      await page.setInputFiles('input[type="file"], .file-input', testFilePath);

      // Wait for upload to complete
      await page.waitForSelector(
        '.upload-progress, .success-message, [data-testid="upload-success"]',
        { timeout: 30000 }
      );

      // Verify file is uploaded
      await expect(page.locator("text=drag-drop-test.txt")).toBeVisible();
    });

    test("should move file between folders via drag and drop", async ({
      page,
    }) => {
      // Login first
      await page.fill('input[type="email"]', "uitest@example.com");
      await page.fill('input[type="password"]', "UITestPassword123!");
      await page.click('button[type="submit"]');
      await page.waitForURL("**/files");

      // Create folder
      await page.click(
        '[data-testid="create-folder-btn"], button:has-text("New Folder"), .create-folder-btn'
      );
      await page.fill(
        'input[placeholder*="folder"], input[name="folderName"], #folder-name',
        "Move Target"
      );
      await page.click('button:has-text("Create"), button[type="submit"]');

      // Upload a file
      const testFilePath = "move-test.txt";
      await page.evaluate(() => {
        const fs = require("fs");
        fs.writeFileSync("move-test.txt", "File to move");
      });

      await page.setInputFiles('input[type="file"], .file-input', testFilePath);
      await page.waitForSelector(
        '.upload-progress, .success-message, [data-testid="upload-success"]',
        { timeout: 30000 }
      );

      // Drag file to folder
      const fileElement = page.locator("text=move-test.txt");
      const folderElement = page.locator("text=Move Target");

      await fileElement.dragTo(folderElement);

      // Verify file is moved
      await page.click("text=Move Target");
      await expect(page.locator("text=move-test.txt")).toBeVisible();
    });
  });

  test.describe("Search and Filter Operations", () => {
    test("should search for files", async ({ page }) => {
      // Login first
      await page.fill('input[type="email"]', "uitest@example.com");
      await page.fill('input[type="password"]', "UITestPassword123!");
      await page.click('button[type="submit"]');
      await page.waitForURL("**/files");

      // Upload files with different names
      const testFiles = [
        "search-test-1.txt",
        "search-test-2.txt",
        "other-file.txt",
      ];
      for (const fileName of testFiles) {
        await page.evaluate((name) => {
          const fs = require("fs");
          fs.writeFileSync(name, `Content for ${name}`);
        }, fileName);

        await page.setInputFiles('input[type="file"], .file-input', fileName);
        await page.waitForSelector(
          '.upload-progress, .success-message, [data-testid="upload-success"]',
          { timeout: 30000 }
        );
      }

      // Search for files containing "search-test"
      await page.fill(
        'input[placeholder*="search"], input[name="search"], #search-input',
        "search-test"
      );

      // Verify only search-test files are visible
      await expect(page.locator("text=search-test-1.txt")).toBeVisible();
      await expect(page.locator("text=search-test-2.txt")).toBeVisible();
      await expect(page.locator("text=other-file.txt")).not.toBeVisible();
    });

    test("should filter files by type", async ({ page }) => {
      // Login first
      await page.fill('input[type="email"]', "uitest@example.com");
      await page.fill('input[type="password"]', "UITestPassword123!");
      await page.click('button[type="submit"]');
      await page.waitForURL("**/files");

      // Upload different file types
      const testFiles = ["document.txt", "image.jpg", "video.mp4"];
      for (const fileName of testFiles) {
        await page.evaluate((name) => {
          const fs = require("fs");
          fs.writeFileSync(name, `Content for ${name}`);
        }, fileName);

        await page.setInputFiles('input[type="file"], .file-input', fileName);
        await page.waitForSelector(
          '.upload-progress, .success-message, [data-testid="upload-success"]',
          { timeout: 30000 }
        );
      }

      // Filter by text files
      await page.click(
        '.filter-btn, [data-testid="filter-btn"], button:has-text("Filter")'
      );
      await page.click(
        'text=Text Files, .text-filter, [data-testid="text-filter"]'
      );

      // Verify only text files are visible
      await expect(page.locator("text=document.txt")).toBeVisible();
      await expect(page.locator("text=image.jpg")).not.toBeVisible();
      await expect(page.locator("text=video.mp4")).not.toBeVisible();
    });
  });

  test.describe("Breadcrumb Navigation", () => {
    test("should navigate using breadcrumbs", async ({ page }) => {
      // Login first
      await page.fill('input[type="email"]', "uitest@example.com");
      await page.fill('input[type="password"]', "UITestPassword123!");
      await page.click('button[type="submit"]');
      await page.waitForURL("**/files");

      // Create nested folder structure
      await page.click(
        '[data-testid="create-folder-btn"], button:has-text("New Folder"), .create-folder-btn'
      );
      await page.fill(
        'input[placeholder*="folder"], input[name="folderName"], #folder-name',
        "Level 1"
      );
      await page.click('button:has-text("Create"), button[type="submit"]');

      await page.click("text=Level 1");

      await page.click(
        '[data-testid="create-folder-btn"], button:has-text("New Folder"), .create-folder-btn'
      );
      await page.fill(
        'input[placeholder*="folder"], input[name="folderName"], #folder-name',
        "Level 2"
      );
      await page.click('button:has-text("Create"), button[type="submit"]');

      await page.click("text=Level 2");

      // Navigate back using breadcrumbs
      await page.click(
        '.breadcrumb a, .breadcrumb-item, [data-testid="breadcrumb-level1"]'
      );

      // Verify we're back in Level 1
      await expect(page.locator("text=Level 2")).toBeVisible();
    });
  });

  test.describe("Error Handling", () => {
    test("should handle upload errors gracefully", async ({ page }) => {
      // Login first
      await page.fill('input[type="email"]', "uitest@example.com");
      await page.fill('input[type="password"]', "UITestPassword123!");
      await page.click('button[type="submit"]');
      await page.waitForURL("**/files");

      // Try to upload a very large file (if size limits are configured)
      const largeFilePath = "large-file.txt";
      await page.evaluate(() => {
        const fs = require("fs");
        fs.writeFileSync("large-file.txt", "x".repeat(1024 * 1024 * 100)); // 100MB
      });

      await page.setInputFiles(
        'input[type="file"], .file-input',
        largeFilePath
      );

      // Check for error message
      await expect(
        page.locator('.error-message, .alert, [data-testid="upload-error"]')
      ).toBeVisible();
    });

    test("should handle network errors", async ({ page }) => {
      // Login first
      await page.fill('input[type="email"]', "uitest@example.com");
      await page.fill('input[type="password"]', "UITestPassword123!");
      await page.click('button[type="submit"]');
      await page.waitForURL("**/files");

      // Simulate network error by going offline
      await page.context().setOffline(true);

      // Try to create a folder
      await page.click(
        '[data-testid="create-folder-btn"], button:has-text("New Folder"), .create-folder-btn'
      );
      await page.fill(
        'input[placeholder*="folder"], input[name="folderName"], #folder-name',
        "Network Test"
      );
      await page.click('button:has-text("Create"), button[type="submit"]');

      // Check for network error message
      await expect(
        page.locator('.error-message, .alert, [data-testid="network-error"]')
      ).toBeVisible();

      // Go back online
      await page.context().setOffline(false);
    });
  });

  test.describe("Performance Tests", () => {
    test("should handle large number of files", async ({ page }) => {
      // Login first
      await page.fill('input[type="email"]', "uitest@example.com");
      await page.fill('input[type="password"]', "UITestPassword123!");
      await page.click('button[type="submit"]');
      await page.waitForURL("**/files");

      // Upload many files
      const testFiles = [];
      for (let i = 0; i < 20; i++) {
        const fileName = `performance-test-${i}.txt`;
        testFiles.push(fileName);

        await page.evaluate((name) => {
          const fs = require("fs");
          fs.writeFileSync(name, `Content for ${name}`);
        }, fileName);

        await page.setInputFiles('input[type="file"], .file-input', fileName);
        await page.waitForSelector(
          '.upload-progress, .success-message, [data-testid="upload-success"]',
          { timeout: 30000 }
        );
      }

      // Verify all files are visible
      for (const fileName of testFiles) {
        await expect(page.locator(`text=${fileName}`)).toBeVisible();
      }

      // Test scrolling performance
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(1000);
    });

    test("should handle rapid folder creation", async ({ page }) => {
      // Login first
      await page.fill('input[type="email"]', "uitest@example.com");
      await page.fill('input[type="password"]', "UITestPassword123!");
      await page.click('button[type="submit"]');
      await page.waitForURL("**/files");

      // Create many folders rapidly
      for (let i = 0; i < 10; i++) {
        await page.click(
          '[data-testid="create-folder-btn"], button:has-text("New Folder"), .create-folder-btn'
        );
        await page.fill(
          'input[placeholder*="folder"], input[name="folderName"], #folder-name',
          `Rapid Folder ${i}`
        );
        await page.click('button:has-text("Create"), button[type="submit"]');
        await page.waitForTimeout(100); // Small delay
      }

      // Verify all folders are created
      for (let i = 0; i < 10; i++) {
        await expect(page.locator(`text=Rapid Folder ${i}`)).toBeVisible();
      }
    });
  });
});
