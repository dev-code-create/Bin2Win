import express from 'express';
import { catchAsync, sendResponse, sendError, sendPaginatedResponse } from '../middleware/errorHandler.js';
import { authenticateAdmin, requirePermission } from '../middleware/auth.js';
import { adminRateLimiter } from '../middleware/rateLimiter.js';
import Admin from '../models/Admin.js';
import User from '../models/User.js';
import WasteSubmission from '../models/WasteSubmission.js';
import CollectionBooth from '../models/CollectionBooth.js';
import Reward from '../models/Reward.js';
import Transaction from '../models/Transaction.js';

const router = express.Router();

// All admin routes require authentication
router.use(authenticateAdmin);
router.use(adminRateLimiter);

// GET /api/admin/dashboard - Get dashboard statistics
router.get('/dashboard', requirePermission('analytics', 'read'), catchAsync(async (req, res) => {
  const { period = '30d' } = req.query;
  
  const periodDays = parseInt(period.replace('d', ''));
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - periodDays);
  const endDate = new Date();

  // Get overview statistics
  const [
    totalUsers,
    activeUsers,
    totalBooths,
    activeBooths,
    totalRewards,
    activeRewards,
    pendingSubmissions
  ] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ lastActive: { $gte: startDate } }),
    CollectionBooth.countDocuments({}),
    CollectionBooth.countDocuments({ isActive: true }),
    Reward.countDocuments({}),
    Reward.countDocuments({ isActive: true }),
    WasteSubmission.countDocuments({ status: 'pending' })
  ]);

  // Get submission statistics for the period
  const submissionStats = await WasteSubmission.aggregate([
    {
      $match: {
        submissionDate: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          status: '$status',
          date: { $dateToString: { format: '%Y-%m-%d', date: '$submissionDate' } }
        },
        count: { $sum: 1 },
        totalQuantity: { $sum: '$quantity' },
        totalPoints: { $sum: '$pointsEarned' }
      }
    },
    {
      $group: {
        _id: '$_id.status',
        totalCount: { $sum: '$count' },
        totalQuantity: { $sum: '$totalQuantity' },
        totalPoints: { $sum: '$totalPoints' },
        dailyData: {
          $push: {
            date: '$_id.date',
            count: '$count',
            quantity: '$totalQuantity',
            points: '$totalPoints'
          }
        }
      }
    }
  ]);

  // Get waste type breakdown
  const wasteTypeStats = await WasteSubmission.aggregate([
    {
      $match: {
        submissionDate: { $gte: startDate, $lte: endDate },
        status: 'approved'
      }
    },
    {
      $group: {
        _id: '$wasteType',
        count: { $sum: 1 },
        totalQuantity: { $sum: '$quantity' },
        totalPoints: { $sum: '$pointsEarned' }
      }
    },
    { $sort: { totalQuantity: -1 } }
  ]);

  // Get top performing booths
  const topBooths = await WasteSubmission.aggregate([
    {
      $match: {
        submissionDate: { $gte: startDate, $lte: endDate },
        status: 'approved'
      }
    },
    {
      $group: {
        _id: '$boothId',
        submissionCount: { $sum: 1 },
        totalQuantity: { $sum: '$quantity' },
        totalPoints: { $sum: '$pointsEarned' }
      }
    },
    { $sort: { totalQuantity: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'collectionbooths',
        localField: '_id',
        foreignField: '_id',
        as: 'booth',
        pipeline: [
          { $project: { name: 1, 'location.area': 1 } }
        ]
      }
    },
    { $unwind: '$booth' }
  ]);

  // Get top users
  const topUsers = await User.aggregate([
    {
      $match: {
        'stats.totalSubmissions': { $gt: 0 }
      }
    },
    {
      $sort: { greenCredits: -1 }
    },
    { $limit: 10 },
    {
      $project: {
        name: 1,
        greenCredits: 1,
        'stats.totalSubmissions': 1,
        'stats.rank': 1,
        registrationDate: 1
      }
    }
  ]);

  // Get recent activities
  const recentSubmissions = await WasteSubmission.find({
    submissionDate: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
  })
    .populate('userId', 'name phoneNumber')
    .populate('boothId', 'name location.area')
    .sort({ submissionDate: -1 })
    .limit(10)
    .lean();

  // Get transaction statistics
  const transactionStats = await Transaction.aggregate([
    {
      $match: {
        date: { $gte: startDate, $lte: endDate },
        status: 'completed'
      }
    },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        totalPoints: { $sum: { $abs: '$points' } }
      }
    }
  ]);

  const dashboard = {
    overview: {
      users: {
        total: totalUsers,
        active: activeUsers,
        newInPeriod: await User.countDocuments({
          registrationDate: { $gte: startDate }
        })
      },
      booths: {
        total: totalBooths,
        active: activeBooths
      },
      rewards: {
        total: totalRewards,
        active: activeRewards
      },
      submissions: {
        pending: pendingSubmissions,
        totalInPeriod: submissionStats.reduce((sum, stat) => sum + stat.totalCount, 0),
        approvedInPeriod: submissionStats.find(s => s._id === 'approved')?.totalCount || 0
      }
    },
    period: {
      days: periodDays,
      startDate,
      endDate
    },
    submissionStats: submissionStats.map(stat => ({
      status: stat._id,
      count: stat.totalCount,
      quantity: stat.totalQuantity,
      points: stat.totalPoints,
      dailyBreakdown: stat.dailyData
    })),
    wasteTypeBreakdown: wasteTypeStats,
    topBooths: topBooths.map(booth => ({
      id: booth._id,
      name: booth.booth.name,
      area: booth.booth.location?.area,
      submissions: booth.submissionCount,
      quantity: booth.totalQuantity,
      points: booth.totalPoints
    })),
    topUsers: topUsers,
    recentActivity: recentSubmissions.map(sub => ({
      id: sub._id,
      type: 'submission',
      user: sub.userId?.name,
      booth: sub.boothId?.name,
      wasteType: sub.wasteType,
      quantity: sub.quantity,
      status: sub.status,
      date: sub.submissionDate
    })),
    transactionStats: transactionStats,
    systemHealth: {
      avgProcessingTime: await getAverageProcessingTime(startDate, endDate),
      errorRate: await getErrorRate(startDate, endDate),
      userSatisfaction: await getUserSatisfactionScore()
    }
  };

  sendResponse(res, 200, dashboard, 'Dashboard data retrieved successfully');
}));

