// Main application header component

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Save, Moon, Sun, Monitor, Check } from "lucide-react";
import { TabBar } from "@/features/requests/components";
import type { Tab } from "@/stores/collection-atoms";
import type { ThemePreference } from "@/stores/theme-atoms";

interface AppHeaderProps {
  tabs: Tab[];
  activeTabId: string | null;
  theme: "light" | "dark";
  themePreference: ThemePreference;
  onTabSelect: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onNewTab: () => void;
  onSave?: () => void;
  onThemeChange: (theme: ThemePreference) => void;
  canSave?: boolean;
}

export function AppHeader({
  tabs,
  activeTabId,
  theme,
  themePreference,
  onTabSelect,
  onTabClose,
  onNewTab,
  onSave,
  onThemeChange,
  canSave = false,
}: AppHeaderProps) {
  const getThemeIcon = () => {
    if (themePreference === "system")
      return <Monitor className="size-4 mr-2" />;
    return theme === "light" ? (
      <Sun className="size-4 mr-2" />
    ) : (
      <Moon className="size-4 mr-2" />
    );
  };

  const getThemeLabel = () => {
    if (themePreference === "system") return "System";
    return theme === "light" ? "Light" : "Dark";
  };

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
          {canSave && (
            <Button variant="outline" size="sm" onClick={onSave}>
              <Save className="size-4 mr-2" />
              Save
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                {getThemeIcon()}
                {getThemeLabel()}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onThemeChange("light")}>
                <Sun className="size-4 mr-2" />
                Light
                {themePreference === "light" && (
                  <Check className="size-4 ml-auto" />
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onThemeChange("dark")}>
                <Moon className="size-4 mr-2" />
                Dark
                {themePreference === "dark" && (
                  <Check className="size-4 ml-auto" />
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onThemeChange("system")}>
                <Monitor className="size-4 mr-2" />
                System
                {themePreference === "system" && (
                  <Check className="size-4 ml-auto" />
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
