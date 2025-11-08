# Directory Structure

## Project Overview

```
hornet/
├── src/
│   ├── main.ts                 # Electron main process
│   ├── preload.ts             # Electron preload script (IPC bridge)
│   └── renderer/              # React application
│       ├── app.tsx            # App entry point
│       ├── index.html         # HTML template
│       ├── styles.css         # Tailwind CSS imports
│       │
│       ├── components/        # Reusable UI components
│       │   ├── ui/           # Primitive components
│       │   │   ├── button.tsx
│       │   │   ├── input.tsx
│       │   │   ├── dropdown.tsx
│       │   │   ├── tabs.tsx
│       │   │   ├── modal.tsx
│       │   │   └── toast.tsx
│       │   │
│       │   └── layout/       # Layout components
│       │       ├── sidebar.tsx
│       │       ├── header.tsx
│       │       ├── panel.tsx
│       │       └── split-pane.tsx
│       │
│       ├── features/          # Feature modules (domain-driven)
│       │   │
│       │   ├── requests/      # Request management
│       │   │   ├── components/
│       │   │   │   ├── request-builder.tsx
│       │   │   │   ├── request-list.tsx
│       │   │   │   ├── request-item.tsx
│       │   │   │   ├── url-input.tsx
│       │   │   │   ├── headers-editor.tsx
│       │   │   │   ├── body-editor.tsx
│       │   │   │   └── params-editor.tsx
│       │   │   ├── hooks/
│       │   │   │   ├── use-request.ts
│       │   │   │   └── use-request-history.ts
│       │   │   └── types.ts
│       │   │
│       │   ├── responses/     # Response viewing
│       │   │   ├── components/
│       │   │   │   ├── response-viewer.tsx
│       │   │   │   ├── response-tabs.tsx
│       │   │   │   ├── response-body.tsx
│       │   │   │   ├── response-headers.tsx
│       │   │   │   └── response-metadata.tsx
│       │   │   └── hooks/
│       │   │       └── use-response-formatter.ts
│       │   │
│       │   ├── collections/   # Collection management
│       │   │   ├── components/
│       │   │   │   ├── collection-tree.tsx
│       │   │   │   ├── collection-item.tsx
│       │   │   │   ├── folder-item.tsx
│       │   │   │   └── collection-dialog.tsx
│       │   │   ├── hooks/
│       │   │   │   ├── use-collection.ts
│       │   │   │   └── use-collection-import.ts
│       │   │   └── types.ts
│       │   │
│       │   ├── environments/  # Environment variables
│       │   │   ├── components/
│       │   │   │   ├── environment-selector.tsx
│       │   │   │   ├── environment-editor.tsx
│       │   │   │   └── variable-table.tsx
│       │   │   ├── hooks/
│       │   │   │   ├── use-environment.ts
│       │   │   │   └── use-variable-resolver.ts
│       │   │   └── types.ts
│       │   │
│       │   ├── connections/   # WebSocket/Socket.IO/gRPC connections
│       │   │   ├── components/
│       │   │   │   ├── connection-panel.tsx
│       │   │   │   ├── message-list.tsx
│       │   │   │   ├── message-composer.tsx
│       │   │   │   └── connection-status.tsx
│       │   │   ├── hooks/
│       │   │   │   ├── use-connection.ts
│       │   │   │   └── use-message-history.ts
│       │   │   └── types.ts
│       │   │
│       │   ├── auth/          # Authentication
│       │   │   ├── components/
│       │   │   │   ├── auth-selector.tsx
│       │   │   │   ├── basic-auth.tsx
│       │   │   │   ├── bearer-token.tsx
│       │   │   │   └── oauth2-config.tsx
│       │   │   └── types.ts
│       │   │
│       │   └── settings/      # App settings
│       │       ├── components/
│       │       │   ├── settings-dialog.tsx
│       │       │   ├── theme-selector.tsx
│       │       │   └── preferences-form.tsx
│       │       └── hooks/
│       │           └── use-settings.ts
│       │
│       ├── lib/               # Shared utilities and business logic
│       │   │
│       │   ├── adapters/      # Protocol adapters
│       │   │   ├── index.ts
│       │   │   ├── base.ts
│       │   │   ├── http-adapter.ts
│       │   │   ├── websocket-adapter.ts
│       │   │   ├── socketio-adapter.ts
│       │   │   └── grpc-adapter.ts
│       │   │
│       │   ├── hooks/         # Shared hooks
│       │   │   ├── use-local-storage.ts
│       │   │   ├── use-debounce.ts
│       │   │   ├── use-keyboard-shortcut.ts
│       │   │   └── use-copy-to-clipboard.ts
│       │   │
│       │   ├── utils/         # Utility functions
│       │   │   ├── request-utils.ts
│       │   │   ├── response-utils.ts
│       │   │   ├── format-utils.ts
│       │   │   ├── validation-utils.ts
│       │   │   └── export-utils.ts
│       │   │
│       │   └── storage/       # Persistence layer
│       │       ├── index.ts
│       │       ├── collections-storage.ts
│       │       ├── environments-storage.ts
│       │       ├── history-storage.ts
│       │       └── settings-storage.ts
│       │
│       ├── stores/            # Jotai atoms (state management)
│       │   ├── index.ts
│       │   ├── request-atoms.ts
│       │   ├── response-atoms.ts
│       │   ├── collection-atoms.ts
│       │   ├── environment-atoms.ts
│       │   ├── connection-atoms.ts
│       │   ├── history-atoms.ts
│       │   └── settings-atoms.ts
│       │
│       └── types/             # TypeScript type definitions
│           ├── index.ts
│           ├── request.ts
│           ├── response.ts
│           ├── collection.ts
│           ├── environment.ts
│           ├── connection.ts
│           ├── protocol.ts
│           └── common.ts
│
├── docs/                      # Documentation
│   ├── ARCHITECTURE.md
│   ├── DIRECTORY_STRUCTURE.md
│   ├── STATE_MANAGEMENT.md
│   ├── PROTOCOL_ADAPTERS.md
│   ├── DEVELOPMENT_GUIDE.md
│   └── API_REFERENCE.md
│
├── dist/                      # Build output (gitignored)
├── release/                   # Packaged apps (gitignored)
├── node_modules/              # Dependencies (gitignored)
│
├── package.json
├── tsconfig.json
├── postcss.config.js
├── CLAUDE.md                  # Project-specific AI instructions
└── README.md
```

