// Per-chart-subtype sensibility predicates — column-shape based.
//
// Runs against the currently-available columns (not the row data, which we
// don't have at config time). Used by ChartConfig to sort/dim the subtype
// picker so the user sees viable picks first — nonsensible choices stay
// clickable though, with a tooltip explaining the caveat. Discovery beats
// enforcement when the heuristic might be wrong.
//
// Each predicate takes the dimensions and measures already filtered by
// `getFieldKind()` and returns either `{ sensible: true }` or
// `{ sensible: false, reason }` with a short explanation suitable for a
// tooltip / aria-label.

import type { ColumnSchema } from "../types";

export interface ChartSensibility {
  sensible: boolean;
  reason?: string;
}

export function isSensibleChartSubtype(
  chartType: string,
  dims: ColumnSchema[],
  measures: ColumnSchema[],
  rowCount?: number,
): ChartSensibility {
  switch (chartType) {
    // Standard category-vs-measure shapes: bar, row (horizontal bar), line,
    // area (stacked filled line), combo (bar+line mix), pie/doughnut, funnel.
    // All share the same minimum: ≥1 dim + ≥1 measure + >1 row.
    case "bar":
    case "row":
    case "line":
    case "area":
    case "combo":
    case "pie":
    case "doughnut":
    case "funnel":
      if (rowCount !== undefined && rowCount <= 1)
        return { sensible: false, reason: "Needs more than 1 row to draw a meaningful chart" };
      if (dims.length < 1) return { sensible: false, reason: "Needs at least 1 dimension" };
      if (measures.length < 1) return { sensible: false, reason: "Needs at least 1 measure" };
      return { sensible: true };

    // Scatter — two measures (X = first, Y = second), plus >1 row.
    case "scatter":
      if (rowCount !== undefined && rowCount <= 1)
        return { sensible: false, reason: "Needs more than 1 row" };
      if (measures.length < 2) return { sensible: false, reason: "Needs at least 2 measures (X and Y)" };
      return { sensible: true };

    // Bubble — scatter with a 3rd measure controlling bubble radius.
    // Requires ≥3 measures (X, Y, size). With only 2 it degenerates into a
    // uniform-size scatter with no size information — functionally a scatter
    // chart, not a bubble chart. All three series must be set.
    case "bubble":
      if (rowCount !== undefined && rowCount <= 1)
        return { sensible: false, reason: "Needs more than 1 row" };
      if (measures.length < 3) return { sensible: false, reason: "Needs 3 measures: X axis, Y axis, and bubble size" };
      return { sensible: true };

    // Box plot — needs ≥2 dims (cat × cat for grouping) + ≥1 measure.
    // Also: query should be un-aggregated (we can't detect that from columns
    // alone, so we leave that warning to ChartConfig's existing banner).
    case "boxplot":
      if (dims.length < 2) return { sensible: false, reason: "Needs at least 2 dimensions for grouping" };
      if (measures.length < 1) return { sensible: false, reason: "Needs at least 1 measure" };
      return { sensible: true };

    // Waterfall — exactly 1 dim (the steps) + ≥1 measure (the deltas) + >1 row.
    case "waterfall":
      if (rowCount !== undefined && rowCount <= 1)
        return { sensible: false, reason: "Needs more than 1 row" };
      if (dims.length !== 1) return { sensible: false, reason: "Needs exactly 1 dimension (the steps)" };
      if (measures.length < 1) return { sensible: false, reason: "Needs at least 1 measure (the deltas)" };
      return { sensible: true };

    // Unknown subtype — assume sensible so we don't accidentally hide things.
    default:
      return { sensible: true };
  }
}
