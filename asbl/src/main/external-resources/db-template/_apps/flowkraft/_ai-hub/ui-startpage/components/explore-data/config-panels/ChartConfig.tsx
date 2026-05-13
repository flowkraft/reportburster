"use client";

import { BarChart3, TrendingUp, PieChart, Circle, Filter, AlignStartHorizontal, AreaChart, Combine, Disc3, BoxSelect, BarChart2, Plus, X as XIcon } from "lucide-react";
import type { WidgetDisplayConfig } from "@/lib/stores/canvas-store";
import type { ColumnSchema } from "@/lib/explore-data/types";
import { getFieldKind } from "@/lib/explore-data/field-utils";
import { isSensibleChartSubtype, rankChartSubtypes, type ChartRankingHints } from "@/lib/explore-data/smart-defaults";
import type { ChartDslOptions, ChartDataBlock } from "@/lib/explore-data/dsl-sync/chart-mapping";

/**
 * ============================================================================
 * 📖 LLM / AI ASSISTANTS — READ FIRST
 *
 *   bkend/server/src/main/java/com/flowkraft/reporting/dsl/common/
 *     DSLPrinciplesReadme.java
 *
 * Especially Principle 4: every UI gesture in this Display tab panel mutates
 * the canonical DSL Map at displayConfig.dslConfig — never the old structured
 * fields (chartType, xFields, yFields, chartTitle, etc., now removed).
 * ============================================================================
 */

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
  rankingHints?: ChartRankingHints;
}

function readDslMap(config: WidgetDisplayConfig): ChartDslOptions {
  return (config.dslConfig as ChartDslOptions) ?? {};
}

function setDslMap(
  config: WidgetDisplayConfig,
  next: ChartDslOptions,
  onChange: (c: WidgetDisplayConfig) => void,
): void {
  onChange({ ...config, dslConfig: next });
}

/** Read x-axis fields from the canonical Map: [labelField, seriesField] (filter empties). */
function readXFields(map: ChartDslOptions): string[] {
  const data = (map.data as ChartDataBlock | undefined) ?? {};
  const out: string[] = [];
  if (typeof data.labelField === "string" && data.labelField) out.push(data.labelField);
  if (typeof data.seriesField === "string" && data.seriesField) out.push(data.seriesField);
  return out;
}

/** Read y-axis fields from the canonical Map: datasets[].field. */
function readYFields(map: ChartDslOptions): string[] {
  const data = (map.data as ChartDataBlock | undefined) ?? {};
  return (data.datasets ?? []).map((d) => d.field).filter((f): f is string => Boolean(f));
}

/** Replace the data block's labelField + seriesField from the new xFields[]. */
function writeXFields(map: ChartDslOptions, xFields: string[]): ChartDslOptions {
  const data: ChartDataBlock = { ...((map.data as ChartDataBlock | undefined) ?? {}) };
  if (xFields[0]) data.labelField = xFields[0]; else delete data.labelField;
  if (xFields[1]) data.seriesField = xFields[1]; else delete data.seriesField;
  const next: ChartDslOptions = { ...map };
  if (data.labelField || data.seriesField || (data.datasets && data.datasets.length > 0)) next.data = data;
  else delete next.data;
  return next;
}

/** Replace the data block's datasets from the new yFields[]. */
function writeYFields(map: ChartDslOptions, yFields: string[]): ChartDslOptions {
  const data: ChartDataBlock = { ...((map.data as ChartDataBlock | undefined) ?? {}) };
  if (yFields.length > 0) data.datasets = yFields.map((f) => ({ field: f, label: f }));
  else delete data.datasets;
  const next: ChartDslOptions = { ...map };
  if (data.labelField || data.seriesField || (data.datasets && data.datasets.length > 0)) next.data = data;
  else delete next.data;
  return next;
}

/** Read the chart title (`options.plugins.title.text`). */
function readTitle(map: ChartDslOptions): string {
  const opts = map.options as Record<string, unknown> | undefined;
  const plugins = opts?.plugins as Record<string, unknown> | undefined;
  const title = plugins?.title as Record<string, unknown> | undefined;
  return typeof title?.text === "string" ? title.text : "";
}

/** Read legend setting: "show" | "hide" | "auto" (auto = key absent). */
function readLegend(map: ChartDslOptions): "auto" | "show" | "hide" {
  const opts = map.options as Record<string, unknown> | undefined;
  const plugins = opts?.plugins as Record<string, unknown> | undefined;
  const legend = plugins?.legend as Record<string, unknown> | undefined;
  if (legend === undefined) return "auto";
  if (typeof legend.display === "boolean") return legend.display ? "show" : "hide";
  return "auto";
}

/** Update options.plugins.* immutably. */
function setPluginOption(map: ChartDslOptions, key: "title" | "legend", value: unknown): ChartDslOptions {
  const opts = { ...((map.options as Record<string, unknown> | undefined) ?? {}) };
  const plugins = { ...((opts.plugins as Record<string, unknown> | undefined) ?? {}) };
  if (value === undefined) delete plugins[key];
  else plugins[key] = value;
  if (Object.keys(plugins).length > 0) opts.plugins = plugins;
  else delete opts.plugins;
  const next: ChartDslOptions = { ...map };
  if (Object.keys(opts).length > 0) next.options = opts;
  else delete next.options;
  return next;
}

