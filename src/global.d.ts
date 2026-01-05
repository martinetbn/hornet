export interface ElectronAPI {
  platform: string;
  storage: {
    get: (key: string) => Promise<unknown>;
    set: (key: string, value: unknown) => Promise<boolean>;
    delete: (key: string) => Promise<boolean>;
  };

  // HTTP API
  http: {
    request: (
      requestId: string,
      options: {
        method: string;
        url: string;
        headers?: Record<string, string>;
        body?: string;
        timeout?: number;
      },
    ) => Promise<{
      success: boolean;
      response?: {
        status: number;
        statusText: string;
        headers: Record<string, string>;
        data: unknown;
        duration: number;
        size: number;
      };
      error?: string;
    }>;
    cancel: (requestId: string) => Promise<{ success: boolean; cancelled?: boolean; error?: string }>;
  };

  // WebSocket API
  websocket: {
    connect: (
      connectionId: string,
      options: {
        url: string;
        protocols?: string[];
        headers?: Record<string, string>;
      },
    ) => Promise<{ success: boolean; error?: string }>;
    send: (
      connectionId: string,
      data: string | Buffer,
    ) => Promise<{ success: boolean; error?: string }>;
    disconnect: (
      connectionId: string,
    ) => Promise<{ success: boolean; error?: string }>;
    status: (
      connectionId: string,
    ) => Promise<{ success: boolean; status?: string; error?: string }>;
    onMessage: (
      connectionId: string,
      callback: (data: {
        data: string | Buffer;
        isBinary: boolean;
        timestamp: number;
      }) => void,
    ) => () => void;
    onClose: (
      connectionId: string,
      callback: (data: { code: number; reason: string }) => void,
    ) => () => void;
    onError: (
      connectionId: string,
      callback: (data: { message: string }) => void,
    ) => () => void;
  };

  // SSE API
  sse: {
    connect: (
      connectionId: string,
      options: {
        url: string;
        headers?: Record<string, string>;
        withCredentials?: boolean;
      },
    ) => Promise<{ success: boolean; error?: string }>;
    disconnect: (
      connectionId: string,
    ) => Promise<{ success: boolean; error?: string }>;
    status: (
      connectionId: string,
    ) => Promise<{ success: boolean; status?: string; error?: string }>;
    onMessage: (
      connectionId: string,
      callback: (data: {
        id: string;
        event: string;
        data: string;
        timestamp: number;
        retry?: number;
      }) => void,
    ) => () => void;
    onDisconnected: (connectionId: string, callback: () => void) => () => void;
    onError: (
      connectionId: string,
      callback: (data: { message: string }) => void,
    ) => () => void;
  };

  // Socket.IO API
  socketio: {
    connect: (
      connectionId: string,
      options: {
        url: string;
        path?: string;
        auth?: Record<string, unknown>;
        transports?: ("websocket" | "polling")[];
        query?: Record<string, string>;
        headers?: Record<string, string>;
      },
    ) => Promise<{ success: boolean; socketId?: string; error?: string }>;
    send: (
      connectionId: string,
      event: string,
      data: unknown[],
    ) => Promise<{ success: boolean; error?: string }>;
    disconnect: (
      connectionId: string,
    ) => Promise<{ success: boolean; error?: string }>;
    status: (
      connectionId: string,
    ) => Promise<{ success: boolean; status?: string; error?: string }>;
    onMessage: (
      connectionId: string,
      callback: (data: {
        event: string;
        data: unknown[];
        timestamp: number;
      }) => void,
    ) => () => void;
    onDisconnected: (
      connectionId: string,
      callback: (data: { reason: string }) => void,
    ) => () => void;
    onError: (
      connectionId: string,
      callback: (data: { message: string }) => void,
    ) => () => void;
  };

  // gRPC API
  grpc: {
    invoke: (
      requestId: string,
      options: {
        url: string;
        protoContent: string;
        service: string;
        method: string;
        data: unknown;
        metadata?: Record<string, string>;
      },
    ) => Promise<{
      success: boolean;
      response?: {
        data: unknown;
        metadata?: Record<string, string>;
        status?: {
          code: number;
          details: string;
        };
        duration: number;
      };
      error?: string;
    }>;
    stream: (
      connectionId: string,
      options: {
        url: string;
        protoContent: string;
        service: string;
        method: string;
        data: unknown;
        metadata?: Record<string, string>;
      },
    ) => Promise<{ success: boolean; error?: string }>;
    cancel: (connectionId: string) => Promise<{ success: boolean; error?: string }>;
    onData: (connectionId: string, callback: (data: unknown) => void) => () => void;
    onEnd: (connectionId: string, callback: () => void) => () => void;
    onError: (
      connectionId: string,
      callback: (data: { code: number; details: string }) => void,
    ) => () => void;
    onStatus: (
      connectionId: string,
      callback: (data: { code: number; details: string }) => void,
    ) => () => void;
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
