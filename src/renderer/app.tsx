import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { useAtom } from 'jotai';
import {
  collectionsAtom,
  tabsAtom,
  activeTabIdAtom,
  generateId,
  type RequestConfig,
  type CollectionFolder,
  type Tab,
  type CollectionItem,
} from '@/stores/collection-atoms';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragOverEvent,
  useDraggable,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  Folder,
  History,
  Settings,
  Globe,
  Plus,
  Save,
  Moon,
  Sun,
  ChevronRight,
  File,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarRail,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';

// Root droppable component to allow dropping at root level
function RootTopDroppable({ overId }: { overId: string | null }) {
  const { setNodeRef } = useDroppable({
    id: 'root-top',
  });

  const isOverRootTop = overId === 'root-top';

  return (
    <div ref={setNodeRef} className="relative h-6 -mb-2">
      {isOverRootTop && (
        <div className="absolute top-2 left-0 right-0 h-0.5 bg-primary rounded-full z-10" />
      )}
    </div>
  );
}

function RootDroppable({ children, overId }: { children: React.ReactNode; overId: string | null }) {
  const { setNodeRef } = useDroppable({
    id: 'root-droppable',
  });

  const isOverRoot = overId === 'root-droppable';

  return (
    <div ref={setNodeRef} className="relative min-h-[100px]">
      {isOverRoot && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary rounded-full z-10" />
      )}
      {children}
      {isOverRoot && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full z-10" />
      )}
    </div>
  );
}

interface TreeProps {
  item: CollectionItem;
  path?: string[];
  onSelect?: (request: RequestConfig, path: string[]) => void;
  onDelete?: (itemId: string) => void;
  onRename?: (item: CollectionItem) => void;
  overId?: string | null;
  renamingId?: string | null;
  renamingValue?: string;
  onRenamingValueChange?: (value: string) => void;
  onConfirmRename?: () => void;
  onCancelRename?: () => void;
}

