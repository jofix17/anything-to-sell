// User types
export type UserRole = "admin" | "vendor" | "buyer";
export type DateRange = "7days" | "30days" | "90days" | "year";
export type UserStatus = "active" | "inactive" | "suspended";

export interface User {
  id: string;
  email: string;
  firstName: string; // matches Rails first_name
  lastName: string; // matches Rails last_name
  name: string;
  role: UserRole;
  phone: string;
  avatarUrl?: string; // matches Rails avatar_url
  isActive: boolean; // matches Rails is_active
  createdAt: string; // matches Rails created_at
  updatedAt: string; // matches Rails updated_at
  lastLoginAt?: string; // matches Rails last_login_at
  status: UserStatus;
  suspensionReason?: string;
}

export interface UserCreateInput {
  name: string;
  email: string;
  password: string;
  role?: string;
}

export interface UserUpdateInput {
  name?: string;
  email?: string;
  role?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Auth service interfaces
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  passwordConfirmation: string; // matches Rails password_confirmation
  firstName: string; // matches Rails first_name
  lastName: string; // matches Rails last_name
  role: "buyer" | "vendor";
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface PasswordChangeData {
  currentPassword: string; // matches Rails current_password
  newPassword: string; // matches Rails new_password
  passwordConfirmation: string; // matches Rails password_confirmation
}

export interface PasswordResetData {
  token: string;
  password: string;
  passwordConfirmation: string; // matches Rails password_confirmation
}

// Category types
export interface Category {
  id: string;
  name: string;
  description?: string;
  slug: string;
  parentId: string | null; // matches Rails parent_id
  imageUrl?: string; // matches Rails image_url
  createdAt: string; // matches Rails created_at
  updatedAt: string; // matches Rails updated_at
  children?: Category[];
}

export interface CategoryCreateData {
  name: string;
  description?: string;
  parentId: string | null; // matches Rails parent_id
  imageFile?: File; // matches Rails image_file
}

// Product types
export type ProductStatus = "active" | "inactive" | "pending" | "rejected";
export type ProductSortType = "price_asc" | "price_desc" | "newest" | "popular";

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  price: number;
  salePrice?: number; // matches Rails sale_price
  category: Category;
  vendor: User;
  images: ProductImage[];
  tags: string[];
  isActive: boolean; // matches Rails is_active
  isApproved: boolean; // matches Rails is_approved
  inventory: number;
  updatedAt: string; // matches Rails updated_at
  createdAt: string; // matches Rails created_at
  status: ProductStatus;
  rejectionReason?: string; // matches Rails rejection_reason
  reviewSummary: ReviewSummary;
  salesAnalytics: SalesAnalytics;
}

export interface ReviewSummary {
  rating: number;
  reviewCount: number; // matches Rails review_count
  reviews: Review[];
}

export interface SalesAnalytics {
  quantitySold: number; // matches Rails quantity_sold
  totalRevenue: number; // matches Rails total_revenue
}

export interface ProductImage {
  id?: string;
  productId?: string; // matches Rails product_id
  imageUrl: string; // matches Rails image_url
  isPrimary?: boolean; // matches Rails is_primary
  createdAt?: string; // matches Rails created_at
  updatedAt?: string; // matches Rails updated_at
}

export interface Review {
  id: string;
  productId: string; // matches Rails product_id
  userid: string;
  user?: User;
  rating: number;
  comment: string;
  createdAt: string; // matches Rails created_at
  updatedAt: string; // matches Rails updated_at
}

export interface ProductFilterParams {
  categoryId?: number; // matches Rails category_id
  vendorId?: number; // matches Rails vendor_id
  minPrice?: number; // matches Rails min_price
  maxPrice?: number; // matches Rails max_price
  query?: string;
  onSale?: boolean; // matches Rails on_sale
  inStock?: boolean; // matches Rails in_stock
  sortBy?: ProductSortType; // matches Rails sort_by
  page?: number;
  perPage?: number; // matches Rails per_page
}

export interface ReviewCreateData {
  productId: string; // matches Rails product_id
  rating: number;
  comment: string;
}

// Store settings
export interface StoreSettings {
  id: string;
  name: string;
  description: string;
  logoUrl: string; // matches Rails logo_url
  bannerUrl: string; // matches Rails banner_url
  contactEmail: string; // matches Rails contact_email
  contactPhone: string; // matches Rails contact_phone
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string; // matches Rails postal_code
  createdAt: string; // matches Rails created_at
  updatedAt: string; // matches Rails updated_at
}

// Cart and Order types
export interface CartItem {
  id: string;
  productId: string; // matches Rails product_id
  product: Product;
  quantity: number;
  price: number;
}

