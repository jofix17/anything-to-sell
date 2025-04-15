import apiService from "./api";
import {
  User,
  Product,
  Category,
  Order,
  OrderStatus,
  DiscountEvent,
  ApiResponse,
  PaginatedResponse,
  DiscountEventData,
  CategoryCreateData,
  AdminDashboardStats,
  UserFilterParams,
  ProductApprovalParams,
  DateRange,
} from "../types";
import queryHooks from "../hooks/useQueryHooks";
import { QueryKeys } from "../utils/queryKeys";

const { useApiQuery, useApiMutation, usePaginatedQuery } = queryHooks;

// Traditional API service methods
class AdminService {
  // User management
  async getUsers(
    params: UserFilterParams = {}
  ): Promise<ApiResponse<PaginatedResponse<User>>> {
    return await apiService.get<ApiResponse<PaginatedResponse<User>>>(
      "/admin/users",
      params
    );
  }

  async getUserById(id: string): Promise<ApiResponse<User>> {
    return await apiService.get<ApiResponse<User>>(`/admin/users/${id}`);
  }

  async updateUser(
    id: string,
    userData: Partial<User>
  ): Promise<ApiResponse<User>> {
    return await apiService.put<ApiResponse<User>>(
      `/admin/users/${id}`,
      userData
    );
  }

  async suspendUser(id: string, reason: string): Promise<ApiResponse<User>> {
    return await apiService.patch<ApiResponse<User>>(
      `/admin/users/${id}/suspend`,
      { reason }
    );
  }

  async activateUser(id: string): Promise<ApiResponse<User>> {
    return await apiService.patch<ApiResponse<User>>(
      `/admin/users/${id}/activate`
    );
  }

  // Get vendors for filter selection
  async getVendors(): Promise<ApiResponse<User[]>> {
    return await apiService.get<ApiResponse<User[]>>("/admin/users", {
      role: "vendor",
    });
  }

  // Order management
  async getOrders(
    params: {
      page?: number;
      perPage?: number;
      status?: string;
      startDate?: string;
      endDate?: string;
      query?: string;
    } = {}
  ): Promise<ApiResponse<PaginatedResponse<Order>>> {
    return await apiService.get<ApiResponse<PaginatedResponse<Order>>>(
      "/admin/orders",
      params
    );
  }

  async getOrderById(id: string): Promise<ApiResponse<Order>> {
    return await apiService.get<ApiResponse<Order>>(`/admin/orders/${id}`);
  }

  async updateOrderStatus(
    orderId: string,
    status: OrderStatus
  ): Promise<ApiResponse<Order>> {
    return await apiService.patch<ApiResponse<Order>>(
      `/admin/orders/${orderId}/status`,
      { status }
    );
  }

  // Product management
  async getPendingProducts(
    params: ProductApprovalParams = {}
  ): Promise<ApiResponse<PaginatedResponse<Product>>> {
    return await apiService.get<ApiResponse<PaginatedResponse<Product>>>(
      "/admin/products/pending",
      params
    );
  }

  async getProducts(
    params: {
      page?: number;
      perPage?: number;
      status?: string;
      categoryId?: string;
      vendorId?: string;
      query?: string;
      minPrice?: number;
      maxPrice?: number;
      onSale?: boolean;
    } = {}
  ): Promise<ApiResponse<PaginatedResponse<Product>>> {
    return await apiService.get<ApiResponse<PaginatedResponse<Product>>>(
      "/admin/products",
      params
    );
  }

  async getPendingProductsCount(): Promise<ApiResponse<{ total: number }>> {
    return await apiService.get<ApiResponse<{ total: number }>>(
      "/admin/products/pending/count"
    );
  }

  async approveProduct(id: string): Promise<ApiResponse<Product>> {
    return await apiService.patch<ApiResponse<Product>>(
      `/admin/products/${id}/approve`
    );
  }

