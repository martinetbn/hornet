// gRPC Protocol Adapter (using Electron IPC)

import type { GrpcRequest } from "@/types";
import type { ProtocolAdapter, ConnectionStatus } from "./base";

export interface GrpcResponse {
  data: unknown;
  metadata?: Record<string, string>;
  status?: {
    code: number;
    details: string;
  };
  duration: number;
}

export interface GrpcMessage {
  id: string;
  type: "sent" | "received" | "error" | "status";
  data?: unknown;
  error?: { code: number; details: string };
  timestamp: number;
}

export class GrpcAdapter implements ProtocolAdapter<GrpcRequest, GrpcResponse> {
  private currentRequestId?: string;
  private connectionId?: string;
  private status: ConnectionStatus = "disconnected";
  private eventListeners = new Map<string, Set<Function>>();
  private cleanupFunctions: (() => void)[] = [];

  /**
   * Execute a unary gRPC call
   */
  async execute(request: GrpcRequest): Promise<GrpcResponse> {
    const requestId = crypto.randomUUID();
    this.currentRequestId = requestId;

    try {
      if (!request.protoContent) {
        throw new Error("Proto file content is required");
      }

      if (!request.service) {
        throw new Error("Service name is required");
      }

      // Make request via IPC (main process)
      const result = await window.electronAPI.grpc.invoke(requestId, {
        url: request.url,
        protoContent: request.protoContent,
        service: request.service,
        method: request.method,
        data: request.data,
        metadata: request.metadata,
      });

      if (!result.success || !result.response) {
        throw new Error(result.error || "gRPC request failed");
      }

      return result.response;
    } finally {
      this.currentRequestId = undefined;
    }
  }

  /**
   * Start a server-streaming gRPC call
   */
  async startStream(request: GrpcRequest): Promise<void> {
    this.connectionId = crypto.randomUUID();
    this.status = "connecting";
    this.emit("status", this.status);

    try {
      if (!request.protoContent) {
        throw new Error("Proto file content is required");
      }

      if (!request.service) {
        throw new Error("Service name is required");
      }

      const result = await window.electronAPI.grpc.stream(this.connectionId, {
        url: request.url,
        protoContent: request.protoContent,
        service: request.service,
        method: request.method,
        data: request.data,
        metadata: request.metadata,
      });

      if (!result.success) {
        this.status = "error";
        this.emit("status", this.status);
        throw new Error(result.error || "Failed to start gRPC stream");
      }

      // Set up event listeners
      const onData = window.electronAPI.grpc.onData(
        this.connectionId,
        (data: unknown) => {
          const message: GrpcMessage = {
            id: crypto.randomUUID(),
            type: "received",
            data,
            timestamp: Date.now(),
          };
          this.emit("message", message);
        },
      );
      this.cleanupFunctions.push(onData);

      const onEnd = window.electronAPI.grpc.onEnd(this.connectionId, () => {
        this.status = "disconnected";
        this.emit("status", this.status);
        this.emit("end");
      });
      this.cleanupFunctions.push(onEnd);

      const onError = window.electronAPI.grpc.onError(
        this.connectionId,
        (error: { code: number; details: string }) => {
          this.status = "error";
          this.emit("status", this.status);

          const message: GrpcMessage = {
            id: crypto.randomUUID(),
            type: "error",
            error,
            timestamp: Date.now(),
          };
          this.emit("message", message);
          this.emit("error", error);
        },
      );
      this.cleanupFunctions.push(onError);

      const onStatus = window.electronAPI.grpc.onStatus(
        this.connectionId,
        (status: { code: number; details: string }) => {
          const message: GrpcMessage = {
            id: crypto.randomUUID(),
            type: "status",
            data: status,
            timestamp: Date.now(),
          };
          this.emit("message", message);
        },
      );
      this.cleanupFunctions.push(onStatus);

      this.status = "connected";
      this.emit("status", this.status);
      this.emit("connected");
    } catch (error) {
      this.status = "error";
      this.emit("status", this.status);
      this.emit("error", error);
      throw error;
    }
  }

  /**
   * Cancel active request or stream
   */
  cancel(): void {
    if (this.currentRequestId) {
      // For unary calls, there's no cancel mechanism in our current implementation
      this.currentRequestId = undefined;
    }

    if (this.connectionId) {
      // Clean up event listeners
      this.cleanupFunctions.forEach((cleanup) => cleanup());
      this.cleanupFunctions = [];

      window.electronAPI.grpc.cancel(this.connectionId);
      this.connectionId = undefined;
      this.status = "disconnected";
      this.emit("status", this.status);
    }
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

  dispose(): void {
    this.cancel();
    this.eventListeners.clear();
  }
}
