// Body editor component for HTTP requests

import { useMemo, useEffect, useState, useRef, useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import CodeMirror from "@uiw/react-codemirror";
import { json } from "@codemirror/lang-json";
import { html } from "@codemirror/lang-html";
import { xml } from "@codemirror/lang-xml";
import { useCodeMirrorTheme } from "@/lib/hooks/use-codemirror-theme";
import type { HttpRequest } from "@/types";

interface BodyEditorProps {
  request: HttpRequest;
  onRequestChange?: (request: HttpRequest) => void;
}

export function BodyEditor({ request, onRequestChange }: BodyEditorProps) {
  const [localBodyContent, setLocalBodyContent] = useState(
    request.body?.content || "",
  );
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const requestRef = useRef(request);
  const onRequestChangeRef = useRef(onRequestChange);

  // Use shared CodeMirror theme hook
  const {
    customTheme,
    customHighlighting,
    editorStyle,
    basicSetup,
    wrapperClass,
  } = useCodeMirrorTheme({
    styleId: "codemirror-body-editor-theme",
    wrapperClass: "codemirror-wrapper",
  });

  // Keep refs up to date
  useEffect(() => {
    requestRef.current = request;
    onRequestChangeRef.current = onRequestChange;
  });

  // Sync local state when request changes from outside
  useEffect(() => {
    const newContent = request.body?.content || "";
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
        body: { type: currentRequest.body?.type || "json", content },
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
        content: localBodyContent,
      },
      updatedAt: Date.now(),
    });
  };

  // Get the appropriate language extension based on body type
  const languageExtensions = useMemo(() => {
    const lang = (() => {
      switch (request.body?.type) {
        case "json":
          return json();
        case "html":
          return html();
        case "xml":
          return xml();
        default:
          return null;
      }
    })();

    return lang ? [lang] : [];
  }, [request.body?.type]);

  return (
    <div className="rounded-lg border p-4">
      <div className="mb-4">
        <span className="text-sm font-medium">Request Body</span>
      </div>

      {/* Body Type Selection */}
      <RadioGroup
        value={
          request.body?.type === "none" || !request.body?.type ? "none" : "raw"
        }
        onValueChange={(value) => {
          if (value === "none") {
            handleBodyTypeChange("none");
          } else {
            if (request.body?.type === "none" || !request.body?.type) {
              handleBodyTypeChange("json");
            }
          }
        }}
        className="flex gap-6 mb-4"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="none" id="body-none" />
          <Label htmlFor="body-none" className="cursor-pointer">
            None
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="raw" id="body-raw" />
          <Label htmlFor="body-raw" className="cursor-pointer">
            Raw
          </Label>
        </div>
      </RadioGroup>

      {/* Raw Body Options */}
      {request.body?.type !== "none" && request.body?.type && (
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

          <div className={wrapperClass}>
            <CodeMirror
              value={localBodyContent}
              onChange={handleBodyChange}
              extensions={[
                ...languageExtensions,
                customTheme,
                customHighlighting,
              ]}
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
