interface ApiConfig {
  timeout?: number;
  headers?: Record<string, string>;
}

interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
}

interface ApiError extends Error {
  response?: {
    data?: unknown;
    status?: number;
    statusText?: string;
  };
  code?: string;
}

class ApiClient {
  private baseURL: string = "";
  private timeout: number = 30000;
  private defaultHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };

  constructor(config: ApiConfig = {}) {
    this.timeout = config.timeout || 30000;
    this.defaultHeaders = { ...this.defaultHeaders, ...config.headers };
  }

  private async request<T = unknown>(
    url: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const method = options.method || "GET";

      const config: RequestInit = {
        ...options,
        signal: controller.signal,
        headers: {
          ...this.defaultHeaders,
          ...options.headers,
        },
      };

      const response = await fetch(url, config);
      clearTimeout(timeoutId);

      let responseData: T;
      const contentType = response.headers.get("content-type");

      try {
        if (contentType && contentType.includes("application/json")) {
          responseData = await response.json();
        } else {
          responseData = (await response.text()) as unknown as T;
        }
      } catch (parseError) {
                        
        responseData = (await response.text()) as unknown as T;
      }

      const apiResponse: ApiResponse<T> = {
        data: responseData,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      };

      if (!response.ok) {
        const error: ApiError = new Error(
          `HTTP ${response.status}: ${response.statusText}`
        );
        error.response = {
          data: responseData,
          status: response.status,
          statusText: response.statusText,
        };

        console.error("API Error Details:", {
          status: response.status,
          statusText: response.statusText,
          url: url,
          method: method,
          data: responseData,
        });
        throw error;
      }

      return apiResponse;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === "AbortError") {
        const timeoutError: ApiError = new Error("Request timeout");
        timeoutError.code = "TIMEOUT";
        console.error("API Timeout Error:", {
          url: url,
          timeout: this.timeout,
        });
        throw timeoutError;
      }


      if (error instanceof TypeError) {
        const networkError: ApiError = new Error(
          "Network error - please check your connection"
        );
        networkError.code = "NETWORK_ERROR";
        console.error("Network Error:", {
          url: url,
          originalMessage: error.message,
        });
        throw networkError;
      }


      if (error instanceof Error && "response" in error) {
        console.error("API Response Error:", {
          message: error.message,
          status: (error as ApiError).response?.status,
          data: (error as ApiError).response?.data,
          url: url,
        });
        throw error;
      }

      // Handle unknown errors
      const unknownError: ApiError = new Error("An unexpected error occurred");
      console.error("Unknown Error:", {
        error: error,
        url: url,
        type: typeof error,
      });
      throw unknownError;
    }
  }

  async get<T = unknown>(
    url: string,
    config: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...config, method: "GET" });
  }

  async post<T = unknown>(
    url: string,
    data?: unknown,
    config: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const body = data instanceof FormData ? data : JSON.stringify(data);
    const headers =
      data instanceof FormData
        ? { ...config.headers } // Don't override Content-Type for FormData
        : { ...this.defaultHeaders, ...config.headers };

    return this.request<T>(url, {
      ...config,
      method: "POST",
      body,
      headers,
    });
  }

  async put<T = unknown>(
    url: string,
    data?: unknown,
    config: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      ...config,
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async patch<T = unknown>(
    url: string,
    data?: unknown,
    config: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      ...config,
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async delete<T = unknown>(
    url: string,
    config: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...config, method: "DELETE" });
  }
}

const api = new ApiClient({
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
