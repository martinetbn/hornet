// Socket.IO Protocol Adapter

import { io, Socket } from 'socket.io-client';
import type { SocketIOConfig, SocketIOMessage } from '@/types';
import type { ConnectionAdapter, ConnectionStatus } from './base';

export class SocketIOAdapter implements ConnectionAdapter<SocketIOConfig, SocketIOMessage> {
  private socket?: Socket;
  private status: ConnectionStatus = 'disconnected';
  private eventListeners = new Map<string, Set<Function>>();

  async connect(config: SocketIOConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      this.status = 'connecting';
      this.emit('status', this.status);

      // Convert KeyValuePair[] to Record<string, string> for query params
      const queryParams = config.query?.reduce((acc, { key, value, enabled }) => {
        if (enabled && key) {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, string>);

      // Convert KeyValuePair[] to Record<string, string> for headers
      const extraHeaders = config.headers?.reduce((acc, { key, value, enabled }) => {
        if (enabled && key) {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, string>);

      this.socket = io(config.url, {
        path: config.path || '/socket.io',
        auth: config.auth,
        transports: config.transports || ['websocket', 'polling'],
        query: queryParams,
        extraHeaders,
      });

      this.socket.on('connect', () => {
        this.status = 'connected';
        this.emit('status', this.status);
        this.emit('connected', { id: this.socket!.id });
        resolve();
      });

      this.socket.on('disconnect', (reason) => {
        this.status = 'disconnected';
        this.emit('status', this.status);
        this.emit('disconnected', { reason });
      });

      this.socket.on('connect_error', (error) => {
        this.status = 'error';
        this.emit('status', this.status);
        this.emit('error', error);
        reject(error);
      });

      // Listen to all events
      this.socket.onAny((event, ...args) => {
        const message: SocketIOMessage = {
          id: crypto.randomUUID(),
          type: 'received',
          event,
          data: args,
          timestamp: Date.now(),
        };
        this.emit('message', message);
      });
    });
  }

  async send(message: SocketIOMessage): Promise<void> {
    if (!this.socket?.connected) {
      throw new Error('Socket.IO is not connected');
    }

    this.socket.emit(message.event, ...message.data);

    const sentMessage: SocketIOMessage = {
      ...message,
      type: 'sent',
      timestamp: Date.now(),
    };
    this.emit('message', sentMessage);
  }

  async disconnect(): Promise<void> {
    if (!this.socket) return;

    this.status = 'disconnecting';
    this.emit('status', this.status);

    this.socket.disconnect();
    this.socket = undefined;
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
