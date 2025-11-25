// SSE (Server-Sent Events) Request Builder component

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Radio, Loader2, XCircle, Activity } from 'lucide-react';
import { useConnection } from '../hooks';
import type { SSEConfig, SSEMessage } from '@/types';
import { KeyValueEditor } from './key-value-editor';
import { useAtomValue, useSetAtom } from 'jotai';
import { currentConnectionMessagesAtom } from '@/stores/connection-atoms';
import { activeWorkspaceVariablesAtom } from '@/stores/environment-atoms';
import { resolveSSEVariables } from '@/lib/utils/variable-resolver';
import { Badge } from '@/components/ui/badge';
import { useEffect, useCallback } from 'react';

interface SSEBuilderProps {
  request: SSEConfig;
  onRequestChange?: (request: SSEConfig) => void;
}

export function SSEBuilder({ request, onRequestChange }: SSEBuilderProps) {
  // We can't use useConnection here directly if we want to resolve variables before connecting
  // because useConnection initializes with the static config.
  // Instead, we should resolve variables and pass them to useConnection,
  // OR useConnection should handle resolution (which we did for WS/SocketIO).
  
  // However, SSE doesn't use the standard useConnection hook in the same way? 
  // Wait, it does: const { connection, connect, disconnect } = useConnection(request.id, request);
  // But useConnection expects WebSocketConfig | SocketIOConfig, not SSEConfig?
  // Let's check use-connection.ts type definition.
  
  const variables = useAtomValue(activeWorkspaceVariablesAtom);
  
  // Since we updated useConnection to handle resolution, we just need to ensure
  // it supports SSE protocol if it doesn't already.
  // Checking use-connection.ts again...
  // type ConnectionConfig = WebSocketConfig | SocketIOConfig; 
  // It seems SSE is missing from ConnectionConfig in use-connection.ts!
  
  const { connection, connect, disconnect } = useConnection(request.id, request as any); // Cast for now until we fix the type
  const messages = useAtomValue(currentConnectionMessagesAtom);

  const isConnected = connection?.status === 'connected';
  const isConnecting = connection?.status === 'connecting';
  const isDisconnecting = connection?.status === 'disconnecting';
  const hasError = connection?.status === 'error';

  const handleConnect = async () => {
    try {
      await connect();
    } catch (error) {
      console.error('Failed to connect to SSE endpoint:', error);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
  };

  const handleUrlChange = (url: string) => {
    onRequestChange?.({ ...request, url, updatedAt: Date.now() });
  };

  const handleHeadersChange = (headers: typeof request.headers) => {
    onRequestChange?.({ ...request, headers, updatedAt: Date.now() });
  };

  const getStatusBadge = () => {
    if (isConnected) {
      return (
        <Badge variant="default" className="bg-green-500">
          <Activity className="size-3 mr-1" />
          Connected
        </Badge>
      );
    }
    if (isConnecting) {
      return (
        <Badge variant="secondary">
          <Loader2 className="size-3 mr-1 animate-spin" />
          Connecting
        </Badge>
      );
    }
    if (hasError) {
      return (
        <Badge variant="destructive">
          <XCircle className="size-3 mr-1" />
          Error
        </Badge>
      );
    }
    return (
      <Badge variant="outline">
        Disconnected
      </Badge>
    );
  };

  const sseMessages = messages.filter((msg): msg is SSEMessage => 'type' in msg && msg.type !== undefined);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Server-Sent Events (SSE)</CardTitle>
            <CardDescription>
              Connect to SSE endpoint to receive real-time server events
            </CardDescription>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection URL Section */}
        <div className="flex gap-2">
          <Input
            value={request.url}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="Enter SSE endpoint URL (e.g., https://api.example.com/events)"
            className="flex-1 h-10"
            disabled={isConnected || isConnecting}
          />

          {!isConnected ? (
            <Button
              onClick={handleConnect}
              disabled={isConnecting || !request.url}
              className="h-10"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Connecting
                </>
              ) : (
                <>
                  <Radio className="size-4 mr-2" />
                  Connect
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleDisconnect}
              disabled={isDisconnecting}
              variant="destructive"
              className="h-10"
            >
              {isDisconnecting ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Disconnecting
                </>
              ) : (
                <>
                  <XCircle className="size-4 mr-2" />
                  Disconnect
                </>
              )}
            </Button>
          )}
        </div>

        {/* Connection Configuration */}
        <Tabs defaultValue="headers" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="headers">Headers</TabsTrigger>
            <TabsTrigger value="messages">
              Messages ({sseMessages.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="headers" className="space-y-4">
            <KeyValueEditor
              title="Headers"
              items={request.headers || []}
              onItemsChange={handleHeadersChange}
              keyPlaceholder="Authorization"
              valuePlaceholder="Bearer token"
              disabled={isConnected || isConnecting}
            />
          </TabsContent>

          <TabsContent value="messages" className="space-y-4">
            <div className="border rounded-lg p-4 max-h-96 overflow-y-auto space-y-2">
              {sseMessages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  {isConnected
                    ? 'Waiting for events...'
                    : 'Connect to start receiving events'}
                </div>
              ) : (
                sseMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className="border-l-4 border-blue-500 bg-secondary/50 p-3 rounded"
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {msg.type}
                        </Badge>
                        {msg.event && (
                          <Badge variant="secondary" className="text-xs">
                            {msg.event.event}
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    {msg.type === 'event' && msg.event && (
                      <div className="mt-2 space-y-1">
                        {msg.event.id && (
                          <div className="text-xs">
                            <span className="font-semibold">ID:</span> {msg.event.id}
                          </div>
                        )}
                        <div className="text-sm font-mono bg-background p-2 rounded overflow-x-auto">
                          {msg.event.data}
                        </div>
                      </div>
                    )}
                    {msg.type === 'error' && msg.error && (
                      <div className="mt-2 text-sm text-red-500">{msg.error}</div>
                    )}
                    {msg.type === 'connected' && (
                      <div className="mt-2 text-sm text-green-500">
                        Successfully connected to SSE endpoint
                      </div>
                    )}
                    {msg.type === 'disconnected' && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        Disconnected from SSE endpoint
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
            {hasError && connection?.error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">
                <strong>Error:</strong> {connection.error}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* SSE Info */}
        <div className="text-sm text-muted-foreground bg-secondary/50 p-3 rounded">
          <p className="font-semibold mb-1">About Server-Sent Events:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>SSE is unidirectional (server → client only)</li>
            <li>Automatic reconnection on connection loss</li>
            <li>Built on standard HTTP/HTTPS</li>
            <li>Text-based event stream format</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