export interface Cart {
  id: string;
  userId: string; // matches Rails user_id
  items: CartItem[];
  totalItems: number; // matches Rails total_items
  totalPrice: number; // matches Rails total_price
  shippingCost: number; // matches Rails shipping_cost
  taxAmount: number; // matches Rails tax_amount
}

export interface AddToCartData {
  productId: string; // matches Rails product_id
  quantity: number;
}

export interface UpdateCartItemData {
  cartItemId: string; // matches Rails cart_item_id
  quantity: number;
}

export interface CreateOrderData {
  shippingAddressId: string; // matches Rails shipping_address_id
  billingAddressId: string; // matches Rails billing_address_id
  paymentMethodId: string; // matches Rails payment_method_id
}

export type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";
export type OrderPaymentStatus = "pending" | "paid" | "failed";

export interface Order {
  id: string;
  orderNumber: string; // matches Rails order_number
  userId: string; // matches Rails user_id
  user?: User;
  items: OrderItem[];
  status: OrderStatus;
  shippingAddress: Address; // matches Rails shipping_address
  billingAddress: Address; // matches Rails billing_address
  paymentMethod: string; // matches Rails payment_method
  paymentDate: string; // matches Rails payment_date
  paymentStatus: OrderPaymentStatus; // matches Rails payment_status
  totalAmount: number; // matches Rails total_amount
  createdAt: string; // matches Rails created_at
  updatedAt: string; // matches Rails updated_at
  subtotalAmount: number; // matches Rails subtotal_amount
  shippingCost: number; // matches Rails shipping_cost
  taxAmount: number; // matches Rails tax_amount
  vendorId: string; // matches Rails vendor_id
  notes?: string;
  trackingNumber?: string; // matches Rails tracking_number
  trackingUrl?: string; // matches Rails tracking_url
}

export interface OrderItem {
  id: string;
  orderId: string; // matches Rails order_id
  productId: string; // matches Rails product_id
  product?: Product;
  quantity: number;
  price: number;
  vendorId: string; // matches Rails vendor_id
}

export interface Address {
  id: string;
  userId: string; // matches Rails user_id
  fullName: string; // matches Rails full_name
  addressLine1: string; // matches Rails address_line1
  addressLine2?: string; // matches Rails address_line2
  city: string;
  state: string;
  postalCode: string; // matches Rails postal_code
  country: string;
  phoneNumber: string; // matches Rails phone_number
  isDefault: boolean; // matches Rails is_default
}

// Chat types
export interface Message {
  id: string;
  senderId: string; // matches Rails sender_id
  sender?: User;
  receiverId: string; // matches Rails receiver_id
  receiver?: User;
  content: string;
  isRead: boolean; // matches Rails is_read
  createdAt: string; // matches Rails created_at
}

export interface Conversation {
  id: string;
  userId: string; // matches Rails user_id
  participants: User[];
  lastMessage?: Message;
  unreadCount: number; // matches Rails unread_count
  updatedAt: string; // matches Rails updated_at
  subject: string;
  status: "open" | "closed" | "archived";
}

// Event types
export interface DiscountEvent {
  id: string;
  name: string;
  description: string;
  discountPercentage: number; // matches Rails discount_percentage
  startDate: string; // matches Rails start_date
  endDate: string; // matches Rails end_date
  isActive: boolean; // matches Rails is_active
  appliesTo: "all" | "category" | "products";
  categoryIds?: number[]; // matches Rails category_ids
  productIds?: number[]; // matches Rails product_ids
  createdAt: string; // matches Rails created_at
  updatedAt: string; // matches Rails updated_at
}

export interface DiscountEventData {
  name: string;
  description: string;
  discountPercentage: number; // matches Rails discount_percentage
  startDate: string; // matches Rails start_date
  endDate: string; // matches Rails end_date
  isActive: boolean; // matches Rails is_active
  appliesTo: "all" | "category" | "products";
  categoryIds?: string[]; // matches Rails category_ids
  productIds?: string[]; // matches Rails product_ids
}

// Vendor types
export interface VendorStoreData {
  name: string;
  description: string;
  logoFile: File; // matches Rails logo_file
  bannerFile: File; // matches Rails banner_file
  contactEmail?: string; // matches Rails contact_email
  contactPhone?: string; // matches Rails contact_phone
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string; // matches Rails postal_code
}

export interface InventoryUpdateData {
  productId: string; // matches Rails product_id
  inventory: number;
}

export interface SalesReportParams {
  startDate?: string; // matches Rails start_date
  endDate?: string; // matches Rails end_date
  groupBy?: "day" | "week" | "month"; // matches Rails group_by
}

