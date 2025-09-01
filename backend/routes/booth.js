import express from "express";
import { authenticateAdmin } from "../middleware/auth.js";
import BoothController from "../controllers/BoothController.js";

const router = express.Router();

// Public routes
router.get("/", BoothController.getAllBooths);
router.get("/nearby", BoothController.getNearbyBooths);
router.get("/:boothId", BoothController.getBoothById);

// Admin routes (require admin authentication)
router.post("/", authenticateAdmin, BoothController.createBooth);
router.put("/:boothId", authenticateAdmin, BoothController.updateBooth);
router.delete("/:boothId", authenticateAdmin, BoothController.deleteBooth);

export default router;
