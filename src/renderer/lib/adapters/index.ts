// Protocol adapter factory and exports

import type { ProtocolType } from '@/types';
import { HttpAdapter } from './http-adapter';
import { WebSocketAdapter } from './websocket-adapter';
import { SocketIOAdapter } from './socketio-adapter';

export function createAdapter(protocol: ProtocolType) {
  switch (protocol) {
    case 'http':
      return new HttpAdapter();
    case 'websocket':
      return new WebSocketAdapter();
    case 'socketio':
      return new SocketIOAdapter();
    case 'grpc':
      throw new Error('gRPC adapter not yet implemented');
    default:
      throw new Error(`Unknown protocol: ${protocol}`);
  }
}

export * from './base';
export * from './http-adapter';
export * from './websocket-adapter';
export * from './socketio-adapter';
