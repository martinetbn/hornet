// Reusable key-value editor for headers and params

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { X } from "lucide-react";
import type { KeyValuePair } from "@/types";

interface KeyValueEditorProps {
  title: string;
  items: KeyValuePair[];
  onItemsChange: (items: KeyValuePair[]) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
  disabled?: boolean;
}

export function KeyValueEditor({
  title,
  items,
  onItemsChange,
  keyPlaceholder = "Key",
  valuePlaceholder = "Value",
  disabled = false,
}: KeyValueEditorProps) {
  const handleChange = (
    index: number,
    field: "key" | "value",
    value: string,
  ) => {
    const newItems = [...items];
    newItems[index] = {
      key: "",
      value: "",
      enabled: true,
      ...newItems[index],
      [field]: value,
    };

    // Auto-add a new empty item if this is the last one and user is typing
    const isLastItem = index === newItems.length - 1;
    const updatedItem = newItems[index];
    if (isLastItem && (updatedItem.key || updatedItem.value)) {
      newItems.push({ key: "", value: "", enabled: true });
    }

    onItemsChange(newItems);
  };

  const handleRemove = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    // Ensure we always have at least one empty item
    if (newItems.length === 0) {
      newItems.push({ key: "", value: "", enabled: true });
    }
    onItemsChange(newItems);
  };

  const handleToggle = (index: number) => {
    const newItems = [...items];
    const current = newItems[index];
    if (current) {
      newItems[index] = { ...current, enabled: !current.enabled };
    }
    onItemsChange(newItems);
  };

  // Ensure we always have at least one empty item
  const displayItems =
    items && items.length > 0 ? items : [{ key: "", value: "", enabled: true }];

  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-start justify-between mb-4">
        <span className="text-sm font-medium">{title}</span>
      </div>
      <div className="space-y-2">
        {displayItems.map((item, index) => {
          // Hide delete button if it's the last item and it's empty
          const isLastItem = index === displayItems.length - 1;
          const isEmpty = !item.key && !item.value;
          const shouldShowDelete = !(isLastItem && isEmpty);

          return (
            <div key={index} className="w-full flex gap-2 items-center">
              <Checkbox
                checked={item.enabled !== false}
                onCheckedChange={() => handleToggle(index)}
                className="mt-4"
                disabled={disabled}
              />
              <div className="flex flex-col items-start gap-1 w-full">
                <span className="text-xs font-medium text-muted-foreground">
                  Key
                </span>
                <Input
                  value={item.key}
                  onChange={(e) => handleChange(index, "key", e.target.value)}
                  placeholder={keyPlaceholder}
                  disabled={disabled || item.enabled === false}
                  className="w-full"
                />
              </div>
              <div className="flex flex-col items-start gap-1 w-full">
                <span className="text-xs font-medium text-muted-foreground">
                  Value
                </span>
                <Input
                  value={item.value}
                  onChange={(e) => handleChange(index, "value", e.target.value)}
                  placeholder={valuePlaceholder}
                  disabled={disabled || item.enabled === false}
                  className="w-full"
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemove(index)}
                className="size-8 mt-4"
                style={{ visibility: shouldShowDelete ? "visible" : "hidden" }}
                disabled={disabled || !shouldShowDelete}
              >
                <X className="size-4" />
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
