import { QueryFilters } from '../types/query';

/**
 * Centralized query key definitions for React Query
 * Enables consistent cache management across the application
 */
export const QueryKeys = {
  auth: {
    currentUser: ['auth', 'currentUser'],
    sessions: ['auth', 'sessions'],
  },
  user: {
    profile: ['user', 'profile'],
    addresses: ['user', 'addresses'],
    wishlist: ['user', 'wishlist'],
  },
  products: {
    all: ['products'],
    list: (filters: QueryFilters) => ['products', 'list', filters],
    detail: (id: string) => ['products', 'detail', id],
    reviews: (productId: string) => ['products', 'reviews', productId],
    featured: ['products', 'featured'],
    newArrivals: ['products', 'newArrivals'],
    related: (productId: string) => ['products', 'related', productId],
  },
  categories: {
    all: ['categories'],
    detail: (id: string) => ['categories', 'detail', id],
  },
  cart: {
    current: ['cart'],
    items: ['cart', 'items'],
  },
  orders: {
    all: ['orders'],
    detail: (id: string) => ['orders', 'detail', id],
  },
  vendor: {
    store: ['vendor', 'store'],
    products: (filters: QueryFilters) => ['vendor', 'products', filters],
    orders: (filters: QueryFilters) => ['vendor', 'orders', filters],
    dashboard: ['vendor', 'dashboard'],
    salesReport: (params: QueryFilters) => ['vendor', 'salesReport', params],
  },
  admin: {
    dashboard: ['admin', 'dashboard'],
    users: (params: QueryFilters) => ['admin', 'users', params],
    products: (params: QueryFilters) => ['admin', 'products', params],
    orders: (params: QueryFilters) => ['admin', 'orders', params],
    vendors: (params: QueryFilters) => ['admin', 'vendors', params],
    discounts: ['admin', 'discounts'],
  },
  support: {
    conversations: (status?: string) => ['support', 'conversations', status],
    messages: (conversationId: string) => ['support', 'messages', conversationId],
  },
};