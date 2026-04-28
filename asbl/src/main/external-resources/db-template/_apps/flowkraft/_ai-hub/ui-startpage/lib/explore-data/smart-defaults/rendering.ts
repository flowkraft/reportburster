// Rendering helpers — categorical color palette with semantic overrides,
// top-N clipping and sort-desc for bar charts, legend-show rule.
//
// The palette intentionally avoids Chart.js's default rainbow. Green/red are
// reserved for semantic measures (revenue vs. loss) so the colors carry meaning
// across dashboards.

/** Above this many bars in a chart, we clip to top-N sorted desc. */
export const TOP_N_DEFAULT = 20;

/**
 * Tailwind-semantic categorical palette. Cycles through 6 colors.
 *
 *   chart-1  blue    #3b82f6
 *   chart-2  emerald #10b981
 *   chart-3  amber   #f59e0b
 *   chart-4  violet  #8b5cf6
 *   chart-5  rose    #f43f5e
 *   chart-6  cyan    #06b6d4
 */
export const CHART_PALETTE = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#f43f5e",
  "#06b6d4",
] as const;

/** Column names that look like positive-outcome measures → green series. */
const SEMANTIC_GREEN = /\b(revenue|profit|sales|income|growth|gain|win|success|delivered|shipped|active|ok|pass)\b/i;

/** Column names that look like negative-outcome measures → red series. */
const SEMANTIC_RED = /\b(loss|churn|error|fail|refund|cost|expense|debt|overdue|cancel|reject|bounce|dropped)\b/i;

const COLOR_POSITIVE = "#22c55e"; // emerald 500
const COLOR_NEGATIVE = "#ef4444"; // red 500

/**
 * Pick a color for a dataset. Returns semantic green/red when the field name
 * matches a known positive/negative measure pattern; otherwise cycles through
 * the categorical palette.
 */
export function colorForDataset(fieldName: string, datasetIndex: number = 0): string {
  if (SEMANTIC_GREEN.test(fieldName)) return COLOR_POSITIVE;
  if (SEMANTIC_RED.test(fieldName)) return COLOR_NEGATIVE;
  return CHART_PALETTE[datasetIndex % CHART_PALETTE.length];
}

/**
 * For bar charts: sort the rows descending by the first Y (measure) field and
 * clip to top N. Returns { rows, hiddenCount } so the widget can show
 * "+ N more hidden" affordance.
 *
 * Users' explicit sort in the visual query overrides this — call only when
 * no user sort is set AND chart type is bar.
 */
export function clipTopN(
  rows: Record<string, unknown>[],
  yField: string,
  n: number = TOP_N_DEFAULT,
): { rows: Record<string, unknown>[]; hiddenCount: number } {
  if (rows.length <= n) return { rows, hiddenCount: 0 };
  const sorted = [...rows].sort((a, b) => {
    const av = Number(a[yField]) || 0;
    const bv = Number(b[yField]) || 0;
    return bv - av;
  });
  return { rows: sorted.slice(0, n), hiddenCount: rows.length - n };
}

/** Sort desc by the first Y field, no clipping. Used when row count is sane. */
export function sortBarsDesc(
  rows: Record<string, unknown>[],
  yField: string,
): Record<string, unknown>[] {
  return [...rows].sort((a, b) => {
    const av = Number(a[yField]) || 0;
    const bv = Number(b[yField]) || 0;
    return bv - av;
  });
}

export function shouldShowLegend(seriesCount: number): boolean {
  return seriesCount > 1;
}
