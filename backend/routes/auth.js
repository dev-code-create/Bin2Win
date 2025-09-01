import express from 'express';
import jwt from 'jsonwebtoken';
import { catchAsync, sendResponse, sendError } from '../middleware/errorHandler.js';
import { generateToken, authenticateUser, authenticateAdmin } from '../middleware/auth.js';
import { authRateLimiter, otpRateLimiter } from '../middleware/rateLimiter.js';
import User from '../models/User.js';
import Admin from '../models/Admin.js';
import crypto from 'crypto';

const router = express.Router();

// In-memory OTP storage (use Redis in production)
const otpStore = new Map();
const OTP_EXPIRY = 5 * 60 * 1000; // 5 minutes

// Generate random OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generate unique QR code for user
const generateUserQRCode = (phoneNumber) => {
  const timestamp = Date.now();
  const hash = crypto.createHash('sha256')
    .update(`${phoneNumber}_${timestamp}_${process.env.JWT_SECRET}`)
    .digest('hex')
    .substring(0, 16);
  return `SIMHASTHA_USER_${hash.toUpperCase()}`;
};

// Send OTP (mock implementation - integrate with SMS service)
const sendOTP = async (phoneNumber, otp) => {
  // In production, integrate with SMS service like Twilio, AWS SNS, etc.
  console.log(`Sending OTP ${otp} to ${phoneNumber}`);
  
  // Mock SMS sending delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return { success: true, message: 'OTP sent successfully' };
};

// POST /api/auth/send-otp - Send OTP to phone number
router.post('/send-otp', otpRateLimiter, catchAsync(async (req, res) => {
  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    return sendError(res, 400, 'Phone number is required');
  }

  // Validate phone number format
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  if (!phoneRegex.test(phoneNumber)) {
    return sendError(res, 400, 'Please provide a valid phone number');
  }

  // Generate OTP
  const otp = generateOTP();
  const expiresAt = Date.now() + OTP_EXPIRY;

  // Store OTP with expiry
  otpStore.set(phoneNumber, {
    otp,
    expiresAt,
    attempts: 0,
    maxAttempts: 3
  });

  try {
    // Send OTP via SMS
    await sendOTP(phoneNumber, otp);

    sendResponse(res, 200, {
      phoneNumber,
      message: 'OTP sent successfully',
      expiresIn: OTP_EXPIRY / 1000 // in seconds
    });
  } catch (error) {
    console.error('Failed to send OTP:', error);
    otpStore.delete(phoneNumber); // Remove OTP if sending failed
    sendError(res, 500, 'Failed to send OTP. Please try again.');
  }
}));

