import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { electronStorage } from "@/lib/adapters/electron-storage";
import type { CollectionFolder, Tab, CollectionItem } from "@/types/collection";
import type { HttpRequest } from "@/types/request";
import type { HttpMethod } from "@/types/common";

// Legacy RequestConfig for backward compatibility during migration
interface LegacyRequestConfig {
  id: string;
  name: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  url: string;
  headers?: Record<string, string>;
  body?: string;
  params?: Record<string, string>;
}

// Migration function to convert legacy RequestConfig to HttpRequest
export const migrateRequestConfig = (
  legacy: LegacyRequestConfig,
): HttpRequest => {
  const now = Date.now();
  return {
    id: legacy.id,
    name: legacy.name,
    protocol: "http" as const,
    method: legacy.method as HttpMethod,
    url: legacy.url,
    headers: legacy.headers
      ? Object.entries(legacy.headers).map(([key, value]) => ({
          key,
          value,
          enabled: true,
        }))
      : undefined,
    params: legacy.params
      ? Object.entries(legacy.params).map(([key, value]) => ({
          key,
          value,
          enabled: true,
        }))
      : undefined,
    body: legacy.body
      ? {
          type: "json" as const,
          content: legacy.body,
        }
      : undefined,
    createdAt: now,
    updatedAt: now,
  };
};

// Helper to check if an item is a legacy RequestConfig
const isLegacyRequest = (item: any): item is LegacyRequestConfig => {
  return (
    item &&
    typeof item === "object" &&
    "id" in item &&
    "name" in item &&
    "method" in item &&
    "url" in item &&
    !("protocol" in item)
  );
};

// Helper to migrate collections
const migrateCollections = (collections: any[]): CollectionItem[] => {
  return collections.map((item) => {
    if (item.type === "folder") {
      return {
        ...item,
        children: migrateCollectionItems(item.children || []),
      };
    }
    return isLegacyRequest(item) ? migrateRequestConfig(item) : item;
  }) as CollectionItem[];
};

// Helper to migrate collection items
const migrateCollectionItems = (items: any[]): CollectionItem[] => {
  return items.map((item) => {
    if (item.type === "folder") {
      return {
        ...item,
        children: migrateCollectionItems(item.children || []),
      };
    }
    return isLegacyRequest(item) ? migrateRequestConfig(item) : item;
  });
};

// Re-export types for convenience
export type { CollectionFolder, Tab, CollectionItem, HttpRequest };

// Create a migrating storage wrapper that applies migration on read
const migratingCollectionStorage = (): ReturnType<
  typeof electronStorage<CollectionItem[]>
> => {
  const baseStorage = electronStorage<CollectionItem[]>();

  return {
    ...baseStorage,
    getItem: async (
      key: string,
      initialValue: CollectionItem[],
    ): Promise<CollectionItem[]> => {
      const value = await baseStorage.getItem(key, initialValue);
      // Apply migration to convert legacy requests to HttpRequest
      return migrateCollections(value);
    },
  };
};

// Persistent atom for collections using Electron storage with migration
export const collectionsAtom = atomWithStorage<CollectionItem[]>(
  "collections",
  [],
  migratingCollectionStorage(),
  { getOnInit: true },
);

// Atom for tabs (not persisted, as tabs are session-specific)
export const tabsAtom = atom<Tab[]>([]);

// Atom for active tab ID
export const activeTabIdAtom = atom<string | null>(null);

// Helper function to generate unique IDs
export const generateId = () =>
  `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
