import apiService from "./api";
import {
  Cart,
  Order,
  Address,
  ApiResponse,
  AddToCartData,
  UpdateCartItemData,
  CreateOrderData,
  CheckExistingCart,
} from "../types";
import queryHooks from "../hooks/useQueryHooks";
import { QueryKeys } from "../utils/queryKeys";
import { queryClient } from "../context/QueryContext";

const { useApiQuery, useApiMutation, usePrefetchQuery } = queryHooks;

/**
 * Service class for cart-related operations
 * aligned with Rails backend endpoints
 */
class CartService {
  /**
   * Fetch the current cart (guest or user cart)
   */
  async getCart(): Promise<ApiResponse<Cart>> {
    return await apiService.get<ApiResponse<Cart>>("/cart");
  }

  /**
   * Add item to cart
   */
  async addToCart(data: AddToCartData): Promise<ApiResponse<Cart>> {
    return await apiService.post<ApiResponse<Cart>>("/cart/items", {
      product_id: data.productId,
      quantity: data.quantity,
    });
  }

  /**
   * Update cart item quantity
   */
  async updateCartItem(data: UpdateCartItemData): Promise<ApiResponse<Cart>> {
    return await apiService.put<ApiResponse<Cart>>(
      `/cart/items/${data.cartItemId}`,
      {
        quantity: data.quantity,
      }
    );
  }

  /**
   * Remove item from cart
   */
  async removeCartItem(cartItemId: string): Promise<ApiResponse<Cart>> {
    return await apiService.delete<ApiResponse<Cart>>(
      `/cart/items/${cartItemId}`
    );
  }

  /**
   * Clear all items from cart
   */
  async clearCart(): Promise<ApiResponse<Cart>> {
    return await apiService.delete<ApiResponse<Cart>>("/cart/clear");
  }

  /**
   * Check if user has an existing cart
   */
  async checkExistingCart(): Promise<
    ApiResponse<{
      hasExistingCart: boolean;
      itemCount: number;
      total?: number;
      cartId?: string;
    }>
  > {
    return await apiService.get<ApiResponse<CheckExistingCart>>(
      "/cart/check-existing-cart"
    );
  }

  /**
   * Transfer cart between users or merge guest cart
   */
  async transferCart(params: {
    sourceCartId?: string;
    targetUserId?: string;
    actionType: "merge" | "replace" | "copy";
  }): Promise<
    ApiResponse<{
      sourceCartId: string;
      targetUserId: string;
      targetCartId: string;
      itemCount: number;
      total: number;
    }>
  > {
    return await apiService.post<
      ApiResponse<{
        sourceCartId: string;
        targetUserId: string;
        targetCartId: string;
        itemCount: number;
        total: number;
      }>
    >("/cart/transfer-cart", params);
  }

  // Simplified cart merge operations that wrap transferCart

  /**
   * Merge guest cart into user cart
   */
  async mergeCart(): Promise<ApiResponse<Cart>> {
    // This will use the guest cart from session on the backend
    return await apiService.post<ApiResponse<Cart>>("/cart/transfer-cart", {
      action_type: "merge",
    });
  }

  /**
   * Replace user cart with guest cart
   */
  async replaceCart(): Promise<ApiResponse<Cart>> {
    // This will use the guest cart from session on the backend
    return await apiService.post<ApiResponse<Cart>>("/cart/transfer-cart", {
      action_type: "replace",
    });
  }

  /**
   * Keep user cart and discard guest cart
   */
  async keepUserCart(): Promise<ApiResponse<Cart>> {
    // This doesn't need an endpoint, we just discard the guest cart
    // by refreshing the user's current cart
    return await this.getCart();
  }

  // Address methods

  /**
   * Get user addresses
   */
  async getAddresses(): Promise<ApiResponse<Address[]>> {
    return await apiService.get<ApiResponse<Address[]>>("/addresses");
  }

  /**
   * Create a new address
   */
  async createAddress(
    addressData: Omit<Address, "id" | "userId">
  ): Promise<ApiResponse<Address>> {
    return await apiService.post<ApiResponse<Address>>(
      "/addresses",
      addressData
    );
  }

  /**
   * Update an existing address
   */
  async updateAddress(
    id: string,
    addressData: Partial<Omit<Address, "id" | "userId">>
  ): Promise<ApiResponse<Address>> {
    return await apiService.put<ApiResponse<Address>>(
      `/addresses/${id}`,
      addressData
    );
  }

  /**
   * Delete an address
   */
  async deleteAddress(id: string): Promise<ApiResponse<null>> {
    return await apiService.delete<ApiResponse<null>>(`/addresses/${id}`);
  }

  /**
   * Set address as default
   */
  async setDefaultAddress(id: string): Promise<ApiResponse<null>> {
    return await apiService.patch<ApiResponse<null>>(
      `/addresses/${id}/default`
    );
  }

