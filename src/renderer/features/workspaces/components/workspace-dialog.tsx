import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Workspace } from '@/types/workspace';

interface WorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  initialData?: Workspace | null;
  onSubmit: (name: string) => void;
}

export function WorkspaceDialog({
  open,
  onOpenChange,
  mode,
  initialData,
  onSubmit,
}: WorkspaceDialogProps) {
  const [name, setName] = useState('');

  useEffect(() => {
    if (open && initialData && mode === 'edit') {
      setName(initialData.name);
    } else if (open && mode === 'create') {
      setName('');
    }
  }, [open, initialData, mode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim());
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create Workspace' : 'Edit Workspace'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Create a new workspace to organize your requests and collections.'
              : 'Update your workspace details.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Workspace"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              {mode === 'create' ? 'Create' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


