import apiService from "./api";
import {
  Product,
  Category,
  Review,
  ApiResponse,
  PaginatedResponse,
  ProductCreateData,
  ProductFilterParams,
  ReviewCreateData,
} from "../types";
import queryHooks from "../hooks/useQueryHooks";
import { QueryKeys } from "../utils/queryKeys";

const { useApiQuery, useApiMutation, usePrefetchQuery, usePaginatedQuery } =
  queryHooks;

// Traditional API service methods
class ProductService {
  // Product methods
  async getProducts(
    params: ProductFilterParams = {}
  ): Promise<ApiResponse<PaginatedResponse<Product>>> {
    return await apiService.get<ApiResponse<PaginatedResponse<Product>>>(
      "/products",
      params
    );
  }

  async getProductById(id: string): Promise<ApiResponse<Product>> {
    return await apiService.get<ApiResponse<Product>>(`/products/${id}`);
  }

  async getFeaturedProducts(limit = 8): Promise<ApiResponse<Product[]>> {
    return await apiService.get<ApiResponse<Product[]>>("/products/featured", {
      limit,
    });
  }

  async getNewArrivals(limit = 8): Promise<ApiResponse<Product[]>> {
    return await apiService.get<ApiResponse<Product[]>>(
      "/products/new_arrivals",
      { limit }
    );
  }

  // Vendor product management
  async createProduct(
    productData: ProductCreateData
  ): Promise<ApiResponse<Product>> {
    return await apiService.post<ApiResponse<Product>>(
      "/vendor/products",
      productData
    );
  }

  async updateProduct(
    id: string,
    productData: Partial<ProductCreateData>
  ): Promise<ApiResponse<Product>> {
    return await apiService.put<ApiResponse<Product>>(
      `/vendor/products/${id}`,
      productData
    );
  }

  async deleteProduct(id: string): Promise<ApiResponse<null>> {
    return await apiService.delete<ApiResponse<null>>(`/vendor/products/${id}`);
  }

  async uploadProductImage(
    productId: string,
    file: File,
    isPrimary: boolean = false
  ): Promise<ApiResponse<{ id: string; imageUrl: string }>> {
    const formData = new FormData();
    formData.append("image", file);
    formData.append("isPrimary", isPrimary.toString());

    return await apiService.post<ApiResponse<{ id: string; imageUrl: string }>>(
      `/vendor/products/${productId}/images`,
      formData
    );
  }

  async deleteProductImage(
    productId: string,
    imageId: string
  ): Promise<ApiResponse<null>> {
    return await apiService.delete<ApiResponse<null>>(
      `/vendor/products/${productId}/images/${imageId}`
    );
  }

  async setPrimaryImage(
    productId: string,
    imageId: string
  ): Promise<ApiResponse<null>> {
    return await apiService.patch<ApiResponse<null>>(
      `/vendor/products/${productId}/images/${imageId}/set-primary`
    );
  }

  // Category methods
  async getCategories(): Promise<ApiResponse<Category[]>> {
    return await apiService.get<ApiResponse<Category[]>>("/categories");
  }

  async getCategoryById(id: string): Promise<ApiResponse<Category>> {
    return await apiService.get<ApiResponse<Category>>(`/categories/${id}`);
  }

  // Review methods
  async getProductReviews(productId: string): Promise<ApiResponse<Review[]>> {
    return await apiService.get<ApiResponse<Review[]>>(
      `/products/${productId}/reviews`
    );
  }

  async createReview(
    reviewData: ReviewCreateData
  ): Promise<ApiResponse<Review>> {
    return await apiService.post<ApiResponse<Review>>("/reviews", reviewData);
  }

  async updateReview(
    id: string,
    data: Partial<ReviewCreateData>
  ): Promise<ApiResponse<Review>> {
    return await apiService.put<ApiResponse<Review>>(`/reviews/${id}`, data);
  }

  async deleteReview(id: string): Promise<ApiResponse<null>> {
    return await apiService.delete<ApiResponse<null>>(`/reviews/${id}`);
  }
}

// Create the standard service instance
const productService = new ProductService();

// React Query hooks
export const useProducts = (params: ProductFilterParams = {}, options = {}) => {
  return usePaginatedQuery(
    QueryKeys.products.list(params),
    () => productService.getProducts(params),
    options
  );
};

export const useProductDetail = (id: string, options = {}) => {
  return useApiQuery(
    QueryKeys.products.detail(id),
    () => productService.getProductById(id),
    {
      ...options,
      enabled: !!id, // Only run query if id is provided
    }
  );
};

export const useFeaturedProducts = (limit = 8, options = {}) => {
  return useApiQuery(
    QueryKeys.products.featured,
    () => productService.getFeaturedProducts(limit),
    options
  );
};

export const useNewArrivals = (limit = 8, options = {}) => {
  return useApiQuery(
    QueryKeys.products.newArrivals,
    () => productService.getNewArrivals(limit),
    options
  );
};

export const useCategories = (options = {}) => {
  return useApiQuery(
    QueryKeys.categories.all,
    () => productService.getCategories(),
    options
  );
};

export const useCategoryDetail = (id: string, options = {}) => {
  return useApiQuery(
    QueryKeys.categories.detail(id),
    () => productService.getCategoryById(id),
    {
      ...options,
      enabled: !!id, // Only run query if id is provided
    }
  );
};

export const useProductReviews = (productId: string, options = {}) => {
  return useApiQuery(
    QueryKeys.products.reviews(productId),
    () => productService.getProductReviews(productId),
    {
      ...options,
      enabled: !!productId, // Only run query if productId is provided
    }
  );
};

// Mutation hooks
export const useCreateProduct = (options = {}) => {
  return useApiMutation(
    (productData: ProductCreateData) =>
      productService.createProduct(productData),
    options
  );
};

export const useUpdateProduct = (id: string, options = {}) => {
  return useApiMutation(
    (productData: Partial<ProductCreateData>) =>
      productService.updateProduct(id, productData),
    options
  );
};

export const useDeleteProduct = (options = {}) => {
  return useApiMutation(
    (id: string) => productService.deleteProduct(id),
    options
  );
};

export const useCreateReview = (options = {}) => {
  return useApiMutation(
    (reviewData: ReviewCreateData) => productService.createReview(reviewData),
    options
  );
};

export const useUpdateReview = (id: string, options = {}) => {
  return useApiMutation(
    (data: Partial<ReviewCreateData>) => productService.updateReview(id, data),
    options
  );
};

export const useDeleteReview = (options = {}) => {
  return useApiMutation(
    (id: string) => productService.deleteReview(id),
    options
  );
};

export const useUploadProductImage = (productId: string, options = {}) => {
  return useApiMutation(
    ({ file, isPrimary = false }: { file: File; isPrimary?: boolean }) =>
      productService.uploadProductImage(productId, file, isPrimary),
    options
  );
};

export const useDeleteProductImage = (options = {}) => {
  return useApiMutation(
    ({ productId, imageId }: { productId: string; imageId: string }) =>
      productService.deleteProductImage(productId, imageId),
    options
  );
};

export const useSetPrimaryImage = (options = {}) => {
  return useApiMutation(
    ({ productId, imageId }: { productId: string; imageId: string }) =>
      productService.setPrimaryImage(productId, imageId),
    options
  );
};

// Hook for prefetching product details
export const usePrefetchProductDetail = () => {
  const prefetchQuery = usePrefetchQuery<Product>();

  return (id: string) => {
    return prefetchQuery(QueryKeys.products.detail(id), () =>
      productService.getProductById(id)
    );
  };
};

// Export the original service for cases where direct API calls are needed
export default productService;
