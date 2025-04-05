import apiService from './api';
import { Cart, Order, Address, ApiResponse } from '../types';

interface AddToCartData {
  productId: string;
  quantity: number;
}

interface UpdateCartItemData {
  cartItemId: string;
  quantity: number;
}

interface CreateOrderData {
  shippingAddressId: string;
  billingAddressId: string;
  paymentMethodId: string;
}

class CartService {
  // Cart methods
  async getCart(): Promise<Cart> {
    const response = await apiService.get<ApiResponse<Cart>>('/cart');
    return response.data;
  }
  
  async addToCart(data: AddToCartData): Promise<Cart> {
    const response = await apiService.post<ApiResponse<Cart>>('/cart/items', data);
    return response.data;
  }
  
  async updateCartItem(data: UpdateCartItemData): Promise<Cart> {
    const response = await apiService.put<ApiResponse<Cart>>(`/cart/items/${data.cartItemId}`, { 
      quantity: data.quantity 
    });
    return response.data;
  }
  
  async removeCartItem(cartItemId: string): Promise<Cart> {
    const response = await apiService.delete<ApiResponse<Cart>>(`/cart/items/${cartItemId}`);
    return response.data;
  }
  
  async clearCart(): Promise<void> {
    await apiService.delete<ApiResponse<null>>('/cart/clear');
  }
  
  // Address methods
  async getAddresses(): Promise<Address[]> {
    const response = await apiService.get<ApiResponse<Address[]>>('/addresses');
    return response.data;
  }
  
  async createAddress(addressData: Omit<Address, 'id' | 'userId'>): Promise<Address> {
    const response = await apiService.post<ApiResponse<Address>>('/addresses', addressData);
    return response.data;
  }
  
  async updateAddress(id: string, addressData: Partial<Omit<Address, 'id' | 'userId'>>): Promise<Address> {
    const response = await apiService.put<ApiResponse<Address>>(`/addresses/${id}`, addressData);
    return response.data;
  }
  
  async deleteAddress(id: string): Promise<void> {
    await apiService.delete<ApiResponse<null>>(`/addresses/${id}`);
  }
  
  async setDefaultAddress(id: string): Promise<void> {
    await apiService.patch<ApiResponse<null>>(`/addresses/${id}/default`);
  }
  
  // Order methods
  async createOrder(data: CreateOrderData): Promise<Order> {
    const response = await apiService.post<ApiResponse<Order>>('/orders', data);
    return response.data;
  }
  
  async getOrders(): Promise<Order[]> {
    const response = await apiService.get<ApiResponse<Order[]>>('/orders');
    return response.data;
  }
  
  async getOrderById(id: string): Promise<Order> {
    const response = await apiService.get<ApiResponse<Order>>(`/orders/${id}`);
    return response.data;
  }
  
  async cancelOrder(id: string): Promise<Order> {
    const response = await apiService.patch<ApiResponse<Order>>(`/orders/${id}/cancel`);
    return response.data;
  }
  
  // Payment methods
  async createPaymentIntent(orderId: string): Promise<{ clientSecret: string }> {
    const response = await apiService.post<ApiResponse<{ clientSecret: string }>>(`/payments/create-intent/${orderId}`);
    return response.data;
  }
  
  async confirmPayment(orderId: string, paymentIntentId: string): Promise<Order> {
    const response = await apiService.post<ApiResponse<Order>>(`/payments/confirm/${orderId}`, { 
      paymentIntentId 
    });
    return response.data;
  }
  
  // Vendor order management
  async getVendorOrders(status?: string): Promise<Order[]> {
    const response = await apiService.get<ApiResponse<Order[]>>('/vendor/orders', { status });
    return response.data;
  }
  
  async updateOrderStatus(orderId: string, status: string): Promise<Order> {
    const response = await apiService.patch<ApiResponse<Order>>(`/vendor/orders/${orderId}/status`, { status });
    return response.data;
  }
}

const cartService = new CartService();
export default cartService;