// Helper functions for dashboard
const getAverageProcessingTime = async (startDate, endDate) => {
  const result = await WasteSubmission.aggregate([
    {
      $match: {
        submissionDate: { $gte: startDate, $lte: endDate },
        verificationDate: { $exists: true }
      }
    },
    {
      $addFields: {
        processingTime: {
          $divide: [
            { $subtract: ['$verificationDate', '$submissionDate'] },
            1000 * 60 // Convert to minutes
          ]
        }
      }
    },
    {
      $group: {
        _id: null,
        avgTime: { $avg: '$processingTime' }
      }
    }
  ]);

  return result[0]?.avgTime ? Math.round(result[0].avgTime) : 0;
};

const getErrorRate = async (startDate, endDate) => {
  const [totalSubmissions, rejectedSubmissions] = await Promise.all([
    WasteSubmission.countDocuments({
      submissionDate: { $gte: startDate, $lte: endDate }
    }),
    WasteSubmission.countDocuments({
      submissionDate: { $gte: startDate, $lte: endDate },
      status: 'rejected'
    })
  ]);

  return totalSubmissions > 0 ? ((rejectedSubmissions / totalSubmissions) * 100).toFixed(1) : 0;
};

const getUserSatisfactionScore = async () => {
  const result = await Reward.aggregate([
    {
      $match: {
        'statistics.totalRatings': { $gt: 0 }
      }
    },
    {
      $group: {
        _id: null,
        avgRating: { $avg: '$statistics.averageRating' },
        totalRatings: { $sum: '$statistics.totalRatings' }
      }
    }
  ]);

  return result[0]?.avgRating ? result[0].avgRating.toFixed(1) : 0;
};

// GET /api/admin/users - Get users list with filters
router.get('/users', requirePermission('users', 'read'), catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    search,
    rank,
    isActive,
    sortBy = 'registrationDate',
    sortOrder = 'desc'
  } = req.query;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);

  // Build query
  const query = {};

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { phoneNumber: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  if (rank) {
    query['stats.rank'] = rank;
  }

  if (isActive !== undefined) {
    query.isActive = isActive === 'true';
  }

  // Sort options
  const sortOptions = {
    name: { name: 1 },
    registrationDate: { registrationDate: -1 },
    greenCredits: { greenCredits: -1 },
    lastActive: { lastActive: -1 },
    totalSubmissions: { 'stats.totalSubmissions': -1 }
  };

  const sortQuery = sortOptions[sortBy] || sortOptions.registrationDate;
  if (sortOrder === 'asc') {
    Object.keys(sortQuery).forEach(key => {
      sortQuery[key] = sortQuery[key] * -1;
    });
  }

  const users = await User.find(query)
    .sort(sortQuery)
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum)
    .lean();

  const total = await User.countDocuments(query);

  const formattedUsers = users.map(user => ({
    id: user._id,
    name: user.name,
    phoneNumber: user.phoneNumber,
    email: user.email,
    greenCredits: user.greenCredits,
    totalWasteSubmitted: user.totalWasteSubmitted,
    currentRank: user.stats?.rank || 'Bronze',
    totalSubmissions: user.stats?.totalSubmissions || 0,
    registrationDate: user.registrationDate,
    lastActive: user.lastActive,
    isActive: user.isActive,
    qrCode: user.qrCode
  }));

  sendPaginatedResponse(res, 200, formattedUsers, {
    page: pageNum,
    limit: limitNum,
    total
  }, 'Users retrieved successfully');
}));

