import axios, {
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { objectToCamelCase, objectToSnakeCase } from "../utils/caseTransform";

// Create the API base URL configuration
const API_BASE_URL =
  import.meta.env.REACT_APP_API_URL || "http://localhost:3000/api/v1";

// Constants for localStorage keys
const TOKEN_KEY = "token";
const GUEST_CART_TOKEN_KEY = "guest_cart_token";

/**
 * Enhanced API client that properly handles guest cart tokens
 * and provides consistent error handling and data transformation
 */
class ApiService {
  private api: AxiosInstance;
  private guestCartToken: string | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Initialize guest cart token from localStorage
    this.loadGuestCartToken();

    this.setupInterceptors();
  }

  // Load guest cart token from localStorage
  private loadGuestCartToken(): void {
    this.guestCartToken = localStorage.getItem(GUEST_CART_TOKEN_KEY);
    console.debug("Guest cart token loaded:", this.guestCartToken);
  }

  // Set up request and response interceptors
  private setupInterceptors(): void {
    // Request interceptor for adding auth token and transforming camelCase to snake_case
    this.api.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // Add authorization token if available
        const token = localStorage.getItem(TOKEN_KEY);
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add guest cart token if available either from instance var or localStorage
        if (!this.guestCartToken) {
          this.loadGuestCartToken();
        }

        if (this.guestCartToken && config.headers) {
          config.headers["X-Guest-Cart-Token"] = this.guestCartToken;
          console.debug(
            "Adding guest cart token to request:",
            this.guestCartToken
          );
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
        // Check for guest cart token in response headers and save it
        const guestCartToken = response.headers["x-guest-cart-token"];
        if (guestCartToken) {
          this.guestCartToken = guestCartToken;
          localStorage.setItem(GUEST_CART_TOKEN_KEY, guestCartToken);
          console.log(
            "Guest cart token saved from response headers:",
            guestCartToken
          );
        }

        // Transform response data from snake_case to camelCase
        if (response.data && typeof response.data === "object") {
          response.data = objectToCamelCase(response.data);
        }
        return response;
      },
      (error) => {
        // Still check for guest cart token in error responses
        if (error.response?.headers?.["x-guest-cart-token"]) {
          const guestCartToken = error.response.headers["x-guest-cart-token"];
          this.guestCartToken = guestCartToken;
          localStorage.setItem(GUEST_CART_TOKEN_KEY, guestCartToken);
          console.debug(
            "Guest cart token saved from error response:",
            guestCartToken
          );
        }

        // Handle unauthorized errors (401)
        if (error.response?.status === 401) {
          localStorage.removeItem(TOKEN_KEY);
          // Don't remove guest cart token on auth failure
        }

        // Transform error response data if it exists
        if (error.response?.data) {
          error.response.data = objectToCamelCase(error.response.data);
        }

        return Promise.reject(error);
      }
    );
  }

  // Generic GET request
  public async get<T, D = object>(url: string, params?: D): Promise<T> {
    try {
      const response = await this.api.get<T>(url, { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Generic POST request
  public async post<T, D = unknown>(url: string, data?: D): Promise<T> {
    try {
      const response = await this.api.post<T>(url, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Generic PUT request
  public async put<T, D = unknown>(url: string, data?: D): Promise<T> {
    try {
      const response = await this.api.put<T>(url, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Generic PATCH request
  public async patch<T, D = unknown>(url: string, data?: D): Promise<T> {
    try {
      const response = await this.api.patch<T>(url, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Generic DELETE request
  public async delete<T>(url: string): Promise<T> {
    try {
      const response = await this.api.delete<T>(url);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // File upload helper
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
   * Get the current guest cart token from localStorage and instance variable
   */
  public getGuestCartToken(): string | null {
    // First check instance variable, then localStorage as fallback
    if (this.guestCartToken) {
      return this.guestCartToken;
    }

    // Try to load from localStorage
    this.loadGuestCartToken();
    return this.guestCartToken;
  }

  /**
   * Save guest cart token to localStorage and instance variable
   */
  public saveGuestCartToken(token: string): void {
    if (token && token.trim() !== "") {
      this.guestCartToken = token;
      localStorage.setItem(GUEST_CART_TOKEN_KEY, token);
      console.debug("Guest cart token saved:", token);
    }
  }

  /**
   * Clear guest cart token from localStorage and instance variable
   */
  public clearGuestCartToken(): void {
    this.guestCartToken = null;
    localStorage.removeItem(GUEST_CART_TOKEN_KEY);
    console.debug("Guest cart token cleared");
  }

  /**
   * Get the base URL
   */
  public getBaseUrl(): string {
    return API_BASE_URL;
  }

  /**
   * Standardized error handler
   */
  private handleError(error: unknown): Error {
    let errorMessage = "An unexpected error occurred";

    if (axios.isAxiosError(error) && error.response) {
      // Server responded with an error status code
      const serverError = error.response.data;
      errorMessage = serverError.message || serverError.error || errorMessage;
    } else if (axios.isAxiosError(error) && error.request) {
      // Request was made but no response was received
      errorMessage = "No response received from server";
    } else {
      // Something happened in setting up the request
      if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
      }
    }

    return new Error(errorMessage);
  }
}

// Create and export a single instance
const apiService = new ApiService();
export default apiService;
