import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Import configuration
import { initializeConfig, Environment, Database } from './config/index.js';

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import wasteRoutes from './routes/waste.js';
import boothRoutes from './routes/booth.js';
import rewardRoutes from './routes/reward.js';
import adminRoutes from './routes/admin.js';

// Import middleware
import { errorHandler } from './middleware/errorHandler.js';
import { rateLimiter } from './middleware/rateLimiter.js';

// ES6 module setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  try {
    console.log('🚀 Starting Simhastha 2028 Clean & Green Backend Server...');
    
    // Initialize configuration and database
    await initializeConfig();
    
    const app = express();
    const config = Environment.getAll();
    
    // Trust proxy for rate limiting in production
    if (Environment.isProduction()) {
      app.set('trust proxy', 1);
    }

    // CORS middleware
    app.use(cors(config.cors));

    // Body parsing middleware
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Static file serving
    app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

    // Rate limiting middleware
    app.use('/api/', rateLimiter);

    // Health check endpoint
    app.get('/api/health', async (req, res) => {
      const dbHealth = await Database.healthCheck();
      
      res.json({
        success: true,
        message: 'Server is running!',
        timestamp: new Date().toISOString(),
        environment: Environment.get('server.environment'),
        version: Environment.get('app.version'),
        database: dbHealth,
        uptime: process.uptime()
      });
    });

    // API Routes
    app.use('/api/auth', authRoutes);
    app.use('/api/user', userRoutes);
    app.use('/api/waste', wasteRoutes);
    app.use('/api/booths', boothRoutes);
    app.use('/api/rewards', rewardRoutes);
    app.use('/api/admin', adminRoutes);

    // 404 handler for API routes
    app.use('/api/*', (req, res) => {
      res.status(404).json({
        success: false,
        message: 'API endpoint not found',
        path: req.originalUrl
      });
    });

    // Global error handler
    app.use(errorHandler);

    // Start server
    const PORT = Environment.get('server.port');
    const HOST = Environment.get('server.host');

    const server = app.listen(PORT, () => {
      console.log('');
      console.log('✅ Server successfully started!');
      console.log(`🌐 Server URL: http://${HOST}:${PORT}`);
      console.log(`📋 Health Check: http://${HOST}:${PORT}/api/health`);
      console.log(`📚 API Base URL: http://${HOST}:${PORT}/api`);
      console.log('');
      console.log('📊 Available endpoints:');
      console.log('   🔐 Auth: /api/auth');
      console.log('   👤 User: /api/user');
      console.log('   🗑️  Waste: /api/waste');
      console.log('   🏢 Booths: /api/booths');
      console.log('   🎁 Rewards: /api/rewards');
      console.log('   ⚙️  Admin: /api/admin');
      console.log('');
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
      
      server.close(async () => {
        console.log('🔌 HTTP server closed');
        
        try {
          await Database.disconnect();
          console.log('📦 Database connection closed');
        } catch (error) {
          console.error('❌ Error closing database:', error);
        }
        
        console.log('👋 Graceful shutdown completed');
        process.exit(0);
      });

      // Force close after 10 seconds
      setTimeout(() => {
        console.error('⚠️  Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    // Handle graceful shutdown
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('UNHANDLED_REJECTION');
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();