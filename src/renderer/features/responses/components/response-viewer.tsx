// Response viewer component

import { useAtomValue } from 'jotai';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { currentResponseAtom } from '@/stores/response-atoms';
import { requestLoadingAtom, requestErrorAtom } from '@/stores/request-atoms';
import { Loader2, AlertCircle } from 'lucide-react';

export function ResponseViewer() {
  const response = useAtomValue(currentResponseAtom);
  const loading = useAtomValue(requestLoadingAtom);
  const error = useAtomValue(requestErrorAtom);

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
              <TabsList>
                <TabsTrigger value="body">Body</TabsTrigger>
                <TabsTrigger value="headers">Headers</TabsTrigger>
                <TabsTrigger value="cookies">Cookies</TabsTrigger>
              </TabsList>

              <TabsContent value="body">
                <ScrollArea className="h-[300px] w-full rounded-md border">
                  <div className="p-4">
                    <pre className="text-sm font-mono">
                      {response
                        ? formatData(response.data)
                        : 'Send a request to see the response here...'}
                    </pre>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="headers">
                <ScrollArea className="h-[300px] w-full rounded-md border">
                  <div className="p-4">
                    <pre className="text-sm font-mono">
                      {response?.headers
                        ? formatHeaders(response.headers)
                        : 'Response headers will appear here...'}
                    </pre>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="cookies">
                <ScrollArea className="h-[300px] w-full rounded-md border">
                  <div className="p-4">
                    <pre className="text-sm font-mono text-muted-foreground">
                      Cookies will appear here...
                    </pre>
                  </div>
                </ScrollArea>
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
