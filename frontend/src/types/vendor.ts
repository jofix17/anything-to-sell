import { OrderStatus } from "./order";

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