import axios, {
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { objectToCamelCase, objectToSnakeCase } from "../utils/caseTransform";

// Create the API base URL configuration
const API_BASE_URL =
  import.meta.env.REACT_APP_API_URL || "http://localhost:3000/api/v1";

// Create a class for handling API requests
class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.setupInterceptors();
  }

  // Set up request and response interceptors
  private setupInterceptors(): void {
    // Request interceptor for adding auth token and transforming camelCase to snake_case
    this.api.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // Add authorization token
        const token = localStorage.getItem("token");
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Transform request data from camelCase to snake_case
        if (
          config.data &&
          typeof config.data === 'object' &&
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
        if (response.data && typeof response.data === 'object') {
          response.data = objectToCamelCase(response.data);
        }
        return response;
      },
      (error) => {
        // Handle unauthorized errors (401)
        if (error.response && error.response.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.location.href = "/login";
        }

        // Handle forbidden errors (403)
        if (error.response && error.response.status === 403) {
          console.error("Access forbidden:", error.response.data.message);
        }

        // Transform error response data if it exists
        if (error.response && error.response.data) {
          error.response.data = objectToCamelCase(error.response.data);
        }

        return Promise.reject(error);
      }
    );
  }

  // Generic GET request
  public async get<T, P = object>(url: string, params?: P): Promise<T> {
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

  // Error handler
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