import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from "axios";

// Create the API base URL configuration
const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:3001/api/v1";

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
    // Request interceptor for adding auth token
    this.api.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem("token");
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for handling common errors
    this.api.interceptors.response.use(
      (response: AxiosResponse) => response,
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

        return Promise.reject(error);
      }
    );
  }

  // Generic GET request
  public async get<T>(url: string, params?: any): Promise<T> {
    try {
      const response = await this.api.get<T>(url, { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Generic POST request
  public async post<T>(url: string, data?: any): Promise<T> {
    try {
      const response = await this.api.post<T>(url, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Generic PUT request
  public async put<T>(url: string, data?: any): Promise<T> {
    try {
      const response = await this.api.put<T>(url, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Generic PATCH request
  public async patch<T>(url: string, data?: any): Promise<T> {
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
  private handleError(error: any): Error {
    let errorMessage = "An unexpected error occurred";

    if (error.response) {
      // Server responded with an error status code
      const serverError = error.response.data;
      errorMessage = serverError.message || serverError.error || errorMessage;
    } else if (error.request) {
      // Request was made but no response was received
      errorMessage = "No response received from server";
    } else {
      // Something happened in setting up the request
      errorMessage = error.message || errorMessage;
    }

    return new Error(errorMessage);
  }
}

// Create and export a single instance
const apiService = new ApiService();
export default apiService;
