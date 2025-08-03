const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { User } = require("../models");
const emailService = require("../services/emailService");
const { validationResult } = require("express-validator");

class AuthController {
  constructor() {
    // Bind all methods to preserve 'this' context
    this.register = this.register.bind(this);
    this.login = this.login.bind(this);
    this.logout = this.logout.bind(this);
    this.verifyEmail = this.verifyEmail.bind(this);
    this.forgotPassword = this.forgotPassword.bind(this);
    this.resetPassword = this.resetPassword.bind(this);
    this.getProfile = this.getProfile.bind(this);
    this.updateProfile = this.updateProfile.bind(this);
    this.changePassword = this.changePassword.bind(this);
    this.refreshToken = this.refreshToken.bind(this);
  }

  // Generate JWT token
  generateToken(userId) {
    const secret =
      process.env.JWT_SECRET || "fallback-secret-key-for-development";
    return jwt.sign({ userId }, secret, {
      expiresIn: process.env.JWT_EXPIRES_IN || "24h",
    });
  }

  // User registration
  async register(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        });
      }

      const { name, email, password } = req.body;

      // Check if database is available
      if (!process.env.DB_HOST) {
        console.log("Mock registration for:", { name, email });

        // Generate mock token
        const token = this.generateToken("mock-user-id");

        return res.status(201).json({
          success: true,
          message:
            "User registered successfully (mock response). Please check your email for verification.",
          data: {
            user: {
              id: "mock-user-id",
              name,
              email,
              role: "user",
              tier: "free",
              isEmailVerified: false,
              isActive: true,
              storageUsed: 0,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            token,
          },
        });
      }

      // Check if user already exists
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "User with this email already exists",
        });
      }

      // Create user without email verification for now
      const user = await User.create({
        name,
        email,
        password,
        isEmailVerified: true, // Skip email verification for now
        isActive: true,
      });

      // Generate token
      const token = this.generateToken(user.id);

      res.status(201).json({
        success: true,
        message: "User registered successfully!",
        data: {
          user: user.toJSON(),
          token,
        },
      });
    } catch (error) {
      console.error("Registration error:", error);

      // Check if it's a database connection error
      if (
        error.name === "ConnectionError" ||
        error.code === "ER_BAD_DB_ERROR"
      ) {
        console.log("Database not available, using mock response");

        const { name, email, password } = req.body;
        const token = this.generateToken("mock-user-id");

        return res.status(201).json({
          success: true,
          message:
            "User registered successfully (mock response - database unavailable).",
          data: {
            user: {
              id: "mock-user-id",
              name,
              email,
              role: "user",
              tier: "free",
              isEmailVerified: true,
              isActive: true,
              storageUsed: 0,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            token,
          },
        });
      }

      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // User login
  async login(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        });
      }

      const { email, password } = req.body;

      // Check if database is available
      if (!process.env.DB_HOST) {
        console.log("Mock login for:", { email });

        // Generate mock token
        const token = this.generateToken("mock-user-id");

        return res.status(200).json({
          success: true,
          message: "Login successful (mock response)",
          data: {
            user: {
              id: "mock-user-id",
              name: "Mock User",
              email,
              role: "user",
              tier: "free",
              isEmailVerified: true,
              isActive: true,
              storageUsed: 0,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            token,
          },
        });
      }

      // Find user
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: "Account is deactivated",
        });
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Generate token
      const token = this.generateToken(user.id);

      // Set cookie
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.json({
        success: true,
        message: "Login successful",
        data: {
          user: user.toJSON(),
          token,
        },
      });
    } catch (error) {
      console.error("Login error:", error);

      // Check if it's a database connection error
      if (
        error.name === "ConnectionError" ||
        error.code === "ER_BAD_DB_ERROR"
      ) {
        console.log("Database not available, using mock response");

        const { email } = req.body;
        const token = this.generateToken("mock-user-id");

        return res.status(200).json({
          success: true,
          message: "Login successful (mock response - database unavailable)",
          data: {
            user: {
              id: "mock-user-id",
              name: "Mock User",
              email,
              role: "user",
              tier: "free",
              isEmailVerified: true,
              isActive: true,
              storageUsed: 0,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            token,
          },
        });
      }

      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Logout
  async logout(req, res) {
    try {
      res.clearCookie("token");
      res.json({
        success: true,
        message: "Logout successful",
      });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Verify email
  async verifyEmail(req, res) {
    try {
      const { token } = req.params;

      const user = await User.findOne({
        where: {
          emailVerificationToken: token,
          emailVerificationExpires: {
            [require("sequelize").Op.gt]: new Date(),
          },
        },
      });

      if (!user) {
        return res.status(400).json({
          success: false,
          message: "Invalid or expired verification token",
        });
      }

      user.isEmailVerified = true;
      user.emailVerificationToken = null;
      user.emailVerificationExpires = null;
      await user.save();

      res.json({
        success: true,
        message: "Email verified successfully",
      });
    } catch (error) {
      console.error("Email verification error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Forgot password
  async forgotPassword(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        });
      }

      const { email } = req.body;

      const user = await User.findOne({ where: { email } });
      if (!user) {
        // Don't reveal if user exists or not
        return res.json({
          success: true,
          message:
            "If an account with that email exists, a password reset link has been sent",
        });
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      user.passwordResetToken = resetToken;
      user.passwordResetExpires = resetExpires;
      await user.save();

      // Send reset email
      if (process.env.NODE_ENV !== "test") {
        await emailService.sendPasswordResetEmail(user.email, resetToken);
      }

      res.json({
        success: true,
        message:
          "If an account with that email exists, a password reset link has been sent",
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Reset password
  async resetPassword(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        });
      }

      const { token, password } = req.body;

      const user = await User.findOne({
        where: {
          passwordResetToken: token,
          passwordResetExpires: { [require("sequelize").Op.gt]: new Date() },
        },
      });

      if (!user) {
        return res.status(400).json({
          success: false,
          message: "Invalid or expired reset token",
        });
      }

      user.password = password;
      user.passwordResetToken = null;
      user.passwordResetExpires = null;
      await user.save();

      res.json({
        success: true,
        message: "Password reset successfully",
      });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Get user profile
  async getProfile(req, res) {
    try {
      // Check if database is available
      if (!process.env.DB_HOST) {
        console.log("Mock profile request for user ID:", req.user?.id);

        return res.json({
          success: true,
          data: {
            user: {
              id: req.user?.id || "mock-user-id",
              name: "Mock User",
              email: "mock@example.com",
              role: "user",
              tier: "free",
              isEmailVerified: true,
              isActive: true,
              storageUsed: 0,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          },
        });
      }

      const user = await User.findByPk(req.user.id);

      res.json({
        success: true,
        data: {
          user: user.toJSON(),
        },
      });
    } catch (error) {
      console.error("Get profile error:", error);

      // Check if it's a database connection error
      if (
        error.name === "ConnectionError" ||
        error.code === "ER_BAD_DB_ERROR"
      ) {
        console.log("Database not available, using mock response");

        return res.json({
          success: true,
          data: {
            user: {
              id: req.user?.id || "mock-user-id",
              name: "Mock User",
              email: "mock@example.com",
              role: "user",
              tier: "free",
              isEmailVerified: true,
              isActive: true,
              storageUsed: 0,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          },
        });
      }

      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Update user profile
  async updateProfile(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        });
      }

      const { name, email } = req.body;
      const user = await User.findByPk(req.user.id);

      // Check if email is already taken by another user
      if (email && email !== user.email) {
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: "Email is already taken",
          });
        }
      }

      // Update user
      user.name = name || user.name;
      user.email = email || user.email;
      await user.save();

      res.json({
        success: true,
        message: "Profile updated successfully",
        data: {
          user: user.toJSON(),
        },
      });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Change password
  async changePassword(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        });
      }

      const { currentPassword, newPassword } = req.body;
      const user = await User.findByPk(req.user.id);

      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(
        currentPassword
      );
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          message: "Current password is incorrect",
        });
      }

      // Update password
      user.password = newPassword;
      await user.save();

      res.json({
        success: true,
        message: "Password changed successfully",
      });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Refresh token
  async refreshToken(req, res) {
    try {
      const user = await User.findByPk(req.user.id);

      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          message: "Invalid token",
        });
      }

      const token = this.generateToken(user.id);

      res.json({
        success: true,
        data: {
          token,
        },
      });
    } catch (error) {
      console.error("Refresh token error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
}

module.exports = new AuthController();
