const { File, User, Folder } = require("../models");
const s3Service = require("../services/s3Service");
const {
  generateUniqueFilename,
  validateFileSize,
} = require("../middleware/upload");
const { validationResult } = require("express-validator");
const { v4: uuidv4 } = require("uuid");
const path = require("path");

class FileController {
  // Upload single file
  async uploadFile(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file provided",
        });
      }

      const { folderId, description, tags, isPublic } = req.body;
      const userId = req.user.id;

      // Check user storage limits
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      if (!validateFileSize(req.file.size, user.tier || "free")) {
        return res.status(400).json({
          success: false,
          message: "File size exceeds your storage limit",
        });
      }

      // Validate folder ownership if folderId is provided
      if (folderId) {
        const folder = await Folder.findOne({
          where: { id: folderId, userId },
        });
        if (!folder) {
          return res.status(404).json({
            success: false,
            message: "Folder not found or access denied",
          });
        }
      }

      // Generate unique filename and S3 key
      const uniqueFilename = generateUniqueFilename(req.file.originalname);

      // Upload to S3
      const s3Result = await s3Service.uploadFile(
        req.file,
        `users/${userId}/files`
      );

      // Create file record in database
      const fileData = {
        name: path.basename(
          req.file.originalname,
          path.extname(req.file.originalname)
        ),
        originalName: req.file.originalname,
        description: description || null,
        mimeType: req.file.mimetype,
        size: req.file.size,
        extension: path.extname(req.file.originalname).toLowerCase(),
        s3Key: s3Result.key,
        s3Url: s3Result.url,
        folderId: folderId || null,
        userId,
        isPublic: isPublic === "true",
        publicLink: isPublic === "true" ? uuidv4() : null,
        tags: tags ? JSON.parse(tags) : null,
        metadata: {
          uploadedAt: new Date().toISOString(),
          userAgent: req.get("User-Agent"),
          ipAddress: req.ip,
        },
      };

      const file = await File.create(fileData);

      // Generate thumbnail for images
      if (req.file.mimetype.startsWith("image/")) {
        try {
          const thumbnailKey = `users/${userId}/thumbnails/${uniqueFilename}`;
          await s3Service.generateThumbnail(s3Result.key, thumbnailKey);
          await file.update({ thumbnailUrl: thumbnailKey });
        } catch (error) {
          console.error("Thumbnail generation failed:", error);
        }
      }

      res.status(201).json({
        success: true,
        message: "File uploaded successfully",
        data: {
          id: file.id,
          name: file.name,
          originalName: file.originalName,
          size: file.size,
          mimeType: file.mimeType,
          url: s3Result.url,
          publicLink: file.publicLink,
          createdAt: file.createdAt,
        },
      });
    } catch (error) {
      console.error("File upload error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to upload file",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
      });
    }
  }

  // Upload multiple files
  async uploadMultipleFiles(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No files provided",
        });
      }

      const { folderId, description, tags, isPublic } = req.body;
      const userId = req.user.id;

      // Check user storage limits
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const totalSize = req.files.reduce((sum, file) => sum + file.size, 0);
      if (!validateFileSize(totalSize, user.tier || "free")) {
        return res.status(400).json({
          success: false,
          message: "Total file size exceeds your storage limit",
        });
      }

      // Validate folder ownership if folderId is provided
      if (folderId) {
        const folder = await Folder.findOne({
          where: { id: folderId, userId },
        });
        if (!folder) {
          return res.status(404).json({
            success: false,
            message: "Folder not found or access denied",
          });
        }
      }

      const uploadedFiles = [];

      for (const file of req.files) {
        try {
          // Generate unique filename and S3 key
          const uniqueFilename = generateUniqueFilename(file.originalname);

          // Upload to S3
          const s3Result = await s3Service.uploadFile(
            file,
            `users/${userId}/files`
          );

          // Create file record in database
          const fileData = {
            name: path.basename(
              file.originalname,
              path.extname(file.originalname)
            ),
            originalName: file.originalname,
            description: description || null,
            mimeType: file.mimetype,
            size: file.size,
            extension: path.extname(file.originalname).toLowerCase(),
            s3Key: s3Result.key,
            s3Url: s3Result.url,
            folderId: folderId || null,
            userId,
            isPublic: isPublic === "true",
            publicLink: isPublic === "true" ? uuidv4() : null,
            tags: tags ? JSON.parse(tags) : null,
            metadata: {
              uploadedAt: new Date().toISOString(),
              userAgent: req.get("User-Agent"),
              ipAddress: req.ip,
            },
          };

          const fileRecord = await File.create(fileData);

          // Generate thumbnail for images
          if (file.mimetype.startsWith("image/")) {
            try {
              const thumbnailKey = `users/${userId}/thumbnails/${uniqueFilename}`;
              await s3Service.generateThumbnail(s3Result.key, thumbnailKey);
              await fileRecord.update({ thumbnailUrl: thumbnailKey });
            } catch (error) {
              console.error("Thumbnail generation failed:", error);
            }
          }

          uploadedFiles.push({
            id: fileRecord.id,
            name: fileRecord.name,
            originalName: fileRecord.originalName,
            size: fileRecord.size,
            mimeType: fileRecord.mimeType,
            url: s3Result.url,
            publicLink: fileRecord.publicLink,
            createdAt: fileRecord.createdAt,
          });
        } catch (error) {
          console.error(`Failed to upload file ${file.originalname}:`, error);
          uploadedFiles.push({
            originalName: file.originalname,
            error: "Upload failed",
          });
        }
      }

      res.status(201).json({
        success: true,
        message: "Files uploaded successfully",
        data: {
          uploaded: uploadedFiles.filter((f) => !f.error).length,
          failed: uploadedFiles.filter((f) => f.error).length,
          files: uploadedFiles,
        },
      });
    } catch (error) {
      console.error("Multiple file upload error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to upload files",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
      });
    }
  }

  // Get user's files
  async getUserFiles(req, res) {
    try {
      const userId = req.user.id;
      const {
        page = 1,
        limit = 20,
        folderId,
        search,
        type,
        sortBy = "createdAt",
        sortOrder = "DESC",
      } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = {
        userId,
        isDeleted: false,
      };

      if (folderId) {
        whereClause.folderId = folderId;
      }

      if (search) {
        whereClause.name = {
          [require("sequelize").Op.like]: `%${search}%`,
        };
      }

      if (type) {
        whereClause.mimeType = {
          [require("sequelize").Op.like]: `${type}%`,
        };
      }

      const { count, rows: files } = await File.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Folder,
            as: "folder",
            attributes: ["id", "name"],
          },
        ],
        order: [[sortBy, sortOrder.toUpperCase()]],
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      const totalPages = Math.ceil(count / limit);

      res.json({
        success: true,
        data: {
          files,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalFiles: count,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
          },
        },
      });
    } catch (error) {
      console.error("Get user files error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve files",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
      });
    }
  }

  // Get single file
  async getFile(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const file = await File.findOne({
        where: { id, userId, isDeleted: false },
        include: [
          {
            model: Folder,
            as: "folder",
            attributes: ["id", "name"],
          },
          {
            model: User,
            as: "user",
            attributes: ["id", "name", "email"],
          },
        ],
      });

      if (!file) {
        return res.status(404).json({
          success: false,
          message: "File not found",
        });
      }

      // Update last accessed time
      await file.update({ lastAccessed: new Date() });

      res.json({
        success: true,
        data: file,
      });
    } catch (error) {
      console.error("Get file error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve file",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
      });
    }
  }

  // Download file
  async downloadFile(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const file = await File.findOne({
        where: { id, userId, isDeleted: false },
      });

      if (!file) {
        return res.status(404).json({
          success: false,
          message: "File not found",
        });
      }

      // Check if file exists in S3
      const exists = await s3Service.fileExists(file.s3Key);
      if (!exists) {
        return res.status(404).json({
          success: false,
          message: "File not found in storage",
        });
      }

      // Get file from S3
      const s3File = await s3Service.downloadFile(file.s3Key);

      // Update download count and last accessed
      await file.update({
        downloadCount: file.downloadCount + 1,
        lastAccessed: new Date(),
      });

      // Set response headers
      res.setHeader("Content-Type", s3File.contentType);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${file.originalName}"`
      );
      res.setHeader("Content-Length", s3File.contentLength);

      // Send file
      res.send(s3File.body);
    } catch (error) {
      console.error("Download file error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to download file",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
      });
    }
  }

  // Get file preview URL
  async getFilePreview(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const file = await File.findOne({
        where: { id, userId, isDeleted: false },
      });

      if (!file) {
        return res.status(404).json({
          success: false,
          message: "File not found",
        });
      }

      // Check if file is previewable
      if (!file.isPreviewable()) {
        return res.status(400).json({
          success: false,
          message: "File type is not previewable",
        });
      }

      // Generate presigned URL for preview
      const presignedUrl = await s3Service.generatePresignedUrl(
        file.s3Key,
        "getObject",
        3600
      );

      res.json({
        success: true,
        data: {
          previewUrl: presignedUrl,
          fileType: file.getFileType(),
          mimeType: file.mimeType,
        },
      });
    } catch (error) {
      console.error("Get file preview error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to generate preview URL",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
      });
    }
  }

  // Update file
  async updateFile(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        });
      }

      const { id } = req.params;
      const userId = req.user.id;
      const { name, description, tags, isPublic, folderId } = req.body;

      const file = await File.findOne({
        where: { id, userId, isDeleted: false },
      });

      if (!file) {
        return res.status(404).json({
          success: false,
          message: "File not found",
        });
      }

      // Validate folder ownership if folderId is provided
      if (folderId && folderId !== file.folderId) {
        const folder = await Folder.findOne({
          where: { id: folderId, userId },
        });
        if (!folder) {
          return res.status(404).json({
            success: false,
            message: "Folder not found or access denied",
          });
        }
      }

      // Update file
      const updateData = {};
      if (name) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (tags !== undefined) updateData.tags = JSON.parse(tags);
      if (isPublic !== undefined) {
        updateData.isPublic = isPublic === "true";
        updateData.publicLink = isPublic === "true" ? uuidv4() : null;
      }
      if (folderId !== undefined) updateData.folderId = folderId;

      await file.update(updateData);

      res.json({
        success: true,
        message: "File updated successfully",
        data: file,
      });
    } catch (error) {
      console.error("Update file error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update file",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
      });
    }
  }

  // Delete file
  async deleteFile(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const file = await File.findOne({
        where: { id, userId, isDeleted: false },
      });

      if (!file) {
        return res.status(404).json({
          success: false,
          message: "File not found",
        });
      }

      // Soft delete the file
      await file.update({
        isDeleted: true,
        deletedAt: new Date(),
      });

      // Optionally delete from S3 (uncomment if you want hard delete)
      // await s3Service.deleteFile(file.s3Key);

      res.json({
        success: true,
        message: "File deleted successfully",
      });
    } catch (error) {
      console.error("Delete file error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete file",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
      });
    }
  }

  // Permanently delete file
  async permanentDeleteFile(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const file = await File.findOne({
        where: { id, userId, isDeleted: true },
      });

      if (!file) {
        return res.status(404).json({
          success: false,
          message: "File not found",
        });
      }

      // Delete from S3
      await s3Service.deleteFile(file.s3Key);

      // Delete thumbnail if exists
      if (file.thumbnailUrl) {
        await s3Service.deleteFile(file.thumbnailUrl);
      }

      // Permanently delete from database
      await file.destroy({ force: true });

      res.json({
        success: true,
        message: "File permanently deleted",
      });
    } catch (error) {
      console.error("Permanent delete file error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to permanently delete file",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
      });
    }
  }

  // Restore file from trash
  async restoreFile(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const file = await File.findOne({
        where: { id, userId, isDeleted: true },
      });

      if (!file) {
        return res.status(404).json({
          success: false,
          message: "File not found",
        });
      }

      await file.update({
        isDeleted: false,
        deletedAt: null,
      });

      res.json({
        success: true,
        message: "File restored successfully",
        data: file,
      });
    } catch (error) {
      console.error("Restore file error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to restore file",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
      });
    }
  }

  // Move file
  async moveFile(req, res) {
    try {
      const { id } = req.params;
      const { folderId } = req.body;
      const userId = req.user.id;

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        });
      }

      // Find the file
      const file = await File.findOne({
        where: { id, userId, isDeleted: false },
      });

      if (!file) {
        return res.status(404).json({
          success: false,
          message: "File not found",
        });
      }

      // Validate folder ownership if folderId is provided
      if (folderId) {
        const folder = await Folder.findOne({
          where: { id: folderId, userId, isDeleted: false },
        });
        if (!folder) {
          return res.status(404).json({
            success: false,
            message: "Folder not found or access denied",
          });
        }
      }

      // Generate new S3 key for the moved file
      const newS3Key = folderId
        ? `users/${userId}/folders/${folderId}/${file.name}`
        : `users/${userId}/files/${file.name}`;

      // Move file in S3
      await s3Service.copyFile(file.s3Key, newS3Key);
      await s3Service.deleteFile(file.s3Key);

      // Update file record
      await file.update({
        folderId: folderId || null,
        s3Key: newS3Key,
        s3Url: newS3Key,
        metadata: {
          ...file.metadata,
          movedAt: new Date().toISOString(),
        },
      });

      res.json({
        success: true,
        message: "File moved successfully",
        data: {
          id: file.id,
          name: file.name,
          folderId: file.folderId,
          updatedAt: file.updatedAt,
        },
      });
    } catch (error) {
      console.error("Move file error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to move file",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
      });
    }
  }

  // Copy file
  async copyFile(req, res) {
    try {
      const { id } = req.params;
      const { name, folderId } = req.body;
      const userId = req.user.id;

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        });
      }

      // Find the original file
      const originalFile = await File.findOne({
        where: { id, userId, isDeleted: false },
      });

      if (!originalFile) {
        return res.status(404).json({
          success: false,
          message: "File not found",
        });
      }

      // Validate folder ownership if folderId is provided
      if (folderId) {
        const folder = await Folder.findOne({
          where: { id: folderId, userId, isDeleted: false },
        });
        if (!folder) {
          return res.status(404).json({
            success: false,
            message: "Folder not found or access denied",
          });
        }
      }

      // Generate new S3 key for the copy
      const newFileName = name || `${originalFile.name}_copy`;
      const newS3Key = folderId
        ? `users/${userId}/folders/${folderId}/${newFileName}`
        : `users/${userId}/files/${newFileName}`;

      // Copy file in S3
      await s3Service.copyFile(originalFile.s3Key, newS3Key);

      // Create new file record
      const newFileData = {
        name: newFileName,
        originalName: originalFile.originalName,
        description: originalFile.description,
        mimeType: originalFile.mimeType,
        size: originalFile.size,
        extension: originalFile.extension,
        s3Key: newS3Key,
        s3Url: newS3Key, // You might want to generate a new URL
        thumbnailUrl: originalFile.thumbnailUrl, // Copy thumbnail if exists
        folderId: folderId || null,
        userId,
        isDeleted: false,
        isPublic: false, // Copy is private by default
        publicLink: null,
        downloadCount: 0,
        tags: originalFile.tags,
        metadata: {
          ...originalFile.metadata,
          copiedFrom: originalFile.id,
          copiedAt: new Date().toISOString(),
        },
      };

      const newFile = await File.create(newFileData);

      res.status(201).json({
        success: true,
        message: "File copied successfully",
        data: {
          id: newFile.id,
          name: newFile.name,
          size: newFile.size,
          mimeType: newFile.mimeType,
          folderId: newFile.folderId,
          createdAt: newFile.createdAt,
        },
      });
    } catch (error) {
      console.error("Copy file error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to copy file",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
      });
    }
  }

  // Get file statistics
  async getFileStats(req, res) {
    try {
      const userId = req.user.id;

      const stats = await File.findAll({
        where: { userId, isDeleted: false },
        attributes: [
          [
            require("sequelize").fn("COUNT", require("sequelize").col("id")),
            "totalFiles",
          ],
          [
            require("sequelize").fn("SUM", require("sequelize").col("size")),
            "totalSize",
          ],
          [
            require("sequelize").fn(
              "COUNT",
              require("sequelize").col("downloadCount")
            ),
            "totalDownloads",
          ],
        ],
        raw: true,
      });

      const fileTypes = await File.findAll({
        where: { userId, isDeleted: false },
        attributes: [
          "mimeType",
          [
            require("sequelize").fn("COUNT", require("sequelize").col("id")),
            "count",
          ],
        ],
        group: ["mimeType"],
        raw: true,
      });

      res.json({
        success: true,
        data: {
          stats: stats[0],
          fileTypes,
        },
      });
    } catch (error) {
      console.error("Get file stats error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get file statistics",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
      });
    }
  }

  // Get public file by link
  async getPublicFile(req, res) {
    try {
      const { publicLink } = req.params;

      const file = await File.findOne({
        where: { publicLink, isPublic: true, isDeleted: false },
        include: [
          {
            model: User,
            as: "user",
            attributes: ["name"],
          },
        ],
      });

      if (!file) {
        return res.status(404).json({
          success: false,
          message: "Public file not found",
        });
      }

      // Update download count
      await file.update({
        downloadCount: file.downloadCount + 1,
        lastAccessed: new Date(),
      });

      res.json({
        success: true,
        data: {
          id: file.id,
          name: file.name,
          originalName: file.originalName,
          size: file.size,
          mimeType: file.mimeType,
          description: file.description,
          uploadedBy: file.user.name,
          uploadedAt: file.createdAt,
          downloadCount: file.downloadCount,
        },
      });
    } catch (error) {
      console.error("Get public file error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get public file",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
      });
    }
  }
}

module.exports = new FileController();
