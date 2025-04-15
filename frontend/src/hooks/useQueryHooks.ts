import {
  useQuery,
  useMutation,
  useQueryClient,
  UseMutationOptions,
  UseQueryOptions,
  QueryKey,
} from "@tanstack/react-query";
import { ApiResponse, PaginatedResponse } from "../types";

/**
 * Custom hook for generic API queries
 */
export function useApiQuery<TData, TError = Error>(
  queryKey: QueryKey,
  queryFn: () => Promise<ApiResponse<TData>>,
  options: Omit<
    UseQueryOptions<ApiResponse<TData>, TError, TData>,
    "queryKey" | "queryFn"
  > = {}
) {
  // Create a default selector to extract data from API response
  const defaultSelect = (response: ApiResponse<TData>) => response.data;

  return useQuery<ApiResponse<TData>, TError, TData>({
    queryKey: queryKey,
    queryFn: queryFn,
    select: options.select || defaultSelect,
    ...options,
  });
}

/**
 * Custom hook for paginated queries
 */
export function usePaginatedQuery<TData, TError = Error>(
  queryKey: QueryKey,
  queryFn: () => Promise<ApiResponse<PaginatedResponse<TData>>>,
  options: Omit<
    UseQueryOptions<
      ApiResponse<PaginatedResponse<TData>>,
      TError,
      PaginatedResponse<TData>
    >,
    "queryKey" | "queryFn"
  > = {}
) {
  // Create a default selector to extract paginated data from API response
  const defaultSelect = (response: ApiResponse<PaginatedResponse<TData>>) =>
    response.data;

  return useQuery<
    ApiResponse<PaginatedResponse<TData>>,
    TError,
    PaginatedResponse<TData>
  >({
    queryKey: queryKey,
    queryFn: queryFn,
    select: options.select || defaultSelect,
    ...options,
  });
}

/**
 * Custom hook for API mutations
 */
export function useApiMutation<TData, TVariables, TError = Error>(
  mutationFn: (variables: TVariables) => Promise<ApiResponse<TData>>,
  options: Omit<
    UseMutationOptions<ApiResponse<TData>, TError, TVariables>,
    "mutationFn"
  > = {}
) {
  return useMutation<ApiResponse<TData>, TError, TVariables>({
    mutationFn: mutationFn,
    ...options,
  });
}

/**
 * Custom hook for prefetching a query
 * Returns a function that can be called to prefetch the query
 */
export function usePrefetchQuery<TData>() {
  const queryClient = useQueryClient();

  // Return a function that can be called to prefetch a query
  return (queryKey: QueryKey, queryFn: () => Promise<ApiResponse<TData>>) => {
    return queryClient.prefetchQuery({
      queryKey,
      queryFn,
    });
  };
}

/**
 * Custom hook for invalidating queries
 * Returns a function that can be called to invalidate queries
 */
export function useInvalidateQueries() {
  const queryClient = useQueryClient();

  // Return a function that can be called to invalidate queries
  return (queryKey: QueryKey) => {
    return queryClient.invalidateQueries({ queryKey });
  };
}

// Export everything in a single object for easier imports
const queryHooks = {
  useApiQuery,
  usePaginatedQuery,
  useApiMutation,
  usePrefetchQuery,
  useInvalidateQueries,
};

export default queryHooks;
