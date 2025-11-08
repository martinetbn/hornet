// Main application component - refactored following documented architecture

import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { DragEndEvent } from '@dnd-kit/core';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import { AppSidebar, AppHeader } from '@/components/layout';
import { RequestBuilder } from '@/features/requests/components';
import { ResponseViewer } from '@/features/responses/components';
import { useCollection, useTabs } from '@/features/collections/hooks';
import { RequestConfig, CollectionItem, CollectionFolder, generateId } from '@/stores/collection-atoms';

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | undefined>();

  // Use custom hooks for state management
  const {
    collections,
    setCollections,
    addToFolder,
    removeItem,
    renameItem,
    findItem,
    getAllFolders,
    createFolder,
    saveRequest,
    findPath,
  } = useCollection();

  const { tabs, activeTab, activeTabId, setActiveTabId, openTab, closeTab, updateTab, createNewTab } = useTabs();

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark');
  };

  const handleFileSelect = (request: unknown, path: string[]) => {
    openTab(request as RequestConfig, path);
  };

  const handleNewRequest = () => {
    const newRequest: RequestConfig = {
      id: generateId(),
      name: 'New Request',
      method: 'GET',
      url: 'https://api.example.com',
    };
    createNewTab(newRequest);
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      createFolder(newFolderName.trim());
      setFolderDialogOpen(false);
      setNewFolderName('');
    }
  };

  const handleSaveRequest = () => {
    if (!activeTab) return;
    const folderId = selectedFolderId === '__root__' ? undefined : selectedFolderId;
    saveRequest(activeTab.request, folderId);

    // Update tab with new path
    const newPath = findPath(activeTab.request.id) || [activeTab.request.name];
    updateTab(activeTab.id, { path: newPath });

    setSaveDialogOpen(false);
    setSelectedFolderId(undefined);
  };

  const handleSave = () => {
    if (!activeTab) return;
    const existingRequest = findItem(activeTab.request.id);

    if (existingRequest) {
      // Request exists - update it directly
      saveRequest(activeTab.request);
    } else {
      // New request - show dialog to select location
      setSaveDialogOpen(true);
    }
  };

  const handleCollectionRename = (item: CollectionItem) => {
    // Update the collection item name
    renameItem(item.id, item.name);

    // Also update tabs if a request was renamed
    if (!('type' in item)) {
      const updatedTabs = tabs.filter((tab) => tab.request.id === item.id);
      updatedTabs.forEach((tab) => {
        updateTab(tab.id, { name: item.name, request: { ...tab.request, name: item.name } });
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const draggedItem = active.data.current?.item as CollectionItem;

    if (!draggedItem) return;

    // Remove item from its current location
    let updatedCollections = collections.filter((item) => item.id !== draggedItem.id);

    const removeFromCollectionsRecursive = (items: CollectionItem[]): CollectionItem[] => {
      return items
        .filter((item) => item.id !== draggedItem.id)
        .map((item) => {
          if ('type' in item && item.type === 'folder') {
            return {
              ...item,
              children: removeFromCollectionsRecursive(item.children),
            };
          }
          return item;
        }) as CollectionItem[];
    };

    updatedCollections = removeFromCollectionsRecursive(updatedCollections);

    // Add item to new location
    if (over.id === 'root-droppable') {
      updatedCollections = [...updatedCollections, draggedItem];
    } else if (over.id === 'root-top') {
      updatedCollections = [draggedItem, ...updatedCollections];
    } else {
      const targetFolder = over.data.current?.item as CollectionFolder;
      if (targetFolder && 'type' in targetFolder && targetFolder.type === 'folder') {
        const addToFolderRecursive = (
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
                children: addToFolderRecursive(currentItem.children, targetId, item),
              };
            }
            return currentItem;
          }) as CollectionItem[];
        };

        updatedCollections = addToFolderRecursive(updatedCollections, targetFolder.id, draggedItem);
      }
    }

    setCollections(updatedCollections);
  };

  return (
    <SidebarProvider>
      <ResizablePanelGroup direction="horizontal" className="h-screen">
        <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
          <AppSidebar
            collections={collections}
            onCollectionSelect={handleFileSelect}
            onCollectionDelete={removeItem}
            onCollectionRename={handleCollectionRename}
            onCollectionDragEnd={handleDragEnd}
            onNewFolder={() => setFolderDialogOpen(true)}
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={80}>
          <SidebarInset className="h-screen overflow-auto">
            <AppHeader
              tabs={tabs}
              activeTabId={activeTabId}
              theme={theme}
              onTabSelect={setActiveTabId}
              onTabClose={closeTab}
              onNewTab={handleNewRequest}
              onSave={handleSave}
              onToggleTheme={toggleTheme}
              canSave={!!activeTab}
            />

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
                    <Button onClick={handleNewRequest} size="lg">
                      <Plus className="size-4 mr-2" />
                      New Request
                    </Button>
                  </div>
                </div>
              )}

              {activeTab && (
                <>
                  <RequestBuilder
                    request={activeTab.request}
                    onRequestChange={(updatedRequest) => {
                      // Update the tab with the modified request
                      updateTab(activeTab.id, { request: updatedRequest });
                    }}
                  />
                  <ResponseViewer />
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
                  {getAllFolders().map((folder) => (
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
