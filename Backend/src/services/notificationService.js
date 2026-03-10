const Bull = require('bull');
const Redis = require('redis');
const emailService = require('./emailService');
const whatsappService = require('./whatsappService');
const logger = require('../utils/logger');
const { ERROR_CODES } = require('../config/constants');

class NotificationService {
  constructor() {
    this.emailQueue = null;
    this.whatsappQueue = null;
    this.redisClient = null;
    this.isConfigured = false;
    this.initialize();
  }

  /**
   * Initialize notification service with Redis and Bull queues
   */
  async initialize() {
    try {
      // Initialize Redis client
      this.redisClient = Redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
      });

      this.redisClient.on('error', (err) => {
        logger.error('Redis connection error:', err);
      });

      this.redisClient.on('connect', () => {
        logger.info('Redis connected successfully');
      });

      // Connect to Redis
      if (process.env.NODE_ENV !== 'test') {
        await this.redisClient.connect();
      }

      // Initialize Bull queues
      this.emailQueue = new Bull('email notifications', {
        redis: {
          host: process.env.REDIS_HOST || 'localhost',
          port: process.env.REDIS_PORT || 6379,
          password: process.env.REDIS_PASSWORD,
        },
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 50,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      });

      this.whatsappQueue = new Bull('whatsapp notifications', {
        redis: {
          host: process.env.REDIS_HOST || 'localhost',
          port: process.env.REDIS_PORT || 6379,
          password: process.env.REDIS_PASSWORD,
        },
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 50,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      });

      // Set up queue processors
      this.setupEmailProcessor();
      this.setupWhatsAppProcessor();
      this.setupEventHandlers();

