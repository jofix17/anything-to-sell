// Frontend Endpoints
export const PUBLIC_ENDPOINTS = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  ABOUT: "/about",
  CONTACT: "/contact",
  CATEGORY: {
    ALL: "/categories",
    DETAIL: (id: string) => `/categories/${id}`,
  },
  PRODUCT: {
    ALL: "/products",
    FILTER_BY_CATEGORY: (id: string) => `/products?category=${id}`,
  },
};

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

export const CATEGORY_ENDPOINTS = {
  CATEGORIES: "/categories",
  CATEGORY: (id: string) => `/categories/${id}`,
};

export const PRODUCT_ENDPOINTS = {
  PRODUCTS: "/products",
  PRODUCT: (id: string) => `/products/${id}`,
  REVIEWS: (id: string) => `/products/${id}/reviews`,
  FEATURED: "/products/featured",
  NEW_ARRIVALS: "/products/new-arrivals",
};

export const ORDER_ENDPOINTS = {
  ORDERS: "/orders",
  ORDER: (id: string) => `/orders/${id}`,
}

export const PAYMENT_ENDPOINTS = {
  CREATE: "/payments",
  CONFIRM: "/payments/confirm"
}

export const REVIEW_ENDPOINTS = {
  REVIEWS: (productId: string) => `/products/${productId}/reviews`,
  REVIEW: (productId: string, reviewId: string) =>
    `/products/${productId}/reviews/${reviewId}`,
  STATS: (productId: string) => `/products/${productId}/reviews/stats`,
  APPROVE: (productId: string, reviewId: string) =>
    `/products/${productId}/reviews/${reviewId}/approve`,
  REJECT: (productId: string, reviewId: string) =>
    `/products/${productId}/reviews/${reviewId}/reject`,
  MARK_HELPFUL: (reviewId: string) => `/reviews/${reviewId}/mark_helpful`,
};

// Discount code API endpoints
export const DISCOUNT_CODE_ENDPOINTS = {
  DISCOUNT_CODES: "/discount_codes",
  DISCOUNT_CODE: (id: string) => `/discount_codes/${id}`,
  VALIDATE: "/discount_codes/validate",
  AVAILABLE: "/discount_codes/list_available",
  APPLY: (id: string) => `/discount_codes/${id}/apply`,
};

// Admin API Endpoints
export const ADMIN_PRODUCT_ENDPOINTS = {
  PRODUCTS: "/admin/products",
  PRODUCT: (id: string) => `/admin/products/${id}`,
  PENDING: "/admin/products/pending",
  PENDING_COUNT: "/admin/products/pending/count",
  APPROVE: (id: string) => `/admin/products/${id}/approve`,
  REJECT: (id: string) => `/admin/products/${id}/reject`,
};

export const ADMIN_ORDER_ENDPOINTS = {
  ORDERS: "/admin/orders",
  ORDER: (id: string) => `/admin/orders/${id}`,
  UPDATE_STATUS: (id: string) => `/admin/orders/${id}/status`,
  DASHBOARD_STATS: "/admin/dashboard/stats",
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
    SHORT: 30 * 1000, // 30 seconds
    STANDARD: 60 * 1000, // 1 minute
    MEDIUM: 5 * 60 * 1000, // 5 minutes
    LONG: 15 * 60 * 1000, // 15 minutes
    EXTENDED: 30 * 60 * 1000, // 30 minutes
  },

  // Time windows
  TIME_WINDOWS: {
    LOGIN_COMPLETION_WINDOW: 5000, // 5 seconds
    CART_STALE_TIME: 10000, // 10 seconds
  },

  // Retry configuration
  RETRY: {
    FALSE: false,
    AUTH: 1,
    CART: 2,
    NORMAL: 3,
  },
};
