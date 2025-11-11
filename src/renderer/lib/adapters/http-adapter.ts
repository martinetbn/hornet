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

      const config: AxiosRequestConfig = {
        method: request.method,
        url: request.url,
        headers,
        params,
        data: request.body?.content,
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
      };
    } catch (error) {
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
