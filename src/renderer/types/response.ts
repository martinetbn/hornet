// Response type definitions

export interface HttpResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: unknown;
  duration: number;
  size: number;
  timestamp: number;
}

export interface WebSocketMessage {
  id: string;
  type: 'sent' | 'received';
  data: string | ArrayBuffer | Blob;
  timestamp: number;
}

export interface SocketIOMessage {
  id: string;
  type: 'sent' | 'received';
  event: string;
  data: unknown[];
  timestamp: number;
}

export interface GrpcResponse {
  data: unknown;
  duration: number;
  metadata: Record<string, unknown>;
  timestamp: number;
}

export type Response = HttpResponse | WebSocketMessage | SocketIOMessage | GrpcResponse;
