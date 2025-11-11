// Collection tree component with drag and drop support

import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type {
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import {
  SidebarMenu,
} from '@/components/ui/sidebar';
import type { CollectionItem, CollectionFolder } from '@/stores/collection-atoms';
import { CollectionTreeItem } from './collection-tree-item';
import { RootDroppable, RootTopDroppable } from './root-droppable';
import { useState } from 'react';

interface CollectionTreeProps {
  collections: CollectionItem[];
  onSelect?: (request: unknown, path: string[]) => void;
  onDelete?: (itemId: string) => void;
  onRename?: (item: CollectionItem) => void;
  onDragEnd?: (event: DragEndEvent) => void;
}

export function CollectionTree({
  collections,
  onSelect,
  onDelete,
  onRename,
  onDragEnd,
}: CollectionTreeProps) {
  const [overId, setOverId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renamingValue, setRenamingValue] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragOver = (event: DragOverEvent) => {
    setOverId(event.over?.id as string | null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setOverId(null);
    onDragEnd?.(event);
  };

  const startRename = (item: CollectionItem) => {
    setRenamingId(item.id);
    setRenamingValue(item.name);
  };

  const confirmRename = () => {
    if (renamingId && renamingValue.trim()) {
      onRename?.({ id: renamingId, name: renamingValue.trim() } as CollectionItem);
    }
    setRenamingId(null);
    setRenamingValue('');
  };

  const cancelRename = () => {
    setRenamingId(null);
    setRenamingValue('');
  };

  if (collections.length === 0) {
    return (
      <div className="px-3 py-8 text-center text-sm text-muted-foreground">
        No collections yet
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd} onDragOver={handleDragOver}>
      <RootTopDroppable overId={overId} />
      <RootDroppable overId={overId}>
        <SidebarMenu>
          {collections.map((item) => (
            <CollectionTreeItem
              key={item.id}
              item={item}
              onSelect={onSelect}
              onDelete={onDelete}
              onRename={startRename}
              overId={overId}
              renamingId={renamingId}
              renamingValue={renamingValue}
              onRenamingValueChange={setRenamingValue}
              onConfirmRename={confirmRename}
              onCancelRename={cancelRename}
            />
          ))}
        </SidebarMenu>
      </RootDroppable>
    </DndContext>
  );
}
