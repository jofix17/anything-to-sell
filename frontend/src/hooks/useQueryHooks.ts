import {
  useQuery,
  useMutation,
  UseMutationOptions,
  UseQueryOptions,
  QueryKey,
  QueryFunctionContext,
  UseInfiniteQueryOptions,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { ApiErrorResponse, ApiResponse, PaginatedResponse } from "../types";
import { queryClient } from "../context/QueryContext";

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

      if (process.env.NODE_ENV === "development") {
        console.debug(`[Query ${requestId}] Started: ${requestKey}`);
      }

      // Check if there's already an in-flight request for this query key
      const existingRequest = inFlightRequests.get(requestKey);
      if (existingRequest) {
        if (process.env.NODE_ENV === "development") {
          console.debug(
            `[Query ${requestId}] Reusing in-flight request for ${requestKey}`
          );
        }
        return existingRequest as Promise<ApiResponse<TData>>;
      }

      // Create and track the new request
      const startTime = performance.now();
      const promise = fn(context);
      inFlightRequests.set(requestKey, promise);

      // When the request completes, remove it from tracking and log performance
      promise.finally(() => {
        inFlightRequests.delete(requestKey);
        if (process.env.NODE_ENV === "development") {
          const duration = performance.now() - startTime;
          console.debug(
            `[Query ${requestId}] Completed in ${duration.toFixed(2)}ms`
          );
        }
      });

      const response = await promise;

      // Check if the response indicates an error
      if (!response.success) {
        const error = new Error(response.message) as Error & {
          response?: ApiErrorResponse;
        };
        error.response = response as unknown as ApiErrorResponse;
        throw error;
      }

      return response;
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error(`[Query Error] ${context.queryKey.join("/")}: `, error);
      }
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
    retry: (failureCount, error) => {
      // Custom retry logic based on API error patterns
      // Don't retry if we got a structured error response from our API
      const apiError = error as Error & {
        response?: ApiErrorResponse;
      };

      // If it's a validation error or authentication error, don't retry
      if (apiError.response?.success === false) {
        return false;
      }

      // For network errors or server errors, retry up to 3 times
      return failureCount < 3;
    },
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
  "queryKey" | "queryFn"
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

  // Extract keepPreviousData to handle it separately
  const { keepPreviousData, ...restOptions } = options;

  // Set placeholderData when keepPreviousData is true
  const placeholderData = keepPreviousData
    ? (previousData: ApiResponse<PaginatedResponse<TData>> | undefined) =>
        previousData
    : undefined;

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
    placeholderData,
  });
}

/**
 * Enhanced hook for infinite queries (e.g., "load more" functionality)
 */
