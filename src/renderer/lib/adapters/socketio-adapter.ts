// Socket.IO Protocol Adapter (using Electron IPC for CORS bypass)

import type { SocketIOConfig, SocketIOMessage } from "@/types";
import type { ConnectionAdapter, ConnectionStatus } from "./base";

export class SocketIOAdapter
  implements ConnectionAdapter<SocketIOConfig, SocketIOMessage>
{
  private connectionId?: string;
  private status: ConnectionStatus = "disconnected";
  private eventListeners = new Map<string, Set<Function>>();
  private cleanupFunctions: (() => void)[] = [];

  async connect(config: SocketIOConfig): Promise<void> {
    return new Promise(async (resolve, reject) => {
      this.status = "connecting";
      this.emit("status", this.status);

      this.connectionId = config.id;

      // Convert KeyValuePair[] to Record<string, string> for query params
      const queryParams = config.query?.reduce(
        (acc, { key, value, enabled }) => {
          if (enabled && key) {
            acc[key] = value;
          }
          return acc;
        },
        {} as Record<string, string>,
      );

      // Convert KeyValuePair[] to Record<string, string> for headers
      const headers = config.headers?.reduce(
        (acc, { key, value, enabled }) => {
          if (enabled && key) {
            acc[key] = value;
          }
          return acc;
        },
        {} as Record<string, string>,
      );

      try {
        // Connect via Electron IPC (main process - no CORS restrictions)
        const result = await window.electronAPI.socketio.connect(
          this.connectionId,
          {
            url: config.url,
            path: config.path || "/socket.io",
            auth: config.auth,
            transports: config.transports || ["websocket", "polling"],
            query: queryParams,
            headers,
          },
        );

        if (!result.success) {
          this.status = "error";
          this.emit("status", this.status);
          this.emit("error", new Error(result.error || "Connection failed"));
          reject(new Error(result.error || "Connection failed"));
          return;
        }

        // Set up event listeners
        const onMessage = window.electronAPI.socketio.onMessage(
          this.connectionId,
          (data: { event: string; data: unknown[]; timestamp: number }) => {
            const message: SocketIOMessage = {
              id: crypto.randomUUID(),
              type: "received",
              event: data.event,
              data: data.data,
              timestamp: data.timestamp,
            };
            this.emit("message", message);
          },
        );
        this.cleanupFunctions.push(onMessage);

        const onDisconnected = window.electronAPI.socketio.onDisconnected(
          this.connectionId,
          (data: { reason: string }) => {
            this.status = "disconnected";
            this.emit("status", this.status);
            this.emit("disconnected", { reason: data.reason });
          },
        );
        this.cleanupFunctions.push(onDisconnected);

        const onError = window.electronAPI.socketio.onError(
          this.connectionId,
          (data: { message: string }) => {
            this.status = "error";
            this.emit("status", this.status);
            this.emit("error", new Error(data.message));
          },
        );
        this.cleanupFunctions.push(onError);

        this.status = "connected";
        this.emit("status", this.status);
        this.emit("connected", { id: result.socketId });
        resolve();
      } catch (error) {
        this.status = "error";
        this.emit("status", this.status);
        this.emit("error", error);
        reject(error);
      }
    });
  }

  async send(message: SocketIOMessage): Promise<void> {
    if (!this.connectionId) {
      throw new Error("Socket.IO is not connected");
    }

    const result = await window.electronAPI.socketio.send(
      this.connectionId,
      message.event,
      message.data,
    );

    if (!result.success) {
      throw new Error(result.error || "Failed to send message");
    }

    const sentMessage: SocketIOMessage = {
      ...message,
      type: "sent",
      timestamp: Date.now(),
    };
    this.emit("message", sentMessage);
  }

  async disconnect(): Promise<void> {
    if (!this.connectionId) return;

    this.status = "disconnecting";
    this.emit("status", this.status);

    // Clean up event listeners
    this.cleanupFunctions.forEach((cleanup) => cleanup());
    this.cleanupFunctions = [];

    await window.electronAPI.socketio.disconnect(this.connectionId);
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
