// Main application component - composition layer

import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { Plus, Globe, Zap, Plug, Activity } from 'lucide-react';
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
import { RequestBuilder, GrpcBuilder, WebSocketBuilder, SocketIOBuilder, SSEBuilder } from '@/features/requests/components';
import { ResponseViewer } from '@/features/responses/components';
import {
  useCollection,
  useTabs,
  useCollectionDragDrop,
  useSaveRequest,
} from '@/features/collections/hooks';
import { SaveRequestDialog, CreateFolderDialog } from '@/features/collections/components';
import { VariablesDialog } from '@/features/variables/components';
import { WorkspaceDialog } from '@/features/workspaces/components/workspace-dialog';
import { useKeyboardShortcuts } from '@/features/requests/hooks';
import { useTheme } from '@/features/settings/hooks';
import type { HttpRequest, GrpcRequest, WebSocketConfig, SocketIOConfig, SSEConfig, Request, CollectionItem, Tab } from '@/types';
import type { Workspace } from '@/types/workspace';
import { generateId } from '@/stores/collection-atoms';
import { sidebarWidthAtom } from '@/stores/sidebar-atoms';
import {
  workspacesAtom,
  activeWorkspaceAtom,
  createWorkspaceAtom,
  updateWorkspaceAtom,
  deleteWorkspaceAtom,
  activeWorkspaceIdAtom,
} from '@/stores/workspace-atoms';

