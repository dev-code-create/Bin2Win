import CollectionBooth from '../models/CollectionBooth.js';
import WasteSubmission from '../models/WasteSubmission.js';
import mongoose from 'mongoose';

class BoothController {
  // Get all collection booths
  async getAllBooths(req, res) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        status, 
        wasteType,
        latitude,
        longitude,
        radius = 5000 // radius in meters
      } = req.query;

      // Build filter
      const filter = { isActive: true };

      if (status) {
        filter.status = status;
      }

      if (wasteType) {
        filter.acceptedWasteTypes = { $in: [wasteType] };
      }

      let query = CollectionBooth.find(filter);

      // Location-based search
      if (latitude && longitude) {
        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);
        
        if (!isNaN(lat) && !isNaN(lng)) {
          query = query.find({
            'location.coordinates': {
              $near: {
                $geometry: {
                  type: 'Point',
                  coordinates: [lng, lat]
                },
                $maxDistance: parseInt(radius)
              }
            }
          });
        }
      }

      // Apply pagination
      const booths = await query
        .populate('operator', 'fullName phoneNumber')
        .sort({ name: 1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      // Get total count for pagination
      const total = await CollectionBooth.countDocuments(filter);

      // Add distance calculation if location provided
      const boothsWithDetails = await Promise.all(
        booths.map(async (booth) => {
          // Calculate distance if user location provided
          let distance = null;
          if (latitude && longitude) {
            const lat1 = parseFloat(latitude);
            const lng1 = parseFloat(longitude);
            const lat2 = booth.location.coordinates[1];
            const lng2 = booth.location.coordinates[0];
            distance = this.calculateDistance(lat1, lng1, lat2, lng2);
          }

          // Get recent activity stats
          const recentSubmissions = await WasteSubmission.countDocuments({
            boothId: booth._id,
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Last 7 days
            status: 'approved'
          });

          // Calculate capacity percentage
          const capacityPercentage = booth.maxCapacity > 0 
            ? (booth.currentCapacity / booth.maxCapacity) * 100 
            : 0;

          return {
            id: booth._id,
            name: booth.name,
            location: booth.location,
            address: booth.address,
            status: booth.status,
            acceptedWasteTypes: booth.acceptedWasteTypes,
            operatingHours: booth.operatingHours,
            contactInfo: booth.contactInfo,
            operator: booth.operator,
            capacity: {
              current: booth.currentCapacity,
              max: booth.maxCapacity,
              percentage: Math.round(capacityPercentage),
              available: booth.maxCapacity - booth.currentCapacity
            },
            recentActivity: {
              submissionsThisWeek: recentSubmissions
            },
            distance: distance ? Math.round(distance) : null,
            facilities: booth.facilities,
            lastUpdated: booth.updatedAt
          };
        })
      );

      res.json({
        success: true,
        data: {
          booths: boothsWithDetails,
          pagination: {
            current: parseInt(page),
            pages: Math.ceil(total / limit),
            total,
            limit: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('❌ Get all booths error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get collection booths'
      });
    }
  }

  // Get booth by ID
  async getBoothById(req, res) {
    try {
      const { boothId } = req.params;

      const booth = await CollectionBooth.findById(boothId)
        .populate('operator', 'fullName phoneNumber email');

      if (!booth) {
        return res.status(404).json({
          success: false,
          message: 'Collection booth not found'
        });
      }

      // Get detailed statistics
      const stats = await this.getBoothStatistics(boothId);

      // Get recent submissions
      const recentSubmissions = await WasteSubmission.find({
        boothId: booth._id,
        status: 'approved'
      })
      .populate('userId', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

      // Calculate capacity percentage
      const capacityPercentage = booth.maxCapacity > 0 
        ? (booth.currentCapacity / booth.maxCapacity) * 100 
        : 0;

      const boothDetails = {
        id: booth._id,
        name: booth.name,
        description: booth.description,
        location: booth.location,
        address: booth.address,
        status: booth.status,
        acceptedWasteTypes: booth.acceptedWasteTypes,
        operatingHours: booth.operatingHours,
        contactInfo: booth.contactInfo,
        operator: booth.operator,
        capacity: {
          current: booth.currentCapacity,
          max: booth.maxCapacity,
          percentage: Math.round(capacityPercentage),
          available: booth.maxCapacity - booth.currentCapacity
        },
        facilities: booth.facilities,
        qrCode: booth.qrCode,
        statistics: stats,
        recentSubmissions: recentSubmissions.map(submission => ({
          id: submission._id,
          user: submission.userId,
          wasteType: submission.wasteType,
          quantity: submission.quantity,
          pointsEarned: submission.pointsEarned,
          submittedAt: submission.createdAt
        })),
        createdAt: booth.createdAt,
        updatedAt: booth.updatedAt
      };

      res.json({
        success: true,
        data: { booth: boothDetails }
      });
    } catch (error) {
      console.error('❌ Get booth by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get booth details'
      });
    }
  }

  // Get nearby booths based on location
  async getNearbyBooths(req, res) {
    try {
      const { latitude, longitude, radius = 5000, limit = 10 } = req.query;

      if (!latitude || !longitude) {
        return res.status(400).json({
          success: false,
          message: 'Latitude and longitude are required'
        });
      }

      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);

      if (isNaN(lat) || isNaN(lng)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid latitude or longitude'
        });
      }

      const booths = await CollectionBooth.find({
        isActive: true,
        status: 'operational',
        'location.coordinates': {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [lng, lat]
            },
            $maxDistance: parseInt(radius)
          }
        }
      })
      .populate('operator', 'fullName phoneNumber')
      .limit(parseInt(limit));

      // Add distance calculations and current status
      const nearbyBooths = booths.map(booth => {
        const distance = this.calculateDistance(
          lat, lng,
          booth.location.coordinates[1],
          booth.location.coordinates[0]
        );

        // Check if booth is currently open
        const isCurrentlyOpen = this.isBoothOpen(booth.operatingHours);

        return {
          id: booth._id,
          name: booth.name,
          location: booth.location,
          address: booth.address,
          status: booth.status,
          acceptedWasteTypes: booth.acceptedWasteTypes,
          distance: Math.round(distance),
          isCurrentlyOpen,
          nextOpenTime: this.getNextOpenTime(booth.operatingHours),
          capacity: {
            percentage: booth.maxCapacity > 0 
              ? Math.round((booth.currentCapacity / booth.maxCapacity) * 100)
              : 0,
            available: booth.maxCapacity - booth.currentCapacity
          },
          contactInfo: booth.contactInfo
        };
      });

      res.json({
        success: true,
        data: {
          booths: nearbyBooths,
          searchCenter: { latitude: lat, longitude: lng },
          radius: parseInt(radius)
        }
      });
    } catch (error) {
      console.error('❌ Get nearby booths error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get nearby booths'
      });
    }
  }

  // Get booth statistics
  async getBoothStatistics(boothId) {
    try {
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Weekly stats
      const weeklyStats = await WasteSubmission.aggregate([
        {
          $match: {
            boothId: mongoose.Types.ObjectId(boothId),
            status: 'approved',
            createdAt: { $gte: oneWeekAgo }
          }
        },
        {
          $group: {
            _id: '$wasteType',
            count: { $sum: 1 },
            totalWeight: { $sum: '$quantity' },
            totalPoints: { $sum: '$pointsEarned' }
          }
        }
      ]);

      // Monthly stats
      const monthlyStats = await WasteSubmission.aggregate([
        {
          $match: {
            boothId: mongoose.Types.ObjectId(boothId),
            status: 'approved',
            createdAt: { $gte: oneMonthAgo }
          }
        },
        {
          $group: {
            _id: null,
            totalSubmissions: { $sum: 1 },
            totalWeight: { $sum: '$quantity' },
            totalPoints: { $sum: '$pointsEarned' },
            uniqueUsers: { $addToSet: '$userId' }
          }
        }
      ]);

      // All-time stats
      const allTimeStats = await WasteSubmission.aggregate([
        {
          $match: {
            boothId: mongoose.Types.ObjectId(boothId),
            status: 'approved'
          }
        },
        {
          $group: {
            _id: null,
            totalSubmissions: { $sum: 1 },
            totalWeight: { $sum: '$quantity' },
            totalPoints: { $sum: '$pointsEarned' },
            uniqueUsers: { $addToSet: '$userId' }
          }
        }
      ]);

      return {
        weekly: {
          byWasteType: weeklyStats,
          totalSubmissions: weeklyStats.reduce((sum, item) => sum + item.count, 0),
          totalWeight: weeklyStats.reduce((sum, item) => sum + item.totalWeight, 0)
        },
        monthly: {
          submissions: monthlyStats[0]?.totalSubmissions || 0,
          weight: monthlyStats[0]?.totalWeight || 0,
          points: monthlyStats[0]?.totalPoints || 0,
          uniqueUsers: monthlyStats[0]?.uniqueUsers?.length || 0
        },
        allTime: {
          submissions: allTimeStats[0]?.totalSubmissions || 0,
          weight: allTimeStats[0]?.totalWeight || 0,
          points: allTimeStats[0]?.totalPoints || 0,
          uniqueUsers: allTimeStats[0]?.uniqueUsers?.length || 0
        }
      };
    } catch (error) {
      console.error('❌ Get booth statistics error:', error);
      return {
        weekly: { byWasteType: [], totalSubmissions: 0, totalWeight: 0 },
        monthly: { submissions: 0, weight: 0, points: 0, uniqueUsers: 0 },
        allTime: { submissions: 0, weight: 0, points: 0, uniqueUsers: 0 }
      };
    }
  }

  // Admin: Create new collection booth
  async createBooth(req, res) {
    try {
      const {
        name,
        description,
        location,
        address,
        acceptedWasteTypes,
        maxCapacity,
        operatingHours,
        contactInfo,
        facilities,
        operator
      } = req.body;

      // Validate required fields
      if (!name || !location || !address || !acceptedWasteTypes || !maxCapacity) {
        return res.status(400).json({
          success: false,
          message: 'Name, location, address, accepted waste types, and max capacity are required'
        });
      }

      // Generate QR code for booth
      const qrCode = `BOOTH_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const booth = new CollectionBooth({
        name,
        description,
        location,
        address,
        acceptedWasteTypes,
        maxCapacity,
        currentCapacity: 0,
        operatingHours,
        contactInfo,
        facilities,
        operator,
        qrCode,
        status: 'operational',
        isActive: true
      });

      await booth.save();
      await booth.populate('operator', 'fullName phoneNumber email');

      res.status(201).json({
        success: true,
        message: 'Collection booth created successfully',
        data: { booth }
      });
    } catch (error) {
      console.error('❌ Create booth error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create collection booth'
      });
    }
  }

  // Admin: Update collection booth
  async updateBooth(req, res) {
    try {
      const { boothId } = req.params;
      const updateData = req.body;

      // Remove sensitive fields that shouldn't be directly updated
      delete updateData._id;
      delete updateData.qrCode;
      delete updateData.createdAt;

      const booth = await CollectionBooth.findByIdAndUpdate(
        boothId,
        updateData,
        { 
          new: true, 
          runValidators: true 
        }
      ).populate('operator', 'fullName phoneNumber email');

      if (!booth) {
        return res.status(404).json({
          success: false,
          message: 'Collection booth not found'
        });
      }

      res.json({
        success: true,
        message: 'Collection booth updated successfully',
        data: { booth }
      });
    } catch (error) {
      console.error('❌ Update booth error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update collection booth'
      });
    }
  }

  // Admin: Delete collection booth
  async deleteBooth(req, res) {
    try {
      const { boothId } = req.params;

      // Check if booth has any pending submissions
      const pendingSubmissions = await WasteSubmission.countDocuments({
        boothId,
        status: 'pending'
      });

      if (pendingSubmissions > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete booth with ${pendingSubmissions} pending submissions. Please process them first.`
        });
      }

      const booth = await CollectionBooth.findByIdAndUpdate(
        boothId,
        { isActive: false },
        { new: true }
      );

      if (!booth) {
        return res.status(404).json({
          success: false,
          message: 'Collection booth not found'
        });
      }

      res.json({
        success: true,
        message: 'Collection booth deactivated successfully'
      });
    } catch (error) {
      console.error('❌ Delete booth error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete collection booth'
      });
    }
  }

  // Helper: Calculate distance between two coordinates (Haversine formula)
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  }

  // Helper: Check if booth is currently open
  isBoothOpen(operatingHours) {
    if (!operatingHours || !operatingHours.schedule) {
      return true; // Assume 24/7 if no schedule defined
    }

    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const todaySchedule = operatingHours.schedule.find(
      schedule => schedule.day === currentDay
    );

    if (!todaySchedule || !todaySchedule.isOpen) {
      return false;
    }

    const [openHour, openMinute] = todaySchedule.openTime.split(':').map(Number);
    const [closeHour, closeMinute] = todaySchedule.closeTime.split(':').map(Number);
    
    const openTime = openHour * 60 + openMinute;
    const closeTime = closeHour * 60 + closeMinute;

    return currentTime >= openTime && currentTime < closeTime;
  }

  // Helper: Get next opening time
  getNextOpenTime(operatingHours) {
    if (!operatingHours || !operatingHours.schedule) {
      return null;
    }

    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    // Check if booth opens later today
    const todaySchedule = operatingHours.schedule.find(
      schedule => schedule.day === currentDay && schedule.isOpen
    );

    if (todaySchedule) {
      const [openHour, openMinute] = todaySchedule.openTime.split(':').map(Number);
      const openTime = openHour * 60 + openMinute;

      if (currentTime < openTime) {
        return `Today at ${todaySchedule.openTime}`;
      }
    }

    // Check next 7 days for opening time
    for (let i = 1; i <= 7; i++) {
      const checkDay = (currentDay + i) % 7;
      const daySchedule = operatingHours.schedule.find(
        schedule => schedule.day === checkDay && schedule.isOpen
      );

      if (daySchedule) {
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return `${dayNames[checkDay]} at ${daySchedule.openTime}`;
      }
    }

    return 'Schedule not available';
  }
}

export default new BoothController();
