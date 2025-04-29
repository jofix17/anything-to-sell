import axios, {
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { objectToCamelCase, objectToSnakeCase } from "../utils/caseTransform";
import { STORAGE_KEYS } from "../utils/constants";

// Create the API base URL configuration
const API_BASE_URL =
  import.meta.env.REACT_APP_API_URL || "http://localhost:3000/api/v1";

/**
 * Enhanced API client with consistent error handling and data transformation
 * that works with Rails session cookies instead of manual token management
 */
class ApiService {
  private api: AxiosInstance;
  // Add request tracking for improved deduplication
  private inFlightRequests = new Map<string, Promise<unknown>>();

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        "Content-Type": "application/json",
      },
      // Important: Allow axios to send and receive cookies
      withCredentials: true,
    });
    
    if (process.env.NODE_ENV === "development") {
      console.log("API Service initialized with cookies:", document.cookie);
    }

    this.setupInterceptors();
  }

  // Set up request and response interceptors
  private setupInterceptors(): void {
    // Request interceptor for adding auth token and transforming camelCase to snake_case
    this.api.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // Add authorization token if available
        const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Transform request data from camelCase to snake_case
        if (
          config.data &&
          typeof config.data === "object" &&
          !(config.data instanceof FormData) &&
          !(config.data instanceof URLSearchParams) &&
          !(config.data instanceof Blob)
        ) {
          config.data = objectToSnakeCase(config.data);
        }

        // Transform URL params if they exist
        if (config.params) {
          config.params = objectToSnakeCase(config.params);
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for handling common errors and transforming snake_case to camelCase
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        // Transform response data from snake_case to camelCase
        if (response.data && typeof response.data === "object") {
          response.data = objectToCamelCase(response.data);
        }
        return response;
      },
      (error) => {
        // Handle unauthorized errors (401)
        if (error.response?.status === 401) {
          localStorage.removeItem(STORAGE_KEYS.TOKEN);
          localStorage.removeItem(STORAGE_KEYS.USER_DATA);
          
          // Dispatch an event to notify the app about authentication failure
          const authErrorEvent = new CustomEvent('auth:error', { 
            detail: { status: 401, message: 'Authentication failed' } 
          });
          window.dispatchEvent(authErrorEvent);
        }

        // Transform error response data if it exists
        if (error.response?.data) {
          error.response.data = objectToCamelCase(error.response.data);
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Generate a stable hash key for request deduplication
   */
  private getRequestKey(method: string, url: string, params?: unknown, data?: unknown): string {
    return JSON.stringify({
      method,
      url,
      params: params ? JSON.stringify(params) : undefined,
      data: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * Helper to deduplicate in-flight requests
   */
  private async executeWithDeduplication<T>(
    method: string,
    url: string,
    requestFn: () => Promise<T>,
    params?: unknown,
    data?: unknown
  ): Promise<T> {
    // Generate a unique key for this request
    const requestKey = this.getRequestKey(method, url, params, data);
    
    // Check if there's already an identical request in flight
    const existingRequest = this.inFlightRequests.get(requestKey);
    if (existingRequest) {
      if (process.env.NODE_ENV === "development") {
        console.debug(
          `[API] Reusing in-flight request: ${method} ${url}`
        );
      }
      return existingRequest as Promise<T>;
    }
    
    // Execute the new request and track it
    const startTime = performance.now();
    const promise = requestFn();
    this.inFlightRequests.set(requestKey, promise);
    
    // When the request completes, remove it from tracking and log performance
    promise.finally(() => {
      this.inFlightRequests.delete(requestKey);
      if (process.env.NODE_ENV === "development") {
        const duration = performance.now() - startTime;
        console.debug(
          `[API] ${method} ${url} completed in ${duration.toFixed(2)}ms`
        );
      }
    });
    
    return promise;
  }

  // Generic GET request
  public async get<T, D = object>(url: string, params?: D): Promise<T> {
    return this.executeWithDeduplication<T>(
      "GET",
      url,
      async () => {
        try {
          const response = await this.api.get<T>(url, { params });
          return response.data;
        } catch (error) {
          throw this.handleError(error);
        }
      },
      params
    );
  }

  // Generic POST request
  public async post<T, D = unknown>(url: string, data?: D): Promise<T> {
    return this.executeWithDeduplication<T>(
      "POST",
      url,
      async () => {
        try {
          const response = await this.api.post<T>(url, data);
          return response.data;
        } catch (error) {
          throw this.handleError(error);
        }
      },
      undefined,
      data
    );
  }

  // Generic PUT request
  public async put<T, D = unknown>(url: string, data?: D): Promise<T> {
    return this.executeWithDeduplication<T>(
      "PUT",
      url,
      async () => {
        try {
          const response = await this.api.put<T>(url, data);
          return response.data;
        } catch (error) {
          throw this.handleError(error);
        }
      },
      undefined,
      data
    );
  }

  // Generic PATCH request
  public async patch<T, D = unknown>(url: string, data?: D): Promise<T> {
    return this.executeWithDeduplication<T>(
      "PATCH",
      url,
      async () => {
        try {
          const response = await this.api.patch<T>(url, data);
          return response.data;
        } catch (error) {
          throw this.handleError(error);
        }
      },
      undefined,
      data
    );
  }

  // Generic DELETE request
  public async delete<T>(url: string): Promise<T> {
    return this.executeWithDeduplication<T>(
      "DELETE",
      url,
      async () => {
        try {
          const response = await this.api.delete<T>(url);
          return response.data;
        } catch (error) {
          throw this.handleError(error);
        }
      }
    );
  }

  // File upload helper with progress tracking
  public async uploadFile<T>(
    url: string,
    file: File,
    onProgress?: (percentage: number) => void
  ): Promise<T> {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await this.api.post<T>(url, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percentage = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(percentage);
          }
        },
      });

      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get the base URL
   */
  public getBaseUrl(): string {
    return API_BASE_URL;
  }

  /**
   * Standardized error handler with improved error classification
   */
  private handleError(error: unknown): Error {
    let errorMessage = "An unexpected error occurred";
    let statusCode: number | undefined;
    let errorType: string = "unknown";

    if (axios.isAxiosError(error) && error.response) {
      // Server responded with an error status code
      statusCode = error.response.status;
      const serverError = error.response.data;
      
      // Determine error type based on status code
      if (statusCode >= 400 && statusCode < 500) {
        if (statusCode === 401) {
          errorType = "unauthorized";
        } else if (statusCode === 403) {
          errorType = "forbidden";
        } else if (statusCode === 404) {
          errorType = "not_found";
        } else if (statusCode === 422) {
          errorType = "validation";
        } else {
          errorType = "client_error";
        }
      } else if (statusCode >= 500) {
        errorType = "server_error";
      }
      
      errorMessage = serverError.message || serverError.error || `Error ${statusCode}`;
    } else if (axios.isAxiosError(error) && error.request) {
      // Request was made but no response was received
      errorType = "network";
      errorMessage = "No response received from server";
    } else {
      // Something happened in setting up the request
      if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
      }
    }

    // Create enhanced error object with additional metadata
    const enhancedError = new Error(errorMessage) as Error & {
      statusCode?: number;
      errorType?: string;
    };
    
    enhancedError.statusCode = statusCode;
    enhancedError.errorType = errorType;

    return enhancedError;
  }
}

// Create and export a single instance
const apiService = new ApiService();
export default apiService;