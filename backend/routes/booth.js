import express from 'express';
import { catchAsync, sendResponse, sendError, sendPaginatedResponse } from '../middleware/errorHandler.js';
import { authenticateUser, authenticateAdmin, requirePermission, optionalAuth } from '../middleware/auth.js';
import { searchRateLimiter } from '../middleware/rateLimiter.js';
import CollectionBooth from '../models/CollectionBooth.js';
import WasteSubmission from '../models/WasteSubmission.js';
import crypto from 'crypto';

const router = express.Router();

// Generate unique QR code for booth
const generateBoothQRCode = (boothId, name) => {
  const timestamp = Date.now();
  const hash = crypto.createHash('sha256')
    .update(`${boothId}_${name}_${timestamp}_${process.env.JWT_SECRET}`)
    .digest('hex')
    .substring(0, 16);
  return `SIMHASTHA_BOOTH_${hash.toUpperCase()}`;
};

// GET /api/booths - Get all active booths (public endpoint)
router.get('/', optionalAuth, searchRateLimiter, catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    search,
    area,
    wasteType,
    isOpen,
    sortBy = 'name'
  } = req.query;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);

  if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
    return sendError(res, 400, 'Invalid pagination parameters');
  }

  // Build query
  const query = { isActive: true };

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { 'location.address': { $regex: search, $options: 'i' } },
      { 'location.area': { $regex: search, $options: 'i' } }
    ];
  }

  if (area) {
    query['location.area'] = { $regex: area, $options: 'i' };
  }

  if (wasteType) {
    query['facilities.acceptedWasteTypes'] = wasteType;
  }

  // Sort options
  const sortOptions = {
    name: { name: 1 },
    area: { 'location.area': 1, name: 1 },
    capacity: { 'capacity.maxKgPerDay': -1 }
  };

  const sortQuery = sortOptions[sortBy] || sortOptions.name;

  const booths = await CollectionBooth.find(query)
    .sort(sortQuery)
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum)
    .lean();

  const total = await CollectionBooth.countDocuments(query);

  // Format response data
  const formattedBooths = booths.map(booth => {
    const boothData = {
      id: booth._id,
      name: booth.name,
      boothId: booth.boothId,
      location: {
        address: booth.location.address,
        area: booth.location.area,
        landmark: booth.location.landmark,
        pincode: booth.location.pincode,
        coordinates: {
          latitude: booth.location.latitude,
          longitude: booth.location.longitude
        }
      },
      operatingHours: booth.operatingHours,
      contactPerson: {
        name: booth.contactPerson.name,
        phone: booth.contactPerson.phone
      },
      facilities: booth.facilities,
      capacity: booth.capacity,
      currentLoad: booth.currentLoad,
      statistics: booth.statistics
    };

    // Add current status
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'lowercase' });
    
    let status = 'open';
    
    if (booth.operatingHours.closedDays.includes(currentDay)) {
      status = 'closed_today';
    } else if (!booth.operatingHours.isOpen24Hours) {
      if (currentTime < booth.operatingHours.start || currentTime > booth.operatingHours.end) {
        status = 'closed';
      }
    }
    
    if (booth.currentLoad.totalKgToday >= booth.capacity.maxKgPerDay) {
      status = 'full';
    }

    boothData.currentStatus = status;
    boothData.capacityUtilization = {
      weight: ((booth.currentLoad.totalKgToday / booth.capacity.maxKgPerDay) * 100).toFixed(1),
      submissions: ((booth.currentLoad.submissionsToday / booth.capacity.maxSubmissionsPerDay) * 100).toFixed(1)
    };

    // Filter out QR code for public access
    if (!req.user && !req.admin) {
      delete boothData.qrCode;
    }

    return boothData;
  });

  // Filter by open status if requested
  let filteredBooths = formattedBooths;
  if (isOpen !== undefined) {
    const shouldBeOpen = isOpen === 'true';
    filteredBooths = formattedBooths.filter(booth => {
      const isCurrentlyOpen = ['open'].includes(booth.currentStatus);
      return shouldBeOpen ? isCurrentlyOpen : !isCurrentlyOpen;
    });
  }

  sendPaginatedResponse(res, 200, filteredBooths, {
    page: pageNum,
    limit: limitNum,
    total
  }, 'Booths retrieved successfully');
}));

