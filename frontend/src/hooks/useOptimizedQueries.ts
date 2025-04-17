import { useEffect, useRef, useState } from 'react';
import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryKey,
  UseQueryOptions,
  UseMutationOptions,
} from '@tanstack/react-query';
import { hashQueryKey } from './useQueryHooks';
import { ApiResponse, PaginatedResponse } from '../types';

/**
 * Enhanced hook for tracking network state across multiple queries
 * Useful for showing global loading or error states
 */
export const useNetworkStatus = () => {
  const [status, setStatus] = useState({
    isLoading: false,
    isError: false,
    error: null as Error | null,
  });

  const loadingQueriesRef = useRef<Set<string>>(new Set());
  const queryClient = useQueryClient();

  useEffect(() => {
    // Set up a listener for query cache changes
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (!event) return;

      const queryKey = event.query.queryKey;
      const queryKeyStr = hashQueryKey(queryKey);

      // Check the event action type
      if (event.type === 'updated') {
        const queryState = event.query.state;
        
        if (queryState.status === 'pending') {
          loadingQueriesRef.current.add(queryKeyStr);
          setStatus(prev => ({ ...prev, isLoading: true }));
        } else if (queryState.status === 'success' || queryState.status === 'error') {
          loadingQueriesRef.current.delete(queryKeyStr);
          
          // Update error state
          if (queryState.status === 'error' && queryState.error) {
            setStatus({ 
              isLoading: loadingQueriesRef.current.size > 0, 
              isError: true, 
              error: queryState.error as Error 
            });
          } else {
            setStatus({ 
              isLoading: loadingQueriesRef.current.size > 0, 
              isError: false, 
              error: null 
            });
          }
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [queryClient]);

  return status;
};

/**
 * Hook for optimized data fetching with automatic retry on network reconnection
 */
export function useOptimizedQuery<TData, TError = Error>(
  queryKey: QueryKey,
  queryFn: () => Promise<ApiResponse<TData>>,
  options: Omit<
    UseQueryOptions<ApiResponse<TData>, TError, TData>,
    "queryKey" | "queryFn"
  > = {}
) {
  const defaultSelect = (response: ApiResponse<TData>) => response.data;
  const onlineRef = useRef(navigator.onLine);
  const queryClient = useQueryClient();
  
  // Set up network status listener
  useEffect(() => {
    const handleOnline = () => {
      if (!onlineRef.current) {
        // Network reconnected, refetch any stale queries
        queryClient.invalidateQueries({ 
          predicate: query => query.state.fetchStatus !== 'fetching' && query.isStaleByTime(0)
        });
      }
      onlineRef.current = true;
    };

    const handleOffline = () => {
      onlineRef.current = false;
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [queryClient]);

  return useQuery<ApiResponse<TData>, TError, TData>({
    queryKey,
    queryFn,
    select: options.select || defaultSelect,
    // Skip the query if we're offline and have cached data
    networkMode: 'offlineFirst',
    // Don't refetch on window focus if data is fresh
    refetchOnWindowFocus: false,
    // Use the retry function to prevent excessive retries when offline
    retry: (failureCount) => {
      // Don't retry network errors when offline
      if (!navigator.onLine) return false;
      // Retry up to 3 times for other errors
      return failureCount < 3;
    },
    ...options,
  });
}

/**
 * Hook for optimized paginated query with intelligent prefetching
 */
export function useOptimizedPaginatedQuery<TData, TError = Error>(
  queryKey: QueryKey,
  queryFn: () => Promise<ApiResponse<PaginatedResponse<TData>>>,
  options: Omit<
    UseQueryOptions<
      ApiResponse<PaginatedResponse<TData>>,
      TError,
      PaginatedResponse<TData>
    >,
    "queryKey" | "queryFn" | "placeholderData"
  > & {
    keepPreviousData?: boolean;
  } = {}
) {
  const queryClient = useQueryClient();
  const defaultSelect = (response: ApiResponse<PaginatedResponse<TData>>) => response.data;
  
  // Set up placeholder data function based on keepPreviousData flag
  const placeholderDataFn = options.keepPreviousData !== false 
    ? (previousData: ApiResponse<PaginatedResponse<TData>> | undefined) => previousData
    : undefined;

  // Remove the keepPreviousData option from the options since we're using it to set placeholderData
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { keepPreviousData, ...restOptions } = options;
  
  const result = useQuery<ApiResponse<PaginatedResponse<TData>>, TError, PaginatedResponse<TData>>({
    queryKey,
    queryFn,
    select: options.select || defaultSelect,
    // Use a function that returns previous data instead of the string 'keepPrevious'
    placeholderData: placeholderDataFn,
    ...restOptions,
  });

  // Track if we're showing placeholder data
  const isPlaceholderData = result.isPlaceholderData;

  // Get current page info
  const currentPage = result.data?.page ?? 1;
  const totalPages = result.data?.totalPages ?? 1;
  
  // Extract the base query from the key without the pagination params
  const getBaseQueryKey = (key: QueryKey): QueryKey => {
    // If the last item is an object, it might contain pagination params
    const lastItem = key[key.length - 1];
    if (typeof lastItem === 'object' && lastItem !== null) {
      const params = { ...lastItem as Record<string, unknown> };
      delete params.page; // Remove the page parameter
      return [...key.slice(0, -1), params];
    }
    return key;
  };

  // Prefetch adjacent pages when data is successfully loaded
  useEffect(() => {
    if (result.isSuccess && !isPlaceholderData) {
      // Prefetch next page if available
      if (currentPage < totalPages) {
        const baseKey = getBaseQueryKey(queryKey);
        const nextPageParams = { 
          ...(baseKey[baseKey.length - 1] as Record<string, unknown>), 
          page: currentPage + 1 
        };
        const nextPageKey = [...baseKey.slice(0, -1), nextPageParams] as QueryKey;
        
        queryClient.prefetchQuery({
          queryKey: nextPageKey,
          queryFn,
          staleTime: 30 * 1000, // 30 seconds
        });
      }

      // Optionally prefetch previous page if it exists
      if (currentPage > 1) {
        const baseKey = getBaseQueryKey(queryKey);
        const prevPageParams = { 
          ...(baseKey[baseKey.length - 1] as Record<string, unknown>), 
          page: currentPage - 1 
        };
        const prevPageKey = [...baseKey.slice(0, -1), prevPageParams] as QueryKey;
        
        queryClient.prefetchQuery({
          queryKey: prevPageKey,
          queryFn,
          staleTime: 30 * 1000, // 30 seconds
        });
      }
    }
  }, [queryKey, queryFn, result.isSuccess, isPlaceholderData, currentPage, totalPages, queryClient]);

  return {
    ...result,
    isPreviousData: isPlaceholderData // Provide backwards compatibility
  };
}

/**
 * Hook for optimized API mutations with offline support
 * Automatically retries failed mutations when network is restored
 */
export function useOptimizedMutation<TData, TVariables, TError = Error, TContext = unknown>(
  mutationFn: (variables: TVariables) => Promise<ApiResponse<TData>>,
  options: Omit<
    UseMutationOptions<ApiResponse<TData>, TError, TVariables, TContext>,
    "mutationFn"
  > = {}
) {
  const queryClient = useQueryClient();
  const pendingMutationsRef = useRef<Array<{ variables: TVariables }>>([]);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Set up network status listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      
      // Retry pending mutations when back online
      const pendingMutations = [...pendingMutationsRef.current];
      pendingMutationsRef.current = [];
      
      pendingMutations.forEach(({ variables }) => {
        mutate(variables);
      });
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const { mutate, ...rest } = useMutation<ApiResponse<TData>, TError, TVariables, TContext>({
    mutationFn,
    ...options,
    onMutate: async (variables) => {
      // If we're offline, store the mutation for later
      if (isOffline) {
        pendingMutationsRef.current.push({ variables });
        throw new Error('You are currently offline. This action will be performed when you are back online.');
      }

      // Call the original onMutate if provided
      if (options.onMutate) {
        return await options.onMutate(variables);
      }
      return undefined;
    },
    onSuccess: (data, variables, context) => {
      // Handle invalidation based on meta information
      if (options.meta?.invalidateQueries) {
        const queriesToInvalidate = typeof options.meta.invalidateQueries === 'function'
          ? options.meta.invalidateQueries(variables)
          : options.meta.invalidateQueries;
          
        if (Array.isArray(queriesToInvalidate)) {
          queriesToInvalidate.forEach(queryKey => {
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

  return {
    mutate: (variables: TVariables) => {
      if (isOffline) {
        pendingMutationsRef.current.push({ variables });
        if (options.onError) {
          const offlineError = new Error('You are currently offline. This action will be performed when you are back online.');
          options.onError(offlineError as unknown as TError, variables, undefined as unknown as TContext);
        }
        return;
      }
      mutate(variables);
    },
    ...rest,
    isOffline,
    pendingMutations: pendingMutationsRef.current.length,
  };
}

export default {
  useOptimizedQuery,
  useOptimizedPaginatedQuery,
  useOptimizedMutation,
  useNetworkStatus
};