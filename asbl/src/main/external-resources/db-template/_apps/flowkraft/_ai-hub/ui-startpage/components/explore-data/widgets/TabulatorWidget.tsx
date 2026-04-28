"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useWidgetData } from "./useWidgetData";
import { useCanvasStore } from "@/lib/stores/canvas-store";
import { useRbElementReady } from "./useRbElementReady";
import { Loader2 } from "lucide-react";
import { looksLikeBoolean, isTemporalExtraction } from "@/lib/explore-data/smart-defaults";
import type { ColumnSchema } from "@/lib/explore-data/types";
import { pickColumnFormat, formatCellHtml, type FormatSpec } from "@/lib/explore-data/type-formatters";
import { pseudoColumnSchema } from "@/lib/explore-data/pseudo-column";
import type { ColumnSettingsMap } from "@/lib/explore-data/column-settings";
import { mergeColumnFormat } from "@/lib/explore-data/column-settings";
import { ColumnSettingsDialog } from "../ColumnSettingsDialog";

interface TabulatorWidgetProps {
  widgetId: string;
}

// Tabulator cell-like object — we only read getValue() from it.
type TabCell = { getValue: () => unknown };

/** Build a Tabulator formatter callback using the type-aware formatter.
 *  Returns HTML strings (link/image/etc. come out as anchors/imgs). Tabulator
 *  inserts the result as innerHTML, so anchors become clickable. */
function formatterFor(col: ColumnSchema, spec: FormatSpec): (cell: TabCell) => string {
  return (cell) => formatCellHtml(cell.getValue(), col, spec);
}

/** Custom column-header formatter — adds a tiny gear button next to the label.
 *  The button's click handler calls `onSettings(field)` directly and stops
 *  propagation before Tabulator's sort handler can intercept the event. */
