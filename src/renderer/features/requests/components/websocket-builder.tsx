// WebSocket Request Builder component

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plug, Loader2, XCircle, Activity, Send } from 'lucide-react';
import { useConnection } from '../hooks';
import type { WebSocketConfig, WebSocketMessage } from '@/types';
import { KeyValueEditor } from './key-value-editor';
import { useSetAtom } from 'jotai';
import { clearMessagesAtom } from '@/stores/connection-atoms';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { xml } from '@codemirror/lang-xml';
import { html } from '@codemirror/lang-html';
import { useCodeMirrorTheme } from '@/lib/hooks/use-codemirror-theme';

interface WebSocketBuilderProps {
  request: WebSocketConfig;
  onRequestChange?: (request: WebSocketConfig) => void;
}

export function WebSocketBuilder({ request, onRequestChange }: WebSocketBuilderProps) {
  const { connection, connect, disconnect, sendMessage } = useConnection(request.id, request);
  const clearMessages = useSetAtom(clearMessagesAtom);

  // Message composer state
  const [messageFormat, setMessageFormat] = useState<'text' | 'json' | 'xml' | 'html' | 'binary'>(
    request.draftMessage?.format || 'text'
  );
  const [messageContent, setMessageContent] = useState(request.draftMessage?.content || '');
  const [isSending, setIsSending] = useState(false);

  // CodeMirror theme
  const {
    customTheme,
    customHighlighting,
    editorStyle,
    basicSetup,
    wrapperClass,
  } = useCodeMirrorTheme({
    styleId: 'codemirror-websocket-message-theme',
    wrapperClass: 'codemirror-websocket-message',
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
      console.error('Failed to connect to WebSocket:', error);
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
    if (!messageContent.trim() || !isConnected) return;

    setIsSending(true);
    try {
      const message: WebSocketMessage = {
        id: crypto.randomUUID(),
        type: 'sent',
        data: messageContent,
        timestamp: Date.now(),
        format: messageFormat,
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

  const handleHeadersChange = (headers: typeof request.headers) => {
    onRequestChange?.({ ...request, headers, updatedAt: Date.now() });
  };

  const handleParamsChange = (params: typeof request.params) => {
    onRequestChange?.({ ...request, params, updatedAt: Date.now() });
  };

  const handleMessageFormatChange = (format: typeof messageFormat) => {
    setMessageFormat(format);
    onRequestChange?.({
      ...request,
      draftMessage: { format, content: messageContent },
      updatedAt: Date.now(),
    });
  };

  const handleMessageContentChange = (content: string) => {
    setMessageContent(content);
    onRequestChange?.({
      ...request,
      draftMessage: { format: messageFormat, content },
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

  const getLanguageExtension = () => {
    switch (messageFormat) {
      case 'json': return json();
      case 'xml': return xml();
      case 'html': return html();
      default: return []; // plain text, no syntax highlighting
    }
  };

  const getPlaceholder = () => {
    switch (messageFormat) {
      case 'json': return '{\n  "message": "Hello WebSocket"\n}';
      case 'xml': return '<?xml version="1.0"?>\n<message>Hello WebSocket</message>';
      case 'html': return '<div>Hello WebSocket</div>';
      default: return 'Enter your message here...';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>WebSocket</CardTitle>
            <CardDescription>
              Connect to WebSocket server for bidirectional real-time communication
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
            placeholder="Enter WebSocket URL (e.g., wss://echo.websocket.org)"
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
                  <Plug className="size-4 mr-2" />
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="message">Message</TabsTrigger>
            <TabsTrigger value="params">Params</TabsTrigger>
            <TabsTrigger value="headers">Headers</TabsTrigger>
          </TabsList>

          <TabsContent value="message" className="space-y-4">
            <div className="space-y-3">
              <div className="flex gap-2 items-center">
                <label className="text-sm font-medium">Format:</label>
                <Select
                  value={messageFormat}
                  onValueChange={(value) => handleMessageFormatChange(value as typeof messageFormat)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="xml">XML</SelectItem>
                    <SelectItem value="html">HTML</SelectItem>
                    <SelectItem value="binary">Binary</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className={wrapperClass}>
                <CodeMirror
                  value={messageContent}
                  onChange={handleMessageContentChange}
                  placeholder={getPlaceholder()}
                  extensions={[getLanguageExtension(), customTheme, customHighlighting]}
                  height="200px"
                  basicSetup={basicSetup}
                  style={editorStyle}
                />
              </div>

              <Button
                onClick={handleSendMessage}
                disabled={!isConnected || !messageContent.trim() || isSending}
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

          <TabsContent value="params" className="space-y-4">
            <KeyValueEditor
              title="Query Parameters"
              items={request.params || []}
              onItemsChange={handleParamsChange}
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
