import express from 'express';
import { catchAsync, sendResponse, sendError, sendPaginatedResponse } from '../middleware/errorHandler.js';
import { authenticateUser } from '../middleware/auth.js';
import { searchRateLimiter, uploadRateLimiter } from '../middleware/rateLimiter.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import WasteSubmission from '../models/WasteSubmission.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for profile image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/profiles'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `profile-${req.user.id}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, JPG, PNG, GIF, WebP) are allowed'));
    }
  }
});

// All routes require authentication
router.use(authenticateUser);

// GET /api/user/profile - Get user profile
router.get('/profile', catchAsync(async (req, res) => {
  const user = await User.findById(req.userId);
  
  if (!user) {
    return sendError(res, 404, 'User not found');
  }

  const userProfile = {
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
    profileImage: user.profileImage,
    address: user.address,
    registrationDate: user.registrationDate,
    lastActive: user.lastActive
  };

  sendResponse(res, 200, userProfile, 'Profile retrieved successfully');
}));

// PUT /api/user/profile - Update user profile
router.put('/profile', catchAsync(async (req, res) => {
  const {
    name,
    email,
    address,
    preferences
  } = req.body;

  const updateData = {};

  // Validate and update name
  if (name !== undefined) {
    if (!name || name.trim().length < 2) {
      return sendError(res, 400, 'Name must be at least 2 characters long');
    }
    updateData.name = name.trim();
  }

  // Validate and update email
  if (email !== undefined) {
    if (email && !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
      return sendError(res, 400, 'Please provide a valid email address');
    }
    updateData.email = email?.toLowerCase() || null;
  }

  // Update address
  if (address !== undefined) {
    updateData.address = {
      street: address.street?.trim() || '',
      city: address.city?.trim() || '',
      state: address.state?.trim() || '',
      pincode: address.pincode?.trim() || ''
    };
  }

  // Update preferences
  if (preferences !== undefined) {
    updateData.preferences = {
      notifications: preferences.notifications !== undefined ? preferences.notifications : req.user.preferences.notifications,
      language: preferences.language || req.user.preferences.language
    };

    // Validate language
    if (!['en', 'hi', 'mr'].includes(updateData.preferences.language)) {
      return sendError(res, 400, 'Invalid language preference');
    }
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      updateData,
      { new: true, runValidators: true }
    );

    const userProfile = {
      id: updatedUser._id,
      phoneNumber: updatedUser.phoneNumber,
      name: updatedUser.name,
      email: updatedUser.email,
      greenCredits: updatedUser.greenCredits,
      totalWasteSubmitted: updatedUser.totalWasteSubmitted,
      qrCode: updatedUser.qrCode,
      currentRank: updatedUser.currentRank,
      stats: updatedUser.stats,
      preferences: updatedUser.preferences,
      profileImage: updatedUser.profileImage,
      address: updatedUser.address,
      registrationDate: updatedUser.registrationDate,
      lastActive: updatedUser.lastActive
    };

    sendResponse(res, 200, userProfile, 'Profile updated successfully');

  } catch (error) {
    if (error.code === 11000) {
      return sendError(res, 400, 'Email already exists');
    }
    throw error;
  }
}));

// POST /api/user/profile/image - Upload profile image
router.post('/profile/image', uploadRateLimiter, upload.single('profileImage'), catchAsync(async (req, res) => {
  if (!req.file) {
    return sendError(res, 400, 'No image file provided');
  }

  const imageUrl = `/uploads/profiles/${req.file.filename}`;

  const updatedUser = await User.findByIdAndUpdate(
    req.userId,
    { profileImage: imageUrl },
    { new: true }
  );

  sendResponse(res, 200, {
    profileImage: updatedUser.profileImage
  }, 'Profile image updated successfully');
}));

// GET /api/user/credits - Get user's green credits balance and recent transactions
router.get('/credits', catchAsync(async (req, res) => {
  const user = await User.findById(req.userId);
  
  // Get recent transactions (last 10)
  const recentTransactions = await Transaction.find({ userId: req.userId })
    .sort({ date: -1 })
    .limit(10)
    .populate('relatedId', 'name wasteType quantity')
    .lean();

  const creditsInfo = {
    currentBalance: user.greenCredits,
    totalEarned: user.stats.totalPointsEarned,
    totalSpent: user.stats.totalPointsRedeemed,
    currentRank: user.currentRank,
    nextRankThreshold: getNextRankThreshold(user.greenCredits),
    recentTransactions: recentTransactions.map(transaction => ({
      id: transaction._id,
      type: transaction.type,
      points: transaction.points,
      description: transaction.description,
      date: transaction.date,
      status: transaction.status,
      referenceNumber: transaction.referenceNumber,
      category: transaction.category
    }))
  };

  sendResponse(res, 200, creditsInfo, 'Credits information retrieved successfully');
}));

