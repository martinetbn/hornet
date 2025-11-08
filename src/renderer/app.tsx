import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

function App() {
  const [count, setCount] = useState(0);
  const [url, setUrl] = useState('https://api.example.com');

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Welcome to Hornet</CardTitle>
          <CardDescription>
            Multi-protocol API client with HTTP, WebSocket, Socket.IO, and gRPC support
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">API Endpoint</label>
            <div className="flex gap-2">
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter API URL"
                className="flex-1"
              />
              <Button>Send</Button>
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium">Counter Demo</span>
              <span className="text-3xl font-bold">{count}</span>
            </div>

            <div className="flex gap-2">
              <Button onClick={() => setCount(count + 1)} className="flex-1">
                Increment
              </Button>
              <Button
                onClick={() => setCount(count - 1)}
                variant="secondary"
                className="flex-1"
              >
                Decrement
              </Button>
              <Button onClick={() => setCount(0)} variant="outline">
                Reset
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium">Button Variants</h3>
            <div className="flex flex-wrap gap-2">
              <Button variant="default">Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link</Button>
            </div>
          </div>
        </CardContent>

        <CardFooter className="text-sm text-muted-foreground">
          Built with Electron, React, Tailwind CSS 4, and shadcn/ui
        </CardFooter>
      </Card>
    </div>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