export function useInfiniteApiQuery<TData, TError = Error>(
  queryKey: QueryKey,
  queryFn: (context: {
    pageParam?: number | string;
  }) => Promise<ApiResponse<PaginatedResponse<TData>>>,
  options?: Partial<
    Omit<
      UseInfiniteQueryOptions<
        ApiResponse<PaginatedResponse<TData>>,
        TError,
        PaginatedResponse<TData>,
        ApiResponse<PaginatedResponse<TData>>,
        QueryKey,
        number | string
      >,
      "queryKey" | "queryFn"
    >
  >
) {
  // Default function to get the next page parameter based on Rails pagination format
  const defaultGetNextPageParam = (
    lastPage: ApiResponse<PaginatedResponse<TData>>
  ) => {
    const { page, totalPages } = lastPage.data;
    // Only return next page param if there are more pages
    return page < totalPages ? page + 1 : undefined;
  };

  // Extract specific properties we want to handle specially
  const { getNextPageParam, initialPageParam, ...restOptions } = options || {};

  return useInfiniteQuery<
    ApiResponse<PaginatedResponse<TData>>,
    TError,
    PaginatedResponse<TData>,
    QueryKey,
    number | string
  >({
    queryKey,
    queryFn: createQueryFn((context) => {
      // Use explicit type casting to satisfy TypeScript
      const pageParam: number | string =
        (context.pageParam as number | string) || 1;
      return queryFn({ pageParam });
    }),
    select: (data) => {
      // Transform the data to a more usable format for infinite queries
      // Combine all items from all pages into a single flat array
      const flattenedData = data.pages.reduce<TData[]>(
        (acc, page) => [...acc, ...page.data.data],
        []
      );

      // Get pagination info from the last page
      const lastPage = data.pages[data.pages.length - 1];
      const { total, page, perPage, totalPages } = lastPage.data;

      // Return a structure that matches PaginatedResponse<TData>
      return {
        data: flattenedData,
        total,
        page,
        perPage,
        totalPages,
      };
    },
    getNextPageParam: getNextPageParam || defaultGetNextPageParam,
    initialPageParam: initialPageParam || 1,
    ...restOptions,
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
  // Create a wrapped mutation function that handles error responses
  const wrappedMutationFn = async (
    variables: TVariables
  ): Promise<ApiResponse<TData>> => {
    const response = await mutationFn(variables);

    // Check if the response indicates an error
    if (!response.success) {
      const error = new Error(response.message) as Error & {
        response?: ApiErrorResponse;
      };
      error.response = response as unknown as ApiErrorResponse;
      throw error;
    }

    return response;
  };

  return useMutation<ApiResponse<TData>, TError, TVariables>({
    mutationFn: wrappedMutationFn,
    retry: (failureCount, error) => {
      // Custom retry logic based on API error patterns
      const apiError = error as Error & {
        response?: ApiErrorResponse;
      };

      // Never retry validation errors or authentication errors
      if (apiError.response?.success === false) {
        return false;
      }

      // For network errors or unexpected server errors, retry once
      return failureCount < 1;
    },
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
 * Hook for optimistic mutations that update cache before the server responds
 */
export function useOptimisticMutation<TData, TVariables, TError = Error>(
  mutationFn: (variables: TVariables) => Promise<ApiResponse<TData>>,
  options: Omit<
    UseMutationOptions<
      ApiResponse<TData>,
      TError,
      TVariables,
      { previousData: ApiResponse<TData> }
    >,
    "mutationFn" | "onMutate"
  > & {
    queryKey: QueryKey;
    updateData: (oldData: TData, variables: TVariables) => TData;
  }
) {
  const { queryKey, updateData, ...mutationOptions } = options;

  // Create a wrapped mutation function that handles error responses
  const wrappedMutationFn = async (
    variables: TVariables
  ): Promise<ApiResponse<TData>> => {
    const response = await mutationFn(variables);

    // Check if the response indicates an error
    if (!response.success) {
      const error = new Error(response.message) as Error & {
        response?: ApiErrorResponse;
      };
      error.response = response as unknown as ApiErrorResponse;
      throw error;
    }

    return response;
  };

  return useMutation<
    ApiResponse<TData>,
    TError,
    TVariables,
    { previousData: ApiResponse<TData> }
  >({
    mutationFn: wrappedMutationFn,
    ...mutationOptions,
    onMutate: async (variables) => {
      // Cancel any outgoing refetches to avoid overwriting our optimistic update
      await queryClient.cancelQueries({ queryKey });

      // Snapshot the previous value (complete API response)
      const previousApiResponse =
        queryClient.getQueryData<ApiResponse<TData>>(queryKey);

      // Only proceed with optimistic update if we have existing data
      if (previousApiResponse?.data) {
        // Create updated API response with our optimistically updated data
        const updatedApiResponse = {
          ...previousApiResponse,
          data: updateData(previousApiResponse.data, variables),
        };

        // Update the cached data
        queryClient.setQueryData<ApiResponse<TData>>(
          queryKey,
          updatedApiResponse
        );
      }

      // Return a context object with the snapshotted value
      return { previousData: previousApiResponse! };
    },
    onError: (err, variables, context) => {
      // If there was an error, revert back to the previous value
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }

      // Call the original onError handler if it exists
      if (options.onError) {
        options.onError(err, variables, context);
      }
    },
  });
}

/**
 * Enhanced hook for prefetching a query with better caching control
 */
export function usePrefetchQuery<TData>() {
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
  return (queryKey: QueryKey, options?: { exact?: boolean }) => {
    return queryClient.invalidateQueries({
      queryKey,
      exact: options?.exact ?? false,
    });
  };
}

/**
 * Hook for resetting queries to their initial state
 */
export function useResetQueries() {
  return (queryKey: QueryKey, options?: { exact?: boolean }) => {
    return queryClient.resetQueries({
      queryKey,
      exact: options?.exact ?? false,
    });
  };
}

/**
 * Hook for setting query data without fetching
 */
export function useSetQueryData<TData>() {
  return (
    queryKey: QueryKey,
    data: TData | ((oldData: TData | undefined) => TData)
  ) => {
    return queryClient.setQueryData(queryKey, data);
  };
}

/**
 * Hook to cancel ongoing queries
 */
export function useCancelQueries() {
  return (queryKey: QueryKey) => {
    return queryClient.cancelQueries({ queryKey });
  };
}

// Export everything in a single object for easier imports
const queryHooks = {
  useApiQuery,
  usePaginatedQuery,
  useInfiniteApiQuery,
  useApiMutation,
  useOptimisticMutation,
  usePrefetchQuery,
  useInvalidateQueries,
  useResetQueries,
  useSetQueryData,
  useCancelQueries,
  createQueryFn,
  hashQueryKey,
};

export default queryHooks;