// Hook for managing HTTP requests

import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useCallback, useRef } from 'react';
import { HttpAdapter } from '@/lib/adapters/http-adapter';
import type { HttpRequest } from '@/types';
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

  // Execute HTTP request
  const sendRequest = useCallback(
    async (request: HttpRequest) => {
      // Set loading state in active tab
      updateActiveTab({ loading: true, error: null, response: null });

      try {
        const adapter = getAdapter();
        const response = await adapter.execute(request);

        // Update active tab with response
        updateActiveTab({ loading: false, response, error: null });
        addToHistory(response);

        return response;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error('Unknown error occurred');

        // Update active tab with error
        updateActiveTab({ loading: false, error, response: null });

        throw error;
      }
    },
    [updateActiveTab, addToHistory, getAdapter]
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
  }, []);

  return {
    sendRequest,
    cancelRequest,
    cleanup,
    loading,
    error,
  };
}
