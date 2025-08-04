const request = require("supertest");
const express = require("express");
const app = express();

// Simple test server
app.use(express.json());

// Test endpoint
app.get("/api/test", (req, res) => {
  res.json({ success: true, message: "API is working" });
});

// Test file upload endpoint (mock)
app.post("/api/files/upload", (req, res) => {
  res.json({
    success: true,
    file: {
      id: "test-file-id",
      name: "test-file.txt",
      size: 1024,
      mimeType: "text/plain",
    },
  });
});

// Test folder creation endpoint (mock)
app.post("/api/folders", (req, res) => {
  res.json({
    success: true,
    folder: {
      id: "test-folder-id",
      name: req.body.name || "Test Folder",
      userId: "test-user-id",
    },
  });
});

// Test file download endpoint (mock)
app.get("/api/files/:id/download", (req, res) => {
  res.setHeader("Content-Type", "text/plain");
  res.setHeader("Content-Disposition", 'attachment; filename="test-file.txt"');
  res.send("This is test file content");
});

describe("Simple API Tests", () => {
  test("should respond to test endpoint", async () => {
    const response = await request(app).get("/api/test").expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("API is working");
  });

  test("should handle file upload request", async () => {
    const response = await request(app)
      .post("/api/files/upload")
      .attach("file", Buffer.from("test content"), "test-file.txt")
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.file).toBeDefined();
    expect(response.body.file.name).toBe("test-file.txt");
  });

  test("should handle folder creation request", async () => {
    const response = await request(app)
      .post("/api/folders")
      .send({ name: "Test Folder" })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.folder).toBeDefined();
    expect(response.body.folder.name).toBe("Test Folder");
  });

  test("should handle file download request", async () => {
    const response = await request(app)
      .get("/api/files/test-id/download")
      .expect(200);

    expect(response.headers["content-type"]).toContain("text/plain");
    expect(response.headers["content-disposition"]).toContain("test-file.txt");
    expect(response.text).toBe("This is test file content");
  });
});
