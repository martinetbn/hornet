// HTTP Protocol Adapter

import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, CancelTokenSource } from 'axios';
import type { HttpRequest, HttpResponse, SSEMessage, SSEEvent } from '@/types';
import type { ProtocolAdapter } from './base';

export class HttpAdapter implements ProtocolAdapter<HttpRequest, HttpResponse> {
  private client: AxiosInstance;
  private cancelToken?: CancelTokenSource;
  private abortController?: AbortController;
  private reader?: ReadableStreamDefaultReader<Uint8Array>;
  private eventListeners = new Map<string, Set<Function>>();
  private buffer = '';
  private isStreaming = false;

  constructor() {
    this.client = axios.create({
      timeout: 30000,
      validateStatus: () => true, // Don't throw on any status code
    });
  }

  async execute(request: HttpRequest): Promise<HttpResponse> {
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

      // GET and HEAD methods cannot have a body
      const canHaveBody = request.method !== 'GET' && request.method !== 'HEAD';

      // Make initial request with fetch to check headers
      this.abortController = new AbortController();

      const fetchResponse = await fetch(url.toString(), {
        method: request.method,
        headers,
        ...(canHaveBody && request.body?.content ? { body: request.body.content } : {}),
        signal: this.abortController.signal,
      });

      const responseHeaders: Record<string, string> = {};
      fetchResponse.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      // Check if this is an SSE endpoint
      const contentType = responseHeaders['content-type'] || '';
      const isSSE = contentType.includes('text/event-stream');

      // If it's SSE, automatically start streaming
      if (isSSE) {
        return await this.startStreaming(request, url.toString(), headers, startTime, fetchResponse);
      }

      // For non-SSE, abort fetch and use axios for better handling
      this.abortController.abort();
      this.abortController = undefined;

      this.cancelToken = axios.CancelToken.source();

      const config: AxiosRequestConfig = {
        method: request.method,
        url: url.toString(),
        headers,
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
      if (error instanceof Error && error.name === 'AbortError') {
        // This is expected when we abort to switch to axios
        throw new Error('Request aborted');
      }

      if (axios.isCancel(error)) {
        throw new Error('Request cancelled');
      }

      if (axios.isAxiosError(error)) {
        throw new Error(error.message || 'Request failed');
      }

      throw error;
    }
  }

  private async startStreaming(
    request: HttpRequest,
    url: string,
    headers: Record<string, string>,
    startTime: number,
    fetchResponse: Response
  ): Promise<HttpResponse> {
    this.isStreaming = true;

    try {
      const responseHeaders: Record<string, string> = {};
      fetchResponse.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      if (!fetchResponse.ok) {
        throw new Error(`HTTP ${fetchResponse.status}: ${fetchResponse.statusText}`);
      }

      const endTime = Date.now();

      // Emit connected message
      const connectedMessage: SSEMessage = {
        id: crypto.randomUUID(),
        type: 'connected',
        timestamp: Date.now(),
      };
      this.emit('message', connectedMessage);

      // Start reading the stream in background
      if (fetchResponse.body) {
        this.reader = fetchResponse.body.getReader();
        this.readStream();
      }

      return {
        status: fetchResponse.status,
        statusText: fetchResponse.statusText,
        headers: responseHeaders,
        data: 'Connected to SSE stream. Messages will appear below.',
        duration: endTime - startTime,
        size: 0,
        timestamp: endTime,
        isSSE: true,
        sseMessages: [connectedMessage],
      };
    } catch (error) {
      this.isStreaming = false;

      const errorMessage: SSEMessage = {
        id: crypto.randomUUID(),
        type: 'error',
        error: error instanceof Error ? error.message : 'Failed to establish connection',
        timestamp: Date.now(),
      };
      this.emit('message', errorMessage);
      this.emit('error', error);

      throw error;
    }
  }

  private async readStream(): Promise<void> {
    if (!this.reader) return;

    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await this.reader.read();

        if (done) {
          this.isStreaming = false;
          this.emit('disconnected');
          break;
        }

        // Decode the chunk and add to buffer
        const chunk = decoder.decode(value, { stream: true });
        this.buffer += chunk;

        // Process complete messages (separated by double newline)
        const messages = this.buffer.split('\n\n');
        this.buffer = messages.pop() || ''; // Keep incomplete message in buffer

        for (const message of messages) {
          if (message.trim()) {
            this.parseSSEMessage(message);
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Normal disconnection
        return;
      }

      this.isStreaming = false;

      const errorMessage: SSEMessage = {
        id: crypto.randomUUID(),
        type: 'error',
        error: error instanceof Error ? error.message : 'Stream error',
        timestamp: Date.now(),
      };
      this.emit('message', errorMessage);
      this.emit('error', error);
    }
  }

  private parseSSEMessage(raw: string): void {
    const lines = raw.split('\n');
    let eventType = 'message';
    let data = '';
    let id = '';
    let retry: number | undefined;

    for (const line of lines) {
      if (line.startsWith('event:')) {
        eventType = line.slice(6).trim();
      } else if (line.startsWith('data:')) {
        data += line.slice(5).trim() + '\n';
      } else if (line.startsWith('id:')) {
        id = line.slice(3).trim();
      } else if (line.startsWith('retry:')) {
        retry = parseInt(line.slice(6).trim(), 10);
      }
    }

    // Remove trailing newline from data
    data = data.replace(/\n$/, '');

    if (data) {
      const sseEvent: SSEEvent = {
        id: id || crypto.randomUUID(),
        event: eventType,
        data,
        timestamp: Date.now(),
        retry,
      };

      const message: SSEMessage = {
        id: crypto.randomUUID(),
        type: 'event',
        event: sseEvent,
        timestamp: Date.now(),
      };

      this.emit('message', message);
    }
  }

  public async disconnectStream(): Promise<void> {
    if (!this.isStreaming) return;

    // Cancel the fetch request
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = undefined;
    }

    // Close the reader
    if (this.reader) {
      try {
        await this.reader.cancel();
      } catch {
        // Ignore errors on cancel
      }
      this.reader = undefined;
    }

    this.isStreaming = false;
    this.buffer = '';

    const message: SSEMessage = {
      id: crypto.randomUUID(),
      type: 'disconnected',
      timestamp: Date.now(),
    };
    this.emit('message', message);
    this.emit('disconnected');
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
    this.cancelToken?.cancel('Request cancelled by user');
    if (this.isStreaming) {
      this.disconnectStream();
    }
  }

  dispose(): void {
    this.cancel();
    this.eventListeners.clear();
  }
}
