"use client";

import { useState, useCallback } from "react";
import { Play, Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import type { DataSource } from "@/lib/stores/canvas-store";

// Dynamic import — CodeMirror is heavy and client-only
const CodeMirror = dynamic(() => import("@uiw/react-codemirror").then((m) => m.default), { ssr: false });
const loadSqlLang = () => import("@codemirror/lang-sql").then((m) => m.sql());

interface SqlEditorProps {
  dataSource: DataSource | null;
  onChange: (ds: DataSource) => void;
  onRun: (sql: string) => void;
  executing: boolean;
}

export function SqlEditor({ dataSource, onChange, onRun, executing }: SqlEditorProps) {
  const [extensions, setExtensions] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  const sql = dataSource?.sql || dataSource?.generatedSql || "";

  // Load SQL language extension once
  if (!loaded) {
    loadSqlLang().then((ext) => {
      setExtensions([ext]);
      setLoaded(true);
    });
  }

  const handleChange = useCallback(
    (value: string) => {
      onChange({ mode: "sql", sql: value, generatedSql: value });
    },
    [onChange]
  );

  return (
    <div className="space-y-2">
      <div className="border border-border rounded-md overflow-hidden">
        {CodeMirror && (
          <CodeMirror
            value={sql}
            onChange={handleChange}
            extensions={extensions}
            height="180px"
            theme="dark"
            basicSetup={{
              lineNumbers: true,
              foldGutter: false,
              highlightActiveLine: true,
              autocompletion: true,
            }}
          />
        )}
      </div>

      <button
        onClick={() => { if (sql.trim()) onRun(sql); }}
        disabled={!sql.trim() || executing}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {executing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
        {executing ? "Running..." : "Run Query"}
      </button>
    </div>
  );
}
