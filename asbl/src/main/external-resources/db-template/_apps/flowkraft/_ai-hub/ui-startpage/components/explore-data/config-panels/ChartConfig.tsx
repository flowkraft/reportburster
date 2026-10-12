"use client";

import { useEffect, useState } from "react";
// lucide-react removed
import type { WidgetDisplayConfig } from "@/lib/stores/canvas-store";

// ── Heroicon wrapper components used in CHART_TYPES array ────────────────────
const _BarChart3 = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" /></svg>
);
const _TrendingUp = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" /></svg>
);
const _PieChart = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" /></svg>
);
const _Circle = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className}><circle cx="12" cy="12" r="9" /></svg>
);
const _Filter = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" /></svg>
);
const _AlignStartHorizontal = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M3 9.75h18M3 9.75v4.5M3 9.75V5.25m0 4.5h4.5m13.5 0h-9" /></svg>
);
const _AreaChart = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18" /><path strokeLinecap="round" strokeLinejoin="round" d="M3 18 9 12l3 3 6-6 3 3" /></svg>
);
const _Combine = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625Z" /></svg>
);
const _Disc3 = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="2" /></svg>
);
const _BoxSelect = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className}><rect x="3" y="6" width="18" height="12" rx="1" /><line x1="12" y1="6" x2="12" y2="18" /><line x1="3" y1="12" x2="21" y2="12" /></svg>
);
const _BarChart2 = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M3 4.125C3 3.504 3.504 3 4.125 3h2.25c.621 0 1.125.504 1.125 1.125v17.25c0 .621-.504 1.125-1.125 1.125h-2.25A1.125 1.125 0 0 1 3 21.375V4.125ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v12.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 13.125c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v8.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125v-8.25Z" /></svg>
);
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
  { type: "bar",       icon: _BarChart3,            label: "Bar" },
  { type: "row",       icon: _AlignStartHorizontal, label: "Row" },
  { type: "line",      icon: _TrendingUp,           label: "Line" },
  { type: "area",      icon: _AreaChart,            label: "Area" },
  { type: "combo",     icon: _Combine,              label: "Combo" },
  { type: "scatter",   icon: _Circle,               label: "Scatter" },
  { type: "bubble",    icon: _Disc3,                label: "Bubble" },
  { type: "pie",       icon: _PieChart,             label: "Pie" },
  { type: "doughnut",  icon: _Circle,               label: "Donut" },
  { type: "boxplot",   icon: _BoxSelect,            label: "Box" },
  { type: "waterfall", icon: _BarChart2,            label: "Waterfall" },
  { type: "funnel",    icon: _Filter,               label: "Funnel" },
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

/** Replace the data block's datasets from the new yFields[]. A measure that stays keeps its
 *  entry whole (its name, its type, its axis), as the widget's own auto-pick does. */