// PUT /api/admin/users/:id - Update user (admin only)
router.put('/users/:id', requirePermission('users', 'update'), catchAsync(async (req, res) => {
  const { isActive, greenCredits, notes } = req.body;

  const user = await User.findById(req.params.id);

  if (!user) {
    return sendError(res, 404, 'User not found');
  }

  const updateData = {};
  
  if (isActive !== undefined) {
    updateData.isActive = isActive;
  }

  // Handle credit adjustment
  if (greenCredits !== undefined) {
    const creditDifference = greenCredits - user.greenCredits;
    
    if (creditDifference !== 0) {
      updateData.greenCredits = greenCredits;
      
      // Create adjustment transaction
      await Transaction.create({
        userId: user._id,
        type: 'adjustment',
        points: creditDifference,
        description: `Admin credit adjustment: ${notes || 'No reason provided'}`,
        relatedId: user._id,
        relatedModel: 'User',
        balanceBefore: user.greenCredits,
        balanceAfter: greenCredits,
        metadata: {
          reason: notes,
          adminId: req.adminId
        },
        status: 'completed'
      });
    }
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  );

  sendResponse(res, 200, {
    id: updatedUser._id,
    name: updatedUser.name,
    phoneNumber: updatedUser.phoneNumber,
    greenCredits: updatedUser.greenCredits,
    isActive: updatedUser.isActive,
    currentRank: updatedUser.currentRank
  }, 'User updated successfully');
}));

// GET /api/admin/submissions - Get submissions for verification
router.get('/submissions', requirePermission('waste', 'read'), catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    status = 'pending',
    boothId,
    userId,
    wasteType,
    startDate,
    endDate
  } = req.query;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);

  // Build query
  const query = {};

  if (status) query.status = status;
  if (boothId) query.boothId = boothId;
  if (userId) query.userId = userId;
  if (wasteType) query.wasteType = wasteType;

  if (startDate || endDate) {
    query.submissionDate = {};
    if (startDate) query.submissionDate.$gte = new Date(startDate);
    if (endDate) query.submissionDate.$lte = new Date(endDate);
  }

  // Filter by assigned booths for booth operators
  if (req.admin.role === 'booth_operator') {
    const assignedBoothIds = req.admin.assignedBooths.map(booth => booth._id);
    query.boothId = { $in: assignedBoothIds };
  }

  const submissions = await WasteSubmission.find(query)
    .populate('userId', 'name phoneNumber')
    .populate('boothId', 'name location.address')
    .populate('verifiedBy', 'fullName')
    .sort({ submissionDate: status === 'pending' ? 1 : -1 }) // Oldest pending first, newest others first
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum)
    .lean();

  const total = await WasteSubmission.countDocuments(query);

  const formattedSubmissions = submissions.map(sub => ({
    id: sub._id,
    user: {
      id: sub.userId._id,
      name: sub.userId.name,
      phoneNumber: sub.userId.phoneNumber
    },
    booth: {
      id: sub.boothId._id,
      name: sub.boothId.name,
      address: sub.boothId.location.address
    },
    wasteType: sub.wasteType,
    quantity: sub.quantity,
    pointsEarned: sub.pointsEarned,
    status: sub.status,
    submissionDate: sub.submissionDate,
    verificationDate: sub.verificationDate,
    verifiedBy: sub.verifiedBy?.fullName,
    photos: sub.photos,
    notes: sub.notes,
    qualityScore: sub.qualityScore,
    qrCode: sub.qrCode,
    metadata: sub.metadata
  }));

  sendPaginatedResponse(res, 200, formattedSubmissions, {
    page: pageNum,
    limit: limitNum,
    total
  }, 'Submissions retrieved successfully');
}));

