// Central configuration exports
export { default as Database } from './database.js';
export { default as Environment } from './environment.js';

// Helper function to initialize all configurations
export async function initializeConfig() {
  const { default: Environment } = await import('./environment.js');
  const { default: Database } = await import('./database.js');

  // Validate environment variables
  Environment.validateRequired();

  // Display configuration summary
  if (Environment.isDevelopment()) {
    Environment.displaySummary();
  }

  // Connect to database
  try {
    await Database.connect();
  } catch (error) {
    console.error('❌ Failed to initialize database:', error.message);
    
    if (Environment.isProduction()) {
      throw error;
    }
    
    console.log('⚠️  Continuing without database connection in development mode');
  }

  return {
    Environment,
    Database
  };
}
