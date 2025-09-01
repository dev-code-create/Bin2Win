import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Admin from '../models/Admin.js';

// Generate JWT token
export const generateToken = (payload, expiresIn = '7d') => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

// Verify JWT token
export const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

// Middleware to authenticate user
export const authenticateUser = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = verifyToken(token);
    
    if (decoded.type !== 'user') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token type'
      });
    }

    const user = await User.findById(decoded.userId);
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive'
      });
    }

    // Update last active
    user.lastActive = new Date();
    await user.save();

    req.user = user;
    req.userId = user._id;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired',
        error: 'TOKEN_EXPIRED'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
        error: 'INVALID_TOKEN'
      });
    }

    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

// Middleware to authenticate admin
export const authenticateAdmin = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = verifyToken(token);
    
    if (decoded.type !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token type'
      });
    }

    const admin = await Admin.findById(decoded.adminId).populate('assignedBooths');
    
    if (!admin || !admin.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Admin not found or inactive'
      });
    }

    if (admin.isLocked) {
      return res.status(401).json({
        success: false,
        message: 'Account is locked due to multiple failed login attempts'
      });
    }

    req.admin = admin;
    req.adminId = admin._id;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired',
        error: 'TOKEN_EXPIRED'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
        error: 'INVALID_TOKEN'
      });
    }

    console.error('Admin authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

// Middleware to check admin permissions
export const requirePermission = (module, action) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: 'Admin authentication required'
      });
    }

    if (!req.admin.hasPermission(module, action)) {
      return res.status(403).json({
        success: false,
        message: `Permission denied. Required: ${module}:${action}`
      });
    }

    next();
  };
};

// Middleware to check if admin has access to specific booth
export const requireBoothAccess = (req, res, next) => {
  const { boothId } = req.params;
  
  if (!req.admin) {
    return res.status(401).json({
      success: false,
      message: 'Admin authentication required'
    });
  }

  // Super admin has access to all booths
  if (req.admin.role === 'super_admin') {
    return next();
  }

  // Check if booth is assigned to admin
  const hasAccess = req.admin.assignedBooths.some(booth => 
    booth._id.toString() === boothId
  );

  if (!hasAccess) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Booth not assigned to you.'
    });
  }

  next();
};

// Middleware for optional authentication (doesn't fail if no token)
export const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return next();
    }

    const decoded = verifyToken(token);
    
    if (decoded.type === 'user') {
      const user = await User.findById(decoded.userId);
      if (user && user.isActive) {
        req.user = user;
        req.userId = user._id;
      }
    } else if (decoded.type === 'admin') {
      const admin = await Admin.findById(decoded.adminId);
      if (admin && admin.isActive && !admin.isLocked) {
        req.admin = admin;
        req.adminId = admin._id;
      }
    }

    next();
  } catch (error) {
    // Ignore authentication errors in optional auth
    next();
  }
};

// Rate limiting for sensitive operations
export const sensitiveOperationLimit = (maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
  const attempts = new Map();

  return (req, res, next) => {
    const key = req.ip + (req.user?.id || req.admin?.id || '');
    const now = Date.now();
    const userAttempts = attempts.get(key) || { count: 0, resetTime: now + windowMs };

    if (now > userAttempts.resetTime) {
      userAttempts.count = 0;
      userAttempts.resetTime = now + windowMs;
    }

    if (userAttempts.count >= maxAttempts) {
      return res.status(429).json({
        success: false,
        message: 'Too many attempts. Please try again later.',
        retryAfter: Math.ceil((userAttempts.resetTime - now) / 1000)
      });
    }

    userAttempts.count++;
    attempts.set(key, userAttempts);

    next();
  };
};

// Middleware to log API requests
export const logRequest = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: req.user?.id,
      adminId: req.admin?.id,
      timestamp: new Date().toISOString()
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('API Request:', logData);
    }

    // In production, you might want to log to a file or external service
  });

  next();
};

export default {
  generateToken,
  verifyToken,
  authenticateUser,
  authenticateAdmin,
  requirePermission,
  requireBoothAccess,
  optionalAuth,
  sensitiveOperationLimit,
  logRequest
};
