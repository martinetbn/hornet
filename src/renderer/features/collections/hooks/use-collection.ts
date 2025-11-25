// Collection management hook

import { useAtom, useAtomValue } from 'jotai';
import { collectionsAtom, generateId } from '@/stores/collection-atoms';
import { activeWorkspaceIdAtom } from '@/stores/workspace-atoms';
import type { CollectionItem, CollectionFolder, HttpRequest } from '@/stores/collection-atoms';
import { useCallback, useMemo } from 'react';
import {
  addToFolderInTree,
  removeItemFromTree,
  renameItemInTree,
  findItemInTree,
  updateItemInTree,
  findPathInTree,
  getAllFoldersFromTree,
} from '../utils/collection-tree-utils';

export function useCollection() {
  const [allCollections, setAllCollections] = useAtom(collectionsAtom);
  const activeWorkspaceId = useAtomValue(activeWorkspaceIdAtom);

  // Filter collections by workspace
  const collections = useMemo(() => {
    return allCollections.filter((item) => {
      // If item has workspaceId, match it
      if ('workspaceId' in item && item.workspaceId) {
        return item.workspaceId === activeWorkspaceId;
      }
      // Legacy items (no workspaceId) belong to default workspace
      return activeWorkspaceId === 'default';
    });
  }, [allCollections, activeWorkspaceId]);

  // Helper to update collections preserving other workspaces
  const updateCollections = useCallback(
    (newWorkspaceCollections: CollectionItem[]) => {
      const otherCollections = allCollections.filter((item) => {
        if ('workspaceId' in item && item.workspaceId) {
          return item.workspaceId !== activeWorkspaceId;
        }
        return activeWorkspaceId !== 'default';
      });

      setAllCollections([...otherCollections, ...newWorkspaceCollections]);
    },
    [allCollections, activeWorkspaceId, setAllCollections]
  );

  // Add item to a folder
  const addToFolder = useCallback(
    (folderId: string, newItem: CollectionItem): void => {
      // Ensure new item has workspaceId
      const itemWithWorkspace = { ...newItem, workspaceId: activeWorkspaceId };
      updateCollections(addToFolderInTree(collections, folderId, itemWithWorkspace));
    },
    [collections, activeWorkspaceId, updateCollections]
  );

  // Remove item from collections
  const removeItem = useCallback(
    (itemId: string): void => {
      updateCollections(removeItemFromTree(collections, itemId));
    },
    [collections, updateCollections]
  );

  // Rename item in collections
  const renameItem = useCallback(
    (itemId: string, newName: string): void => {
      updateCollections(renameItemInTree(collections, itemId, newName));
    },
    [collections, updateCollections]
  );

  // Find item in collections (search only current workspace)
  const findItem = useCallback(
    (itemId: string): CollectionItem | null => {
      return findItemInTree(collections, itemId);
    },
    [collections]
  );

  // Update request in collections
  const updateRequest = useCallback(
    (requestId: string, updatedRequest: HttpRequest): void => {
      updateCollections(
        updateItemInTree(collections, requestId, () => ({
          ...updatedRequest,
          workspaceId: activeWorkspaceId, // Ensure workspaceId is preserved/set
          updatedAt: Date.now(),
        }))
      );
    },
    [collections, activeWorkspaceId, updateCollections]
  );

  // Find path to item
  const findPath = useCallback(
    (itemId: string): string[] => {
      return findPathInTree(collections, itemId);
    },
    [collections]
  );

  // Get all folders
  const getAllFolders = useCallback((): CollectionFolder[] => {
    return getAllFoldersFromTree(collections);
  }, [collections]);

  // Create new folder
  const createFolder = useCallback(
    (name: string, parentId?: string): void => {
      const newFolder: CollectionFolder = {
        id: generateId(),
        name,
        type: 'folder',
        workspaceId: activeWorkspaceId,
        children: [],
      };

      if (!parentId) {
        updateCollections([...collections, newFolder]);
      } else {
        addToFolder(parentId, newFolder);
      }
    },
    [collections, activeWorkspaceId, updateCollections, addToFolder]
  );

  // Save request (add or update)
  const saveRequest = useCallback(
    (request: HttpRequest, folderId?: string): void => {
      const existingRequest = findItem(request.id);

      if (existingRequest) {
        // Update existing request
        updateRequest(request.id, request);
      } else {
        // Add new request with createdAt/updatedAt timestamps
        const newRequest = {
          ...request,
          workspaceId: activeWorkspaceId,
          createdAt: request.createdAt || Date.now(),
          updatedAt: Date.now(),
        };
        if (!folderId) {
          updateCollections([...collections, newRequest]);
        } else {
          addToFolder(folderId, newRequest);
        }
      }
    },
    [collections, activeWorkspaceId, findItem, updateRequest, addToFolder, updateCollections]
  );

  return {
    collections,
    setCollections: updateCollections,
    addToFolder,
    removeItem,
    renameItem,
    findItem,
    updateRequest,
    findPath,
    getAllFolders,
    createFolder,
    saveRequest,
  };
}
