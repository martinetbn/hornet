// WebSocket Protocol Adapter (using Electron IPC for custom header support)

import type { WebSocketConfig, WebSocketMessage } from "@/types";
import type { ConnectionAdapter, ConnectionStatus } from "./base";

export class WebSocketAdapter
  implements ConnectionAdapter<WebSocketConfig, WebSocketMessage>
{
  private connectionId?: string;
  private status: ConnectionStatus = "disconnected";
  private eventListeners = new Map<string, Set<Function>>();
  private cleanupFunctions: (() => void)[] = [];

  async connect(config: WebSocketConfig): Promise<void> {
    return new Promise(async (resolve, reject) => {
      this.status = "connecting";
      this.emit("status", this.status);

      this.connectionId = config.id;

      // Build URL with query params
      const url = this.buildUrl(config.url, config.params);

      // Convert headers from KeyValuePair to Record
      const headers: Record<string, string> = {};
      config.headers?.forEach((h) => {
        if (h.enabled !== false && h.key && h.value) {
          headers[h.key] = h.value;
        }
      });

      try {
        // Connect via Electron IPC (supports custom headers!)
        const result = await window.electronAPI.websocket.connect(
          this.connectionId,
          {
            url,
            protocols: config.protocols,
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
        const onMessage = window.electronAPI.websocket.onMessage(
          this.connectionId,
          (data: {
            data: string | Buffer;
            isBinary: boolean;
            timestamp: number;
          }) => {
            const {
              data: messageData,
              format,
              size,
            } = this.parseIncomingMessage(data.data);
            const message: WebSocketMessage = {
              id: crypto.randomUUID(),
              type: "received",
              data: messageData,
              timestamp: data.timestamp,
              format,
              size,
            };
            this.emit("message", message);
          },
        );
        this.cleanupFunctions.push(onMessage);

        const onClose = window.electronAPI.websocket.onClose(
          this.connectionId,
          (data: { code: number; reason: string }) => {
            this.status = "disconnected";
            this.emit("status", this.status);
            this.emit("disconnected", { code: data.code, reason: data.reason });
          },
        );
        this.cleanupFunctions.push(onClose);

        const onError = window.electronAPI.websocket.onError(
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
        this.emit("connected");
        resolve();
      } catch (error) {
        this.status = "error";
        this.emit("status", this.status);
        this.emit("error", error);
        reject(error);
      }
    });
  }

  async send(message: WebSocketMessage): Promise<void> {
    if (!this.connectionId) {
      throw new Error("WebSocket is not connected");
    }

    // Handle different message formats
    const dataToSend = this.prepareMessageData(message.data, message.format);

    const result = await window.electronAPI.websocket.send(
      this.connectionId,
      dataToSend,
    );

    if (!result.success) {
      throw new Error(result.error || "Failed to send message");
    }

    const sentMessage: WebSocketMessage = {
      ...message,
      type: "sent",
      timestamp: Date.now(),
      size: this.calculateMessageSize(dataToSend),
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

    await window.electronAPI.websocket.disconnect(this.connectionId);
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

  private buildUrl(
    baseUrl: string,
    params?: Array<{ key: string; value: string; enabled?: boolean }>,
  ): string {
    if (!params || params.length === 0) {
      return baseUrl;
    }

    const enabledParams = params.filter((p) => p.enabled !== false);
    if (enabledParams.length === 0) {
      return baseUrl;
    }

    const url = new URL(baseUrl);
    enabledParams.forEach((param) => {
      url.searchParams.append(param.key, param.value);
    });

    return url.toString();
  }

  private prepareMessageData(
    data: string | ArrayBuffer | Blob,
    format?: string,
  ): string | ArrayBuffer | Blob {
    // If data is already binary, return as-is
    if (data instanceof ArrayBuffer || data instanceof Blob) {
      return data;
    }

    // For text-based formats, return the string
    // The format is mainly for display/syntax highlighting purposes
    return data;
  }

  private parseIncomingMessage(data: string | ArrayBuffer | Blob): {
    data: string | ArrayBuffer | Blob;
    format: "text" | "json" | "xml" | "html" | "binary";
    size: number;
  } {
    // Determine format based on data type and content
    if (data instanceof ArrayBuffer) {
      return {
        data,
        format: "binary",
        size: data.byteLength,
      };
    }

    if (data instanceof Blob) {
      return {
        data,
        format: "binary",
        size: data.size,
      };
    }

    // For string data, try to detect format
    const str = data as string;
    let format: "text" | "json" | "xml" | "html" | "binary" = "text";

    try {
      // Try to parse as JSON
      JSON.parse(str);
      format = "json";
    } catch {
      // Check for XML
      if (
        str.trim().startsWith("<?xml") ||
        (str.trim().startsWith("<") && str.trim().endsWith(">"))
      ) {
        // Could be XML or HTML
        if (
          str.toLowerCase().includes("<!doctype html") ||
          str.toLowerCase().includes("<html")
        ) {
          format = "html";
        } else {
          format = "xml";
        }
      }
    }

    return {
      data: str,
      format,
      size: new Blob([str]).size,
    };
  }

  private calculateMessageSize(data: string | ArrayBuffer | Blob): number {
    if (data instanceof ArrayBuffer) {
      return data.byteLength;
    }
    if (data instanceof Blob) {
      return data.size;
    }
    return new Blob([data]).size;
  }
}