// GET /api/booths/nearby - Get nearby booths based on location
router.get('/nearby', optionalAuth, searchRateLimiter, catchAsync(async (req, res) => {
  const { lat, lng, radius = 10 } = req.query;

  if (!lat || !lng) {
    return sendError(res, 400, 'Latitude and longitude are required');
  }

  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);
  const maxRadius = Math.min(parseFloat(radius), 50); // Max 50km radius

  if (isNaN(latitude) || isNaN(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return sendError(res, 400, 'Invalid latitude or longitude');
  }

  try {
    const nearbyBooths = await CollectionBooth.findNearby(latitude, longitude, maxRadius);

    const formattedBooths = nearbyBooths.map(booth => ({
      id: booth._id,
      name: booth.name,
      boothId: booth.boothId,
      location: {
        address: booth.location.address,
        area: booth.location.area,
        landmark: booth.location.landmark,
        coordinates: {
          latitude: booth.location.latitude,
          longitude: booth.location.longitude
        }
      },
      distance: booth.distance,
      operatingHours: booth.operatingHours,
      currentStatus: booth.currentStatus,
      capacityUtilization: booth.capacityUtilization,
      facilities: booth.facilities,
      contactPerson: {
        name: booth.contactPerson.name,
        phone: booth.contactPerson.phone
      }
    }));

    sendResponse(res, 200, {
      searchLocation: { latitude, longitude },
      radius: maxRadius,
      totalFound: formattedBooths.length,
      booths: formattedBooths
    }, 'Nearby booths retrieved successfully');

  } catch (error) {
    console.error('Nearby booths error:', error);
    throw error;
  }
}));

// GET /api/booths/:id - Get specific booth details
router.get('/:id', optionalAuth, catchAsync(async (req, res) => {
  const booth = await CollectionBooth.findById(req.params.id);

  if (!booth) {
    return sendError(res, 404, 'Collection booth not found');
  }

  if (!booth.isActive) {
    return sendError(res, 404, 'Collection booth is not available');
  }

  // Get recent submissions for this booth (last 10)
  const recentSubmissions = await WasteSubmission.find({
    boothId: booth._id,
    status: 'approved'
  })
    .populate('userId', 'name')
    .sort({ submissionDate: -1 })
    .limit(10)
    .select('wasteType quantity submissionDate userId pointsEarned')
    .lean();

  const boothDetails = {
    id: booth._id,
    name: booth.name,
    boothId: booth.boothId,
    location: booth.location,
    operatingHours: booth.operatingHours,
    contactPerson: booth.contactPerson,
    facilities: booth.facilities,
    capacity: booth.capacity,
    currentLoad: booth.currentLoad,
    statistics: booth.statistics,
    currentStatus: booth.currentStatus,
    capacityUtilization: booth.capacityUtilization,
    recentActivity: recentSubmissions.map(sub => ({
      wasteType: sub.wasteType,
      quantity: sub.quantity,
      points: sub.pointsEarned,
      submissionDate: sub.submissionDate,
      submitterName: sub.userId?.name || 'Anonymous'
    })),
    maintenance: booth.maintenance
  };

  // Include QR code only for authenticated users
  if (req.user || req.admin) {
    boothDetails.qrCode = booth.qrCode;
  }

  sendResponse(res, 200, boothDetails, 'Booth details retrieved successfully');
}));

// POST /api/booths/scan - Validate QR code scan (requires user authentication)
router.post('/scan', authenticateUser, catchAsync(async (req, res) => {
  const { qrCode, location } = req.body;

  if (!qrCode) {
    return sendError(res, 400, 'QR code is required');
  }

  const booth = await CollectionBooth.findOne({ qrCode, isActive: true });

  if (!booth) {
    return sendError(res, 404, 'Invalid QR code or booth not found');
  }

  // Check if booth can accept waste
  const canAccept = booth.canAcceptWaste(0); // Check general availability
  
  // Calculate distance if location provided
  let distance = null;
  if (location && location.latitude && location.longitude) {
    distance = booth.getDistance(location.latitude, location.longitude);
  }

  const scanResult = {
    valid: true,
    booth: {
      id: booth._id,
      name: booth.name,
      boothId: booth.boothId,
      location: {
        address: booth.location.address,
        area: booth.location.area,
        coordinates: {
          latitude: booth.location.latitude,
          longitude: booth.location.longitude
        }
      },
      operatingHours: booth.operatingHours,
      currentStatus: booth.currentStatus,
      canAcceptWaste: canAccept.canAccept,
      reason: canAccept.reason,
      acceptedWasteTypes: booth.facilities.acceptedWasteTypes,
      facilities: booth.facilities,
      contactPerson: {
        name: booth.contactPerson.name,
        phone: booth.contactPerson.phone
      }
    },
    scanInfo: {
      scanTime: new Date(),
      userDistance: distance,
      qrCode: qrCode
    }
  };

  if (!canAccept.canAccept) {
    scanResult.warning = canAccept.reason;
  }

  sendResponse(res, 200, scanResult, 'QR code validated successfully');
}));

