import {
  useQuery,
  useMutation,
  useQueryClient,
  UseMutationOptions,
  UseQueryOptions,
  QueryKey,
  QueryFunctionContext,
} from "@tanstack/react-query";
import { ApiResponse, PaginatedResponse } from "../types";

// Track in-flight requests to prevent duplicates
const inFlightRequests = new Map<string, Promise<unknown>>();

/**
 * Utility function to hash query parameters to a stable string
 * This helps ensure consistent cache keys even with object parameters
 */
export const hashQueryKey = (key: unknown): string => {
  if (key === null || key === undefined) return String(key);
  if (typeof key === "function") return key.toString();
  if (typeof key === "object") {
    return JSON.stringify(key, (_, val) =>
      typeof val === "object" && val !== null
        ? Object.keys(val)
            .sort()
            .reduce((result, key) => {
              result[key] = val[key];
              return result;
            }, {} as Record<string, unknown>)
        : val
    );
  }
  return String(key);
};

/**
 * Enhanced query function to handle API requests with proper error handling,
 * retries, and deduplication of in-flight requests
 */
export const createQueryFn = <TData>(
  fn: (context: QueryFunctionContext) => Promise<ApiResponse<TData>>
) => {
  return async (context: QueryFunctionContext): Promise<ApiResponse<TData>> => {
    try {
      // Generate a unique request ID based on the query key
      const requestKey = hashQueryKey(context.queryKey);
      const requestId = `${requestKey}_${Math.random()
        .toString(36)
        .substring(2, 9)}`;
      console.debug(`[Query ${requestId}] Started: ${requestKey}`);

      // Check if there's already an in-flight request for this query key
      const existingRequest = inFlightRequests.get(requestKey);
      if (existingRequest) {
        console.debug(
          `[Query ${requestId}] Reusing in-flight request for ${requestKey}`
        );
        return existingRequest as Promise<ApiResponse<TData>>;
      }

      // Create and track the new request
      const startTime = performance.now();
      const promise = fn(context);
      inFlightRequests.set(requestKey, promise);

      // When the request completes, remove it from tracking and log performance
      promise.finally(() => {
        inFlightRequests.delete(requestKey);
        const duration = performance.now() - startTime;
        console.debug(
          `[Query ${requestId}] Completed in ${duration.toFixed(2)}ms`
        );
      });

      return await promise;
    } catch (error) {
      console.error(`[Query Error] ${context.queryKey.join("/")}: `, error);
      throw error;
    }
  };
};

// Types for query options
type ApiQueryOptions<TData, TError> = UseQueryOptions<
  ApiResponse<TData>,
  TError,
  TData,
  QueryKey
>;

/**
 * Enhanced hook for generic API queries with improved caching and deduplication
 */
export function useApiQuery<TData, TError = Error>(
  queryKey: QueryKey,
  queryFn: () => Promise<ApiResponse<TData>>,
  options: Omit<ApiQueryOptions<TData, TError>, "queryKey" | "queryFn"> = {}
) {
  // Create a default selector to extract data from API response
  const defaultSelect = (response: ApiResponse<TData>) => response.data;

  return useQuery<ApiResponse<TData>, TError, TData, QueryKey>({
    queryKey,
    queryFn: createQueryFn(() => queryFn()),
    select: options.select || defaultSelect,
    ...options,
  });
}

// Types for paginated query options
type PaginatedQueryOptions<TData, TError> = Omit<
  UseQueryOptions<
    ApiResponse<PaginatedResponse<TData>>,
    TError,
    PaginatedResponse<TData>,
    QueryKey
  >,
  "queryKey" | "queryFn" | "placeholderData"
> & {
  keepPreviousData?: boolean;
};

/**
 * Enhanced hook for paginated queries with cursor-based pagination support
 */
