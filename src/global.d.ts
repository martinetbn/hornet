export interface ElectronAPI {
  platform: string;
  storage: {
    get: (key: string) => Promise<any>;
    set: (key: string, value: any) => Promise<boolean>;
    delete: (key: string) => Promise<boolean>;
  };
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
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
