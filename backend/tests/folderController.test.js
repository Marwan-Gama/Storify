const request = require("supertest");
const app = require("../server");
const { Folder, User, File } = require("../models");
const s3Service = require("../services/s3Service");
const jwt = require("jsonwebtoken");

// Mock S3 service
jest.mock("../services/s3Service");

describe("Folder Controller", () => {
  let testUser;
  let testFolder;
  let authToken;

  beforeAll(async () => {
    // Create test user
    testUser = await User.create({
      username: "testuser",
      email: "test@example.com",
      password: "TestPassword123!",
      tier: "free",
    });

    // Generate auth token
    authToken = jwt.sign(
      { id: testUser.id, email: testUser.email },
      process.env.JWT_SECRET || "test-secret",
      { expiresIn: "1h" }
    );

    // Mock S3 service methods
    s3Service.createFolder.mockResolvedValue(true);
    s3Service.deleteFolder.mockResolvedValue(true);
  });

  afterAll(async () => {
    // Clean up test data
    await Folder.destroy({ where: { userId: testUser.id }, force: true });
    await User.destroy({ where: { id: testUser.id }, force: true });
  });

  beforeEach(async () => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe("POST /api/folders", () => {
    it("should create a new folder successfully", async () => {
      const response = await request(app)
        .post("/api/folders")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Test Folder",
          description: "Test folder description",
          color: "#FF5733",
          isPublic: "false",
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Folder created successfully");
      expect(response.body.data).toHaveProperty("id");
      expect(response.body.data.name).toBe("Test Folder");
      expect(response.body.data.description).toBe("Test folder description");
      expect(response.body.data.color).toBe("#FF5733");
      expect(response.body.data.isPublic).toBe(false);

      // Verify S3 service was called
      expect(s3Service.createFolder).toHaveBeenCalledTimes(1);
    });

    it("should reject folder creation without authentication", async () => {
      const response = await request(app)
        .post("/api/folders")
        .send({
          name: "Test Folder",
          description: "Test folder description",
        });

      expect(response.status).toBe(401);
    });

    it("should reject folder creation with invalid data", async () => {
      const response = await request(app)
        .post("/api/folders")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "", // Invalid: empty name
          description: "a".repeat(1001), // Invalid: too long
          color: "invalid-color", // Invalid: not hex color
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it("should reject folder creation with duplicate name in same parent", async () => {
      // Create first folder
      await request(app)
        .post("/api/folders")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Duplicate Folder",
          description: "First folder",
        });

      // Try to create second folder with same name
      const response = await request(app)
        .post("/api/folders")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Duplicate Folder",
          description: "Second folder",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        "A folder with this name already exists in this location"
      );
    });

    it("should create folder with parent folder", async () => {
      // Create parent folder
      const parentFolder = await Folder.create({
        name: "Parent Folder",
        userId: testUser.id,
        s3Key: `users/${testUser.id}/folders/parent-folder`,
      });

      const response = await request(app)
        .post("/api/folders")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Child Folder",
          description: "Child folder description",
          parentId: parentFolder.id,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.parentId).toBe(parentFolder.id);

      // Clean up
      await Folder.destroy({ where: { id: parentFolder.id }, force: true });
    });

    it("should reject folder creation with non-existent parent", async () => {
      const response = await request(app)
        .post("/api/folders")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Child Folder",
          parentId: "00000000-0000-0000-0000-000000000000",
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        "Parent folder not found or access denied"
      );
    });
  });

  describe("GET /api/folders", () => {
    beforeEach(async () => {
      // Create test folders
      testFolder = await Folder.create({
        name: "Test Folder",
        description: "Test folder description",
        userId: testUser.id,
        s3Key: `users/${testUser.id}/folders/test-folder`,
      });

      await Folder.create({
        name: "Another Folder",
        description: "Another folder description",
        userId: testUser.id,
        s3Key: `users/${testUser.id}/folders/another-folder`,
      });
    });

    afterEach(async () => {
      await Folder.destroy({ where: { userId: testUser.id }, force: true });
    });

    it("should get user folders successfully", async () => {
      const response = await request(app)
        .get("/api/folders")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.folders).toHaveLength(2);
      expect(response.body.data.pagination).toBeDefined();
    });

    it("should filter folders by parent", async () => {
      // Create parent and child folders
      const parentFolder = await Folder.create({
        name: "Parent Folder",
        userId: testUser.id,
        s3Key: `users/${testUser.id}/folders/parent-folder`,
      });

      const childFolder = await Folder.create({
        name: "Child Folder",
        userId: testUser.id,
        parentId: parentFolder.id,
        s3Key: `users/${testUser.id}/folders/parent-folder/child-folder`,
      });

      const response = await request(app)
        .get(`/api/folders?parentId=${parentFolder.id}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.folders).toHaveLength(1);
      expect(response.body.data.folders[0].id).toBe(childFolder.id);

      // Clean up
      await Folder.destroy({
        where: { id: [parentFolder.id, childFolder.id] },
        force: true,
      });
    });

    it("should search folders by name", async () => {
      const response = await request(app)
        .get("/api/folders?search=Test")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.folders).toHaveLength(1);
      expect(response.body.data.folders[0].name).toBe("Test Folder");
    });

    it("should paginate results", async () => {
      const response = await request(app)
        .get("/api/folders?page=1&limit=1")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.folders).toHaveLength(1);
      expect(response.body.data.pagination.currentPage).toBe(1);
      expect(response.body.data.pagination.totalPages).toBe(2);
    });

    it("should include files when requested", async () => {
      // Create a test file in the folder
      await File.create({
        name: "Test File",
        originalName: "test.txt",
        mimeType: "text/plain",
        size: 1024,
        extension: ".txt",
        s3Key: "test-file-key",
        s3Url: "https://test-bucket.s3.amazonaws.com/test-file-key",
        userId: testUser.id,
        folderId: testFolder.id,
      });

      const response = await request(app)
        .get("/api/folders?includeFiles=true")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.folders[0].files).toBeDefined();
      expect(response.body.data.folders[0].files).toHaveLength(1);

      // Clean up
      await File.destroy({ where: { folderId: testFolder.id }, force: true });
    });
  });

  describe("GET /api/folders/tree", () => {
    beforeEach(async () => {
      // Create folder hierarchy
      const parentFolder = await Folder.create({
        name: "Parent Folder",
        userId: testUser.id,
        s3Key: `users/${testUser.id}/folders/parent-folder`,
      });

      await Folder.create({
        name: "Child Folder 1",
        userId: testUser.id,
        parentId: parentFolder.id,
        s3Key: `users/${testUser.id}/folders/parent-folder/child-1`,
      });

      await Folder.create({
        name: "Child Folder 2",
        userId: testUser.id,
        parentId: parentFolder.id,
        s3Key: `users/${testUser.id}/folders/parent-folder/child-2`,
      });

      await Folder.create({
        name: "Grandchild Folder",
        userId: testUser.id,
        parentId: (await Folder.findOne({ where: { name: "Child Folder 1" } }))
          .id,
        s3Key: `users/${testUser.id}/folders/parent-folder/child-1/grandchild`,
      });
    });

    afterEach(async () => {
      await Folder.destroy({ where: { userId: testUser.id }, force: true });
    });

    it("should get folder tree structure", async () => {
      const response = await request(app)
        .get("/api/folders/tree")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1); // Root level folders
      expect(response.body.data[0].name).toBe("Parent Folder");
      expect(response.body.data[0].children).toHaveLength(2);
      expect(response.body.data[0].children[0].name).toBe("Child Folder 1");
      expect(response.body.data[0].children[0].children).toHaveLength(1);
    });
  });

  describe("GET /api/folders/:id", () => {
    beforeEach(async () => {
      testFolder = await Folder.create({
        name: "Test Folder",
        description: "Test folder description",
        userId: testUser.id,
        s3Key: `users/${testUser.id}/folders/test-folder`,
      });
    });

    afterEach(async () => {
      await Folder.destroy({ where: { id: testFolder.id }, force: true });
    });

    it("should get folder by id successfully", async () => {
      const response = await request(app)
        .get(`/api/folders/${testFolder.id}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testFolder.id);
      expect(response.body.data.name).toBe("Test Folder");
      expect(response.body.data.stats).toBeDefined();
    });

    it("should return 404 for non-existent folder", async () => {
      const response = await request(app)
        .get("/api/folders/00000000-0000-0000-0000-000000000000")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it("should return 400 for invalid folder id", async () => {
      const response = await request(app)
        .get("/api/folders/invalid-id")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(400);
    });

    it("should include folder statistics", async () => {
      // Create test files in the folder
      await File.bulkCreate([
        {
          name: "File 1",
          originalName: "file1.txt",
          mimeType: "text/plain",
          size: 1024,
          extension: ".txt",
          s3Key: "file1-key",
          s3Url: "https://test-bucket.s3.amazonaws.com/file1-key",
          userId: testUser.id,
          folderId: testFolder.id,
        },
        {
          name: "File 2",
          originalName: "file2.jpg",
          mimeType: "image/jpeg",
          size: 2048,
          extension: ".jpg",
          s3Key: "file2-key",
          s3Url: "https://test-bucket.s3.amazonaws.com/file2-key",
          userId: testUser.id,
          folderId: testFolder.id,
        },
      ]);

      const response = await request(app)
        .get(`/api/folders/${testFolder.id}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.stats.fileCount).toBe(2);
      expect(response.body.data.stats.totalSize).toBe(3072);

      // Clean up
      await File.destroy({ where: { folderId: testFolder.id }, force: true });
    });
  });

  describe("PUT /api/folders/:id", () => {
    beforeEach(async () => {
      testFolder = await Folder.create({
        name: "Test Folder",
        description: "Test folder description",
        userId: testUser.id,
        s3Key: `users/${testUser.id}/folders/test-folder`,
      });
    });

    afterEach(async () => {
      await Folder.destroy({ where: { id: testFolder.id }, force: true });
    });

    it("should update folder successfully", async () => {
      const response = await request(app)
        .put(`/api/folders/${testFolder.id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Updated Test Folder",
          description: "Updated description",
          color: "#33FF57",
          isPublic: "true",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Folder updated successfully");
      expect(response.body.data.name).toBe("Updated Test Folder");
      expect(response.body.data.description).toBe("Updated description");
      expect(response.body.data.color).toBe("#33FF57");
      expect(response.body.data.isPublic).toBe(true);
      expect(response.body.data.publicLink).toBeDefined();
    });

    it("should return 404 for non-existent folder", async () => {
      const response = await request(app)
        .put("/api/folders/00000000-0000-0000-0000-000000000000")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ name: "Updated Name" });

      expect(response.status).toBe(404);
    });

    it("should validate input data", async () => {
      const response = await request(app)
        .put(`/api/folders/${testFolder.id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "", // Invalid: empty name
          description: "a".repeat(1001), // Invalid: too long
          color: "invalid-color", // Invalid: not hex color
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it("should prevent circular reference when moving folder", async () => {
      // Create parent and child folders
      const parentFolder = await Folder.create({
        name: "Parent Folder",
        userId: testUser.id,
        s3Key: `users/${testUser.id}/folders/parent-folder`,
      });

      const childFolder = await Folder.create({
        name: "Child Folder",
        userId: testUser.id,
        parentId: parentFolder.id,
        s3Key: `users/${testUser.id}/folders/parent-folder/child-folder`,
      });

      // Try to move parent into child (circular reference)
      const response = await request(app)
        .put(`/api/folders/${parentFolder.id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          parentId: childFolder.id,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        "Cannot move folder: would create circular reference"
      );

      // Clean up
      await Folder.destroy({
        where: { id: [parentFolder.id, childFolder.id] },
        force: true,
      });
    });

    it("should reject duplicate name in same parent", async () => {
      // Create another folder with same name
      const duplicateFolder = await Folder.create({
        name: "Test Folder",
        userId: testUser.id,
        s3Key: `users/${testUser.id}/folders/test-folder-2`,
      });

      const response = await request(app)
        .put(`/api/folders/${duplicateFolder.id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Test Folder", // Same name as testFolder
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        "A folder with this name already exists in this location"
      );

      // Clean up
      await Folder.destroy({ where: { id: duplicateFolder.id }, force: true });
    });
  });

  describe("DELETE /api/folders/:id", () => {
    beforeEach(async () => {
      testFolder = await Folder.create({
        name: "Test Folder",
        description: "Test folder description",
        userId: testUser.id,
        s3Key: `users/${testUser.id}/folders/test-folder`,
      });
    });

    it("should soft delete empty folder successfully", async () => {
      const response = await request(app)
        .delete(`/api/folders/${testFolder.id}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Folder deleted successfully");

      // Verify folder is soft deleted
      const deletedFolder = await Folder.findByPk(testFolder.id);
      expect(deletedFolder.isDeleted).toBe(true);
      expect(deletedFolder.deletedAt).toBeDefined();
    });

    it("should reject deletion of folder with files", async () => {
      // Create a file in the folder
      await File.create({
        name: "Test File",
        originalName: "test.txt",
        mimeType: "text/plain",
        size: 1024,
        extension: ".txt",
        s3Key: "test-file-key",
        s3Url: "https://test-bucket.s3.amazonaws.com/test-file-key",
        userId: testUser.id,
        folderId: testFolder.id,
      });

      const response = await request(app)
        .delete(`/api/folders/${testFolder.id}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        "Cannot delete folder: contains files or subfolders"
      );

      // Clean up
      await File.destroy({ where: { folderId: testFolder.id }, force: true });
    });

    it("should reject deletion of folder with subfolders", async () => {
      // Create a subfolder
      await Folder.create({
        name: "Subfolder",
        userId: testUser.id,
        parentId: testFolder.id,
        s3Key: `users/${testUser.id}/folders/test-folder/subfolder`,
      });

      const response = await request(app)
        .delete(`/api/folders/${testFolder.id}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        "Cannot delete folder: contains files or subfolders"
      );

      // Clean up
      await Folder.destroy({ where: { parentId: testFolder.id }, force: true });
    });

    it("should return 404 for non-existent folder", async () => {
      const response = await request(app)
        .delete("/api/folders/00000000-0000-0000-0000-000000000000")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe("POST /api/folders/:id/restore", () => {
    beforeEach(async () => {
      testFolder = await Folder.create({
        name: "Test Folder",
        description: "Test folder description",
        userId: testUser.id,
        s3Key: `users/${testUser.id}/folders/test-folder`,
        isDeleted: true,
        deletedAt: new Date(),
      });
    });

    afterEach(async () => {
      await Folder.destroy({ where: { id: testFolder.id }, force: true });
    });

    it("should restore folder successfully", async () => {
      const response = await request(app)
        .post(`/api/folders/${testFolder.id}/restore`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Folder restored successfully");

      // Verify folder is restored
      const restoredFolder = await Folder.findByPk(testFolder.id);
      expect(restoredFolder.isDeleted).toBe(false);
      expect(restoredFolder.deletedAt).toBeNull();
    });
  });

  describe("DELETE /api/folders/:id/permanent", () => {
    beforeEach(async () => {
      testFolder = await Folder.create({
        name: "Test Folder",
        description: "Test folder description",
        userId: testUser.id,
        s3Key: `users/${testUser.id}/folders/test-folder`,
        isDeleted: true,
        deletedAt: new Date(),
      });
    });

    it("should permanently delete folder", async () => {
      const response = await request(app)
        .delete(`/api/folders/${testFolder.id}/permanent`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Folder permanently deleted");

      // Verify S3 service was called
      expect(s3Service.deleteFolder).toHaveBeenCalledWith(testFolder.s3Key);

      // Verify folder is permanently deleted
      const deletedFolder = await Folder.findByPk(testFolder.id);
      expect(deletedFolder).toBeNull();
    });
  });

  describe("GET /api/folders/stats", () => {
    beforeEach(async () => {
      // Create test folders
      await Folder.bulkCreate([
        {
          name: "Folder 1",
          userId: testUser.id,
          s3Key: `users/${testUser.id}/folders/folder-1`,
        },
        {
          name: "Folder 2",
          userId: testUser.id,
          s3Key: `users/${testUser.id}/folders/folder-2`,
        },
      ]);

      // Create test files
      await File.bulkCreate([
        {
          name: "File 1",
          originalName: "file1.txt",
          mimeType: "text/plain",
          size: 1024,
          extension: ".txt",
          s3Key: "file1-key",
          s3Url: "https://test-bucket.s3.amazonaws.com/file1-key",
          userId: testUser.id,
          folderId: (await Folder.findOne({ where: { name: "Folder 1" } })).id,
        },
        {
          name: "File 2",
          originalName: "file2.jpg",
          mimeType: "image/jpeg",
          size: 2048,
          extension: ".jpg",
          s3Key: "file2-key",
          s3Url: "https://test-bucket.s3.amazonaws.com/file2-key",
          userId: testUser.id,
          folderId: (await Folder.findOne({ where: { name: "Folder 2" } })).id,
        },
      ]);
    });

    afterEach(async () => {
      await File.destroy({ where: { userId: testUser.id }, force: true });
      await Folder.destroy({ where: { userId: testUser.id }, force: true });
    });

    it("should get folder statistics successfully", async () => {
      const response = await request(app)
        .get("/api/folders/stats")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.stats.totalFolders).toBe("2");
      expect(response.body.data.folderSizes).toHaveLength(2);
    });
  });

  describe("GET /api/folders/public/:publicLink", () => {
    beforeEach(async () => {
      testFolder = await Folder.create({
        name: "Public Test Folder",
        description: "Public folder description",
        userId: testUser.id,
        s3Key: `users/${testUser.id}/folders/public-test-folder`,
        isPublic: true,
        publicLink: "test-public-folder-link-uuid",
      });
    });

    afterEach(async () => {
      await Folder.destroy({ where: { id: testFolder.id }, force: true });
    });

    it("should get public folder by link", async () => {
      const response = await request(app).get(
        `/api/folders/public/${testFolder.publicLink}`
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testFolder.id);
      expect(response.body.data.name).toBe("Public Test Folder");
      expect(response.body.data.uploadedBy).toBe(testUser.username);
    });

    it("should return 404 for non-existent public folder", async () => {
      const response = await request(app).get(
        "/api/folders/public/non-existent-link"
      );

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Public folder not found");
    });

    it("should return 400 for invalid public link format", async () => {
      const response = await request(app).get(
        "/api/folders/public/invalid-uuid"
      );

      expect(response.status).toBe(400);
    });
  });
});
