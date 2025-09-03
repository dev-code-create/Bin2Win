import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

class Database {
  constructor() {
    this.connection = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      // MongoDB connection options - Start with buffering enabled to prevent connection errors
      const options = {
        maxPoolSize: 10, // Maintain up to 10 socket connections
        serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
        socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        family: 4, // Use IPv4, skip trying IPv6
        bufferCommands: true, // Enable buffering during connection to prevent errors
      };

      // Get MongoDB URI from environment variables
      const mongoURI =
        process.env.MONGODB_URI ||
        process.env.MONGO_URI ||
        "mongodb+srv://ayushkankale04:jA2WoaxvhyR7CQZJ@chat-app-data.jrsjv.mongodb.net/";

      console.log("🔄 Connecting to MongoDB...");
      console.log("📍 MongoDB URI:", mongoURI.replace(/\/\/.*@/, "//***:***@")); // Hide credentials in logs

      // Set up connection event listeners before connecting
      this.setupConnectionListeners();

      this.connection = await mongoose.connect(mongoURI, options);

      // Wait for the connection to be fully ready
      await this.waitForConnectionReady();

      // Now that connection is established, disable buffering for better error handling
      try {
        await mongoose.connection.db.admin().ping();
        console.log("🔧 Disabling command buffering for better error handling");
        mongoose.set("bufferCommands", false);
      } catch (err) {
        console.warn("⚠️  Could not disable command buffering:", err.message);
      }

      // Double-check that the connection is truly ready
      if (mongoose.connection.readyState !== 1) {
        throw new Error(
          `Database connection not in ready state after connection. State: ${mongoose.connection.readyState}`
        );
      }

      this.isConnected = true;

      console.log("✅ MongoDB connected successfully");
      console.log("📊 Database:", this.connection.connection.name);
      console.log("🏠 Host:", this.connection.connection.host);
      console.log("🔌 Port:", this.connection.connection.port);

      // Handle connection events
      mongoose.connection.on("connected", () => {
        console.log("📶 MongoDB connection established");
        this.isConnected = true;
      });

      mongoose.connection.on("disconnected", () => {
        console.log("📵 MongoDB disconnected");
        this.isConnected = false;
      });

      mongoose.connection.on("error", (error) => {
        console.error("❌ MongoDB connection error:", error);
        this.isConnected = false;
      });

      // Handle process termination
      process.on("SIGINT", async () => {
        await this.disconnect();
        process.exit(0);
      });

      return this.connection;
    } catch (error) {
      console.error("❌ MongoDB connection failed:", error.message);

      // Provide helpful error messages
      if (error.message.includes("ECONNREFUSED")) {
        console.log(
          "💡 Tip: Make sure MongoDB is running locally or check your connection string"
        );
      } else if (error.message.includes("authentication failed")) {
        console.log("💡 Tip: Check your MongoDB username and password");
      } else if (error.message.includes("network timeout")) {
        console.log(
          "💡 Tip: Check your network connection or MongoDB Atlas whitelist"
        );
      }

      // In development, continue without database
      if (process.env.NODE_ENV === "development") {
        console.log(
          "⚠️  Running in development mode without database connection"
        );
        return null;
      }

      throw error;
    }
  }

  async waitForConnectionReady() {
    return new Promise((resolve, reject) => {
      const maxAttempts = 60; // Maximum 60 seconds
      let attempts = 0;

      const checkConnection = () => {
        attempts++;
        const readyState = mongoose.connection.readyState;

        console.log(
          `🔍 Connection check ${attempts}/${maxAttempts} - State: ${readyState} (${this.getReadyStateDescription(
            readyState
          )})`
        );

        // readyState: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
        if (readyState === 1) {
          console.log("✅ MongoDB connection is ready for operations");
          resolve();
        } else if (attempts >= maxAttempts) {
          reject(
            new Error(
              `Database connection timeout - connection not ready after ${maxAttempts} seconds. Final state: ${readyState}`
            )
          );
        } else {
          setTimeout(checkConnection, 1000); // Check every second
        }
      };

      // Start checking immediately
      checkConnection();
    });
  }

  // Helper method to describe connection states
  getReadyStateDescription(readyState) {
    const states = {
      0: "disconnected",
      1: "connected",
      2: "connecting",
      3: "disconnecting",
    };
    return states[readyState] || "unknown";
  }

  async disconnect() {
    try {
      if (this.isConnected && mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
        console.log("🔌 MongoDB connection closed");
        this.isConnected = false;
      }
    } catch (error) {
      console.error("❌ Error closing MongoDB connection:", error);
    }
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name,
    };
  }

  // Check if database is ready for operations
  isReady() {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  // Health check for the database
  async healthCheck() {
    try {
      if (!this.isReady()) {
        return {
          status: "disconnected",
          message: "Database not ready for operations",
          readyState: mongoose.connection.readyState,
          isConnected: this.isConnected,
        };
      }

      // Simple ping to check if database is responsive
      await mongoose.connection.db.admin().ping();

      return {
        status: "healthy",
        message: "Database connection is healthy",
        details: this.getConnectionStatus(),
      };
    } catch (error) {
      return {
        status: "unhealthy",
        message: "Database health check failed",
        error: error.message,
        readyState: mongoose.connection.readyState,
        isConnected: this.isConnected,
      };
    }
  }

  // Set up connection event listeners
  setupConnectionListeners() {
    // Handle connection events
    mongoose.connection.on("connected", () => {
      console.log("📶 MongoDB connection established");
      this.isConnected = true;
    });

    mongoose.connection.on("disconnected", () => {
      console.log("📵 MongoDB disconnected");
      this.isConnected = false;
    });

    mongoose.connection.on("error", (error) => {
      console.error("❌ MongoDB connection error:", error);
      this.isConnected = false;
    });

    // Handle process termination
    process.on("SIGINT", async () => {
      await this.disconnect();
      process.exit(0);
    });
  }
}

// Export singleton instance
export default new Database();
