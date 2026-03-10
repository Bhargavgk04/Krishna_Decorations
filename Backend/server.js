const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
dotenv.config({ path: path.join(__dirname, envFile) });

// Import dependencies after env is loaded
const { app, startServer } = require('./src/app');
const database = require('./src/config/database');
const logger = require('./src/utils/logger');

/**
 * Validate required environment variables
 */
const validateEnvironment = () => {
  const required = [
    'NODE_ENV',
    'PORT',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    logger.error('Missing required environment variables:', missing);
    process.exit(1);
  }

  // Validate JWT secrets are strong enough
  if (process.env.JWT_SECRET.length < 32) {
    logger.error('JWT_SECRET must be at least 32 characters long');
    process.exit(1);
  }

  if (process.env.JWT_REFRESH_SECRET.length < 32) {
    logger.error('JWT_REFRESH_SECRET must be at least 32 characters long');
    process.exit(1);
  }

  // Environment validation passed silently
};

/**
 * Initialize application
 */
const initializeApp = async () => {
  try {
    // Validate environment
    validateEnvironment();
    
    // Connect to database
    await database.connect();
    
    // Create database indexes if needed
    if (process.env.CREATE_INDEXES === 'true') {
      await database.createIndexes();
    }
    
    // Start server
    const port = process.env.PORT || 5000;
    const server = startServer(port);
    
    return server;
  } catch (error) {
    logger.error('❌ Failed to start application:', {
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
};

/**
 * Handle process signals for graceful shutdown
 */
const setupGracefulShutdown = (server) => {
  const gracefulShutdown = async (signal) => {
    logger.info(`${signal} received. Starting graceful shutdown...`);
    
    try {
      // Stop accepting new connections
      server.close(async (err) => {
        if (err) {
          logger.error('Error closing server:', err);
          process.exit(1);
        }
        
        logger.info('Server closed');
        
        // Close database connection
        await database.disconnect();
        
        logger.info('✅ Graceful shutdown completed');
        process.exit(0);
      });
      
      // Force shutdown after timeout
      setTimeout(() => {
        logger.error('Forced shutdown due to timeout');
        process.exit(1);
      }, 30000); // 30 seconds timeout
      
    } catch (error) {
      logger.error('Error during graceful shutdown:', error);
      process.exit(1);
    }
  };
  
  // Handle different signals
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // Nodemon restart
};

/**
 * Handle uncaught exceptions and unhandled rejections
 */
const setupErrorHandlers = () => {
  process.on('uncaughtException', (error) => {
    logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...', {
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('UNHANDLED REJECTION! 💥 Shutting down...', {
      reason: reason?.message || reason,
      stack: reason?.stack,
      promise,
    });
    process.exit(1);
  });
};

/**
 * Setup process monitoring
 */
const setupProcessMonitoring = () => {
  // Log memory usage periodically in development
  if (process.env.NODE_ENV === 'development') {
    setInterval(() => {
      const usage = process.memoryUsage();
      const formatBytes = (bytes) => Math.round(bytes / 1024 / 1024 * 100) / 100;
      
      logger.debug('Memory usage:', {
        rss: `${formatBytes(usage.rss)} MB`,
        heapTotal: `${formatBytes(usage.heapTotal)} MB`,
        heapUsed: `${formatBytes(usage.heapUsed)} MB`,
        external: `${formatBytes(usage.external)} MB`,
      });
    }, 60000); // Every minute
  }
  
  // Log uptime periodically
  setInterval(() => {
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);
    
    logger.info(`Server uptime: ${hours}h ${minutes}m ${seconds}s`);
  }, 3600000); // Every hour
};

/**
 * Main execution
 */
const main = async () => {
  try {
    // Setup error handlers first
    setupErrorHandlers();
    
    // Initialize and start the application
    const server = await initializeApp();
    
    // Setup graceful shutdown
    setupGracefulShutdown(server);
    
    // Setup process monitoring
    setupProcessMonitoring();
    
    // Health check endpoint logging
    if (process.env.LOG_HEALTH_CHECKS === 'true') {
      setInterval(async () => {
        try {
          const dbHealth = await database.healthCheck();
          logger.debug('Health check:', {
            database: dbHealth.status,
            responseTime: dbHealth.responseTime,
          });
        } catch (error) {
          logger.warn('Health check failed:', error.message);
        }
      }, 30000); // Every 30 seconds
    }
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the application
if (require.main === module) {
  main();
}

module.exports = { main };