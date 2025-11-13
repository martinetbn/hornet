/**
 * Shared hook for CodeMirror theming that provides consistent
 * theme integration across all CodeMirror instances in the app.
 *
 * This hook handles:
 * - CSS variable extraction and color conversion
 * - Dark mode detection and synchronization
 * - Custom syntax highlighting
 * - Custom theme creation
 * - Editor styling
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { EditorView } from '@codemirror/view';
import { syntaxHighlighting, HighlightStyle } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';

interface CodeMirrorThemeOptions {
  /** Custom style ID for injected CSS (should be unique per instance) */
  styleId?: string;
  /** Custom wrapper class for scoped styles */
  wrapperClass?: string;
  /** Basic setup configuration overrides */
  basicSetupOverrides?: Record<string, boolean>;
}

interface ThemeColors {
  background: string;
  foreground: string;
  sidebarPrimary: string;
  accent: string;
  accentForeground: string;
  muted: string;
  mutedForeground: string;
  popover: string;
  popoverForeground: string;
  border: string;
  destructive: string;
}

export function useCodeMirrorTheme(options: CodeMirrorThemeOptions = {}) {
  const {
    styleId = 'codemirror-custom-theme',
    wrapperClass = 'codemirror-wrapper',
    basicSetupOverrides = {},
  } = options;

  const [themeColors, setThemeColors] = useState<ThemeColors>({
    background: '',
    foreground: '',
    sidebarPrimary: '',
    accent: '',
    accentForeground: '',
    muted: '',
    mutedForeground: '',
    popover: '',
    popoverForeground: '',
    border: '',
    destructive: '',
  });
  const [isDark, setIsDark] = useState(false);

  /**
   * Helper function to get CSS variable value and convert to RGB format.
   * Handles various color formats (OKLCH, HSL, RGB, hex).
   */
  const getCSSVar = useCallback((varName: string): string => {
    const value = getComputedStyle(document.documentElement)
      .getPropertyValue(varName)
      .trim();

    if (!value) return '';

    // Create a temporary element to get the computed RGB color
    const tempEl = document.createElement('div');
    tempEl.style.display = 'none';

    // Wrap the value in the appropriate color function if needed
    let colorValue = value;
    if (
      !value.startsWith('oklch') &&
      !value.startsWith('hsl') &&
      !value.startsWith('#') &&
      !value.startsWith('rgb')
    ) {
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

  // Detect dark mode and watch for theme changes
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
        const colors: ThemeColors = {
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

    let styleEl = document.getElementById(styleId) as HTMLStyleElement;

    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }

    styleEl.textContent = `
      .${wrapperClass} .cm-editor {
        background-color: ${themeColors.background} !important;
        color: ${themeColors.foreground} !important;
      }
      .${wrapperClass} .cm-content {
        background-color: transparent !important;
        color: inherit !important;
      }
      .${wrapperClass} .cm-line {
        color: ${themeColors.foreground} !important;
      }
      .${wrapperClass} .cm-gutters {
        background-color: ${themeColors.muted} !important;
        color: ${themeColors.mutedForeground} !important;
        border: none !important;
      }
    `;

    // Cleanup on unmount
    return () => {
      const el = document.getElementById(styleId);
      if (el) {
        el.remove();
      }
    };
  }, [themeColors, styleId, wrapperClass]);

  // Memoize basicSetup configuration
  const basicSetup = useMemo(
    () => ({
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
      ...basicSetupOverrides,
    }),
    [basicSetupOverrides]
  );

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
    if (!themeColors.sidebarPrimary) {
      return syntaxHighlighting(HighlightStyle.define([]));
    }

    return syntaxHighlighting(
      HighlightStyle.define([
        { tag: t.keyword, color: themeColors.sidebarPrimary },
        {
          tag: [t.name, t.deleted, t.character, t.propertyName, t.macroName],
          color: themeColors.foreground,
        },
        {
          tag: [t.function(t.variableName), t.labelName],
          color: themeColors.sidebarPrimary,
        },
        {
          tag: [t.color, t.constant(t.name), t.standard(t.name)],
          color: themeColors.sidebarPrimary,
        },
        {
          tag: [t.definition(t.name), t.separator],
          color: themeColors.foreground,
        },
        {
          tag: [
            t.typeName,
            t.className,
            t.number,
            t.changed,
            t.annotation,
            t.modifier,
            t.self,
            t.namespace,
          ],
          color: themeColors.sidebarPrimary,
        },
        {
          tag: [
            t.operator,
            t.operatorKeyword,
            t.url,
            t.escape,
            t.regexp,
            t.link,
            t.special(t.string),
          ],
          color: themeColors.foreground,
        },
        {
          tag: [t.meta, t.comment],
          color: themeColors.mutedForeground,
          fontStyle: 'italic',
        },
        { tag: t.strong, fontWeight: 'bold' },
        { tag: t.emphasis, fontStyle: 'italic' },
        { tag: t.strikethrough, textDecoration: 'line-through' },
        {
          tag: t.link,
          color: themeColors.sidebarPrimary,
          textDecoration: 'underline',
        },
        {
          tag: t.heading,
          fontWeight: 'bold',
          color: themeColors.sidebarPrimary,
        },
        {
          tag: [t.atom, t.bool, t.special(t.variableName)],
          color: themeColors.sidebarPrimary,
        },
        {
          tag: [t.processingInstruction, t.string, t.inserted],
          color: themeColors.sidebarPrimary,
        },
        { tag: t.invalid, color: themeColors.destructive },
      ])
    );
  }, [themeColors]);

  // Create custom theme
  const customTheme = useMemo(() => {
    if (!themeColors.background) {
      return EditorView.theme({}, { dark: isDark });
    }

    return EditorView.theme(
      {
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
        '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection':
          {
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
      },
      { dark: isDark }
    );
  }, [themeColors, isDark]);

  return {
    /** Theme colors extracted from CSS variables */
    themeColors,
    /** Whether dark mode is active */
    isDark,
    /** Basic setup configuration for CodeMirror */
    basicSetup,
    /** Editor inline styles */
    editorStyle,
    /** Custom syntax highlighting extension */
    customHighlighting,
    /** Custom theme extension */
    customTheme,
    /** Wrapper class name for scoped styles */
    wrapperClass,
  };
}