export interface StoreDetails {
  id: string;
  name: string;
  description: string;
  logoUrl: string; // matches Rails logo_url
  bannerUrl: string; // matches Rails banner_url
  contactEmail: string; // matches Rails contact_email
  contactPhone: string; // matches Rails contact_phone
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string; // matches Rails postal_code
  createdAt: string; // matches Rails created_at
  updatedAt: string; // matches Rails updated_at
}

export interface VendorOrderParams {
  page?: number;
  perPage?: number; // matches Rails per_page
  status?: OrderStatus;
  startDate?: string; // matches Rails start_date
  endDate?: string; // matches Rails end_date
}

export interface SalesReport {
  totalSales: number; // matches Rails total_sales
  totalRevenue: number; // matches Rails total_revenue
  salesByPeriod: { period: string; sales: number; revenue: number }[]; // matches Rails sales_by_period
  salesByCategory: { category: string; sales: number; revenue: number }[]; // matches Rails sales_by_category
}

export interface ProductPerformance {
  totalSales: number; // matches Rails total_sales
  totalRevenue: number; // matches Rails total_revenue
  salesByPeriod: { period: string; sales: number; revenue: number }[]; // matches Rails sales_by_period
  averageRating: number; // matches Rails average_rating
  views: number;
  conversionRate: number; // matches Rails conversion_rate
}

export interface PaymentHistoryParams {
  page?: number;
  perPage?: number; // matches Rails per_page
  startDate?: string; // matches Rails start_date
  endDate?: string; // matches Rails end_date
}

export interface PaymentHistoryItem {
  id: string;
  amount: number;
  status: "pending" | "paid" | "failed";
  createdAt: string; // matches Rails created_at
}

export interface PaymentDetails {
  id: string;
  amount: number;
  fee: number;
  netAmount: number; // matches Rails net_amount
  orders: { id: string; amount: number }[];
  status: "pending" | "paid" | "failed";
  paidAt: string; // matches Rails paid_at
  createdAt: string; // matches Rails created_at
}

// Admin types
export interface UserFilterParams {
  role?: UserRole | string;
  isActive?: boolean; // matches Rails is_active
  query?: string;
  page?: number;
  perPage?: number; // matches Rails per_page
  [key: string]: unknown;
}

export interface ProductApprovalParams {
  status?: "pending" | "approved" | "rejected";
  vendorId?: number; // matches Rails vendor_id
  categoryId?: number; // matches Rails category_id
  page?: number;
  perPage?: number; // matches Rails per_page
}

export interface VendorDashboardStats {
  totalSales: number; // matches Rails total_sales
  totalOrders: number; // matches Rails total_orders
  pendingOrders: number; // matches Rails pending_orders
  totalProducts: number; // matches Rails total_products
  lowStockProducts: number; // matches Rails low_stock_products
  averageRating: number; // matches Rails average_rating
  monthlyRevenue: {
    month: string;
    revenue: number;
    orders: number;
  }[]; // matches Rails monthly_revenue
  topProducts: Partial<Product>[]; // matches Rails top_products
  recentOrders: Order[]; // matches Rails recent_orders
}

export interface AdminDashboardStats {
  totalRevenue: number; // matches Rails total_revenue
  totalOrders: number; // matches Rails total_orders
  totalUsers: number; // matches Rails total_users
  totalProducts: number; // matches Rails total_products
  pendingApprovals: number; // matches Rails pending_approvals
  revenueByMonth: {
    month: string;
    revenue: number;
  }[]; // matches Rails revenue_by_month
  ordersByStatus: {
    status: string;
    count: number;
  }[]; // matches Rails orders_by_status
  recentUsers: Pick<
    User,
    "id" | "name" | "email" | "role" | "status" | "avatarUrl" | "createdAt"
  >[]; // matches Rails recent_users
  pendingProducts: Pick<
    Product,
    "id" | "name" | "price" | "createdAt" | "category" | "vendor" | "images"
  >[]; // matches Rails pending_products
}

// Wishlist types
export interface WishlistItem {
  id: string;
  productId: string; // matches Rails product_id
  userId: string; // matches Rails user_id
  createdAt: string; // matches Rails created_at
  updatedAt: string; // matches Rails updated_at
  product: Product;
}

export interface ProductCreateData {
  name: string;
  description: string;
  price: number;
  salePrice?: number; // matches Rails sale_price
  categoryId: number; // matches Rails category_id
  tags?: string[];
  inventory: number;
  isActive: boolean; // matches Rails is_active
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