  async rejectProduct(
    id: string,
    reason: string
  ): Promise<ApiResponse<Product>> {
    return await apiService.patch<ApiResponse<Product>>(
      `/admin/products/${id}/reject`,
      { reason }
    );
  }

  // Category management
  async createCategory(
    categoryData: CategoryCreateData
  ): Promise<ApiResponse<Category>> {
    const formData = new FormData();

    formData.append("name", categoryData.name);

    if (categoryData.description) {
      formData.append("description", categoryData.description);
    }

    if (categoryData.parentId) {
      formData.append("parentId", categoryData.parentId.toString());
    }

    if (categoryData.imageFile) {
      formData.append("image", categoryData.imageFile);
    }

    return await apiService.post<ApiResponse<Category>>(
      "/admin/categories",
      formData
    );
  }

  async updateCategory(
    id: string,
    categoryData: Partial<CategoryCreateData>
  ): Promise<ApiResponse<Category>> {
    const formData = new FormData();

    if (categoryData.name) {
      formData.append("name", categoryData.name);
    }

    if (categoryData.description !== undefined) {
      formData.append("description", categoryData.description || "");
    }

    if (categoryData.parentId !== undefined) {
      formData.append(
        "parentId",
        categoryData.parentId ? categoryData.parentId.toString() : ""
      );
    }

    if (categoryData.imageFile) {
      formData.append("image", categoryData.imageFile);
    }

    return await apiService.put<ApiResponse<Category>>(
      `/admin/categories/${id}`,
      formData
    );
  }

  async deleteCategory(id: string): Promise<ApiResponse<null>> {
    return await apiService.delete<ApiResponse<null>>(
      `/admin/categories/${id}`
    );
  }

  // Discount event management
  async getDiscountEvents(): Promise<ApiResponse<DiscountEvent[]>> {
    return await apiService.get<ApiResponse<DiscountEvent[]>>(
      "/admin/discount-events"
    );
  }

  async createDiscountEvent(
    eventData: DiscountEventData
  ): Promise<ApiResponse<DiscountEvent>> {
    return await apiService.post<ApiResponse<DiscountEvent>>(
      "/admin/discount-events",
      eventData
    );
  }

  async updateDiscountEvent(
    id: string,
    eventData: Partial<DiscountEventData>
  ): Promise<ApiResponse<DiscountEvent>> {
    return await apiService.put<ApiResponse<DiscountEvent>>(
      `/admin/discount-events/${id}`,
      eventData
    );
  }

  async deleteDiscountEvent(id: string): Promise<ApiResponse<null>> {
    return await apiService.delete<ApiResponse<null>>(
      `/admin/discount-events/${id}`
    );
  }

  async activateDiscountEvent(id: string): Promise<ApiResponse<DiscountEvent>> {
    return await apiService.patch<ApiResponse<DiscountEvent>>(
      `/admin/discount-events/${id}/activate`
    );
  }

  async deactivateDiscountEvent(
    id: string
  ): Promise<ApiResponse<DiscountEvent>> {
    return await apiService.patch<ApiResponse<DiscountEvent>>(
      `/admin/discount-events/${id}/deactivate`
    );
  }

  // Dashboard statistics
  async getDashboardStats(
    dateRange?: DateRange
  ): Promise<ApiResponse<AdminDashboardStats>> {
    return await apiService.get<ApiResponse<AdminDashboardStats>>(
      "/admin/dashboard/stats",
      { dateRange }
    );
  }
}

// Create the standard service instance
const adminService = new AdminService();

// React Query hooks with improved invalidation
export const useAdminUsers = (params: UserFilterParams = {}, options = {}) => {
  return usePaginatedQuery(
    QueryKeys.admin.users(params),
    () => adminService.getUsers(params),
    options
  );
};

export const useAdminUserDetail = (id: string, options = {}) => {
  return useApiQuery(
    [...QueryKeys.admin.users({}), "detail", id],
    () => adminService.getUserById(id),
    {
      ...options,
      enabled: !!id, // Only run query if id is provided
    }
  );
};

