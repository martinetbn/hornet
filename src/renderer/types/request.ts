// Request type definitions

import type { HttpMethod, ProtocolType, KeyValuePair, AuthConfig, BodyType } from './common';

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
  service: string;
  method: string;
  data: unknown;
  streamType: 'unary' | 'server-stream' | 'client-stream' | 'bidirectional';
  metadata?: Record<string, string>;
}

export type Request = HttpRequest | WebSocketConfig | SocketIOConfig | GrpcRequest;
