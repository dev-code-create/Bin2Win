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

// Admin waste collection workflow
router.post('/admin/scan-user', authenticateAdmin, WasteController.scanUserQR);
router.post('/admin/submit-waste', authenticateAdmin, WasteController.adminSubmitWaste);
router.get('/admin/collections', authenticateAdmin, WasteController.getAdminCollections);

export default router;