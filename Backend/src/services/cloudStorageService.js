const { cloudinary, generateUploadSignature } = require('../config/cloudinary');
const { FILE_UPLOAD, ERROR_CODES } = require('../config/constants');
const logger = require('../utils/logger');

class CloudStorageService {
  /**
   * Initialize cloud storage service
   */
  static async initialize() {
    try {
      // Test connection
      await cloudinary.api.ping();
      
      // Create upload presets if they don't exist
      await this.createUploadPresets();
      
      logger.info('Cloud storage service initialized successfully');
      return true;
    } catch (error) {
      logger.error('Cloud storage service initialization failed:', error);
      return false;
    }
  }

  /**
   * Create upload presets for different image types
   */
  static async createUploadPresets() {
    try {
      // Reference images preset
      await this.createOrUpdatePreset('event_references', {
        folder: FILE_UPLOAD.UPLOAD_PATHS.REFERENCES,
        transformation: [
          { width: 1200, height: 1200, crop: 'limit' },
          { quality: 'auto:good' },
          { fetch_format: 'auto' }
        ],
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        max_file_size: FILE_UPLOAD.MAX_SIZE,
        tags: 'reference,user_upload',
      });

      // Gallery images preset
      await this.createOrUpdatePreset('event_gallery', {
        folder: FILE_UPLOAD.UPLOAD_PATHS.GALLERY,
        transformation: [
          { width: 800, height: 600, crop: 'fill' },
          { quality: 'auto:good' },
          { fetch_format: 'auto' }
        ],
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        max_file_size: FILE_UPLOAD.MAX_SIZE,
        tags: 'gallery,admin_upload',
      });

      logger.info('Upload presets created/updated successfully');
    } catch (error) {
      logger.error('Failed to create upload presets:', error);
    }
  }

  /**
   * Create or update upload preset
   * @param {string} name - Preset name
   * @param {Object} settings - Preset settings
   */
  static async createOrUpdatePreset(name, settings) {
    try {
      // Try to get existing preset
      try {
        await cloudinary.api.upload_preset(name);
        // Update existing preset
        await cloudinary.api.update_upload_preset(name, settings);
        logger.info(`Upload preset updated: ${name}`);
      } catch (error) {
        // Create new preset if it doesn't exist
        await cloudinary.api.create_upload_preset({
          name,
          ...settings,
        });
        logger.info(`Upload preset created: ${name}`);
      }
    } catch (error) {
      logger.error(`Failed to create/update preset ${name}:`, error);
    }
  }

  /**
   * Generate signed upload URL for client-side uploads
   * @param {Object} options - Upload options
   * @returns {Object} Signed upload data
   */
  static generateSignedUpload(options = {}) {
    try {
      const {
        folder = FILE_UPLOAD.UPLOAD_PATHS.REFERENCES,
        publicId = null,
        transformation = null,
        tags = null,
        uploadPreset = null,
      } = options;

      const params = {
        folder,
        ...(publicId && { public_id: publicId }),
        ...(transformation && { transformation }),
        ...(tags && { tags }),
        ...(uploadPreset && { upload_preset: uploadPreset }),
      };

      const signatureData = generateUploadSignature(params);

      return {
        ...signatureData,
        uploadUrl: `https://api.cloudinary.com/v1_1/${cloudinary.config().cloud_name}/image/upload`,
        params,
      };
    } catch (error) {
      logger.error('Failed to generate signed upload:', error);
      throw new Error('Failed to generate upload signature');
    }
  }

  /**
   * Get CDN URL with optimizations
   * @param {string} publicId - Cloudinary public ID
   * @param {Object} options - Transformation options
   * @returns {string} Optimized CDN URL
   */
  static getCdnUrl(publicId, options = {}) {
    try {
      const {
        width = null,
        height = null,
        crop = 'limit',
        quality = 'auto',
        format = 'auto',
        dpr = 'auto',
        flags = null,
        effect = null,
      } = options;

      const transformations = {
        ...(width && { width }),
        ...(height && { height }),
        crop,
        quality,
        fetch_format: format,
        dpr,
        ...(flags && { flags }),
        ...(effect && { effect }),
      };

      return cloudinary.url(publicId, transformations);
    } catch (error) {
      logger.error('Failed to generate CDN URL:', error);
      return null;
    }
  }

