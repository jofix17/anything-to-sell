import { User, UserRole } from "./auth";
import { Order } from "./order";
import { Product } from "./product";

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
