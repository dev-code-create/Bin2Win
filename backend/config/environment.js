import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// ES6 module setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../.env') });

class Environment {
  constructor() {
    this.environment = process.env.NODE_ENV || 'development';
    this.loadConfig();
  }

  loadConfig() {
    this.config = {
      // Server Configuration
      server: {
        port: parseInt(process.env.PORT) || 3001,
        host: process.env.HOST || 'localhost',
        environment: this.environment
      },

      // Database Configuration
      database: {
        mongodb: {
          uri: process.env.MONGODB_URI || 
               process.env.MONGO_URI || 
               'mongodb://localhost:27017/simhastha-clean-green',
          options: {
            maxPoolSize: parseInt(process.env.DB_MAX_POOL_SIZE) || 10,
            serverSelectionTimeoutMS: parseInt(process.env.DB_TIMEOUT) || 5000,
            socketTimeoutMS: 45000,
            family: 4
          }
        }
      },

      // JWT Configuration
      jwt: {
        secret: process.env.JWT_SECRET || 'simhastha-clean-green-secret-key-2028',
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
        issuer: process.env.JWT_ISSUER || 'simhastha-clean-green',
        audience: process.env.JWT_AUDIENCE || 'simhastha-users'
      },

      // CORS Configuration
      cors: {
        origin: this.getCorsOrigins(),
        credentials: true,
        optionsSuccessStatus: 200,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
      },

      // File Upload Configuration
      upload: {
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
        maxFiles: parseInt(process.env.MAX_FILES) || 5,
        allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'],
        destinations: {
          wastePhotos: 'uploads/waste-photos',
          rewardImages: 'uploads/rewards',
          profileImages: 'uploads/profiles'
        }
      },

      // Rate Limiting Configuration
      rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
        max: parseInt(process.env.RATE_LIMIT_MAX) || 100, // 100 requests per window
        message: 'Too many requests from this IP, please try again later.',
        standardHeaders: true,
        legacyHeaders: false
      },

      // Auth Rate Limiting (stricter)
      authRateLimit: {
        windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
        max: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 5, // 5 auth attempts per window
        message: 'Too many authentication attempts, please try again later.',
        skipSuccessfulRequests: true
      },

      // OTP Configuration
      otp: {
        length: parseInt(process.env.OTP_LENGTH) || 6,
        expiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES) || 5,
        maxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS) || 3,
        resendDelaySeconds: parseInt(process.env.OTP_RESEND_DELAY) || 60
      },

      // Email Configuration (for future use)
      email: {
        service: process.env.EMAIL_SERVICE || 'gmail',
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        },
        from: process.env.EMAIL_FROM || 'noreply@simhastha2028.org'
      },

      // SMS Configuration (for OTP)
      sms: {
        provider: process.env.SMS_PROVIDER || 'twilio',
        accountSid: process.env.TWILIO_ACCOUNT_SID,
        authToken: process.env.TWILIO_AUTH_TOKEN,
        fromNumber: process.env.TWILIO_FROM_NUMBER
      },

      // Logging Configuration
      logging: {
        level: process.env.LOG_LEVEL || (this.environment === 'production' ? 'warn' : 'debug'),
        format: process.env.LOG_FORMAT || 'combined',
        file: process.env.LOG_FILE || 'logs/app.log'
      },

      // Security Configuration
      security: {
        bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
        sessionSecret: process.env.SESSION_SECRET || 'simhastha-session-secret',
        csrfSecret: process.env.CSRF_SECRET || 'simhastha-csrf-secret',
        helmet: {
          contentSecurityPolicy: {
            directives: {
              defaultSrc: ["'self'"],
              styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
              fontSrc: ["'self'", "https://fonts.gstatic.com"],
              imgSrc: ["'self'", "data:", "https:"],
              scriptSrc: ["'self'"],
              connectSrc: ["'self'", "http://localhost:3000", "http://localhost:3001"]
            }
          }
        }
      },

      // External APIs
      apis: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY,
          libraries: ['places', 'geometry']
        },
        firebase: {
          apiKey: process.env.FIREBASE_API_KEY,
          authDomain: process.env.FIREBASE_AUTH_DOMAIN,
          projectId: process.env.FIREBASE_PROJECT_ID,
          storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
          messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
          appId: process.env.FIREBASE_APP_ID
        }
      },

      // Application-specific Configuration
      app: {
        name: 'Simhastha 2028 Clean & Green',
        version: '1.0.0',
        description: 'Waste management and green credits system for Simhastha 2028',
        supportEmail: 'support@simhastha2028.org',
        features: {
          otpAuth: process.env.ENABLE_OTP_AUTH !== 'false',
          emailNotifications: process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true',
          smsNotifications: process.env.ENABLE_SMS_NOTIFICATIONS === 'true',
          fileUploads: process.env.ENABLE_FILE_UPLOADS !== 'false',
          analytics: process.env.ENABLE_ANALYTICS === 'true'
        }
      }
    };
  }

  getCorsOrigins() {
    const origins = process.env.CORS_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:3000';
    
    if (this.environment === 'development') {
      return [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001'
      ];
    }
    
    return origins.split(',').map(origin => origin.trim());
  }

  get(key) {
    const keys = key.split('.');
    let value = this.config;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return undefined;
      }
    }
    
    return value;
  }

  getAll() {
    return this.config;
  }

  isDevelopment() {
    return this.environment === 'development';
  }

  isProduction() {
    return this.environment === 'production';
  }

  isTest() {
    return this.environment === 'test';
  }

  // Validate required environment variables
  validateRequired() {
    const required = [
      'JWT_SECRET'
    ];

    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      console.warn('⚠️  Missing environment variables:', missing.join(', '));
      
      if (this.isProduction()) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
      }
    }
  }

  // Display configuration summary (without sensitive data)
  displaySummary() {
    console.log('🔧 Configuration Summary:');
    console.log(`📍 Environment: ${this.environment}`);
    console.log(`🌐 Server: ${this.config.server.host}:${this.config.server.port}`);
    console.log(`🗄️  Database: ${this.config.database.mongodb.uri.replace(/\/\/.*@/, '//***:***@')}`);
    console.log(`🔐 JWT Secret: ${this.config.jwt.secret ? '[SET]' : '[NOT SET]'}`);
    console.log(`📁 Upload Max Size: ${(this.config.upload.maxFileSize / 1024 / 1024).toFixed(1)}MB`);
    console.log(`🚦 Rate Limit: ${this.config.rateLimit.max} requests per ${this.config.rateLimit.windowMs / 1000 / 60} minutes`);
    console.log(`✨ Features: ${Object.entries(this.config.app.features).filter(([_, enabled]) => enabled).map(([feature]) => feature).join(', ')}`);
  }
}

// Export singleton instance
export default new Environment();
