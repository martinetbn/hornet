# Server-Sent Events (SSE) Implementation

## Overview

Server-Sent Events (SSE) support has been added to Hornet, enabling real-time, unidirectional server-to-client event streaming over HTTP/HTTPS.

## What is SSE?

Server-Sent Events is a standard for real-time communication that allows servers to push data to clients over HTTP. Key characteristics:

- **Unidirectional**: Server → Client only (no client-to-server messages)
- **HTTP-based**: Built on standard HTTP/HTTPS
- **Automatic reconnection**: Browser automatically reconnects on connection loss
- **Text-based**: Uses text/event-stream content type
- **Low latency**: Efficient for real-time updates

## Architecture Changes

### 1. Type Definitions

#### Protocol Type (`src/renderer/types/common.ts`)

```typescript
export type ProtocolType = "http" | "websocket" | "socketio" | "grpc" | "sse";
```

#### SSE Config (`src/renderer/types/request.ts`)

```typescript
export interface SSEConfig extends BaseRequest {
  protocol: "sse";
  url: string;
  headers?: KeyValuePair[];
  withCredentials?: boolean;
}
```

#### SSE Messages (`src/renderer/types/response.ts`)

```typescript
export interface SSEEvent {
  id: string;
  event: string;
  data: string;
  timestamp: number;
  retry?: number;
}

export interface SSEMessage {
  id: string;
  type: "event" | "error" | "connected" | "disconnected";
  event?: SSEEvent;
  error?: string;
  timestamp: number;
}
```

### 2. Auto-Detection

Location: `src/renderer/lib/adapters/http-adapter.ts`

The HTTP adapter now detects SSE endpoints by checking the `Content-Type` header:

```typescript
const contentType = response.headers["content-type"] || "";
const isSSE = contentType.includes("text/event-stream");
```

When SSE is detected, the response includes an `isSSE: true` flag, triggering the upgrade UI.

### 3. SSE Adapter

Location: `src/renderer/lib/adapters/sse-adapter.ts`

The SSE adapter implements the `ConnectionAdapter` interface and provides:

**Key Features:**