// POST /api/auth/verify-otp - Verify OTP and login/register user
router.post('/verify-otp', authRateLimiter, catchAsync(async (req, res) => {
  const { phoneNumber, otp, name } = req.body;

  if (!phoneNumber || !otp) {
    return sendError(res, 400, 'Phone number and OTP are required');
  }

  // Check if OTP exists and is valid
  const storedOTP = otpStore.get(phoneNumber);
  
  if (!storedOTP) {
    return sendError(res, 400, 'OTP not found. Please request a new OTP.');
  }

  if (Date.now() > storedOTP.expiresAt) {
    otpStore.delete(phoneNumber);
    return sendError(res, 400, 'OTP has expired. Please request a new OTP.');
  }

  if (storedOTP.attempts >= storedOTP.maxAttempts) {
    otpStore.delete(phoneNumber);
    return sendError(res, 400, 'Maximum OTP attempts exceeded. Please request a new OTP.');
  }

  if (storedOTP.otp !== otp) {
    storedOTP.attempts++;
    otpStore.set(phoneNumber, storedOTP);
    
    const remainingAttempts = storedOTP.maxAttempts - storedOTP.attempts;
    return sendError(res, 400, `Invalid OTP. ${remainingAttempts} attempts remaining.`);
  }

  // OTP is valid, remove from store
  otpStore.delete(phoneNumber);

  try {
    // Check if user exists
    let user = await User.findByPhoneNumber(phoneNumber);
    let isNewUser = false;

    if (!user) {
      // Register new user
      if (!name || name.trim().length < 2) {
        return sendError(res, 400, 'Name is required for new users and must be at least 2 characters long');
      }

      const qrCode = generateUserQRCode(phoneNumber);
      
      user = new User({
        phoneNumber,
        name: name.trim(),
        qrCode,
        registrationDate: new Date(),
        lastActive: new Date()
      });

      await user.save();
      isNewUser = true;
    } else {
      // Update existing user's last active
      user.lastActive = new Date();
      await user.save();
    }

    // Generate JWT token
    const token = generateToken({
      userId: user._id,
      type: 'user',
      phoneNumber: user.phoneNumber
    });

    // Prepare user data (exclude sensitive information)
    const userData = {
      id: user._id,
      phoneNumber: user.phoneNumber,
      name: user.name,
      email: user.email,
      greenCredits: user.greenCredits,
      totalWasteSubmitted: user.totalWasteSubmitted,
      qrCode: user.qrCode,
      currentRank: user.currentRank,
      stats: user.stats,
      preferences: user.preferences,
      registrationDate: user.registrationDate,
      lastActive: user.lastActive
    };

    sendResponse(res, isNewUser ? 201 : 200, {
      user: userData,
      token,
      isNewUser,
      message: isNewUser ? 'Account created successfully' : 'Login successful'
    });

  } catch (error) {
    console.error('Authentication error:', error);
    
    if (error.code === 11000) {
      // Handle duplicate key error (shouldn't happen with proper validation)
      return sendError(res, 400, 'Phone number already exists');
    }
    
    sendError(res, 500, 'Authentication failed. Please try again.');
  }
}));

// POST /api/auth/admin/login - Admin login
router.post('/admin/login', authRateLimiter, catchAsync(async (req, res) => {
  const { login, password } = req.body; // login can be username or email

  if (!login || !password) {
    return sendError(res, 400, 'Username/email and password are required');
  }

  try {
    // Find admin by username or email
    const admin = await Admin.findByLogin(login).select('+password');
    
    if (!admin) {
      return sendError(res, 401, 'Invalid credentials');
    }

    if (admin.isLocked) {
      return sendError(res, 401, 'Account is locked due to multiple failed login attempts. Please try again later.');
    }

    // Check password
    const isPasswordValid = await admin.comparePassword(password);
    
    if (!isPasswordValid) {
      // Handle failed login attempt
      await admin.handleLoginAttempt(false);
      
      const remainingAttempts = Math.max(0, 5 - admin.loginAttempts.count);
      return sendError(res, 401, `Invalid credentials. ${remainingAttempts} attempts remaining before account lock.`);
    }

    // Handle successful login
    await admin.handleLoginAttempt(true);

    // Generate JWT token
    const token = generateToken({
      adminId: admin._id,
      type: 'admin',
      role: admin.role
    });

    // Prepare admin data (password is already excluded by toJSON transform)
    const adminData = {
      id: admin._id,
      username: admin.username,
      email: admin.email,
      fullName: admin.fullName,
      role: admin.role,
      permissions: admin.allPermissions,
      assignedBooths: admin.assignedBooths,
      lastLogin: admin.lastLogin,
      preferences: admin.preferences,
      statistics: admin.statistics
    };

    sendResponse(res, 200, {
      admin: adminData,
      token,
      message: 'Admin login successful'
    });

  } catch (error) {
    console.error('Admin authentication error:', error);
    sendError(res, 500, 'Authentication failed. Please try again.');
  }
}));

