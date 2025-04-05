import apiService from './api';
import { Product, ApiResponse } from '../types';

// WishlistItem interface
export interface WishlistItem {
  id: string;
  productId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  product: Product;
}

class WishlistService {
  // Get all items in the user's wishlist
  async getWishlist(): Promise<WishlistItem[]> {
    const response = await apiService.get<ApiResponse<WishlistItem[]>>('/wishlist');
    return response.data;
  }
  
  // Add a product to the wishlist
  async addToWishlist(productId: string): Promise<WishlistItem> {
    const response = await apiService.post<ApiResponse<WishlistItem>>('/wishlist', { productId });
    return response.data;
  }
  
  // Remove an item from the wishlist
  async removeFromWishlist(wishlistItemId: string): Promise<void> {
    await apiService.delete<ApiResponse<null>>(`/wishlist/${wishlistItemId}`);
  }
  
  // Check if a product is in the wishlist
  async isProductInWishlist(productId: string): Promise<boolean> {
    const response = await apiService.get<ApiResponse<{ exists: boolean }>>(`/wishlist/check/${productId}`);
    return response.data.exists;
  }
  
  // Toggle wishlist status (add if not in wishlist, remove if already in wishlist)
  async toggleWishlist(productId: string): Promise<{ added: boolean; item?: WishlistItem }> {
    const response = await apiService.post<ApiResponse<{ added: boolean; item?: WishlistItem }>>('/wishlist/toggle', { productId });
    return response.data;
  }
}

const wishlistService = new WishlistService();
export default wishlistService;