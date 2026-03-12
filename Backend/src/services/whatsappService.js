const axios = require('axios');
const logger = require('../utils/logger');
const { formatDate } = require('../utils/helpers');

// WhatsApp Business API configuration
const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL;
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const ADMIN_PHONE_NUMBER = process.env.ADMIN_PHONE_NUMBER;

// Send WhatsApp message
const sendWhatsAppMessage = async (to, message) => {
  try {
    if (!WHATSAPP_API_URL || !WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
      logger.warn('WhatsApp API not configured, skipping message');
      return;
    }

    const response = await axios.post(
      `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: {
          body: message
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    logger.info(`WhatsApp message sent to ${to}`);
    return response.data;
    
  } catch (error) {
    logger.error('Error sending WhatsApp message:', error);
    throw error;
  }
};

// Send WhatsApp notification
exports.sendWhatsAppNotification = async (data) => {
  try {
    if (!ADMIN_PHONE_NUMBER) {
      logger.warn('Admin phone number not configured, skipping WhatsApp notification');
      return;
    }

    let message;
    
    switch (data.type) {
      case 'new_booking':
        message = `🎉 *New Booking Request*\n\n` +
                 `📋 Booking ID: ${data.booking.bookingId}\n` +
                 `👤 Customer: ${data.booking.customerName}\n` +
                 `📧 Email: ${data.booking.email}\n` +
                 `📱 Phone: ${data.booking.phone}\n` +
                 `🎪 Event: ${data.booking.eventType}\n` +
                 `📅 Date: ${formatDate(data.booking.eventDate)}\n` +
                 `📍 Venue: ${data.booking.venue?.name || data.booking.venue}\n` +
                 `👥 Guests: ${data.booking.guestCount}\n` +
                 `💰 Budget: $${data.booking.budget}\n\n` +
                 `Please review and respond promptly!`;
        break;
        
      case 'booking_update':
        message = `📝 *Booking Status Update*\n\n` +
                 `📋 Booking ID: ${data.booking.bookingId}\n` +
                 `👤 Customer: ${data.booking.customerName}\n` +
                 `📊 Status: ${data.oldStatus} → ${data.newStatus}\n` +
                 `📅 Event Date: ${formatDate(data.booking.eventDate)}\n\n` +
                 `Status has been updated successfully.`;
        break;
        
      case 'booking_reminder':
        message = `⏰ *Event Reminder*\n\n` +
                 `📋 Booking ID: ${data.booking.bookingId}\n` +
                 `👤 Customer: ${data.booking.customerName}\n` +
                 `🎪 Event: ${data.booking.eventType}\n` +
                 `📅 Date: ${formatDate(data.booking.eventDate)}\n` +
                 `📍 Venue: ${data.booking.venue?.name || data.booking.venue}\n\n` +
                 `Event is coming up in ${data.daysUntilEvent} day(s)!`;
        break;
        
      default:
        logger.warn(`Unknown WhatsApp notification type: ${data.type}`);
        return;
    }
    
    await sendWhatsAppMessage(ADMIN_PHONE_NUMBER, message);
    
  } catch (error) {
    logger.error('Error sending WhatsApp notification:', error);
    throw error;
  }
};

// Send customer WhatsApp message
exports.sendCustomerWhatsApp = async (phoneNumber, booking, messageType) => {
  try {
    let message;
    
    switch (messageType) {
      case 'confirmation':
        message = `✅ *Booking Confirmed*\n\n` +
                 `Hi ${booking.customerName}!\n\n` +
                 `Your booking has been confirmed:\n` +
                 `📋 Booking ID: ${booking.bookingId}\n` +
                 `🎪 Event: ${booking.eventType}\n` +
                 `📅 Date: ${formatDate(booking.eventDate)}\n` +
                 `📍 Venue: ${booking.venue?.name || booking.venue}\n\n` +
                 `We're excited to make your event special! 🎉`;
        break;
        
      case 'reminder':
        message = `⏰ *Event Reminder*\n\n` +
                 `Hi ${booking.customerName}!\n\n` +
                 `Your event is coming up soon:\n` +
                 `📋 Booking ID: ${booking.bookingId}\n` +
                 `🎪 Event: ${booking.eventType}\n` +
                 `📅 Date: ${formatDate(booking.eventDate)}\n` +
                 `📍 Venue: ${booking.venue?.name || booking.venue}\n\n` +
                 `We're all set and ready to make it amazing! ✨`;
        break;
        
      case 'cancellation':
        message = `❌ *Booking Cancelled*\n\n` +
                 `Hi ${booking.customerName},\n\n` +
                 `Your booking has been cancelled:\n` +
                 `📋 Booking ID: ${booking.bookingId}\n` +
                 `🎪 Event: ${booking.eventType}\n` +
                 `📅 Date: ${formatDate(booking.eventDate)}\n\n` +
                 `If you have any questions, please contact us.`;
        break;
        
      default:
        logger.warn(`Unknown customer message type: ${messageType}`);
        return;
    }
    
    // Clean phone number (remove non-digits and add country code if needed)
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('1') ? cleanPhone : `1${cleanPhone}`;
    
    await sendWhatsAppMessage(formattedPhone, message);
    
  } catch (error) {
    logger.error('Error sending customer WhatsApp message:', error);
    throw error;
  }
};

// Send bulk WhatsApp messages
exports.sendBulkWhatsApp = async (recipients, message) => {
  try {
    const results = [];
    
    for (const recipient of recipients) {
      try {
        await sendWhatsAppMessage(recipient.phone, message);
        results.push({
          phone: recipient.phone,
          name: recipient.name,
          status: 'sent'
        });
        
        // Add delay between messages to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        logger.error(`Failed to send WhatsApp to ${recipient.phone}:`, error);
        results.push({
          phone: recipient.phone,
          name: recipient.name,
          status: 'failed',
          error: error.message
        });
      }
    }
    
    return results;
    
  } catch (error) {
    logger.error('Error sending bulk WhatsApp messages:', error);
    throw error;
  }
};

// Verify WhatsApp webhook
exports.verifyWebhook = (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  
  if (mode && token) {
    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      logger.info('WhatsApp webhook verified');
      res.status(200).send(challenge);
    } else {
      logger.warn('WhatsApp webhook verification failed');
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(400);
  }
};

// Handle WhatsApp webhook
exports.handleWebhook = async (req, res) => {
  try {
    const body = req.body;
    
    if (body.object === 'whatsapp_business_account') {
      body.entry?.forEach(entry => {
        entry.changes?.forEach(change => {
          if (change.field === 'messages') {
            const messages = change.value.messages;
            messages?.forEach(message => {
              logger.info('Received WhatsApp message:', {
                from: message.from,
                text: message.text?.body,
                timestamp: message.timestamp
              });
              
              // Handle incoming messages here
              // You can implement auto-responses or forward to admin
            });
          }
        });
      });
    }
    
    res.status(200).send('OK');
    
  } catch (error) {
    logger.error('Error handling WhatsApp webhook:', error);
    res.status(500).send('Error');
  }
};