const { v2: cloudinary } = require('cloudinary');
const crypto = require('crypto');
const logger = require('../utils/logger');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Test connection
const testConnection = async () => {
  try {
    const result = await cloudinary.api.ping();
    // logger.info('✅ Cloudinary connected'); // Only log errors
    return true;
  } catch (error) {
    logger.error('Cloudinary connection failed:', error.message);
    return false;
  }
};

// Generate upload signature for client-side uploads
const generateUploadSignature = (params) => {
  try {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const paramsToSign = {
      ...params,
      timestamp,
    };

    // Create signature
    const signature = cloudinary.utils.api_sign_request(paramsToSign, process.env.CLOUDINARY_API_SECRET);

    return {
      signature,
      timestamp,
      apiKey: process.env.CLOUDINARY_API_KEY,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    };
  } catch (error) {
    logger.error('Failed to generate upload signature:', error);
    throw new Error('Failed to generate upload signature');
  }
};

// Initialize connection test
if (process.env.NODE_ENV !== 'test') {
  testConnection();
}

module.exports = {
  cloudinary,
  testConnection,
  generateUploadSignature,
};