// Connection-related state atoms for WebSocket, Socket.IO, and gRPC

import { atom } from 'jotai';
import { Connection } from '@/types/protocol';
import { WebSocketMessage, SocketIOMessage } from '@/types';

// Map of active connections by ID
export const connectionsAtom = atom<Map<string, Connection>>(new Map());

// Messages grouped by connection ID
export const messagesAtom = atom<Map<string, (WebSocketMessage | SocketIOMessage)[]>>(new Map());

// Selected connection ID
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
  (get, set, { connectionId, message }: { connectionId: string; message: WebSocketMessage | SocketIOMessage }) => {
    const messages = new Map(get(messagesAtom));
    const connectionMessages = messages.get(connectionId) ?? [];
    messages.set(connectionId, [...connectionMessages, message]);
    set(messagesAtom, messages);
  }
);
