// Request-related state atoms

import { atom } from 'jotai';
import type { HttpRequest } from '@/types';
import { tabsAtom, activeTabIdAtom } from './collection-atoms';

/**
 * Derived atom: Gets the current request from the active tab
 * This ensures each tab has its own isolated request state
 */
export const currentRequestAtom = atom<HttpRequest | null>((get) => {
  const tabs = get(tabsAtom);
  const activeTabId = get(activeTabIdAtom);

  if (!activeTabId) return null;

  const activeTab = tabs.find((tab) => tab.id === activeTabId);
  return activeTab?.request ?? null;
});

/**
 * Derived atom: Gets loading state from the active tab
 * This ensures each tab has its own isolated loading state
 */
export const requestLoadingAtom = atom<boolean>((get) => {
  const tabs = get(tabsAtom);
  const activeTabId = get(activeTabIdAtom);

  if (!activeTabId) return false;

  const activeTab = tabs.find((tab) => tab.id === activeTabId);
  return activeTab?.loading ?? false;
});

/**
 * Derived atom: Gets error state from the active tab
 * This ensures each tab has its own isolated error state
 */
export const requestErrorAtom = atom<Error | null>((get) => {
  const tabs = get(tabsAtom);
  const activeTabId = get(activeTabIdAtom);

  if (!activeTabId) return null;

  const activeTab = tabs.find((tab) => tab.id === activeTabId);
  return activeTab?.error ?? null;
});

// Derived: Is request valid?
export const isRequestValidAtom = atom((get) => {
  const request = get(currentRequestAtom);
  if (!request) return false;

  // Basic validation - must have URL and method
  return request.url.length > 0 && request.method !== undefined;
});
