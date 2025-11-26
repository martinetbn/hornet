# shadcn/ui Integration

## Overview

Hornet uses [shadcn/ui](https://ui.shadcn.com/) for building the user interface. shadcn/ui is a collection of beautifully designed, accessible components built with Radix UI and Tailwind CSS.

## Why shadcn/ui?

1. **Copy-Paste Architecture**: Components live in your codebase, not in node_modules - full control
2. **Radix UI Foundation**: Built on accessible, unstyled primitives
3. **Tailwind Native**: Styled with Tailwind CSS for consistency
4. **Highly Customizable**: Modify components directly in your codebase
5. **TypeScript First**: Excellent type safety and IntelliSense
6. **Theme Support**: Built-in dark mode with CSS variables
7. **No Lock-in**: Components are yours to modify as needed

## Installation

Dependencies are already installed:

```bash
# Core dependencies
bun install class-variance-authority clsx tailwind-merge lucide-react
```

## Configuration

### Path Aliases (tsconfig.json)

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/renderer/*"]
    }
  }
}
```

### shadcn Config (components.json)

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/renderer/styles.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

### CSS Variables (styles.css)

The theme uses CSS custom properties for colors:

```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    /* ... more variables */
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    /* ... dark theme */
  }
}
```

## Available Components

### Base Components

These components are already set up in `/src/renderer/components/ui/`:

#### Button

```tsx
import { Button } from '@/components/ui/button';

<Button>Click me</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Cancel</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
```

**Variants:**

- `default` - Primary button
- `destructive` - Dangerous actions (delete, etc.)
- `outline` - Secondary outlined button
- `secondary` - Less prominent action
- `ghost` - Minimal styling
- `link` - Link styling

**Sizes:**

- `default` - Standard size
- `sm` - Small
- `lg` - Large
- `icon` - Square for icons

#### Input

```tsx
import { Input } from '@/components/ui/input';

<Input placeholder="Enter URL" />
<Input type="email" />
<Input disabled />
```

#### Card

```tsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

<Card>
  <CardHeader>
    <CardTitle>API Request</CardTitle>
    <CardDescription>Configure your HTTP request</CardDescription>
  </CardHeader>
  <CardContent>{/* Card content */}</CardContent>
  <CardFooter>{/* Card footer */}</CardFooter>
</Card>;
```

### Adding More Components

Use the shadcn CLI to add components. This is the **recommended and proper way**:

```bash
# Add a single component
bunx --bun shadcn@latest add button

# Add multiple components at once
bunx --bun shadcn@latest add button input card

# Add all commonly used components
bunx --bun shadcn@latest add tabs select dialog dropdown-menu
```

The CLI will:

1. Install required dependencies automatically
2. Create component files in `src/renderer/components/ui/`
3. Configure imports correctly
4. Handle all the setup for you

**Example: Adding a Dropdown Menu**

```bash
# Just run this command - it handles everything!
bunx --bun shadcn@latest add dropdown-menu

# Then use it in your app:
import { DropdownMenu } from '@/components/ui/dropdown-menu';
```

**Never manually copy components** - always use the CLI to ensure proper installation and compatibility.

## Component Examples

### Request Builder UI

```tsx
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function RequestBuilder() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>New Request</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Select defaultValue="GET">
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="GET">GET</SelectItem>
              <SelectItem value="POST">POST</SelectItem>
              <SelectItem value="PUT">PUT</SelectItem>
              <SelectItem value="DELETE">DELETE</SelectItem>
            </SelectContent>
          </Select>

          <Input placeholder="https://api.example.com" className="flex-1" />

          <Button>Send</Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

### Tabs for Protocol Selection

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function ProtocolTabs() {
  return (
    <Tabs defaultValue="http">
      <TabsList>
        <TabsTrigger value="http">HTTP</TabsTrigger>
        <TabsTrigger value="websocket">WebSocket</TabsTrigger>
        <TabsTrigger value="socketio">Socket.IO</TabsTrigger>
        <TabsTrigger value="grpc">gRPC</TabsTrigger>
      </TabsList>

      <TabsContent value="http">
        <HttpRequestBuilder />
      </TabsContent>
      <TabsContent value="websocket">
        <WebSocketBuilder />
      </TabsContent>
      {/* ... */}
    </Tabs>
  );
}
```

### Dialog for Modals

```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

function SaveCollectionDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Save Collection</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save Collection</DialogTitle>
          <DialogDescription>
            Enter a name for your collection
          </DialogDescription>
        </DialogHeader>
        {/* Dialog content */}
      </DialogContent>
    </Dialog>
  );
}
```

## Recommended Components for Hornet

Based on the API client use case, these components will be useful:

### Essential

- ✅ **Button** - Actions and controls
- ✅ **Input** - URL inputs, text fields
- ✅ **Card** - Grouping content
- **Tabs** - Protocol switching, response views
- **Select** - HTTP methods, auth types
- **Dialog** - Modals for save/import/export
- **Dropdown Menu** - Context menus, actions

### UI Enhancement

- **Accordion** - Collapsible sections
- **Separator** - Visual dividers
- **Badge** - Status indicators
- **Toast** - Notifications
- **Tooltip** - Help text
- **Switch** - Toggle options
- **Checkbox** - Multiple selections
- **Radio Group** - Single selection

### Advanced

- **Popover** - Floating panels
- **Command** - Command palette (Cmd+K)
- **Table** - Headers/params display
- **Scroll Area** - Response viewing
- **Resizable** - Split panes
- **Sheet** - Side panels

## Customization

### Modifying Components

Components are in your codebase, so customize freely:

```tsx
// src/renderer/components/ui/button.tsx

