module.exports = (sequelize, DataTypes) => {
  const File = sequelize.define(
    "File",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: [1, 255],
        },
      },
      originalName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      mimeType: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      size: {
        type: DataTypes.BIGINT,
        allowNull: false,
        validate: {
          min: 0,
        },
      },
      extension: {
        type: DataTypes.STRING(10),
        allowNull: true,
      },
      s3Key: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      s3Url: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      thumbnailUrl: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      folderId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "folders",
          key: "id",
        },
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      isDeleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      isPublic: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      publicLink: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
      downloadCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      lastAccessed: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      tags: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      metadata: {
        type: DataTypes.JSON,
        allowNull: true,
      },
    },
    {
      tableName: "files",
      timestamps: true,
      paranoid: true,
      indexes: [
        {
          fields: ["userId", "folderId"],
        },
        {
          fields: ["mimeType"],
        },
        {
          fields: ["publicLink"],
        },
        {
          fields: ["s3Key"],
        },
      ],
    }
  );

  File.associate = function(models) {
    File.belongsTo(models.User, {
      foreignKey: "userId",
      as: "user",
    });
    File.belongsTo(models.Folder, {
      foreignKey: "folderId",
      as: "folder",
    });
    File.hasMany(models.Share, {
      foreignKey: "itemId",
      as: "shares",
      scope: { itemType: "file" },
    });
  };

  File.prototype.getFileType = function() {
    const mimeType = this.mimeType;
    if (mimeType.startsWith("image/")) return "image";
    if (mimeType.startsWith("video/")) return "video";
    if (mimeType.startsWith("audio/")) return "audio";
    if (mimeType === "application/pdf") return "pdf";
    if (mimeType.includes("document") || mimeType.includes("word"))
      return "document";
    if (mimeType.includes("spreadsheet") || mimeType.includes("excel"))
      return "spreadsheet";
    if (mimeType.includes("presentation") || mimeType.includes("powerpoint"))
      return "presentation";
    if (mimeType.startsWith("text/")) return "text";
    return "other";
  };

  File.prototype.getFormattedSize = function() {
    const bytes = this.size;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    if (bytes === 0) return "0 Bytes";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
  };

  File.prototype.isPreviewable = function() {
    const fileType = this.getFileType();
    return ["image", "video", "audio", "pdf", "text"].includes(fileType);
  };

  return File;
};
