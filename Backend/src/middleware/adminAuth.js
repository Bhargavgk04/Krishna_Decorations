const logger = require('../utils/logger');

const adminAuth = (req, res, next) => {
  try {
    // Check if user is authenticated (should be set by auth middleware)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Check if user has admin role
    if (req.user.role !== 'admin') {
      logger.warn(`Unauthorized admin access attempt by user ${req.user.id}`);
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    next();
    
  } catch (error) {
    logger.error('Admin auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Authorization check failed'
    });
  }
};

module.exports = adminAuth;