  // Order methods

  /**
   * Create a new order from cart
   */
  async createOrder(data: CreateOrderData): Promise<ApiResponse<Order>> {
    return await apiService.post<ApiResponse<Order>>("/orders", data);
  }

  /**
   * Get all user orders
   */
  async getOrders(): Promise<ApiResponse<Order[]>> {
    return await apiService.get<ApiResponse<Order[]>>("/orders");
  }

  /**
   * Get order by ID
   */
  async getOrderById(id: string): Promise<ApiResponse<Order>> {
    return await apiService.get<ApiResponse<Order>>(`/orders/${id}`);
  }

  /**
   * Cancel an order
   */
  async cancelOrder(id: string): Promise<ApiResponse<Order>> {
    return await apiService.patch<ApiResponse<Order>>(`/orders/${id}/cancel`);
  }

  // Payment methods

  /**
   * Create payment intent for an order
   */
  async createPaymentIntent(
    orderId: string
  ): Promise<ApiResponse<{ clientSecret: string }>> {
    return await apiService.post<ApiResponse<{ clientSecret: string }>>(
      `/payments/create-intent/${orderId}`
    );
  }

  /**
   * Confirm payment for an order
   */
  async confirmPayment(
    orderId: string,
    paymentIntentId: string
  ): Promise<ApiResponse<Order>> {
    return await apiService.post<ApiResponse<Order>>(
      `/payments/confirm/${orderId}`,
      {
        payment_intent_id: paymentIntentId,
      }
    );
  }

  /**
   * Reset cart queries in the cache
   */
  resetCartCache(): void {
    queryClient.invalidateQueries({ queryKey: QueryKeys.cart.current });
    queryClient.removeQueries({ queryKey: QueryKeys.cart.current });
  }
}

// Create a singleton instance of the service
const cartService = new CartService();

/**
 * Hook for getting the current cart
 */
export const useGetCart = (options = {}) => {
  return useApiQuery(QueryKeys.cart.current, () => cartService.getCart(), {
    refetchOnWindowFocus: false,
    staleTime: 30000, // 30 seconds
    refetchOnMount: true,
    retryOnMount: true,
    ...options,
  });
};

/**
 * Hook for checking existing user cart
 */
export const useCheckExistingCart = (options = {}) => {
  return useApiQuery(
    ["cart", "existingCheck"],
    () => cartService.checkExistingCart(),
    {
      refetchOnWindowFocus: false,
      staleTime: 10000,
      enabled: false, // Don't automatically run this query
      ...options,
    }
  );
};

/**
 * Hook for adding item to cart
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
 * Hook for merging guest cart with user cart
 */
export const useMergeCart = (options = {}) => {
  return useApiMutation(() => cartService.mergeCart(), {
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
 * Hook for replacing user cart with guest cart
 */
export const useReplaceCart = (options = {}) => {
  return useApiMutation(() => cartService.replaceCart(), {
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
 * Hook for keeping user cart (discarding guest cart)
 */
export const useKeepUserCart = (options = {}) => {
  return useApiMutation(() => cartService.keepUserCart(), {
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
 * Hook for updating cart item
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
 * Hook for removing item from cart
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
 * Hook for clearing the cart
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

/**
 * Hook for fetching addresses
 */
export const useAddresses = (options: { enabled?: boolean } = {}) => {
  return useApiQuery(
    QueryKeys.user.addresses,
    () => cartService.getAddresses(),
    options
  );
};

/**
 * Hook for creating address
 */
export const useCreateAddress = (options = {}) => {
  return useApiMutation(
    (addressData: Omit<Address, "id" | "userId">) =>
      cartService.createAddress(addressData),
    options
  );
};

/**
 * Hook for updating address
 */
export const useUpdateAddress = (id: string, options = {}) => {
  return useApiMutation(
    (addressData: Partial<Omit<Address, "id" | "userId">>) =>
      cartService.updateAddress(id, addressData),
    options
  );
};

/**
 * Hook for deleting address
 */
export const useDeleteAddress = (options = {}) => {
  return useApiMutation((id: string) => cartService.deleteAddress(id), options);
};

/**
 * Hook for setting default address
 */
export const useSetDefaultAddress = (options = {}) => {
  return useApiMutation(
    (id: string) => cartService.setDefaultAddress(id),
    options
  );
};

/**
 * Hook for fetching orders
 */
export const useOrders = (options: { enabled?: boolean } = {}) => {
  return useApiQuery(
    QueryKeys.orders.all,
    () => cartService.getOrders(),
    options
  );
};

/**
 * Hook for creating payment intent
 */
export const useCreatePaymentIntent = (options = {}) => {
  return useApiMutation(
    (orderId: string) => cartService.createPaymentIntent(orderId),
    options
  );
};

/**
 * Hook for confirming payment
 */
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

/**
 * Hook for prefetching order details
 */
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
