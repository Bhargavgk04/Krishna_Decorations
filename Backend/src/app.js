const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');

// Security middleware
const {
  cors,
  helmet,
  mongoSanitize,
  xss,
  hpp,
  compression,
  generalRateLimit,
  securityHeaders,
  requestLogger,
  maintenanceMode,
  validateContentType,
  requestSizeLimit,
} = require('./middleware/security');

// Error handling
const {
  globalErrorHandler,
  handleNotFound,
  handleUncaughtException,
  handleUnhandledRejection,
  handleSIGTERM,
} = require('./middleware/errorHandler');

// Routes
const apiRoutes = require('./routes');

// Utils
const logger = require('./utils/logger');
const { sanitizeInput } = require('./utils/validators');

// Handle uncaught exceptions
handleUncaughtException();

const app = express();

// Trust proxy (for accurate IP addresses behind reverse proxy)
app.set('trust proxy', 1);

// Maintenance mode check
app.use(maintenanceMode);

// Security headers
app.use(securityHeaders);

// Helmet for security headers
app.use(helmet);

// CORS configuration
app.use(cors);

// Request logging
app.use(requestLogger);

// Compression
app.use(compression);

// Body parsing middleware
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

// Cookie parser
app.use(cookieParser());

// Request size limiting
app.use(requestSizeLimit('10mb'));

// Content type validation for POST/PUT requests
app.use(validateContentType(['application/json', 'multipart/form-data']));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize);

// Data sanitization against XSS
app.use(xss);

// Prevent parameter pollution
app.use(hpp);

// Input sanitization
app.use(sanitizeInput);

// Rate limiting
app.use(generalRateLimit);

// Static files (if needed)
app.use('/public', express.static(path.join(__dirname, '../public')));

// API routes
app.use('/api', apiRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Krishna Decorations API',
    version: process.env.API_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    documentation: '/api/docs',
    health: '/api/health',
    timestamp: new Date().toISOString(),
  });
});

// Handle 404 for unmatched routes
app.all('*', handleNotFound);

// Global error handling middleware
app.use(globalErrorHandler);

// Handle unhandled promise rejections and SIGTERM
let server;

const startServer = (port = process.env.PORT || 5000) => {
  server = app.listen(port, () => {
    console.log(`🚀 Server ready on http://localhost:${port}`);
  }).on('error', (err) => {
    logger.error('Server startup error:', err);
  });

  // Handle unhandled promise rejections
  handleUnhandledRejection(server);

  // Handle SIGTERM
  handleSIGTERM(server);

  return server;
};

// Graceful shutdown
const gracefulShutdown = (signal) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);
  
  if (server) {
    server.close((err) => {
      if (err) {
        logger.error('Error during server shutdown:', err);
        process.exit(1);
      }
      
      logger.info('Server closed successfully');
      
      // Close database connection if needed
      // mongoose.connection.close(() => {
      //   logger.info('Database connection closed');
      //   process.exit(0);
      // });
      
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

// Handle graceful shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Export app and server starter
module.exports = { app, startServer };

// Start server if this file is run directly
if (require.main === module) {
  startServer();
}