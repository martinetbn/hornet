// Environment-related state atoms

import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import type { Environment, Variable } from '@/types';
import { electronStorage } from '@/lib/adapters/electron-storage';

// Global variables persisted to disk
export const variablesAtom = atomWithStorage<Variable[]>(
  'variables',
  [],
  electronStorage<Variable[]>(),
  { getOnInit: true }
);

// Helper: Resolve variables in string using [[variableName]] format
export const resolveVariablesAtom = atom(
  null,
  async (get, _set, text: string): Promise<string> => {
    const variables = await get(variablesAtom);
    if (!variables || variables.length === 0) return text;

    return text.replace(/\[\[(\w+)\]\]/g, (match, key) => {
      const variable = variables.find((v: Variable) => v.key === key && v.enabled !== false);
      return variable ? variable.value : match;
    });
  }
);
