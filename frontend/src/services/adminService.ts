import apiService from "./api";
import {
  User,
  Product,
  Category,
  DiscountEvent,
  ApiResponse,
  PaginatedResponse,
  DiscountEventData,
  CategoryCreateData,
  AdminDashboardStats,
  UserFilterParams,
  ProductApprovalParams
} from "../types";
import { useApiQuery, useApiMutation, usePaginatedQuery } from "../hooks/useQueryHooks";
import { QueryKeys } from "../utils/queryKeys";

// Traditional API service methods
class AdminService {
  // User management
  async getUsers(
    params: UserFilterParams = {}
  ): Promise<PaginatedResponse<User>> {
    return await apiService.get<PaginatedResponse<User>>(
      "/admin/users",
      params
    );
  }

  async getUserById(id: string): Promise<ApiResponse<User>> {
    return await apiService.get<ApiResponse<User>>(`/admin/users/${id}`);
  }

  async updateUser(id: string, userData: Partial<User>): Promise<ApiResponse<User>> {
    return await apiService.put<ApiResponse<User>>(`/admin/users/${id}`, userData);
  }

  async suspendUser(id: string, reason?: string): Promise<ApiResponse<User>> {
    return await apiService.patch<ApiResponse<User>>(`/admin/users/${id}/suspend`, { reason });
  }

  async activateUser(id: string): Promise<ApiResponse<User>> {
    return await apiService.patch<ApiResponse<User>>(`/admin/users/${id}/activate`);
  }

  // Product approval management
  async getPendingProducts(
    params: ProductApprovalParams = {}
  ): Promise<PaginatedResponse<Product>> {
    return await apiService.get<PaginatedResponse<Product>>("/admin/products/pending", params);
  }

  async approveProduct(id: string): Promise<ApiResponse<Product>> {
    return await apiService.patch<ApiResponse<Product>>(`/admin/products/${id}/approve`);
  }

  async rejectProduct(id: string, reason: string): Promise<ApiResponse<Product>> {
    return await apiService.patch<ApiResponse<Product>>(`/admin/products/${id}/reject`, { reason });
  }

  // Category management
  async createCategory(categoryData: CategoryCreateData): Promise<ApiResponse<Category>> {
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

    return await apiService.post<ApiResponse<Category>>("/admin/categories", formData);
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

    return await apiService.put<ApiResponse<Category>>(`/admin/categories/${id}`, formData);
  }

  async deleteCategory(id: string): Promise<ApiResponse<null>> {
    return await apiService.delete<ApiResponse<null>>(`/admin/categories/${id}`);
  }

  // Discount event management
  async getDiscountEvents(): Promise<ApiResponse<DiscountEvent[]>> {
    return await apiService.get<ApiResponse<DiscountEvent[]>>("/admin/discount-events");
  }

  async createDiscountEvent(
    eventData: DiscountEventData
  ): Promise<ApiResponse<DiscountEvent>> {
    return await apiService.post<ApiResponse<DiscountEvent>>("/admin/discount-events", eventData);
  }

  async updateDiscountEvent(
    id: string,
    eventData: Partial<DiscountEventData>
  ): Promise<ApiResponse<DiscountEvent>> {
    return await apiService.put<ApiResponse<DiscountEvent>>(`/admin/discount-events/${id}`, eventData);
  }

  async deleteDiscountEvent(id: string): Promise<ApiResponse<null>> {
    return await apiService.delete<ApiResponse<null>>(`/admin/discount-events/${id}`);
  }

  async activateDiscountEvent(id: string): Promise<ApiResponse<DiscountEvent>> {
    return await apiService.patch<ApiResponse<DiscountEvent>>(`/admin/discount-events/${id}/activate`);
  }

  async deactivateDiscountEvent(id: string): Promise<ApiResponse<DiscountEvent>> {
    return await apiService.patch<ApiResponse<DiscountEvent>>(`/admin/discount-events/${id}/deactivate`);
  }

  // Dashboard statistics
  async getDashboardStats(): Promise<ApiResponse<AdminDashboardStats>> {
    return await apiService.get<ApiResponse<AdminDashboardStats>>("/admin/dashboard/stats");
  }
}

// Create the standard service instance
const adminService = new AdminService();

// React Query hooks
export const useAdminUsers = (params: UserFilterParams = {}, options = {}) => {
  return usePaginatedQuery(
    QueryKeys.admin.users(params),
    () => adminService.getUsers(params),
    options
  );
};

export const useAdminUserDetail = (id: string, options = {}) => {
  return useApiQuery(
    [...QueryKeys.admin.users({}), 'detail', id],
    () => adminService.getUserById(id),
    {
      ...options,
      enabled: !!id, // Only run query if id is provided
    }
  );
};

export const useUpdateUser = (id: string, options = {}) => {
  return useApiMutation(
    (userData: Partial<User>) => adminService.updateUser(id, userData),
    options
  );
};

export const useSuspendUser = (options = {}) => {
  return useApiMutation(
    ({ id, reason }: { id: string; reason?: string }) => adminService.suspendUser(id, reason),
    options
  );
};

export const useActivateUser = (options = {}) => {
  return useApiMutation(
    (id: string) => adminService.activateUser(id),
    options
  );
};

export const usePendingProducts = (params: ProductApprovalParams = {}, options = {}) => {
  return usePaginatedQuery(
    QueryKeys.admin.products({ ...params, status: 'pending' }),
    () => adminService.getPendingProducts(params),
    options
  );
};

export const useApproveProduct = (options = {}) => {
  return useApiMutation(
    (id: string) => adminService.approveProduct(id),
    options
  );
};

export const useRejectProduct = (options = {}) => {
  return useApiMutation(
    ({ id, reason }: { id: string; reason: string }) => adminService.rejectProduct(id, reason),
    options
  );
};

export const useCreateCategory = (options = {}) => {
  return useApiMutation(
    (categoryData: CategoryCreateData) => adminService.createCategory(categoryData),
    options
  );
};

export const useUpdateCategory = (id: string, options = {}) => {
  return useApiMutation(
    (categoryData: Partial<CategoryCreateData>) => adminService.updateCategory(id, categoryData),
    options
  );
};

export const useDeleteCategory = (options = {}) => {
  return useApiMutation(
    (id: string) => adminService.deleteCategory(id),
    options
  );
};

export const useDiscountEvents = (options = {}) => {
  return useApiQuery(
    QueryKeys.admin.discounts,
    () => adminService.getDiscountEvents(),
    options
  );
};

export const useCreateDiscountEvent = (options = {}) => {
  return useApiMutation(
    (eventData: DiscountEventData) => adminService.createDiscountEvent(eventData),
    options
  );
};

export const useUpdateDiscountEvent = (id: string, options = {}) => {
  return useApiMutation(
    (eventData: Partial<DiscountEventData>) => adminService.updateDiscountEvent(id, eventData),
    options
  );
};

export const useDeleteDiscountEvent = (options = {}) => {
  return useApiMutation(
    (id: string) => adminService.deleteDiscountEvent(id),
    options
  );
};

export const useActivateDiscountEvent = (options = {}) => {
  return useApiMutation(
    (id: string) => adminService.activateDiscountEvent(id),
    options
  );
};

export const useDeactivateDiscountEvent = (options = {}) => {
  return useApiMutation(
    (id: string) => adminService.deactivateDiscountEvent(id),
    options
  );
};

export const useAdminDashboardStats = (options = {}) => {
  return useApiQuery(
    QueryKeys.admin.dashboard,
    () => adminService.getDashboardStats(),
    options
  );
};

// Export the original service for cases where direct API calls are needed
export default adminService;