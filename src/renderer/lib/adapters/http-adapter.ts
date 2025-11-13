// HTTP Protocol Adapter

import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, CancelTokenSource } from 'axios';
import type { HttpRequest, HttpResponse } from '@/types';
import type { ProtocolAdapter } from './base';

export class HttpAdapter implements ProtocolAdapter<HttpRequest, HttpResponse> {
  private client: AxiosInstance;
  private cancelToken?: CancelTokenSource;

  constructor() {
    this.client = axios.create({
      timeout: 30000,
      validateStatus: () => true, // Don't throw on any status code
    });
  }

  async execute(request: HttpRequest): Promise<HttpResponse> {
    this.cancelToken = axios.CancelToken.source();

    const startTime = Date.now();

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

      // Use fetch for initial request to check headers without waiting for full response
      const abortController = new AbortController();

      // GET and HEAD methods cannot have a body
      const canHaveBody = request.method !== 'GET' && request.method !== 'HEAD';

      const fetchResponse = await fetch(url.toString(), {
        method: request.method,
        headers,
        ...(canHaveBody && request.body?.content ? { body: request.body.content } : {}),
        signal: abortController.signal,
      });

      const responseHeaders: Record<string, string> = {};
      fetchResponse.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      // Check if this is an SSE endpoint
      const contentType = responseHeaders['content-type'] || '';
      const isSSE = contentType.includes('text/event-stream');

      // If it's SSE, abort the request immediately and return minimal response
      if (isSSE) {
        abortController.abort();
        const endTime = Date.now();

        return {
          status: fetchResponse.status,
          statusText: fetchResponse.statusText,
          headers: responseHeaders,
          data: 'SSE endpoint detected. Click "Connect to Stream" to start receiving events.',
          duration: endTime - startTime,
          size: 0,
          timestamp: endTime,
          isSSE: true,
        };
      }

      // For non-SSE responses, read the body normally with axios
      const config: AxiosRequestConfig = {
        method: request.method,
        url: request.url,
        headers,
        params,
        ...(canHaveBody && request.body?.content ? { data: request.body.content } : {}),
        cancelToken: this.cancelToken.token,
        timeout: request.timeout,
      };

      const response = await this.client.request(config);
      const endTime = Date.now();

      return {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers as Record<string, string>,
        data: response.data,
        duration: endTime - startTime,
        size: JSON.stringify(response.data).length,
        timestamp: endTime,
        isSSE: false,
      };
    } catch (error) {
      // Ignore abort errors from SSE detection
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request aborted');
      }

      if (axios.isCancel(error)) {
        throw new Error('Request cancelled');
      }

      const endTime = Date.now();

      if (axios.isAxiosError(error)) {
        throw new Error(error.message || 'Request failed');
      }

      throw error;
    }
  }

  cancel(): void {
    this.cancelToken?.cancel('Request cancelled by user');
  }

  dispose(): void {
    this.cancel();
  }
}
