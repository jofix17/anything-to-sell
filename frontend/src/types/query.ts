import { QueryKey } from '@tanstack/react-query';
import { ApiResponse, PaginatedResponse } from '.';

/**
 * Type for query key generators
 * This helps ensure type safety when defining query keys
 */
export type QueryKeyGenerator<T = void> = T extends void 
  ? () => QueryKey 
  : (param: T) => QueryKey;

/**
 * Type for filtering parameters for list queries
 * Acts as a more flexible alternative to Record<string, unknown>
 */
export interface QueryFilters {
  [key: string]: unknown;
}

/**
 * Type for API response transformation functions
 * Used in the select option of the query hooks
 */
export type ResponseTransformer<TResponse, TResult> = 
  (response: TResponse) => TResult;

/**
 * Type for API function that returns standard API response
 */
export type ApiFunction<TData> = 
  (...args: unknown[]) => Promise<ApiResponse<TData>>;

/**
 * Type for API function that returns paginated response
 */
export type PaginatedApiFunction<TData> = 
  (...args: unknown[]) => Promise<PaginatedResponse<TData>>;

/**
 * Generic success handler type for mutations
 */
export type MutationSuccessHandler<TData, TVariables> = 
  (data: ApiResponse<TData>, variables: TVariables) => void;

/**
 * Generic error handler type for queries and mutations
 */
export type ErrorHandler = 
  (error: Error) => void;