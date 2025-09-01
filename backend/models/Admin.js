import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const adminSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    minlength: [3, 'Username must be at least 3 characters long'],
    maxlength: [20, 'Username cannot exceed 20 characters'],
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: true,
    minlength: [8, 'Password must be at least 8 characters long']
  },
  fullName: {
    type: String,
    required: true,
    trim: true,
    maxlength: [50, 'Full name cannot exceed 50 characters']
  },
  phoneNumber: {
    type: String,
    required: true,
    match: [/^\+?[1-9]\d{1,14}$/, 'Please provide a valid phone number']
  },
  role: {
    type: String,
    required: true,
    enum: {
      values: ['super_admin', 'admin', 'booth_operator', 'moderator', 'viewer'],
      message: 'Invalid admin role'
    },
    index: true
  },
  permissions: [{
    module: {
      type: String,
      enum: ['users', 'booths', 'waste', 'rewards', 'transactions', 'analytics', 'system'],
      required: true
    },
    actions: [{
      type: String,
      enum: ['create', 'read', 'update', 'delete', 'approve', 'reject'],
      required: true
    }]
  }],
  assignedBooths: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CollectionBooth'
  }],
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  lastLogin: {
    type: Date,
    default: null
  },
  loginAttempts: {
    count: {
      type: Number,
      default: 0
    },
    lastAttempt: Date,
    lockedUntil: Date
  },
  profile: {
    avatar: String,
    bio: {
      type: String,
      maxlength: [200, 'Bio cannot exceed 200 characters']
    },
    department: String,
    employeeId: String,
    joiningDate: Date,
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String
    }
  },
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'light'
    },
    language: {
      type: String,
      enum: ['en', 'hi', 'mr'],
      default: 'en'
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      sms: {
        type: Boolean,
        default: false
      },
      inApp: {
        type: Boolean,
        default: true
      }
    },
    dashboard: {
      layout: String,
      widgets: [String]
    }
  },
  statistics: {
    totalLogins: {
      type: Number,
      default: 0
    },
    submissionsVerified: {
      type: Number,
      default: 0
    },
    submissionsApproved: {
      type: Number,
      default: 0
    },
    submissionsRejected: {
      type: Number,
      default: 0
    },
    averageProcessingTime: {
      type: Number,
      default: 0 // in minutes
    }
  },
  // Security and audit
  security: {
    twoFactorEnabled: {
      type: Boolean,
      default: false
    },
    twoFactorSecret: String,
    apiKeys: [{
      keyId: String,
      keyHash: String,
      name: String,
      permissions: [String],
      createdAt: {
        type: Date,
        default: Date.now
      },
      lastUsed: Date,
      isActive: {
        type: Boolean,
        default: true
      }
    }],
    ipWhitelist: [String],
    sessionTimeout: {
      type: Number,
      default: 3600 // seconds
    }
  }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.security.twoFactorSecret;
      delete ret.security.apiKeys;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Indexes for better query performance
adminSchema.index({ email: 1 }, { unique: true });
adminSchema.index({ username: 1 }, { unique: true });
adminSchema.index({ role: 1, isActive: 1 });
adminSchema.index({ assignedBooths: 1 });

// Virtual for account lock status
adminSchema.virtual('isLocked').get(function() {
  return !!(this.loginAttempts.lockedUntil && this.loginAttempts.lockedUntil > Date.now());
});

// Virtual for full permissions list
adminSchema.virtual('allPermissions').get(function() {
  const permissions = new Set();
  this.permissions.forEach(perm => {
    perm.actions.forEach(action => {
      permissions.add(`${perm.module}:${action}`);
    });
  });
  return Array.from(permissions);
});

// Pre-save middleware to hash password
adminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
adminSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to check if admin has specific permission
adminSchema.methods.hasPermission = function(module, action) {
  if (this.role === 'super_admin') return true;
  
  return this.permissions.some(perm => 
    perm.module === module && perm.actions.includes(action)
  );
};

// Method to add permission
adminSchema.methods.addPermission = function(module, actions) {
  const existingPerm = this.permissions.find(p => p.module === module);
  
  if (existingPerm) {
    // Add new actions to existing module permission
    actions.forEach(action => {
      if (!existingPerm.actions.includes(action)) {
        existingPerm.actions.push(action);
      }
    });
  } else {
    // Create new permission for module
    this.permissions.push({
      module,
      actions: Array.isArray(actions) ? actions : [actions]
    });
  }
  
  return this.save();
};

