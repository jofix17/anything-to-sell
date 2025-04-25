import { Cart } from "./cart";

export type UserRole = "admin" | "vendor" | "buyer";
export type UserStatus = "active" | "inactive" | "suspended";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  role: "buyer" | "vendor" | "admin";
  phone: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
  status: string;
  cart?: Cart;
}

export interface AuthStateType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  userDataLoaded: boolean;
}

export interface AuthContextType extends AuthStateType {
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => void;
  updateProfile: (profileData: ProfileData) => Promise<boolean>;
  changePassword: (passwordData: PasswordData) => Promise<boolean>;
  forgotPassword: (email: string) => Promise<boolean>;
  resetPassword: (token: string, newPassword: string) => Promise<boolean>;
}

export interface RegisterData {
  email: string;
  password: string;
  passwordConfirmation: string;
  firstName: string;
  lastName: string;
  role?: "buyer" | "vendor";
  phone?: string;
}

export interface ProfileData {
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface PasswordData {
  currentPassword: string;
  newPassword: string;
  passwordConfirmation: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterResponse {
  token: string;
  user: User;
}

export interface ResetPasswordParams {
  token: string;
  password: string;
  passwordConfirmation: string;
}
