import { queryClient } from "../../../context/QueryContext";
import apiService from "../../../services/api";
import { ApiResponse } from "../../../types";
import { Review } from "../../../types/review";
import { REVIEW_ENDPOINTS } from "../../../utils/constants";
import { QueryKeys } from "../../../utils/queryKeys";
import { useApiMutation } from "../../useQueryHooks";

/**
 * Hook for approving a review (admin only)
 */
export const useApproveReview = (productId: string, reviewId: string) => {
  return useApiMutation<Review, void>(
    async () => {
      return apiService.patch<ApiResponse<Review>>(
        REVIEW_ENDPOINTS.APPROVE(productId, reviewId)
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
 * Hook for rejecting a review (admin only)
 */
export const useRejectReview = (productId: string, reviewId: string) => {
  return useApiMutation<Review, void>(
    async () => {
      return apiService.patch<ApiResponse<Review>>(
        REVIEW_ENDPOINTS.REJECT(productId, reviewId)
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
