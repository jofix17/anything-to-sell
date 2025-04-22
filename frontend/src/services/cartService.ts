import apiService from "./api";
import {
  Cart,
  Order,
  Address,
  ApiResponse,
  AddToCartData,
  UpdateCartItemData,
  CreateOrderData,
} from "../types";
import queryHooks from "../hooks/useQueryHooks";
import { QueryKeys } from "../utils/queryKeys";
import { queryClient } from "../context/QueryContext";

const { useApiQuery, useApiMutation, usePrefetchQuery } = queryHooks;

/**
 * Handles all cart-related API operations and provides React Query hooks
 * for cart data management leveraging Rails session cookies
 */
class CartService {
  // Cart methods
  async getCart(): Promise<ApiResponse<Cart>> {
    return await apiService.get<ApiResponse<Cart>>("/cart");
  }

  async addToCart(data: AddToCartData): Promise<ApiResponse<Cart>> {
    return await apiService.post<ApiResponse<Cart>>("/cart/items", data);
  }

  async updateCartItem(data: UpdateCartItemData): Promise<ApiResponse<Cart>> {
    return await apiService.put<ApiResponse<Cart>>(
      `/cart/items/${data.cartItemId}`,
      {
        quantity: data.quantity,
      }
    );
  }

  async removeCartItem(cartItemId: string): Promise<ApiResponse<Cart>> {
    return await apiService.delete<ApiResponse<Cart>>(`/cart/items/${cartItemId}`);
  }

  async clearCart(): Promise<ApiResponse<Cart>> {
    return await apiService.delete<ApiResponse<Cart>>("/cart/clear");
  }

  // Address methods
  async getAddresses(): Promise<ApiResponse<Address[]>> {
    return await apiService.get<ApiResponse<Address[]>>("/addresses");
  }

  async createAddress(
    addressData: Omit<Address, "id" | "userId">
  ): Promise<ApiResponse<Address>> {
    return await apiService.post<ApiResponse<Address>>(
      "/addresses",
      addressData
    );
  }

  async updateAddress(
    id: string,
    addressData: Partial<Omit<Address, "id" | "userId">>
  ): Promise<ApiResponse<Address>> {
    return await apiService.put<ApiResponse<Address>>(
      `/addresses/${id}`,
      addressData
    );
  }

  async deleteAddress(id: string): Promise<ApiResponse<null>> {
    return await apiService.delete<ApiResponse<null>>(`/addresses/${id}`);
  }

  async setDefaultAddress(id: string): Promise<ApiResponse<null>> {
    return await apiService.patch<ApiResponse<null>>(
      `/addresses/${id}/default`
    );
  }

  // Order methods
  async createOrder(data: CreateOrderData): Promise<ApiResponse<Order>> {
    return await apiService.post<ApiResponse<Order>>("/orders", data);
  }

  async getOrders(): Promise<ApiResponse<Order[]>> {
    return await apiService.get<ApiResponse<Order[]>>("/orders");
  }

  async getOrderById(id: string): Promise<ApiResponse<Order>> {
    return await apiService.get<ApiResponse<Order>>(`/orders/${id}`);
  }

  async cancelOrder(id: string): Promise<ApiResponse<Order>> {
    return await apiService.patch<ApiResponse<Order>>(`/orders/${id}/cancel`);
  }

  // Payment methods
  async createPaymentIntent(
    orderId: string
  ): Promise<ApiResponse<{ clientSecret: string }>> {
    return await apiService.post<ApiResponse<{ clientSecret: string }>>(
      `/payments/create-intent/${orderId}`
    );
  }

  async confirmPayment(
    orderId: string,
    paymentIntentId: string
  ): Promise<ApiResponse<Order>> {
    return await apiService.post<ApiResponse<Order>>(
      `/payments/confirm/${orderId}`,
      {
        paymentIntentId,
      }
    );
  }

  // Helper method to reset cart query cache
  resetCartCache(): void {
    queryClient.invalidateQueries({ queryKey: QueryKeys.cart.current });
    queryClient.removeQueries({ queryKey: QueryKeys.cart.current });
  }
}

// Create the standard service instance
const cartService = new CartService();

/**
 * Hook for accessing the current cart data
 */
export const useGetCart = (options = {}) => {
  return useApiQuery(QueryKeys.cart.current, () => cartService.getCart(), {
    refetchOnWindowFocus: false,
    staleTime: 30000, // 30 seconds
    refetchOnMount: true, // Always refetch when mounted
    retryOnMount: true, // Retry if failed on mount
    ...options,
  });
};

/**
 * Hook for adding an item to the cart
 */
