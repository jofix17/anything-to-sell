// User types
export type UserRole = 'admin' | 'vendor' | 'buyer';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  role: UserRole;
  phone: string;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Product types
export interface Category {
  id: string;
  name: string;
  description?: string;
  slug: string;
  parentId?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export type ProductStatus = 'active' | 'inactive' | 'pending' | 'rejected';

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  price: number;
  salePrice?: number;
  categoryId: string;
  category?: Category;
  vendorId: string;
  vendor?: User;
  images: ProductImage[];
  tags: string[];
  isActive: boolean;
  isApproved: boolean;
  inventory: number;
  rating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
  status: ProductStatus
}

export interface ProductImage {
  id: string;
  productId: string;
  imageUrl: string;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  productId: string;
  userid: string;
  user?: User;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoreSettings {
  id: string;
  name: string;
  description: string;
  logoUrl: string;
  bannerUrl: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  createdAt: string;
  updatedAt: string;
}

// Cart and Order types
export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  price: number;
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  shippingCost: number;
  taxAmount: number;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type OrderPaymentStatus = 'pending' | 'paid' | 'failed';
export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  user?: User;
  items: OrderItem[];
  status: OrderStatus;
  shippingAddress: Address;
  billingAddress: Address;
  paymentMethod: string;
  paymentDate: string;
  paymentStatus: OrderPaymentStatus;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  subtotalAmount: number;
  shippingCost: number;
  taxAmount: number;
  vendorId: string;
  notes?: string;
  trackingNumber?: string;
  trackingUrl?: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  product?: Product;
  quantity: number;
  price: number;
  vendorId: string; // Added vendorId to associate items with vendors
}

export interface Address {
  id: string;
  userId: string;
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phoneNumber: string;
  isDefault: boolean;
}

// Chat types
export interface Message {
  id: string;
  senderId: string;
  sender?: User;
  receiverId: string;
  receiver?: User;
  content: string; 
  isRead: boolean;
  createdAt: string;
}

export interface Conversation {
  id: string;
  userId: string;
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
  updatedAt: string;
  subject: string;
  status: 'open' | 'closed' | 'archived';
}

// Event types
export interface DiscountEvent {
  id: string;
  name: string;
  description: string;
  discountPercentage: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  appliesTo: 'all' | 'category' | 'products';
  categoryIds?: number[];
  productIds?: number[];
  createdAt: string;
  updatedAt: string;
}

// Add missing types for VendorStoreData, InventoryUpdateData, etc.
export interface VendorStoreData {
  name: string;
  description: string;
  logoFile?: File;
  bannerFile?: File;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

export interface InventoryUpdateData {
  productId: string;
  inventory: number;
}

export interface SalesReportParams {
  startDate?: string;
  endDate?: string;
  groupBy?: 'day' | 'week' | 'month';
}

// Add missing types for DiscountEventData
export interface DiscountEventData {
  name: string;
  description: string;
  discountPercentage: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  appliesTo: 'all' | 'category' | 'products';
  categoryIds?: number[];
  productIds?: string[];
}

// API response types
export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface WishlistItem {
  id: string;
  productId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  product: Product;
}

export interface ProductCreateData {
  name: string;
  description: string;
  price: number;
  salePrice?: number;
  categoryId: number;
  tags?: string[];
  inventory: number;
  isActive: boolean;
}

export interface VendorDashboardStats {
  totalSales: number;
  totalOrders: number;
  pendingOrders: number;
  totalProducts: number;
  lowStockProducts: number;
  averageRating: number;
  monthlyRevenue: {
    month: string;
    revenue: number;
    orders: number;
  }[];
  topProducts:Product[];
  recentOrders: Order[];
}

export interface AdminDashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalUsers: number;
  totalProducts: number;
  pendingApprovals: number;
  revenueByMonth: {
    month: string;
    revenue: number;
  }[];
  ordersByStatus: {
    status: string;
    count: number;
  }[];
  recentUsers: User[];
  pendingProducts: Product[];
}
