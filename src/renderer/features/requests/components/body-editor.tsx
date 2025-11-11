// Body editor component for HTTP requests

import { useMemo, useEffect, useState, useRef, useCallback } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { html } from '@codemirror/lang-html';
import { xml } from '@codemirror/lang-xml';
import { EditorView } from '@codemirror/view';
import { syntaxHighlighting, HighlightStyle } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';
import type { HttpRequest } from '@/types';

interface BodyEditorProps {
  request: HttpRequest;
  onRequestChange?: (request: HttpRequest) => void;
}

export function BodyEditor({ request, onRequestChange }: BodyEditorProps) {
  const [localBodyContent, setLocalBodyContent] = useState(request.body?.content || '');
  const [themeColors, setThemeColors] = useState<Record<string, string>>({});
  const [isDark, setIsDark] = useState(false);
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
  }, [themeColors]);

  // Sync local state when request changes from outside
  useEffect(() => {
    const newContent = request.body?.content || '';
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

  const handleBodyChange = useCallback((content: string) => {
    setLocalBodyContent(content);

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
    }, 500);
  }, []);

  const handleBodyTypeChange = (type: string) => {
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
  );
}
