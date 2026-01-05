// gRPC service for main process
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import { EventEmitter } from "events";
import fs from "fs/promises";
import path from "path";
import os from "os";

interface GrpcInvokeOptions {
  url: string;
  protoContent: string;
  service: string;
  method: string;
  data: unknown;
  metadata?: Record<string, string>;
  streamType?: "unary" | "server-stream" | "client-stream" | "bidirectional";
}

interface GrpcResponse {
  data: unknown;
  metadata?: Record<string, string>;
  status?: {
    code: number;
    details: string;
  };
  duration: number;
}

interface GrpcStreamConnection extends EventEmitter {
  id: string;
  call?: grpc.ClientReadableStream<unknown> | grpc.ClientDuplexStream<unknown, unknown>;
  client?: grpc.Client;
}

export class GrpcService {
  private streams: Map<string, GrpcStreamConnection> = new Map();

  /**
   * Invoke a unary gRPC method
   */
  async invokeUnary(
    requestId: string,
    options: GrpcInvokeOptions,
  ): Promise<GrpcResponse> {
    const startTime = Date.now();

    try {
      const { client, methodDef } = await this.createClient(options);

      return new Promise((resolve, reject) => {
        // Create metadata
        const metadata = new grpc.Metadata();
        if (options.metadata) {
          Object.entries(options.metadata).forEach(([key, value]) => {
            metadata.add(key, value);
          });
        }

        // Get the method from the client
        const methodName = options.method.charAt(0).toLowerCase() + options.method.slice(1);
        const method = (client as Record<string, Function>)[methodName];

        if (!method) {
          reject(new Error(`Method ${options.method} not found on service ${options.service}`));
          return;
        }

        // Invoke the method
        method.call(
          client,
          options.data,
          metadata,
          (error: grpc.ServiceError | null, response: unknown) => {
            client.close();

            if (error) {
              resolve({
                data: null,
                status: {
                  code: error.code,
                  details: error.details || error.message,
                },
                duration: Date.now() - startTime,
              });
              return;
            }

            resolve({
              data: response,
              duration: Date.now() - startTime,
            });
          },
        );
      });
    } catch (error) {
      return {
        data: null,
        status: {
          code: grpc.status.INTERNAL,
          details: error instanceof Error ? error.message : "Unknown error",
        },
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Start a server-streaming gRPC call
   */
  async startServerStream(
    connectionId: string,
    options: GrpcInvokeOptions,
  ): Promise<void> {
    const { client, methodDef } = await this.createClient(options);

    const connection: GrpcStreamConnection = Object.assign(new EventEmitter(), {
      id: connectionId,
      client,
    });

    // Create metadata
    const metadata = new grpc.Metadata();
    if (options.metadata) {
      Object.entries(options.metadata).forEach(([key, value]) => {
        metadata.add(key, value);
      });
    }

    const methodName = options.method.charAt(0).toLowerCase() + options.method.slice(1);
    const method = (client as Record<string, Function>)[methodName];

    if (!method) {
      throw new Error(`Method ${options.method} not found on service ${options.service}`);
    }

    const call = method.call(client, options.data, metadata) as grpc.ClientReadableStream<unknown>;
    connection.call = call;

    call.on("data", (data: unknown) => {
      connection.emit("data", data);
    });

    call.on("end", () => {
      connection.emit("end");
      this.streams.delete(connectionId);
      client.close();
    });

    call.on("error", (error: grpc.ServiceError) => {
      connection.emit("error", {
        code: error.code,
        details: error.details || error.message,
      });
      this.streams.delete(connectionId);
      client.close();
    });

    call.on("status", (status: grpc.StatusObject) => {
      connection.emit("status", {
        code: status.code,
        details: status.details,
      });
    });

    this.streams.set(connectionId, connection);
  }

  /**
   * Get a stream connection by ID
   */
  getStream(connectionId: string): GrpcStreamConnection | undefined {
    return this.streams.get(connectionId);
  }

  /**
   * Cancel a streaming call
   */
  cancelStream(connectionId: string): void {
    const connection = this.streams.get(connectionId);
    if (connection) {
      if (connection.call) {
        connection.call.cancel();
      }
      if (connection.client) {
        connection.client.close();
      }
      this.streams.delete(connectionId);
    }
  }

  /**
   * Create a gRPC client from proto content
   */
  private async createClient(
    options: GrpcInvokeOptions,
  ): Promise<{ client: grpc.Client; methodDef: unknown }> {
    // Write proto content to a temp file
    const tempDir = os.tmpdir();
    const protoPath = path.join(tempDir, `hornet-${Date.now()}.proto`);

    try {
      await fs.writeFile(protoPath, options.protoContent);

      // Load the proto file
      const packageDef = await protoLoader.load(protoPath, {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
      });

      const protoDescriptor = grpc.loadPackageDefinition(packageDef);

      // Find the service
      const serviceParts = options.service.split(".");
      let serviceConstructor: grpc.ServiceClientConstructor | undefined;

      // Navigate through the package hierarchy
      let current: Record<string, unknown> = protoDescriptor as Record<string, unknown>;
      for (const part of serviceParts) {
        if (current[part]) {
          current = current[part] as Record<string, unknown>;
        }
      }

      // The final part should be the service constructor
      serviceConstructor = current as unknown as grpc.ServiceClientConstructor;

      if (!serviceConstructor || typeof serviceConstructor !== "function") {
        throw new Error(`Service ${options.service} not found in proto file`);
      }

      // Parse the URL
      const url = new URL(
        options.url.startsWith("http") ? options.url : `http://${options.url}`,
      );
      const target = `${url.hostname}:${url.port || 50051}`;

      // Create credentials (support both insecure and SSL)
      const credentials =
        url.protocol === "https:"
          ? grpc.credentials.createSsl()
          : grpc.credentials.createInsecure();

      // Create the client
      const client = new serviceConstructor(target, credentials);

      return { client, methodDef: serviceConstructor };
    } finally {
      // Clean up temp file
      try {
        await fs.unlink(protoPath);
      } catch {
        // Ignore cleanup errors
      }
    }
  }

  /**
   * Clean up all streams
   */
  cleanup(): void {
    this.streams.forEach((connection) => {
      if (connection.call) {
        connection.call.cancel();
      }
      if (connection.client) {
        connection.client.close();
      }
    });
    this.streams.clear();
  }
}

// Singleton instance
export const grpcService = new GrpcService();
