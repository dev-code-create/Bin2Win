import express from 'express';
import { catchAsync, sendResponse, sendError, sendPaginatedResponse } from '../middleware/errorHandler.js';
import { authenticateUser, authenticateAdmin, requirePermission } from '../middleware/auth.js';
import { submissionRateLimiter, uploadRateLimiter } from '../middleware/rateLimiter.js';
import WasteSubmission from '../models/WasteSubmission.js';
import CollectionBooth from '../models/CollectionBooth.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for waste submission photos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/waste-photos'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `waste-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
    files: 5 // Maximum 5 files
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

// POST /api/waste/submit - Submit waste disposal record
router.post('/submit', 
  authenticateUser, 
  submissionRateLimiter, 
  uploadRateLimiter, 
  upload.array('photos', 5), 
  catchAsync(async (req, res) => {
    const {
      boothId,
      wasteType,
      quantity,
      qrCode,
      notes,
      location // Optional GPS location
    } = req.body;

    // Validate required fields
    if (!boothId || !wasteType || !quantity || !qrCode) {
      return sendError(res, 400, 'Booth ID, waste type, quantity, and QR code are required');
    }

    // Validate waste type
    const validWasteTypes = ['plastic', 'organic', 'paper', 'metal', 'glass', 'electronic', 'textile', 'hazardous'];
    if (!validWasteTypes.includes(wasteType)) {
      return sendError(res, 400, 'Invalid waste type');
    }

    // Validate quantity
    const quantityNum = parseFloat(quantity);
    if (isNaN(quantityNum) || quantityNum <= 0 || quantityNum > 1000) {
      return sendError(res, 400, 'Quantity must be a positive number between 0.1 and 1000 kg');
    }

    try {
      // Find and validate booth
      const booth = await CollectionBooth.findById(boothId);
      if (!booth) {
        return sendError(res, 404, 'Collection booth not found');
      }

      if (!booth.isActive) {
        return sendError(res, 400, 'Collection booth is currently inactive');
      }

      // Validate QR code matches booth
      if (booth.qrCode !== qrCode) {
        return sendError(res, 400, 'Invalid QR code for this booth');
      }

      // Check if booth can accept waste
      const canAccept = booth.canAcceptWaste(quantityNum);
      if (!canAccept.canAccept) {
        return sendError(res, 400, canAccept.reason);
      }

      // Check if booth accepts this waste type
      if (booth.facilities.acceptedWasteTypes.length > 0 && 
          !booth.facilities.acceptedWasteTypes.includes(wasteType)) {
        return sendError(res, 400, `This booth does not accept ${wasteType} waste`);
      }

      // Process uploaded photos
      const photos = [];
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          photos.push({
            url: `/uploads/waste-photos/${file.filename}`,
            filename: file.filename,
            uploadDate: new Date()
          });
        });
      }

      // Calculate points
      const pointsEarned = WasteSubmission.calculatePoints(wasteType, quantityNum);

      // Create metadata
      const metadata = {
        deviceInfo: req.get('User-Agent'),
        submissionMethod: 'qr_scan'
      };

      if (location && location.latitude && location.longitude) {
        metadata.location = {
          latitude: parseFloat(location.latitude),
          longitude: parseFloat(location.longitude)
        };
      }

      // Create waste submission
      const wasteSubmission = new WasteSubmission({
        userId: req.userId,
        boothId,
        wasteType,
        quantity: quantityNum,
        pointsEarned,
        qrCode,
        photos,
        notes: notes?.trim() || null,
        metadata,
        status: 'approved' // Auto-approve for now, can be changed to 'pending' for manual verification
      });

      await wasteSubmission.save();

      // Update booth statistics
      await booth.addSubmission(quantityNum);

      // Update user statistics and credits
      const user = await User.findById(req.userId);
      await user.addCredits(pointsEarned);
      
      user.totalWasteSubmitted += quantityNum;
      user.stats.totalSubmissions += 1;
      
      // Update favorite waste type
      const userSubmissions = await WasteSubmission.aggregate([
        { $match: { userId: req.userId, status: 'approved' } },
        { $group: { _id: '$wasteType', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 1 }
      ]);
      
      if (userSubmissions.length > 0) {
        user.stats.favoriteWasteType = userSubmissions[0]._id;
      }
      
      await user.save();

      // Create transaction record
      await Transaction.createEarnTransaction(
        req.userId,
        pointsEarned,
        wasteSubmission._id,
        `Points earned for ${wasteType} waste submission (${quantityNum}kg)`,
        user.greenCredits - pointsEarned
      );

      // Populate response data
      await wasteSubmission.populate('boothId', 'name location.address');

      const responseData = {
        id: wasteSubmission._id,
        wasteType: wasteSubmission.wasteType,
        quantity: wasteSubmission.quantity,
        pointsEarned: wasteSubmission.pointsEarned,
        status: wasteSubmission.status,
        submissionDate: wasteSubmission.submissionDate,
        booth: {
          id: wasteSubmission.boothId._id,
          name: wasteSubmission.boothId.name,
          address: wasteSubmission.boothId.location.address
        },
        photos: wasteSubmission.photos,
        environmentalImpact: wasteSubmission.environmentalImpact,
        user: {
          newBalance: user.greenCredits,
          newRank: user.currentRank,
          totalSubmissions: user.stats.totalSubmissions
        }
      };

      sendResponse(res, 201, responseData, 'Waste submission recorded successfully');

    } catch (error) {
      console.error('Waste submission error:', error);
      
      // Clean up uploaded files if submission failed
      if (req.files) {
        req.files.forEach(file => {
          try {
            const fs = require('fs');
            fs.unlinkSync(file.path);
          } catch (unlinkError) {
            console.error('Failed to clean up uploaded file:', unlinkError);
          }
        });
      }
      
      throw error;
    }
  })
);

// GET /api/waste/submissions - Get user's waste submissions
router.get('/submissions', authenticateUser, catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    status,
    wasteType,
    startDate,
    endDate,
    boothId
  } = req.query;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);

  if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
    return sendError(res, 400, 'Invalid pagination parameters');
  }

  // Build query
  const query = { userId: req.userId };

  if (status) query.status = status;
  if (wasteType) query.wasteType = wasteType;
  if (boothId) query.boothId = boothId;

  if (startDate || endDate) {
    query.submissionDate = {};
    if (startDate) query.submissionDate.$gte = new Date(startDate);
    if (endDate) query.submissionDate.$lte = new Date(endDate);
  }

  // Get submissions
  const submissions = await WasteSubmission.find(query)
    .populate('boothId', 'name location.address')
    .sort({ submissionDate: -1 })
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum)
    .lean();

  const total = await WasteSubmission.countDocuments(query);

  // Format response data
  const formattedSubmissions = submissions.map(submission => ({
    id: submission._id,
    wasteType: submission.wasteType,
    quantity: submission.quantity,
    pointsEarned: submission.pointsEarned,
    status: submission.status,
    submissionDate: submission.submissionDate,
    booth: submission.boothId ? {
      id: submission.boothId._id,
      name: submission.boothId.name,
      address: submission.boothId.location?.address
    } : null,
    photos: submission.photos,
    notes: submission.notes,
    environmentalImpact: {
      co2Saved: submission.environmentalImpact?.co2Saved,
      unit: submission.environmentalImpact?.unit
    },
    verificationDate: submission.verificationDate,
    verifiedBy: submission.verifiedBy
  }));

  sendPaginatedResponse(res, 200, formattedSubmissions, {
    page: pageNum,
    limit: limitNum,
    total
  }, 'Submissions retrieved successfully');
}));

// GET /api/waste/submissions/:id - Get specific waste submission
router.get('/submissions/:id', authenticateUser, catchAsync(async (req, res) => {
  const submission = await WasteSubmission.findOne({
    _id: req.params.id,
    userId: req.userId
  }).populate('boothId', 'name location contactPerson');

  if (!submission) {
    return sendError(res, 404, 'Waste submission not found');
  }

  const submissionData = {
    id: submission._id,
    wasteType: submission.wasteType,
    quantity: submission.quantity,
    pointsEarned: submission.pointsEarned,
    status: submission.status,
    submissionDate: submission.submissionDate,
    booth: {
      id: submission.boothId._id,
      name: submission.boothId.name,
      address: submission.boothId.location.address,
      contactPerson: submission.boothId.contactPerson
    },
    photos: submission.photos,
    notes: submission.notes,
    qrCode: submission.qrCode,
    environmentalImpact: submission.environmentalImpact,
    metadata: submission.metadata,
    verificationDate: submission.verificationDate,
    verifiedBy: submission.verifiedBy,
    qualityScore: submission.qualityScore,
    processing: submission.processing
  };

  sendResponse(res, 200, submissionData, 'Submission details retrieved successfully');
}));

// GET /api/waste/stats - Get waste statistics (public endpoint with optional auth)
router.get('/stats', catchAsync(async (req, res) => {
  const { period = '30d', wasteType } = req.query;
  
  const periodDays = parseInt(period.replace('d', ''));
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - periodDays);

  // Build aggregation pipeline
  const matchStage = {
    status: 'approved',
    submissionDate: { $gte: startDate }
  };

  if (wasteType) {
    matchStage.wasteType = wasteType;
  }

  const stats = await WasteSubmission.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalSubmissions: { $sum: 1 },
        totalQuantity: { $sum: '$quantity' },
        totalPoints: { $sum: '$pointsEarned' },
        averageQuantity: { $avg: '$quantity' },
        wasteTypeBreakdown: {
          $push: {
            type: '$wasteType',
            quantity: '$quantity',
            points: '$pointsEarned'
          }
        }
      }
    }
  ]);

  // Get waste type breakdown
  const wasteTypeStats = await WasteSubmission.getWasteStats(
    startDate.toISOString(),
    new Date().toISOString()
  );

  // Calculate environmental impact
  const totalQuantity = stats[0]?.totalQuantity || 0;
  const environmentalImpact = {
    co2Saved: (totalQuantity * 1.5).toFixed(2), // Average CO2 saving
    treesEquivalent: (totalQuantity * 1.5 / 22).toFixed(2),
    waterSaved: (totalQuantity * 10).toFixed(0) // Average water saving
  };

  const statisticsData = {
    period: {
      days: periodDays,
      startDate: startDate.toISOString(),
      endDate: new Date().toISOString()
    },
    totals: {
      submissions: stats[0]?.totalSubmissions || 0,
      quantity: stats[0]?.totalQuantity || 0,
      points: stats[0]?.totalPoints || 0,
      averageQuantity: stats[0]?.averageQuantity || 0
    },
    wasteTypeBreakdown: wasteTypeStats,
    environmentalImpact,
    topPerformers: await getTopPerformers(startDate)
  };

  sendResponse(res, 200, statisticsData, 'Waste statistics retrieved successfully');
}));

// Helper function to get top performers
const getTopPerformers = async (startDate) => {
  const topUsers = await WasteSubmission.aggregate([
    {
      $match: {
        status: 'approved',
        submissionDate: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$userId',
        totalQuantity: { $sum: '$quantity' },
        totalSubmissions: { $sum: 1 },
        totalPoints: { $sum: '$pointsEarned' }
      }
    },
    { $sort: { totalQuantity: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user',
        pipeline: [
          { $project: { name: 1, currentRank: '$stats.rank' } }
        ]
      }
    },
    { $unwind: '$user' }
  ]);

  return topUsers.map((user, index) => ({
    rank: index + 1,
    name: user.user.name,
    totalQuantity: user.totalQuantity,
    totalSubmissions: user.totalSubmissions,
    totalPoints: user.totalPoints,
    currentRank: user.user.currentRank
  }));
};

// Admin routes - require admin authentication
router.use('/admin', authenticateAdmin);

// PUT /api/waste/admin/verify/:id - Admin verification of submission
router.put('/admin/verify/:id', 
  requirePermission('waste', 'approve'), 
  catchAsync(async (req, res) => {
    const { action, notes, qualityScore } = req.body; // action: 'approve' or 'reject'
    
    if (!['approve', 'reject'].includes(action)) {
      return sendError(res, 400, 'Action must be either "approve" or "reject"');
    }

    const submission = await WasteSubmission.findById(req.params.id)
      .populate('userId', 'name phoneNumber greenCredits');

    if (!submission) {
      return sendError(res, 404, 'Waste submission not found');
    }

    if (submission.status !== 'pending') {
      return sendError(res, 400, 'Submission has already been verified');
    }

    try {
      if (action === 'approve') {
        await submission.approve(req.adminId, notes);
        
        // Add quality score if provided
        if (qualityScore && qualityScore >= 1 && qualityScore <= 5) {
          submission.qualityScore = qualityScore;
          await submission.save();
        }

        // Update user credits and statistics
        const user = submission.userId;
        await user.addCredits(submission.pointsEarned);
        
        user.totalWasteSubmitted += submission.quantity;
        user.stats.totalSubmissions += 1;
        await user.save();

        // Create transaction record
        await Transaction.createEarnTransaction(
          user._id,
          submission.pointsEarned,
          submission._id,
          `Points earned for ${submission.wasteType} waste submission (${submission.quantity}kg)`,
          user.greenCredits - submission.pointsEarned
        );

        // Update booth statistics
        const booth = await CollectionBooth.findById(submission.boothId);
        if (booth) {
          await booth.addSubmission(submission.quantity);
        }

      } else {
        await submission.reject(req.adminId, notes || 'Submission rejected by admin');
      }

      // Update admin statistics
      await req.admin.updateProcessingStats(action);

      const responseData = {
        id: submission._id,
        status: submission.status,
        action,
        verificationDate: submission.verificationDate,
        verifiedBy: req.admin.fullName,
        notes: submission.notes,
        qualityScore: submission.qualityScore
      };

      sendResponse(res, 200, responseData, `Submission ${action}d successfully`);

    } catch (error) {
      console.error('Verification error:', error);
      throw error;
    }
  })
);

// GET /api/waste/admin/pending - Get pending submissions for verification
router.get('/admin/pending', 
  requirePermission('waste', 'read'), 
  catchAsync(async (req, res) => {
    const {
      page = 1,
      limit = 20,
      boothId
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    // Build query
    const query = { status: 'pending' };

    // If admin is booth operator, only show submissions from assigned booths
    if (req.admin.role === 'booth_operator') {
      const assignedBoothIds = req.admin.assignedBooths.map(booth => booth._id);
      query.boothId = { $in: assignedBoothIds };
    } else if (boothId) {
      query.boothId = boothId;
    }

    const submissions = await WasteSubmission.find(query)
      .populate('userId', 'name phoneNumber')
      .populate('boothId', 'name location.address')
      .sort({ submissionDate: 1 }) // Oldest first
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    const total = await WasteSubmission.countDocuments(query);

    const formattedSubmissions = submissions.map(submission => ({
      id: submission._id,
      user: {
        name: submission.userId.name,
        phoneNumber: submission.userId.phoneNumber
      },
      booth: {
        name: submission.boothId.name,
        address: submission.boothId.location.address
      },
      wasteType: submission.wasteType,
      quantity: submission.quantity,
      pointsEarned: submission.pointsEarned,
      submissionDate: submission.submissionDate,
      photos: submission.photos,
      notes: submission.notes,
      metadata: submission.metadata
    }));

    sendPaginatedResponse(res, 200, formattedSubmissions, {
      page: pageNum,
      limit: limitNum,
      total
    }, 'Pending submissions retrieved successfully');
  })
);

export default router;
