import express from 'express';
import authRoutes from './routes/auth.js';

const app = express();
app.use(express.json());

// Mount the auth routes
app.use('/api/auth', authRoutes);

// Test endpoint
app.get('/test', (req, res) => {
  res.json({ message: 'Test server working' });
});

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`Test server running on http://localhost:${PORT}`);
  console.log('Available routes:');
  console.log('- GET /test');
  console.log('- POST /api/auth/admin/login');
  console.log('- POST /api/auth/register');
  console.log('- POST /api/auth/login');
});
