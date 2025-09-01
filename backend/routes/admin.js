import express from "express";
import { authenticateAdmin } from "../middleware/auth.js";
import AdminController from "../controllers/AdminController.js";

const router = express.Router();

// All admin routes require authentication
router.use(authenticateAdmin);

// Dashboard and analytics
router.get("/dashboard", AdminController.getDashboard);
router.get("/analytics", AdminController.getAnalytics);

// User management
router.get("/users", AdminController.getAllUsers);
router.put("/users/:userId/status", AdminController.updateUserStatus);

// Submission management
router.get("/submissions/pending", AdminController.getPendingSubmissions);

// Data export
router.get("/export", AdminController.exportData);

export default router;
