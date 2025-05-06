import apiService from "../../services/api";
import { ApiResponse, PaginatedResponse } from "../../types";
import {
  DiscountCode,
  DiscountCodeFormData,
  DiscountCodeValidationParams,
  DiscountCodeValidationResult,
  DiscountCodeApplicationResult,
  DiscountCodeApplicationParams,
} from "../../types/discountCode";
import { CACHE_CONFIG, DISCOUNT_CODE_ENDPOINTS } from "../../utils/constants";
import { QueryKeys } from "../../utils/queryKeys";
import {
  useApiMutation,
  useApiQuery,
  usePaginatedQuery,
} from "../useQueryHooks";
import { queryClient } from "../../context/QueryContext";

/**
 * Custom hook to fetch all discount codes with pagination (admin only)
 */
export const useDiscountCodes = (params = {}, options = {}) => {
  return usePaginatedQuery<DiscountCode>(
    QueryKeys.discountCodes.list(params),
    async () =>
      await apiService.get<ApiResponse<PaginatedResponse<DiscountCode>>>(
        DISCOUNT_CODE_ENDPOINTS.DISCOUNT_CODES,
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
 * Custom hook to fetch a specific discount code by ID (admin only)
 */
export const useDiscountCodeDetail = (id: string, options = {}) => {
  return useApiQuery<DiscountCode>(
    QueryKeys.discountCodes.detail(id),
    async () =>
      await apiService.get<ApiResponse<DiscountCode>>(
        DISCOUNT_CODE_ENDPOINTS.DISCOUNT_CODE(id)
      ),
    {
      refetchOnWindowFocus: false,
      staleTime: CACHE_CONFIG.STALE_TIMES.MEDIUM, // 5 minutes
      retry: CACHE_CONFIG.RETRY.NORMAL,
      ...options,
      enabled: !!id, // Only run query if ID is provided
    }
  );
};

/**
 * Custom hook to fetch available discount codes for the current user
 */
export const useAvailableDiscountCodes = (productId?: string, options = {}) => {
  const params = productId ? { product_id: productId } : {};

  return useApiQuery<DiscountCode[]>(
    QueryKeys.discountCodes.available(productId),
    async () =>
      await apiService.get<ApiResponse<DiscountCode[]>>(
        DISCOUNT_CODE_ENDPOINTS.AVAILABLE,
        params
      ),
    {
      refetchOnWindowFocus: false,
      staleTime: CACHE_CONFIG.STALE_TIMES.MEDIUM, // 5 minutes
      retry: CACHE_CONFIG.RETRY.NORMAL,
      ...options,
    }
  );
};

/**
 * Hook for creating a discount code (admin only)
 */
export const useCreateDiscountCode = () => {
  return useApiMutation<DiscountCode, DiscountCodeFormData>(
    async (formData: DiscountCodeFormData) => {
      // Transform from camelCase to snake_case for backend
      const transformedData = {
        code: formData.code,
        discount_type: formData.discountType,
        discount_value: formData.discountValue,
        min_purchase: formData.minPurchase,
        expires_at: formData.expiresAt,
        status: formData.status || "active",
        user_id: formData.userId,
        product_id: formData.productId,
        category_id: formData.categoryId,
      };

      return apiService.post<ApiResponse<DiscountCode>>(
        DISCOUNT_CODE_ENDPOINTS.DISCOUNT_CODES,
        transformedData
      );
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: QueryKeys.discountCodes.list(),
        });
      },
    }
  );
};

/**
 * Hook for updating a discount code (admin only)
 */
export const useUpdateDiscountCode = (id: string) => {
  return useApiMutation<DiscountCode, Partial<DiscountCodeFormData>>(
    async (formData: Partial<DiscountCodeFormData>) => {
      // Transform from camelCase to snake_case for backend
      const transformedData: Record<string, any> = {};

      if (formData.code !== undefined) transformedData.code = formData.code;
      if (formData.discountType !== undefined)
        transformedData.discount_type = formData.discountType;
      if (formData.discountValue !== undefined)
        transformedData.discount_value = formData.discountValue;
      if (formData.minPurchase !== undefined)
        transformedData.min_purchase = formData.minPurchase;
      if (formData.expiresAt !== undefined)
        transformedData.expires_at = formData.expiresAt;
      if (formData.status !== undefined)
        transformedData.status = formData.status;
      if (formData.userId !== undefined)
        transformedData.user_id = formData.userId;
      if (formData.productId !== undefined)
        transformedData.product_id = formData.productId;
      if (formData.categoryId !== undefined)
        transformedData.category_id = formData.categoryId;

      return apiService.put<ApiResponse<DiscountCode>>(
        DISCOUNT_CODE_ENDPOINTS.DISCOUNT_CODE(id),
        transformedData
      );
    },
    {
      onSuccess: (data) => {
        // Update the specific discount code in cache and invalidate related queries
        queryClient.setQueryData(QueryKeys.discountCodes.detail(id), data);
        queryClient.invalidateQueries({
          queryKey: QueryKeys.discountCodes.list(),
        });
      },
    }
  );
};

/**
 * Hook for deleting a discount code (admin only)
 */
export const useDeleteDiscountCode = (id: string) => {
  return useApiMutation<null, void>(
    async () => {
      return apiService.delete<ApiResponse<null>>(
        DISCOUNT_CODE_ENDPOINTS.DISCOUNT_CODE(id)
      );
    },
    {
      onSuccess: () => {
        // Remove the discount code from cache and invalidate related queries
        queryClient.removeQueries({
          queryKey: QueryKeys.discountCodes.detail(id),
        });
        queryClient.invalidateQueries({
          queryKey: QueryKeys.discountCodes.list(),
        });
      },
    }
  );
};

/**
 * Hook for validating a discount code
 */
export const useValidateDiscountCode = () => {
  return useApiMutation<
    DiscountCodeValidationResult,
    DiscountCodeValidationParams
  >(async (params: DiscountCodeValidationParams) => {
    return apiService.post<ApiResponse<DiscountCodeValidationResult>>(
      DISCOUNT_CODE_ENDPOINTS.VALIDATE,
      {
        code: params.code,
        amount: params.amount,
        product_id: params.productId,
        category_id: params.categoryId,
      }
    );
  });
};

/**
 * Hook for applying a discount code
 */
export const useApplyDiscountCode = (id: string) => {
  return useApiMutation<
    DiscountCodeApplicationResult,
    DiscountCodeApplicationParams
  >(async (params: DiscountCodeApplicationParams) => {
    return apiService.post<ApiResponse<DiscountCodeApplicationResult>>(
      DISCOUNT_CODE_ENDPOINTS.APPLY(id),
      {
        amount: params.amount,
        mark_as_used: params.markAsUsed,
      }
    );
  });
};
