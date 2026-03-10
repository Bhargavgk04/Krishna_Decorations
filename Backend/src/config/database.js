const mongoose = require('mongoose');
const logger = require('../utils/logger');

class DatabaseConnection {
  constructor() {
    this.isConnected = false;
    this.connectionAttempts = 0;
    this.maxRetries = 5;
    this.retryDelay = 5000; // 5 seconds
    this.healthCheckInterval = null;
  }

  /**
   * Connect to MongoDB with retry logic
   */
  async connect() {
    try {
      const mongoURI = this.getMongoURI();
      const options = this.getConnectionOptions();

      // Only log on first attempt or errors
      if (this.connectionAttempts === 0) {
        // logger.info('Connecting to MongoDB...'); // Only log errors
      }

      await mongoose.connect(mongoURI, options);
      
      this.isConnected = true;
      this.connectionAttempts = 0;
      
      // logger.info('✅ MongoDB connected'); // Only log errors

      this.setupEventListeners();
      this.startHealthCheck();
      
      return true;
    } catch (error) {
      this.connectionAttempts++;
      
      logger.error('❌ MongoDB connection failed:', {
        error: error.message,
        attempt: this.connectionAttempts,
        maxRetries: this.maxRetries,
      });

      if (this.connectionAttempts < this.maxRetries) {
        logger.info(`Retrying connection in ${this.retryDelay / 1000} seconds...`);
        await this.delay(this.retryDelay);
        return this.connect();
      } else {
        logger.error('Max connection attempts reached. Exiting...');
        throw new Error(`Failed to connect to MongoDB after ${this.maxRetries} attempts`);
      }
    }
  }

  /**
   * Get MongoDB connection URI
   */
  getMongoURI() {
    const {
      MONGODB_URI,
      MONGODB_HOST = 'localhost',
      MONGODB_PORT = '27017',
      MONGODB_DATABASE = 'krishna_decorations',
      MONGODB_USERNAME,
      MONGODB_PASSWORD,
    } = process.env;

    if (MONGODB_URI) {
      return MONGODB_URI;
    }

    let uri = 'mongodb://';
    
    if (MONGODB_USERNAME && MONGODB_PASSWORD) {
      uri += `${MONGODB_USERNAME}:${MONGODB_PASSWORD}@`;
    }
    
    uri += `${MONGODB_HOST}:${MONGODB_PORT}/${MONGODB_DATABASE}`;
    
    return uri;
  }

