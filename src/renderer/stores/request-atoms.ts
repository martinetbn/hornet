// Request-related state atoms

import { atom } from 'jotai';
import type { HttpRequest } from '@/types';

// Current request being edited/viewed
export const currentRequestAtom = atom<HttpRequest | null>(null);

// Request loading state
export const requestLoadingAtom = atom(false);

// Request error state
export const requestErrorAtom = atom<Error | null>(null);

// Derived: Is request valid?
export const isRequestValidAtom = atom((get) => {
  const request = get(currentRequestAtom);
  if (!request) return false;

  // Basic validation - must have URL and method
  return request.url.length > 0 && request.method !== undefined;
});
