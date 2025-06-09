import { Address } from "./address";
import { User } from "./auth";
import { Product } from "./product";

export type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export type OrderPaymentStatus = 
  | "pending" 
  | "paid" 
  | "failed"
  | "refunded"
  | "partially_refunded";

export type OrderPaymentMethod =
  | "cash_on_delivery"
  | "credit_card"
  | "debit_card"
  | "bank_transfer"
  | "paypal"
  | "gcash"
  | "paymaya"
  | "stripe";

export interface Order {
  id: string;
  orderNumber: string;
  user?: User;
  orderItems: OrderItem[];
  status: OrderStatus;
  shippingAddress: Address;
  billingAddress: Address;
  paymentMethod: string;
  paymentMethodType?: OrderPaymentMethod;
  paymentDate: string;
  paymentStatus: OrderPaymentStatus;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  subtotalAmount: number;
  shippingCost: number;
  taxAmount: number;
  processingFee?: number;
  notes?: string;
  trackingNumber?: string;
  trackingUrl?: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productVariantId: string;
  productName: string;
  product?: Product;
  quantity: number;
  price: string;
  subtotal: string;
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

export interface CreateOrderParams {
  shipping_address_id: string;
  billing_address_id: string;
  payment_method: OrderPaymentMethod;
  notes?: string;
  cart_id: string;
}
