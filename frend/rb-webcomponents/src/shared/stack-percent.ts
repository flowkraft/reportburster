/**
 * 100% stacked (#25): each bar or area is drawn as the share of its stack, so every stack reaches
 * 100. Asked for by `options.rbStack100` in the chart's DSL - the Map the Canvas writes and the
 * published page reads. Chart.js has no such mode; `rb-chart` hands the config here once it is built.
 */

export const STACK_PERCENT_KEY = 'rbStack100';

/** Whether a chart's options ask for its stacks drawn as shares. */
export function stackPercentOn(options: unknown): boolean {
  return (options as Record<string, unknown> | undefined)?.[STACK_PERCENT_KEY] === true;
}

const numberOf = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

/**
 * Each value as a percentage of its stack (the values at the same place in every dataset). A stack
 * of nothing stays nothing. The values as they were are kept beside them (`rbRaw`), for the tooltip.
 */
export function toPercentOfStack<T extends { data?: unknown[] }>(datasets: T[]): (T & { data: number[]; rbRaw: unknown[] })[] {
  const length = Math.max(0, ...datasets.map((ds) => ds.data?.length ?? 0));
  const totals = Array.from({ length }, (_, j) =>
    datasets.reduce((sum, ds) => sum + Math.abs(numberOf(ds.data?.[j])), 0));
  return datasets.map((ds) => ({
    ...ds,
    rbRaw: ds.data ?? [],
    data: Array.from({ length }, (_, j) => (totals[j] ? (numberOf(ds.data?.[j]) / totals[j]) * 100 : 0)),
  }));
}

/** A share as a tooltip and a label say it. */
export function formatPercent(value: number): string {
  return `${value.toLocaleString('en-US', { maximumFractionDigits: 1 })}%`;
}

/**
 * Turn a built Chart.js config into its 100% stacked self, in place: the shares, both axes stacked,
 * the value axis 0 to 100 read as percentages, and a tooltip that gives the share and the value.
 */
export function applyStackPercent(config: any): void {
  if (!config || !stackPercentOn(config.options)) return;
  const data = config.data || {};
  data.datasets = toPercentOfStack(data.datasets || []);
  config.data = data;
  const options = (config.options = { ...config.options });
  const valueAxis = options.indexAxis === 'y' ? 'x' : 'y';
  const otherAxis = valueAxis === 'y' ? 'x' : 'y';
  const scales = (options.scales = { ...(options.scales || {}) });
  scales[otherAxis] = { ...(scales[otherAxis] || {}), stacked: true };
  scales[valueAxis] = {
    ...(scales[valueAxis] || {}),
    stacked: true,
    min: 0,
    max: 100,
    ticks: { ...(scales[valueAxis]?.ticks || {}), callback: (v: number | string) => `${v}%` },
  };
  const plugins = (options.plugins = { ...(options.plugins || {}) });
  const tooltip = (plugins.tooltip = { ...(plugins.tooltip || {}) });
  tooltip.callbacks = {
    ...(tooltip.callbacks || {}),
    label: (item: any) => {
      const raw = item.dataset?.rbRaw?.[item.dataIndex];
      const share = formatPercent(numberOf(item.raw));
      return `${item.dataset?.label ?? ''}: ${share}${raw === undefined ? '' : ` (${raw})`}`;
    },
  };
}
