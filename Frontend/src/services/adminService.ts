import { apiService, ApiResponse, PaginatedResponse } from './api';

// Types
export interface Admin {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'manager' | 'super_admin';
  permissions: string[];
  isActive: boolean;
  lastLogin?: string;
  department?: string;
  employeeId?: string;
  joinDate: string;
  profileImage?: {
    url: string;
    publicId: string;
  };
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    dateFormat: string;
    timeFormat: '12h' | '24h';
  };
  createdAt: string;
  updatedAt: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'user' | 'admin';
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminLoginCredentials {
  email: string;
  password: string;
}

export interface AdminAuthResponse {
  admin: Admin;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export interface CreateAdminData {
  name: string;
  email: string;
  password: string;
  role: string;
  department?: string;
  permissions?: string[];
}

export interface UpdateAdminData {
  name?: string;
  phone?: string;
  department?: string;
  permissions?: string[];
  isActive?: boolean;
}

export interface AdminFilters {
  role?: string;
  department?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface DashboardData {
  overview: {
    totalBookings: number;
    pendingBookings: number;
    completedBookings: number;
    totalRevenue: number;
    monthlyRevenue: number;
    activeUsers: number;
  };
  recentBookings: Array<{
    _id: string;
    bookingReference: string;
    user: {
      name: string;
      email: string;
    };
    eventType: string;
    eventDate: string;
    status: string;
    estimatedCost?: number;
  }>;
  upcomingEvents: Array<{
    _id: string;
    bookingReference: string;
    user: {
      name: string;
      phone?: string;
    };
    eventType: string;
    eventDate: string;
    venue: string;
    daysUntilEvent: number;
  }>;
  statistics: {
    bookingsByStatus: Array<{
      status: string;
      count: number;
    }>;
    bookingsByEventType: Array<{
      eventType: string;
      count: number;
    }>;
    monthlyBookings: Array<{
      month: string;
      count: number;
      revenue: number;
    }>;
  };
}

export interface ActivityLog {
  action: string;
  resource: string;
  resourceId?: string;
  details?: any;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

// Admin Service
export const adminService = {
  // Admin authentication
  login: async (credentials: AdminLoginCredentials): Promise<ApiResponse<AdminAuthResponse>> => {
    const response = await apiService.post<AdminAuthResponse>('/admin/login', credentials);

    if (response.success && response.data) {
      // Store auth data
      localStorage.setItem('adminToken', response.data.tokens.accessToken);
      localStorage.setItem('adminRefreshToken', response.data.tokens.refreshToken);
      localStorage.setItem('admin', JSON.stringify(response.data.admin));
    }

    return response;
  },

  // Admin logout
  logout: async (): Promise<void> => {
    try {
      await apiService.post('/admin/logout');
    } catch (error) {
      console.warn('Admin logout API call failed:', error);
    } finally {
      // Clear local storage
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminRefreshToken');
      localStorage.removeItem('admin');
    }
  },

  // Get dashboard data
  getDashboard: async (dateRange?: { startDate?: string; endDate?: string }): Promise<ApiResponse<DashboardData>> => {
    const params = new URLSearchParams();
    if (dateRange?.startDate) params.append('startDate', dateRange.startDate);
    if (dateRange?.endDate) params.append('endDate', dateRange.endDate);

    const queryString = params.toString();
    const url = queryString ? `/admin/dashboard?${queryString}` : '/admin/dashboard';

    return await apiService.get<DashboardData>(url);
  },

  // Get admin profile
  getProfile: async (): Promise<ApiResponse<Admin>> => {
    return await apiService.get<Admin>('/admin/profile');
  },

  // Update admin profile
  updateProfile: async (profileData: Partial<Admin>): Promise<ApiResponse<Admin>> => {
    const response = await apiService.put<Admin>('/admin/profile', profileData);

    if (response.success && response.data) {
      // Update stored admin data
      localStorage.setItem('admin', JSON.stringify(response.data));
    }

    return response;
  },

  // Change admin password
  changePassword: async (passwordData: {
    currentPassword: string;
    newPassword: string;
  }): Promise<ApiResponse> => {
    return await apiService.post('/admin/change-password', passwordData);
  },

  // Get activity log
  getActivityLog: async (filters?: {
    page?: number;
    limit?: number;
    action?: string;
    resource?: string;
  }): Promise<PaginatedResponse<ActivityLog>> => {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.action) params.append('action', filters.action);
    if (filters?.resource) params.append('resource', filters.resource);

    const queryString = params.toString();
    const url = queryString ? `/admin/activity-log?${queryString}` : '/admin/activity-log';

    return await apiService.get<ActivityLog[]>(url) as PaginatedResponse<ActivityLog>;
  },

  // Admin management (Super Admin only)
  getAllAdmins: async (filters?: AdminFilters): Promise<PaginatedResponse<Admin>> => {
    const params = new URLSearchParams();
    if (filters?.role) params.append('role', filters.role);
    if (filters?.department) params.append('department', filters.department);
    if (filters?.isActive !== undefined) params.append('isActive', filters.isActive.toString());
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const queryString = params.toString();
    const url = queryString ? `/admin/admins?${queryString}` : '/admin/admins';

    return await apiService.get<Admin[]>(url) as PaginatedResponse<Admin>;
  },

  // Create new admin
  createAdmin: async (adminData: CreateAdminData): Promise<ApiResponse<Admin>> => {
    return await apiService.post<Admin>('/admin/admins', adminData);
  },

  // Update admin
  updateAdmin: async (adminId: string, updateData: UpdateAdminData): Promise<ApiResponse<Admin>> => {
    return await apiService.put<Admin>(`/admin/admins/${adminId}`, updateData);
  },

  // Deactivate admin
  deactivateAdmin: async (adminId: string): Promise<ApiResponse> => {
    return await apiService.delete(`/admin/admins/${adminId}`);
  },

  // User management
  getAllUsers: async (filters?: {
    search?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<User>> => {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.isActive !== undefined) params.append('isActive', filters.isActive.toString());
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const queryString = params.toString();
    const url = queryString ? `/admin/users?${queryString}` : '/admin/users';

    return await apiService.get<User[]>(url) as PaginatedResponse<User>;
  },

  updateUserStatus: async (userId: string, isActive: boolean): Promise<ApiResponse<User>> => {
    return await apiService.put<User>(`/admin/users/${userId}/status`, { isActive });
  },

  // Check if admin is authenticated
  isAuthenticated: (): boolean => {
    const token = localStorage.getItem('adminToken');
    const admin = localStorage.getItem('admin');
    return !!(token && admin);
  },

  // Get current admin from localStorage
  getCurrentAdmin: (): Admin | null => {
    const adminStr = localStorage.getItem('admin');
    if (adminStr) {
      try {
        return JSON.parse(adminStr);
      } catch (error) {
        console.error('Error parsing admin data:', error);
        return null;
      }
    }
    return null;
  },

  // Get admin token
  getToken: (): string | null => {
    return localStorage.getItem('adminToken');
  },
};

export default adminService;