import {
  useQuery,
  useMutation,
  UseQueryOptions,
  UseMutationOptions,
  QueryKey,
  UseQueryResult,
  UseMutationResult,
} from '@tanstack/react-query';
import { ApiResponse, PaginatedResponse } from '../types';
import { queryClient } from '../context/QueryContext';

// Type definitions for query hooks
type ApiQueryResult<TData> = UseQueryResult<ApiResponse<TData>, Error>;
type ApiMutationResult<TData, TVariables> = UseMutationResult<ApiResponse<TData>, Error, TVariables, unknown>;
type PaginatedQueryResult<TData> = UseQueryResult<PaginatedResponse<TData>, Error>;

/**
 * Custom hook for making API queries with standard ApiResponse<T> return type
 * @param queryKey Unique key for identifying the query
 * @param queryFn Function that returns a Promise with ApiResponse<TData>
 * @param options Additional options for the query
 * @returns UseQueryResult with ApiResponse<TData> data
 */
export function useApiQuery<TData = unknown>(
  queryKey: QueryKey,
  queryFn: () => Promise<ApiResponse<TData>>,
  options?: Omit<UseQueryOptions<ApiResponse<TData>, Error, ApiResponse<TData>>, 'queryKey' | 'queryFn'>
): ApiQueryResult<TData> {
  return useQuery({
    queryKey,
    queryFn,
    ...options
  });
}

/**
 * Custom hook for making API mutations with standard ApiResponse<T> return type
 * @param mutationFn Function that returns a Promise with ApiResponse<TData>
 * @param options Additional options for the mutation
 * @returns UseMutationResult with ApiResponse<TData> data
 */
export function useApiMutation<TData = unknown, TVariables = unknown>(
  mutationFn: (variables: TVariables) => Promise<ApiResponse<TData>>,
  options?: Omit<UseMutationOptions<ApiResponse<TData>, Error, TVariables, unknown>, 'mutationFn'>
): ApiMutationResult<TData, TVariables> {
  return useMutation({
    mutationFn,
    ...options
  });
}

/**
 * Custom hook for making paginated API queries
 * @param queryKey Unique key for identifying the query
 * @param queryFn Function that returns a Promise with PaginatedResponse<TData>
 * @param options Additional options for the query
 * @returns UseQueryResult with PaginatedResponse<TData> data
 */
export function usePaginatedQuery<TData = unknown>(
  queryKey: QueryKey,
  queryFn: () => Promise<PaginatedResponse<TData>>,
  options?: Omit<UseQueryOptions<PaginatedResponse<TData>, Error, PaginatedResponse<TData>>, 'queryKey' | 'queryFn'>
): PaginatedQueryResult<TData> {
  return useQuery({
    queryKey,
    queryFn,
    ...options
  });
}

/**
 * Helper function to prefetch data for a query
 * @param queryKey Unique key for identifying the query
 * @param queryFn Function that returns a Promise with the query data
 */
export async function prefetchQuery<TData>(
  queryKey: QueryKey,
  queryFn: () => Promise<TData>
): Promise<void> {
  await queryClient.prefetchQuery({
    queryKey,
    queryFn
  });
}

/**
 * Helper function to invalidate queries by key
 * @param queryKey Unique key for identifying the query to invalidate
 */
export function invalidateQueries(queryKey: QueryKey): Promise<void> {
  return queryClient.invalidateQueries({ queryKey });
}

/**
 * Helper function to update query data
 * @param queryKey Unique key for identifying the query to update
 * @param updaterFn Function that receives the old data and returns the updated data
 */
export function setQueryData<TData>(
  queryKey: QueryKey,
  updaterFn: (oldData: TData | undefined) => TData
): void {
  queryClient.setQueryData(queryKey, updaterFn);
}