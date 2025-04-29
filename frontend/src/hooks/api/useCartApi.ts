import { useMutation } from "@tanstack/react-query";
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
import { CART_ENDPOINTS } from "../../utils/constants";
import { QueryKeys } from "../../utils/queryKeys";
import { useApiQuery } from "../useQueryHooks";

/**
 * Hook to fetch the current cart
 */
export const useGetCart = (options = {}) => {
  return useApiQuery(
    QueryKeys.cart.current,
    async () => await apiService.get<ApiResponse<Cart>>(CART_ENDPOINTS.CART),
    {
      refetchOnWindowFocus: false,
      staleTime: 30000, // 30 seconds
      refetchOnMount: true,
      retryOnMount: true,
      ...options,
    }
  );
};

/**
 * Hook to check for an existing guest cart
 */
export const useCheckGuestCart = (options = {}) => {
  return useApiQuery(
    QueryKeys.cart.guestCheck,
    async () =>
      await apiService.get<ApiResponse<GuestCartCheck>>(
        CART_ENDPOINTS.CHECK_GUEST_CART
      ),
    {
      refetchOnWindowFocus: false,
      staleTime: 60000, // 1 minute
      ...options,
    }
  );
};

/**
 * Hook to check for an existing user cart
 */
export const useCheckUserCart = (options = {}) => {
  return useApiQuery(
    [...QueryKeys.cart.checkExisting, "user"],
    async () =>
      await apiService.get<ApiResponse<ExistingCartCheck>>(
        CART_ENDPOINTS.CHECK_USER_CART
      ),
    {
      refetchOnWindowFocus: false,
      staleTime: 60000, // 1 minute
      ...options,
    }
  );
};

/**
 * Hook for adding items to cart
 */
export const useAddToCart = () => {
  return useMutation({
    mutationFn: async ({ productId, quantity }: AddToCartParams) => {
      return apiService.post<ApiResponse<Cart>>(CART_ENDPOINTS.ITEMS, {
        product_id: productId, // Match backend parameter name
        quantity,
      });
    },
  });
};

/**
 * Hook for updating cart items
 */
export const useUpdateCartItem = () => {
  return useMutation({
    mutationFn: async ({ itemId, quantity }: UpdateCartItemParams) => {
      return apiService.put<ApiResponse<Cart>>(
        `${CART_ENDPOINTS.ITEMS}/${itemId}`,
        {
          quantity,
        }
      );
    },
  });
};

/**
 * Hook for removing items from cart
 */
export const useRemoveCartItem = () => {
  return useMutation({
    mutationFn: async (itemId: string) => {
      return apiService.delete<ApiResponse<Cart>>(
        `${CART_ENDPOINTS.ITEMS}/${itemId}`
      );
    },
  });
};

/**
 * Hook for clearing the cart
 */
export const useClearCart = () => {
  return useMutation({
    mutationFn: async () => {
      return apiService.delete<ApiResponse<Cart>>(CART_ENDPOINTS.CLEAR);
    },
  });
};

/**
 * Hook for transferring a guest cart to a user cart
 */
export const useTransferCart = () => {
  return useMutation({
    mutationFn: async ({
      sourceCartId,
      targetUserId,
      actionType,
    }: TransferCartParams) => {
      return apiService.post<ApiResponse<TransferCartResponse>>(
        CART_ENDPOINTS.TRANSFER_CART,
        {
          source_cart_id: sourceCartId, // Match backend parameter name
          target_user_id: targetUserId, // Match backend parameter name
          action_type: actionType, // Match backend parameter name
        }
      );
    },
  });
};
