import { queryClient } from "../../../context/QueryContext";
import apiService from "../../../services/api";
import { ApiResponse, PaginatedResponse } from "../../../types";
import {
  PendingCountResponse,
  Product,
  ProductFilterParams,
  RejectProductParams,
} from "../../../types/product";
import {
  ADMIN_PRODUCT_ENDPOINTS,
  CACHE_CONFIG,
} from "../../../utils/constants";
import { QueryKeys } from "../../../utils/queryKeys";
import {
  usePaginatedQuery,
  useApiQuery,
  useApiMutation,
} from "../../useQueryHooks";

/**
 * Custom hook to fetch admin products with filters and pagination
 */
export const useAdminProducts = (
  params: ProductFilterParams = {},
  options = {}
) => {
  return usePaginatedQuery<Product>(
    QueryKeys.admin.products(params),
    async () =>
      await apiService.get<ApiResponse<PaginatedResponse<Product>>>(
        ADMIN_PRODUCT_ENDPOINTS.PRODUCTS,
        params
      ),
    {
      refetchOnWindowFocus: false,
      staleTime: CACHE_CONFIG.STALE_TIMES.SHORT, // 30 seconds for admin panel to get frequent updates
      retry: CACHE_CONFIG.RETRY.NORMAL,
      refetchOnMount: true,
      ...options,
    }
  );
};

/**
 * Custom hook to fetch admin product details by ID
 */
export const useAdminProductDetail = (id: string, options = {}) => {
  return useApiQuery<Product>(
    [...QueryKeys.admin.products({}), id],
    async () =>
      await apiService.get<ApiResponse<Product>>(
        ADMIN_PRODUCT_ENDPOINTS.PRODUCT(id)
      ),
    {
      refetchOnWindowFocus: false,
      staleTime: CACHE_CONFIG.STALE_TIMES.SHORT, // 30 seconds
      retry: CACHE_CONFIG.RETRY.NORMAL,
      ...options,
      enabled: !!id, // Only run query if id is provided
    }
  );
};

/**
 * Custom hook to fetch pending products for admin approval
 */
export const useAdminPendingProducts = (
  params: ProductFilterParams = {},
  options = {}
) => {
  return usePaginatedQuery<Product>(
    [...QueryKeys.admin.products({}), "pending"],
    async () =>
      await apiService.get<ApiResponse<PaginatedResponse<Product>>>(
        ADMIN_PRODUCT_ENDPOINTS.PENDING,
        params
      ),
    {
      refetchOnWindowFocus: false,
      staleTime: CACHE_CONFIG.STALE_TIMES.SHORT, // 30 seconds
      retry: CACHE_CONFIG.RETRY.NORMAL,
      refetchOnMount: true,
      ...options,
    }
  );
};

/**
 * Custom hook to fetch count of pending products for admin approval
 */
export const useAdminPendingProductsCount = (options = {}) => {
  return useApiQuery<PendingCountResponse>(
    [...QueryKeys.admin.products({}), "pendingCount"],
    async () =>
      await apiService.get<ApiResponse<PendingCountResponse>>(
        ADMIN_PRODUCT_ENDPOINTS.PENDING_COUNT
      ),
    {
      refetchOnWindowFocus: false,
      staleTime: CACHE_CONFIG.STALE_TIMES.SHORT, // 30 seconds
      retry: CACHE_CONFIG.RETRY.NORMAL,
      refetchOnMount: true,
      ...options,
    }
  );
};

/**
 * Custom hook for approving products with proper cache invalidation
 */
export const useApproveProduct = () => {
  return useApiMutation<Product, string>(
    async (id: string) => {
      return apiService.patch<ApiResponse<Product>>(
        ADMIN_PRODUCT_ENDPOINTS.APPROVE(id)
      );
    },
    {
      onSuccess: () => {
        // Invalidate relevant queries when a product is approved
        queryClient.invalidateQueries({
          queryKey: QueryKeys.admin.products({}),
        });
        queryClient.invalidateQueries({
          queryKey: [...QueryKeys.admin.products({}), "pending"],
        });
        queryClient.invalidateQueries({
          queryKey: [...QueryKeys.admin.products({}), "pendingCount"],
        });
      },
    }
  );
};

/**
 * Custom hook for rejecting products with proper cache invalidation
 */
export const useRejectProduct = () => {
  return useApiMutation<Product, RejectProductParams>(
    async ({ id, rejectionReason }: RejectProductParams) => {
      return apiService.patch<ApiResponse<Product>>(
        ADMIN_PRODUCT_ENDPOINTS.REJECT(id),
        { rejection_reason: rejectionReason }
      );
    },
    {
      onSuccess: () => {
        // Invalidate relevant queries when a product is rejected
        queryClient.invalidateQueries({
          queryKey: QueryKeys.admin.products({}),
        });
        queryClient.invalidateQueries({
          queryKey: [...QueryKeys.admin.products({}), "pending"],
        });
        queryClient.invalidateQueries({
          queryKey: [...QueryKeys.admin.products({}), "pendingCount"],
        });
      },
    }
  );
};
