import User from '../models/User.js';
import WasteSubmission from '../models/WasteSubmission.js';
import Transaction from '../models/Transaction.js';
import CollectionBooth from '../models/CollectionBooth.js';
import QRCodeGenerator from '../utils/qrCodeGenerator.js';
import mongoose from 'mongoose';

class UserController {
  // Get user profile
  async getProfile(req, res) {
    try {
      const user = await User.findById(req.user.userId)
        .select('-password')
        .populate('preferences');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: {
          user: {
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
            lastActive: user.lastActive,
            isActive: user.isActive
          }
        }
      });
    } catch (error) {
      console.error('❌ Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user profile'
      });
    }
  }

  // Update user profile
  async updateProfile(req, res) {
    try {
      const { name, email, phoneNumber, preferences } = req.body;
      const userId = req.user.userId;

      // Validate email if provided
      if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return res.status(400).json({
            success: false,
            message: 'Please provide a valid email address'
          });
        }

        // Check if email is already taken by another user
        const existingUser = await User.findOne({ 
          email, 
          _id: { $ne: userId } 
        });
        
        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: 'Email is already taken by another user'
          });
        }
      }

      // Validate phone number if provided
      if (phoneNumber) {
        const phoneRegex = /^\+?[1-9]\d{1,14}$/;
        if (!phoneRegex.test(phoneNumber)) {
          return res.status(400).json({
            success: false,
            message: 'Please provide a valid phone number'
          });
        }
      }

      const updateData = {};
      if (name) updateData.name = name.trim();
      if (email) updateData.email = email;
      if (phoneNumber) updateData.phoneNumber = phoneNumber;
      if (preferences) updateData.preferences = preferences;
      
      updateData.lastActive = new Date();

      const user = await User.findByIdAndUpdate(
        userId,
        updateData,
        { 
          new: true, 
          runValidators: true 
        }
      ).select('-password');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: { user }
      });
    } catch (error) {
      console.error('❌ Update profile error:', error);
      
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'Email or phone number already exists'
        });
      }
      
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update profile'
      });
    }
  }

  // Get user dashboard data
  async getDashboard(req, res) {
    try {
      const userId = req.user.userId;

      // Get user basic info
      const user = await User.findById(userId).select('-password');
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Get recent waste submissions
      const recentSubmissions = await WasteSubmission.find({ 
        userId,
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
      })
      .populate('boothId', 'name location')
      .sort({ createdAt: -1 })
      .limit(5);

      // Get recent transactions
      const recentTransactions = await Transaction.find({ userId })
        .sort({ createdAt: -1 })
        .limit(10);

      // Calculate stats for this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const monthlyStats = await WasteSubmission.aggregate([
        {
          $match: {
            userId: user._id,
            createdAt: { $gte: startOfMonth },
            status: 'approved'
          }
        },
        {
          $group: {
            _id: null,
            totalSubmissions: { $sum: 1 },
            totalWeight: { $sum: '$quantity' },
            totalPoints: { $sum: '$pointsEarned' }
          }
        }
      ]);

      // Get leaderboard position
      const leaderboardPosition = await User.getUserRank(userId);

      // Get nearby booths
      const nearbyBooths = await CollectionBooth.find({
        isActive: true,
        status: 'operational'
      })
      .limit(5)
      .sort({ name: 1 });

      // Prepare dashboard data
      const dashboardData = {
        user: {
          id: user._id,
          name: user.name,
          greenCredits: user.greenCredits,
          currentRank: user.currentRank,
          qrCode: user.qrCode,
          totalWasteSubmitted: user.totalWasteSubmitted
        },
        stats: {
          monthly: monthlyStats[0] || {
            totalSubmissions: 0,
            totalWeight: 0,
            totalPoints: 0
          },
          overall: user.stats,
          leaderboardPosition: leaderboardPosition || 'Unranked'
        },
        recentSubmissions: recentSubmissions.map(submission => ({
          id: submission._id,
          wasteType: submission.wasteType,
          quantity: submission.quantity,
          pointsEarned: submission.pointsEarned,
          status: submission.status,
          booth: submission.boothId,
          submittedAt: submission.createdAt
        })),
        recentTransactions: recentTransactions.map(transaction => ({
          id: transaction._id,
          type: transaction.type,
          amount: transaction.amount,
          description: transaction.description,
          createdAt: transaction.createdAt
        })),
        nearbyBooths: nearbyBooths.map(booth => ({
          id: booth._id,
          name: booth.name,
          location: booth.location,
          status: booth.status,
          operatingHours: booth.operatingHours
        }))
      };

      res.json({
        success: true,
        data: dashboardData
      });
    } catch (error) {
      console.error('❌ Get dashboard error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get dashboard data'
      });
    }
  }

  // Get user statistics
  async getStatistics(req, res) {
    try {
      const userId = req.user.userId;
      const { period = 'all' } = req.query; // all, year, month, week

      let dateFilter = {};
      const now = new Date();

      switch (period) {
        case 'week':
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - 7);
          dateFilter = { createdAt: { $gte: weekStart } };
          break;
        
        case 'month':
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          dateFilter = { createdAt: { $gte: monthStart } };
          break;
        
        case 'year':
          const yearStart = new Date(now.getFullYear(), 0, 1);
          dateFilter = { createdAt: { $gte: yearStart } };
          break;
        
        default:
          // 'all' - no date filter
          break;
      }

      // Get waste submission statistics
      const wasteStats = await WasteSubmission.aggregate([
        {
          $match: {
            userId: mongoose.Types.ObjectId(userId),
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
        {
          $sort: { totalWeight: -1 }
        }
      ]);

      // Get monthly trend for the year
      const monthlyTrend = await WasteSubmission.aggregate([
        {
          $match: {
            userId: mongoose.Types.ObjectId(userId),
            status: 'approved',
            createdAt: { 
              $gte: new Date(now.getFullYear(), 0, 1),
              $lte: now
            }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            submissions: { $sum: 1 },
            weight: { $sum: '$quantity' },
            points: { $sum: '$pointsEarned' }
          }
        },
        {
          $sort: { '_id.year': 1, '_id.month': 1 }
        }
      ]);

      // Get overall totals
      const overallStats = await WasteSubmission.aggregate([
        {
          $match: {
            userId: mongoose.Types.ObjectId(userId),
            status: 'approved',
            ...dateFilter
          }
        },
        {
          $group: {
            _id: null,
            totalSubmissions: { $sum: 1 },
            totalWeight: { $sum: '$quantity' },
            totalPoints: { $sum: '$pointsEarned' },
            avgPointsPerSubmission: { $avg: '$pointsEarned' },
            avgWeightPerSubmission: { $avg: '$quantity' }
          }
        }
      ]);

      // Get user rank
      const userRank = await User.getUserRank(userId);

      // Calculate environmental impact
      const environmentalImpact = {
        co2Saved: (overallStats[0]?.totalWeight || 0) * 0.5, // kg CO2 per kg waste
        treesEquivalent: Math.floor((overallStats[0]?.totalWeight || 0) / 20), // 1 tree per 20kg
        landfillDiverted: overallStats[0]?.totalWeight || 0
      };

      res.json({
        success: true,
        data: {
          period,
          overall: overallStats[0] || {
            totalSubmissions: 0,
            totalWeight: 0,
            totalPoints: 0,
            avgPointsPerSubmission: 0,
            avgWeightPerSubmission: 0
          },
          wasteBreakdown: wasteStats,
          monthlyTrend,
          rank: userRank,
          environmentalImpact
        }
      });
    } catch (error) {
      console.error('❌ Get statistics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user statistics'
      });
    }
  }

  // Get user's waste submission history
  async getWasteHistory(req, res) {
    try {
      const userId = req.user.userId;
      const { 
        page = 1, 
        limit = 20, 
        status, 
        wasteType, 
        startDate, 
        endDate 
      } = req.query;

      // Build filter
      const filter = { userId };

      if (status) {
        filter.status = status;
      }

      if (wasteType) {
        filter.wasteType = wasteType;
      }

      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(endDate);
      }

      // Get submissions with pagination
      const submissions = await WasteSubmission.find(filter)
        .populate('boothId', 'name location address')
        .populate('verifiedBy', 'fullName username')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      // Get total count for pagination
      const total = await WasteSubmission.countDocuments(filter);

      res.json({
        success: true,
        data: {
          submissions: submissions.map(submission => ({
            id: submission._id,
            wasteType: submission.wasteType,
            quantity: submission.quantity,
            pointsEarned: submission.pointsEarned,
            status: submission.status,
            qrCode: submission.qrCode,
            booth: submission.boothId,
            verifiedBy: submission.verifiedBy,
            verificationDate: submission.verificationDate,
            submittedAt: submission.createdAt,
            photos: submission.photos,
            notes: submission.notes,
            environmentalImpact: submission.environmentalImpact
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
      console.error('❌ Get waste history error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get waste history'
      });
    }
  }

  // Get user's transaction history
  async getTransactionHistory(req, res) {
    try {
      const userId = req.user.userId;
      const { 
        page = 1, 
        limit = 20, 
        type, 
        startDate, 
        endDate 
      } = req.query;

      // Build filter
      const filter = { userId };

      if (type) {
        filter.type = type;
      }

      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(endDate);
      }

      // Get transactions with pagination
      const transactions = await Transaction.find(filter)
        .populate('relatedSubmission', 'wasteType quantity')
        .populate('relatedReward', 'name category')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      // Get total count for pagination
      const total = await Transaction.countDocuments(filter);

      res.json({
        success: true,
        data: {
          transactions: transactions.map(transaction => ({
            id: transaction._id,
            type: transaction.type,
            amount: transaction.amount,
            description: transaction.description,
            status: transaction.status,
            relatedSubmission: transaction.relatedSubmission,
            relatedReward: transaction.relatedReward,
            metadata: transaction.metadata,
            createdAt: transaction.createdAt
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
      console.error('❌ Get transaction history error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get transaction history'
      });
    }
  }

  // Update user preferences
  async updatePreferences(req, res) {
    try {
      const userId = req.user.userId;
      const { preferences } = req.body;

      const user = await User.findByIdAndUpdate(
        userId,
        { 
          preferences,
          lastActive: new Date()
        },
        { 
          new: true, 
          runValidators: true 
        }
      ).select('-password');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        message: 'Preferences updated successfully',
        data: { 
          preferences: user.preferences 
        }
      });
    } catch (error) {
      console.error('❌ Update preferences error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update preferences'
      });
    }
  }

  // Get user QR code data
  async getUserQRCode(req, res) {
    try {
      const userId = req.user.userId;

      const user = await User.findById(userId).select('-password');
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Generate QR code data with additional metadata
      const qrData = QRCodeGenerator.generateQRData(user);

      res.json({
        success: true,
        data: {
          qrCode: user.qrCode,
          qrData: qrData.displayData,
          structuredData: qrData.structuredData,
          instructions: {
            title: 'Your Simhastha 2028 QR Code',
            description: 'Show this QR code to booth operators for waste collection',
            steps: [
              'Visit any Simhastha waste collection booth',
              'Show this QR code to the booth operator',
              'The operator will scan your code and weigh your waste',
              'Green credits will be automatically added to your account'
            ]
          }
        }
      });
    } catch (error) {
      console.error('❌ Get user QR code error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get QR code'
      });
    }
  }

  // Regenerate user QR code (in case of security concerns)
  async regenerateQRCode(req, res) {
    try {
      const userId = req.user.userId;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Generate new QR code
      const newQRCode = QRCodeGenerator.generateUserQRCode(user._id, user.username);
      
      // Update user with new QR code
      user.qrCode = newQRCode;
      user.lastActive = new Date();
      await user.save();

      // Generate new QR data
      const qrData = QRCodeGenerator.generateQRData(user);

      res.json({
        success: true,
        message: 'QR code regenerated successfully',
        data: {
          qrCode: newQRCode,
          qrData: qrData.displayData,
          structuredData: qrData.structuredData,
          warning: 'Your old QR code is no longer valid. Please use this new QR code for future waste submissions.'
        }
      });
    } catch (error) {
      console.error('❌ Regenerate QR code error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to regenerate QR code'
      });
    }
  }

  // Get user's activity timeline
  async getUserActivity(req, res) {
    try {
      const userId = req.user.userId;
      const { page = 1, limit = 20 } = req.query;

      // Get recent waste submissions
      const submissions = await WasteSubmission.find({ userId })
        .populate('boothId', 'name location')
        .populate('verifiedBy', 'fullName role')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      // Get recent transactions
      const transactions = await Transaction.find({ userId })
        .populate('relatedSubmission', 'wasteType quantity')
        .populate('relatedReward', 'name category')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      // Combine and sort by date
      const activities = [];

      submissions.forEach(submission => {
        activities.push({
          type: 'waste_submission',
          id: submission._id,
          date: submission.createdAt,
          data: {
            wasteType: submission.wasteType,
            quantity: submission.quantity,
            pointsEarned: submission.pointsEarned,
            status: submission.status,
            booth: submission.boothId,
            collectionMethod: submission.metadata?.submissionMethod || 'user_submission',
            collectedBy: submission.metadata?.collectedBy || 'Self'
          }
        });
      });

      transactions.forEach(transaction => {
        activities.push({
          type: 'transaction',
          id: transaction._id,
          date: transaction.createdAt,
          data: {
            type: transaction.type,
            amount: transaction.amount,
            description: transaction.description,
            status: transaction.status,
            relatedSubmission: transaction.relatedSubmission,
            relatedReward: transaction.relatedReward
          }
        });
      });

      // Sort by date (newest first)
      activities.sort((a, b) => new Date(b.date) - new Date(a.date));

      res.json({
        success: true,
        data: {
          activities: activities.slice(0, limit),
          pagination: {
            current: parseInt(page),
            limit: parseInt(limit),
            total: activities.length
          }
        }
      });
    } catch (error) {
      console.error('❌ Get user activity error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user activity'
      });
    }
  }

  // Deactivate user account
  async deactivateAccount(req, res) {
    try {
      const userId = req.user.userId;

      const user = await User.findByIdAndUpdate(
        userId,
        { 
          isActive: false,
          lastActive: new Date()
        },
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
        message: 'Account deactivated successfully'
      });
    } catch (error) {
      console.error('❌ Deactivate account error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to deactivate account'
      });
    }
  }
}

export default new UserController();
