import { contextBridge, ipcRenderer } from "electron";

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electronAPI", {
  // Add your API methods here
  platform: process.platform,
  storage: {
    get: (key: string) => ipcRenderer.invoke("storage:get", key),
    set: (key: string, value: any) =>
      ipcRenderer.invoke("storage:set", key, value),
    delete: (key: string) => ipcRenderer.invoke("storage:delete", key),
  },
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
    onMessage: (connectionId: string, callback: (data: any) => void) => {
      const channel = `websocket:message:${connectionId}`;
      ipcRenderer.on(channel, (_, data) => callback(data));
      return () => ipcRenderer.removeAllListeners(channel);
    },
    onClose: (connectionId: string, callback: (data: any) => void) => {
      const channel = `websocket:close:${connectionId}`;
      ipcRenderer.on(channel, (_, data) => callback(data));
      return () => ipcRenderer.removeAllListeners(channel);
    },
    onError: (connectionId: string, callback: (data: any) => void) => {
      const channel = `websocket:error:${connectionId}`;
      ipcRenderer.on(channel, (_, data) => callback(data));
      return () => ipcRenderer.removeAllListeners(channel);
    },
  },
});
