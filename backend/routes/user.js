import express from 'express';
import { authenticateUser } from '../middleware/auth.js';
import UserController from '../controllers/UserController.js';

const router = express.Router();

// All user routes require authentication
router.use(authenticateUser);

// Profile management
router.get('/profile', UserController.getProfile);
router.put('/profile', UserController.updateProfile);
router.put('/preferences', UserController.updatePreferences);
router.delete('/account', UserController.deactivateAccount);

// Dashboard and statistics
router.get('/dashboard', UserController.getDashboard);
router.get('/statistics', UserController.getStatistics);

// History and transactions
router.get('/waste-history', UserController.getWasteHistory);
router.get('/transaction-history', UserController.getTransactionHistory);
router.get('/activity', UserController.getUserActivity);

// QR Code management
router.get('/qr-code', UserController.getUserQRCode);
router.post('/qr-code/regenerate', UserController.regenerateQRCode);

export default router;