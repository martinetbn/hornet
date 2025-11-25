// Socket.IO Request Builder component

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
import { Activity, Loader2, XCircle, Send, Plus, Trash2 } from 'lucide-react';
import { useConnection } from '../hooks';
import type { SocketIOConfig, SocketIOMessage } from '@/types';
import { KeyValueEditor } from './key-value-editor';
import { useSetAtom } from 'jotai';
import { clearMessagesAtom } from '@/stores/connection-atoms';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { useCodeMirrorTheme } from '@/lib/hooks/use-codemirror-theme';

interface SocketIOBuilderProps {
  request: SocketIOConfig;
  onRequestChange?: (request: SocketIOConfig) => void;
}

export function SocketIOBuilder({ request, onRequestChange }: SocketIOBuilderProps) {
  const { connection, connect, disconnect, sendMessage } = useConnection(request.id, request);
  const clearMessages = useSetAtom(clearMessagesAtom);

  // Message composer state
  const [eventName, setEventName] = useState(request.draftMessage?.event || 'message');
  const [messageData, setMessageData] = useState(request.draftMessage?.data || '');
  const [isSending, setIsSending] = useState(false);

  // Events to listen to
  const [events, setEvents] = useState<string[]>(request.events || []);
  const [newEventName, setNewEventName] = useState('');

  // CodeMirror theme
  const {
    customTheme,
    customHighlighting,
    editorStyle,
    basicSetup,
    wrapperClass,
  } = useCodeMirrorTheme({
    styleId: 'codemirror-socketio-message-theme',
    wrapperClass: 'codemirror-socketio-message',
    basicSetupOverrides: {
      highlightActiveLine: false,
    },
  });

  // Set this connection as selected when component mounts
  // useEffect(() => {
  //   setSelectedConnectionId(request.id);
  //   return () => {
  //     // Optionally clear selection on unmount
  //     // setSelectedConnectionId(null);
  //   };
  // }, [request.id, setSelectedConnectionId]);

  const isConnected = connection?.status === 'connected';
  const isConnecting = connection?.status === 'connecting';
  const isDisconnecting = connection?.status === 'disconnecting';
  const hasError = connection?.status === 'error';

  const handleConnect = async () => {
    try {
      // Clear previous messages before connecting
      clearMessages(request.id);
      await connect();
    } catch (error) {
      console.error('Failed to connect to Socket.IO:', error);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!eventName.trim() || !isConnected) return;

    setIsSending(true);
    try {
      // Parse message data as JSON
      let parsedData: unknown[];
      try {
        if (messageData.trim()) {
          const parsed = JSON.parse(messageData);
          // Ensure data is an array
          parsedData = Array.isArray(parsed) ? parsed : [parsed];
        } else {
          parsedData = [];
        }
      } catch (e) {
        // If parsing fails, send as single string argument
        parsedData = [messageData];
      }

      const message: SocketIOMessage = {
        id: crypto.randomUUID(),
        type: 'sent',
        event: eventName,
        data: parsedData,
        timestamp: Date.now(),
      };

      await sendMessage(message);
      // Don't clear input after sending - keep it for potential re-sending
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleUrlChange = (url: string) => {
    onRequestChange?.({ ...request, url, updatedAt: Date.now() });
  };

  const handlePathChange = (path: string) => {
    onRequestChange?.({ ...request, path, updatedAt: Date.now() });
  };

  const handleHeadersChange = (headers: typeof request.headers) => {
    onRequestChange?.({ ...request, headers, updatedAt: Date.now() });
  };

  const handleParamsChange = (params: typeof request.params) => {
    onRequestChange?.({ ...request, params, updatedAt: Date.now() });
  };

  const handleQueryChange = (query: typeof request.query) => {
    onRequestChange?.({ ...request, query, updatedAt: Date.now() });
  };

  const handleEventNameChange = (name: string) => {
    setEventName(name);
    onRequestChange?.({
      ...request,
      draftMessage: { event: name, data: messageData },
      updatedAt: Date.now(),
    });
  };

  const handleMessageDataChange = (data: string) => {
    setMessageData(data);
    onRequestChange?.({
      ...request,
      draftMessage: { event: eventName, data },
      updatedAt: Date.now(),
    });
  };

  const handleAddEvent = () => {
    if (newEventName.trim() && !events.includes(newEventName.trim())) {
      const updatedEvents = [...events, newEventName.trim()];
      setEvents(updatedEvents);
      setNewEventName('');
      onRequestChange?.({
        ...request,
        events: updatedEvents,
        updatedAt: Date.now(),
      });
    }
  };

  const handleRemoveEvent = (eventToRemove: string) => {
    const updatedEvents = events.filter(e => e !== eventToRemove);
    setEvents(updatedEvents);
    onRequestChange?.({
      ...request,
      events: updatedEvents,
      updatedAt: Date.now(),
    });
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Socket.IO</CardTitle>
            <CardDescription>
              Connect to Socket.IO server for real-time event-based communication
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
            placeholder="Enter Socket.IO URL (e.g., http://localhost:3000)"
            className="flex-1 h-10"
            disabled={isConnected || isConnecting}
          />

          <Input
            value={request.path || '/socket.io'}
            onChange={(e) => handlePathChange(e.target.value)}
            placeholder="/socket.io"
            className="w-32 h-10"
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
                  <Activity className="size-4 mr-2" />
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
        <Tabs defaultValue="message" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="message">Message</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="params">Params</TabsTrigger>
            <TabsTrigger value="headers">Headers</TabsTrigger>
          </TabsList>

          <TabsContent value="message" className="space-y-4">
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Event Name:</label>
                <Input
                  value={eventName}
                  onChange={(e) => handleEventNameChange(e.target.value)}
                  placeholder="message"
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Message Content (JSON):</label>
                <div className={wrapperClass}>
                  <CodeMirror
                    value={messageData}
                    onChange={handleMessageDataChange}
                    placeholder='{"message": "Hello Socket.IO"}'
                    extensions={[json(), customTheme, customHighlighting]}
                    height="200px"
                    basicSetup={basicSetup}
                    style={editorStyle}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter data as JSON. Objects will be sent as single argument, arrays will be spread as multiple arguments.
                </p>
              </div>

              <Button
                onClick={handleSendMessage}
                disabled={!isConnected || !eventName.trim() || isSending}
                className="w-full"
              >
                {isSending ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Sending
                  </>
                ) : (
                  <>
                    <Send className="size-4 mr-2" />
                    Send Message
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="events" className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Events to Listen</label>
                <p className="text-xs text-muted-foreground mb-2">
                  Add event names to subscribe to. All events are automatically captured.
                </p>
              </div>

              {/* Add new event */}
              <div className="flex gap-2">
                <Input
                  value={newEventName}
                  onChange={(e) => setNewEventName(e.target.value)}
                  placeholder="Event name (e.g., notification)"
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddEvent();
                    }
                  }}
                />
                <Button
                  onClick={handleAddEvent}
                  disabled={!newEventName.trim() || events.includes(newEventName.trim())}
                  size="sm"
                >
                  <Plus className="size-4 mr-1" />
                  Add
                </Button>
              </div>

              {/* List of events */}
              <div className="space-y-2">
                {events.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-4 border-2 border-dashed rounded-md">
                    No events added. Add event names above to track specific events.
                  </div>
                ) : (
                  events.map((event) => (
                    <div
                      key={event}
                      className="flex items-center justify-between p-2 border rounded-md"
                    >
                      <span className="text-sm font-mono">{event}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveEvent(event)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="params" className="space-y-4">
            <KeyValueEditor
              title="Query Parameters"
              items={request.query || []}
              onItemsChange={handleQueryChange}
              keyPlaceholder="token"
              valuePlaceholder="your-token"
              disabled={isConnected || isConnecting}
            />
          </TabsContent>

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
        </Tabs>
      </CardContent>
    </Card>
  );
}
