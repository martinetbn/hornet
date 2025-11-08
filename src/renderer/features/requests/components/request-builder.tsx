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
import { Plus } from 'lucide-react';
import { RequestConfig } from '@/stores/collection-atoms';

interface RequestBuilderProps {
  request: RequestConfig;
  onRequestChange?: (request: RequestConfig) => void;
  onSend?: () => void;
}

export function RequestBuilder({ request, onRequestChange, onSend }: RequestBuilderProps) {
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
          <Select value={request.method} disabled>
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
            placeholder="Enter request URL"
            className="flex-1"
            readOnly
          />

          <Button onClick={onSend}>Send</Button>
        </div>

        {/* Request Configuration Tabs */}
        <Tabs defaultValue="params" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="params">Params</TabsTrigger>
            <TabsTrigger value="headers">Headers</TabsTrigger>
            <TabsTrigger value="body">Body</TabsTrigger>
            <TabsTrigger value="auth">Auth</TabsTrigger>
          </TabsList>

          <TabsContent value="params" className="space-y-4">
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium">Query Parameters</span>
                <Button variant="outline" size="sm">
                  <Plus className="size-4 mr-2" />
                  Add Parameter
                </Button>
              </div>
              <div className="text-sm text-muted-foreground text-center py-8">
                No parameters added yet
              </div>
            </div>
          </TabsContent>

          <TabsContent value="headers" className="space-y-4">
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium">Headers</span>
                <Button variant="outline" size="sm">
                  <Plus className="size-4 mr-2" />
                  Add Header
                </Button>
              </div>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2 text-xs font-medium text-muted-foreground">
                  <span>Key</span>
                  <span>Value</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Content-Type" size={1} />
                  <Input placeholder="application/json" size={1} />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="body" className="space-y-4">
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium">Request Body</span>
                <Select defaultValue="json">
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="xml">XML</SelectItem>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="form">Form Data</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Textarea
                value={request.body || ''}
                placeholder='{\n  "name": "John Doe",\n  "email": "john@example.com"\n}'
                className="font-mono text-sm min-h-[200px]"
                readOnly
              />
            </div>
          </TabsContent>

          <TabsContent value="auth" className="space-y-4">
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium">Authentication</span>
                <Select defaultValue="none">
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Auth</SelectItem>
                    <SelectItem value="bearer">Bearer Token</SelectItem>
                    <SelectItem value="basic">Basic Auth</SelectItem>
                    <SelectItem value="api-key">API Key</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="text-sm text-muted-foreground text-center py-8">
                Select an authentication method
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
