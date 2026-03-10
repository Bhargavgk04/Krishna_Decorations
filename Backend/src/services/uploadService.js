const { cloudinary } = require("../config/cloudinary");
const fs = require("fs");
const path = require("path");
const { FILE_UPLOAD, ERROR_CODES } = require("../config/constants");
const { sanitizeFilename } = require("../utils/helpers");
const logger = require("../utils/logger");

class UploadService {
  /**
   * Upload file to Cloudinary
   * @param {Object} file - File object (from multer)
   * @param {Object} options - Upload options
   * @returns {Object} Upload result
   */
  static async uploadToCloudinary(file, options = {}) {
    try {
      const {
        folder = FILE_UPLOAD.UPLOAD_PATHS.REFERENCES,
        transformation = {},
        resourceType = "image",
        publicId = null,
      } = options;

      // Prepare upload options
      const uploadOptions = {
        folder,
        resource_type: resourceType,
        transformation: {
          quality: "auto",
          fetch_format: "auto",
          ...transformation,
        },
        ...((publicId && { public_id: publicId }) || {}),
      };

      let uploadResult;

      if (file.buffer) {
        // Upload from memory buffer
        uploadResult = await new Promise((resolve, reject) => {
          cloudinary.uploader
            .upload_stream(uploadOptions, (error, result) => {
              if (error) reject(error);
              else resolve(result);
            })
            .end(file.buffer);
        });
      } else if (file.path) {
        // Upload from file path
        uploadResult = await cloudinary.uploader.upload(
          file.path,
          uploadOptions
        );
      } else {
        throw this.createUploadError(
          "File must have either buffer or path",
          "INVALID_FILE_FORMAT"
        );
      }

      logger.info("File uploaded to Cloudinary successfully:", {
        originalName: file.originalname,
        publicId: uploadResult.public_id,
        url: uploadResult.secure_url,
        size: uploadResult.bytes,
      });

      return {
        publicId: uploadResult.public_id,
        url: uploadResult.secure_url,
        secureUrl: uploadResult.secure_url,
        width: uploadResult.width,
        height: uploadResult.height,
        format: uploadResult.format,
        size: uploadResult.bytes,
        createdAt: uploadResult.created_at,
      };
    } catch (error) {
      // Re-throw our custom errors
      if (error.code === "INVALID_FILE_FORMAT") {
        throw error;
      }

      logger.error("Cloudinary upload failed:", {
        error: error.message,
        originalName: file.originalname,
      });
      throw this.createUploadError(
        "Failed to upload file to cloud storage",
        "CLOUDINARY_UPLOAD_FAILED"
      );
    }
  }

  /**
   * Upload multiple files to Cloudinary
   * @param {Array} files - Array of file objects
   * @param {Object} options - Upload options
   * @returns {Array} Array of upload results
   */
  static async uploadMultipleToCloudinary(files, options = {}) {
    try {
      const uploadPromises = files.map((file, index) => {
        const fileOptions = {
          ...options,
          publicId: options.publicId ? `${options.publicId}_${index}` : null,
        };
        return this.uploadToCloudinary(file, fileOptions);
      });

      const results = await Promise.all(uploadPromises);

      logger.info("Multiple files uploaded to Cloudinary:", {
        count: results.length,
        totalSize: results.reduce((sum, r) => sum + r.size, 0),
      });

      return results;
    } catch (error) {
      logger.error("Multiple file upload failed:", error);
      throw this.createUploadError(
        "Failed to upload multiple files",
        "MULTIPLE_UPLOAD_FAILED"
      );
    }
  }

