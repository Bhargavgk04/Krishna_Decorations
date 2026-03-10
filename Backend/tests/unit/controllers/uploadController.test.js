const UploadController = require('../../../src/controllers/uploadController');
const UploadService = require('../../../src/services/uploadService');
const { ERROR_CODES } = require('../../../src/config/constants');

// Mock dependencies
jest.mock('../../../src/services/uploadService');
jest.mock('../../../src/middleware/upload', () => ({
  cleanupTempFiles: jest.fn(),
  getFileInfo: jest.fn((file) => ({
    originalName: file.originalname,
    filename: file.filename,
    size: file.size,
    mimetype: file.mimetype,
  })),
}));

describe('UploadController', () => {
  let req, res;

  beforeEach(() => {
    req = {
      user: { id: 'user123' },
      body: {},
      params: {},
      query: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  describe('uploadReferenceImage', () => {
    it('should upload reference image successfully', async () => {
      req.file = {
        originalname: 'reference.png',
        filename: 'unique-reference.png',
        mimetype: 'image/png',
        size: 1024,
        path: '/tmp/reference.png',
      };
      req.body.bookingId = 'booking123';

      const mockUploadResult = {
        publicId: 'reference_booking123_123456789',
        url: 'https://res.cloudinary.com/test/image/upload/reference.png',
        secureUrl: 'https://res.cloudinary.com/test/image/upload/reference.png',
        width: 800,
        height: 600,
        format: 'png',
        size: 1024,
        type: 'reference',
      };

      UploadService.uploadReferenceImage.mockResolvedValue(mockUploadResult);
      UploadService.getImageSizes.mockReturnValue({
        thumbnail: 'https://res.cloudinary.com/test/image/upload/w_150,h_150,c_fill/reference.png',
        small: 'https://res.cloudinary.com/test/image/upload/w_300,h_300,c_limit/reference.png',
        medium: 'https://res.cloudinary.com/test/image/upload/w_600,h_600,c_limit/reference.png',
        large: 'https://res.cloudinary.com/test/image/upload/w_1200,h_1200,c_limit/reference.png',
        original: 'https://res.cloudinary.com/test/image/upload/reference.png',
      });

      await UploadController.uploadReferenceImage(req, res);

      expect(UploadService.uploadReferenceImage).toHaveBeenCalledWith(
        req.file,
        'user123',
        'booking123'
      );

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Reference image uploaded successfully',
        data: {
          id: 'reference_booking123_123456789',
          url: 'https://res.cloudinary.com/test/image/upload/reference.png',
          secureUrl: 'https://res.cloudinary.com/test/image/upload/reference.png',
          width: 800,
          height: 600,
          size: 1024,
          format: 'png',
          type: 'reference',
          sizes: expect.any(Object),
        },
      });
    });

    it('should return error when no file is provided', async () => {
      req.file = null;

      await UploadController.uploadReferenceImage(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'No image file provided',
        },
      });
    });

    it('should handle upload service error', async () => {
      req.file = {
        originalname: 'reference.png',
        filename: 'unique-reference.png',
        mimetype: 'image/png',
        size: 1024,
        path: '/tmp/reference.png',
      };

      const uploadError = new Error('Upload failed');
      uploadError.code = 'CLOUDINARY_UPLOAD_FAILED';
      uploadError.status = 500;

      UploadService.uploadReferenceImage.mockRejectedValue(uploadError);

      await UploadController.uploadReferenceImage(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'CLOUDINARY_UPLOAD_FAILED',
          message: 'Upload failed',
        },
      });
    });
  });

  describe('uploadMultipleReferenceImages', () => {
    it('should upload multiple reference images successfully', async () => {
      req.files = [
        {
          originalname: 'ref1.png',
          filename: 'unique-ref1.png',
          mimetype: 'image/png',
          size: 1024,
          path: '/tmp/ref1.png',
        },
        {
          originalname: 'ref2.png',
          filename: 'unique-ref2.png',
          mimetype: 'image/png',
          size: 2048,
          path: '/tmp/ref2.png',
        },
      ];
      req.body.bookingId = 'booking123';

      const mockUploadResults = [
        {
          publicId: 'reference_booking123_0_123456789',
          url: 'https://res.cloudinary.com/test/image/upload/ref1.png',
          secureUrl: 'https://res.cloudinary.com/test/image/upload/ref1.png',
          width: 800,
          height: 600,
          format: 'png',
          size: 1024,
          type: 'reference',
        },
        {
          publicId: 'reference_booking123_1_123456789',
          url: 'https://res.cloudinary.com/test/image/upload/ref2.png',
          secureUrl: 'https://res.cloudinary.com/test/image/upload/ref2.png',
          width: 800,
          height: 600,
          format: 'png',
          size: 2048,
          type: 'reference',
        },
      ];

      UploadService.uploadReferenceImage
        .mockResolvedValueOnce(mockUploadResults[0])
        .mockResolvedValueOnce(mockUploadResults[1]);

      UploadService.getImageSizes.mockReturnValue({
        thumbnail: 'https://res.cloudinary.com/test/image/upload/w_150,h_150,c_fill/ref.png',
        small: 'https://res.cloudinary.com/test/image/upload/w_300,h_300,c_limit/ref.png',
        medium: 'https://res.cloudinary.com/test/image/upload/w_600,h_600,c_limit/ref.png',
        large: 'https://res.cloudinary.com/test/image/upload/w_1200,h_1200,c_limit/ref.png',
        original: 'https://res.cloudinary.com/test/image/upload/ref.png',
      });

      await UploadController.uploadMultipleReferenceImages(req, res);

      expect(UploadService.uploadReferenceImage).toHaveBeenCalledTimes(2);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: '2 reference images uploaded successfully',
        data: {
          images: expect.arrayContaining([
            expect.objectContaining({
              id: 'reference_booking123_0_123456789',
              type: 'reference',
            }),
            expect.objectContaining({
              id: 'reference_booking123_1_123456789',
              type: 'reference',
            }),
          ]),
          count: 2,
        },
      });
    });

    it('should return error when no files are provided', async () => {
      req.files = [];

      await UploadController.uploadMultipleReferenceImages(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'No image files provided',
        },
      });
    });

    it('should handle partial upload failures', async () => {
      req.files = [
        {
          originalname: 'ref1.png',
          filename: 'unique-ref1.png',
          mimetype: 'image/png',
          size: 1024,
          path: '/tmp/ref1.png',
        },
        {
          originalname: 'ref2.png',
          filename: 'unique-ref2.png',
          mimetype: 'image/png',
          size: 2048,
          path: '/tmp/ref2.png',
        },
      ];

      const uploadError = new Error('Upload failed');
      uploadError.code = 'CLOUDINARY_UPLOAD_FAILED';
      uploadError.status = 500;

      UploadService.uploadReferenceImage
        .mockResolvedValueOnce({
          publicId: 'reference_123456789',
          url: 'https://res.cloudinary.com/test/image/upload/ref1.png',
          secureUrl: 'https://res.cloudinary.com/test/image/upload/ref1.png',
          width: 800,
          height: 600,
          format: 'png',
          size: 1024,
          type: 'reference',
        })
        .mockRejectedValueOnce(uploadError);

      await UploadController.uploadMultipleReferenceImages(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'CLOUDINARY_UPLOAD_FAILED',
          message: 'Upload failed',
        },
      });
    });
  });

  describe('uploadGalleryImage', () => {
    beforeEach(() => {
      req.admin = {
        logActivity: jest.fn().mockResolvedValue(),
      };
      req.ip = '127.0.0.1';
    });

    it('should upload gallery image successfully', async () => {
      req.file = {
        originalname: 'gallery.png',
        filename: 'unique-gallery.png',
        mimetype: 'image/png',
        size: 1024,
        path: '/tmp/gallery.png',
      };
      req.body = {
        name: 'Beautiful Wedding Setup',
        description: 'A stunning wedding decoration',
        tags: 'wedding,elegant,flowers',
        category: 'wedding',
      };

      const mockUploadResult = {
        publicId: 'gallery_123456789_beautiful_wedding_setup',
        url: 'https://res.cloudinary.com/test/image/upload/gallery.png',
        secureUrl: 'https://res.cloudinary.com/test/image/upload/gallery.png',
        width: 800,
        height: 600,
        format: 'png',
        size: 1024,
        type: 'gallery',
        metadata: {
          name: 'Beautiful Wedding Setup',
          description: 'A stunning wedding decoration',
          tags: ['wedding', 'elegant', 'flowers'],
          category: 'wedding',
        },
      };

      UploadService.uploadGalleryImage.mockResolvedValue(mockUploadResult);
      UploadService.getImageSizes.mockReturnValue({
        thumbnail: 'https://res.cloudinary.com/test/image/upload/w_150,h_150,c_fill/gallery.png',
        small: 'https://res.cloudinary.com/test/image/upload/w_300,h_300,c_limit/gallery.png',
        medium: 'https://res.cloudinary.com/test/image/upload/w_600,h_600,c_limit/gallery.png',
        large: 'https://res.cloudinary.com/test/image/upload/w_1200,h_1200,c_limit/gallery.png',
        original: 'https://res.cloudinary.com/test/image/upload/gallery.png',
      });

      await UploadController.uploadGalleryImage(req, res);

      expect(UploadService.uploadGalleryImage).toHaveBeenCalledWith(
        req.file,
        'user123',
        {
          name: 'Beautiful Wedding Setup',
          description: 'A stunning wedding decoration',
          tags: ['wedding', 'elegant', 'flowers'],
          category: 'wedding',
        }
      );

      expect(req.admin.logActivity).toHaveBeenCalledWith(
        'UPLOAD_GALLERY_IMAGE',
        'gallery',
        null,
        {
          publicId: 'gallery_123456789_beautiful_wedding_setup',
          name: 'Beautiful Wedding Setup',
        },
        '127.0.0.1'
      );

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Gallery image uploaded successfully',
        data: expect.objectContaining({
          id: 'gallery_123456789_beautiful_wedding_setup',
          type: 'gallery',
          metadata: expect.objectContaining({
            name: 'Beautiful Wedding Setup',
            tags: ['wedding', 'elegant', 'flowers'],
          }),
        }),
      });
    });

    it('should return error when no file is provided', async () => {
      req.file = null;

      await UploadController.uploadGalleryImage(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'No image file provided',
        },
      });
    });

    it('should use default metadata when not provided', async () => {
      req.file = {
        originalname: 'gallery.png',
        filename: 'unique-gallery.png',
        mimetype: 'image/png',
        size: 1024,
        path: '/tmp/gallery.png',
      };
      req.body = {}; // No metadata provided

      const mockUploadResult = {
        publicId: 'gallery_123456789_gallery',
        url: 'https://res.cloudinary.com/test/image/upload/gallery.png',
        secureUrl: 'https://res.cloudinary.com/test/image/upload/gallery.png',
        width: 800,
        height: 600,
        format: 'png',
        size: 1024,
        type: 'gallery',
        metadata: {
          name: 'gallery.png',
          description: '',
          tags: [],
          category: 'general',
        },
      };

      UploadService.uploadGalleryImage.mockResolvedValue(mockUploadResult);
      UploadService.getImageSizes.mockReturnValue({});

      await UploadController.uploadGalleryImage(req, res);

      expect(UploadService.uploadGalleryImage).toHaveBeenCalledWith(
        req.file,
        'user123',
        {
          name: 'gallery.png',
          description: '',
          tags: [],
          category: 'general',
        }
      );
    });
  });

  describe('getGalleryImages', () => {
    it('should return gallery images successfully', async () => {
      req.query = {
        category: 'wedding',
        tags: 'elegant,flowers',
        page: '1',
        limit: '10',
      };

      UploadService.getImageSizes.mockReturnValue({
        thumbnail: 'https://res.cloudinary.com/test/image/upload/w_150,h_150,c_fill/sample.png',
        small: 'https://res.cloudinary.com/test/image/upload/w_300,h_300,c_limit/sample.png',
        medium: 'https://res.cloudinary.com/test/image/upload/w_600,h_600,c_limit/sample.png',
        large: 'https://res.cloudinary.com/test/image/upload/w_1200,h_1200,c_limit/sample.png',
        original: 'https://res.cloudinary.com/test/image/upload/sample.png',
      });

      await UploadController.getGalleryImages(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          images: expect.any(Array),
          pagination: expect.objectContaining({
            currentPage: 1,
            totalPages: expect.any(Number),
            totalItems: expect.any(Number),
            itemsPerPage: 10,
          }),
          filters: {
            category: 'wedding',
            tags: ['elegant', 'flowers'],
          },
        },
      });
    });

    it('should handle query parameters correctly', async () => {
      req.query = {}; // No filters

      await UploadController.getGalleryImages(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          images: expect.any(Array),
          pagination: expect.objectContaining({
            currentPage: 1,
            itemsPerPage: 20, // Default limit
          }),
          filters: {
            category: null,
            tags: null,
          },
        },
      });
    });
  });

  describe('deleteImage', () => {
    beforeEach(() => {
      req.admin = {
        logActivity: jest.fn().mockResolvedValue(),
      };
      req.ip = '127.0.0.1';
    });

    it('should delete image successfully', async () => {
      req.params.publicId = 'test_image_123';
      req.query.resourceType = 'image';

      const mockDeleteResult = {
        success: true,
        publicId: 'test_image_123',
        result: 'ok',
      };

      UploadService.deleteFromCloudinary.mockResolvedValue(mockDeleteResult);

      await UploadController.deleteImage(req, res);

      expect(UploadService.deleteFromCloudinary).toHaveBeenCalledWith('test_image_123', 'image');
      expect(req.admin.logActivity).toHaveBeenCalledWith(
        'DELETE_IMAGE',
        'image',
        null,
        {
          publicId: 'test_image_123',
          resourceType: 'image',
          success: true,
        },
        '127.0.0.1'
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Image deleted successfully',
        data: {
          publicId: 'test_image_123',
          deleted: true,
          result: 'ok',
        },
      });
    });

    it('should return error when publicId is missing', async () => {
      req.params.publicId = '';

      await UploadController.deleteImage(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Public ID is required',
        },
      });
    });

    it('should handle deletion failure', async () => {
      req.params.publicId = 'test_image_123';

      const deleteError = new Error('Deletion failed');
      deleteError.code = 'CLOUDINARY_DELETE_FAILED';
      deleteError.status = 500;

      UploadService.deleteFromCloudinary.mockRejectedValue(deleteError);

      await UploadController.deleteImage(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'CLOUDINARY_DELETE_FAILED',
          message: 'Deletion failed',
        },
      });
    });
  });

  describe('deleteMultipleImages', () => {
    beforeEach(() => {
      req.admin = {
        logActivity: jest.fn().mockResolvedValue(),
      };
      req.ip = '127.0.0.1';
    });

    it('should delete multiple images successfully', async () => {
      req.body.publicIds = ['image1', 'image2', 'image3'];
      req.query.resourceType = 'image';

      const mockDeleteResult = {
        deleted: { image1: 'deleted', image2: 'deleted' },
        notFound: { image3: 'not found' },
        deletedCount: 2,
        notFoundCount: 1,
      };

      UploadService.deleteMultipleFromCloudinary.mockResolvedValue(mockDeleteResult);

      await UploadController.deleteMultipleImages(req, res);

      expect(UploadService.deleteMultipleFromCloudinary).toHaveBeenCalledWith(['image1', 'image2', 'image3'], 'image');
      expect(req.admin.logActivity).toHaveBeenCalledWith(
        'DELETE_MULTIPLE_IMAGES',
        'image',
        null,
        {
          publicIds: ['image1', 'image2', 'image3'],
          resourceType: 'image',
          deletedCount: 2,
          notFoundCount: 1,
        },
        '127.0.0.1'
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: '2 images deleted successfully',
        data: {
          deleted: { image1: 'deleted', image2: 'deleted' },
          notFound: { image3: 'not found' },
          deletedCount: 2,
          notFoundCount: 1,
          totalRequested: 3,
        },
      });
    });

    it('should return error when publicIds is missing', async () => {
      req.body.publicIds = [];

      await UploadController.deleteMultipleImages(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Public IDs array is required',
        },
      });
    });
  });

  describe('getOptimizedImageUrl', () => {
    it('should return optimized image URL successfully', async () => {
      req.params.publicId = 'test_image_123';
      req.query = {
        width: '800',
        height: '600',
        crop: 'fill',
      };

      const optimizedUrl = 'https://res.cloudinary.com/test/image/upload/w_800,h_600,c_fill/test_image_123.png';
      UploadService.getOptimizedImageUrl.mockReturnValue(optimizedUrl);

      await UploadController.getOptimizedImageUrl(req, res);

      expect(UploadService.getOptimizedImageUrl).toHaveBeenCalledWith('test_image_123', {
        width: '800',
        height: '600',
        crop: 'fill',
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          publicId: 'test_image_123',
          url: optimizedUrl,
          transformations: {
            width: '800',
            height: '600',
            crop: 'fill',
          },
        },
      });
    });

    it('should return error when publicId is missing', async () => {
      req.params.publicId = '';

      await UploadController.getOptimizedImageUrl(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Public ID is required',
        },
      });
    });

    it('should return error when image is not found', async () => {
      req.params.publicId = 'non_existent_image';
      req.query = {};

      UploadService.getOptimizedImageUrl.mockReturnValue(null);

      await UploadController.getOptimizedImageUrl(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: ERROR_CODES.NOT_FOUND_ERROR,
          message: 'Image not found',
        },
      });
    });
  });

  describe('getImageMetadata', () => {
    it('should return image metadata successfully', async () => {
      req.params.publicId = 'test_image_123';

      const mockMetadata = {
        publicId: 'test_image_123',
        format: 'png',
        width: 800,
        height: 600,
        size: 1024,
        url: 'https://res.cloudinary.com/test/image/upload/test_image_123.png',
        createdAt: '2024-01-01T00:00:00Z',
        tags: ['test', 'image'],
      };

      const mockSizes = {
        thumbnail: 'https://res.cloudinary.com/test/image/upload/w_150,h_150,c_fill/test_image_123.png',
        small: 'https://res.cloudinary.com/test/image/upload/w_300,h_300,c_limit/test_image_123.png',
        medium: 'https://res.cloudinary.com/test/image/upload/w_600,h_600,c_limit/test_image_123.png',
        large: 'https://res.cloudinary.com/test/image/upload/w_1200,h_1200,c_limit/test_image_123.png',
        original: 'https://res.cloudinary.com/test/image/upload/test_image_123.png',
      };

      UploadService.getFileMetadata.mockResolvedValue(mockMetadata);
      UploadService.getImageSizes.mockReturnValue(mockSizes);

      await UploadController.getImageMetadata(req, res);

      expect(UploadService.getFileMetadata).toHaveBeenCalledWith('test_image_123');
      expect(UploadService.getImageSizes).toHaveBeenCalledWith('test_image_123');

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          ...mockMetadata,
          sizes: mockSizes,
        },
      });
    });

    it('should return error when publicId is missing', async () => {
      req.params.publicId = '';

      await UploadController.getImageMetadata(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Public ID is required',
        },
      });
    });

    it('should handle metadata fetch failure', async () => {
      req.params.publicId = 'non_existent_image';

      const metadataError = new Error('Resource not found');
      metadataError.code = 'METADATA_FETCH_FAILED';
      metadataError.status = 404;

      UploadService.getFileMetadata.mockRejectedValue(metadataError);

      await UploadController.getImageMetadata(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'METADATA_FETCH_FAILED',
          message: 'Resource not found',
        },
      });
    });
  });
});