# Hornet Architecture

## Overview

Hornet is a multi-protocol API client built with Electron, React, and Tailwind CSS. It supports HTTP, WebSocket, Socket.IO, and gRPC protocols, designed with a clean, layered architecture for maintainability and extensibility.

## Architecture Principles

### 1. **Separation of Concerns**

Each layer has a single, well-defined responsibility with clear boundaries.

### 2. **Unidirectional Data Flow**

State flows down through components, actions flow up through callbacks and state updates.

### 3. **Protocol Agnostic Core**

Business logic is independent of protocol implementation details.

### 4. **Type Safety**

TypeScript throughout ensures compile-time safety and better developer experience.

## Layer Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Presentation Layer                    │
│              (React Components + Tailwind)               │
│  - Layout components (Sidebar, Header, Panel)            │
│  - Feature components (RequestBuilder, ResponseViewer)   │
│  - UI primitives (Button, Input, Dropdown)               │
└─────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────┐
│                   State Management Layer                 │
│                     (Jotai Atoms)                        │
│  - Request state (collections, current request)          │
│  - Response state (history, active response)             │
│  - App state (environments, settings)                    │
│  - Connection state (active connections, status)         │
└─────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────┐
│                   Business Logic Layer                   │
│                  (Hooks + Services)                      │
│  - useRequest (manages request lifecycle)                │
│  - useCollection (manages collections)                   │
│  - useEnvironment (manages environments)                 │
│  - useConnection (manages protocol connections)          │
└─────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────┐
│                   Protocol Adapter Layer                 │
│              (Protocol Implementations)                  │
│  - HttpAdapter (fetch/axios)                             │
│  - WebSocketAdapter (native WebSocket)                   │
│  - SocketIOAdapter (socket.io-client)                    │
│  - GrpcAdapter (@grpc/grpc-js)                           │
└─────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────┐
│                      Data Layer                          │
│              (Types + Persistence)                       │
│  - Type definitions (Request, Response, Collection)      │
│  - Storage service (Electron store)                      │
│  - Export/Import utilities                               │
└─────────────────────────────────────────────────────────┘
```

## Key Concepts

### Requests

A request represents a single API call configuration including:

- Protocol type (HTTP, WS, Socket.IO, gRPC)
- Endpoint/URL
- Headers, parameters, body
- Authentication configuration
- Pre-request scripts (future)

### Collections

Collections organize related requests into hierarchical folders, similar to Postman workspaces.

### Environments

Environments store variables (like API keys, base URLs) that can be referenced in requests using `{{variable}}` syntax.

### Connections

Active protocol connections (WebSocket, Socket.IO, gRPC streams) that maintain state beyond a single request/response.

## Data Flow Examples

### HTTP Request Flow

```
1. User clicks "Send" in RequestBuilder component
2. Component calls useRequest hook's send() function
3. Hook updates request atom state to "loading"
4. Hook calls HttpAdapter.execute(request)
5. Adapter makes HTTP call and returns response
6. Hook updates response atom with result
7. Hook adds to history atom
8. ResponseViewer component rerenders with new response
```

### WebSocket Connection Flow

```
1. User clicks "Connect" in RequestBuilder component
2. Component calls useConnection hook's connect() function
3. Hook updates connection atom state to "connecting"
4. Hook calls WebSocketAdapter.connect(config)
5. Adapter establishes WebSocket connection
6. Adapter emits events to hook via callbacks
7. Hook updates connection atom state to "connected"
8. Hook updates messages atom with incoming messages
9. MessageViewer component rerenders with new messages
```

## Technology Stack

### Core

- **Electron**: Desktop app framework
- **React 19**: UI library
- **TypeScript**: Type safety
- **Tailwind CSS 4**: Styling

### State Management

- **Jotai**: Atomic state management
  - Lightweight and performant
  - Perfect for modular state
  - Great TypeScript support

### Protocol Libraries

- **HTTP**: axios (with fetch fallback)
- **WebSocket**: native WebSocket API
- **Socket.IO**: socket.io-client
- **gRPC**: @grpc/grpc-js + @grpc/proto-loader

### Utilities

- **nanoid**: Unique ID generation
- **uuid**: UUID generation for compatibility

## Design Patterns

### 1. **Adapter Pattern**

Each protocol has an adapter that implements a common interface, making it easy to add new protocols.

```typescript
interface ProtocolAdapter<TConfig, TResponse> {
  execute(config: TConfig): Promise<TResponse>;
  cancel?(): void;
}
```

### 2. **Repository Pattern**

Data persistence is abstracted through repository interfaces, allowing easy switching of storage mechanisms.

### 3. **Factory Pattern**

Protocol adapters are created through factories based on request type.

### 4. **Observer Pattern**

Long-lived connections (WS, Socket.IO) use observers to emit events to subscribers.

## Extension Points

### Adding a New Protocol

1. Create adapter in `src/renderer/lib/adapters/`
2. Implement protocol interface
3. Add protocol type to types
4. Register in protocol factory
5. Add UI support in RequestBuilder

### Adding a New Feature

1. Define types in `src/renderer/types/`
2. Create Jotai atoms in `src/renderer/stores/`
3. Create custom hooks in `src/renderer/lib/hooks/`
4. Build UI components in `src/renderer/features/`

## Security Considerations

### Content Security Policy

Strict CSP prevents XSS attacks and unauthorized resource loading.

### Context Isolation

Electron's context isolation prevents renderer from accessing Node.js APIs directly.

### IPC Communication

All main process communication goes through secure IPC channels defined in preload script.

### Sensitive Data

API keys and tokens are encrypted at rest using Electron's safeStorage API.

## Performance Considerations

### Code Splitting

Features are lazy-loaded to reduce initial bundle size.

### Virtual Scrolling

Large request lists and responses use virtual scrolling for performance.

### Debouncing

User input is debounced to prevent excessive re-renders and API calls.

### Memoization

Expensive computations are memoized using React.memo and useMemo.

## Testing Strategy

### Unit Tests

- Protocol adapters
- Utility functions
- Custom hooks (with React Testing Library)

### Integration Tests

- Feature workflows (create request, send, view response)
- State management integration

### E2E Tests

- Critical user paths
- Cross-protocol scenarios

## Future Enhancements

1. **Collaboration**: Share collections with teams
2. **Mock Servers**: Built-in mock server for testing
3. **Code Generation**: Generate code snippets in multiple languages
4. **GraphQL Support**: Add GraphQL protocol adapter
5. **API Documentation**: Generate docs from collections
6. **Test Automation**: Chain requests for automated testing
