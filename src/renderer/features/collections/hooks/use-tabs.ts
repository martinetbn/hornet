// Tab management hook

import { useAtom } from 'jotai';
import { tabsAtom, activeTabIdAtom } from '@/stores/collection-atoms';
import type { Tab, HttpRequest } from '@/stores/collection-atoms';
import { useCallback } from 'react';

export function useTabs() {
  const [tabs, setTabs] = useAtom(tabsAtom);
  const [activeTabId, setActiveTabId] = useAtom(activeTabIdAtom);

  const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? null;

  // Open request in a new tab or switch to existing tab
  const openTab = useCallback(
    (request: HttpRequest, path: string[]): void => {
      const existingTab = tabs.find((tab) => tab.id === request.id);

      if (existingTab) {
        // Switch to existing tab
        setActiveTabId(existingTab.id);
      } else {
        // Create new tab
        const newTab: Tab = {
          id: request.id,
          name: request.name,
          path,
          request,
        };
        setTabs([...tabs, newTab]);
        setActiveTabId(newTab.id);
      }
    },
    [tabs, setTabs, setActiveTabId]
  );

  // Close a tab
  const closeTab = useCallback(
    (tabId: string): void => {
      const tabIndex = tabs.findIndex((tab) => tab.id === tabId);
      const newTabs = tabs.filter((tab) => tab.id !== tabId);
      setTabs(newTabs);

      // If closing the active tab, switch to another tab
      if (activeTabId === tabId) {
        if (newTabs.length > 0) {
          // Switch to the previous tab or the first tab
          const newActiveIndex = tabIndex > 0 ? tabIndex - 1 : 0;
          setActiveTabId(newTabs[newActiveIndex]?.id || null);
        } else {
          setActiveTabId(null);
        }
      }
    },
    [tabs, activeTabId, setTabs, setActiveTabId]
  );

  // Update tab
  const updateTab = useCallback(
    (tabId: string, updates: Partial<Tab>): void => {
      setTabs(tabs.map((tab) => (tab.id === tabId ? { ...tab, ...updates } : tab)));
    },
    [tabs, setTabs]
  );

  // Create new request tab
  const createNewTab = useCallback(
    (request: HttpRequest): void => {
      const newTab: Tab = {
        id: request.id,
        name: request.name,
        path: [request.name],
        request,
      };
      setTabs([...tabs, newTab]);
      setActiveTabId(newTab.id);
    },
    [tabs, setTabs, setActiveTabId]
  );

  return {
    tabs,
    activeTab,
    activeTabId,
    setActiveTabId,
    openTab,
    closeTab,
    updateTab,
    createNewTab,
  };
}