function headerFormatterFor(title: string, field: string, onSettings: (f: string) => void): () => HTMLElement {
  return () => {
    const wrap = document.createElement("div");
    wrap.className = "rb-th-wrap";
    wrap.style.cssText = "display:flex;align-items:center;gap:4px;width:100%;";

    const label = document.createElement("span");
    label.textContent = title;
    label.style.cssText = "flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;";
    wrap.appendChild(label);

    const btn = document.createElement("button");
    btn.type = "button";
    btn.setAttribute("aria-label", `Settings for ${field}`);
    btn.title = "Column settings";
    btn.style.cssText = "flex:0 0 auto;padding:2px;border:none;background:transparent;color:#666;cursor:pointer;border-radius:3px;line-height:0;opacity:0.5;";
    // 12×12 gear SVG
    btn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`;
    btn.onmouseenter = () => { btn.style.opacity = "1"; btn.style.background = "rgba(0,0,0,0.06)"; };
    btn.onmouseleave = () => { btn.style.opacity = "0.5"; btn.style.background = "transparent"; };
    // stopPropagation prevents Tabulator's sort-click handler from firing.
    btn.addEventListener("click", (e) => { e.stopPropagation(); e.preventDefault(); onSettings(field); });
    wrap.appendChild(btn);

    return wrap;
  };
}

export function TabulatorWidget({ widgetId }: TabulatorWidgetProps) {
  const { result, loading, error } = useWidgetData(widgetId);
  const widget = useCanvasStore((s) => s.widgets.find((w) => w.id === widgetId));
  const updateWidgetDisplayConfig = useCanvasStore((s) => s.updateWidgetDisplayConfig);
  const ref = useRef<HTMLElement>(null);
  const ready = useRbElementReady("rb-tabulator");
  const [activeField, setActiveField] = useState<string | null>(null);

  const columnSettings     = (widget?.displayConfig.columnSettings    as ColumnSettingsMap | undefined) ?? {};
  const tabulatorLayout    = (widget?.displayConfig.tabulatorLayout    as string)  || "fitDataStretch";
  const tabulatorPagination = widget?.displayConfig.tabulatorPagination !== false;  // default on
  const tabulatorPageSize  = (widget?.displayConfig.tabulatorPageSize  as number)  || 50;
  const tabulatorTheme     = (widget?.displayConfig.tabulatorTheme     as string)  ?? "";
  const groupByBuckets = widget?.dataSource?.visualQuery?.groupByBuckets ?? {};
  const groupByCols = new Set(widget?.dataSource?.visualQuery?.groupBy ?? []);

  // Build per-column pseudo-schema + base format + effective (merged) format.
  // Rebuilds only when the rows or the settings change — cheap and avoids
  // constant flicker across renders.
  const columnMeta = useMemo(() => {
    if (!result || result.data.length === 0) return [] as { field: string; col: ColumnSchema; effective: FormatSpec; sample: unknown }[];
    const keys = Object.keys(result.data[0]);
    return keys.map((field) => {
      let sample: unknown = null;
      for (let i = 0; i < Math.min(5, result.data.length); i++) {
        if (result.data[i][field] !== null && result.data[i][field] !== undefined) {
          sample = result.data[i][field];
          break;
        }
      }
      const col = pseudoColumnSchema(field, sample);
      let base = pickColumnFormat(col);
      // Boolean-by-value detection (text column w/ exactly 2 booleanish values).
      if (base.kind === "text" && looksLikeBoolean(result.data, field, 50)) {
        base = { kind: "boolean" };
      }
      // Temporal bucket propagation: if this column is grouped with a bucket,
      // copy the bucket into the format spec so formatDateValue renders it
      // at the right granularity (month→"Mar 2026", day-of-week→"Monday").
      // groupByBuckets always carries TimeBucket values (a subset of DateUnit).
      const bucket = groupByBuckets[field];
      if (bucket && groupByCols.has(field)) {
        // Extraction buckets produce integer categories — treat as date with unit.
        if (isTemporalExtraction(bucket) || base.kind === "date") {
          base = { ...base, kind: "date", dateUnit: bucket };
        }
      }
      const effective = mergeColumnFormat(base, columnSettings[field]);
      return { field, col, effective, sample };
    });
  }, [result, columnSettings, JSON.stringify(groupByBuckets)]);

  useEffect(() => {
    if (!ready || !ref.current) return;
    if (!result || result.data.length === 0) return;

    const el = ref.current as HTMLElement & {
      data?: unknown;
      columns?: unknown;
      options?: unknown;
    };

    // Hidden set: union of the Display-tab checkbox list (`hiddenColumns`, set
    // by TabulatorConfig) + per-column gear-dialog `hidden: true` overrides.
    // Lower-case both sides: schema column names (e.g. "CustomerID") may differ
    // in case from result-data keys (e.g. "customerid" returned by DuckDB/SQLite).
    const configHiddenLower = new Set(
      ((widget?.displayConfig.hiddenColumns as string[]) || []).map((s) => s.trim().toLowerCase())
    );
    const visible = columnMeta.filter(
      ({ field }) => !configHiddenLower.has(field.trim().toLowerCase()) && !columnSettings[field]?.hidden
    );

    const columns = visible.map(({ field, col, effective }) => {
      const rightAlign = effective.kind === "currency" || effective.kind === "number" || effective.kind === "percentage" || effective.kind === "coordinate";
      const title = columnSettings[field]?.columnTitle ?? field;
      return {
        title,
        field,
        formatter: formatterFor(col, effective),
        titleFormatter: headerFormatterFor(title, field, setActiveField),
        hozAlign: rightAlign ? "right" : undefined,
        headerHozAlign: rightAlign ? "right" : undefined,
      };
    });

    el.columns = columns;
    el.data = result.data;
    el.options = {
      layout: tabulatorLayout,
      ...(tabulatorPagination
        ? { pagination: true, paginationSize: tabulatorPageSize }
        : { pagination: false }),
    };
    (el as HTMLElement & { theme?: string }).theme = tabulatorTheme;
  }, [ready, columnMeta, columnSettings, widget?.displayConfig.hiddenColumns, tabulatorLayout, tabulatorPagination, tabulatorPageSize, tabulatorTheme]);

  const activeMeta = columnMeta.find((m) => m.field === activeField) ?? null;

  if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;
  if (error) return <div className="text-xs text-destructive p-2 overflow-hidden">Query error: {error.split('\n')[0].slice(0, 200)}</div>;
  if (!result || result.data.length === 0) return null;
  if (!ready) return <div className="flex items-center justify-center h-full text-xs text-muted-foreground">Loading components...</div>;

  const vq = widget?.dataSource?.visualQuery;
  const limit = vq?.limit ?? 500;
  const atLimit = result.rowCount >= limit;

  return (
    <div className="h-full flex flex-col">
      {/* @ts-expect-error - Web component custom element */}
      <rb-tabulator key={`${tabulatorTheme}|${tabulatorLayout}|${tabulatorPagination}|${tabulatorPageSize}`} ref={ref} theme={tabulatorTheme} style={{ display: "block", width: "100%", flex: 1 }} />
      {atLimit && (
        <div className="shrink-0 px-2 py-0.5 text-[10px] text-muted-foreground bg-muted/40 border-t border-border/50 text-right">
          showing first {limit} rows — add a filter or raise the limit to see more
        </div>
      )}
      <ColumnSettingsDialog
        open={activeField !== null && activeMeta !== null}
        onClose={() => setActiveField(null)}
        column={activeMeta?.col ?? null}
        settings={activeField ? columnSettings[activeField] : undefined}
        sampleValue={activeMeta?.sample}
        onChange={(next) => {
          if (!widget || !activeField) return;
          const prev = (widget.displayConfig.columnSettings as ColumnSettingsMap | undefined) ?? {};
          const updated: ColumnSettingsMap = { ...prev };
          if (next === undefined) delete updated[activeField];
          else updated[activeField] = next;
          updateWidgetDisplayConfig(widget.id, {
            ...widget.displayConfig,
            columnSettings: updated,
          });
        }}
      />
    </div>
  );
}
