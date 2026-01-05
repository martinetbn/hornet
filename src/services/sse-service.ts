// SSE service for main process (supports CORS bypass and full header control)
import http from "http";
import https from "https";
import { EventEmitter } from "events";

interface SSEConnectOptions {
  url: string;
  headers?: Record<string, string>;
  withCredentials?: boolean;
}

interface SSEEvent {
  id: string;
  event: string;
  data: string;
  timestamp: number;
  retry?: number;
}

interface SSEConnection extends EventEmitter {
  id: string;
  request?: http.ClientRequest;
  connected: boolean;
}

export class SSEService {
  private connections: Map<string, SSEConnection> = new Map();

  /**
   * Connect to an SSE endpoint
   */
  connect(connectionId: string, options: SSEConnectOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const url = new URL(options.url);
        const isHttps = url.protocol === "https:";
        const httpModule = isHttps ? https : http;

        const requestOptions: http.RequestOptions = {
          hostname: url.hostname,
          port: url.port || (isHttps ? 443 : 80),
          path: url.pathname + url.search,
          method: "GET",
          headers: {
            Accept: "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
            ...options.headers,
          },
        };

        const connection: SSEConnection = Object.assign(new EventEmitter(), {
          id: connectionId,
          connected: false,
        });

        const request = httpModule.request(requestOptions, (response) => {
          if (response.statusCode !== 200) {
            const error = new Error(
              `HTTP ${response.statusCode}: ${response.statusMessage}`,
            );
            connection.emit("error", error);
            reject(error);
            return;
          }

          const contentType = response.headers["content-type"] || "";
          if (!contentType.includes("text/event-stream")) {
            const error = new Error("Response is not an event stream");
            connection.emit("error", error);
            reject(error);
            return;
          }

          connection.connected = true;
          connection.request = request;
          this.connections.set(connectionId, connection);

          connection.emit("connected");
          resolve();

          // Parse SSE stream
          let buffer = "";

          response.on("data", (chunk: Buffer) => {
            buffer += chunk.toString();

            // Process complete messages (separated by double newline)
            const messages = buffer.split("\n\n");
            buffer = messages.pop() || "";

            for (const message of messages) {
              if (message.trim()) {
                const event = this.parseSSEMessage(message);
                if (event) {
                  connection.emit("message", event);
                }
              }
            }
          });

          response.on("end", () => {
            connection.connected = false;
            connection.emit("disconnected");
            this.connections.delete(connectionId);
          });

          response.on("error", (error) => {
            connection.connected = false;
            connection.emit("error", error);
            this.connections.delete(connectionId);
          });
        });

        request.on("error", (error) => {
          connection.emit("error", error);
          reject(error);
        });

        request.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Parse an SSE message from raw text
   */
  private parseSSEMessage(raw: string): SSEEvent | null {
    const lines = raw.split("\n");
    let eventType = "message";
    let data = "";
    let id = "";
    let retry: number | undefined;

    for (const line of lines) {
      if (line.startsWith("event:")) {
        eventType = line.slice(6).trim();
      } else if (line.startsWith("data:")) {
        data += line.slice(5).trim() + "\n";
      } else if (line.startsWith("id:")) {
        id = line.slice(3).trim();
      } else if (line.startsWith("retry:")) {
        retry = parseInt(line.slice(6).trim(), 10);
      }
    }

    // Remove trailing newline from data
    data = data.replace(/\n$/, "");

    if (data) {
      return {
        id: id || crypto.randomUUID(),
        event: eventType,
        data,
        timestamp: Date.now(),
        retry,
      };
    }

    return null;
  }

  /**
   * Get a connection by ID
   */
  getConnection(connectionId: string): SSEConnection | undefined {
    return this.connections.get(connectionId);
  }

  /**
   * Disconnect from an SSE endpoint
   */
  disconnect(connectionId: string): Promise<void> {
    return new Promise((resolve) => {
      const connection = this.connections.get(connectionId);

      if (!connection) {
        resolve();
        return;
      }

      if (connection.request) {
        connection.request.destroy();
      }

      connection.connected = false;
      connection.emit("disconnected");
      this.connections.delete(connectionId);
      resolve();
    });
  }

  /**
   * Check connection status
   */
  getStatus(
    connectionId: string,
  ): "connected" | "disconnected" {
    const connection = this.connections.get(connectionId);
    return connection?.connected ? "connected" : "disconnected";
  }

  /**
   * Clean up all connections
   */
  cleanup(): void {
    this.connections.forEach((connection) => {
      if (connection.request) {
        connection.request.destroy();
      }
    });
    this.connections.clear();
  }
}

// Singleton instance
export const sseService = new SSEService();
