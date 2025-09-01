import mongoose from 'mongoose';

const rewardSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'Reward name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  pointsRequired: {
    type: Number,
    required: true,
    min: [1, 'Points required must be at least 1'],
    index: true
  },
  category: {
    type: String,
    required: true,
    enum: {
      values: ['prasad', 'flowers', 'coconut', 'merchandise', 'voucher', 'experience', 'donation'],
      message: 'Invalid reward category'
    },
    index: true
  },
  subcategory: {
    type: String,
    trim: true,
    maxlength: [50, 'Subcategory cannot exceed 50 characters']
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    alt: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  stock: {
    total: {
      type: Number,
      required: true,
      min: [0, 'Stock cannot be negative']
    },
    available: {
      type: Number,
      required: true,
      min: [0, 'Available stock cannot be negative']
    },
    reserved: {
      type: Number,
      default: 0,
      min: [0, 'Reserved stock cannot be negative']
    }
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  sponsor: {
    name: {
      type: String,
      trim: true,
      maxlength: [100, 'Sponsor name cannot exceed 100 characters']
    },
    logo: String,
    website: String,
    contactInfo: {
      email: String,
      phone: String
    }
  },
  availability: {
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: {
      type: Date,
      default: null
    },
    isLimitedTime: {
      type: Boolean,
      default: false
    },
    availableDays: [{
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    }],
    availableHours: {
      start: String, // HH:MM format
      end: String    // HH:MM format
    }
  },
  redemption: {
    method: {
      type: String,
      enum: ['physical_pickup', 'digital_delivery', 'voucher_code', 'experience_booking'],
      required: true
    },
    locations: [{
      name: String,
      address: String,
      coordinates: {
        latitude: Number,
        longitude: Number
      },
      contactPerson: String,
      phone: String,
      operatingHours: {
        start: String,
        end: String
      }
    }],
    instructions: {
      type: String,
      maxlength: [300, 'Instructions cannot exceed 300 characters']
    },
    validityPeriod: {
      type: Number, // Days
      default: 30,
      min: [1, 'Validity period must be at least 1 day']
    }
  },
  statistics: {
    totalRedeemed: {
      type: Number,
      default: 0
    },
    totalViews: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be negative'],
      max: [5, 'Rating cannot exceed 5']
    },
    totalRatings: {
      type: Number,
      default: 0
    },
    popularityScore: {
      type: Number,
      default: 0
    }
  },
  pricing: {
    originalValue: {
      type: Number,
      min: [0, 'Original value cannot be negative']
    },
    discountPercentage: {
      type: Number,
      default: 0,
      min: [0, 'Discount cannot be negative'],
      max: [100, 'Discount cannot exceed 100%']
    }
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  requirements: {
    minimumRank: {
      type: String,
      enum: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'],
      default: 'Bronze'
    },
    minimumWasteSubmissions: {
      type: Number,
      default: 0,
      min: [0, 'Minimum submissions cannot be negative']
    },
    allowedUserTypes: [{
      type: String,
      enum: ['regular', 'premium', 'volunteer', 'sponsor']
    }]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
rewardSchema.index({ category: 1, isActive: 1 });
rewardSchema.index({ pointsRequired: 1, isActive: 1 });
rewardSchema.index({ 'stock.available': 1, isActive: 1 });
rewardSchema.index({ 'statistics.popularityScore': -1 });
rewardSchema.index({ tags: 1 });

// Virtual for stock status
rewardSchema.virtual('stockStatus').get(function() {
  if (this.stock.available === 0) return 'out_of_stock';
  if (this.stock.available <= (this.stock.total * 0.1)) return 'low_stock';
  if (this.stock.available <= (this.stock.total * 0.3)) return 'medium_stock';
  return 'in_stock';
});

// Virtual for availability status
rewardSchema.virtual('availabilityStatus').get(function() {
  if (!this.isActive) return 'inactive';
  
  const now = new Date();
  
  // Check date range
  if (this.availability.isLimitedTime) {
    if (this.availability.startDate && now < this.availability.startDate) {
      return 'not_yet_available';
    }
    if (this.availability.endDate && now > this.availability.endDate) {
      return 'expired';
    }
  }
  
  // Check day of week
  if (this.availability.availableDays.length > 0) {
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'lowercase' });
    if (!this.availability.availableDays.includes(currentDay)) {
      return 'not_available_today';
    }
  }
  
  // Check hours
  if (this.availability.availableHours.start && this.availability.availableHours.end) {
    const currentTime = now.toTimeString().slice(0, 5);
    if (currentTime < this.availability.availableHours.start || currentTime > this.availability.availableHours.end) {
      return 'not_available_now';
    }
  }
  
  return 'available';
});

// Virtual for primary image
rewardSchema.virtual('primaryImage').get(function() {
  const primary = this.images.find(img => img.isPrimary);
  return primary ? primary.url : (this.images[0] ? this.images[0].url : null);
});

// Virtual for discounted points
rewardSchema.virtual('effectivePoints').get(function() {
  if (this.pricing.discountPercentage > 0) {
    return Math.round(this.pointsRequired * (1 - this.pricing.discountPercentage / 100));
  }
  return this.pointsRequired;
});

// Method to check if user can redeem this reward
rewardSchema.methods.canUserRedeem = function(user) {
  const errors = [];
  
  // Check if active
  if (!this.isActive) {
    errors.push('Reward is currently inactive');
  }
  
  // Check availability
  const availabilityStatus = this.availabilityStatus;
  if (availabilityStatus !== 'available') {
    errors.push(`Reward is ${availabilityStatus.replace(/_/g, ' ')}`);
  }
  
  // Check stock
  if (this.stock.available === 0) {
    errors.push('Reward is out of stock');
  }
  
  // Check user points
  if (user.greenCredits < this.effectivePoints) {
    errors.push(`Insufficient green credits. Required: ${this.effectivePoints}, Available: ${user.greenCredits}`);
  }
  
  // Check user rank
  const rankOrder = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];
  const userRankIndex = rankOrder.indexOf(user.currentRank);
  const requiredRankIndex = rankOrder.indexOf(this.requirements.minimumRank);
  
  if (userRankIndex < requiredRankIndex) {
    errors.push(`Minimum rank required: ${this.requirements.minimumRank}`);
  }
  
  // Check minimum submissions
  if (user.stats.totalSubmissions < this.requirements.minimumWasteSubmissions) {
    errors.push(`Minimum ${this.requirements.minimumWasteSubmissions} waste submissions required`);
  }
  
  return {
    canRedeem: errors.length === 0,
    errors: errors
  };
};