// POST /api/auth/refresh-token - Refresh JWT token
router.post('/refresh-token', catchAsync(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return sendError(res, 400, 'Refresh token is required');
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    
    let newToken;
    let userData;

    if (decoded.type === 'user') {
      const user = await User.findById(decoded.userId);
      
      if (!user || !user.isActive) {
        return sendError(res, 401, 'User not found or inactive');
      }

      newToken = generateToken({
        userId: user._id,
        type: 'user',
        phoneNumber: user.phoneNumber
      });

      userData = {
        id: user._id,
        phoneNumber: user.phoneNumber,
        name: user.name,
        greenCredits: user.greenCredits,
        currentRank: user.currentRank
      };

    } else if (decoded.type === 'admin') {
      const admin = await Admin.findById(decoded.adminId);
      
      if (!admin || !admin.isActive || admin.isLocked) {
        return sendError(res, 401, 'Admin not found, inactive, or locked');
      }

      newToken = generateToken({
        adminId: admin._id,
        type: 'admin',
        role: admin.role
      });

      userData = {
        id: admin._id,
        username: admin.username,
        fullName: admin.fullName,
        role: admin.role
      };
    } else {
      return sendError(res, 401, 'Invalid token type');
    }

    sendResponse(res, 200, {
      token: newToken,
      user: userData,
      message: 'Token refreshed successfully'
    });

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return sendError(res, 401, 'Refresh token expired. Please login again.');
    }
    
    if (error.name === 'JsonWebTokenError') {
      return sendError(res, 401, 'Invalid refresh token');
    }

    console.error('Token refresh error:', error);
    sendError(res, 500, 'Token refresh failed');
  }
}));

// POST /api/auth/logout - Logout (client-side token removal)
router.post('/logout', authenticateUser, catchAsync(async (req, res) => {
  // In a more sophisticated setup, you might want to blacklist the token
  // For now, we'll just send a success response
  
  sendResponse(res, 200, {
    message: 'Logout successful'
  });
}));

// POST /api/auth/admin/logout - Admin logout
router.post('/admin/logout', authenticateAdmin, catchAsync(async (req, res) => {
  sendResponse(res, 200, {
    message: 'Admin logout successful'
  });
}));

// GET /api/auth/me - Get current user/admin info
router.get('/me', catchAsync(async (req, res) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return sendError(res, 401, 'No token provided');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.type === 'user') {
      const user = await User.findById(decoded.userId);
      
      if (!user || !user.isActive) {
        return sendError(res, 401, 'User not found or inactive');
      }

      const userData = {
        id: user._id,
        phoneNumber: user.phoneNumber,
        name: user.name,
        email: user.email,
        greenCredits: user.greenCredits,
        totalWasteSubmitted: user.totalWasteSubmitted,
        qrCode: user.qrCode,
        currentRank: user.currentRank,
        stats: user.stats,
        preferences: user.preferences,
        type: 'user'
      };

      sendResponse(res, 200, userData);

    } else if (decoded.type === 'admin') {
      const admin = await Admin.findById(decoded.adminId).populate('assignedBooths');
      
      if (!admin || !admin.isActive) {
        return sendError(res, 401, 'Admin not found or inactive');
      }

      const adminData = {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role,
        permissions: admin.allPermissions,
        assignedBooths: admin.assignedBooths,
        preferences: admin.preferences,
        statistics: admin.statistics,
        type: 'admin'
      };

      sendResponse(res, 200, adminData);
    } else {
      return sendError(res, 401, 'Invalid token type');
    }

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return sendError(res, 401, 'Token expired');
    }
    
    if (error.name === 'JsonWebTokenError') {
      return sendError(res, 401, 'Invalid token');
    }

    console.error('Get user info error:', error);
    sendError(res, 500, 'Failed to get user information');
  }
}));

// Clean up expired OTPs periodically
setInterval(() => {
  const now = Date.now();
  for (const [phoneNumber, otpData] of otpStore.entries()) {
    if (now > otpData.expiresAt) {
      otpStore.delete(phoneNumber);
    }
  }
}, 60 * 1000); // Clean up every minute

export default router;
