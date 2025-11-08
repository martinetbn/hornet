// Main application header component

import { Button } from '@/components/ui/button';
import { Save, Moon, Sun } from 'lucide-react';
import { TabBar } from '@/features/requests/components';
import { Tab } from '@/stores/collection-atoms';

interface AppHeaderProps {
  tabs: Tab[];
  activeTabId: string | null;
  theme: 'light' | 'dark';
  onTabSelect: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onNewTab: () => void;
  onSave?: () => void;
  onToggleTheme: () => void;
  canSave?: boolean;
}

export function AppHeader({
  tabs,
  activeTabId,
  theme,
  onTabSelect,
  onTabClose,
  onNewTab,
  onSave,
  onToggleTheme,
  canSave = false,
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-10 shrink-0 border-b bg-background">
      <div className="flex h-12 items-center gap-2 px-4">
        <TabBar
          tabs={tabs}
          activeTabId={activeTabId}
          onTabSelect={onTabSelect}
          onTabClose={onTabClose}
          onNewTab={onNewTab}
        />

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={!canSave} onClick={onSave}>
            <Save className="size-4 mr-2" />
            Save
          </Button>
          <Button variant="ghost" size="icon" onClick={onToggleTheme}>
            {theme === 'light' ? <Moon className="size-4" /> : <Sun className="size-4" />}
          </Button>
        </div>
      </div>
    </header>
  );
}