export function ChartConfig({ config, columns, onChange, rankingHints }: ChartConfigProps) {
  const map = readDslMap(config);

  const chartType = (map.type as string | undefined) ?? "bar";
  const xFields = readXFields(map);
  const yFields = readYFields(map);
  const bubbleSizeField = (map.bubbleSizeField as string | undefined) ?? "";
  const chartTitle = readTitle(map);
  const legend = readLegend(map);
  const palette = (map.palette as string | undefined) ?? "default";

  const hasSeriesSplit = xFields.length >= 2;

  const replaceAt = (arr: string[], idx: number, value: string): string[] => {
    if (!value) return arr.filter((_, i) => i !== idx);
    const next = arr.slice();
    next[idx] = value;
    return next;
  };

  const setXFields = (next: string[]) => setDslMap(config, writeXFields(map, next), onChange);
  const setYFields = (next: string[]) => setDslMap(config, writeYFields(map, next), onChange);

  const addXSlot = (value: string) => setXFields([...xFields, value]);
  const addYSlot = (value: string) => setYFields([...yFields, value]);
  const removeXSlot = (idx: number) => setXFields(xFields.filter((_, i) => i !== idx));
  const removeYSlot = (idx: number) => setYFields(yFields.filter((_, i) => i !== idx));

  const setChartType = (type: string) => setDslMap(config, { ...map, type }, onChange);

  const setBubbleSizeField = (f: string) => {
    const next: ChartDslOptions = { ...map };
    if (f) next.bubbleSizeField = f;
    else delete next.bubbleSizeField;
    setDslMap(config, next, onChange);
  };

  const setChartTitle = (title: string) => {
    if (title) {
      setDslMap(config, setPluginOption(map, "title", { display: true, text: title }), onChange);
    } else {
      setDslMap(config, setPluginOption(map, "title", undefined), onChange);
    }
  };

  const setLegend = (v: "auto" | "show" | "hide") => {
    if (v === "auto") {
      setDslMap(config, setPluginOption(map, "legend", undefined), onChange);
    } else {
      setDslMap(config, setPluginOption(map, "legend", { display: v === "show" }), onChange);
    }
  };

  const setPalette = (id: string) => {
    const next: ChartDslOptions = { ...map };
    if (id && id !== "default") next.palette = id;
    else delete next.palette;
    setDslMap(config, next, onChange);
  };

  const dimensions = columns.filter((c) => getFieldKind(c) === "dimension");
  const measures = columns.filter((c) => getFieldKind(c) === "measure");

  const rankedOrder = rankChartSubtypes(dimensions, measures, rankingHints);
  const rankOf = (t: string) => {
    const i = rankedOrder.indexOf(t);
    return i === -1 ? 999 : i;
  };
  const subtypeOrdered = columns.length > 0
    ? [...CHART_TYPES]
        .map((ct) => ({ ...ct, ...isSensibleChartSubtype(ct.type, dimensions, measures) }))
        .sort((a, b) => {
          if (a.sensible !== b.sensible) return Number(b.sensible) - Number(a.sensible);
          return rankOf(a.type) - rankOf(b.type);
        })
    : CHART_TYPES.map((ct) => ({ ...ct, sensible: true, reason: undefined as string | undefined }));

  return (
    <div id="configPanel-chart" className="space-y-3">
      <div>
        <span className="text-xs text-muted-foreground">Chart type</span>
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
                onClick={() => setChartType(type)}
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

      {chartType === "bubble" && (
        <div>
          <span className="text-xs text-muted-foreground">
            Size <span className="text-emerald-500">(measure)</span>
          </span>
          <select
            value={bubbleSizeField}
            onChange={(e) => setBubbleSizeField(e.target.value)}
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

      {chartType === "boxplot" && (
        <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-2">
          Box Plot expects un-aggregated rows. In the Data tab, leave Summarize empty so the component can compute quartiles per category.
        </div>
      )}

      <div>
        <span className="text-xs text-muted-foreground">
          X axis <span className="text-blue-500">(dimension)</span>
        </span>
        <div className="mt-1 space-y-1">
          {xFields.map((field, idx) => (
            <div key={`x-${idx}`} className="flex items-center gap-1">
              <select
                id={`selectChartXAxis-${idx}`}
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
                id={`btnRemoveChartXAxis-${idx}`}
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

      <div>
        <span className="text-xs text-muted-foreground">
          Y axis <span className="text-emerald-500">(measure)</span>
        </span>
        <div className="mt-1 space-y-1">
          {yFields.map((field, idx) => (
            <div key={`y-${idx}`} className="flex items-center gap-1">
              <select
                id={`selectChartYAxis-${idx}`}
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
                id={`btnRemoveChartYAxis-${idx}`}
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

      <div>
        <span className="text-xs text-muted-foreground">Chart title</span>
        <input
          id="inputChartTitle"
          type="text"
          value={chartTitle}
          onChange={(e) => setChartTitle(e.target.value)}
          placeholder="Optional title…"
          className="w-full mt-1 text-sm bg-background border border-border rounded-md px-2 py-1.5 text-foreground placeholder:text-muted-foreground/40"
        />
      </div>

      <div>
        <span className="text-xs text-muted-foreground">Legend</span>
        <div className="flex mt-1 rounded-md overflow-hidden border border-border text-xs">
          {(["auto", "show", "hide"] as const).map((v) => (
            <button
              key={v}
              id={`btnChartLegend-${v}`}
              onClick={() => setLegend(v)}
              className={`flex-1 py-1.5 capitalize transition-colors ${
                legend === v
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-accent"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className="text-xs text-muted-foreground">Color palette</span>
        <div className="grid grid-cols-5 gap-1 mt-1">
          {PALETTES.map(({ id, label, colors }) => {
            const selected = palette === id;
            return (
              <button
                key={id}
                onClick={() => setPalette(id)}
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
