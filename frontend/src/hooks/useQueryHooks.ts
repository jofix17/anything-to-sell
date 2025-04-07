import {
  useQuery,
  useMutation,
  UseQueryOptions,
  UseMutationOptions,
  UseQueryResult,
  QueryKey,
} from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { ApiResponse, PaginatedResponse } from '../types';
import { queryClient } from '../context/QueryContext';

/**
 * Custom hook for data fetching with standardized error handling
 * This wrapper around useQuery handles both ApiResponse and PaginatedResponse formats
 */
export function useApiQuery<TData, TError = AxiosError>(
  queryKey: QueryKey,
  queryFn: () => Promise<ApiResponse<TData>>,
  options?: Omit<UseQueryOptions<ApiResponse<TData>, TError, TData>, 'queryKey' | 'queryFn'>
): UseQueryResult<TData, TError> {
  return useQuery<ApiResponse<TData>, TError, TData>({
    queryKey,
    queryFn,
    ...options,
    // Extract the data from our API response format
    select: (response) => response.data,
  });
}

/**
 * Custom hook for paginated data fetching
 * This handles the PaginatedResponse format
 */
export function usePaginatedQuery<TData, TError = AxiosError>(
  queryKey: QueryKey,
  queryFn: () => Promise<PaginatedResponse<TData>>,
  options?: Omit<UseQueryOptions<PaginatedResponse<TData>, TError, PaginatedResponse<TData>>, 'queryKey' | 'queryFn'>
): UseQueryResult<PaginatedResponse<TData>, TError> {
  return useQuery<PaginatedResponse<TData>, TError, PaginatedResponse<TData>>({
    queryKey,
    queryFn,
    ...options,
  });
}

/**
 * Type for mutation functions that work with our API
 */
type MutationFn<TVariables, TData> = (variables: TVariables) => Promise<ApiResponse<TData>>;

/**
 * Custom hook for data mutations with standardized API format handling
 */
export function useApiMutation<TVariables, TData, TError = AxiosError, TContext = unknown>(
  mutationFn: MutationFn<TVariables, TData>,
  options?: Omit<UseMutationOptions<ApiResponse<TData>, TError, TVariables, TContext>, 'mutationFn'>
) {
  return useMutation({
    mutationFn,
    ...options
  });
}

/**
 * Helper function to invalidate multiple queries at once
 * Useful after mutations that affect multiple resources
 */
export function invalidateQueries(queryKeys: QueryKey[]) {
  queryKeys.forEach(key => {
    queryClient.invalidateQueries({ queryKey: key });
  });
}

/**
 * Helper function to prefetch data for a specific query
 * Useful for prefetching data before navigation
 */
export function prefetchQuery<TData>(
  queryKey: QueryKey,
  queryFn: () => Promise<ApiResponse<TData>>
) {
  return queryClient.prefetchQuery({
    queryKey,
    queryFn
  });
}

/**
 * Helper function to prefetch paginated data
 */
export function prefetchPaginatedQuery<TData>(
  queryKey: QueryKey,
  queryFn: () => Promise<PaginatedResponse<TData>>
) {
  return queryClient.prefetchQuery({
    queryKey,
    queryFn
  });
}

/**
 * Helper function to clear all queries from the cache
 * Useful for logout functionality
 */
export function clearQueryCache() {
  queryClient.clear();
}