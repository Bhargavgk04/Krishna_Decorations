const UploadService = require('../services/uploadService');
const { cleanupTempFiles, getFileInfo } = require('../middleware/upload');
const { ERROR_CODES } = require('../config/constants');
const logger = require('../utils/logger');

class UploadController {
  /**
   * Upload reference image for booking
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async uploadReferenceImage(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: 'No image file provided',
          },
        });
      }

      const userId = req.user.id;
      const { bookingId } = req.body;

      // Upload to Cloudinary
      const uploadResult = await UploadService.uploadReferenceImage(
        req.file,
        userId,
        bookingId
      );

      // Clean up temporary file
      cleanupTempFiles(req.file);

      logger.info('Reference image uploaded successfully:', {
        userId,
        bookingId,
        publicId: uploadResult.publicId,
      });

      res.status(201).json({
        success: true,
        message: 'Reference image uploaded successfully',
        data: {
          id: uploadResult.publicId,
          url: uploadResult.url,
          secureUrl: uploadResult.secureUrl,
          width: uploadResult.width,
          height: uploadResult.height,
          size: uploadResult.size,
          format: uploadResult.format,
          type: uploadResult.type,
          sizes: UploadService.getImageSizes(uploadResult.publicId),
        },
      });
    } catch (error) {
      // Clean up temporary file on error
      if (req.file) {
        cleanupTempFiles(req.file);
      }

      logger.error('Reference image upload failed:', {
        error: error.message,
        userId: req.user?.id,
        file: req.file ? getFileInfo(req.file) : null,
      });

      const statusCode = error.status || 500;
      const errorCode = error.code || ERROR_CODES.SERVER_ERROR;

      res.status(statusCode).json({
        success: false,
        error: {
          code: errorCode,
          message: error.message,
        },
      });
    }
  }

  /**
   * Upload multiple reference images
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async uploadMultipleReferenceImages(req, res) {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: 'No image files provided',
          },
        });
      }

      const userId = req.user.id;
      const { bookingId } = req.body;

      // Upload all files to Cloudinary
      const uploadPromises = req.files.map((file, index) => 
        UploadService.uploadReferenceImage(file, userId, bookingId ? `${bookingId}_${index}` : null)
      );

      const uploadResults = await Promise.all(uploadPromises);

      // Clean up temporary files
      cleanupTempFiles(req.files);

      logger.info('Multiple reference images uploaded successfully:', {
        userId,
        bookingId,
        count: uploadResults.length,
      });

      const responseData = uploadResults.map(result => ({
        id: result.publicId,
        url: result.url,
        secureUrl: result.secureUrl,
        width: result.width,
        height: result.height,
        size: result.size,
        format: result.format,
        type: result.type,
        sizes: UploadService.getImageSizes(result.publicId),
      }));

      res.status(201).json({
        success: true,
        message: `${uploadResults.length} reference images uploaded successfully`,
        data: {
          images: responseData,
          count: responseData.length,
        },
      });
    } catch (error) {
      // Clean up temporary files on error
      if (req.files) {
        cleanupTempFiles(req.files);
      }

      logger.error('Multiple reference images upload failed:', {
        error: error.message,
        userId: req.user?.id,
        fileCount: req.files ? req.files.length : 0,
      });

      const statusCode = error.status || 500;
      const errorCode = error.code || ERROR_CODES.SERVER_ERROR;

      res.status(statusCode).json({
        success: false,
        error: {
          code: errorCode,
          message: error.message,
        },
      });
    }
  }

  /**
   * Upload gallery image (admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async uploadGalleryImage(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: 'No image file provided',
          },
        });
      }

      const adminId = req.user.id;
      const { name, description, tags, category } = req.body;

      // Prepare metadata
      const metadata = {
        name: name || req.file.originalname,
        description: description || '',
        tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
        category: category || 'general',
      };

      // Upload to Cloudinary
      const uploadResult = await UploadService.uploadGalleryImage(
        req.file,
        adminId,
        metadata
      );

      // Clean up temporary file
      cleanupTempFiles(req.file);

      // Log admin activity
      if (req.admin) {
        await req.admin.logActivity('UPLOAD_GALLERY_IMAGE', 'gallery', null, {
          publicId: uploadResult.publicId,
          name: metadata.name,
        }, req.ip);
      }

      logger.info('Gallery image uploaded successfully:', {
        adminId,
        publicId: uploadResult.publicId,
        metadata,
      });

      res.status(201).json({
        success: true,
        message: 'Gallery image uploaded successfully',
        data: {
          id: uploadResult.publicId,
          url: uploadResult.url,
          secureUrl: uploadResult.secureUrl,
          width: uploadResult.width,
          height: uploadResult.height,
          size: uploadResult.size,
          format: uploadResult.format,
          type: uploadResult.type,
          metadata: uploadResult.metadata,
          sizes: UploadService.getImageSizes(uploadResult.publicId),
        },
      });
    } catch (error) {
      // Clean up temporary file on error
      if (req.file) {
        cleanupTempFiles(req.file);
      }

      logger.error('Gallery image upload failed:', {
        error: error.message,
        adminId: req.user?.id,
        file: req.file ? getFileInfo(req.file) : null,
      });

      const statusCode = error.status || 500;
      const errorCode = error.code || ERROR_CODES.SERVER_ERROR;

      res.status(statusCode).json({
        success: false,
        error: {
          code: errorCode,
          message: error.message,
        },
      });
    }
  }

  /**
   * Get gallery images
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getGalleryImages(req, res) {
    try {
      const { category, tags, page = 1, limit = 20 } = req.query;

      // This would typically fetch from a database
      // For now, we'll return a placeholder response
      // In a real implementation, you'd store gallery metadata in MongoDB

      const galleryImages = [
        {
          id: 'gallery_sample_1',
          url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
          secureUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
          width: 800,
          height: 600,
          format: 'jpg',
          size: 150000,
          metadata: {
            name: 'Sample Wedding Decoration',
            description: 'Beautiful wedding decoration with flowers',
            tags: ['wedding', 'flowers', 'elegant'],
            category: 'wedding',
          },
          sizes: UploadService.getImageSizes('gallery_sample_1'),
          createdAt: new Date().toISOString(),
        },
      ];

      // Apply filters (in real implementation, this would be database queries)
      let filteredImages = galleryImages;

      if (category) {
        filteredImages = filteredImages.filter(img => 
          img.metadata.category === category
        );
      }

      if (tags) {
        const tagList = tags.split(',').map(tag => tag.trim().toLowerCase());
        filteredImages = filteredImages.filter(img =>
          tagList.some(tag => 
            img.metadata.tags.some(imgTag => imgTag.toLowerCase().includes(tag))
          )
        );
      }

      // Pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + parseInt(limit);
      const paginatedImages = filteredImages.slice(startIndex, endIndex);

      res.status(200).json({
        success: true,
        data: {
          images: paginatedImages,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(filteredImages.length / limit),
            totalItems: filteredImages.length,
            itemsPerPage: parseInt(limit),
            hasNext: endIndex < filteredImages.length,
            hasPrev: page > 1,
          },
          filters: {
            category: category || null,
            tags: tags ? tags.split(',').map(tag => tag.trim()) : null,
          },
        },
      });
    } catch (error) {
      logger.error('Get gallery images failed:', {
        error: error.message,
        query: req.query,
      });

      res.status(500).json({
        success: false,
        error: {
          code: ERROR_CODES.SERVER_ERROR,
          message: 'Failed to get gallery images',
        },
      });
    }
  }

  /**
   * Delete image
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async deleteImage(req, res) {
    try {
      const { publicId } = req.params;
      const { resourceType = 'image' } = req.query;

      if (!publicId) {
        return res.status(400).json({
          success: false,
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: 'Public ID is required',
          },
        });
      }

      // Delete from Cloudinary
      const deleteResult = await UploadService.deleteFromCloudinary(publicId, resourceType);

      // Log admin activity if admin user
      if (req.admin) {
        await req.admin.logActivity('DELETE_IMAGE', 'image', null, {
          publicId,
          resourceType,
          success: deleteResult.success,
        }, req.ip);
      }

      logger.info('Image deleted successfully:', {
        publicId,
        userId: req.user?.id,
        success: deleteResult.success,
      });

      res.status(200).json({
        success: true,
        message: deleteResult.success ? 'Image deleted successfully' : 'Image not found',
        data: {
          publicId,
          deleted: deleteResult.success,
          result: deleteResult.result,
        },
      });
    } catch (error) {
      logger.error('Image deletion failed:', {
        error: error.message,
        publicId: req.params?.publicId,
        userId: req.user?.id,
      });

      const statusCode = error.status || 500;
      const errorCode = error.code || ERROR_CODES.SERVER_ERROR;

      res.status(statusCode).json({
        success: false,
        error: {
          code: errorCode,
          message: error.message,
        },
      });
    }
  }

  /**
   * Delete multiple images
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async deleteMultipleImages(req, res) {
    try {
      const { publicIds } = req.body;
      const { resourceType = 'image' } = req.query;

      if (!publicIds || !Array.isArray(publicIds) || publicIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: 'Public IDs array is required',
          },
        });
      }

      // Delete from Cloudinary
      const deleteResult = await UploadService.deleteMultipleFromCloudinary(publicIds, resourceType);

      // Log admin activity if admin user
      if (req.admin) {
        await req.admin.logActivity('DELETE_MULTIPLE_IMAGES', 'image', null, {
          publicIds,
          resourceType,
          deletedCount: deleteResult.deletedCount,
          notFoundCount: deleteResult.notFoundCount,
        }, req.ip);
      }

      logger.info('Multiple images deletion completed:', {
        requestedCount: publicIds.length,
        deletedCount: deleteResult.deletedCount,
        notFoundCount: deleteResult.notFoundCount,
        userId: req.user?.id,
      });

      res.status(200).json({
        success: true,
        message: `${deleteResult.deletedCount} images deleted successfully`,
        data: {
          deleted: deleteResult.deleted,
          notFound: deleteResult.notFound,
          deletedCount: deleteResult.deletedCount,
          notFoundCount: deleteResult.notFoundCount,
          totalRequested: publicIds.length,
        },
      });
    } catch (error) {
      logger.error('Multiple images deletion failed:', {
        error: error.message,
        publicIds: req.body?.publicIds,
        userId: req.user?.id,
      });

      const statusCode = error.status || 500;
      const errorCode = error.code || ERROR_CODES.SERVER_ERROR;

      res.status(statusCode).json({
        success: false,
        error: {
          code: errorCode,
          message: error.message,
        },
      });
    }
  }

  /**
   * Get optimized image URL
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getOptimizedImageUrl(req, res) {
    try {
      const { publicId } = req.params;
      const transformations = req.query;

      if (!publicId) {
        return res.status(400).json({
          success: false,
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: 'Public ID is required',
          },
        });
      }

      // Generate optimized URL
      const optimizedUrl = UploadService.getOptimizedImageUrl(publicId, transformations);

      if (!optimizedUrl) {
        return res.status(404).json({
          success: false,
          error: {
            code: ERROR_CODES.NOT_FOUND_ERROR,
            message: 'Image not found',
          },
        });
      }

      res.status(200).json({
        success: true,
        data: {
          publicId,
          url: optimizedUrl,
          transformations,
        },
      });
    } catch (error) {
      logger.error('Get optimized image URL failed:', {
        error: error.message,
        publicId: req.params?.publicId,
      });

      res.status(500).json({
        success: false,
        error: {
          code: ERROR_CODES.SERVER_ERROR,
          message: 'Failed to generate optimized URL',
        },
      });
    }
  }

  /**
   * Get image metadata
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getImageMetadata(req, res) {
    try {
      const { publicId } = req.params;

      if (!publicId) {
        return res.status(400).json({
          success: false,
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: 'Public ID is required',
          },
        });
      }

      // Get metadata from Cloudinary
      const metadata = await UploadService.getFileMetadata(publicId);

      res.status(200).json({
        success: true,
        data: {
          ...metadata,
          sizes: UploadService.getImageSizes(publicId),
        },
      });
    } catch (error) {
      logger.error('Get image metadata failed:', {
        error: error.message,
        publicId: req.params?.publicId,
      });

      const statusCode = error.status || 404;
      const errorCode = error.code || ERROR_CODES.NOT_FOUND_ERROR;

      res.status(statusCode).json({
        success: false,
        error: {
          code: errorCode,
          message: error.message,
        },
      });
    }
  }
}

module.exports = UploadController;