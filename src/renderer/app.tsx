import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Folder,
  History,
  Settings,
  Globe,
  Plus,
  Save,
  Moon,
  Sun,
  ChevronRight,
  File,
} from 'lucide-react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarRail,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';

// Sample data for API collections
const collectionsData = [
  [
    'My APIs',
    ['Users', 'GET /users', 'POST /users', 'GET /users/:id'],
    ['Posts', 'GET /posts', 'POST /posts', 'DELETE /posts/:id'],
    'GET /health',
  ],
  [
    'Testing',
    ['Auth', 'POST /login', 'POST /register', 'POST /refresh'],
    ['Products', 'GET /products', 'POST /products'],
  ],
  ['E-commerce', 'GET /cart', 'POST /checkout'],
];

type TreeItem = string | TreeItem[];

interface TreeProps {
  item: TreeItem;
  path?: string[];
  onSelect?: (path: string[]) => void;
}

function Tree({ item, path = [], onSelect }: TreeProps) {
  const [name, ...items] = Array.isArray(item) ? item : [item];
  const currentPath = [...path, name as string];

  if (!items.length) {
    return (
      <SidebarMenuButton
        className="data-[active=true]:bg-transparent"
        onClick={() => onSelect?.(currentPath)}
      >
        <File className="shrink-0" />
        <span className="truncate">{name}</span>
      </SidebarMenuButton>
    );
  }

  return (
    <SidebarMenuItem>
      <Collapsible
        className="group/collapsible [&[data-state=open]>button>svg:first-child]:rotate-90"
        defaultOpen={name === 'My APIs'}
      >
        <CollapsibleTrigger asChild>
          <SidebarMenuButton>
            <ChevronRight className="transition-transform shrink-0" />
            <Folder className="shrink-0" />
            <span className="truncate">{name}</span>
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub className="mx-0 px-0 pl-4">
            {items.map((subItem, index) => (
              <Tree key={index} item={subItem} path={currentPath} onSelect={onSelect} />
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  );
}

function App() {
  const [method, setMethod] = useState('GET');
  const [url, setUrl] = useState('https://api.example.com/users');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [breadcrumbPath, setBreadcrumbPath] = useState<string[]>(['New Request']);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <SidebarProvider>
      <ResizablePanelGroup direction="horizontal" className="h-screen">
        <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
          <Sidebar collapsible="none" side="left" className="border-r w-full h-screen overflow-x-hidden overflow-y-auto">
            <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                <div className="flex items-center justify-center size-8 rounded-lg bg-primary text-primary-foreground font-bold">
                  H
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Hornet</span>
                  <span className="truncate text-xs text-muted-foreground">API Client</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent className="overflow-x-hidden">
          <SidebarGroup>
            <SidebarGroupLabel>Workspace</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive>
                    <Folder className="size-4 shrink-0" />
                    <span className="truncate">Collections</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <History className="size-4 shrink-0" />
                    <span className="truncate">History</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <Globe className="size-4 shrink-0" />
                    <span className="truncate">Environments</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>Collections</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {collectionsData.map((item, index) => (
                  <Tree key={index} item={item} onSelect={setBreadcrumbPath} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton>
                <Settings className="size-4 shrink-0" />
                <span className="truncate">Settings</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
          </Sidebar>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={80}>
          <SidebarInset className="h-screen overflow-auto">
        {/* Header */}
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-background">
          <div className="flex items-center gap-2 flex-1">
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbPath.map((item, index) => (
                  <div key={index} className="flex items-center">
                    {index > 0 && <BreadcrumbSeparator />}
                    <BreadcrumbItem>
                      {index === breadcrumbPath.length - 1 ? (
                        <BreadcrumbPage>{item}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink href="#" onClick={(e) => {
                          e.preventDefault();
                          setBreadcrumbPath(breadcrumbPath.slice(0, index + 1));
                        }}>
                          {item}
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </div>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Save className="size-4 mr-2" />
              Save
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === 'light' ? (
                <Moon className="size-4" />
              ) : (
                <Sun className="size-4" />
              )}
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex flex-1 flex-col gap-4 p-4">
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
                <Select value={method} onValueChange={setMethod}>
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
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Enter request URL"
                  className="flex-1"
                />

                <Button>Send</Button>
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
                      <span className="text-sm font-medium">
                        Query Parameters
                      </span>
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
                      placeholder='{\n  "name": "John Doe",\n  "email": "john@example.com"\n}'
                      className="font-mono text-sm min-h-[200px]"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="auth" className="space-y-4">
                  <div className="rounded-lg border p-4">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium">
                        Authentication
                      </span>
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

          {/* Response Section */}
          <Card>
            <CardHeader>
              <CardTitle>Response</CardTitle>
              <CardDescription>
                View the response from your API request
              </CardDescription>
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
                        Send a request to see the response here...
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
                  <span>Status: -</span>
                  <span>Time: -</span>
                  <span>Size: -</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
          </SidebarInset>
        </ResizablePanel>
      </ResizablePanelGroup>
    </SidebarProvider>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
