import { apiService, ApiResponse, PaginatedResponse } from './api';

// Types
export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'visitor' | 'admin';
  isVerified: boolean;
  isActive: boolean;
  lastLogin?: string;
  loginAttempts: number;
  lockUntil?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserFilters {
  role?: string;
  isVerified?: boolean;
  isActive?: boolean;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface UserStats {
  total: number;
  active: number;
  verified: number;
  newThisMonth: number;
  byRole: Array<{
    role: string;
    count: number;
  }>;
  registrationTrend: Array<{
    date: string;
    count: number;
  }>;
  loginActivity: Array<{
    date: string;
    logins: number;
    uniqueUsers: number;
  }>;
}

export interface CreateUserData {
  name: string;
  email: string;
  phone?: string;
  password: string;
  role?: 'visitor' | 'admin';
  isVerified?: boolean;
}

export interface UpdateUserData {
  name?: string;
  phone?: string;
  isActive?: boolean;
  isVerified?: boolean;
  role?: 'visitor' | 'admin';
}

export interface UserActivity {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  action: string;
  resource: string;
  resourceId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

// User Service
export const userService = {
  // Get all users (Admin only)
  getAllUsers: async (filters?: UserFilters): Promise<PaginatedResponse<User>> => {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }

    const queryString = params.toString();
    const url = queryString ? `/admin/users?${queryString}` : '/admin/users';
    
    return await apiService.get<User[]>(url) as PaginatedResponse<User>;
  },

  // Get user by ID
  getUser: async (userId: string): Promise<ApiResponse<User>> => {
    return await apiService.get<User>(`/admin/users/${userId}`);
  },

  // Create new user (Admin only)
  createUser: async (userData: CreateUserData): Promise<ApiResponse<User>> => {
    return await apiService.post<User>('/admin/users', userData);
  },

  // Update user (Admin only)
  updateUser: async (userId: string, updateData: UpdateUserData): Promise<ApiResponse<User>> => {
    return await apiService.put<User>(`/admin/users/${userId}`, updateData);
  },

  // Deactivate user (Admin only)
  deactivateUser: async (userId: string): Promise<ApiResponse> => {
    return await apiService.put(`/admin/users/${userId}/deactivate`);
  },

  // Activate user (Admin only)
  activateUser: async (userId: string): Promise<ApiResponse> => {
    return await apiService.put(`/admin/users/${userId}/activate`);
  },

  // Verify user email (Admin only)
  verifyUserEmail: async (userId: string): Promise<ApiResponse> => {
    return await apiService.put(`/admin/users/${userId}/verify-email`);
  },

  // Reset user password (Admin only)
  resetUserPassword: async (userId: string, newPassword: string): Promise<ApiResponse> => {
    return await apiService.put(`/admin/users/${userId}/reset-password`, { newPassword });
  },

  // Unlock user account (Admin only)
  unlockUserAccount: async (userId: string): Promise<ApiResponse> => {
    return await apiService.put(`/admin/users/${userId}/unlock`);
  },

  // Delete user (Admin only)
  deleteUser: async (userId: string): Promise<ApiResponse> => {
    return await apiService.delete(`/admin/users/${userId}`);
  },

  // Get user statistics
  getUserStats: async (dateRange?: {
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<UserStats>> => {
    const params = new URLSearchParams();
    if (dateRange?.startDate) params.append('startDate', dateRange.startDate);
    if (dateRange?.endDate) params.append('endDate', dateRange.endDate);
    
    const queryString = params.toString();
    const url = queryString ? `/admin/users/stats?${queryString}` : '/admin/users/stats';
    
    return await apiService.get<UserStats>(url);
  },

  // Get user activity log
  getUserActivity: async (userId: string, filters?: {
    page?: number;
    limit?: number;
    action?: string;
    resource?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<PaginatedResponse<UserActivity>> => {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }

    const queryString = params.toString();
    const url = queryString 
      ? `/admin/users/${userId}/activity?${queryString}` 
      : `/admin/users/${userId}/activity`;
    
    return await apiService.get<UserActivity[]>(url) as PaginatedResponse<UserActivity>;
  },

  // Get user bookings
  getUserBookings: async (userId: string, filters?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<any>> => {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }

    const queryString = params.toString();
    const url = queryString 
      ? `/admin/users/${userId}/bookings?${queryString}` 
      : `/admin/users/${userId}/bookings`;
    
    return await apiService.get<any[]>(url) as PaginatedResponse<any>;
  },

  // Send user notification
  sendUserNotification: async (userId: string, notification: {
    type: 'email' | 'sms' | 'whatsapp';
    title: string;
    message: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
  }): Promise<ApiResponse> => {
    return await apiService.post(`/admin/users/${userId}/notify`, notification);
  },

  // Bulk operations
  bulkUpdateUsers: async (userIds: string[], updateData: UpdateUserData): Promise<ApiResponse<{
    successful: number;
    failed: number;
    results: Array<{
      userId: string;
      success: boolean;
      error?: string;
    }>;
  }>> => {
    return await apiService.put('/admin/users/bulk-update', { userIds, updateData });
  },

  // Bulk deactivate users
  bulkDeactivateUsers: async (userIds: string[]): Promise<ApiResponse<{
    successful: number;
    failed: number;
  }>> => {
    return await apiService.put('/admin/users/bulk-deactivate', { userIds });
  },

  // Export users
  exportUsers: async (filters?: UserFilters, format: 'csv' | 'xlsx' = 'csv'): Promise<Blob> => {
    const params = new URLSearchParams();
    params.append('format', format);
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }

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
  importUsers: async (file: File): Promise<ApiResponse<{
    successful: number;
    failed: number;
    errors: Array<{
      row: number;
      error: string;
    }>;
  }>> => {
    const formData = new FormData();
    formData.append('file', file);

    return await apiService.upload('/admin/users/import', formData);
  },

  // Search users
  searchUsers: async (query: string, filters?: {
    role?: string;
    isActive?: boolean;
    limit?: number;
  }): Promise<ApiResponse<User[]>> => {
    const params = new URLSearchParams();
    params.append('q', query);
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }

    const queryString = params.toString();
    const url = `/admin/users/search?${queryString}`;
    
    return await apiService.get<User[]>(url);
  },
};

export default userService;