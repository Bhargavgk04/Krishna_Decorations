import { apiService } from './api';

// Notification Service
export const notificationService = {
  // Send notification
  sendNotification: async (notificationData) => {
    return await apiService.post('/notifications/send', notificationData);
  },

  // Send bulk notifications
  sendBulkNotifications: async (notifications) => {
    return await apiService.post('/notifications/send-bulk', { notifications });
  },

  // Get notifications
  getNotifications: async (filters = {}) => {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const queryString = params.toString();
    const url = queryString ? `/notifications?${queryString}` : '/notifications';
    
    return await apiService.get(url);
  },

  // Get notification by ID
  getNotification: async (notificationId) => {
    return await apiService.get(`/notifications/${notificationId}`);
  },

  // Mark notification as read
  markAsRead: async (notificationId) => {
    return await apiService.put(`/notifications/${notificationId}/read`);
  },

  // Mark multiple notifications as read
  markMultipleAsRead: async (notificationIds) => {
    return await apiService.put('/notifications/mark-read', { notificationIds });
  },

  // Retry failed notification
  retryNotification: async (notificationId) => {
    return await apiService.post(`/notifications/${notificationId}/retry`);
  },

  // Cancel scheduled notification
  cancelNotification: async (notificationId) => {
    return await apiService.delete(`/notifications/${notificationId}`);
  },

  // Get notification statistics
  getNotificationStats: async (dateRange = {}) => {
    const params = new URLSearchParams();
    if (dateRange.startDate) params.append('startDate', dateRange.startDate);
    if (dateRange.endDate) params.append('endDate', dateRange.endDate);
    
    const queryString = params.toString();
    const url = queryString ? `/notifications/stats?${queryString}` : '/notifications/stats';
    
    return await apiService.get(url);
  },

  // Template management
  getTemplates: async (type) => {
    const url = type ? `/notifications/templates?type=${type}` : '/notifications/templates';
    return await apiService.get(url);
  },

  // Get template by ID
  getTemplate: async (templateId) => {
    return await apiService.get(`/notifications/templates/${templateId}`);
  },

  // Create template
  createTemplate: async (templateData) => {
    return await apiService.post('/notifications/templates', templateData);
  },

  // Update template
  updateTemplate: async (templateId, templateData) => {
    return await apiService.put(`/notifications/templates/${templateId}`, templateData);
  },

  // Delete template
  deleteTemplate: async (templateId) => {
    return await apiService.delete(`/notifications/templates/${templateId}`);
  },

  // Send booking confirmation
  sendBookingConfirmation: async (bookingId) => {
    return await apiService.post(`/notifications/booking-confirmation/${bookingId}`);
  },

  // Send booking reminder
  sendBookingReminder: async (bookingId, daysAhead) => {
    const data = daysAhead ? { daysAhead } : {};
    return await apiService.post(`/notifications/booking-reminder/${bookingId}`, data);
  },

  // Send booking status update
  sendBookingStatusUpdate: async (bookingId) => {
    return await apiService.post(`/notifications/booking-status-update/${bookingId}`);
  },

  // Send welcome email
  sendWelcomeEmail: async (userId) => {
    return await apiService.post(`/notifications/welcome-email/${userId}`);
  },

  // Send password reset
  sendPasswordReset: async (email) => {
    return await apiService.post('/notifications/password-reset', { email });
  },

  // Test notification
  testNotification: async (type, recipient) => {
    return await apiService.post('/notifications/test', { type, recipient });
  },

  // Get delivery status
  getDeliveryStatus: async (notificationId) => {
    return await apiService.get(`/notifications/${notificationId}/delivery-status`);
  },
};

export default notificationService;