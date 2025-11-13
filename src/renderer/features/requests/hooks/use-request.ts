// Hook for managing HTTP requests

import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useCallback, useRef } from 'react';
import { HttpAdapter } from '@/lib/adapters/http-adapter';
import { SSEAdapter } from '@/lib/adapters/sse-adapter';
import type { HttpRequest, SSEConfig, SSEMessage } from '@/types';
import {
  requestLoadingAtom,
  requestErrorAtom,
} from '@/stores/request-atoms';
import { addResponseToHistoryAtom } from '@/stores/response-atoms';
import { tabsAtom, activeTabIdAtom } from '@/stores/collection-atoms';

export function useRequest() {
  // Read-only derived atoms (these automatically read from active tab)
  const loading = useAtomValue(requestLoadingAtom);
  const error = useAtomValue(requestErrorAtom);

  // Writable atoms for updating tabs
  const [tabs, setTabs] = useAtom(tabsAtom);
  const activeTabId = useAtomValue(activeTabIdAtom);
  const addToHistory = useSetAtom(addResponseToHistoryAtom);

  const adapterRef = useRef<HttpAdapter | null>(null);
  const sseAdapterRef = useRef<SSEAdapter | null>(null);
  const sseMessagesRef = useRef<SSEMessage[]>([]);

  // Get or create adapter instance
  const getAdapter = useCallback(() => {
    if (!adapterRef.current) {
      adapterRef.current = new HttpAdapter();
    }
    return adapterRef.current;
  }, []);

  // Update tab state helper
  const updateActiveTab = useCallback(
    (updates: { loading?: boolean; error?: Error | null; response?: any }) => {
      if (!activeTabId) return;

      setTabs((currentTabs) =>
        currentTabs.map((tab) =>
          tab.id === activeTabId ? { ...tab, ...updates } : tab
        )
      );
    },
    [activeTabId, setTabs]
  );

  // Disconnect any active SSE connection
  const disconnectSSE = useCallback((clearResponse = false) => {
    if (sseAdapterRef.current) {
      sseAdapterRef.current.disconnect();
      sseAdapterRef.current = null;
    }

    // Only clear response if explicitly requested (when making new request)
    if (clearResponse) {
      sseMessagesRef.current = [];
      updateActiveTab({ response: null });
    }
  }, [updateActiveTab]);

  // Execute HTTP request
  const sendRequest = useCallback(
    async (request: HttpRequest) => {
      // Disconnect any existing SSE connection before making a new request
      disconnectSSE(true); // Clear response when making new request

      // Set loading state in active tab
      updateActiveTab({ loading: true, error: null, response: null });

      try {
        const adapter = getAdapter();
        const response = await adapter.execute(request);

        // Check if this is an SSE endpoint
        if (response.isSSE) {
          // Automatically connect to SSE stream
          const sseConfig: SSEConfig = {
            id: request.id,
            name: request.name,
            protocol: 'sse',
            url: request.url,
            headers: request.headers,
            createdAt: request.createdAt,
            updatedAt: Date.now(),
          };

          const sseAdapter = new SSEAdapter();
          sseAdapterRef.current = sseAdapter;
          sseMessagesRef.current = [];

          // Set up message listener
          sseAdapter.on('message', (message: unknown) => {
            const sseMessage = message as SSEMessage;
            sseMessagesRef.current.push(sseMessage);

            // Update tab with accumulated messages
            updateActiveTab({
              loading: false,
              response: {
                ...response,
                isSSE: true,
                sseMessages: [...sseMessagesRef.current],
              },
              error: null,
            });
          });

          // Connect to SSE endpoint
          await sseAdapter.connect(sseConfig);

          // Initial response with SSE indicator
          updateActiveTab({
            loading: false,
            response: {
              ...response,
              isSSE: true,
              sseMessages: [],
            },
            error: null,
          });
        } else {
          // Regular HTTP response
          updateActiveTab({ loading: false, response, error: null });
          addToHistory(response);
        }

        return response;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error('Unknown error occurred');

        // Update active tab with error
        updateActiveTab({ loading: false, error, response: null });

        throw error;
      }
    },
    [updateActiveTab, addToHistory, getAdapter, disconnectSSE]
  );

  // Cancel ongoing request
  const cancelRequest = useCallback(() => {
    const adapter = adapterRef.current;
    if (adapter) {
      adapter.cancel();
      updateActiveTab({ loading: false });
    }
  }, [updateActiveTab]);

  // Cleanup
  const cleanup = useCallback(() => {
    const adapter = adapterRef.current;
    if (adapter) {
      adapter.dispose();
      adapterRef.current = null;
    }
    disconnectSSE(true);
  }, [disconnectSSE]);

  // Check if SSE is currently connected
  const isSSEConnected = () => {
    return sseAdapterRef.current !== null;
  };

  return {
    sendRequest,
    cancelRequest,
    cleanup,
    loading,
    error,
    isSSEConnected,
    disconnectSSE,
  };
}
