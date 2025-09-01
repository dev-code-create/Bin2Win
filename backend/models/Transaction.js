import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: {
      values: ['earn', 'redeem', 'bonus', 'penalty', 'refund', 'adjustment'],
      message: 'Invalid transaction type'
    },
    index: true
  },
  points: {
    type: Number,
    required: true,
    validate: {
      validator: function(v) {
        // Points should be positive for earn, bonus, refund, adjustment
        // Points should be negative for redeem, penalty
        if (['earn', 'bonus', 'refund'].includes(this.type)) {
          return v > 0;
        } else if (['redeem', 'penalty'].includes(this.type)) {
          return v < 0;
        }
        return true; // adjustment can be positive or negative
      },
      message: 'Points value does not match transaction type'
    }
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'relatedModel'
  },
  relatedModel: {
    type: String,
    required: true,
    enum: ['WasteSubmission', 'Reward', 'User', 'CollectionBooth']
  },
  date: {
    type: Date,
    default: Date.now,
    index: true
  },
  status: {
    type: String,
    enum: {
      values: ['completed', 'pending', 'cancelled', 'failed', 'processing'],
      message: 'Invalid transaction status'
    },
    default: 'completed',
    index: true
  },
  // Additional transaction details
  metadata: {
    // For waste submissions
    wasteType: String,
    quantity: Number,
    boothName: String,
    
    // For rewards
    rewardName: String,
    rewardCategory: String,
    redemptionMethod: String,
    
    // For bonuses/penalties
    reason: String,
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    },
    
    // System information
    source: {
      type: String,
      enum: ['mobile_app', 'web_app', 'admin_panel', 'system', 'api'],
      default: 'mobile_app'
    },
    ipAddress: String,
    userAgent: String,
    deviceId: String
  },
  // Balance tracking
  balanceBefore: {
    type: Number,
    required: true,
    min: [0, 'Balance before cannot be negative']
  },
  balanceAfter: {
    type: Number,
    required: true,
    min: [0, 'Balance after cannot be negative']
  },
  // Reference number for tracking
  referenceNumber: {
    type: String,
    unique: true,
    required: true,
    uppercase: true
  },
  // Processing information
  processing: {
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    },
    processedAt: Date,
    processingNotes: String,
    retryCount: {
      type: Number,
      default: 0
    },
    lastRetryAt: Date
  },
  // Expiry for certain transactions (like pending redemptions)
  expiresAt: {
    type: Date,
    index: { expireAfterSeconds: 0 }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for better query performance
transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, type: 1, date: -1 });
transactionSchema.index({ status: 1, date: -1 });
transactionSchema.index({ referenceNumber: 1 }, { unique: true });

// Virtual for absolute points value
transactionSchema.virtual('absolutePoints').get(function() {
  return Math.abs(this.points);
});

// Virtual for transaction category (credit/debit)
transactionSchema.virtual('category').get(function() {
  return this.points >= 0 ? 'credit' : 'debit';
});

// Pre-save middleware to generate reference number
transactionSchema.pre('save', function(next) {
  if (this.isNew && !this.referenceNumber) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    const typePrefix = this.type.substr(0, 2).toUpperCase();
    this.referenceNumber = `${typePrefix}${timestamp}${random}`;
  }
  next();
});

// Method to mark transaction as completed
transactionSchema.methods.complete = function(adminId = null, notes = null) {
  this.status = 'completed';
  this.processing.processedBy = adminId;
  this.processing.processedAt = new Date();
  if (notes) this.processing.processingNotes = notes;
  return this.save();
};

// Method to cancel transaction
transactionSchema.methods.cancel = function(reason, adminId = null) {
  this.status = 'cancelled';
  this.processing.processedBy = adminId;
  this.processing.processedAt = new Date();
  this.processing.processingNotes = reason;
  return this.save();
};

