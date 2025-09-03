import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import https from "https";
import fs from "fs";

// Import configuration
import { initializeConfig, Environment, Database } from "./config/index.js";

// Import routes
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/user.js";
import wasteRoutes from "./routes/waste.js";
import boothRoutes from "./routes/booth.js";
import rewardRoutes from "./routes/reward.js";
import adminRoutes from "./routes/admin.js";

// Import middleware
import { errorHandler } from "./middleware/errorHandler.js";
import { rateLimiter, clearAllRateLimits } from "./middleware/rateLimiter.js";
import { ensureDbConnection } from "./middleware/dbConnectionGuard.js";

// ES6 module setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  try {
    console.log("🚀 Starting Simhastha 2028 Clean & Green Backend Server...");

    // Initialize configuration and database
    await initializeConfig();

    // Confirm database connection status
    if (Database.isConnected) {
      console.log("✅ Database connection confirmed and ready");
    } else {
      console.log("⚠️  Database not connected, but continuing...");
    }

    // Add a small delay to ensure database connection is fully established
    console.log("⏳ Waiting for database connection to stabilize...");
    await new Promise((resolve) => setTimeout(resolve, 3000)); // Wait 3 seconds

    // Final database readiness check
    if (Database.isReady()) {
      console.log("✅ Database is fully ready for operations");
    } else {
      console.log("⚠️  Database may not be fully ready, but continuing...");
    }

    // Clear any existing rate limits on startup (for development)
    clearAllRateLimits();

    const app = express();
    const config = Environment.getAll();

    // Trust proxy for rate limiting in production
    if (Environment.isProduction()) {
      app.set("trust proxy", 1);
    }

    // CORS middleware
    app.use(cors(config.cors));

    // Body parsing middleware
    app.use(express.json({ limit: "10mb" }));
    app.use(express.urlencoded({ extended: true, limit: "10mb" }));

    // Static file serving
    app.use("/uploads", express.static(path.join(__dirname, "uploads")));

    // Rate limiting middleware
    app.use("/api/", rateLimiter);

    // Health check endpoint
    app.get("/api/health", async (req, res) => {
      const dbHealth = await Database.healthCheck();

      res.json({
        success: true,
        message: "Server is running!",
        timestamp: new Date().toISOString(),
        environment: Environment.get("server.environment"),
        version: Environment.get("app.version"),
        database: dbHealth,
        uptime: process.uptime(),
      });
    });

    // API Routes - Apply database connection guard to prevent operations before connection is ready
    app.use("/api/auth", ensureDbConnection, authRoutes);
    app.use("/api/user", ensureDbConnection, userRoutes);
    app.use("/api/waste", ensureDbConnection, wasteRoutes);
    app.use("/api/booths", ensureDbConnection, boothRoutes);
    app.use("/api/rewards", ensureDbConnection, rewardRoutes);
    app.use("/api/admin", ensureDbConnection, adminRoutes);

    // Global error handler
    app.use(errorHandler);

    // 404 handler for API routes (must be after all API routes)
    app.use("/api", (req, res) => {
      res.status(404).json({
        success: false,
        message: "API endpoint not found",
        path: req.originalUrl,
      });
    });

    // Start server
    const PORT = Environment.get("server.port");
    const HOST = Environment.get("server.host");
    const USE_HTTPS = process.env.HTTPS === "true";

    let server;

    if (USE_HTTPS) {
      // HTTPS Server
      try {
        const privateKey = fs.readFileSync(
          path.join(__dirname, "key.pem"),
          "utf8"
        );
        const certificate = fs.readFileSync(
          path.join(__dirname, "cert.pem"),
          "utf8"
        );
        const credentials = { key: privateKey, cert: certificate };

        server = https.createServer(credentials, app);
        server.listen(PORT, HOST, () => {
          console.log("");
          console.log("✅ HTTPS Server successfully started!");
          console.log(`🌐 Server URL: https://${HOST}:${PORT}`);
          console.log(`📋 Health Check: https://${HOST}:${PORT}/api/health`);
          console.log(`📚 API Base URL: https://${HOST}:${PORT}/api`);
          console.log("");
          console.log("📊 Available endpoints:");
          console.log("   🔐 Auth: /api/auth");
          console.log("   👤 User: /api/user");
          console.log("   🗑️  Waste: /api/waste");
          console.log("   🏢 Booths: /api/booths");
          console.log("   🎁 Rewards: /api/rewards");
          console.log("   ⚙️  Admin: /api/admin");
          console.log("");
        });
      } catch (error) {
        console.error("❌ Failed to start HTTPS server:", error.message);
        console.log("🔄 Falling back to HTTP server...");
        // Fall back to HTTP
        server = app.listen(PORT, HOST, () => {
          console.log("");
          console.log("✅ HTTP Server successfully started! (HTTPS fallback)");
          console.log(`🌐 Server URL: http://${HOST}:${PORT}`);
          console.log(`📋 Health Check: http://${HOST}:${PORT}/api/health`);
          console.log(`📚 API Base URL: http://${HOST}:${PORT}/api`);
          console.log("");
          console.log("📊 Available endpoints:");
          console.log("   🔐 Auth: /api/auth");
          console.log("   👤 User: /api/user");
          console.log("   🗑️  Waste: /api/waste");
          console.log("   🏢 Booths: /api/booths");
          console.log("   🎁 Rewards: /api/rewards");
          console.log("   ⚙️  Admin: /api/admin");
          console.log("");
        });
      }
    } else {
      // HTTP Server (default)
      server = app.listen(PORT, HOST, () => {
        console.log("");
        console.log("✅ HTTP Server successfully started!");
        console.log(`🌐 Server URL: http://${HOST}:${PORT}`);
        console.log(`📋 Health Check: http://${HOST}:${PORT}/api/health`);
        console.log(`📚 API Base URL: http://${HOST}:${PORT}/api`);
        console.log("");
        console.log("📊 Available endpoints:");
        console.log("   🔐 Auth: /api/auth");
        console.log("   👤 User: /api/user");
        console.log("   🗑️  Waste: /api/waste");
        console.log("   🏢 Booths: /api/booths");
        console.log("   🎁 Rewards: /api/rewards");
        console.log("   ⚙️  Admin: /api/admin");
        console.log("");
      });
    }

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);

      server.close(async () => {
        console.log("🔌 HTTP server closed");

        try {
          await Database.disconnect();
          console.log("📦 Database connection closed");
        } catch (error) {
          console.error("❌ Error closing database:", error);
        }

        console.log("👋 Graceful shutdown completed");
        process.exit(0);
      });

      // Force close after 10 seconds
      setTimeout(() => {
        console.error(
          "⚠️  Could not close connections in time, forcefully shutting down"
        );
        process.exit(1);
      }, 10000);
    };

    // Handle graceful shutdown
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));

    // Handle uncaught exceptions
    process.on("uncaughtException", (error) => {
      console.error("❌ Uncaught Exception:", error);
      gracefulShutdown("UNCAUGHT_EXCEPTION");
    });

    process.on("unhandledRejection", (reason, promise) => {
      console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
      gracefulShutdown("UNHANDLED_REJECTION");
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

// Start the server
startServer();
