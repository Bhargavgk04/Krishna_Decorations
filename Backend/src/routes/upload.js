const express = require('express');
const UploadController = require('../controllers/uploadController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');
const { uploadRateLimit } = require('../middleware/security');
const { uploadMultiple, uploadSingle } = require('../middleware/upload');
const { validateFileUpload, sanitizeInput } = require('../utils/validators');

const router = express.Router();

// Apply rate limiting to all upload routes
router.use(uploadRateLimit);

// Apply input sanitization
router.use(sanitizeInput);

// All upload routes require authentication
router.use(authenticate);

/**
 * @route POST /api/upload/images
 * @desc Upload multiple images
 * @access Private (User/Admin)
 */
router.post('/images',
  ...uploadMultiple('images', 5, 'gallery'),
  validateFileUpload('images', {
    maxFiles: 5,
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  }),
  UploadController.uploadMultipleReferenceImages,
);

/**
 * @route POST /api/upload/image
 * @desc Upload single image
 * @access Private (User/Admin)
 */
router.post('/image',
  ...uploadSingle('image', 'temp'),
  validateFileUpload('image', {
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  }),
  UploadController.uploadReferenceImage,
);

/**
 * @route POST /api/upload/profile-image
 * @desc Upload profile image
 * @access Private (User/Admin)
 */
router.post('/profile-image',
  ...uploadSingle('profileImage', 'profiles'),
  validateFileUpload('profileImage', {
    maxFiles: 1,
    maxSize: 2 * 1024 * 1024, // 2MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  }),
  UploadController.uploadReferenceImage,
);

/**
 * @route DELETE /api/upload/image/:publicId
 * @desc Delete image by public ID
 * @access Private (User/Admin)
 */
router.delete('/image/:publicId', UploadController.deleteImage);

/**
 * @route GET /api/upload/gallery
 * @desc Get gallery images (Admin only)
 * @access Private (Admin)
 */
router.get('/gallery', authorizeAdmin(), UploadController.getGalleryImages);

/**
 * @route POST /api/upload/gallery
 * @desc Upload gallery images (Admin only)
 * @access Private (Admin)
 */
router.post('/gallery',
  authorizeAdmin(['manage_gallery']),
  ...uploadMultiple('galleryImages', 10, 'gallery'),
  validateFileUpload('galleryImages', {
    maxFiles: 10,
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  }),
  UploadController.uploadGalleryImage,
);

/**
 * @route PUT /api/upload/gallery/:imageId
 * @desc Update gallery image details (Admin only)
 * @access Private (Admin)
 * TODO: Implement updateGalleryImage method in controller
 */
// router.put('/gallery/:imageId',
//   authorizeAdmin(['manage_gallery']),
//   UploadController.updateGalleryImage
// );

/**
 * @route DELETE /api/upload/gallery/:imageId
 * @desc Delete gallery image (Admin only)
 * @access Private (Admin)
 */
router.delete('/gallery/:imageId',
  authorizeAdmin(['manage_gallery']),
  UploadController.deleteImage,
);

/**
 * @route GET /api/upload/usage-stats
 * @desc Get upload usage statistics (Admin only)
 * @access Private (Admin)
 * TODO: Implement getUploadStats method in controller
 */
// router.get('/usage-stats',
//   authorizeAdmin(['view_statistics']),
//   UploadController.getUploadStats
// );

module.exports = router;