  /**
   * Get responsive image URLs for different screen sizes
   * @param {string} publicId - Cloudinary public ID
   * @returns {Object} Responsive image URLs
   */
  static getResponsiveUrls(publicId) {
    try {
      return {
        // Mobile (up to 480px)
        mobile: this.getCdnUrl(publicId, { width: 480, quality: 'auto:low' }),
        // Tablet (up to 768px)
        tablet: this.getCdnUrl(publicId, { width: 768, quality: 'auto:good' }),
        // Desktop (up to 1200px)
        desktop: this.getCdnUrl(publicId, { width: 1200, quality: 'auto:good' }),
        // Large desktop (up to 1920px)
        large: this.getCdnUrl(publicId, { width: 1920, quality: 'auto:best' }),
        // Original
        original: this.getCdnUrl(publicId, { quality: 'auto:best' }),
      };
    } catch (error) {
      logger.error('Failed to generate responsive URLs:', error);
      return null;
    }
  }

  /**
   * Generate image srcset for responsive images
   * @param {string} publicId - Cloudinary public ID
   * @returns {string} Srcset string
   */
  static generateSrcSet(publicId) {
    try {
      const sizes = [480, 768, 1200, 1920];
      const srcsetParts = sizes.map(width => {
        const url = this.getCdnUrl(publicId, { width, quality: 'auto' });
        return `${url} ${width}w`;
      });

      return srcsetParts.join(', ');
    } catch (error) {
      logger.error('Failed to generate srcset:', error);
      return '';
    }
  }

  /**
   * Optimize image for web delivery
   * @param {string} publicId - Cloudinary public ID
   * @param {Object} options - Optimization options
   * @returns {Object} Optimized image data
   */
  static optimizeForWeb(publicId, options = {}) {
    try {
      const {
        maxWidth = 1200,
        quality = 'auto:good',
        format = 'auto',
      } = options;

      const optimizedUrl = this.getCdnUrl(publicId, {
        width: maxWidth,
        crop: 'limit',
        quality,
        format,
        flags: 'progressive',
      });

      const responsiveUrls = this.getResponsiveUrls(publicId);
      const srcset = this.generateSrcSet(publicId);

      return {
        url: optimizedUrl,
        responsive: responsiveUrls,
        srcset,
        sizes: '(max-width: 480px) 100vw, (max-width: 768px) 100vw, (max-width: 1200px) 100vw, 1200px',
      };
    } catch (error) {
      logger.error('Failed to optimize image for web:', error);
      return null;
    }
  }

  /**
   * Get image analysis data
   * @param {string} publicId - Cloudinary public ID
   * @returns {Object} Image analysis data
   */
  static async getImageAnalysis(publicId) {
    try {
      // Get basic resource info
      const resource = await cloudinary.api.resource(publicId, {
        image_metadata: true,
        colors: true,
        faces: true,
        quality_analysis: true,
      });

      return {
        publicId: resource.public_id,
        format: resource.format,
        width: resource.width,
        height: resource.height,
        size: resource.bytes,
        aspectRatio: (resource.width / resource.height).toFixed(2),
        colors: resource.colors || [],
        faces: resource.faces || [],
        qualityAnalysis: resource.quality_analysis || null,
        metadata: resource.image_metadata || {},
        createdAt: resource.created_at,
        tags: resource.tags || [],
      };
    } catch (error) {
      logger.error('Failed to get image analysis:', error);
      throw new Error('Failed to analyze image');
    }
  }

