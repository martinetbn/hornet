// Response viewer component

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

interface ResponseViewerProps {
  response?: unknown;
  status?: string;
  time?: string;
  size?: string;
}

export function ResponseViewer({ response, status = '-', time = '-', size = '-' }: ResponseViewerProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Response</CardTitle>
        <CardDescription>View the response from your API request</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="body" className="w-full">
          <TabsList>
            <TabsTrigger value="body">Body</TabsTrigger>
            <TabsTrigger value="headers">Headers</TabsTrigger>
            <TabsTrigger value="cookies">Cookies</TabsTrigger>
          </TabsList>

          <TabsContent value="body">
            <ScrollArea className="h-[300px] w-full rounded-md border">
              <div className="p-4">
                <pre className="text-sm font-mono text-muted-foreground">
                  {response
                    ? JSON.stringify(response, null, 2)
                    : 'Send a request to see the response here...'}
                </pre>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="headers">
            <ScrollArea className="h-[300px] w-full rounded-md border">
              <div className="p-4">
                <pre className="text-sm font-mono text-muted-foreground">
                  Response headers will appear here...
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

        <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>Status: {status}</span>
            <span>Time: {time}</span>
            <span>Size: {size}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
