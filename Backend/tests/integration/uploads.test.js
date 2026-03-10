const path = require('path');
const fs = require('fs');
const {
  setupTestEnvironment,
  teardownTestEnvironment,
  TEST_USER,
  request,
  createTestUser,
  getAuthenticatedRequest
} = require('../test-utils');

describe('File Uploads API', () => {
  let userToken;
  const testFilePath = path.join(__dirname, 'test-image.jpg');

  beforeAll(async () => {
    await setupTestEnvironment();
    
    // Create a test user and get auth token
    await createTestUser();
    const loginRes = await request
      .post('/api/auth/login')
      .send({ email: TEST_USER.email, password: TEST_USER.password });
    userToken = loginRes.body.token;

    // Create a test image file
    const testImage = Buffer.alloc(1024 * 10, 0); // 10KB test file
    fs.writeFileSync(testFilePath, testImage);
  });

  afterAll(async () => {
    // Clean up test file
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
    await teardownTestEnvironment();
  });

  describe('POST /api/upload', () => {
    it('should upload a file', async () => {
      const res = await getAuthenticatedRequest(userToken)
        .post('/api/upload')
        .attach('file', testFilePath);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('url');
      expect(res.body).toHaveProperty('publicId');
      expect(res.body).toHaveProperty('format');
      expect(res.body.format).toMatch(/^jpg|jpeg|png|gif$/i);
    });

    it('should not allow upload without authentication', async () => {
      const res = await request
        .post('/api/upload')
        .attach('file', testFilePath);

      expect(res.status).toBe(401);
    });

    it('should not allow upload of invalid file types', async () => {
      // Create a test file with invalid extension
      const invalidFilePath = path.join(__dirname, 'test-file.txt');
      fs.writeFileSync(invalidFilePath, 'This is a test file');

      const res = await getAuthenticatedRequest(userToken)
        .post('/api/upload')
        .attach('file', invalidFilePath);

      // Clean up
      fs.unlinkSync(invalidFilePath);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/upload/:publicId', () => {
    let uploadedFile;

    beforeEach(async () => {
      // Upload a file first
      const uploadRes = await getAuthenticatedRequest(userToken)
        .post('/api/upload')
        .attach('file', testFilePath);
      
      uploadedFile = uploadRes.body;
    });

    it('should delete an uploaded file', async () => {
      const res = await getAuthenticatedRequest(userToken)
        .delete(`/api/upload/${encodeURIComponent(uploadedFile.publicId)}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'File deleted successfully');
    });

    it('should return 404 for non-existent file', async () => {
      const nonExistentId = 'non-existent-id';
      const res = await getAuthenticatedRequest(userToken)
        .delete(`/api/upload/${encodeURIComponent(nonExistentId)}`);

      expect(res.status).toBe(404);
    });
  });
});
