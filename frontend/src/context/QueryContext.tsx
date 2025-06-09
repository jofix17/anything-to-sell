import React, { ReactNode, useEffect } from "react";
import {
  QueryClient,
  QueryClientProvider,
  QueryCache,
  MutationCache,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { createCacheUtils, CacheUtils } from "../utils/cacheUtils";
import { CACHE_CONFIG } from "../utils/constants";

// Create React Context for CacheUtils
export const CacheUtilsContext = React.createContext<CacheUtils | undefined>(
  undefined
);

// Create query cache with error handling
const queryCache = new QueryCache({
  onError: (error, query) => {
    // Log errors in development
    if (process.env.NODE_ENV === "development") {
      console.error(
        `Query error for ${JSON.stringify(query.queryKey)}:`,
        error
      );
    }
  },
});

// Create mutation cache with error handling
const mutationCache = new MutationCache({
  onError: (error, _variables, _context, mutation) => {
    // Log errors in development
    if (process.env.NODE_ENV === "development") {
      console.error(
        `Mutation error for ${
          mutation.options.mutationKey || "unnamed mutation"
        }:`,
        error
      );
    }
  },
});

// Create a single queryClient instance to be exported and used throughout the app
export const queryClient = new QueryClient({
  queryCache,
  mutationCache,
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: CACHE_CONFIG.RETRY.FALSE,
      staleTime: CACHE_CONFIG.STALE_TIMES.STANDARD,
      gcTime: CACHE_CONFIG.STALE_TIMES.LONG,
      refetchOnMount: true,
      refetchOnReconnect: true,
      retryOnMount: true,
    },
    mutations: {
      retry: false, // Don't retry mutations by default
    },
  },
});

// Create the CacheUtils instance
const cacheUtils = createCacheUtils(queryClient);

interface QueryProviderProps {
  children: ReactNode;
}

export const QueryProvider: React.FC<QueryProviderProps> = ({ children }) => {
  // Handle online/offline status using native event listeners
  // instead of relying on onlineManager.setEventListener
  useEffect(() => {
    // Handler for online status changes
    const handleOnline = () => {
      // Instead of using the notification context here, we'll dispatch a custom event
      // that can be listened to by other components
      window.dispatchEvent(
        new CustomEvent("network:online", {
          detail: { message: "You are back online. Refreshing data..." },
        })
      );
      
      // Refetch any queries that failed due to network errors
      queryClient.invalidateQueries();
    };

    // Handler for offline status changes
    const handleOffline = () => {
      // Instead of using the notification context directly, dispatch a custom event
      window.dispatchEvent(
        new CustomEvent("network:offline", {
          detail: { message: "You are offline. Some features may be unavailable." },
        })
      );
    };

    // Add event listeners
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Remove event listeners on cleanup
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <CacheUtilsContext.Provider value={cacheUtils}>
        {children}
      </CacheUtilsContext.Provider>
      {process.env.NODE_ENV === "development" && <ReactQueryDevtools />}
    </QueryClientProvider>
  );
};

// Custom hook to use CacheUtils
export const useCacheUtils = (): CacheUtils => {
  const context = React.useContext(CacheUtilsContext);
  if (context === undefined) {
    throw new Error("useCacheUtils must be used within a QueryProvider");
  }
  return context;
};