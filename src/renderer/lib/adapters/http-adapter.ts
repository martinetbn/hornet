// HTTP Protocol Adapter (using Electron IPC for CORS bypass and full header control)

import type { HttpRequest, HttpResponse } from "@/types";
import type { ProtocolAdapter } from "./base";

export class HttpAdapter implements ProtocolAdapter<HttpRequest, HttpResponse> {
  private currentRequestId?: string;
  private eventListeners = new Map<string, Set<Function>>();

  async execute(request: HttpRequest): Promise<HttpResponse> {
    const requestId = crypto.randomUUID();
    this.currentRequestId = requestId;

    try {
      // Convert KeyValuePair arrays to objects
      const headers: Record<string, string> = {};
      request.headers?.forEach((h) => {
        if (h.enabled !== false && h.key && h.value) {
          headers[h.key] = h.value;
        }
      });

      const params: Record<string, string> = {};
      request.params?.forEach((p) => {
        if (p.enabled !== false && p.key && p.value) {
          params[p.key] = p.value;
        }
      });

      // Build URL with params
      const url = new URL(request.url);
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });

      // GET and HEAD methods cannot have a body
      const canHaveBody = request.method !== "GET" && request.method !== "HEAD";

      // Make request via IPC (main process - no CORS restrictions)
      const result = await window.electronAPI.http.request(requestId, {
        method: request.method,
        url: url.toString(),
        headers,
        body: canHaveBody && request.body?.content ? request.body.content : undefined,
        timeout: request.timeout,
      });

      if (!result.success || !result.response) {
        throw new Error(result.error || "Request failed");
      }

      const response = result.response;

      return {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data,
        duration: response.duration,
        size: response.size,
        timestamp: Date.now(),
        isSSE: false,
      };
    } finally {
      this.currentRequestId = undefined;
    }
  }

  public on(event: string, callback: (data: unknown) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  public off(event: string, callback: (data: unknown) => void): void {
    this.eventListeners.get(event)?.delete(callback);
  }

  private emit(event: string, data?: unknown): void {
    this.eventListeners.get(event)?.forEach((callback) => callback(data));
  }

  cancel(): void {
    if (this.currentRequestId) {
      window.electronAPI.http.cancel(this.currentRequestId);
      this.currentRequestId = undefined;
    }
  }

  dispose(): void {
    this.cancel();
    this.eventListeners.clear();
  }
}
