"use client";

import { useCallback } from "react";
import { Hash, Code, Play, Loader2 } from "lucide-react";
import type { VisualQuery, DataSource } from "@/lib/stores/canvas-store";
import type { SchemaInfo } from "@/lib/data-canvas/types";
import { buildSql } from "@/lib/data-canvas/sql-builder";
import { DataStep } from "./DataStep";
import { FilterStep } from "./FilterStep";
import { SummarizeStep } from "./SummarizeStep";
import { SortStep } from "./SortStep";
import { useState } from "react";

const DEFAULT_QUERY: VisualQuery = {
  table: "",
  filters: [],
  summarize: [],
  groupBy: [],
  sort: [],
  limit: 500,
};

interface VisualQueryBuilderProps {
  schema: SchemaInfo;
  dataSource: DataSource | null;
  onChange: (ds: DataSource) => void;
  onRun: (sql: string) => void;
  executing: boolean;
}

export function VisualQueryBuilder({ schema, dataSource, onChange, onRun, executing }: VisualQueryBuilderProps) {
  const [showSql, setShowSql] = useState(false);

  const query: VisualQuery = dataSource?.visualQuery || DEFAULT_QUERY;
  const sql = buildSql(query);
  const tables = schema.tables || [];
  const selectedTable = tables.find((t) => t.tableName === query.table);
  const columns = selectedTable?.columns || [];

  const updateQuery = useCallback(
    (patch: Partial<VisualQuery>) => {
      const updated = { ...query, ...patch };
      const newSql = buildSql(updated);
      onChange({ mode: "visual", visualQuery: updated, generatedSql: newSql });
    },
    [query, onChange]
  );

  return (
    <div className="space-y-3">
      {/* Table picker */}
      <DataStep tables={tables} value={query.table} onChange={(table) => updateQuery({ table, filters: [], summarize: [], groupBy: [], sort: [] })} />

      {query.table && columns.length > 0 && (
        <>
          {/* Filter */}
          <FilterStep columns={columns} filters={query.filters} onChange={(filters) => updateQuery({ filters })} />

          {/* Summarize */}
          <SummarizeStep columns={columns} summarize={query.summarize} groupBy={query.groupBy} onChange={(summarize, groupBy) => updateQuery({ summarize, groupBy })} />

          {/* Sort */}
          <SortStep columns={columns} sort={query.sort} onChange={(sort) => updateQuery({ sort })} />

          {/* Limit */}
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="text-xs text-muted-foreground">Limit</span>
            <input
              type="number"
              min={1}
              max={10000}
              value={query.limit}
              onChange={(e) => updateQuery({ limit: parseInt(e.target.value) || 500 })}
              className="w-20 text-sm bg-background border border-border rounded-md px-2 py-1 text-foreground"
            />
          </div>

          {/* View SQL toggle */}
          <button
            onClick={() => setShowSql(!showSql)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Code className="w-3.5 h-3.5" />
            {showSql ? "Hide SQL" : "View SQL"}
          </button>

          {showSql && (
            <pre className="text-[11px] bg-muted/50 border border-border rounded-md p-3 overflow-x-auto text-foreground font-mono whitespace-pre-wrap">
              {sql || "-- build your query above"}
            </pre>
          )}

          {/* Run button */}
          <button
            onClick={() => { if (sql) onRun(sql); }}
            disabled={!sql || executing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {executing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            {executing ? "Running..." : "Run Query"}
          </button>
        </>
      )}
    </div>
  );
}
