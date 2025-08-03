module.exports = (sequelize, DataTypes) => {
  const Folder = sequelize.define(
    "Folder",
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
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      path: {
        type: DataTypes.STRING(500),
        allowNull: false,
      },
      parentId: {
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
      color: {
        type: DataTypes.STRING(7),
        allowNull: true,
        validate: {
          is: /^#[0-9A-F]{6}$/i,
        },
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
    },
    {
      tableName: "folders",
      timestamps: true,
      paranoid: true,
      indexes: [
        {
          fields: ["userId", "parentId"],
        },
        {
          fields: ["publicLink"],
        },
      ],
    }
  );

  Folder.associate = function(models) {
    Folder.belongsTo(models.User, {
      foreignKey: "userId",
      as: "user",
    });
    Folder.belongsTo(models.Folder, {
      foreignKey: "parentId",
      as: "parent",
    });
    Folder.hasMany(models.Folder, {
      foreignKey: "parentId",
      as: "children",
    });
    Folder.hasMany(models.File, {
      foreignKey: "folderId",
      as: "files",
    });
    Folder.hasMany(models.Share, {
      foreignKey: "itemId",
      as: "shares",
      scope: { itemType: "folder" },
    });
  };

  Folder.prototype.getFullPath = function() {
    return this.path;
  };

  Folder.prototype.isRoot = function() {
    return !this.parentId;
  };

  return Folder;
};
