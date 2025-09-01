import express from "express";
import { catchAsync } from "../middleware/errorHandler.js";
import { authenticateUser, authenticateAdmin } from "../middleware/auth.js";
import { authRateLimiter, otpRateLimiter } from "../middleware/rateLimiter.js";
import AuthController from "../controllers/AuthController.js";

const router = express.Router();

// User authentication routes
router.post("/register", authRateLimiter, AuthController.register);
router.post("/login", authRateLimiter, AuthController.login);

// OTP-based authentication (alternative)
router.post("/send-otp", otpRateLimiter, AuthController.sendOTPToPhone);
router.post("/verify-otp", authRateLimiter, AuthController.verifyOTP);

// Admin authentication routes
router.post("/admin/login", authRateLimiter, AuthController.adminLogin);
router.post("/admin/logout", authenticateAdmin, AuthController.adminLogout);

// Token management
router.post("/refresh-token", AuthController.refreshToken);

// User logout and profile
router.post("/logout", authenticateUser, AuthController.logout);
router.get("/me", AuthController.getMe);

export default router;