  /**
   * Delete file from Cloudinary
   * @param {string} publicId - Cloudinary public ID
   * @param {string} resourceType - Resource type (image, video, etc.)
   * @returns {Object} Deletion result
   */
  static async deleteFromCloudinary(publicId, resourceType = "image") {
    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
      });

      logger.info("File deleted from Cloudinary:", {
        publicId,
        result: result.result,
      });

      return {
        success: result.result === "ok",
        publicId,
        result: result.result,
      };
    } catch (error) {
      logger.error("Cloudinary deletion failed:", {
        error: error.message,
        publicId,
      });
      throw this.createUploadError(
        "Failed to delete file from cloud storage",
        "CLOUDINARY_DELETE_FAILED"
      );
    }
  }

  /**
   * Delete multiple files from Cloudinary
   * @param {Array} publicIds - Array of Cloudinary public IDs
   * @param {string} resourceType - Resource type
   * @returns {Object} Deletion results
   */
  static async deleteMultipleFromCloudinary(publicIds, resourceType = "image") {
    try {
      const result = await cloudinary.api.delete_resources(publicIds, {
        resource_type: resourceType,
      });

      logger.info("Multiple files deleted from Cloudinary:", {
        count: publicIds.length,
        deleted: Object.keys(result.deleted).length,
        notFound: Object.keys(result.not_found).length,
      });

      return {
        deleted: result.deleted,
        notFound: result.not_found,
        deletedCount: Object.keys(result.deleted).length,
        notFoundCount: Object.keys(result.not_found).length,
      };
    } catch (error) {
      logger.error("Multiple file deletion failed:", error);
      throw this.createUploadError(
        "Failed to delete multiple files",
        "MULTIPLE_DELETE_FAILED"
      );
    }
  }

  /**
   * Upload reference image for booking
   * @param {Object} file - File object
   * @param {string} userId - User ID
   * @param {string} bookingId - Booking ID (optional)
   * @returns {Object} Upload result
   */
  static async uploadReferenceImage(file, userId, bookingId = null) {
    try {
      // Validate file
      this.validateImageFile(file);

      // Generate public ID
      const timestamp = Date.now();
      const publicId = bookingId
        ? `reference_${bookingId}_${timestamp}`
        : `reference_${userId}_${timestamp}`;

      // Upload to Cloudinary
      const result = await this.uploadToCloudinary(file, {
        folder: FILE_UPLOAD.UPLOAD_PATHS.REFERENCES,
        publicId,
        transformation: {
          width: 1200,
          height: 1200,
          crop: "limit",
          quality: "auto:good",
        },
      });

      return {
        ...result,
        type: "reference",
        userId,
        bookingId,
      };
    } catch (error) {
      if (error.code) throw error;
      logger.error("Reference image upload failed:", error);
      throw this.createUploadError(
        "Failed to upload reference image",
        "REFERENCE_UPLOAD_FAILED"
      );
    }
  }

  /**
   * Upload gallery image (admin only)
   * @param {Object} file - File object
   * @param {string} adminId - Admin ID
   * @param {Object} metadata - Image metadata
   * @returns {Object} Upload result
   */
  static async uploadGalleryImage(file, adminId, metadata = {}) {
    try {
      // Validate file
      this.validateImageFile(file);

      // Generate public ID
      const timestamp = Date.now();
      const sanitizedName = sanitizeFilename(
        metadata.name || file.originalname
      );
      const publicId = `gallery_${timestamp}_${sanitizedName.replace(
        /\.[^/.]+$/,
        ""
      )}`;

      // Upload to Cloudinary
      const result = await this.uploadToCloudinary(file, {
        folder: FILE_UPLOAD.UPLOAD_PATHS.GALLERY,
        publicId,
        transformation: {
          width: 800,
          height: 600,
          crop: "fill",
          quality: "auto:good",
        },
      });

      return {
        ...result,
        type: "gallery",
        adminId,
        metadata: {
          name: metadata.name || file.originalname,
          description: metadata.description || "",
          tags: metadata.tags || [],
          category: metadata.category || "general",
        },
      };
    } catch (error) {
      if (error.code) throw error;
      logger.error("Gallery image upload failed:", error);
      throw this.createUploadError(
        "Failed to upload gallery image",
        "GALLERY_UPLOAD_FAILED"
      );
    }
  }

  /**
   * Get optimized image URL with transformations
   * @param {string} publicId - Cloudinary public ID
   * @param {Object} transformations - Image transformations
   * @returns {string} Optimized image URL
   */
  static getOptimizedImageUrl(publicId, transformations = {}) {
    try {
      const defaultTransformations = {
        quality: "auto",
        fetch_format: "auto",
      };

      const url = cloudinary.url(publicId, {
        ...defaultTransformations,
        ...transformations,
      });

      return url;
    } catch (error) {
      logger.error("Failed to generate optimized URL:", error);
      return null;
    }
  }

  /**
   * Generate multiple image sizes
   * @param {string} publicId - Cloudinary public ID
   * @returns {Object} URLs for different sizes
   */
  static getImageSizes(publicId) {
    try {
      return {
        thumbnail: this.getOptimizedImageUrl(publicId, {
          width: 150,
          height: 150,
          crop: "fill",
        }),
        small: this.getOptimizedImageUrl(publicId, {
          width: 300,
          height: 300,
          crop: "limit",
        }),
        medium: this.getOptimizedImageUrl(publicId, {
          width: 600,
          height: 600,
          crop: "limit",
        }),
        large: this.getOptimizedImageUrl(publicId, {
          width: 1200,
          height: 1200,
          crop: "limit",
        }),
        original: this.getOptimizedImageUrl(publicId),
      };
    } catch (error) {
      logger.error("Failed to generate image sizes:", error);
      return null;
    }
  }

  /**
   * Validate image file
   * @param {Object} file - File object
   */
  static validateImageFile(file) {
    if (!file) {
      throw this.createUploadError("No file provided", "NO_FILE");
    }

    if (!file.mimetype.startsWith("image/")) {
      throw this.createUploadError(
        "File must be an image",
        "INVALID_FILE_TYPE"
      );
    }

    if (file.size > FILE_UPLOAD.MAX_SIZE) {
      throw this.createUploadError(
        `File size exceeds maximum limit of ${
          FILE_UPLOAD.MAX_SIZE / (1024 * 1024)
        }MB`,
        "FILE_TOO_LARGE"
      );
    }

    if (!FILE_UPLOAD.ALLOWED_TYPES.includes(file.mimetype)) {
      throw this.createUploadError(
        `Invalid file type. Allowed types: ${FILE_UPLOAD.ALLOWED_TYPES.join(
          ", "
        )}`,
        "INVALID_FILE_TYPE"
      );
    }
  }

  /**
   * Clean up local temporary files
   * @param {Array|Object} files - File or array of files
   */
  static cleanupLocalFiles(files) {
    const fileList = Array.isArray(files) ? files : [files];

    fileList.forEach((file) => {
      if (file && file.path && fs.existsSync(file.path)) {
        fs.unlink(file.path, (err) => {
          if (err) {
            logger.error("Failed to cleanup local file:", err);
          } else {
            logger.info("Local file cleaned up:", file.path);
          }
        });
      }
    });
  }

  /**
   * Get file metadata
   * @param {string} publicId - Cloudinary public ID
   * @returns {Object} File metadata
   */
  static async getFileMetadata(publicId) {
    try {
      const result = await cloudinary.api.resource(publicId);

      return {
        publicId: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height,
        size: result.bytes,
        url: result.secure_url,
        createdAt: result.created_at,
        tags: result.tags || [],
      };
    } catch (error) {
      logger.error("Failed to get file metadata:", error);
      throw this.createUploadError(
        "Failed to get file metadata",
        "METADATA_FETCH_FAILED"
      );
    }
  }

  /**
   * Create upload error
   * @param {string} message - Error message
   * @param {string} code - Error code
   * @returns {Error} Upload error
   */
  static createUploadError(message, code) {
    const error = new Error(message);
    error.code = code;
    error.status = 400;
    return error;
  }
}

module.exports = UploadService;
