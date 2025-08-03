const { Folder, File, User } = require("../models");
const s3Service = require("../services/s3Service");
const { validationResult } = require("express-validator");
const { v4: uuidv4 } = require("uuid");

class FolderController {
  // Create a new folder
  async createFolder(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        });
      }

      const { name, description, parentId, color, isPublic } = req.body;
      const userId = req.user.id;

      // Check if folder with same name exists in the same parent
      const existingFolder = await Folder.findOne({
        where: {
          name,
          userId,
          parentId: parentId || null,
          isDeleted: false,
        },
      });

      if (existingFolder) {
        return res.status(400).json({
          success: false,
          message: "A folder with this name already exists in this location",
        });
      }

      // Validate parent folder ownership if parentId is provided
      if (parentId) {
        const parentFolder = await Folder.findOne({
          where: { id: parentId, userId, isDeleted: false },
        });
        if (!parentFolder) {
          return res.status(404).json({
            success: false,
            message: "Parent folder not found or access denied",
          });
        }
      }

      // Create folder in S3
      const folderPath = parentId
        ? await this.buildFolderPath(parentId, userId)
        : `users/${userId}/folders`;

      const s3FolderKey = `${folderPath}/${name}`;
      await s3Service.createFolder(s3FolderKey);

      // Create folder record in database
      const folderData = {
        name,
        description: description || null,
        path: s3FolderKey, // Use S3 key as path
        parentId: parentId || null,
        userId,
        color: color || null,
        isPublic: isPublic === "true",
        publicLink: isPublic === "true" ? uuidv4() : null,
        s3Key: s3FolderKey,
        metadata: {
          createdAt: new Date().toISOString(),
          userAgent: req.get("User-Agent"),
          ipAddress: req.ip,
        },
      };

      const folder = await Folder.create(folderData);

      res.status(201).json({
        success: true,
        message: "Folder created successfully",
        data: {
          id: folder.id,
          name: folder.name,
          description: folder.description,
          parentId: folder.parentId,
          color: folder.color,
          isPublic: folder.isPublic,
          publicLink: folder.publicLink,
          createdAt: folder.createdAt,
        },
      });
    } catch (error) {
      console.error("Create folder error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create folder",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
      });
    }
  }

  // Get user's folders
  async getUserFolders(req, res) {
    try {
      const userId = req.user.id;
      const {
        page = 1,
        limit = 20,
        parentId,
        search,
        sortBy = "createdAt",
        sortOrder = "DESC",
        includeFiles = "false",
      } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = {
        userId,
        isDeleted: false,
      };

      if (parentId) {
        whereClause.parentId = parentId;
      } else if (parentId === "null") {
        whereClause.parentId = null;
      }

      if (search) {
        whereClause.name = {
          [require("sequelize").Op.like]: `%${search}%`,
        };
      }

      const includeOptions = [
        {
          model: Folder,
          as: "parent",
          attributes: ["id", "name"],
        },
      ];

      if (includeFiles === "true") {
        includeOptions.push({
          model: File,
          as: "files",
          where: { isDeleted: false },
          required: false,
          attributes: ["id", "name", "size", "mimeType", "createdAt"],
        });
      }

      const { count, rows: folders } = await Folder.findAndCountAll({
        where: whereClause,
        include: includeOptions,
        order: [[sortBy, sortOrder.toUpperCase()]],
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      const totalPages = Math.ceil(count / limit);

      res.json({
        success: true,
        data: {
          folders,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalFolders: count,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
          },
        },
      });
    } catch (error) {
      console.error("Get user folders error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve folders",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
      });
    }
  }

  // Get folder tree structure
  async getFolderTree(req, res) {
    try {
      const userId = req.user.id;

      const folders = await Folder.findAll({
        where: { userId, isDeleted: false },
        include: [
          {
            model: Folder,
            as: "parent",
            attributes: ["id", "name"],
          },
        ],
        order: [["name", "ASC"]],
      });

      // Build tree structure
      const folderTree = FolderController.buildFolderTree(folders);

      res.json({
        success: true,
        data: folderTree,
      });
    } catch (error) {
      console.error("Get folder tree error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve folder tree",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
      });
    }
  }

  // Get single folder
  async getFolder(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const folder = await Folder.findOne({
        where: { id, userId, isDeleted: false },
        include: [
          {
            model: Folder,
            as: "parent",
            attributes: ["id", "name"],
          },
          {
            model: Folder,
            as: "children",
            where: { isDeleted: false },
            required: false,
            attributes: ["id", "name", "createdAt"],
          },
          {
            model: File,
            as: "files",
            where: { isDeleted: false },
            required: false,
            attributes: ["id", "name", "size", "mimeType", "createdAt"],
          },
        ],
      });

      if (!folder) {
        return res.status(404).json({
          success: false,
          message: "Folder not found",
        });
      }

      // Get folder statistics
      const fileCount = await File.count({
        where: { folderId: id, isDeleted: false },
      });

      const totalSize = await File.sum("size", {
        where: { folderId: id, isDeleted: false },
      });

      res.json({
        success: true,
        data: {
          ...folder.toJSON(),
          stats: {
            fileCount,
            totalSize: totalSize || 0,
          },
        },
      });
    } catch (error) {
      console.error("Get folder error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve folder",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
      });
    }
  }

  // Update folder
  async updateFolder(req, res) {
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
      const { name, description, parentId, color, isPublic } = req.body;

      const folder = await Folder.findOne({
        where: { id, userId, isDeleted: false },
      });

      if (!folder) {
        return res.status(404).json({
          success: false,
          message: "Folder not found",
        });
      }

      // Check if moving to a new parent would create a circular reference
      if (parentId && parentId !== folder.parentId) {
        const isCircular = await this.checkCircularReference(
          id,
          parentId,
          userId
        );
        if (isCircular) {
          return res.status(400).json({
            success: false,
            message: "Cannot move folder: would create circular reference",
          });
        }
      }

      // Check if folder with same name exists in the new parent
      if (name && name !== folder.name) {
        const existingFolder = await Folder.findOne({
          where: {
            name,
            userId,
            parentId: parentId || folder.parentId,
            isDeleted: false,
            id: { [require("sequelize").Op.ne]: id },
          },
        });

        if (existingFolder) {
          return res.status(400).json({
            success: false,
            message: "A folder with this name already exists in this location",
          });
        }
      }

      // Validate parent folder ownership if parentId is provided
      if (parentId && parentId !== folder.parentId) {
        const parentFolder = await Folder.findOne({
          where: { id: parentId, userId, isDeleted: false },
        });
        if (!parentFolder) {
          return res.status(404).json({
            success: false,
            message: "Parent folder not found or access denied",
          });
        }
      }

      // Update folder
      const updateData = {};
      if (name) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (parentId !== undefined) updateData.parentId = parentId;
      if (color !== undefined) updateData.color = color;
      if (isPublic !== undefined) {
        updateData.isPublic = isPublic === "true";
        updateData.publicLink = isPublic === "true" ? uuidv4() : null;
      }

      await folder.update(updateData);

      res.json({
        success: true,
        message: "Folder updated successfully",
        data: folder,
      });
    } catch (error) {
      console.error("Update folder error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update folder",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
      });
    }
  }

  // Delete folder
  async deleteFolder(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const folder = await Folder.findOne({
        where: { id, userId, isDeleted: false },
      });

      if (!folder) {
        return res.status(404).json({
          success: false,
          message: "Folder not found",
        });
      }

      // Check if folder has files or subfolders
      const fileCount = await File.count({
        where: { folderId: id, isDeleted: false },
      });

      const subfolderCount = await Folder.count({
        where: { parentId: id, isDeleted: false },
      });

      if (fileCount > 0 || subfolderCount > 0) {
        return res.status(400).json({
          success: false,
          message: "Cannot delete folder: contains files or subfolders",
        });
      }

      // Soft delete the folder
      await folder.update({
        isDeleted: true,
        deletedAt: new Date(),
      });

      res.json({
        success: true,
        message: "Folder deleted successfully",
      });
    } catch (error) {
      console.error("Delete folder error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete folder",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
      });
    }
  }

  // Permanently delete folder
  async permanentDeleteFolder(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const folder = await Folder.findOne({
        where: { id, userId, isDeleted: true },
      });

      if (!folder) {
        return res.status(404).json({
          success: false,
          message: "Folder not found",
        });
      }

      // Delete from S3
      await s3Service.deleteFolder(folder.s3Key);

      // Permanently delete from database
      await folder.destroy({ force: true });

      res.json({
        success: true,
        message: "Folder permanently deleted",
      });
    } catch (error) {
      console.error("Permanent delete folder error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to permanently delete folder",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
      });
    }
  }

  // Restore folder from trash
  async restoreFolder(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const folder = await Folder.findOne({
        where: { id, userId, isDeleted: true },
      });

      if (!folder) {
        return res.status(404).json({
          success: false,
          message: "Folder not found",
        });
      }

      await folder.update({
        isDeleted: false,
        deletedAt: null,
      });

      res.json({
        success: true,
        message: "Folder restored successfully",
        data: folder,
      });
    } catch (error) {
      console.error("Restore folder error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to restore folder",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
      });
    }
  }

  // Get folder statistics
  async getFolderStats(req, res) {
    try {
      const userId = req.user.id;

      const stats = await Folder.findAll({
        where: { userId, isDeleted: false },
        attributes: [
          [
            require("sequelize").fn("COUNT", require("sequelize").col("id")),
            "totalFolders",
          ],
        ],
        raw: true,
      });

      const folderSizes = await File.findAll({
        where: { userId, isDeleted: false },
        attributes: [
          "folderId",
          [
            require("sequelize").fn("COUNT", require("sequelize").col("id")),
            "fileCount",
          ],
          [
            require("sequelize").fn("SUM", require("sequelize").col("size")),
            "totalSize",
          ],
        ],
        group: ["folderId"],
        raw: true,
      });

      res.json({
        success: true,
        data: {
          stats: stats[0],
          folderSizes,
        },
      });
    } catch (error) {
      console.error("Get folder stats error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get folder statistics",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
      });
    }
  }

  // Get public folder by link
  async getPublicFolder(req, res) {
    try {
      const { publicLink } = req.params;

      const folder = await Folder.findOne({
        where: { publicLink, isPublic: true, isDeleted: false },
        include: [
          {
            model: User,
            as: "user",
            attributes: ["username"],
          },
          {
            model: File,
            as: "files",
            where: { isDeleted: false },
            required: false,
            attributes: ["id", "name", "size", "mimeType", "createdAt"],
          },
        ],
      });

      if (!folder) {
        return res.status(404).json({
          success: false,
          message: "Public folder not found",
        });
      }

      res.json({
        success: true,
        data: {
          id: folder.id,
          name: folder.name,
          description: folder.description,
          uploadedBy: folder.user.username,
          createdAt: folder.createdAt,
          files: folder.files,
        },
      });
    } catch (error) {
      console.error("Get public folder error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get public folder",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
      });
    }
  }

  // Helper method to build folder path
  async buildFolderPath(folderId, userId) {
    const pathParts = [];
    let currentFolderId = folderId;

    while (currentFolderId) {
      const folder = await Folder.findByPk(currentFolderId);
      if (!folder || folder.userId !== userId) {
        break;
      }
      pathParts.unshift(folder.name);
      currentFolderId = folder.parentId;
    }

    return `users/${userId}/folders/${pathParts.join("/")}`;
  }

  // Helper method to build folder tree
  static buildFolderTree(folders, parentId = null) {
    const tree = [];

    for (const folder of folders) {
      if (folder.parentId === parentId) {
        const children = FolderController.buildFolderTree(folders, folder.id);
        tree.push({
          ...folder.toJSON(),
          children,
        });
      }
    }

    return tree;
  }

  // Helper method to check for circular references
  async checkCircularReference(folderId, newParentId, userId) {
    let currentParentId = newParentId;

    while (currentParentId) {
      if (currentParentId === folderId) {
        return true; // Circular reference detected
      }

      const parent = await Folder.findOne({
        where: { id: currentParentId, userId, isDeleted: false },
      });

      if (!parent) {
        break;
      }

      currentParentId = parent.parentId;
    }

    return false;
  }
}

module.exports = new FolderController();
