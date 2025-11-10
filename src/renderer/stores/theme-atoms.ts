// Theme-related state atoms

import { atomWithStorage } from 'jotai/utils';
import { atom } from 'jotai';
import { electronStorage } from '@/lib/adapters/electron-storage';

export type ThemePreference = 'light' | 'dark' | 'system';
export type Theme = 'light' | 'dark';

// Detect system preference
export const getSystemTheme = (): Theme => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
};

// Theme preference persisted to disk
export const themePreferenceAtom = atomWithStorage<ThemePreference>(
  'theme',
  'system',
  electronStorage<ThemePreference>(),
  { getOnInit: true }
);

// Computed atom that resolves the actual theme based on preference
export const themeAtom = atom<Theme>((get) => {
  const preference = get(themePreferenceAtom);
  if (preference === 'system') {
    return getSystemTheme();
  }
  return preference;
});