// Helper function to get next rank threshold
const getNextRankThreshold = (currentCredits) => {
  const ranks = [
    { name: 'Bronze', threshold: 0 },
    { name: 'Silver', threshold: 500 },
    { name: 'Gold', threshold: 2000 },
    { name: 'Platinum', threshold: 5000 },
    { name: 'Diamond', threshold: 10000 }
  ];

  for (let i = 0; i < ranks.length; i++) {
    if (currentCredits < ranks[i].threshold) {
      return {
        rank: ranks[i].name,
        pointsNeeded: ranks[i].threshold - currentCredits
      };
    }
  }

  return null; // Already at highest rank
};

// GET /api/user/history - Get user's submission and transaction history
router.get('/history', catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    type = 'all', // 'submissions', 'transactions', 'all'
    startDate,
    endDate
  } = req.query;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);

  if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
    return sendError(res, 400, 'Invalid pagination parameters');
  }

  const dateFilter = {};
  if (startDate || endDate) {
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);
  }

  let history = [];
  let totalCount = 0;

  if (type === 'all' || type === 'submissions') {
    // Get waste submissions
    const submissionQuery = { userId: req.userId };
    if (Object.keys(dateFilter).length > 0) {
      submissionQuery.submissionDate = dateFilter;
    }

    const submissions = await WasteSubmission.find(submissionQuery)
      .populate('boothId', 'name location.address')
      .sort({ submissionDate: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    history = history.concat(submissions.map(sub => ({
      id: sub._id,
      type: 'submission',
      date: sub.submissionDate,
      description: `${sub.wasteType} waste - ${sub.quantity}kg`,
      points: sub.pointsEarned,
      status: sub.status,
      booth: sub.boothId ? {
        name: sub.boothId.name,
        address: sub.boothId.location?.address
      } : null,
      wasteType: sub.wasteType,
      quantity: sub.quantity,
      photos: sub.photos
    })));

    if (type === 'submissions') {
      totalCount = await WasteSubmission.countDocuments(submissionQuery);
    }
  }

  if (type === 'all' || type === 'transactions') {
    // Get transactions
    const transactionQuery = { userId: req.userId };
    if (Object.keys(dateFilter).length > 0) {
      transactionQuery.date = dateFilter;
    }

    const transactions = await Transaction.find(transactionQuery)
      .sort({ date: -1 })
      .skip(type === 'all' ? 0 : (pageNum - 1) * limitNum)
      .limit(type === 'all' ? limitNum : limitNum)
      .lean();

    history = history.concat(transactions.map(txn => ({
      id: txn._id,
      type: 'transaction',
      date: txn.date,
      description: txn.description,
      points: txn.points,
      status: txn.status,
      referenceNumber: txn.referenceNumber,
      category: txn.category,
      transactionType: txn.type
    })));

    if (type === 'transactions') {
      totalCount = await Transaction.countDocuments(transactionQuery);
    }
  }

  if (type === 'all') {
    // Sort combined history by date
    history.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Apply pagination to combined results
    const startIndex = (pageNum - 1) * limitNum;
    history = history.slice(startIndex, startIndex + limitNum);
    
    // Get total count for both collections
    const submissionQuery = { userId: req.userId };
    const transactionQuery = { userId: req.userId };
    
    if (Object.keys(dateFilter).length > 0) {
      submissionQuery.submissionDate = dateFilter;
      transactionQuery.date = dateFilter;
    }

    const [submissionCount, transactionCount] = await Promise.all([
      WasteSubmission.countDocuments(submissionQuery),
      Transaction.countDocuments(transactionQuery)
    ]);
    
    totalCount = submissionCount + transactionCount;
  }

  sendPaginatedResponse(res, 200, history, {
    page: pageNum,
    limit: limitNum,
    total: totalCount
  }, 'History retrieved successfully');
}));

