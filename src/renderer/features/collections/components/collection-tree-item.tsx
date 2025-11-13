// Individual tree item (file or folder) in collection tree

import { useEffect, useRef, useState } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
} from '@/components/ui/sidebar';
import { Input } from '@/components/ui/input';
import { Folder, File, ChevronRight, Globe, Radio, Activity, Zap } from 'lucide-react';
import type { CollectionItem, CollectionFolder } from '@/stores/collection-atoms';
import type { Request } from '@/types/request';

// Helper function to get protocol-specific icon
function getProtocolIcon(request: Request) {
  const iconClass = "shrink-0";

  switch (request.protocol) {
    case 'http':
      return <Globe className={`${iconClass} text-blue-500`} />;
    case 'websocket':
      return <Radio className={`${iconClass} text-purple-500`} />;
    case 'socketio':
      return <Activity className={`${iconClass} text-orange-500`} />;
    case 'grpc':
      return <Zap className={`${iconClass} text-yellow-500`} />;
    default:
      return <File className={iconClass} />;
  }
}

interface CollectionTreeItemProps {
  item: CollectionItem;
  path?: string[];
  onSelect?: (request: unknown, path: string[]) => void;
  onDelete?: (itemId: string) => void;
  onRename?: (item: CollectionItem) => void;
  overId?: string | null;
  renamingId?: string | null;
  renamingValue?: string;
  onRenamingValueChange?: (value: string) => void;
  onConfirmRename?: () => void;
  onCancelRename?: () => void;
}

export function CollectionTreeItem({
  item,
  path = [],
  onSelect,
  onDelete,
  onRename,
  overId,
  renamingId,
  renamingValue,
  onRenamingValueChange,
  onConfirmRename,
  onCancelRename,
}: CollectionTreeItemProps) {
  const currentPath = [...path, item.name];
  const isRenaming = renamingId === item.id;
  const isFolder = 'type' in item && item.type === 'folder';
  const inputRef = useRef<HTMLInputElement>(null);

  const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({
    id: item.id,
    data: { item, type: isFolder ? 'folder' : 'request' },
  });

  const isOver = overId === item.id;

  // Focus input when renaming starts
  useEffect(() => {
    if (isRenaming && inputRef.current) {
      // Small delay to ensure DOM is ready after context menu closes
      const timer = setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isRenaming]);

  // Render request item
  if (!isFolder) {
    const request = item as Request;
    return (
      <div className="relative">
        {isOver && (
          <div className="absolute -top-0.5 left-0 right-0 h-0.5 bg-primary rounded-full" />
        )}
        <div ref={setDragRef} {...(isRenaming ? {} : { ...attributes, ...listeners })}>
          {isRenaming ? (
            <SidebarMenuButton className="cursor-text">
              {getProtocolIcon(request)}
              <Input
                ref={inputRef}
                value={renamingValue}
                onChange={(e) => onRenamingValueChange?.(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    onConfirmRename?.();
                  } else if (e.key === 'Escape') {
                    e.preventDefault();
                    onCancelRename?.();
                  }
                }}
                onBlur={onConfirmRename}
                className="h-6 px-2 py-0 text-sm"
                onClick={(e) => e.stopPropagation()}
              />
            </SidebarMenuButton>
          ) : (
            <ContextMenu>
              <ContextMenuTrigger asChild>
                <SidebarMenuButton
                  className={`data-[active=true]:bg-transparent ${isDragging ? 'opacity-50' : ''}`}
                  onClick={() => onSelect?.(request, currentPath)}
                  onDoubleClick={() => onRename?.(request)}
                >
                  {getProtocolIcon(request)}
                  <span className="truncate">{request.name}</span>
                </SidebarMenuButton>
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuItem onClick={() => onRename?.(request)}>
                  Rename
                </ContextMenuItem>
                <ContextMenuItem onClick={() => onDelete?.(request.id)}>
                  Delete
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          )}
        </div>
      </div>
    );
  }

  // Render folder item
  const folder = item as CollectionFolder;
  const [isOpen, setIsOpen] = useState(folder.name === 'My APIs');
  const { setNodeRef: setDropRef } = useDroppable({
    id: item.id,
    data: { item, type: 'folder' },
  });

  return (
    <SidebarMenuItem ref={setDropRef} className="relative">
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
      >
        <div ref={setDragRef} {...(isRenaming ? {} : { ...attributes, ...listeners })} className="relative">
          {isOver && (
            <div className="absolute inset-0 border-2 border-primary rounded-md pointer-events-none" />
          )}
          {isRenaming ? (
            <SidebarMenuButton className="cursor-text">
              <ChevronRight className={`transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-90' : ''}`} />
              <Folder className="shrink-0" />
              <Input
                ref={inputRef}
                value={renamingValue}
                onChange={(e) => onRenamingValueChange?.(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    onConfirmRename?.();
                  } else if (e.key === 'Escape') {
                    e.preventDefault();
                    onCancelRename?.();
                  }
                }}
                onBlur={onConfirmRename}
                className="h-6 px-2 py-0 text-sm"
                onClick={(e) => e.stopPropagation()}
              />
            </SidebarMenuButton>
          ) : (
            <ContextMenu>
              <ContextMenuTrigger asChild>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    className={`${isDragging ? 'opacity-50' : ''} ${isOver ? 'bg-accent/30' : ''}`}
                  >
                    <ChevronRight className={`transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-90' : ''}`} />
                    <Folder className="shrink-0" />
                    <span className="truncate">{folder.name}</span>
                  </SidebarMenuButton>
                </CollapsibleTrigger>
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuItem onClick={() => onRename?.(folder)}>
                  Rename
                </ContextMenuItem>
                <ContextMenuItem onClick={() => onDelete?.(folder.id)}>
                  Delete Folder
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          )}
        </div>
        <CollapsibleContent>
          <SidebarMenuSub className="mx-0 px-0 pl-4">
            {folder.children.map((subItem) => (
              <CollectionTreeItem
                key={subItem.id}
                item={subItem}
                path={currentPath}
                onSelect={onSelect}
                onDelete={onDelete}
                onRename={onRename}
                overId={overId}
                renamingId={renamingId}
                renamingValue={renamingValue}
                onRenamingValueChange={onRenamingValueChange}
                onConfirmRename={onConfirmRename}
                onCancelRename={onCancelRename}
              />
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  );
}
