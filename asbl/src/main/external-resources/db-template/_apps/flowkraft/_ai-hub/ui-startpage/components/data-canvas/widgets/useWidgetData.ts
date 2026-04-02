"use client";

import { useState, useEffect } from "react";
import { useCanvasStore } from "@/lib/stores/canvas-store";
import type { DataSource } from "@/lib/stores/canvas-store";
import type { QueryResult } from "@/lib/data-canvas/types";
import { executeQuery } from "@/lib/data-canvas/rb-api";
import { buildSql } from "@/lib/data-canvas/sql-builder";

export function useWidgetData(widgetId: string) {
  const widget = useCanvasStore((s) => s.widgets.find((w) => w.id === widgetId));
  const connectionId = useCanvasStore((s) => s.connectionId);
  const filterValues = useCanvasStore((s) => s.filterValues);
  const filterVersion = useCanvasStore((s) => s.filterVersion);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dataSource = widget?.dataSource;

  // Re-fetch when data source changes OR filter values change
  useEffect(() => {
    if (!connectionId || !dataSource) {
      setResult(null);
      return;
    }

    const sql = getSql(dataSource, filterValues);
    if (!sql) {
      setResult(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    executeQuery(connectionId, sql)
      .then((res) => { if (!cancelled) setResult(res); })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : "Query failed"); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [connectionId, dataSource, filterVersion]);

  return { result, loading, error };
}

function getSql(ds: DataSource, filterValues: Record<string, string>): string | null {
  let sql: string | null = null;

  if (ds.mode === "visual" && ds.visualQuery) {
    sql = buildSql(ds.visualQuery) || null;
  } else if ((ds.mode === "sql" || ds.mode === "ai-sql") && ds.sql) {
    sql = ds.sql;
  } else if (ds.generatedSql) {
    sql = ds.generatedSql;
  }

  if (!sql) return null;

  // Replace {{ paramName }} placeholders with current filter values
  // This is the Redash-inspired parameter system
  sql = sql.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, paramName) => {
    const value = filterValues[paramName];
    if (value === undefined || value === "") return match; // Leave placeholder if no value
    // Simple escaping — single quotes around string values
    return `'${value.replace(/'/g, "''")}'`;
  });

  return sql;
}
