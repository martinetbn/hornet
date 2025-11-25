// Environment-related state atoms

import { atom } from 'jotai';
import { atomWithStorage, loadable } from 'jotai/utils';
import type { Environment, Variable } from '@/types';
import { electronStorage } from '@/lib/adapters/electron-storage';
import { activeWorkspaceIdAtom } from '@/stores/workspace-atoms';

// Global variables persisted to disk
export const variablesAtom = atomWithStorage<Variable[]>(
  'variables',
  [],
  electronStorage<Variable[]>(),
  { getOnInit: true }
);

const loadableVariablesAtom = loadable(variablesAtom);

// Derived: Get variables filtered by active workspace
// This atom should be used by consumers instead of variablesAtom directly
export const activeWorkspaceVariablesAtom = atom((get) => {
  const loadableVariables = get(loadableVariablesAtom);
  const activeWorkspaceId = get(activeWorkspaceIdAtom);

  // Handle initial async loading state
  if (loadableVariables.state !== 'hasData' || !Array.isArray(loadableVariables.data)) {
    return [];
  }

  const variables = loadableVariables.data;

  // Filter variables by workspace
  return variables.filter((v: Variable) => {
    // If variable has workspaceId, match it
    if (v.workspaceId) {
      return v.workspaceId === activeWorkspaceId;
    }
    // Legacy variables (no workspaceId) belong to default workspace
    return activeWorkspaceId === 'default';
  });
});

// Helper: Resolve variables in string using [[variableName]] format
export const resolveVariablesAtom = atom(
  null,
  async (get, _set, text: string): Promise<string> => {
    const variables = get(activeWorkspaceVariablesAtom);

    if (!variables || variables.length === 0) return text;

    return text.replace(/\[\[(\w+)\]\]/g, (match, key) => {
      const variable = variables.find((v: Variable) => v.key === key && v.enabled !== false);
      return variable ? variable.value : match;
    });
  }
);
