// Hook for managing HTTP requests

import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useCallback, useRef } from 'react';
import { HttpAdapter } from '@/lib/adapters/http-adapter';
import type { HttpRequest, SSEMessage } from '@/types';
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
  const sseMessagesRef = useRef<SSEMessage[]>([]);
  const isStreamingRef = useRef(false);

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

  // Disconnect any active SSE stream
  const disconnectStream = useCallback((clearResponse = false) => {
    const adapter = adapterRef.current;
    if (adapter && isStreamingRef.current) {
      adapter.disconnectStream();
      isStreamingRef.current = false;
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
      // Disconnect any existing stream before making a new request
      disconnectStream(true); // Clear response when making new request

      // Set loading state in active tab
      updateActiveTab({ loading: true, error: null, response: null });

      try {
        const adapter = getAdapter();
        const response = await adapter.execute(request);

        // If SSE detected, set up message listeners
        if (response.isSSE) {
          isStreamingRef.current = true;
          sseMessagesRef.current = response.sseMessages || [];

          // Set up message listener for incoming SSE messages
          adapter.on('message', (message: unknown) => {
            const sseMessage = message as SSEMessage;
            sseMessagesRef.current.push(sseMessage);

            // Update tab with accumulated messages
            updateActiveTab({
              loading: false,
              response: {
                ...response,
                sseMessages: [...sseMessagesRef.current],
              },
              error: null,
            });
          });

          // Set initial response with SSE indicator
          updateActiveTab({
            loading: false,
            response: {
              ...response,
              sseMessages: sseMessagesRef.current,
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

        isStreamingRef.current = false;

        // Update active tab with error
        updateActiveTab({ loading: false, error, response: null });

        throw error;
      }
    },
    [updateActiveTab, addToHistory, getAdapter, disconnectStream]
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
    isStreamingRef.current = false;
    sseMessagesRef.current = [];
  }, []);

  // Check if currently streaming
  const isStreaming = () => {
    return isStreamingRef.current;
  };

  return {
    sendRequest,
    cancelRequest,
    cleanup,
    loading,
    error,
    isStreaming,
    disconnectStream,
  };
}
