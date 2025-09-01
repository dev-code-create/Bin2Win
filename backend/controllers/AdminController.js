import Admin from '../models/Admin.js';
import User from '../models/User.js';
import WasteSubmission from '../models/WasteSubmission.js';
import CollectionBooth from '../models/CollectionBooth.js';
import Reward from '../models/Reward.js';
import Transaction from '../models/Transaction.js';
import mongoose from 'mongoose';

class AdminController {
  // Get admin dashboard data
  async getDashboard(req, res) {
    try {
      const adminId = req.user.adminId;

      // Get admin details
      const admin = await Admin.findById(adminId)
        .populate('assignedBooths', 'name location status')
        .select('-password');

      if (!admin) {
        return res.status(404).json({
          success: false,
          message: 'Admin not found'
        });
      }

      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Get system statistics
      const systemStats = await this.getSystemStatistics();

      // Get pending submissions count
      const pendingSubmissions = await WasteSubmission.countDocuments({
        status: 'pending'
      });

      // Get today's statistics
      const todayStats = await WasteSubmission.aggregate([
        {
          $match: {
            createdAt: { $gte: startOfDay },
            status: 'approved'
          }
        },
        {
          $group: {
            _id: null,
            submissions: { $sum: 1 },
            totalWeight: { $sum: '$quantity' },
            totalPoints: { $sum: '$pointsEarned' }
          }
        }
      ]);

      // Get recent activity
      const recentSubmissions = await WasteSubmission.find({
        status: 'pending'
      })
      .populate('userId', 'name username')
      .populate('boothId', 'name location')
      .sort({ createdAt: -1 })
      .limit(10);

      // Get active users count
      const activeUsers = await User.countDocuments({
        isActive: true,
        lastActive: { $gte: startOfWeek }
      });

      // Get booth status summary
      const boothStats = await CollectionBooth.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const dashboardData = {
        admin: {
          id: admin._id,
          username: admin.username,
          fullName: admin.fullName,
          role: admin.role,
          permissions: admin.allPermissions,
          assignedBooths: admin.assignedBooths
        },
        statistics: {
          system: systemStats,
          today: todayStats[0] || { submissions: 0, totalWeight: 0, totalPoints: 0 },
          pending: {
            submissions: pendingSubmissions
          },
          users: {
            total: systemStats.totalUsers,
            active: activeUsers
          },
          booths: boothStats.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {})
        },
        recentActivity: recentSubmissions.map(submission => ({
          id: submission._id,
          user: submission.userId,
          booth: submission.boothId,
          wasteType: submission.wasteType,
          quantity: submission.quantity,
          submittedAt: submission.createdAt
        }))
      };

      res.json({
        success: true,
        data: dashboardData
      });
    } catch (error) {
      console.error('❌ Get admin dashboard error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get dashboard data'
      });
    }
  }

  // Get system statistics
  async getSystemStatistics() {
    try {
      const [
        totalUsers,
        totalSubmissions,
        totalBooths,
        totalRewards,
        totalTransactions
      ] = await Promise.all([
        User.countDocuments({ isActive: true }),
        WasteSubmission.countDocuments({ status: 'approved' }),
        CollectionBooth.countDocuments({ isActive: true }),
        Reward.countDocuments({ isActive: true }),
        Transaction.countDocuments({ status: 'completed' })
      ]);

      // Get total waste collected
      const wasteStats = await WasteSubmission.aggregate([
        {
          $match: { status: 'approved' }
        },
        {
          $group: {
            _id: null,
            totalWeight: { $sum: '$quantity' },
            totalPoints: { $sum: '$pointsEarned' }
          }
        }
      ]);

      return {
        totalUsers,
        totalSubmissions,
        totalBooths,
        totalRewards,
        totalTransactions,
        totalWasteCollected: wasteStats[0]?.totalWeight || 0,
        totalPointsEarned: wasteStats[0]?.totalPoints || 0
      };
    } catch (error) {
      console.error('❌ Get system statistics error:', error);
      return {
        totalUsers: 0,
        totalSubmissions: 0,
        totalBooths: 0,
        totalRewards: 0,
        totalTransactions: 0,
        totalWasteCollected: 0,
        totalPointsEarned: 0
      };
    }
  }

  // Get analytics data
  async getAnalytics(req, res) {
    try {
      const { period = 'month', type = 'waste' } = req.query;

      let dateFilter = {};
      const now = new Date();

      switch (period) {
        case 'week':
          dateFilter = { 
            createdAt: { 
              $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) 
            } 
          };
          break;
        case 'month':
          dateFilter = { 
            createdAt: { 
              $gte: new Date(now.getFullYear(), now.getMonth(), 1) 
            } 
          };
          break;
        case 'year':
          dateFilter = { 
            createdAt: { 
              $gte: new Date(now.getFullYear(), 0, 1) 
            } 
          };
          break;
      }

      let analyticsData = {};

      switch (type) {
        case 'waste':
          analyticsData = await this.getWasteAnalytics(dateFilter);
          break;
        case 'users':
          analyticsData = await this.getUserAnalytics(dateFilter);
          break;
        case 'booths':
          analyticsData = await this.getBoothAnalytics(dateFilter);
          break;
        case 'rewards':
          analyticsData = await this.getRewardAnalytics(dateFilter);
          break;
        default:
          analyticsData = await this.getWasteAnalytics(dateFilter);
      }

      res.json({
        success: true,
        data: {
          period,
          type,
          analytics: analyticsData
        }
      });
    } catch (error) {
      console.error('❌ Get analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get analytics data'
      });
    }
  }

  // Get waste analytics
  async getWasteAnalytics(dateFilter) {
    const [wasteByType, wasteByBooth, dailyTrend, statusBreakdown] = await Promise.all([
      // Waste by type
      WasteSubmission.aggregate([
        {
          $match: { 
            status: 'approved',
            ...dateFilter 
          }
        },
        {
          $group: {
            _id: '$wasteType',
            count: { $sum: 1 },
            totalWeight: { $sum: '$quantity' },
            totalPoints: { $sum: '$pointsEarned' }
          }
        },
        { $sort: { totalWeight: -1 } }
      ]),

      // Waste by booth
      WasteSubmission.aggregate([
        {
          $match: { 
            status: 'approved',
            ...dateFilter 
          }
        },
        {
          $group: {
            _id: '$boothId',
            count: { $sum: 1 },
            totalWeight: { $sum: '$quantity' }
          }
        },
        {
          $lookup: {
            from: 'collectionbooths',
            localField: '_id',
            foreignField: '_id',
            as: 'booth'
          }
        },
        { $unwind: '$booth' },
        { $sort: { totalWeight: -1 } },
        { $limit: 10 }
      ]),

      // Daily trend
      WasteSubmission.aggregate([
        {
          $match: { 
            status: 'approved',
            ...dateFilter 
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' }
            },
            submissions: { $sum: 1 },
            weight: { $sum: '$quantity' },
            points: { $sum: '$pointsEarned' }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
      ]),

      // Status breakdown
      WasteSubmission.aggregate([
        {
          $match: dateFilter
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    return {
      wasteByType,
      wasteByBooth,
      dailyTrend,
      statusBreakdown
    };
  }

  // Get user analytics
  async getUserAnalytics(dateFilter) {
    const [userRegistrations, activeUsers, usersByCredits] = await Promise.all([
      // User registrations over time
      User.aggregate([
        {
          $match: {
            registrationDate: dateFilter.createdAt || { $exists: true }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$registrationDate' },
              month: { $month: '$registrationDate' },
              day: { $dayOfMonth: '$registrationDate' }
            },
            newUsers: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
      ]),

      // Active users
      User.aggregate([
        {
          $match: {
            lastActive: dateFilter.createdAt || { $exists: true },
            isActive: true
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$lastActive' },
              month: { $month: '$lastActive' },
              day: { $dayOfMonth: '$lastActive' }
            },
            activeUsers: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
      ]),

      // Users by green credits range
      User.aggregate([
        {
          $match: { isActive: true }
        },
        {
          $bucket: {
            groupBy: '$greenCredits',
            boundaries: [0, 100, 500, 1000, 5000, 10000],
            default: '10000+',
            output: {
              count: { $sum: 1 },
              avgCredits: { $avg: '$greenCredits' }
            }
          }
        }
      ])
    ]);

    return {
      userRegistrations,
      activeUsers,
      usersByCredits
    };
  }

  // Get booth analytics
  async getBoothAnalytics(dateFilter) {
    const [boothUtilization, boothCapacity, boothPerformance] = await Promise.all([
      // Booth utilization
      WasteSubmission.aggregate([
        {
          $match: {
            status: 'approved',
            ...dateFilter
          }
        },
        {
          $group: {
            _id: '$boothId',
            submissions: { $sum: 1 },
            totalWeight: { $sum: '$quantity' }
          }
        },
        {
          $lookup: {
            from: 'collectionbooths',
            localField: '_id',
            foreignField: '_id',
            as: 'booth'
          }
        },
        { $unwind: '$booth' },
        {
          $project: {
            boothName: '$booth.name',
            location: '$booth.location',
            submissions: 1,
            totalWeight: 1,
            utilizationRate: {
              $multiply: [
                { $divide: ['$booth.currentCapacity', '$booth.maxCapacity'] },
                100
              ]
            }
          }
        },
        { $sort: { submissions: -1 } }
      ]),

      // Booth capacity overview
      CollectionBooth.aggregate([
        {
          $match: { isActive: true }
        },
        {
          $project: {
            name: 1,
            status: 1,
            capacityPercentage: {
              $multiply: [
                { $divide: ['$currentCapacity', '$maxCapacity'] },
                100
              ]
            },
            availableCapacity: { $subtract: ['$maxCapacity', '$currentCapacity'] }
          }
        },
        { $sort: { capacityPercentage: -1 } }
      ]),

      // Booth performance
      CollectionBooth.aggregate([
        {
          $lookup: {
            from: 'wastesubmissions',
            let: { boothId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$boothId', '$$boothId'] },
                  status: 'approved',
                  ...dateFilter
                }
              }
            ],
            as: 'submissions'
          }
        },
        {
          $project: {
            name: 1,
            location: 1,
            status: 1,
            totalSubmissions: { $size: '$submissions' },
            totalWeight: { $sum: '$submissions.quantity' },
            avgWeightPerSubmission: { $avg: '$submissions.quantity' }
          }
        },
        { $sort: { totalWeight: -1 } }
      ])
    ]);

    return {
      boothUtilization,
      boothCapacity,
      boothPerformance
    };
  }

  // Get reward analytics
  async getRewardAnalytics(dateFilter) {
    const [popularRewards, redemptionTrend, categoryBreakdown] = await Promise.all([
      // Most popular rewards
      Transaction.aggregate([
        {
          $match: {
            type: 'spent',
            status: 'completed',
            relatedReward: { $exists: true },
            ...dateFilter
          }
        },
        {
          $group: {
            _id: '$relatedReward',
            redemptions: { $sum: 1 },
            totalPointsSpent: { $sum: '$amount' }
          }
        },
        {
          $lookup: {
            from: 'rewards',
            localField: '_id',
            foreignField: '_id',
            as: 'reward'
          }
        },
        { $unwind: '$reward' },
        {
          $project: {
            rewardName: '$reward.name',
            category: '$reward.category',
            redemptions: 1,
            totalPointsSpent: 1
          }
        },
        { $sort: { redemptions: -1 } },
        { $limit: 10 }
      ]),

      // Redemption trend
      Transaction.aggregate([
        {
          $match: {
            type: 'spent',
            status: 'completed',
            relatedReward: { $exists: true },
            ...dateFilter
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' }
            },
            redemptions: { $sum: 1 },
            pointsSpent: { $sum: '$amount' }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
      ]),

      // Category breakdown
      Transaction.aggregate([
        {
          $match: {
            type: 'spent',
            status: 'completed',
            relatedReward: { $exists: true },
            ...dateFilter
          }
        },
        {
          $lookup: {
            from: 'rewards',
            localField: 'relatedReward',
            foreignField: '_id',
            as: 'reward'
          }
        },
        { $unwind: '$reward' },
        {
          $group: {
            _id: '$reward.category',
            redemptions: { $sum: 1 },
            totalPointsSpent: { $sum: '$amount' }
          }
        },
        { $sort: { redemptions: -1 } }
      ])
    ]);

    return {
      popularRewards,
      redemptionTrend,
      categoryBreakdown
    };
  }

  // Get all users (with pagination and filters)
  async getAllUsers(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        status,
        sortBy = 'registrationDate',
        sortOrder = 'desc'
      } = req.query;

      // Build filter
      const filter = {};

      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { username: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }

      if (status) {
        filter.isActive = status === 'active';
      }

      // Sort options
      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Get users with pagination
      const users = await User.find(filter)
        .select('-password')
        .sort(sortOptions)
        .limit(limit * 1)
        .skip((page - 1) * limit);

      // Get total count
      const total = await User.countDocuments(filter);

      res.json({
        success: true,
        data: {
          users: users.map(user => ({
            id: user._id,
            username: user.username,
            name: user.name,
            email: user.email,
            phoneNumber: user.phoneNumber,
            greenCredits: user.greenCredits,
            totalWasteSubmitted: user.totalWasteSubmitted,
            currentRank: user.currentRank,
            isActive: user.isActive,
            registrationDate: user.registrationDate,
            lastActive: user.lastActive
          })),
          pagination: {
            current: parseInt(page),
            pages: Math.ceil(total / limit),
            total,
            limit: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('❌ Get all users error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get users'
      });
    }
  }

  // Update user status (activate/deactivate)
  async updateUserStatus(req, res) {
    try {
      const { userId } = req.params;
      const { isActive } = req.body;

      const user = await User.findByIdAndUpdate(
        userId,
        { isActive },
        { new: true }
      ).select('-password');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
        data: { user }
      });
    } catch (error) {
      console.error('❌ Update user status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update user status'
      });
    }
  }

  // Get pending submissions for approval
  async getPendingSubmissions(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        wasteType,
        boothId
      } = req.query;

      // Build filter
      const filter = { status: 'pending' };

      if (wasteType) {
        filter.wasteType = wasteType;
      }

      if (boothId) {
        filter.boothId = boothId;
      }

      // Get pending submissions with pagination
      const submissions = await WasteSubmission.find(filter)
        .populate('userId', 'name username email')
        .populate('boothId', 'name location address')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      // Get total count
      const total = await WasteSubmission.countDocuments(filter);

      res.json({
        success: true,
        data: {
          submissions: submissions.map(submission => ({
            id: submission._id,
            user: submission.userId,
            booth: submission.boothId,
            wasteType: submission.wasteType,
            quantity: submission.quantity,
            pointsEarned: submission.pointsEarned,
            photos: submission.photos,
            description: submission.description,
            submittedAt: submission.createdAt,
            metadata: submission.metadata
          })),
          pagination: {
            current: parseInt(page),
            pages: Math.ceil(total / limit),
            total,
            limit: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('❌ Get pending submissions error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get pending submissions'
      });
    }
  }

  // Export data
  async exportData(req, res) {
    try {
      const { type, format = 'json', startDate, endDate } = req.query;

      let dateFilter = {};
      if (startDate || endDate) {
        dateFilter.createdAt = {};
        if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
        if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
      }

      let data = [];
      let filename = '';

      switch (type) {
        case 'users':
          data = await User.find(dateFilter).select('-password').lean();
          filename = `users_export_${Date.now()}`;
          break;
        
        case 'submissions':
          data = await WasteSubmission.find(dateFilter)
            .populate('userId', 'name username')
            .populate('boothId', 'name location')
            .lean();
          filename = `submissions_export_${Date.now()}`;
          break;
        
        case 'transactions':
          data = await Transaction.find(dateFilter)
            .populate('userId', 'name username')
            .lean();
          filename = `transactions_export_${Date.now()}`;
          break;
        
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid export type'
          });
      }

      if (format === 'csv') {
        // Convert to CSV format
        const csv = this.convertToCSV(data);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
        res.send(csv);
      } else {
        // JSON format
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
        res.json({
          success: true,
          data,
          exportedAt: new Date(),
          totalRecords: data.length
        });
      }
    } catch (error) {
      console.error('❌ Export data error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export data'
      });
    }
  }

  // Helper: Convert data to CSV
  convertToCSV(data) {
    if (!data || data.length === 0) {
      return '';
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          if (typeof value === 'object' && value !== null) {
            return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
          }
          return `"${String(value || '').replace(/"/g, '""')}"`;
        }).join(',')
      )
    ].join('\n');

    return csvContent;
  }
}

export default new AdminController();
