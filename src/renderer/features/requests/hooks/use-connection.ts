// Hook for managing connection-based protocols (WebSocket, Socket.IO, SSE)

import { useAtom, useSetAtom, useAtomValue } from "jotai";
import { useCallback, useRef, useEffect } from "react";
import type {
  WebSocketConfig,
  SocketIOConfig,
  SSEConfig,
  WebSocketMessage,
  SocketIOMessage,
} from "@/types";
import type { ConnectionAdapter, Connection } from "@/types/protocol";
import { createAdapter } from "@/lib/adapters";
import { connectionsAtom, addMessageAtom } from "@/stores/connection-atoms";
import { activeWorkspaceVariablesAtom } from "@/stores/environment-atoms";
import {
  resolveWebSocketVariables,
  resolveSocketIOVariables,
  resolveSSEVariables,
  resolveVariables,
  resolveDataRecursively,
} from "@/lib/utils/variable-resolver";

type ConnectionConfig = WebSocketConfig | SocketIOConfig | SSEConfig;

export function useConnection(connectionId: string, config: ConnectionConfig) {
  const [connections, setConnections] = useAtom(connectionsAtom);
  const addMessage = useSetAtom(addMessageAtom);
  const variables = useAtomValue(activeWorkspaceVariablesAtom);

  const adapterRef = useRef<ConnectionAdapter<any, any> | null>(null);
  const connection = connections.get(connectionId);

  // Get or create adapter instance
  const getAdapter = useCallback(() => {
    if (!adapterRef.current) {
      adapterRef.current = createAdapter(config.protocol) as ConnectionAdapter<
        any,
        any
      >;

      // Set up event listeners
      adapterRef.current.on("status", (status) => {
        setConnections((prev) => {
          const updated = new Map(prev);
          const conn = updated.get(connectionId);
          if (conn) {
            updated.set(connectionId, { ...conn, status: status as any });
          }
          return updated;
        });
      });

      adapterRef.current.on("message", (message) => {
        addMessage({ connectionId, message: message as any });
      });

      adapterRef.current.on("error", (error) => {
        setConnections((prev) => {
          const updated = new Map(prev);
          const conn = updated.get(connectionId);
          if (conn) {
            updated.set(connectionId, {
              ...conn,
              status: "error",
              error:
                error instanceof Error ? error.message : "Connection error",
            });
          }
          return updated;
        });
      });

      adapterRef.current.on("disconnected", () => {
        setConnections((prev) => {
          const updated = new Map(prev);
          const conn = updated.get(connectionId);
          if (conn) {
            updated.set(connectionId, { ...conn, status: "disconnected" });
          }
          return updated;
        });
      });
    }
    return adapterRef.current;
  }, [config.protocol, connectionId, setConnections, addMessage]);

  // Connect to the service
  const connect = useCallback(async () => {
    try {
      // Add connection to state
      const newConnection: Connection = {
        id: connectionId,
        protocol: config.protocol as any,
        url: config.url,
        status: "connecting",
      };

      setConnections((prev) => {
        const updated = new Map(prev);
        updated.set(connectionId, newConnection);
        return updated;
      });

      // Resolve variables before connecting
      let resolvedConfig;
      if (config.protocol === "websocket") {
        resolvedConfig = resolveWebSocketVariables(
          config as WebSocketConfig,
          variables,
        );
      } else if (config.protocol === "socketio") {
        resolvedConfig = resolveSocketIOVariables(
          config as SocketIOConfig,
          variables,
        );
      } else if (config.protocol === "sse") {
        resolvedConfig = resolveSSEVariables(config as SSEConfig, variables);
      } else {
        resolvedConfig = config;
      }

      const adapter = getAdapter();
      await adapter.connect(resolvedConfig);

      // Update connection status
      setConnections((prev) => {
        const updated = new Map(prev);
        const conn = updated.get(connectionId);
        if (conn) {
          updated.set(connectionId, {
            ...conn,
            status: "connected",
            connectedAt: Date.now(),
            error: undefined,
          });
        }
        return updated;
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Connection failed");

      setConnections((prev) => {
        const updated = new Map(prev);
        const conn = updated.get(connectionId);
        if (conn) {
          updated.set(connectionId, {
            ...conn,
            status: "error",
            error: error.message,
          });
        }
        return updated;
      });

      throw error;
    }
  }, [connectionId, config, setConnections, getAdapter, variables]);

  // Disconnect from the service
  const disconnect = useCallback(async () => {
    const adapter = adapterRef.current;
    if (adapter) {
      await adapter.disconnect();

      // Remove connection from state
      setConnections((prev) => {
        const updated = new Map(prev);
        updated.delete(connectionId);
        return updated;
      });
    }
  }, [connectionId, setConnections]);

  // Send message with variable resolution
  const sendMessage = useCallback(
    async (message: WebSocketMessage | SocketIOMessage) => {
      const adapter = adapterRef.current;
      if (!adapter) {
        throw new Error("Not connected");
      }

      // Resolve variables in the message before sending
      let resolvedMessage: WebSocketMessage | SocketIOMessage;

      if ("event" in message) {
        // Socket.IO message
        const socketIOMessage = message as SocketIOMessage;
        resolvedMessage = {
          ...socketIOMessage,
          event: resolveVariables(socketIOMessage.event, variables),
          data: resolveDataRecursively(
            socketIOMessage.data,
            variables,
          ) as unknown[],
        };
      } else {
        // WebSocket message
        const wsMessage = message as WebSocketMessage;
        // Only resolve variables if data is a string (not binary)
        const resolvedData =
          typeof wsMessage.data === "string"
            ? resolveVariables(wsMessage.data, variables)
            : wsMessage.data;
        resolvedMessage = {
          ...wsMessage,
          data: resolvedData,
        };
      }

      await adapter.send(resolvedMessage);
    },
    [variables],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const adapter = adapterRef.current;
      if (adapter && connection?.status === "connected") {
        adapter.disconnect();
      }
    };
  }, [connection?.status]);

  return {
    connection,
    connect,
    disconnect,
    sendMessage,
  };
}
