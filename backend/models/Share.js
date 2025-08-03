module.exports = (sequelize, DataTypes) => {
  const Share = sequelize.define(
    "Share",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      itemId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      itemType: {
        type: DataTypes.ENUM("file", "folder"),
        allowNull: false,
      },
      ownerId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      sharedWithId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
      },
      sharedWithEmail: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          isEmail: true,
        },
      },
      permission: {
        type: DataTypes.ENUM("view", "edit", "download"),
        defaultValue: "view",
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
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      accessCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      lastAccessed: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      allowDownload: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      allowEdit: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      notifyOnAccess: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: "shares",
      timestamps: true,
      indexes: [
        {
          fields: ["itemId", "itemType"],
        },
        {
          fields: ["ownerId"],
        },
        {
          fields: ["sharedWithId"],
        },
        {
          fields: ["publicLink"],
        },
        {
          fields: ["expiresAt"],
        },
      ],
    }
  );

  Share.associate = function(models) {
    Share.belongsTo(models.User, {
      foreignKey: "ownerId",
      as: "owner",
    });
    Share.belongsTo(models.User, {
      foreignKey: "sharedWithId",
      as: "sharedWith",
    });
    Share.belongsTo(models.File, {
      foreignKey: "itemId",
      as: "file",
      scope: { itemType: "file" },
    });
    Share.belongsTo(models.Folder, {
      foreignKey: "itemId",
      as: "folder",
      scope: { itemType: "folder" },
    });
  };

  Share.prototype.isExpired = function() {
    if (!this.expiresAt) return false;
    return new Date() > this.expiresAt;
  };

  Share.prototype.canAccess = function() {
    return this.isActive && !this.isExpired();
  };

  Share.prototype.hasPermission = function(requiredPermission) {
    if (!this.canAccess()) return false;

    const permissions = {
      view: 1,
      edit: 2,
      download: 3,
    };

    return permissions[this.permission] >= permissions[requiredPermission];
  };

  Share.prototype.incrementAccess = function() {
    this.accessCount += 1;
    this.lastAccessed = new Date();
    return this.save();
  };

  return Share;
};
