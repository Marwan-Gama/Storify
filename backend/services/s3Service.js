const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET;

class S3Service {
  // Upload file to S3
  async uploadFile(file, folder = "uploads") {
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

      const result = await s3.upload(params).promise();

      return {
        key: result.Key,
        url: result.Location,
        bucket: result.Bucket,
      };
    } catch (error) {
      throw new Error(`S3 upload failed: ${error.message}`);
    }
  }

  // Download file from S3
  async downloadFile(key) {
    try {
      const params = {
        Bucket: BUCKET_NAME,
        Key: key,
      };

      const result = await s3.getObject(params).promise();

      return {
        body: result.Body,
        contentType: result.ContentType,
        contentLength: result.ContentLength,
        metadata: result.Metadata,
      };
    } catch (error) {
      throw new Error(`S3 download failed: ${error.message}`);
    }
  }

  // Generate presigned URL for file access
  async generatePresignedUrl(key, operation = "getObject", expiresIn = 3600) {
    try {
      const params = {
        Bucket: BUCKET_NAME,
        Key: key,
        Expires: expiresIn,
      };

      const url = await s3.getSignedUrlPromise(operation, params);
      return url;
    } catch (error) {
      throw new Error(`Failed to generate presigned URL: ${error.message}`);
    }
  }

  // Delete file from S3
  async deleteFile(key) {
    try {
      const params = {
        Bucket: BUCKET_NAME,
        Key: key,
      };

      await s3.deleteObject(params).promise();
      return true;
    } catch (error) {
      throw new Error(`S3 delete failed: ${error.message}`);
    }
  }

  // Copy file within S3
  async copyFile(sourceKey, destinationKey) {
    try {
      const params = {
        Bucket: BUCKET_NAME,
        CopySource: `${BUCKET_NAME}/${sourceKey}`,
        Key: destinationKey,
      };

      const result = await s3.copyObject(params).promise();
      return result;
    } catch (error) {
      throw new Error(`S3 copy failed: ${error.message}`);
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
      if (error.code === "NotFound") {
        return false;
      }
      throw error;
    }
  }

  // Get file metadata
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
      };
    } catch (error) {
      throw new Error(`Failed to get file metadata: ${error.message}`);
    }
  }

  // List files in a folder
  async listFiles(prefix = "", maxKeys = 1000) {
    try {
      const params = {
        Bucket: BUCKET_NAME,
        Prefix: prefix,
        MaxKeys: maxKeys,
      };

      const result = await s3.listObjectsV2(params).promise();

      return result.Contents.map((item) => ({
        key: item.Key,
        size: item.Size,
        lastModified: item.LastModified,
      }));
    } catch (error) {
      throw new Error(`Failed to list files: ${error.message}`);
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
      };

      await s3.putObject(params).promise();
      return true;
    } catch (error) {
      throw new Error(`Failed to create folder: ${error.message}`);
    }
  }

  // Delete folder and all its contents
  async deleteFolder(folderPath) {
    try {
      const files = await this.listFiles(folderPath);

      if (files.length > 0) {
        const deleteParams = {
          Bucket: BUCKET_NAME,
          Delete: {
            Objects: files.map((file) => ({ Key: file.key })),
          },
        };

        await s3.deleteObjects(deleteParams).promise();
      }

      return true;
    } catch (error) {
      throw new Error(`Failed to delete folder: ${error.message}`);
    }
  }

  // Generate thumbnail for images (placeholder - would need image processing)
  async generateThumbnail(key, thumbnailKey) {
    try {
      // This is a placeholder - in a real implementation, you'd use Sharp or similar
      // to process the image and create a thumbnail
      const imageData = await this.downloadFile(key);

      // For now, just copy the original file as thumbnail
      await this.copyFile(key, thumbnailKey);

      return thumbnailKey;
    } catch (error) {
      throw new Error(`Failed to generate thumbnail: ${error.message}`);
    }
  }

  // Get bucket statistics
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

      return {
        totalSize,
        fileCount,
        bucketName: BUCKET_NAME,
      };
    } catch (error) {
      throw new Error(`Failed to get bucket stats: ${error.message}`);
    }
  }
}

module.exports = new S3Service();
