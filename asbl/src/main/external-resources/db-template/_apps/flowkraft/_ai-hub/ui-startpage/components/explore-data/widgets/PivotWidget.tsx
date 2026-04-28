"use client";

import { useEffect, useRef, useState } from "react";
import { useWidgetData } from "./useWidgetData";
import { useCanvasStore } from "@/lib/stores/canvas-store";
import { useRbElementReady } from "./useRbElementReady";
import { Loader2, Sparkles, BarChart3 } from "lucide-react";
import { fetchSchema } from "@/lib/explore-data/rb-api";
import { autoPivotLayout, isIdColumn, probeCardinality, classifyColumn } from "@/lib/explore-data/smart-defaults";

interface PivotWidgetProps {
  widgetId: string;
}

/**
 * Pivot Table widget — renders via <rb-pivot-table>.
 * Auto-picks rows/cols/vals from the table schema when the user hasn't configured them.
 * Suppresses NULL dim values and totals by default.
 */
export function PivotWidget({ widgetId }: PivotWidgetProps) {
  const { result, loading, error } = useWidgetData(widgetId);
  const widget = useCanvasStore((s) => s.widgets.find((w) => w.id === widgetId));
  const connectionId = useCanvasStore((s) => s.connectionId);
  const updateWidgetDisplayConfig = useCanvasStore((s) => s.updateWidgetDisplayConfig);
  const changeWidgetRenderMode = useCanvasStore((s) => s.changeWidgetRenderMode);
  const ref = useRef<HTMLElement>(null);
  const ready = useRbElementReady("rb-pivot-table");
  const [autoBusy, setAutoBusy] = useState(false);
  const [autoErr, setAutoErr] = useState<string | null>(null);

  const ds = widget?.dataSource;
  const vq = ds?.visualQuery;
  const displayConfig = widget?.displayConfig || {};
  const isVisualMode = ds?.mode === "visual" || ds?.mode === undefined;
  const hasTablePick = Boolean(vq?.table);
  const configRows = (displayConfig.pivotRows as string[] | undefined) ?? [];
  const configCols = (displayConfig.pivotCols as string[] | undefined) ?? [];
  const configVals = (displayConfig.pivotVals as string[] | undefined) ?? [];
  const noLayout = configRows.length === 0 && configCols.length === 0 && configVals.length === 0;

  const showAutoLayoutPrompt = isVisualMode && hasTablePick && noLayout;

  // Shape-mismatch nudge: 1 dim total + 1 measure fits a chart better than a pivot.
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
      // Probe cardinality so we skip high-card dims for rows/cols.
      const stringCols = tbl.columns
        .filter((c) => classifyColumn(c, tbl) === "category-low")
        .map((c) => c.columnName);
      const cardinality = stringCols.length > 0 ? await probeCardinality(connectionId, tbl.tableName, stringCols) : {};
      const layout = autoPivotLayout(tbl, cardinality);
      updateWidgetDisplayConfig(widget.id, {
        ...displayConfig,
        pivotRows: layout.rows,
        pivotCols: layout.cols,
        pivotVals: layout.vals,
        pivotAggregator: layout.aggregator,
        // Mark which fields were auto-picked so config panel can show (auto) badges.
        _autoPicked: ["pivotRows", "pivotCols", "pivotVals", "pivotAggregator"],
      });
    } catch (e) {
      setAutoErr(e instanceof Error ? e.message : "Auto-layout failed");
    } finally {
      setAutoBusy(false);
    }
  };

  // Auto-fire the layout pick the first time we see an unconfigured pivot with
  // a table selected. Runs once per widget; after this the prompt still appears
  // only if the user explicitly clears rows/cols/vals.
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
    // Guardrail: values should never be an ID-shaped column (wrong to aggregate).
    const pivotVals = configVals.filter((v) => !isIdColumn(v));
    const pivotAggregator = (displayConfig.pivotAggregator as string) || "Count";

    // Suppress rows where any dim-column is NULL/undefined/empty — those produce
    // ugly unlabeled rows/columns that are never what the user wants.
    const dimCols = [...pivotRows, ...pivotCols];
    const filteredData = dimCols.length === 0
      ? result.data
      : result.data.filter((row) => dimCols.every((c) => row[c] !== null && row[c] !== undefined && row[c] !== ""));

    // Hard cap — pivottable.js builds an in-memory cube of row × col distinct
    // values, then renders a DOM cell per combination. A high-cardinality
    // rows/cols pair can wedge the browser. Bail before the expensive work.
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

    // 4.11 — auto-pick Heatmap renderer for small 2-dim + 1-measure grids. The
    // threshold is distinct-col-values × distinct-row-values ≤ 225 (i.e., fits
    // a 15×15 cell grid comfortably). Larger grids stay as Table. User can
    // override via DslCustomizer by setting `pivotRenderer` explicitly.
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
    const configRenderer = displayConfig.pivotRenderer as string | undefined;
    const rendererName = configRenderer ?? (autoHeatmap ? "Heatmap" : "Table");

    // 4.12 — sort pivot rows by total value descending (biggest first). Users
    // want the interesting rows at the top; alphabetical is rarely useful in
    // analytical pivots. Configurable via displayConfig.pivotRowOrder.
    const rowOrder = (displayConfig.pivotRowOrder as string | undefined) ?? "value_z_to_a";

    // Per-column sort map (from the Pivot picker's ↑/↓/— toggles). Build a
    // `sorters` object keyed by column name that pivottable.js consumes as
    // `sorters[attr] = (a, b) => …`. Columns absent from the map fall through
    // to the global `rowOrder` / `colOrder` defaults.
    const pivotSortOrder = (displayConfig.pivotSortOrder as Record<string, "ascending" | "descending"> | undefined) ?? {};
    const sorters: Record<string, (a: unknown, b: unknown) => number> = {};
    for (const [col, order] of Object.entries(pivotSortOrder)) {
      const sign = order === "descending" ? -1 : 1;
      sorters[col] = (a, b) => {
        if (a === b) return 0;
        if (a == null) return 1;
        if (b == null) return -1;
        if (typeof a === "number" && typeof b === "number") return (a - b) * sign;
        return String(a).localeCompare(String(b)) * sign;
      };
    }

    const el = ref.current as HTMLElement & {
      data?: unknown;
      rows?: string[];
      cols?: string[];
      vals?: string[];
      aggregatorName?: string;
      rendererName?: string;
      rowOrder?: string;
      rowTotals?: boolean;
      colTotals?: boolean;
      sorters?: Record<string, (a: unknown, b: unknown) => number>;
    };

    el.data = filteredData;
    el.rows = pivotRows;
    el.cols = pivotCols;
    el.vals = pivotVals;
    el.aggregatorName = pivotAggregator;
    el.rendererName = rendererName;
    el.rowOrder = rowOrder;
    el.sorters = sorters;
    // Clean-by-default: no totals unless the user explicitly opts in via DslCustomizer.
    const optInRowTotals = displayConfig.pivotRowTotals as boolean | undefined;
    const optInColTotals = displayConfig.pivotColTotals as boolean | undefined;
    el.rowTotals = optInRowTotals ?? false;
    el.colTotals = optInColTotals ?? false;
  }, [ready, result, displayConfig, configRows, configCols, configVals, showAutoLayoutPrompt]);

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
