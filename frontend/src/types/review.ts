import { User } from "./auth";
import { Product } from "./product";

export type SortType = "newest" | "highest" | "lowest" | "mostHelpful";
export enum ReviewStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
}

export interface Review {
  id: string;
  userId: string;
  productId: string;
  rating: number;
  comment: string;
  status: ReviewStatus;
  createdAt: string;
  updatedAt: string;
  user?: User;
  product?: Product;
  helpfulCount: number;
  userHasMarkedHelpful?: boolean;
}

export interface ReviewSummary {
  rating: number;
  reviewCount: number; // matches Rails review_count
  reviews: Review[];
}

export interface ReviewFormData {
  rating: number;
  comment: string;
}

export interface ReviewCreateData {
  productId: string; // matches Rails product_id
  rating: number;
  comment: string;
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

export interface MarkHelpfulResponse {
  helpful_count: number;
}

export interface ReviewQueryParams {
  page?: number;
  per_page?: number;
  rating?: number | null;
  sort_by?: string;
  [key: string]: unknown;
}
