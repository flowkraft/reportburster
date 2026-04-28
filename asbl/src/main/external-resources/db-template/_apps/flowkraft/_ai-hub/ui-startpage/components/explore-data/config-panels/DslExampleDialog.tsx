"use client";

import { useState, useCallback } from "react";
import { X, Copy, Check } from "lucide-react";
import dynamic from "next/dynamic";

const CodeMirror = dynamic(() => import("@uiw/react-codemirror").then((m) => m.default), { ssr: false });

const EXAMPLE_TITLES: Record<string, string> = {
  tabulator:     "Table DSL Example",
  chart:         "Chart DSL Example",
  pivot:         "Pivot DSL Example",
  "filter-pane": "Filter Pane DSL Example",
  "filter-bar":  "Parameters DSL Example",
  number:        "Number (rb-value) — No DSL Needed",
};

export interface DslExampleDialogProps {
  open: boolean;
  onClose: () => void;
  componentType: string;
  example: string;
}

export function DslExampleDialog({ open, onClose, componentType, example }: DslExampleDialogProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(example);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [example]);

  if (!open) return null;

  const title = EXAMPLE_TITLES[componentType] ?? `${componentType} DSL Example`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="relative w-full max-w-2xl bg-background border border-border rounded-xl shadow-xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <span className="font-semibold text-sm text-foreground">{title}</span>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Code editor — read-only, Groovy DSL */}
        <div className="flex-1 overflow-hidden p-4">
          <div className="border border-border rounded-md overflow-hidden">
            {CodeMirror && (
              <CodeMirror
                value={example}
                readOnly
                height="420px"
                theme="dark"
                basicSetup={{
                  lineNumbers: true,
                  foldGutter: true,
                  highlightActiveLine: false,
                  autocompletion: false,
                }}
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-border shrink-0">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            {copied ? "Copied!" : "Copy to Clipboard"}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-md text-xs font-medium border border-border bg-background hover:bg-accent text-foreground transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
