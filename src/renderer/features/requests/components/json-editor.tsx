// Reusable JSON editor component using CodeMirror

import { useCallback, useEffect, useRef, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { json } from "@codemirror/lang-json";
import { useCodeMirrorTheme } from "@/lib/hooks/use-codemirror-theme";

interface JsonEditorProps {
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  height?: string;
  readOnly?: boolean;
}

export function JsonEditor({
  value,
  onChange,
  placeholder = "{}",
  height = "400px",
  readOnly = false,
}: JsonEditorProps) {
  const [localValue, setLocalValue] = useState(value);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const onChangeRef = useRef(onChange);

  // Use shared CodeMirror theme hook
  const { customTheme, customHighlighting, basicSetup, wrapperClass } =
    useCodeMirrorTheme({
      styleId: "codemirror-json-editor-theme",
      wrapperClass: "codemirror-wrapper",
    });

  // Keep onChange ref up to date
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  // Sync local state when value changes from outside
  useEffect(() => {
    if (!debounceTimerRef.current) {
      setLocalValue(value);
    }
  }, [value]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleChange = useCallback((newValue: string) => {
    setLocalValue(newValue);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      onChangeRef.current?.(newValue);
      debounceTimerRef.current = null;
    }, 500);
  }, []);

  return (
    <div className={wrapperClass}>
      <CodeMirror
        value={localValue}
        onChange={handleChange}
        theme={customTheme}
        extensions={[json(), customHighlighting]}
        basicSetup={basicSetup}
        placeholder={placeholder}
        readOnly={readOnly}
        height={height}
      />
    </div>
  );
}
