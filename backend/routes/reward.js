import express from 'express';
import { catchAsync, sendResponse, sendError, sendPaginatedResponse } from '../middleware/errorHandler.js';
import { authenticateUser, authenticateAdmin, requirePermission, optionalAuth } from '../middleware/auth.js';
import { redemptionRateLimiter, searchRateLimiter, uploadRateLimiter } from '../middleware/rateLimiter.js';
import Reward from '../models/Reward.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for reward image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/rewards'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `reward-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per file
    files: 5 // Maximum 5 images per reward
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

// GET /api/rewards - Get available rewards
router.get('/', optionalAuth, searchRateLimiter, catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    category,
    maxPoints,
    minPoints,
    search,
    sortBy = 'popularity',
    inStock = true
  } = req.query;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);

  if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
    return sendError(res, 400, 'Invalid pagination parameters');
  }

  // Build query
  const query = { isActive: true };

  if (inStock === 'true') {
    query['stock.available'] = { $gt: 0 };
  }

  if (category) {
    query.category = category;
  }

  if (maxPoints) {
    query.pointsRequired = { ...query.pointsRequired, $lte: parseInt(maxPoints) };
  }

  if (minPoints) {
    query.pointsRequired = { ...query.pointsRequired, $gte: parseInt(minPoints) };
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } }
    ];
  }

  // Sort options
  const sortOptions = {
    popularity: { 'statistics.popularityScore': -1 },
    points_low: { pointsRequired: 1 },
    points_high: { pointsRequired: -1 },
    name: { name: 1 },
    newest: { createdAt: -1 },
    rating: { 'statistics.averageRating': -1 }
  };

  const sortQuery = sortOptions[sortBy] || sortOptions.popularity;

  const rewards = await Reward.find(query)
    .sort(sortQuery)
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum)
    .lean();

  const total = await Reward.countDocuments(query);

  // Format response data
  const formattedRewards = rewards.map(reward => ({
    id: reward._id,
    name: reward.name,
    description: reward.description,
    category: reward.category,
    subcategory: reward.subcategory,
    pointsRequired: reward.pointsRequired,
    effectivePoints: reward.pricing?.discountPercentage > 0 ? 
      Math.round(reward.pointsRequired * (1 - reward.pricing.discountPercentage / 100)) : 
      reward.pointsRequired,
    discount: reward.pricing?.discountPercentage || 0,
    primaryImage: reward.images.find(img => img.isPrimary)?.url || reward.images[0]?.url,
    images: reward.images,
    stock: reward.stock,
    stockStatus: getStockStatus(reward.stock),
    availabilityStatus: getAvailabilityStatus(reward),
    statistics: {
      totalRedeemed: reward.statistics.totalRedeemed,
      averageRating: reward.statistics.averageRating,
      totalRatings: reward.statistics.totalRatings
    },
    sponsor: reward.sponsor?.name,
    tags: reward.tags,
    redemption: {
      method: reward.redemption.method,
      validityPeriod: reward.redemption.validityPeriod
    },
    requirements: reward.requirements,
    canRedeem: req.user ? canUserRedeem(reward, req.user) : null
  }));

  sendPaginatedResponse(res, 200, formattedRewards, {
    page: pageNum,
    limit: limitNum,
    total
  }, 'Rewards retrieved successfully');
}));

// Helper function to get stock status
const getStockStatus = (stock) => {
  if (stock.available === 0) return 'out_of_stock';
  if (stock.available <= (stock.total * 0.1)) return 'low_stock';
  if (stock.available <= (stock.total * 0.3)) return 'medium_stock';
  return 'in_stock';
};

// Helper function to get availability status
const getAvailabilityStatus = (reward) => {
  const now = new Date();
  
  // Check date range
  if (reward.availability.isLimitedTime) {
    if (reward.availability.startDate && now < reward.availability.startDate) {
      return 'not_yet_available';
    }
    if (reward.availability.endDate && now > reward.availability.endDate) {
      return 'expired';
    }
  }
  
  // Check day of week
  if (reward.availability.availableDays.length > 0) {
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'lowercase' });
    if (!reward.availability.availableDays.includes(currentDay)) {
      return 'not_available_today';
    }
  }
  
  return 'available';
};

// Helper function to check if user can redeem reward
const canUserRedeem = (reward, user) => {
  const errors = [];
  
  // Check stock
  if (reward.stock.available === 0) {
    errors.push('Out of stock');
  }
  
  // Check user points
  const effectivePoints = reward.pricing?.discountPercentage > 0 ? 
    Math.round(reward.pointsRequired * (1 - reward.pricing.discountPercentage / 100)) : 
    reward.pointsRequired;
    
  if (user.greenCredits < effectivePoints) {
    errors.push(`Insufficient credits. Need ${effectivePoints}, have ${user.greenCredits}`);
  }
  
  // Check user rank
  const rankOrder = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];
  const userRankIndex = rankOrder.indexOf(user.currentRank);
  const requiredRankIndex = rankOrder.indexOf(reward.requirements.minimumRank);
  
  if (userRankIndex < requiredRankIndex) {
    errors.push(`Minimum rank required: ${reward.requirements.minimumRank}`);
  }
  
  return {
    canRedeem: errors.length === 0,
    errors
  };
};

// GET /api/rewards/popular - Get popular rewards
router.get('/popular', optionalAuth, catchAsync(async (req, res) => {
  const { limit = 10 } = req.query;
  const limitNum = Math.min(parseInt(limit), 20);

  const popularRewards = await Reward.getPopularRewards(limitNum);

  const formattedRewards = popularRewards.map(reward => ({
    id: reward._id,
    name: reward.name,
    description: reward.description,
    category: reward.category,
    pointsRequired: reward.pointsRequired,
    effectivePoints: reward.pricing?.discountPercentage > 0 ? 
      Math.round(reward.pointsRequired * (1 - reward.pricing.discountPercentage / 100)) : 
      reward.pointsRequired,
    primaryImage: reward.images.find(img => img.isPrimary)?.url || reward.images[0]?.url,
    statistics: {
      totalRedeemed: reward.statistics.totalRedeemed,
      averageRating: reward.statistics.averageRating,
      popularityScore: reward.statistics.popularityScore
    },
    stockStatus: getStockStatus(reward.stock)
  }));

  sendResponse(res, 200, formattedRewards, 'Popular rewards retrieved successfully');
}));

// GET /api/rewards/categories - Get reward categories
router.get('/categories', catchAsync(async (req, res) => {
  const categories = await Reward.aggregate([
    { $match: { isActive: true, 'stock.available': { $gt: 0 } } },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        minPoints: { $min: '$pointsRequired' },
        maxPoints: { $max: '$pointsRequired' },
        avgRating: { $avg: '$statistics.averageRating' }
      }
    },
    { $sort: { count: -1 } }
  ]);

  const formattedCategories = categories.map(cat => ({
    category: cat._id,
    count: cat.count,
    pointsRange: {
      min: cat.minPoints,
      max: cat.maxPoints
    },
    averageRating: cat.avgRating ? cat.avgRating.toFixed(1) : null
  }));

  sendResponse(res, 200, formattedCategories, 'Reward categories retrieved successfully');
}));

// GET /api/rewards/:id - Get specific reward details
router.get('/:id', optionalAuth, catchAsync(async (req, res) => {
  const reward = await Reward.findById(req.params.id);

  if (!reward || !reward.isActive) {
    return sendError(res, 404, 'Reward not found');
  }

  // Increment view count
  reward.statistics.totalViews += 1;
  reward.updatePopularityScore();
  await reward.save();

  const rewardDetails = {
    id: reward._id,
    name: reward.name,
    description: reward.description,
    category: reward.category,
    subcategory: reward.subcategory,
    pointsRequired: reward.pointsRequired,
    effectivePoints: reward.effectivePoints,
    discount: reward.pricing?.discountPercentage || 0,
    originalValue: reward.pricing?.originalValue,
    images: reward.images,
    primaryImage: reward.primaryImage,
    stock: reward.stock,
    stockStatus: reward.stockStatus,
    availabilityStatus: reward.availabilityStatus,
    availability: reward.availability,
    redemption: reward.redemption,
    requirements: reward.requirements,
    statistics: reward.statistics,
    sponsor: reward.sponsor,
    tags: reward.tags,
    createdAt: reward.createdAt,
    updatedAt: reward.updatedAt
  };

  // Add user-specific information if authenticated
  if (req.user) {
    const redemptionCheck = reward.canUserRedeem(req.user);
    rewardDetails.canRedeem = redemptionCheck.canRedeem;
    rewardDetails.redemptionErrors = redemptionCheck.errors;
  }

  sendResponse(res, 200, rewardDetails, 'Reward details retrieved successfully');
}));

// POST /api/rewards/redeem - Redeem points for reward (requires user authentication)
router.post('/redeem', authenticateUser, redemptionRateLimiter, catchAsync(async (req, res) => {
  const { rewardId, quantity = 1 } = req.body;

  if (!rewardId) {
    return sendError(res, 400, 'Reward ID is required');
  }

  if (quantity < 1 || quantity > 10) {
    return sendError(res, 400, 'Quantity must be between 1 and 10');
  }

  try {
    const reward = await Reward.findById(rewardId);

    if (!reward || !reward.isActive) {
      return sendError(res, 404, 'Reward not found or inactive');
    }

    const user = await User.findById(req.userId);

    // Check if user can redeem this reward
    const redemptionCheck = reward.canUserRedeem(user);
    if (!redemptionCheck.canRedeem) {
      return sendError(res, 400, redemptionCheck.errors.join(', '));
    }

    // Check stock for requested quantity
    if (reward.stock.available < quantity) {
      return sendError(res, 400, `Insufficient stock. Available: ${reward.stock.available}, Requested: ${quantity}`);
    }

    const totalPointsRequired = reward.effectivePoints * quantity;

    if (user.greenCredits < totalPointsRequired) {
      return sendError(res, 400, `Insufficient green credits. Required: ${totalPointsRequired}, Available: ${user.greenCredits}`);
    }

    // Reserve stock
    await reward.reserveStock(quantity);

    try {
      // Deduct points from user
      await user.deductCredits(totalPointsRequired);

      // Confirm redemption (move from reserved to redeemed)
      await reward.confirmRedemption(quantity);

      // Create transaction record
      await Transaction.createRedeemTransaction(
        user._id,
        totalPointsRequired,
        reward._id,
        `Redeemed ${quantity}x ${reward.name}`,
        user.greenCredits + totalPointsRequired
      );

      // Generate redemption code/reference
      const redemptionCode = `RDM${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

      const redemptionDetails = {
        redemptionCode,
        reward: {
          id: reward._id,
          name: reward.name,
          category: reward.category,
          description: reward.description,
          primaryImage: reward.primaryImage
        },
        quantity,
        pointsDeducted: totalPointsRequired,
        redemptionDate: new Date(),
        validUntil: new Date(Date.now() + (reward.redemption.validityPeriod * 24 * 60 * 60 * 1000)),
        redemptionMethod: reward.redemption.method,
        instructions: reward.redemption.instructions,
        locations: reward.redemption.locations,
        user: {
          newBalance: user.greenCredits,
          newRank: user.currentRank
        }
      };

      sendResponse(res, 200, redemptionDetails, 'Reward redeemed successfully');

    } catch (error) {
      // If user deduction fails, cancel the reservation
      await reward.cancelReservation(quantity);
      throw error;
    }

  } catch (error) {
    console.error('Redemption error:', error);
    
    if (error.message === 'Insufficient green credits') {
      return sendError(res, 400, error.message);
    }
    
    throw error;
  }
}));

