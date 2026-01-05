// Socket.IO service for main process (supports CORS bypass and full header control)
import { io, Socket } from "socket.io-client";

interface SocketIOConnectOptions {
  url: string;
  path?: string;
  auth?: Record<string, unknown>;
  transports?: ("websocket" | "polling")[];
  query?: Record<string, string>;
  headers?: Record<string, string>;
}

interface SocketIOConnection {
  socket: Socket;
  id: string;
}

export class SocketIOService {
  private connections: Map<string, SocketIOConnection> = new Map();

  /**
   * Connect to a Socket.IO server
   */
  connect(connectionId: string, options: SocketIOConnectOptions): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const socket = io(options.url, {
          path: options.path || "/socket.io",
          auth: options.auth,
          transports: options.transports || ["websocket", "polling"],
          query: options.query,
          extraHeaders: options.headers,
        });

        socket.on("connect", () => {
          this.connections.set(connectionId, { socket, id: connectionId });
          resolve(socket.id || connectionId);
        });

        socket.on("connect_error", (error) => {
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Send a message to a Socket.IO connection
   */
  send(connectionId: string, event: string, data: unknown[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const connection = this.connections.get(connectionId);

      if (!connection) {
        reject(new Error("Socket.IO connection not found"));
        return;
      }

      if (!connection.socket.connected) {
        reject(new Error("Socket.IO is not connected"));
        return;
      }

      connection.socket.emit(event, ...data);
      resolve();
    });
  }

  /**
   * Get the socket instance for a connection (for event listeners)
   */
  getConnection(connectionId: string): Socket | undefined {
    return this.connections.get(connectionId)?.socket;
  }

  /**
   * Disconnect from a Socket.IO server
   */
  disconnect(connectionId: string): Promise<void> {
    return new Promise((resolve) => {
      const connection = this.connections.get(connectionId);

      if (!connection) {
        resolve();
        return;
      }

      connection.socket.disconnect();
      this.connections.delete(connectionId);
      resolve();
    });
  }

  /**
   * Check connection status
   */
  getStatus(connectionId: string): "connected" | "disconnected" {
    const connection = this.connections.get(connectionId);
    return connection?.socket.connected ? "connected" : "disconnected";
  }

  /**
   * Clean up all connections
   */
  cleanup(): void {
    this.connections.forEach((connection) => {
      connection.socket.disconnect();
    });
    this.connections.clear();
  }
}

// Singleton instance
export const socketIOService = new SocketIOService();
