# Protocol Adapters

## Overview

Protocol adapters abstract the implementation details of different API protocols (HTTP, WebSocket, Socket.IO, SSE, gRPC) behind a common interface. This allows the application to work with any protocol without knowing implementation specifics.

## Adapter Pattern

### Base Interface

All adapters implement a common interface:

```typescript
// src/renderer/lib/adapters/base.ts

export interface ProtocolAdapter<TConfig, TResponse> {
  /**
   * Execute a request with the given configuration
   */
  execute(config: TConfig): Promise<TResponse>;

  /**
   * Cancel an in-flight request (if supported)
   */
  cancel?(): void;

  /**
   * Clean up resources
   */
  dispose?(): void;
}

export interface ConnectionAdapter<TConfig, TMessage> {
  /**
   * Establish a connection
   */
  connect(config: TConfig): Promise<void>;

  /**
   * Send a message over the connection
   */
  send(message: TMessage): Promise<void>;

  /**
   * Disconnect and clean up
   */
  disconnect(): Promise<void>;

  /**
   * Subscribe to connection events
   */
  on(event: string, callback: (data: any) => void): void;

  /**
   * Unsubscribe from connection events
   */
  off(event: string, callback: (data: any) => void): void;

  /**
   * Get current connection status
   */
  getStatus(): ConnectionStatus;
}

export type ConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "disconnecting"
  | "error";
```

## HTTP Adapter

### Implementation

```typescript
// src/renderer/lib/adapters/http-adapter.ts

import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  CancelTokenSource,
} from "axios";
import { HttpRequest, HttpResponse } from "@/types";

export class HttpAdapter implements ProtocolAdapter<HttpRequest, HttpResponse> {
  private client: AxiosInstance;
  private cancelToken?: CancelTokenSource;

  constructor() {
    this.client = axios.create({
      timeout: 30000,
      validateStatus: () => true, // Don't throw on any status code
    });
  }

  async execute(request: HttpRequest): Promise<HttpResponse> {
    this.cancelToken = axios.CancelToken.source();

    const startTime = Date.now();

    try {
      const config: AxiosRequestConfig = {
        method: request.method,
        url: request.url,
        headers: request.headers,
        params: request.params,
        data: request.body,
        cancelToken: this.cancelToken.token,
      };

      const response = await this.client.request(config);
      const endTime = Date.now();

      return {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data,
        duration: endTime - startTime,
        size: JSON.stringify(response.data).length,
      };
    } catch (error) {
      if (axios.isCancel(error)) {
        throw new Error("Request cancelled");
      }

      const endTime = Date.now();
      throw {
        message: error.message,
        duration: endTime - startTime,
      };
    }
  }

  cancel(): void {
    this.cancelToken?.cancel("Request cancelled by user");
  }

  dispose(): void {
    this.cancel();
  }
}
```

### Usage

```typescript
import { HttpAdapter } from "@/lib/adapters/http-adapter";

const adapter = new HttpAdapter();

const response = await adapter.execute({
  method: "POST",
  url: "https://api.example.com/users",
  headers: { "Content-Type": "application/json" },
  body: { name: "John" },
});

console.log(response.status, response.data);
```

## WebSocket Adapter

### Implementation

