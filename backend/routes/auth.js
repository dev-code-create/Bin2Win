import express from "express";
import { catchAsync } from "../middleware/errorHandler.js";
import { authenticateUser, authenticateAdmin } from "../middleware/auth.js";
import { otpRateLimiter } from "../middleware/rateLimiter.js";
import AuthController from "../controllers/AuthController.js";

const router = express.Router();

// User authentication routes
router.post("/register", (req, res) =>
  AuthController.register(req, res)
);
router.post("/login", (req, res) =>
  AuthController.login(req, res)
);

// OTP-based authentication (alternative)
router.post("/send-otp", otpRateLimiter, (req, res) =>
  AuthController.sendOTPToPhone(req, res)
);
router.post("/verify-otp", (req, res) =>
  AuthController.verifyOTP(req, res)
);

// Admin authentication routes
router.post("/admin/login", (req, res) =>
  AuthController.adminLogin(req, res)
);
router.post("/admin/logout", authenticateAdmin, (req, res) =>
  AuthController.adminLogout(req, res)
);

// Token management
router.post("/refresh-token", (req, res) =>
  AuthController.refreshToken(req, res)
);

// User logout and profile
router.post("/logout", authenticateUser, (req, res) =>
  AuthController.logout(req, res)
);
router.get("/me", (req, res) => AuthController.getMe(req, res));

export default router;
