const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { FILE_UPLOAD, ERROR_CODES } = require('../config/constants');
const { sanitizeFilename } = require('../utils/helpers');
const logger = require('../utils/logger');

// Ensure upload directories exist
const ensureUploadDirs = () => {
  const dirs = [
    'uploads',
    'uploads/references',
    'uploads/gallery',
    'uploads/temp',
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      logger.info(`Created upload directory: ${dir}`);
    }
  });
};

// Initialize upload directories
ensureUploadDirs();

// Storage configuration for local uploads (temporary)
const localStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadType = req.uploadType || 'temp';
    const uploadPath = path.join('uploads', uploadType);
    
    // Ensure directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const sanitizedName = sanitizeFilename(file.originalname);
    const ext = path.extname(sanitizedName);
    const name = path.basename(sanitizedName, ext);
    
    const filename = `${timestamp}-${randomString}-${name}${ext}`;
    cb(null, filename);
  },
});

// Memory storage for direct cloud upload
const memoryStorage = multer.memoryStorage();

// File filter function
const fileFilter = (req, file, cb) => {
  try {
    // Check file type
    if (!FILE_UPLOAD.ALLOWED_TYPES.includes(file.mimetype)) {
      const error = new Error(`Invalid file type. Allowed types: ${FILE_UPLOAD.ALLOWED_TYPES.join(', ')}`);
      error.code = 'INVALID_FILE_TYPE';
      return cb(error, false);
    }

    // Additional validation based on field name
    if (file.fieldname === 'referenceImage' || file.fieldname === 'referenceImages') {
      // Reference images validation
      if (!file.mimetype.startsWith('image/')) {
        const error = new Error('Reference files must be images');
        error.code = 'INVALID_REFERENCE_FILE';
        return cb(error, false);
      }
    }

    if (file.fieldname === 'galleryImage') {
      // Gallery images validation
      if (!file.mimetype.startsWith('image/')) {
        const error = new Error('Gallery files must be images');
        error.code = 'INVALID_GALLERY_FILE';
        return cb(error, false);
      }
    }

    cb(null, true);
  } catch (error) {
    logger.error('File filter error:', error);
    cb(error, false);
  }
};

// Multer configuration for local storage
const uploadLocal = multer({
  storage: localStorage,
  fileFilter,
  limits: {
    fileSize: FILE_UPLOAD.MAX_SIZE,
    files: 10, // Maximum 10 files per request
  },
});

// Multer configuration for memory storage (cloud upload)
const uploadMemory = multer({
  storage: memoryStorage,
  fileFilter,
  limits: {
    fileSize: FILE_UPLOAD.MAX_SIZE,
    files: 10,
  },
});

// Middleware to set upload type
const setUploadType = (type) => {
  return (req, res, next) => {
    req.uploadType = type;
    next();
  };
};

// Single file upload middleware
const uploadSingle = (fieldName, uploadType = 'temp') => {
  return [
    setUploadType(uploadType),
    uploadLocal.single(fieldName),
    (req, res, next) => {
      if (req.file) {
        logger.info('File uploaded successfully:', {
          originalName: req.file.originalname,
          filename: req.file.filename,
          size: req.file.size,
          mimetype: req.file.mimetype,
          uploadType,
        });
      }
      next();
    },
  ];
};

// Multiple files upload middleware
const uploadMultiple = (fieldName, maxCount = 5, uploadType = 'temp') => {
  return [
    setUploadType(uploadType),
    uploadLocal.array(fieldName, maxCount),
    (req, res, next) => {
      if (req.files && req.files.length > 0) {
        logger.info('Multiple files uploaded successfully:', {
          count: req.files.length,
          files: req.files.map(f => ({
            originalName: f.originalname,
            filename: f.filename,
            size: f.size,
          })),
          uploadType,
        });
      }
      next();
    },
  ];
};

// Memory upload for cloud storage
const uploadToMemory = (fieldName, maxCount = 1) => {
  const middleware = maxCount === 1 
    ? uploadMemory.single(fieldName)
    : uploadMemory.array(fieldName, maxCount);

  return [
    middleware,
    (req, res, next) => {
      const files = req.files || (req.file ? [req.file] : []);
      if (files.length > 0) {
        logger.info('Files loaded to memory for cloud upload:', {
          count: files.length,
          totalSize: files.reduce((sum, f) => sum + f.size, 0),
        });
      }
      next();
    },
  ];
};

