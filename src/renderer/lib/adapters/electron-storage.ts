import type { AsyncStorage } from "jotai/vanilla/utils/atomWithStorage";

/**
 * Custom storage adapter for Jotai that uses Electron's IPC for persistence
 */
export const electronStorage = <T>(): AsyncStorage<T> => ({
  getItem: async (key: string, initialValue: T): Promise<T> => {
    try {
      const value = await window.electronAPI.storage.get(key);
      return value !== null && value !== undefined ? value : initialValue;
    } catch (error) {
      console.error("Error getting item from storage:", error);
      return initialValue;
    }
  },

  setItem: async (key: string, value: T): Promise<void> => {
    try {
      await window.electronAPI.storage.set(key, value);
    } catch (error) {
      console.error("Error setting item in storage:", error);
    }
  },

  removeItem: async (key: string): Promise<void> => {
    try {
      await window.electronAPI.storage.delete(key);
    } catch (error) {
      console.error("Error removing item from storage:", error);
    }
  },
});
