// Tab management hook

import { useAtom, useAtomValue } from 'jotai';
import { tabsAtom, activeTabIdAtom } from '@/stores/collection-atoms';
import { activeWorkspaceIdAtom } from '@/stores/workspace-atoms';
import type { Tab } from '@/stores/collection-atoms';
import type { Request } from '@/types';
import { useCallback, useMemo, useEffect } from 'react';

export function useTabs() {
  const [allTabs, setAllTabs] = useAtom(tabsAtom);
  const [activeTabId, setActiveTabId] = useAtom(activeTabIdAtom);
  const activeWorkspaceId = useAtomValue(activeWorkspaceIdAtom);

  // Filter tabs by workspace
  const tabs = useMemo(() => {
    return allTabs.filter((tab) => {
      // If tab has workspaceId, match it
      if (tab.workspaceId) {
        return tab.workspaceId === activeWorkspaceId;
      }
      // Legacy tabs (no workspaceId) belong to default workspace
      return activeWorkspaceId === 'default';
    });
  }, [allTabs, activeWorkspaceId]);

  const activeTab = useMemo(() => {
    return tabs.find((tab) => tab.id === activeTabId) ?? null;
  }, [tabs, activeTabId]);

  // Effect: When workspace changes, check if active tab is visible. 
  // If not, try to find the last active tab for this workspace or deselect.
  useEffect(() => {
    if (activeTabId && !activeTab) {
      // Current active tab is not in this workspace. 
      // Do we have any tabs in this workspace?
      if (tabs.length > 0) {
        // Ideally we would restore the last active tab for this workspace.
        // For now, let's just select the last tab in the list as a heuristic,
        // or just null if we don't want to auto-select.
        // Auto-selecting the last tab is a reasonable default behavior for "switching back".
        // However, if we simply switched workspaces, we might want to just show the tabs without selecting one?
        // But the user said "see the tabs from the workspace 1", implying restoration.
        // Let's try to be smart: if no active tab is valid, set it to null.
        // Wait, if I set it to null, the user sees no content.
        // If I leave it as is, `activeTab` is null, so no content is shown, but the ID is "wrong".
        setActiveTabId(null); 
      } else {
         setActiveTabId(null);
      }
    }
  }, [activeWorkspaceId, activeTabId, activeTab, tabs, setActiveTabId]);

  // Open request in a new tab or switch to existing tab
  const openTab = useCallback(
    (request: Request, path: string[]): void => {
      const existingTab = allTabs.find((tab) => tab.id === request.id);

      if (existingTab) {
        // Switch to existing tab (ensure we switch workspace context if needed? 
        // Actually this function is usually called from within the workspace, so it should be fine.
        // If we are opening a tab that exists but in another workspace... that shouldn't happen 
        // if collections are filtered correctly.)
        setActiveTabId(existingTab.id);
      } else {
        // Create new tab
        const newTab: Tab = {
          id: request.id,
          name: request.name,
          path,
          request,
          workspaceId: activeWorkspaceId,
        };
        setAllTabs([...allTabs, newTab]);
        setActiveTabId(newTab.id);
      }
    },
    [allTabs, setAllTabs, setActiveTabId, activeWorkspaceId]
  );

  // Close a tab
  const closeTab = useCallback(
    (tabId: string): void => {
      // Use tabs (filtered) to find index for navigation
      const tabIndex = tabs.findIndex((tab) => tab.id === tabId);
      
      // Update global tabs list
      const newAllTabs = allTabs.filter((tab) => tab.id !== tabId);
      setAllTabs(newAllTabs);

      // If closing the active tab, switch to another tab in the CURRENT workspace
      if (activeTabId === tabId) {
        // We need to look at the filtered tabs to decide which one to select next
        const remainingWorkspaceTabs = tabs.filter(t => t.id !== tabId);
        
        if (remainingWorkspaceTabs.length > 0) {
          // Switch to the previous tab or the first tab
          const newActiveIndex = tabIndex > 0 ? tabIndex - 1 : 0;
          setActiveTabId(remainingWorkspaceTabs[newActiveIndex]?.id || null);
        } else {
          setActiveTabId(null);
        }
      }
    },
    [allTabs, tabs, activeTabId, setAllTabs, setActiveTabId]
  );

  // Update tab
  const updateTab = useCallback(
    (tabId: string, updates: Partial<Tab>): void => {
      setAllTabs(allTabs.map((tab) => (tab.id === tabId ? { ...tab, ...updates } : tab)));
    },
    [allTabs, setAllTabs]
  );

  // Create new request tab
  const createNewTab = useCallback(
    (request: Request): void => {
      const newTab: Tab = {
        id: request.id,
        name: request.name,
        path: [request.name],
        request,
        workspaceId: activeWorkspaceId,
      };
      setAllTabs([...allTabs, newTab]);
      setActiveTabId(newTab.id);
    },
    [allTabs, setAllTabs, setActiveTabId, activeWorkspaceId]
  );

  return {
    tabs, // Return filtered tabs
    activeTab,
    activeTabId,
    setActiveTabId,
    openTab,
    closeTab,
    updateTab,
    createNewTab,
  };
}
