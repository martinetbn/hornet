// Response viewer component

import { useAtomValue } from 'jotai';
import { useMemo, useEffect, useState, useCallback } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { currentResponseAtom } from '@/stores/response-atoms';
import { requestLoadingAtom, requestErrorAtom } from '@/stores/request-atoms';
import { Loader2, AlertCircle } from 'lucide-react';
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { EditorView } from '@codemirror/view';
import { syntaxHighlighting, HighlightStyle } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';

export function ResponseViewer() {
  const response = useAtomValue(currentResponseAtom);
  const loading = useAtomValue(requestLoadingAtom);
  const error = useAtomValue(requestErrorAtom);
  const [themeColors, setThemeColors] = useState<Record<string, string>>({});
  const [isDark, setIsDark] = useState(false);

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

  // Detect dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      const isDarkMode = document.documentElement.classList.contains('dark');
      setIsDark(isDarkMode);
    };

    checkDarkMode();

    // Watch for theme changes
    const observer = new MutationObserver(() => {
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

  // Update theme colors when dark mode changes
  useEffect(() => {
    const updateColors = () => {
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

        setThemeColors(colors);
      });
    };

    updateColors();
  }, [isDark, getCSSVar]);

  // Inject custom styles for CodeMirror
  useEffect(() => {
    if (!themeColors.background || !themeColors.foreground) return;

    const styleId = 'codemirror-response-theme';
    let styleEl = document.getElementById(styleId) as HTMLStyleElement;

    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }

    styleEl.textContent = `
      .codemirror-response .cm-editor {
        background-color: ${themeColors.background} !important;
        color: ${themeColors.foreground} !important;
      }
      .codemirror-response .cm-content {
        background-color: transparent !important;
        color: inherit !important;
      }
      .codemirror-response .cm-line {
        color: ${themeColors.foreground} !important;
      }
      .codemirror-response .cm-gutters {
        background-color: ${themeColors.muted} !important;
        color: ${themeColors.mutedForeground} !important;
        border: none !important;
      }
    `;
  }, [themeColors]);

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

  // Memoize basicSetup to prevent recreation
  const basicSetup = useMemo(() => ({
    lineNumbers: true,
    highlightActiveLineGutter: false,
    highlightActiveLine: false,
    foldGutter: false,
    dropCursor: false,
    indentOnInput: false,
    bracketMatching: true,
    closeBrackets: false,
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

    if (themeColors.background && themeColors.foreground) {
      style.backgroundColor = themeColors.background;
      style.color = themeColors.foreground;
    }

    return style;
  }, [themeColors]);

  // Create custom syntax highlighting
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

  // Create custom theme
  const customTheme = useMemo(() => {
    if (!themeColors.background) {
      return EditorView.theme({}, { dark: isDark });
    }

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
    }, { dark: isDark });
  }, [themeColors, isDark]);
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
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="body">Body</TabsTrigger>
                <TabsTrigger value="headers">Headers</TabsTrigger>
              </TabsList>

              <TabsContent value="body">
                <div className="codemirror-response">
                  <CodeMirror
                    value={response ? formatData(response.data) : 'Send a request to see the response here...'}
                    extensions={[json(), customTheme, customHighlighting]}
                    height="300px"
                    basicSetup={basicSetup}
                    style={editorStyle}
                    editable={false}
                    readOnly={true}
                  />
                </div>
              </TabsContent>

              <TabsContent value="headers">
                <div className="codemirror-response">
                  <CodeMirror
                    value={response?.headers ? formatHeaders(response.headers) : 'Response headers will appear here...'}
                    extensions={[customTheme, customHighlighting]}
                    height="300px"
                    basicSetup={basicSetup}
                    style={editorStyle}
                    editable={false}
                    readOnly={true}
                  />
                </div>
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
