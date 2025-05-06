import { User } from "./auth";
import { Category } from "./category";
import { Product } from "./product";

/**
 * Discount code type enum
 */
export enum DiscountType {
  PERCENTAGE = "percentage",
  FIXED_AMOUNT = "fixed_amount",
}

/**
 * Discount code status enum
 */
export enum DiscountStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
}

/**
 * Discount code interface
 */
export interface DiscountCode {
  id: string;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minPurchase: number | null;
  status: DiscountStatus;
  expiresAt: string | null;
  expired: boolean;
  usageCount: number;
  userId: string | null;
  productId: string | null;
  categoryId: string | null;
  createdAt: string;
  updatedAt: string;
  user?: User;
  product?: Product;
  category?: Category;
}

/**
 * Discount code form data interface
 */
export interface DiscountCodeFormData {
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minPurchase?: number | null;
  expiresAt?: string | null;
  status?: DiscountStatus;
  userId?: string | null;
  productId?: string | null;
  categoryId?: string | null;
}

/**
 * Discount code validation params interface
 */
export interface DiscountCodeValidationParams {
  code: string;
  amount?: number;
  productId?: string;
  categoryId?: string;
}

/**
 * Discount code validation result interface
 */
export interface DiscountCodeValidationResult {
  valid: boolean;
  discountCode?: DiscountCode;
  message?: string;
}

/**
 * Discount code application params interface
 */
export interface DiscountCodeApplicationParams {
  amount: number;
  markAsUsed?: boolean;
}

/**
 * Discount code application result interface
 */
export interface DiscountCodeApplicationResult {
  originalAmount: number;
  discountedAmount: number;
  discountAmount: number;
  discountCode: DiscountCode;
}
