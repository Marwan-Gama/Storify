/* eslint-disable */
const request = require("supertest");
const app = require("../../server");
const { User, File, Folder } = require("../../models");
const path = require("path");
const fs = require("fs");

describe("Comprehensive E2E Tests - File and Folder Operations", () => {
  let authToken;
  let testUser;

  beforeAll(async () => {
    // Create test user
    testUser = await User.create({
      email: "test@example.com",
      password: "TestPassword123!",
      firstName: "Test",
      lastName: "User",
      isActive: true,
    });

    authToken = require("jsonwebtoken").sign(
      { userId: testUser.id, email: testUser.email },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "1h" }
    );
  });

  afterAll(async () => {
    // Cleanup
    await File.destroy({ where: { userId: testUser.id }, force: true });
    await Folder.destroy({ where: { userId: testUser.id }, force: true });
    await User.destroy({ where: { id: testUser.id }, force: true });
  });

  beforeEach(async () => {
    // Clean up files and folders before each test
    await File.destroy({ where: { userId: testUser.id }, force: true });
    await Folder.destroy({ where: { userId: testUser.id }, force: true });
  });

  describe("Authentication and Authorization", () => {
    test("should authenticate user and get valid token", async () => {
      const response = await request(app).post("/api/auth/login").send({
        email: "test@example.com",
        password: "TestPassword123!",
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.user).toBeDefined();
      expect(response.body.user.id).toBe(testUser.id);
    });

    test("should reject invalid credentials", async () => {
      const response = await request(app).post("/api/auth/login").send({
        email: "test@example.com",
        password: "wrongpassword",
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test("should reject requests without valid token", async () => {
      const response = await request(app)
        .get("/api/folders")
        .set("Authorization", "Bearer invalid-token");

      expect(response.status).toBe(401);
    });
  });

  describe("Folder Operations - Complete Flow", () => {
    test("should create folder and verify it exists", async () => {
      const folderData = {
        name: "Test Folder",
        description: "Test folder description",
      };

      const createResponse = await request(app)
        .post("/api/folders")
        .set("Authorization", `Bearer ${authToken}`)
        .send(folderData);

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.success).toBe(true);
      expect(createResponse.body.folder).toBeDefined();
      expect(createResponse.body.folder.name).toBe(folderData.name);
      expect(createResponse.body.folder.userId).toBe(testUser.id);

      // Verify folder exists in database
      const folder = await Folder.findByPk(createResponse.body.folder.id);
      expect(folder).toBeDefined();
      expect(folder.name).toBe(folderData.name);
    });

    test("should list user folders", async () => {
      // Create multiple folders
      await request(app)
        .post("/api/folders")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ name: "Folder 1" });

      await request(app)
        .post("/api/folders")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ name: "Folder 2" });

      const response = await request(app)
        .get("/api/folders")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.folders).toBeDefined();
      expect(Array.isArray(response.body.folders)).toBe(true);
      expect(response.body.folders.length).toBe(2);
    });

    test("should create nested folder structure", async () => {
      // Create parent folder
      const parentResponse = await request(app)
        .post("/api/folders")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ name: "Parent Folder" });

      const parentFolder = parentResponse.body.folder;

      // Create child folder
      const childResponse = await request(app)
        .post("/api/folders")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Child Folder",
          parentId: parentFolder.id,
        });

      expect(childResponse.status).toBe(201);
      expect(childResponse.body.folder.parentId).toBe(parentFolder.id);

      // Verify folder tree
      const treeResponse = await request(app)
        .get(`/api/folders/${parentFolder.id}/tree`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(treeResponse.status).toBe(200);
      expect(treeResponse.body.children).toBeDefined();
      expect(treeResponse.body.children.length).toBe(1);
    });

    test("should update folder metadata", async () => {
      // Create folder
      const createResponse = await request(app)
        .post("/api/folders")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ name: "Original Name" });

      const folderId = createResponse.body.folder.id;

      // Update folder
      const updateResponse = await request(app)
        .put(`/api/folders/${folderId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Updated Name",
          description: "Updated description",
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.folder.name).toBe("Updated Name");
      expect(updateResponse.body.folder.description).toBe(
        "Updated description"
      );
    });

    test("should delete folder", async () => {
      // Create folder
      const createResponse = await request(app)
        .post("/api/folders")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ name: "Folder to Delete" });

      const folderId = createResponse.body.folder.id;

      // Delete folder
      const deleteResponse = await request(app)
        .delete(`/api/folders/${folderId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.success).toBe(true);

      // Verify folder is deleted
      const folder = await Folder.findByPk(folderId);
      expect(folder).toBeNull();
    });
  });

  describe("File Operations - Complete Flow", () => {
    test("should upload file successfully", async () => {
      // Create test file
      const testFilePath = path.join(__dirname, "test-file.txt");
      fs.writeFileSync(testFilePath, "This is a test file content");

      const uploadResponse = await request(app)
        .post("/api/files/upload")
        .set("Authorization", `Bearer ${authToken}`)
        .attach("file", testFilePath);

      expect(uploadResponse.status).toBe(201);
      expect(uploadResponse.body.success).toBe(true);
      expect(uploadResponse.body.file).toBeDefined();
      expect(uploadResponse.body.file.originalName).toBe("test-file.txt");

      // Clean up test file
      fs.unlinkSync(testFilePath);
    });

    test("should upload file to specific folder", async () => {
      // Create folder first
      const folderResponse = await request(app)
        .post("/api/folders")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ name: "Upload Folder" });

      const folderId = folderResponse.body.folder.id;

      // Create test file
      const testFilePath = path.join(__dirname, "folder-test-file.txt");
      fs.writeFileSync(testFilePath, "File content for folder upload");

      const uploadResponse = await request(app)
        .post("/api/files/upload")
        .set("Authorization", `Bearer ${authToken}`)
        .field("folderId", folderId)
        .attach("file", testFilePath);

      expect(uploadResponse.status).toBe(201);
      expect(uploadResponse.body.file.folderId).toBe(folderId);

      // Clean up test file
      fs.unlinkSync(testFilePath);
    });

    test("should upload multiple files", async () => {
      // Create test files
      const testFile1 = path.join(__dirname, "multi-test-1.txt");
      const testFile2 = path.join(__dirname, "multi-test-2.txt");
      fs.writeFileSync(testFile1, "First test file");
      fs.writeFileSync(testFile2, "Second test file");

      const uploadResponse = await request(app)
        .post("/api/files/upload-multiple")
        .set("Authorization", `Bearer ${authToken}`)
        .attach("files", testFile1)
        .attach("files", testFile2);

      expect(uploadResponse.status).toBe(201);
      expect(uploadResponse.body.files).toBeDefined();
      expect(uploadResponse.body.files.length).toBe(2);

      // Clean up test files
      fs.unlinkSync(testFile1);
      fs.unlinkSync(testFile2);
    });

    test("should download file", async () => {
      // Upload a file first
      const testFilePath = path.join(__dirname, "download-test.txt");
      const fileContent = "Content to download";
      fs.writeFileSync(testFilePath, fileContent);

      const uploadResponse = await request(app)
        .post("/api/files/upload")
        .set("Authorization", `Bearer ${authToken}`)
        .attach("file", testFilePath);

      const fileId = uploadResponse.body.file.id;

      // Download the file
      const downloadResponse = await request(app)
        .get(`/api/files/${fileId}/download`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(downloadResponse.status).toBe(200);
      expect(downloadResponse.headers["content-disposition"]).toContain(
        "attachment"
      );
      expect(downloadResponse.text).toBe(fileContent);

      // Clean up test file
      fs.unlinkSync(testFilePath);
    });

    test("should list files in folder", async () => {
      // Create folder
      const folderResponse = await request(app)
        .post("/api/folders")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ name: "Files Folder" });

      const folderId = folderResponse.body.folder.id;

      // Upload files to folder
      const testFile1 = path.join(__dirname, "list-test-1.txt");
      const testFile2 = path.join(__dirname, "list-test-2.txt");
      fs.writeFileSync(testFile1, "File 1");
      fs.writeFileSync(testFile2, "File 2");

      await request(app)
        .post("/api/files/upload")
        .set("Authorization", `Bearer ${authToken}`)
        .field("folderId", folderId)
        .attach("file", testFile1);

      await request(app)
        .post("/api/files/upload")
        .set("Authorization", `Bearer ${authToken}`)
        .field("folderId", folderId)
        .attach("file", testFile2);

      // List files in folder
      const listResponse = await request(app)
        .get(`/api/folders/${folderId}/files`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(listResponse.status).toBe(200);
      expect(listResponse.body.files).toBeDefined();
      expect(listResponse.body.files.length).toBe(2);

      // Clean up test files
      fs.unlinkSync(testFile1);
      fs.unlinkSync(testFile2);
    });

    test("should update file metadata", async () => {
      // Upload file
      const testFilePath = path.join(__dirname, "update-test.txt");
      fs.writeFileSync(testFilePath, "Original content");

      const uploadResponse = await request(app)
        .post("/api/files/upload")
        .set("Authorization", `Bearer ${authToken}`)
        .attach("file", testFilePath);

      const fileId = uploadResponse.body.file.id;

      // Update file metadata
      const updateResponse = await request(app)
        .put(`/api/files/${fileId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          originalName: "updated-name.txt",
          description: "Updated file description",
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.file.originalName).toBe("updated-name.txt");
      expect(updateResponse.body.file.description).toBe(
        "Updated file description"
      );

      // Clean up test file
      fs.unlinkSync(testFilePath);
    });

    test("should delete file", async () => {
      // Upload file
      const testFilePath = path.join(__dirname, "delete-test.txt");
      fs.writeFileSync(testFilePath, "File to delete");

      const uploadResponse = await request(app)
        .post("/api/files/upload")
        .set("Authorization", `Bearer ${authToken}`)
        .attach("file", testFilePath);

      const fileId = uploadResponse.body.file.id;

      // Delete file
      const deleteResponse = await request(app)
        .delete(`/api/files/${fileId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.success).toBe(true);

      // Verify file is deleted
      const file = await File.findByPk(fileId);
      expect(file).toBeNull();

      // Clean up test file
      fs.unlinkSync(testFilePath);
    });
  });

  describe("Integration Tests - File and Folder Operations", () => {
    test("should handle folder deletion with files", async () => {
      // Create folder
      const folderResponse = await request(app)
        .post("/api/folders")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ name: "Folder with Files" });

      const folderId = folderResponse.body.folder.id;

      // Upload file to folder
      const testFilePath = path.join(__dirname, "integration-test.txt");
      fs.writeFileSync(testFilePath, "Integration test file");

      await request(app)
        .post("/api/files/upload")
        .set("Authorization", `Bearer ${authToken}`)
        .field("folderId", folderId)
        .attach("file", testFilePath);

      // Delete folder (should cascade delete files)
      const deleteResponse = await request(app)
        .delete(`/api/folders/${folderId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(deleteResponse.status).toBe(200);

      // Verify folder and files are deleted
      const folder = await Folder.findByPk(folderId);
      expect(folder).toBeNull();

      const files = await File.findAll({ where: { folderId } });
      expect(files.length).toBe(0);

      // Clean up test file
      fs.unlinkSync(testFilePath);
    });

    test("should navigate folder structure", async () => {
      // Create folder structure
      const parentResponse = await request(app)
        .post("/api/folders")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ name: "Parent" });

      const childResponse = await request(app)
        .post("/api/folders")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Child",
          parentId: parentResponse.body.folder.id,
        });

      // Navigate to parent folder
      const parentFilesResponse = await request(app)
        .get(`/api/folders/${parentResponse.body.folder.id}/files`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(parentFilesResponse.status).toBe(200);

      // Navigate to child folder
      const childFilesResponse = await request(app)
        .get(`/api/folders/${childResponse.body.folder.id}/files`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(childFilesResponse.status).toBe(200);
    });
  });

  describe("Error Handling and Edge Cases", () => {
    test("should handle duplicate folder names", async () => {
      // Create first folder
      await request(app)
        .post("/api/folders")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ name: "Duplicate Test" });

      // Try to create folder with same name
      const duplicateResponse = await request(app)
        .post("/api/folders")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ name: "Duplicate Test" });

      expect(duplicateResponse.status).toBe(400);
      expect(duplicateResponse.body.success).toBe(false);
    });

    test("should handle file size limits", async () => {
      // Create a large test file (if size limit is configured)
      const largeFilePath = path.join(__dirname, "large-test.txt");
      const largeContent = "x".repeat(1024 * 1024 * 10); // 10MB
      fs.writeFileSync(largeFilePath, largeContent);

      const uploadResponse = await request(app)
        .post("/api/files/upload")
        .set("Authorization", `Bearer ${authToken}`)
        .attach("file", largeFilePath);

      // Response should be handled appropriately (either success or size limit error)
      expect([201, 400, 413]).toContain(uploadResponse.status);

      // Clean up test file
      fs.unlinkSync(largeFilePath);
    });

    test("should handle invalid file types", async () => {
      // Create a file with potentially invalid extension
      const invalidFilePath = path.join(__dirname, "test.exe");
      fs.writeFileSync(invalidFilePath, "Executable content");

      const uploadResponse = await request(app)
        .post("/api/files/upload")
        .set("Authorization", `Bearer ${authToken}`)
        .attach("file", invalidFilePath);

      // Response should be handled appropriately
      expect([201, 400]).toContain(uploadResponse.status);

      // Clean up test file
      fs.unlinkSync(invalidFilePath);
    });

    test("should handle unauthorized access", async () => {
      // Create folder with one user
      const folderResponse = await request(app)
        .post("/api/folders")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ name: "Private Folder" });

      const folderId = folderResponse.body.folder.id;

      // Create another user
      const otherUser = await User.create({
        email: "other@example.com",
        password: "OtherPassword123!",
        firstName: "Other",
        lastName: "User",
        isActive: true,
      });

      const otherToken = require("jsonwebtoken").sign(
        { userId: otherUser.id, email: otherUser.email },
        process.env.JWT_SECRET || "your-secret-key",
        { expiresIn: "1h" }
      );

      // Try to access folder with different user
      const accessResponse = await request(app)
        .get(`/api/folders/${folderId}`)
        .set("Authorization", `Bearer ${otherToken}`);

      expect(accessResponse.status).toBe(403);

      // Clean up other user
      await User.destroy({ where: { id: otherUser.id }, force: true });
    });
  });

  describe("Performance Tests", () => {
    test("should handle multiple concurrent uploads", async () => {
      const uploadPromises = [];
      const testFiles = [];

      // Create multiple test files
      for (let i = 0; i < 5; i++) {
        const testFilePath = path.join(__dirname, `concurrent-test-${i}.txt`);
        fs.writeFileSync(testFilePath, `Concurrent test file ${i}`);
        testFiles.push(testFilePath);

        uploadPromises.push(
          request(app)
            .post("/api/files/upload")
            .set("Authorization", `Bearer ${authToken}`)
            .attach("file", testFilePath)
        );
      }

      const results = await Promise.all(uploadPromises);

      // All uploads should succeed
      results.forEach((result) => {
        expect(result.status).toBe(201);
        expect(result.body.success).toBe(true);
      });

      // Clean up test files
      testFiles.forEach((file) => fs.unlinkSync(file));
    });

    test("should handle large number of folders", async () => {
      const folderPromises = [];

      // Create many folders
      for (let i = 0; i < 10; i++) {
        folderPromises.push(
          request(app)
            .post("/api/folders")
            .set("Authorization", `Bearer ${authToken}`)
            .send({ name: `Performance Folder ${i}` })
        );
      }

      const results = await Promise.all(folderPromises);

      // All folder creations should succeed
      results.forEach((result) => {
        expect(result.status).toBe(201);
        expect(result.body.success).toBe(true);
      });

      // List all folders
      const listResponse = await request(app)
        .get("/api/folders")
        .set("Authorization", `Bearer ${authToken}`);

      expect(listResponse.status).toBe(200);
      expect(listResponse.body.folders.length).toBe(10);
    });
  });
});
