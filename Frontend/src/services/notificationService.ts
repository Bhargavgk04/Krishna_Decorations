import { apiService, ApiResponse, PaginatedResponse } from './api';

// Types
export interface Notification {
  _id: string;
  recipient: {
    _id: string;
    name: string;
    email: string;
  };
  type: 'email' | 'sms' | 'whatsapp' | 'push';
  title: string;
  message: string;
  data?: any;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'read';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  scheduledFor?: string;
  sentAt?: string;
  deliveredAt?: string;
  readAt?: string;
  errorMessage?: string;
  retryCount: number;
  maxRetries: number;
  createdAt: string;
  updatedAt: string;
}

export interface SendNotificationData {
  recipients: string[]; // User IDs or email addresses
  type: 'email' | 'sms' | 'whatsapp';
  title: string;
  message: string;
  data?: any;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  scheduledFor?: string;
  template?: string;
  templateData?: any;
}

export interface NotificationTemplate {
  _id: string;
  name: string;
  type: 'email' | 'sms' | 'whatsapp';
  subject?: string;
  content: string;
  variables: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationFilters {
  type?: string;
  status?: string;
  priority?: string;
  recipient?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface NotificationStats {
  total: number;
  sent: number;
  delivered: number;
  failed: number;
  pending: number;
  byType: Array<{
    type: string;
    count: number;
    successRate: number;
  }>;
  byPriority: Array<{
    priority: string;
    count: number;
  }>;
  recentActivity: Array<{
    date: string;
    sent: number;
    delivered: number;
    failed: number;
  }>;
}

// Notification Service
export const notificationService = {
  // Send notification
  sendNotification: async (notificationData: SendNotificationData): Promise<ApiResponse<Notification[]>> => {
    return await apiService.post<Notification[]>('/notifications/send', notificationData);
  },

  // Send bulk notifications
  sendBulkNotifications: async (notifications: SendNotificationData[]): Promise<ApiResponse<{
    successful: number;
    failed: number;
    results: Array<{
      success: boolean;
      notification?: Notification;
      error?: string;
    }>;
  }>> => {
    return await apiService.post('/notifications/send-bulk', { notifications });
  },

  // Get notifications
  getNotifications: async (filters?: NotificationFilters): Promise<PaginatedResponse<Notification>> => {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }

    const queryString = params.toString();
    const url = queryString ? `/notifications?${queryString}` : '/notifications';
    
    return await apiService.get<Notification[]>(url) as PaginatedResponse<Notification>;
  },

  // Get notification by ID
  getNotification: async (notificationId: string): Promise<ApiResponse<Notification>> => {
    return await apiService.get<Notification>(`/notifications/${notificationId}`);
  },

  // Mark notification as read
  markAsRead: async (notificationId: string): Promise<ApiResponse<Notification>> => {
    return await apiService.put<Notification>(`/notifications/${notificationId}/read`);
  },

  // Mark multiple notifications as read
  markMultipleAsRead: async (notificationIds: string[]): Promise<ApiResponse> => {
    return await apiService.put('/notifications/mark-read', { notificationIds });
  },

  // Retry failed notification
  retryNotification: async (notificationId: string): Promise<ApiResponse<Notification>> => {
    return await apiService.post<Notification>(`/notifications/${notificationId}/retry`);
  },

  // Cancel scheduled notification
  cancelNotification: async (notificationId: string): Promise<ApiResponse> => {
    return await apiService.delete(`/notifications/${notificationId}`);
  },

  // Get notification statistics
  getNotificationStats: async (dateRange?: {
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<NotificationStats>> => {
    const params = new URLSearchParams();
    if (dateRange?.startDate) params.append('startDate', dateRange.startDate);
    if (dateRange?.endDate) params.append('endDate', dateRange.endDate);
    
    const queryString = params.toString();
    const url = queryString ? `/notifications/stats?${queryString}` : '/notifications/stats';
    
    return await apiService.get<NotificationStats>(url);
  },

  // Template management
  getTemplates: async (type?: string): Promise<ApiResponse<NotificationTemplate[]>> => {
    const url = type ? `/notifications/templates?type=${type}` : '/notifications/templates';
    return await apiService.get<NotificationTemplate[]>(url);
  },

  // Get template by ID
  getTemplate: async (templateId: string): Promise<ApiResponse<NotificationTemplate>> => {
    return await apiService.get<NotificationTemplate>(`/notifications/templates/${templateId}`);
  },

  // Create template
  createTemplate: async (templateData: Omit<NotificationTemplate, '_id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<NotificationTemplate>> => {
    return await apiService.post<NotificationTemplate>('/notifications/templates', templateData);
  },

  // Update template
  updateTemplate: async (templateId: string, templateData: Partial<NotificationTemplate>): Promise<ApiResponse<NotificationTemplate>> => {
    return await apiService.put<NotificationTemplate>(`/notifications/templates/${templateId}`, templateData);
  },

  // Delete template
  deleteTemplate: async (templateId: string): Promise<ApiResponse> => {
    return await apiService.delete(`/notifications/templates/${templateId}`);
  },

  // Send booking confirmation
  sendBookingConfirmation: async (bookingId: string): Promise<ApiResponse> => {
    return await apiService.post(`/notifications/booking-confirmation/${bookingId}`);
  },

  // Send booking reminder
  sendBookingReminder: async (bookingId: string, daysAhead?: number): Promise<ApiResponse> => {
    const data = daysAhead ? { daysAhead } : {};
    return await apiService.post(`/notifications/booking-reminder/${bookingId}`, data);
  },

  // Send booking status update
  sendBookingStatusUpdate: async (bookingId: string): Promise<ApiResponse> => {
    return await apiService.post(`/notifications/booking-status-update/${bookingId}`);
  },

  // Send welcome email
  sendWelcomeEmail: async (userId: string): Promise<ApiResponse> => {
    return await apiService.post(`/notifications/welcome-email/${userId}`);
  },

  // Send password reset
  sendPasswordReset: async (email: string): Promise<ApiResponse> => {
    return await apiService.post('/notifications/password-reset', { email });
  },

  // Test notification
  testNotification: async (type: 'email' | 'sms' | 'whatsapp', recipient: string): Promise<ApiResponse> => {
    return await apiService.post('/notifications/test', { type, recipient });
  },

  // Get delivery status
  getDeliveryStatus: async (notificationId: string): Promise<ApiResponse<{
    status: string;
    deliveredAt?: string;
    errorMessage?: string;
    providerResponse?: any;
  }>> => {
    return await apiService.get(`/notifications/${notificationId}/delivery-status`);
  },
};

export default notificationService;