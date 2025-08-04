const request = require("supertest");
const app = require("../../server");
const { User, File, Folder } = require("../../models");

describe("File Operations E2E Tests", () => {
  let authToken;
  let testUser;

  beforeAll(async () => {
    // Create test user
    testUser = await User.create(global.testUtils.generateTestUser());
    authToken = global.testUtils.generateTestToken(testUser);
  });

  afterAll(async () => {
    // Cleanup
    await User.destroy({ where: { id: testUser.id }, force: true });
  });

  beforeEach(async () => {
    // Clean up files and folders before each test
    await File.destroy({ where: { userId: testUser.id }, force: true });
    await Folder.destroy({ where: { userId: testUser.id }, force: true });
  });

  describe("Authentication Flow", () => {
    test("should authenticate user and get valid token", async () => {
      const response = await request(app).post("/api/auth/login").send({
        email: testUser.email,
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
        email: testUser.email,
        password: "wrongpassword",
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe("Folder Operations E2E", () => {
    test("should create folder successfully", async () => {
      const folderData = {
        name: "Test Folder",
        description: "Test folder description",
      };

      const response = await request(app)
        .post("/api/folders")
        .set("Authorization", `Bearer ${authToken}`)
        .send(folderData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.folder).toBeDefined();
      expect(response.body.folder.name).toBe(folderData.name);
      expect(response.body.folder.userId).toBe(testUser.id);
    });

    test("should get user folders", async () => {
      // First create a folder
      await request(app)
        .post("/api/folders")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ name: "Test Folder 2" });

      const response = await request(app)
        .get("/api/folders")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.folders).toBeDefined();
      expect(Array.isArray(response.body.folders)).toBe(true);
      expect(response.body.folders.length).toBeGreaterThan(0);
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

      // Get folder tree
      const treeResponse = await request(app)
        .get("/api/folders/tree")
        .set("Authorization", `Bearer ${authToken}`);

      expect(treeResponse.status).toBe(200);
      expect(treeResponse.body.folders).toBeDefined();
    });

    test("should update folder", async () => {
      // Create folder first
      const createResponse = await request(app)
        .post("/api/folders")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ name: "Original Name" });

      const folder = createResponse.body.folder;

      // Update folder
      const updateResponse = await request(app)
        .put(`/api/folders/${folder.id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ name: "Updated Name" });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.folder.name).toBe("Updated Name");
    });

    test("should delete folder", async () => {
      // Create folder first
      const createResponse = await request(app)
        .post("/api/folders")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ name: "Folder to Delete" });

      const folder = createResponse.body.folder;

      // Delete folder
      const deleteResponse = await request(app)
        .delete(`/api/folders/${folder.id}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.success).toBe(true);

      // Verify folder is deleted
      const getResponse = await request(app)
        .get(`/api/folders/${folder.id}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(getResponse.status).toBe(404);
    });
  });

  describe("File Operations E2E", () => {
    test("should upload file successfully", async () => {
      const testContent = "This is a test file content";
      const testBuffer = Buffer.from(testContent);

      const response = await request(app)
        .post("/api/files/upload")
        .set("Authorization", `Bearer ${authToken}`)
        .attach("file", testBuffer, "test.txt")
        .field("description", "Test file description");

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.file).toBeDefined();
      expect(response.body.file.name).toBe("test.txt");
      expect(response.body.file.size).toBe(testBuffer.length);
    });

    test("should upload file to specific folder", async () => {
      // Create folder first
      const folderResponse = await request(app)
        .post("/api/folders")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ name: "Upload Folder" });

      const folder = folderResponse.body.folder;

      // Upload file to folder
      const testContent = "File in folder";
      const testBuffer = Buffer.from(testContent);

      const response = await request(app)
        .post("/api/files/upload")
        .set("Authorization", `Bearer ${authToken}`)
        .attach("file", testBuffer, "folder-file.txt")
        .field("folderId", folder.id);

      expect(response.status).toBe(201);
      expect(response.body.file.folderId).toBe(folder.id);
    });

    test("should get user files", async () => {
      // Upload a file first
      const testBuffer = Buffer.from("Test content");
      await request(app)
        .post("/api/files/upload")
        .set("Authorization", `Bearer ${authToken}`)
        .attach("file", testBuffer, "test.txt");

      const response = await request(app)
        .get("/api/files")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.files).toBeDefined();
      expect(Array.isArray(response.body.files)).toBe(true);
      expect(response.body.files.length).toBeGreaterThan(0);
    });

    test("should download file", async () => {
      // Upload a file first
      const testContent = "Download test content";
      const testBuffer = Buffer.from(testContent);

      const uploadResponse = await request(app)
        .post("/api/files/upload")
        .set("Authorization", `Bearer ${authToken}`)
        .attach("file", testBuffer, "download-test.txt");

      const file = uploadResponse.body.file;

      // Download the file
      const downloadResponse = await request(app)
        .get(`/api/files/${file.id}/download`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(downloadResponse.status).toBe(200);
      expect(downloadResponse.headers["content-type"]).toContain("text/plain");
      expect(downloadResponse.headers["content-disposition"]).toContain(
        "download-test.txt"
      );
      expect(downloadResponse.body.toString()).toBe(testContent);
    });

    test("should update file metadata", async () => {
      // Upload a file first
      const testBuffer = Buffer.from("Update test content");
      const uploadResponse = await request(app)
        .post("/api/files/upload")
        .set("Authorization", `Bearer ${authToken}`)
        .attach("file", testBuffer, "update-test.txt");

      const file = uploadResponse.body.file;

      // Update file metadata
      const updateResponse = await request(app)
        .put(`/api/files/${file.id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Updated File Name",
          description: "Updated description",
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.file.name).toBe("Updated File Name");
      expect(updateResponse.body.file.description).toBe("Updated description");
    });

    test("should delete file", async () => {
      // Upload a file first
      const testBuffer = Buffer.from("Delete test content");
      const uploadResponse = await request(app)
        .post("/api/files/upload")
        .set("Authorization", `Bearer ${authToken}`)
        .attach("file", testBuffer, "delete-test.txt");

      const file = uploadResponse.body.file;

      // Delete the file
      const deleteResponse = await request(app)
        .delete(`/api/files/${file.id}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.success).toBe(true);

      // Verify file is deleted
      const getResponse = await request(app)
        .get(`/api/files/${file.id}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(getResponse.status).toBe(404);
    });

    test("should handle large file uploads", async () => {
      // Create a larger test file (1MB)
      const largeContent = "x".repeat(1024 * 1024);
      const largeBuffer = Buffer.from(largeContent);

      const response = await request(app)
        .post("/api/files/upload")
        .set("Authorization", `Bearer ${authToken}`)
        .attach("file", largeBuffer, "large-file.txt");

      expect(response.status).toBe(201);
      expect(response.body.file.size).toBe(largeBuffer.length);
    });

    test("should handle multiple file uploads", async () => {
      const files = [
        { name: "file1.txt", content: "Content 1" },
        { name: "file2.txt", content: "Content 2" },
        { name: "file3.txt", content: "Content 3" },
      ];

      for (const file of files) {
        const response = await request(app)
          .post("/api/files/upload")
          .set("Authorization", `Bearer ${authToken}`)
          .attach("file", Buffer.from(file.content), file.name);

        expect(response.status).toBe(201);
        expect(response.body.file.name).toBe(file.name);
      }

      // Verify all files were uploaded
      const getResponse = await request(app)
        .get("/api/files")
        .set("Authorization", `Bearer ${authToken}`);

      expect(getResponse.body.files.length).toBe(files.length);
    });
  });

  describe("File and Folder Integration E2E", () => {
    test("should organize files in folders and navigate structure", async () => {
      // Create folder structure
      const parentFolder = await request(app)
        .post("/api/folders")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ name: "Parent Folder" });

      const childFolder = await request(app)
        .post("/api/folders")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Child Folder",
          parentId: parentFolder.body.folder.id,
        });

      // Upload files to different folders
      await request(app)
        .post("/api/files/upload")
        .set("Authorization", `Bearer ${authToken}`)
        .attach("file", Buffer.from("Root file"), "root.txt");

      await request(app)
        .post("/api/files/upload")
        .set("Authorization", `Bearer ${authToken}`)
        .attach("file", Buffer.from("Parent file"), "parent.txt")
        .field("folderId", parentFolder.body.folder.id);

      await request(app)
        .post("/api/files/upload")
        .set("Authorization", `Bearer ${authToken}`)
        .attach("file", Buffer.from("Child file"), "child.txt")
        .field("folderId", childFolder.body.folder.id);

      // Get files in root
      const rootFiles = await request(app)
        .get("/api/files")
        .set("Authorization", `Bearer ${authToken}`);

      expect(rootFiles.body.files.length).toBe(1);
      expect(rootFiles.body.files[0].name).toBe("root.txt");

      // Get files in parent folder
      const parentFiles = await request(app)
        .get("/api/files")
        .set("Authorization", `Bearer ${authToken}`)
        .query({ folderId: parentFolder.body.folder.id });

      expect(parentFiles.body.files.length).toBe(1);
      expect(parentFiles.body.files[0].name).toBe("parent.txt");

      // Get files in child folder
      const childFiles = await request(app)
        .get("/api/files")
        .set("Authorization", `Bearer ${authToken}`)
        .query({ folderId: childFolder.body.folder.id });

      expect(childFiles.body.files.length).toBe(1);
      expect(childFiles.body.files[0].name).toBe("child.txt");
    });

    test("should handle folder deletion with files", async () => {
      // Create folder and upload file
      const folder = await request(app)
        .post("/api/folders")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ name: "Folder with Files" });

      await request(app)
        .post("/api/files/upload")
        .set("Authorization", `Bearer ${authToken}`)
        .attach("file", Buffer.from("File in folder"), "folder-file.txt")
        .field("folderId", folder.body.folder.id);

      // Delete folder (should cascade delete files)
      const deleteResponse = await request(app)
        .delete(`/api/folders/${folder.body.folder.id}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(deleteResponse.status).toBe(200);

      // Verify folder and files are deleted
      const folderResponse = await request(app)
        .get(`/api/folders/${folder.body.folder.id}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(folderResponse.status).toBe(404);
    });
  });

  describe("Error Handling E2E", () => {
    test("should handle unauthorized access", async () => {
      const response = await request(app)
        .get("/api/files")
        .set("Authorization", "Bearer invalid-token");

      expect(response.status).toBe(401);
    });

    test("should handle invalid file upload", async () => {
      const response = await request(app)
        .post("/api/files/upload")
        .set("Authorization", `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
    });

    test("should handle duplicate folder names", async () => {
      // Create first folder
      await request(app)
        .post("/api/folders")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ name: "Duplicate Test" });

      // Try to create folder with same name
      const response = await request(app)
        .post("/api/folders")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ name: "Duplicate Test" });

      expect(response.status).toBe(400);
    });

    test("should handle file size limits", async () => {
      // Create a very large file (100MB)
      const largeContent = "x".repeat(100 * 1024 * 1024);
      const largeBuffer = Buffer.from(largeContent);

      const response = await request(app)
        .post("/api/files/upload")
        .set("Authorization", `Bearer ${authToken}`)
        .attach("file", largeBuffer, "very-large-file.txt");

      // Should be rejected due to size limit
      expect(response.status).toBe(400);
    });
  });
});
