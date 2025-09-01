import mongoose from "mongoose";

const wasteSubmissionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    boothId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CollectionBooth",
      required: true,
      index: true,
    },
    wasteType: {
      type: String,
      required: true,
      enum: {
        values: [
          "plastic",
          "organic",
          "paper",
          "metal",
          "glass",
          "electronic",
          "textile",
          "hazardous",
        ],
        message: "Invalid waste type",
      },
    },
    quantity: {
      type: Number,
      required: true,
      min: [0.1, "Quantity must be at least 0.1 kg"],
      max: [1000, "Quantity cannot exceed 1000 kg"],
    },
    pointsEarned: {
      type: Number,
      required: true,
      min: [0, "Points earned cannot be negative"],
    },
    submissionDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    qrCode: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: ["pending", "approved", "rejected", "processing"],
        message: "Invalid status",
      },
      default: "pending",
      index: true,
    },
    photos: [
      {
        url: {
          type: String,
          required: true,
        },
        filename: String,
        uploadDate: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    verificationDate: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      maxlength: [500, "Notes cannot exceed 500 characters"],
    },
    // Additional metadata
    metadata: {
      deviceInfo: String,
      location: {
        latitude: Number,
        longitude: Number,
      },
      weatherCondition: String,
      submissionMethod: {
        type: String,
        enum: ["qr_scan", "manual", "booth_operator"],
        default: "qr_scan",
      },
    },
    // Quality assessment
    qualityScore: {
      type: Number,
      min: [1, "Quality score must be at least 1"],
      max: [5, "Quality score cannot exceed 5"],
      default: null,
    },
    // Processing information
    processing: {
      recyclingPartner: String,
      processedDate: Date,
      processingStatus: {
        type: String,
        enum: ["not_processed", "in_progress", "completed", "rejected"],
        default: "not_processed",
      },
      recyclingValue: Number, // Value in rupees
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes for better query performance
wasteSubmissionSchema.index({ userId: 1, submissionDate: -1 });
wasteSubmissionSchema.index({ boothId: 1, submissionDate: -1 });
wasteSubmissionSchema.index({ status: 1, submissionDate: -1 });
wasteSubmissionSchema.index({ wasteType: 1, submissionDate: -1 });

// Virtual for calculating environmental impact
wasteSubmissionSchema.virtual("environmentalImpact").get(function () {
  const impactFactors = {
    plastic: 2.5, // CO2 saved per kg
    organic: 0.5,
    paper: 1.2,
    metal: 3.0,
    glass: 0.8,
    electronic: 4.0,
    textile: 1.5,
    hazardous: 5.0,
  };

  return {
    co2Saved: (this.quantity * impactFactors[this.wasteType]).toFixed(2),
    unit: "kg CO2",
  };
});

// Static method to calculate points based on waste type and quantity
wasteSubmissionSchema.statics.calculatePoints = function (wasteType, quantity) {
  const pointsPerKg = {
    plastic: 10,
    organic: 5,
    paper: 8,
    metal: 15,
    glass: 12,
    electronic: 20,
    textile: 6,
    hazardous: 25,
  };

  const basePoints = pointsPerKg[wasteType] * quantity;

  // Bonus points for larger quantities
  let bonus = 0;
  if (quantity >= 10) bonus = basePoints * 0.2; // 20% bonus for 10kg+
  else if (quantity >= 5) bonus = basePoints * 0.1; // 10% bonus for 5kg+

  return Math.round(basePoints + bonus);
};

// Method to approve submission
wasteSubmissionSchema.methods.approve = function (adminId, notes) {
  this.status = "approved";
  this.verifiedBy = adminId;
  this.verificationDate = new Date();
  if (notes) this.notes = notes;
  return this.save();
};

// Method to reject submission
wasteSubmissionSchema.methods.reject = function (adminId, reason) {
  this.status = "rejected";
  this.verifiedBy = adminId;
  this.verificationDate = new Date();
  this.notes = reason;
  this.pointsEarned = 0; // No points for rejected submissions
  return this.save();
};

// Static method to get waste statistics
wasteSubmissionSchema.statics.getWasteStats = function (startDate, endDate) {
  const matchQuery = {
    status: "approved",
  };

  if (startDate || endDate) {
    matchQuery.submissionDate = {};
    if (startDate) matchQuery.submissionDate.$gte = new Date(startDate);
    if (endDate) matchQuery.submissionDate.$lte = new Date(endDate);
  }

  return this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: "$wasteType",
        totalQuantity: { $sum: "$quantity" },
        totalSubmissions: { $sum: 1 },
        totalPoints: { $sum: "$pointsEarned" },
        averageQuantity: { $avg: "$quantity" },
      },
    },
    {
      $sort: { totalQuantity: -1 },
    },
  ]);
};

// Pre-save middleware to calculate points if not provided
wasteSubmissionSchema.pre("save", function (next) {
  if (this.isNew && !this.pointsEarned) {
    this.pointsEarned = this.constructor.calculatePoints(
      this.wasteType,
      this.quantity
    );
  }
  next();
});

const WasteSubmission = mongoose.model(
  "WasteSubmission",
  wasteSubmissionSchema
);

export default WasteSubmission;
