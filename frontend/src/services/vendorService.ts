import apiService from './api';
import { Product, Order, ApiResponse, PaginatedResponse, VendorStoreData, InventoryUpdateData, SalesReportParams, OrderStatus } from '../types';

class VendorService {
  // Store management
  async getStoreDetails(): Promise<{
    id: string;
    name: string;
    description: string;
    logoUrl: string;
    bannerUrl: string;
    contactEmail: string;
    contactPhone: string;
    address: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    createdAt: string;
    updatedAt: string;
  }> {
    const response = await apiService.get<ApiResponse<any>>('/vendor/store');
    return response.data;
  }
  
  async updateStore(storeData: Partial<VendorStoreData>): Promise<any> {
    const formData = new FormData();
    
    Object.entries(storeData).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === 'logoFile' || key === 'bannerFile') {
          formData.append(key.replace('File', ''), value as File);
        } else {
          formData.append(key, value as string);
        }
      }
    });
    
    const response = await apiService.put<ApiResponse<any>>('/vendor/store', formData);
    return response.data;
  }
  
  // Inventory management
  async getVendorProducts(params: {
    page?: number;
    perPage?: number;
    status?: 'active' | 'inactive' | 'pending' | 'rejected';
    categoryId?: string;
    query?: string;
  } = {}): Promise<PaginatedResponse<Product>> {
    return await apiService.get<PaginatedResponse<Product>>('/vendor/products', params);
  }
  
  async updateInventory(updates: InventoryUpdateData[]): Promise<void> {
    await apiService.patch<ApiResponse<null>>('/vendor/inventory/batch', { updates });
  }
  
  async updateProductStatus(productId: string, isActive: boolean): Promise<Product> {
    const response = await apiService.patch<ApiResponse<Product>>(`/vendor/products/${productId}/status`, {
      isActive
    });
    return response.data;
  }
  
  // Order management
  async getVendorOrders(params: {
    page?: number;
    perPage?: number;
    status?: OrderStatus
    startDate?: string;
    endDate?: string;
  } = {}): Promise<PaginatedResponse<Order>> {
    return await apiService.get<PaginatedResponse<Order>>('/vendor/orders', params);
  }
  
  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
    const response = await apiService.patch<ApiResponse<Order>>(`/vendor/orders/${orderId}/status`, { status });
    return response.data;
  }
  
  async getOrderById(orderId: string): Promise<Order> {
    const response = await apiService.get<ApiResponse<Order>>(`/vendor/orders/${orderId}`);
    return response.data;
  }
  
  // Analytics and reporting
  async getDashboardStats(): Promise<{
    totalProducts: number;
    totalOrders: number;
    totalRevenue: number;
    pendingOrders: number;
    recentOrders: Order[];
    topProducts: { product: Product; totalSold: number }[];
  }> {
    const response = await apiService.get<ApiResponse<any>>('/vendor/dashboard/stats');
    return response.data;
  }
  
  async getSalesReport(params: SalesReportParams = {}): Promise<{
    totalSales: number;
    totalRevenue: number;
    salesByPeriod: { period: string; sales: number; revenue: number }[];
    salesByCategory: { category: string; sales: number; revenue: number }[];
  }> {
    const response = await apiService.get<ApiResponse<any>>('/vendor/reports/sales', params);
    return response.data;
  }
  
  async getProductPerformance(productId: string): Promise<{
    totalSales: number;
    totalRevenue: number;
    salesByPeriod: { period: string; sales: number; revenue: number }[];
    averageRating: number;
    views: number;
    conversionRate: number;
  }> {
    const response = await apiService.get<ApiResponse<any>>(`/vendor/reports/products/${productId}/performance`);
    return response.data;
  }
  
  // Payment management
  async getPaymentHistory(params: {
    page?: number;
    perPage?: number;
    startDate?: string;
    endDate?: string;
  } = {}): Promise<PaginatedResponse<{
    id: string;
    amount: number;
    status: 'pending' | 'paid' | 'failed';
    createdAt: string;
  }>
  > {
    return await apiService.get<PaginatedResponse<any>>('/vendor/payments', params);
  }
  
  async getPaymentDetails(paymentId: string): Promise<{
    id: string;
    amount: number;
    fee: number;
    netAmount: number;
    orders: { id: string; amount: number }[];
    status: 'pending' | 'paid' | 'failed';
    paidAt: string;
    createdAt: string;
  }> {
    const response = await apiService.get<ApiResponse<any>>(`/vendor/payments/${paymentId}`);
    return response.data;
  }
}

const vendorService = new VendorService();
export default vendorService;
