import { atom } from "jotai";
import { atomWithStorage, loadable } from "jotai/utils";
import { nanoid } from "nanoid";
import { electronStorage } from "@/lib/adapters/electron-storage";
import type { Workspace } from "@/types/workspace";

// Default workspace
const defaultWorkspace: Workspace = {
  id: "default",
  name: "Workspace",
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

// Workspaces list persisted to disk
// Note: We use a wrapper to handle the initial render without suspending
const baseWorkspacesAtom = atomWithStorage<Workspace[]>(
  "workspaces",
  [defaultWorkspace],
  electronStorage<Workspace[]>(),
  { getOnInit: true },
);

const loadableBaseWorkspacesAtom = loadable(baseWorkspacesAtom);

export const workspacesAtom = atom(
  (get) => {
    const loadableState = get(loadableBaseWorkspacesAtom);

    if (
      loadableState.state === "hasData" &&
      Array.isArray(loadableState.data)
    ) {
      return loadableState.data;
    }

    // Loading or Error -> return default workspace
    return [defaultWorkspace];
  },
  (get, set, update) => set(baseWorkspacesAtom, update),
);

// Active workspace ID persisted to disk
const baseActiveWorkspaceIdAtom = atomWithStorage<string>(
  "activeWorkspaceId",
  defaultWorkspace.id,
  electronStorage<string>(),
  { getOnInit: true },
);

const loadableBaseActiveWorkspaceIdAtom = loadable(baseActiveWorkspaceIdAtom);

export const activeWorkspaceIdAtom = atom(
  (get) => {
    const loadableState = get(loadableBaseActiveWorkspaceIdAtom);

    if (
      loadableState.state === "hasData" &&
      typeof loadableState.data === "string"
    ) {
      return loadableState.data;
    }

    // Loading or Error -> return default ID
    return defaultWorkspace.id;
  },
  (get, set, update) => set(baseActiveWorkspaceIdAtom, update),
);

// Derived: Active workspace object
export const activeWorkspaceAtom = atom((get) => {
  const workspaces = get(workspacesAtom);
  const activeId = get(activeWorkspaceIdAtom);

  return workspaces.find((w) => w.id === activeId) || defaultWorkspace;
});

// Action: Create workspace
export const createWorkspaceAtom = atom(
  null,
  async (get, set, name: string) => {
    let workspaces = get(baseWorkspacesAtom);

    // Handle async storage case
    if (workspaces instanceof Promise) {
      workspaces = await workspaces;
    }

    if (!Array.isArray(workspaces)) {
      workspaces = [defaultWorkspace];
    }

    const newWorkspace: Workspace = {
      id: nanoid(),
      name,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    set(baseWorkspacesAtom, [...workspaces, newWorkspace]);
    set(baseActiveWorkspaceIdAtom, newWorkspace.id);
    return newWorkspace;
  },
);

// Action: Update workspace
export const updateWorkspaceAtom = atom(
  null,
  async (get, set, { id, name }: { id: string; name: string }) => {
    let workspaces = get(baseWorkspacesAtom);

    // Handle async storage case
    if (workspaces instanceof Promise) {
      workspaces = await workspaces;
    }

    if (!Array.isArray(workspaces)) return;

    const updatedWorkspaces = workspaces.map((w) =>
      w.id === id ? { ...w, name, updatedAt: Date.now() } : w,
    );
    set(baseWorkspacesAtom, updatedWorkspaces);
  },
);

// Action: Delete workspace
export const deleteWorkspaceAtom = atom(null, async (get, set, id: string) => {
  let workspaces = get(baseWorkspacesAtom);

  // Handle async storage case
  if (workspaces instanceof Promise) {
    workspaces = await workspaces;
  }

  if (!Array.isArray(workspaces)) return;

  // Prevent deleting the last workspace
  if (workspaces.length <= 1) return;

  const updatedWorkspaces = workspaces.filter((w) => w.id !== id);
  set(baseWorkspacesAtom, updatedWorkspaces);

  // If deleting active workspace, switch to another one
  const activeId = get(baseActiveWorkspaceIdAtom);

  // Handle async storage case for activeId
  let currentActiveId = activeId;
  if (currentActiveId instanceof Promise) {
    currentActiveId = await currentActiveId;
  }

  if (id === currentActiveId) {
    const nextId = updatedWorkspaces[0].id;
    set(baseActiveWorkspaceIdAtom, nextId);
  }
});