function writeYFields(map: ChartDslOptions, yFields: string[]): ChartDslOptions {
  const data: ChartDataBlock = { ...((map.data as ChartDataBlock | undefined) ?? {}) };
  const kept = data.datasets ?? [];
  if (yFields.length > 0) data.datasets = yFields.map((f) => kept.find((d) => d.field === f) ?? { field: f, label: f });
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

/** Read whether the chart writes its values on itself (`options.plugins.rbValueLabels.display`, #24). */
export function readValueLabels(map: ChartDslOptions): boolean {
  const opts = map.options as Record<string, unknown> | undefined;
  const plugins = opts?.plugins as Record<string, unknown> | undefined;
  return (plugins?.rbValueLabels as Record<string, unknown> | undefined)?.display === true;
}

/** The number formats a chart can be written in (#26), the ones a table column and a KPI know. */
export const CHART_NUMBER_FORMATS = [
  { value: "", label: "Auto" },
  { value: "number", label: "Number (1,234)" },
  { value: "currency", label: "Currency ($1,234.00)" },
  { value: "percent", label: "Percent (0.34 is 34%)" },
  { value: "compact", label: "Compact (1.2K)" },
] as const;

/** Read the chart's number format (`options.rbNumberFormat`); "" when Chart.js writes the numbers. */
export function readNumberFormat(map: ChartDslOptions): string {
  const fmt = (map.options as Record<string, unknown> | undefined)?.rbNumberFormat;
  return typeof fmt === "string" && CHART_NUMBER_FORMATS.some((f) => f.value === fmt) ? fmt : "";
}

/** Set or clear the chart's number format, pruning what it empties. */
export function setNumberFormat(map: ChartDslOptions, fmt: string): ChartDslOptions {
  const opts = { ...((map.options as Record<string, unknown> | undefined) ?? {}) };
  if (fmt) opts.rbNumberFormat = fmt;
  else delete opts.rbNumberFormat;
  const next: ChartDslOptions = { ...map };
  if (Object.keys(opts).length > 0) next.options = opts;
  else delete next.options;
  return next;
}

/** How a chart stacks (#25): not at all, stacked, or each stack as 100%. An area chart stacks
 *  unless it says `stacked false`; a bar chart only when it says `stacked true`. */
export type StackMode = "off" | "on" | "percent";
export function readStackMode(map: ChartDslOptions, chartType: string): StackMode {
  const opts = map.options as Record<string, unknown> | undefined;
  if (opts?.rbStack100 === true) return "percent";
  const y = (opts?.scales as Record<string, unknown> | undefined)?.y as Record<string, unknown> | undefined;
  if (chartType === "area") return y?.stacked === false ? "off" : "on";
  return y?.stacked === true ? "on" : "off";
}

/** Write a stack mode into the Map, pruning what it empties, so "as it was" reads as it did. */
export function setStackMode(map: ChartDslOptions, mode: StackMode, chartType: string): ChartDslOptions {
  // An area stacks by itself: on is the keys gone, off is said out loud.
  let next = setStackedOption(map, chartType === "area" ? false : mode !== "off");
  const opts = { ...((next.options as Record<string, unknown> | undefined) ?? {}) };
  if (mode === "percent") opts.rbStack100 = true;
  else delete opts.rbStack100;
  if (chartType === "area" && mode === "off") {
    const scales = { ...((opts.scales as Record<string, unknown> | undefined) ?? {}) };
    scales.y = { ...((scales.y as Record<string, unknown> | undefined) ?? {}), stacked: false };
    opts.scales = scales;
  }
  next = { ...next };
  if (Object.keys(opts).length > 0) next.options = opts;
  else delete next.options;
  return next;
}

/** Read whether the bars stack (`options.scales.y.stacked`; absent means they do not). */
export function readStacked(map: ChartDslOptions): boolean {
  const opts = map.options as Record<string, unknown> | undefined;
  const scales = opts?.scales as Record<string, unknown> | undefined;
  const y = scales?.y as Record<string, unknown> | undefined;
  return y?.stacked === true;
}

/** Update options.scales.{x,y}.stacked immutably, pruning what it empties. */
export function setStackedOption(map: ChartDslOptions, stacked: boolean): ChartDslOptions {
  const opts = { ...((map.options as Record<string, unknown> | undefined) ?? {}) };
  const scales = { ...((opts.scales as Record<string, unknown> | undefined) ?? {}) };
  for (const axis of ["x", "y"] as const) {
    const one = { ...((scales[axis] as Record<string, unknown> | undefined) ?? {}) };
    if (stacked) one.stacked = true;
    else delete one.stacked;
    if (Object.keys(one).length > 0) scales[axis] = one;
    else delete scales[axis];
  }
  if (Object.keys(scales).length > 0) opts.scales = scales;
  else delete opts.scales;
  const next: ChartDslOptions = { ...map };
  if (Object.keys(opts).length > 0) next.options = opts;
  else delete next.options;
  return next;
}

/** The axis a chart's values are measured along: a row chart lays its bars along x. A pie, a
 *  donut and a funnel have no value axis to bound. */
export function valueAxisOf(chartType: string): "x" | "y" | null {
  if (chartType === "pie" || chartType === "doughnut" || chartType === "funnel") return null;
  return chartType === "row" ? "x" : "y";
}

/** One end of the value axis (`options.scales.<axis>.min|max`); undefined when Chart.js picks it. */
export function readAxisBound(map: ChartDslOptions, axis: "x" | "y", bound: "min" | "max"): number | undefined {
  const opts = map.options as Record<string, unknown> | undefined;
  const scales = opts?.scales as Record<string, unknown> | undefined;
  const value = (scales?.[axis] as Record<string, unknown> | undefined)?.[bound];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

/** Set or clear one end of an axis immutably, pruning what it empties. */
export function setAxisBound(
  map: ChartDslOptions,
  axis: "x" | "y",
  bound: "min" | "max",
  value: number | undefined,
): ChartDslOptions {
  const opts = { ...((map.options as Record<string, unknown> | undefined) ?? {}) };
  const scales = { ...((opts.scales as Record<string, unknown> | undefined) ?? {}) };
  const one = { ...((scales[axis] as Record<string, unknown> | undefined) ?? {}) };
  if (value === undefined) delete one[bound];
  else one[bound] = value;
  if (Object.keys(one).length > 0) scales[axis] = one;
  else delete scales[axis];
  if (Object.keys(scales).length > 0) opts.scales = scales;
  else delete opts.scales;
  const next: ChartDslOptions = { ...map };
  if (Object.keys(opts).length > 0) next.options = opts;
  else delete next.options;
  return next;
}

/** A new chart type can measure its values along the other axis (bar to row): the bounds go with them,
 *  and go away for a type that has no value axis. */
export function moveAxisBounds(map: ChartDslOptions, from: "x" | "y" | null, to: "x" | "y" | null): ChartDslOptions {
  if (from === null || from === to) return map;
  let next = map;
  for (const bound of ["min", "max"] as const) {
    const value = readAxisBound(map, from, bound);
    if (value === undefined) continue;
    next = setAxisBound(next, from, bound, undefined);
    if (to !== null) next = setAxisBound(next, to, bound, value);
  }
  return next;
}

/** What is typed into an axis bound: a number, undefined for an empty box (Chart.js picks), or
 *  null while it is not a number yet ("-", "1e"). */
export function parseAxisBound(text: string): number | undefined | null {
  const t = text.trim();
  if (t === "") return undefined;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

/** One end of the value axis. The text is kept while it is typed, so a "-" on its way to "-5" is not lost. */
function AxisBoundInput({ id, value, placeholder, onCommit }: {
  id: string;
  value: number | undefined;
  placeholder: string;
  onCommit: (value: number | undefined) => void;
}) {
  const [draft, setDraft] = useState(value === undefined ? "" : String(value));
  useEffect(() => {
    setDraft((d) => (parseAxisBound(d) === value ? d : value === undefined ? "" : String(value)));
  }, [value]);
  return (
    <input
      id={id}
      type="text"
      inputMode="decimal"
      value={draft}
      placeholder={placeholder}
      onChange={(e) => {
        setDraft(e.target.value);
        const next = parseAxisBound(e.target.value);
        if (next !== null) onCommit(next);
      }}
      className="w-full text-sm bg-base-100 border border-base-300 rounded-md px-2 py-1.5 text-base-content placeholder:text-base-content/60/40"
    />
  );
}

/** Update options.plugins.* immutably. */
function setPluginOption(map: ChartDslOptions, key: "title" | "legend" | "rbValueLabels", value: unknown): ChartDslOptions {
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

/** The right-hand axis a combo chart's series can be put on (Chart.js scale id). */
export const RIGHT_AXIS = "y1";

/** The draw type a combo series has when none is set: the first bars, the rest lines (`RbChart`). */
export function comboSeriesType(datasets: ChartDataBlock["datasets"], idx: number): string {
  return datasets?.[idx]?.type ?? (idx === 0 ? "bar" : "line");
}

/** One key of one series (`data.datasets[idx]`), set or, with `undefined` or "", taken away. */
export function setSeriesKey(
  map: ChartDslOptions,
  idx: number,
  key: "label" | "type" | "yAxisID",
  value: string | undefined,
): ChartDslOptions {
  const data: ChartDataBlock = { ...((map.data as ChartDataBlock | undefined) ?? {}) };
  const datasets = (data.datasets ?? []).map((d) => ({ ...d }));
  if (!datasets[idx]) return map;
  if (value === undefined || value === "") delete datasets[idx][key];
  else datasets[idx][key] = value;
  data.datasets = datasets;
  return { ...map, data };
}

/**
 * A series on the right axis or back on the left. The right axis is `options.scales.y1`: drawn
 * on the right, with no grid lines of its own across the chart. It stays as long as a series uses
 * it - an author's own settings on it (a title) kept - and goes with the last one.
 */
export function setSeriesOnRightAxis(map: ChartDslOptions, idx: number, on: boolean): ChartDslOptions {
  const next = setSeriesKey(map, idx, "yAxisID", on ? RIGHT_AXIS : undefined);
  const used = ((next.data as ChartDataBlock | undefined)?.datasets ?? []).some((d) => d.yAxisID === RIGHT_AXIS);
  const opts = { ...((next.options as Record<string, unknown> | undefined) ?? {}) };
  const scales = { ...((opts.scales as Record<string, unknown> | undefined) ?? {}) };
  if (used) {
    const right = { ...((scales[RIGHT_AXIS] as Record<string, unknown> | undefined) ?? {}) };
    right.position = "right";
    if (right.grid === undefined) right.grid = { drawOnChartArea: false };
    scales[RIGHT_AXIS] = right;
  } else {
    delete scales[RIGHT_AXIS];
  }
  if (Object.keys(scales).length > 0) opts.scales = scales;
  else delete opts.scales;
  const out: ChartDslOptions = { ...next };
  if (Object.keys(opts).length > 0) out.options = opts;
  else delete out.options;
  return out;
}

export function ChartConfig({ config, columns, onChange, rankingHints }: ChartConfigProps) {
  const map = readDslMap(config);

  const chartType = (map.type as string | undefined) ?? "bar";
  const xFields = readXFields(map);
  const yFields = readYFields(map);
  const bubbleSizeField = ((map.bubbleSizeField
    ?? (map.options as { bubbleSizeField?: string } | undefined)?.bubbleSizeField) as string | undefined) ?? "";
  const chartTitle = readTitle(map);
  const legend = readLegend(map);
  const palette = (map.palette as string | undefined) ?? "default";

  const hasSeriesSplit = xFields.length >= 2;
  const stackMode = readStackMode(map, chartType);
  // Stacking is offered where there is something to stack: an area chart, and bars or rows split by
  // a second column or carrying several measures.
  const canStack = chartType === "area"
    || ((chartType === "bar" || chartType === "row") && (hasSeriesSplit || yFields.length >= 2));
  const valueLabels = readValueLabels(map);
  const numberFormat = readNumberFormat(map);
  const valueAxis = valueAxisOf(chartType);
  const axisMin = valueAxis ? readAxisBound(map, valueAxis, "min") : undefined;
  const axisMax = valueAxis ? readAxisBound(map, valueAxis, "max") : undefined;
  const datasets = (map.data as ChartDataBlock | undefined)?.datasets ?? [];

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

  // A bar chart turned into a row chart keeps its axis bounds, now on x (`moveAxisBounds`).
  const setChartType = (type: string) =>
    setDslMap(config, moveAxisBounds({ ...map, type }, valueAxisOf(chartType), valueAxisOf(type)), onChange);

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

  // The data labels are the rb-chart plugin's own option, in the same Map the published page reads;
  // off takes the key away, so a chart that never had them reads exactly as it did.
  const setValueLabels = (on: boolean) =>
    setDslMap(config, setPluginOption(map, "rbValueLabels", on ? { display: true } : undefined), onChange);
  // The number format is read by rb-chart for the value axis, the tooltips and the labels (#26).
  const setChartNumberFormat = (fmt: string) => setDslMap(config, setNumberFormat(map, fmt), onChange);
  // Stacking is two Chart.js keys, written into the same Map the published page
  // reads, so the bars stack in the Canvas and on the dashboard by one route.
  const setStacked = (mode: StackMode) => setDslMap(config, setStackMode(map, mode, chartType), onChange);
  // The axis bounds are Chart.js's own `scales.<axis>.min|max`, in the same Map the published page reads.
  const setAxis = (bound: "min" | "max", value: number | undefined) => {
    if (valueAxis) setDslMap(config, setAxisBound(map, valueAxis, bound, value), onChange);
  };
  // The clicks setting lives in the canonical Map beside every other display setting, so it
  // travels into the published config file with them (Principle 4). Unticked takes the key away
  // again, so a dashboard that never used it reads exactly as it did.
  const clicksFilter = (map.clicksFilter as boolean | undefined) === true;
  const setClicksFilter = (on: boolean) => {
    const next = { ...map } as Record<string, unknown>;
    if (on) next.clicksFilter = true;
    else delete next.clicksFilter;
    setDslMap(config, next as typeof map, onChange);
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
        <span className="text-xs text-base-content/60">Chart type</span>
        <div className="grid grid-cols-4 gap-1 mt-1">
          {subtypeOrdered.map(({ type, icon: Icon, label, sensible, reason }) => {
            const isSelected = chartType === type;
            const baseClass = "flex flex-col items-center gap-0.5 px-1 py-1.5 rounded-md text-[10px] transition-colors";
            const stateClass = isSelected
              ? "bg-primary/10 text-primary border border-primary/30"
              : "text-base-content/60 hover:bg-base-200 border border-transparent";
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
          <p className="text-[10px] text-base-content/60 mt-1">
            Pick a table or run a query so we can suggest which charts fit your data shape.
          </p>
        )}
      </div>

      {chartType === "bubble" && (
        <div>
          <span className="text-xs text-base-content/60">
            Size <span className="text-emerald-500">(measure)</span>
          </span>
          <select
            id="selectChartBubbleSize"
            value={bubbleSizeField}
            onChange={(e) => setBubbleSizeField(e.target.value)}
            className="w-full mt-1 text-sm bg-base-100 border border-base-300 rounded-md px-2 py-1.5 text-base-content"
          >
            <option value="">Constant size</option>
            {measures.map((c) => (
              <option key={c.columnName} value={c.columnName}>{c.columnName}</option>
            ))}
          </select>
          <p className="text-[10px] text-base-content/60 mt-1">
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
        <span className="text-xs text-base-content/60">
          X axis <span className="text-blue-500">(dimension)</span>
        </span>
        <div className="mt-1 space-y-1">
          {xFields.map((field, idx) => (
            <div key={`x-${idx}`} className="flex items-center gap-1">
              <select
                id={`selectChartXAxis-${idx}`}
                value={field}
                onChange={(e) => setXFields(replaceAt(xFields, idx, e.target.value))}
                className="flex-1 text-sm bg-base-100 border border-base-300 rounded-md px-2 py-1.5 text-base-content"
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
              <span className="text-[10px] text-base-content/60 w-20 shrink-0">
                {idx === 0 ? "X axis" : "series by"}
              </span>
              <button
                id={`btnRemoveChartXAxis-${idx}`}
                type="button"
                onClick={() => removeXSlot(idx)}
                className="p-1 rounded hover:bg-error/10 text-base-content/60 hover:text-error"
                aria-label="Remove"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
              </button>
            </div>
          ))}
          {xFields.length < 2 && dimensions.length + measures.length > 0 && (
            <button
              id="btnAddChartXAxis"
              type="button"
              onClick={() => {
                const used = new Set(xFields);
                const first = [...dimensions, ...measures].find((c) => !used.has(c.columnName));
                if (first) addXSlot(first.columnName);
              }}
              className="flex items-center gap-1 px-2 py-1 text-[11px] rounded border border-dashed border-base-300 text-base-content/60 hover:bg-base-200 hover:text-base-content"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              {xFields.length === 0 ? "Add X axis" : "Add series breakout"}
            </button>
          )}
        </div>
      </div>

      <div>
        <span className="text-xs text-base-content/60">
          Y axis <span className="text-emerald-500">(measure)</span>
        </span>
        <div className="mt-1 space-y-1">
          {yFields.map((field, idx) => (
            <div key={`y-${idx}`} className="space-y-1">
            <div className="flex items-center gap-1">
              <select
                id={`selectChartYAxis-${idx}`}
                value={field}
                onChange={(e) => setYFields(replaceAt(yFields, idx, e.target.value))}
                className="flex-1 text-sm bg-base-100 border border-base-300 rounded-md px-2 py-1.5 text-base-content"
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
              <span className="text-[10px] text-base-content/60 w-20 shrink-0">
                {idx === 0 ? "Y axis" : `+ metric`}
              </span>
              <button
                id={`btnRemoveChartYAxis-${idx}`}
                type="button"
                onClick={() => removeYSlot(idx)}
                className="p-1 rounded hover:bg-error/10 text-base-content/60 hover:text-error"
                aria-label="Remove"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
              </button>
            </div>
            {/* The series this measure draws: the name its legend gives it, and in a combo chart
                whether it is drawn as bars or a line and on which axis. With a series breakout the
                series are the breakout's values, named by them, so there is nothing to name here. */}
            {!hasSeriesSplit && (
              <div className="flex items-center gap-1 pl-2">
                <input
                  id={`inputChartSeriesLabel-${idx}`}
                  type="text"
                  value={datasets[idx]?.label ?? ""}
                  placeholder={field}
                  onChange={(e) => setDslMap(config, setSeriesKey(map, idx, "label", e.target.value), onChange)}
                  aria-label={`Name of the ${field} series`}
                  className="flex-1 min-w-0 text-xs bg-base-100 border border-base-300 rounded-md px-2 py-1 text-base-content"
                />
                {chartType === "combo" && (
                  <>
                    <select
                      id={`selectChartSeriesType-${idx}`}
                      value={comboSeriesType(datasets, idx)}
                      onChange={(e) => setDslMap(config, setSeriesKey(map, idx, "type", e.target.value), onChange)}
                      aria-label={`How the ${field} series is drawn`}
                      className="text-xs bg-base-100 border border-base-300 rounded-md px-1 py-1 text-base-content"
                    >
                      <option value="bar">Bars</option>
                      <option value="line">Line</option>
                    </select>
                    <label className="flex items-center gap-1 text-[10px] text-base-content/60 whitespace-nowrap cursor-pointer">
                      <input
                        id={`chkChartSeriesRightAxis-${idx}`}
                        type="checkbox"
                        checked={datasets[idx]?.yAxisID === RIGHT_AXIS}
                        onChange={(e) => setDslMap(config, setSeriesOnRightAxis(map, idx, e.target.checked), onChange)}
                        className="rounded border-base-300"
                      />
                      right axis
                    </label>
                  </>
                )}
              </div>
            )}
            </div>
          ))}
          {!hasSeriesSplit && measures.length + dimensions.length > 0 && (
            <button
              id="btnAddChartYAxis"
              type="button"
              onClick={() => {
                const used = new Set(yFields);
                const first = [...measures, ...dimensions].find((c) => !used.has(c.columnName));
                if (first) addYSlot(first.columnName);
              }}
              className="flex items-center gap-1 px-2 py-1 text-[11px] rounded border border-dashed border-base-300 text-base-content/60 hover:bg-base-200 hover:text-base-content"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              {yFields.length === 0 ? "Add Y axis" : "Add metric"}
            </button>
          )}
          {hasSeriesSplit && yFields.length > 1 && (
            <p id="chartSeriesSplitWarning" className="text-[10px] text-amber-600">
              Series-split is active — only the first metric renders. Remove the series breakout to use multiple metrics.
            </p>
          )}
        </div>
      </div>

      <div>
        <span className="text-xs text-base-content/60">Chart title</span>
        <input
          id="inputChartTitle"
          type="text"
          value={chartTitle}
          onChange={(e) => setChartTitle(e.target.value)}
          placeholder="Optional title…"
          className="w-full mt-1 text-sm bg-base-100 border border-base-300 rounded-md px-2 py-1.5 text-base-content placeholder:text-base-content/60/40"
        />
      </div>

      <div>
        <span className="text-xs text-base-content/60">Legend</span>
        <div className="flex mt-1 rounded-md overflow-hidden border border-base-300 text-xs">
          {(["auto", "show", "hide"] as const).map((v) => (
            <button
              key={v}
              id={`btnChartLegend-${v}`}
              onClick={() => setLegend(v)}
              className={`flex-1 py-1.5 capitalize transition-colors ${
                legend === v
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-base-content/60 hover:bg-base-200"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className="text-xs text-base-content/60">Data labels</span>
        <div className="flex mt-1 rounded-md overflow-hidden border border-base-300 text-xs">
          {([["on", true], ["off", false]] as const).map(([label, value]) => (
            <button
              key={label}
              id={`btnChartLabels-${label}`}
              onClick={() => setValueLabels(value)}
              className={`flex-1 py-1.5 capitalize transition-colors ${
                valueLabels === value
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-base-content/60 hover:bg-base-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {canStack && (
        <div>
          <span className="text-xs text-base-content/60">Stacked</span>
          <div className="flex mt-1 rounded-md overflow-hidden border border-base-300 text-xs">
            {([["off", "off", "off"], ["on", "on", "on"], ["percent", "percent", "100%"]] as const).map(([key, value, label]) => (
              <button
                key={key}
                id={`btnChartStacked-${key}`}
                onClick={() => setStacked(value)}
                className={`flex-1 py-1.5 capitalize transition-colors ${
                  stackMode === value
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-base-content/60 hover:bg-base-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {valueAxis && (
        <div>
          <span className="text-xs text-base-content/60">Value axis</span>
          <div className="flex items-center gap-1.5 mt-1">
            <AxisBoundInput id="inputChartAxisMin" value={axisMin} placeholder="min: auto"
              onCommit={(v) => setAxis("min", v)} />
            <span className="text-xs text-base-content/60">to</span>
            <AxisBoundInput id="inputChartAxisMax" value={axisMax} placeholder="max: auto"
              onCommit={(v) => setAxis("max", v)} />
          </div>
          {axisMin !== undefined && axisMax !== undefined && axisMin >= axisMax && (
            <p id="chartAxisBoundsError" className="mt-1 text-[10px] text-error">The min must be below the max.</p>
          )}
        </div>
      )}

      <div>
        <span className="text-xs text-base-content/60">Number format</span>
        <select
          id="selectChartNumberFormat"
          value={numberFormat}
          onChange={(e) => setChartNumberFormat(e.target.value)}
          className="w-full mt-1 text-sm bg-base-100 border border-base-300 rounded-md px-2 py-1.5 text-base-content"
        >
          {CHART_NUMBER_FORMATS.map((f) => (
            <option key={f.value || "auto"} value={f.value}>{f.label}</option>
          ))}
        </select>
      </div>

      <div>
        <span className="text-xs text-base-content/60">Color palette</span>
        <div className="grid grid-cols-5 gap-1 mt-1">
          {PALETTES.map(({ id, label, colors }) => {
            const selected = palette === id;
            return (
              <button
                id={`btnChartPalette-${id}`}
                key={id}
                onClick={() => setPalette(id)}
                title={label}
                className={`flex flex-col items-center gap-0.5 p-1 rounded border transition-colors ${
                  selected ? "border-primary bg-primary/5" : "border-base-300 hover:border-muted-foreground/50"
                }`}
              >
                <div className="flex gap-0.5">
                  {colors.map((c) => (
                    <div key={c} style={{ backgroundColor: c }} className="w-2.5 h-2.5 rounded-sm" />
                  ))}
                </div>
                <span className="text-[9px] text-base-content/60">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* A widget's one interaction setting: its clicks make a selection, exactly as a slicer's do
          (`slicer-filters.ts`). Off until it is ticked, so no dashboard changes by itself. */}
      <label className="flex items-center gap-2 text-xs text-base-content cursor-pointer">
        <input
          id="chkChartClicksFilter"
          type="checkbox"
          checked={clicksFilter}
          onChange={(e) => setClicksFilter(e.target.checked)}
          className="rounded border-base-300"
        />
        <span>Clicks filter the dashboard</span>
        <span className="text-[10px] text-base-content/60 ml-auto">
          {clicksFilter ? "a click filters every widget on this table" : "clicks do nothing"}
        </span>
      </label>
    </div>
  );
}
