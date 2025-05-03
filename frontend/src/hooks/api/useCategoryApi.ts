import apiService from "../../services/api";
import { ApiResponse } from "../../types";
import { Category } from "../../types/category";
import { CACHE_CONFIG, CATEGORY_ENDPOINTS } from "../../utils/constants";
import { QueryKeys } from "../../utils/queryKeys";
import { useApiQuery } from "../useQueryHooks";

/**
 * Custom hook to fetch all categories with improved error handling and caching
 */
export const useCategories = (options = {}) => {
  return useApiQuery<Category[]>(
    QueryKeys.categories.all,
    async () =>
      await apiService.get<ApiResponse<Category[]>>(
        CATEGORY_ENDPOINTS.CATEGORIES
      ),
    {
      refetchOnWindowFocus: false,
      staleTime: CACHE_CONFIG.STALE_TIMES.MEDIUM, // 5 minutes
      retry: CACHE_CONFIG.RETRY.NORMAL,
      refetchOnMount: true,
      ...options,
    }
  );
};

/**
 * Custom hook to fetch category details by ID with consistent error handling
 */
export const useCategoryDetail = (id: string, options = {}) => {
  return useApiQuery<Category>(
    QueryKeys.categories.detail(id),
    async () =>
      await apiService.get<ApiResponse<Category>>(
        CATEGORY_ENDPOINTS.CATEGORY(id)
      ),
    {
      refetchOnWindowFocus: false,
      staleTime: CACHE_CONFIG.STALE_TIMES.MEDIUM, // 5 minutes
      retry: CACHE_CONFIG.RETRY.NORMAL,
      ...options,
      enabled: !!id, // Only run query if id is provided
    }
  );
};