// Method to reserve stock for redemption
rewardSchema.methods.reserveStock = function(quantity = 1) {
  if (this.stock.available < quantity) {
    throw new Error('Insufficient stock available');
  }
  
  this.stock.available -= quantity;
  this.stock.reserved += quantity;
  return this.save();
};

// Method to confirm redemption (move from reserved to redeemed)
rewardSchema.methods.confirmRedemption = function(quantity = 1) {
  if (this.stock.reserved < quantity) {
    throw new Error('Insufficient reserved stock');
  }
  
  this.stock.reserved -= quantity;
  this.statistics.totalRedeemed += quantity;
  this.updatePopularityScore();
  return this.save();
};

// Method to cancel reservation (return to available stock)
rewardSchema.methods.cancelReservation = function(quantity = 1) {
  if (this.stock.reserved < quantity) {
    throw new Error('Cannot cancel more than reserved');
  }
  
  this.stock.reserved -= quantity;
  this.stock.available += quantity;
  return this.save();
};

// Method to update popularity score
rewardSchema.methods.updatePopularityScore = function() {
  // Calculate popularity based on views, redemptions, and ratings
  const viewWeight = 0.3;
  const redemptionWeight = 0.5;
  const ratingWeight = 0.2;
  
  const normalizedViews = Math.min(this.statistics.totalViews / 1000, 1);
  const normalizedRedemptions = Math.min(this.statistics.totalRedeemed / 100, 1);
  const normalizedRating = this.statistics.averageRating / 5;
  
  this.statistics.popularityScore = 
    (normalizedViews * viewWeight) + 
    (normalizedRedemptions * redemptionWeight) + 
    (normalizedRating * ratingWeight);
  
  return this;
};

// Method to add rating
rewardSchema.methods.addRating = function(rating) {
  if (rating < 1 || rating > 5) {
    throw new Error('Rating must be between 1 and 5');
  }
  
  const totalRatingPoints = this.statistics.averageRating * this.statistics.totalRatings;
  this.statistics.totalRatings += 1;
  this.statistics.averageRating = (totalRatingPoints + rating) / this.statistics.totalRatings;
  
  this.updatePopularityScore();
  return this.save();
};

// Static method to get popular rewards
rewardSchema.statics.getPopularRewards = function(limit = 10) {
  return this.find({ 
    isActive: true,
    'stock.available': { $gt: 0 }
  })
  .sort({ 'statistics.popularityScore': -1 })
  .limit(limit);
};

// Static method to search rewards
rewardSchema.statics.searchRewards = function(query, filters = {}) {
  const searchQuery = {
    isActive: true,
    'stock.available': { $gt: 0 }
  };
  
  // Text search
  if (query) {
    searchQuery.$or = [
      { name: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
      { tags: { $in: [new RegExp(query, 'i')] } }
    ];
  }
  
  // Apply filters
  if (filters.category) searchQuery.category = filters.category;
  if (filters.maxPoints) searchQuery.pointsRequired = { $lte: filters.maxPoints };
  if (filters.minPoints) searchQuery.pointsRequired = { ...searchQuery.pointsRequired, $gte: filters.minPoints };
  
  return this.find(searchQuery).sort({ 'statistics.popularityScore': -1 });
};

// Pre-save middleware to ensure stock consistency
rewardSchema.pre('save', function(next) {
  // Ensure stock.available + stock.reserved doesn't exceed stock.total
  if (this.stock.available + this.stock.reserved > this.stock.total) {
    return next(new Error('Available + Reserved stock cannot exceed total stock'));
  }
  next();
});

const Reward = mongoose.model('Reward', rewardSchema);

export default Reward;