- Connection management (connect/disconnect)
- Automatic event handling
- Support for custom event types via `listenToEvent()`
- Status management (connecting, connected, error, disconnected)
- Automatic error handling and reconnection (via browser's EventSource)

**Important Limitations:**

- Uses native `EventSource` API which only supports GET requests
- Custom headers are converted to query parameters (browser limitation)
- Cannot send messages to server (unidirectional only)

**Methods:**

- `connect(config)`: Establish SSE connection
- `disconnect()`: Close the connection
- `listenToEvent(eventType)`: Register listener for specific SSE event types
- `on/off(event, callback)`: Subscribe/unsubscribe to adapter events
- `getStatus()`: Get current connection status

### 4. State Management

Location: `src/renderer/stores/connection-atoms.ts`

Updated to support SSE messages:

```typescript
export const messagesAtom = atom<
  Map<string, (WebSocketMessage | SocketIOMessage | SSEMessage)[]>
>(new Map());
```

### 5. Connection Hook

Location: `src/renderer/features/requests/hooks/use-connection.ts`

New hook for managing connection-based protocols (SSE, WebSocket, Socket.IO):

**API:**

```typescript
const {
  connection, // Connection state
  connect, // Establish connection
  disconnect, // Close connection
  sendMessage, // Send message (not for SSE)
  listenToSSEEvent, // Register SSE event listener
} = useConnection(connectionId, config);
```

### 6. UI Components

#### SSE Builder

Location: `src/renderer/features/requests/components/sse-builder.tsx`

New SSE request builder with:

- URL input
- Connect/Disconnect buttons with status indicators
- Headers editor (sent as query params)
- Real-time message viewer
- Connection status badges
- Error display
- SSE information panel

#### Response Viewer Upgrade

Location: `src/renderer/features/responses/components/response-viewer.tsx`

Added SSE detection banner that appears when `Content-Type: text/event-stream` is detected:

- Blue banner with "Server-Sent Events Detected" message
- "Connect to Stream" button to upgrade the connection
- Automatic UI switch when upgraded

### 7. App Integration

Location: `src/renderer/app.tsx`

**Changes:**

1. Added protocol selection dialog when creating new requests
2. Conditional rendering of appropriate builder based on protocol
3. Support for SSE in tab management
4. Protocol-specific request creation
5. **SSE auto-upgrade functionality**: Converts HTTP request to SSE connection when "Connect to Stream" is clicked

**New Dialog:**
Users can now choose between:

- HTTP / REST (traditional request/response)
- Server-Sent Events (real-time streaming)

## Usage

### Auto-Detection (Recommended)

The easiest way to use SSE is through **automatic detection**:

1. Click "+ New Request" and select "HTTP / REST"
2. Enter your endpoint URL (e.g., `https://api.example.com/events`)
3. Click "Send"
4. If the server responds with `Content-Type: text/event-stream`, Hornet automatically detects SSE
5. An upgrade banner appears: **"Server-Sent Events Detected"**
6. Click **"Connect to Stream"** to upgrade to SSE connection
7. The UI switches to SSE mode and starts receiving real-time events

### Manual SSE Connection

You can also manually create an SSE connection:

1. Click "+ New Request" button
2. Select "Server-Sent Events (SSE)" from the protocol dialog
3. Enter the SSE endpoint URL
4. Optionally add headers (will be sent as query parameters)
5. Click "Connect" to establish the connection
6. View incoming events in the Messages tab

### Event Format

SSE events follow this format:

```
event: eventName
data: event data
id: event-id
```

The adapter automatically parses this format and displays:

- Event type
- Event data
- Event ID
- Timestamp

### Custom Event Types

To listen for specific SSE event types:

```typescript
const { listenToSSEEvent } = useConnection(id, config);
listenToSSEEvent("customEvent");
```

## Browser Compatibility

SSE is supported in all modern browsers via the EventSource API:

- Chrome/Edge: ✓
- Firefox: ✓
- Safari: ✓
- Opera: ✓

## Example SSE Endpoints

Test SSE implementation with these public endpoints:

1. **Server-Sent Events Demo**
   - URL: `https://sse.dev/test`
   - Sends periodic updates

2. **Time Server**
   - Create your own SSE endpoint that sends time updates

## Common Use Cases

1. **Live Updates**: Stock prices, sports scores, news feeds
2. **Notifications**: Push notifications from server
3. **Progress Tracking**: Long-running task progress
4. **Chat Applications**: Server-to-client messages
5. **Monitoring**: Real-time metrics and logs

## Differences from WebSocket

| Feature         | SSE                            | WebSocket              |
| --------------- | ------------------------------ | ---------------------- |
| Direction       | Unidirectional (server→client) | Bidirectional          |
| Protocol        | HTTP/HTTPS                     | ws:// or wss://        |
| Reconnection    | Automatic                      | Manual                 |
| Browser Support | EventSource API                | WebSocket API          |
| Use Case        | Server push notifications      | Real-time chat, gaming |

## Limitations

1. **Unidirectional**: Cannot send messages from client to server over SSE
2. **Browser Connection Limit**: Most browsers limit concurrent connections (typically 6 per domain)
3. **Header Support**: Custom headers must be sent as query parameters due to EventSource limitations
4. **Only GET**: EventSource only supports GET requests

## Future Enhancements

Potential improvements:

1. **Custom Fetch Implementation**: Replace EventSource with fetch + ReadableStream for:
   - Full header support
   - POST requests
   - Better error handling

2. **Event Filtering**: UI for filtering specific event types

3. **Event Export**: Save received events to file

4. **Reconnection Configuration**: Configurable retry logic

5. **Event Statistics**: Show event count, frequency, data size

## Testing

To test SSE implementation:

1. Build the project: `bun run build`
2. Start the app: `bun run start`
3. Create a new SSE connection
4. Connect to an SSE endpoint
5. Verify events are received and displayed

## Files Modified/Created

### Created:

- `src/renderer/lib/adapters/sse-adapter.ts`
- `src/renderer/features/requests/hooks/use-connection.ts`
- `src/renderer/features/requests/components/sse-builder.tsx`
- `docs/SSE_IMPLEMENTATION.md`

### Modified:

- `src/renderer/types/common.ts` - Added 'sse' to ProtocolType
- `src/renderer/types/request.ts` - Added SSEConfig interface
- `src/renderer/types/response.ts` - Added SSEEvent and SSEMessage interfaces
- `src/renderer/types/protocol.ts` - Added 'sse' to Connection protocol union
- `src/renderer/lib/adapters/index.ts` - Added SSE adapter to factory
- `src/renderer/stores/connection-atoms.ts` - Added SSEMessage support
- `src/renderer/features/requests/hooks/index.ts` - Exported useConnection hook
- `src/renderer/features/requests/components/index.ts` - Exported SSEBuilder
- `src/renderer/app.tsx` - Added protocol selection and SSE support

## Resources

- [MDN: Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [HTML5 SSE Specification](https://html.spec.whatwg.org/multipage/server-sent-events.html)
- [EventSource API](https://developer.mozilla.org/en-US/docs/Web/API/EventSource)