```typescript
// src/renderer/lib/adapters/websocket-adapter.ts

import { WebSocketConfig, WebSocketMessage } from "@/types";
import { ConnectionAdapter, ConnectionStatus } from "./base";

export class WebSocketAdapter
  implements ConnectionAdapter<WebSocketConfig, WebSocketMessage>
{
  private ws?: WebSocket;
  private status: ConnectionStatus = "disconnected";
  private eventListeners = new Map<string, Set<Function>>();

  async connect(config: WebSocketConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      this.status = "connecting";
      this.emit("status", this.status);

      this.ws = new WebSocket(config.url, config.protocols);

      this.ws.onopen = () => {
        this.status = "connected";
        this.emit("status", this.status);
        this.emit("connected");
        resolve();
      };

      this.ws.onmessage = (event) => {
        const message: WebSocketMessage = {
          id: crypto.randomUUID(),
          type: "received",
          data: event.data,
          timestamp: Date.now(),
        };
        this.emit("message", message);
      };

      this.ws.onerror = (error) => {
        this.status = "error";
        this.emit("status", this.status);
        this.emit("error", error);
        reject(error);
      };

      this.ws.onclose = (event) => {
        this.status = "disconnected";
        this.emit("status", this.status);
        this.emit("disconnected", { code: event.code, reason: event.reason });
      };
    });
  }

  async send(message: WebSocketMessage): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket is not connected");
    }

    this.ws.send(message.data);

    const sentMessage: WebSocketMessage = {
      ...message,
      type: "sent",
      timestamp: Date.now(),
    };
    this.emit("message", sentMessage);
  }

  async disconnect(): Promise<void> {
    if (!this.ws) return;

    this.status = "disconnecting";
    this.emit("status", this.status);

    this.ws.close();
    this.ws = undefined;
  }

  on(event: string, callback: (data: any) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  off(event: string, callback: (data: any) => void): void {
    this.eventListeners.get(event)?.delete(callback);
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }

  private emit(event: string, data?: any): void {
    this.eventListeners.get(event)?.forEach((callback) => callback(data));
  }
}
```

### Usage

```typescript
const adapter = new WebSocketAdapter();

adapter.on("message", (message) => {
  console.log("Received:", message);
});

await adapter.connect({ url: "wss://echo.websocket.org" });

await adapter.send({
  id: crypto.randomUUID(),
  type: "sent",
  data: "Hello WebSocket!",
  timestamp: Date.now(),
});

await adapter.disconnect();
```

## Socket.IO Adapter

### Implementation

```typescript
// src/renderer/lib/adapters/socketio-adapter.ts

import { io, Socket } from "socket.io-client";
import { SocketIOConfig, SocketIOMessage } from "@/types";
import { ConnectionAdapter, ConnectionStatus } from "./base";

export class SocketIOAdapter
  implements ConnectionAdapter<SocketIOConfig, SocketIOMessage>
{
  private socket?: Socket;
  private status: ConnectionStatus = "disconnected";
  private eventListeners = new Map<string, Set<Function>>();

  async connect(config: SocketIOConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      this.status = "connecting";
      this.emit("status", this.status);

      this.socket = io(config.url, {
        auth: config.auth,
        transports: config.transports || ["websocket", "polling"],
        query: config.query,
      });

      this.socket.on("connect", () => {
        this.status = "connected";
        this.emit("status", this.status);
        this.emit("connected", { id: this.socket!.id });
        resolve();
      });

      this.socket.on("disconnect", (reason) => {
        this.status = "disconnected";
        this.emit("status", this.status);
        this.emit("disconnected", { reason });
      });

      this.socket.on("connect_error", (error) => {
        this.status = "error";
        this.emit("status", this.status);
        this.emit("error", error);
        reject(error);
      });

      // Listen to all events
      this.socket.onAny((event, ...args) => {
        const message: SocketIOMessage = {
          id: crypto.randomUUID(),
          type: "received",
          event,
          data: args,
          timestamp: Date.now(),
        };
        this.emit("message", message);
      });
    });
  }

  async send(message: SocketIOMessage): Promise<void> {
    if (!this.socket?.connected) {
      throw new Error("Socket.IO is not connected");
    }

    this.socket.emit(message.event, ...message.data);

    const sentMessage: SocketIOMessage = {
      ...message,
      type: "sent",
      timestamp: Date.now(),
    };
    this.emit("message", sentMessage);
  }

  async disconnect(): Promise<void> {
    if (!this.socket) return;

    this.status = "disconnecting";
    this.emit("status", this.status);

    this.socket.disconnect();
    this.socket = undefined;
  }

  on(event: string, callback: (data: any) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  off(event: string, callback: (data: any) => void): void {
    this.eventListeners.get(event)?.delete(callback);
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }

  private emit(event: string, data?: any): void {
    this.eventListeners.get(event)?.forEach((callback) => callback(data));
  }
}
```

## SSE Adapter

### Implementation

