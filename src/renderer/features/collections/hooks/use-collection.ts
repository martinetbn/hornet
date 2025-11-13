// Collection management hook

import { useAtom } from 'jotai';
import { collectionsAtom, generateId } from '@/stores/collection-atoms';
import type { CollectionItem, CollectionFolder, HttpRequest } from '@/stores/collection-atoms';
import { useCallback } from 'react';
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
  const [collections, setCollections] = useAtom(collectionsAtom);

  // Add item to a folder
  const addToFolder = useCallback(
    (folderId: string, newItem: CollectionItem): void => {
      setCollections(addToFolderInTree(collections, folderId, newItem));
    },
    [collections, setCollections]
  );

  // Remove item from collections
  const removeItem = useCallback(
    (itemId: string): void => {
      setCollections(removeItemFromTree(collections, itemId));
    },
    [collections, setCollections]
  );

  // Rename item in collections
  const renameItem = useCallback(
    (itemId: string, newName: string): void => {
      setCollections(renameItemInTree(collections, itemId, newName));
    },
    [collections, setCollections]
  );

  // Find item in collections
  const findItem = useCallback(
    (itemId: string): CollectionItem | null => {
      return findItemInTree(collections, itemId);
    },
    [collections]
  );

  // Update request in collections
  const updateRequest = useCallback(
    (requestId: string, updatedRequest: HttpRequest): void => {
      setCollections(
        updateItemInTree(collections, requestId, () => ({
          ...updatedRequest,
          updatedAt: Date.now(),
        }))
      );
    },
    [collections, setCollections]
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
        children: [],
      };

      if (!parentId) {
        setCollections([...collections, newFolder]);
      } else {
        addToFolder(parentId, newFolder);
      }
    },
    [collections, setCollections, addToFolder]
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
          createdAt: request.createdAt || Date.now(),
          updatedAt: Date.now(),
        };
        if (!folderId) {
          setCollections([...collections, newRequest]);
        } else {
          addToFolder(folderId, newRequest);
        }
      }
    },
    [collections, setCollections, findItem, updateRequest, addToFolder]
  );

  return {
    collections,
    setCollections,
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
