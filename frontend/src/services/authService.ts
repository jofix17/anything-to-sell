import apiService from './api';
import { User, ApiResponse } from '../types';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  passwordConfirmation: string;
  firstName: string;
  lastName: string;
  role: 'buyer' | 'vendor';
}

interface AuthResponse {
  user: User;
  token: string;
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiService.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
    
    // Store token and user in local storage
    if (response.data && response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  }
  
  async register(userData: RegisterData): Promise<AuthResponse> {
    const response = await apiService.post<ApiResponse<AuthResponse>>('/auth/register', userData);
    
    // Store token and user in local storage
    if (response.data && response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  }
  
  async logout(): Promise<void> {
    try {
      await apiService.post<ApiResponse<null>>('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local storage regardless of API response
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }
  
  async getCurrentUser(): Promise<User> {
    const response = await apiService.get<ApiResponse<User>>('/auth/me');
    return response.data;
  }
  
  async updateProfile(userData: Partial<User>): Promise<User> {
    const response = await apiService.put<ApiResponse<User>>('/auth/profile', userData);
    
    // Update the stored user data
    if (response.data) {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = { ...currentUser, ...response.data };
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
    
    return response.data;
  }
  
  async changePassword(data: { currentPassword: string; newPassword: string; passwordConfirmation: string }): Promise<void> {
    await apiService.post<ApiResponse<null>>('/auth/change-password', data);
  }
  
  async requestPasswordReset(email: string): Promise<void> {
    await apiService.post<ApiResponse<null>>('/auth/forgot-password', { email });
  }
  
  async resetPassword(data: { token: string; password: string; passwordConfirmation: string }): Promise<void> {
    await apiService.post<ApiResponse<null>>('/auth/reset-password', data);
  }
  
  async verifyEmail(token: string): Promise<void> {
    await apiService.post<ApiResponse<null>>(`/auth/verify-email/${token}`);
  }
  
  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }
  
  getStoredUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr) as User;
    } catch (e) {
      return null;
    }
  }
  
  hasRole(role: string): boolean {
    const user = this.getStoredUser();
    return user ? user.role === role : false;
  }
}

const authService = new AuthService();
export default authService;
