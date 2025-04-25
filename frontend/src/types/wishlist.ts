import { Product } from "./product";

// Wishlist types
export interface WishlistItem {
  id: string;
  productId: string; // matches Rails product_id
  userId: string; // matches Rails user_id
  createdAt: string; // matches Rails created_at
  updatedAt: string; // matches Rails updated_at
  product: Product;
}
