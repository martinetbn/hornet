// WebSocket Protocol Adapter

import { WebSocketConfig, WebSocketMessage } from '@/types';
import { ConnectionAdapter, ConnectionStatus } from './base';

export class WebSocketAdapter implements ConnectionAdapter<WebSocketConfig, WebSocketMessage> {
  private ws?: WebSocket;
  private status: ConnectionStatus = 'disconnected';
  private eventListeners = new Map<string, Set<Function>>();

  async connect(config: WebSocketConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      this.status = 'connecting';
      this.emit('status', this.status);

      this.ws = new WebSocket(config.url, config.protocols);

      this.ws.onopen = () => {
        this.status = 'connected';
        this.emit('status', this.status);
        this.emit('connected');
        resolve();
      };

      this.ws.onmessage = (event) => {
        const message: WebSocketMessage = {
          id: crypto.randomUUID(),
          type: 'received',
          data: event.data,
          timestamp: Date.now(),
        };
        this.emit('message', message);
      };

      this.ws.onerror = (error) => {
        this.status = 'error';
        this.emit('status', this.status);
        this.emit('error', error);
        reject(error);
      };

      this.ws.onclose = (event) => {
        this.status = 'disconnected';
        this.emit('status', this.status);
        this.emit('disconnected', { code: event.code, reason: event.reason });
      };
    });
  }

  async send(message: WebSocketMessage): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected');
    }

    this.ws.send(message.data as string);

    const sentMessage: WebSocketMessage = {
      ...message,
      type: 'sent',
      timestamp: Date.now(),
    };
    this.emit('message', sentMessage);
  }

  async disconnect(): Promise<void> {
    if (!this.ws) return;

    this.status = 'disconnecting';
    this.emit('status', this.status);

    this.ws.close();
    this.ws = undefined;
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
