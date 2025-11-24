// Request type definitions

import type { HttpMethod, ProtocolType, KeyValuePair, AuthConfig, BodyType, WebSocketMessageFormat } from './common';

export interface BaseRequest {
  id: string;
  name: string;
  description?: string;
  protocol: ProtocolType;
  createdAt: number;
  updatedAt: number;
}

export interface HttpRequest extends BaseRequest {
  protocol: 'http';
  method: HttpMethod;
  url: string;
  headers?: KeyValuePair[];
  params?: KeyValuePair[];
  body?: {
    type: BodyType;
    content: string;
  };
  auth?: AuthConfig;
  timeout?: number;
}

export interface WebSocketConfig extends BaseRequest {
  protocol: 'websocket';
  url: string;
  protocols?: string[];
  headers?: KeyValuePair[];
  params?: KeyValuePair[];
  // Draft message to be sent
  draftMessage?: {
    format: WebSocketMessageFormat;
    content: string;
  };
}

export interface SSEConfig extends BaseRequest {
  protocol: 'sse';
  url: string;
  headers?: KeyValuePair[];
}

export interface SocketIOConfig extends BaseRequest {
  protocol: 'socketio';
  url: string;
  auth?: Record<string, unknown>;
  query?: Record<string, string>;
  transports?: ('websocket' | 'polling')[];
}

export interface GrpcRequest extends BaseRequest {
  protocol: 'grpc';
  url: string;
  protoFile: string;
  protoContent?: string; // Store the actual proto file content for parsing
  method: string;
  data: unknown;
  metadata?: Record<string, string>;
  // Internal fields - auto-detected from proto file
  service?: string;
  streamType?: 'unary' | 'server-stream' | 'client-stream' | 'bidirectional';
}

export type Request = HttpRequest | WebSocketConfig | SSEConfig | SocketIOConfig | GrpcRequest;
