import { apiService } from './api';

// Admin Service
export const adminService = {
  // Admin authentication
  login: async (credentials) => {
    try {
      const response = await apiService.post('/auth/login', credentials);
      
      console.log('Login response:', response); // Debug log
      
      if (response.success && response.data) {
        // Store auth data
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        console.log('Stored user:', response.data.user); // Debug log
        console.log('Stored token:', response.data.token); // Debug log
      }
      
      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  // Admin logout
  logout: async () => {
    try {
      // No logout endpoint needed for JWT
    } catch (error) {
      console.warn('Admin logout API call failed:', error);
    } finally {
      // Clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  // Get dashboard data (using booking stats)
  getDashboard: async (dateRange = {}) => {
    const params = new URLSearchParams();
    if (dateRange.startDate) params.append('startDate', dateRange.startDate);
    if (dateRange.endDate) params.append('endDate', dateRange.endDate);
    
    const queryString = params.toString();
    const url = queryString ? `/bookings/statistics?${queryString}` : '/bookings/statistics';
    
    const response = await apiService.get(url);
    
    // Transform the response to match expected format
    if (response.success) {
      return {
        success: true,
        data: {
          overview: {
            totalBookings: response.data.totalBookings || 0,
            pendingBookings: response.data.statusStats?.find(s => s._id === 'pending')?.count || 0,
            totalRevenue: response.data.monthlyStats?.reduce((sum, month) => sum + (month.revenue || 0), 0) || 0,
            activeUsers: response.data.totalBookings || 0 // Approximate
          }
        }
      };
    }
    
    return response;
  },

  // Get admin profile
  getProfile: async () => {
    return await apiService.get('/auth/profile');
  },

  // Update admin profile
  updateProfile: async (profileData) => {
    const response = await apiService.patch('/auth/profile', profileData);
    
    if (response.success && response.data) {
      // Update stored user data
      localStorage.setItem('user', JSON.stringify(response.data));
    }
    
    return response;
  },

  // Change admin password
  changePassword: async (passwordData) => {
    return await apiService.patch('/auth/change-password', passwordData);
  },

  // Get all users (admin only)
  getAllUsers: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.role) params.append('role', filters.role);
    
    const queryString = params.toString();
    const url = queryString ? `/auth/users?${queryString}` : '/auth/users';
    
    return await apiService.get(url);
  },

  // Update user role
  updateUserRole: async (userId, role) => {
    return await apiService.patch(`/auth/users/${userId}/role`, { role });
  },

  // Toggle user status
  toggleUserStatus: async (userId) => {
    return await apiService.patch(`/auth/users/${userId}/status`);
  },

  // Check if admin is authenticated
  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (!token || !user) return false;
    
    try {
      const userData = JSON.parse(user);
      return userData.role === 'admin';
    } catch {
      return false;
    }
  },

  // Get current admin from localStorage
  getCurrentAdmin: () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return user.role === 'admin' ? user : null;
      } catch (error) {
        console.error('Error parsing user data:', error);
        return null;
      }
    }
    return null;
  },

  // Get admin token
  getToken: () => {
    return localStorage.getItem('token');
  },
};

export default adminService;