// Method to remove permission
adminSchema.methods.removePermission = function(module, actions = null) {
  if (!actions) {
    // Remove entire module permission
    this.permissions = this.permissions.filter(p => p.module !== module);
  } else {
    // Remove specific actions from module
    const perm = this.permissions.find(p => p.module === module);
    if (perm) {
      perm.actions = perm.actions.filter(action => !actions.includes(action));
      if (perm.actions.length === 0) {
        this.permissions = this.permissions.filter(p => p.module !== module);
      }
    }
  }
  
  return this.save();
};

// Method to handle login attempt
adminSchema.methods.handleLoginAttempt = function(successful) {
  if (successful) {
    // Reset login attempts on successful login
    if (this.loginAttempts.count > 0) {
      this.loginAttempts.count = 0;
      this.loginAttempts.lastAttempt = undefined;
      this.loginAttempts.lockedUntil = undefined;
    }
    this.lastLogin = new Date();
    this.statistics.totalLogins += 1;
  } else {
    // Increment failed attempts
    this.loginAttempts.count += 1;
    this.loginAttempts.lastAttempt = new Date();
    
    // Lock account after 5 failed attempts for 30 minutes
    if (this.loginAttempts.count >= 5) {
      this.loginAttempts.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
    }
  }
  
  return this.save();
};

// Method to assign booth
adminSchema.methods.assignBooth = function(boothId) {
  if (!this.assignedBooths.includes(boothId)) {
    this.assignedBooths.push(boothId);
  }
  return this.save();
};

// Method to unassign booth
adminSchema.methods.unassignBooth = function(boothId) {
  this.assignedBooths = this.assignedBooths.filter(id => !id.equals(boothId));
  return this.save();
};

// Method to update processing statistics
adminSchema.methods.updateProcessingStats = function(action, processingTime = null) {
  if (action === 'approved') {
    this.statistics.submissionsApproved += 1;
  } else if (action === 'rejected') {
    this.statistics.submissionsRejected += 1;
  }
  
  this.statistics.submissionsVerified += 1;
  
  // Update average processing time
  if (processingTime) {
    const currentAvg = this.statistics.averageProcessingTime;
    const totalVerified = this.statistics.submissionsVerified;
    this.statistics.averageProcessingTime = 
      ((currentAvg * (totalVerified - 1)) + processingTime) / totalVerified;
  }
  
  return this.save();
};

// Static method to create default permissions by role
adminSchema.statics.getDefaultPermissions = function(role) {
  const permissionSets = {
    super_admin: [
      { module: 'users', actions: ['create', 'read', 'update', 'delete'] },
      { module: 'booths', actions: ['create', 'read', 'update', 'delete'] },
      { module: 'waste', actions: ['create', 'read', 'update', 'delete', 'approve', 'reject'] },
      { module: 'rewards', actions: ['create', 'read', 'update', 'delete'] },
      { module: 'transactions', actions: ['create', 'read', 'update', 'delete'] },
      { module: 'analytics', actions: ['read'] },
      { module: 'system', actions: ['read', 'update'] }
    ],
    admin: [
      { module: 'users', actions: ['read', 'update'] },
      { module: 'booths', actions: ['read', 'update'] },
      { module: 'waste', actions: ['read', 'update', 'approve', 'reject'] },
      { module: 'rewards', actions: ['read', 'update'] },
      { module: 'transactions', actions: ['read'] },
      { module: 'analytics', actions: ['read'] }
    ],
    booth_operator: [
      { module: 'waste', actions: ['read', 'update', 'approve', 'reject'] },
      { module: 'booths', actions: ['read', 'update'] },
      { module: 'users', actions: ['read'] }
    ],
    moderator: [
      { module: 'users', actions: ['read', 'update'] },
      { module: 'waste', actions: ['read', 'approve', 'reject'] },
      { module: 'rewards', actions: ['read'] },
      { module: 'transactions', actions: ['read'] }
    ],
    viewer: [
      { module: 'users', actions: ['read'] },
      { module: 'booths', actions: ['read'] },
      { module: 'waste', actions: ['read'] },
      { module: 'rewards', actions: ['read'] },
      { module: 'transactions', actions: ['read'] },
      { module: 'analytics', actions: ['read'] }
    ]
  };
  
  return permissionSets[role] || [];
};

// Static method to find admin by email or username
adminSchema.statics.findByLogin = function(login) {
  return this.findOne({
    $or: [
      { email: login.toLowerCase() },
      { username: login.toLowerCase() }
    ],
    isActive: true
  });
};

const Admin = mongoose.model('Admin', adminSchema);

export default Admin;
