import apiService from './api';
import {
  Product,
  Order,
  ApiResponse,
  PaginatedResponse,
  VendorStoreData,
  InventoryUpdateData,
  SalesReportParams,
  OrderStatus,
  StoreDetails,
  VendorDashboardStats,
  VendorOrderParams,
  SalesReport,
  ProductPerformance,
  PaymentHistoryParams,
  PaymentHistoryItem,
  PaymentDetails
} from '../types';
import queryHooks from '../hooks/useQueryHooks';
import { QueryKeys } from '../utils/queryKeys';

const { useApiQuery, useApiMutation, usePaginatedQuery } = queryHooks;

// Traditional API service methods
class VendorService {
  // Store management
  async getStoreDetails(): Promise<ApiResponse<StoreDetails>> {
    return await apiService.get<ApiResponse<StoreDetails>>('/api/v1/vendor/store');
  }
  
  async updateStore(storeData: Partial<VendorStoreData>): Promise<ApiResponse<StoreDetails>> {
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
    
    return await apiService.put<ApiResponse<StoreDetails>>('/api/v1/vendor/store', formData);
  }
  
  // Inventory management
  async getVendorProducts(params: {
    page?: number;
    perPage?: number;
    status?: 'active' | 'inactive' | 'pending' | 'rejected';
    categoryId?: string;
    query?: string;
  } = {}): Promise<ApiResponse<PaginatedResponse<Product>>> {
    return await apiService.get<ApiResponse<PaginatedResponse<Product>>>('/api/v1/vendor/products', params);
  }
  
  async updateInventory(updates: InventoryUpdateData[]): Promise<ApiResponse<null>> {
    return await apiService.patch<ApiResponse<null>>('/api/v1/vendor/inventory/batch', { updates });
  }
  
  async updateProductStatus(productId: string, isActive: boolean): Promise<ApiResponse<Product>> {
    return await apiService.patch<ApiResponse<Product>>(`/api/v1/vendor/products/${productId}/status`, {
      isActive
    });
  }
  
  // Order management
  async getVendorOrders(params: VendorOrderParams = {}): Promise<ApiResponse<PaginatedResponse<Order>>> {
    return await apiService.get<ApiResponse<PaginatedResponse<Order>>>('/api/v1/vendor/orders', params);
  }
  
  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<ApiResponse<Order>> {
    return await apiService.patch<ApiResponse<Order>>(`/api/v1/vendor/orders/${orderId}/status`, { status });
  }
  
  async getOrderById(orderId: string): Promise<ApiResponse<Order>> {
    return await apiService.get<ApiResponse<Order>>(`/api/v1/vendor/orders/${orderId}`);
  }
  
  // Analytics and reporting
  async getDashboardStats(): Promise<ApiResponse<VendorDashboardStats>> {
    return await apiService.get<ApiResponse<VendorDashboardStats>>('/api/v1/vendor/dashboard/stats');
  }
  
  async getSalesReport(params: SalesReportParams = {}): Promise<ApiResponse<SalesReport>> {
    return await apiService.get<ApiResponse<SalesReport>>('/api/v1/vendor/reports/sales', params);
  }
  
  async getProductPerformance(productId: string): Promise<ApiResponse<ProductPerformance>> {
    return await apiService.get<ApiResponse<ProductPerformance>>(`/api/v1/vendor/reports/products/${productId}/performance`);
  }
  
  // Payment management
  async getPaymentHistory(params: PaymentHistoryParams = {}): Promise<ApiResponse<PaginatedResponse<PaymentHistoryItem>>> {
    return await apiService.get<ApiResponse<PaginatedResponse<PaymentHistoryItem>>>('/api/v1/vendor/payments', params);
  }
  
  async getPaymentDetails(paymentId: string): Promise<ApiResponse<PaymentDetails>> {
    return await apiService.get<ApiResponse<PaymentDetails>>(`/api/v1/vendor/payments/${paymentId}`);
  }
}

// Create the standard service instance
const vendorService = new VendorService();

// React Query hooks
export const useVendorStoreDetails = (options = {}) => {
  return useApiQuery(
    QueryKeys.vendor.store,
    () => vendorService.getStoreDetails(),
    options
  );
};

export const useUpdateStore = (options = {}) => {
  return useApiMutation(
    (storeData: Partial<VendorStoreData>) => vendorService.updateStore(storeData),
    options
  );
};

export const useVendorProducts = (params: {
  page?: number;
  perPage?: number;
  status?: 'active' | 'inactive' | 'pending' | 'rejected';
  categoryId?: string;
  query?: string;
} = {}, options = {}) => {
  return usePaginatedQuery(
    QueryKeys.vendor.products(params),
    () => vendorService.getVendorProducts(params),
    options
  );
};

export const useUpdateInventory = (options = {}) => {
  return useApiMutation(
    (updates: InventoryUpdateData[]) => vendorService.updateInventory(updates),
    options
  );
};

export const useUpdateProductStatus = (options = {}) => {
  return useApiMutation(
    ({ productId, isActive }: { productId: string; isActive: boolean }) => 
      vendorService.updateProductStatus(productId, isActive),
    options
  );
};

export const useVendorOrders = (params: VendorOrderParams = {}, options = {}) => {
  return usePaginatedQuery(
    QueryKeys.vendor.orders(params),
    () => vendorService.getVendorOrders(params),
    options
  );
};

export const useUpdateOrderStatus = (options = {}) => {
  return useApiMutation(
    ({ orderId, status }: { orderId: string; status: OrderStatus }) => 
      vendorService.updateOrderStatus(orderId, status),
    options
  );
};

export const useVendorOrderDetail = (orderId: string, options = {}) => {
  return useApiQuery(
    [...QueryKeys.vendor.orders({}), 'detail', orderId],
    () => vendorService.getOrderById(orderId),
    {
      ...options,
      enabled: !!orderId, // Only run query if orderId is provided
    }
  );
};

export const useVendorDashboardStats = (options = {}) => {
  return useApiQuery(
    QueryKeys.vendor.dashboard,
    () => vendorService.getDashboardStats(),
    options
  );
};

export const useVendorSalesReport = (params: SalesReportParams = {}, options = {}) => {
  return useApiQuery(
    QueryKeys.vendor.salesReport(params),
    () => vendorService.getSalesReport(params),
    options
  );
};

export const useProductPerformance = (productId: string, options = {}) => {
  return useApiQuery(
    [...QueryKeys.vendor.products({}), 'performance', productId],
    () => vendorService.getProductPerformance(productId),
    {
      ...options,
      enabled: !!productId, // Only run query if productId is provided
    }
  );
};

export const usePaymentHistory = (params: PaymentHistoryParams = {}, options = {}) => {
  return usePaginatedQuery(
    [...QueryKeys.vendor.orders({}), 'payments', params],
    () => vendorService.getPaymentHistory(params),
    options
  );
};

export const usePaymentDetails = (paymentId: string, options = {}) => {
  return useApiQuery(
    [...QueryKeys.vendor.orders({}), 'payments', 'detail', paymentId],
    () => vendorService.getPaymentDetails(paymentId),
    {
      ...options,
      enabled: !!paymentId, // Only run query if paymentId is provided
    }
  );
};

// Export the original service for cases where direct API calls are needed
export default vendorService;