```typescript
// src/renderer/lib/adapters/sse-adapter.ts

import type { SSEConfig, SSEMessage, SSEEvent } from "@/types";
import type { ConnectionAdapter, ConnectionStatus } from "./base";

export class SSEAdapter implements ConnectionAdapter<SSEConfig, never> {
  private eventSource?: EventSource;
  private status: ConnectionStatus = "disconnected";
  private eventListeners = new Map<string, Set<Function>>();
  private registeredEventTypes = new Set<string>();

  async connect(config: SSEConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      this.status = "connecting";
      this.emit("status", this.status);

      try {
        const url = this.buildUrl(config);
        this.eventSource = new EventSource(url, {
          withCredentials: config.withCredentials ?? false,
        });

        this.eventSource.onopen = () => {
          this.status = "connected";
          this.emit("status", this.status);
          this.emit("connected");
          resolve();
        };

        this.eventSource.onmessage = (event) => {
          this.handleMessage("message", event);
        };

        this.eventSource.onerror = (error) => {
          const wasConnected = this.status === "connected";
          this.status = "error";
          this.emit("status", this.status);
          this.emit("error", error);

          if (!wasConnected) {
            reject(new Error("Failed to connect to SSE endpoint"));
          }
        };
      } catch (error) {
        this.status = "error";
        this.emit("status", this.status);
        reject(error);
      }
    });
  }

  /**
   * Register a listener for a specific SSE event type
   */
  public listenToEvent(eventType: string): void {
    if (!this.eventSource || this.registeredEventTypes.has(eventType)) {
      return;
    }

    this.registeredEventTypes.add(eventType);
    this.eventSource.addEventListener(eventType, (event) => {
      this.handleMessage(eventType, event as MessageEvent);
    });
  }

  private handleMessage(eventType: string, event: MessageEvent): void {
    const sseEvent: SSEEvent = {
      id: event.lastEventId || crypto.randomUUID(),
      event: eventType,
      data: event.data,
      timestamp: Date.now(),
    };

    const message: SSEMessage = {
      id: crypto.randomUUID(),
      type: "event",
      event: sseEvent,
      timestamp: Date.now(),
    };

    this.emit("message", message);
  }

  async send(_message: never): Promise<void> {
    throw new Error(
      "SSE is unidirectional. Use HTTP requests to send data to the server.",
    );
  }

  async disconnect(): Promise<void> {
    if (!this.eventSource) return;

    this.status = "disconnecting";
    this.emit("status", this.status);

    this.eventSource.close();
    this.eventSource = undefined;
    this.registeredEventTypes.clear();

    this.status = "disconnected";
    this.emit("status", this.status);
    this.emit("disconnected");
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
```

### Usage

```typescript
const adapter = new SSEAdapter();

adapter.on("message", (message) => {
  console.log("Received:", message);
});

await adapter.connect({
  url: "https://api.example.com/events",
  withCredentials: false,
});

// Listen for custom event types
adapter.listenToEvent("notification");
adapter.listenToEvent("update");

await adapter.disconnect();
```

### Key Features

- **Automatic Reconnection**: Browser's EventSource API handles reconnection automatically
- **Custom Events**: Support for registering listeners for specific SSE event types
- **Unidirectional**: Server-to-client only (cannot send messages)
- **Status Management**: Tracks connection status (connecting, connected, error, disconnected)

### Limitations

1. Only supports GET requests (EventSource limitation)
2. Custom headers are sent as query parameters
3. Cannot send messages to server (unidirectional only)
4. Browser connection limits apply (typically 6 per domain)

## gRPC Adapter

### Implementation

