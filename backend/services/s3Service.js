const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs").promises;

// Check if AWS credentials are configured
const hasAwsCredentials =
  process.env.AWS_ACCESS_KEY_ID &&
  process.env.AWS_SECRET_ACCESS_KEY &&
  process.env.AWS_S3_BUCKET;

// Configure AWS S3 with retry logic (only if credentials are available)
const s3 = hasAwsCredentials
  ? new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION,
      maxRetries: 3,
      retryDelayOptions: {
        base: 300,
      },
      httpOptions: {
        timeout: 300000, // 5 minutes
        connectTimeout: 60000, // 1 minute
      },
    })
  : null;

const BUCKET_NAME = process.env.AWS_S3_BUCKET;

// Custom error class for S3 operations
class S3Error extends Error {
  constructor(message, code, statusCode = 500) {
    super(message);
    this.name = "S3Error";
    this.code = code;
    this.statusCode = statusCode;
  }
}

class S3Service {
  // Upload file to S3 with enhanced error handling
  async uploadFile(file, folder = "uploads", options = {}) {
    try {
      // If AWS credentials are not configured, use local storage
      if (!hasAwsCredentials) {
        return this.uploadFileLocal(file, folder, options);
      }

      const key = `${folder}/${uuidv4()}_${file.originalname}`;
      const {
        contentType = file.mimetype,
        metadata = {},
        encryption = "AES256",
        cacheControl = "public, max-age=31536000",
      } = options;

      const params = {
        Bucket: BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType: contentType,
        ContentDisposition: "inline",
        ServerSideEncryption: encryption,
        CacheControl: cacheControl,
        Metadata: {
          originalName: file.originalname,
          uploadedAt: new Date().toISOString(),
          fileSize: file.size.toString(),
          ...metadata,
        },
      };

      const result = await s3.upload(params).promise();

      return {
        key: result.Key,
        url: result.Location,
        bucket: result.Bucket,
        etag: result.ETag,
        versionId: result.VersionId,
      };
    } catch (error) {
      throw new S3Error(
        `S3 upload failed: ${error.message}`,
        error.code || "UPLOAD_ERROR",
        error.statusCode || 500
      );
    }
  }

  // Local storage fallback for development
  async uploadFileLocal(file, folder = "uploads") {
    try {
      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(__dirname, "..", "..", "uploads");
      const folderPath = path.join(uploadsDir, folder);

      await fs.mkdir(folderPath, { recursive: true });

      const filename = `${uuidv4()}_${file.originalname}`;
      const filePath = path.join(folderPath, filename);

      // Write file to local storage
      await fs.writeFile(filePath, file.buffer);

      return {
        key: `${folder}/${filename}`,
        url: `/uploads/${folder}/${filename}`,
        bucket: "local",
        etag: "local-etag",
        versionId: null,
        localPath: filePath,
      };
    } catch (error) {
      throw new S3Error(
        `Local upload failed: ${error.message}`,
        "LOCAL_UPLOAD_ERROR",
        500
      );
    }
  }

  // Download file from S3 with streaming support
  async downloadFile(key, options = {}) {
    try {
      // If AWS credentials are not configured, use local storage
      if (!hasAwsCredentials) {
        return this.downloadFileLocal(key);
      }

      const { range } = options;

      const params = {
        Bucket: BUCKET_NAME,
        Key: key,
      };

      if (range) {
        params.Range = range;
      }

      const result = await s3.getObject(params).promise();

      return {
        body: result.Body,
        contentType: result.ContentType,
        contentLength: result.ContentLength,
        metadata: result.Metadata,
        etag: result.ETag,
        lastModified: result.LastModified,
        expires: result.Expires,
        cacheControl: result.CacheControl,
      };
    } catch (error) {
      if (error.code === "NoSuchKey") {
        throw new S3Error("File not found", "FILE_NOT_FOUND", 404);
      }
      throw new S3Error(
        `S3 download failed: ${error.message}`,
        error.code || "DOWNLOAD_ERROR",
        error.statusCode || 500
      );
    }
  }

  // Local download fallback for development
  async downloadFileLocal(key) {
    try {
      const uploadsDir = path.join(__dirname, "..", "..", "uploads");
      const filePath = path.join(uploadsDir, key);

      // Check if file exists
      try {
        await fs.access(filePath);
      } catch (error) {
        throw new S3Error("File not found", "FILE_NOT_FOUND", 404);
      }

      const stats = await fs.stat(filePath);
      const buffer = await fs.readFile(filePath);

      return {
        body: buffer,
        contentType: this.getMimeType(key),
        contentLength: stats.size,
        metadata: {
          originalName: path.basename(key),
          uploadedAt: stats.birthtime.toISOString(),
          fileSize: stats.size.toString(),
        },
        etag: "local-etag",
        lastModified: stats.mtime,
        expires: null,
        cacheControl: "public, max-age=31536000",
      };
    } catch (error) {
      if (error instanceof S3Error) {
        throw error;
      }
      throw new S3Error(
        `Local download failed: ${error.message}`,
        "LOCAL_DOWNLOAD_ERROR",
        500
      );
    }
  }

