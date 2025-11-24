// WebSocket service for main process (supports custom headers)
import WebSocket from 'ws';
import type { ClientRequestArgs } from 'http';

interface WebSocketConnection {
  ws: WebSocket;
  id: string;
}

interface ConnectOptions {
  url: string;
  protocols?: string[];
  headers?: Record<string, string>;
}

interface SendMessageOptions {
  connectionId: string;
  data: string | Buffer;
}

export class WebSocketService {
  private connections: Map<string, WebSocketConnection> = new Map();

  /**
   * Connect to a WebSocket server with optional custom headers
   */
  connect(connectionId: string, options: ConnectOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Parse URL to build request options
        const url = new URL(options.url);

        // Build WebSocket client options with custom headers
        const wsOptions: WebSocket.ClientOptions & ClientRequestArgs = {
          headers: options.headers || {},
          protocol: options.protocols?.join(', '),
        };

        // Create WebSocket connection with custom headers
        const ws = new WebSocket(options.url, wsOptions);

        ws.on('open', () => {
          this.connections.set(connectionId, { ws, id: connectionId });
          resolve();
        });

        ws.on('error', (error) => {
          reject(error);
        });

        ws.on('close', () => {
          this.connections.delete(connectionId);
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Send a message to a WebSocket connection
   */
  send(options: SendMessageOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      const connection = this.connections.get(options.connectionId);

      if (!connection) {
        reject(new Error('WebSocket connection not found'));
        return;
      }

      if (connection.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket is not connected'));
        return;
      }

      connection.ws.send(options.data, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Disconnect a WebSocket connection
   */
  disconnect(connectionId: string): Promise<void> {
    return new Promise((resolve) => {
      const connection = this.connections.get(connectionId);

      if (!connection) {
        resolve();
        return;
      }

      connection.ws.close();
      this.connections.delete(connectionId);
      resolve();
    });
  }

  /**
   * Get the WebSocket instance for a connection (for event listeners)
   */
  getConnection(connectionId: string): WebSocket | undefined {
    return this.connections.get(connectionId)?.ws;
  }

  /**
   * Check connection status
   */
  getStatus(connectionId: string): 'connecting' | 'open' | 'closing' | 'closed' | 'disconnected' {
    const connection = this.connections.get(connectionId);

    if (!connection) {
      return 'disconnected';
    }

    switch (connection.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'open';
      case WebSocket.CLOSING:
        return 'closing';
      case WebSocket.CLOSED:
        return 'closed';
      default:
        return 'disconnected';
    }
  }

  /**
   * Clean up all connections
   */
  cleanup(): void {
    this.connections.forEach((connection) => {
      connection.ws.close();
    });
    this.connections.clear();
  }
}

// Singleton instance
export const websocketService = new WebSocketService();
