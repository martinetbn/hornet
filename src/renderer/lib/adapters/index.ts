// Protocol adapter factory and exports

import type { ProtocolType } from "@/types";
import { HttpAdapter } from "./http-adapter";
import { WebSocketAdapter } from "./websocket-adapter";
import { SocketIOAdapter } from "./socketio-adapter";
import { SSEAdapter } from "./sse-adapter";

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
      throw new Error("gRPC adapter not yet implemented");
    default:
      throw new Error(`Unknown protocol: ${protocol}`);
  }
}

export * from "./base";
export * from "./http-adapter";
export * from "./websocket-adapter";
export * from "./socketio-adapter";
export * from "./sse-adapter";
