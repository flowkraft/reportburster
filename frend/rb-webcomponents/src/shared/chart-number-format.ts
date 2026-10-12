/**
 * Number formats on a chart (#26): its value axis, its tooltips and its data labels written the way
 * a table column or a KPI writes the same number - `formatMeasure`, the one place the page's number
 * formats live. Asked for by `options.rbNumberFormat` in the chart's DSL, the Map the Canvas writes
 * and the published page reads. A 100% stacked chart reads in shares, and keeps them.
 */
import { formatMeasure } from './cube-format.ts';
import { stackPercentOn } from './stack-percent.ts';
import { topNOf } from './top-n.ts';

export const NUMBER_FORMAT_KEY = 'rbNumberFormat';

/** The formats a chart can be written in; a percent is a fraction, as everywhere (0.34 is 34%). */
export const CHART_NUMBER_FORMATS = ['number', 'currency', 'percent', 'compact'] as const;

/** The format a chart's options ask for, or '' for the numbers as Chart.js writes them. */
export function chartNumberFormatOf(options: unknown): string {
  const fmt = (options as Record<string, unknown> | undefined)?.[NUMBER_FORMAT_KEY];
  return typeof fmt === 'string' && (CHART_NUMBER_FORMATS as readonly string[]).includes(fmt) ? fmt : '';
}

/** What decides how a chart is drawn beyond its data: a change of it draws the chart anew. */
export function drawModeOf(options: unknown): string {
  return `${stackPercentOn(options) ? '100%' : ''}|${chartNumberFormatOf(options)}|${topNOf(options)}`;
}

const PIE_TYPES = new Set(['pie', 'doughnut', 'polarArea']);

/** The number a tooltip item stands for: the coordinate a bar or a point is measured along. */
function itemValue(item: any, horizontal: boolean): unknown {
  const parsed = item?.parsed;
  if (parsed && typeof parsed === 'object') return horizontal ? parsed.x : parsed.y;
  return typeof parsed === 'number' ? parsed : item?.raw;
}

/** Write a built Chart.js config's numbers in its format, in place. */
export function applyChartNumberFormat(config: any): void {
  if (!config) return;
  const fmt = chartNumberFormatOf(config.options);
  if (!fmt || stackPercentOn(config.options)) return;
  const options = (config.options = { ...config.options });
  const horizontal = options.indexAxis === 'y';
  const pie = PIE_TYPES.has(config.type);
  if (!pie) {
    const axis = horizontal ? 'x' : 'y';
    const scales = (options.scales = { ...(options.scales || {}) });
    scales[axis] = {
      ...(scales[axis] || {}),
      ticks: { ...(scales[axis]?.ticks || {}), callback: (v: number | string) => formatMeasure(v, fmt) },
    };
  }
  const plugins = (options.plugins = { ...(options.plugins || {}) });
  const tooltip = (plugins.tooltip = { ...(plugins.tooltip || {}) });
  tooltip.callbacks = {
    ...(tooltip.callbacks || {}),
    label: (item: any) => {
      const name = pie ? item.label : item.dataset?.label;
      const value = formatMeasure(pie ? item.raw : itemValue(item, horizontal), fmt);
      return name ? `${name}: ${value}` : value;
    },
  };
}
