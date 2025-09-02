import express from 'express';
import RewardController from '../controllers/RewardController.js';
import { authenticateUser, authenticateAdmin } from '../middleware/auth.js';
import { redemptionRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Initialize controller
const rewardController = new RewardController();

// Public routes (no authentication required)
router.get('/', rewardController.getAllRewards.bind(rewardController));
router.get('/categories', rewardController.getCategories.bind(rewardController));
router.get('/popular', rewardController.getPopularRewards.bind(rewardController));
router.get('/featured', rewardController.getFeaturedRewards.bind(rewardController));
router.get('/search', rewardController.searchRewards.bind(rewardController));
router.get('/:rewardId', rewardController.getRewardById.bind(rewardController));

// User routes (require authentication)
router.post('/:rewardId/redeem', 
  authenticateUser, 
  redemptionRateLimiter, 
  rewardController.redeemReward.bind(rewardController)
);

// User redemption history
router.get('/user/redemptions', 
  authenticateUser, 
  rewardController.getUserRedemptions.bind(rewardController)
);

router.get('/user/redemptions/:redemptionId', 
  authenticateUser, 
  rewardController.getRedemptionById.bind(rewardController)
);

// Wishlist routes
router.get('/user/wishlist', 
  authenticateUser, 
  rewardController.getUserWishlist.bind(rewardController)
);

router.post('/user/wishlist/:rewardId', 
  authenticateUser, 
  rewardController.addToWishlist.bind(rewardController)
);

router.delete('/user/wishlist/:rewardId', 
  authenticateUser, 
  rewardController.removeFromWishlist.bind(rewardController)
);

// Admin routes (require admin authentication)
router.post('/', 
  authenticateAdmin, 
  rewardController.createReward.bind(rewardController)
);

router.put('/:rewardId', 
  authenticateAdmin, 
  rewardController.updateReward.bind(rewardController)
);

router.delete('/:rewardId', 
  authenticateAdmin, 
  rewardController.deleteReward.bind(rewardController)
);

router.get('/admin/redemptions', 
  authenticateAdmin, 
  rewardController.getAllRedemptions.bind(rewardController)
);

router.patch('/admin/redemptions/:redemptionId/status', 
  authenticateAdmin, 
  rewardController.updateRedemptionStatus.bind(rewardController)
);

export default router;
