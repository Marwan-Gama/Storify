const express = require("express");
const router = express.Router();
const folderController = require("../controllers/folderController");
const { authenticateToken } = require("../middleware/auth");
const { body, param } = require("express-validator");

/**
 * @swagger
 * components:
 *   schemas:
 *     Folder:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         parentId:
 *           type: string
 *           format: uuid
 *         userId:
 *           type: string
 *           format: uuid
 *         color:
 *           type: string
 *         isPublic:
 *           type: boolean
 *         publicLink:
 *           type: string
 *         s3Key:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/folders:
 *   get:
 *     summary: Get user's folders
 *     tags: [Folders]
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
 *         name: parentId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, createdAt, updatedAt]
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *       - in: query
 *         name: includeFiles
 *         schema:
 *           type: string
 *           enum: [true, false]
 *           default: false
 *     responses:
 *       200:
 *         description: Folders retrieved successfully
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
 *                     folders:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Folder'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         totalFolders:
 *                           type: integer
 *                         hasNextPage:
 *                           type: boolean
 *                         hasPrevPage:
 *                           type: boolean
 */
router.get("/", authenticateToken, folderController.getUserFolders);

/**
 * @swagger
 * /api/folders/tree:
 *   get:
 *     summary: Get folder tree structure
 *     tags: [Folders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Folder tree retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Folder'
 */
router.get("/tree", authenticateToken, folderController.getFolderTree);

/**
 * @swagger
 * /api/folders:
 *   post:
 *     summary: Create a new folder
 *     tags: [Folders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 255
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *               parentId:
 *                 type: string
 *                 format: uuid
 *               color:
 *                 type: string
 *               isPublic:
 *                 type: string
 *                 enum: [true, false]
 *     responses:
 *       201:
 *         description: Folder created successfully
 *       400:
 *         description: Validation error or folder already exists
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/",
  authenticateToken,
  [
    body("name")
      .isLength({ min: 1, max: 255 })
      .withMessage("Name must be between 1 and 255 characters")
      .trim(),
    body("description")
      .optional()
      .isLength({ max: 1000 })
      .withMessage("Description too long"),
    body("parentId")
      .optional()
      .isUUID()
      .withMessage("Invalid parent folder ID"),
    body("color").optional().isHexColor().withMessage("Invalid color format"),
    body("isPublic")
      .optional()
      .isIn(["true", "false"])
      .withMessage("Invalid public flag"),
  ],
  folderController.createFolder
);

/**
 * @swagger
 * /api/folders/stats:
 *   get:
 *     summary: Get folder statistics
 *     tags: [Folders]
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
 *                         totalFolders:
 *                           type: integer
 *                     folderSizes:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           folderId:
 *                             type: string
 *                           fileCount:
 *                             type: integer
 *                           totalSize:
 *                             type: integer
 */
router.get("/stats", authenticateToken, folderController.getFolderStats);

/**
 * @swagger
 * /api/folders/{id}:
 *   get:
 *     summary: Get a specific folder
 *     tags: [Folders]
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
 *         description: Folder retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Folder'
 *       404:
 *         description: Folder not found
 */
router.get(
  "/:id",
  authenticateToken,
  [param("id").isUUID().withMessage("Invalid folder ID")],
  folderController.getFolder
);

/**
 * @swagger
 * /api/folders/{id}:
 *   put:
 *     summary: Update a folder
 *     tags: [Folders]
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
 *               parentId:
 *                 type: string
 *                 format: uuid
 *               color:
 *                 type: string
 *               isPublic:
 *                 type: string
 *                 enum: [true, false]
 *     responses:
 *       200:
 *         description: Folder updated successfully
 *       400:
 *         description: Validation error or circular reference
 *       404:
 *         description: Folder not found
 */
router.put(
  "/:id",
  authenticateToken,
  [
    param("id").isUUID().withMessage("Invalid folder ID"),
    body("name")
      .optional()
      .isLength({ min: 1, max: 255 })
      .withMessage("Name must be between 1 and 255 characters")
      .trim(),
    body("description")
      .optional()
      .isLength({ max: 1000 })
      .withMessage("Description too long"),
    body("parentId")
      .optional()
      .isUUID()
      .withMessage("Invalid parent folder ID"),
    body("color").optional().isHexColor().withMessage("Invalid color format"),
    body("isPublic")
      .optional()
      .isIn(["true", "false"])
      .withMessage("Invalid public flag"),
  ],
  folderController.updateFolder
);

/**
 * @swagger
 * /api/folders/{id}:
 *   delete:
 *     summary: Delete a folder (soft delete)
 *     tags: [Folders]
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
 *         description: Folder deleted successfully
 *       400:
 *         description: Folder contains files or subfolders
 *       404:
 *         description: Folder not found
 */
router.delete(
  "/:id",
  authenticateToken,
  [param("id").isUUID().withMessage("Invalid folder ID")],
  folderController.deleteFolder
);

/**
 * @swagger
 * /api/folders/{id}/permanent:
 *   delete:
 *     summary: Permanently delete a folder
 *     tags: [Folders]
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
 *         description: Folder permanently deleted
 *       404:
 *         description: Folder not found
 */
router.delete(
  "/:id/permanent",
  authenticateToken,
  [param("id").isUUID().withMessage("Invalid folder ID")],
  folderController.permanentDeleteFolder
);

/**
 * @swagger
 * /api/folders/{id}/restore:
 *   post:
 *     summary: Restore a folder from trash
 *     tags: [Folders]
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
 *         description: Folder restored successfully
 *       404:
 *         description: Folder not found
 */
router.post(
  "/:id/restore",
  authenticateToken,
  [param("id").isUUID().withMessage("Invalid folder ID")],
  folderController.restoreFolder
);

/**
 * @swagger
 * /api/folders/{id}/copy:
 *   post:
 *     summary: Copy a folder
 *     tags: [Folders]
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
 *                 description: New name for the copied folder
 *               parentId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the parent folder to copy the folder to
 *     responses:
 *       201:
 *         description: Folder copied successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Folder not found
 */
router.post(
  "/:id/copy",
  authenticateToken,
  [
    param("id").isUUID().withMessage("Invalid folder ID"),
    body("name")
      .optional()
      .isLength({ min: 1, max: 255 })
      .withMessage("Name must be between 1 and 255 characters"),
    body("parentId")
      .optional()
      .isUUID()
      .withMessage("Invalid parent folder ID"),
  ],
  folderController.copyFolder
);

/**
 * @swagger
 * /api/folders/{id}/move:
 *   put:
 *     summary: Move a folder to a different parent
 *     tags: [Folders]
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
 *               parentId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the parent folder to move the folder to (null for root)
 *     responses:
 *       200:
 *         description: Folder moved successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Folder not found
 */
router.put(
  "/:id/move",
  authenticateToken,
  [
    param("id").isUUID().withMessage("Invalid folder ID"),
    body("parentId")
      .optional()
      .isUUID()
      .withMessage("Invalid parent folder ID"),
  ],
  folderController.moveFolder
);

/**
 * @swagger
 * /api/folders/public/{publicLink}:
 *   get:
 *     summary: Get public folder by link
 *     tags: [Folders]
 *     parameters:
 *       - in: path
 *         name: publicLink
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Public folder retrieved successfully
 *       404:
 *         description: Public folder not found
 */
router.get(
  "/public/:publicLink",
  [param("publicLink").isUUID().withMessage("Invalid public link")],
  folderController.getPublicFolder
);

module.exports = router;
