import apiService from "../../services/api";
import { ApiResponse, PaginatedResponse } from "../../types";
import {
  MarkHelpfulResponse,
  Review,
  ReviewFormData,
  ReviewStats,
} from "../../types/review";
import { CACHE_CONFIG, REVIEW_ENDPOINTS } from "../../utils/constants";
import { QueryKeys } from "../../utils/queryKeys";
import {
  useApiMutation,
  useApiQuery,
  usePaginatedQuery,
} from "../useQueryHooks";
import { queryClient } from "../../context/QueryContext";

/**
 * Interface for review query parameters
 */
interface ReviewQueryParams {
  page?: number;
  per_page?: number;
  rating?: number | null;
  sort_by?: string;
  [key: string]: unknown; // Allow additional parameters
}

/**
 * Custom hook to fetch reviews for a product with pagination
 */
export const useProductReviews = (
  productId: string,
  params: ReviewQueryParams = {},
  options = {}
) => {
  // Create a clean params object without null values
  const cleanParams: Record<string, unknown> = {};

  // Only add defined and non-null values to params
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      cleanParams[key] = value;
    }
  });

  // Create a stable query key by converting params to a string
  const queryKeyParams = JSON.stringify(cleanParams);

  return usePaginatedQuery<Review>(
    // Use an array for the query key that includes the stringified params
    [QueryKeys.reviews.list(productId), queryKeyParams],
    async () => {
      console.log("Fetching reviews with params:", cleanParams);
      return await apiService.get<ApiResponse<PaginatedResponse<Review>>>(
        REVIEW_ENDPOINTS.REVIEWS(productId),
        cleanParams
      );
    },
    {
      refetchOnWindowFocus: false,
      staleTime: CACHE_CONFIG.STALE_TIMES.STANDARD, // 1 minute
      retry: CACHE_CONFIG.RETRY.NORMAL,
      refetchOnMount: true,
      ...options,
      enabled: !!productId, // Only run query if productId is provided
    }
  );
};

/**
 * Custom hook to fetch a specific review by ID
 */
export const useReviewDetail = (
  productId: string,
  reviewId: string,
  options = {}
) => {
  return useApiQuery<Review>(
    QueryKeys.reviews.detail(productId, reviewId),
    async () =>
      await apiService.get<ApiResponse<Review>>(
        REVIEW_ENDPOINTS.REVIEW(productId, reviewId)
      ),
    {
      refetchOnWindowFocus: false,
      staleTime: CACHE_CONFIG.STALE_TIMES.MEDIUM, // 5 minutes
      retry: CACHE_CONFIG.RETRY.NORMAL,
      ...options,
      enabled: !!productId && !!reviewId, // Only run query if both IDs are provided
    }
  );
};

/**
 * Custom hook to fetch review statistics for a product
 */
export const useReviewStats = (productId: string, options = {}) => {
  return useApiQuery<ReviewStats>(
    QueryKeys.reviews.stats(productId),
    async () =>
      await apiService.get<ApiResponse<ReviewStats>>(
        REVIEW_ENDPOINTS.STATS(productId)
      ),
    {
      refetchOnWindowFocus: false,
      staleTime: CACHE_CONFIG.STALE_TIMES.MEDIUM, // 5 minutes
      retry: CACHE_CONFIG.RETRY.NORMAL,
      ...options,
      enabled: !!productId, // Only run query if productId is provided
    }
  );
};

/**
 * Hook for creating a review with proper cache invalidation
 */
export const useCreateReview = (productId: string) => {
  return useApiMutation<Review, ReviewFormData>(
    async (reviewData: ReviewFormData) => {
      // Transform from camelCase to snake_case for backend if needed
      return apiService.post<ApiResponse<Review>>(
        REVIEW_ENDPOINTS.REVIEWS(productId),
        {
          review: {
            rating: reviewData.rating,
            comment: reviewData.comment,
          },
        }
      );
    },
    {
      onSuccess: () => {
        // Invalidate reviews list and stats for this product
        queryClient.invalidateQueries({
          queryKey: QueryKeys.reviews.list(productId),
        });
        queryClient.invalidateQueries({
          queryKey: QueryKeys.reviews.stats(productId),
        });
        queryClient.invalidateQueries({
          queryKey: QueryKeys.products.detail(productId),
        });
      },
      onError: (error) => {
        console.error("Error creating review:", error);
      },
    }
  );
};

/**
 * Hook for updating a review with proper cache invalidation
 */
export const useUpdateReview = (productId: string, reviewId: string) => {
  return useApiMutation<Review, ReviewFormData>(
    async (reviewData: ReviewFormData) => {
      return apiService.put<ApiResponse<Review>>(
        REVIEW_ENDPOINTS.REVIEW(productId, reviewId),
        {
          review: {
            rating: reviewData.rating,
            comment: reviewData.comment,
          },
        }
      );
    },
    {
      onSuccess: (data) => {
        // Update the specific review in cache and invalidate related queries
        queryClient.setQueryData(
          QueryKeys.reviews.detail(productId, reviewId),
          data
        );
        queryClient.invalidateQueries({
          queryKey: QueryKeys.reviews.list(productId),
        });
        queryClient.invalidateQueries({
          queryKey: QueryKeys.reviews.stats(productId),
        });
        queryClient.invalidateQueries({
          queryKey: QueryKeys.products.detail(productId),
        });
      },
    }
  );
};

/**
 * Hook for deleting a review with proper cache invalidation
 */
export const useDeleteReview = (productId: string, reviewId: string) => {
  return useApiMutation<null, void>(
    async () => {
      return apiService.delete<ApiResponse<null>>(
        REVIEW_ENDPOINTS.REVIEW(productId, reviewId)
      );
    },
    {
      onSuccess: () => {
        // Remove the review from cache and invalidate related queries
        queryClient.removeQueries({
          queryKey: QueryKeys.reviews.detail(productId, reviewId),
        });
        queryClient.invalidateQueries({
          queryKey: QueryKeys.reviews.list(productId),
        });
        queryClient.invalidateQueries({
          queryKey: QueryKeys.reviews.stats(productId),
        });
        queryClient.invalidateQueries({
          queryKey: QueryKeys.products.detail(productId),
        });
      },
    }
  );
};

/**
 * Custom hook to mark a review as helpful
 */
export const useMarkReviewHelpful = (reviewId: string) => {
  return useApiMutation(
    async () => {
      return apiService.post<ApiResponse<MarkHelpfulResponse>>(
        REVIEW_ENDPOINTS.MARK_HELPFUL(reviewId)
      );
    },
    {
      retry: false,
    }
  );
};
