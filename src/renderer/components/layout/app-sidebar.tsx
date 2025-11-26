// Main application sidebar component

import type { DragEndEvent } from "@dnd-kit/core";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Variable,
  Plus,
  ChevronsUpDown,
  Check,
  PlusCircle,
  Settings2,
  Trash2,
} from "lucide-react";
import { CollectionTree } from "@/features/collections/components";
import type { CollectionItem } from "@/stores/collection-atoms";
import type { Workspace } from "@/types/workspace";

interface AppSidebarProps {
  collections: CollectionItem[];
  activeWorkspace: Workspace;
  workspaces: Workspace[];
  onWorkspaceChange: (id: string) => void;
  onWorkspaceCreate: () => void;
  onWorkspaceEdit: (workspace: Workspace) => void;
  onWorkspaceDelete: (id: string) => void;
  onCollectionSelect?: (request: unknown, path: string[]) => void;
  onCollectionDelete?: (itemId: string) => void;
  onCollectionRename?: (item: CollectionItem) => void;
  onCollectionDragEnd?: (event: DragEndEvent) => void;
  onNewFolder?: () => void;
  onVariablesClick?: () => void;
}

export function AppSidebar({
  collections,
  activeWorkspace,
  workspaces,
  onWorkspaceChange,
  onWorkspaceCreate,
  onWorkspaceEdit,
  onWorkspaceDelete,
  onCollectionSelect,
  onCollectionDelete,
  onCollectionRename,
  onCollectionDragEnd,
  onNewFolder,
  onVariablesClick,
}: AppSidebarProps) {
  const { isMobile } = useSidebar();

  return (
    <Sidebar
      collapsible="none"
      side="left"
      className="border-r w-full h-screen overflow-x-hidden overflow-y-auto"
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <div className="flex items-center justify-center size-8 rounded-lg bg-primary text-primary-foreground font-bold uppercase">
                    {activeWorkspace.name.charAt(0)}
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {activeWorkspace.name}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      Hornet
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                align="start"
                side={isMobile ? "bottom" : "right"}
                sideOffset={4}
              >
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Workspaces
                </DropdownMenuLabel>
                {workspaces.map((workspace) => (
                  <DropdownMenuItem
                    key={workspace.id}
                    onClick={() => onWorkspaceChange(workspace.id)}
                    className="gap-2 p-2"
                  >
                    <div className="flex size-6 items-center justify-center rounded-sm border bg-background font-bold uppercase">
                      {workspace.name.charAt(0)}
                    </div>
                    {workspace.name}
                    {workspace.id === activeWorkspace.id && (
                      <Check className="ml-auto size-4" />
                    )}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="gap-2 p-2"
                  onClick={onWorkspaceCreate}
                >
                  <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                    <Plus className="size-4" />
                  </div>
                  <div className="font-medium text-muted-foreground">
                    Add workspace
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onClick={() => onWorkspaceEdit(activeWorkspace)}
                  >
                    <Settings2 className="mr-2 size-4" />
                    Edit Workspace
                  </DropdownMenuItem>
                  {workspaces.length > 1 && (
                    <DropdownMenuItem
                      onClick={() => onWorkspaceDelete(activeWorkspace.id)}
                      className="text-red-500 focus:text-red-500"
                    >
                      <Trash2 className="mr-2 size-4" />
                      Delete Workspace
                    </DropdownMenuItem>
                  )}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="overflow-x-hidden">
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={onVariablesClick}>
                  <Variable className="size-4 shrink-0" />
                  <span className="truncate">Variables</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <div className="flex h-8 items-center justify-between px-2 text-xs font-medium text-sidebar-foreground/70">
            <span>Collections</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onNewFolder}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <SidebarGroupContent>
            <CollectionTree
              collections={collections}
              onSelect={onCollectionSelect}
              onDelete={onCollectionDelete}
              onRename={onCollectionRename}
              onDragEnd={onCollectionDragEnd}
            />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}
