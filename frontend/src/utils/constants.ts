// src/utils/constants.ts

// API Endpoints
export const AUTH_ENDPOINTS = {
  LOGIN: "/auth/login",
  REGISTER: "/auth/register",
  ME: "/auth/me",
  LOGOUT: "/auth/logout",
  UPDATE_PROFILE: "/auth/profile",
  CHANGE_PASSWORD: "/auth/change-password",
  FORGOT_PASSWORD: "/auth/forgot-password",
  RESET_PASSWORD: "/auth/reset-password",
};

export const CART_ENDPOINTS = {
  CART: "/cart",
  ITEMS: "/cart/items",
  CLEAR: "/cart/clear",
  CHECK_GUEST_CART: "/cart/check-guest-cart",
  CHECK_USER_CART: "/cart/check-existing-cart",
  TRANSFER_CART: "/cart/transfer-cart",
};

// Storage keys
export const STORAGE_KEYS = {
  TOKEN: "token",
  USER_DATA: "user_data",
  AUTH_STATE_CHANGE: "auth_state_changed",
  LOGIN_COMPLETED_TIMESTAMP: "login_completed_timestamp",
};

// Cache configuration
export const CACHE_CONFIG = {
  // Common stale times (in milliseconds)
  STALE_TIMES: {
    SHORT: 30 * 1000,         // 30 seconds
    STANDARD: 60 * 1000,      // 1 minute
    MEDIUM: 5 * 60 * 1000,    // 5 minutes
    LONG: 15 * 60 * 1000,     // 15 minutes
    EXTENDED: 30 * 60 * 1000, // 30 minutes
  },
  
  // Time windows
  TIME_WINDOWS: {
    LOGIN_COMPLETION_WINDOW: 5000, // 5 seconds
    CART_STALE_TIME: 10000,        // 10 seconds
  },
  
  // Retry configuration
  RETRY: {
    AUTH: 1,
    CART: 2,
    NORMAL: 3,
  },
};