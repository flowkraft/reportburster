"use client";

import { useEffect, useState } from "react";
import { useCanvasStore } from "@/lib/stores/canvas-store";
import type { SchemaInfo, TableSchema } from "@/lib/explore-data/types";
import { executeQuery, executeScript, fetchSchema, getConnectionType } from "@/lib/explore-data/rb-api";
import { sqlForDataSource } from "@/lib/explore-data/sql-builder";

// Module-level per-widget "we've already executed this version" tracker.
// Survives component remounts — critical because the auto-switch
// (tabulator → map etc.) unmounts one widget renderer and mounts another,
// each of which calls useWidgetData(widgetId).  If the version tracker
// were per-hook-instance (useRef), the new mount would re-fire the fetch
// even though the store already has the result for this version.  A
// module-level map keyed by widgetId gives us the cross-mount memory.
// Also handles the visual-mode "refetch on widget-update" cascade: we
// record the last-executed dataSource SIGNATURE (mode + sql + filter
// snapshot) and short-circuit when unchanged.
interface LastExec {
  mode: string;
  executeVersion?: number;
  scriptVersion?: number;
  sql?: string;           // for visual mode — built-once signature
  filterSnapshot?: string; // JSON of filter values at last execution
}
const LAST_EXEC: Map<string, LastExec> = new Map();

// Per-table schema cache: keyed by `${connectionId}\u0000${tableName}`.
// Used by visual-query mode to get the selected table's full column list
// (including foreignKeys) for FK-column exclusion in ChartWidget / NumberWidget.
const SCHEMA_CACHE: Map<string, Promise<TableSchema | null>> = new Map();

// Full-connection schema cache: keyed by connectionId alone.
// One fetch covers ALL tables for a connection; reused by every widget on the
// same canvas so we never fire more than one /schema request per connection
// per app session.  Populated lazily on first widget mount for a connection.
// Used to supply shapeFromResult with connectionSchemas for the Step 2
// cross-reference that classifies SQL/script result columns against source
// table column metadata without parsing any SQL or Groovy.
const CONNECTION_SCHEMA_CACHE: Map<string, Promise<SchemaInfo>> = new Map();

function getConnectionSchema(connectionId: string): Promise<SchemaInfo> {
  if (!CONNECTION_SCHEMA_CACHE.has(connectionId)) {
    CONNECTION_SCHEMA_CACHE.set(connectionId, fetchSchema(connectionId).catch(() => ({ notes: null, tables: [] })));
  }
  return CONNECTION_SCHEMA_CACHE.get(connectionId)!;
}

function schemaCacheKey(connectionId: string, tableName: string): string {
  return `${connectionId}\u0000${tableName}`;
}

async function getTableSchema(connectionId: string, tableName: string): Promise<TableSchema | null> {
  const key = schemaCacheKey(connectionId, tableName);
  const cached = SCHEMA_CACHE.get(key);
  if (cached) return cached;
  const p = fetchSchema(connectionId)
    .then((s) => s.tables.find((t) => t.tableName === tableName) ?? null)
    .catch(() => null);
  SCHEMA_CACHE.set(key, p);
  return p;
}

/** useWidgetData — the single fetcher for a widget's query result.
 *
 * Executes the widget's query (visual SQL / raw SQL / Groovy script) and
 * writes the result into `canvas-store.queryResults[widgetId]`. All consumers
 * (this hook's own return value for widget render, plus ConfigPanel's column
 * inference + palette ranker, plus QueryBuilder's "X rows returned" status)
 * read from that single store entry. One backend call per Run — no matter how
 * many consumers are subscribed.
 *
 * Re-execution triggers:
 *   - visual mode: any change to connectionId/dataSource/filterVersion
 *   - sql / ai-sql: executeVersion increments (bumped by QueryBuilder.handleRun)
 *   - script: scriptExecuteVersion increments (bumped by handleRunScript)
 */
