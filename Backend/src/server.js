require('dotenv').config();
const mongoose = require('mongoose');
const { app, startServer } = require('./app');
const logger = require('./utils/logger');
const database = require('./config/database');

// Database connection
const connectDB = async () => {
  try {
    await database.connect();

    if (mongoose.connection?.host) {
      logger.info(`MongoDB Connected: ${mongoose.connection.host}`);
    }
  } catch (error) {
    logger.error('Database connection failed:', error);
    process.exit(1);
  }
};

// Start the application
const startApp = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Start server
    const port = process.env.PORT || 5000;
    startServer(port);
    
    logger.info(`🚀 Krishna Decorations API started successfully`);
    logger.info(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`🌐 Server: http://localhost:${port}`);
    logger.info(`📊 Health Check: http://localhost:${port}/api/health`);
    
  } catch (error) {
    logger.error('Failed to start application:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);
  
  try {
    await database.disconnect();
    logger.info('Database connection closed');
    
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection:', err);
  gracefulShutdown('UNHANDLED_REJECTION');
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Start the application
startApp();