// File validation middleware
const validateUploadedFiles = (req, res, next) => {
  try {
    const files = req.files || (req.file ? [req.file] : []);
    
    if (files.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'No files uploaded',
        },
      });
    }

    // Validate each file
    for (const file of files) {
      // Check file size
      if (file.size > FILE_UPLOAD.MAX_SIZE) {
        return res.status(400).json({
          success: false,
          error: {
            code: ERROR_CODES.FILE_UPLOAD_ERROR,
            message: `File ${file.originalname} exceeds maximum size of ${FILE_UPLOAD.MAX_SIZE / (1024 * 1024)}MB`,
          },
        });
      }

      // Check file type
      if (!FILE_UPLOAD.ALLOWED_TYPES.includes(file.mimetype)) {
        return res.status(400).json({
          success: false,
          error: {
            code: ERROR_CODES.FILE_UPLOAD_ERROR,
            message: `File ${file.originalname} has invalid type. Allowed types: ${FILE_UPLOAD.ALLOWED_TYPES.join(', ')}`,
          },
        });
      }
    }

    next();
  } catch (error) {
    logger.error('File validation error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: ERROR_CODES.SERVER_ERROR,
        message: 'File validation failed',
      },
    });
  }
};

// Error handling middleware for multer
const handleUploadError = (error, req, res, next) => {
  logger.error('Upload error:', error);

  if (error instanceof multer.MulterError || error.code?.startsWith('LIMIT_')) {
    let message = 'File upload error';
    let code = ERROR_CODES.FILE_UPLOAD_ERROR;

    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        message = `File too large. Maximum size is ${FILE_UPLOAD.MAX_SIZE / (1024 * 1024)}MB`;
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files uploaded';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Too many files uploaded';
        break;
      case 'LIMIT_PART_COUNT':
        message = 'Too many parts in multipart form';
        break;
      case 'LIMIT_FIELD_KEY':
        message = 'Field name too long';
        break;
      case 'LIMIT_FIELD_VALUE':
        message = 'Field value too long';
        break;
      case 'LIMIT_FIELD_COUNT':
        message = 'Too many fields';
        break;
      default:
        message = error.message || 'File upload error';
    }

    return res.status(400).json({
      success: false,
      error: {
        code,
        message,
      },
    });
  }

  if (error.code === 'INVALID_FILE_TYPE' || error.code === 'INVALID_REFERENCE_FILE' || error.code === 'INVALID_GALLERY_FILE') {
    return res.status(400).json({
      success: false,
      error: {
        code: ERROR_CODES.FILE_UPLOAD_ERROR,
        message: error.message,
      },
    });
  }

  // Pass other errors to global error handler
  next(error);
};

// Cleanup temporary files
const cleanupTempFiles = (files) => {
  if (!files) return;

  const fileList = Array.isArray(files) ? files : [files];
  
  fileList.forEach(file => {
    if (file.path && fs.existsSync(file.path)) {
      fs.unlink(file.path, (err) => {
        if (err) {
          logger.error('Failed to cleanup temp file:', err);
        } else {
          logger.info('Temp file cleaned up:', file.path);
        }
      });
    }
  });
};

// Middleware to cleanup files on error
const cleanupOnError = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // If response is an error and we have uploaded files, clean them up
    if (res.statusCode >= 400 && (req.files || req.file)) {
      cleanupTempFiles(req.files || req.file);
    }
    return originalSend.call(this, data);
  };

  next();
};

// Get file info helper
const getFileInfo = (file) => {
  return {
    originalName: file.originalname,
    filename: file.filename,
    size: file.size,
    mimetype: file.mimetype,
    path: file.path,
    url: file.path ? `/uploads/${path.relative('uploads', file.path).replace(/\\/g, '/')}` : null,
  };
};

module.exports = {
  uploadSingle,
  uploadMultiple,
  uploadToMemory,
  validateUploadedFiles,
  handleUploadError,
  cleanupTempFiles,
  cleanupOnError,
  getFileInfo,
  setUploadType,
  
  // Direct multer instances for custom usage
  uploadLocal,
  uploadMemory,
};