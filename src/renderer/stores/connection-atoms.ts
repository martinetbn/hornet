// Connection-related state atoms for WebSocket, Socket.IO, SSE, and gRPC

import { atom } from 'jotai';
import type { Connection } from '@/types/protocol';
import type { WebSocketMessage, SocketIOMessage, SSEMessage } from '@/types';

import { activeTabIdAtom } from './collection-atoms';

// Map of active connections by ID
export const connectionsAtom = atom<Map<string, Connection>>(new Map());

// Messages grouped by connection ID
export const messagesAtom = atom<Map<string, (WebSocketMessage | SocketIOMessage | SSEMessage)[]>>(new Map());

// Selected connection ID
// export const selectedConnectionIdAtom = atom<string | null>(null);

// Derived: Messages for selected connection (active tab)
export const currentConnectionMessagesAtom = atom((get) => {
  const connectionId = get(activeTabIdAtom);
  if (!connectionId) return [];

  const messages = get(messagesAtom);
  return messages.get(connectionId) ?? [];
});

// Write-only: Add message to connection
export const addMessageAtom = atom(
  null,
  (get, set, { connectionId, message }: { connectionId: string; message: WebSocketMessage | SocketIOMessage | SSEMessage }) => {
    const messages = new Map(get(messagesAtom));
    const connectionMessages = messages.get(connectionId) ?? [];
    messages.set(connectionId, [...connectionMessages, message]);
    set(messagesAtom, messages);
  }
);

// Write-only: Clear messages for a connection
export const clearMessagesAtom = atom(
  null,
  (get, set, connectionId: string) => {
    const messages = new Map(get(messagesAtom));
    messages.set(connectionId, []);
    set(messagesAtom, messages);
  }
);
