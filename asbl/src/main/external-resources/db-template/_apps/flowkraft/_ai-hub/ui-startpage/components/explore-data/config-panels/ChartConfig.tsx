"use client";

import { BarChart3, TrendingUp, PieChart, Circle, Filter, AlignStartHorizontal, AreaChart, Combine, Disc3, BoxSelect, BarChart2, Plus, X as XIcon } from "lucide-react";
import type { WidgetDisplayConfig } from "@/lib/stores/canvas-store";
import type { ColumnSchema } from "@/lib/explore-data/types";
import { getFieldKind } from "@/lib/explore-data/field-utils";
import { isSensibleChartSubtype, rankChartSubtypes, type ChartRankingHints } from "@/lib/explore-data/smart-defaults";
import { AutoBadge, isAutoField, clearAutoFlag } from "./AutoBadge";

const PALETTES = [
  { id: "default", label: "Default", colors: ["#4e79a7","#f28e2b","#e15759","#76b7b2","#59a14f"] },
  { id: "warm",    label: "Warm",    colors: ["#d62728","#ff7f0e","#ffbb78","#8c564b","#e377c2"] },
  { id: "cool",    label: "Cool",    colors: ["#1f77b4","#aec7e8","#2ca02c","#9467bd","#17becf"] },
  { id: "pastel",  label: "Pastel",  colors: ["#a8dadc","#f4a261","#e9c46a","#2a9d8f","#e76f51"] },
  { id: "mono",    label: "Mono",    colors: ["#1a1a1a","#555","#888","#aaa","#ccc"] },
] as const;

export const CHART_TYPES = [
  { type: "bar",       icon: BarChart3,            label: "Bar" },
  { type: "row",       icon: AlignStartHorizontal, label: "Row" },
  { type: "line",      icon: TrendingUp,           label: "Line" },
  { type: "area",      icon: AreaChart,            label: "Area" },
  { type: "combo",     icon: Combine,              label: "Combo" },
  { type: "scatter",   icon: Circle,               label: "Scatter" },
  { type: "bubble",    icon: Disc3,                label: "Bubble" },
  { type: "pie",       icon: PieChart,             label: "Pie" },
  { type: "doughnut",  icon: Circle,               label: "Donut" },
  { type: "boxplot",   icon: BoxSelect,            label: "Box" },
  { type: "waterfall", icon: BarChart2,            label: "Waterfall" },
  { type: "funnel",    icon: Filter,               label: "Funnel" },
];

interface ChartConfigProps {
  config: WidgetDisplayConfig;
  columns: ColumnSchema[];
  onChange: (config: WidgetDisplayConfig) => void;
  /** Optional hints for the subtype ranker — cardinality map (pie demote/promote)
   *  and extraction-bucket set (line demote for day-of-week et al.). Supplied by
   *  ConfigPanel; passing them through lets the RB-extension rules fire. */
  rankingHints?: ChartRankingHints;
}

