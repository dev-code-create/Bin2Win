import express from 'express';
import { authenticateUser, authenticateAdmin } from '../middleware/auth.js';
import RewardController from '../controllers/RewardController.js';

const router = express.Router();

// Public routes
router.get('/', RewardController.getAllRewards);
router.get('/categories', RewardController.getCategories);
router.get('/:rewardId', RewardController.getRewardById);

// User routes (require authentication)
router.post('/:rewardId/redeem', authenticateUser, RewardController.redeemReward);
router.get('/user/redemptions', authenticateUser, RewardController.getRedemptionHistory);

// Admin routes (require admin authentication)
router.post('/admin', 
  authenticateAdmin, 
  RewardController.getUploadMiddleware(), 
  RewardController.createReward
);
router.put('/admin/:rewardId', 
  authenticateAdmin, 
  RewardController.getUploadMiddleware(), 
  RewardController.updateReward
);
router.delete('/admin/:rewardId', authenticateAdmin, RewardController.deleteReward);

export default router;