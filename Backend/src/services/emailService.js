const nodemailer = require('nodemailer');
const logger = require('../utils/logger');
const { formatDate } = require('../utils/helpers');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

// Send booking confirmation email
exports.sendBookingConfirmation = async (booking) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.FROM_EMAIL,
      to: booking.email,
      subject: `Booking Confirmation - ${booking.bookingId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Booking Confirmation</h2>
          <p>Dear ${booking.customerName},</p>
          <p>Thank you for your booking request. We have received your details and will get back to you shortly.</p>
          
          <div style="background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 5px;">
            <h3 style="margin-top: 0;">Booking Details</h3>
            <p><strong>Booking ID:</strong> ${booking.bookingId}</p>
            <p><strong>Event Type:</strong> ${booking.eventType}</p>
            <p><strong>Event Date:</strong> ${formatDate(booking.eventDate)}</p>
            <p><strong>Venue:</strong> ${booking.venue}</p>
            <p><strong>Guest Count:</strong> ${booking.guestCount}</p>
            <p><strong>Budget:</strong> $${booking.budget}</p>
            <p><strong>Status:</strong> ${booking.status}</p>
          </div>
          
          ${booking.requirements ? `
            <div style="background: #f9f9f9; padding: 15px; margin: 15px 0; border-radius: 5px;">
              <h4>Special Requirements:</h4>
              <p>${booking.requirements}</p>
            </div>
          ` : ''}
          
          <p>We will review your request and contact you within 24 hours to discuss the details and confirm availability.</p>
          <p>If you have any questions, please don't hesitate to contact us.</p>
          
          <p>Best regards,<br>The Event Management Team</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    logger.info(`Booking confirmation email sent to ${booking.email}`);
    
  } catch (error) {
    logger.error('Error sending booking confirmation email:', error);
    throw error;
  }
};

// Send booking update email
exports.sendBookingUpdate = async (booking, oldStatus) => {
  try {
    const transporter = createTransporter();
    
    const statusMessages = {
      confirmed: 'Your booking has been confirmed! We look forward to making your event special.',
      cancelled: 'Your booking has been cancelled. If you have any questions, please contact us.',
      completed: 'Your event has been completed. Thank you for choosing our services!',
      in_progress: 'Your event is currently in progress. Our team is working to make it perfect.',
      rejected: 'Unfortunately, we cannot accommodate your booking request at this time.'
    };
    
    const mailOptions = {
      from: process.env.FROM_EMAIL,
      to: booking.email,
      subject: `Booking Update - ${booking.bookingId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Booking Status Update</h2>
          <p>Dear ${booking.customerName},</p>
          
          <div style="background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 5px;">
            <h3 style="margin-top: 0;">Status Update</h3>
            <p><strong>Booking ID:</strong> ${booking.bookingId}</p>
            <p><strong>Previous Status:</strong> ${oldStatus}</p>
            <p><strong>Current Status:</strong> ${booking.status}</p>
          </div>
          
          <p>${statusMessages[booking.status] || 'Your booking status has been updated.'}</p>
          
          <div style="background: #f9f9f9; padding: 15px; margin: 15px 0; border-radius: 5px;">
            <h4>Event Details:</h4>
            <p><strong>Event Type:</strong> ${booking.eventType}</p>
            <p><strong>Event Date:</strong> ${formatDate(booking.eventDate)}</p>
            <p><strong>Venue:</strong> ${booking.venue}</p>
          </div>
          
          ${booking.adminNotes && booking.adminNotes.length > 0 ? `
            <div style="background: #fff3cd; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #ffc107;">
              <h4>Additional Notes:</h4>
              <p>${booking.adminNotes[booking.adminNotes.length - 1].note}</p>
            </div>
          ` : ''}
          
          <p>If you have any questions about this update, please don't hesitate to contact us.</p>
          
          <p>Best regards,<br>The Event Management Team</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    logger.info(`Booking update email sent to ${booking.email}`);
    
  } catch (error) {
    logger.error('Error sending booking update email:', error);
    throw error;
  }
};

// Send booking reminder email
exports.sendBookingReminder = async (booking, daysUntilEvent) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.FROM_EMAIL,
      to: booking.email,
      subject: `Event Reminder - ${booking.bookingId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Event Reminder</h2>
          <p>Dear ${booking.customerName},</p>
          
          <p>This is a friendly reminder that your event is coming up in ${daysUntilEvent} day${daysUntilEvent > 1 ? 's' : ''}!</p>
          
          <div style="background: #e7f3ff; padding: 20px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #007bff;">
            <h3 style="margin-top: 0;">Event Details</h3>
            <p><strong>Booking ID:</strong> ${booking.bookingId}</p>
            <p><strong>Event Type:</strong> ${booking.eventType}</p>
            <p><strong>Event Date:</strong> ${formatDate(booking.eventDate)}</p>
            <p><strong>Venue:</strong> ${booking.venue}</p>
            <p><strong>Guest Count:</strong> ${booking.guestCount}</p>
            ${booking.preferredTime ? `<p><strong>Time:</strong> ${booking.preferredTime}</p>` : ''}
          </div>
          
          <p>Our team is prepared and excited to make your event memorable. If you need to make any last-minute changes or have questions, please contact us as soon as possible.</p>
          
          <p>We look forward to serving you!</p>
          
          <p>Best regards,<br>The Event Management Team</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    logger.info(`Event reminder email sent to ${booking.email}`);
    
  } catch (error) {
    logger.error('Error sending event reminder email:', error);
    throw error;
  }
};

// Send admin notification email
exports.sendAdminNotification = async (type, data) => {
  try {
    const transporter = createTransporter();
    const adminEmail = process.env.ADMIN_EMAIL;
    
    if (!adminEmail) {
      logger.warn('Admin email not configured, skipping admin notification');
      return;
    }
    
    let subject, html;
    
    switch (type) {
      case 'new_booking':
        subject = `New Booking Request - ${data.bookingId}`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">New Booking Request</h2>
            <p>A new booking request has been received:</p>
            
            <div style="background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 5px;">
              <h3 style="margin-top: 0;">Booking Details</h3>
              <p><strong>Booking ID:</strong> ${data.bookingId}</p>
              <p><strong>Customer:</strong> ${data.customerName}</p>
              <p><strong>Email:</strong> ${data.email}</p>
              <p><strong>Phone:</strong> ${data.phone}</p>
              <p><strong>Event Type:</strong> ${data.eventType}</p>
              <p><strong>Event Date:</strong> ${formatDate(data.eventDate)}</p>
              <p><strong>Venue:</strong> ${data.venue}</p>
              <p><strong>Guest Count:</strong> ${data.guestCount}</p>
              <p><strong>Budget:</strong> $${data.budget}</p>
            </div>
            
            ${data.requirements ? `
              <div style="background: #f9f9f9; padding: 15px; margin: 15px 0; border-radius: 5px;">
                <h4>Special Requirements:</h4>
                <p>${data.requirements}</p>
              </div>
            ` : ''}
            
            <p>Please review and respond to this booking request promptly.</p>
          </div>
        `;
        break;
        
      default:
        return;
    }
    
    const mailOptions = {
      from: process.env.FROM_EMAIL,
      to: adminEmail,
      subject,
      html
    };

    await transporter.sendMail(mailOptions);
    logger.info(`Admin notification email sent for ${type}`);
    
  } catch (error) {
    logger.error('Error sending admin notification email:', error);
    throw error;
  }
};