export const useAddToCart = (options = {}) => {
  return useApiMutation((data: AddToCartData) => cartService.addToCart(data), {
    onSuccess: (response, variables, context) => {
      // Invalidate the cart query to ensure fresh data
      queryClient.invalidateQueries({ queryKey: QueryKeys.cart.current });
      
      if (
        options &&
        "onSuccess" in options &&
        typeof options.onSuccess === "function"
      ) {
        options.onSuccess(response, variables, context);
      }
    },
    ...options,
  });
};

/**
 * Hook for updating a cart item quantity
 */
export const useUpdateCartItem = (options = {}) => {
  return useApiMutation(
    (data: UpdateCartItemData) => cartService.updateCartItem(data),
    {
      onSuccess: (response, variables, context) => {
        // Invalidate the cart query to ensure fresh data
        queryClient.invalidateQueries({ queryKey: QueryKeys.cart.current });
        
        if (
          options &&
          "onSuccess" in options &&
          typeof options.onSuccess === "function"
        ) {
          options.onSuccess(response, variables, context);
        }
      },
      ...options,
    }
  );
};

/**
 * Hook for removing an item from the cart
 */
export const useRemoveCartItem = (options = {}) => {
  return useApiMutation(
    (cartItemId: string) => cartService.removeCartItem(cartItemId),
    {
      onSuccess: (response, variables, context) => {
        // Invalidate the cart query to ensure fresh data
        queryClient.invalidateQueries({ queryKey: QueryKeys.cart.current });
        
        if (
          options &&
          "onSuccess" in options &&
          typeof options.onSuccess === "function"
        ) {
          options.onSuccess(response, variables, context);
        }
      },
      ...options,
    }
  );
};

/**
 * Hook for clearing the entire cart
 */
export const useClearCart = (options = {}) => {
  return useApiMutation(() => cartService.clearCart(), {
    onSuccess: (response, variables, context) => {
      // Invalidate the cart query to ensure fresh data
      queryClient.invalidateQueries({ queryKey: QueryKeys.cart.current });
      
      if (
        options &&
        "onSuccess" in options &&
        typeof options.onSuccess === "function"
      ) {
        options.onSuccess(response, variables, context);
      }
    },
    ...options,
  });
};

export const useAddresses = (options: { enabled?: boolean } = {}) => {
  return useApiQuery(
    QueryKeys.user.addresses,
    () => cartService.getAddresses(),
    options
  );
};

export const useCreateAddress = (options = {}) => {
  return useApiMutation(
    (addressData: Omit<Address, "id" | "userId">) =>
      cartService.createAddress(addressData),
    options
  );
};

export const useUpdateAddress = (id: string, options = {}) => {
  return useApiMutation(
    (addressData: Partial<Omit<Address, "id" | "userId">>) =>
      cartService.updateAddress(id, addressData),
    options
  );
};

export const useDeleteAddress = (options = {}) => {
  return useApiMutation((id: string) => cartService.deleteAddress(id), options);
};

export const useSetDefaultAddress = (options = {}) => {
  return useApiMutation(
    (id: string) => cartService.setDefaultAddress(id),
    options
  );
};

export const useOrders = (options: { enabled?: boolean } = {}) => {
  return useApiQuery(
    QueryKeys.orders.all,
    () => cartService.getOrders(),
    options
  );
};

export const useOrderDetail = (
  id: string,
  options: { enabled?: boolean } = {}
) => {
  return useApiQuery(
    QueryKeys.orders.detail(id),
    () => cartService.getOrderById(id),
    {
      ...options,
      enabled: !!id && options.enabled !== false, // Only run query if id is provided and not explicitly disabled
    }
  );
};

export const useCreateOrder = (options = {}) => {
  return useApiMutation(
    (data: CreateOrderData) => cartService.createOrder(data),
    options
  );
};

export const useCancelOrder = (options = {}) => {
  return useApiMutation((id: string) => cartService.cancelOrder(id), options);
};

export const useCreatePaymentIntent = (options = {}) => {
  return useApiMutation(
    (orderId: string) => cartService.createPaymentIntent(orderId),
    options
  );
};

export const useConfirmPayment = (options = {}) => {
  return useApiMutation(
    ({
      orderId,
      paymentIntentId,
    }: {
      orderId: string;
      paymentIntentId: string;
    }) => cartService.confirmPayment(orderId, paymentIntentId),
    options
  );
};

// Helper hook to prefetch order details (for better UX)
export const usePrefetchOrderDetail = () => {
  const prefetchQuery = usePrefetchQuery<Order>();

  return (id: string) => {
    return prefetchQuery(QueryKeys.orders.detail(id), () =>
      cartService.getOrderById(id)
    );
  };
};

// Export the original service for cases where direct API calls are needed
export default cartService;