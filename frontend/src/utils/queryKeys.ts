import { QueryFilters } from '../types/query';

/**
 * Centralized query key definitions for React Query
 * This helps maintain consistency across the application and makes it
 * easier to invalidate related queries when data changes
 */

export const QueryKeys = {
  // Auth related queries
  auth: {
    currentUser: ['auth', 'currentUser'],
    profile: ['auth', 'profile'],
  },
  
  // Product related queries
  products: {
    all: ['products'],
    list: (filters: QueryFilters = {}) => ['products', 'list', filters],
    detail: (id: string) => ['products', 'detail', id],
    featured: ['products', 'featured'],
    newArrivals: ['products', 'newArrivals'],
    related: (id: string) => ['products', 'related', id],
    search: (query: string) => ['products', 'search', query],
    byCategory: (categoryId: string) => ['products', 'category', categoryId],
    byVendor: (vendorId: string) => ['products', 'vendor', vendorId],
    reviews: (productId: string) => ['products', 'reviews', productId],
  },
  
  // Category related queries
  categories: {
    all: ['categories'],
    detail: (id: string) => ['categories', 'detail', id],
  },
  
  // Cart related queries
  cart: {
    current: ['cart'],
    items: ['cart', 'items'],
  },
  
  // Order related queries
  orders: {
    all: ['orders'],
    detail: (id: string) => ['orders', 'detail', id],
    byStatus: (status: string) => ['orders', 'status', status],
  },
  
  // User related queries
  user: {
    addresses: ['user', 'addresses'],
    wishlist: ['user', 'wishlist'],
  },
  
  // Vendor related queries
  vendor: {
    store: ['vendor', 'store'],
    products: (filters: QueryFilters = {}) => ['vendor', 'products', filters],
    orders: (filters: QueryFilters = {}) => ['vendor', 'orders', filters],
    dashboard: ['vendor', 'dashboard'],
    salesReport: (params: QueryFilters = {}) => ['vendor', 'salesReport', params],
  },
  
  // Admin related queries
  admin: {
    users: (filters: QueryFilters = {}) => ['admin', 'users', filters],
    products: (filters: QueryFilters = {}) => ['admin', 'products', filters],
    categories: ['admin', 'categories'],
    orders: (filters: QueryFilters = {}) => ['admin', 'orders', filters],
    discounts: ['admin', 'discounts'],
    dashboard: ['admin', 'dashboard'],
  },
  
  // Support related queries
  support: {
    conversations: (status?: string) => ['support', 'conversations', status],
    messages: (conversationId: string) => ['support', 'messages', conversationId],
  },
};