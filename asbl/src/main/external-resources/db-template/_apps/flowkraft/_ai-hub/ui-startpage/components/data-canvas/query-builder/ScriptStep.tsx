"use client";

import { useCallback } from "react";
import dynamic from "next/dynamic";
import type { DataSource } from "@/lib/stores/canvas-store";

const CodeMirror = dynamic(() => import("@uiw/react-codemirror").then((m) => m.default), { ssr: false });

const SCRIPT_PLACEHOLDER = `import groovy.sql.Sql

def dbSql = ctx.dbSql
def componentId = ctx.variables?.get('componentId')

if (!componentId || componentId == 'myComponent') {
    def data = dbSql.rows("SELECT * FROM my_table LIMIT 100")
    ctx.reportData('myComponent', data)
}`;

interface ScriptStepProps {
  dataSource: DataSource | null;
  onChange: (ds: DataSource) => void;
}

export function ScriptStep({ dataSource, onChange }: ScriptStepProps) {
  const script = dataSource?.script || "";

  const handleChange = useCallback(
    (value: string) => {
      onChange({ mode: "script", script: value });
    },
    [onChange]
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Groovy script — full flexibility, multi-source data</span>
      </div>

      <div className="border border-border rounded-md overflow-hidden">
        {CodeMirror && (
          <CodeMirror
            value={script}
            onChange={handleChange}
            height="220px"
            theme="dark"
            placeholder={SCRIPT_PLACEHOLDER}
            basicSetup={{
              lineNumbers: true,
              foldGutter: false,
              highlightActiveLine: true,
            }}
          />
        )}
      </div>

      <p className="text-[10px] text-muted-foreground leading-relaxed">
        Use <code className="text-[10px] px-1 py-0.5 bg-muted rounded">ctx.dbSql</code> for database access,{" "}
        <code className="text-[10px] px-1 py-0.5 bg-muted rounded">ctx.reportData(name, data)</code> to output data.
        Script runs server-side on export. Preview requires a saved ReportBurster dashboard.
      </p>
    </div>
  );
}