// GET /api/admin/analytics - Get detailed analytics
router.get('/analytics', requirePermission('analytics', 'read'), catchAsync(async (req, res) => {
  const { 
    period = '30d',
    groupBy = 'day', // day, week, month
    metric = 'submissions' // submissions, quantity, points, users
  } = req.query;

  const periodDays = parseInt(period.replace('d', ''));
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - periodDays);

  let groupFormat;
  switch (groupBy) {
    case 'week':
      groupFormat = '%Y-W%U';
      break;
    case 'month':
      groupFormat = '%Y-%m';
      break;
    default:
      groupFormat = '%Y-%m-%d';
  }

  // Get time series data
  const timeSeriesData = await WasteSubmission.aggregate([
    {
      $match: {
        submissionDate: { $gte: startDate },
        status: 'approved'
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: groupFormat, date: '$submissionDate' } },
        submissions: { $sum: 1 },
        quantity: { $sum: '$quantity' },
        points: { $sum: '$pointsEarned' },
        uniqueUsers: { $addToSet: '$userId' }
      }
    },
    {
      $addFields: {
        uniqueUserCount: { $size: '$uniqueUsers' }
      }
    },
    {
      $project: {
        uniqueUsers: 0 // Remove the array to reduce response size
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // Get comparative data (previous period)
  const prevStartDate = new Date(startDate);
  prevStartDate.setDate(prevStartDate.getDate() - periodDays);

  const [currentPeriodStats, previousPeriodStats] = await Promise.all([
    WasteSubmission.aggregate([
      {
        $match: {
          submissionDate: { $gte: startDate },
          status: 'approved'
        }
      },
      {
        $group: {
          _id: null,
          totalSubmissions: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
          totalPoints: { $sum: '$pointsEarned' },
          uniqueUsers: { $addToSet: '$userId' }
        }
      },
      {
        $addFields: {
          uniqueUserCount: { $size: '$uniqueUsers' }
        }
      }
    ]),
    WasteSubmission.aggregate([
      {
        $match: {
          submissionDate: { $gte: prevStartDate, $lt: startDate },
          status: 'approved'
        }
      },
      {
        $group: {
          _id: null,
          totalSubmissions: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
          totalPoints: { $sum: '$pointsEarned' },
          uniqueUsers: { $addToSet: '$userId' }
        }
      },
      {
        $addFields: {
          uniqueUserCount: { $size: '$uniqueUsers' }
        }
      }
    ])
  ]);

  const current = currentPeriodStats[0] || { totalSubmissions: 0, totalQuantity: 0, totalPoints: 0, uniqueUserCount: 0 };
  const previous = previousPeriodStats[0] || { totalSubmissions: 0, totalQuantity: 0, totalPoints: 0, uniqueUserCount: 0 };

  // Calculate growth rates
  const calculateGrowthRate = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous * 100).toFixed(1);
  };

  const analytics = {
    period: {
      days: periodDays,
      startDate,
      endDate: new Date(),
      groupBy
    },
    timeSeries: timeSeriesData,
    summary: {
      current: {
        submissions: current.totalSubmissions,
        quantity: current.totalQuantity,
        points: current.totalPoints,
        uniqueUsers: current.uniqueUserCount
      },
      previous: {
        submissions: previous.totalSubmissions,
        quantity: previous.totalQuantity,
        points: previous.totalPoints,
        uniqueUsers: previous.uniqueUserCount
      },
      growth: {
        submissions: calculateGrowthRate(current.totalSubmissions, previous.totalSubmissions),
        quantity: calculateGrowthRate(current.totalQuantity, previous.totalQuantity),
        points: calculateGrowthRate(current.totalPoints, previous.totalPoints),
        uniqueUsers: calculateGrowthRate(current.uniqueUserCount, previous.uniqueUserCount)
      }
    }
  };

  sendResponse(res, 200, analytics, 'Analytics data retrieved successfully');
}));

// POST /api/admin/broadcast - Send broadcast notification (super admin only)
router.post('/broadcast', requirePermission('system', 'update'), catchAsync(async (req, res) => {
  const { title, message, targetUsers, priority = 'normal' } = req.body;

  if (!title || !message) {
    return sendError(res, 400, 'Title and message are required');
  }

  // In a real implementation, this would integrate with a notification service
  // For now, we'll just log the broadcast
  const broadcastData = {
    title,
    message,
    targetUsers: targetUsers || 'all',
    priority,
    sentBy: req.admin.fullName,
    sentAt: new Date()
  };

  console.log('Broadcast notification:', broadcastData);

  sendResponse(res, 200, broadcastData, 'Broadcast notification sent successfully');
}));

// GET /api/admin/system-info - Get system information
router.get('/system-info', requirePermission('system', 'read'), catchAsync(async (req, res) => {
  const systemInfo = {
    version: process.env.APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    nodeVersion: process.version,
    lastRestart: new Date(Date.now() - process.uptime() * 1000),
    databaseStatus: 'connected', // In real app, check actual DB connection
    apiVersion: 'v1',
    features: {
      qrScanning: true,
      mobileApp: true,
      realTimeNotifications: false,
      analytics: true,
      multiLanguage: true
    }
  };

  sendResponse(res, 200, systemInfo, 'System information retrieved successfully');
}));

export default router;
