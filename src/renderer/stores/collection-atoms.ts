import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { electronStorage } from '@/lib/adapters/electron-storage';

// Type definitions for configuration
export interface RequestConfig {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  headers?: Record<string, string>;
  body?: string;
  params?: Record<string, string>;
}

export interface CollectionFolder {
  id: string;
  name: string;
  type: 'folder';
  children: (CollectionFolder | RequestConfig)[];
}

export interface Tab {
  id: string;
  name: string;
  path: string[];
  request: RequestConfig;
}

export type CollectionItem = CollectionFolder | RequestConfig;

// Persistent atom for collections using Electron storage
export const collectionsAtom = atomWithStorage<CollectionFolder[]>(
  'collections',
  [],
  electronStorage<CollectionFolder[]>(),
  { getOnInit: true }
);

// Atom for tabs (not persisted, as tabs are session-specific)
export const tabsAtom = atom<Tab[]>([]);

// Atom for active tab ID
export const activeTabIdAtom = atom<string | null>(null);

// Helper function to generate unique IDs
export const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
