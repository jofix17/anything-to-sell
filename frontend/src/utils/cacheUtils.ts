import { QueryClient } from '@tanstack/react-query';
import { QueryKeys } from './queryKeys';
import { CACHE_CONFIG } from './constants';

/**
 * Utility for common cache operations with the React Query cache
 */
export class CacheUtils {
  constructor(private queryClient: QueryClient) {}

  /**
   * Reset the entire cache - useful for logout or severe error conditions
   */
  resetCache(): void {
    this.queryClient.clear();
  }

  /**
   * Invalidate all queries related to a specific entity type
   */
  invalidateEntity(
    entityType: 'user' | 'cart' | 'product' | 'order', 
    entityId?: string
  ): Promise<void> {
    // Get all related keys for this entity type
    const keys = QueryKeys.utils.getAllRelatedKeys(entityType, entityId);
    
    // Convert the Promise.all to return void
    return Promise.all(
      keys.map(key => 
        // Skip null/undefined keys to fix type error
        key ? this.queryClient.invalidateQueries({ queryKey: key }) : Promise.resolve()
      )
    ).then(() => {
      // Return void
      return;
    });
  }

  /**
   * Prefetch commonly needed data in the background
   * Useful after login or at app startup
   */
  async prefetchCommonData(
    isAuthenticated: boolean = false
  ): Promise<void> {
    // Always prefetch these queries
    const promises: Promise<unknown>[] = [];
    
    // For authenticated users, fetch additional data
    if (isAuthenticated) {
      // Prefetch user profile with a short stale time
      promises.push(
        this.queryClient.prefetchQuery({
          queryKey: QueryKeys.auth.currentUser,
          staleTime: CACHE_CONFIG.STALE_TIMES.MEDIUM,
        })
      );
      
      // Prefetch cart data with a short stale time
      promises.push(
        this.queryClient.prefetchQuery({
          queryKey: QueryKeys.cart.current,
          staleTime: CACHE_CONFIG.STALE_TIMES.SHORT,
        })
      );
    }
    
    await Promise.all(promises);
  }

  /**
   * Invalidate all cart-related queries
   */
  invalidateCartData(): Promise<void> {
    return this.invalidateEntity('cart');
  }

  /**
   * Invalidate all user-related queries
   */
  invalidateUserData(userId?: string): Promise<void> {
    return this.invalidateEntity('user', userId);
  }
  
  /**
   * Set data in the cache without triggering a fetch
   */
  setQueryData<T>(queryKey: unknown[], data: T): void {
    this.queryClient.setQueryData(queryKey, data);
  }

  /**
   * Get data from the cache without triggering a fetch
   */
  getQueryData<T>(queryKey: unknown[]): T | undefined {
    return this.queryClient.getQueryData<T>(queryKey);
  }

  /**
   * Cancel ongoing queries - useful when navigating away
   */
  cancelQueries(queryKey: unknown[]): Promise<void> {
    return this.queryClient.cancelQueries({ queryKey });
  }
  
  /**
   * Check if the cache has data for a specific query
   */
  hasQueryData(queryKey: unknown[]): boolean {
    return this.queryClient.getQueryData(queryKey) !== undefined;
  }
  
  /**
   * Set global default options for all queries
   */
  setDefaultOptions(options: {
    queries?: Record<string, unknown>;
    mutations?: Record<string, unknown>;
  }): void {
    this.queryClient.setDefaultOptions(options);
  }
}

/**
 * Create a cache utils instance with the provided query client
 */
export const createCacheUtils = (queryClient: QueryClient): CacheUtils => {
  return new CacheUtils(queryClient);
};