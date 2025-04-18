import apiService from "./api";
import { ApiResponse, PaginatedResponse, WishlistItem } from "../types";
import queryHooks from "../hooks/useQueryHooks";
import { QueryKeys } from "../utils/queryKeys";

const { useApiQuery, useApiMutation } = queryHooks;

// Traditional API service methods
class WishlistService {
  // Get all items in the user's wishlist
  async getWishlist(): Promise<ApiResponse<PaginatedResponse<WishlistItem>>> {
    return await apiService.get<ApiResponse<PaginatedResponse<WishlistItem>>>(
      "/wishlist_items"
    );
  }

  // Add a product to the wishlist
  async addToWishlist(productId: string): Promise<ApiResponse<WishlistItem>> {
    return await apiService.post<ApiResponse<WishlistItem>>("/wishlist_items", {
      productId,
    });
  }

  // Remove an item from the wishlist
  async removeFromWishlist(wishlistItemId: string): Promise<ApiResponse<null>> {
    return await apiService.delete<ApiResponse<null>>(
      `/wishlist_items/${wishlistItemId}`
    );
  }

  // Check if a product is in the wishlist
  async isProductInWishlist(
    productId: string
  ): Promise<ApiResponse<{ exists: boolean }>> {
    return await apiService.get<ApiResponse<{ exists: boolean }>>(
      `/wishlist_items/check/${productId}`
    );
  }

  // Toggle wishlist status (add if not in wishlist, remove if already in wishlist)
  async toggleWishlist(
    productId: string
  ): Promise<ApiResponse<{ added: boolean; item?: WishlistItem }>> {
    return await apiService.post<
      ApiResponse<{ added: boolean; item?: WishlistItem }>
    >("/wishlist_items/toggle", { productId });
  }
}

// Create the standard service instance
const wishlistService = new WishlistService();

// React Query hooks
export const useWishlist = (options = {}) => {
  return useApiQuery(
    QueryKeys.user.wishlist,
    () => wishlistService.getWishlist(),
    options
  );
};

export const useAddToWishlist = (options = {}) => {
  return useApiMutation(
    (productId: string) => wishlistService.addToWishlist(productId),
    options
  );
};

export const useRemoveFromWishlist = (options = {}) => {
  return useApiMutation(
    (wishlistItemId: string) =>
      wishlistService.removeFromWishlist(wishlistItemId),
    options
  );
};

export const useIsProductInWishlist = (
  productId: string,
  options: { enabled?: boolean } = {}
) => {
  return useApiQuery(
    [...QueryKeys.user.wishlist, "check", productId],
    () => wishlistService.isProductInWishlist(productId),
    {
      ...options,
      enabled: !!productId && options.enabled, // Only run query if productId is provided
    }
  );
};

export const useToggleWishlist = (options = {}) => {
  return useApiMutation(
    (productId: string) => wishlistService.toggleWishlist(productId),
    options
  );
};

// Export the original service for cases where direct API calls are needed
export default wishlistService;