const userQueryInvalidations = (id: string) => [
  QueryKeys.admin.users({}), // Invalidate the users list
  [...QueryKeys.admin.users({}), "detail", id] // Invalidate the specific user
];

export const useUpdateUser = (options = {}) => {
  return useApiMutation(
    ({ id, userData }: { id: string; userData: Partial<User> }) =>
      adminService.updateUser(id, userData),
    {
      ...options,
      meta: {
        invalidateQueries: ({ id }: { id: string }) => userQueryInvalidations(id)
      }
    }
  );
};

export const useSuspendUser = (options = {}) => {
  return useApiMutation(
    ({ id, reason }: { id: string; reason: string }) =>
      adminService.suspendUser(id, reason),
    {
      ...options,
      meta: {
        invalidateQueries: ({ id }: { id: string; reason: string }) => userQueryInvalidations(id)
      }
    }
  );
};

export const useActivateUser = (options = {}) => {
  return useApiMutation(
    (id: string) => adminService.activateUser(id),
    {
      ...options,
      meta: {
        invalidateQueries: (id: string) => userQueryInvalidations(id)
      }
    }
  );
};

// Products hooks
export const useAdminProducts = (
  params: {
    page?: number;
    perPage?: number;
    status?: string;
    categoryId?: string;
    vendorId?: string;
    query?: string;
    minPrice?: number;
    maxPrice?: number;
    onSale?: boolean;
  } = {},
  options = {}
) => {
  return usePaginatedQuery(
    QueryKeys.admin.products(params),
    () => adminService.getProducts(params),
    options
  );
};

export const usePendingProducts = (
  params: ProductApprovalParams = {},
  options = {}
) => {
  return usePaginatedQuery(
    QueryKeys.admin.products({ ...params, status: "pending" }),
    () => adminService.getPendingProducts(params),
    options
  );
};

export const usePendingProductsCount = (options = {}) => {
  return useApiQuery(
    [...QueryKeys.admin.products({}), "pending", "count"],
    () => adminService.getPendingProductsCount(),
    options
  );
};

// Define the key query invalidation patterns for products
const productQueryInvalidations = (id: string) => [
  QueryKeys.admin.products({}), // Invalidate all products
  QueryKeys.admin.products({ status: "pending" }), // Invalidate pending products
  [...QueryKeys.admin.products({}), "pending", "count"], // Invalidate pending count
  [...QueryKeys.admin.products({}), "detail", id] // Invalidate specific product
];

export const useApproveProduct = (options = {}) => {
  return useApiMutation(
    (id: string) => adminService.approveProduct(id),
    {
      ...options,
      meta: {
        invalidateQueries: (id: string) => productQueryInvalidations(id)
      }
    }
  );
};

export const useRejectProduct = (options = {}) => {
  return useApiMutation(
    ({ id, reason }: { id: string; reason: string }) =>
      adminService.rejectProduct(id, reason),
    {
      ...options,
      meta: {
        invalidateQueries: ({ id }: { id: string; reason: string }) => productQueryInvalidations(id)
      }
    }
  );
};

// Categories hooks with improved invalidation
const categoryQueryInvalidations = [QueryKeys.categories.all];

export const useCreateCategory = (options = {}) => {
  return useApiMutation(
    (categoryData: CategoryCreateData) =>
      adminService.createCategory(categoryData),
    {
      ...options,
      meta: {
        invalidateQueries: categoryQueryInvalidations
      }
    }
  );
};

export const useUpdateCategory = (options = {}) => {
  return useApiMutation(
    ({
      id,
      categoryData,
    }: {
      id: string;
      categoryData: Partial<CategoryCreateData>;
    }) => adminService.updateCategory(id, categoryData),
    {
      ...options,
      meta: {
        invalidateQueries: categoryQueryInvalidations.concat([
          [...QueryKeys.categories.all, "detail"]
        ])
      }
    }
  );
};

