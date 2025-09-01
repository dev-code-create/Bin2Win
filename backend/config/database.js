import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

class Database {
  constructor() {
    this.connection = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      // MongoDB connection options
      const options = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10, // Maintain up to 10 socket connections
        serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
        socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        family: 4, // Use IPv4, skip trying IPv6
        bufferCommands: false, // Disable mongoose buffering
        bufferMaxEntries: 0, // Disable mongoose buffering
      };

      // Get MongoDB URI from environment variables
      const mongoURI = process.env.MONGODB_URI || 
                      process.env.MONGO_URI || 
                      'mongodb://localhost:27017/simhastha-clean-green';

      console.log('🔄 Connecting to MongoDB...');
      console.log('📍 MongoDB URI:', mongoURI.replace(/\/\/.*@/, '//***:***@')); // Hide credentials in logs

      this.connection = await mongoose.connect(mongoURI, options);
      this.isConnected = true;

      console.log('✅ MongoDB connected successfully');
      console.log('📊 Database:', this.connection.connection.name);
      console.log('🏠 Host:', this.connection.connection.host);
      console.log('🔌 Port:', this.connection.connection.port);

      // Handle connection events
      mongoose.connection.on('connected', () => {
        console.log('📶 MongoDB connection established');
        this.isConnected = true;
      });

      mongoose.connection.on('disconnected', () => {
        console.log('📵 MongoDB disconnected');
        this.isConnected = false;
      });

      mongoose.connection.on('error', (error) => {
        console.error('❌ MongoDB connection error:', error);
        this.isConnected = false;
      });

      // Handle process termination
      process.on('SIGINT', async () => {
        await this.disconnect();
        process.exit(0);
      });

      return this.connection;

    } catch (error) {
      console.error('❌ MongoDB connection failed:', error.message);
      
      // Provide helpful error messages
      if (error.message.includes('ECONNREFUSED')) {
        console.log('💡 Tip: Make sure MongoDB is running locally or check your connection string');
      } else if (error.message.includes('authentication failed')) {
        console.log('💡 Tip: Check your MongoDB username and password');
      } else if (error.message.includes('network timeout')) {
        console.log('💡 Tip: Check your network connection or MongoDB Atlas whitelist');
      }

      // In development, continue without database
      if (process.env.NODE_ENV === 'development') {
        console.log('⚠️  Running in development mode without database connection');
        return null;
      }

      throw error;
    }
  }

  async disconnect() {
    try {
      if (this.isConnected && mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
        console.log('🔌 MongoDB connection closed');
        this.isConnected = false;
      }
    } catch (error) {
      console.error('❌ Error closing MongoDB connection:', error);
    }
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name
    };
  }

  // Health check for the database
  async healthCheck() {
    try {
      if (!this.isConnected) {
        return { status: 'disconnected', message: 'Database not connected' };
      }

      // Simple ping to check if database is responsive
      await mongoose.connection.db.admin().ping();
      
      return {
        status: 'healthy',
        message: 'Database connection is healthy',
        details: this.getConnectionStatus()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: 'Database health check failed',
        error: error.message
      };
    }
  }
}

// Export singleton instance
export default new Database();
