import WasteSubmission from '../models/WasteSubmission.js';
import CollectionBooth from '../models/CollectionBooth.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

class WasteController {
  constructor() {
    // Configure multer for photo uploads
    this.storage = multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadPath = 'uploads/waste-photos';
        if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `waste-${uniqueSuffix}${path.extname(file.originalname)}`);
      }
    });

    this.upload = multer({
      storage: this.storage,
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
        files: 5 // Maximum 5 files
      },
      fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
          return cb(null, true);
        } else {
          cb(new Error('Only image files are allowed'));
        }
      }
    });
  }

  // Validate booth QR code
  async validateBoothQR(req, res) {
    try {
      const { qrCode } = req.body;

      if (!qrCode) {
        return res.status(400).json({
          success: false,
          message: 'QR code is required'
        });
      }

      // Find booth by QR code
      const booth = await CollectionBooth.findOne({ 
        qrCode,
        isActive: true 
      });

      if (!booth) {
        return res.status(404).json({
          success: false,
          message: 'Invalid QR code or booth not found'
        });
      }

      // Check if booth is operational
      if (booth.status !== 'operational') {
        return res.status(400).json({
          success: false,
          message: `Booth is currently ${booth.status}. Please try another booth.`
        });
      }

      // Check operating hours
      const now = new Date();
      const currentHour = now.getHours();
      const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.

      if (booth.operatingHours && booth.operatingHours.schedule) {
        const todaySchedule = booth.operatingHours.schedule.find(
          schedule => schedule.day === currentDay
        );

        if (!todaySchedule || !todaySchedule.isOpen) {
          return res.status(400).json({
            success: false,
            message: 'Booth is currently closed'
          });
        }

        const openHour = parseInt(todaySchedule.openTime.split(':')[0]);
        const closeHour = parseInt(todaySchedule.closeTime.split(':')[0]);

        if (currentHour < openHour || currentHour >= closeHour) {
          return res.status(400).json({
            success: false,
            message: `Booth operating hours: ${todaySchedule.openTime} - ${todaySchedule.closeTime}`
          });
        }
      }

      res.json({
        success: true,
        data: {
          booth: {
            id: booth._id,
            name: booth.name,
            location: booth.location,
            address: booth.address,
            acceptedWasteTypes: booth.acceptedWasteTypes,
            currentCapacity: booth.currentCapacity,
            maxCapacity: booth.maxCapacity,
            operatingHours: booth.operatingHours,
            contactInfo: booth.contactInfo
          }
        }
      });
    } catch (error) {
      console.error('❌ Validate booth QR error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to validate booth QR code'
      });
    }
  }

  // Submit waste
  async submitWaste(req, res) {
    try {
      const userId = req.user.userId;
      const { 
        boothId, 
        wasteType, 
        quantity, 
        description,
        metadata 
      } = req.body;

      // Validate required fields
      if (!boothId || !wasteType || !quantity) {
        return res.status(400).json({
          success: false,
          message: 'Booth ID, waste type, and quantity are required'
        });
      }

      // Validate quantity
      if (quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Quantity must be greater than 0'
        });
      }

      // Find and validate booth
      const booth = await CollectionBooth.findById(boothId);
      if (!booth || !booth.isActive || booth.status !== 'operational') {
        return res.status(400).json({
          success: false,
          message: 'Invalid or inactive booth'
        });
      }

      // Check if booth accepts this waste type
      if (!booth.acceptedWasteTypes.includes(wasteType)) {
        return res.status(400).json({
          success: false,
          message: `This booth does not accept ${wasteType}. Accepted types: ${booth.acceptedWasteTypes.join(', ')}`
        });
      }

      // Calculate points
      const pointsEarned = WasteSubmission.calculatePoints(wasteType, quantity);

      // Generate unique QR code for this submission
      const submissionQR = `WASTE_${Date.now()}_${userId}_${Math.random().toString(36).substr(2, 9)}`;

      // Process uploaded photos
      const photos = [];
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          photos.push({
            url: `/uploads/waste-photos/${file.filename}`,
            filename: file.filename,
            originalName: file.originalname,
            uploadDate: new Date()
          });
        }
      }

      // Create waste submission
      const submission = new WasteSubmission({
        userId,
        boothId,
        wasteType,
        quantity: parseFloat(quantity),
        pointsEarned,
        qrCode: submissionQR,
        description: description || '',
        photos,
        metadata: {
          deviceInfo: metadata?.deviceInfo || {},
          location: metadata?.location || {},
          weatherCondition: metadata?.weatherCondition || '',
          submissionMethod: 'mobile_app',
          ...metadata
        },
        status: 'pending'
      });

      await submission.save();

      // Update booth capacity
      await CollectionBooth.findByIdAndUpdate(boothId, {
        $inc: { currentCapacity: quantity }
      });

      // Create transaction record
      const transaction = new Transaction({
        userId,
        type: 'earned',
        amount: pointsEarned,
        description: `Green credits earned for ${wasteType} disposal`,
        status: 'pending',
        relatedSubmission: submission._id,
        metadata: {
          wasteType,
          quantity,
          boothId: booth._id,
          boothName: booth.name
        }
      });

      await transaction.save();

      // Populate booth information for response
      await submission.populate('boothId', 'name location address');

      res.status(201).json({
        success: true,
        message: 'Waste submission created successfully',
        data: {
          submission: {
            id: submission._id,
            wasteType: submission.wasteType,
            quantity: submission.quantity,
            pointsEarned: submission.pointsEarned,
            status: submission.status,
            qrCode: submission.qrCode,
            booth: submission.boothId,
            photos: submission.photos,
            submittedAt: submission.createdAt,
            description: submission.description
          },
          transaction: {
            id: transaction._id,
            type: transaction.type,
            amount: transaction.amount,
            status: transaction.status
          }
        }
      });
    } catch (error) {
      console.error('❌ Submit waste error:', error);
      
      // Clean up uploaded files if submission failed
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          fs.unlink(file.path, (err) => {
            if (err) console.error('Failed to clean up file:', file.path);
          });
        });
      }
      
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to submit waste'
      });
    }
  }

  // Get waste submission details
  async getSubmission(req, res) {
    try {
      const { submissionId } = req.params;
      const userId = req.user.userId;

      const submission = await WasteSubmission.findOne({
        _id: submissionId,
        userId
      })
      .populate('boothId', 'name location address contactInfo')
      .populate('verifiedBy', 'fullName username role');

      if (!submission) {
        return res.status(404).json({
          success: false,
          message: 'Waste submission not found'
        });
      }

      res.json({
        success: true,
        data: {
          submission: {
            id: submission._id,
            wasteType: submission.wasteType,
            quantity: submission.quantity,
            pointsEarned: submission.pointsEarned,
            status: submission.status,
            qrCode: submission.qrCode,
            booth: submission.boothId,
            photos: submission.photos,
            description: submission.description,
            notes: submission.notes,
            verifiedBy: submission.verifiedBy,
            verificationDate: submission.verificationDate,
            submittedAt: submission.createdAt,
            environmentalImpact: submission.environmentalImpact,
            qualityScore: submission.qualityScore,
            processing: submission.processing,
            metadata: submission.metadata
          }
        }
      });
    } catch (error) {
      console.error('❌ Get submission error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get waste submission'
      });
    }
  }

  // Get user's waste submissions
  async getUserSubmissions(req, res) {
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
        .populate('boothId', 'name location')
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
            wasteType: submission.wasteType,
            quantity: submission.quantity,
            pointsEarned: submission.pointsEarned,
            status: submission.status,
            booth: submission.boothId,
            submittedAt: submission.createdAt,
            photos: submission.photos.slice(0, 1) // Only first photo in list
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
      console.error('❌ Get user submissions error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get waste submissions'
      });
    }
  }

  // Get waste types and their point values
  async getWasteTypes(req, res) {
    try {
      const wasteTypes = [
        {
          type: 'plastic',
          name: 'Plastic',
          description: 'Plastic bottles, containers, bags',
          pointsPerKg: 10,
          category: 'recyclable',
          icon: '♻️'
        },
        {
          type: 'paper',
          name: 'Paper',
          description: 'Newspapers, cardboard, documents',
          pointsPerKg: 5,
          category: 'recyclable',
          icon: '📄'
        },
        {
          type: 'metal',
          name: 'Metal',
          description: 'Aluminum cans, steel containers',
          pointsPerKg: 15,
          category: 'recyclable',
          icon: '🥫'
        },
        {
          type: 'glass',
          name: 'Glass',
          description: 'Glass bottles, jars',
          pointsPerKg: 8,
          category: 'recyclable',
          icon: '🍶'
        },
        {
          type: 'organic',
          name: 'Organic Waste',
          description: 'Food scraps, garden waste',
          pointsPerKg: 3,
          category: 'biodegradable',
          icon: '🍃'
        },
        {
          type: 'electronic',
          name: 'E-Waste',
          description: 'Electronic devices, batteries',
          pointsPerKg: 25,
          category: 'hazardous',
          icon: '📱'
        },
        {
          type: 'textile',
          name: 'Textile',
          description: 'Clothes, fabric materials',
          pointsPerKg: 7,
          category: 'recyclable',
          icon: '👕'
        }
      ];

      res.json({
        success: true,
        data: { wasteTypes }
      });
    } catch (error) {
      console.error('❌ Get waste types error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get waste types'
      });
    }
  }

  // Get waste statistics
  async getWasteStats(req, res) {
    try {
      const { period = 'all', groupBy = 'type' } = req.query;

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
      }

      let groupField;
      switch (groupBy) {
        case 'type':
          groupField = '$wasteType';
          break;
        case 'booth':
          groupField = '$boothId';
          break;
        case 'status':
          groupField = '$status';
          break;
        default:
          groupField = '$wasteType';
      }

      const stats = await WasteSubmission.aggregate([
        {
          $match: {
            status: 'approved',
            ...dateFilter
          }
        },
        {
          $group: {
            _id: groupField,
            count: { $sum: 1 },
            totalWeight: { $sum: '$quantity' },
            totalPoints: { $sum: '$pointsEarned' },
            avgWeight: { $avg: '$quantity' }
          }
        },
        {
          $sort: { totalWeight: -1 }
        }
      ]);

      // If grouping by booth, populate booth information
      if (groupBy === 'booth') {
        await WasteSubmission.populate(stats, {
          path: '_id',
          select: 'name location'
        });
      }

      // Calculate totals
      const totals = stats.reduce((acc, item) => ({
        totalSubmissions: acc.totalSubmissions + item.count,
        totalWeight: acc.totalWeight + item.totalWeight,
        totalPoints: acc.totalPoints + item.totalPoints
      }), { totalSubmissions: 0, totalWeight: 0, totalPoints: 0 });

      res.json({
        success: true,
        data: {
          period,
          groupBy,
          stats,
          totals
        }
      });
    } catch (error) {
      console.error('❌ Get waste stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get waste statistics'
      });
    }
  }

  // Admin: Approve waste submission
  async approveSubmission(req, res) {
    try {
      const { submissionId } = req.params;
      const { notes, qualityScore } = req.body;
      const adminId = req.user.adminId;

      const submission = await WasteSubmission.findById(submissionId);
      
      if (!submission) {
        return res.status(404).json({
          success: false,
          message: 'Waste submission not found'
        });
      }

      if (submission.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Submission has already been processed'
        });
      }

      // Update submission
      submission.status = 'approved';
      submission.verifiedBy = adminId;
      submission.verificationDate = new Date();
      submission.notes = notes || '';
      submission.qualityScore = qualityScore || 0;
      
      await submission.save();

      // Update user's green credits
      await User.findByIdAndUpdate(submission.userId, {
        $inc: { 
          greenCredits: submission.pointsEarned,
          totalWasteSubmitted: submission.quantity
        }
      });

      // Update transaction status
      await Transaction.findOneAndUpdate(
        { relatedSubmission: submissionId },
        { status: 'completed' }
      );

      res.json({
        success: true,
        message: 'Waste submission approved successfully',
        data: { submission }
      });
    } catch (error) {
      console.error('❌ Approve submission error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to approve waste submission'
      });
    }
  }

  // Admin: Reject waste submission
  async rejectSubmission(req, res) {
    try {
      const { submissionId } = req.params;
      const { reason, notes } = req.body;
      const adminId = req.user.adminId;

      if (!reason) {
        return res.status(400).json({
          success: false,
          message: 'Rejection reason is required'
        });
      }

      const submission = await WasteSubmission.findById(submissionId);
      
      if (!submission) {
        return res.status(404).json({
          success: false,
          message: 'Waste submission not found'
        });
      }

      if (submission.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Submission has already been processed'
        });
      }

      // Update submission
      submission.status = 'rejected';
      submission.verifiedBy = adminId;
      submission.verificationDate = new Date();
      submission.notes = notes || reason;
      submission.metadata.rejectionReason = reason;
      
      await submission.save();

      // Update transaction status
      await Transaction.findOneAndUpdate(
        { relatedSubmission: submissionId },
        { status: 'cancelled' }
      );

      res.json({
        success: true,
        message: 'Waste submission rejected',
        data: { submission }
      });
    } catch (error) {
      console.error('❌ Reject submission error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reject waste submission'
      });
    }
  }

  // Admin: Scan user QR code and validate user
  async scanUserQR(req, res) {
    try {
      const { userQRCode } = req.body;
      const adminId = req.user.adminId;

      if (!userQRCode) {
        return res.status(400).json({
          success: false,
          message: 'User QR code is required'
        });
      }

      // Find user by QR code
      const user = await User.findOne({ 
        qrCode: userQRCode,
        isActive: true 
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Invalid user QR code or user not found'
        });
      }

      // Get admin's booth information
      const admin = await Admin.findById(adminId).populate('assignedBooths');
      if (!admin || !admin.assignedBooths || admin.assignedBooths.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Admin has no assigned booths'
        });
      }

      // For this example, use the first assigned booth
      const booth = admin.assignedBooths[0];

      res.json({
        success: true,
        message: 'User QR code validated successfully',
        data: {
          user: {
            id: user._id,
            name: user.name,
            username: user.username,
            greenCredits: user.greenCredits,
            totalWasteSubmitted: user.totalWasteSubmitted,
            currentRank: user.currentRank
          },
          booth: {
            id: booth._id,
            name: booth.name,
            location: booth.location,
            acceptedWasteTypes: booth.acceptedWasteTypes
          },
          admin: {
            id: admin._id,
            name: admin.fullName,
            role: admin.role
          }
        }
      });
    } catch (error) {
      console.error('❌ Scan user QR error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to scan user QR code'
      });
    }
  }

  // Admin: Submit waste collection on behalf of user
  async adminSubmitWaste(req, res) {
    try {
      const {
        userId,
        boothId,
        wasteType,
        quantity,
        notes
      } = req.body;
      const adminId = req.user.adminId;

      // Validate required fields
      if (!userId || !boothId || !wasteType || !quantity) {
        return res.status(400).json({
          success: false,
          message: 'User ID, booth ID, waste type, and quantity are required'
        });
      }

      // Validate quantity
      if (quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Quantity must be greater than 0'
        });
      }

      // Verify user exists and is active
      const user = await User.findById(userId);
      if (!user || !user.isActive) {
        return res.status(404).json({
          success: false,
          message: 'User not found or inactive'
        });
      }

      // Verify booth exists and admin has access
      const admin = await Admin.findById(adminId).populate('assignedBooths');
      const booth = await CollectionBooth.findById(boothId);
      
      if (!booth || !booth.isActive || booth.status !== 'operational') {
        return res.status(400).json({
          success: false,
          message: 'Invalid or inactive booth'
        });
      }

      // Check if admin has access to this booth
      const hasBoothAccess = admin.assignedBooths.some(
        assignedBooth => assignedBooth._id.toString() === boothId
      ) || admin.role === 'super_admin';

      if (!hasBoothAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You are not assigned to this booth.'
        });
      }

      // Check if booth accepts this waste type
      if (!booth.acceptedWasteTypes.includes(wasteType)) {
        return res.status(400).json({
          success: false,
          message: `This booth does not accept ${wasteType}. Accepted types: ${booth.acceptedWasteTypes.join(', ')}`
        });
      }

      // Calculate points
      const pointsEarned = WasteSubmission.calculatePoints(wasteType, quantity);

      // Generate unique submission ID
      const submissionQR = `ADMIN_WASTE_${Date.now()}_${userId}_${adminId}_${Math.random().toString(36).substr(2, 9)}`;

      // Start transaction for data consistency
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // Create waste submission (auto-approved since admin submitted)
        const submission = new WasteSubmission({
          userId,
          boothId,
          wasteType,
          quantity: parseFloat(quantity),
          pointsEarned,
          qrCode: submissionQR,
          description: `Admin collected waste - ${notes || ''}`,
          status: 'approved', // Auto-approve admin submissions
          verifiedBy: adminId,
          verificationDate: new Date(),
          notes: notes || '',
          metadata: {
            submissionMethod: 'admin_collection',
            collectedBy: admin.fullName,
            collectionDate: new Date(),
            boothName: booth.name
          }
        });

        await submission.save({ session });

        // Update user's green credits and total waste
        await User.findByIdAndUpdate(
          userId,
          {
            $inc: {
              greenCredits: pointsEarned,
              totalWasteSubmitted: quantity
            },
            lastActive: new Date()
          },
          { session }
        );

        // Update booth capacity
        await CollectionBooth.findByIdAndUpdate(
          boothId,
          {
            $inc: { currentCapacity: quantity }
          },
          { session }
        );

        // Create transaction record
        const transaction = new Transaction({
          userId,
          type: 'earned',
          amount: pointsEarned,
          description: `Green credits earned for ${wasteType} disposal (Admin collected)`,
          status: 'completed', // Auto-complete admin submissions
          relatedSubmission: submission._id,
          metadata: {
            wasteType,
            quantity,
            boothId: booth._id,
            boothName: booth.name,
            collectedBy: admin.fullName,
            collectionMethod: 'admin_scan'
          }
        });

        await transaction.save({ session });

        await session.commitTransaction();

        // Get updated user data
        const updatedUser = await User.findById(userId);

        res.json({
          success: true,
          message: 'Waste collection recorded successfully! Credits have been added to user account.',
          data: {
            submission: {
              id: submission._id,
              wasteType: submission.wasteType,
              quantity: submission.quantity,
              pointsEarned: submission.pointsEarned,
              status: submission.status,
              collectedAt: submission.createdAt,
              collectedBy: admin.fullName
            },
            user: {
              id: updatedUser._id,
              name: updatedUser.name,
              newCreditsBalance: updatedUser.greenCredits,
              creditsEarned: pointsEarned,
              totalWasteSubmitted: updatedUser.totalWasteSubmitted
            },
            transaction: {
              id: transaction._id,
              type: transaction.type,
              amount: transaction.amount,
              status: transaction.status
            }
          }
        });

      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }

    } catch (error) {
      console.error('❌ Admin submit waste error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to submit waste collection'
      });
    }
  }

  // Admin: Get recent collections for the booth
  async getAdminCollections(req, res) {
    try {
      const adminId = req.user.adminId;
      const { 
        page = 1, 
        limit = 20, 
        boothId,
        startDate,
        endDate
      } = req.query;

      // Get admin's assigned booths
      const admin = await Admin.findById(adminId).populate('assignedBooths');
      if (!admin) {
        return res.status(404).json({
          success: false,
          message: 'Admin not found'
        });
      }

      let boothFilter = {};
      if (boothId) {
        // Check if admin has access to specified booth
        const hasAccess = admin.assignedBooths.some(
          booth => booth._id.toString() === boothId
        ) || admin.role === 'super_admin';

        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            message: 'Access denied to this booth'
          });
        }

        boothFilter.boothId = boothId;
      } else {
        // Get submissions from all assigned booths
        const boothIds = admin.assignedBooths.map(booth => booth._id);
        boothFilter.boothId = { $in: boothIds };
      }

      // Build filter
      const filter = {
        ...boothFilter,
        verifiedBy: adminId,
        'metadata.submissionMethod': 'admin_collection'
      };

      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(endDate);
      }

      // Get submissions with pagination
      const submissions = await WasteSubmission.find(filter)
        .populate('userId', 'name username')
        .populate('boothId', 'name location')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      // Get total count
      const total = await WasteSubmission.countDocuments(filter);

      // Calculate summary stats
      const summaryStats = await WasteSubmission.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalCollections: { $sum: 1 },
            totalWeight: { $sum: '$quantity' },
            totalPointsAwarded: { $sum: '$pointsEarned' },
            wasteTypeBreakdown: {
              $push: {
                type: '$wasteType',
                quantity: '$quantity'
              }
            }
          }
        }
      ]);

      const summary = summaryStats[0] || {
        totalCollections: 0,
        totalWeight: 0,
        totalPointsAwarded: 0,
        wasteTypeBreakdown: []
      };

      res.json({
        success: true,
        data: {
          collections: submissions.map(submission => ({
            id: submission._id,
            user: submission.userId,
            booth: submission.boothId,
            wasteType: submission.wasteType,
            quantity: submission.quantity,
            pointsEarned: submission.pointsEarned,
            collectedAt: submission.createdAt,
            notes: submission.notes
          })),
          summary,
          pagination: {
            current: parseInt(page),
            pages: Math.ceil(total / limit),
            total,
            limit: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('❌ Get admin collections error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get collection history'
      });
    }
  }

  // Get multer middleware for photo uploads
  getUploadMiddleware() {
    return this.upload.array('photos', 5);
  }
}

export default new WasteController();
