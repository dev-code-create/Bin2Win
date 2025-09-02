import express from "express";

const router = express.Router();

// Simple test routes
router.post("/admin/login", async (req, res) => {
  console.log('📝 Admin login route hit with body:', req.body);
  res.json({
    success: true,
    message: 'Admin login route is working!',
    receivedData: req.body
  });
});

router.post("/register", async (req, res) => {
  console.log('📝 Register route hit with body:', req.body);
  res.json({
    success: true,
    message: 'Register route is working!',
    receivedData: req.body
  });
});

router.post("/login", async (req, res) => {
  console.log('📝 Login route hit with body:', req.body);
  res.json({
    success: true,
    message: 'Login route is working!',
    receivedData: req.body
  });
});

export default router;