// Add new variant
const buttonVariants = cva("inline-flex items-center...", {
  variants: {
    variant: {
      default: "...",
      // Add custom variant
      success: "bg-green-600 text-white hover:bg-green-700",
    },
  },
});

// Use it
<Button variant="success">Success!</Button>;
```

### Theming

Modify colors in `styles.css`:

```css
:root {
  --primary: 221.2 83.2% 53.3%; /* Change primary color */
  --destructive: 0 84.2% 60.2%; /* Change destructive color */
}
```

### Dark Mode

Add dark mode toggle:

```tsx
function ThemeToggle() {
  const [theme, setTheme] = useState("light");

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.classList.toggle("dark");
  };

  return <Button onClick={toggleTheme}>Toggle Theme</Button>;
}
```

## Best Practices

### 1. Use Composition

Build complex UIs by composing components:

```tsx
function RequestCard({ request }: { request: Request }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{request.name}</CardTitle>
          <Badge>{request.method}</Badge>
        </div>
        <CardDescription>{request.url}</CardDescription>
      </CardHeader>
      <CardContent>{/* Request details */}</CardContent>
      <CardFooter>
        <Button variant="outline">Edit</Button>
        <Button>Send</Button>
      </CardFooter>
    </Card>
  );
}
```

### 2. Consistent Spacing

Use Tailwind's spacing scale:

```tsx
<div className="space-y-4">  {/* Vertical spacing */}
  <Input />
  <Button />
</div>

<div className="flex gap-2">  {/* Horizontal spacing */}
  <Button />
  <Button />
</div>
```

### 3. Semantic HTML

shadcn components use proper semantic elements:

```tsx
// Button component renders <button>
<Button>Click</Button>

// Use asChild when you need different element
<Button asChild>
  <a href="/docs">Documentation</a>
</Button>
```

### 4. Accessibility

Components are accessible by default, but add labels:

```tsx
<div>
  <label htmlFor="url" className="text-sm font-medium">
    API URL
  </label>
  <Input id="url" placeholder="https://api.example.com" />
</div>
```

### 5. Type Safety

Use proper TypeScript types:

```tsx
import type { ButtonProps } from "@/components/ui/button";

interface MyButtonProps extends ButtonProps {
  loading?: boolean;
}

function MyButton({ loading, children, ...props }: MyButtonProps) {
  return (
    <Button disabled={loading} {...props}>
      {loading ? "Loading..." : children}
    </Button>
  );
}
```

## Utilities

### cn() Helper

The `cn()` utility merges Tailwind classes properly:

```tsx
import { cn } from '@/lib/utils';

// Handles conflicts (rightmost wins)
cn('px-2 py-1', 'px-4') // Result: 'py-1 px-4'

// Conditional classes
cn('base-class', isActive && 'active-class', error && 'error-class')

// Use in components
<Button className={cn('my-custom-class', className)} />
```

## Integration with Jotai

Combine shadcn/ui with Jotai state:

```tsx
import { useAtom } from "jotai";
import { currentRequestAtom } from "@/stores";
import { Input } from "@/components/ui/input";

function UrlInput() {
  const [request, setRequest] = useAtom(currentRequestAtom);

  return (
    <Input
      value={request?.url ?? ""}
      onChange={(e) =>
        setRequest((prev) => ({ ...prev!, url: e.target.value }))
      }
      placeholder="https://api.example.com"
    />
  );
}
```

## Resources

- **Official Docs**: https://ui.shadcn.com/docs
- **Components**: https://ui.shadcn.com/docs/components
- **Themes**: https://ui.shadcn.com/themes
- **Examples**: https://ui.shadcn.com/examples
- **Radix UI**: https://www.radix-ui.com/
- **Class Variance Authority**: https://cva.style/docs

## Troubleshooting

### Import Errors

**Problem**: `Cannot find module '@/components/ui/button'`

**Solution**: Check `tsconfig.json` has path aliases:

```json
{
  "baseUrl": ".",
  "paths": {
    "@/*": ["./src/renderer/*"]
  }
}
```

### Styling Issues

**Problem**: Styles not applying

**Solution**: Ensure `styles.css` has CSS variables and is imported in your app

### Dark Mode Not Working

**Problem**: Dark mode colors not changing

**Solution**: Add `dark` class to `<html>` or `<body>`:

```tsx
document.documentElement.classList.add("dark");
```

## Migration from Custom Components

If you have existing custom components, gradually migrate:

1. **Keep Both**: Run shadcn alongside custom components
2. **Replace Gradually**: Replace one component at a time
3. **Maintain Consistency**: Use similar patterns
4. **Test Thoroughly**: Ensure no functionality lost
