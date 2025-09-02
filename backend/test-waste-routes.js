import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import wasteRoutes from './routes/waste.js';

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Register waste routes
app.use('/api/waste', wasteRoutes);

// Test route
app.get('/test', (req, res) => {
  res.json({ message: 'Test route works!' });
});

// Start server
const PORT = 3002;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  console.log(`Available routes:`);
  
  // Print all registered routes
  app.stack?.forEach(layer => {
    if (layer.route) {
      const methods = Object.keys(layer.route.methods).join(',');
      console.log(`${methods.toUpperCase()} ${layer.route.path}`);
    }
  });
  
  // Print waste routes
  console.log('\nWaste routes:');
  wasteRoutes.stack.forEach(layer => {
    if (layer.route) {
      const methods = Object.keys(layer.route.methods).join(',');
      console.log(`${methods.toUpperCase()} /api/waste${layer.route.path}`);
    }
  });
});