## Directory Conventions

### `/src/main.ts`
Electron main process - manages windows, menus, system integration.

### `/src/preload.ts`
Secure bridge between main and renderer processes using contextBridge.

### `/src/renderer/`
The React application that runs in the Electron renderer process.

### `/src/renderer/components/`
**Reusable, generic UI components** that are not tied to specific features.

- `ui/` - Primitive components (buttons, inputs, dropdowns)
- `layout/` - Layout components (sidebar, header, panels)

**Naming convention**: kebab-case files, PascalCase components
**Example**: `button.tsx` exports `Button` component

### `/src/renderer/features/`
**Feature modules organized by domain** - each feature is self-contained.

Each feature folder contains:
- `components/` - Feature-specific components
- `hooks/` - Feature-specific custom hooks
- `types.ts` - Feature-specific types

**Why this structure?**
- Features are isolated and easy to understand
- Easy to find all code related to a feature
- Supports future code splitting

### `/src/renderer/lib/`
**Shared business logic and utilities** used across features.

#### `adapters/`
Protocol-specific implementations. Each adapter:
- Implements a common interface
- Handles protocol-specific details
- Returns standardized responses

#### `hooks/`
Generic React hooks that can be used anywhere.

#### `utils/`
Pure utility functions with no React dependencies.

#### `storage/`
Persistence layer - handles reading/writing data to disk.

### `/src/renderer/stores/`
**Jotai atoms** for global state management.

Each file exports related atoms:
```typescript
// request-atoms.ts
export const currentRequestAtom = atom<Request | null>(null);
export const requestLoadingAtom = atom<boolean>(false);
```

**Why Jotai?**
- Atomic, composable state
- No boilerplate
- Excellent TypeScript support
- Great for modular architecture

### `/src/renderer/types/`
**Centralized TypeScript types** used across the application.

- Keep types close to data shape
- Export from `index.ts` for easy imports
- Document complex types with JSDoc

### `/docs/`
**Project documentation** - architecture, guides, reference.

## File Naming Conventions

### Components
- **Files**: `kebab-case.tsx`
- **Exports**: `PascalCase`
- Example: `request-builder.tsx` → `export function RequestBuilder()`

### Hooks
- **Files**: `use-feature-name.ts`
- **Exports**: `useCamelCase`
- Example: `use-request.ts` → `export function useRequest()`

### Utilities
- **Files**: `feature-utils.ts`
- **Exports**: `camelCase`
- Example: `format-utils.ts` → `export function formatJson()`

### Types
- **Files**: `feature.ts`
- **Exports**: `PascalCase`
- Example: `request.ts` → `export interface Request`

### Stores
- **Files**: `feature-atoms.ts`
- **Exports**: `camelCaseAtom`
- Example: `request-atoms.ts` → `export const currentRequestAtom`

## Import Conventions

### Path Aliases (configure in tsconfig.json)
```typescript
// Instead of: import { Button } from '../../../components/ui/button'
import { Button } from '@/components/ui/button';
import { useRequest } from '@/features/requests/hooks/use-request';
import { Request } from '@/types';
import { currentRequestAtom } from '@/stores';
```

### Import Order
1. External dependencies
2. Internal absolute imports (@/...)
3. Relative imports (../)
4. Type imports

```typescript
import { useState } from 'react';
import { useAtom } from 'jotai';

import { Button } from '@/components/ui/button';
import { Request } from '@/types';
import { currentRequestAtom } from '@/stores';

import { RequestHeader } from './request-header';
```

## Adding New Features

### Example: Adding "Code Generation" Feature

1. Create feature folder:
   ```
   src/renderer/features/code-generation/
   ├── components/
   │   ├── code-generator.tsx
   │   └── language-selector.tsx
   ├── hooks/
   │   └── use-code-generator.ts
   └── types.ts
   ```

2. Add types if needed:
   ```
   src/renderer/types/code-generation.ts
   ```

3. Add state if needed:
   ```
   src/renderer/stores/code-generation-atoms.ts
   ```

4. Import and use in app:
   ```typescript
   import { CodeGenerator } from '@/features/code-generation/components/code-generator';
   ```

## Best Practices

1. **Keep features isolated** - minimize cross-feature dependencies
2. **Use absolute imports** - avoid deep relative paths
3. **Colocate related code** - keep components, hooks, and types together
4. **Export from index** - make imports cleaner
5. **Document public APIs** - add JSDoc to exported functions