function App() {
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [protocolDialogOpen, setProtocolDialogOpen] = useState(false);
  const [variablesDialogOpen, setVariablesDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | undefined>();

  // Workspace management
  const activeWorkspace = useAtomValue(activeWorkspaceAtom);
  const workspaces = useAtomValue(workspacesAtom);
  const setActiveWorkspaceId = useSetAtom(activeWorkspaceIdAtom);
  const createWorkspace = useSetAtom(createWorkspaceAtom);
  const updateWorkspace = useSetAtom(updateWorkspaceAtom);
  const deleteWorkspace = useSetAtom(deleteWorkspaceAtom);

  const [workspaceDialogOpen, setWorkspaceDialogOpen] = useState(false);
  const [workspaceDialogMode, setWorkspaceDialogMode] = useState<'create' | 'edit'>('create');
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null);

  const handleWorkspaceSubmit = (name: string) => {
    if (workspaceDialogMode === 'create') {
      createWorkspace(name);
    } else if (editingWorkspace) {
      updateWorkspace({ id: editingWorkspace.id, name });
    }
    setWorkspaceDialogOpen(false);
  };

  const openCreateWorkspace = () => {
    setWorkspaceDialogMode('create');
    setEditingWorkspace(null);
    setWorkspaceDialogOpen(true);
  };

  const openEditWorkspace = (workspace: Workspace) => {
    setWorkspaceDialogMode('edit');
    setEditingWorkspace(workspace);
    setWorkspaceDialogOpen(true);
  };

  // Theme management
  const { theme, themePreference, setTheme } = useTheme();

  // Sidebar width persistence
  const [sidebarWidth, setSidebarWidth] = useAtom(sidebarWidthAtom);

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

  const handleProtocolSelect = (protocol: 'http' | 'grpc' | 'websocket' | 'socketio' | 'sse') => {
    const now = Date.now();
    const id = generateId();

    let newRequest: Request;

    if (protocol === 'grpc') {
      const grpcRequest: GrpcRequest = {
        id,
        name: 'New gRPC Request',
        protocol: 'grpc',
        url: 'localhost:50051',
        protoFile: '',
        method: '',
        data: {},
        createdAt: now,
        updatedAt: now,
      };
      newRequest = grpcRequest;
    } else if (protocol === 'websocket') {
      const wsRequest: WebSocketConfig = {
        id,
        name: 'New WebSocket Connection',
        protocol: 'websocket',
        url: 'wss://echo.websocket.org',
        createdAt: now,
        updatedAt: now,
      };
      newRequest = wsRequest;
    } else if (protocol === 'socketio') {
      const socketioRequest: SocketIOConfig = {
        id,
        name: 'New Socket.IO Connection',
        protocol: 'socketio',
        url: 'http://localhost:3000',
        path: '/socket.io',
        createdAt: now,
        updatedAt: now,
      };
      newRequest = socketioRequest;
    } else if (protocol === 'sse') {
      const sseRequest: SSEConfig = {
        id,
        name: 'New SSE Connection',
        protocol: 'sse',
        url: 'http://localhost:3000/events',
        createdAt: now,
        updatedAt: now,
      };
      newRequest = sseRequest;
    } else {
      const httpRequest: HttpRequest = {
        id,
        name: 'New HTTP Request',
        protocol: 'http',
        method: 'GET',
        url: 'https://api.example.com',
        createdAt: now,
        updatedAt: now,
      };
      newRequest = httpRequest;
    }

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
      <ResizablePanelGroup
        direction="horizontal"
        className="h-screen"
        onLayout={(sizes) => {
          // Save the first panel's size (sidebar width)
          if (sizes[0] !== undefined) {
            setSidebarWidth(sizes[0]);
          }
        }}
      >
        <ResizablePanel defaultSize={sidebarWidth} minSize={15} maxSize={30}>
          <AppSidebar
            collections={collections}
            activeWorkspace={activeWorkspace}
            workspaces={workspaces}
            onWorkspaceChange={setActiveWorkspaceId}
            onWorkspaceCreate={openCreateWorkspace}
            onWorkspaceEdit={openEditWorkspace}
            onWorkspaceDelete={deleteWorkspace}
            onCollectionSelect={handleFileSelect}
            onCollectionDelete={removeItem}
            onCollectionRename={handleCollectionRename}
            onCollectionDragEnd={handleDragEnd}
            onNewFolder={() => setFolderDialogOpen(true)}
            onVariablesClick={() => setVariablesDialogOpen(true)}
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={100 - sidebarWidth}>
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

                  {activeTab.request.protocol === 'grpc' && (
                    <>
                      <GrpcBuilder
                        request={activeTab.request as GrpcRequest}
                        onRequestChange={(updatedRequest: GrpcRequest) => {
                          // Update the tab with the modified request and mark as dirty
                          updateTab(activeTab.id, { request: updatedRequest, isDirty: true });
                        }}
                      />
                      <ResponseViewer />
                    </>
                  )}

                  {activeTab.request.protocol === 'websocket' && (
                    <>
                      <WebSocketBuilder
                        request={activeTab.request as WebSocketConfig}
                        onRequestChange={(updatedRequest: WebSocketConfig) => {
                          // Update the tab with the modified request and mark as dirty
                          updateTab(activeTab.id, { request: updatedRequest, isDirty: true });
                        }}
                      />
                      <ResponseViewer />
                    </>
                  )}

                  {activeTab.request.protocol === 'socketio' && (
                    <>
                      <SocketIOBuilder
                        request={activeTab.request as SocketIOConfig}
                        onRequestChange={(updatedRequest: SocketIOConfig) => {
                          // Update the tab with the modified request and mark as dirty
                          updateTab(activeTab.id, { request: updatedRequest, isDirty: true });
                        }}
                      />
                      <ResponseViewer />
                    </>
                  )}

                  {activeTab.request.protocol === 'sse' && (
                    <>
                      <SSEBuilder
                        request={activeTab.request as SSEConfig}
                        onRequestChange={(updatedRequest: SSEConfig) => {
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

      <VariablesDialog
        open={variablesDialogOpen}
        onOpenChange={setVariablesDialogOpen}
      />

      <WorkspaceDialog
        open={workspaceDialogOpen}
        onOpenChange={setWorkspaceDialogOpen}
        mode={workspaceDialogMode}
        initialData={editingWorkspace}
        onSubmit={handleWorkspaceSubmit}
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
              <Globe className="size-5 mr-3 shrink-0 text-blue-500" />
              <div className="text-left w-full">
                <div className="font-semibold">HTTP / REST</div>
                <div className="text-sm text-muted-foreground break-words">
                  Traditional request/response HTTP requests (auto-detects SSE)
                </div>
              </div>
            </Button>
            <Button
              variant="outline"
              className="h-auto w-full py-4 justify-start whitespace-normal"
              onClick={() => handleProtocolSelect('grpc')}
            >
              <Zap className="size-5 mr-3 shrink-0 text-yellow-500" />
              <div className="text-left w-full">
                <div className="font-semibold">gRPC</div>
                <div className="text-sm text-muted-foreground break-words">
                  High-performance RPC framework with Protocol Buffers
                </div>
              </div>
            </Button>
            <Button
              variant="outline"
              className="h-auto w-full py-4 justify-start whitespace-normal"
              onClick={() => handleProtocolSelect('websocket')}
            >
              <Plug className="size-5 mr-3 shrink-0 text-green-500" />
              <div className="text-left w-full">
                <div className="font-semibold">WebSocket</div>
                <div className="text-sm text-muted-foreground break-words">
                  Full-duplex bidirectional communication for real-time apps
                </div>
              </div>
            </Button>
            <Button
              variant="outline"
              className="h-auto w-full py-4 justify-start whitespace-normal"
              onClick={() => handleProtocolSelect('socketio')}
            >
              <Activity className="size-5 mr-3 shrink-0 text-orange-500" />
              <div className="text-left w-full">
                <div className="font-semibold">Socket.IO</div>
                <div className="text-sm text-muted-foreground break-words">
                  Event-based real-time bidirectional communication with reconnection
                </div>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
