"use client";

import { useState, useEffect, useCallback } from "react";
import { Database, Loader2 } from "lucide-react";
import type { VisualQuery, DataSource, DataSourceMode } from "@/lib/stores/canvas-store";
import type { SchemaInfo, ConnectionInfo, QueryResult } from "@/lib/data-canvas/types";
import { fetchConnections, fetchSchema, executeQuery } from "@/lib/data-canvas/rb-api";
import { buildSql } from "@/lib/data-canvas/sql-builder";
import { VisualQueryBuilder } from "./VisualQueryBuilder";
import { AiSqlStep } from "./AiSqlStep";
import { SqlEditor } from "./SqlEditor";
import { ScriptStep } from "./ScriptStep";

const MODE_LABELS: { mode: DataSourceMode; label: string }[] = [
  { mode: "visual", label: "Visual" },
  { mode: "ai-sql", label: "AI" },
  { mode: "sql", label: "SQL" },
  { mode: "script", label: "Script" },
];

interface QueryBuilderProps {
  canvasId: string;
  dataSource: DataSource | null;
  onChange: (ds: DataSource) => void;
  connectionId: string | null;
  onConnectionChange: (id: string) => void;
}

export function QueryBuilder({ canvasId, dataSource, onChange, connectionId, onConnectionChange }: QueryBuilderProps) {
  const [connections, setConnections] = useState<ConnectionInfo[]>([]);
  const [schema, setSchema] = useState<SchemaInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mode: DataSourceMode = dataSource?.mode || "visual";

  // Load connections on mount
  useEffect(() => {
    fetchConnections().then(setConnections).catch(() => {});
  }, []);

  // Load schema when connection changes
  useEffect(() => {
    if (!connectionId) { setSchema(null); return; }
    setLoading(true);
    fetchSchema(connectionId)
      .then(setSchema)
      .catch(() => setSchema(null))
      .finally(() => setLoading(false));
  }, [connectionId]);

  // Switch mode — carry SQL over between modes
  const switchMode = useCallback(
    (newMode: DataSourceMode) => {
      if (newMode === mode) return;
      const currentSql = dataSource?.sql || dataSource?.generatedSql || "";
      onChange({ ...dataSource, mode: newMode, sql: currentSql, generatedSql: currentSql } as DataSource);
    },
    [mode, dataSource, onChange]
  );

  // Run a SQL query
  const handleRun = useCallback(
    async (sql: string) => {
      if (!connectionId || !sql) return;
      setExecuting(true);
      setError(null);
      try {
        const result = await executeQuery(connectionId, sql);
        setQueryResult(result);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Query failed");
        setQueryResult(null);
      } finally {
        setExecuting(false);
      }
    },
    [connectionId]
  );

  // Build schema context string for AI
  const schemaContext = schema
    ? schema.tables.map((t) => `${t.tableName}: ${t.columns.map((c) => `${c.columnName} (${c.typeName})`).join(", ")}`).join("\n")
    : "";

  const connectionType = connections.find((c) => c.connectionCode === connectionId)?.dbserver?.type || "SQL";

  return (
    <div className="space-y-3">
      {/* Connection picker */}
      <div className="flex items-center gap-2">
        <Database className="w-4 h-4 text-muted-foreground shrink-0" />
        <select
          value={connectionId || ""}
          onChange={(e) => onConnectionChange(e.target.value)}
          className="flex-1 text-sm bg-background border border-border rounded-md px-2 py-1.5 text-foreground"
        >
          <option value="">Select connection...</option>
          {connections.map((c) => (
            <option key={c.connectionCode} value={c.connectionCode}>
              {c.connectionCode} ({c.dbserver?.type})
            </option>
          ))}
        </select>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
          <Loader2 className="w-3 h-3 animate-spin" /> Loading schema...
        </div>
      )}

      {/* Mode switcher — always visible once connection is selected */}
      {connectionId && !loading && (
        <>
          <div className="flex gap-0.5 p-0.5 bg-muted/50 rounded-lg">
            {MODE_LABELS.map(({ mode: m, label }) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={`flex-1 px-2 py-1 text-[11px] font-medium rounded-md transition-colors ${
                  mode === m
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Mode content */}
          {mode === "visual" && schema && (
            <VisualQueryBuilder
              schema={schema}
              dataSource={dataSource}
              onChange={onChange}
              onRun={handleRun}
              executing={executing}
            />
          )}

          {mode === "ai-sql" && (
            <AiSqlStep
              canvasId={canvasId}
              schemaContext={schemaContext}
              connectionType={connectionType}
              dataSource={dataSource}
              onChange={onChange}
              onRun={handleRun}
            />
          )}

          {mode === "sql" && (
            <SqlEditor
              dataSource={dataSource}
              onChange={onChange}
              onRun={handleRun}
              executing={executing}
            />
          )}

          {mode === "script" && (
            <ScriptStep
              dataSource={dataSource}
              onChange={onChange}
            />
          )}

          {/* Error */}
          {error && (
            <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-2">
              {error}
            </div>
          )}

          {/* Result count */}
          {queryResult && (
            <div className="text-xs text-muted-foreground">
              {queryResult.rowCount} row{queryResult.rowCount !== 1 ? "s" : ""} returned
            </div>
          )}
        </>
      )}
    </div>
  );
}
