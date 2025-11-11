// Hook for managing HTTP requests

import { useAtom, useSetAtom } from 'jotai';
import { useCallback, useRef } from 'react';
import { HttpAdapter } from '@/lib/adapters/http-adapter';
import type { HttpRequest } from '@/types';
import {
  requestLoadingAtom,
  requestErrorAtom,
} from '@/stores/request-atoms';
import {
  currentResponseAtom,
  addResponseToHistoryAtom,
} from '@/stores/response-atoms';

export function useRequest() {
  const [loading, setLoading] = useAtom(requestLoadingAtom);
  const [error, setError] = useAtom(requestErrorAtom);
  const setCurrentResponse = useSetAtom(currentResponseAtom);
  const addToHistory = useSetAtom(addResponseToHistoryAtom);

  const adapterRef = useRef<HttpAdapter | null>(null);

  // Get or create adapter instance
  const getAdapter = useCallback(() => {
    if (!adapterRef.current) {
      adapterRef.current = new HttpAdapter();
    }
    return adapterRef.current;
  }, []);

  // Execute HTTP request
  const sendRequest = useCallback(async (request: HttpRequest) => {
    setLoading(true);
    setError(null);
    setCurrentResponse(null);

    try {
      const adapter = getAdapter();
      const response = await adapter.execute(request);

      // Update state with response
      setCurrentResponse(response);
      addToHistory(response);

      return response;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setCurrentResponse, addToHistory, getAdapter]);

  // Cancel ongoing request
  const cancelRequest = useCallback(() => {
    const adapter = adapterRef.current;
    if (adapter) {
      adapter.cancel();
      setLoading(false);
    }
  }, [setLoading]);

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
