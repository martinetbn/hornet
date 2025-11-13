// Response-related state atoms

import { atom } from 'jotai';
import type { HttpResponse } from '@/types';
import { tabsAtom, activeTabIdAtom } from './collection-atoms';

/**
 * Derived atom: Gets the current response from the active tab
 * This ensures each tab has its own isolated response state
 */
export const currentResponseAtom = atom<HttpResponse | null>((get) => {
  const tabs = get(tabsAtom);
  const activeTabId = get(activeTabIdAtom);

  if (!activeTabId) return null;

  const activeTab = tabs.find((tab) => tab.id === activeTabId);
  return activeTab?.response ?? null;
});

// Response history (last N responses across all tabs)
export const responseHistoryAtom = atom<HttpResponse[]>([]);

// Add response to history
export const addResponseToHistoryAtom = atom(
  null,
  (get, set, response: HttpResponse) => {
    const history = get(responseHistoryAtom);
    // Keep last 50 responses
    const newHistory = [response, ...history].slice(0, 50);
    set(responseHistoryAtom, newHistory);
  }
);
