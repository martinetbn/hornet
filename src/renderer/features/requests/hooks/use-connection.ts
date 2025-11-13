// Hook for managing connection-based protocols (SSE, WebSocket, Socket.IO)

import { useAtom, useSetAtom } from 'jotai';
import { useCallback, useRef, useEffect } from 'react';
import type { SSEConfig, WebSocketConfig, SocketIOConfig } from '@/types';
import type { ConnectionAdapter, Connection } from '@/types/protocol';
import { createAdapter } from '@/lib/adapters';
import { connectionsAtom, addMessageAtom } from '@/stores/connection-atoms';
import { SSEAdapter } from '@/lib/adapters/sse-adapter';

type ConnectionConfig = SSEConfig | WebSocketConfig | SocketIOConfig;

export function useConnection(connectionId: string, config: ConnectionConfig) {
  const [connections, setConnections] = useAtom(connectionsAtom);
  const addMessage = useSetAtom(addMessageAtom);

  const adapterRef = useRef<ConnectionAdapter<any, any> | null>(null);
  const connection = connections.get(connectionId);

  // Get or create adapter instance
  const getAdapter = useCallback(() => {
    if (!adapterRef.current) {
      adapterRef.current = createAdapter(config.protocol) as ConnectionAdapter<any, any>;

      // Set up event listeners
      adapterRef.current.on('status', (status) => {
        setConnections((prev) => {
          const updated = new Map(prev);
          const conn = updated.get(connectionId);
          if (conn) {
            updated.set(connectionId, { ...conn, status: status as any });
          }
          return updated;
        });
      });

      adapterRef.current.on('message', (message) => {
        addMessage({ connectionId, message });
      });

      adapterRef.current.on('error', (error) => {
        setConnections((prev) => {
          const updated = new Map(prev);
          const conn = updated.get(connectionId);
          if (conn) {
            updated.set(connectionId, {
              ...conn,
              status: 'error',
              error: error instanceof Error ? error.message : 'Connection error',
            });
          }
          return updated;
        });
      });

      adapterRef.current.on('disconnected', () => {
        setConnections((prev) => {
          const updated = new Map(prev);
          const conn = updated.get(connectionId);
          if (conn) {
            updated.set(connectionId, { ...conn, status: 'disconnected' });
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
        status: 'connecting',
      };

      setConnections((prev) => {
        const updated = new Map(prev);
        updated.set(connectionId, newConnection);
        return updated;
      });

      const adapter = getAdapter();
      await adapter.connect(config);

      // For SSE, register event listeners if needed
      if (config.protocol === 'sse' && adapter instanceof SSEAdapter) {
        // You can add custom event types here if needed
        // adapter.listenToEvent('customEvent');
      }

      // Update connection status
      setConnections((prev) => {
        const updated = new Map(prev);
        const conn = updated.get(connectionId);
        if (conn) {
          updated.set(connectionId, {
            ...conn,
            status: 'connected',
            connectedAt: Date.now(),
            error: undefined,
          });
        }
        return updated;
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Connection failed');

      setConnections((prev) => {
        const updated = new Map(prev);
        const conn = updated.get(connectionId);
        if (conn) {
          updated.set(connectionId, {
            ...conn,
            status: 'error',
            error: error.message,
          });
        }
        return updated;
      });

      throw error;
    }
  }, [connectionId, config, setConnections, getAdapter]);

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

  // Send message (not applicable for SSE)
  const sendMessage = useCallback(async (message: any) => {
    const adapter = adapterRef.current;
    if (!adapter) {
      throw new Error('Not connected');
    }

    if (config.protocol === 'sse') {
      throw new Error('Cannot send messages over SSE. SSE is unidirectional (server to client only).');
    }

    await adapter.send(message);
  }, [config.protocol]);

  // Register SSE event listener
  const listenToSSEEvent = useCallback((eventType: string) => {
    const adapter = adapterRef.current;
    if (adapter instanceof SSEAdapter) {
      adapter.listenToEvent(eventType);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const adapter = adapterRef.current;
      if (adapter && connection?.status === 'connected') {
        adapter.disconnect();
      }
    };
  }, [connection?.status]);

  return {
    connection,
    connect,
    disconnect,
    sendMessage,
    listenToSSEEvent,
  };
}
