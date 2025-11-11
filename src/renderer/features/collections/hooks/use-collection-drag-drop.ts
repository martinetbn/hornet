// Hook for handling collection drag-and-drop operations

import { useCallback } from 'react';
import type { DragEndEvent } from '@dnd-kit/core';
import type { CollectionItem, CollectionFolder } from '@/stores/collection-atoms';

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

      // Remove item from its current location
      let updatedCollections: CollectionItem[] = collections.filter(
        (item: CollectionItem) => item.id !== draggedItem.id
      );

      const removeFromCollectionsRecursive = (items: CollectionItem[]): CollectionItem[] => {
        return items
          .filter((item: CollectionItem) => item.id !== draggedItem.id)
          .map((item: CollectionItem) => {
            if (!('type' in item && item.type === 'folder')) return item;
            return {
              ...item,
              children: item.children
                .filter((child: CollectionItem) => child.id !== draggedItem.id)
                .map((child: CollectionItem) => {
                  if ('type' in child && child.type === 'folder') {
                    return removeFromCollectionItemRecursive(child);
                  }
                  return child;
                }),
            };
          });
      };

      const removeFromCollectionItemRecursive = (folder: CollectionFolder): CollectionFolder => {
        return {
          ...folder,
          children: folder.children
            .filter((child: CollectionItem) => child.id !== draggedItem.id)
            .map((child: CollectionItem) => {
              if ('type' in child && child.type === 'folder') {
                return removeFromCollectionItemRecursive(child);
              }
              return child;
            }),
        };
      };

      updatedCollections = removeFromCollectionsRecursive(updatedCollections);

      // Add item to new location
      if (over.id === 'root-droppable') {
        if ('type' in draggedItem && draggedItem.type === 'folder') {
          updatedCollections = [...updatedCollections, draggedItem];
        }
      } else if (over.id === 'root-top') {
        if ('type' in draggedItem && draggedItem.type === 'folder') {
          updatedCollections = [draggedItem, ...updatedCollections];
        }
      } else {
        const targetFolder = over.data.current?.item as CollectionFolder;
        if (targetFolder && 'type' in targetFolder && targetFolder.type === 'folder') {
          const addToFolderRecursive = (
            items: CollectionItem[],
            targetId: string,
            item: CollectionItem
          ): CollectionItem[] => {
            return items.map((currentItem) => {
              if (!('type' in currentItem && currentItem.type === 'folder')) return currentItem;
              if (currentItem.id === targetId) {
                return {
                  ...currentItem,
                  children: [...currentItem.children, item],
                };
              }
              return {
                ...currentItem,
                children: addToFolderItemRecursive(currentItem.children, targetId, item),
              };
            });
          };

          const addToFolderItemRecursive = (
            items: CollectionItem[],
            targetId: string,
            item: CollectionItem
          ): CollectionItem[] => {
            return items.map((currentItem) => {
              if ('type' in currentItem && currentItem.type === 'folder') {
                if (currentItem.id === targetId) {
                  return {
                    ...currentItem,
                    children: [...currentItem.children, item],
                  };
                }
                return {
                  ...currentItem,
                  children: addToFolderItemRecursive(currentItem.children, targetId, item),
                };
              }
              return currentItem;
            });
          };

          updatedCollections = addToFolderRecursive(updatedCollections, targetFolder.id, draggedItem);
        }
      }

      setCollections(updatedCollections);
    },
    [collections, setCollections]
  );

  return { handleDragEnd };
}
