# Development Guide

## Getting Started

### Prerequisites

- **Bun** v1.3.1 or higher
- **Node.js** v20+ (for Electron)
- **Git**
- **Ubuntu/Linux** (recommended) or macOS/Windows

### Initial Setup

```bash
# Clone the repository
git clone <repository-url>
cd hornet

# Install dependencies
bun install

# Run development build
bun run dev
```

## Development Workflow

### Daily Development

```bash
# Start dev server with hot reload
bun run dev

# In a separate terminal, watch for file changes
bun run build --watch
```

### Project Scripts

```bash
# Development
bun run dev              # Build and launch Electron app

# Build
bun run build            # Build all components
bun run build:main       # Build main process only
bun run build:preload    # Build preload script only
bun run build:renderer   # Build renderer process only
bun run build:css        # Build CSS with PostCSS

# Package
bun run package          # Package for current platform
bun run package:linux    # Package for Linux
bun run package:mac      # Package for macOS
bun run package:win      # Package for Windows
bun run package:all      # Package for all platforms

# Testing (to be added)
bun test                 # Run all tests
bun test:watch           # Run tests in watch mode
bun test:coverage        # Generate coverage report
```

## Code Style

### TypeScript

Use TypeScript for all code. Follow these conventions:

```typescript
// Use explicit types for function parameters and return values
function sendRequest(request: Request): Promise<Response> {
  // ...
}

// Use interfaces for object shapes
interface User {
  id: string;
  name: string;
  email: string;
}

// Use type for unions and primitives
type RequestStatus = "pending" | "success" | "error";
type ID = string;

// Avoid 'any', use 'unknown' if type is truly unknown
function processData(data: unknown): void {
  if (typeof data === "string") {
    // Type narrowing
  }
}
```

### Component Structure

```typescript
import { useState } from 'react';
import { useAtom } from 'jotai';

import { Button } from '@/components/ui/button';
import { Request } from '@/types';
import { currentRequestAtom } from '@/stores';

interface RequestBuilderProps {
  onSubmit?: (request: Request) => void;
}

export function RequestBuilder({ onSubmit }: RequestBuilderProps) {
  // 1. Hooks (useState, useAtom, custom hooks)
  const [request, setRequest] = useAtom(currentRequestAtom);
  const [isValid, setIsValid] = useState(false);

  // 2. Derived values
  const canSubmit = isValid && request !== null;

  // 3. Event handlers
  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit?.(request);
  };

  // 4. Effects
  // useEffect(() => { ... }, []);

  // 5. Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

### Naming Conventions

```typescript
// Components: PascalCase
export function RequestBuilder() {}

// Functions: camelCase
function validateRequest() {}

// Constants: UPPER_SNAKE_CASE
const API_BASE_URL = "https://api.example.com";

// Interfaces/Types: PascalCase
interface Request {}
type RequestStatus = "pending" | "success";

// Atoms: camelCaseAtom
export const currentRequestAtom = atom(null);

// Booleans: is/has/should prefix
const isLoading = true;
const hasError = false;
const shouldRetry = false;

// Arrays: plural
const requests = [];
const users = [];

// Event handlers: handle prefix
const handleClick = () => {};
const handleSubmit = () => {};
```

## Git Workflow

### Branch Naming

```
feature/add-websocket-support
fix/response-viewer-crash
refactor/simplify-state-management
docs/update-architecture
chore/upgrade-dependencies
```

### Commit Messages

Follow conventional commits:

```
feat: add WebSocket connection support
fix: resolve crash when viewing large responses
refactor: simplify request state management
docs: update protocol adapter documentation
chore: upgrade React to v19
test: add tests for HTTP adapter
style: format code with prettier
perf: optimize response rendering
```

### Pull Request Process

1. Create feature branch from `main`
2. Make changes with clear commits
3. Update documentation if needed
4. Add tests for new features
5. Ensure all tests pass
6. Create PR with description of changes
7. Request review
8. Address feedback
9. Merge when approved

## Testing

### Unit Tests

```typescript
// src/renderer/lib/adapters/__tests__/http-adapter.test.ts

