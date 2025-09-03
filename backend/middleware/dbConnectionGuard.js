import { Database } from "../config/index.js";

// Middleware to ensure database connection is ready
export const ensureDbConnection = (req, res, next) => {
  const status = Database.getConnectionStatus();
  const isReady = Database.isReady();

  console.log(`🔍 Database connection check for ${req.method} ${req.path}:`, {
    isConnected: status.isConnected,
    readyState: status.readyState,
    isReady: isReady,
    host: status.host,
    port: status.port,
  });

  if (!isReady) {
    console.warn(`⚠️  Database not ready for ${req.method} ${req.path}:`, {
      isConnected: status.isConnected,
      readyState: status.readyState,
      isReady: isReady,
    });

    // If the connection is still connecting, give it a moment
    if (status.readyState === 2) {
      console.log("⏳ Database is still connecting, waiting a moment...");
      return setTimeout(() => {
        // Retry the check
        if (Database.isReady()) {
          console.log("✅ Database is now ready, proceeding with request");
          next();
        } else {
          res.status(503).json({
            success: false,
            message:
              "Database connection is still establishing. Please try again in a moment.",
            error: "DATABASE_CONNECTING",
            details: {
              isConnected: status.isConnected,
              readyState: status.readyState,
              readyStateDescription: getReadyStateDescription(
                status.readyState
              ),
            },
          });
        }
      }, 2000); // Wait 2 seconds before retrying
    }

    return res.status(503).json({
      success: false,
      message: "Database connection not ready. Please try again in a moment.",
      error: "DATABASE_NOT_READY",
      details: {
        isConnected: status.isConnected,
        readyState: status.readyState,
        readyStateDescription: getReadyStateDescription(status.readyState),
      },
    });
  }

  console.log(`✅ Database ready for ${req.method} ${req.path}`);
  next();
};

// Middleware to check database connection status
export const checkDbStatus = (req, res, next) => {
  const status = Database.getConnectionStatus();

  if (status.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: "Database connection is not in ready state",
      status: status,
      readyStateDescription: getReadyStateDescription(status.readyState),
    });
  }

  next();
};

// Helper function to describe connection states
function getReadyStateDescription(readyState) {
  const states = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };
  return states[readyState] || "unknown";
}