// Admin routes - require admin authentication
router.use('/admin', authenticateAdmin);

// POST /api/booths/admin - Create new booth (admin only)
router.post('/admin', 
  requirePermission('booths', 'create'), 
  catchAsync(async (req, res) => {
    const {
      name,
      boothId,
      location,
      operatingHours,
      contactPerson,
      capacity,
      facilities
    } = req.body;

    // Validate required fields
    if (!name || !boothId || !location || !operatingHours || !contactPerson || !capacity) {
      return sendError(res, 400, 'Missing required fields');
    }

    // Validate location
    if (!location.latitude || !location.longitude || !location.address || !location.area || !location.pincode) {
      return sendError(res, 400, 'Complete location information is required');
    }

    // Validate coordinates
    if (location.latitude < -90 || location.latitude > 90 || 
        location.longitude < -180 || location.longitude > 180) {
      return sendError(res, 400, 'Invalid coordinates');
    }

    // Validate pincode
    if (!/^\d{6}$/.test(location.pincode)) {
      return sendError(res, 400, 'Invalid pincode format');
    }

    // Validate contact person
    if (!contactPerson.name || !contactPerson.phone) {
      return sendError(res, 400, 'Contact person name and phone are required');
    }

    // Validate capacity
    if (!capacity.maxKgPerDay || !capacity.maxSubmissionsPerDay || 
        capacity.maxKgPerDay < 50 || capacity.maxSubmissionsPerDay < 10) {
      return sendError(res, 400, 'Invalid capacity values');
    }

    try {
      // Generate unique QR code
      const qrCode = generateBoothQRCode(boothId, name);

      // Create booth
      const booth = new CollectionBooth({
        name: name.trim(),
        boothId: boothId.toUpperCase().trim(),
        location: {
          latitude: parseFloat(location.latitude),
          longitude: parseFloat(location.longitude),
          address: location.address.trim(),
          landmark: location.landmark?.trim() || '',
          area: location.area.trim(),
          pincode: location.pincode.trim()
        },
        qrCode,
        operatingHours: {
          start: operatingHours.start,
          end: operatingHours.end,
          isOpen24Hours: operatingHours.isOpen24Hours || false,
          closedDays: operatingHours.closedDays || []
        },
        contactPerson: {
          name: contactPerson.name.trim(),
          phone: contactPerson.phone.trim(),
          alternatePhone: contactPerson.alternatePhone?.trim() || null,
          email: contactPerson.email?.toLowerCase().trim() || null
        },
        capacity: {
          maxKgPerDay: parseInt(capacity.maxKgPerDay),
          maxSubmissionsPerDay: parseInt(capacity.maxSubmissionsPerDay)
        },
        facilities: {
          hasWeighingScale: facilities?.hasWeighingScale !== false,
          hasSegregation: facilities?.hasSegregation !== false,
          hasWashingFacility: facilities?.hasWashingFacility || false,
          hasShade: facilities?.hasShade !== false,
          hasSeating: facilities?.hasSeating || false,
          acceptedWasteTypes: facilities?.acceptedWasteTypes || ['plastic', 'organic', 'paper', 'metal', 'glass'],
          specialInstructions: facilities?.specialInstructions?.trim() || null
        }
      });

      await booth.save();

      const responseData = {
        id: booth._id,
        name: booth.name,
        boothId: booth.boothId,
        qrCode: booth.qrCode,
        location: booth.location,
        operatingHours: booth.operatingHours,
        contactPerson: booth.contactPerson,
        capacity: booth.capacity,
        facilities: booth.facilities,
        isActive: booth.isActive,
        createdAt: booth.createdAt
      };

      sendResponse(res, 201, responseData, 'Collection booth created successfully');

    } catch (error) {
      if (error.code === 11000) {
        const field = Object.keys(error.keyValue)[0];
        return sendError(res, 400, `${field} already exists`);
      }
      throw error;
    }
  })
);