import { describe, it, expect } from "bun:test";
import { HttpAdapter } from "../http-adapter";

describe("HttpAdapter", () => {
  it("should make GET request", async () => {
    const adapter = new HttpAdapter();

    const response = await adapter.execute({
      method: "GET",
      url: "https://jsonplaceholder.typicode.com/posts/1",
      headers: {},
    });

    expect(response.status).toBe(200);
  });
});
```

### Component Tests

```typescript
// src/renderer/features/requests/__tests__/request-builder.test.tsx

import { describe, it, expect } from 'bun:test';
import { render, screen } from '@testing-library/react';
import { RequestBuilder } from '../components/request-builder';

describe('RequestBuilder', () => {
  it('should render URL input', () => {
    render(<RequestBuilder />);
    expect(screen.getByPlaceholderText(/enter url/i)).toBeInTheDocument();
  });
});
```

### Integration Tests

Test complete user workflows:

```typescript
it("should create and send HTTP request", async () => {
  // 1. Render app
  // 2. Fill in request details
  // 3. Click send
  // 4. Verify response appears
});
```

## Debugging

### VS Code Launch Configuration

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Main Process",
      "type": "node",
      "request": "launch",
      "cwd": "${workspaceFolder}",
      "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/electron",
      "args": ["."],
      "outputCapture": "std"
    },
    {
      "name": "Debug Renderer Process",
      "type": "chrome",
      "request": "attach",
      "port": 9222,
      "webRoot": "${workspaceFolder}/src/renderer"
    }
  ]
}
```

### Electron DevTools

```typescript
// src/main.ts

if (!app.isPackaged) {
  mainWindow.webContents.openDevTools();
}
```

### Console Logging

```typescript
// Main process
console.log("[Main]", "Message");

// Renderer process
console.log("[Renderer]", "Message");

// Use structured logging
console.log("[Renderer]", { event: "request_sent", duration: 123 });
```

### Jotai DevTools

```typescript
import { DevTools } from 'jotai-devtools';
import 'jotai-devtools/styles.css';

function App() {
  return (
    <>
      {import.meta.env.DEV && <DevTools />}
      {/* ... */}
    </>
  );
}
```

## Performance Optimization

### React Optimization

```typescript
// Memoize expensive computations
const formattedResponse = useMemo(() => {
  return JSON.stringify(response, null, 2);
}, [response]);

// Memoize components
const RequestItem = memo(function RequestItem({ request }: Props) {
  // ...
});

// Use callback refs for stable functions
const handleClick = useCallback(() => {
  // ...
}, [dependency]);
```

### Virtual Scrolling

For large lists, use virtual scrolling:

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

