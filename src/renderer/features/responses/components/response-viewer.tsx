// Response viewer component

import { useAtomValue } from 'jotai';
import { useMemo } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { currentResponseAtom } from '@/stores/response-atoms';
import { requestLoadingAtom, requestErrorAtom } from '@/stores/request-atoms';
import { Loader2, AlertCircle, Radio } from 'lucide-react';
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { useCodeMirrorTheme } from '@/lib/hooks/use-codemirror-theme';

interface ResponseViewerProps {
  onUpgradeToSSE?: () => void;
}

export function ResponseViewer({ onUpgradeToSSE }: ResponseViewerProps = {}) {
  const response = useAtomValue(currentResponseAtom);
  const loading = useAtomValue(requestLoadingAtom);
  const error = useAtomValue(requestErrorAtom);

  // Use shared CodeMirror theme hook
  const {
    customTheme,
    customHighlighting,
    editorStyle,
    basicSetup,
    wrapperClass,
  } = useCodeMirrorTheme({
    styleId: 'codemirror-response-theme',
    wrapperClass: 'codemirror-response',
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
      .join('\n');
  };

  // Get status badge variant
  const getStatusVariant = (status: number): 'default' | 'secondary' | 'destructive' => {
    if (status >= 200 && status < 300) return 'default';
    if (status >= 400) return 'destructive';
    return 'secondary';
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle>Response</CardTitle>
        <CardDescription>View the response from your API request</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-2">
              <Loader2 className="size-8 animate-spin mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Sending request...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="flex items-center gap-3 p-4 rounded-lg border border-destructive bg-destructive/10">
            <AlertCircle className="size-5 text-destructive flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-destructive">Request Failed</p>
              <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
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
                <div className={wrapperClass}>
                  <CodeMirror
                    value={response ? formatData(response.data) : 'Send a request to see the response here...'}
                    extensions={[json(), customTheme, customHighlighting]}
                    height="300px"
                    basicSetup={basicSetup}
                    style={editorStyle}
                    editable={false}
                    readOnly={true}
                  />
                </div>
              </TabsContent>

              <TabsContent value="headers">
                <div className={wrapperClass}>
                  <CodeMirror
                    value={response?.headers ? formatHeaders(response.headers) : 'Response headers will appear here...'}
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

            {/* SSE Upgrade Banner */}
            {response && 'isSSE' in response && response.isSSE && onUpgradeToSSE && (
              <div className="mt-4 p-4 rounded-lg border-2 border-blue-500 bg-blue-500/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Radio className="size-5 text-blue-500" />
                    <div>
                      <p className="font-semibold text-sm">Server-Sent Events Detected</p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        This endpoint supports real-time event streaming
                      </p>
                    </div>
                  </div>
                  <Button onClick={onUpgradeToSSE} size="sm">
                    <Radio className="size-4 mr-2" />
                    Connect to Stream
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