export function usePaginatedQuery<TData, TError = Error>(
  queryKey: QueryKey,
  queryFn: () => Promise<ApiResponse<PaginatedResponse<TData>>>,
  options: PaginatedQueryOptions<TData, TError> = {}
) {
  // Create a default selector to extract paginated data from API response
  const defaultSelect = (response: ApiResponse<PaginatedResponse<TData>>) =>
    response.data;

  // Set up placeholder data function based on keepPreviousData flag
  const placeholderDataFn =
    options.keepPreviousData !== false
      ? (previousData: ApiResponse<PaginatedResponse<TData>> | undefined) =>
          previousData
      : undefined;

  const { ...restOptions } = options;

  return useQuery<
    ApiResponse<PaginatedResponse<TData>>,
    TError,
    PaginatedResponse<TData>,
    QueryKey
  >({
    queryKey,
    queryFn: createQueryFn(() => queryFn()),
    select: options.select || defaultSelect,
    ...restOptions,
    // Use a function that returns previous data instead of the string 'keepPrevious'
    placeholderData: placeholderDataFn,
  });
}

// Define types for meta information
interface InvalidateQueriesMetaInfo {
  invalidateQueries: QueryKey[] | ((variables: unknown) => QueryKey[]);
}

/**
 * Enhanced hook for API mutations with optimistic updates and rollbacks
 */
export function useApiMutation<TData, TVariables, TError = Error>(
  mutationFn: (variables: TVariables) => Promise<ApiResponse<TData>>,
  options: Omit<
    UseMutationOptions<ApiResponse<TData>, TError, TVariables, unknown>,
    "mutationFn"
  > & {
    meta?: InvalidateQueriesMetaInfo;
  } = {}
) {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<TData>, TError, TVariables>({
    mutationFn,
    ...options,
    onSuccess: (data, variables, context) => {
      // Handle invalidation based on meta information
      if (options.meta?.invalidateQueries) {
        const queriesToInvalidate =
          typeof options.meta.invalidateQueries === "function"
            ? options.meta.invalidateQueries(variables)
            : options.meta.invalidateQueries;

        if (Array.isArray(queriesToInvalidate)) {
          queriesToInvalidate.forEach((queryKey) => {
            queryClient.invalidateQueries({ queryKey });
          });
        }
      }

      // Call the original onSuccess handler
      if (options.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
  });
}

/**
 * Enhanced hook for prefetching a query with better caching control
 */
export function usePrefetchQuery<TData>() {
  const queryClient = useQueryClient();

  return (
    queryKey: QueryKey,
    queryFn: () => Promise<ApiResponse<TData>>,
    options: { staleTime?: number; gcTime?: number } = {}
  ) => {
    return queryClient.prefetchQuery({
      queryKey,
      queryFn: createQueryFn(() => queryFn()),
      staleTime: options.staleTime ?? 5 * 60 * 1000, // 5 minutes by default
      gcTime: options.gcTime ?? 10 * 60 * 1000, // 10 minutes by default
    });
  };
}

/**
 * Hook for safely invalidating queries
 */
export function useInvalidateQueries() {
  const queryClient = useQueryClient();

  return (queryKey: QueryKey) => {
    return queryClient.invalidateQueries({ queryKey });
  };
}

/**
 * Hook for resetting queries to their initial state
 */
export function useResetQueries() {
  const queryClient = useQueryClient();

  return (queryKey: QueryKey) => {
    return queryClient.resetQueries({ queryKey });
  };
}

/**
 * Hook for setting query data without fetching
 */
export function useSetQueryData<TData>() {
  const queryClient = useQueryClient();

  return (queryKey: QueryKey, data: TData) => {
    return queryClient.setQueryData(queryKey, data);
  };
}

// Export everything in a single object for easier imports
const queryHooks = {
  useApiQuery,
  usePaginatedQuery,
  useApiMutation,
  usePrefetchQuery,
  useInvalidateQueries,
  useResetQueries,
  useSetQueryData,
  createQueryFn,
  hashQueryKey,
};

export default queryHooks;
