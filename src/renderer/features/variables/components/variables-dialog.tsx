// Variables management dialog component

import { useState } from "react";
import { useAtom, useAtomValue } from "jotai";
import { Plus, Trash2, Check, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { variablesAtom } from "@/stores/environment-atoms";
import { activeWorkspaceIdAtom } from "@/stores/workspace-atoms";
import type { Variable } from "@/types";
import { nanoid } from "nanoid";

interface VariablesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VariablesDialog({ open, onOpenChange }: VariablesDialogProps) {
  const [allVariables, setAllVariables] = useAtom(variablesAtom);
  const activeWorkspaceId = useAtomValue(activeWorkspaceIdAtom);

  // Filter variables by workspace
  const variables = allVariables.filter((v) => {
    if (v.workspaceId) {
      return v.workspaceId === activeWorkspaceId;
    }
    return activeWorkspaceId === "default";
  });

  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editKey, setEditKey] = useState("");
  const [editValue, setEditValue] = useState("");

  const updateVariables = (newWorkspaceVariables: Variable[]) => {
    const otherVariables = allVariables.filter((v) => {
      if (v.workspaceId) {
        return v.workspaceId !== activeWorkspaceId;
      }
      return activeWorkspaceId !== "default";
    });
    setAllVariables([...otherVariables, ...newWorkspaceVariables]);
  };

  const handleAddVariable = () => {
    if (!newKey.trim() || !newValue.trim()) return;

    const newVariable: Variable = {
      id: nanoid(),
      key: newKey.trim(),
      value: newValue.trim(),
      enabled: true,
      workspaceId: activeWorkspaceId,
    };

    updateVariables([...variables, newVariable]);
    setNewKey("");
    setNewValue("");
  };

  const handleDeleteVariable = (id: string) => {
    updateVariables(variables.filter((v) => v.id !== id));
  };

  const handleToggleVariable = (id: string) => {
    updateVariables(
      variables.map((v) => (v.id === id ? { ...v, enabled: !v.enabled } : v)),
    );
  };

  const handleStartEdit = (variable: Variable) => {
    setEditingId(variable.id);
    setEditKey(variable.key);
    setEditValue(variable.value);
  };

  const handleSaveEdit = () => {
    if (!editingId || !editKey.trim() || !editValue.trim()) return;

    updateVariables(
      variables.map((v) =>
        v.id === editingId
          ? { ...v, key: editKey.trim(), value: editValue.trim() }
          : v,
      ),
    );
    setEditingId(null);
    setEditKey("");
    setEditValue("");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditKey("");
    setEditValue("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Variables</DialogTitle>
          <DialogDescription>
            Manage global variables. Use [[variableName]] syntax in URLs,
            headers, params, and request bodies.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Enabled</TableHead>
                <TableHead className="w-1/3">Variable Name</TableHead>
                <TableHead className="w-1/2">Value</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {variables.map((variable) => (
                <TableRow key={variable.id}>
                  <TableCell>
                    <Checkbox
                      checked={variable.enabled !== false}
                      onCheckedChange={() => handleToggleVariable(variable.id)}
                    />
                  </TableCell>
                  {editingId === variable.id ? (
                    <>
                      <TableCell>
                        <Input
                          value={editKey}
                          onChange={(e) => setEditKey(e.target.value)}
                          placeholder="Variable name"
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          placeholder="Value"
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={handleSaveEdit}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={handleCancelEdit}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell
                        className="font-mono text-sm cursor-pointer"
                        onClick={() => handleStartEdit(variable)}
                      >
                        {variable.key}
                      </TableCell>
                      <TableCell
                        className="font-mono text-sm cursor-pointer truncate max-w-xs"
                        onClick={() => handleStartEdit(variable)}
                      >
                        {variable.value}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleDeleteVariable(variable.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))}

              {/* Add new variable row */}
              <TableRow>
                <TableCell>
                  <Checkbox checked disabled />
                </TableCell>
                <TableCell>
                  <Input
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    placeholder="Variable name"
                    className="h-8"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddVariable();
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    placeholder="Value"
                    className="h-8"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddVariable();
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleAddVariable}
                    disabled={!newKey.trim() || !newValue.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
