const UploadService = require('../../../src/services/uploadService');
const { cloudinary } = require('../../../src/config/cloudinary');
const { FILE_UPLOAD } = require('../../../src/config/constants');

// Mock Cloudinary
jest.mock('../../../src/config/cloudinary', () => ({
  cloudinary: {
    uploader: {
      upload: jest.fn(),
      upload_stream: jest.fn(),
      destroy: jest.fn(),
    },
    api: {
      delete_resources: jest.fn(),
      resource: jest.fn(),
    },
    url: jest.fn(),
    utils: {
      api_sign_request: jest.fn(),
    },
    config: jest.fn(() => ({
      cloud_name: 'test-cloud',
    })),
  },
}));

describe('UploadService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadToCloudinary', () => {
    it('should upload file with buffer successfully', async () => {
      const mockFile = {
        originalname: 'test.png',
        buffer: Buffer.from('test image data'),
        mimetype: 'image/png',
        size: 1024,
      };

      const mockUploadResult = {
        public_id: 'test_image_123',
        secure_url: 'https://res.cloudinary.com/test/image/upload/test_image_123.png',
        width: 800,
        height: 600,
        format: 'png',
        bytes: 1024,
        created_at: '2024-01-01T00:00:00Z',
      };

      // Mock upload_stream
      const mockStream = {
        end: jest.fn((buffer) => {
          // Simulate successful upload
          const callback = cloudinary.uploader.upload_stream.mock.calls[0][1];
          callback(null, mockUploadResult);
        }),
      };
      cloudinary.uploader.upload_stream.mockReturnValue(mockStream);

      const result = await UploadService.uploadToCloudinary(mockFile);

      expect(cloudinary.uploader.upload_stream).toHaveBeenCalledWith(
        expect.objectContaining({
          folder: FILE_UPLOAD.UPLOAD_PATHS.REFERENCES,
          resource_type: 'image',
          transformation: {
            quality: 'auto',
            fetch_format: 'auto',
          },
        }),
        expect.any(Function)
      );

      expect(result).toEqual({
        publicId: 'test_image_123',
        url: 'https://res.cloudinary.com/test/image/upload/test_image_123.png',
        secureUrl: 'https://res.cloudinary.com/test/image/upload/test_image_123.png',
        width: 800,
        height: 600,
        format: 'png',
        size: 1024,
        createdAt: '2024-01-01T00:00:00Z',
      });
    });

    it('should upload file with path successfully', async () => {
      const mockFile = {
        originalname: 'test.png',
        path: '/tmp/test.png',
        mimetype: 'image/png',
        size: 1024,
      };

      const mockUploadResult = {
        public_id: 'test_image_123',
        secure_url: 'https://res.cloudinary.com/test/image/upload/test_image_123.png',
        width: 800,
        height: 600,
        format: 'png',
        bytes: 1024,
        created_at: '2024-01-01T00:00:00Z',
      };

      cloudinary.uploader.upload.mockResolvedValue(mockUploadResult);

      const result = await UploadService.uploadToCloudinary(mockFile);

      expect(cloudinary.uploader.upload).toHaveBeenCalledWith(
        '/tmp/test.png',
        expect.objectContaining({
          folder: FILE_UPLOAD.UPLOAD_PATHS.REFERENCES,
          resource_type: 'image',
        })
      );

      expect(result).toEqual({
        publicId: 'test_image_123',
        url: 'https://res.cloudinary.com/test/image/upload/test_image_123.png',
        secureUrl: 'https://res.cloudinary.com/test/image/upload/test_image_123.png',
        width: 800,
        height: 600,
        format: 'png',
        size: 1024,
        createdAt: '2024-01-01T00:00:00Z',
      });
    });

    it('should handle upload failure', async () => {
      const mockFile = {
        originalname: 'test.png',
        buffer: Buffer.from('test image data'),
        mimetype: 'image/png',
        size: 1024,
      };

      const mockStream = {
        end: jest.fn((buffer) => {
          const callback = cloudinary.uploader.upload_stream.mock.calls[0][1];
          callback(new Error('Upload failed'), null);
        }),
      };
      cloudinary.uploader.upload_stream.mockReturnValue(mockStream);

      await expect(UploadService.uploadToCloudinary(mockFile)).rejects.toThrow('Failed to upload file to cloud storage');
    });

    it('should throw error for file without buffer or path', async () => {
      const mockFile = {
        originalname: 'test.png',
        mimetype: 'image/png',
        size: 1024,
      };

      await expect(UploadService.uploadToCloudinary(mockFile)).rejects.toThrow('File must have either buffer or path');
    });
  });

  describe('uploadMultipleToCloudinary', () => {
    it('should upload multiple files successfully', async () => {
      const mockFiles = [
        {
          originalname: 'test1.png',
          buffer: Buffer.from('test image 1'),
          mimetype: 'image/png',
          size: 1024,
        },
        {
          originalname: 'test2.png',
          buffer: Buffer.from('test image 2'),
          mimetype: 'image/png',
          size: 2048,
        },
      ];

      const mockUploadResults = [
        {
          public_id: 'test_image_1',
          secure_url: 'https://res.cloudinary.com/test/image/upload/test_image_1.png',
          width: 800,
          height: 600,
          format: 'png',
          bytes: 1024,
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          public_id: 'test_image_2',
          secure_url: 'https://res.cloudinary.com/test/image/upload/test_image_2.png',
          width: 800,
          height: 600,
          format: 'png',
          bytes: 2048,
          created_at: '2024-01-01T00:00:00Z',
        },
      ];

      // Mock upload_stream for both files
      let callIndex = 0;
      const mockStream = {
        end: jest.fn((buffer) => {
          const callback = cloudinary.uploader.upload_stream.mock.calls[callIndex][1];
          callback(null, mockUploadResults[callIndex]);
          callIndex++;
        }),
      };
      cloudinary.uploader.upload_stream.mockReturnValue(mockStream);

      const results = await UploadService.uploadMultipleToCloudinary(mockFiles);

      expect(results).toHaveLength(2);
      expect(results[0].publicId).toBe('test_image_1');
      expect(results[1].publicId).toBe('test_image_2');
    });

    it('should handle partial upload failures', async () => {
      const mockFiles = [
        {
          originalname: 'test1.png',
          buffer: Buffer.from('test image 1'),
          mimetype: 'image/png',
          size: 1024,
        },
        {
          originalname: 'test2.png',
          buffer: Buffer.from('test image 2'),
          mimetype: 'image/png',
          size: 2048,
        },
      ];

      let callIndex = 0;
      const mockStream = {
        end: jest.fn((buffer) => {
          const callback = cloudinary.uploader.upload_stream.mock.calls[callIndex][1];
          if (callIndex === 0) {
            callback(null, {
              public_id: 'test_image_1',
              secure_url: 'https://res.cloudinary.com/test/image/upload/test_image_1.png',
              width: 800,
              height: 600,
              format: 'png',
              bytes: 1024,
              created_at: '2024-01-01T00:00:00Z',
            });
          } else {
            callback(new Error('Upload failed'), null);
          }
          callIndex++;
        }),
      };
      cloudinary.uploader.upload_stream.mockReturnValue(mockStream);

      await expect(UploadService.uploadMultipleToCloudinary(mockFiles)).rejects.toThrow('Failed to upload multiple files');
    });
  });

  describe('deleteFromCloudinary', () => {
    it('should delete file successfully', async () => {
      const publicId = 'test_image_123';
      const mockDeleteResult = {
        result: 'ok',
      };

      cloudinary.uploader.destroy.mockResolvedValue(mockDeleteResult);

      const result = await UploadService.deleteFromCloudinary(publicId);

      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(publicId, {
        resource_type: 'image',
      });

      expect(result).toEqual({
        success: true,
        publicId,
        result: 'ok',
      });
    });

    it('should handle deletion failure', async () => {
      const publicId = 'test_image_123';
      cloudinary.uploader.destroy.mockRejectedValue(new Error('Deletion failed'));

      await expect(UploadService.deleteFromCloudinary(publicId)).rejects.toThrow('Failed to delete file from cloud storage');
    });
  });

  describe('deleteMultipleFromCloudinary', () => {
    it('should delete multiple files successfully', async () => {
      const publicIds = ['test_image_1', 'test_image_2', 'test_image_3'];
      const mockDeleteResult = {
        deleted: {
          'test_image_1': 'deleted',
          'test_image_2': 'deleted',
        },
        not_found: {
          'test_image_3': 'not found',
        },
      };

      cloudinary.api.delete_resources.mockResolvedValue(mockDeleteResult);

      const result = await UploadService.deleteMultipleFromCloudinary(publicIds);

      expect(cloudinary.api.delete_resources).toHaveBeenCalledWith(publicIds, {
        resource_type: 'image',
      });

      expect(result).toEqual({
        deleted: mockDeleteResult.deleted,
        notFound: mockDeleteResult.not_found,
        deletedCount: 2,
        notFoundCount: 1,
      });
    });
  });

  describe('uploadReferenceImage', () => {
    it('should upload reference image successfully', async () => {
      const mockFile = {
        originalname: 'reference.png',
        buffer: Buffer.from('test image data'),
        mimetype: 'image/png',
        size: 1024,
      };
      const userId = 'user123';
      const bookingId = 'booking456';

      const mockUploadResult = {
        public_id: 'reference_booking456_123456789',
        secure_url: 'https://res.cloudinary.com/test/image/upload/reference.png',
        width: 800,
        height: 600,
        format: 'png',
        bytes: 1024,
        created_at: '2024-01-01T00:00:00Z',
      };

      const mockStream = {
        end: jest.fn((buffer) => {
          const callback = cloudinary.uploader.upload_stream.mock.calls[0][1];
          callback(null, mockUploadResult);
        }),
      };
      cloudinary.uploader.upload_stream.mockReturnValue(mockStream);

      const result = await UploadService.uploadReferenceImage(mockFile, userId, bookingId);

      expect(result).toEqual({
        publicId: 'reference_booking456_123456789',
        url: 'https://res.cloudinary.com/test/image/upload/reference.png',
        secureUrl: 'https://res.cloudinary.com/test/image/upload/reference.png',
        width: 800,
        height: 600,
        format: 'png',
        size: 1024,
        createdAt: '2024-01-01T00:00:00Z',
        type: 'reference',
        userId,
        bookingId,
      });
    });

    it('should validate file before upload', async () => {
      const mockFile = {
        originalname: 'test.txt',
        buffer: Buffer.from('not an image'),
        mimetype: 'text/plain',
        size: 1024,
      };
      const userId = 'user123';

      await expect(UploadService.uploadReferenceImage(mockFile, userId)).rejects.toThrow('File must be an image');
    });

    it('should reject files that are too large', async () => {
      const mockFile = {
        originalname: 'large.png',
        buffer: Buffer.alloc(FILE_UPLOAD.MAX_SIZE + 1000),
        mimetype: 'image/png',
        size: FILE_UPLOAD.MAX_SIZE + 1000,
      };
      const userId = 'user123';

      await expect(UploadService.uploadReferenceImage(mockFile, userId)).rejects.toThrow('File size exceeds maximum limit');
    });
  });

  describe('uploadGalleryImage', () => {
    it('should upload gallery image successfully', async () => {
      const mockFile = {
        originalname: 'gallery.png',
        buffer: Buffer.from('test image data'),
        mimetype: 'image/png',
        size: 1024,
      };
      const adminId = 'admin123';
      const metadata = {
        name: 'Beautiful Wedding Setup',
        description: 'A stunning wedding decoration',
        tags: ['wedding', 'elegant'],
        category: 'wedding',
      };

      const mockUploadResult = {
        public_id: 'gallery_123456789_beautiful_wedding_setup',
        secure_url: 'https://res.cloudinary.com/test/image/upload/gallery.png',
        width: 800,
        height: 600,
        format: 'png',
        bytes: 1024,
        created_at: '2024-01-01T00:00:00Z',
      };

      const mockStream = {
        end: jest.fn((buffer) => {
          const callback = cloudinary.uploader.upload_stream.mock.calls[0][1];
          callback(null, mockUploadResult);
        }),
      };
      cloudinary.uploader.upload_stream.mockReturnValue(mockStream);

      const result = await UploadService.uploadGalleryImage(mockFile, adminId, metadata);

      expect(result).toEqual({
        publicId: 'gallery_123456789_beautiful_wedding_setup',
        url: 'https://res.cloudinary.com/test/image/upload/gallery.png',
        secureUrl: 'https://res.cloudinary.com/test/image/upload/gallery.png',
        width: 800,
        height: 600,
        format: 'png',
        size: 1024,
        createdAt: '2024-01-01T00:00:00Z',
        type: 'gallery',
        adminId,
        metadata: {
          name: 'Beautiful Wedding Setup',
          description: 'A stunning wedding decoration',
          tags: ['wedding', 'elegant'],
          category: 'wedding',
        },
      });
    });
  });

  describe('getOptimizedImageUrl', () => {
    it('should generate optimized image URL', () => {
      const publicId = 'test_image_123';
      const transformations = {
        width: 800,
        height: 600,
        crop: 'fill',
      };

      cloudinary.url.mockReturnValue('https://res.cloudinary.com/test/image/upload/w_800,h_600,c_fill/test_image_123.png');

      const result = UploadService.getOptimizedImageUrl(publicId, transformations);

      expect(cloudinary.url).toHaveBeenCalledWith(publicId, {
        quality: 'auto',
        fetch_format: 'auto',
        width: 800,
        height: 600,
        crop: 'fill',
      });

      expect(result).toBe('https://res.cloudinary.com/test/image/upload/w_800,h_600,c_fill/test_image_123.png');
    });

    it('should handle URL generation failure', () => {
      const publicId = 'test_image_123';
      cloudinary.url.mockImplementation(() => {
        throw new Error('URL generation failed');
      });

      const result = UploadService.getOptimizedImageUrl(publicId);

      expect(result).toBeNull();
    });
  });

  describe('getImageSizes', () => {
    it('should generate multiple image sizes', () => {
      const publicId = 'test_image_123';
      
      cloudinary.url
        .mockReturnValueOnce('https://res.cloudinary.com/test/image/upload/w_150,h_150,c_fill/test_image_123.png')
        .mockReturnValueOnce('https://res.cloudinary.com/test/image/upload/w_300,h_300,c_limit/test_image_123.png')
        .mockReturnValueOnce('https://res.cloudinary.com/test/image/upload/w_600,h_600,c_limit/test_image_123.png')
        .mockReturnValueOnce('https://res.cloudinary.com/test/image/upload/w_1200,h_1200,c_limit/test_image_123.png')
        .mockReturnValueOnce('https://res.cloudinary.com/test/image/upload/test_image_123.png');

      const result = UploadService.getImageSizes(publicId);

      expect(result).toEqual({
        thumbnail: 'https://res.cloudinary.com/test/image/upload/w_150,h_150,c_fill/test_image_123.png',
        small: 'https://res.cloudinary.com/test/image/upload/w_300,h_300,c_limit/test_image_123.png',
        medium: 'https://res.cloudinary.com/test/image/upload/w_600,h_600,c_limit/test_image_123.png',
        large: 'https://res.cloudinary.com/test/image/upload/w_1200,h_1200,c_limit/test_image_123.png',
        original: 'https://res.cloudinary.com/test/image/upload/test_image_123.png',
      });
    });
  });

  describe('validateImageFile', () => {
    it('should validate valid image file', () => {
      const validFile = {
        originalname: 'test.png',
        mimetype: 'image/png',
        size: 1024,
      };

      expect(() => {
        UploadService.validateImageFile(validFile);
      }).not.toThrow();
    });

    it('should reject null file', () => {
      expect(() => {
        UploadService.validateImageFile(null);
      }).toThrow('No file provided');
    });

    it('should reject non-image file', () => {
      const textFile = {
        originalname: 'test.txt',
        mimetype: 'text/plain',
        size: 1024,
      };

      expect(() => {
        UploadService.validateImageFile(textFile);
      }).toThrow('File must be an image');
    });

    it('should reject file that is too large', () => {
      const largeFile = {
        originalname: 'large.png',
        mimetype: 'image/png',
        size: FILE_UPLOAD.MAX_SIZE + 1000,
      };

      expect(() => {
        UploadService.validateImageFile(largeFile);
      }).toThrow('File size exceeds maximum limit');
    });

    it('should reject invalid file type', () => {
      const invalidFile = {
        originalname: 'test.gif',
        mimetype: 'image/gif',
        size: 1024,
      };

      expect(() => {
        UploadService.validateImageFile(invalidFile);
      }).toThrow('Invalid file type');
    });
  });

  describe('getFileMetadata', () => {
    it('should get file metadata successfully', async () => {
      const publicId = 'test_image_123';
      const mockResource = {
        public_id: publicId,
        format: 'png',
        width: 800,
        height: 600,
        bytes: 1024,
        secure_url: 'https://res.cloudinary.com/test/image/upload/test_image_123.png',
        created_at: '2024-01-01T00:00:00Z',
        tags: ['test', 'image'],
      };

      cloudinary.api.resource.mockResolvedValue(mockResource);

      const result = await UploadService.getFileMetadata(publicId);

      expect(cloudinary.api.resource).toHaveBeenCalledWith(publicId);
      expect(result).toEqual({
        publicId,
        format: 'png',
        width: 800,
        height: 600,
        size: 1024,
        url: 'https://res.cloudinary.com/test/image/upload/test_image_123.png',
        createdAt: '2024-01-01T00:00:00Z',
        tags: ['test', 'image'],
      });
    });

    it('should handle metadata fetch failure', async () => {
      const publicId = 'test_image_123';
      cloudinary.api.resource.mockRejectedValue(new Error('Resource not found'));

      await expect(UploadService.getFileMetadata(publicId)).rejects.toThrow('Failed to get file metadata');
    });
  });
});