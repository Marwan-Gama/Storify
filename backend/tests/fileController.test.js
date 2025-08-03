const request = require("supertest");
const app = require("../server");
const { File, User, Folder } = require("../models");
const s3Service = require("../services/s3Service");
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs");

// Mock S3 service
jest.mock("../services/s3Service");

describe("File Controller", () => {
  let testUser;
  let testFolder;
  let authToken;
  let testFile;

  beforeAll(async () => {
    // Create test user
    testUser = await User.create({
      username: "testuser",
      email: "test@example.com",
      password: "TestPassword123!",
      tier: "free",
    });

    // Create test folder
    testFolder = await Folder.create({
      name: "Test Folder",
      userId: testUser.id,
      s3Key: `users/${testUser.id}/folders/test-folder`,
    });

    // Generate auth token
    authToken = jwt.sign(
      { id: testUser.id, email: testUser.email },
      process.env.JWT_SECRET || "test-secret",
      { expiresIn: "1h" }
    );

    // Mock S3 service methods
    s3Service.uploadFile.mockResolvedValue({
      key: "test-file-key",
      url: "https://test-bucket.s3.amazonaws.com/test-file-key",
      bucket: "test-bucket",
    });

    s3Service.fileExists.mockResolvedValue(true);
    s3Service.downloadFile.mockResolvedValue({
      body: Buffer.from("test file content"),
      contentType: "text/plain",
      contentLength: 18,
      metadata: { originalName: "test.txt" },
    });
    s3Service.generatePresignedUrl.mockResolvedValue(
      "https://presigned-url.com"
    );
    s3Service.generateThumbnail.mockResolvedValue("thumbnail-key");
  });

  afterAll(async () => {
    // Clean up test data
    await File.destroy({ where: { userId: testUser.id }, force: true });
    await Folder.destroy({ where: { userId: testUser.id }, force: true });
    await User.destroy({ where: { id: testUser.id }, force: true });
  });

  beforeEach(async () => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe("POST /api/files/upload", () => {
    it("should upload a single file successfully", async () => {
      const filePath = path.join(__dirname, "fixtures", "test.txt");

      // Create test file if it doesn't exist
      if (!fs.existsSync(path.dirname(filePath))) {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
      }
      fs.writeFileSync(filePath, "test file content");

      const response = await request(app)
        .post("/api/files/upload")
        .set("Authorization", `Bearer ${authToken}`)
        .attach("file", filePath)
        .field("description", "Test file description")
        .field("isPublic", "false");

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("File uploaded successfully");
      expect(response.body.data).toHaveProperty("id");
      expect(response.body.data.name).toBe("test");
      expect(response.body.data.originalName).toBe("test.txt");
      expect(response.body.data.size).toBe(18);
      expect(response.body.data.mimeType).toBe("text/plain");

      // Verify S3 service was called
      expect(s3Service.uploadFile).toHaveBeenCalledTimes(1);
    });

    it("should reject file upload without authentication", async () => {
      const filePath = path.join(__dirname, "fixtures", "test.txt");

      const response = await request(app)
        .post("/api/files/upload")
        .attach("file", filePath);

      expect(response.status).toBe(401);
    });

    it("should reject file upload without file", async () => {
      const response = await request(app)
        .post("/api/files/upload")
        .set("Authorization", `Bearer ${authToken}`)
        .field("description", "Test file description");

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("No file provided");
    });

    it("should reject file upload to non-existent folder", async () => {
      const filePath = path.join(__dirname, "fixtures", "test.txt");

      const response = await request(app)
        .post("/api/files/upload")
        .set("Authorization", `Bearer ${authToken}`)
        .attach("file", filePath)
        .field("folderId", "00000000-0000-0000-0000-000000000000");

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Folder not found or access denied");
    });

    it("should upload file to specific folder", async () => {
      const filePath = path.join(__dirname, "fixtures", "test.txt");

      const response = await request(app)
        .post("/api/files/upload")
        .set("Authorization", `Bearer ${authToken}`)
        .attach("file", filePath)
        .field("folderId", testFolder.id);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("id");
    });
  });

  describe("POST /api/files/upload-multiple", () => {
    it("should upload multiple files successfully", async () => {
      const filePath1 = path.join(__dirname, "fixtures", "test1.txt");
      const filePath2 = path.join(__dirname, "fixtures", "test2.txt");

      // Create test files
      fs.writeFileSync(filePath1, "test file 1 content");
      fs.writeFileSync(filePath2, "test file 2 content");

      const response = await request(app)
        .post("/api/files/upload-multiple")
        .set("Authorization", `Bearer ${authToken}`)
        .attach("files", filePath1)
        .attach("files", filePath2)
        .field("description", "Multiple test files");

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Files uploaded successfully");
      expect(response.body.data.uploaded).toBe(2);
      expect(response.body.data.failed).toBe(0);
      expect(response.body.data.files).toHaveLength(2);

      // Verify S3 service was called for each file
      expect(s3Service.uploadFile).toHaveBeenCalledTimes(2);
    });

    it("should handle partial upload failures", async () => {
      const filePath1 = path.join(__dirname, "fixtures", "test1.txt");

      // Mock S3 service to fail for second call
      s3Service.uploadFile
        .mockResolvedValueOnce({
          key: "test-file-key-1",
          url: "https://test-bucket.s3.amazonaws.com/test-file-key-1",
          bucket: "test-bucket",
        })
        .mockRejectedValueOnce(new Error("S3 upload failed"));

      fs.writeFileSync(filePath1, "test file 1 content");

      const response = await request(app)
        .post("/api/files/upload-multiple")
        .set("Authorization", `Bearer ${authToken}`)
        .attach("files", filePath1)
        .attach("files", filePath1);

      expect(response.status).toBe(201);
      expect(response.body.data.uploaded).toBe(1);
      expect(response.body.data.failed).toBe(1);
    });
  });

  describe("GET /api/files", () => {
    beforeEach(async () => {
      // Create test files
      testFile = await File.create({
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
    });

    afterEach(async () => {
      await File.destroy({ where: { id: testFile.id }, force: true });
    });

    it("should get user files successfully", async () => {
      const response = await request(app)
        .get("/api/files")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.files).toHaveLength(1);
      expect(response.body.data.files[0].id).toBe(testFile.id);
      expect(response.body.data.pagination).toBeDefined();
    });

    it("should filter files by folder", async () => {
      const response = await request(app)
        .get(`/api/files?folderId=${testFolder.id}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.files).toHaveLength(1);
      expect(response.body.data.files[0].folderId).toBe(testFolder.id);
    });

    it("should search files by name", async () => {
      const response = await request(app)
        .get("/api/files?search=Test")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.files).toHaveLength(1);
    });

    it("should filter files by type", async () => {
      const response = await request(app)
        .get("/api/files?type=text")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.files).toHaveLength(1);
    });

    it("should paginate results", async () => {
      const response = await request(app)
        .get("/api/files?page=1&limit=10")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.pagination.currentPage).toBe(1);
      expect(response.body.data.pagination.limit).toBe(10);
    });
  });

  describe("GET /api/files/:id", () => {
    beforeEach(async () => {
      testFile = await File.create({
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
    });

    afterEach(async () => {
      await File.destroy({ where: { id: testFile.id }, force: true });
    });

    it("should get file by id successfully", async () => {
      const response = await request(app)
        .get(`/api/files/${testFile.id}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testFile.id);
      expect(response.body.data.name).toBe("Test File");
    });

    it("should return 404 for non-existent file", async () => {
      const response = await request(app)
        .get("/api/files/00000000-0000-0000-0000-000000000000")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it("should return 400 for invalid file id", async () => {
      const response = await request(app)
        .get("/api/files/invalid-id")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(400);
    });
  });

  describe("GET /api/files/:id/download", () => {
    beforeEach(async () => {
      testFile = await File.create({
        name: "Test File",
        originalName: "test.txt",
        mimeType: "text/plain",
        size: 1024,
        extension: ".txt",
        s3Key: "test-file-key",
        s3Url: "https://test-bucket.s3.amazonaws.com/test-file-key",
        userId: testUser.id,
      });
    });

    afterEach(async () => {
      await File.destroy({ where: { id: testFile.id }, force: true });
    });

    it("should download file successfully", async () => {
      const response = await request(app)
        .get(`/api/files/${testFile.id}/download`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.headers["content-type"]).toBe("text/plain");
      expect(response.headers["content-disposition"]).toContain("test.txt");
      expect(response.body).toBeInstanceOf(Buffer);

      // Verify S3 service was called
      expect(s3Service.fileExists).toHaveBeenCalledWith(testFile.s3Key);
      expect(s3Service.downloadFile).toHaveBeenCalledWith(testFile.s3Key);
    });

    it("should return 404 for non-existent file", async () => {
      const response = await request(app)
        .get("/api/files/00000000-0000-0000-0000-000000000000/download")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });

    it("should return 404 when file doesn't exist in S3", async () => {
      s3Service.fileExists.mockResolvedValue(false);

      const response = await request(app)
        .get(`/api/files/${testFile.id}/download`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("File not found in storage");
    });
  });

  describe("GET /api/files/:id/preview", () => {
    beforeEach(async () => {
      testFile = await File.create({
        name: "Test File",
        originalName: "test.txt",
        mimeType: "text/plain",
        size: 1024,
        extension: ".txt",
        s3Key: "test-file-key",
        s3Url: "https://test-bucket.s3.amazonaws.com/test-file-key",
        userId: testUser.id,
      });
    });

    afterEach(async () => {
      await File.destroy({ where: { id: testFile.id }, force: true });
    });

    it("should generate preview URL for previewable file", async () => {
      const response = await request(app)
        .get(`/api/files/${testFile.id}/preview`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.previewUrl).toBe("https://presigned-url.com");
      expect(response.body.data.fileType).toBe("text");

      // Verify S3 service was called
      expect(s3Service.generatePresignedUrl).toHaveBeenCalledWith(
        testFile.s3Key,
        "getObject",
        3600
      );
    });

    it("should return 400 for non-previewable file", async () => {
      // Create a non-previewable file
      const nonPreviewableFile = await File.create({
        name: "Test Binary",
        originalName: "test.bin",
        mimeType: "application/octet-stream",
        size: 1024,
        extension: ".bin",
        s3Key: "test-binary-key",
        s3Url: "https://test-bucket.s3.amazonaws.com/test-binary-key",
        userId: testUser.id,
      });

      const response = await request(app)
        .get(`/api/files/${nonPreviewableFile.id}/preview`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("File type is not previewable");

      await File.destroy({ where: { id: nonPreviewableFile.id }, force: true });
    });
  });

  describe("PUT /api/files/:id", () => {
    beforeEach(async () => {
      testFile = await File.create({
        name: "Test File",
        originalName: "test.txt",
        mimeType: "text/plain",
        size: 1024,
        extension: ".txt",
        s3Key: "test-file-key",
        s3Url: "https://test-bucket.s3.amazonaws.com/test-file-key",
        userId: testUser.id,
      });
    });

    afterEach(async () => {
      await File.destroy({ where: { id: testFile.id }, force: true });
    });

    it("should update file successfully", async () => {
      const response = await request(app)
        .put(`/api/files/${testFile.id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Updated Test File",
          description: "Updated description",
          isPublic: "true",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("File updated successfully");
      expect(response.body.data.name).toBe("Updated Test File");
      expect(response.body.data.description).toBe("Updated description");
      expect(response.body.data.isPublic).toBe(true);
      expect(response.body.data.publicLink).toBeDefined();
    });

    it("should return 404 for non-existent file", async () => {
      const response = await request(app)
        .put("/api/files/00000000-0000-0000-0000-000000000000")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ name: "Updated Name" });

      expect(response.status).toBe(404);
    });

    it("should validate input data", async () => {
      const response = await request(app)
        .put(`/api/files/${testFile.id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "", // Invalid: empty name
          description: "a".repeat(1001), // Invalid: too long
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe("DELETE /api/files/:id", () => {
    beforeEach(async () => {
      testFile = await File.create({
        name: "Test File",
        originalName: "test.txt",
        mimeType: "text/plain",
        size: 1024,
        extension: ".txt",
        s3Key: "test-file-key",
        s3Url: "https://test-bucket.s3.amazonaws.com/test-file-key",
        userId: testUser.id,
      });
    });

    it("should soft delete file successfully", async () => {
      const response = await request(app)
        .delete(`/api/files/${testFile.id}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("File deleted successfully");

      // Verify file is soft deleted
      const deletedFile = await File.findByPk(testFile.id);
      expect(deletedFile.isDeleted).toBe(true);
      expect(deletedFile.deletedAt).toBeDefined();
    });

    it("should return 404 for non-existent file", async () => {
      const response = await request(app)
        .delete("/api/files/00000000-0000-0000-0000-000000000000")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe("POST /api/files/:id/restore", () => {
    beforeEach(async () => {
      testFile = await File.create({
        name: "Test File",
        originalName: "test.txt",
        mimeType: "text/plain",
        size: 1024,
        extension: ".txt",
        s3Key: "test-file-key",
        s3Url: "https://test-bucket.s3.amazonaws.com/test-file-key",
        userId: testUser.id,
        isDeleted: true,
        deletedAt: new Date(),
      });
    });

    afterEach(async () => {
      await File.destroy({ where: { id: testFile.id }, force: true });
    });

    it("should restore file successfully", async () => {
      const response = await request(app)
        .post(`/api/files/${testFile.id}/restore`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("File restored successfully");

      // Verify file is restored
      const restoredFile = await File.findByPk(testFile.id);
      expect(restoredFile.isDeleted).toBe(false);
      expect(restoredFile.deletedAt).toBeNull();
    });
  });

  describe("DELETE /api/files/:id/permanent", () => {
    beforeEach(async () => {
      testFile = await File.create({
        name: "Test File",
        originalName: "test.txt",
        mimeType: "text/plain",
        size: 1024,
        extension: ".txt",
        s3Key: "test-file-key",
        s3Url: "https://test-bucket.s3.amazonaws.com/test-file-key",
        userId: testUser.id,
        isDeleted: true,
        deletedAt: new Date(),
      });
    });

    it("should permanently delete file", async () => {
      s3Service.deleteFile.mockResolvedValue(true);

      const response = await request(app)
        .delete(`/api/files/${testFile.id}/permanent`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("File permanently deleted");

      // Verify S3 service was called
      expect(s3Service.deleteFile).toHaveBeenCalledWith(testFile.s3Key);

      // Verify file is permanently deleted
      const deletedFile = await File.findByPk(testFile.id);
      expect(deletedFile).toBeNull();
    });
  });

  describe("GET /api/files/stats", () => {
    beforeEach(async () => {
      // Create multiple test files
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
          downloadCount: 5,
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
          downloadCount: 3,
        },
      ]);
    });

    afterEach(async () => {
      await File.destroy({ where: { userId: testUser.id }, force: true });
    });

    it("should get file statistics successfully", async () => {
      const response = await request(app)
        .get("/api/files/stats")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.stats.totalFiles).toBe("2");
      expect(response.body.data.stats.totalSize).toBe("3072");
      expect(response.body.data.stats.totalDownloads).toBe("2");
      expect(response.body.data.fileTypes).toHaveLength(2);
    });
  });

  describe("GET /api/files/public/:publicLink", () => {
    beforeEach(async () => {
      testFile = await File.create({
        name: "Public Test File",
        originalName: "public-test.txt",
        mimeType: "text/plain",
        size: 1024,
        extension: ".txt",
        s3Key: "public-test-key",
        s3Url: "https://test-bucket.s3.amazonaws.com/public-test-key",
        userId: testUser.id,
        isPublic: true,
        publicLink: "test-public-link-uuid",
      });
    });

    afterEach(async () => {
      await File.destroy({ where: { id: testFile.id }, force: true });
    });

    it("should get public file by link", async () => {
      const response = await request(app).get(
        `/api/files/public/${testFile.publicLink}`
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testFile.id);
      expect(response.body.data.name).toBe("Public Test File");
      expect(response.body.data.uploadedBy).toBe(testUser.username);
    });

    it("should return 404 for non-existent public file", async () => {
      const response = await request(app).get(
        "/api/files/public/non-existent-link"
      );

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Public file not found");
    });

    it("should return 400 for invalid public link format", async () => {
      const response = await request(app).get("/api/files/public/invalid-uuid");

      expect(response.status).toBe(400);
    });
  });
});
