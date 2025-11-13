// Hook for handling collection drag-and-drop operations

import { useCallback } from 'react';
import type { DragEndEvent } from '@dnd-kit/core';
import type { CollectionItem, CollectionFolder } from '@/stores/collection-atoms';
import { removeItemFromTree, addToFolderInTree, isFolder } from '../utils/collection-tree-utils';

interface UseCollectionDragDropProps {
  collections: CollectionItem[];
  setCollections: (collections: CollectionItem[]) => void;
}

export function useCollectionDragDrop({ collections, setCollections }: UseCollectionDragDropProps) {
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (!over || active.id === over.id) return;

      const draggedItem = active.data.current?.item as CollectionItem;

      if (!draggedItem) return;

      // Remove item from its current location using utility function
      let updatedCollections = removeItemFromTree(collections, draggedItem.id);

      // Add item to new location
      if (over.id === 'root-droppable') {
        // Add to end of root level (only folders can be at root)
        if (isFolder(draggedItem)) {
          updatedCollections = [...updatedCollections, draggedItem];
        }
      } else if (over.id === 'root-top') {
        // Add to beginning of root level (only folders can be at root)
        if (isFolder(draggedItem)) {
          updatedCollections = [draggedItem, ...updatedCollections];
        }
      } else {
        // Add to a specific folder
        const targetFolder = over.data.current?.item as CollectionFolder;
        if (targetFolder && isFolder(targetFolder)) {
          updatedCollections = addToFolderInTree(
            updatedCollections,
            targetFolder.id,
            draggedItem
          );
        }
      }

      setCollections(updatedCollections);
    },
    [collections, setCollections]
  );

  return { handleDragEnd };
}
