// Server-Sent Events (SSE) Protocol Adapter (using Electron IPC for CORS bypass)

import type { SSEConfig, SSEMessage, SSEEvent } from "@/types";
import type { ConnectionAdapter, ConnectionStatus } from "./base";

export class SSEAdapter implements ConnectionAdapter<SSEConfig, never> {
  private connectionId?: string;
  private status: ConnectionStatus = "disconnected";
  private eventListeners = new Map<string, Set<Function>>();
  private cleanupFunctions: (() => void)[] = [];

  async connect(config: SSEConfig): Promise<void> {
    return new Promise(async (resolve, reject) => {
      this.status = "connecting";
      this.emit("status", this.status);

      this.connectionId = config.id;

      // Convert headers from KeyValuePair to Record
      const headers: Record<string, string> = {};
      config.headers?.forEach((h) => {
        if (h.enabled !== false && h.key && h.value) {
          headers[h.key] = h.value;
        }
      });

      try {
        // Connect via Electron IPC (main process - no CORS restrictions)
        const result = await window.electronAPI.sse.connect(this.connectionId, {
          url: config.url,
          headers,
        });

        if (!result.success) {
          this.status = "error";
          this.emit("status", this.status);
          this.emit("error", new Error(result.error || "Connection failed"));
          reject(new Error(result.error || "Connection failed"));
          return;
        }

        // Set up event listeners
        const onMessage = window.electronAPI.sse.onMessage(
          this.connectionId,
          (data: {
            id: string;
            event: string;
            data: string;
            timestamp: number;
            retry?: number;
          }) => {
            const sseEvent: SSEEvent = {
              id: data.id,
              event: data.event,
              data: data.data,
              timestamp: data.timestamp,
              retry: data.retry,
            };

            const message: SSEMessage = {
              id: crypto.randomUUID(),
              type: "event",
              event: sseEvent,
              timestamp: Date.now(),
            };

            this.emit("message", message);
          },
        );
        this.cleanupFunctions.push(onMessage);

        const onDisconnected = window.electronAPI.sse.onDisconnected(
          this.connectionId,
          () => {
            this.status = "disconnected";
            this.emit("status", this.status);

            const message: SSEMessage = {
              id: crypto.randomUUID(),
              type: "disconnected",
              timestamp: Date.now(),
            };
            this.emit("message", message);
            this.emit("disconnected");
          },
        );
        this.cleanupFunctions.push(onDisconnected);

        const onError = window.electronAPI.sse.onError(
          this.connectionId,
          (data: { message: string }) => {
            this.status = "error";
            this.emit("status", this.status);

            const message: SSEMessage = {
              id: crypto.randomUUID(),
              type: "error",
              error: data.message,
              timestamp: Date.now(),
            };
            this.emit("message", message);
            this.emit("error", new Error(data.message));
          },
        );
        this.cleanupFunctions.push(onError);

        this.status = "connected";
        this.emit("status", this.status);

        const connectedMessage: SSEMessage = {
          id: crypto.randomUUID(),
          type: "connected",
          timestamp: Date.now(),
        };
        this.emit("message", connectedMessage);
        this.emit("connected");
        resolve();
      } catch (error) {
        this.status = "error";
        this.emit("status", this.status);

        const errorMessage: SSEMessage = {
          id: crypto.randomUUID(),
          type: "error",
          error:
            error instanceof Error
              ? error.message
              : "Failed to establish connection",
          timestamp: Date.now(),
        };
        this.emit("message", errorMessage);
        this.emit("error", error);
        reject(error);
      }
    });
  }

  /**
   * Register a listener for a specific SSE event type
   * Note: All events are automatically captured via IPC
   */
  public listenToEvent(eventType: string): void {
    // No-op with IPC implementation - all events are captured automatically
    // Kept for API compatibility
  }

  async send(_message: never): Promise<void> {
    // SSE is unidirectional (server -> client only)
    // Client cannot send messages over SSE
    throw new Error(
      "SSE is unidirectional. Use HTTP requests to send data to the server.",
    );
  }

  async disconnect(): Promise<void> {
    if (!this.connectionId) return;

    this.status = "disconnecting";
    this.emit("status", this.status);

    // Clean up event listeners
    this.cleanupFunctions.forEach((cleanup) => cleanup());
    this.cleanupFunctions = [];

    await window.electronAPI.sse.disconnect(this.connectionId);

    this.status = "disconnected";
    this.emit("status", this.status);

    const message: SSEMessage = {
      id: crypto.randomUUID(),
      type: "disconnected",
      timestamp: Date.now(),
    };
    this.emit("message", message);
    this.emit("disconnected");

    this.connectionId = undefined;
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