  // Helper method to get MIME type from file extension
  getMimeType(filename) {
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".pdf": "application/pdf",
      ".txt": "text/plain",
      ".doc": "application/msword",
      ".docx":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ".mp4": "video/mp4",
      ".mp3": "audio/mpeg",
    };
    return mimeTypes[ext] || "application/octet-stream";
  }

  // Generate presigned URL for file access with enhanced options
  async generatePresignedUrl(
    key,
    operation = "getObject",
    expiresIn = 3600,
    options = {}
  ) {
    try {
      // If AWS credentials are not configured, use local storage
      if (!hasAwsCredentials) {
        return this.generatePresignedUrlLocal(
          key,
          operation,
          expiresIn,
          options
        );
      }

      const {
        contentType,
        responseContentDisposition,
        responseContentType,
        responseCacheControl,
      } = options;

      const params = {
        Bucket: BUCKET_NAME,
        Key: key,
        Expires: expiresIn,
      };

      if (contentType) params.ContentType = contentType;
      if (responseContentDisposition)
        params.ResponseContentDisposition = responseContentDisposition;
      if (responseContentType) params.ResponseContentType = responseContentType;
      if (responseCacheControl)
        params.ResponseCacheControl = responseCacheControl;

      const url = await s3.getSignedUrlPromise(operation, params);
      return url;
    } catch (error) {
      throw new S3Error(
        `Failed to generate presigned URL: ${error.message}`,
        error.code || "PRESIGNED_URL_ERROR",
        error.statusCode || 500
      );
    }
  }

  // Local presigned URL generation for development
  generatePresignedUrlLocal(key) {
    try {
      // For local development, return a direct file URL
      return `http://localhost:5000/uploads/${key}`;
    } catch (error) {
      throw new S3Error(
        `Failed to generate local presigned URL: ${error.message}`,
        "LOCAL_PRESIGNED_URL_ERROR",
        500
      );
    }
  }

  // Delete file from S3 with versioning support
  async deleteFile(key, versionId = null) {
    try {
      const params = {
        Bucket: BUCKET_NAME,
        Key: key,
      };

      if (versionId) {
        params.VersionId = versionId;
      }

      const result = await s3.deleteObject(params).promise();
      return {
        success: true,
        versionId: result.VersionId,
        deleteMarker: result.DeleteMarker,
      };
    } catch (error) {
      throw new S3Error(
        `S3 delete failed: ${error.message}`,
        error.code || "DELETE_ERROR",
        error.statusCode || 500
      );
    }
  }

  // Copy file within S3 with metadata preservation
  async copyFile(sourceKey, destinationKey, options = {}) {
    try {
      const {
        preserveMetadata = true,
        newMetadata = {},
        contentType,
        cacheControl,
      } = options;

      const params = {
        Bucket: BUCKET_NAME,
        CopySource: `${BUCKET_NAME}/${sourceKey}`,
        Key: destinationKey,
      };

      if (contentType) params.ContentType = contentType;
      if (cacheControl) params.CacheControl = cacheControl;

      if (preserveMetadata) {
        // Get source file metadata
        const sourceMetadata = await this.getFileMetadata(sourceKey);
        params.Metadata = { ...sourceMetadata.metadata, ...newMetadata };
        params.MetadataDirective = "REPLACE";
      }

      const result = await s3.copyObject(params).promise();
      return {
        success: true,
        versionId: result.VersionId,
        copySourceVersionId: result.CopySourceVersionId,
      };
    } catch (error) {
      throw new S3Error(
        `S3 copy failed: ${error.message}`,
        error.code || "COPY_ERROR",
        error.statusCode || 500
      );
    }
  }

  // Check if file exists in S3
  async fileExists(key) {
    try {
      const params = {
        Bucket: BUCKET_NAME,
        Key: key,
      };

      await s3.headObject(params).promise();
      return true;
    } catch (error) {
      if (error.code === "NotFound" || error.code === "NoSuchKey") {
        return false;
      }
      throw new S3Error(
        `Failed to check file existence: ${error.message}`,
        error.code || "EXISTENCE_CHECK_ERROR",
        error.statusCode || 500
      );
    }
  }

  // Get file metadata with enhanced information
  async getFileMetadata(key) {
    try {
      const params = {
        Bucket: BUCKET_NAME,
        Key: key,
      };

      const result = await s3.headObject(params).promise();

      return {
        contentType: result.ContentType,
        contentLength: result.ContentLength,
        lastModified: result.LastModified,
        metadata: result.Metadata,
        etag: result.ETag,
        versionId: result.VersionId,
        expires: result.Expires,
        cacheControl: result.CacheControl,
        contentDisposition: result.ContentDisposition,
        contentEncoding: result.ContentEncoding,
        contentLanguage: result.ContentLanguage,
        serverSideEncryption: result.ServerSideEncryption,
      };
    } catch (error) {
      if (error.code === "NotFound" || error.code === "NoSuchKey") {
        throw new S3Error("File not found", "FILE_NOT_FOUND", 404);
      }
      throw new S3Error(
        `Failed to get file metadata: ${error.message}`,
        error.code || "METADATA_ERROR",
        error.statusCode || 500
      );
    }
  }

  // List files in a folder with pagination and filtering
  async listFiles(prefix = "", options = {}) {
    try {
      const {
        maxKeys = 1000,
        continuationToken,
        delimiter = "/",
        startAfter,
      } = options;

      const params = {
        Bucket: BUCKET_NAME,
        Prefix: prefix,
        MaxKeys: maxKeys,
        Delimiter: delimiter,
      };

      if (continuationToken) params.ContinuationToken = continuationToken;
      if (startAfter) params.StartAfter = startAfter;

      const result = await s3.listObjectsV2(params).promise();

      return {
        files: result.Contents.map((item) => ({
          key: item.Key,
          size: item.Size,
          lastModified: item.LastModified,
          etag: item.ETag,
          storageClass: item.StorageClass,
          owner: item.Owner,
        })),
        folders: result.CommonPrefixes.map((prefix) => ({
          key: prefix.Prefix,
        })),
        isTruncated: result.IsTruncated,
        nextContinuationToken: result.NextContinuationToken,
        keyCount: result.KeyCount,
      };
    } catch (error) {
      throw new S3Error(
        `Failed to list files: ${error.message}`,
        error.code || "LIST_ERROR",
        error.statusCode || 500
      );
    }
  }

  // Create folder (S3 doesn't have real folders, but we can create empty objects)
  async createFolder(folderPath) {
    try {
      const key = folderPath.endsWith("/") ? folderPath : `${folderPath}/`;

      const params = {
        Bucket: BUCKET_NAME,
        Key: key,
        Body: "",
        ContentType: "application/x-directory",
        Metadata: {
          folderCreatedAt: new Date().toISOString(),
        },
      };

      await s3.putObject(params).promise();
      return true;
    } catch (error) {
      throw new S3Error(
        `Failed to create folder: ${error.message}`,
        error.code || "FOLDER_CREATE_ERROR",
        error.statusCode || 500
      );
    }
  }

  // Delete folder and all its contents with batch processing
  async deleteFolder(folderPath) {
    try {
      const files = await this.listFiles(folderPath);
      const deletedFiles = [];

      if (files.files.length > 0) {
        // Process files in batches of 1000 (S3 limit)
        const batchSize = 1000;
        for (let i = 0; i < files.files.length; i += batchSize) {
          const batch = files.files.slice(i, i + batchSize);
          const deleteParams = {
            Bucket: BUCKET_NAME,
            Delete: {
              Objects: batch.map((file) => ({ Key: file.key })),
            },
          };

          const result = await s3.deleteObjects(deleteParams).promise();
          deletedFiles.push(...result.Deleted);
        }
      }

      return {
        success: true,
        deletedFiles: deletedFiles.length,
        errors: [],
      };
    } catch (error) {
      throw new S3Error(
        `Failed to delete folder: ${error.message}`,
        error.code || "FOLDER_DELETE_ERROR",
        error.statusCode || 500
      );
    }
  }

  // Generate thumbnail for images with Sharp
  async generateThumbnail(key, thumbnailKey, options = {}) {
    try {
      const {
        width = 200,
        height = 200,
        quality = 80,
        format = "jpeg",
        fit = "cover",
      } = options;

      // Download original image
      const imageData = await this.downloadFile(key);
      const imageBuffer = imageData.body;

      // Process image with Sharp
      let processedImage = sharp(imageBuffer)
        .resize(width, height, { fit })
        .jpeg({ quality });

      if (format === "png") {
        processedImage = sharp(imageBuffer)
          .resize(width, height, { fit })
          .png({ quality });
      } else if (format === "webp") {
        processedImage = sharp(imageBuffer)
          .resize(width, height, { fit })
          .webp({ quality });
      }

      const thumbnailBuffer = await processedImage.toBuffer();

      // Upload thumbnail
      const thumbnailFile = {
        buffer: thumbnailBuffer,
        originalname: `thumbnail_${path.basename(key)}`,
        mimetype: `image/${format}`,
        size: thumbnailBuffer.length,
      };

      const result = await this.uploadFile(
        thumbnailFile,
        path.dirname(thumbnailKey),
        {
          contentType: `image/${format}`,
          cacheControl: "public, max-age=31536000",
        }
      );

      return result.key;
    } catch (error) {
      throw new S3Error(
        `Failed to generate thumbnail: ${error.message}`,
        error.code || "THUMBNAIL_ERROR",
        error.statusCode || 500
      );
    }
  }

  // Get bucket statistics with detailed information
  async getBucketStats() {
    try {
      const params = {
        Bucket: BUCKET_NAME,
      };

      const result = await s3.listObjectsV2(params).promise();

      const totalSize = result.Contents.reduce(
        (sum, item) => sum + item.Size,
        0
      );
      const fileCount = result.Contents.length;

      // Group by storage class
      const storageClassStats = result.Contents.reduce((acc, item) => {
        const storageClass = item.StorageClass || "STANDARD";
        acc[storageClass] = (acc[storageClass] || 0) + 1;
        return acc;
      }, {});

      // Group by file type
      const fileTypeStats = result.Contents.reduce((acc, item) => {
        const extension = path.extname(item.Key).toLowerCase();
        acc[extension] = (acc[extension] || 0) + 1;
        return acc;
      }, {});

      return {
        totalSize,
        fileCount,
        bucketName: BUCKET_NAME,
        storageClassStats,
        fileTypeStats,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      throw new S3Error(
        `Failed to get bucket stats: ${error.message}`,
        error.code || "STATS_ERROR",
        error.statusCode || 500
      );
    }
  }

  // Upload file with progress tracking
  async uploadFileWithProgress(file, folder = "uploads", onProgress = null) {
    try {
      const key = `${folder}/${uuidv4()}_${file.originalname}`;

      const params = {
        Bucket: BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ContentDisposition: "inline",
        Metadata: {
          originalName: file.originalname,
          uploadedAt: new Date().toISOString(),
        },
      };

      const upload = s3.upload(params);

      if (onProgress) {
        upload.on("httpUploadProgress", (progress) => {
          const percentage = Math.round(
            (progress.loaded / progress.total) * 100
          );
          onProgress(percentage, progress.loaded, progress.total);
        });
      }

      const result = await upload.promise();

      return {
        key: result.Key,
        url: result.Location,
        bucket: result.Bucket,
        etag: result.ETag,
        versionId: result.VersionId,
      };
    } catch (error) {
      throw new S3Error(
        `S3 upload failed: ${error.message}`,
        error.code || "UPLOAD_ERROR",
        error.statusCode || 500
      );
    }
  }

  // Download file with streaming
  async downloadFileStream(key, options = {}) {
    try {
      const { range } = options;

      const params = {
        Bucket: BUCKET_NAME,
        Key: key,
      };

      if (range) {
        params.Range = range;
      }

      const stream = s3.getObject(params).createReadStream();
      const metadata = await this.getFileMetadata(key);

      return {
        stream,
        metadata,
      };
    } catch (error) {
      throw new S3Error(
        `Failed to create download stream: ${error.message}`,
        error.code || "STREAM_ERROR",
        error.statusCode || 500
      );
    }
  }

  // Batch operations
  async batchUpload(files, folder = "uploads", options = {}) {
    try {
      const results = [];
      const errors = [];

      for (const file of files) {
        try {
          const result = await this.uploadFile(file, folder, options);
          results.push(result);
        } catch (error) {
          errors.push({
            file: file.originalname,
            error: error.message,
          });
        }
      }

      return {
        success: errors.length === 0,
        uploaded: results.length,
        failed: errors.length,
        results,
        errors,
      };
    } catch (error) {
      throw new S3Error(
        `Batch upload failed: ${error.message}`,
        error.code || "BATCH_UPLOAD_ERROR",
        error.statusCode || 500
      );
    }
  }

  // Utility methods
  getFileUrl(key) {
    return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  }

  isValidKey(key) {
    return (
      key && typeof key === "string" && key.length > 0 && key.length <= 1024
    );
  }

  sanitizeKey(key) {
    return key.replace(/[^a-zA-Z0-9\-_./]/g, "_");
  }
}

module.exports = new S3Service();
