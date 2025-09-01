import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import Admin from '../models/Admin.js';
import { generateToken } from '../middleware/auth.js';

class AuthController {
  constructor() {
    // In-memory OTP storage (use Redis in production)
    this.otpStore = new Map();
    this.OTP_EXPIRY = 5 * 60 * 1000; // 5 minutes
    
    // Cleanup expired OTPs periodically
    setInterval(() => {
      this.cleanupExpiredOTPs();
    }, 60 * 1000); // Clean up every minute
  }

  // Generate random OTP
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Generate unique QR code for user
  generateUserQRCode(identifier) {
    const timestamp = Date.now();
    const hash = crypto.createHash('sha256')
      .update(`${identifier}_${timestamp}_${process.env.JWT_SECRET}`)
      .digest('hex')
      .substring(0, 16);
    return `SIMHASTHA_USER_${hash.toUpperCase()}`;
  }

  // Send OTP (mock implementation - integrate with SMS service)
  async sendOTP(phoneNumber, otp) {
    // In production, integrate with SMS service like Twilio, AWS SNS, etc.
    console.log(`📱 Sending OTP ${otp} to ${phoneNumber}`);
    
    // Mock SMS sending delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return { success: true, message: 'OTP sent successfully' };
  }

  // Clean up expired OTPs
  cleanupExpiredOTPs() {
    const now = Date.now();
    for (const [phoneNumber, otpData] of this.otpStore.entries()) {
      if (now > otpData.expiresAt) {
        this.otpStore.delete(phoneNumber);
      }
    }
  }

