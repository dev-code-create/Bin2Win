import { AppError } from "./errorHandler.js";

// Simple in-memory rate limiter (for production, use Redis)
class MemoryStore {
  constructor() {
    this.hits = new Map();
    this.resetTime = new Map();
  }

  incr(key, windowMs) {
    const now = Date.now();
    const resetTime = this.resetTime.get(key);

    if (!resetTime || now > resetTime) {
      this.hits.set(key, 1);
      this.resetTime.set(key, now + windowMs);
      return { totalHits: 1, timeToReset: windowMs };
    }

    const totalHits = (this.hits.get(key) || 0) + 1;
    this.hits.set(key, totalHits);

    return {
      totalHits,
      timeToReset: resetTime - now,
    };
  }

  resetAll() {
    this.hits.clear();
    this.resetTime.clear();
  }
}

const store = new MemoryStore();

// Create rate limiter middleware
export const createRateLimiter = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // limit each IP to 100 requests per windowMs
    message = "Too many requests from this IP, please try again later.",
    standardHeaders = true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders = false, // Disable the `X-RateLimit-*` headers
    keyGenerator = (req) => req.ip,
    skip = () => false,
    onLimitReached = null,
  } = options;

  return (req, res, next) => {
    if (skip(req)) {
      return next();
    }

    const key = keyGenerator(req);
    const { totalHits, timeToReset } = store.incr(key, windowMs);

    if (standardHeaders) {
      res.set("RateLimit-Limit", max);
      res.set("RateLimit-Remaining", Math.max(0, max - totalHits));
      res.set("RateLimit-Reset", new Date(Date.now() + timeToReset));
    }

    if (legacyHeaders) {
      res.set("X-RateLimit-Limit", max);
      res.set("X-RateLimit-Remaining", Math.max(0, max - totalHits));
      res.set(
        "X-RateLimit-Reset",
        Math.ceil((Date.now() + timeToReset) / 1000)
      );
    }

    if (totalHits > max) {
      if (onLimitReached) {
        onLimitReached(req, res);
      }

      return res.status(429).json({
        success: false,
        message,
        retryAfter: Math.ceil(timeToReset / 1000),
      });
    }

    next();
  };
};

// General API rate limiter
export const rateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again after 15 minutes.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiter for authentication endpoints
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message:
    "Too many authentication attempts from this IP, please try again after 15 minutes.",
  keyGenerator: (req) => `auth:${req.ip}`,
  onLimitReached: (req, res) => {
    console.log(
      `Rate limit exceeded for auth endpoint: ${
        req.ip
      } at ${new Date().toISOString()}`
    );
  },
});

// Rate limiter for OTP requests
export const otpRateLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // limit each phone number to 3 OTP requests per 5 minutes
  message:
    "Too many OTP requests for this phone number, please try again after 5 minutes.",
  keyGenerator: (req) => `otp:${req.body.phoneNumber || req.ip}`,
  onLimitReached: (req, res) => {
    console.log(
      `OTP rate limit exceeded: ${
        req.body.phoneNumber || req.ip
      } at ${new Date().toISOString()}`
    );
  },
});

// Rate limiter for waste submission
export const submissionRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // limit each user to 5 submissions per minute
  message:
    "Too many waste submissions, please wait a moment before submitting again.",
  keyGenerator: (req) => `submission:${req.user?.id || req.ip}`,
  skip: (req) => !req.user, // Skip if user is not authenticated
});

// Rate limiter for reward redemption
export const redemptionRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 3, // limit each user to 3 redemptions per minute
  message:
    "Too many redemption attempts, please wait a moment before trying again.",
  keyGenerator: (req) => `redemption:${req.user?.id || req.ip}`,
  skip: (req) => !req.user, // Skip if user is not authenticated
});

// Rate limiter for admin operations
export const adminRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // limit each admin to 30 requests per minute
  message: "Too many admin requests, please wait a moment.",
  keyGenerator: (req) => `admin:${req.admin?.id || req.ip}`,
  skip: (req) => !req.admin, // Skip if admin is not authenticated
});

// Rate limiter for file uploads
export const uploadRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each user to 10 file uploads per minute
  message: "Too many file uploads, please wait a moment.",
  keyGenerator: (req) => `upload:${req.user?.id || req.admin?.id || req.ip}`,
});

// Rate limiter for search operations
export const searchRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // limit each user to 20 searches per minute
  message: "Too many search requests, please wait a moment.",
  keyGenerator: (req) => `search:${req.user?.id || req.admin?.id || req.ip}`,
});

// Dynamic rate limiter based on user type
export const dynamicRateLimiter = (req, res, next) => {
  let maxRequests = 100; // Default for anonymous users
  let windowMs = 15 * 60 * 1000; // 15 minutes

  if (req.user) {
    // Authenticated users get higher limits
    maxRequests = 200;

    // Premium users or high-rank users get even higher limits
    if (
      req.user.stats?.rank === "Diamond" ||
      req.user.stats?.rank === "Platinum"
    ) {
      maxRequests = 300;
    }
  } else if (req.admin) {
    // Admins get the highest limits
    maxRequests = 500;
    windowMs = 10 * 60 * 1000; // 10 minutes
  }

  const limiter = createRateLimiter({
    windowMs,
    max: maxRequests,
    message: `Too many requests. Limit: ${maxRequests} per ${
      windowMs / 60000
    } minutes.`,
    keyGenerator: (req) => {
      if (req.user) return `user:${req.user.id}`;
      if (req.admin) return `admin:${req.admin.id}`;
      return `ip:${req.ip}`;
    },
  });

  limiter(req, res, next);
};

// Clean up old entries (call this periodically)
export const cleanupRateLimit = () => {
  store.resetAll();
  console.log("Rate limit store cleaned up");
};

// Clear all rate limits immediately (useful for development)
export const clearAllRateLimits = () => {
  store.resetAll();
  console.log("All rate limits cleared");
};

// Set up periodic cleanup (every hour)
setInterval(cleanupRateLimit, 60 * 60 * 1000);

export default {
  createRateLimiter,
  rateLimiter,
  authRateLimiter,
  otpRateLimiter,
  submissionRateLimiter,
  redemptionRateLimiter,
  adminRateLimiter,
  uploadRateLimiter,
  searchRateLimiter,
  dynamicRateLimiter,
  cleanupRateLimit,
};
