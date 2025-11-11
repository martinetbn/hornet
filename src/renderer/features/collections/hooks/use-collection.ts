// Collection management hook

import { useAtom } from 'jotai';
import { collectionsAtom, generateId } from '@/stores/collection-atoms';
import type { CollectionItem, CollectionFolder, HttpRequest } from '@/stores/collection-atoms';
import { useCallback } from 'react';

export function useCollection() {
  const [collections, setCollections] = useAtom(collectionsAtom);

  // Add item to a folder
  const addToFolder = useCallback(
    (folderId: string, newItem: CollectionItem): void => {
      const addToFolderRecursive = (
        items: CollectionItem[],
        targetFolderId: string,
        item: CollectionItem
      ): CollectionItem[] => {
        return items.map((currentItem) => {
          if ('type' in currentItem && currentItem.type === 'folder') {
            if (currentItem.id === targetFolderId) {
              return {
                ...currentItem,
                children: [...currentItem.children, item],
              };
            }
            return {
              ...currentItem,
              children: addToFolderRecursive(currentItem.children, targetFolderId, item),
            };
          }
          return currentItem;
        }) as CollectionItem[];
      };

      setCollections(addToFolderRecursive(collections, folderId, newItem));
    },
    [collections, setCollections]
  );

  // Remove item from collections
  const removeItem = useCallback(
    (itemId: string): void => {
      const removeRecursive = (items: CollectionItem[]): CollectionItem[] => {
        return items
          .filter((item) => item.id !== itemId)
          .map((item) => {
            if ('type' in item && item.type === 'folder') {
              return {
                ...item,
                children: removeRecursive(item.children),
              };
            }
            return item;
          }) as CollectionItem[];
      };

      setCollections(removeRecursive(collections));
    },
    [collections, setCollections]
  );

  // Rename item in collections
  const renameItem = useCallback(
    (itemId: string, newName: string): void => {
      const renameRecursive = (items: CollectionItem[]): CollectionItem[] => {
        return items.map((item) => {
          if (item.id === itemId) {
            return { ...item, name: newName };
          }
          if ('type' in item && item.type === 'folder') {
            return {
              ...item,
              children: renameRecursive(item.children),
            };
          }
          return item;
        }) as CollectionItem[];
      };

      setCollections(renameRecursive(collections));
    },
    [collections, setCollections]
  );

  // Find item in collections
  const findItem = useCallback(
    (itemId: string): CollectionItem | null => {
      const findRecursive = (items: CollectionItem[]): CollectionItem | null => {
        for (const item of items) {
          if (item.id === itemId) {
            return item;
          }
          if ('type' in item && item.type === 'folder') {
            const found = findRecursive(item.children);
            if (found) return found;
          }
        }
        return null;
      };

      return findRecursive(collections);
    },
    [collections]
  );

  // Update request in collections
  const updateRequest = useCallback(
    (requestId: string, updatedRequest: HttpRequest): void => {
      const updateRecursive = (items: CollectionItem[]): CollectionItem[] => {
        return items.map((item) => {
          if (item.id === requestId) {
            return { ...updatedRequest, updatedAt: Date.now() };
          }
          if ('type' in item && item.type === 'folder') {
            return {
              ...item,
              children: updateRecursive(item.children),
            };
          }
          return item;
        }) as CollectionItem[];
      };

      setCollections(updateRecursive(collections));
    },
    [collections, setCollections]
  );

  // Find path to item
  const findPath = useCallback(
    (itemId: string): string[] => {
      const findPathRecursive = (
        items: CollectionItem[],
        targetId: string,
        currentPath: string[] = []
      ): string[] => {
        for (const item of items) {
          const newPath = [...currentPath, item.name];
          if (item.id === targetId) {
            return newPath;
          }
          if ('type' in item && item.type === 'folder') {
            const found = findPathRecursive(item.children, targetId, newPath);
            if (found.length > 0) return found;
          }
        }
        return [];
      };

      return findPathRecursive(collections, itemId);
    },
    [collections]
  );

  // Get all folders
  const getAllFolders = useCallback((): CollectionFolder[] => {
    const getFoldersRecursive = (items: CollectionItem[]): CollectionFolder[] => {
      const folders: CollectionFolder[] = [];
      for (const item of items) {
        if ('type' in item && item.type === 'folder') {
          folders.push(item);
          folders.push(...getFoldersRecursive(item.children));
        }
      }
      return folders;
    };

    return getFoldersRecursive(collections);
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
