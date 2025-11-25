// gRPC Request Builder component

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Send, Loader2, Upload } from 'lucide-react';
import type { GrpcRequest } from '@/types';
import { KeyValueEditor } from './key-value-editor';
import { JsonEditor } from './json-editor';

interface GrpcBuilderProps {
  request: GrpcRequest;
  onRequestChange?: (request: GrpcRequest) => void;
}

interface ProtoMethod {
  name: string;
  fullName: string;
  service: string;
  isStreaming: boolean;
}

// Simple proto file parser to extract service methods
function parseProtoFile(content: string): ProtoMethod[] {
  const methods: ProtoMethod[] = [];

  // Extract package name
  const packageMatch = content.match(/package\s+([a-zA-Z0-9_.]+)\s*;/);
  const packageName = packageMatch ? packageMatch[1] : '';

  // Find all services
  const serviceRegex = /service\s+([a-zA-Z0-9_]+)\s*\{([^}]+)\}/g;
  let serviceMatch;

  while ((serviceMatch = serviceRegex.exec(content)) !== null) {
    const serviceName = serviceMatch[1];
    const serviceBody = serviceMatch[2];
    const fullServiceName = packageName ? `${packageName}.${serviceName}` : serviceName;

    // Find all RPC methods in this service
    const rpcRegex = /rpc\s+([a-zA-Z0-9_]+)\s*\(([^)]+)\)\s*returns\s*\(([^)]+)\)/g;
    let rpcMatch;

    while ((rpcMatch = rpcRegex.exec(serviceBody)) !== null) {
      const methodName = rpcMatch[1];
      const fullName = `${fullServiceName}/${methodName}`;

      methods.push({
        name: methodName,
        fullName,
        service: fullServiceName,
        isStreaming: false, // TODO: Detect streaming from 'stream' keyword
      });
    }
  }

  return methods;
}

import { useAtomValue } from 'jotai';
import { activeWorkspaceVariablesAtom } from '@/stores/environment-atoms';
import { resolveGrpcVariables } from '@/lib/utils/variable-resolver';

export function GrpcBuilder({ request, onRequestChange }: GrpcBuilderProps) {
  const variables = useAtomValue(activeWorkspaceVariablesAtom);
  const loading = false; // TODO: Implement gRPC request hook
  const [availableMethods, setAvailableMethods] = useState<ProtoMethod[]>([]);

  // Parse proto content on component mount or when proto content changes
  useEffect(() => {
    if (request.protoContent) {
      // Resolve variables in the request before parsing proto file if needed?
      // But protoContent is the file content, variables might be in protoFile path
      const methods = parseProtoFile(request.protoContent);
      setAvailableMethods(methods);
    } else {
      setAvailableMethods([]);
    }
  }, [request.protoContent]);

  const handleSend = async () => {
    // Resolve variables before sending
    const resolvedRequest = resolveGrpcVariables(request, variables);
    
    // TODO: Implement gRPC send functionality using resolvedRequest
    console.log('Sending gRPC request:', resolvedRequest);
  };

  const handleUrlChange = (url: string) => {
    onRequestChange?.({ ...request, url, updatedAt: Date.now() });
  };

  const handleProtoFileChange = (protoFile: string, content?: string) => {
    onRequestChange?.({
      ...request,
      protoFile,
      protoContent: content,
      updatedAt: Date.now()
    });
  };

  const handleMethodChange = (methodFullName: string) => {
    // Find the method details
    const methodDetails = availableMethods.find(m => m.fullName === methodFullName);

    onRequestChange?.({
      ...request,
      method: methodFullName,
      service: methodDetails?.service,
      updatedAt: Date.now()
    });
  };

  const handleDataChange = (data: string) => {
    try {
      const parsedData = JSON.parse(data);
      onRequestChange?.({ ...request, data: parsedData, updatedAt: Date.now() });
    } catch (error) {
      // Keep the string value if JSON parsing fails
      onRequestChange?.({ ...request, data, updatedAt: Date.now() });
    }
  };

  const handleMetadataChange = (items: Array<{ key: string; value: string; enabled?: boolean }>) => {
    const metadata = items
      .filter((item) => item.enabled !== false && item.key && item.value)
      .reduce((acc, item) => {
        acc[item.key] = item.value;
        return acc;
      }, {} as Record<string, string>);

    onRequestChange?.({ ...request, metadata, updatedAt: Date.now() });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const content = await file.text();
        // Parse and store the proto file
        handleProtoFileChange(file.name, content);
      } catch (error) {
        console.error('Failed to read proto file:', error);
      }
    }
  };

  // Convert metadata object to key-value pairs for the editor
  const metadataItems = Object.entries(request.metadata || {}).map(([key, value]) => ({
    key,
    value,
    enabled: true,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>gRPC Request</CardTitle>
        <CardDescription>
          Configure and send gRPC requests using Protocol Buffers
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Server URL Section */}
        <div className="flex gap-2">
          <Input
            value={request.url}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="Enter server address (e.g., localhost:50051)"
            className="flex-1 h-10"
          />

          <Button onClick={handleSend} disabled={loading || !request.url || !request.method} className="h-10">
            {loading ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Invoking
              </>
            ) : (
              <>
                <Send className="size-4 mr-2" />
                Invoke
              </>
            )}
          </Button>
        </div>

        {/* Request Configuration Tabs */}
        <Tabs defaultValue="method" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="method">Method</TabsTrigger>
            <TabsTrigger value="message">Message</TabsTrigger>
            <TabsTrigger value="metadata">Metadata</TabsTrigger>
          </TabsList>

          <TabsContent value="method" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="proto-file">Proto File</Label>
                <div className="flex gap-2">
                  <Input
                    id="proto-file"
                    value={request.protoFile}
                    onChange={(e) => handleProtoFileChange(e.target.value)}
                    placeholder="Select or paste path to .proto file"
                    className="flex-1"
                  />
                  <Button variant="outline" asChild>
                    <label htmlFor="proto-upload" className="cursor-pointer">
                      <Upload className="size-4 mr-2" />
                      Select File
                      <input
                        id="proto-upload"
                        type="file"
                        accept=".proto"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                    </label>
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Upload your .proto file to load available methods
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="method">Method</Label>
                <Select
                  value={request.method}
                  onValueChange={handleMethodChange}
                  disabled={availableMethods.length === 0}
                >
                  <SelectTrigger id="method">
                    <SelectValue placeholder={
                      availableMethods.length === 0
                        ? "Load a proto file first"
                        : "Select a method"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMethods.map((method) => (
                      <SelectItem key={method.fullName} value={method.fullName}>
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{method.name}</span>
                          <span className="text-xs text-muted-foreground">{method.service}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {availableMethods.length > 0
                    ? `${availableMethods.length} method${availableMethods.length !== 1 ? 's' : ''} available`
                    : 'Upload a proto file to see available methods'}
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="message" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="message-data">Message (JSON)</Label>
              <JsonEditor
                value={typeof request.data === 'string' ? request.data : JSON.stringify(request.data, null, 2)}
                onChange={handleDataChange}
                placeholder='{\n  "id": 1,\n  "name": "example"\n}'
                height="200px"
              />
              <p className="text-xs text-muted-foreground">
                Enter the request message in JSON format
              </p>
            </div>
          </TabsContent>

          <TabsContent value="metadata" className="space-y-4">
            <KeyValueEditor
              title="Metadata"
              items={metadataItems}
              onItemsChange={handleMetadataChange}
              keyPlaceholder="authorization"
              valuePlaceholder="Bearer token"
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
