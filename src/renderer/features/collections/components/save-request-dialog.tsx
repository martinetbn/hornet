// Dialog for saving a request to a collection folder

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { CollectionFolder } from "@/stores/collection-atoms";

interface SaveRequestDialogProps {
  open: boolean;
  requestName: string;
  folders: CollectionFolder[];
  selectedFolderId?: string;
  onOpenChange: (open: boolean) => void;
  onFolderChange: (folderId: string) => void;
  onSave: () => void;
}

export function SaveRequestDialog({
  open,
  requestName,
  folders,
  selectedFolderId,
  onOpenChange,
  onFolderChange,
  onSave,
}: SaveRequestDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save Request</DialogTitle>
          <DialogDescription>
            Save "{requestName}" to your collections
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="folder">Select Folder (Optional)</Label>
            <Select value={selectedFolderId} onValueChange={onFolderChange}>
              <SelectTrigger id="folder">
                <SelectValue placeholder="None - Save to root" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__root__">None - Save to root</SelectItem>
                {folders.map((folder: CollectionFolder) => (
                  <SelectItem key={folder.id} value={folder.id}>
                    {folder.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
