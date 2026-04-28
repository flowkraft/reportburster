"use client";

import { useState, useCallback, useEffect } from "react";
import { Play, Loader2, Sparkles } from "lucide-react";
import dynamic from "next/dynamic";
import { EditorView } from "@codemirror/view";
import type { Extension } from "@codemirror/state";
import type { DataSource } from "@/lib/stores/canvas-store";

// Dynamic import — CodeMirror is heavy and client-only
const CodeMirror = dynamic(() => import("@uiw/react-codemirror").then((m) => m.default), { ssr: false });

// Language extensions are heavy parsers — loaded lazily once per mode switch.
// SQL  → @codemirror/lang-sql  (official SQL grammar)
// Groovy → @codemirror/lang-java because Groovy is a JVM sibling of Java:
//   same keywords, block structure, string literals, and class syntax.
//   There is no @codemirror/lang-groovy in the CodeMirror 6 ecosystem.
const loadSqlExtension  = () => import("@codemirror/lang-sql").then((m)  => m.sql());
const loadJavaExtension = () => import("@codemirror/lang-java").then((m) => m.java());

// ─── Mode-specific constants ───────────────────────────────────────────────
// Everything that differs between SQL and Script lives here.
// The component body below is 100% shared — no mode forks inside it.
//
// Persistence contract (enforced by getValue / buildUpdate):
//   SQL    → reads ds.sql || ds.generatedSql   / writes { sql, generatedSql }
//   Script → reads ds.script                   / writes { script }
//   Each mode touches ONLY its own fields; the other mode's fields and
//   visualQuery survive every keystroke via the dataSource spread.
const MODE_CONFIG = {
  sql: {
    containerid:    "sqlEditorContainer",
    aiButtonId:     "btnAiHelpSql",
    runButtonId:    "btnRunSqlQuery",
    runLabel:       "Run Query",
    height:         "180px",
    autocompletion: true,
    subtitle:       null as string | null,
    loadExtension:  loadSqlExtension,
    getValue:       (ds: DataSource | null) => ds?.sql || ds?.generatedSql || "",
    buildUpdate:    (ds: DataSource | null, value: string): DataSource =>
      ({ ...ds, mode: "sql" as const, sql: value, generatedSql: value } as DataSource),
  },
  script: {
    containerid:    "scriptEditorContainer",
    aiButtonId:     "btnAiHelpScript",
    runButtonId:    "btnRunScript",
    runLabel:       "Run Script",
    height:         "220px",
    autocompletion: false,
    subtitle:       "Groovy script — full flexibility, multi-source data" as string | null,
    loadExtension:  loadJavaExtension,
    getValue:       (ds: DataSource | null) => ds?.script || "",
    buildUpdate:    (ds: DataSource | null, value: string): DataSource =>
      ({ ...ds, mode: "script" as const, script: value } as DataSource),
  },
} as const;

export type FinetuneMode = keyof typeof MODE_CONFIG;

export interface FinetuneEditorProps {
  mode: FinetuneMode;
  dataSource: DataSource | null;
  onChange: (ds: DataSource) => void;
  // Caller supplies the correct run handler per mode:
  //   sql    → QueryBuilder.handleRun       (increments executeVersion)
  //   script → QueryBuilder.handleRunScript (increments scriptExecuteVersion)
  onRun: (value: string) => void;
  executing: boolean;
  onAiHelp?: () => void;
}

export function FinetuneEditor({
  mode,
  dataSource,
  onChange,
  onRun,
  executing,
  onAiHelp,
}: FinetuneEditorProps) {
  const [extensions, setExtensions] = useState<Extension[]>([]);

  // Load the language extension for the active mode.
  // Clears the old extension first so the wrong grammar never lingers across
  // a mode switch.  Cancelled flag prevents stale setState on fast switches.
  useEffect(() => {
    setExtensions([]);
    let cancelled = false;
    MODE_CONFIG[mode].loadExtension().then((ext) => {
      if (!cancelled) {
        setExtensions([
          ext as Extension,
          EditorView.contentAttributes.of({ id: `${mode}EditorInput` }),
        ]);
      }
    });
    return () => { cancelled = true; };
  }, [mode]);

  const cfg   = MODE_CONFIG[mode];
  const value = cfg.getValue(dataSource);

  const handleChange = useCallback(
    (newValue: string) => {
      // buildUpdate spreads the full dataSource and updates ONLY the fields owned
      // by this mode — sql+generatedSql for SQL, script for Groovy.  The other
      // mode's fields and visualQuery are preserved untouched via the spread.
      onChange(MODE_CONFIG[mode].buildUpdate(dataSource, newValue));
    },
    [mode, dataSource, onChange],
  );

  return (
    <div className="space-y-2">
      {cfg.subtitle && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{cfg.subtitle}</span>
        </div>
      )}

      <div id={cfg.containerid} className="border border-border rounded-md overflow-hidden">
        {CodeMirror && (
          <CodeMirror
            value={value}
            onChange={handleChange}
            extensions={extensions}
            height={cfg.height}
            theme="dark"
            basicSetup={{
              lineNumbers: true,
              foldGutter: false,
              highlightActiveLine: true,
              autocompletion: cfg.autocompletion,
            }}
          />
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          id={cfg.aiButtonId}
          onClick={onAiHelp}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-border bg-background hover:bg-accent text-foreground transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-violet-500" />
          Hey AI, Help Me…
        </button>

        <button
          type="button"
          id={cfg.runButtonId}
          onClick={() => { if (value.trim()) onRun(value); }}
          disabled={!value.trim() || executing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {executing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
          {executing ? "Running..." : cfg.runLabel}
        </button>
      </div>
    </div>
  );
}
