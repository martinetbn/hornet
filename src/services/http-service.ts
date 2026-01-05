// HTTP service for main process (supports CORS bypass and full header control)
import axios from "axios";
import type { AxiosRequestConfig, CancelTokenSource } from "axios";

interface HttpRequestOptions {
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: string;
  timeout?: number;
}

interface HttpResponseResult {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: unknown;
  duration: number;
  size: number;
}

interface ActiveRequest {
  cancelToken: CancelTokenSource;
  id: string;
}

export class HttpService {
  private activeRequests: Map<string, ActiveRequest> = new Map();

  /**
   * Execute an HTTP request
   */
  async request(
    requestId: string,
    options: HttpRequestOptions,
  ): Promise<HttpResponseResult> {
    const startTime = Date.now();
    const cancelToken = axios.CancelToken.source();

    this.activeRequests.set(requestId, { cancelToken, id: requestId });

    try {
      const config: AxiosRequestConfig = {
        method: options.method,
        url: options.url,
        headers: options.headers || {},
        timeout: options.timeout || 30000,
        cancelToken: cancelToken.token,
        validateStatus: () => true, // Don't throw on any status code
        // Handle response as text to preserve raw data
        transformResponse: [(data) => data],
      };

      // Only add body for methods that support it
      if (
        options.body &&
        options.method !== "GET" &&
        options.method !== "HEAD"
      ) {
        config.data = options.body;
      }

      const response = await axios.request(config);
      const endTime = Date.now();

      // Convert axios headers to plain object
      const headers: Record<string, string> = {};
      Object.entries(response.headers).forEach(([key, value]) => {
        if (typeof value === "string") {
          headers[key] = value;
        } else if (Array.isArray(value)) {
          headers[key] = value.join(", ");
        }
      });

      // Try to parse as JSON if content-type suggests it
      let data = response.data;
      const contentType = headers["content-type"] || "";
      if (
        contentType.includes("application/json") &&
        typeof data === "string"
      ) {
        try {
          data = JSON.parse(data);
        } catch {
          // Keep as string if parsing fails
        }
      }

      const size =
        typeof response.data === "string"
          ? Buffer.byteLength(response.data, "utf8")
          : 0;

      return {
        status: response.status,
        statusText: response.statusText,
        headers,
        data,
        duration: endTime - startTime,
        size,
      };
    } finally {
      this.activeRequests.delete(requestId);
    }
  }

  /**
   * Cancel an active request
   */
  cancel(requestId: string): boolean {
    const request = this.activeRequests.get(requestId);
    if (request) {
      request.cancelToken.cancel("Request cancelled by user");
      this.activeRequests.delete(requestId);
      return true;
    }
    return false;
  }

  /**
   * Clean up all active requests
   */
  cleanup(): void {
    this.activeRequests.forEach((request) => {
      request.cancelToken.cancel("Service cleanup");
    });
    this.activeRequests.clear();
  }
}

// Singleton instance
export const httpService = new HttpService();
