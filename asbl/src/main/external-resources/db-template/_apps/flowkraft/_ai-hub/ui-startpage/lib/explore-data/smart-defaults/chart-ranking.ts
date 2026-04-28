// Chart-subtype ranking — given the column shape, returns a best-first
// ordered list of subtype ids (bar/line/…).
//
// Paired with `isSensibleChartSubtype()`: sensibility is a hard *filter* (can
// this viz render meaningfully?), ranking is the *soft ordering* inside the
// sensible set. ChartConfig uses both: sort by (sensible desc, rank asc).
//
// ── Rank logic ──────────────────────────────────────────────────────────────
// Four base shape branches drive the order:
//   - 0 dims + 2+ measures  → scatter/bubble lead (nothing to bar against)
//   - temporal truncation   → line leads (truncated time = timeline)
//   - all dims extraction   → bar leads (day-of-week is categorical)
//   - non-temporal dims     → bar/row/pie, tuned by primary-dim cardinality
//
// Cardinality-driven refinements:
//   - high-card primary dim → demote pie/doughnut (50 slices is unreadable;
//     this also parallels `enforceChartTypeLimits` which forces >5 slices → bar)
//   - low-card primary dim (≤5) → promote pie/doughnut/funnel (where they shine)
//
// With 2+ dims + 1 measure, boxplot is lifted near the front since grouped
// bar/row are the obvious picks there.

import type { ColumnSchema } from "../types";
import { isTemporalLike } from "./classification";

export interface ChartRankingHints {
  /** Distinct-value count per dim name. When available, drives the pie/doughnut
   *  high-card demotion and low-card promotion. (RB-extension) */
  cardinality?: Record<string, number>;
  /** Set of dim names that are *temporal extractions* (day-of-week / month-of-year
   *  / hour-of-day / quarter-of-year) — ranked as categorical, not as a timeline.
   *  (RB-extension) */
  extractions?: Set<string>;
}

// Canonical ordering — also the fallback when a shape doesn't map to one of
// the explicit branches below. Matches the order users see in ChartConfig.
const CANONICAL = [
  "bar", "row", "line", "area", "combo",
  "scatter", "bubble",
  "pie", "doughnut",
  "boxplot", "waterfall", "funnel",
];

export function rankChartSubtypes(
  dims: ColumnSchema[],
  measures: ColumnSchema[],
  hints: ChartRankingHints = {},
): string[] {
  const cardinality = hints.cardinality ?? {};
  const extractions = hints.extractions ?? new Set<string>();

  const primaryDim = dims[0];
  const card = primaryDim ? cardinality[primaryDim.columnName] : undefined;
  const lowCard  = card != null && card <= 5;
  const highCard = card != null && card > 20;

  const hasTemporalTrunc = dims.some(
    (d) => isTemporalLike(d) && !extractions.has(d.columnName),
  );
  const allDimsAreExtractions =
    dims.length > 0 && dims.every((d) => extractions.has(d.columnName));

  let ranked: string[];

  // ── 0 dims + 2+ measures ───────────────────────────────────────────────
  if (dims.length === 0 && measures.length >= 2) {
    ranked = ["scatter", "bubble", "line", "bar"];
  }

  // ── Temporal truncation dim present ────────────────────────────────────
  // Line leads because truncated time series = timeline.
  else if (hasTemporalTrunc) {
    ranked = ["line", "area", "bar", "combo", "row", "waterfall", "scatter", "pie", "doughnut", "funnel"];
  }

  // ── All dims are temporal extractions (day-of-week, hour-of-day, etc.) ─
  // Extractions produce discrete categories, so line is wrong; bar/row dominate.
  else if (allDimsAreExtractions) {
    ranked = ["bar", "row", "pie", "doughnut", "waterfall", "combo", "area", "line", "scatter", "funnel"];
  }

  // ── Non-temporal dim(s) ─────────────────────────────────────────────────
  else if (dims.length >= 1) {
    if (highCard) {
      // High-cardinality kills pie/doughnut readability — demote them.
      ranked = ["bar", "row", "line", "area", "combo", "waterfall", "scatter", "doughnut", "pie", "funnel"];
    } else if (lowCard) {
      // Few categories are where pie/doughnut/funnel shine.
      ranked = ["bar", "pie", "doughnut", "row", "funnel", "waterfall", "line", "area", "combo", "scatter"];
    } else {
      // Medium-cardinality non-temporal dim — bar leads, pie stays near top.
      ranked = ["bar", "row", "pie", "line", "area", "combo", "waterfall", "scatter", "doughnut", "funnel"];
    }
  }

  // ── Empty/unknown shape ────────────────────────────────────────────────
  else {
    ranked = [...CANONICAL];
  }

  // With ≥2 dims and a measure, boxplot is a canonical pick — lift it near
  // the front of whichever base ranking we ended up with.
  if (dims.length >= 2 && measures.length >= 1) {
    ranked = ranked.filter((t) => t !== "boxplot");
    const insertAt = Math.min(2, ranked.length);
    ranked.splice(insertAt, 0, "boxplot");
  }

  // Append any canonical subtype we didn't explicitly rank, in canonical order.
  for (const ct of CANONICAL) {
    if (!ranked.includes(ct)) ranked.push(ct);
  }

  return ranked;
}
