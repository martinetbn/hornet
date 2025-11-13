// Main application component - composition layer

import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import { AppSidebar, AppHeader } from '@/components/layout';
import { RequestBuilder } from '@/features/requests/components';
import { ResponseViewer } from '@/features/responses/components';
import {
  useCollection,
  useTabs,
  useCollectionDragDrop,
  useSaveRequest,
} from '@/features/collections/hooks';
import { SaveRequestDialog, CreateFolderDialog } from '@/features/collections/components';
import { useKeyboardShortcuts } from '@/features/requests/hooks';
import { useTheme } from '@/features/settings/hooks';
import type { HttpRequest, Request, CollectionItem, Tab } from '@/types';
import { generateId } from '@/stores/collection-atoms';

function App() {
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [protocolDialogOpen, setProtocolDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | undefined>();

  // Theme management
  const { theme, themePreference, setTheme } = useTheme();

  // Collection management
  const {
    collections,
    setCollections,
    removeItem,
    renameItem,
    findItem,
    getAllFolders,
    createFolder,
    saveRequest,
    findPath,
  } = useCollection();

  // Tab management
  const { tabs, activeTab, activeTabId, setActiveTabId, openTab, closeTab, updateTab, createNewTab } = useTabs();

  // Use custom hooks for business logic
  const { handleSave, handleSaveToFolder } = useSaveRequest({
    activeTab,
    findItem,
    saveRequest,
    updateTab,
    findPath,
    onShowSaveDialog: () => setSaveDialogOpen(true),
  });

  const { handleDragEnd } = useCollectionDragDrop({
    collections,
    setCollections,
  });

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onSave: handleSave,
    onCloseTab: activeTabId ? () => closeTab(activeTabId) : undefined,
  });

  const handleFileSelect = (request: unknown, path: string[]) => {
    openTab(request as Request, path);
  };

  const handleNewRequest = () => {
    setProtocolDialogOpen(true);
  };

  const handleProtocolSelect = (protocol: 'http') => {
    const now = Date.now();
    const id = generateId();

    const newRequest: HttpRequest = {
      id,
      name: 'New HTTP Request',
      protocol: 'http',
      method: 'GET',
      url: 'https://api.example.com',
      createdAt: now,
      updatedAt: now,
    };
    createNewTab(newRequest);

    setProtocolDialogOpen(false);
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      createFolder(newFolderName.trim());
      setFolderDialogOpen(false);
      setNewFolderName('');
    }
  };

  const handleSaveRequestToFolder = () => {
    if (!activeTab) return;
    const folderId = selectedFolderId === '__root__' ? undefined : selectedFolderId;
    handleSaveToFolder(folderId);
    setSaveDialogOpen(false);
    setSelectedFolderId(undefined);
  };

  const handleCollectionRename = (item: CollectionItem) => {
    // Update the collection item name
    renameItem(item.id, item.name);

    // Also update tabs if a request was renamed
    if (!('type' in item)) {
      const updatedTabs = tabs.filter((tab: Tab) => tab.request.id === item.id);
      updatedTabs.forEach((tab: Tab) => {
        updateTab(tab.id, { name: item.name, request: { ...tab.request, name: item.name } });
      });
    }
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
              themePreference={themePreference}
              onTabSelect={setActiveTabId}
              onTabClose={closeTab}
              onNewTab={handleNewRequest}
              onSave={handleSave}
              onThemeChange={setTheme}
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
                  {activeTab.request.protocol === 'http' && (
                    <>
                      <RequestBuilder
                        request={activeTab.request as HttpRequest}
                        onRequestChange={(updatedRequest: HttpRequest) => {
                          // Update the tab with the modified request and mark as dirty
                          updateTab(activeTab.id, { request: updatedRequest, isDirty: true });
                        }}
                      />
                      <ResponseViewer />
                    </>
                  )}
                </>
              )}
            </div>
          </SidebarInset>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Dialogs */}
      <SaveRequestDialog
        open={saveDialogOpen}
        requestName={activeTab?.name || ''}
        folders={getAllFolders()}
        selectedFolderId={selectedFolderId}
        onOpenChange={setSaveDialogOpen}
        onFolderChange={setSelectedFolderId}
        onSave={handleSaveRequestToFolder}
      />

      <CreateFolderDialog
        open={folderDialogOpen}
        folderName={newFolderName}
        onOpenChange={setFolderDialogOpen}
        onFolderNameChange={setNewFolderName}
        onCreate={handleCreateFolder}
      />

      {/* Protocol Selection Dialog */}
      <Dialog open={protocolDialogOpen} onOpenChange={setProtocolDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select Protocol</DialogTitle>
            <DialogDescription>
              Choose the protocol type for your new request
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            <Button
              variant="outline"
              className="h-auto w-full py-4 justify-start whitespace-normal"
              onClick={() => handleProtocolSelect('http')}
            >
              <div className="text-left w-full">
                <div className="font-semibold">HTTP / REST</div>
                <div className="text-sm text-muted-foreground break-words">
                  Traditional request/response HTTP requests (auto-detects SSE)
                </div>
              </div>
            </Button>
            {/* WebSocket, Socket.IO, and other protocols will be added here */}
          </div>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
