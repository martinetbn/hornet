// Main application sidebar component

import { DragEndEvent } from '@dnd-kit/core';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarRail,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Folder, History, Settings, Globe, Plus } from 'lucide-react';
import { CollectionTree } from '@/features/collections/components';
import { CollectionItem } from '@/stores/collection-atoms';

interface AppSidebarProps {
  collections: CollectionItem[];
  onCollectionSelect?: (request: unknown, path: string[]) => void;
  onCollectionDelete?: (itemId: string) => void;
  onCollectionRename?: (item: CollectionItem) => void;
  onCollectionDragEnd?: (event: DragEndEvent) => void;
  onNewFolder?: () => void;
}

export function AppSidebar({
  collections,
  onCollectionSelect,
  onCollectionDelete,
  onCollectionRename,
  onCollectionDragEnd,
  onNewFolder,
}: AppSidebarProps) {
  return (
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
  );
}
