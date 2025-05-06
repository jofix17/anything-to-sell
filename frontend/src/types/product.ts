import { SalesAnalytics } from "./analytics";
import { User } from "./auth";
import { Category } from "./category";
import { ReviewSummary } from "./review";

export type ProductStatus = "active" | "inactive" | "pending" | "rejected";
export type ProductSortType = "price_asc" | "price_desc" | "newest" | "top_rated";
export type ProductTabType = "description" | "specifications" | "reviews";

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  price: string;
  salePrice?: string; // matches Rails sale_price
  category: Category;
  vendor: User;
  images: ProductImage[];
  tags: string[];
  isActive: boolean; // matches Rails is_active
  isApproved: boolean; // matches Rails is_approved
  inStock: boolean; // matches Rails in_stock
  inventory: number;
  updatedAt: string; // matches Rails updated_at
  createdAt: string; // matches Rails created_at
  status: ProductStatus;
  rejectionReason?: string; // matches Rails rejection_reason
  reviewSummary: ReviewSummary;
  salesAnalytics: SalesAnalytics;
}

export interface ProductImage {
  id?: string;
  productId?: string; // matches Rails product_id
  imageUrl: string; // matches Rails image_url
  isPrimary?: boolean; // matches Rails is_primary
  createdAt?: string; // matches Rails created_at
  updatedAt?: string; // matches Rails updated_at
}

export interface ProductFilterParams {
  categoryId?: string; // matches Rails category_id
  vendorId?: string; // matches Rails vendor_id
  minPrice?: number; // matches Rails min_price
  maxPrice?: number; // matches Rails max_price
  query?: string;
  onSale?: boolean; // matches Rails on_sale
  inStock?: boolean; // matches Rails in_stock
  sortBy?: ProductSortType; // matches Rails sort_by
  page?: number;
  perPage?: number; // matches Rails per_page
  [key: string]: unknown;
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

export interface PendingCountResponse {
  count: number;
}

export interface RejectProductParams {
  id: string;
  rejectionReason?: string;
}