```typescript
// src/renderer/lib/adapters/grpc-adapter.ts

import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import { GrpcRequest, GrpcResponse } from "@/types";

export class GrpcAdapter implements ProtocolAdapter<GrpcRequest, GrpcResponse> {
  private client?: grpc.Client;
  private call?: grpc.ClientUnaryCall | grpc.ClientReadableStream<any>;

  async execute(request: GrpcRequest): Promise<GrpcResponse> {
    const startTime = Date.now();

    try {
      // Load proto file
      const packageDefinition = await protoLoader.load(request.protoFile, {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
      });

      const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);

      // Get service constructor
      const ServiceClient = this.getServiceClient(
        protoDescriptor,
        request.service,
      );

      // Create client
      this.client = new ServiceClient(
        request.url,
        grpc.credentials.createInsecure(),
      );

      // Make request based on type
      const response = await this.makeRequest(request);
      const endTime = Date.now();

      return {
        data: response,
        duration: endTime - startTime,
        metadata: {},
      };
    } catch (error) {
      const endTime = Date.now();
      throw {
        message: error.message,
        duration: endTime - startTime,
        code: error.code,
      };
    }
  }

  private async makeRequest(request: GrpcRequest): Promise<any> {
    return new Promise((resolve, reject) => {
      const method = this.client![request.method];

      if (request.streamType === "unary") {
        this.call = method.call(
          this.client,
          request.data,
          (error: any, response: any) => {
            if (error) {
              reject(error);
            } else {
              resolve(response);
            }
          },
        );
      } else if (request.streamType === "server-stream") {
        const messages: any[] = [];
        this.call = method.call(this.client, request.data);

        (this.call as grpc.ClientReadableStream<any>).on("data", (chunk) => {
          messages.push(chunk);
        });

        (this.call as grpc.ClientReadableStream<any>).on("end", () => {
          resolve(messages);
        });

        (this.call as grpc.ClientReadableStream<any>).on("error", (error) => {
          reject(error);
        });
      }
    });
  }

  private getServiceClient(protoDescriptor: any, servicePath: string): any {
    const parts = servicePath.split(".");
    let current = protoDescriptor;

    for (const part of parts) {
      current = current[part];
      if (!current) {
        throw new Error(`Service not found: ${servicePath}`);
      }
    }

    return current;
  }

  cancel(): void {
    this.call?.cancel();
  }

  dispose(): void {
    this.cancel();
    this.client?.close();
  }
}
```

## Adapter Factory

```typescript
// src/renderer/lib/adapters/index.ts

import { ProtocolType } from "@/types";
import { HttpAdapter } from "./http-adapter";
import { WebSocketAdapter } from "./websocket-adapter";
import { SocketIOAdapter } from "./socketio-adapter";
import { SSEAdapter } from "./sse-adapter";
import { GrpcAdapter } from "./grpc-adapter";

export function createAdapter(protocol: ProtocolType) {
  switch (protocol) {
    case "http":
      return new HttpAdapter();
    case "websocket":
      return new WebSocketAdapter();
    case "socketio":
      return new SocketIOAdapter();
    case "sse":
      return new SSEAdapter();
    case "grpc":
      return new GrpcAdapter();
    default:
      throw new Error(`Unknown protocol: ${protocol}`);
  }
}

export * from "./base";
export * from "./http-adapter";
export * from "./websocket-adapter";
export * from "./socketio-adapter";
export * from "./sse-adapter";
export * from "./grpc-adapter";
```

## Testing Adapters

### HTTP Adapter Tests

```typescript
import { describe, it, expect, vi } from "vitest";
import { HttpAdapter } from "./http-adapter";

describe("HttpAdapter", () => {
  it("should make GET request", async () => {
    const adapter = new HttpAdapter();

    const response = await adapter.execute({
      method: "GET",
      url: "https://jsonplaceholder.typicode.com/posts/1",
      headers: {},
    });

    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty("id", 1);
  });

  it("should cancel request", async () => {
    const adapter = new HttpAdapter();

    const promise = adapter.execute({
      method: "GET",
      url: "https://httpbin.org/delay/5",
      headers: {},
    });

    setTimeout(() => adapter.cancel(), 100);

    await expect(promise).rejects.toThrow("Request cancelled");
  });
});
```

### WebSocket Adapter Tests

