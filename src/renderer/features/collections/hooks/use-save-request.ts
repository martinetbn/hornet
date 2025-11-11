// Hook for handling request save operations and keyboard shortcuts

import { useCallback, useEffect } from 'react';
import type { Tab, HttpRequest } from '@/stores/collection-atoms';

interface UseSaveRequestProps {
  activeTab: Tab | null;
  findItem: (itemId: string) => unknown;
  saveRequest: (request: HttpRequest, folderId?: string) => void;
  updateTab: (tabId: string, updates: Partial<Tab>) => void;
  findPath: (itemId: string) => string[] | null;
  onShowSaveDialog: () => void;
}

export function useSaveRequest({
  activeTab,
  findItem,
  saveRequest,
  updateTab,
  findPath,
  onShowSaveDialog,
}: UseSaveRequestProps) {
  const handleSave = useCallback(() => {
    if (!activeTab) return;
    const existingRequest = findItem(activeTab.request.id);

    if (existingRequest) {
      // Request exists - update it directly
      saveRequest(activeTab.request as HttpRequest);
      // Clear dirty flag after saving
      updateTab(activeTab.id, { isDirty: false });
    } else {
      // New request - show dialog to select location
      onShowSaveDialog();
    }
  }, [activeTab, findItem, saveRequest, updateTab, onShowSaveDialog]);

  const handleSaveToFolder = useCallback(
    (folderId?: string) => {
      if (!activeTab) return;
      saveRequest(activeTab.request as HttpRequest, folderId);

      // Update tab with new path and clear dirty flag
      const newPath = findPath(activeTab.request.id) || [activeTab.request.name];
      updateTab(activeTab.id, { path: newPath, isDirty: false });
    },
    [activeTab, saveRequest, findPath, updateTab]
  );

  // Add keyboard shortcut for save (Ctrl/Cmd + S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  return { handleSave, handleSaveToFolder };
}
