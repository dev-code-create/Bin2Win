import Reward from "../models/Reward.js";
import Transaction from "../models/Transaction.js";
import User from "../models/User.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import mongoose from "mongoose";

class RewardController {
  constructor() {
    // Configure multer for reward image uploads
    this.storage = multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadPath = "uploads/rewards";
        if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, `reward-${uniqueSuffix}${path.extname(file.originalname)}`);
      },
    });

    this.upload = multer({
      storage: this.storage,
      limits: {
        fileSize: 3 * 1024 * 1024, // 3MB limit
        files: 5, // Maximum 5 files
      },
      fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(
          path.extname(file.originalname).toLowerCase()
        );
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
          return cb(null, true);
        } else {
          cb(new Error("Only image files are allowed"));
        }
      },
    });
  }

  // Get all rewards (public)
  async getAllRewards(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        category,
        minPoints,
        maxPoints,
        isAvailable,
        sortBy = "pointsCost",
        sortOrder = "asc",
      } = req.query;

      // Build filter
      const filter = { isActive: true };

      if (category) {
        filter.category = category;
      }

      if (isAvailable === "true") {
        filter.isAvailable = true;
        filter.stock = { $gt: 0 };
      }

      if (minPoints || maxPoints) {
        filter.pointsCost = {};
        if (minPoints) filter.pointsCost.$gte = parseInt(minPoints);
        if (maxPoints) filter.pointsCost.$lte = parseInt(maxPoints);
      }

      // Sort options
      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

      // Get rewards with pagination
      const rewards = await Reward.find(filter)
        .populate("sponsor", "name contactInfo")
        .sort(sortOptions)
        .limit(limit * 1)
        .skip((page - 1) * limit);

      // Get total count for pagination
      const total = await Reward.countDocuments(filter);

      // Get user's green credits if authenticated
      let userCredits = null;
      if (req.user && req.user.userId) {
        const user = await User.findById(req.user.userId).select(
          "greenCredits"
        );
        userCredits = user ? user.greenCredits : 0;
      }

      const rewardsWithAvailability = rewards.map((reward) => ({
        id: reward._id,
        name: reward.name,
        description: reward.description,
        pointsCost: reward.pointsCost,
        category: reward.category,
        images: reward.images,
        stock: reward.stock,
        isAvailable: reward.isAvailable && reward.stock > 0,
        canAfford:
          userCredits !== null ? userCredits >= reward.pointsCost : null,
        sponsor: reward.sponsor,
        estimatedDelivery: reward.estimatedDelivery,
        terms: reward.terms,
        popularity: reward.popularity,
        rating: reward.rating,
        createdAt: reward.createdAt,
      }));

      res.json({
        success: true,
        data: {
          rewards: rewardsWithAvailability,
          userCredits,
          pagination: {
            current: parseInt(page),
            pages: Math.ceil(total / limit),
            total,
            limit: parseInt(limit),
          },
        },
      });
    } catch (error) {
      console.error("❌ Get all rewards error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get rewards",
      });
    }
  }

  // Get reward by ID
  async getRewardById(req, res) {
    try {
      const { rewardId } = req.params;

      const reward = await Reward.findById(rewardId).populate(
        "sponsor",
        "name contactInfo website"
      );

      if (!reward || !reward.isActive) {
        return res.status(404).json({
          success: false,
          message: "Reward not found",
        });
      }

      // Get user's green credits if authenticated
      let userCredits = null;
      let canAfford = null;
      if (req.user && req.user.userId) {
        const user = await User.findById(req.user.userId).select(
          "greenCredits"
        );
        userCredits = user ? user.greenCredits : 0;
        canAfford = userCredits >= reward.pointsCost;
      }

      // Get recent redemptions count
      const recentRedemptions = await Transaction.countDocuments({
        relatedReward: rewardId,
        type: "spent",
        status: "completed",
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
      });

      const rewardDetails = {
        id: reward._id,
        name: reward.name,
        description: reward.description,
        pointsCost: reward.pointsCost,
        category: reward.category,
        images: reward.images,
        stock: reward.stock,
        isAvailable: reward.isAvailable && reward.stock > 0,
        canAfford,
        userCredits,
        sponsor: reward.sponsor,
        estimatedDelivery: reward.estimatedDelivery,
        terms: reward.terms,
        details: reward.details,
        popularity: reward.popularity,
        rating: reward.rating,
        recentRedemptions,
        createdAt: reward.createdAt,
        updatedAt: reward.updatedAt,
      };

      res.json({
        success: true,
        data: { reward: rewardDetails },
      });
    } catch (error) {
      console.error("❌ Get reward by ID error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get reward details",
      });
    }
  }

  // Get reward categories
  async getCategories(req, res) {
    try {
      const categories = await Reward.distinct("category", {
        isActive: true,
        isAvailable: true,
      });

      // Get count for each category
      const categoriesWithCount = await Promise.all(
        categories.map(async (category) => {
          const count = await Reward.countDocuments({
            category,
            isActive: true,
            isAvailable: true,
            stock: { $gt: 0 },
          });

          return {
            name: category,
            count,
            displayName: this.getCategoryDisplayName(category),
          };
        })
      );

      res.json({
        success: true,
        data: { categories: categoriesWithCount },
      });
    } catch (error) {
      console.error("❌ Get categories error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get reward categories",
      });
    }
  }

  // Redeem reward
  async redeemReward(req, res) {
    try {
      const { rewardId } = req.params;
      const { deliveryAddress, quantity = 1 } = req.body;
      const userId = req.user.userId;

      // Validate quantity
      if (quantity < 1) {
        return res.status(400).json({
          success: false,
          message: "Quantity must be at least 1",
        });
      }

      // Get reward details
      const reward = await Reward.findById(rewardId);

      if (!reward || !reward.isActive) {
        return res.status(404).json({
          success: false,
          message: "Reward not found",
        });
      }

      if (!reward.isAvailable) {
        return res.status(400).json({
          success: false,
          message: "Reward is currently not available",
        });
      }

      if (reward.stock < quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock. Only ${reward.stock} items available.`,
        });
      }

      // Get user details
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const totalCost = reward.pointsCost * quantity;

      if (user.greenCredits < totalCost) {
        return res.status(400).json({
          success: false,
          message: `Insufficient green credits. You need ${totalCost} credits but have ${user.greenCredits}.`,
        });
      }

      // Start transaction
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // Deduct points from user
        await User.findByIdAndUpdate(
          userId,
          { $inc: { greenCredits: -totalCost } },
          { session }
        );

        // Reduce reward stock
        await Reward.findByIdAndUpdate(
          rewardId,
          {
            $inc: {
              stock: -quantity,
              "popularity.redemptions": quantity,
            },
          },
          { session }
        );

        // Create transaction record
        const transaction = new Transaction({
          userId,
          type: "spent",
          amount: totalCost,
          description: `Redeemed ${quantity}x ${reward.name}`,
          status: "completed",
          relatedReward: rewardId,
          metadata: {
            rewardName: reward.name,
            quantity,
            unitCost: reward.pointsCost,
            totalCost,
            deliveryAddress: deliveryAddress || user.address,
            redemptionDate: new Date(),
          },
        });

        await transaction.save({ session });

        // Update reward popularity
        await Reward.findByIdAndUpdate(
          rewardId,
          { $inc: { "popularity.views": 1 } },
          { session }
        );

        await session.commitTransaction();

        res.json({
          success: true,
          message: "Reward redeemed successfully!",
          data: {
            transaction: {
              id: transaction._id,
              rewardName: reward.name,
              quantity,
              pointsSpent: totalCost,
              remainingCredits: user.greenCredits - totalCost,
              estimatedDelivery: reward.estimatedDelivery,
              redemptionDate: transaction.createdAt,
            },
          },
        });
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    } catch (error) {
      console.error("❌ Redeem reward error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to redeem reward",
      });
    }
  }

  // Get user's redemption history
  async getRedemptionHistory(req, res) {
    try {
      const userId = req.user.userId;
      const { page = 1, limit = 20, status, startDate, endDate } = req.query;

      // Build filter
      const filter = {
        userId,
        type: "spent",
        relatedReward: { $exists: true },
      };

      if (status) {
        filter.status = status;
      }

      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(endDate);
      }

      // Get redemptions with pagination
      const redemptions = await Transaction.find(filter)
        .populate("relatedReward", "name category images")
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      // Get total count
      const total = await Transaction.countDocuments(filter);

      const redemptionHistory = redemptions.map((transaction) => ({
        id: transaction._id,
        reward: transaction.relatedReward,
        quantity: transaction.metadata.quantity || 1,
        pointsSpent: transaction.amount,
        status: transaction.status,
        redemptionDate: transaction.createdAt,
        deliveryAddress: transaction.metadata.deliveryAddress,
        estimatedDelivery: transaction.metadata.estimatedDelivery,
      }));

      res.json({
        success: true,
        data: {
          redemptions: redemptionHistory,
          pagination: {
            current: parseInt(page),
            pages: Math.ceil(total / limit),
            total,
            limit: parseInt(limit),
          },
        },
      });
    } catch (error) {
      console.error("❌ Get redemption history error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get redemption history",
      });
    }
  }

  // Admin: Create new reward
  async createReward(req, res) {
    try {
      const {
        name,
        description,
        pointsCost,
        category,
        stock,
        sponsor,
        estimatedDelivery,
        terms,
        details,
      } = req.body;

      // Validate required fields
      if (!name || !description || !pointsCost || !category || !stock) {
        return res.status(400).json({
          success: false,
          message:
            "Name, description, points cost, category, and stock are required",
        });
      }

      // Process uploaded images
      const images = [];
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          images.push({
            url: `/uploads/rewards/${file.filename}`,
            filename: file.filename,
            uploadDate: new Date(),
          });
        }
      }

      const reward = new Reward({
        name,
        description,
        pointsCost: parseInt(pointsCost),
        category,
        stock: parseInt(stock),
        images,
        sponsor,
        estimatedDelivery,
        terms,
        details,
        isAvailable: true,
        isActive: true,
      });

      await reward.save();
      await reward.populate("sponsor", "name contactInfo");

      res.status(201).json({
        success: true,
        message: "Reward created successfully",
        data: { reward },
      });
    } catch (error) {
      console.error("❌ Create reward error:", error);

      // Clean up uploaded files if reward creation failed
      if (req.files && req.files.length > 0) {
        req.files.forEach((file) => {
          fs.unlink(file.path, (err) => {
            if (err) console.error("Failed to clean up file:", file.path);
          });
        });
      }

      res.status(500).json({
        success: false,
        message: error.message || "Failed to create reward",
      });
    }
  }

  // Admin: Update reward
  async updateReward(req, res) {
    try {
      const { rewardId } = req.params;
      const updateData = req.body;

      // Remove fields that shouldn't be directly updated
      delete updateData._id;
      delete updateData.createdAt;
      delete updateData.popularity;

      // Process new uploaded images if any
      if (req.files && req.files.length > 0) {
        const newImages = [];
        for (const file of req.files) {
          newImages.push({
            url: `/uploads/rewards/${file.filename}`,
            filename: file.filename,
            uploadDate: new Date(),
          });
        }

        // Add new images to existing ones
        const existingReward = await Reward.findById(rewardId);
        if (existingReward) {
          updateData.images = [...(existingReward.images || []), ...newImages];
        } else {
          updateData.images = newImages;
        }
      }

      const reward = await Reward.findByIdAndUpdate(rewardId, updateData, {
        new: true,
        runValidators: true,
      }).populate("sponsor", "name contactInfo");

      if (!reward) {
        return res.status(404).json({
          success: false,
          message: "Reward not found",
        });
      }

      res.json({
        success: true,
        message: "Reward updated successfully",
        data: { reward },
      });
    } catch (error) {
      console.error("❌ Update reward error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to update reward",
      });
    }
  }

  // Admin: Delete reward
  async deleteReward(req, res) {
    try {
      const { rewardId } = req.params;

      // Check if reward has any pending redemptions
      const pendingRedemptions = await Transaction.countDocuments({
        relatedReward: rewardId,
        status: "pending",
      });

      if (pendingRedemptions > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete reward with ${pendingRedemptions} pending redemptions.`,
        });
      }

      const reward = await Reward.findByIdAndUpdate(
        rewardId,
        { isActive: false, isAvailable: false },
        { new: true }
      );

      if (!reward) {
        return res.status(404).json({
          success: false,
          message: "Reward not found",
        });
      }

      res.json({
        success: true,
        message: "Reward deactivated successfully",
      });
    } catch (error) {
      console.error("❌ Delete reward error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete reward",
      });
    }
  }

  // Helper: Get category display name
  getCategoryDisplayName(category) {
    const categoryMap = {
      prasad: "Prasad & Religious Items",
      food: "Food & Beverages",
      gift: "Gift Items",
      voucher: "Vouchers & Coupons",
      "eco-friendly": "Eco-Friendly Products",
      clothing: "Clothing & Accessories",
      electronics: "Electronics",
      experience: "Experiences & Services",
    };

    return (
      categoryMap[category] ||
      category.charAt(0).toUpperCase() + category.slice(1)
    );
  }

  // Get multer middleware for image uploads
  getUploadMiddleware() {
    return this.upload.array("images", 5);
  }

  // Get popular rewards
  async getPopularRewards(req, res) {
    try {
      const { limit = 10 } = req.query;

      const rewards = await Reward.find({
        isActive: true,
        "stock.available": { $gt: 0 },
      })
        .sort({ "statistics.popularityScore": -1 })
        .limit(parseInt(limit))
        .populate("sponsor", "name contactInfo")
        .lean();

      res.json({
        success: true,
        data: rewards,
      });
    } catch (error) {
      console.error("❌ Get popular rewards error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get popular rewards",
      });
    }
  }

  // Get featured rewards
  async getFeaturedRewards(req, res) {
    try {
      const { limit = 6 } = req.query;

      const rewards = await Reward.find({
        isActive: true,
        isFeatured: true,
        "stock.available": { $gt: 0 },
      })
        .sort({ "statistics.popularityScore": -1 })
        .limit(parseInt(limit))
        .populate("sponsor", "name contactInfo")
        .lean();

      res.json({
        success: true,
        data: rewards,
      });
    } catch (error) {
      console.error("❌ Get featured rewards error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get featured rewards",
      });
    }
  }

  // Search rewards
  async searchRewards(req, res) {
    try {
      const {
        q: query,
        category,
        minPoints,
        maxPoints,
        page = 1,
        limit = 20,
      } = req.query;

      const filters = {};
      if (category) filters.category = category;
      if (minPoints) filters.minPoints = parseInt(minPoints);
      if (maxPoints) filters.maxPoints = parseInt(maxPoints);

      const rewards = await Reward.searchRewards(query, filters)
        .populate("sponsor", "name contactInfo")
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean();

      const total = await Reward.searchRewards(query, filters).countDocuments();

      res.json({
        success: true,
        data: {
          rewards,
          pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      console.error("❌ Search rewards error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to search rewards",
      });
    }
  }

  // Get user redemptions
  async getUserRedemptions(req, res) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const userId = req.user.userId;

      const redemptions = await Redemption.find({ user: userId })
        .populate("reward", "name description images category sponsor")
        .populate("reward.sponsor", "name contactInfo")
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean();

      const total = await Redemption.countDocuments({ user: userId });

      res.json({
        success: true,
        data: {
          redemptions,
          pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      console.error("❌ Get user redemptions error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get redemption history",
      });
    }
  }

  // Get redemption by ID
  async getRedemptionById(req, res) {
    try {
      const { redemptionId } = req.params;
      const userId = req.user.userId;

      const redemption = await Redemption.findOne({
        _id: redemptionId,
        user: userId,
      })
        .populate("reward", "name description images category sponsor")
        .populate("reward.sponsor", "name contactInfo")
        .lean();

      if (!redemption) {
        return res.status(404).json({
          success: false,
          message: "Redemption not found",
        });
      }

      res.json({
        success: true,
        data: redemption,
      });
    } catch (error) {
      console.error("❌ Get redemption by ID error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get redemption details",
      });
    }
  }

  // Get user wishlist
  async getUserWishlist(req, res) {
    try {
      const userId = req.user.userId;

      const user = await User.findById(userId)
        .populate({
          path: "wishlist",
          populate: {
            path: "sponsor",
            select: "name contactInfo",
          },
        })
        .lean();

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      res.json({
        success: true,
        data: user.wishlist || [],
      });
    } catch (error) {
      console.error("❌ Get wishlist error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get wishlist",
      });
    }
  }

  // Add to wishlist
  async addToWishlist(req, res) {
    try {
      const { rewardId } = req.params;
      const userId = req.user.userId;

      const reward = await Reward.findById(rewardId);
      if (!reward) {
        return res.status(404).json({
          success: false,
          message: "Reward not found",
        });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Check if already in wishlist
      if (user.wishlist && user.wishlist.includes(rewardId)) {
        return res.status(400).json({
          success: false,
          message: "Reward already in wishlist",
        });
      }

      // Add to wishlist
      if (!user.wishlist) user.wishlist = [];
      user.wishlist.push(rewardId);
      await user.save();

      res.json({
        success: true,
        message: "Reward added to wishlist",
      });
    } catch (error) {
      console.error("❌ Add to wishlist error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to add to wishlist",
      });
    }
  }

  // Remove from wishlist
  async removeFromWishlist(req, res) {
    try {
      const { rewardId } = req.params;
      const userId = req.user.userId;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Remove from wishlist
      if (user.wishlist) {
        user.wishlist = user.wishlist.filter(
          (id) => id.toString() !== rewardId
        );
        await user.save();
      }

      res.json({
        success: true,
        message: "Reward removed from wishlist",
      });
    } catch (error) {
      console.error("❌ Remove from wishlist error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to remove from wishlist",
      });
    }
  }
}

export default new RewardController();
