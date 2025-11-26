# State Management with Jotai

## Overview

Hornet uses [Jotai](https://jotai.org/) for state management. Jotai provides atomic, composable state that integrates seamlessly with React.

## Why Jotai?

1. **Minimal Boilerplate**: No reducers, actions, or context providers
2. **Atomic State**: Each piece of state is independent
3. **Derived State**: Easy to compute derived values
4. **TypeScript Native**: Excellent type inference
5. **Performance**: Only components using specific atoms re-render
6. **DevTools**: Great debugging experience

## Core Concepts

### Atoms

An atom is a piece of state. Think of it as a `useState` that can be shared across components.

```typescript
import { atom } from "jotai";

// Primitive atom
export const countAtom = atom(0);

// Type-safe atom
export const currentRequestAtom = atom<Request | null>(null);

// Derived atom (read-only)
export const requestCountAtom = atom((get) => {
  const requests = get(requestsAtom);
  return requests.length;
});

// Derived atom (read-write)
export const uppercaseAtom = atom(
  (get) => get(textAtom).toUpperCase(),
  (get, set, newValue: string) => {
    set(textAtom, newValue.toUpperCase());
  },
);
```

### Using Atoms in Components

```typescript
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { currentRequestAtom } from '@/stores';

function RequestBuilder() {
  // Read and write
  const [request, setRequest] = useAtom(currentRequestAtom);

  // Read only (optimized)
  const request = useAtomValue(currentRequestAtom);

  // Write only (optimized)
  const setRequest = useSetAtom(currentRequestAtom);

  return <div>{request?.name}</div>;
}
```

## Atom Organization

### File Structure

Each domain has its own atom file in `/src/renderer/stores/`:

```
stores/
├── index.ts              # Re-exports all atoms
├── request-atoms.ts      # Request-related state
├── response-atoms.ts     # Response-related state
├── collection-atoms.ts   # Collection-related state
├── environment-atoms.ts  # Environment-related state
├── connection-atoms.ts   # Connection-related state
├── history-atoms.ts      # History-related state
└── settings-atoms.ts     # Settings-related state
```

### Atom Naming Convention

```typescript
// Primitive state: featureAtom
export const requestAtom = atom<Request | null>(null);

// List state: featurePluralAtom
export const requestsAtom = atom<Request[]>([]);

// Derived state: derivedFeatureAtom
export const activeRequestAtom = atom((get) => {
  // ... derived logic
});

// Boolean state: isFeatureAtom or hasFeatureAtom
export const isLoadingAtom = atom(false);
export const hasErrorAtom = atom(false);
```

## State Patterns

### 1. Request State Pattern

```typescript
// stores/request-atoms.ts
import { atom } from "jotai";
import { Request } from "@/types";

// Current request being edited
export const currentRequestAtom = atom<Request | null>(null);

// Request loading state
export const requestLoadingAtom = atom(false);

// Request error state
export const requestErrorAtom = atom<Error | null>(null);

// Derived: Is request valid?
export const isRequestValidAtom = atom((get) => {
  const request = get(currentRequestAtom);
  if (!request) return false;

  // Validation logic
  return request.url.length > 0 && request.method !== undefined;
});
```

**Usage:**

```typescript
function RequestBuilder() {
  const [request, setRequest] = useAtom(currentRequestAtom);
  const isValid = useAtomValue(isRequestValidAtom);
  const setLoading = useSetAtom(requestLoadingAtom);

  const handleSend = async () => {
    if (!isValid) return;
    setLoading(true);
    // ... send request
    setLoading(false);
  };
}
```

### 2. Collection State Pattern

```typescript
// stores/collection-atoms.ts
import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { Collection } from "@/types";

// Collections persisted to disk
export const collectionsAtom = atomWithStorage<Collection[]>("collections", []);

// Currently selected collection
export const selectedCollectionIdAtom = atom<string | null>(null);

// Derived: Selected collection object
export const selectedCollectionAtom = atom((get) => {
  const collections = get(collectionsAtom);
  const selectedId = get(selectedCollectionIdAtom);
  return collections.find((c) => c.id === selectedId) ?? null;
});

// Derived: Requests in selected collection
export const collectionRequestsAtom = atom((get) => {
  const collection = get(selectedCollectionAtom);
  return collection?.requests ?? [];
});
```

### 3. Async State Pattern

```typescript
// stores/response-atoms.ts
import { atom } from 'jotai';
import { loadable } from 'jotai/utils';

// Async atom for fetching response
export const fetchResponseAtom = atom(async (get) => {
  const request = get(currentRequestAtom);
  if (!request) return null;

  const response = await fetch(request.url, {
    method: request.method,
    headers: request.headers,
    body: request.body,
  });

  return response;
});

// Loadable version (includes loading state)
export const loadableResponseAtom = loadable(fetchResponseAtom);

// Usage in component:
function ResponseViewer() {
  const response = useAtomValue(loadableResponseAtom);

  if (response.state === 'loading') return <Spinner />;
  if (response.state === 'hasError') return <Error error={response.error} />;
  if (response.state === 'hasData') return <Response data={response.data} />;
}
```

### 4. Connection State Pattern (WebSocket/Socket.IO)

```typescript
// stores/connection-atoms.ts
import { atom } from "jotai";
import { Connection, Message } from "@/types";

// Map of active connections
export const connectionsAtom = atom<Map<string, Connection>>(new Map());

// Messages grouped by connection ID
export const messagesAtom = atom<Map<string, Message[]>>(new Map());

// Selected connection
export const selectedConnectionIdAtom = atom<string | null>(null);

// Derived: Messages for selected connection
export const currentConnectionMessagesAtom = atom((get) => {
  const connectionId = get(selectedConnectionIdAtom);
  if (!connectionId) return [];

  const messages = get(messagesAtom);
  return messages.get(connectionId) ?? [];
});

// Write-only: Add message to connection
export const addMessageAtom = atom(
  null,
  (
    get,
    set,
    { connectionId, message }: { connectionId: string; message: Message },
  ) => {
    const messages = new Map(get(messagesAtom));
    const connectionMessages = messages.get(connectionId) ?? [];
    messages.set(connectionId, [...connectionMessages, message]);
    set(messagesAtom, messages);
  },
);
```

### 5. Environment Variables Pattern

```typescript
// stores/environment-atoms.ts
import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

export const environmentsAtom = atomWithStorage("environments", [
  { id: "dev", name: "Development", variables: {} },
  { id: "prod", name: "Production", variables: {} },
]);

export const selectedEnvironmentIdAtom = atomWithStorage<string | null>(
  "selected-environment",
  null,
);

// Derived: Current environment variables
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
  },
);
```

## Advanced Patterns

### Atom Families

For dynamic atom creation based on parameters:

```typescript
import { atomFamily } from "jotai/utils";

// Create an atom for each request ID
export const requestAtomFamily = atomFamily((requestId: string) =>
  atom<Request | null>(null),
);

// Usage:
function RequestDetail({ requestId }: { requestId: string }) {
  const [request, setRequest] = useAtom(requestAtomFamily(requestId));
}
```

### Atom with Persistence

```typescript
import { atomWithStorage } from "jotai/utils";

// Automatically persists to localStorage
export const settingsAtom = atomWithStorage("settings", {
  theme: "dark",
  fontSize: 14,
  autoSave: true,
});

// For Electron, create custom storage:
function createElectronStorage() {
  return {
    getItem: async (key: string) => {
      return await window.electronAPI.storage.get(key);
    },
    setItem: async (key: string, value: unknown) => {
      await window.electronAPI.storage.set(key, value);
    },
    removeItem: async (key: string) => {
      await window.electronAPI.storage.delete(key);
    },
  };
}

export const collectionsAtom = atomWithStorage(
  "collections",
  [],
  createElectronStorage(),
);
```

### Atom with Reducer

For complex state updates:

```typescript
import { atomWithReducer } from "jotai/utils";

type Action =
  | { type: "add"; request: Request }
  | { type: "remove"; id: string }
  | { type: "update"; id: string; updates: Partial<Request> };

function requestsReducer(state: Request[], action: Action): Request[] {
  switch (action.type) {
    case "add":
      return [...state, action.request];
    case "remove":
      return state.filter((r) => r.id !== action.id);
    case "update":
      return state.map((r) =>
        r.id === action.id ? { ...r, ...action.updates } : r,
      );
    default:
      return state;
  }
}

export const requestsAtom = atomWithReducer([], requestsReducer);

// Usage:
const [requests, dispatch] = useAtom(requestsAtom);
dispatch({ type: "add", request: newRequest });
```

## Testing Atoms

```typescript
import { renderHook, act } from "@testing-library/react";
import { useAtom } from "jotai";
import { currentRequestAtom } from "@/stores";

describe("currentRequestAtom", () => {
  it("should update request", () => {
    const { result } = renderHook(() => useAtom(currentRequestAtom));

    act(() => {
      const [, setRequest] = result.current;
      setRequest({ id: "1", name: "Test", method: "GET", url: "/api" });
    });

    const [request] = result.current;
    expect(request?.name).toBe("Test");
  });
});
```

## DevTools

Install Jotai DevTools for debugging:

```bash
bun install jotai-devtools
```

```typescript
import { DevTools } from 'jotai-devtools';

function App() {
  return (
    <>
      <DevTools />
      {/* Your app */}
    </>
  );
}
```

## Best Practices

### 1. Keep Atoms Focused

Each atom should represent one piece of state.

```typescript
// Good
const requestUrlAtom = atom("");
const requestMethodAtom = atom<HttpMethod>("GET");

// Less ideal (harder to optimize)
const requestAtom = atom({ url: "", method: "GET" });
```

### 2. Use Derived Atoms

Compute values instead of duplicating state.

```typescript
// Good
const fullNameAtom = atom((get) => {
  return `${get(firstNameAtom)} ${get(lastNameAtom)}`;
});

// Bad (duplicated state)
const firstNameAtom = atom("");
const lastNameAtom = atom("");
const fullNameAtom = atom(""); // needs manual syncing
```

### 3. Optimize Re-renders

Use `useAtomValue` for read-only and `useSetAtom` for write-only.

```typescript
// Optimized
const count = useAtomValue(countAtom); // Only re-renders on read
const setCount = useSetAtom(countAtom); // Never re-renders

// Less optimized
const [count, setCount] = useAtom(countAtom); // Re-renders even if only setting
```

### 4. Organize Related Atoms

Group related atoms in the same file and export together.

```typescript
// stores/request-atoms.ts
export const requestAtoms = {
  current: currentRequestAtom,
  loading: requestLoadingAtom,
  error: requestErrorAtom,
  isValid: isRequestValidAtom,
};
```

### 5. Document Complex Atoms

Add JSDoc comments for non-obvious behavior.

```typescript
/**
 * Resolves {{variable}} syntax in request URL using current environment.
 * Falls back to original text if variable not found.
 */
export const resolvedRequestUrlAtom = atom((get) => {
  // implementation
});
```

## Migration from Other State Libraries

### From Redux

```typescript
// Redux
const store = createStore(reducer);
store.dispatch({ type: "INCREMENT" });

// Jotai
const countAtom = atom(0);
const [count, setCount] = useAtom(countAtom);
setCount((c) => c + 1);
```

### From Context

```typescript
// Context
const ThemeContext = createContext("dark");
const theme = useContext(ThemeContext);

// Jotai
const themeAtom = atom("dark");
const theme = useAtomValue(themeAtom);
```

## Common Patterns

### Loading States

```typescript
const dataAtom = atom(null);
const loadingAtom = atom(false);
const errorAtom = atom(null);

// Or use loadable for automatic handling
const loadableDataAtom = loadable(asyncDataAtom);
```

### Undo/Redo

```typescript
import { atomWithUndo } from "jotai-history";

const requestAtom = atomWithUndo({ url: "", method: "GET" });

// Usage
const [request, setRequest, { undo, redo, canUndo, canRedo }] =
  useAtom(requestAtom);
```

### Sync with URL

```typescript
import { atomWithHash } from "jotai-location";

const tabAtom = atomWithHash("tab", "request", {
  serialize: String,
  deserialize: String,
});
```
