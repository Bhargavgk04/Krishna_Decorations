import { apiService } from './api';

// Booking Service
export const bookingService = {
  // Create a new booking
  createBooking: async (bookingData) => {
    return await apiService.post('/bookings', bookingData);
  },

  // Get all bookings (admin only)
  getAllBookings: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.status) params.append('status', filters.status);
    if (filters.eventType) params.append('eventType', filters.eventType);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
    if (filters.search) params.append('search', filters.search);
    
    const queryString = params.toString();
    const url = queryString ? `/bookings?${queryString}` : '/bookings';
    
    const response = await apiService.get(url);
    
    // Transform response to match expected format
    if (response.success) {
      return {
        success: true,
        data: {
          bookings: response.data,
          pagination: response.pagination
        }
      };
    }
    
    return response;
  },

  // Get user's bookings
  getUserBookings: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.status) params.append('status', filters.status);
    
    const queryString = params.toString();
    const url = queryString ? `/bookings/my-bookings?${queryString}` : '/bookings/my-bookings';
    
    return await apiService.get(url);
  },

  // Get booking by ID
  getBookingById: async (bookingId) => {
    return await apiService.get(`/bookings/${bookingId}`);
  },

  // Get single booking (user or admin)
  getBooking: async (bookingId) => {
    return await apiService.get(`/bookings/booking/${bookingId}`);
  },

  // Update booking (admin only)
  updateBooking: async (bookingId, updateData) => {
    return await apiService.patch(`/bookings/${bookingId}`, updateData);
  },

  // Update booking status (admin only)
  updateBookingStatus: async (bookingId, status, notes = '') => {
    return await apiService.patch(`/bookings/${bookingId}/status`, { status, notes });
  },

  // Cancel booking (user)
  cancelBooking: async (bookingId) => {
    return await apiService.patch(`/bookings/booking/${bookingId}/cancel`);
  },

  // Delete booking (admin only)
  deleteBooking: async (bookingId) => {
    return await apiService.delete(`/bookings/${bookingId}`);
  },

  // Check availability
  checkAvailability: async (date, eventType = '') => {
    const params = new URLSearchParams();
    params.append('date', date);
    if (eventType) params.append('eventType', eventType);
    
    return await apiService.get(`/bookings/availability?${params.toString()}`);
  },

  // Get booking statistics (admin only)
  getBookingStats: async () => {
    return await apiService.get('/bookings/stats');
  },

  // Get booking statistics with period (admin only)
  getBookingStatistics: async (period = '30') => {
    return await apiService.get(`/bookings/statistics?period=${period}`);
  },

  // Get upcoming bookings (admin only)
  getUpcomingBookings: async (days = 7) => {
    return await apiService.get(`/bookings/upcoming?days=${days}`);
  },

  // Send event reminders (admin only)
  sendEventReminders: async (days = 1) => {
    return await apiService.post('/bookings/send-reminders', { days });
  },

  // Helper function to format booking status
  formatStatus: (status) => {
    const statusMap = {
      pending: 'Pending',
      confirmed: 'Confirmed',
      in_progress: 'In Progress',
      completed: 'Completed',
      cancelled: 'Cancelled',
      rejected: 'Rejected'
    };
    return statusMap[status] || status;
  },

  // Helper function to get status color
  getStatusColor: (status) => {
    const colorMap = {
      pending: 'text-yellow-600 bg-yellow-100',
      confirmed: 'text-blue-600 bg-blue-100',
      in_progress: 'text-purple-600 bg-purple-100',
      completed: 'text-green-600 bg-green-100',
      cancelled: 'text-red-600 bg-red-100',
      rejected: 'text-red-600 bg-red-100'
    };
    return colorMap[status] || 'text-gray-600 bg-gray-100';
  },

  // Helper function to format currency
  formatCurrency: (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  },

  // Helper function to format date
  formatDate: (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  },

  // Helper function to format date and time
  formatDateTime: (dateString) => {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
};

export default bookingService;