export function ChartConfig({ config, columns, onChange, rankingHints }: ChartConfigProps) {
  const chartType = (config.chartType as string) || "bar";
  // Array-shaped axes: xFields[0]=X, xFields[1]=series-split; yFields=metrics[].
  const xFields = (config.xFields as string[] | undefined) ?? [];
  const yFields = (config.yFields as string[] | undefined) ?? [];
  const bubbleSizeField = (config.bubbleSizeField as string) || "";

  const hasSeriesSplit = xFields.length >= 2;

  // Replace one slot in an array (used by chip edit dropdowns). Empty value
  // removes the slot entirely.
  const replaceAt = (arr: string[], idx: number, value: string): string[] => {
    if (!value) return arr.filter((_, i) => i !== idx);
    const next = arr.slice();
    next[idx] = value;
    return next;
  };

  const setXFields = (next: string[]) => onChange(clearAutoFlag({ ...config, xFields: next }, "xFields"));
  const setYFields = (next: string[]) => onChange(clearAutoFlag({ ...config, yFields: next }, "yFields"));

  const addXSlot = (value: string) => setXFields([...xFields, value]);
  const addYSlot = (value: string) => setYFields([...yFields, value]);
  const removeXSlot = (idx: number) => setXFields(xFields.filter((_, i) => i !== idx));
  const removeYSlot = (idx: number) => setYFields(yFields.filter((_, i) => i !== idx));

  const dimensions = columns.filter((c) => getFieldKind(c) === "dimension");
  const measures = columns.filter((c) => getFieldKind(c) === "measure");

  // Per-subtype sensibility + ranking. Two layers:
  //   1. isSensibleChartSubtype → hard filter (can this viz render at all?).
  //   2. rankChartSubtypes      → soft ordering inside the sensible set
  //      (temporal→line-led, categorical→bar-led, extraction→categorical,
  //      high-card demotes pie, etc.).
  // UX: never disable a pick — dim nonsensible and surface a tooltip reason.
  const rankedOrder = rankChartSubtypes(dimensions, measures, rankingHints);
  const rankOf = (t: string) => {
    const i = rankedOrder.indexOf(t);
    return i === -1 ? 999 : i;
  };
  const subtypeOrdered = columns.length > 0
    ? [...CHART_TYPES]
        .map((ct) => ({ ...ct, ...isSensibleChartSubtype(ct.type, dimensions, measures) }))
        .sort((a, b) => {
          // Sensible first; inside each bucket sort by rank position.
          if (a.sensible !== b.sensible) return Number(b.sensible) - Number(a.sensible);
          return rankOf(a.type) - rankOf(b.type);
        })
    : CHART_TYPES.map((ct) => ({ ...ct, sensible: true, reason: undefined as string | undefined }));

  return (
    <div id="configPanel-chart" className="space-y-3">
      {/* Chart type picker — 12 icons in a 4-col grid. Sensible-first sort;
          nonsensible buttons are dimmed but still clickable. */}
      <div>
        <span className="text-xs text-muted-foreground">
          Chart type
          {isAutoField(config, "chartType") && <AutoBadge reason="Picked from data shape (1 date + 1 measure → line; 1 category + 1 measure → bar; etc.)" />}
        </span>
        <div className="grid grid-cols-4 gap-1 mt-1">
          {subtypeOrdered.map(({ type, icon: Icon, label, sensible, reason }) => {
            const isSelected = chartType === type;
            const baseClass = "flex flex-col items-center gap-0.5 px-1 py-1.5 rounded-md text-[10px] transition-colors";
            const stateClass = isSelected
              ? "bg-primary/10 text-primary border border-primary/30"
              : "text-muted-foreground hover:bg-accent border border-transparent";
            const dimClass = !sensible && !isSelected ? "opacity-40" : "";
            return (
              <button
                key={type}
                id={`btnChartType-${type}`}
                aria-pressed={isSelected}
                onClick={() => onChange(clearAutoFlag({ ...config, chartType: type }, "chartType"))}
                title={!sensible ? `${label} — ${reason}. Pick anyway if you know what you're doing.` : label}
                aria-label={!sensible ? `${label} (not ideal: ${reason})` : label}
                className={`${baseClass} ${stateClass} ${dimClass}`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            );
          })}
        </div>
        {columns.length === 0 && (
          <p className="text-[10px] text-muted-foreground mt-1">
            Pick a table or run a query so we can suggest which charts fit your data shape.
          </p>
        )}
      </div>

      {/* Bubble size field — only when bubble */}
      {chartType === "bubble" && (
        <div>
          <span className="text-xs text-muted-foreground">
            Size <span className="text-emerald-500">(measure)</span>
          </span>
          <select
            value={bubbleSizeField}
            onChange={(e) => onChange({ ...config, bubbleSizeField: e.target.value })}
            className="w-full mt-1 text-sm bg-background border border-border rounded-md px-2 py-1.5 text-foreground"
          >
            <option value="">Constant size</option>
            {measures.map((c) => (
              <option key={c.columnName} value={c.columnName}>{c.columnName}</option>
            ))}
          </select>
          <p className="text-[10px] text-muted-foreground mt-1">
            Optional. When set, each bubble's radius reflects this measure.
          </p>
        </div>
      )}

      {/* BoxPlot needs raw rows — warn the user not to pre-aggregate */}
      {chartType === "boxplot" && (
        <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-2">
          Box Plot expects un-aggregated rows. In the Data tab, leave Summarize empty so the component can compute quartiles per category.
        </div>
      )}

      {/* X axis — chips. First chip = X; second chip (if set) = series-split dim.
          Max 2 chips — beyond two, the chart can't stay readable. */}
      <div>
        <span className="text-xs text-muted-foreground">
          X axis <span className="text-blue-500">(dimension)</span>
          {isAutoField(config, "xFields") && <AutoBadge reason="First group-by column; if you have 2 breakouts, the lower-cardinality one goes on X and the other becomes series-split." />}
        </span>
        <div className="mt-1 space-y-1">
          {xFields.map((field, idx) => (
            <div key={`x-${idx}`} className="flex items-center gap-1">
              <select
                value={field}
                onChange={(e) => setXFields(replaceAt(xFields, idx, e.target.value))}
                className="flex-1 text-sm bg-background border border-border rounded-md px-2 py-1.5 text-foreground"
              >
                {dimensions.length > 0 && (
                  <optgroup label="Dimensions">
                    {dimensions.map((c) => (
                      <option key={c.columnName} value={c.columnName}>{c.columnName}</option>
                    ))}
                  </optgroup>
                )}
                {measures.length > 0 && (
                  <optgroup label="Measures">
                    {measures.map((c) => (
                      <option key={c.columnName} value={c.columnName}>{c.columnName}</option>
                    ))}
                  </optgroup>
                )}
              </select>
              <span className="text-[10px] text-muted-foreground w-20 shrink-0">
                {idx === 0 ? "X axis" : "series by"}
              </span>
              <button
                type="button"
                onClick={() => removeXSlot(idx)}
                className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                aria-label="Remove"
              >
                <XIcon className="w-3 h-3" />
              </button>
            </div>
          ))}
          {xFields.length < 2 && dimensions.length + measures.length > 0 && (
            <button
              type="button"
              onClick={() => {
                const used = new Set(xFields);
                const first = [...dimensions, ...measures].find((c) => !used.has(c.columnName));
                if (first) addXSlot(first.columnName);
              }}
              className="flex items-center gap-1 px-2 py-1 text-[11px] rounded border border-dashed border-border text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <Plus className="w-3 h-3" />
              {xFields.length === 0 ? "Add X axis" : "Add series breakout"}
            </button>
          )}
        </div>
      </div>

      {/* Y axis — chips, one per metric. Uncapped by default, but when
          series-split is active (2 X chips) we force exactly 1 metric to
          avoid an N×M series explosion — hide "Add metric" in that case. */}
      <div>
        <span className="text-xs text-muted-foreground">
          Y axis <span className="text-emerald-500">(measure)</span>
          {isAutoField(config, "yFields") && <AutoBadge reason="All numeric measures (ID columns excluded). When a series-split is active, only the first metric renders." />}
        </span>
        <div className="mt-1 space-y-1">
          {yFields.map((field, idx) => (
            <div key={`y-${idx}`} className="flex items-center gap-1">
              <select
                value={field}
                onChange={(e) => setYFields(replaceAt(yFields, idx, e.target.value))}
                className="flex-1 text-sm bg-background border border-border rounded-md px-2 py-1.5 text-foreground"
              >
                {measures.length > 0 && (
                  <optgroup label="Measures">
                    {measures.map((c) => (
                      <option key={c.columnName} value={c.columnName}>{c.columnName}</option>
                    ))}
                  </optgroup>
                )}
                {dimensions.length > 0 && (
                  <optgroup label="Dimensions">
                    {dimensions.map((c) => (
                      <option key={c.columnName} value={c.columnName}>{c.columnName}</option>
                    ))}
                  </optgroup>
                )}
              </select>
              <span className="text-[10px] text-muted-foreground w-20 shrink-0">
                {idx === 0 ? "Y axis" : `+ metric`}
              </span>
              <button
                type="button"
                onClick={() => removeYSlot(idx)}
                className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                aria-label="Remove"
              >
                <XIcon className="w-3 h-3" />
              </button>
            </div>
          ))}
          {!hasSeriesSplit && measures.length + dimensions.length > 0 && (
            <button
              type="button"
              onClick={() => {
                const used = new Set(yFields);
                const first = [...measures, ...dimensions].find((c) => !used.has(c.columnName));
                if (first) addYSlot(first.columnName);
              }}
              className="flex items-center gap-1 px-2 py-1 text-[11px] rounded border border-dashed border-border text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <Plus className="w-3 h-3" />
              {yFields.length === 0 ? "Add Y axis" : "Add metric"}
            </button>
          )}
          {hasSeriesSplit && yFields.length > 1 && (
            <p className="text-[10px] text-amber-600">
              Series-split is active — only the first metric renders. Remove the series breakout to use multiple metrics.
            </p>
          )}
        </div>
      </div>

      {/* ── Chart title ── */}
      <div>
        <span className="text-xs text-muted-foreground">Chart title</span>
        <input
          type="text"
          value={(config.chartTitle as string) || ""}
          onChange={(e) => onChange({ ...config, chartTitle: e.target.value })}
          placeholder="Optional title…"
          className="w-full mt-1 text-sm bg-background border border-border rounded-md px-2 py-1.5 text-foreground placeholder:text-muted-foreground/40"
        />
      </div>

      {/* ── Legend ── */}
      <div>
        <span className="text-xs text-muted-foreground">Legend</span>
        <div className="flex mt-1 rounded-md overflow-hidden border border-border text-xs">
          {(["auto", "show", "hide"] as const).map((v) => (
            <button
              key={v}
              onClick={() => onChange({ ...config, chartShowLegend: v })}
              className={`flex-1 py-1.5 capitalize transition-colors ${
                ((config.chartShowLegend as string) || "auto") === v
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-accent"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* ── Color palette ── */}
      <div>
        <span className="text-xs text-muted-foreground">Color palette</span>
        <div className="grid grid-cols-5 gap-1 mt-1">
          {PALETTES.map(({ id, label, colors }) => {
            const selected = ((config.chartPalette as string) || "default") === id;
            return (
              <button
                key={id}
                onClick={() => onChange({ ...config, chartPalette: id })}
                title={label}
                className={`flex flex-col items-center gap-0.5 p-1 rounded border transition-colors ${
                  selected ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/50"
                }`}
              >
                <div className="flex gap-0.5">
                  {colors.map((c) => (
                    <div key={c} style={{ backgroundColor: c }} className="w-2.5 h-2.5 rounded-sm" />
                  ))}
                </div>
                <span className="text-[9px] text-muted-foreground">{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
