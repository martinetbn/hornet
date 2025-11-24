// Response type definitions

export interface HttpResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: unknown;
  duration: number;
  size: number;
  timestamp: number;
  isSSE?: boolean; // Indicates if this is an SSE endpoint
  sseMessages?: SSEMessage[]; // SSE messages if connected to stream
}

export interface WebSocketMessage {
  id: string;
  type: 'sent' | 'received';
  data: string | ArrayBuffer | Blob;
  timestamp: number;
  format?: 'text' | 'json' | 'xml' | 'html' | 'binary';
  size?: number;
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

export interface SSEEvent {
  id: string;
  event: string;
  data: string;
  timestamp: number;
  retry?: number;
}

export interface SSEMessage {
  id: string;
  type: 'event' | 'error' | 'connected' | 'disconnected';
  event?: SSEEvent;
  error?: string;
  timestamp: number;
}

export type Response = HttpResponse | WebSocketMessage | SocketIOMessage | GrpcResponse;
