import apiService from './api';
import { Product, Category, Review, ApiResponse, PaginatedResponse, ProductCreateData } from '../types';

interface ProductFilterParams {
  categoryId?: number;
  vendorId?: number;
  minPrice?: number;
  maxPrice?: number;
  query?: string;
  onSale?: boolean;
  inStock?: boolean;
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'popular';
  page?: number;
  perPage?: number;
}

interface ReviewCreateData {
  productId: string;
  rating: number;
  comment: string;
}

class ProductService {
  // Product methods
  async getProducts(params: ProductFilterParams = {}): Promise<PaginatedResponse<Product>> {
    return await apiService.get<PaginatedResponse<Product>>('/products', params);
  }
  
  async getProductById(id: string): Promise<Product> {
    const response = await apiService.get<ApiResponse<Product>>(`/products/${id}`);
    return response.data;
  }
  
  async getFeaturedProducts(limit = 8): Promise<Product[]> {
    const response = await apiService.get<ApiResponse<Product[]>>('/products/featured', { limit });
    return response.data;
  }
  
  async getNewArrivals(limit = 8): Promise<Product[]> {
    const response = await apiService.get<ApiResponse<Product[]>>('/products/new-arrivals', { limit });
    return response.data;
  }
  
  async getRelatedProducts(productId: string, limit = 4): Promise<Product[]> {
    const response = await apiService.get<ApiResponse<Product[]>>(`/products/${productId}/related`, { limit });
    return response.data;
  }
  
  // Vendor product management
  async createProduct(productData: ProductCreateData): Promise<Product> {
    const response = await apiService.post<ApiResponse<Product>>('/vendor/products', productData);
    return response.data;
  }
  
  async updateProduct(id: string, productData: Partial<ProductCreateData>): Promise<Product> {
    const response = await apiService.put<ApiResponse<Product>>(`/vendor/products/${id}`, productData);
    return response.data;
  }
  
  async deleteProduct(id: string): Promise<void> {
    await apiService.delete<ApiResponse<null>>(`/vendor/products/${id}`);
  }
  
  async uploadProductImage(productId: string, file: File, isPrimary: boolean = false): Promise<{ id: string; imageUrl: string }> {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('isPrimary', isPrimary.toString());
    
    const response = await apiService.post<ApiResponse<{ id: string; imageUrl: string }>>(`/vendor/products/${productId}/images`, formData);
    return response.data;
  }
  
  async deleteProductImage(productId: string, imageId: string): Promise<void> {
    await apiService.delete<ApiResponse<null>>(`/vendor/products/${productId}/images/${imageId}`);
  }

  async setPrimaryImage(productId: string, imageId: string): Promise<void> {
    await apiService.patch<ApiResponse<null>>(`/vendor/products/${productId}/images/${imageId}/set-primary`);
  }
  
  // Category methods
  async getCategories(): Promise<Category[]> {
    const response = await apiService.get<ApiResponse<Category[]>>('/categories');
    return response.data;
  }
  
  async getCategoryById(id: string): Promise<Category> {
    const response = await apiService.get<ApiResponse<Category>>(`/categories/${id}`);
    return response.data;
  }
  
  // Review methods
  async getProductReviews(productId: string): Promise<Review[]> {
    const response = await apiService.get<ApiResponse<Review[]>>(`/products/${productId}/reviews`);
    return response.data;
  }
  
  async createReview(reviewData: ReviewCreateData): Promise<Review> {
    const response = await apiService.post<ApiResponse<Review>>('/reviews', reviewData);
    return response.data;
  }
  
  async updateReview(id: string, data: Partial<ReviewCreateData>): Promise<Review> {
    const response = await apiService.put<ApiResponse<Review>>(`/reviews/${id}`, data);
    return response.data;
  }
  
  async deleteReview(id: string): Promise<void> {
    await apiService.delete<ApiResponse<null>>(`/reviews/${id}`);
  }
  
  // Admin product management
  async approveProduct(id: string): Promise<Product> {
    const response = await apiService.patch<ApiResponse<Product>>(`/admin/products/${id}/approve`);
    return response.data;
  }
  
  async rejectProduct(id: string, reason: string): Promise<void> {
    await apiService.patch<ApiResponse<null>>(`/admin/products/${id}/reject`, { reason });
  }
}

const productService = new ProductService();
export default productService;
