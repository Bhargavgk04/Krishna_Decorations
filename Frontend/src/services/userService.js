import { apiService } from './api';

// User Service
export const userService = {
  // Get all users (Admin only)
  getAllUsers: async (filters = {}) => {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const queryString = params.toString();
    const url = queryString ? `/admin/users?${queryString}` : '/admin/users';
    
    return await apiService.get(url);
  },

  // Get user by ID
  getUser: async (userId) => {
    return await apiService.get(`/admin/users/${userId}`);
  },

  // Create new user (Admin only)
  createUser: async (userData) => {
    return await apiService.post('/admin/users', userData);
  },

  // Update user (Admin only)
  updateUser: async (userId, updateData) => {
    return await apiService.put(`/admin/users/${userId}`, updateData);
  },

  // Deactivate user (Admin only)
  deactivateUser: async (userId) => {
    return await apiService.put(`/admin/users/${userId}/deactivate`);
  },

  // Activate user (Admin only)
  activateUser: async (userId) => {
    return await apiService.put(`/admin/users/${userId}/activate`);
  },

  // Verify user email (Admin only)
  verifyUserEmail: async (userId) => {
    return await apiService.put(`/admin/users/${userId}/verify-email`);
  },

  // Reset user password (Admin only)
  resetUserPassword: async (userId, newPassword) => {
    return await apiService.put(`/admin/users/${userId}/reset-password`, { newPassword });
  },

  // Unlock user account (Admin only)
  unlockUserAccount: async (userId) => {
    return await apiService.put(`/admin/users/${userId}/unlock`);
  },

  // Delete user (Admin only)
  deleteUser: async (userId) => {
    return await apiService.delete(`/admin/users/${userId}`);
  },

  // Get user statistics
  getUserStats: async (dateRange = {}) => {
    const params = new URLSearchParams();
    if (dateRange.startDate) params.append('startDate', dateRange.startDate);
    if (dateRange.endDate) params.append('endDate', dateRange.endDate);
    
    const queryString = params.toString();
    const url = queryString ? `/admin/users/stats?${queryString}` : '/admin/users/stats';
    
    return await apiService.get(url);
  },

  // Get user activity log
  getUserActivity: async (userId, filters = {}) => {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const queryString = params.toString();
    const url = queryString 
      ? `/admin/users/${userId}/activity?${queryString}` 
      : `/admin/users/${userId}/activity`;
    
    return await apiService.get(url);
  },

  // Get user bookings
  getUserBookings: async (userId, filters = {}) => {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const queryString = params.toString();
    const url = queryString 
      ? `/admin/users/${userId}/bookings?${queryString}` 
      : `/admin/users/${userId}/bookings`;
    
    return await apiService.get(url);
  },

  // Send user notification
  sendUserNotification: async (userId, notification) => {
    return await apiService.post(`/admin/users/${userId}/notify`, notification);
  },

  // Bulk operations
  bulkUpdateUsers: async (userIds, updateData) => {
    return await apiService.put('/admin/users/bulk-update', { userIds, updateData });
  },

  // Bulk deactivate users
  bulkDeactivateUsers: async (userIds) => {
    return await apiService.put('/admin/users/bulk-deactivate', { userIds });
  },

  // Export users
  exportUsers: async (filters = {}, format = 'csv') => {
    const params = new URLSearchParams();
    params.append('format', format);
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const queryString = params.toString();
    const url = queryString ? `/admin/users/export?${queryString}` : `/admin/users/export?format=${format}`;
    
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}${url}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Export failed');
    }

    return await response.blob();
  },

  // Import users
  importUsers: async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    return await apiService.upload('/admin/users/import', formData);
  },

  // Search users
  searchUsers: async (query, filters = {}) => {
    const params = new URLSearchParams();
    params.append('q', query);
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const queryString = params.toString();
    const url = `/admin/users/search?${queryString}`;
    
    return await apiService.get(url);
  },
};

export default userService;