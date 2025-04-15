import apiService from './api';
import {
  Cart,
  Order,
  Address,
  ApiResponse,
  AddToCartData,
  UpdateCartItemData,
  CreateOrderData
} from '../types';
import queryHooks from '../hooks/useQueryHooks';
import { QueryKeys } from '../utils/queryKeys';

const { useApiQuery, useApiMutation, usePrefetchQuery } = queryHooks;

// Traditional API service methods
class CartService {
  // Cart methods
  async getCart(): Promise<ApiResponse<Cart>> {
    return await apiService.get<ApiResponse<Cart>>('/cart');
  }
  
  async addToCart(data: AddToCartData): Promise<ApiResponse<Cart>> {
    return await apiService.post<ApiResponse<Cart>>('/cart/items', data);
  }
  
  async updateCartItem(data: UpdateCartItemData): Promise<ApiResponse<Cart>> {
    return await apiService.put<ApiResponse<Cart>>(`/cart/items/${data.cartItemId}`, { 
      quantity: data.quantity 
    });
  }
  
  async removeCartItem(cartItemId: string): Promise<ApiResponse<Cart>> {
    return await apiService.delete<ApiResponse<Cart>>(`/cart/items/${cartItemId}`);
  }
  
  async clearCart(): Promise<ApiResponse<null>> {
    return await apiService.delete<ApiResponse<null>>('/cart/clear');
  }
  
  // Address methods
  async getAddresses(): Promise<ApiResponse<Address[]>> {
    return await apiService.get<ApiResponse<Address[]>>('/addresses');
  }
  
  async createAddress(addressData: Omit<Address, 'id' | 'userId'>): Promise<ApiResponse<Address>> {
    return await apiService.post<ApiResponse<Address>>('/addresses', addressData);
  }
  
  async updateAddress(id: string, addressData: Partial<Omit<Address, 'id' | 'userId'>>): Promise<ApiResponse<Address>> {
    return await apiService.put<ApiResponse<Address>>(`/addresses/${id}`, addressData);
  }
  
  async deleteAddress(id: string): Promise<ApiResponse<null>> {
    return await apiService.delete<ApiResponse<null>>(`/addresses/${id}`);
  }
  
  async setDefaultAddress(id: string): Promise<ApiResponse<null>> {
    return await apiService.patch<ApiResponse<null>>(`/addresses/${id}/default`);
  }
  
  // Order methods
  async createOrder(data: CreateOrderData): Promise<ApiResponse<Order>> {
    return await apiService.post<ApiResponse<Order>>('/orders', data);
  }
  
  async getOrders(): Promise<ApiResponse<Order[]>> {
    return await apiService.get<ApiResponse<Order[]>>('/orders');
  }
  
  async getOrderById(id: string): Promise<ApiResponse<Order>> {
    return await apiService.get<ApiResponse<Order>>(`/orders/${id}`);
  }
  
  async cancelOrder(id: string): Promise<ApiResponse<Order>> {
    return await apiService.patch<ApiResponse<Order>>(`/orders/${id}/cancel`);
  }
  
  // Payment methods
  async createPaymentIntent(orderId: string): Promise<ApiResponse<{ clientSecret: string }>> {
    return await apiService.post<ApiResponse<{ clientSecret: string }>>(`/payments/create-intent/${orderId}`);
  }
  
  async confirmPayment(orderId: string, paymentIntentId: string): Promise<ApiResponse<Order>> {
    return await apiService.post<ApiResponse<Order>>(`/payments/confirm/${orderId}`, { 
      paymentIntentId 
    });
  }
  
  // Vendor order management
  async getVendorOrders(status?: string): Promise<ApiResponse<Order[]>> {
    return await apiService.get<ApiResponse<Order[]>>('/vendor/orders', { status });
  }
  
  async updateOrderStatus(orderId: string, status: string): Promise<ApiResponse<Order>> {
    return await apiService.patch<ApiResponse<Order>>(`/vendor/orders/${orderId}/status`, { status });
  }
}

// Create the standard service instance
const cartService = new CartService();

// React Query hooks
export const useCart = (options = {}) => {
  return useApiQuery(
    QueryKeys.cart.current,
    () => cartService.getCart(),
    options
  );
};

export const useAddToCart = (options = {}) => {
  return useApiMutation(
    (data: AddToCartData) => cartService.addToCart(data),
    options
  );
};

export const useUpdateCartItem = (options = {}) => {
  return useApiMutation(
    (data: UpdateCartItemData) => cartService.updateCartItem(data),
    options
  );
};

export const useRemoveCartItem = (options = {}) => {
  return useApiMutation(
    (cartItemId: string) => cartService.removeCartItem(cartItemId),
    options
  );
};

export const useClearCart = (options = {}) => {
  return useApiMutation(
    () => cartService.clearCart(),
    options
  );
};

export const useAddresses = (options = {}) => {
  return useApiQuery(
    QueryKeys.user.addresses,
    () => cartService.getAddresses(),
    options
  );
};

export const useCreateAddress = (options = {}) => {
  return useApiMutation(
    (addressData: Omit<Address, 'id' | 'userId'>) => cartService.createAddress(addressData),
    options
  );
};

export const useUpdateAddress = (id: string, options = {}) => {
  return useApiMutation(
    (addressData: Partial<Omit<Address, 'id' | 'userId'>>) => cartService.updateAddress(id, addressData),
    options
  );
};

export const useDeleteAddress = (options = {}) => {
  return useApiMutation(
    (id: string) => cartService.deleteAddress(id),
    options
  );
};

export const useSetDefaultAddress = (options = {}) => {
  return useApiMutation(
    (id: string) => cartService.setDefaultAddress(id),
    options
  );
};

export const useOrders = (options = {}) => {
  return useApiQuery(
    QueryKeys.orders.all,
    () => cartService.getOrders(),
    options
  );
};

export const useOrderDetail = (id: string, options = {}) => {
  return useApiQuery(
    QueryKeys.orders.detail(id),
    () => cartService.getOrderById(id),
    {
      ...options,
      enabled: !!id, // Only run query if id is provided
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
  return useApiMutation(
    (id: string) => cartService.cancelOrder(id),
    options
  );
};

export const useCreatePaymentIntent = (options = {}) => {
  return useApiMutation(
    (orderId: string) => cartService.createPaymentIntent(orderId),
    options
  );
};

export const useConfirmPayment = (options = {}) => {
  return useApiMutation(
    ({ orderId, paymentIntentId }: { orderId: string; paymentIntentId: string }) => 
      cartService.confirmPayment(orderId, paymentIntentId),
    options
  );
};

// Helper hook to prefetch order details (for better UX)
export const usePrefetchOrderDetail = () => {
  const prefetchQuery = usePrefetchQuery<Order>();
  
  return (id: string) => {
    return prefetchQuery(
      QueryKeys.orders.detail(id), 
      () => cartService.getOrderById(id)
    );
  };
};

// Export the original service for cases where direct API calls are needed
export default cartService;