// PUT /api/booths/admin/:id - Update booth (admin only)
router.put('/admin/:id', 
  requirePermission('booths', 'update'), 
  catchAsync(async (req, res) => {
    const booth = await CollectionBooth.findById(req.params.id);

    if (!booth) {
      return sendError(res, 404, 'Collection booth not found');
    }

    const {
      name,
      location,
      operatingHours,
      contactPerson,
      capacity,
      facilities,
      isActive
    } = req.body;

    const updateData = {};

    if (name !== undefined) {
      if (!name.trim()) {
        return sendError(res, 400, 'Booth name cannot be empty');
      }
      updateData.name = name.trim();
    }

    if (location !== undefined) {
      if (location.latitude !== undefined || location.longitude !== undefined) {
        if (location.latitude < -90 || location.latitude > 90 || 
            location.longitude < -180 || location.longitude > 180) {
          return sendError(res, 400, 'Invalid coordinates');
        }
      }
      updateData.location = { ...booth.location, ...location };
    }

    if (operatingHours !== undefined) {
      updateData.operatingHours = { ...booth.operatingHours, ...operatingHours };
    }

    if (contactPerson !== undefined) {
      updateData.contactPerson = { ...booth.contactPerson, ...contactPerson };
    }

    if (capacity !== undefined) {
      if (capacity.maxKgPerDay && capacity.maxKgPerDay < 50) {
        return sendError(res, 400, 'Maximum kg per day must be at least 50');
      }
      if (capacity.maxSubmissionsPerDay && capacity.maxSubmissionsPerDay < 10) {
        return sendError(res, 400, 'Maximum submissions per day must be at least 10');
      }
      updateData.capacity = { ...booth.capacity, ...capacity };
    }

    if (facilities !== undefined) {
      updateData.facilities = { ...booth.facilities, ...facilities };
    }

    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }

    const updatedBooth = await CollectionBooth.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    sendResponse(res, 200, updatedBooth, 'Collection booth updated successfully');
  })
);

// DELETE /api/booths/admin/:id - Delete booth (admin only)
router.delete('/admin/:id', 
  requirePermission('booths', 'delete'), 
  catchAsync(async (req, res) => {
    const booth = await CollectionBooth.findById(req.params.id);

    if (!booth) {
      return sendError(res, 404, 'Collection booth not found');
    }

    // Check if booth has any submissions
    const submissionCount = await WasteSubmission.countDocuments({ boothId: booth._id });
    
    if (submissionCount > 0) {
      // Soft delete - set isActive to false
      booth.isActive = false;
      await booth.save();
      
      sendResponse(res, 200, {
        message: 'Booth deactivated successfully (has existing submissions)'
      });
    } else {
      // Hard delete if no submissions
      await CollectionBooth.findByIdAndDelete(req.params.id);
      
      sendResponse(res, 200, {
        message: 'Booth deleted successfully'
      });
    }
  })
);

// GET /api/booths/admin/stats - Get booth statistics (admin only)
router.get('/admin/stats', 
  requirePermission('booths', 'read'), 
  catchAsync(async (req, res) => {
    const { period = '30d' } = req.query;
    
    const periodDays = parseInt(period.replace('d', ''));
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    // Get booth statistics
    const stats = await CollectionBooth.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: 'wastesubmissions',
          localField: '_id',
          foreignField: 'boothId',
          as: 'submissions',
          pipeline: [
            {
              $match: {
                status: 'approved',
                submissionDate: { $gte: startDate }
              }
            }
          ]
        }
      },
      {
        $addFields: {
          submissionCount: { $size: '$submissions' },
          totalQuantity: { $sum: '$submissions.quantity' },
          totalPoints: { $sum: '$submissions.pointsEarned' }
        }
      },
      {
        $group: {
          _id: null,
          totalBooths: { $sum: 1 },
          activeBooths: {
            $sum: {
              $cond: [{ $eq: ['$isActive', true] }, 1, 0]
            }
          },
          totalSubmissions: { $sum: '$submissionCount' },
          totalQuantity: { $sum: '$totalQuantity' },
          totalPoints: { $sum: '$totalPoints' },
          averageSubmissionsPerBooth: { $avg: '$submissionCount' },
          topBooths: {
            $push: {
              id: '$_id',
              name: '$name',
              area: '$location.area',
              submissions: '$submissionCount',
              quantity: '$totalQuantity',
              points: '$totalPoints'
            }
          }
        }
      }
    ]);

    const statistics = stats[0] || {
      totalBooths: 0,
      activeBooths: 0,
      totalSubmissions: 0,
      totalQuantity: 0,
      totalPoints: 0,
      averageSubmissionsPerBooth: 0,
      topBooths: []
    };

    // Sort top booths by quantity
    statistics.topBooths.sort((a, b) => b.quantity - a.quantity);
    statistics.topBooths = statistics.topBooths.slice(0, 10);

    sendResponse(res, 200, {
      period: { days: periodDays, startDate },
      statistics
    }, 'Booth statistics retrieved successfully');
  })
);

export default router;
