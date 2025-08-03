const jwt = require("jsonwebtoken");
const { User } = require("../models");

const auth = async (req, res, next) => {
  try {
    const token =
      req.header("Authorization")?.replace("Bearer ", "") || req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    const secret =
      process.env.JWT_SECRET || "fallback-secret-key-for-development";
    const decoded = jwt.verify(token, secret);

    // Check if database is available
    if (!process.env.DB_HOST) {
      req.user = {
        id: decoded.userId,
        name: "Mock User",
        email: "mock@example.com",
        role: "user",
        tier: "free",
        isEmailVerified: true,
        isActive: true,
        storageUsed: 0,
        toJSON: function() {
          return {
            id: this.id,
            name: this.name,
            email: this.email,
            role: this.role,
            tier: this.tier,
            isEmailVerified: this.isEmailVerified,
            isActive: this.isActive,
            storageUsed: this.storageUsed,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        },
      };
      req.token = token;
      return next();
    }

    const user = await User.findByPk(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Invalid token or user not found.",
      });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token.",
      });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

const adminAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {
      if (req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Access denied. Admin privileges required.",
        });
      }
      next();
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const token =
      req.header("Authorization")?.replace("Bearer ", "") || req.cookies?.token;

    if (token) {
      const secret =
        process.env.JWT_SECRET || "fallback-secret-key-for-development";
      const decoded = jwt.verify(token, secret);

      // Check if database is available
      if (!process.env.DB_HOST) {
        req.user = {
          id: decoded.userId,
          name: "Mock User",
          email: "mock@example.com",
          role: "user",
          tier: "free",
          isEmailVerified: true,
          isActive: true,
          storageUsed: 0,
          toJSON: function() {
            return {
              id: this.id,
              name: this.name,
              email: this.email,
              role: this.role,
              tier: this.tier,
              isEmailVerified: this.isEmailVerified,
              isActive: this.isActive,
              storageUsed: this.storageUsed,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
          },
        };
        req.token = token;
        return next();
      }

      const user = await User.findByPk(decoded.userId);

      if (user && user.isActive) {
        req.user = user;
        req.token = token;
      }
    }

    next();
  } catch (error) {
    // Continue without authentication for optional routes
    next();
  }
};

module.exports = {
  auth,
  adminAuth,
  optionalAuth,
};
