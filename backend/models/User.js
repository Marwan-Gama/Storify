const bcrypt = require("bcryptjs");

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        comment: "Unique user identifier",
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          len: [2, 100],
          notEmpty: true,
        },
        comment: "User's full name",
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
          notEmpty: true,
        },
        comment: "User's email address (unique)",
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          len: [6, 255],
          notEmpty: true,
        },
        comment: "Hashed password",
      },
      role: {
        type: DataTypes.ENUM("user", "admin"),
        defaultValue: "user",
        validate: {
          isIn: [["user", "admin"]],
        },
        comment: "User role (user or admin)",
      },
      tier: {
        type: DataTypes.ENUM("free", "premium"),
        defaultValue: "free",
        validate: {
          isIn: [["free", "premium"]],
        },
        comment: "User subscription tier",
      },
      isEmailVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: "Whether email has been verified",
      },
      emailVerificationToken: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: "Token for email verification",
      },
      emailVerificationExpires: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: "Expiration time for email verification token",
      },
      passwordResetToken: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: "Token for password reset",
      },
      passwordResetExpires: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: "Expiration time for password reset token",
      },
      lastLogin: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: "Last login timestamp",
      },
      storageUsed: {
        type: DataTypes.BIGINT,
        defaultValue: 0,
        validate: {
          min: 0,
        },
        comment: "Storage used in bytes",
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: "Whether user account is active",
      },
    },
    {
      tableName: "users",
      timestamps: true,
      hooks: {
        beforeCreate: async (user) => {
          if (user.password) {
            user.password = await bcrypt.hash(user.password, 12);
          }
        },
        beforeUpdate: async (user) => {
          if (user.changed("password")) {
            user.password = await bcrypt.hash(user.password, 12);
          }
        },
      },
      indexes: [
        {
          unique: true,
          fields: ["email"],
          name: "users_email_unique",
        },
        {
          fields: ["role"],
          name: "users_role_index",
        },
        {
          fields: ["tier"],
          name: "users_tier_index",
        },
        {
          fields: ["isActive"],
          name: "users_is_active_index",
        },
        {
          fields: ["createdAt"],
          name: "users_created_at_index",
        },
        {
          fields: ["lastLogin"],
          name: "users_last_login_index",
        },
      ],
      comment: "User accounts table",
    }
  );

  User.associate = function(models) {
    User.hasMany(models.File, {
      foreignKey: "userId",
      as: "files",
      onDelete: "CASCADE",
    });
    User.hasMany(models.Folder, {
      foreignKey: "userId",
      as: "folders",
      onDelete: "CASCADE",
    });
    User.hasMany(models.Share, {
      foreignKey: "ownerId",
      as: "shares",
      onDelete: "CASCADE",
    });
    User.hasMany(models.Share, {
      foreignKey: "sharedWithId",
      as: "sharedWithMe",
      onDelete: "SET NULL",
    });
  };

  User.prototype.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
  };

  User.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    delete values.password;
    delete values.emailVerificationToken;
    delete values.emailVerificationExpires;
    delete values.passwordResetToken;
    delete values.passwordResetExpires;
    return values;
  };

  return User;
};
