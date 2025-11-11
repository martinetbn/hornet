// Environment-related state atoms

import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import type { Environment } from '@/types';
import { electronStorage } from '@/lib/adapters/electron-storage';

// Environments persisted to disk
export const environmentsAtom = atomWithStorage<Environment[]>(
  'environments',
  [],
  electronStorage<Environment[]>(),
  { getOnInit: true }
);

// Selected environment ID
export const selectedEnvironmentIdAtom = atomWithStorage<string | null>(
  'selected-environment',
  null,
  electronStorage<string | null>(),
  { getOnInit: true }
);

// Derived: Current environment
export const currentEnvironmentAtom = atom(async (get) => {
  const environments = await get(environmentsAtom);
  const selectedId = await get(selectedEnvironmentIdAtom);
  return environments.find((e: Environment) => e.id === selectedId) ?? null;
});

// Helper: Resolve variables in string
export const resolveVariablesAtom = atom(
  null,
  async (get, _set, text: string): Promise<string> => {
    const environment = await get(currentEnvironmentAtom);
    if (!environment) return text;

    return text.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      return environment.variables[key] ?? `{{${key}}}`;
    });
  }
);