export const useDeleteCategory = (options = {}) => {
  return useApiMutation(
    (id: string) => adminService.deleteCategory(id),
    {
      ...options,
      meta: {
        invalidateQueries: categoryQueryInvalidations
      }
    }
  );
};

// Discount hooks with improved invalidation
export const useDiscountEvents = (options = {}) => {
  return useApiQuery(
    QueryKeys.admin.discounts,
    () => adminService.getDiscountEvents(),
    options
  );
};

export const useCreateDiscountEvent = (options = {}) => {
  return useApiMutation(
    (eventData: DiscountEventData) =>
      adminService.createDiscountEvent(eventData),
    {
      ...options,
      meta: {
        invalidateQueries: [QueryKeys.admin.discounts]
      }
    }
  );
};

export const useUpdateDiscountEvent = (options = {}) => {
  return useApiMutation(
    ({
      id,
      eventData,
    }: {
      id: string;
      eventData: Partial<DiscountEventData>;
    }) => adminService.updateDiscountEvent(id, eventData),
    {
      ...options,
      meta: {
        invalidateQueries: [QueryKeys.admin.discounts]
      }
    }
  );
};

export const useDeleteDiscountEvent = (options = {}) => {
  return useApiMutation(
    (id: string) => adminService.deleteDiscountEvent(id),
    {
      ...options,
      meta: {
        invalidateQueries: [QueryKeys.admin.discounts]
      }
    }
  );
};

export const useActivateDiscountEvent = (options = {}) => {
  return useApiMutation(
    (id: string) => adminService.activateDiscountEvent(id),
    {
      ...options,
      meta: {
        invalidateQueries: [QueryKeys.admin.discounts]
      }
    }
  );
};

export const useDeactivateDiscountEvent = (options = {}) => {
  return useApiMutation(
    (id: string) => adminService.deactivateDiscountEvent(id),
    {
      ...options,
      meta: {
        invalidateQueries: [QueryKeys.admin.discounts]
      }
    }
  );
};

// Order hooks with improved invalidation
export const useAdminOrders = (
  params: {
    page?: number;
    perPage?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
    query?: string;
  } = {},
  options = {}
) => {
  return usePaginatedQuery(
    QueryKeys.admin.orders(params),
    () => adminService.getOrders(params),
    options
  );
};

export const useAdminOrderDetail = (id: string, options = {}) => {
  return useApiQuery(
    [...QueryKeys.admin.orders({}), "detail", id],
    () => adminService.getOrderById(id),
    {
      ...options,
      enabled: !!id, // Only run query if id is provided
    }
  );
};

export const useUpdateOrderStatus = (options = {}) => {
  return useApiMutation(
    ({ orderId, status }: { orderId: string; status: OrderStatus }) =>
      adminService.updateOrderStatus(orderId, status),
    {
      ...options,
      meta: {
        invalidateQueries: ({ orderId }: { orderId: string; status: OrderStatus }) => [
          QueryKeys.admin.orders({}),
          [...QueryKeys.admin.orders({}), "detail", orderId]
        ]
      }
    }
  );
};

// Vendors hook
export const useAdminVendors = (options = {}) => {
  return useApiQuery(
    QueryKeys.admin.vendors({}),
    () => adminService.getVendors(),
    options
  );
};

// Dashboard hooks
export const useAdminDashboardStats = (
  options: {
    queryParams?: { dateRange?: DateRange };
    [key: string]: unknown;
  } = {}
) => {
  const { queryParams, ...restOptions } = options;
  const dateRange = queryParams?.dateRange;

  return useApiQuery(
    QueryKeys.admin.dashboard,
    () => adminService.getDashboardStats(dateRange),
    restOptions
  );
};

// Export the original service for cases where direct API calls are needed
export default adminService;