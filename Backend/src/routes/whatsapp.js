const express = require('express');
const whatsappService = require('../services/whatsappService');
const { authenticate, authorizeAdmin } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @route GET /api/whatsapp/status
 * @desc Get WhatsApp service status
 * @access Private (Admin)
 */
router.get('/status', authenticate, authorizeAdmin(), async (req, res) => {
  try {
    const status = whatsappService.getStatus();
    
    res.status(200).json({
      success: true,
      data: {
        ...status,
        message: status.isReady 
          ? 'WhatsApp service is connected and ready'
          : status.hasQRCode 
            ? 'WhatsApp service is waiting for QR code scan'
            : 'WhatsApp service is initializing'
      }
    });
  } catch (error) {
    logger.error('Failed to get WhatsApp status:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'WHATSAPP_STATUS_ERROR',
        message: 'Failed to get WhatsApp status'
      }
    });
  }
});

/**
 * @route GET /api/whatsapp/qr
 * @desc Get WhatsApp QR code for setup
 * @access Private (Admin)
 */
router.get('/qr', authenticate, authorizeAdmin(), async (req, res) => {
  try {
    const qrCode = whatsappService.getQRCode();
    
    if (!qrCode) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'QR_NOT_AVAILABLE',
          message: 'QR code not available. WhatsApp may already be connected or still initializing.'
        }
      });
    }

    res.status(200).json({
      success: true,
      data: {
        qrCode,
        instructions: [
          '1. Open WhatsApp on your phone',
          '2. Go to Settings > Linked Devices',
          '3. Tap "Link a Device"',
          '4. Scan this QR code',
          '5. Your WhatsApp will be connected to the bot'
        ]
      }
    });
  } catch (error) {
    logger.error('Failed to get WhatsApp QR code:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'QR_FETCH_ERROR',
        message: 'Failed to get QR code'
      }
    });
  }
});

/**
 * @route POST /api/whatsapp/test
 * @desc Send test WhatsApp message
 * @access Private (Admin)
 */
router.post('/test', authenticate, authorizeAdmin(), async (req, res) => {
  try {
    const { phoneNumber, message } = req.body;

    if (!phoneNumber || !message) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Phone number and message are required'
        }
      });
    }

    const result = await whatsappService.sendMessage(phoneNumber, message);

    res.status(200).json({
      success: true,
      data: result,
      message: 'Test message sent successfully'
    });
  } catch (error) {
    logger.error('Failed to send test WhatsApp message:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'TEST_MESSAGE_FAILED',
        message: error.message
      }
    });
  }
});

/**
 * @route POST /api/whatsapp/disconnect
 * @desc Disconnect WhatsApp service
 * @access Private (Admin)
 */
router.post('/disconnect', authenticate, authorizeAdmin(), async (req, res) => {
  try {
    await whatsappService.disconnect();

    res.status(200).json({
      success: true,
      message: 'WhatsApp service disconnected successfully'
    });
  } catch (error) {
    logger.error('Failed to disconnect WhatsApp service:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DISCONNECT_FAILED',
        message: 'Failed to disconnect WhatsApp service'
      }
    });
  }
});

module.exports = router;