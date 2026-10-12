/**
 * Top N plus "Other" (#29): a bar, row, pie or donut chart keeps its N biggest bars or slices, in
 * the order its query gave them, and folds the rest into one "Other". Asked for by `options.rbTopN`
 * in the chart's DSL - the Map the Canvas writes and the published page reads.
 */

export const TOP_N_KEY = 'rbTopN';
export const OTHER_LABEL = 'Other';
const OTHER_COLOR = '#9ca3af';

/** The N a chart's options ask for, or 0 for every row. */
export function topNOf(options: unknown): number {
  const n = (options as Record<string, unknown> | undefined)?.[TOP_N_KEY];
  return typeof n === 'number' && Number.isInteger(n) && n >= 1 ? n : 0;
}

const numberOf = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

/** The chart types a fold makes sense for: one value per category, nothing in between. */
function foldable(config: any): boolean {
  if (!['bar', 'pie', 'doughnut'].includes(config?.type)) return false;
  return !(config.data?.datasets ?? []).some((ds: any) => ds?.type === 'line' || ds?.stack === 'wf');
}

/**
 * Fold a built Chart.js config, in place: the N categories with the biggest totals (over every
 * dataset) kept where they were, the rest summed into "Other" at the end. The place of "Other" is
 * kept on the data (`rbOtherIndex`): a click on it selects nothing.
 */
export function applyTopN(config: any): void {
  const n = topNOf(config?.options);
  if (!n || !foldable(config)) return;
  const labels: unknown[] = config.data?.labels ?? [];
  if (labels.length <= n + 1) return;
  const datasets: any[] = config.data.datasets ?? [];
  const totals = labels.map((_, i) => datasets.reduce((sum, ds) => sum + Math.abs(numberOf(ds.data?.[i])), 0));
  const kept = new Set(totals.map((t, i) => [t, i] as const).sort((a, b) => b[0] - a[0] || a[1] - b[1])
    .slice(0, n).map(([, i]) => i));
  const keep = labels.map((_, i) => i).filter((i) => kept.has(i));
  const rest = labels.map((_, i) => i).filter((i) => !kept.has(i));
  config.data = {
    ...config.data,
    labels: [...keep.map((i) => labels[i]), OTHER_LABEL],
    rbOtherIndex: keep.length,
    datasets: datasets.map((ds) => {
      const out = { ...ds, data: [...keep.map((i) => ds.data?.[i]), rest.reduce((sum, i) => sum + numberOf(ds.data?.[i]), 0)] };
      for (const key of ['backgroundColor', 'borderColor']) {
        if (Array.isArray(ds[key])) out[key] = [...keep.map((i) => ds[key][i]), OTHER_COLOR];
      }
      return out;
    }),
  };
}

/** Whether a click on this place of the chart landed on "Other". */
export function isOtherIndex(chart: any, index: number): boolean {
  return chart?.data?.rbOtherIndex === index;
}
