const request = require("supertest");
const app = require("../../server");
const { User, File, Folder } = require("../../models");
const path = require("path");

describe("Complete File Operations E2E Tests", () => {
  let authToken;
  let testUser;
  let testFolder;

  beforeAll(async () => {
    // Create test user using test utilities
    testUser = await User.create(
      global.testUtils.generateTestUser({
        email: "fileops@example.com",
        name: "File Ops",
      })
    );

    authToken = global.testUtils.generateTestToken(testUser);

    // Create a test folder
    testFolder = await Folder.create({
      name: "Test Folder",
      description: "Test folder for file operations",
      path: "/test-folder",
      userId: testUser.id,
    });
  });

  afterAll(async () => {
    // Cleanup
    await File.destroy({ where: { userId: testUser.id }, force: true });
    await Folder.destroy({ where: { userId: testUser.id }, force: true });
    await User.destroy({ where: { id: testUser.id }, force: true });
  });

  beforeEach(async () => {
    // Clean up files before each test
    await File.destroy({ where: { userId: testUser.id }, force: true });
  });

  describe("File Upload Operations", () => {
    test("should upload single file successfully", async () => {
      const testContent = "This is a test file for upload";
      const testBuffer = Buffer.from(testContent);

      const response = await request(app)
        .post("/api/files/upload")
        .set("Authorization", `Bearer ${authToken}`)
        .attach("file", testBuffer, "test-upload.txt")
        .field("description", "Test upload file")
        .field("tags", JSON.stringify(["test", "upload"]))
        .field("isPublic", "false");

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.file).toBeDefined();
      expect(response.body.file.name).toBe("test-upload");
      expect(response.body.file.originalName).toBe("test-upload.txt");
      expect(response.body.file.size).toBe(testBuffer.length);
      expect(response.body.file.description).toBe("Test upload file");
      expect(response.body.file.isPublic).toBe(false);
      expect(response.body.file.publicLink).toBeNull();
      expect(response.body.file.userId).toBe(testUser.id);
    });

    test("should upload file to specific folder", async () => {
      const testContent = "File in folder";
      const testBuffer = Buffer.from(testContent);

      const response = await request(app)
        .post("/api/files/upload")
        .set("Authorization", `Bearer ${authToken}`)
        .attach("file", testBuffer, "folder-file.txt")
        .field("folderId", testFolder.id)
        .field("description", "File uploaded to folder");

      expect(response.status).toBe(201);
      expect(response.body.file.folderId).toBe(testFolder.id);
      expect(response.body.file.description).toBe("File uploaded to folder");
    });

    test("should upload public file", async () => {
      const testContent = "Public file content";
      const testBuffer = Buffer.from(testContent);

      const response = await request(app)
        .post("/api/files/upload")
        .set("Authorization", `Bearer ${authToken}`)
        .attach("file", testBuffer, "public-file.txt")
        .field("isPublic", "true")
        .field("description", "Public file");

      expect(response.status).toBe(201);
      expect(response.body.file.isPublic).toBe(true);
      expect(response.body.file.publicLink).toBeDefined();
      expect(response.body.file.publicLink).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
      );
    });

    test("should upload multiple files", async () => {
      const files = [
        { name: "multi1.txt", content: "Multiple file 1" },
        { name: "multi2.txt", content: "Multiple file 2" },
        { name: "multi3.txt", content: "Multiple file 3" },
      ];

      const response = await request(app)
        .post("/api/files/upload-multiple")
        .set("Authorization", `Bearer ${authToken}`)
        .attach("files", Buffer.from(files[0].content), files[0].name)
        .attach("files", Buffer.from(files[1].content), files[1].name)
        .attach("files", Buffer.from(files[2].content), files[2].name)
        .field("folderId", testFolder.id)
        .field("description", "Multiple files upload");

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.files).toBeDefined();
      expect(response.body.files.length).toBe(3);

      response.body.files.forEach((file, index) => {
        expect(file.name).toBe(files[index].name.replace(".txt", ""));
        expect(file.folderId).toBe(testFolder.id);
        expect(file.description).toBe("Multiple files upload");
      });
    });

    test("should reject file upload without file", async () => {
      const response = await request(app)
        .post("/api/files/upload")
        .set("Authorization", `Bearer ${authToken}`)
        .field("description", "No file provided");

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("No file provided");
    });

    test("should reject upload to non-existent folder", async () => {
      const testBuffer = Buffer.from("Test content");
      const nonExistentFolderId = "12345678-1234-1234-1234-123456789012";

      const response = await request(app)
        .post("/api/files/upload")
        .set("Authorization", `Bearer ${authToken}`)
        .attach("file", testBuffer, "test.txt")
        .field("folderId", nonExistentFolderId);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Folder not found or access denied");
    });
  });

  describe("File Retrieval Operations", () => {
    let uploadedFile;

    beforeEach(async () => {
      // Upload a test file for retrieval tests
      const testContent = "File for retrieval tests";
      const testBuffer = Buffer.from(testContent);

      const uploadResponse = await request(app)
        .post("/api/files/upload")
        .set("Authorization", `Bearer ${authToken}`)
        .attach("file", testBuffer, "retrieval-test.txt")
        .field("description", "File for retrieval testing");

      uploadedFile = uploadResponse.body.file;
    });

    test("should get user files with pagination", async () => {
      // Upload additional files
      const files = [
        { name: "file1.txt", content: "Content 1" },
        { name: "file2.txt", content: "Content 2" },
        { name: "file3.txt", content: "Content 3" },
      ];

      for (const file of files) {
        await request(app)
          .post("/api/files/upload")
          .set("Authorization", `Bearer ${authToken}`)
          .attach("file", Buffer.from(file.content), file.name);
      }

      const response = await request(app)
        .get("/api/files")
        .set("Authorization", `Bearer ${authToken}`)
        .query({ page: 1, limit: 2 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.files).toBeDefined();
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.currentPage).toBe(1);
      expect(response.body.pagination.totalFiles).toBeGreaterThanOrEqual(4);
      expect(response.body.files.length).toBeLessThanOrEqual(2);
    });

    test("should get files by folder", async () => {
      const response = await request(app)
        .get("/api/files")
        .set("Authorization", `Bearer ${authToken}`)
        .query({ folderId: testFolder.id });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.files).toBeDefined();
    });

    test("should search files by name", async () => {
      const response = await request(app)
        .get("/api/files")
        .set("Authorization", `Bearer ${authToken}`)
        .query({ search: "retrieval" });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.files).toBeDefined();
      expect(response.body.files.length).toBeGreaterThan(0);
      expect(response.body.files[0].name).toContain("retrieval");
    });

    test("should get specific file by ID", async () => {
      const response = await request(app)
        .get(`/api/files/${uploadedFile.id}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.file).toBeDefined();
      expect(response.body.file.id).toBe(uploadedFile.id);
      expect(response.body.file.name).toBe(uploadedFile.name);
      expect(response.body.file.description).toBe(uploadedFile.description);
    });

    test("should return 404 for non-existent file", async () => {
      const nonExistentFileId = "12345678-1234-1234-1234-123456789012";

      const response = await request(app)
        .get(`/api/files/${nonExistentFileId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe("File Download Operations", () => {
    let downloadableFile;

    beforeEach(async () => {
      // Upload a test file for download
      const testContent = "This is downloadable content";
      const testBuffer = Buffer.from(testContent);

      const uploadResponse = await request(app)
        .post("/api/files/upload")
        .set("Authorization", `Bearer ${authToken}`)
        .attach("file", testBuffer, "downloadable.txt");

      downloadableFile = uploadResponse.body.file;
    });

    test("should download file successfully", async () => {
      const response = await request(app)
        .get(`/api/files/${downloadableFile.id}/download`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.headers["content-type"]).toContain("text/plain");
      expect(response.headers["content-disposition"]).toContain(
        "downloadable.txt"
      );
      expect(response.headers["content-length"]).toBe(
        downloadableFile.size.toString()
      );
      expect(response.body.toString()).toBe("This is downloadable content");
    });

    test("should return 404 for non-existent file download", async () => {
      const nonExistentFileId = "12345678-1234-1234-1234-123456789012";

      const response = await request(app)
        .get(`/api/files/${nonExistentFileId}/download`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });

    test("should reject download of file from different user", async () => {
      // Create another user and file
      const otherUser = await User.create(
        global.testUtils.generateTestUser({
          email: "other@example.com",
          name: "Other User",
        })
      );

      const otherFile = await File.create({
        name: "other-file",
        originalName: "other-file.txt",
        mimeType: "text/plain",
        size: 20,
        extension: ".txt",
        s3Key: "test-key",
        s3Url: "test-url",
        userId: otherUser.id,
      });

      const response = await request(app)
        .get(`/api/files/${otherFile.id}/download`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(404);

      // Cleanup
      await File.destroy({ where: { id: otherFile.id }, force: true });
      await User.destroy({ where: { id: otherUser.id }, force: true });
    });
  });

  describe("File Preview Operations", () => {
    let imageFile;
    let textFile;

    beforeEach(async () => {
      // Upload an image file for preview
      const imageBuffer = Buffer.from("fake-image-data");
      const imageUploadResponse = await request(app)
        .post("/api/files/upload")
        .set("Authorization", `Bearer ${authToken}`)
        .attach("file", imageBuffer, "test-image.jpg")
        .field("mimeType", "image/jpeg");

      imageFile = imageUploadResponse.body.file;

      // Upload a text file
      const textContent = "Text file content";
      const textBuffer = Buffer.from(textContent);
      const textUploadResponse = await request(app)
        .post("/api/files/upload")
        .set("Authorization", `Bearer ${authToken}`)
        .attach("file", textBuffer, "test-text.txt");

      textFile = textUploadResponse.body.file;
    });

    test("should get preview URL for image file", async () => {
      const response = await request(app)
        .get(`/api/files/${imageFile.id}/preview`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.previewUrl).toBeDefined();
      expect(response.body.data.fileType).toBe("image");
      expect(response.body.data.mimeType).toBe("image/jpeg");
    });

    test("should handle preview for non-previewable file", async () => {
      const response = await request(app)
        .get(`/api/files/${textFile.id}/preview`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("not previewable");
    });
  });

  describe("File Update Operations", () => {
    let updateableFile;

    beforeEach(async () => {
      // Upload a file for updating
      const testContent = "Original content";
      const testBuffer = Buffer.from(testContent);

      const uploadResponse = await request(app)
        .post("/api/files/upload")
        .set("Authorization", `Bearer ${authToken}`)
        .attach("file", testBuffer, "original-name.txt")
        .field("description", "Original description");

      updateableFile = uploadResponse.body.file;
    });

    test("should update file metadata", async () => {
      const updateData = {
        name: "Updated File Name",
        description: "Updated description",
        tags: JSON.stringify(["updated", "test"]),
        isPublic: "true",
      };

      const response = await request(app)
        .put(`/api/files/${updateableFile.id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.file).toBeDefined();
      expect(response.body.file.name).toBe("Updated File Name");
      expect(response.body.file.description).toBe("Updated description");
      expect(response.body.file.isPublic).toBe(true);
      expect(response.body.file.publicLink).toBeDefined();
    });

    test("should move file to different folder", async () => {
      // Create another folder
      const newFolder = await Folder.create({
        name: "New Folder",
        path: "/new-folder",
        userId: testUser.id,
      });

      const response = await request(app)
        .put(`/api/files/${updateableFile.id}/move`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ folderId: newFolder.id });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.file.folderId).toBe(newFolder.id);

      // Cleanup
      await Folder.destroy({ where: { id: newFolder.id }, force: true });
    });

    test("should move file to root (null folderId)", async () => {
      const response = await request(app)
        .put(`/api/files/${updateableFile.id}/move`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ folderId: null });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.file.folderId).toBeNull();
    });

    test("should reject update with invalid data", async () => {
      const invalidData = {
        name: "", // Empty name
        description: "a".repeat(1001), // Too long description
      };

      const response = await request(app)
        .put(`/api/files/${updateableFile.id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe("File Copy Operations", () => {
    let copyableFile;

    beforeEach(async () => {
      // Upload a file for copying
      const testContent = "File to be copied";
      const testBuffer = Buffer.from(testContent);

      const uploadResponse = await request(app)
        .post("/api/files/upload")
        .set("Authorization", `Bearer ${authToken}`)
        .attach("file", testBuffer, "copy-source.txt")
        .field("description", "Original file");

      copyableFile = uploadResponse.body.file;
    });

    test("should copy file with new name", async () => {
      const copyData = {
        name: "Copied File",
        folderId: testFolder.id,
      };

      const response = await request(app)
        .post(`/api/files/${copyableFile.id}/copy`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(copyData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.file).toBeDefined();
      expect(response.body.file.name).toBe("Copied File");
      expect(response.body.file.folderId).toBe(testFolder.id);
      expect(response.body.file.id).not.toBe(copyableFile.id);
      expect(response.body.file.originalName).toContain("copy");
    });

    test("should copy file without specifying name", async () => {
      const response = await request(app)
        .post(`/api/files/${copyableFile.id}/copy`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.file).toBeDefined();
      expect(response.body.file.name).toContain("copy");
      expect(response.body.file.id).not.toBe(copyableFile.id);
    });

    test("should reject copy to non-existent folder", async () => {
      const nonExistentFolderId = "12345678-1234-1234-1234-123456789012";

      const response = await request(app)
        .post(`/api/files/${copyableFile.id}/copy`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ folderId: nonExistentFolderId });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe("File Delete and Restore Operations", () => {
    let deletableFile;

    beforeEach(async () => {
      // Upload a file for deletion tests
      const testContent = "File to be deleted";
      const testBuffer = Buffer.from(testContent);

      const uploadResponse = await request(app)
        .post("/api/files/upload")
        .set("Authorization", `Bearer ${authToken}`)
        .attach("file", testBuffer, "delete-test.txt");

      deletableFile = uploadResponse.body.file;
    });

    test("should soft delete file", async () => {
      const response = await request(app)
        .delete(`/api/files/${deletableFile.id}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify file is soft deleted (not visible in normal queries)
      const getResponse = await request(app)
        .get(`/api/files/${deletableFile.id}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(getResponse.status).toBe(404);
    });

    test("should restore soft deleted file", async () => {
      // First delete the file
      await request(app)
        .delete(`/api/files/${deletableFile.id}`)
        .set("Authorization", `Bearer ${authToken}`);

      // Then restore it
      const response = await request(app)
        .post(`/api/files/${deletableFile.id}/restore`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify file is restored
      const getResponse = await request(app)
        .get(`/api/files/${deletableFile.id}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.file.id).toBe(deletableFile.id);
    });

    test("should permanently delete file", async () => {
      const response = await request(app)
        .delete(`/api/files/${deletableFile.id}/permanent`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify file is permanently deleted
      const getResponse = await request(app)
        .get(`/api/files/${deletableFile.id}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(getResponse.status).toBe(404);
    });

    test("should reject restore of non-deleted file", async () => {
      const response = await request(app)
        .post(`/api/files/${deletableFile.id}/restore`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe("File Statistics Operations", () => {
    beforeEach(async () => {
      // Upload various types of files for stats
      const files = [
        { name: "stats1.txt", content: "Content 1", size: 10 },
        { name: "stats2.txt", content: "Content 2", size: 20 },
        { name: "stats3.jpg", content: "Image data", size: 30 },
      ];

      for (const file of files) {
        await request(app)
          .post("/api/files/upload")
          .set("Authorization", `Bearer ${authToken}`)
          .attach("file", Buffer.from(file.content), file.name);
      }
    });

    test("should get file statistics", async () => {
      const response = await request(app)
        .get("/api/files/stats")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.stats).toBeDefined();
      expect(response.body.data.stats.totalFiles).toBeGreaterThanOrEqual(3);
      expect(response.body.data.stats.totalSize).toBeGreaterThan(0);
      expect(response.body.data.fileTypes).toBeDefined();
      expect(Array.isArray(response.body.data.fileTypes)).toBe(true);
    });
  });

  describe("Public File Operations", () => {
    let publicFile;

    beforeEach(async () => {
      // Upload a public file
      const testContent = "Public file content";
      const testBuffer = Buffer.from(testContent);

      const uploadResponse = await request(app)
        .post("/api/files/upload")
        .set("Authorization", `Bearer ${authToken}`)
        .attach("file", testBuffer, "public-file.txt")
        .field("isPublic", "true")
        .field("description", "Public file");

      publicFile = uploadResponse.body.file;
    });

    test("should access public file without authentication", async () => {
      const response = await request(app).get(
        `/api/files/public/${publicFile.publicLink}`
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.file).toBeDefined();
      expect(response.body.file.id).toBe(publicFile.id);
      expect(response.body.file.isPublic).toBe(true);
    });

    test("should reject access to non-public file", async () => {
      // Create a private file
      const privateFile = await File.create({
        name: "private-file",
        originalName: "private-file.txt",
        mimeType: "text/plain",
        size: 20,
        extension: ".txt",
        s3Key: "test-key",
        s3Url: "test-url",
        userId: testUser.id,
        isPublic: false,
        publicLink: "12345678-1234-1234-1234-123456789012",
      });

      const response = await request(app).get(
        `/api/files/public/${privateFile.publicLink}`
      );

      expect(response.status).toBe(404);

      // Cleanup
      await File.destroy({ where: { id: privateFile.id }, force: true });
    });

    test("should reject access with invalid public link", async () => {
      const invalidLink = "invalid-link";

      const response = await request(app).get(
        `/api/files/public/${invalidLink}`
      );

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe("Error Handling and Edge Cases", () => {
    test("should handle unauthorized access", async () => {
      const response = await request(app)
        .get("/api/files")
        .set("Authorization", "Bearer invalid-token");

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test("should handle missing authorization header", async () => {
      const response = await request(app).get("/api/files");

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test("should handle invalid file ID format", async () => {
      const response = await request(app)
        .get("/api/files/invalid-id")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test("should handle file operations with invalid folder ID", async () => {
      const testBuffer = Buffer.from("Test content");

      const response = await request(app)
        .post("/api/files/upload")
        .set("Authorization", `Bearer ${authToken}`)
        .attach("file", testBuffer, "test.txt")
        .field("folderId", "invalid-folder-id");

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test("should handle concurrent file operations", async () => {
      const testContent = "Concurrent test";
      const testBuffer = Buffer.from(testContent);

      // Upload multiple files concurrently
      const uploadPromises = Array.from({ length: 5 }, (_, i) =>
        request(app)
          .post("/api/files/upload")
          .set("Authorization", `Bearer ${authToken}`)
          .attach("file", testBuffer, `concurrent-${i}.txt`)
      );

      const responses = await Promise.all(uploadPromises);

      responses.forEach((response) => {
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.file).toBeDefined();
      });
    });
  });

  describe("File Type and Size Validation", () => {
    test("should reject oversized file upload", async () => {
      // Create a large file (simulate 100MB)
      const largeContent = "x".repeat(100 * 1024 * 1024);
      const largeBuffer = Buffer.from(largeContent);

      const response = await request(app)
        .post("/api/files/upload")
        .set("Authorization", `Bearer ${authToken}`)
        .attach("file", largeBuffer, "large-file.txt");

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("size");
    });

    test("should handle different file types", async () => {
      const fileTypes = [
        { name: "text.txt", content: "Text content", mimeType: "text/plain" },
        { name: "image.jpg", content: "Image data", mimeType: "image/jpeg" },
        {
          name: "document.pdf",
          content: "PDF data",
          mimeType: "application/pdf",
        },
      ];

      for (const fileType of fileTypes) {
        const response = await request(app)
          .post("/api/files/upload")
          .set("Authorization", `Bearer ${authToken}`)
          .attach("file", Buffer.from(fileType.content), fileType.name);

        expect(response.status).toBe(201);
        expect(response.body.file.mimeType).toBe(fileType.mimeType);
        expect(response.body.file.extension).toBe(
          path.extname(fileType.name).toLowerCase()
        );
      }
    });
  });
});
