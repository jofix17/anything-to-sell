import React, { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Default to not refetching on window focus
      retry: 1, // Only retry failed queries once
      staleTime: 5 * 60 * 1000, // Data considered fresh for 5 minutes
      gcTime: 10 * 60 * 1000, // Amount of time unused/inactive cache data remains in memory
    },
  },
});

interface QueryProviderProps {
  children: ReactNode;
}

/**
 * React Query context provider that wraps the application
 * to provide data fetching, caching, and state management capabilities
 */
export const QueryProvider: React.FC<QueryProviderProps> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools />}
    </QueryClientProvider>
  );
};

/**
 * Export the queryClient instance to allow direct access when needed
 * (e.g., for prefetching data or manually invalidating queries)
 */
export { queryClient };