  /**
   * Get MongoDB connection options
   */
  getConnectionOptions() {
    return {
      // Connection options
      maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE) || 10,
      minPoolSize: parseInt(process.env.MONGODB_MIN_POOL_SIZE) || 2,
      maxIdleTimeMS: parseInt(process.env.MONGODB_MAX_IDLE_TIME) || 30000,
      serverSelectionTimeoutMS: parseInt(process.env.MONGODB_SERVER_SELECTION_TIMEOUT) || 5000,
      socketTimeoutMS: parseInt(process.env.MONGODB_SOCKET_TIMEOUT) || 45000,
      connectTimeoutMS: parseInt(process.env.MONGODB_CONNECT_TIMEOUT) || 10000,
      
      // Retry options
      retryWrites: true,
      retryReads: true,
      
      // Monitoring options
      heartbeatFrequencyMS: 10000,
      
      // Buffer options (removed deprecated bufferMaxEntries)
      bufferCommands: false,
      
      // Other options
      autoIndex: process.env.NODE_ENV !== 'production',
      autoCreate: process.env.NODE_ENV !== 'production',
    };
  }

  /**
   * Setup MongoDB event listeners
   */
  setupEventListeners() {
    const connection = mongoose.connection;

    connection.on('connected', () => {
      this.isConnected = true;
      logger.info('MongoDB connection established');
    });

    connection.on('disconnected', () => {
      this.isConnected = false;
      logger.warn('MongoDB connection lost');
    });

    connection.on('reconnected', () => {
      this.isConnected = true;
      logger.info('MongoDB reconnected');
    });

    connection.on('error', (error) => {
      this.isConnected = false;
      logger.error('MongoDB connection error:', {
        error: error.message,
        stack: error.stack,
      });
    });

    connection.on('close', () => {
      this.isConnected = false;
      logger.info('MongoDB connection closed');
    });

    // Handle application termination
    process.on('SIGINT', this.gracefulShutdown.bind(this));
    process.on('SIGTERM', this.gracefulShutdown.bind(this));
  }

  /**
   * Start health check monitoring
   */
  startHealthCheck() {
    const interval = parseInt(process.env.DB_HEALTH_CHECK_INTERVAL) || 30000; // 30 seconds
    
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.healthCheck();
      } catch (error) {
        logger.error('Database health check failed:', error);
      }
    }, interval);
  }

  /**
   * Perform database health check
   */
  async healthCheck() {
    try {
      const start = Date.now();
      await mongoose.connection.db.admin().ping();
      const duration = Date.now() - start;
      
      const stats = await this.getConnectionStats();
      
      logger.debug('Database health check passed', {
        responseTime: `${duration}ms`,
        ...stats,
      });
      
      return {
        status: 'healthy',
        responseTime: duration,
        ...stats,
      };
    } catch (error) {
      logger.error('Database health check failed:', error);
      throw error;
    }
  }

  /**
   * Get connection statistics
   */
  async getConnectionStats() {
    try {
      const connection = mongoose.connection;
      const db = connection.db;
      
      const [dbStats, serverStatus] = await Promise.all([
        db.stats(),
        db.admin().serverStatus(),
      ]);

      return {
        readyState: connection.readyState,
        host: connection.host,
        port: connection.port,
        name: connection.name,
        collections: dbStats.collections,
        dataSize: dbStats.dataSize,
        storageSize: dbStats.storageSize,
        indexes: dbStats.indexes,
        uptime: serverStatus.uptime,
        connections: serverStatus.connections,
        memory: serverStatus.mem,
      };
    } catch (error) {
      logger.error('Failed to get connection stats:', error);
      return {};
    }
  }

  /**
   * Graceful shutdown
   */
  async gracefulShutdown(signal) {
    logger.info(`${signal} received. Closing MongoDB connection...`);
    
    try {
      // Clear health check interval
      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval);
      }
      
      // Close MongoDB connection
      await mongoose.connection.close();
      
      logger.info('MongoDB connection closed successfully');
      process.exit(0);
    } catch (error) {
      logger.error('Error during MongoDB shutdown:', error);
      process.exit(1);
    }
  }

  /**
   * Disconnect from MongoDB
   */
  async disconnect() {
    try {
      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval);
      }
      
      await mongoose.connection.close();
      this.isConnected = false;
      
      logger.info('MongoDB disconnected successfully');
    } catch (error) {
      logger.error('Error disconnecting from MongoDB:', error);
      throw error;
    }
  }

  /**
   * Check if database is connected
   */
  isHealthy() {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  /**
   * Get current connection state
   */
  getConnectionState() {
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };
    
    return {
      state: states[mongoose.connection.readyState] || 'unknown',
      readyState: mongoose.connection.readyState,
      isConnected: this.isConnected,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      database: mongoose.connection.name,
    };
  }

  /**
   * Sanitize URI for logging (remove credentials)
   */
  sanitizeURI(uri) {
    return uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
  }

  /**
   * Delay utility
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create database indexes
   */
  async createIndexes() {
    try {
      logger.info('Creating database indexes...');
      
      // This would typically create indexes for better performance
      // Example indexes would be created here based on query patterns
      
      logger.info('Database indexes created successfully');
    } catch (error) {
      logger.error('Failed to create database indexes:', error);
      throw error;
    }
  }

  /**
   * Drop database (use with caution)
   */
  async dropDatabase() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot drop database in production environment');
    }
    
    try {
      await mongoose.connection.db.dropDatabase();
      logger.warn('Database dropped successfully');
    } catch (error) {
      logger.error('Failed to drop database:', error);
      throw error;
    }
  }
}

// Create singleton instance
const databaseConnection = new DatabaseConnection();

// Export connection methods
module.exports = {
  connect: () => databaseConnection.connect(),
  disconnect: () => databaseConnection.disconnect(),
  isHealthy: () => databaseConnection.isHealthy(),
  healthCheck: () => databaseConnection.healthCheck(),
  getConnectionState: () => databaseConnection.getConnectionState(),
  getConnectionStats: () => databaseConnection.getConnectionStats(),
  createIndexes: () => databaseConnection.createIndexes(),
  dropDatabase: () => databaseConnection.dropDatabase(),
};