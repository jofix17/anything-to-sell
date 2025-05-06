import apiService from "../../services/api";
import { ApiResponse, PaginatedResponse } from "../../types";
import { Product, ProductFilterParams } from "../../types/product";
import { CACHE_CONFIG, PRODUCT_ENDPOINTS } from "../../utils/constants";
import { QueryKeys } from "../../utils/queryKeys";
import { useApiQuery, usePaginatedQuery } from "../useQueryHooks";

/**
 * Custom hook to fetch products with filters and pagination
 */
export const useProducts = (params: ProductFilterParams = {}, options = {}) => {
  return usePaginatedQuery<Product>(
    QueryKeys.products.list(params),
    async () =>
      await apiService.get<ApiResponse<PaginatedResponse<Product>>>(
        PRODUCT_ENDPOINTS.PRODUCTS,
        params
      ),
    {
      refetchOnWindowFocus: false,
      staleTime: CACHE_CONFIG.STALE_TIMES.STANDARD, // 1 minute
      retry: CACHE_CONFIG.RETRY.NORMAL,
      refetchOnMount: true,
      ...options,
    }
  );
};

/**
 * Custom hook to fetch product details by ID with consistent error handling
 */
export const useProductDetail = (id: string, options = {}) => {
  return useApiQuery<Product>(
    QueryKeys.products.detail(id),
    async () =>
      await apiService.get<ApiResponse<Product>>(PRODUCT_ENDPOINTS.PRODUCT(id)),
    {
      refetchOnWindowFocus: false,
      staleTime: CACHE_CONFIG.STALE_TIMES.MEDIUM, // 5 minutes
      retry: CACHE_CONFIG.RETRY.NORMAL,
      ...options,
      enabled: !!id, // Only run query if id is provided
    }
  );
};

/**
 * Custom hook to fetch featured products with caching
 */
export const useFeaturedProducts = (limit = 8, options = {}) => {
  return useApiQuery<Product[]>(
    QueryKeys.products.featured,
    async () =>
      await apiService.get<ApiResponse<Product[]>>(PRODUCT_ENDPOINTS.FEATURED, {
        limit,
      }),
    {
      refetchOnWindowFocus: false,
      staleTime: CACHE_CONFIG.STALE_TIMES.LONG, // 30 minutes
      retry: CACHE_CONFIG.RETRY.NORMAL,
      ...options,
    }
  );
};

/**
 * Custom hook to fetch new arrivals with caching
 */
export const useNewArrivals = (limit = 8, options = {}) => {
  return useApiQuery<Product[]>(
    QueryKeys.products.newArrivals,
    async () =>
      await apiService.get<ApiResponse<Product[]>>(
        PRODUCT_ENDPOINTS.NEW_ARRIVALS,
        { limit }
      ),
    {
      refetchOnWindowFocus: false,
      staleTime: CACHE_CONFIG.STALE_TIMES.LONG, // 30 minutes
      retry: CACHE_CONFIG.RETRY.NORMAL,
      ...options,
    }
  );
};
