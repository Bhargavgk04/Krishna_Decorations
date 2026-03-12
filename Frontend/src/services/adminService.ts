import { apiService, ApiResponse, PaginatedResponse } from './api';

// Development mode flag - set to true to use mock data
const USE_MOCK_DATA = true;

// Mock dashboard data
const mockDashboardData = {
  overview: {
    totalBookings: 7,
    pendingBookings: 1,
    totalRevenue: 26000,
    activeUsers: 7
  }
};

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
    if (USE_MOCK_DATA) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Mock admin login - accept any credentials for demo
      const mockAdmin: Admin = {
        _id: 'mock-admin-id',
        name: 'Admin User',
        email: credentials.email,
        role: 'admin',
        permissions: ['all'],
        isActive: true,
        joinDate: '2024-01-01T00:00:00.000Z',
        preferences: {
          theme: 'light',
          language: 'en',
          dateFormat: 'DD/MM/YYYY',
          timeFormat: '24h'
        },
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      };

      const mockTokens = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token'
      };

      const response: ApiResponse<AdminAuthResponse> = {
        success: true,
        data: {
          admin: mockAdmin,
          tokens: mockTokens
        }
      };

      // Store auth data using unified keys
      localStorage.setItem('authToken', mockTokens.accessToken);
      localStorage.setItem('refreshToken', mockTokens.refreshToken);
      localStorage.setItem('user', JSON.stringify(mockAdmin));

      return response;
    }

    const response = await apiService.post<AdminAuthResponse>('/admin/login', credentials);

    if (response.success && response.data) {
      // Store auth data using unified keys
      localStorage.setItem('authToken', response.data.tokens.accessToken);
      localStorage.setItem('refreshToken', response.data.tokens.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.data.admin));
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
      // Clear local storage using both unified and old keys for safety during transition
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminRefreshToken');
      localStorage.removeItem('admin');
    }
  },

  // Get dashboard data
  getDashboard: async (dateRange?: { startDate?: string; endDate?: string }): Promise<ApiResponse<DashboardData>> => {
    if (USE_MOCK_DATA) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return {
        success: true,
        data: {
          overview: mockDashboardData.overview,
          recentBookings: [],
          upcomingEvents: [],
          statistics: {
            bookingsByStatus: [
              { status: 'pending', count: 1 },
              { status: 'approved', count: 2 },
              { status: 'in_progress', count: 1 },
              { status: 'completed', count: 1 },
              { status: 'cancelled', count: 1 },
              { status: 'modifications-requested', count: 1 }
            ],
            bookingsByEventType: [
              { eventType: 'wedding', count: 2 },
              { eventType: 'birthday', count: 2 },
              { eventType: 'anniversary', count: 1 },
              { eventType: 'corporate', count: 1 },
              { eventType: 'other', count: 1 }
            ],
            monthlyBookings: [
              { month: 'Feb 2024', count: 3, revenue: 250000 },
              { month: 'Mar 2024', count: 4, revenue: 286000 }
            ]
          }
        }
      };
    }

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
    const token = localStorage.getItem('authToken');
    const userStr = localStorage.getItem('user');
    if (!token || !userStr) return false;
    try {
      const user = JSON.parse(userStr);
      return user.role === 'admin' || user.role === 'super_admin' || user.role === 'manager';
    } catch {
      return false;
    }
  },

  // Get current admin from localStorage
  getCurrentAdmin: (): Admin | null => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.role === 'admin' || user.role === 'super_admin' || user.role === 'manager') {
          return user as Admin;
        }
      } catch (error) {
        console.error('Error parsing admin data:', error);
      }
    }
    return null;
  },

  // Get admin token
  getToken: (): string | null => {
    return localStorage.getItem('authToken');
  },
};

export default adminService;