// GET /api/rewards/history - Get user's redemption history
router.get('/history', authenticateUser, catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    status,
    startDate,
    endDate
  } = req.query;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);

  // Build query for transactions
  const query = {
    userId: req.userId,
    type: 'redeem'
  };

  if (status) query.status = status;

  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }

  const redemptions = await Transaction.find(query)
    .populate('relatedId', 'name category images primaryImage')
    .sort({ date: -1 })
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum)
    .lean();

  const total = await Transaction.countDocuments(query);

  const formattedRedemptions = redemptions.map(redemption => ({
    id: redemption._id,
    referenceNumber: redemption.referenceNumber,
    reward: redemption.relatedId ? {
      id: redemption.relatedId._id,
      name: redemption.relatedId.name,
      category: redemption.relatedId.category,
      primaryImage: redemption.relatedId.primaryImage
    } : null,
    pointsSpent: Math.abs(redemption.points),
    description: redemption.description,
    date: redemption.date,
    status: redemption.status,
    balanceAfter: redemption.balanceAfter
  }));

  sendPaginatedResponse(res, 200, formattedRedemptions, {
    page: pageNum,
    limit: limitNum,
    total
  }, 'Redemption history retrieved successfully');
}));

// POST /api/rewards/:id/rate - Rate a redeemed reward
router.post('/:id/rate', authenticateUser, catchAsync(async (req, res) => {
  const { rating, review } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return sendError(res, 400, 'Rating must be between 1 and 5');
  }

  const reward = await Reward.findById(req.params.id);

  if (!reward) {
    return sendError(res, 404, 'Reward not found');
  }

  // Check if user has redeemed this reward
  const hasRedeemed = await Transaction.findOne({
    userId: req.userId,
    relatedId: reward._id,
    type: 'redeem',
    status: 'completed'
  });

  if (!hasRedeemed) {
    return sendError(res, 400, 'You can only rate rewards you have redeemed');
  }

  // Add rating
  await reward.addRating(rating);

  sendResponse(res, 200, {
    rating,
    review: review?.trim() || null,
    newAverageRating: reward.statistics.averageRating,
    totalRatings: reward.statistics.totalRatings
  }, 'Rating added successfully');
}));