// Method to retry failed transaction
transactionSchema.methods.retry = function() {
  this.status = 'processing';
  this.processing.retryCount += 1;
  this.processing.lastRetryAt = new Date();
  return this.save();
};

// Static method to create earn transaction
transactionSchema.statics.createEarnTransaction = async function(userId, points, wasteSubmissionId, description, balanceBefore) {
  const transaction = new this({
    userId,
    type: 'earn',
    points: Math.abs(points), // Ensure positive
    description,
    relatedId: wasteSubmissionId,
    relatedModel: 'WasteSubmission',
    balanceBefore,
    balanceAfter: balanceBefore + Math.abs(points),
    status: 'completed'
  });
  
  return transaction.save();
};

// Static method to create redeem transaction
transactionSchema.statics.createRedeemTransaction = async function(userId, points, rewardId, description, balanceBefore) {
  const transaction = new this({
    userId,
    type: 'redeem',
    points: -Math.abs(points), // Ensure negative
    description,
    relatedId: rewardId,
    relatedModel: 'Reward',
    balanceBefore,
    balanceAfter: balanceBefore - Math.abs(points),
    status: 'completed'
  });
  
  return transaction.save();
};

// Static method to create bonus transaction
transactionSchema.statics.createBonusTransaction = async function(userId, points, reason, adminId, balanceBefore) {
  const transaction = new this({
    userId,
    type: 'bonus',
    points: Math.abs(points), // Ensure positive
    description: `Bonus: ${reason}`,
    relatedId: userId,
    relatedModel: 'User',
    balanceBefore,
    balanceAfter: balanceBefore + Math.abs(points),
    metadata: {
      reason,
      adminId
    },
    status: 'completed'
  });
  
  return transaction.save();
};

// Static method to get user transaction history
transactionSchema.statics.getUserHistory = function(userId, options = {}) {
  const {
    page = 1,
    limit = 20,
    type = null,
    status = null,
    startDate = null,
    endDate = null
  } = options;
  
  const query = { userId };
  
  if (type) query.type = type;
  if (status) query.status = status;
  
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }
  
  return this.find(query)
    .sort({ date: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('relatedId', 'name wasteType quantity')
    .lean();
};

// Static method to get transaction statistics
transactionSchema.statics.getTransactionStats = function(userId, period = '30d') {
  const periodDays = parseInt(period.replace('d', ''));
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - periodDays);
  
  return this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        date: { $gte: startDate },
        status: 'completed'
      }
    },
    {
      $group: {
        _id: '$type',
        totalPoints: { $sum: '$points' },
        count: { $sum: 1 },
        avgPoints: { $avg: '$points' }
      }
    },
    {
      $group: {
        _id: null,
        totalEarned: {
          $sum: {
            $cond: [{ $gt: ['$totalPoints', 0] }, '$totalPoints', 0]
          }
        },
        totalSpent: {
          $sum: {
            $cond: [{ $lt: ['$totalPoints', 0] }, { $abs: '$totalPoints' }, 0]
          }
        },
        totalTransactions: { $sum: '$count' },
        breakdown: {
          $push: {
            type: '$_id',
            total: '$totalPoints',
            count: '$count',
            average: '$avgPoints'
          }
        }
      }
    }
  ]);
};

// Static method to get system-wide transaction stats
transactionSchema.statics.getSystemStats = function(startDate, endDate) {
  const matchQuery = {
    status: 'completed'
  };
  
  if (startDate || endDate) {
    matchQuery.date = {};
    if (startDate) matchQuery.date.$gte = new Date(startDate);
    if (endDate) matchQuery.date.$lte = new Date(endDate);
  }
  
  return this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: {
          type: '$type',
          date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }
        },
        totalPoints: { $sum: '$points' },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.type',
        totalPoints: { $sum: '$totalPoints' },
        totalCount: { $sum: '$count' },
        dailyBreakdown: {
          $push: {
            date: '$_id.date',
            points: '$totalPoints',
            count: '$count'
          }
        }
      }
    }
  ]);
};

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;
