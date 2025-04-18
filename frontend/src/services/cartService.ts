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

const { useApiQuery, useApiMutation, usePrefetchQuery } = queryHooks;

/**
 * Handles all cart-related API operations and provides React Query hooks
 * for cart data management with proper token handling for guest carts
 */
class CartService {
  // Guest cart token storage key
  private readonly GUEST_CART_TOKEN_KEY = "guest_cart_token";

  // Get the current guest cart token
  getGuestCartToken(): string | null {
    return localStorage.getItem(this.GUEST_CART_TOKEN_KEY);
  }

  // Save guest cart token to localStorage
  saveGuestCartToken(token: string): void {
    if (token && token.trim() !== "") {
      localStorage.setItem(this.GUEST_CART_TOKEN_KEY, token);
      console.debug("Guest cart token saved:", token);
    }
  }

  // Clear guest cart token
  clearGuestCartToken(): void {
    localStorage.removeItem(this.GUEST_CART_TOKEN_KEY);
    console.debug("Guest cart token cleared");
  }

  // Cart methods
  async getCart(): Promise<ApiResponse<Cart>> {
    try {
      const response = await apiService.get<ApiResponse<Cart>>("/cart");

      // Check if there's a guest cart token in the response headers
      const tokenFromHeaders = apiService.getGuestCartToken();
      if (tokenFromHeaders) {
        this.saveGuestCartToken(tokenFromHeaders);
      }

      return response;
    } catch (error) {
      // Still try to save guest cart token even on error
      const tokenFromHeaders = apiService.getGuestCartToken();
      if (tokenFromHeaders) {
        this.saveGuestCartToken(tokenFromHeaders);
      }

      throw error;
    }
  }

  async addToCart(data: AddToCartData): Promise<ApiResponse<Cart>> {
    try {
      const response = await apiService.post<ApiResponse<Cart>>(
        "/cart/items",
        data
      );

      // Check for and save guest cart token from response
      const tokenFromHeaders = apiService.getGuestCartToken();
      if (tokenFromHeaders) {
        this.saveGuestCartToken(tokenFromHeaders);
      }

      return response;
    } catch (error) {
      // Still try to save guest cart token even on error
      const tokenFromHeaders = apiService.getGuestCartToken();
      if (tokenFromHeaders) {
        this.saveGuestCartToken(tokenFromHeaders);
      }

      throw error;
    }
  }

  async updateCartItem(data: UpdateCartItemData): Promise<ApiResponse<Cart>> {
    try {
      const response = await apiService.put<ApiResponse<Cart>>(
        `/cart/items/${data.cartItemId}`,
        {
          quantity: data.quantity,
        }
      );

      // Check for and save guest cart token from response
      const tokenFromHeaders = apiService.getGuestCartToken();
      if (tokenFromHeaders) {
        this.saveGuestCartToken(tokenFromHeaders);
      }

      return response;
    } catch (error) {
      // Still try to save guest cart token even on error
      const tokenFromHeaders = apiService.getGuestCartToken();
      if (tokenFromHeaders) {
        this.saveGuestCartToken(tokenFromHeaders);
      }

      throw error;
    }
  }

  async removeCartItem(cartItemId: string): Promise<ApiResponse<Cart>> {
    try {
      const response = await apiService.delete<ApiResponse<Cart>>(
        `/cart/items/${cartItemId}`
      );

      // Check for and save guest cart token from response
      const tokenFromHeaders = apiService.getGuestCartToken();
      if (tokenFromHeaders) {
        this.saveGuestCartToken(tokenFromHeaders);
      }

      return response;
    } catch (error) {
      // Still try to save guest cart token even on error
      const tokenFromHeaders = apiService.getGuestCartToken();
      if (tokenFromHeaders) {
        this.saveGuestCartToken(tokenFromHeaders);
      }

      throw error;
    }
  }

  async clearCart(): Promise<ApiResponse<Cart>> {
    try {
      const response = await apiService.delete<ApiResponse<Cart>>(
        "/cart/clear"
      );

      // Check for and save guest cart token from response
      const tokenFromHeaders = apiService.getGuestCartToken();
      if (tokenFromHeaders) {
        this.saveGuestCartToken(tokenFromHeaders);
      }

      return response;
    } catch (error) {
      // Still try to save guest cart token even on error
      const tokenFromHeaders = apiService.getGuestCartToken();
      if (tokenFromHeaders) {
        this.saveGuestCartToken(tokenFromHeaders);
      }

      throw error;
    }
  }

  // Transfer guest cart to user cart after login
  async transferCart(): Promise<ApiResponse<Cart>> {
    const guestCartToken = this.getGuestCartToken();
    if (!guestCartToken) {
      return {
        success: true,
        message: "No guest cart to transfer",
        data: {} as Cart,
      };
    }

    const response = await apiService.post<ApiResponse<Cart>>("/cart/transfer");

    // After successful transfer, clear the guest cart token
    if (response.success) {
      this.clearGuestCartToken();
    }

    return response;
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
    const response = await apiService.post<ApiResponse<Order>>("/orders", data);

    // Clear guest cart token after successful order creation
    if (response.success) {
      this.clearGuestCartToken();
    }

    return response;
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
}

// Create the standard service instance
const cartService = new CartService();

/**
 * Hook for accessing the current cart data
 * Automatically handles guest cart token persistence
 */
export const useCart = (options = {}) => {
  return useApiQuery(QueryKeys.cart.current, () => cartService.getCart(), {
    refetchOnWindowFocus: false,
    staleTime: 30000, // 30 seconds
    ...options,
  });
};

/**
 * Hook for transferring a guest cart to a user cart after login
 */
export const useTransferCart = (options = {}) => {
  return useApiMutation(() => cartService.transferCart(), {
    onSuccess: (response, variables, context) => {
      // Clear guest cart token after successful transfer
      cartService.clearGuestCartToken();

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
 * Hook for adding an item to the cart
 */
export const useAddToCart = (options = {}) => {
  return useApiMutation((data: AddToCartData) => cartService.addToCart(data), {
    onSuccess: (response, variables, context) => {
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
    {
      onSuccess: (response, variables, context) => {
        // Clear guest cart token after successful order creation
        cartService.clearGuestCartToken();

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
