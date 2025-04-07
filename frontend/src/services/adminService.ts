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
} from "../types";

interface UserFilterParams {
  role?: "admin" | "vendor" | "buyer";
  isActive?: boolean;
  query?: string;
  page?: number;
  perPage?: number;
}

interface ProductApprovalParams {
  status?: "pending" | "approved" | "rejected";
  vendorId?: number;
  categoryId?: number;
  page?: number;
  perPage?: number;
}

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

  async getUserById(id: string): Promise<User> {
    const response = await apiService.get<ApiResponse<User>>(
      `/admin/users/${id}`
    );
    return response.data;
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    const response = await apiService.put<ApiResponse<User>>(
      `/admin/users/${id}`,
      userData
    );
    return response.data;
  }

  async suspendUser(id: string, reason?: string): Promise<User> {
    const response = await apiService.patch<ApiResponse<User>>(
      `/admin/users/${id}/suspend`,
      { reason }
    );
    return response.data;
  }

  async activateUser(id: string): Promise<User> {
    const response = await apiService.patch<ApiResponse<User>>(
      `/admin/users/${id}/activate`
    );
    return response.data;
  }

  // Product approval management
  async getPendingProducts(
    params: ProductApprovalParams = {}
  ): Promise<PaginatedResponse<Product>> {
    return await apiService.get<PaginatedResponse<Product>>(
      "/admin/products/pending",
      params
    );
  }

  async approveProduct(id: string): Promise<Product> {
    const response = await apiService.patch<ApiResponse<Product>>(
      `/admin/products/${id}/approve`
    );
    return response.data;
  }

  async rejectProduct(id: string, reason: string): Promise<Product> {
    const response = await apiService.patch<ApiResponse<Product>>(
      `/admin/products/${id}/reject`,
      { reason }
    );
    return response.data;
  }

  // Category management
  async createCategory(categoryData: CategoryCreateData): Promise<Category> {
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

    const response = await apiService.post<ApiResponse<Category>>(
      "/admin/categories",
      formData
    );
    return response.data;
  }

  async updateCategory(
    id: string,
    categoryData: Partial<CategoryCreateData>
  ): Promise<Category> {
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

    const response = await apiService.put<ApiResponse<Category>>(
      `/admin/categories/${id}`,
      formData
    );
    return response.data;
  }

  async deleteCategory(id: string): Promise<void> {
    await apiService.delete<ApiResponse<null>>(`/admin/categories/${id}`);
  }

  // Discount event management
  async getDiscountEvents(): Promise<DiscountEvent[]> {
    const response = await apiService.get<ApiResponse<DiscountEvent[]>>(
      "/admin/discount-events"
    );
    return response.data;
  }

  async createDiscountEvent(
    eventData: DiscountEventData
  ): Promise<DiscountEvent> {
    const response = await apiService.post<ApiResponse<DiscountEvent>>(
      "/admin/discount-events",
      eventData
    );
    return response.data;
  }

  async updateDiscountEvent(
    id: string,
    eventData: Partial<DiscountEventData>
  ): Promise<DiscountEvent> {
    const response = await apiService.put<ApiResponse<DiscountEvent>>(
      `/admin/discount-events/${id}`,
      eventData
    );
    return response.data;
  }

  async deleteDiscountEvent(id: string): Promise<void> {
    await apiService.delete<ApiResponse<null>>(`/admin/discount-events/${id}`);
  }

  async activateDiscountEvent(id: string): Promise<DiscountEvent> {
    const response = await apiService.patch<ApiResponse<DiscountEvent>>(
      `/admin/discount-events/${id}/activate`
    );
    return response.data;
  }

  async deactivateDiscountEvent(id: string): Promise<DiscountEvent> {
    const response = await apiService.patch<ApiResponse<DiscountEvent>>(
      `/admin/discount-events/${id}/deactivate`
    );
    return response.data;
  }

  // Dashboard statistics
  async getDashboardStats(): Promise<AdminDashboardStats> {
    const response = await apiService.get<ApiResponse<AdminDashboardStats>>(
      "/admin/dashboard/stats"
    );
    return response.data;
  }
}

const adminService = new AdminService();
export default adminService;
