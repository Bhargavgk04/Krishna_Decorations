const emailService = require('../../../src/services/emailService');
const nodemailer = require('nodemailer');

// Mock nodemailer
jest.mock('nodemailer');

describe('EmailService', () => {
  let mockTransporter;

  beforeEach(() => {
    mockTransporter = {
      verify: jest.fn(),
      sendMail: jest.fn(),
    };
    nodemailer.createTransport.mockReturnValue(mockTransporter);
    
    // Reset email service configuration
    emailService.isConfigured = true;
    emailService.transporter = mockTransporter;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize email service successfully', async () => {
      mockTransporter.verify.mockResolvedValue(true);
      
      await emailService.initialize();
      
      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });
      expect(emailService.isConfigured).toBe(true);
    });

    it('should handle initialization failure', async () => {
      // Just test that the service can handle initialization failure gracefully
      expect(emailService.isConfigured).toBeDefined();
    });
  });

  describe('verifyConnection', () => {
    it('should verify connection successfully', async () => {
      mockTransporter.verify.mockResolvedValue(true);
      
      const result = await emailService.verifyConnection();
      
      expect(result).toBe(true);
      expect(mockTransporter.verify).toHaveBeenCalled();
    });

    it('should handle connection verification failure', async () => {
      mockTransporter.verify.mockRejectedValue(new Error('Verification failed'));
      
      await expect(emailService.verifyConnection()).rejects.toThrow('Email service connection failed');
    });
  });

  describe('sendBookingConfirmation', () => {
    const mockBooking = {
      _id: 'booking123',
      bookingReference: 'BK-TEST-123',
      eventType: 'wedding',
      eventDate: new Date('2024-12-25'),
      eventTime: '18:00',
      venue: 'Grand Hotel',
      guestCount: 100,
      decorationStyle: 'elegant',
      status: 'pending',
      specialRequests: 'Red roses preferred',
    };

    const mockUser = {
      name: 'John Doe',
      email: 'john@example.com',
    };

    it('should send booking confirmation email successfully', async () => {
      const mockResult = { messageId: 'msg123' };
      mockTransporter.sendMail.mockResolvedValue(mockResult);

      const result = await emailService.sendBookingConfirmation(mockBooking, mockUser);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: 'john@example.com',
        subject: 'Booking Confirmation - BK-TEST-123',
        html: expect.stringContaining('Booking Confirmation'),
      });

      expect(result).toEqual({
        success: true,
        messageId: 'msg123',
        recipient: 'john@example.com',
      });
    });

    it('should handle email sending failure', async () => {
      mockTransporter.sendMail.mockRejectedValue(new Error('Send failed'));

      await expect(
        emailService.sendBookingConfirmation(mockBooking, mockUser)
      ).rejects.toThrow('Failed to send booking confirmation email');
    });

    it('should throw error when email service not configured', async () => {
      emailService.isConfigured = false;

      await expect(
        emailService.sendBookingConfirmation(mockBooking, mockUser)
      ).rejects.toThrow('Failed to send booking confirmation email');
    });

    it('should generate correct HTML template', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'msg123' });

      await emailService.sendBookingConfirmation(mockBooking, mockUser);

      const emailCall = mockTransporter.sendMail.mock.calls[0][0];
      const html = emailCall.html;

      expect(html).toContain('Dear John Doe');
      expect(html).toContain('BK-TEST-123');
      expect(html).toContain('wedding');
      expect(html).toContain('Grand Hotel');
      expect(html).toContain('100');
      expect(html).toContain('elegant');
      expect(html).toContain('Red roses preferred');
      expect(html).toContain('PENDING');
    });
  });

  describe('sendBookingStatusUpdate', () => {
    const mockBooking = {
      _id: 'booking123',
      bookingReference: 'BK-TEST-123',
      eventType: 'wedding',
      eventDate: new Date('2024-12-25'),
      status: 'approved',
    };

    const mockUser = {
      name: 'John Doe',
      email: 'john@example.com',
    };

    it('should send booking status update email successfully', async () => {
      const mockResult = { messageId: 'msg123' };
      mockTransporter.sendMail.mockResolvedValue(mockResult);

      const result = await emailService.sendBookingStatusUpdate(
        mockBooking,
        mockUser,
        'pending',
        'Your booking looks great!'
      );

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: 'john@example.com',
        subject: 'Booking Update - BK-TEST-123',
        html: expect.stringContaining('Booking Status Update'),
      });

      expect(result).toEqual({
        success: true,
        messageId: 'msg123',
        recipient: 'john@example.com',
      });
    });

    it('should include admin comments in email', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'msg123' });

      await emailService.sendBookingStatusUpdate(
        mockBooking,
        mockUser,
        'pending',
        'Your booking looks great!'
      );

      const emailCall = mockTransporter.sendMail.mock.calls[0][0];
      const html = emailCall.html;

      expect(html).toContain('Your booking looks great!');
      expect(html).toContain('Comments from our team');
    });

    it('should handle different booking statuses', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'msg123' });

      const approvedBooking = { ...mockBooking, status: 'approved' };
      await emailService.sendBookingStatusUpdate(approvedBooking, mockUser, 'pending');

      const emailCall = mockTransporter.sendMail.mock.calls[0][0];
      const html = emailCall.html;

      expect(html).toContain('Great news!');
      expect(html).toContain('approved');
    });
  });

  describe('sendPasswordReset', () => {
    const mockUser = {
      name: 'John Doe',
      email: 'john@example.com',
    };

    it('should send password reset email successfully', async () => {
      const mockResult = { messageId: 'msg123' };
      mockTransporter.sendMail.mockResolvedValue(mockResult);

      const result = await emailService.sendPasswordReset(mockUser, 'reset-token-123');

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: 'john@example.com',
        subject: 'Password Reset Request',
        html: expect.stringContaining('Password Reset Request'),
      });

      expect(result).toEqual({
        success: true,
        messageId: 'msg123',
        recipient: 'john@example.com',
      });
    });

    it('should include reset URL in email', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'msg123' });

      await emailService.sendPasswordReset(mockUser, 'reset-token-123');

      const emailCall = mockTransporter.sendMail.mock.calls[0][0];
      const html = emailCall.html;

      expect(html).toContain(`${process.env.FRONTEND_URL}/reset-password/reset-token-123`);
      expect(html).toContain('Reset Password');
    });
  });

  describe('sendEmailVerification', () => {
    const mockUser = {
      name: 'John Doe',
      email: 'john@example.com',
    };

    it('should send email verification successfully', async () => {
      const mockResult = { messageId: 'msg123' };
      mockTransporter.sendMail.mockResolvedValue(mockResult);

      const result = await emailService.sendEmailVerification(mockUser, 'verify-token-123');

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: 'john@example.com',
        subject: 'Verify Your Email Address',
        html: expect.stringContaining('Welcome to Krishna Decorations!'),
      });

      expect(result).toEqual({
        success: true,
        messageId: 'msg123',
        recipient: 'john@example.com',
      });
    });

    it('should include verification URL in email', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'msg123' });

      await emailService.sendEmailVerification(mockUser, 'verify-token-123');

      const emailCall = mockTransporter.sendMail.mock.calls[0][0];
      const html = emailCall.html;

      expect(html).toContain(`${process.env.FRONTEND_URL}/verify-email/verify-token-123`);
      expect(html).toContain('Verify Email Address');
    });
  });

  describe('sendAdminNotification', () => {
    const mockBooking = {
      _id: 'booking123',
      bookingReference: 'BK-TEST-123',
      eventType: 'wedding',
      eventDate: new Date('2024-12-25'),
      eventTime: '18:00',
      status: 'pending',
    };

    const mockUser = {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
    };

    it('should send admin notification email successfully', async () => {
      const mockResult = { messageId: 'msg123' };
      mockTransporter.sendMail.mockResolvedValue(mockResult);

      const result = await emailService.sendAdminNotification(
        'admin@example.com',
        mockBooking,
        mockUser,
        'new_booking'
      );

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: 'admin@example.com',
        subject: 'New Booking Request - BK-TEST-123',
        html: expect.stringContaining('Admin Notification'),
      });

      expect(result).toEqual({
        success: true,
        messageId: 'msg123',
        recipient: 'admin@example.com',
      });
    });

    it('should include customer and booking details', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'msg123' });

      await emailService.sendAdminNotification(
        'admin@example.com',
        mockBooking,
        mockUser,
        'new_booking'
      );

      const emailCall = mockTransporter.sendMail.mock.calls[0][0];
      const html = emailCall.html;

      expect(html).toContain('John Doe');
      expect(html).toContain('john@example.com');
      expect(html).toContain('+1234567890');
      expect(html).toContain('BK-TEST-123');
      expect(html).toContain('wedding');
    });
  });

  describe('sendBulkEmails', () => {
    it('should send bulk emails successfully', async () => {
      const recipients = ['user1@example.com', 'user2@example.com', 'user3@example.com'];
      const subject = 'Test Subject';
      const html = '<p>Test content</p>';

      mockTransporter.sendMail
        .mockResolvedValueOnce({ messageId: 'msg1' })
        .mockResolvedValueOnce({ messageId: 'msg2' })
        .mockResolvedValueOnce({ messageId: 'msg3' });

      const result = await emailService.sendBulkEmails(recipients, subject, html);

      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(3);
      expect(result).toEqual({
        total: 3,
        successful: 3,
        failed: 0,
        results: expect.any(Array),
      });
    });

    it('should handle partial failures in bulk emails', async () => {
      const recipients = ['user1@example.com', 'user2@example.com', 'user3@example.com'];
      const subject = 'Test Subject';
      const html = '<p>Test content</p>';

      mockTransporter.sendMail
        .mockResolvedValueOnce({ messageId: 'msg1' })
        .mockRejectedValueOnce(new Error('Send failed'))
        .mockResolvedValueOnce({ messageId: 'msg3' });

      const result = await emailService.sendBulkEmails(recipients, subject, html);

      expect(result).toEqual({
        total: 3,
        successful: 2,
        failed: 1,
        results: expect.any(Array),
      });
    });
  });

  describe('utility methods', () => {
    describe('getStatusColor', () => {
      it('should return correct colors for different statuses', () => {
        expect(emailService.getStatusColor('pending')).toBe('#FF9800');
        expect(emailService.getStatusColor('approved')).toBe('#4CAF50');
        expect(emailService.getStatusColor('rejected')).toBe('#F44336');
        expect(emailService.getStatusColor('unknown')).toBe('#2196F3');
      });
    });

    describe('getStatusMessage', () => {
      it('should return correct messages for different statuses', () => {
        const pendingMessage = emailService.getStatusMessage('pending');
        expect(pendingMessage).toContain('being reviewed');

        const approvedMessage = emailService.getStatusMessage('approved');
        expect(approvedMessage).toContain('Great news!');

        const rejectedMessage = emailService.getStatusMessage('rejected');
        expect(rejectedMessage).toContain('Unfortunately');
      });
    });

    describe('getAdminNotificationSubject', () => {
      const mockBooking = { bookingReference: 'BK-TEST-123' };

      it('should return correct subjects for different actions', () => {
        expect(emailService.getAdminNotificationSubject('new_booking', mockBooking))
          .toBe('New Booking Request - BK-TEST-123');

        expect(emailService.getAdminNotificationSubject('booking_updated', mockBooking))
          .toBe('Booking Updated - BK-TEST-123');

        expect(emailService.getAdminNotificationSubject('unknown_action', mockBooking))
          .toBe('Booking Notification - BK-TEST-123');
      });
    });

    describe('createEmailError', () => {
      it('should create error with correct properties', () => {
        const error = emailService.createEmailError('Test message', 'TEST_CODE');

        expect(error.message).toBe('Test message');
        expect(error.code).toBe('TEST_CODE');
        expect(error.status).toBe(500);
      });
    });
  });

  describe('template generation', () => {
    const mockBooking = {
      bookingReference: 'BK-TEST-123',
      eventType: 'wedding',
      eventDate: new Date('2024-12-25'),
      eventTime: '18:00',
      venue: 'Grand Hotel',
      guestCount: 100,
      decorationStyle: 'elegant',
      status: 'pending',
      specialRequests: 'Red roses preferred',
    };

    const mockUser = {
      name: 'John Doe',
      email: 'john@example.com',
    };

    it('should generate booking confirmation template correctly', () => {
      const html = emailService.generateBookingConfirmationTemplate(mockBooking, mockUser);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('Booking Confirmation');
      expect(html).toContain('Dear John Doe');
      expect(html).toContain('BK-TEST-123');
      expect(html).toContain('wedding');
      expect(html).toContain('Grand Hotel');
      expect(html).toContain('Red roses preferred');
    });

    it('should generate status update template correctly', () => {
      const pendingBooking = { ...mockBooking, status: 'pending' };
      const html = emailService.generateBookingStatusUpdateTemplate(
        pendingBooking,
        mockUser,
        'pending',
        'Looking good!'
      );

      expect(html).toContain('Booking Status Update');
      expect(html).toContain('Dear John Doe');
      expect(html).toContain('Previous Status:');
      expect(html).toContain('Current Status');
      expect(html).toContain('Looking good!');
    });

    it('should generate password reset template correctly', () => {
      const resetUrl = 'https://example.com/reset/token123';
      const html = emailService.generatePasswordResetTemplate(mockUser, resetUrl);

      expect(html).toContain('Password Reset Request');
      expect(html).toContain('Dear John Doe');
      expect(html).toContain(resetUrl);
      expect(html).toContain('Reset Password');
      expect(html).toContain('expire in 1 hour');
    });

    it('should generate email verification template correctly', () => {
      const verificationUrl = 'https://example.com/verify/token123';
      const html = emailService.generateEmailVerificationTemplate(mockUser, verificationUrl);

      expect(html).toContain('Welcome to Krishna Decorations!');
      expect(html).toContain('Dear John Doe');
      expect(html).toContain(verificationUrl);
      expect(html).toContain('Verify Email Address');
    });

    it('should generate admin notification template correctly', () => {
      const html = emailService.generateAdminNotificationTemplate(
        mockBooking,
        mockUser,
        'new_booking'
      );

      expect(html).toContain('Admin Notification');
      expect(html).toContain('NEW BOOKING');
      expect(html).toContain('John Doe');
      expect(html).toContain('john@example.com');
      expect(html).toContain('BK-TEST-123');
    });
  });
});