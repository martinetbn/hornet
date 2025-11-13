/**
 * Collection tree utility functions
 *
 * Pure functions for working with hierarchical collection structures.
 * These utilities handle recursive operations on trees containing both
 * folders and requests, following the project's state management guidelines.
 */

import type { CollectionItem, CollectionFolder } from '@/stores/collection-atoms';

/**
 * Type guard to check if an item is a folder
 */
export function isFolder(item: CollectionItem): item is CollectionFolder {
  return 'type' in item && item.type === 'folder';
}

/**
 * Find an item in the collection tree by ID
 *
 * @param items - Collection items to search through
 * @param itemId - ID of the item to find
 * @returns The found item or null if not found
 */
export function findItemInTree(
  items: CollectionItem[],
  itemId: string
): CollectionItem | null {
  for (const item of items) {
    if (item.id === itemId) {
      return item;
    }
    if (isFolder(item)) {
      const found = findItemInTree(item.children, itemId);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Remove an item from the collection tree by ID
 *
 * @param items - Collection items to process
 * @param itemId - ID of the item to remove
 * @returns New tree with the item removed
 */
export function removeItemFromTree(
  items: CollectionItem[],
  itemId: string
): CollectionItem[] {
  return items
    .filter((item) => item.id !== itemId)
    .map((item) => {
      if (isFolder(item)) {
        return {
          ...item,
          children: removeItemFromTree(item.children, itemId),
        };
      }
      return item;
    });
}

/**
 * Rename an item in the collection tree
 *
 * @param items - Collection items to process
 * @param itemId - ID of the item to rename
 * @param newName - New name for the item
 * @returns New tree with the item renamed
 */
export function renameItemInTree(
  items: CollectionItem[],
  itemId: string,
  newName: string
): CollectionItem[] {
  return items.map((item) => {
    if (item.id === itemId) {
      return { ...item, name: newName };
    }
    if (isFolder(item)) {
      return {
        ...item,
        children: renameItemInTree(item.children, itemId, newName),
      };
    }
    return item;
  });
}

/**
 * Update an item in the collection tree using an updater function
 *
 * @param items - Collection items to process
 * @param itemId - ID of the item to update
 * @param updater - Function that receives the item and returns updated version
 * @returns New tree with the item updated
 */
export function updateItemInTree<T extends CollectionItem>(
  items: CollectionItem[],
  itemId: string,
  updater: (item: T) => T
): CollectionItem[] {
  return items.map((item) => {
    if (item.id === itemId) {
      return updater(item as T);
    }
    if (isFolder(item)) {
      return {
        ...item,
        children: updateItemInTree(item.children, itemId, updater),
      };
    }
    return item;
  });
}

/**
 * Add an item to a specific folder in the tree
 *
 * @param items - Collection items to process
 * @param folderId - ID of the target folder
 * @param newItem - Item to add to the folder
 * @returns New tree with the item added
 */
export function addToFolderInTree(
  items: CollectionItem[],
  folderId: string,
  newItem: CollectionItem
): CollectionItem[] {
  return items.map((item) => {
    if (isFolder(item)) {
      if (item.id === folderId) {
        return {
          ...item,
          children: [...item.children, newItem],
        };
      }
      return {
        ...item,
        children: addToFolderInTree(item.children, folderId, newItem),
      };
    }
    return item;
  });
}

/**
 * Find the path to an item in the tree (as an array of names)
 *
 * @param items - Collection items to search through
 * @param itemId - ID of the item to find
 * @param currentPath - Current path being built (used internally)
 * @returns Array of names representing the path, or empty array if not found
 */
export function findPathInTree(
  items: CollectionItem[],
  itemId: string,
  currentPath: string[] = []
): string[] {
  for (const item of items) {
    const newPath = [...currentPath, item.name];
    if (item.id === itemId) {
      return newPath;
    }
    if (isFolder(item)) {
      const found = findPathInTree(item.children, itemId, newPath);
      if (found.length > 0) return found;
    }
  }
  return [];
}

/**
 * Get all folders from the collection tree (flattened)
 *
 * @param items - Collection items to process
 * @returns Array of all folders in the tree
 */
export function getAllFoldersFromTree(items: CollectionItem[]): CollectionFolder[] {
  const folders: CollectionFolder[] = [];
  for (const item of items) {
    if (isFolder(item)) {
      folders.push(item);
      folders.push(...getAllFoldersFromTree(item.children));
    }
  }
  return folders;
}

/**
 * Move an item within the tree structure
 *
 * @param items - Collection items to process
 * @param itemId - ID of the item to move
 * @param targetFolderId - ID of the target folder, or null for root level
 * @returns New tree with the item moved
 */
export function moveItemInTree(
  items: CollectionItem[],
  itemId: string,
  targetFolderId: string | null
): CollectionItem[] {
  // Find the item first
  const item = findItemInTree(items, itemId);
  if (!item) return items;

  // Remove from current location
  let updatedItems = removeItemFromTree(items, itemId);

  // Add to new location
  if (targetFolderId === null) {
    // Add to root
    updatedItems = [...updatedItems, item];
  } else {
    // Add to specific folder
    updatedItems = addToFolderInTree(updatedItems, targetFolderId, item);
  }

  return updatedItems;
}

/**
 * Count total number of items in the tree (including nested items)
 *
 * @param items - Collection items to count
 * @returns Total count of all items
 */
export function countItemsInTree(items: CollectionItem[]): number {
  let count = 0;
  for (const item of items) {
    count += 1;
    if (isFolder(item)) {
      count += countItemsInTree(item.children);
    }
  }
  return count;
}

/**
 * Filter items in the tree by a predicate function
 *
 * @param items - Collection items to filter
 * @param predicate - Function to test each item
 * @returns Array of items that match the predicate (flattened)
 */
export function filterItemsInTree(
  items: CollectionItem[],
  predicate: (item: CollectionItem) => boolean
): CollectionItem[] {
  const results: CollectionItem[] = [];
  for (const item of items) {
    if (predicate(item)) {
      results.push(item);
    }
    if (isFolder(item)) {
      results.push(...filterItemsInTree(item.children, predicate));
    }
  }
  return results;
}
