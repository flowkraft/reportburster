/**
 * Data labels (#24): the value of each bar, point and slice written on the chart, switched on by
 * `options.plugins.rbValueLabels.display` in the chart's DSL - the Map the Canvas writes and the
 * published page reads - so both draw them by one route. A small Chart.js plugin, registered once
 * by `rb-chart` and quiet on every chart that does not ask for it.
 */

import { formatPercent, stackPercentOn } from './stack-percent.ts';
import { chartNumberFormatOf } from './chart-number-format.ts';
import { formatMeasure } from './cube-format.ts';

export const VALUE_LABELS_PLUGIN_ID = 'rbValueLabels';

/** The number a data point holds: a plain number, or the measured coordinate of a point object. */
export function valueOf(raw: unknown, horizontal = false): number | null {
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null;
  if (raw && typeof raw === 'object') {
    const point = raw as Record<string, unknown>;
    const v = horizontal ? point.x : point.y;
    return typeof v === 'number' && Number.isFinite(v) ? v : null;
  }
  return null;
}

/** How a label reads: grouped, at most two decimals. */
export function formatValueLabel(value: number): string {
  return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

/** Whether a chart's options ask for labels. */
export function valueLabelsOn(options: unknown): boolean {
  return (options as { display?: unknown } | undefined)?.display === true;
}

const PIE_TYPES = new Set(['pie', 'doughnut', 'polarArea']);

/** Where a label sits and how it is anchored, for one drawn element. */
export function labelPlacement(
  elementType: string,
  el: { x: number; y: number; base?: number; tooltipPosition?: () => { x: number; y: number } },
  horizontal: boolean,
  stacked: boolean,
): { x: number; y: number; align: CanvasTextAlign; baseline: CanvasTextBaseline } {
  if (PIE_TYPES.has(elementType) && el.tooltipPosition) {
    const p = el.tooltipPosition();
    return { x: p.x, y: p.y, align: 'center', baseline: 'middle' };
  }
  if (elementType === 'bar') {
    if (stacked && typeof el.base === 'number') {
      return horizontal
        ? { x: (el.x + el.base) / 2, y: el.y, align: 'center', baseline: 'middle' }
        : { x: el.x, y: (el.y + el.base) / 2, align: 'center', baseline: 'middle' };
    }
    return horizontal
      ? { x: el.x + 4, y: el.y, align: 'left', baseline: 'middle' }
      : { x: el.x, y: el.y - 4, align: 'center', baseline: 'bottom' };
  }
  return { x: el.x, y: el.y - 6, align: 'center', baseline: 'bottom' };
}

/**
 * The plugin. What it wrote last is kept on the chart (`$rbValueLabels`), so a reader - a test -
 * can say which labels are on it without reading pixels.
 */
export const valueLabelsPlugin = {
  id: VALUE_LABELS_PLUGIN_ID,
  afterDatasetsDraw(chart: any, _args: unknown, options: unknown) {
    if (!valueLabelsOn(options)) {
      chart.$rbValueLabels = [];
      return;
    }
    const ctx: CanvasRenderingContext2D = chart.ctx;
    const horizontal = chart.options?.indexAxis === 'y';
    const scales = chart.options?.scales || {};
    const stacked = !!(scales.x?.stacked || scales.y?.stacked);
    // A 100% stacked chart (#25) holds shares: its labels say so.
    const percent = stackPercentOn(chart.config?.options);
    // A chart written in a number format (#26) writes its labels in it too.
    const format = chartNumberFormatOf(chart.config?.options);
    const written: string[] = [];
    ctx.save();
    ctx.font = '11px system-ui, sans-serif';
    ctx.fillStyle = (chart.options?.color as string) || '#666';
    (chart.data?.datasets || []).forEach((dataset: any, i: number) => {
      if (!chart.isDatasetVisible(i)) return;
      // A dataset drawn invisible (a waterfall's floor) has nothing to say.
      if (dataset.backgroundColor === 'rgba(0,0,0,0)') return;
      const meta = chart.getDatasetMeta(i);
      const elementType = PIE_TYPES.has(meta.type) ? meta.type : meta.type === 'bar' ? 'bar' : 'point';
      (meta.data || []).forEach((el: any, j: number) => {
        const value = valueOf(dataset.data?.[j], horizontal);
        if (value === null || !el || el.skip) return;
        const at = labelPlacement(elementType, el, horizontal, stacked);
        const text = percent ? formatPercent(value) : format ? formatMeasure(value, format) : formatValueLabel(value);
        ctx.textAlign = at.align;
        ctx.textBaseline = at.baseline;
        ctx.fillText(text, at.x, at.y);
        written.push(text);
      });
    });
    ctx.restore();
    chart.$rbValueLabels = written;
  },
};
