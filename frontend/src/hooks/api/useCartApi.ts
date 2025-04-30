import apiService from "../../services/api";
import { ApiResponse } from "../../types";
import {
  Cart,
  AddToCartParams,
  UpdateCartItemParams,
  TransferCartParams,
  TransferCartResponse,
  GuestCartCheck,
  ExistingCartCheck,
} from "../../types/cart";
import { CART_ENDPOINTS, CACHE_CONFIG } from "../../utils/constants";
import { QueryKeys } from "../../utils/queryKeys";
import { useApiMutation, useApiQuery } from "../useQueryHooks";
import { queryClient } from "../../context/QueryContext";

/**
 * Hook to fetch the current cart with improved caching
 */
export const useGetCart = (options = {}) => {
  return useApiQuery<Cart>(
    QueryKeys.cart.current,
    async () => await apiService.get<ApiResponse<Cart>>(CART_ENDPOINTS.CART),
    {
      refetchOnWindowFocus: false,
      staleTime: CACHE_CONFIG.STALE_TIMES.SHORT, // 30 seconds
      refetchOnMount: true,
      retryOnMount: true,
      retry: CACHE_CONFIG.RETRY.CART,
      ...options,
    }
  );
};

/**
 * Hook to check for an existing guest cart with consistent caching
 */
export const useCheckGuestCart = (options = {}) => {
  return useApiQuery<GuestCartCheck>(
    QueryKeys.cart.guestCheck,
    async () =>
      await apiService.get<ApiResponse<GuestCartCheck>>(
        CART_ENDPOINTS.CHECK_GUEST_CART
      ),
    {
      refetchOnWindowFocus: false,
      staleTime: CACHE_CONFIG.STALE_TIMES.STANDARD, // 1 minute
      retry: CACHE_CONFIG.RETRY.CART,
      ...options,
    }
  );
};

/**
 * Hook to check for an existing user cart with consistent caching
 */
export const useCheckUserCart = (options = {}) => {
  return useApiQuery<ExistingCartCheck>(
    [...QueryKeys.cart.checkExisting, "user"],
    async () =>
      await apiService.get<ApiResponse<ExistingCartCheck>>(
        CART_ENDPOINTS.CHECK_USER_CART
      ),
    {
      refetchOnWindowFocus: false,
      staleTime: CACHE_CONFIG.STALE_TIMES.STANDARD, // 1 minute
      retry: CACHE_CONFIG.RETRY.CART,
      ...options,
    }
  );
};

/**
 * Hook for adding items to cart with proper cache invalidation
 */
export const useAddToCart = () => {
  return useApiMutation<Cart, AddToCartParams>(
    async ({ productId, quantity }: AddToCartParams) => {
      return apiService.post<ApiResponse<Cart>>(CART_ENDPOINTS.ITEMS, {
        product_id: productId, // Match backend parameter name
        quantity,
      });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: QueryKeys.cart.current });
      }
    }
  );
};

/**
 * Hook for updating cart items with proper cache invalidation
 */
export const useUpdateCartItem = () => {
  return useApiMutation<Cart, UpdateCartItemParams>(
    async ({ itemId, quantity }: UpdateCartItemParams) => {
      return apiService.put<ApiResponse<Cart>>(
        `${CART_ENDPOINTS.ITEMS}/${itemId}`,
        {
          quantity,
        }
      );
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: QueryKeys.cart.current });
      }
    }
  );
};

/**
 * Hook for removing items from cart with proper cache invalidation
 */
export const useRemoveCartItem = () => {
  return useApiMutation<Cart, string>(
    async (itemId: string) => {
      return apiService.delete<ApiResponse<Cart>>(
        `${CART_ENDPOINTS.ITEMS}/${itemId}`
      );
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: QueryKeys.cart.current });
      }
    }
  );
};

/**
 * Hook for clearing the cart with proper cache invalidation
 */
export const useClearCart = () => {
  return useApiMutation<Cart, void>(
    async () => {
      return apiService.delete<ApiResponse<Cart>>(CART_ENDPOINTS.CLEAR);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: QueryKeys.cart.current });
      }
    }
  );
};

/**
 * Hook for transferring a guest cart to a user cart with enhanced cache management
 */
export const useTransferCart = () => {
  return useApiMutation<TransferCartResponse, TransferCartParams>(
    async ({ sourceCartId, targetUserId, actionType }: TransferCartParams) => {
      return apiService.post<ApiResponse<TransferCartResponse>>(
        CART_ENDPOINTS.TRANSFER_CART,
        {
          source_cart_id: sourceCartId, // Match backend parameter name
          target_user_id: targetUserId, // Match backend parameter name
          action_type: actionType, // Match backend parameter name
        }
      );
    }
  );
};