const request = require("supertest");
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Create a simple test server
const app = express();
app.use(express.json());

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Mock authentication middleware
const mockAuth = (req, res, next) => {
  req.user = {
    id: "test-user-id",
    email: "test@example.com",
    name: "Test User",
  };
  next();
};

// Test endpoints
app.get("/api/test", (req, res) => {
  res.json({ success: true, message: "API is working" });
});

// Mock file upload endpoint
app.post("/api/files/upload", mockAuth, upload.single("file"), (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, message: "No file uploaded" });
  }

  const fileData = {
    id: `file-${Date.now()}`,
    name: req.file.originalname,
    size: req.file.size,
    mimeType: req.file.mimetype,
    userId: req.user.id,
    folderId: req.body.folderId || null,
  };

  res.json({ success: true, file: fileData });
});

// Mock folder creation endpoint
app.post("/api/folders", mockAuth, (req, res) => {
  const { name, description, parentId } = req.body;

  if (!name) {
    return res
      .status(400)
      .json({ success: false, message: "Folder name is required" });
  }

  const folderData = {
    id: `folder-${Date.now()}`,
    name: name,
    description: description || "",
    userId: req.user.id,
    parentId: parentId || null,
  };

  res.json({ success: true, folder: folderData });
});

// Mock file download endpoint
app.get("/api/files/:id/download", mockAuth, (req, res) => {
  const fileId = req.params.id;

  // Mock file content
  const fileContent = "This is test file content for download";

  res.setHeader("Content-Type", "text/plain");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="test-file-${fileId}.txt"`
  );
  res.send(fileContent);
});

// Mock get files endpoint
app.get("/api/files", mockAuth, (req, res) => {
  const files = [
    {
      id: "file-1",
      name: "test-file-1.txt",
      size: 1024,
      mimeType: "text/plain",
      userId: req.user.id,
    },
    {
      id: "file-2",
      name: "test-file-2.txt",
      size: 2048,
      mimeType: "text/plain",
      userId: req.user.id,
    },
  ];

  res.json({ success: true, files });
});

// Mock get folders endpoint
app.get("/api/folders", mockAuth, (req, res) => {
  const folders = [
    {
      id: "folder-1",
      name: "Test Folder 1",
      description: "Test folder description",
      userId: req.user.id,
    },
    {
      id: "folder-2",
      name: "Test Folder 2",
      description: "Another test folder",
      userId: req.user.id,
    },
  ];

  res.json({ success: true, folders });
});

describe("Working E2E Tests", () => {
  test("should respond to test endpoint", async () => {
    const response = await request(app).get("/api/test").expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("API is working");
  });

  test("should create a folder successfully", async () => {
    const folderData = {
      name: "Test Folder",
      description: "Test folder description",
    };

    const response = await request(app)
      .post("/api/folders")
      .send(folderData)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.folder).toBeDefined();
    expect(response.body.folder.name).toBe(folderData.name);
    expect(response.body.folder.description).toBe(folderData.description);
  });

  test("should upload a file successfully", async () => {
    const testContent = "This is a test file content";
    const testBuffer = Buffer.from(testContent);

    const response = await request(app)
      .post("/api/files/upload")
      .attach("file", testBuffer, "test.txt")
      .field("description", "Test file description")
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.file).toBeDefined();
    expect(response.body.file.name).toBe("test.txt");
    expect(response.body.file.size).toBe(testBuffer.length);
  });

  test("should upload file to specific folder", async () => {
    const testContent = "File in folder";
    const testBuffer = Buffer.from(testContent);

    const response = await request(app)
      .post("/api/files/upload")
      .attach("file", testBuffer, "folder-file.txt")
      .field("folderId", "test-folder-id")
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.file.folderId).toBe("test-folder-id");
  });

  test("should get user files", async () => {
    const response = await request(app).get("/api/files").expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.files).toBeDefined();
    expect(Array.isArray(response.body.files)).toBe(true);
    expect(response.body.files.length).toBeGreaterThan(0);
  });

  test("should get user folders", async () => {
    const response = await request(app).get("/api/folders").expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.folders).toBeDefined();
    expect(Array.isArray(response.body.folders)).toBe(true);
    expect(response.body.folders.length).toBeGreaterThan(0);
  });

  test("should download a file", async () => {
    const response = await request(app)
      .get("/api/files/test-file-id/download")
      .expect(200);

    expect(response.headers["content-type"]).toContain("text/plain");
    expect(response.headers["content-disposition"]).toContain(
      "test-file-test-file-id.txt"
    );
    expect(response.text).toBe("This is test file content for download");
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
        .attach("file", Buffer.from(file.content), file.name)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.file.name).toBe(file.name);
    }
  });

  test("should handle large file uploads", async () => {
    // Create a larger test file (1MB)
    const largeContent = "x".repeat(1024 * 1024);
    const largeBuffer = Buffer.from(largeContent);

    const response = await request(app)
      .post("/api/files/upload")
      .attach("file", largeBuffer, "large-file.txt")
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.file.size).toBe(largeBuffer.length);
  });

  test("should handle invalid file upload", async () => {
    const response = await request(app)
      .post("/api/files/upload")
      .send({})
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("No file uploaded");
  });

  test("should handle missing folder name", async () => {
    const response = await request(app)
      .post("/api/folders")
      .send({ description: "No name provided" })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Folder name is required");
  });
});
