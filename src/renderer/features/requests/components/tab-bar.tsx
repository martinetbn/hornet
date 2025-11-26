// Tab bar component for managing open requests

import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import type { Tab } from "@/stores/collection-atoms";

interface TabBarProps {
  tabs: Tab[];
  activeTabId: string | null;
  onTabSelect: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onNewTab: () => void;
}

export function TabBar({
  tabs,
  activeTabId,
  onTabSelect,
  onTabClose,
  onNewTab,
}: TabBarProps) {
  if (tabs.length === 0) {
    return (
      <div className="flex items-center gap-1 flex-1 min-w-0">
        <Button variant="outline" size="sm" onClick={onNewTab}>
          <Plus className="size-4 mr-2" />
          New Request
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 flex-1 min-w-0">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm cursor-pointer transition-colors min-w-0 ${
            tab.id === activeTabId ? "bg-muted" : "hover:bg-muted/50"
          }`}
          onClick={() => onTabSelect(tab.id)}
          onMouseDown={(e) => {
            // Middle mouse button closes tab
            if (e.button === 1) {
              e.preventDefault();
              onTabClose(tab.id);
            }
          }}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            {tab.isDirty && (
              <div
                className="size-1.5 rounded-full bg-primary shrink-0"
                title="Unsaved changes"
              />
            )}
            <span className="truncate">{tab.name}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4 p-0 shrink-0 hover:bg-destructive/20"
            onClick={(e) => {
              e.stopPropagation();
              onTabClose(tab.id);
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ))}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={onNewTab}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}