function RequestList({ requests }: { requests: Request[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: requests.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
  });

  return (
    <div ref={parentRef} style={{ height: '400px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map((item) => (
          <div key={item.key} style={{ transform: `translateY(${item.start}px)` }}>
            <RequestItem request={requests[item.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Code Splitting

```typescript
// Lazy load heavy components
const CodeEditor = lazy(() => import('./components/code-editor'));

function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <CodeEditor />
    </Suspense>
  );
}
```

## Common Tasks

### Adding a New Feature

1. **Plan the feature**
   - Define requirements
   - Sketch UI mockups
   - Design data flow

2. **Create types**

   ```typescript
   // src/renderer/types/my-feature.ts
   export interface MyFeature {
     id: string;
     name: string;
   }
   ```

3. **Create atoms**

   ```typescript
   // src/renderer/stores/my-feature-atoms.ts
   export const myFeatureAtom = atom<MyFeature | null>(null);
   ```

4. **Create components**

   ```typescript
   // src/renderer/features/my-feature/components/my-component.tsx
   export function MyComponent() {
     // ...
   }
   ```

5. **Add to app**

   ```typescript
   // src/renderer/app.tsx
   import { MyComponent } from "@/features/my-feature/components/my-component";
   ```

6. **Write tests**

   ```typescript
   // src/renderer/features/my-feature/__tests__/my-component.test.tsx
   describe("MyComponent", () => {
     // ...
   });
   ```

7. **Document**
   - Update relevant docs
   - Add JSDoc comments
   - Update README if needed

### Modifying Protocol Adapters

1. Open adapter file: `src/renderer/lib/adapters/protocol-adapter.ts`
2. Make changes
3. Update types if interface changed
4. Update tests
5. Test manually with real endpoints
6. Document changes

### Adding UI Components

1. **Primitive components** → `src/renderer/components/ui/`
2. **Layout components** → `src/renderer/components/layout/`
3. **Feature components** → `src/renderer/features/{feature}/components/`

### Working with Tailwind

```typescript
// Use Tailwind utility classes
<button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
  Send
</button>

// Conditional classes with clsx
import clsx from 'clsx';

<div className={clsx(
  'px-4 py-2',
  isActive && 'bg-blue-600',
  isDisabled && 'opacity-50 cursor-not-allowed'
)}>
```

## Troubleshooting

### Build Errors

**Problem**: `Module not found`
**Solution**: Check import paths, ensure file exists, try `bun install`

**Problem**: `TypeScript errors`
**Solution**: Check types, run `bun run tsc --noEmit` for details

### Runtime Errors

**Problem**: `Electron white screen`
**Solution**: Check DevTools console, verify HTML/JS paths

**Problem**: `State not updating`
**Solution**: Check atom dependencies, ensure mutations don't directly modify state

### Performance Issues

**Problem**: Slow rendering
**Solution**: Use React DevTools Profiler, add `memo`, optimize re-renders

**Problem**: High memory usage
**Solution**: Check for memory leaks, dispose adapters, clear old data

## Best Practices

### 1. Keep Components Small

Components should do one thing well. If a component is > 200 lines, consider splitting it.

### 2. Use TypeScript Strictly

Enable strict mode and fix all type errors. Don't use `any`.

### 3. Write Tests

Aim for >80% coverage on business logic and adapters.

### 4. Document Complex Code

Add JSDoc comments for non-obvious behavior:

```typescript
/**
 * Resolves environment variables in request URL.
 * Variables use {{varName}} syntax.
 *
 * @example
 * resolveUrl("{{baseUrl}}/users", { baseUrl: "https://api.com" })
 * // Returns: "https://api.com/users"
 */
export function resolveUrl(url: string, vars: Record<string, string>): string {
  // ...
}
```

### 5. Handle Errors Gracefully

Always handle errors and provide useful feedback:

```typescript
try {
  await sendRequest(request);
} catch (error) {
  if (error.code === "ECONNREFUSED") {
    showToast("Connection refused. Is the server running?", "error");
  } else {
    showToast(`Request failed: ${error.message}`, "error");
  }
}
```

### 6. Clean Up Resources

```typescript
useEffect(() => {
  const adapter = new WebSocketAdapter();
  adapter.connect(config);

  return () => {
    adapter.disconnect(); // Cleanup!
  };
}, [config]);
```

### 7. Use Semantic HTML

```typescript
// Good
<button onClick={handleClick}>Submit</button>

// Bad
<div onClick={handleClick}>Submit</div>
```

### 8. Accessibility

```typescript
<button
  aria-label="Send request"
  aria-disabled={!canSend}
>
  Send
</button>
```

## Resources

- [Electron Docs](https://www.electronjs.org/docs)
- [React Docs](https://react.dev/)
- [Jotai Docs](https://jotai.org/)
- [Tailwind Docs](https://tailwindcss.com/)
- [Bun Docs](https://bun.sh/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)

## Getting Help

- Check documentation in `/docs`
- Search existing issues
- Ask in team chat
- Create detailed bug report with reproducible example
