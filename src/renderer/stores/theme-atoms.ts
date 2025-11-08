// Theme-related state atoms

import { atomWithStorage } from 'jotai/utils';
import { electronStorage } from '@/lib/adapters/electron-storage';

export type Theme = 'light' | 'dark';

// Detect system preference
const getSystemTheme = (): Theme => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
};

// Theme preference persisted to disk
export const themeAtom = atomWithStorage<Theme>(
  'theme',
  getSystemTheme(),
  electronStorage<Theme>(),
  { getOnInit: true }
);
