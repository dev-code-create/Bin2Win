import mongoose from 'mongoose';

const collectionBoothSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'Booth name cannot exceed 100 characters']
  },
  boothId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  location: {
    latitude: {
      type: Number,
      required: true,
      min: [-90, 'Latitude must be between -90 and 90'],
      max: [90, 'Latitude must be between -90 and 90']
    },
    longitude: {
      type: Number,
      required: true,
      min: [-180, 'Longitude must be between -180 and 180'],
      max: [180, 'Longitude must be between -180 and 180']
    },
    address: {
      type: String,
      required: true,
      trim: true,
      maxlength: [200, 'Address cannot exceed 200 characters']
    },
    landmark: {
      type: String,
      trim: true,
      maxlength: [100, 'Landmark cannot exceed 100 characters']
    },
    area: {
      type: String,
      required: true,
      trim: true
    },
    pincode: {
      type: String,
      required: true,
      match: [/^\d{6}$/, 'Please provide a valid 6-digit pincode']
    }
  },
  qrCode: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  capacity: {
    maxKgPerDay: {
      type: Number,
      required: true,
      min: [50, 'Daily capacity must be at least 50 kg']
    },
    maxSubmissionsPerDay: {
      type: Number,
      required: true,
      min: [10, 'Daily submissions must be at least 10']
    }
  },
  currentLoad: {
    totalKgToday: {
      type: Number,
      default: 0,
      min: [0, 'Current load cannot be negative']
    },
    submissionsToday: {
      type: Number,
      default: 0,
      min: [0, 'Submissions count cannot be negative']
    },
    lastResetDate: {
      type: Date,
      default: Date.now
    }
  },
  operatingHours: {
    start: {
      type: String,
      required: true,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide time in HH:MM format']
    },
    end: {
      type: String,
      required: true,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide time in HH:MM format']
    },
    isOpen24Hours: {
      type: Boolean,
      default: false
    },
    closedDays: [{
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    }]
  },
  contactPerson: {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: [50, 'Contact person name cannot exceed 50 characters']
    },
    phone: {
      type: String,
      required: true,
      match: [/^\+?[1-9]\d{1,14}$/, 'Please provide a valid phone number']
    },
    alternatePhone: {
      type: String,
      match: [/^\+?[1-9]\d{1,14}$/, 'Please provide a valid alternate phone number']
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    }
  },
  facilities: {
    hasWeighingScale: {
      type: Boolean,
      default: true
    },
    hasSegregation: {
      type: Boolean,
      default: true
    },
    hasWashingFacility: {
      type: Boolean,
      default: false
    },
    hasShade: {
      type: Boolean,
      default: true
    },
    hasSeating: {
      type: Boolean,
      default: false
    },
    acceptedWasteTypes: [{
      type: String,
      enum: ['plastic', 'organic', 'paper', 'metal', 'glass', 'electronic', 'textile', 'hazardous']
    }],
    specialInstructions: {
      type: String,
      maxlength: [300, 'Special instructions cannot exceed 300 characters']
    }
  },
  statistics: {
    totalCollected: {
      type: Number,
      default: 0
    },
    totalSubmissions: {
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
    lastCollectionDate: Date,
    mostCollectedWasteType: String
  },
  // Booth operator/admin details
  operators: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    },
    name: String,
    phone: String,
    shift: {
      type: String,
      enum: ['morning', 'afternoon', 'evening', 'night', 'full_day']
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  // Maintenance and status
  maintenance: {
    lastServiceDate: Date,
    nextServiceDate: Date,
    serviceProvider: String,
    issues: [{
      description: String,
      reportedDate: {
        type: Date,
        default: Date.now
      },
      status: {
        type: String,
        enum: ['reported', 'in_progress', 'resolved'],
        default: 'reported'
      },
      resolvedDate: Date
    }]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
collectionBoothSchema.index({ 'location.latitude': 1, 'location.longitude': 1 });
collectionBoothSchema.index({ isActive: 1 });
collectionBoothSchema.index({ boothId: 1 });
collectionBoothSchema.index({ qrCode: 1 });
collectionBoothSchema.index({ 'location.area': 1 });

// Virtual for capacity utilization percentage
collectionBoothSchema.virtual('capacityUtilization').get(function() {
  return {
    weight: ((this.currentLoad.totalKgToday / this.capacity.maxKgPerDay) * 100).toFixed(1),
    submissions: ((this.currentLoad.submissionsToday / this.capacity.maxSubmissionsPerDay) * 100).toFixed(1)
  };
});

// Virtual for current operating status
collectionBoothSchema.virtual('currentStatus').get(function() {
  if (!this.isActive) return 'inactive';
  
  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 5);
  const currentDay = now.toLocaleDateString('en-US', { weekday: 'lowercase' });
  
  // Check if closed today
  if (this.operatingHours.closedDays.includes(currentDay)) {
    return 'closed_today';
  }
  
  // Check if 24 hours
  if (this.operatingHours.isOpen24Hours) {
    return 'open';
  }
  
  // Check operating hours
  const start = this.operatingHours.start;
  const end = this.operatingHours.end;
  
  if (currentTime >= start && currentTime <= end) {
    // Check capacity
    if (this.currentLoad.totalKgToday >= this.capacity.maxKgPerDay) {
      return 'full';
    }
    return 'open';
  }
  
  return 'closed';
});

// Method to check if booth can accept more waste
collectionBoothSchema.methods.canAcceptWaste = function(quantity) {
  if (!this.isActive) return { canAccept: false, reason: 'Booth is inactive' };
  
  const status = this.currentStatus;
  if (status === 'closed' || status === 'closed_today') {
    return { canAccept: false, reason: 'Booth is currently closed' };
  }
  
  if (status === 'full') {
    return { canAccept: false, reason: 'Booth has reached daily capacity' };
  }
  
  if (this.currentLoad.totalKgToday + quantity > this.capacity.maxKgPerDay) {
    return { canAccept: false, reason: 'Adding this quantity would exceed daily capacity' };
  }
  
  return { canAccept: true, reason: 'Booth can accept waste' };
};

// Method to add waste submission to booth
collectionBoothSchema.methods.addSubmission = function(quantity) {
  // Reset daily counters if it's a new day
  const today = new Date().toDateString();
  const lastReset = new Date(this.currentLoad.lastResetDate).toDateString();
  
  if (today !== lastReset) {
    this.currentLoad.totalKgToday = 0;
    this.currentLoad.submissionsToday = 0;
    this.currentLoad.lastResetDate = new Date();
  }
  
  this.currentLoad.totalKgToday += quantity;
  this.currentLoad.submissionsToday += 1;
  this.statistics.totalCollected += quantity;
  this.statistics.totalSubmissions += 1;
  this.statistics.lastCollectionDate = new Date();
  
  return this.save();
};

// Method to calculate distance from given coordinates
collectionBoothSchema.methods.getDistance = function(lat, lng) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat - this.location.latitude) * Math.PI / 180;
  const dLng = (lng - this.location.longitude) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(this.location.latitude * Math.PI / 180) * Math.cos(lat * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
};

// Static method to find nearby booths
collectionBoothSchema.statics.findNearby = function(lat, lng, maxDistance = 10) {
  return this.find({
    isActive: true,
    'location.latitude': {
      $gte: lat - (maxDistance / 111.32), // Rough conversion: 1 degree ≈ 111.32 km
      $lte: lat + (maxDistance / 111.32)
    },
    'location.longitude': {
      $gte: lng - (maxDistance / (111.32 * Math.cos(lat * Math.PI / 180))),
      $lte: lng + (maxDistance / (111.32 * Math.cos(lat * Math.PI / 180)))
    }
  }).then(booths => {
    // Calculate exact distances and filter
    return booths
      .map(booth => ({
        ...booth.toObject(),
        distance: booth.getDistance(lat, lng)
      }))
      .filter(booth => booth.distance <= maxDistance)
      .sort((a, b) => a.distance - b.distance);
  });
};

const CollectionBooth = mongoose.model('CollectionBooth', collectionBoothSchema);

export default CollectionBooth;