```typescript
describe("WebSocketAdapter", () => {
  it("should connect and disconnect", async () => {
    const adapter = new WebSocketAdapter();

    await adapter.connect({ url: "wss://echo.websocket.org" });
    expect(adapter.getStatus()).toBe("connected");

    await adapter.disconnect();
    expect(adapter.getStatus()).toBe("disconnected");
  });

  it("should send and receive messages", async () => {
    const adapter = new WebSocketAdapter();
    const messages: any[] = [];

    adapter.on("message", (msg) => messages.push(msg));

    await adapter.connect({ url: "wss://echo.websocket.org" });

    await adapter.send({
      id: "1",
      type: "sent",
      data: "test",
      timestamp: Date.now(),
    });

    await new Promise((resolve) => setTimeout(resolve, 1000));

    expect(messages).toHaveLength(2); // sent + received
    expect(messages[1].type).toBe("received");
  });
});
```

### SSE Adapter Tests

```typescript
describe("SSEAdapter", () => {
  it("should connect and disconnect", async () => {
    const adapter = new SSEAdapter();

    await adapter.connect({
      url: "https://api.example.com/events",
      protocol: "sse",
      id: "1",
      name: "Test SSE",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    expect(adapter.getStatus()).toBe("connected");

    await adapter.disconnect();
    expect(adapter.getStatus()).toBe("disconnected");
  });

  it("should receive messages", async () => {
    const adapter = new SSEAdapter();
    const messages: any[] = [];

    adapter.on("message", (msg) => messages.push(msg));

    await adapter.connect({
      url: "https://api.example.com/events",
      protocol: "sse",
      id: "1",
      name: "Test SSE",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Wait for events
    await new Promise((resolve) => setTimeout(resolve, 2000));

    expect(messages.length).toBeGreaterThan(0);
    expect(messages[0].type).toBe("event");
  });

  it("should handle custom event types", async () => {
    const adapter = new SSEAdapter();
    const messages: any[] = [];

    adapter.on("message", (msg) => messages.push(msg));

    await adapter.connect({
      url: "https://api.example.com/events",
      protocol: "sse",
      id: "1",
      name: "Test SSE",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    adapter.listenToEvent("notification");
    adapter.listenToEvent("update");

    await new Promise((resolve) => setTimeout(resolve, 2000));

    const customEvents = messages.filter(
      (m) => m.event?.event === "notification" || m.event?.event === "update",
    );
    expect(customEvents.length).toBeGreaterThan(0);
  });

  it("should throw error on send attempt", async () => {
    const adapter = new SSEAdapter();

    await adapter.connect({
      url: "https://api.example.com/events",
      protocol: "sse",
      id: "1",
      name: "Test SSE",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await expect(adapter.send(null as never)).rejects.toThrow(
      "SSE is unidirectional",
    );
  });
});
```

## Best Practices

### 1. Error Handling

Always handle errors gracefully and provide useful error messages:

```typescript
try {
  const response = await adapter.execute(request);
} catch (error) {
  if (error.code === "ECONNREFUSED") {
    throw new Error("Connection refused. Is the server running?");
  }
  throw error;
}
```

### 2. Resource Cleanup

Always clean up resources to prevent memory leaks:

```typescript
useEffect(() => {
  const adapter = new WebSocketAdapter();
  adapter.connect(config);

  return () => {
    adapter.disconnect();
  };
}, [config]);
```

### 3. Type Safety

Use TypeScript generics for type-safe adapters:

```typescript
interface Adapter<TRequest, TResponse> {
  execute(request: TRequest): Promise<TResponse>;
}
```

### 4. Cancellation

Support cancellation for long-running requests:

```typescript
const adapter = new HttpAdapter();
const promise = adapter.execute(request);

// Later...
adapter.cancel();
```

### 5. Event Emitters

Use standard event patterns for consistency:

```typescript
adapter.on("event", callback);
adapter.off("event", callback);
adapter.emit("event", data);
```

## Adding a New Protocol

1. **Create adapter file**: `src/renderer/lib/adapters/new-protocol-adapter.ts`

2. **Implement interface**:

```typescript
export class NewProtocolAdapter implements ProtocolAdapter<Config, Response> {
  async execute(config: Config): Promise<Response> {
    // Implementation
  }
}
```

3. **Add to factory**: Update `src/renderer/lib/adapters/index.ts`

4. **Add types**: Update `src/renderer/types/protocol.ts`

5. **Add UI support**: Create request builder components

6. **Add tests**: Write unit and integration tests

7. **Document**: Update this file with usage examples
