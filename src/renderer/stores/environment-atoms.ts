// Environment-related state atoms

import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { Environment } from '@/types';
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
export const currentEnvironmentAtom = atom((get) => {
  const environments = get(environmentsAtom);
  const selectedId = get(selectedEnvironmentIdAtom);
  return environments.find((e) => e.id === selectedId) ?? null;
});

// Helper: Resolve variables in string
export const resolveVariablesAtom = atom(
  null,
  (get, _set, text: string): string => {
    const environment = get(currentEnvironmentAtom);
    if (!environment) return text;

    return text.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      return environment.variables[key] ?? `{{${key}}}`;
    });
  }
);
