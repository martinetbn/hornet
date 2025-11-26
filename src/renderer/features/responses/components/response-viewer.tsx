// Response viewer component

import { useAtomValue } from "jotai";
import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { currentResponseAtom } from "@/stores/response-atoms";
import { requestLoadingAtom, requestErrorAtom } from "@/stores/request-atoms";
import { currentConnectionMessagesAtom } from "@/stores/connection-atoms";
import { Loader2, AlertCircle, Radio, Plug } from "lucide-react";
import CodeMirror from "@uiw/react-codemirror";
import { json } from "@codemirror/lang-json";
import { xml } from "@codemirror/lang-xml";
import { html } from "@codemirror/lang-html";
import { useCodeMirrorTheme } from "@/lib/hooks/use-codemirror-theme";
import type { WebSocketMessage } from "@/types";

export function ResponseViewer() {
  const response = useAtomValue(currentResponseAtom);
  const loading = useAtomValue(requestLoadingAtom);
  const error = useAtomValue(requestErrorAtom);
  const connectionMessages = useAtomValue(currentConnectionMessagesAtom);

  // Use shared CodeMirror theme hook
  const {
    customTheme,
    customHighlighting,
    editorStyle,
    basicSetup,
    wrapperClass,
  } = useCodeMirrorTheme({
    styleId: "codemirror-response-theme",
    wrapperClass: "codemirror-response",
    basicSetupOverrides: {
      dropCursor: false,
      indentOnInput: false,
      closeBrackets: false,
    },
  });

  // Format response data for display
  const formatData = (data: unknown): string => {
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  };

  // Format headers for display
  const formatHeaders = (headers: Record<string, string>): string => {
    return Object.entries(headers)
      .map(([key, value]) => `${key}: ${value}`)
      .join("\n");
  };

  // Format SSE event data (try to parse and format JSON)
  const formatSSEEventData = (data: string): string => {
    try {
      const parsed = JSON.parse(data);
      return JSON.stringify(parsed, null, 2);
    } catch {
      // Not valid JSON, return as-is
      return data;
    }
  };

  // Get status badge variant
  const getStatusVariant = (
    status: number,
  ): "default" | "secondary" | "destructive" => {
    if (status >= 200 && status < 300) return "default";
    if (status >= 400) return "destructive";
    return "secondary";
  };

  // Filter and format WebSocket messages
  const wsMessages = connectionMessages.filter(
    (msg): msg is WebSocketMessage =>
      "data" in msg &&
      "type" in msg &&
      (msg.type === "sent" || msg.type === "received"),
  );

  const formatMessageData = (data: string | ArrayBuffer | Blob): string => {
    if (data instanceof ArrayBuffer) {
      return `[Binary data: ${data.byteLength} bytes]`;
    }
    if (data instanceof Blob) {
      return `[Blob: ${data.size} bytes]`;
    }
    return data;
  };

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getLanguageExtension = (format?: string) => {
    switch (format) {
      case "json":
        return json();
      case "xml":
        return xml();
      case "html":
        return html();
      default:
        return json(); // default to json for syntax highlighting
    }
  };

  // Check if we have WebSocket messages
  const hasWebSocketMessages = wsMessages.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Response</CardTitle>
        <CardDescription>
          View the response from your API request
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-2">
              <Loader2 className="size-8 animate-spin mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Sending request...
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="flex items-center gap-3 p-4 rounded-lg border border-destructive bg-destructive/10">
            <AlertCircle className="size-5 text-destructive flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-destructive">
                Request Failed
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {error.message}
              </p>
            </div>
          </div>
        )}

        {/* Response Content */}
        {!loading && !error && (
          <>
            <Tabs defaultValue="body" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="body">Body</TabsTrigger>
                <TabsTrigger value="headers">Headers</TabsTrigger>
              </TabsList>

              <TabsContent value="body">
                {hasWebSocketMessages ? (
                  // WebSocket Messages View
                  <div className="border rounded-lg p-4 max-h-96 overflow-y-auto space-y-2">
                    {wsMessages.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        <Plug className="size-8 mx-auto mb-2 text-green-500" />
                        <p>WebSocket Connected</p>
                        <p className="text-sm mt-1">
                          Send a message to start the conversation
                        </p>
                      </div>
                    ) : (
                      wsMessages
                        .slice()
                        .reverse()
                        .map((msg) => (
                          <div
                            key={msg.id}
                            className={`border-l-4 ${
                              msg.type === "sent"
                                ? "border-blue-500 bg-blue-500/10"
                                : "border-green-500 bg-green-500/10"
                            } p-3 rounded`}
                          >
                            <div className="flex items-start justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant={
                                    msg.type === "sent"
                                      ? "default"
                                      : "secondary"
                                  }
                                  className={
                                    msg.type === "sent"
                                      ? "bg-blue-500"
                                      : "bg-green-500"
                                  }
                                >
                                  {msg.type === "sent" ? "Sent" : "Received"}
                                </Badge>
                                {msg.format && (
                                  <Badge variant="outline" className="text-xs">
                                    {msg.format.toUpperCase()}
                                  </Badge>
                                )}
                                {msg.size && (
                                  <span className="text-xs text-muted-foreground">
                                    {formatBytes(msg.size)}
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {new Date(msg.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                            <div className={wrapperClass}>
                              <CodeMirror
                                value={formatMessageData(msg.data)}
                                extensions={[
                                  getLanguageExtension(msg.format),
                                  customTheme,
                                  customHighlighting,
                                ]}
                                height="auto"
                                maxHeight="300px"
                                basicSetup={basicSetup}
                                style={editorStyle}
                                editable={false}
                                readOnly={true}
                              />
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                ) : response &&
                  "isSSE" in response &&
                  response.isSSE &&
                  response.sseMessages ? (
                  // SSE Messages View
                  <div className="border rounded-lg p-4 max-h-96 overflow-y-auto space-y-2">
                    {response.sseMessages.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        <Radio className="size-8 mx-auto mb-2 text-blue-500" />
                        <p>Connected to SSE stream</p>
                        <p className="text-sm mt-1">Waiting for events...</p>
                      </div>
                    ) : (
                      response.sseMessages
                        .slice()
                        .reverse()
                        .map((msg) => (
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
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {msg.event.event}
                                  </Badge>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {new Date(msg.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                            {msg.type === "event" && msg.event && (
                              <div className="mt-2 space-y-1">
                                {msg.event.id && (
                                  <div className="text-xs">
                                    <span className="font-semibold">ID:</span>{" "}
                                    {msg.event.id}
                                  </div>
                                )}
                                <div className={wrapperClass}>
                                  <CodeMirror
                                    value={formatSSEEventData(msg.event.data)}
                                    extensions={[
                                      json(),
                                      customTheme,
                                      customHighlighting,
                                    ]}
                                    height="auto"
                                    maxHeight="300px"
                                    basicSetup={basicSetup}
                                    style={editorStyle}
                                    editable={false}
                                    readOnly={true}
                                  />
                                </div>
                              </div>
                            )}
                            {msg.type === "error" && msg.error && (
                              <div className="mt-2 text-sm text-red-500">
                                {msg.error}
                              </div>
                            )}
                            {msg.type === "connected" && (
                              <div className="mt-2 text-sm text-green-500">
                                Successfully connected to SSE endpoint
                              </div>
                            )}
                            {msg.type === "disconnected" && (
                              <div className="mt-2 text-sm text-muted-foreground">
                                Disconnected from SSE endpoint
                              </div>
                            )}
                          </div>
                        ))
                    )}
                  </div>
                ) : (
                  // Regular HTTP Response
                  <div className={wrapperClass}>
                    <CodeMirror
                      value={
                        response
                          ? formatData(response.data)
                          : "Send a request to see the response here..."
                      }
                      extensions={[json(), customTheme, customHighlighting]}
                      height="300px"
                      basicSetup={basicSetup}
                      style={editorStyle}
                      editable={false}
                      readOnly={true}
                    />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="headers">
                <div className={wrapperClass}>
                  <CodeMirror
                    value={
                      response?.headers
                        ? formatHeaders(response.headers)
                        : "Response headers will appear here..."
                    }
                    extensions={[customTheme, customHighlighting]}
                    height="300px"
                    basicSetup={basicSetup}
                    style={editorStyle}
                    editable={false}
                    readOnly={true}
                  />
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex items-center justify-between mt-4 text-sm">
              <div className="flex items-center gap-4">
                {response && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant={getStatusVariant(response.status)}>
                        {response.status} {response.statusText}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Time:</span>
                      <span className="font-medium">{response.duration}ms</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Size:</span>
                      <span className="font-medium">
                        {(response.size / 1024).toFixed(2)} KB
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
