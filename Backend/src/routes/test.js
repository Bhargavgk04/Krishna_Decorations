const express = require('express');
const emailService = require('../services/emailService');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @route POST /api/test/email
 * @desc Test email functionality
 * @access Public (for development only)
 */
router.post('/email', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'TEST_DISABLED',
          message: 'Test endpoints are disabled in production'
        }
      });
    }

    const { to, subject, message } = req.body;

    if (!to || !subject || !message) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'to, subject, and message are required'
        }
      });
    }

    // Create a simple test email template
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Test Email</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Test Email from Krishna Decorations API</h1>
          </div>
          <div class="content">
            <p>${message}</p>
            <p><strong>Sent at:</strong> ${new Date().toLocaleString()}</p>
            <p>If you received this email, the email service is working correctly!</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send test email using the transporter directly
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: to,
      subject: subject,
      html: html,
    };

    const result = await emailService.transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      data: {
        messageId: result.messageId,
        recipient: to,
        subject: subject
      },
      message: 'Test email sent successfully'
    });

  } catch (error) {
    logger.error('Test email failed:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'EMAIL_TEST_FAILED',
        message: error.message
      }
    });
  }
});

module.exports = router;