// GET /api/user/stats - Get user statistics
router.get('/stats', catchAsync(async (req, res) => {
  const { period = '30d' } = req.query;
  
  const user = await User.findById(req.userId);
  
  // Get transaction statistics for the period
  const transactionStats = await Transaction.getTransactionStats(req.userId, period);
  
  // Get waste submission statistics
  const periodDays = parseInt(period.replace('d', ''));
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - periodDays);
  
  const wasteStats = await WasteSubmission.aggregate([
    {
      $match: {
        userId: req.userId,
        submissionDate: { $gte: startDate },
        status: 'approved'
      }
    },
    {
      $group: {
        _id: '$wasteType',
        totalQuantity: { $sum: '$quantity' },
        totalSubmissions: { $sum: 1 },
        totalPoints: { $sum: '$pointsEarned' }
      }
    },
    {
      $sort: { totalQuantity: -1 }
    }
  ]);

  const statistics = {
    overview: {
      currentBalance: user.greenCredits,
      totalEarned: user.stats.totalPointsEarned,
      totalSpent: user.stats.totalPointsRedeemed,
      totalSubmissions: user.stats.totalSubmissions,
      currentRank: user.currentRank,
      nextRankThreshold: getNextRankThreshold(user.greenCredits)
    },
    period: {
      days: periodDays,
      transactions: transactionStats[0] || {
        totalEarned: 0,
        totalSpent: 0,
        totalTransactions: 0,
        breakdown: []
      },
      wasteBreakdown: wasteStats,
      totalWasteSubmitted: wasteStats.reduce((sum, stat) => sum + stat.totalQuantity, 0)
    },
    environmental: {
      totalCO2Saved: calculateCO2Saved(wasteStats),
      treesEquivalent: calculateTreesEquivalent(wasteStats),
      waterSaved: calculateWaterSaved(wasteStats)
    }
  };

  sendResponse(res, 200, statistics, 'User statistics retrieved successfully');
}));

// Helper functions for environmental impact
const calculateCO2Saved = (wasteStats) => {
  const co2Factors = {
    plastic: 2.5,
    organic: 0.5,
    paper: 1.2,
    metal: 3.0,
    glass: 0.8,
    electronic: 4.0,
    textile: 1.5,
    hazardous: 5.0
  };

  return wasteStats.reduce((total, stat) => {
    return total + (stat.totalQuantity * (co2Factors[stat._id] || 1));
  }, 0).toFixed(2);
};

const calculateTreesEquivalent = (wasteStats) => {
  // Rough calculation: 1 tree absorbs ~22kg CO2 per year
  const co2Saved = parseFloat(calculateCO2Saved(wasteStats));
  return (co2Saved / 22).toFixed(2);
};

const calculateWaterSaved = (wasteStats) => {
  const waterFactors = {
    plastic: 15, // liters per kg
    paper: 25,
    textile: 30,
    metal: 10,
    glass: 5,
    organic: 2,
    electronic: 20,
    hazardous: 8
  };

  return wasteStats.reduce((total, stat) => {
    return total + (stat.totalQuantity * (waterFactors[stat._id] || 5));
  }, 0).toFixed(0);
};

// GET /api/user/leaderboard - Get leaderboard (user's position and top users)
router.get('/leaderboard', searchRateLimiter, catchAsync(async (req, res) => {
  const { limit = 10 } = req.query;
  const limitNum = Math.min(parseInt(limit), 50);

  // Get top users
  const topUsers = await User.getLeaderboard(limitNum);

  // Get current user's rank
  const userRank = await User.countDocuments({
    greenCredits: { $gt: req.user.greenCredits },
    isActive: true
  }) + 1;

  const leaderboard = {
    topUsers: topUsers.map((user, index) => ({
      rank: index + 1,
      name: user.name,
      greenCredits: user.greenCredits,
      currentRank: user.stats.rank,
      profileImage: user.profileImage
    })),
    currentUser: {
      rank: userRank,
      name: req.user.name,
      greenCredits: req.user.greenCredits,
      currentRank: req.user.currentRank,
      profileImage: req.user.profileImage
    }
  };

  sendResponse(res, 200, leaderboard, 'Leaderboard retrieved successfully');
}));

// DELETE /api/user/account - Delete user account (soft delete)
router.delete('/account', catchAsync(async (req, res) => {
  const { confirmPassword } = req.body;

  // In a real implementation, you might want to verify the user's identity
  // For now, we'll just require a confirmation

  if (confirmPassword !== 'DELETE_MY_ACCOUNT') {
    return sendError(res, 400, 'Please type "DELETE_MY_ACCOUNT" to confirm account deletion');
  }

  // Soft delete - set isActive to false
  await User.findByIdAndUpdate(req.userId, {
    isActive: false,
    lastActive: new Date()
  });

  sendResponse(res, 200, {
    message: 'Account deleted successfully'
  });
}));

export default router;
