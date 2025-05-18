import { SalesAnalytics } from "./analytics";
import { User } from "./auth";
import { Category } from "./category";
import { ReviewSummary } from "./review";

export type ProductStatus = "active" | "inactive" | "pending" | "rejected";
export type ProductSortType =
  | "price_asc"
  | "price_desc"
  | "newest"
  | "top_rated";
export type ProductTabType = "description" | "specifications" | "reviews";

export interface ProperTyValues {
  displayName: string;
  id: string;
  name: string;
  propertyType: string;
  value: string;
}
export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  price: string;
  salePrice?: string;
  category: Category;
  vendor: User;
  primaryImage: ProductImage;
  images?: ProductImage[];
  tags?: string[];
  isActive?: boolean;
  isApproved?: boolean;
  inStock: boolean;
  inventory: number;
  updatedAt?: string;
  createdAt?: string;
  status?: ProductStatus;
  rejectionReason?: string;
  reviewSummary: ReviewSummary;
  salesAnalytics?: SalesAnalytics;
  hasVariants?: boolean;
  propertyValues: {
    [key: string]: ProperTyValues;
  };
  variants: Variant[];
  variantOptions: VariantOptions
}

export interface ProductImage {
  id: string;
  imageUrl: string;
  productId?: string;
  isPrimary?: boolean;
}

export interface ProductFilterParams {
  categoryId?: string;
  vendorId?: string;
  minPrice?: number;
  maxPrice?: number;
  query?: string;
  onSale?: boolean;
  inStock?: boolean;
  sortBy?: ProductSortType;
  page?: number;
  perPage?: number;
  [key: string]: unknown;
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

export interface PendingCountResponse {
  count: number;
}

export interface RejectProductParams {
  id: string;
  rejectionReason?: string;
}

export interface VariantProperty {
  propertyId: string;
  displayName: string;
  propertyType: string;
  values: string[];
  config?: {
    predefined?: string[];
    allowCustom?: boolean;
    options?: string[];
    min?: number;
    max?: number;
    step?: number;
    unit?: string;
  };
}

export interface VariantOptions {
  [key: string]: VariantProperty;
}

export interface Variant {
  id: string;
  sku: string;
  price: string;
  salePrice: string;
  inventory: number;
  isDefault: boolean;
  isActive: boolean;
  properties: {
    [key: string]: string;
  };
  displayTitle: string;
  currentPrice: string;
  discountPercentage: number;
  inStock: boolean;
}
