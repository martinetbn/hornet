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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Send, Loader2, X } from 'lucide-react';
import { useRequest } from '../hooks';
import type { HttpRequest, HttpMethod } from '@/types';
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { html } from '@codemirror/lang-html';
import { xml } from '@codemirror/lang-xml';
import { EditorView } from '@codemirror/view';
import { syntaxHighlighting, HighlightStyle } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';
import { useMemo, useEffect, useState, useRef, useCallback, memo } from 'react';

interface RequestBuilderProps {
  request: HttpRequest;
  onRequestChange?: (request: HttpRequest) => void;
}

export function RequestBuilder({ request, onRequestChange }: RequestBuilderProps) {
  const { sendRequest, loading } = useRequest();
  const [isDark, setIsDark] = useState(false);
  const [localBodyContent, setLocalBodyContent] = useState(request.body?.content || '');
  const [themeColors, setThemeColors] = useState<Record<string, string>>({});
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const requestRef = useRef(request);
  const onRequestChangeRef = useRef(onRequestChange);

  // Keep refs up to date
  useEffect(() => {
    requestRef.current = request;
    onRequestChangeRef.current = onRequestChange;
  });

  // Helper function to get CSS variable value and convert to RGB
  const getCSSVar = useCallback((varName: string) => {
    const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();

    if (!value) return '';

    // Create a temporary element to get the computed RGB color
    const tempEl = document.createElement('div');
    tempEl.style.display = 'none';

    // Wrap the value in the appropriate color function if needed
    let colorValue = value;
    if (!value.startsWith('oklch') && !value.startsWith('hsl') && !value.startsWith('#') && !value.startsWith('rgb')) {
      // Check if it looks like an OKLCH value (has numbers)
      const parts = value.split(/\s+/);
      if (parts.length >= 2) {
        colorValue = `oklch(${value})`;
      } else {
        colorValue = `hsl(${value})`;
      }
    }

    tempEl.style.color = colorValue;
    document.body.appendChild(tempEl);

    // Get the computed color in RGB format
    const computedColor = getComputedStyle(tempEl).color;
    document.body.removeChild(tempEl);

    return computedColor;
  }, []);

  // Update theme colors when dark mode changes
  useEffect(() => {
    const updateColors = () => {
      // Use requestAnimationFrame to ensure CSS has been applied
      requestAnimationFrame(() => {
        const colors = {
          background: getCSSVar('--background'),
          foreground: getCSSVar('--foreground'),
          sidebarPrimary: getCSSVar('--sidebar-primary'),
          accent: getCSSVar('--accent'),
          accentForeground: getCSSVar('--accent-foreground'),
          muted: getCSSVar('--muted'),
          mutedForeground: getCSSVar('--muted-foreground'),
          popover: getCSSVar('--popover'),
          popoverForeground: getCSSVar('--popover-foreground'),
          border: getCSSVar('--border'),
          destructive: getCSSVar('--destructive'),
        };

        console.log('CodeMirror theme colors (RGB):', colors, 'isDark:', isDark);
        setThemeColors(colors);
      });
    };

    updateColors();
  }, [isDark, getCSSVar]);

  // Inject custom styles for CodeMirror
  useEffect(() => {
    if (!themeColors.background || !themeColors.foreground) return;

    const styleId = 'codemirror-custom-theme';
    let styleEl = document.getElementById(styleId) as HTMLStyleElement;

    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }

    styleEl.textContent = `
      .codemirror-wrapper .cm-editor {
        background-color: ${themeColors.background} !important;
        color: ${themeColors.foreground} !important;
      }
      .codemirror-wrapper .cm-content {
        background-color: transparent !important;
        color: inherit !important;
      }
      .codemirror-wrapper .cm-line {
        color: ${themeColors.foreground} !important;
      }
      .codemirror-wrapper .cm-gutters {
        background-color: ${themeColors.muted} !important;
        color: ${themeColors.mutedForeground} !important;
        border: none !important;
      }
    `;

    return () => {
      // Don't remove on unmount to avoid flashing, just update when colors change
    };
  }, [themeColors]);

  // Sync local state when request changes from outside (but not while user is typing)
  useEffect(() => {
    const newContent = request.body?.content || '';
    // Only sync if there's no pending debounce (user isn't actively typing) and content differs
    if (!debounceTimerRef.current) {
      setLocalBodyContent(newContent);
    }
  }, [request.body?.content]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Detect dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      const isDarkMode = document.documentElement.classList.contains('dark');
      console.log('Dark mode detected:', isDarkMode);
      setIsDark(isDarkMode);
    };

    checkDarkMode();

    // Watch for theme changes
    const observer = new MutationObserver(() => {
      // Add a small delay to ensure CSS variables are updated
      requestAnimationFrame(() => {
        checkDarkMode();
      });
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  const handleSend = async () => {
    // Flush any pending debounced changes before sending
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      onRequestChange?.({
        ...request,
        body: { type: request.body?.type || 'json', content: localBodyContent },
        updatedAt: Date.now(),
      });
    }

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

  const handleBodyChange = useCallback((content: string) => {
    // Update local state immediately for responsive typing
    setLocalBodyContent(content);

    // Debounce the parent state update
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      const currentRequest = requestRef.current;
      const changeHandler = onRequestChangeRef.current;

      changeHandler?.({
        ...currentRequest,
        body: { type: currentRequest.body?.type || 'json', content },
        updatedAt: Date.now(),
      });
    }, 500); // Increased to 500ms debounce
  }, []); // No dependencies - uses refs instead

  const handleBodyTypeChange = (type: string) => {
    // Flush any pending changes first
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    onRequestChange?.({
      ...request,
      body: {
        type: type as any,
        content: localBodyContent
      },
      updatedAt: Date.now(),
    });
  };

  const handleHeaderChange = (index: number, field: 'key' | 'value', value: string) => {
    const newHeaders = [...(request.headers || [])];
    newHeaders[index] = { key: '', value: '', enabled: true, ...newHeaders[index], [field]: value };

    // Auto-add a new empty header if this is the last one and user is typing
    const isLastHeader = index === newHeaders.length - 1;
    const updatedHeader = newHeaders[index];
    if (isLastHeader && (updatedHeader.key || updatedHeader.value)) {
      newHeaders.push({ key: '', value: '', enabled: true });
    }

    onRequestChange?.({ ...request, headers: newHeaders, updatedAt: Date.now() });
  };

  const handleRemoveHeader = (index: number) => {
    const newHeaders = (request.headers || []).filter((_, i) => i !== index);
    // Ensure we always have at least one empty header
    if (newHeaders.length === 0) {
      newHeaders.push({ key: '', value: '', enabled: true });
    }
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

  const handleParamChange = (index: number, field: 'key' | 'value', value: string) => {
    const newParams = [...(request.params || [])];
    newParams[index] = { key: '', value: '', enabled: true, ...newParams[index], [field]: value };

    // Auto-add a new empty param if this is the last one and user is typing
    const isLastParam = index === newParams.length - 1;
    const updatedParam = newParams[index];
    if (isLastParam && (updatedParam.key || updatedParam.value)) {
      newParams.push({ key: '', value: '', enabled: true });
    }

    onRequestChange?.({ ...request, params: newParams, updatedAt: Date.now() });
  };

  const handleRemoveParam = (index: number) => {
    const newParams = (request.params || []).filter((_, i) => i !== index);
    // Ensure we always have at least one empty param
    if (newParams.length === 0) {
      newParams.push({ key: '', value: '', enabled: true });
    }
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

  // Get the appropriate language extension based on body type
  const languageExtensions = useMemo(() => {
    const lang = (() => {
      switch (request.body?.type) {
        case 'json':
          return json();
        case 'html':
          return html();
        case 'xml':
          return xml();
        default:
          return null;
      }
    })();

    return lang ? [lang] : [];
  }, [request.body?.type]);

  // Memoize basicSetup to prevent recreation
  const basicSetup = useMemo(() => ({
    lineNumbers: true,
    highlightActiveLineGutter: false,
    highlightActiveLine: false,
    foldGutter: false,
    dropCursor: true,
    indentOnInput: true,
    bracketMatching: true,
    closeBrackets: true,
    autocompletion: false,
    rectangularSelection: false,
    highlightSelectionMatches: false,
  }), []);

  // Memoize editor style
  const editorStyle = useMemo(() => {
    const style: React.CSSProperties = {
      fontSize: '14px',
      border: '1px solid hsl(var(--border))',
      borderRadius: 'var(--radius)',
    };

    // Force background and text color if we have theme colors
    if (themeColors.background && themeColors.foreground) {
      style.backgroundColor = themeColors.background;
      style.color = themeColors.foreground;
    }

    return style;
  }, [themeColors]);

  // Create custom syntax highlighting using app CSS variables
  const customHighlighting = useMemo(() => {
    if (!themeColors.sidebarPrimary) return syntaxHighlighting(HighlightStyle.define([]));

    return syntaxHighlighting(
      HighlightStyle.define([
        { tag: t.keyword, color: themeColors.sidebarPrimary },
        { tag: [t.name, t.deleted, t.character, t.propertyName, t.macroName], color: themeColors.foreground },
        { tag: [t.function(t.variableName), t.labelName], color: themeColors.sidebarPrimary },
        { tag: [t.color, t.constant(t.name), t.standard(t.name)], color: themeColors.sidebarPrimary },
        { tag: [t.definition(t.name), t.separator], color: themeColors.foreground },
        { tag: [t.typeName, t.className, t.number, t.changed, t.annotation, t.modifier, t.self, t.namespace], color: themeColors.sidebarPrimary },
        { tag: [t.operator, t.operatorKeyword, t.url, t.escape, t.regexp, t.link, t.special(t.string)], color: themeColors.foreground },
        { tag: [t.meta, t.comment], color: themeColors.mutedForeground, fontStyle: 'italic' },
        { tag: t.strong, fontWeight: 'bold' },
        { tag: t.emphasis, fontStyle: 'italic' },
        { tag: t.strikethrough, textDecoration: 'line-through' },
        { tag: t.link, color: themeColors.sidebarPrimary, textDecoration: 'underline' },
        { tag: t.heading, fontWeight: 'bold', color: themeColors.sidebarPrimary },
        { tag: [t.atom, t.bool, t.special(t.variableName)], color: themeColors.sidebarPrimary },
        { tag: [t.processingInstruction, t.string, t.inserted], color: themeColors.sidebarPrimary },
        { tag: t.invalid, color: themeColors.destructive },
      ])
    );
  }, [themeColors]);

  // Create custom theme using app CSS variables
  const customTheme = useMemo(() => {
    if (!themeColors.background) {
      console.log('No theme colors yet, using default theme');
      return EditorView.theme({}, { dark: isDark });
    }

    console.log('Creating CodeMirror theme with colors:', {
      bg: themeColors.background,
      fg: themeColors.foreground,
      isDark
    });

    return EditorView.theme({
      '&': {
        backgroundColor: `${themeColors.background} !important`,
        color: `${themeColors.foreground} !important`,
      },
      '.cm-content': {
        caretColor: `${themeColors.sidebarPrimary} !important`,
        fontFamily: 'var(--font-family)',
        backgroundColor: 'transparent !important',
        color: 'inherit !important',
      },
      '.cm-line': {
        color: `${themeColors.foreground} !important`,
      },
      '.cm-cursor, .cm-dropCursor': {
        borderLeftColor: `${themeColors.sidebarPrimary} !important`,
      },
      '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
        backgroundColor: `${themeColors.accent} !important`,
      },
      '.cm-activeLine': {
        backgroundColor: `${themeColors.muted} !important`,
        opacity: '0.3',
      },
      '.cm-gutters': {
        backgroundColor: `${themeColors.muted} !important`,
        color: `${themeColors.mutedForeground} !important`,
        border: 'none',
      },
      '.cm-activeLineGutter': {
        backgroundColor: `${themeColors.accent} !important`,
      },
      '.cm-foldPlaceholder': {
        backgroundColor: `${themeColors.accent} !important`,
        border: 'none',
        color: `${themeColors.accentForeground} !important`,
      },
      '.cm-tooltip': {
        backgroundColor: `${themeColors.popover} !important`,
        border: `1px solid ${themeColors.border}`,
        color: `${themeColors.popoverForeground} !important`,
      },
      '.cm-tooltip-autocomplete': {
        '& > ul > li[aria-selected]': {
          backgroundColor: `${themeColors.accent} !important`,
          color: `${themeColors.accentForeground} !important`,
        },
      },
    }, { dark: isDark });
  }, [themeColors, isDark]);

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
              </div>
              <div className="space-y-2">
                {(() => {
                  // Ensure we always have at least one empty param
                  const params = request.params && request.params.length > 0
                    ? request.params
                    : [{ key: '', value: '', enabled: true }];

                  return params.map((param, index) => {
                    // Hide delete button if it's the last param and it's empty
                    const isLastParam = index === params.length - 1;
                    const isEmpty = !param.key && !param.value;
                    const shouldShowDelete = !(isLastParam && isEmpty);

                    return (
                      <div key={index} className="w-full flex gap-2 items-center">
                        <Checkbox
                          checked={param.enabled !== false}
                          onCheckedChange={() => handleToggleParam(index)}
                          className='mt-4'
                        />
                        <div className='flex flex-col items-start gap-1 w-full'>
                          <span className='text-xs font-medium text-muted-foreground'>Key</span>
                          <Input
                            value={param.key}
                            onChange={(e) => handleParamChange(index, 'key', e.target.value)}
                            placeholder="page"
                            disabled={param.enabled === false}
                            className='w-full'
                          />
                        </div>
                        <div className='flex flex-col items-start gap-1 w-full'>
                          <span className='text-xs font-medium text-muted-foreground'>Value</span>
                          <Input
                            value={param.value}
                            onChange={(e) => handleParamChange(index, 'value', e.target.value)}
                            placeholder="1"
                            disabled={param.enabled === false}
                            className='w-full'
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveParam(index)}
                          className="size-8 mt-4"
                          style={{ visibility: shouldShowDelete ? 'visible' : 'hidden' }}
                          disabled={!shouldShowDelete}
                        >
                          <X className="size-4" />
                        </Button>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="headers" className="space-y-4">
            <div className="rounded-lg border p-4">
              <div className="flex items-start justify-between mb-4">
                <span className="text-sm font-medium">Headers</span>
              </div>
              <div className="space-y-2">
                {(() => {
                  // Ensure we always have at least one empty header
                  const headers = request.headers && request.headers.length > 0
                    ? request.headers
                    : [{ key: '', value: '', enabled: true }];

                  return headers.map((header, index) => {
                    // Hide delete button if it's the last header and it's empty
                    const isLastHeader = index === headers.length - 1;
                    const isEmpty = !header.key && !header.value;
                    const shouldShowDelete = !(isLastHeader && isEmpty);

                    return (
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
                          style={{ visibility: shouldShowDelete ? 'visible' : 'hidden' }}
                          disabled={!shouldShowDelete}
                        >
                          <X className="size-4" />
                        </Button>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="body" className="space-y-4">
            <div className="rounded-lg border p-4">
              <div className="mb-4">
                <span className="text-sm font-medium">Request Body</span>
              </div>

              {/* Body Type Selection */}
              <RadioGroup
                value={request.body?.type === 'none' || !request.body?.type ? 'none' : 'raw'}
                onValueChange={(value) => {
                  if (value === 'none') {
                    handleBodyTypeChange('none');
                  } else {
                    // When switching to raw, default to json if currently none
                    if (request.body?.type === 'none' || !request.body?.type) {
                      handleBodyTypeChange('json');
                    }
                  }
                }}
                className="flex gap-6 mb-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="none" id="body-none" />
                  <Label htmlFor="body-none" className="cursor-pointer">None</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="raw" id="body-raw" />
                  <Label htmlFor="body-raw" className="cursor-pointer">Raw</Label>
                </div>
              </RadioGroup>

              {/* Raw Body Options */}
              {(request.body?.type !== 'none' && request.body?.type) && (
                <>
                  <div className="mb-4">
                    <Select
                      value={request.body.type}
                      onValueChange={handleBodyTypeChange}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="json">JSON</SelectItem>
                        <SelectItem value="html">HTML</SelectItem>
                        <SelectItem value="xml">XML</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="codemirror-wrapper">
                    <CodeMirror
                      value={localBodyContent}
                      onChange={handleBodyChange}
                      extensions={[...languageExtensions, customTheme, customHighlighting]}
                      height="200px"
                      basicSetup={basicSetup}
                      style={editorStyle}
                      className="custom-codemirror"
                    />
                  </div>
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
