"use client";

import { useEffect, useRef, useState } from "react";
import { useWidgetData } from "./useWidgetData";
import { useCanvasStore } from "@/lib/stores/canvas-store";
import { useRbElementReady } from "./useRbElementReady";
import { Loader2, Sparkles, BarChart3 } from "lucide-react";
import { fetchSchema } from "@/lib/explore-data/rb-api";
import { autoPivotLayout, isIdColumn, probeCardinality, classifyColumn } from "@/lib/explore-data/smart-defaults";
import { useEffectiveField } from "@/lib/hooks/use-effective-field";
import { useDslConfig } from "@/lib/hooks/use-dsl-config";

/**
 * ============================================================================
 * 📖 LLM / AI ASSISTANTS — READ FIRST
 *
 *   bkend/server/src/main/java/com/flowkraft/reporting/dsl/common/
 *     DSLPrinciplesReadme.java
 *
 * Especially Principle 4: this widget renders FROM the DSL Map produced by
 * useDslConfig (the canonical configuration). Same Map flows to <rb-pivot-table>
 * here AND to the published page after DSL→parse round-trip.
 * ============================================================================
 */

interface PivotWidgetProps {
  widgetId: string;
}

export function PivotWidget({ widgetId }: PivotWidgetProps) {
  const { result, loading, error } = useWidgetData(widgetId);
  const widget = useCanvasStore((s) => s.widgets.find((w) => w.id === widgetId));
  const connectionId = useCanvasStore((s) => s.connectionId);
  const changeWidgetRenderMode = useCanvasStore((s) => s.changeWidgetRenderMode);
  const ref = useRef<HTMLElement>(null);
  const ready = useRbElementReady("rb-pivot-table");
  const [autoBusy, setAutoBusy] = useState(false);
  const [autoErr, setAutoErr] = useState<string | null>(null);

  // ── Single source of truth: the canonical DSL Map.
  const { config: dslMap, updateConfig } = useDslConfig(widgetId, "pivot");

  const ds = widget?.dataSource;
  const vq = ds?.visualQuery;
  const isVisualMode = ds?.mode === "visual" || ds?.mode === undefined;
  const hasTablePick = Boolean(vq?.table);

  const savedRows = (dslMap.rows as string[] | undefined) ?? [];
  const savedCols = (dslMap.cols as string[] | undefined) ?? [];
  const savedVals = (dslMap.vals as string[] | undefined) ?? [];
  const { validateFields } = useEffectiveField(result);
  const configRows = validateFields(savedRows);
  const configCols = validateFields(savedCols);
  const configVals = validateFields(savedVals);
  const noLayout = configRows.length === 0 && configCols.length === 0 && configVals.length === 0;

  const showAutoLayoutPrompt = isVisualMode && hasTablePick && noLayout;

  const totalDimCount = configRows.length + configCols.length;
  const showChartNudge = !showAutoLayoutPrompt && totalDimCount === 1 && configVals.length === 1;

  const handleAutoLayout = async () => {
    if (!widget || !connectionId || !vq?.table) return;
    setAutoBusy(true);
    setAutoErr(null);
    try {
      const schema = await fetchSchema(connectionId);
      const tbl = schema.tables.find((t) => t.tableName === vq.table);
      if (!tbl) {
        setAutoErr(`Table ${vq.table} not found.`);
        return;
      }
      const stringCols = tbl.columns
        .filter((c) => classifyColumn(c, tbl) === "category-low")
        .map((c) => c.columnName);
      const cardinality = stringCols.length > 0 ? await probeCardinality(connectionId, tbl.tableName, stringCols) : {};
      const layout = autoPivotLayout(tbl, cardinality);
      updateConfig({
        ...dslMap,
        rows: layout.rows,
        cols: layout.cols,
        vals: layout.vals,
        aggregatorName: layout.aggregator,
      });
    } catch (e) {
      setAutoErr(e instanceof Error ? e.message : "Auto-layout failed");
    } finally {
      setAutoBusy(false);
    }
  };

  const autoTriggeredRef = useRef<string | null>(null);
  useEffect(() => {
    if (!showAutoLayoutPrompt) return;
    if (!widget || !connectionId) return;
    if (autoBusy) return;
    if (autoTriggeredRef.current === widget.id) return;
    autoTriggeredRef.current = widget.id;
    handleAutoLayout();
  }, [showAutoLayoutPrompt, widget?.id, connectionId, autoBusy]);

  useEffect(() => {
    if (!ready || !ref.current) return;
    if (!result || result.data.length === 0) return;
    if (showAutoLayoutPrompt) return;

    const pivotRows = configRows;
    const pivotCols = configCols;
    const pivotVals = configVals.filter((v) => !isIdColumn(v));
    const pivotAggregator = (dslMap.aggregatorName as string | undefined) ?? "Count";

    const dimCols = [...pivotRows, ...pivotCols];
    const filteredData = dimCols.length === 0
      ? result.data
      : result.data.filter((row) => dimCols.every((c) => row[c] !== null && row[c] !== undefined && row[c] !== ""));

    const MAX_PIVOT_CELLS = 20000;
    if (dimCols.length > 0) {
      const rowDistinct = pivotRows.reduce(
        (acc, c) => acc * Math.max(1, new Set(filteredData.map((r) => r[c])).size),
        1,
      );
      const colDistinct = pivotCols.reduce(
        (acc, c) => acc * Math.max(1, new Set(filteredData.map((r) => r[c])).size),
        1,
      );
      if (rowDistinct * colDistinct > MAX_PIVOT_CELLS) {
        const el = ref.current as HTMLElement & { data?: unknown; options?: unknown };
        el.data = [];
        el.options = {
          message: `Pivot too large: ${rowDistinct} × ${colDistinct} = ${rowDistinct * colDistinct} cells (limit ${MAX_PIVOT_CELLS}). Pick lower-cardinality rows/columns or add a filter.`,
        };
        return;
      }
    }

    // Auto-pick Heatmap renderer for small 2-dim + 1-measure grids unless user
    // wrote rendererName explicitly in the DSL.
    const autoHeatmap =
      pivotRows.length === 1 &&
      pivotCols.length === 1 &&
      pivotVals.length === 1 &&
      (() => {
        const distinct = (col: string) => new Set(filteredData.map((r) => r[col])).size;
        const rowCard = distinct(pivotRows[0]);
        const colCard = distinct(pivotCols[0]);
        return rowCard > 0 && colCard > 0 && rowCard * colCard <= 225;
      })();
    const configRenderer = dslMap.rendererName as string | undefined;
    const rendererName = configRenderer ?? (autoHeatmap ? "Heatmap" : "Table");

    const rowOrder = (dslMap.rowOrder as string | undefined) ?? "value_z_to_a";
    const colOrder = dslMap.colOrder as string | undefined;

    const el = ref.current as HTMLElement & {
      data?: unknown;
      rows?: string[];
      cols?: string[];
      vals?: string[];
      aggregatorName?: string;
      rendererName?: string;
      rowOrder?: string;
      colOrder?: string;
      rowTotals?: boolean;
      colTotals?: boolean;
    };

    el.data = filteredData;
    el.rows = pivotRows;
    el.cols = pivotCols;
    el.vals = pivotVals;
    el.aggregatorName = pivotAggregator;
    el.rendererName = rendererName;
    el.rowOrder = rowOrder;
    if (colOrder) el.colOrder = colOrder;
    el.rowTotals = (dslMap.rowTotals as boolean | undefined) ?? false;
    el.colTotals = (dslMap.colTotals as boolean | undefined) ?? false;
  }, [ready, result, dslMap, configRows, configCols, configVals, showAutoLayoutPrompt]);

  if (showAutoLayoutPrompt) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="text-center max-w-xs">
          <div className="w-10 h-10 mx-auto mb-2.5 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <p className="text-sm font-medium text-foreground mb-1">
            {vq?.table ?? "This data"} — pick a pivot layout
          </p>
          <p className="text-[11px] text-muted-foreground mb-3">
            A pivot needs rows, columns, and values. Pick a sensible default, or configure in the Display tab.
          </p>
          <button
            type="button"
            onClick={handleAutoLayout}
            disabled={autoBusy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-60"
          >
            {autoBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            {autoBusy ? "Analyzing…" : "Auto-pick rows, columns, values"}
          </button>
          {autoErr && <p className="mt-2 text-[11px] text-destructive">{autoErr}</p>}
        </div>
      </div>
    );
  }

  if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;
  if (error) return <div className="text-xs text-destructive p-2 overflow-hidden">Query error: {error.split('\n')[0].slice(0, 200)}</div>;
  if (!result || result.data.length === 0) return null;
  if (!ready) return <div className="flex items-center justify-center h-full text-xs text-muted-foreground">Loading components...</div>;

  return (
    <div className="h-full flex flex-col">
      {showChartNudge && widget && (
        <div className="shrink-0 mx-2 mt-2 mb-1 px-2.5 py-1.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-[11px] text-foreground flex items-center gap-2">
          <span className="truncate flex-1">One dimension + one measure reads more clearly as a Chart.</span>
          <button
            type="button"
            onClick={() => changeWidgetRenderMode(widget.id, "chart")}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-background border border-border hover:bg-accent transition-colors font-medium"
          >
            <BarChart3 className="w-3 h-3" />
            Convert to Chart
          </button>
        </div>
      )}
      {/* @ts-expect-error - Web component custom element */}
      <rb-pivot-table ref={ref} style={{ display: "block", width: "100%", flex: 1, overflow: "auto" }} />
    </div>
  );
}
