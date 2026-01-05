import { contextBridge, ipcRenderer } from "electron";

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electronAPI", {
  // Add your API methods here
  platform: process.platform,
  storage: {
    get: (key: string) => ipcRenderer.invoke("storage:get", key),
    set: (key: string, value: unknown) =>
      ipcRenderer.invoke("storage:set", key, value),
    delete: (key: string) => ipcRenderer.invoke("storage:delete", key),
  },

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
    ) => ipcRenderer.invoke("http:request", requestId, options),
    cancel: (requestId: string) => ipcRenderer.invoke("http:cancel", requestId),
  },

  // WebSocket API
  websocket: {
    connect: (
      connectionId: string,
      options: {
        url: string;
        protocols?: string[];
        headers?: Record<string, string>;
      },
    ) => ipcRenderer.invoke("websocket:connect", connectionId, options),
    send: (connectionId: string, data: string | Buffer) =>
      ipcRenderer.invoke("websocket:send", connectionId, data),
    disconnect: (connectionId: string) =>
      ipcRenderer.invoke("websocket:disconnect", connectionId),
    status: (connectionId: string) =>
      ipcRenderer.invoke("websocket:status", connectionId),
    onMessage: (connectionId: string, callback: (data: unknown) => void) => {
      const channel = `websocket:message:${connectionId}`;
      ipcRenderer.on(channel, (_, data) => callback(data));
      return () => ipcRenderer.removeAllListeners(channel);
    },
    onClose: (connectionId: string, callback: (data: unknown) => void) => {
      const channel = `websocket:close:${connectionId}`;
      ipcRenderer.on(channel, (_, data) => callback(data));
      return () => ipcRenderer.removeAllListeners(channel);
    },
    onError: (connectionId: string, callback: (data: unknown) => void) => {
      const channel = `websocket:error:${connectionId}`;
      ipcRenderer.on(channel, (_, data) => callback(data));
      return () => ipcRenderer.removeAllListeners(channel);
    },
  },

  // SSE API
  sse: {
    connect: (
      connectionId: string,
      options: {
        url: string;
        headers?: Record<string, string>;
        withCredentials?: boolean;
      },
    ) => ipcRenderer.invoke("sse:connect", connectionId, options),
    disconnect: (connectionId: string) =>
      ipcRenderer.invoke("sse:disconnect", connectionId),
    status: (connectionId: string) =>
      ipcRenderer.invoke("sse:status", connectionId),
    onMessage: (connectionId: string, callback: (data: unknown) => void) => {
      const channel = `sse:message:${connectionId}`;
      ipcRenderer.on(channel, (_, data) => callback(data));
      return () => ipcRenderer.removeAllListeners(channel);
    },
    onDisconnected: (connectionId: string, callback: () => void) => {
      const channel = `sse:disconnected:${connectionId}`;
      ipcRenderer.on(channel, () => callback());
      return () => ipcRenderer.removeAllListeners(channel);
    },
    onError: (connectionId: string, callback: (data: unknown) => void) => {
      const channel = `sse:error:${connectionId}`;
      ipcRenderer.on(channel, (_, data) => callback(data));
      return () => ipcRenderer.removeAllListeners(channel);
    },
  },

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
    ) => ipcRenderer.invoke("socketio:connect", connectionId, options),
    send: (connectionId: string, event: string, data: unknown[]) =>
      ipcRenderer.invoke("socketio:send", connectionId, event, data),
    disconnect: (connectionId: string) =>
      ipcRenderer.invoke("socketio:disconnect", connectionId),
    status: (connectionId: string) =>
      ipcRenderer.invoke("socketio:status", connectionId),
    onMessage: (connectionId: string, callback: (data: unknown) => void) => {
      const channel = `socketio:message:${connectionId}`;
      ipcRenderer.on(channel, (_, data) => callback(data));
      return () => ipcRenderer.removeAllListeners(channel);
    },
    onDisconnected: (connectionId: string, callback: (data: unknown) => void) => {
      const channel = `socketio:disconnected:${connectionId}`;
      ipcRenderer.on(channel, (_, data) => callback(data));
      return () => ipcRenderer.removeAllListeners(channel);
    },
    onError: (connectionId: string, callback: (data: unknown) => void) => {
      const channel = `socketio:error:${connectionId}`;
      ipcRenderer.on(channel, (_, data) => callback(data));
      return () => ipcRenderer.removeAllListeners(channel);
    },
  },

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
    ) => ipcRenderer.invoke("grpc:invoke", requestId, options),
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
    ) => ipcRenderer.invoke("grpc:stream", connectionId, options),
    cancel: (connectionId: string) =>
      ipcRenderer.invoke("grpc:cancel", connectionId),
    onData: (connectionId: string, callback: (data: unknown) => void) => {
      const channel = `grpc:data:${connectionId}`;
      ipcRenderer.on(channel, (_, data) => callback(data));
      return () => ipcRenderer.removeAllListeners(channel);
    },
    onEnd: (connectionId: string, callback: () => void) => {
      const channel = `grpc:end:${connectionId}`;
      ipcRenderer.on(channel, () => callback());
      return () => ipcRenderer.removeAllListeners(channel);
    },
    onError: (connectionId: string, callback: (data: unknown) => void) => {
      const channel = `grpc:error:${connectionId}`;
      ipcRenderer.on(channel, (_, data) => callback(data));
      return () => ipcRenderer.removeAllListeners(channel);
    },
    onStatus: (connectionId: string, callback: (data: unknown) => void) => {
      const channel = `grpc:status:${connectionId}`;
      ipcRenderer.on(channel, (_, data) => callback(data));
      return () => ipcRenderer.removeAllListeners(channel);
    },
  },
});