export function useWidgetData(widgetId: string) {
  const widget = useCanvasStore((s) => s.widgets.find((w) => w.id === widgetId));
  const connectionId = useCanvasStore((s) => s.connectionId);
  const filterValues = useCanvasStore((s) => s.filterValues);
  const filterVersion = useCanvasStore((s) => s.filterVersion);
  // Store reader — this is what the widget renders from.  QueryBuilder and
  // ConfigPanel read the same entry so they all see one execution.
  const cached = useCanvasStore((s) => s.queryResults[widgetId]);
  const setWidgetQueryLoading = useCanvasStore((s) => s.setWidgetQueryLoading);
  const setWidgetQueryResult  = useCanvasStore((s) => s.setWidgetQueryResult);
  const setWidgetQueryError   = useCanvasStore((s) => s.setWidgetQueryError);
  const clearWidgetQueryLoading = useCanvasStore((s) => s.clearWidgetQueryLoading);

  const [tableSchema, setTableSchema] = useState<TableSchema | null>(null);
  // All tables for the active connection — fed to shapeFromResult as
  // connectionSchemas so SQL/script result columns can be cross-referenced
  // against source table column metadata (Step 2 of the 3-step lookup).
  const [connectionSchemas, setConnectionSchemas] = useState<TableSchema[]>([]);

  const dataSource = widget?.dataSource;
  const tableName = dataSource?.visualQuery?.table || "";

  // Expose the TableSchema (with foreignKeys) for the widget's table.
  // Lets ChartWidget/NumberWidget call `isIdColumn(k, tableSchema)` so FK columns
  // like `Orders.ShipVia` are excluded from Y-axis measures at render time,
  // even though their names don't match the `/id|code|key$/i` pattern.
  useEffect(() => {
    if (!connectionId || !tableName) { setTableSchema(null); return; }
    let cancelled = false;
    getTableSchema(connectionId, tableName).then((t) => {
      if (!cancelled) setTableSchema(t);
    });
    return () => { cancelled = true; };
  }, [connectionId, tableName]);

  // Populate connectionSchemas for SQL/script cross-reference in shapeFromResult.
  // Fires once per connectionId; the Promise is shared via CONNECTION_SCHEMA_CACHE
  // so all widgets on the same canvas reuse the same fetch.
  useEffect(() => {
    if (!connectionId) { setConnectionSchemas([]); return; }
    let cancelled = false;
    getConnectionSchema(connectionId).then((schema) => {
      if (!cancelled) setConnectionSchemas(schema.tables);
    });
    return () => { cancelled = true; };
  }, [connectionId]);

  // Fetch + store. Writes result/error/loading into canvas-store.queryResults
  // so every subscriber gets the same data from one call.  Uses the
  // module-level LAST_EXEC map instead of a useRef so remounts don't
  // double-fire (the auto-switch unmounts TabulatorWidget and mounts
  // MapWidget etc., and each mount used to restart the version counter).
  useEffect(() => {
    if (!connectionId || !dataSource) return;

    const mode = dataSource.mode;
    const prev = LAST_EXEC.get(widgetId);

    // Script mode — version-gated re-execution.
    if (mode === "script") {
      const currentVersion = dataSource.scriptExecuteVersion ?? 0;
      if (prev && prev.mode === "script" && prev.scriptVersion === currentVersion) {
        console.log('[useWidgetData] SKIP-script widgetId=' + widgetId + ' ver=' + currentVersion);
        return;
      }
      LAST_EXEC.set(widgetId, { mode: "script", scriptVersion: currentVersion });

      const script = dataSource.script;
      if (!script) { clearWidgetQueryLoading(widgetId); return; }

      let cancelled = false;
      setWidgetQueryLoading(widgetId);
      executeScript(connectionId, script, filterValues ?? {})
        .then((res) => { if (!cancelled) setWidgetQueryResult(widgetId, res); })
        .catch((e) => { if (!cancelled) setWidgetQueryError(widgetId, e instanceof Error ? e.message : "Script failed"); });

      return () => { cancelled = true; };
    }

    // SQL / AI-SQL — version-gated re-execution (only when Run is clicked).
    if (mode === "sql" || mode === "ai-sql") {
      const currentVersion = dataSource.executeVersion ?? 0;
      if (prev && prev.mode === mode && prev.executeVersion === currentVersion) {
        console.log('[useWidgetData] SKIP-sql widgetId=' + widgetId + ' ver=' + currentVersion);
        return;
      }
      LAST_EXEC.set(widgetId, { mode, executeVersion: currentVersion });
    }

    // Build raw SQL. Filter values are sent to the backend separately as named
    // params — the backend converts ${param} → :param and uses JDBI bindMap for
    // injection-safe binding.  No client-side string substitution.
    const raw = sqlForDataSource(dataSource, getConnectionType(connectionId));
    if (!raw) { clearWidgetQueryLoading(widgetId); return; }

    if (mode === "visual") {
      const filterSnapshot = JSON.stringify(filterValues ?? {});
      if (prev && prev.mode === "visual" && prev.sql === raw && prev.filterSnapshot === filterSnapshot) {
        console.log('[useWidgetData] SKIP-visual widgetId=' + widgetId);
        return;
      }
      LAST_EXEC.set(widgetId, { mode: "visual", sql: raw, filterSnapshot });
    }

    let cancelled = false;
    console.log('[useWidgetData] FIRE widgetId=' + widgetId + ' mode=' + mode + ' sql=' + raw.slice(0, 60));
    setWidgetQueryLoading(widgetId);
    executeQuery(connectionId, raw, filterValues ?? {})
      .then((res) => {
        if (cancelled) {
          console.log('[useWidgetData] DISCARDED widgetId=' + widgetId);
        } else {
          console.log('[useWidgetData] RESULT widgetId=' + widgetId + ' rows=' + res.data?.length);
          setWidgetQueryResult(widgetId, res);
        }
      })
      .catch((e) => {
        console.log('[useWidgetData] ERROR widgetId=' + widgetId + ' ' + (e instanceof Error ? e.message : String(e)));
        if (!cancelled) setWidgetQueryError(widgetId, e instanceof Error ? e.message : "Query failed");
      });

    return () => {
      cancelled = true;
      console.log('[useWidgetData] CLEANUP widgetId=' + widgetId + ' mode=' + mode);
    };
  }, [connectionId, dataSource, filterValues, filterVersion, widgetId, setWidgetQueryLoading, setWidgetQueryResult, setWidgetQueryError, clearWidgetQueryLoading]);

  return {
    result: cached?.result ?? null,
    loading: cached?.loading ?? false,
    error: cached?.error ?? null,
    tableSchema,
    connectionSchemas,
  };
}

