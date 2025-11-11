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
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Send, Loader2, X } from 'lucide-react';
import { useRequest } from '../hooks';
import type { HttpRequest, HttpMethod } from '@/types';

interface RequestBuilderProps {
  request: HttpRequest;
  onRequestChange?: (request: HttpRequest) => void;
}

export function RequestBuilder({ request, onRequestChange }: RequestBuilderProps) {
  const { sendRequest, loading } = useRequest();

  const handleSend = async () => {
    try {
      await sendRequest(request);
    } catch (error) {
      console.error('Failed to send request:', error);
    }
  };

  const handleMethodChange = (method: HttpMethod) => {
    onRequestChange?.({ ...request, method, updatedAt: Date.now() });
  };

  const handleUrlChange = (url: string) => {
    onRequestChange?.({ ...request, url, updatedAt: Date.now() });
  };

  const handleBodyChange = (content: string) => {
    onRequestChange?.({
      ...request,
      body: content ? { type: request.body?.type || 'json', content } : undefined,
      updatedAt: Date.now(),
    });
  };

  const handleBodyTypeChange = (type: string) => {
    onRequestChange?.({
      ...request,
      body: request.body ? { ...request.body, type: type as any } : { type: type as any, content: '' },
      updatedAt: Date.now(),
    });
  };

  const handleAddHeader = () => {
    const newHeaders = [...(request.headers || []), { key: '', value: '', enabled: true }];
    onRequestChange?.({ ...request, headers: newHeaders, updatedAt: Date.now() });
  };

  const handleHeaderChange = (index: number, field: 'key' | 'value', value: string) => {
    const newHeaders = [...(request.headers || [])];
    newHeaders[index] = { key: '', value: '', enabled: true, ...newHeaders[index], [field]: value };
    onRequestChange?.({ ...request, headers: newHeaders, updatedAt: Date.now() });
  };

  const handleRemoveHeader = (index: number) => {
    const newHeaders = (request.headers || []).filter((_, i) => i !== index);
    onRequestChange?.({ ...request, headers: newHeaders, updatedAt: Date.now() });
  };

  const handleToggleHeader = (index: number) => {
    const newHeaders = [...(request.headers || [])];
    const current = newHeaders[index];
    if (current) {
      newHeaders[index] = { ...current, enabled: !current.enabled };
    }
    onRequestChange?.({ ...request, headers: newHeaders, updatedAt: Date.now() });
  };

  const handleAddParam = () => {
    const newParams = [...(request.params || []), { key: '', value: '', enabled: true }];
    onRequestChange?.({ ...request, params: newParams, updatedAt: Date.now() });
  };

  const handleParamChange = (index: number, field: 'key' | 'value', value: string) => {
    const newParams = [...(request.params || [])];
    newParams[index] = { key: '', value: '', enabled: true, ...newParams[index], [field]: value };
    onRequestChange?.({ ...request, params: newParams, updatedAt: Date.now() });
  };

  const handleRemoveParam = (index: number) => {
    const newParams = (request.params || []).filter((_, i) => i !== index);
    onRequestChange?.({ ...request, params: newParams, updatedAt: Date.now() });
  };

  const handleToggleParam = (index: number) => {
    const newParams = [...(request.params || [])];
    const current = newParams[index];
    if (current) {
      newParams[index] = { ...current, enabled: !current.enabled };
    }
    onRequestChange?.({ ...request, params: newParams, updatedAt: Date.now() });
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
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="GET">
                <Badge variant="outline">GET</Badge>
              </SelectItem>
              <SelectItem value="POST">
                <Badge variant="outline">POST</Badge>
              </SelectItem>
              <SelectItem value="PUT">
                <Badge variant="outline">PUT</Badge>
              </SelectItem>
              <SelectItem value="PATCH">
                <Badge variant="outline">PATCH</Badge>
              </SelectItem>
              <SelectItem value="DELETE">
                <Badge variant="outline">DELETE</Badge>
              </SelectItem>
            </SelectContent>
          </Select>

          <Input
            value={request.url}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="Enter request URL (e.g., https://api.example.com/users)"
            className="flex-1"
          />

          <Button onClick={handleSend} disabled={loading || !request.url}>
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
        </div>

        {/* Request Configuration Tabs */}
        <Tabs defaultValue="params" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="params">Params</TabsTrigger>
            <TabsTrigger value="headers">Headers</TabsTrigger>
            <TabsTrigger value="body">Body</TabsTrigger>
          </TabsList>

          <TabsContent value="params" className="space-y-4">
            <div className="rounded-lg border p-4">
              <div className="flex items-start justify-between mb-4">
                <span className="text-sm font-medium">Query Parameters</span>
                <Button variant="outline" size="sm" onClick={handleAddParam}>
                  <Plus className="size-4 mr-2" />
                  Add Parameter
                </Button>
              </div>
              {!request.params || request.params.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-8">
                  No parameters added yet
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-2 text-xs font-medium text-muted-foreground px-1">
                    <span className="w-8"></span>
                    <span>Key</span>
                    <span>Value</span>
                    <span className="w-8"></span>
                  </div>
                  {request.params.map((param, index) => (
                    <div key={index} className="grid grid-cols-[auto_1fr_1fr_auto] gap-2 items-center">
                      <Checkbox
                        checked={param.enabled !== false}
                        onCheckedChange={() => handleToggleParam(index)}
                      />
                      <Input
                        value={param.key}
                        onChange={(e) => handleParamChange(index, 'key', e.target.value)}
                        placeholder="page"
                        disabled={param.enabled === false}
                      />
                      <Input
                        value={param.value}
                        onChange={(e) => handleParamChange(index, 'value', e.target.value)}
                        placeholder="1"
                        disabled={param.enabled === false}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveParam(index)}
                        className="size-8"
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="headers" className="space-y-4">
            <div className="rounded-lg border p-4">
              <div className="flex items-start justify-between mb-4">
                <span className="text-sm font-medium">Headers</span>
                <Button variant="outline" size="sm" onClick={handleAddHeader}>
                  <Plus className="size-4 mr-2" />
                  Add Header
                </Button>
              </div>
              {!request.headers || request.headers.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-8">
                  No headers added yet
                </div>
              ) : (
                <div className="space-y-2">
                  {request.headers.map((header, index) => (
                    <div key={index} className="w-full flex gap-2 items-center">
                      <Checkbox
                        checked={header.enabled !== false}
                        onCheckedChange={() => handleToggleHeader(index)}
                        className='mt-4'
                      />
                      <div className='flex flex-col items-start gap-1 w-full'>
                        <span className='text-xs font-medium text-muted-foreground'>Key</span>
                        <Input
                          value={header.key}
                          onChange={(e) => handleHeaderChange(index, 'key', e.target.value)}
                          placeholder="Content-Type"
                          disabled={header.enabled === false}
                          className='w-full'
                        />
                      </div>
                      <div className='flex flex-col items-start gap-1 w-full'>
                        <span className='text-xs font-medium text-muted-foreground'>Value</span>
                        <Input
                          value={header.value}
                          onChange={(e) => handleHeaderChange(index, 'value', e.target.value)}
                          placeholder="application/json"
                          disabled={header.enabled === false}
                          className='w-full'
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveHeader(index)}
                        className="size-8 mt-4"
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="body" className="space-y-4">
            <div className="rounded-lg border p-4">
              <div className="flex items-start justify-between mb-4">
                <span className="text-sm font-medium">Request Body</span>
                <Select value={request.body?.type || 'json'} onValueChange={handleBodyTypeChange}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="xml">XML</SelectItem>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="form-data">Form Data</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Textarea
                value={request.body?.content || ''}
                onChange={(e) => handleBodyChange(e.target.value)}
                placeholder='{\n  "name": "John Doe",\n  "email": "john@example.com"\n}'
                className="font-mono text-sm min-h-[200px]"
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
