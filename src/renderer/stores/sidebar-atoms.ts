// Sidebar-related state atoms

import { atomWithStorage } from "jotai/utils";
import { electronStorage } from "@/lib/adapters/electron-storage";

// Sidebar width persisted to disk (as percentage)
export const sidebarWidthAtom = atomWithStorage<number>(
  "sidebar-width",
  20, // default 20% width
  electronStorage<number>(),
  { getOnInit: true },
);
