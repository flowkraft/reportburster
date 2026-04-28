"use client";

import { useEffect, useRef, useState } from "react";
import { useWidgetData } from "./useWidgetData";
import { useCanvasStore } from "@/lib/stores/canvas-store";
import { useRbElementReady } from "./useRbElementReady";
import { Loader2, Sparkles } from "lucide-react";
import { fetchSchema } from "@/lib/explore-data/rb-api";
import { autoPickMeasure } from "@/lib/explore-data/smart-defaults";
import { pickColumnFormat } from "@/lib/explore-data/type-formatters";
import type { ColumnSchema } from "@/lib/explore-data/types";

interface NumberWidgetProps {
  widgetId: string;
}

/**
 * Number widget — renders one big summary value via the <rb-value> web component.
 * Auto-picks the first non-ID measure and infers currency format from column name.
 */
export function NumberWidget({ widgetId }: NumberWidgetProps) {
  const { result, loading, error } = useWidgetData(widgetId);
  const widget = useCanvasStore((s) => s.widgets.find((w) => w.id === widgetId));
  const connectionId = useCanvasStore((s) => s.connectionId);
  const updateWidgetDataSource = useCanvasStore((s) => s.updateWidgetDataSource);
  const ref = useRef<HTMLElement>(null);
  const ready = useRbElementReady("rb-value");
  const [autoBusy, setAutoBusy] = useState(false);
  const [autoErr, setAutoErr] = useState<string | null>(null);

  const ds = widget?.dataSource;
  const vq = ds?.visualQuery;
  const isVisualMode = ds?.mode === "visual" || ds?.mode === undefined;
  const hasTablePick = Boolean(vq?.table);
  const hasAggregation =
    (vq?.summarize && vq.summarize.length > 0) || (vq?.groupBy && vq.groupBy.length > 0);
  const showAutoSummarizePrompt = isVisualMode && hasTablePick && !hasAggregation;

  const displayConfig = widget?.displayConfig || {};
  const configField = (displayConfig.numberField as string) || "";
  const configFormat = (displayConfig.numberFormat as string) || "";
  const configLabel = (displayConfig.numberLabel as string) || "";

  // Auto-pick: delegated to the library's `autoPickMeasure` (uses `classifyColumn`
  // under the hood). Build pseudo-columns from the first row's values so the
  // library function can classify by type without needing a TableSchema.
  const rows = result?.data ?? [];
  const keys = rows.length > 0 ? Object.keys(rows[0]) : [];
  const pseudoColumns: ColumnSchema[] = keys.map((k) => {
    const v = rows[0]?.[k];
    const typeName = typeof v === "number" ? "DOUBLE"
      : (typeof v === "string" && v !== "" && !isNaN(Number(v))) ? "DOUBLE"
      : "VARCHAR";
    return { columnName: k, typeName, isNullable: true };
  });
  const autoField = autoPickMeasure(pseudoColumns)?.columnName;
  const effectiveField = configField || autoField || keys[0] || "";
  // Infer format from column name (currency for revenue/freight/price/etc.).
  // pickColumnFormat returns a richer FormatSpec — we collapse to the two
  // values <rb-value> understands: "currency" | "number".
  const inferredSpec = effectiveField
    ? pickColumnFormat({ columnName: effectiveField, typeName: "DOUBLE", isNullable: true })
    : { kind: "number" as const };
  const effectiveFormat = configFormat || (inferredSpec.kind === "currency" ? "currency" : "number");
  const effectiveLabel = configLabel || effectiveField;

  const handleAutoSummarize = async () => {
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
      // A Number widget shows one aggregated value — COUNT(*) with no grouping.
      updateWidgetDataSource(widget.id, {
        mode: "visual",
        visualQuery: {
          kind: "table",
          table: tbl.tableName,
          filters: [],
          summarize: [{ aggregation: "count", field: "*" }],
          groupBy: [],
          sort: [],
          limit: 500,
        },
      });
    } catch (e) {
      setAutoErr(e instanceof Error ? e.message : "Auto-summarize failed");
    } finally {
      setAutoBusy(false);
    }
  };

  useEffect(() => {
    if (!ready || !ref.current) return;
    if (!result || result.data.length === 0) return;
    if (!effectiveField) return;

    const el = ref.current as HTMLElement & {
      data?: unknown;
      field?: string;
      format?: string;
    };

    el.field = effectiveField;
    el.format = effectiveFormat;
    el.data = result.data;
  }, [ready, result, effectiveField, effectiveFormat]);

  if (showAutoSummarizePrompt) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="text-center max-w-xs">
          <div className="w-10 h-10 mx-auto mb-2.5 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <p className="text-sm font-medium text-foreground mb-1">
            {vq?.table ?? "This data"} — pick a metric
          </p>
          <p className="text-[11px] text-muted-foreground mb-3">
            A Number widget shows one summary value. Start with the row count, or configure manually.
          </p>
          <button
            type="button"
            id="btnAutoSummarize"
            onClick={handleAutoSummarize}
            disabled={autoBusy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-60"
          >
            {autoBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            {autoBusy ? "Analyzing…" : "Auto-summarize"}
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
    <div className="flex flex-col items-center justify-center h-full">
      <div className="text-3xl font-bold text-foreground tabular-nums">
        {/* @ts-expect-error - Web component custom element */}
        <rb-value ref={ref} />
      </div>
      <div className="text-xs text-muted-foreground mt-1">{effectiveLabel}</div>
    </div>
  );
}
