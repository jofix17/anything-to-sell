import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthState } from '../types';
import authService from '../services/authService';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (userData: {
    email: string;
    password: string;
    passwordConfirmation: string;
    firstName: string;
    lastName: string;
    role: 'buyer' | 'vendor';
  }) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
  isAdmin: () => boolean;
  isVendor: () => boolean;
  isBuyer: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: localStorage.getItem('token'),
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // Load user on initial mount or when token changes
  useEffect(() => {
    const loadUser = async () => {
      if (!authState.token) {
        setAuthState(prevState => ({
          ...prevState,
          isLoading: false,
          isAuthenticated: false,
        }));
        return;
      }

      try {
        const user = await authService.getCurrentUser();
        setAuthState({
          user,
          token: authState.token,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        console.error('Error loading user:', error);
        // Clear localStorage on error (token might be invalid)
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        setAuthState({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: 'Authentication failed. Please login again.',
        });
      }
    };

    loadUser();
  }, [authState.token]);

  // Login user
  const login = async (email: string, password: string) => {
    try {
      setAuthState(prevState => ({
        ...prevState,
        isLoading: true,
        error: null,
      }));

      const { user, token } = await authService.login({ email, password });

      setAuthState({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setAuthState(prevState => ({
        ...prevState,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Login failed',
      }));
      throw error;
    }
  };

  // Register user
  const register = async (userData: {
    email: string;
    password: string;
    passwordConfirmation: string;
    firstName: string;
    lastName: string;
    role: 'buyer' | 'vendor';
  }) => {
    try {
      setAuthState(prevState => ({
        ...prevState,
        isLoading: true,
        error: null,
      }));

      const { user, token } = await authService.register(userData);

      setAuthState({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setAuthState(prevState => ({
        ...prevState,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Registration failed',
      }));
      throw error;
    }
  };

  // Logout user
  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear state and local storage
      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  };

  // Update user profile
  const updateProfile = async (userData: Partial<User>) => {
    try {
      setAuthState(prevState => ({
        ...prevState,
        isLoading: true,
        error: null,
      }));

      const updatedUser = await authService.updateProfile(userData);

      setAuthState(prevState => ({
        ...prevState,
        user: { ...prevState.user!, ...updatedUser },
        isLoading: false,
      }));
    } catch (error) {
      setAuthState(prevState => ({
        ...prevState,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Profile update failed',
      }));
      throw error;
    }
  };

  // Helper functions to check user roles
  const isAdmin = () => authState.user?.role === 'admin';
  const isVendor = () => authState.user?.role === 'vendor';
  const isBuyer = () => authState.user?.role === 'buyer';

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        register,
        logout,
        updateProfile,
        isAdmin,
        isVendor,
        isBuyer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};