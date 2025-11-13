// Server-Sent Events (SSE) Protocol Adapter

import type { SSEConfig, SSEMessage, SSEEvent } from '@/types';
import type { ConnectionAdapter, ConnectionStatus } from './base';

export class SSEAdapter implements ConnectionAdapter<SSEConfig, never> {
  private abortController?: AbortController;
  private reader?: ReadableStreamDefaultReader<Uint8Array>;
  private status: ConnectionStatus = 'disconnected';
  private eventListeners = new Map<string, Set<Function>>();
  private buffer = '';

  async connect(config: SSEConfig): Promise<void> {
    return new Promise(async (resolve, reject) => {
      this.status = 'connecting';
      this.emit('status', this.status);

      try {
        // Use fetch with ReadableStream for proper header support
        this.abortController = new AbortController();

        // Convert headers from KeyValuePair to Headers object
        const headers = new Headers();
        config.headers?.forEach((h) => {
          if (h.enabled !== false && h.key && h.value) {
            headers.append(h.key, h.value);
          }
        });

        const response = await fetch(config.url, {
          method: 'GET',
          headers,
          signal: this.abortController.signal,
          credentials: config.withCredentials ? 'include' : 'same-origin',
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('text/event-stream')) {
          throw new Error('Response is not an event stream');
        }

        this.status = 'connected';
        this.emit('status', this.status);

        const message: SSEMessage = {
          id: crypto.randomUUID(),
          type: 'connected',
          timestamp: Date.now(),
        };
        this.emit('message', message);
        this.emit('connected');
        resolve();

        // Start reading the stream
        if (response.body) {
          this.reader = response.body.getReader();
          this.readStream();
        }
      } catch (error) {
        this.status = 'error';
        this.emit('status', this.status);

        const errorMessage: SSEMessage = {
          id: crypto.randomUUID(),
          type: 'error',
          error: error instanceof Error ? error.message : 'Failed to establish connection',
          timestamp: Date.now(),
        };
        this.emit('message', errorMessage);
        this.emit('error', error);
        reject(error);
      }
    });
  }

  private async readStream(): Promise<void> {
    if (!this.reader) return;

    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await this.reader.read();

        if (done) {
          this.status = 'disconnected';
          this.emit('status', this.status);
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

      this.status = 'error';
      this.emit('status', this.status);

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

  /**
   * Register a listener for a specific SSE event type
   * Note: With fetch-based implementation, all events are automatically captured
   */
  public listenToEvent(eventType: string): void {
    // No-op with fetch implementation - all events are captured automatically
    // Kept for API compatibility
  }

  async send(_message: never): Promise<void> {
    // SSE is unidirectional (server -> client only)
    // Client cannot send messages over SSE
    throw new Error('SSE is unidirectional. Use HTTP requests to send data to the server.');
  }

  async disconnect(): Promise<void> {
    if (!this.abortController && !this.reader) return;

    this.status = 'disconnecting';
    this.emit('status', this.status);

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

    this.status = 'disconnected';
    this.emit('status', this.status);

    const message: SSEMessage = {
      id: crypto.randomUUID(),
      type: 'disconnected',
      timestamp: Date.now(),
    };
    this.emit('message', message);
    this.emit('disconnected');
  }

  on(event: string, callback: (data: unknown) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  off(event: string, callback: (data: unknown) => void): void {
    this.eventListeners.get(event)?.delete(callback);
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }

  private emit(event: string, data?: unknown): void {
    this.eventListeners.get(event)?.forEach((callback) => callback(data));
  }
}
