import { Address } from "./address";
import { User } from "./auth";
import { Product } from "./product";

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

// Order filter parameters interface
export interface OrderFilterParams {
  status?: OrderStatus;
  paymentStatus?: string;
  userId?: string;
  vendorId?: string;
  startDate?: string;
  endDate?: string;
  query?: string;
  page?: number;
  perPage?: number;
  [key: string]: unknown;
}

// Interface for updating order status
export interface UpdateOrderStatusParams {
  id: string;
  status: OrderStatus;
  comment?: string;
}
