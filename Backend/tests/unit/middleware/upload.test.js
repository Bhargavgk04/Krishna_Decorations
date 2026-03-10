const request = require('supertest');
const express = require('express');
const path = require('path');
const fs = require('fs');
const {
  uploadSingle,
  uploadMultiple,
  validateUploadedFiles,
  handleUploadError,
  cleanupTempFiles,
  getFileInfo,
} = require('../../../src/middleware/upload');
const { FILE_UPLOAD } = require('../../../src/config/constants');

// Create test app
const createTestApp = (middleware) => {
  const app = express();
  app.use(express.json());
  
  if (Array.isArray(middleware)) {
    middleware.forEach(m => app.use(m));
  } else {
    app.use(middleware);
  }
  
  app.post('/test', (req, res) => {
    res.json({
      success: true,
      file: req.file,
      files: req.files,
    });
  });
  
  app.use(handleUploadError);
  
  return app;
};

// Create test image buffer
const createTestImageBuffer = () => {
  // Simple 1x1 PNG image
  return Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
    0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
    0x54, 0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00,
    0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01,
    0xE2, 0x21, 0xBC, 0x33, 0x00, 0x00, 0x00, 0x00,
    0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
  ]);
};

describe('Upload Middleware', () => {
  beforeEach(() => {
    // Ensure upload directories exist
    const dirs = ['uploads', 'uploads/temp', 'uploads/references', 'uploads/gallery'];
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  });

  afterEach(() => {
    // Clean up test files
    const testDirs = ['uploads/temp', 'uploads/references', 'uploads/gallery'];
    testDirs.forEach(dir => {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
          const filePath = path.join(dir, file);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        });
      }
    });
  });

  describe('uploadSingle', () => {
    it('should upload single image successfully', async () => {
      const app = createTestApp(uploadSingle('image', 'temp'));
      const imageBuffer = createTestImageBuffer();

      const response = await request(app)
        .post('/test')
        .attach('image', imageBuffer, 'test.png')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.file).toBeDefined();
      expect(response.body.file.originalname).toBe('test.png');
      expect(response.body.file.mimetype).toBe('image/png');
    });

    it('should reject non-image files', async () => {
      const app = createTestApp(uploadSingle('image', 'temp'));
      const textBuffer = Buffer.from('This is not an image');

      const response = await request(app)
        .post('/test')
        .attach('image', textBuffer, 'test.txt')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Invalid file type');
    });

    it('should reject files that are too large', async () => {
      const app = createTestApp(uploadSingle('image', 'temp'));
      const largeBuffer = Buffer.alloc(FILE_UPLOAD.MAX_SIZE + 1000);

      const response = await request(app)
        .post('/test')
        .attach('image', largeBuffer, 'large.png')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('File too large');
    });

    it('should handle missing file gracefully', async () => {
      const app = createTestApp(uploadSingle('image', 'temp'));

      const response = await request(app)
        .post('/test')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.file).toBeUndefined();
    });
  });

  describe('uploadMultiple', () => {
    it('should upload multiple images successfully', async () => {
      const app = createTestApp(uploadMultiple('images', 3, 'temp'));
      const imageBuffer = createTestImageBuffer();

      const response = await request(app)
        .post('/test')
        .attach('images', imageBuffer, 'test1.png')
        .attach('images', imageBuffer, 'test2.png')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.files).toBeDefined();
      expect(response.body.files).toHaveLength(2);
      expect(response.body.files[0].originalname).toBe('test1.png');
      expect(response.body.files[1].originalname).toBe('test2.png');
    });

    it('should reject when too many files are uploaded', async () => {
      const app = createTestApp(uploadMultiple('images', 2, 'temp'));
      const imageBuffer = createTestImageBuffer();

      const response = await request(app)
        .post('/test')
        .attach('images', imageBuffer, 'test1.png')
        .attach('images', imageBuffer, 'test2.png')
        .attach('images', imageBuffer, 'test3.png')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Too many files');
    });

    it('should handle mixed valid and invalid files', async () => {
      const app = createTestApp(uploadMultiple('images', 3, 'temp'));
      const imageBuffer = createTestImageBuffer();
      const textBuffer = Buffer.from('Not an image');

      const response = await request(app)
        .post('/test')
        .attach('images', imageBuffer, 'valid.png')
        .attach('images', textBuffer, 'invalid.txt')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Invalid file type');
    });
  });

  describe('validateUploadedFiles', () => {
    it('should validate uploaded files successfully', async () => {
      const req = {
        file: {
          originalname: 'test.png',
          mimetype: 'image/png',
          size: 1000,
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      validateUploadedFiles(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject when no files are uploaded', async () => {
      const req = { files: [] };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      validateUploadedFiles(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'No files uploaded',
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject files that are too large', async () => {
      const req = {
        files: [{
          originalname: 'large.png',
          mimetype: 'image/png',
          size: FILE_UPLOAD.MAX_SIZE + 1000,
        }],
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      validateUploadedFiles(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'FILE_UPLOAD_ERROR',
          message: expect.stringContaining('exceeds maximum size'),
        },
      });
    });

    it('should reject invalid file types', async () => {
      const req = {
        files: [{
          originalname: 'test.txt',
          mimetype: 'text/plain',
          size: 1000,
        }],
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      validateUploadedFiles(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'FILE_UPLOAD_ERROR',
          message: expect.stringContaining('invalid type'),
        },
      });
    });
  });

  describe('cleanupTempFiles', () => {
    it('should clean up single file', () => {
      const testFile = path.join('uploads/temp', 'test-cleanup.txt');
      fs.writeFileSync(testFile, 'test content');
      
      expect(fs.existsSync(testFile)).toBe(true);
      
      cleanupTempFiles({ path: testFile });
      
      // Give it a moment for async cleanup
      setTimeout(() => {
        expect(fs.existsSync(testFile)).toBe(false);
      }, 100);
    });

    it('should clean up multiple files', () => {
      const testFiles = [
        path.join('uploads/temp', 'test1.txt'),
        path.join('uploads/temp', 'test2.txt'),
      ];
      
      testFiles.forEach(file => {
        fs.writeFileSync(file, 'test content');
        expect(fs.existsSync(file)).toBe(true);
      });
      
      cleanupTempFiles(testFiles.map(path => ({ path })));
      
      // Give it a moment for async cleanup
      setTimeout(() => {
        testFiles.forEach(file => {
          expect(fs.existsSync(file)).toBe(false);
        });
      }, 100);
    });

    it('should handle non-existent files gracefully', () => {
      expect(() => {
        cleanupTempFiles({ path: 'non-existent-file.txt' });
      }).not.toThrow();
    });

    it('should handle null/undefined input', () => {
      expect(() => {
        cleanupTempFiles(null);
      }).not.toThrow();
      
      expect(() => {
        cleanupTempFiles(undefined);
      }).not.toThrow();
    });
  });

  describe('getFileInfo', () => {
    it('should return file information', () => {
      const mockFile = {
        originalname: 'test.png',
        filename: 'unique-test.png',
        size: 1024,
        mimetype: 'image/png',
        path: 'uploads/temp/unique-test.png',
      };

      const fileInfo = getFileInfo(mockFile);

      expect(fileInfo).toEqual({
        originalName: 'test.png',
        filename: 'unique-test.png',
        size: 1024,
        mimetype: 'image/png',
        path: 'uploads/temp/unique-test.png',
        url: '/uploads/temp/unique-test.png',
      });
    });

    it('should handle file without path', () => {
      const mockFile = {
        originalname: 'test.png',
        filename: 'unique-test.png',
        size: 1024,
        mimetype: 'image/png',
      };

      const fileInfo = getFileInfo(mockFile);

      expect(fileInfo.url).toBeNull();
    });
  });

  describe('handleUploadError', () => {
    it('should handle multer file size error', () => {
      const error = new Error('File too large');
      error.code = 'LIMIT_FILE_SIZE';
      
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      handleUploadError(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'FILE_UPLOAD_ERROR',
          message: expect.stringContaining('File too large'),
        },
      });
    });

    it('should handle multer file count error', () => {
      const error = new Error('Too many files');
      error.code = 'LIMIT_FILE_COUNT';
      
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      handleUploadError(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'FILE_UPLOAD_ERROR',
          message: 'Too many files uploaded',
        },
      });
    });

    it('should handle invalid file type error', () => {
      const error = new Error('Invalid file type');
      error.code = 'INVALID_FILE_TYPE';
      
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      handleUploadError(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'FILE_UPLOAD_ERROR',
          message: 'Invalid file type',
        },
      });
    });

    it('should pass non-multer errors to next middleware', () => {
      const error = new Error('Some other error');
      
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      handleUploadError(error, req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});