      this.isConfigured = true;
      logger.info('Notification service initialized successfully');
    } catch (error) {
      logger.error('Notification service initialization failed:', error);
      this.isConfigured = false;
    }
  }

  /**
   * Set up email queue processor
   */
  setupEmailProcessor() {
    this.emailQueue.process('booking-confirmation', async (job) => {
      const { booking, user } = job.data;
      return await emailService.sendBookingConfirmation(booking, user);
    });

    this.emailQueue.process('booking-status-update', async (job) => {
      const { booking, user, oldStatus, adminComments } = job.data;
      return await emailService.sendBookingStatusUpdate(booking, user, oldStatus, adminComments);
    });

    this.emailQueue.process('password-reset', async (job) => {
      const { user, resetToken } = job.data;
      return await emailService.sendPasswordReset(user, resetToken);
    });

    this.emailQueue.process('email-verification', async (job) => {
      const { user, verificationToken } = job.data;
      return await emailService.sendEmailVerification(user, verificationToken);
    });

    this.emailQueue.process('admin-notification', async (job) => {
      const { adminEmail, booking, user, action } = job.data;
      return await emailService.sendAdminNotification(adminEmail, booking, user, action);
    });

    this.emailQueue.process('bulk-email', async (job) => {
      const { recipients, subject, html } = job.data;
      return await emailService.sendBulkEmails(recipients, subject, html);
    });
  }

  /**
   * Set up WhatsApp queue processor
   */
  setupWhatsAppProcessor() {
    this.whatsappQueue.process('booking-confirmation', async (job) => {
      const { booking, user } = job.data;
      return await whatsappService.sendBookingConfirmation(booking, user);
    });

    this.whatsappQueue.process('booking-status-update', async (job) => {
      const { booking, user, oldStatus, adminComments } = job.data;
      return await whatsappService.sendBookingStatusUpdate(booking, user, oldStatus, adminComments);
    });

    this.whatsappQueue.process('admin-notification', async (job) => {
      const { adminPhone, booking, user, action } = job.data;
      return await whatsappService.sendAdminNotification(adminPhone, booking, user, action);
    });

    this.whatsappQueue.process('message-with-fallback', async (job) => {
      const { phoneNumber, message, useWhatsApp } = job.data;
      return await whatsappService.sendMessageWithFallback(phoneNumber, message, useWhatsApp);
    });
  }

  /**
   * Set up queue event handlers
   */
  setupEventHandlers() {
    // Email queue events
    this.emailQueue.on('completed', (job, result) => {
      logger.info('Email job completed:', {
        jobId: job.id,
        type: job.name,
        result: result,
      });
    });

    this.emailQueue.on('failed', (job, err) => {
      logger.error('Email job failed:', {
        jobId: job.id,
        type: job.name,
        error: err.message,
        attempts: job.attemptsMade,
      });
    });

    this.emailQueue.on('stalled', (job) => {
      logger.warn('Email job stalled:', {
        jobId: job.id,
        type: job.name,
      });
    });

    // WhatsApp queue events
    this.whatsappQueue.on('completed', (job, result) => {
      logger.info('WhatsApp job completed:', {
        jobId: job.id,
        type: job.name,
        result: result,
      });
    });

    this.whatsappQueue.on('failed', (job, err) => {
      logger.error('WhatsApp job failed:', {
        jobId: job.id,
        type: job.name,
        error: err.message,
        attempts: job.attemptsMade,
      });
    });

    this.whatsappQueue.on('stalled', (job) => {
      logger.warn('WhatsApp job stalled:', {
        jobId: job.id,
        type: job.name,
      });
    });
  }

  /**
   * Queue booking confirmation notifications
   * @param {Object} booking - Booking details
   * @param {Object} user - User details
   * @param {Object} options - Notification options
   */
  async queueBookingConfirmation(booking, user, options = {}) {
    try {
      if (!this.isConfigured) {
        throw new Error('Notification service not configured');
      }

      const { sendEmail = true, sendWhatsApp = true, delay = 0, priority = 'normal' } = options;
      const jobs = [];

      // Queue email notification
      if (sendEmail) {
        const emailJob = await this.emailQueue.add(
          'booking-confirmation',
          { booking, user },
          {
            delay,
            priority: this.getPriority(priority),
          }
        );
        jobs.push({ type: 'email', jobId: emailJob.id });
      }

      // Queue WhatsApp notification
      if (sendWhatsApp && user.phone) {
        const whatsappJob = await this.whatsappQueue.add(
          'booking-confirmation',
          { booking, user },
          {
            delay,
            priority: this.getPriority(priority),
          }
        );
        jobs.push({ type: 'whatsapp', jobId: whatsappJob.id });
      }

      logger.info('Booking confirmation notifications queued:', {
        bookingId: booking._id,
        userEmail: user.email,
        userPhone: user.phone,
        jobs: jobs.length,
      });

      return {
        success: true,
        jobs,
        bookingId: booking._id,
      };
    } catch (error) {
      logger.error('Failed to queue booking confirmation:', {
        error: error.message,
        bookingId: booking._id,
        userEmail: user.email,
      });
      throw this.createNotificationError('Failed to queue booking confirmation', 'QUEUE_FAILED');
    }
  }

  /**
   * Queue booking status update notifications
   * @param {Object} booking - Booking details
   * @param {Object} user - User details
   * @param {string} oldStatus - Previous status
   * @param {string} adminComments - Admin comments
   * @param {Object} options - Notification options
   */
  async queueBookingStatusUpdate(booking, user, oldStatus, adminComments = '', options = {}) {
    try {
      if (!this.isConfigured) {
        throw new Error('Notification service not configured');
      }

      const { sendEmail = true, sendWhatsApp = true, delay = 0, priority = 'high' } = options;
      const jobs = [];

      // Queue email notification
      if (sendEmail) {
        const emailJob = await this.emailQueue.add(
          'booking-status-update',
          { booking, user, oldStatus, adminComments },
          {
            delay,
            priority: this.getPriority(priority),
          }
        );
        jobs.push({ type: 'email', jobId: emailJob.id });
      }

      // Queue WhatsApp notification
      if (sendWhatsApp && user.phone) {
        const whatsappJob = await this.whatsappQueue.add(
          'booking-status-update',
          { booking, user, oldStatus, adminComments },
          {
            delay,
            priority: this.getPriority(priority),
          }
        );
        jobs.push({ type: 'whatsapp', jobId: whatsappJob.id });
      }

      logger.info('Booking status update notifications queued:', {
        bookingId: booking._id,
        newStatus: booking.status,
        oldStatus,
        jobs: jobs.length,
      });

      return {
        success: true,
        jobs,
        bookingId: booking._id,
      };
    } catch (error) {
      logger.error('Failed to queue booking status update:', {
        error: error.message,
        bookingId: booking._id,
        userEmail: user.email,
      });
      throw this.createNotificationError('Failed to queue booking status update', 'QUEUE_FAILED');
    }
  }

  /**
   * Queue admin notifications
   * @param {Array} admins - Array of admin objects with email/phone
   * @param {Object} booking - Booking details
   * @param {Object} user - User details
   * @param {string} action - Action type
   * @param {Object} options - Notification options
   */
  async queueAdminNotifications(admins, booking, user, action, options = {}) {
    try {
      if (!this.isConfigured) {
        throw new Error('Notification service not configured');
      }

      const { sendEmail = true, sendWhatsApp = true, delay = 0, priority = 'high' } = options;
      const jobs = [];

      for (const admin of admins) {
        // Queue email notification
        if (sendEmail && admin.email) {
          const emailJob = await this.emailQueue.add(
            'admin-notification',
            { adminEmail: admin.email, booking, user, action },
            {
              delay,
              priority: this.getPriority(priority),
            }
          );
          jobs.push({ type: 'email', adminId: admin._id, jobId: emailJob.id });
        }

        // Queue WhatsApp notification
        if (sendWhatsApp && admin.phone) {
          const whatsappJob = await this.whatsappQueue.add(
            'admin-notification',
            { adminPhone: admin.phone, booking, user, action },
            {
              delay,
              priority: this.getPriority(priority),
            }
          );
          jobs.push({ type: 'whatsapp', adminId: admin._id, jobId: whatsappJob.id });
        }
      }

      logger.info('Admin notifications queued:', {
        bookingId: booking._id,
        action,
        adminCount: admins.length,
        jobs: jobs.length,
      });

      return {
        success: true,
        jobs,
        bookingId: booking._id,
        action,
      };
    } catch (error) {
      logger.error('Failed to queue admin notifications:', {
        error: error.message,
        bookingId: booking._id,
        action,
      });
      throw this.createNotificationError('Failed to queue admin notifications', 'QUEUE_FAILED');
    }
  }

  /**
   * Queue password reset notification
   * @param {Object} user - User details
   * @param {string} resetToken - Reset token
   * @param {Object} options - Notification options
   */
  async queuePasswordReset(user, resetToken, options = {}) {
    try {
      if (!this.isConfigured) {
        throw new Error('Notification service not configured');
      }

      const { delay = 0, priority = 'high' } = options;

      const emailJob = await this.emailQueue.add(
        'password-reset',
        { user, resetToken },
        {
          delay,
          priority: this.getPriority(priority),
        }
      );

      logger.info('Password reset notification queued:', {
        userEmail: user.email,
        jobId: emailJob.id,
      });

      return {
        success: true,
        jobId: emailJob.id,
        userEmail: user.email,
      };
    } catch (error) {
      logger.error('Failed to queue password reset:', {
        error: error.message,
        userEmail: user.email,
      });
      throw this.createNotificationError('Failed to queue password reset', 'QUEUE_FAILED');
    }
  }

  /**
   * Queue email verification notification
   * @param {Object} user - User details
   * @param {string} verificationToken - Verification token
   * @param {Object} options - Notification options
   */
  async queueEmailVerification(user, verificationToken, options = {}) {
    try {
      if (!this.isConfigured) {
        throw new Error('Notification service not configured');
      }

      const { delay = 0, priority = 'normal' } = options;

      const emailJob = await this.emailQueue.add(
        'email-verification',
        { user, verificationToken },
        {
          delay,
          priority: this.getPriority(priority),
        }
      );

      logger.info('Email verification notification queued:', {
        userEmail: user.email,
        jobId: emailJob.id,
      });

      return {
        success: true,
        jobId: emailJob.id,
        userEmail: user.email,
      };
    } catch (error) {
      logger.error('Failed to queue email verification:', {
        error: error.message,
        userEmail: user.email,
      });
      throw this.createNotificationError('Failed to queue email verification', 'QUEUE_FAILED');
    }
  }

  /**
   * Get queue statistics
   * @returns {Object} Queue statistics
   */
  async getQueueStats() {
    try {
      if (!this.isConfigured) {
        throw new Error('Notification service not configured');
      }

      const emailStats = {
        waiting: await this.emailQueue.getWaiting().then(jobs => jobs.length),
        active: await this.emailQueue.getActive().then(jobs => jobs.length),
        completed: await this.emailQueue.getCompleted().then(jobs => jobs.length),
        failed: await this.emailQueue.getFailed().then(jobs => jobs.length),
        delayed: await this.emailQueue.getDelayed().then(jobs => jobs.length),
      };

      const whatsappStats = {
        waiting: await this.whatsappQueue.getWaiting().then(jobs => jobs.length),
        active: await this.whatsappQueue.getActive().then(jobs => jobs.length),
        completed: await this.whatsappQueue.getCompleted().then(jobs => jobs.length),
        failed: await this.whatsappQueue.getFailed().then(jobs => jobs.length),
        delayed: await this.whatsappQueue.getDelayed().then(jobs => jobs.length),
      };

      return {
        email: emailStats,
        whatsapp: whatsappStats,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Failed to get queue stats:', error);
      throw this.createNotificationError('Failed to get queue statistics', 'STATS_FAILED');
    }
  }

  /**
   * Get job status
   * @param {string} jobId - Job ID
   * @param {string} queueType - Queue type (email or whatsapp)
   */
  async getJobStatus(jobId, queueType) {
    try {
      if (!this.isConfigured) {
        throw new Error('Notification service not configured');
      }

      const queue = queueType === 'email' ? this.emailQueue : this.whatsappQueue;
      const job = await queue.getJob(jobId);

      if (!job) {
        return { found: false };
      }

      return {
        found: true,
        id: job.id,
        name: job.name,
        data: job.data,
        progress: job.progress(),
        attemptsMade: job.attemptsMade,
        finishedOn: job.finishedOn,
        processedOn: job.processedOn,
        failedReason: job.failedReason,
        returnvalue: job.returnvalue,
      };
    } catch (error) {
      logger.error('Failed to get job status:', {
        error: error.message,
        jobId,
        queueType,
      });
      throw this.createNotificationError('Failed to get job status', 'JOB_STATUS_FAILED');
    }
  }

  /**
   * Retry failed jobs
   * @param {string} queueType - Queue type (email or whatsapp)
   * @param {number} maxJobs - Maximum number of jobs to retry
   */
  async retryFailedJobs(queueType, maxJobs = 10) {
    try {
      if (!this.isConfigured) {
        throw new Error('Notification service not configured');
      }

      const queue = queueType === 'email' ? this.emailQueue : this.whatsappQueue;
      const failedJobs = await queue.getFailed(0, maxJobs - 1);

      const retryPromises = failedJobs.map(job => job.retry());
      await Promise.all(retryPromises);

      logger.info('Failed jobs retried:', {
        queueType,
        count: failedJobs.length,
      });

      return {
        success: true,
        retriedCount: failedJobs.length,
        queueType,
      };
    } catch (error) {
      logger.error('Failed to retry jobs:', {
        error: error.message,
        queueType,
      });
      throw this.createNotificationError('Failed to retry jobs', 'RETRY_FAILED');
    }
  }

  /**
   * Clean up completed jobs
   * @param {string} queueType - Queue type (email or whatsapp)
   * @param {number} maxAge - Maximum age in milliseconds
   */
  async cleanupJobs(queueType, maxAge = 24 * 60 * 60 * 1000) {
    try {
      if (!this.isConfigured) {
        throw new Error('Notification service not configured');
      }

      const queue = queueType === 'email' ? this.emailQueue : this.whatsappQueue;
      
      await queue.clean(maxAge, 'completed');
      await queue.clean(maxAge, 'failed');

      logger.info('Jobs cleaned up:', {
        queueType,
        maxAge,
      });

      return {
        success: true,
        queueType,
        maxAge,
      };
    } catch (error) {
      logger.error('Failed to cleanup jobs:', {
        error: error.message,
        queueType,
      });
      throw this.createNotificationError('Failed to cleanup jobs', 'CLEANUP_FAILED');
    }
  }

  /**
   * Get priority value
   */
  getPriority(priority) {
    const priorities = {
      low: 1,
      normal: 5,
      high: 10,
      critical: 15,
    };
    return priorities[priority] || priorities.normal;
  }

  /**
   * Create notification error
   */
  createNotificationError(message, code) {
    const error = new Error(message);
    error.code = code;
    error.status = 500;
    return error;
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    try {
      if (this.emailQueue) {
        await this.emailQueue.close();
      }
      if (this.whatsappQueue) {
        await this.whatsappQueue.close();
      }
      if (this.redisClient) {
        await this.redisClient.quit();
      }
      logger.info('Notification service shutdown completed');
    } catch (error) {
      logger.error('Error during notification service shutdown:', error);
    }
  }
}

// Create singleton instance
const notificationService = new NotificationService();

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  await notificationService.shutdown();
});

process.on('SIGINT', async () => {
  await notificationService.shutdown();
});

module.exports = notificationService;