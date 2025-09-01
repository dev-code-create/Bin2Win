import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']
  },
  password: {
    type: String,
    required: true,
    minlength: [6, 'Password must be at least 6 characters long']
  },
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  phoneNumber: {
    type: String,
    trim: true,
    match: [/^\+?[1-9]\d{1,14}$/, 'Please provide a valid phone number']
  },
  greenCredits: {
    type: Number,
    default: 0,
    min: [0, 'Green credits cannot be negative']
  },
  totalWasteSubmitted: {
    type: Number,
    default: 0,
    min: [0, 'Total waste submitted cannot be negative']
  },
  registrationDate: {
    type: Date,
    default: Date.now
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  profileImage: {
    type: String,
    default: null
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String
  },
  preferences: {
    notifications: {
      type: Boolean,
      default: true
    },
    language: {
      type: String,
      enum: ['en', 'hi', 'mr'],
      default: 'en'
    }
  },
  // QR Code for user identification at booths
  qrCode: {
    type: String,
    unique: true,
    required: true
  },
  // User statistics
  stats: {
    totalSubmissions: {
      type: Number,
      default: 0
    },
    totalPointsEarned: {
      type: Number,
      default: 0
    },
    totalPointsRedeemed: {
      type: Number,
      default: 0
    },
    favoriteWasteType: String,
    rank: {
      type: String,
      enum: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'],
      default: 'Bronze'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for user's current rank based on points
userSchema.virtual('currentRank').get(function() {
  const points = this.greenCredits;
  if (points >= 10000) return 'Diamond';
  if (points >= 5000) return 'Platinum';
  if (points >= 2000) return 'Gold';
  if (points >= 500) return 'Silver';
  return 'Bronze';
});

// Index for better query performance
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ phoneNumber: 1 });
userSchema.index({ qrCode: 1 });
userSchema.index({ greenCredits: -1 });
userSchema.index({ isActive: 1 });

// Pre-save middleware to hash password and update lastActive
userSchema.pre('save', async function(next) {
  // Hash password if it's modified
  if (this.isModified('password')) {
    try {
      const saltRounds = 12;
      this.password = await bcrypt.hash(this.password, saltRounds);
    } catch (error) {
      return next(error);
    }
  }
  
  // Update lastActive if document is modified
  if (this.isModified() && !this.isModified('lastActive')) {
    this.lastActive = new Date();
  }
  
  next();
});

// Method to add green credits
userSchema.methods.addCredits = function(amount) {
  this.greenCredits += amount;
  this.stats.totalPointsEarned += amount;
  return this.save();
};

// Method to deduct green credits
userSchema.methods.deductCredits = function(amount) {
  if (this.greenCredits < amount) {
    throw new Error('Insufficient green credits');
  }
  this.greenCredits -= amount;
  this.stats.totalPointsRedeemed += amount;
  return this.save();
};

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Method to update rank based on current points
userSchema.methods.updateRank = function() {
  this.stats.rank = this.currentRank;
  return this.save();
};

// Static method to find users by username
userSchema.statics.findByUsername = function(username) {
  return this.findOne({ username, isActive: true });
};

// Static method to find users by email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email, isActive: true });
};

// Static method to find users by phone number
userSchema.statics.findByPhoneNumber = function(phoneNumber) {
  return this.findOne({ phoneNumber, isActive: true });
};

// Static method to get leaderboard
userSchema.statics.getLeaderboard = function(limit = 10) {
  return this.find({ isActive: true })
    .sort({ greenCredits: -1 })
    .limit(limit)
    .select('name greenCredits stats.rank profileImage');
};

const User = mongoose.model('User', userSchema);

export default User;
