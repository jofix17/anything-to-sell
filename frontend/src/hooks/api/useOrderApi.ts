import { queryClient } from "../../context/QueryContext";
import {
  useApiMutation,
  useApiQuery,
  usePaginatedQuery,
} from "../../hooks/useQueryHooks";
import apiService from "../../services/api";
import { ApiResponse, PaginatedResponse } from "../../types";
import { CreateOrderParams, Order, OrderFilterParams } from "../../types/order";
import { CACHE_CONFIG, ORDER_ENDPOINTS } from "../../utils/constants";
import { QueryKeys } from "../../utils/queryKeys";

/**
 * Custom hook to fetch orders with consistent error handling
 */
export const useOrders = (params: OrderFilterParams = {}, options = {}) => {
  return usePaginatedQuery<Order>(
    QueryKeys.orders.list(params),
    async () =>
      await apiService.get<ApiResponse<PaginatedResponse<Order>>>(
        ORDER_ENDPOINTS.ORDERS,
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
 * Custom hook to fetch order details by ID with consistent error handling
 */
export const useOrderDetail = (id: string, options = {}) => {
  return useApiQuery<Order>(
    QueryKeys.orders.detail(id),
    async () =>
      await apiService.get<ApiResponse<Order>>(ORDER_ENDPOINTS.ORDER(id)),
    {
      refetchOnWindowFocus: false,
      staleTime: CACHE_CONFIG.STALE_TIMES.MEDIUM, // 5 minutes
      retry: CACHE_CONFIG.RETRY.NORMAL,
      ...options,
      enabled: !!id, // Only run query if id is provided
    }
  );
};

export const useCancelOrder = () => {
  return useApiMutation(
    async (orderId: string) => {
      return apiService.patch<
        ApiResponse<{ orderId: string; success: boolean }>
      >(`${ORDER_ENDPOINTS.ORDER(orderId)}/cancel`);
    },
    {
      onSuccess: (_, orderId) => {
        // Invalidate specific order query
        queryClient.invalidateQueries({
          queryKey: QueryKeys.orders.detail(orderId),
        });

        // Invalidate orders list
        queryClient.invalidateQueries({ queryKey: QueryKeys.orders.all });
      },
    }
  );
};

/**
 * Custom hook to create a new order
 */
export const useCreateOrder = () => {
  return useApiMutation<Order, CreateOrderParams>(
    async (params: CreateOrderParams) => {
      return apiService.post<ApiResponse<Order>>(
        ORDER_ENDPOINTS.ORDERS,
        params
      );
    },
    {
      onSuccess: () => {
        // Invalidate cart queries since cart will be cleared after order creation
        queryClient.invalidateQueries({ queryKey: QueryKeys.cart.current });

        // Invalidate orders list to show the new order
        queryClient.invalidateQueries({ queryKey: QueryKeys.orders.all });
      },
    }
  );
};
