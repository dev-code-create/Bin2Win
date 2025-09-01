import express from 'express';
import { authenticateUser, authenticateAdmin } from '../middleware/auth.js';
import WasteController from '../controllers/WasteController.js';

const router = express.Router();

// Public routes
router.get('/types', WasteController.getWasteTypes);
router.get('/stats', WasteController.getWasteStats);

// User routes (require authentication)
router.post('/validate-booth', authenticateUser, WasteController.validateBoothQR);
router.post('/submit', 
  authenticateUser, 
  WasteController.getUploadMiddleware(), 
  WasteController.submitWaste
);
router.get('/submissions', authenticateUser, WasteController.getUserSubmissions);
router.get('/submissions/:submissionId', authenticateUser, WasteController.getSubmission);

// Admin routes (require admin authentication)
router.put('/submissions/:submissionId/approve', authenticateAdmin, WasteController.approveSubmission);
router.put('/submissions/:submissionId/reject', authenticateAdmin, WasteController.rejectSubmission);

export default router;