  // User Registration with Username/Password
  async register(req, res) {
    try {
      const { username, password, name, email, phoneNumber } = req.body;

      // Validate required fields
      if (!username || !password || !name || !email) {
        return res.status(400).json({
          success: false,
          message: 'Username, password, name, and email are required'
        });
      }

      // Check if username or email already exists
      const existingUser = await User.findOne({
        $or: [{ username }, { email }]
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Username or email already exists'
        });
      }

      // Generate unique QR code for the user
      const qrCode = this.generateUserQRCode(username);

      // Create new user
      const user = new User({
        username,
        password, // Will be hashed by the pre-save middleware
        name,
        email,
        phoneNumber,
        qrCode,
        registrationDate: new Date(),
        lastActive: new Date()
      });

      await user.save();

      // Generate JWT token
      const token = generateToken({
        userId: user._id,
        type: 'user',
        username: user.username
      });

      // Prepare user data (exclude sensitive information)
      const userData = {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        greenCredits: user.greenCredits,
        totalWasteSubmitted: user.totalWasteSubmitted,
        qrCode: user.qrCode,
        currentRank: user.currentRank,
        stats: user.stats,
        preferences: user.preferences,
        registrationDate: user.registrationDate,
        lastActive: user.lastActive
      };

      res.status(201).json({
        success: true,
        message: 'Registration successful!',
        data: {
          user: userData,
          token
        }
      });
    } catch (error) {
      console.error('❌ Registration error:', error);
      
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'Username or email already exists'
        });
      }
      
      res.status(500).json({
        success: false,
        message: error.message || 'Registration failed'
      });
    }
  }

  // User Login with Username/Password
  async login(req, res) {
    try {
      const { username, password } = req.body;

      // Validate required fields
      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username and password are required'
        });
      }

      // Find user by username or email
      const user = await User.findOne({
        $or: [{ username }, { email: username }],
        isActive: true
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Check password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Update last active
      user.lastActive = new Date();
      await user.save();

      // Generate JWT token
      const token = generateToken({
        userId: user._id,
        type: 'user',
        username: user.username
      });

      // Prepare user data (exclude sensitive information)
      const userData = {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        greenCredits: user.greenCredits,
        totalWasteSubmitted: user.totalWasteSubmitted,
        qrCode: user.qrCode,
        currentRank: user.currentRank,
        stats: user.stats,
        preferences: user.preferences,
        registrationDate: user.registrationDate,
        lastActive: user.lastActive
      };

      res.json({
        success: true,
        message: 'Login successful!',
        data: {
          user: userData,
          token
        }
      });
    } catch (error) {
      console.error('❌ Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Login failed'
      });
    }
  }

  // Send OTP to phone number
  async sendOTPToPhone(req, res) {
    try {
      const { phoneNumber } = req.body;

      if (!phoneNumber) {
        return res.status(400).json({
          success: false,
          message: 'Phone number is required'
        });
      }

      // Validate phone number format
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      if (!phoneRegex.test(phoneNumber)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid phone number'
        });
      }

      // Generate OTP
      const otp = this.generateOTP();
      const expiresAt = Date.now() + this.OTP_EXPIRY;

      // Store OTP with expiry
      this.otpStore.set(phoneNumber, {
        otp,
        expiresAt,
        attempts: 0,
        maxAttempts: 3
      });

      try {
        // Send OTP via SMS
        await this.sendOTP(phoneNumber, otp);

        res.json({
          success: true,
          data: {
            phoneNumber,
            message: 'OTP sent successfully',
            expiresIn: this.OTP_EXPIRY / 1000 // in seconds
          }
        });
      } catch (smsError) {
        console.error('Failed to send OTP:', smsError);
        this.otpStore.delete(phoneNumber); // Remove OTP if sending failed
        res.status(500).json({
          success: false,
          message: 'Failed to send OTP. Please try again.'
        });
      }
    } catch (error) {
      console.error('❌ Send OTP error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send OTP'
      });
    }
  }

  // Verify OTP and login/register user
  async verifyOTP(req, res) {
    try {
      const { phoneNumber, otp, name } = req.body;

      if (!phoneNumber || !otp) {
        return res.status(400).json({
          success: false,
          message: 'Phone number and OTP are required'
        });
      }

      // Check if OTP exists and is valid
      const storedOTP = this.otpStore.get(phoneNumber);
      
      if (!storedOTP) {
        return res.status(400).json({
          success: false,
          message: 'OTP not found. Please request a new OTP.'
        });
      }

      if (Date.now() > storedOTP.expiresAt) {
        this.otpStore.delete(phoneNumber);
        return res.status(400).json({
          success: false,
          message: 'OTP has expired. Please request a new OTP.'
        });
      }

      if (storedOTP.attempts >= storedOTP.maxAttempts) {
        this.otpStore.delete(phoneNumber);
        return res.status(400).json({
          success: false,
          message: 'Maximum OTP attempts exceeded. Please request a new OTP.'
        });
      }

      if (storedOTP.otp !== otp) {
        storedOTP.attempts++;
        this.otpStore.set(phoneNumber, storedOTP);
        
        const remainingAttempts = storedOTP.maxAttempts - storedOTP.attempts;
        return res.status(400).json({
          success: false,
          message: `Invalid OTP. ${remainingAttempts} attempts remaining.`
        });
      }

      // OTP is valid, remove from store
      this.otpStore.delete(phoneNumber);

      // Check if user exists
      let user = await User.findByPhoneNumber(phoneNumber);
      let isNewUser = false;

      if (!user) {
        // Register new user
        if (!name || name.trim().length < 2) {
          return res.status(400).json({
            success: false,
            message: 'Name is required for new users and must be at least 2 characters long'
          });
        }

        const qrCode = this.generateUserQRCode(phoneNumber);
        
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

      res.status(isNewUser ? 201 : 200).json({
        success: true,
        message: isNewUser ? 'Account created successfully' : 'Login successful',
        data: {
          user: userData,
          token,
          isNewUser
        }
      });

    } catch (error) {
      console.error('❌ Authentication error:', error);
      
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'Phone number already exists'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Authentication failed. Please try again.'
      });
    }
  }

  // Admin login
  async adminLogin(req, res) {
    try {
      const { login, password } = req.body; // login can be username or email

      if (!login || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username/email and password are required'
        });
      }

      // Find admin by username or email
      const admin = await Admin.findByLogin(login).select('+password');
      
      if (!admin) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      if (admin.isLocked) {
        return res.status(401).json({
          success: false,
          message: 'Account is locked due to multiple failed login attempts. Please try again later.'
        });
      }

      // Check password
      const isPasswordValid = await admin.comparePassword(password);
      
      if (!isPasswordValid) {
        // Handle failed login attempt
        await admin.handleLoginAttempt(false);
        
        const remainingAttempts = Math.max(0, 5 - admin.loginAttempts.count);
        return res.status(401).json({
          success: false,
          message: `Invalid credentials. ${remainingAttempts} attempts remaining before account lock.`
        });
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

      res.json({
        success: true,
        message: 'Admin login successful',
        data: {
          admin: adminData,
          token
        }
      });

    } catch (error) {
      console.error('❌ Admin authentication error:', error);
      res.status(500).json({
        success: false,
        message: 'Authentication failed. Please try again.'
      });
    }
  }

  // Refresh JWT token
  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token is required'
        });
      }

      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
      
      let newToken;
      let userData;

      if (decoded.type === 'user') {
        const user = await User.findById(decoded.userId);
        
        if (!user || !user.isActive) {
          return res.status(401).json({
            success: false,
            message: 'User not found or inactive'
          });
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
          return res.status(401).json({
            success: false,
            message: 'Admin not found, inactive, or locked'
          });
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
        return res.status(401).json({
          success: false,
          message: 'Invalid token type'
        });
      }

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          token: newToken,
          user: userData
        }
      });

    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Refresh token expired. Please login again.'
        });
      }
      
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid refresh token'
        });
      }

      console.error('❌ Token refresh error:', error);
      res.status(500).json({
        success: false,
        message: 'Token refresh failed'
      });
    }
  }

  // Get current user/admin info
  async getMe(req, res) {
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'No token provided'
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      if (decoded.type === 'user') {
        const user = await User.findById(decoded.userId);
        
        if (!user || !user.isActive) {
          return res.status(401).json({
            success: false,
            message: 'User not found or inactive'
          });
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

        res.json({
          success: true,
          data: userData
        });

      } else if (decoded.type === 'admin') {
        const admin = await Admin.findById(decoded.adminId).populate('assignedBooths');
        
        if (!admin || !admin.isActive) {
          return res.status(401).json({
            success: false,
            message: 'Admin not found or inactive'
          });
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

        res.json({
          success: true,
          data: adminData
        });
      } else {
        return res.status(401).json({
          success: false,
          message: 'Invalid token type'
        });
      }

    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired'
        });
      }
      
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token'
        });
      }

      console.error('❌ Get user info error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user information'
      });
    }
  }

  // User logout
  async logout(req, res) {
    try {
      // In a more sophisticated setup, you might want to blacklist the token
      // For now, we'll just send a success response
      
      res.json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      console.error('❌ Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Logout failed'
      });
    }
  }

  // Admin logout
  async adminLogout(req, res) {
    try {
      res.json({
        success: true,
        message: 'Admin logout successful'
      });
    } catch (error) {
      console.error('❌ Admin logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Admin logout failed'
      });
    }
  }
}

export default new AuthController();
