// HTTP Request Builder component

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Send, Loader2, XCircle } from 'lucide-react';
import { useRequest } from '../hooks';
import type { HttpRequest, HttpMethod } from '@/types';
import { BodyEditor } from './body-editor';
import { KeyValueEditor } from './key-value-editor';
import { useAtomValue } from 'jotai';
import { currentResponseAtom } from '@/stores/response-atoms';

interface RequestBuilderProps {
  request: HttpRequest;
  onRequestChange?: (request: HttpRequest) => void;
}

export function RequestBuilder({ request, onRequestChange }: RequestBuilderProps) {
  const { sendRequest, loading, isStreaming, disconnectStream } = useRequest();
  const response = useAtomValue(currentResponseAtom);

  // Check if currently streaming
  const activelyStreaming = response && 'isSSE' in response && response.isSSE && isStreaming();

  const handleSend = async () => {
    try {
      await sendRequest(request);
    } catch (error) {
      console.error('Failed to send request:', error);
    }
  };

  const handleDisconnect = () => {
    disconnectStream();
  };

  const handleMethodChange = (method: HttpMethod) => {
    onRequestChange?.({ ...request, method, updatedAt: Date.now() });
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>HTTP Request</CardTitle>
        <CardDescription>
          Configure and send HTTP requests to test your APIs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Request URL Section */}
        <div className="flex gap-2">
          <Select value={request.method} onValueChange={handleMethodChange}>
            <SelectTrigger className="w-32 h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="GET">
                <span className="font-semibold text-green-500">GET</span>
              </SelectItem>
              <SelectItem value="POST">
                <span className="font-semibold text-yellow-500">POST</span>
              </SelectItem>
              <SelectItem value="PUT">
                <span className="font-semibold text-blue-500">PUT</span>
              </SelectItem>
              <SelectItem value="PATCH">
                <span className="font-semibold text-purple-500">PATCH</span>
              </SelectItem>
              <SelectItem value="DELETE">
                <span className="font-semibold text-red-500">DELETE</span>
              </SelectItem>
            </SelectContent>
          </Select>

          <Input
            value={request.url}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="Enter request URL (e.g., https://api.example.com/users)"
            className="flex-1 h-10"
          />

          {activelyStreaming ? (
            <Button onClick={handleDisconnect} variant="destructive" className="h-10">
              <XCircle className="size-4 mr-2" />
              Disconnect
            </Button>
          ) : (
            <Button onClick={handleSend} disabled={loading || !request.url} className="h-10">
              {loading ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Sending
                </>
              ) : (
                <>
                  <Send className="size-4 mr-2" />
                  Send
                </>
              )}
            </Button>
          )}
        </div>

        {/* Request Configuration Tabs */}
        <Tabs defaultValue="params" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="params">Params</TabsTrigger>
            <TabsTrigger value="headers">Headers</TabsTrigger>
            <TabsTrigger value="body">Body</TabsTrigger>
          </TabsList>

          <TabsContent value="params" className="space-y-4">
            <KeyValueEditor
              title="Query Parameters"
              items={request.params || []}
              onItemsChange={handleParamsChange}
              keyPlaceholder="page"
              valuePlaceholder="1"
            />
          </TabsContent>

          <TabsContent value="headers" className="space-y-4">
            <KeyValueEditor
              title="Headers"
              items={request.headers || []}
              onItemsChange={handleHeadersChange}
              keyPlaceholder="Content-Type"
              valuePlaceholder="application/json"
            />
          </TabsContent>

          <TabsContent value="body" className="space-y-4">
            <BodyEditor request={request} onRequestChange={onRequestChange} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