// Admin routes - require admin authentication
router.use('/admin', authenticateAdmin);

// POST /api/rewards/admin - Create new reward (admin only)
router.post('/admin', 
  requirePermission('rewards', 'create'), 
  uploadRateLimiter,
  upload.array('images', 5),
  catchAsync(async (req, res) => {
    const {
      name,
      description,
      category,
      subcategory,
      pointsRequired,
      stock,
      availability,
      redemption,
      requirements,
      sponsor,
      tags,
      pricing
    } = req.body;

    // Validate required fields
    if (!name || !description || !category || !pointsRequired || !stock || !redemption) {
      return sendError(res, 400, 'Missing required fields');
    }

    try {
      // Process uploaded images
      const images = [];
      if (req.files && req.files.length > 0) {
        req.files.forEach((file, index) => {
          images.push({
            url: `/uploads/rewards/${file.filename}`,
            alt: `${name} image ${index + 1}`,
            isPrimary: index === 0 // First image is primary
          });
        });
      }

      // Parse JSON fields
      const parsedStock = JSON.parse(stock);
      const parsedRedemption = JSON.parse(redemption);
      const parsedAvailability = availability ? JSON.parse(availability) : {};
      const parsedRequirements = requirements ? JSON.parse(requirements) : {};
      const parsedSponsor = sponsor ? JSON.parse(sponsor) : {};
      const parsedTags = tags ? JSON.parse(tags) : [];
      const parsedPricing = pricing ? JSON.parse(pricing) : {};

      const reward = new Reward({
        name: name.trim(),
        description: description.trim(),
        category,
        subcategory: subcategory?.trim(),
        pointsRequired: parseInt(pointsRequired),
        images,
        stock: {
          total: parseInt(parsedStock.total),
          available: parseInt(parsedStock.available || parsedStock.total),
          reserved: 0
        },
        availability: {
          startDate: parsedAvailability.startDate ? new Date(parsedAvailability.startDate) : new Date(),
          endDate: parsedAvailability.endDate ? new Date(parsedAvailability.endDate) : null,
          isLimitedTime: parsedAvailability.isLimitedTime || false,
          availableDays: parsedAvailability.availableDays || [],
          availableHours: parsedAvailability.availableHours || {}
        },
        redemption: {
          method: parsedRedemption.method,
          locations: parsedRedemption.locations || [],
          instructions: parsedRedemption.instructions?.trim(),
          validityPeriod: parseInt(parsedRedemption.validityPeriod) || 30
        },
        requirements: {
          minimumRank: parsedRequirements.minimumRank || 'Bronze',
          minimumWasteSubmissions: parseInt(parsedRequirements.minimumWasteSubmissions) || 0,
          allowedUserTypes: parsedRequirements.allowedUserTypes || []
        },
        sponsor: Object.keys(parsedSponsor).length > 0 ? parsedSponsor : undefined,
        tags: parsedTags,
        pricing: Object.keys(parsedPricing).length > 0 ? parsedPricing : undefined
      });

      await reward.save();

      sendResponse(res, 201, reward, 'Reward created successfully');

    } catch (error) {
      // Clean up uploaded files if reward creation failed
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

// PUT /api/rewards/admin/:id - Update reward (admin only)
router.put('/admin/:id', 
  requirePermission('rewards', 'update'), 
  catchAsync(async (req, res) => {
    const reward = await Reward.findById(req.params.id);

    if (!reward) {
      return sendError(res, 404, 'Reward not found');
    }

    const updateData = req.body;

    // Validate stock update
    if (updateData.stock) {
      const currentReserved = reward.stock.reserved;
      if (updateData.stock.total < currentReserved) {
        return sendError(res, 400, 'Total stock cannot be less than currently reserved stock');
      }
      
      updateData.stock.available = Math.max(0, updateData.stock.total - currentReserved);
    }

    const updatedReward = await Reward.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    sendResponse(res, 200, updatedReward, 'Reward updated successfully');
  })
);

// DELETE /api/rewards/admin/:id - Delete reward (admin only)
router.delete('/admin/:id', 
  requirePermission('rewards', 'delete'), 
  catchAsync(async (req, res) => {
    const reward = await Reward.findById(req.params.id);

    if (!reward) {
      return sendError(res, 404, 'Reward not found');
    }

    // Check if reward has been redeemed
    const redemptionCount = await Transaction.countDocuments({
      relatedId: reward._id,
      type: 'redeem'
    });

    if (redemptionCount > 0) {
      // Soft delete - set isActive to false
      reward.isActive = false;
      await reward.save();
      
      sendResponse(res, 200, {
        message: 'Reward deactivated successfully (has existing redemptions)'
      });
    } else {
      // Hard delete if no redemptions
      await Reward.findByIdAndDelete(req.params.id);
      
      sendResponse(res, 200, {
        message: 'Reward deleted successfully'
      });
    }
  })
);

export default router;
