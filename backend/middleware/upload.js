const multer = require("multer");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

// Configure multer for file uploads
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Get allowed file types from environment
  const allowedTypes = process.env.ALLOWED_FILE_TYPES?.split(",") || [
    "image/*",
    "video/*",
    "audio/*",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
  ];

  // Check if file type is allowed
  const isAllowed = allowedTypes.some((type) => {
    if (type.endsWith("/*")) {
      const baseType = type.replace("/*", "");
      return file.mimetype.startsWith(baseType);
    }
    return file.mimetype === type;
  });

  if (isAllowed) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed.`), false);
  }
};

const limits = {
  fileSize: parseInt(process.env.MAX_FILE_SIZE) || 100 * 1024 * 1024, // 100MB default
  files: 10, // Maximum 10 files per request
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: limits,
});

// Middleware to handle single file upload
const uploadSingle = upload.single("file");

// Middleware to handle multiple file uploads
const uploadMultiple = upload.array("files", 10);

// Wrapper middleware to handle upload errors
const handleUpload = (uploadMiddleware) => {
  return (req, res, next) => {
    uploadMiddleware(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            success: false,
            message: `File too large. Maximum size is ${process.env
              .MAX_FILE_SIZE || "100MB"}.`,
          });
        }
        if (err.code === "LIMIT_FILE_COUNT") {
          return res.status(400).json({
            success: false,
            message: "Too many files. Maximum 10 files allowed.",
          });
        }
        if (err.code === "LIMIT_UNEXPECTED_FILE") {
          return res.status(400).json({
            success: false,
            message: "Unexpected file field.",
          });
        }
        return res.status(400).json({
          success: false,
          message: "File upload error.",
        });
      } else if (err) {
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }
      next();
    });
  };
};

// Utility function to generate unique filename
const generateUniqueFilename = (originalname) => {
  const timestamp = Date.now();
  const randomString = uuidv4().replace(/-/g, "");
  const extension = path.extname(originalname);
  const nameWithoutExt = path.basename(originalname, extension);

  return `${nameWithoutExt}_${timestamp}_${randomString}${extension}`;
};

// Utility function to get file extension
const getFileExtension = (filename) => {
  return path.extname(filename).toLowerCase();
};

// Utility function to validate file size
const validateFileSize = (size, userTier = "free") => {
  const maxSizes = {
    free: parseInt(process.env.FREE_TIER_LIMIT) || 1024 * 1024 * 1024, // 1GB
    premium:
      parseInt(process.env.PREMIUM_TIER_LIMIT) || 10 * 1024 * 1024 * 1024, // 10GB
  };

  return size <= maxSizes[userTier];
};

module.exports = {
  uploadSingle: handleUpload(uploadSingle),
  uploadMultiple: handleUpload(uploadMultiple),
  generateUniqueFilename,
  getFileExtension,
  validateFileSize,
};
