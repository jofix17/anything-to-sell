import { Order } from "@stripe/stripe-js";
import { queryClient } from "../../../context/QueryContext";
import apiService from "../../../services/api";
import { ApiResponse, PaginatedResponse } from "../../../types";
import {
  OrderFilterParams,
  UpdateOrderStatusParams,
} from "../../../types/order";
import { ADMIN_ORDER_ENDPOINTS, CACHE_CONFIG } from "../../../utils/constants";
import { QueryKeys } from "../../../utils/queryKeys";
import {
  usePaginatedQuery,
  useApiQuery,
  useApiMutation,
} from "../../useQueryHooks";

/**
 * Custom hook to fetch admin orders with filters and pagination
 */
export const useAdminOrders = (
  params: OrderFilterParams = {},
  options = {}
) => {
  return usePaginatedQuery<Order>(
    QueryKeys.admin.orders(params),
    async () =>
      await apiService.get<ApiResponse<PaginatedResponse<Order>>>(
        ADMIN_ORDER_ENDPOINTS.ORDERS,
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
 * Custom hook to fetch admin order details by ID
 */
export const useAdminOrderDetail = (id: string, options = {}) => {
  return useApiQuery<Order>(
    [...QueryKeys.admin.orders({}), id],
    async () =>
      await apiService.get<ApiResponse<Order>>(ADMIN_ORDER_ENDPOINTS.ORDER(id)),
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
 * Custom hook for updating order status with proper cache invalidation
 */
export const useUpdateOrderStatus = () => {
  return useApiMutation<Order, UpdateOrderStatusParams>(
    async ({ id, status, comment }: UpdateOrderStatusParams) => {
      return apiService.patch<ApiResponse<Order>>(
        ADMIN_ORDER_ENDPOINTS.UPDATE_STATUS(id),
        {
          status,
          comment,
        }
      );
    },
    {
      onSuccess: (_, variables) => {
        // Invalidate relevant queries when an order status is updated
        queryClient.invalidateQueries({ queryKey: QueryKeys.admin.orders({}) });
        queryClient.invalidateQueries({
          queryKey: [...QueryKeys.admin.orders({}), variables.id],
        });
        // Invalidate dashboard stats as they might include order statistics
        queryClient.invalidateQueries({ queryKey: QueryKeys.admin.dashboard });
      },
    }
  );
};

/**
 * Custom hook to fetch admin dashboard statistics that include order data
 */
export const useAdminDashboardStats = (options = {}) => {
  return useApiQuery<any>(
    QueryKeys.admin.dashboard,
    async () =>
      await apiService.get<ApiResponse<any>>(
        ADMIN_ORDER_ENDPOINTS.DASHBOARD_STATS
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