function Tree({
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
}: TreeProps) {
  const currentPath = [...path, item.name];
  const isRenaming = renamingId === item.id;

  // Check if item is a folder
  const isFolder = 'type' in item && item.type === 'folder';

  // Draggable setup
  const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({
    id: item.id,
    data: { item, type: isFolder ? 'folder' : 'request' },
  });

  const isOver = overId === item.id;

  if (!isFolder) {
    // It's a request
    const request = item as RequestConfig;
    return (
      <div className="relative">
        {isOver && (
          <div className="absolute -top-0.5 left-0 right-0 h-0.5 bg-primary rounded-full" />
        )}
        <div ref={setDragRef} {...attributes} {...listeners}>
          <ContextMenu>
            <ContextMenuTrigger asChild>
              <SidebarMenuButton
                className={`data-[active=true]:bg-transparent ${isDragging ? 'opacity-50' : ''}`}
                onClick={() => !isRenaming && onSelect?.(request, currentPath)}
                onDoubleClick={() => onRename?.(request)}
              >
                <File className="shrink-0" />
                {isRenaming ? (
                  <Input
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
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className="truncate">{request.name}</span>
                )}
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
        </div>
      </div>
    );
  }

  // It's a folder - make it droppable
  const folder = item as CollectionFolder;
  const { setNodeRef: setDropRef } = useDroppable({
    id: item.id,
    data: { item, type: 'folder' },
  });

  return (
    <SidebarMenuItem ref={setDropRef} className="relative">
      <Collapsible
        className="group/collapsible"
        defaultOpen={folder.name === 'My APIs'}
      >
        <div ref={setDragRef} {...attributes} {...listeners} className="relative">
          {isOver && (
            <div className="absolute inset-0 border-2 border-primary rounded-md pointer-events-none" />
          )}
          {isRenaming ? (
            <SidebarMenuButton className="cursor-text">
              <ChevronRight className="transition-transform shrink-0 group-data-[state=open]/collapsible:rotate-90" />
              <Folder className="shrink-0" />
              <Input
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
                autoFocus
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
                    <ChevronRight className="transition-transform shrink-0 group-data-[state=open]/collapsible:rotate-90" />
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
              <Tree
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

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [tabs, setTabs] = useAtom(tabsAtom);
  const [activeTabId, setActiveTabId] = useAtom(activeTabIdAtom);
  const [collections, setCollections] = useAtom(collectionsAtom);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | undefined>();
  const [overId, setOverId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renamingValue, setRenamingValue] = useState('');

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px of movement before drag starts
      },
    })
  );

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark');
  };

  const handleFileSelect = (request: RequestConfig, path: string[]) => {
    // Check if tab already exists
    const existingTab = tabs.find((tab) => tab.id === request.id);

    if (existingTab) {
      // Switch to existing tab
      setActiveTabId(existingTab.id);
    } else {
      // Create new tab
      const newTab: Tab = {
        id: request.id,
        name: request.name,
        path,
        request,
      };
      setTabs([...tabs, newTab]);
      setActiveTabId(newTab.id);
    }
  };

  const closeTab = (tabId: string) => {
    const tabIndex = tabs.findIndex((tab) => tab.id === tabId);
    const newTabs = tabs.filter((tab) => tab.id !== tabId);
    setTabs(newTabs);

    // If closing the active tab, switch to another tab
    if (activeTabId === tabId) {
      if (newTabs.length > 0) {
        // Switch to the previous tab or the first tab
        const newActiveIndex = tabIndex > 0 ? tabIndex - 1 : 0;
        setActiveTabId(newTabs[newActiveIndex]?.id || null);
      } else {
        setActiveTabId(null);
      }
    }
  };

  const activeTab = tabs.find((tab) => tab.id === activeTabId);

  const createNewRequest = () => {
    const newRequest: RequestConfig = {
      id: generateId(),
      name: 'New Request',
      method: 'GET',
      url: 'https://api.example.com',
    };

    const newTab: Tab = {
      id: newRequest.id,
      name: newRequest.name,
      path: ['New Request'],
      request: newRequest,
    };

    setTabs([...tabs, newTab]);
    setActiveTabId(newTab.id);
  };

  const createFolder = (name: string, parentId?: string) => {
    const newFolder: CollectionFolder = {
      id: generateId(),
      name,
      type: 'folder',
      children: [],
    };

    if (!parentId) {
      // Add to root
      setCollections([...collections, newFolder]);
    } else {
      // Add to parent folder
      const updatedCollections = addToFolder(collections, parentId, newFolder);
      setCollections(updatedCollections);
    }
  };

  const saveRequest = (request: RequestConfig, folderId?: string) => {
    // Check if request already exists in collections
    const existingRequest = findItemInCollections(collections, request.id);

    let updatedCollections: CollectionItem[];

    if (existingRequest) {
      // Request already exists - update it in place
      updatedCollections = updateInCollections(collections, request.id, request);
    } else {
      // Request doesn't exist - add it as new
      if (!folderId) {
        // Save to root level directly
        updatedCollections = [...collections, request];
      } else {
        // Save to specific folder
        updatedCollections = addToFolder(collections, folderId, request);
      }
    }

    setCollections(updatedCollections);

    // Update tab with new path
    const updatedTabs = tabs.map((tab) => {
      if (tab.id === request.id) {
        return {
          ...tab,
          path: findPath(updatedCollections, request.id) || [request.name],
          request: request,
        };
      }
      return tab;
    });
    setTabs(updatedTabs);
  };

  const deleteItem = (itemId: string) => {
    const updatedCollections = removeFromCollections(collections, itemId);
    setCollections(updatedCollections);

    // Close tab if it was open
    const tabToClose = tabs.find((tab) => tab.id === itemId);
    if (tabToClose) {
      closeTab(tabToClose.id);
    }
  };

  const startRename = (item: CollectionItem) => {
    setRenamingId(item.id);
    setRenamingValue(item.name);
  };

  const confirmRename = () => {
    if (renamingId && renamingValue.trim()) {
      const updatedCollections = renameInCollections(collections, renamingId, renamingValue.trim());
      setCollections(updatedCollections);

      // Update tab name if this item has an open tab
      const updatedTabs = tabs.map((tab) => {
        if (tab.request.id === renamingId) {
          return {
            ...tab,
            name: renamingValue.trim(),
            request: { ...tab.request, name: renamingValue.trim() },
          };
        }
        return tab;
      });
      setTabs(updatedTabs);
    }
    setRenamingId(null);
    setRenamingValue('');
  };

  const cancelRename = () => {
    setRenamingId(null);
    setRenamingValue('');
  };

  // Helper function to add item to a folder
  const addToFolder = (
    items: CollectionItem[],
    folderId: string,
    newItem: CollectionItem
  ): CollectionItem[] => {
    return items.map((item) => {
      if ('type' in item && item.type === 'folder') {
        if (item.id === folderId) {
          return {
            ...item,
            children: [...item.children, newItem],
          };
        }
        return {
          ...item,
          children: addToFolder(item.children, folderId, newItem),
        };
      }
      return item;
    }) as CollectionItem[];
  };

  // Helper function to remove item from collections
  const removeFromCollections = (
    items: CollectionItem[],
    itemId: string
  ): CollectionItem[] => {
    return items
      .filter((item) => item.id !== itemId)
      .map((item) => {
        if ('type' in item && item.type === 'folder') {
          return {
            ...item,
            children: removeFromCollections(item.children, itemId),
          };
        }
        return item;
      }) as CollectionItem[];
  };

  // Helper function to rename item in collections
  const renameInCollections = (
    items: CollectionItem[],
    itemId: string,
    newName: string
  ): CollectionItem[] => {
    return items.map((item) => {
      if (item.id === itemId) {
        return { ...item, name: newName };
      }
      if ('type' in item && item.type === 'folder') {
        return {
          ...item,
          children: renameInCollections(item.children, itemId, newName),
        };
      }
      return item;
    }) as CollectionItem[];
  };

  // Helper function to check if item exists in collections
  const findItemInCollections = (
    items: CollectionItem[],
    itemId: string
  ): CollectionItem | null => {
    for (const item of items) {
      if (item.id === itemId) {
        return item;
      }
      if ('type' in item && item.type === 'folder') {
        const found = findItemInCollections(item.children, itemId);
        if (found) return found;
      }
    }
    return null;
  };

  // Helper function to update an existing request in collections
  const updateInCollections = (
    items: CollectionItem[],
    itemId: string,
    updatedRequest: RequestConfig
  ): CollectionItem[] => {
    return items.map((item) => {
      if (item.id === itemId) {
        return updatedRequest;
      }
      if ('type' in item && item.type === 'folder') {
        return {
          ...item,
          children: updateInCollections(item.children, itemId, updatedRequest),
        };
      }
      return item;
    }) as CollectionItem[];
  };

  // Helper function to find path to an item
  const findPath = (
    items: CollectionItem[],
    itemId: string,
    currentPath: string[] = []
  ): string[] => {
    for (const item of items) {
      const newPath = [...currentPath, item.name];
      if (item.id === itemId) {
        return newPath;
      }
      if ('type' in item && item.type === 'folder') {
        const found = findPath(item.children, itemId, newPath);
        if (found.length > 0) return found;
      }
    }
    return [];
  };

  // Helper function to get all folders for dropdown
  const getAllFolders = (items: CollectionItem[]): CollectionFolder[] => {
    const folders: CollectionFolder[] = [];
    for (const item of items) {
      if ('type' in item && item.type === 'folder') {
        folders.push(item);
        folders.push(...getAllFolders(item.children));
      }
    }
    return folders;
  };

  const handleSaveRequest = () => {
    if (!activeTab) return;
    // If "__root__" is selected or nothing is selected, save to root
    const folderId = selectedFolderId === '__root__' ? undefined : selectedFolderId;
    saveRequest(activeTab.request, folderId);
    setSaveDialogOpen(false);
    setSelectedFolderId(undefined);
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      createFolder(newFolderName.trim());
      setFolderDialogOpen(false);
      setNewFolderName('');
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    setOverId(event.over?.id as string | null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setOverId(null);

    if (!over || active.id === over.id) return;

    const draggedItem = active.data.current?.item as CollectionItem;
    const targetFolder = over.data.current?.item as CollectionFolder;

    if (!draggedItem) return;

    // Remove item from its current location
    let updatedCollections = removeFromCollections(collections, draggedItem.id);

    // Add item to new location
    if (over.id === 'root-droppable') {
      // Drop at root level (end of list)
      updatedCollections = [...updatedCollections, draggedItem];
    } else if (over.id === 'root-top') {
      // Drop at root level (top of list)
      updatedCollections = [draggedItem, ...updatedCollections];
    } else if (targetFolder && 'type' in targetFolder && targetFolder.type === 'folder') {
      // Drop into a folder
      updatedCollections = addToFolder(updatedCollections, targetFolder.id, draggedItem);
    }

    setCollections(updatedCollections);
  };

  return (
    <SidebarProvider>
      <ResizablePanelGroup direction="horizontal" className="h-screen">
        <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
          <Sidebar collapsible="none" side="left" className="border-r w-full h-screen overflow-x-hidden overflow-y-auto">
            <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                <div className="flex items-center justify-center size-8 rounded-lg bg-primary text-primary-foreground font-bold">
                  H
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Hornet</span>
                  <span className="truncate text-xs text-muted-foreground">API Client</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent className="overflow-x-hidden">
          <SidebarGroup>
            <SidebarGroupLabel>Workspace</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive>
                    <Folder className="size-4 shrink-0" />
                    <span className="truncate">Collections</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <History className="size-4 shrink-0" />
                    <span className="truncate">History</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <Globe className="size-4 shrink-0" />
                    <span className="truncate">Environments</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <div className="flex items-center justify-between px-2">
              <SidebarGroupLabel>Collections</SidebarGroupLabel>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setFolderDialogOpen(true)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <SidebarGroupContent>
              {collections.length === 0 ? (
                <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                  No collections yet
                </div>
              ) : (
                <DndContext sensors={sensors} onDragEnd={handleDragEnd} onDragOver={handleDragOver}>
                  <RootTopDroppable overId={overId} />
                  <RootDroppable overId={overId}>
                    <SidebarMenu>
                      {collections.map((item) => (
                        <Tree
                          key={item.id}
                          item={item}
                          onSelect={handleFileSelect}
                          onDelete={deleteItem}
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
              )}
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton>
                <Settings className="size-4 shrink-0" />
                <span className="truncate">Settings</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
          </Sidebar>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={80}>
          <SidebarInset className="h-screen overflow-auto">
        {/* Header */}
        <header className="sticky top-0 z-10 shrink-0 border-b bg-background">
          <div className="flex h-12 items-center gap-2 px-4">
            {/* Tabs Section */}
            <div className="flex items-center gap-1 flex-1 min-w-0">
              {tabs.map((tab) => (
                <div
                  key={tab.id}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm cursor-pointer transition-colors min-w-0 ${
                    tab.id === activeTabId
                      ? 'bg-muted'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setActiveTabId(tab.id)}
                >
                  <span className="truncate">{tab.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0 shrink-0 hover:bg-destructive/20"
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTab(tab.id);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              {tabs.length > 0 ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={createNewRequest}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={createNewRequest}>
                  <Plus className="size-4 mr-2" />
                  New Request
                </Button>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!activeTab}
                onClick={() => {
                  if (!activeTab) return;

                  // Check if request already exists in collections
                  const existingRequest = findItemInCollections(collections, activeTab.request.id);

                  if (existingRequest) {
                    // Request exists - update it directly without showing dialog
                    saveRequest(activeTab.request);
                  } else {
                    // New request - show dialog to select location
                    setSaveDialogOpen(true);
                  }
                }}
              >
                <Save className="size-4 mr-2" />
                Save
              </Button>
              <Button variant="ghost" size="icon" onClick={toggleTheme}>
                {theme === 'light' ? (
                  <Moon className="size-4" />
                ) : (
                  <Sun className="size-4" />
                )}
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex flex-1 flex-col gap-4 p-4">
          {!activeTab && (
            <div className="flex flex-1 items-center justify-center">
              <div className="text-center space-y-4">
                <div className="space-y-2">
                  <h3 className="text-2xl font-semibold">Get Started</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Create a new HTTP request or select one from your collections
                  </p>
                </div>
                <Button onClick={createNewRequest} size="lg">
                  <Plus className="size-4 mr-2" />
                  New Request
                </Button>
              </div>
            </div>
          )}

          {activeTab && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>HTTP Request</CardTitle>
                  <CardDescription>
                    Configure and send HTTP requests to test your APIs
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Request URL Section */}
                  <div className="flex gap-2">
                    <Select value={activeTab.request.method} disabled>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GET">
                          <Badge variant="outline">GET</Badge>
                        </SelectItem>
                        <SelectItem value="POST">
                          <Badge variant="outline">POST</Badge>
                        </SelectItem>
                        <SelectItem value="PUT">
                          <Badge variant="outline">PUT</Badge>
                        </SelectItem>
                        <SelectItem value="PATCH">
                          <Badge variant="outline">PATCH</Badge>
                        </SelectItem>
                        <SelectItem value="DELETE">
                          <Badge variant="outline">DELETE</Badge>
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    <Input
                      value={activeTab.request.url}
                      placeholder="Enter request URL"
                      className="flex-1"
                      readOnly
                    />

                    <Button>Send</Button>
                  </div>

              {/* Request Configuration Tabs */}
              <Tabs defaultValue="params" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="params">Params</TabsTrigger>
                  <TabsTrigger value="headers">Headers</TabsTrigger>
                  <TabsTrigger value="body">Body</TabsTrigger>
                  <TabsTrigger value="auth">Auth</TabsTrigger>
                </TabsList>

                <TabsContent value="params" className="space-y-4">
                  <div className="rounded-lg border p-4">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium">
                        Query Parameters
                      </span>
                      <Button variant="outline" size="sm">
                        <Plus className="size-4 mr-2" />
                        Add Parameter
                      </Button>
                    </div>
                    <div className="text-sm text-muted-foreground text-center py-8">
                      No parameters added yet
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="headers" className="space-y-4">
                  <div className="rounded-lg border p-4">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium">Headers</span>
                      <Button variant="outline" size="sm">
                        <Plus className="size-4 mr-2" />
                        Add Header
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-xs font-medium text-muted-foreground">
                        <span>Key</span>
                        <span>Value</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input placeholder="Content-Type" size={1} />
                        <Input placeholder="application/json" size={1} />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="body" className="space-y-4">
                  <div className="rounded-lg border p-4">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium">Request Body</span>
                      <Select defaultValue="json">
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="json">JSON</SelectItem>
                          <SelectItem value="xml">XML</SelectItem>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="form">Form Data</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Textarea
                      value={activeTab.request.body || ''}
                      placeholder='{\n  "name": "John Doe",\n  "email": "john@example.com"\n}'
                      className="font-mono text-sm min-h-[200px]"
                      readOnly
                    />
                  </div>
                </TabsContent>

                <TabsContent value="auth" className="space-y-4">
                  <div className="rounded-lg border p-4">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium">
                        Authentication
                      </span>
                      <Select defaultValue="none">
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Auth</SelectItem>
                          <SelectItem value="bearer">Bearer Token</SelectItem>
                          <SelectItem value="basic">Basic Auth</SelectItem>
                          <SelectItem value="api-key">API Key</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="text-sm text-muted-foreground text-center py-8">
                      Select an authentication method
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Response Section */}
          <Card>
            <CardHeader>
              <CardTitle>Response</CardTitle>
              <CardDescription>
                View the response from your API request
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="body" className="w-full">
                <TabsList>
                  <TabsTrigger value="body">Body</TabsTrigger>
                  <TabsTrigger value="headers">Headers</TabsTrigger>
                  <TabsTrigger value="cookies">Cookies</TabsTrigger>
                </TabsList>

                <TabsContent value="body">
                  <ScrollArea className="h-[300px] w-full rounded-md border">
                    <div className="p-4">
                      <pre className="text-sm font-mono text-muted-foreground">
                        Send a request to see the response here...
                      </pre>
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="headers">
                  <ScrollArea className="h-[300px] w-full rounded-md border">
                    <div className="p-4">
                      <pre className="text-sm font-mono text-muted-foreground">
                        Response headers will appear here...
                      </pre>
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="cookies">
                  <ScrollArea className="h-[300px] w-full rounded-md border">
                    <div className="p-4">
                      <pre className="text-sm font-mono text-muted-foreground">
                        Cookies will appear here...
                      </pre>
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>

              <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span>Status: -</span>
                  <span>Time: -</span>
                  <span>Size: -</span>
                </div>
              </div>
            </CardContent>
          </Card>
            </>
          )}
        </div>
          </SidebarInset>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Save Request Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Request</DialogTitle>
            <DialogDescription>
              Save "{activeTab?.name}" to your collections
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="folder">Select Folder (Optional)</Label>
              <Select value={selectedFolderId} onValueChange={setSelectedFolderId}>
                <SelectTrigger id="folder">
                  <SelectValue placeholder="None - Save to root" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__root__">None - Save to root</SelectItem>
                  {getAllFolders(collections).map((folder) => (
                    <SelectItem key={folder.id} value={folder.id}>
                      {folder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRequest}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Folder Dialog */}
      <Dialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              Create a new folder to organize your requests
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="folderName">Folder Name</Label>
              <Input
                id="folderName"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="My API Collection"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateFolder();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFolderDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