  /**
   * Bulk operations for multiple images
   * @param {Array} publicIds - Array of public IDs
   * @param {string} operation - Operation to perform
   * @param {Object} options - Operation options
   * @returns {Object} Bulk operation results
   */
  static async bulkOperation(publicIds, operation, options = {}) {
    try {
      let result;

      switch (operation) {
        case 'delete':
          result = await cloudinary.api.delete_resources(publicIds, options);
          break;
        
        case 'add_tag':
          result = await cloudinary.api.add_tag(options.tag, publicIds, options);
          break;
        
        case 'remove_tag':
          result = await cloudinary.api.remove_tag(options.tag, publicIds, options);
          break;
        
        case 'update_context':
          result = await cloudinary.api.update(publicIds[0], {
            context: options.context,
          });
          break;
        
        default:
          throw new Error(`Unsupported bulk operation: ${operation}`);
      }

      logger.info(`Bulk operation ${operation} completed:`, {
        publicIds: publicIds.length,
        operation,
        success: true,
      });

      return result;
    } catch (error) {
      logger.error(`Bulk operation ${operation} failed:`, error);
      throw new Error(`Bulk operation failed: ${error.message}`);
    }
  }

  /**
   * Get storage usage statistics
   * @returns {Object} Storage usage data
   */
  static async getStorageStats() {
    try {
      const usage = await cloudinary.api.usage();
      
      return {
        plan: usage.plan,
        credits: {
          used: usage.credits.used,
          limit: usage.credits.limit,
          remaining: usage.credits.limit - usage.credits.used,
          usagePercentage: ((usage.credits.used / usage.credits.limit) * 100).toFixed(2),
        },
        objects: {
          used: usage.objects.used,
          limit: usage.objects.limit,
        },
        bandwidth: {
          used: usage.bandwidth.used,
          limit: usage.bandwidth.limit,
        },
        storage: {
          used: usage.storage.used,
          limit: usage.storage.limit,
        },
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Failed to get storage stats:', error);
      throw new Error('Failed to get storage statistics');
    }
  }

  /**
   * Search images by tags or metadata
   * @param {Object} searchOptions - Search parameters
   * @returns {Object} Search results
   */
  static async searchImages(searchOptions = {}) {
    try {
      const {
        tags = null,
        publicId = null,
        folder = null,
        resourceType = 'image',
        maxResults = 50,
      } = searchOptions;

      let expression = `resource_type:${resourceType}`;
      
      if (tags) {
        const tagList = Array.isArray(tags) ? tags : [tags];
        expression += ` AND tags:(${tagList.join(' OR ')})`;
      }
      
      if (publicId) {
        expression += ` AND public_id:${publicId}*`;
      }
      
      if (folder) {
        expression += ` AND folder:${folder}`;
      }

      const result = await cloudinary.search
        .expression(expression)
        .max_results(maxResults)
        .with_field('tags')
        .with_field('context')
        .sort_by([['created_at', 'desc']])
        .execute();

      return {
        images: result.resources.map(resource => ({
          publicId: resource.public_id,
          url: resource.secure_url,
          width: resource.width,
          height: resource.height,
          format: resource.format,
          size: resource.bytes,
          tags: resource.tags || [],
          context: resource.context || {},
          createdAt: resource.created_at,
        })),
        totalCount: result.total_count,
        nextCursor: result.next_cursor,
      };
    } catch (error) {
      logger.error('Image search failed:', error);
      throw new Error('Failed to search images');
    }
  }

  /**
   * Create image transformation URL with effects
   * @param {string} publicId - Cloudinary public ID
   * @param {Array} transformations - Array of transformation objects
   * @returns {string} Transformed image URL
   */
  static createTransformationUrl(publicId, transformations) {
    try {
      return cloudinary.url(publicId, {
        transformation: transformations,
      });
    } catch (error) {
      logger.error('Failed to create transformation URL:', error);
      return null;
    }
  }
}

module.exports = CloudStorageService;