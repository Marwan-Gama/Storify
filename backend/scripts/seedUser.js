require("dotenv").config();
const { Sequelize } = require("sequelize");
const bcrypt = require("bcryptjs");

// Database configuration
const config = require("../config/database.js");

async function seedUser() {
  let sequelize;

  try {
    console.log("Starting user seeding with MySQL...");

    // Use development configuration
    const dbConfig = config.development;

    console.log("Database configuration:", {
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.database,
      username: dbConfig.username,
      password: dbConfig.password ? "***" : "empty",
    });

    sequelize = new Sequelize(
      dbConfig.database,
      dbConfig.username,
      dbConfig.password,
      {
        host: dbConfig.host,
        port: dbConfig.port,
        dialect: dbConfig.dialect,
        logging: dbConfig.logging,
        pool: dbConfig.pool,
      }
    );

    // Test database connection
    await sequelize.authenticate();
    console.log("✅ MySQL database connection established successfully.");

    // Import models
    const { User } = require("../models");

    // Sync models with database (create tables if they don't exist)
    await sequelize.sync({ force: false });
    console.log("✅ Database models synchronized.");

    // Check if user already exists
    const existingUser = await User.findOne({
      where: { email: "marwan@gmail.com" },
    });

    if (existingUser) {
      console.log("ℹ️  User already exists:", existingUser.toJSON());
      return;
    }

    // Create new user
    const hashedPassword = await bcrypt.hash("Password123", 12);

    const user = await User.create({
      name: "Marwan",
      email: "marwan@gmail.com",
      password: hashedPassword,
      role: "user",
      tier: "free",
      isEmailVerified: true,
      isActive: true,
      storageUsed: 0,
    });

    console.log("✅ User created successfully:", user.toJSON());
    console.log("\n🎉 Login credentials:");
    console.log("📧 Email: marwan@gmail.com");
    console.log("🔑 Password: Password123");
    console.log("\nYou can now login and see 'Marwan' as your name!");
  } catch (error) {
    console.error("❌ Error seeding user:", error.message);

    if (error.name === "ConnectionError" || error.code === "ER_BAD_DB_ERROR") {
      console.log("\n🔧 MySQL Setup Instructions:");
      console.log("1. Make sure MySQL is installed and running");
      console.log("2. Create a database named 'cloud_storage'");
      console.log("3. Create a .env file in the backend directory with:");
      console.log("   DB_HOST=localhost");
      console.log("   DB_USER=root");
      console.log("   DB_PASSWORD=your_mysql_password");
      console.log("   DB_NAME=cloud_storage");
      console.log("   DB_PORT=3306");
      console.log("4. Run: npm run seed:user");
    } else if (error.name === "SequelizeConnectionError") {
      console.log("\n🔧 Database Connection Issues:");
      console.log("1. Check if MySQL is running");
      console.log("2. Verify database credentials in .env file");
      console.log("3. Make sure the 'cloud_storage' database exists");
    }
  } finally {
    if (sequelize) {
      await sequelize.close();
      console.log("🔒 Database connection closed.");
    }
  }
}

// Run the seeder
seedUser()
  .then(() => {
    console.log("✅ Seeding completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  });
