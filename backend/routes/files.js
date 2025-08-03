const express = require("express");
const router = express.Router();
const fileController = require("../controllers/fileController");
const { authenticateToken } = require("../middleware/auth");
const { uploadSingle, uploadMultiple } = require("../middleware/upload");
const { body, param, query } = require("express-validator");

/**
 * @swagger
 * components:
 *   schemas:
 *     File:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         originalName:
 *           type: string
 *         description:
 *           type: string
 *         mimeType:
 *           type: string
 *         size:
 *           type: integer
 *         extension:
 *           type: string
 *         s3Key:
 *           type: string
 *         s3Url:
 *           type: string
 *         thumbnailUrl:
 *           type: string
 *         folderId:
 *           type: string
 *           format: uuid
 *         userId:
 *           type: string
 *           format: uuid
 *         isPublic:
 *           type: boolean
 *         publicLink:
 *           type: string
 *         downloadCount:
 *           type: integer
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/files:
 *   get:
 *     summary: Get user's files
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: folderId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, size, createdAt, updatedAt]
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *     responses:
 *       200:
 *         description: Files retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     files:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/File'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         totalFiles:
 *                           type: integer
 *                         hasNextPage:
 *                           type: boolean
 *                         hasPrevPage:
 *                           type: boolean
 */
router.get("/", authenticateToken, fileController.getUserFiles);

/**
 * @swagger
 * /api/files/upload:
 *   post:
 *     summary: Upload a single file
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               folderId:
 *                 type: string
 *                 format: uuid
 *               description:
 *                 type: string
 *               tags:
 *                 type: string
 *               isPublic:
 *                 type: string
 *                 enum: [true, false]
 *     responses:
 *       201:
 *         description: File uploaded successfully
 *       400:
 *         description: Validation error or file too large
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/upload",
  authenticateToken,
  uploadSingle,
  [
    body("folderId")
      .optional()
      .isUUID()
      .withMessage("Invalid folder ID"),
    body("description")
      .optional()
      .isLength({ max: 1000 })
      .withMessage("Description too long"),
    body("tags")
      .optional()
      .isJSON()
      .withMessage("Invalid tags format"),
    body("isPublic")
      .optional()
      .isIn(["true", "false"])
      .withMessage("Invalid public flag"),
  ],
  fileController.uploadFile
);

/**
 * @swagger
 * /api/files/upload-multiple:
 *   post:
 *     summary: Upload multiple files
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *               folderId:
 *                 type: string
 *                 format: uuid
 *               description:
 *                 type: string
 *               tags:
 *                 type: string
 *               isPublic:
 *                 type: string
 *                 enum: [true, false]
 *     responses:
 *       201:
 *         description: Files uploaded successfully
 *       400:
 *         description: Validation error or files too large
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/upload-multiple",
  authenticateToken,
  uploadMultiple,
  [
    body("folderId")
      .optional()
      .isUUID()
      .withMessage("Invalid folder ID"),
    body("description")
      .optional()
      .isLength({ max: 1000 })
      .withMessage("Description too long"),
    body("tags")
      .optional()
      .isJSON()
      .withMessage("Invalid tags format"),
    body("isPublic")
      .optional()
      .isIn(["true", "false"])
      .withMessage("Invalid public flag"),
  ],
  fileController.uploadMultipleFiles
);

/**
 * @swagger
 * /api/files/{id}:
 *   get:
 *     summary: Get a specific file
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: File retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/File'
 *       404:
 *         description: File not found
 */
router.get(
  "/:id",
  authenticateToken,
  [
    param("id")
      .isUUID()
      .withMessage("Invalid file ID"),
  ],
  fileController.getFile
);

/**
 * @swagger
 * /api/files/{id}/download:
 *   get:
 *     summary: Download a file
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: File downloaded successfully
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: File not found
 */
router.get(
  "/:id/download",
  authenticateToken,
  [
    param("id")
      .isUUID()
      .withMessage("Invalid file ID"),
  ],
  fileController.downloadFile
);

/**
 * @swagger
 * /api/files/{id}/preview:
 *   get:
 *     summary: Get file preview URL
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Preview URL generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     previewUrl:
 *                       type: string
 *                     fileType:
 *                       type: string
 *                     mimeType:
 *                       type: string
 *       400:
 *         description: File type not previewable
 *       404:
 *         description: File not found
 */
router.get(
  "/:id/preview",
  authenticateToken,
  [
    param("id")
      .isUUID()
      .withMessage("Invalid file ID"),
  ],
  fileController.getFilePreview
);

/**
 * @swagger
 * /api/files/{id}:
 *   put:
 *     summary: Update a file
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 255
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *               tags:
 *                 type: string
 *               isPublic:
 *                 type: string
 *                 enum: [true, false]
 *               folderId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: File updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: File not found
 */
router.put(
  "/:id",
  authenticateToken,
  [
    param("id")
      .isUUID()
      .withMessage("Invalid file ID"),
    body("name")
      .optional()
      .isLength({ min: 1, max: 255 })
      .withMessage("Name must be between 1 and 255 characters"),
    body("description")
      .optional()
      .isLength({ max: 1000 })
      .withMessage("Description too long"),
    body("tags")
      .optional()
      .isJSON()
      .withMessage("Invalid tags format"),
    body("isPublic")
      .optional()
      .isIn(["true", "false"])
      .withMessage("Invalid public flag"),
    body("folderId")
      .optional()
      .isUUID()
      .withMessage("Invalid folder ID"),
  ],
  fileController.updateFile
);

/**
 * @swagger
 * /api/files/{id}:
 *   delete:
 *     summary: Delete a file (soft delete)
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: File deleted successfully
 *       404:
 *         description: File not found
 */
router.delete(
  "/:id",
  authenticateToken,
  [
    param("id")
      .isUUID()
      .withMessage("Invalid file ID"),
  ],
  fileController.deleteFile
);

/**
 * @swagger
 * /api/files/{id}/permanent:
 *   delete:
 *     summary: Permanently delete a file
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: File permanently deleted
 *       404:
 *         description: File not found
 */
router.delete(
  "/:id/permanent",
  authenticateToken,
  [
    param("id")
      .isUUID()
      .withMessage("Invalid file ID"),
  ],
  fileController.permanentDeleteFile
);

/**
 * @swagger
 * /api/files/{id}/restore:
 *   post:
 *     summary: Restore a file from trash
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: File restored successfully
 *       404:
 *         description: File not found
 */
router.post(
  "/:id/restore",
  authenticateToken,
  [
    param("id")
      .isUUID()
      .withMessage("Invalid file ID"),
  ],
  fileController.restoreFile
);

/**
 * @swagger
 * /api/files/stats:
 *   get:
 *     summary: Get file statistics
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     stats:
 *                       type: object
 *                       properties:
 *                         totalFiles:
 *                           type: integer
 *                         totalSize:
 *                           type: integer
 *                         totalDownloads:
 *                           type: integer
 *                     fileTypes:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           mimeType:
 *                             type: string
 *                           count:
 *                             type: integer
 */
router.get("/stats", authenticateToken, fileController.getFileStats);

/**
 * @swagger
 * /api/files/public/{publicLink}:
 *   get:
 *     summary: Get public file by link
 *     tags: [Files]
 *     parameters:
 *       - in: path
 *         name: publicLink
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Public file retrieved successfully
 *       404:
 *         description: Public file not found
 */
router.get(
  "/public/:publicLink",
  [
    param("publicLink")
      .isUUID()
      .withMessage("Invalid public link"),
  ],
  fileController.getPublicFile
);

module.exports = router;
