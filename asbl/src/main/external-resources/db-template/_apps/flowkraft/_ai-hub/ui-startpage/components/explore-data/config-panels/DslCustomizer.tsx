"use client";

import { useCallback, useState } from "react";
import { ChevronDown, ChevronRight, Sparkles } from "lucide-react";
import dynamic from "next/dynamic";
import type { ColumnSchema } from "@/lib/explore-data/types";
import { fetchDslExample } from "@/lib/explore-data/ai-prompt-builder";
import { DslHelpDialog } from "./DslHelpDialog";
import { DslExampleDialog } from "./DslExampleDialog";

const CodeMirror = dynamic(() => import("@uiw/react-codemirror").then((m) => m.default), { ssr: false });

const DSL_TYPES_WITH_AI = ["tabulator", "chart", "pivot", "filter-pane", "filter-bar"];

const DSL_TYPE_LABELS: Record<string, string> = {
  tabulator:     "Table",
  chart:         "Chart",
  pivot:         "Pivot",
  "filter-pane": "Filter",
  "filter-bar":  "Parameters",
};

interface DslCustomizerProps {
  dsl: string;
  onChange: (dsl: string) => void;
  componentType: string;
  columns?: ColumnSchema[];
  sampleData?: Record<string, unknown>[];
  /** Optional bidirectional-sync status. When omitted, no dot is rendered. */
  syncStatus?: "synced" | "syncing" | "error";
  syncError?: string | null;
}

export function DslCustomizer({ dsl, onChange, componentType, columns = [], sampleData = [], syncStatus, syncError }: DslCustomizerProps) {
  const [expanded, setExpanded] = useState(false);
  const [dslHelpOpen, setDslHelpOpen] = useState(false);
  const [exampleOpen, setExampleOpen] = useState(false);
  const [example, setExample] = useState<string | null>(null);
  const [loadingExample, setLoadingExample] = useState(false);
  const hasExample = DSL_TYPES_WITH_AI.includes(componentType);

  const handleShowExample = useCallback(async () => {
    if (example !== null) {
      setExampleOpen(true);
      return;
    }
    setLoadingExample(true);
    try {
      const text = await fetchDslExample(componentType);
      setExample(text || "// No example available for this DSL type");
    } catch (err) {
      setExample(`// Failed to load example: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoadingExample(false);
      setExampleOpen(true);
    }
  }, [componentType, example]);

  // Only surface errors — synced/syncing is background plumbing the user doesn't need to see.
  const statusDot = syncStatus === "error" ? (
    <span
      className="flex items-center gap-1 text-[10px]"
      title={syncError ?? "DSL parse error"}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
      <span className="text-destructive">DSL error</span>
    </span>
  ) : null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <button
          id="btnDslToggle"
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {expanded
            ? <ChevronDown className="w-3.5 h-3.5" />
            : <ChevronRight className="w-3.5 h-3.5" />}
          Customize with DSL{DSL_TYPE_LABELS[componentType] ? ` (${DSL_TYPE_LABELS[componentType]})` : ""}
          {statusDot}
        </button>
        {expanded && hasExample && (
          <button
            id="btnShowDslExample"
            onClick={handleShowExample}
            disabled={loadingExample}
            className="text-[10px] text-primary hover:underline disabled:opacity-50"
          >
            {loadingExample ? "Loading…" : "Show Example"}
          </button>
        )}
      </div>

      {expanded && (
        <>
          <div id="dslEditorContainer" className="border border-border rounded-md overflow-hidden">
            {CodeMirror && (
              <CodeMirror
                value={dsl}
                onChange={onChange}
                height="140px"
                theme="dark"
                basicSetup={{ lineNumbers: true, foldGutter: false, highlightActiveLine: true }}
              />
            )}
          </div>

          {/* Hey AI, Help Me… button — only for DSL-supported component types */}
          {DSL_TYPES_WITH_AI.includes(componentType) && (
            <button
              id="btnAiHelpDsl"
              onClick={() => setDslHelpOpen(true)}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium border border-border bg-background hover:bg-accent text-foreground transition-colors w-full justify-center"
            >
              <Sparkles className="w-3.5 h-3.5 text-violet-500" />
              Hey AI, Help Me…
            </button>
          )}
        </>
      )}

      <DslHelpDialog
        open={dslHelpOpen}
        onClose={() => setDslHelpOpen(false)}
        componentType={componentType}
        currentDsl={dsl}
        columns={columns}
        sampleData={sampleData}
      />

      {hasExample && (
        <DslExampleDialog
          open={exampleOpen}
          onClose={() => setExampleOpen(false)}
          componentType={componentType}
          example={example ?? ""}
        />
      )}
    </div>
  );
}
