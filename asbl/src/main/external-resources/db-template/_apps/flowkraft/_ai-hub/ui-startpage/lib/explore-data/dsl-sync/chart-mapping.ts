import type { WidgetDisplayConfig } from "@/lib/stores/canvas-store";

/**
 * Chart UI ↔ DSL mapping.
 *
 * UI keys currently exposed by ChartConfig: chartType, chartTitle, chartPalette,
 *   chartShowLegend, xFields, yFields, bubbleSizeField.
 * DSL keys (Chart.js aligned): type, labelField, labels, datasets, data, options.
 *
 * We map only `chartType` ↔ `type` cleanly — the rest of the chart config is
 * rich enough (nested `options.plugins.title.text`, `options.plugins.legend`,
 * dataset arrays, etc.) that editing it via the DSL surface is the right UX.
 * Unmapped DSL keys survive the round-trip via the customDsl text.
 */

export type ChartDslOptions = {
  type?: string;
  labelField?: string;
  datasets?: { field: string; label?: string }[];
  [k: string]: unknown;
};

export function uiToChartDsl(dc: WidgetDisplayConfig): ChartDslOptions {
  const opts: ChartDslOptions = {};
  const type = dc.chartType as string | undefined;
  if (type) opts.type = type;
  const xFields = dc.xFields as string[] | undefined;
  const yFields = dc.yFields as string[] | undefined;
  if (xFields && xFields.length > 0) opts.labelField = xFields[0];
  if (yFields && yFields.length > 0) {
    opts.datasets = yFields.map((f) => ({ field: f, label: f }));
  }
  const chartTitle      = dc.chartTitle      as string | undefined;
  const showLegend      = dc.chartShowLegend as string | undefined; // "auto"|"show"|"hide"
  const chartPalette    = dc.chartPalette    as string | undefined;
  const bubbleSizeField = dc.bubbleSizeField as string | undefined;
  const titleOpts  = chartTitle ? { display: true, text: chartTitle } : undefined;
  const legendOpts = showLegend === "show" ? { display: true }
                   : showLegend === "hide" ? { display: false }
                   : undefined; // "auto" → omit key, let chart decide
  if (titleOpts || legendOpts) {
    opts.options = {
      plugins: {
        ...(titleOpts  && { title:  titleOpts }),
        ...(legendOpts && { legend: legendOpts }),
      },
    };
  }
  if (chartPalette)    opts.palette       = chartPalette;
  if (bubbleSizeField) opts.bubbleSizeField = bubbleSizeField;
  return opts;
}

export function chartDslToUi(opts: ChartDslOptions, dc: WidgetDisplayConfig): WidgetDisplayConfig {
  const next: WidgetDisplayConfig = { ...dc };
  if ("type" in opts && typeof opts.type === "string") next.chartType = opts.type;
  if (opts.labelField) next.xFields = [opts.labelField];
  if (Array.isArray(opts.datasets) && opts.datasets.length > 0) {
    next.yFields = opts.datasets.map((d) => d.field).filter(Boolean);
  }
  const options   = opts.options  as Record<string, unknown> | undefined;
  const plugins   = options?.plugins  as Record<string, unknown> | undefined;
  const titleCfg  = plugins?.title   as Record<string, unknown> | undefined;
  const legendCfg = plugins?.legend  as Record<string, unknown> | undefined;
  if (titleCfg && typeof titleCfg.text === "string") next.chartTitle = titleCfg.text;
  if (legendCfg && typeof legendCfg.display === "boolean") {
    next.chartShowLegend = legendCfg.display ? "show" : "hide";
  }
  if (typeof opts.palette         === "string") next.chartPalette    = opts.palette;
  if (typeof opts.bubbleSizeField === "string") next.bubbleSizeField = opts.bubbleSizeField;
  return next;
}
