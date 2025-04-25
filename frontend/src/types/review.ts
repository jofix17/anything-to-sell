import { User } from "./auth";

export type SortType = "newest" | "highest" | "lowest" | "mostHelpful";

export interface Review {
  id: string;
  productId: string; // matches Rails product_id
  user: User;
  rating: number;
  comment: string;
  createdAt: string; // matches Rails created_at
  updatedAt: string; // matches Rails updated_at
}

export interface ReviewSummary {
  rating: number;
  reviewCount: number; // matches Rails review_count
  reviews: Review[];
}

export interface ReviewCreateData {
  productId: string; // matches Rails product_id
  rating: number;
  comment: string;
}

export interface RatingSummary {
  average: number;
  totalCount: number;
  distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}
