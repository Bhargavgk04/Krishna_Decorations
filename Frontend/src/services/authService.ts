import { apiService, ApiResponse } from './api';

// Types
export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  isEmailVerified: boolean;
  role: 'user' | 'admin';
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  phone?: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ProfileUpdateData {
  name?: string;
  phone?: string;
  email?: string;
}

// Auth Service
export const authService = {
  // Register new user
  register: async (userData: RegisterData): Promise<ApiResponse<AuthResponse>> => {
    // Remove confirmPassword field before sending to backend
    const { confirmPassword, ...dataToSend } = userData;
    
    const response = await apiService.post<AuthResponse>('/auth/register', dataToSend);
    
    if (response.success && response.data) {
      // Store auth data
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response;
  },

  // Login user
  login: async (credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> => {
    const response = await apiService.post<AuthResponse>('/auth/login', credentials);
    
    if (response.success && response.data) {
      // Store auth data
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response;
  },

  // Logout user
  logout: async (): Promise<void> => {
    try {
      await apiService.post('/auth/logout');
    } catch (error) {
      // Continue with logout even if API call fails
      console.warn('Logout API call failed:', error);
    } finally {
      // Clear local storage
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  },

  // Get current user profile
  getProfile: async (): Promise<ApiResponse<User>> => {
    return await apiService.get<User>('/auth/profile');
  },

  // Update user profile
  updateProfile: async (profileData: ProfileUpdateData): Promise<ApiResponse<User>> => {
    const response = await apiService.put<User>('/auth/profile', profileData);
    
    if (response.success && response.data) {
      // Update stored user data
      localStorage.setItem('user', JSON.stringify(response.data));
    }
    
    return response;
  },

  // Change password
  changePassword: async (passwordData: PasswordChangeData): Promise<ApiResponse> => {
    return await apiService.post('/auth/change-password', passwordData);
  },

  // Request password reset
  forgotPassword: async (email: string): Promise<ApiResponse> => {
    return await apiService.post('/auth/forgot-password', { email });
  },

  // Reset password
  resetPassword: async (token: string, password: string, confirmPassword: string): Promise<ApiResponse> => {
    return await apiService.post('/auth/reset-password', {
      token,
      password,
      confirmPassword,
    });
  },

  // Verify email
  verifyEmail: async (token: string): Promise<ApiResponse> => {
    return await apiService.get(`/auth/verify-email/${token}`);
  },

  // Resend email verification
  resendEmailVerification: async (email: string): Promise<ApiResponse> => {
    return await apiService.post('/auth/resend-verification', { email });
  },

  // Refresh token
  refreshToken: async (): Promise<ApiResponse<AuthResponse>> => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await apiService.post<AuthResponse>('/auth/refresh-token', {
      refreshToken,
    });

    if (response.success && response.data) {
      // Update stored tokens
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }

    return response;
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('user');
    return !!(token && user);
  },

  // Get current user from localStorage
  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (error) {
        console.error('Error parsing user data:', error);
        return null;
      }
    }
    return null;
  },

  // Get auth token
  getToken: (): string | null => {
    return localStorage.getItem('authToken');
  },
};

export default authService;