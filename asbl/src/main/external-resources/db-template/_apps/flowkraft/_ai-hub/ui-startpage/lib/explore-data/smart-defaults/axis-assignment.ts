// Default X / Y / series-split axis assignment — given result column schemas
// and chart type, decide which columns populate `xFields` + `yFields`.
//
// Cascade:
//   1. partition into dims vs measures (via getFieldKind)
//   2. cap dims at 2 (position 0 = X, position 1 = series-split)
//   3. if 2 dims, date-first reorder (dates belong on X as timelines)
//   4. else cardinality-first reorder (lower-card on X → fewer series)
//   5. if dims[1] cardinality > MAX_SERIES, drop dims[1]
//
// Scatter (two measures, no dim) and bubble (two measures + third measure
// for size) are branched explicitly before the cascade runs.

import type { ColumnSchema } from "../types";
import { getFieldKind } from "../field-utils";
import { TEMPORAL_TYPES, normalizeType, isIdColumn } from "./classification";
import type { CardinalityMap } from "./classification";

/** Series-cardinality cap. Series-split dim with more than this many distinct
 *  values is dropped rather than rendered (100 series is already unreadable). */
export const MAX_SERIES = 100;

export interface AxisAssignmentHints {
  /** Distinct-value counts per column name. Drives cardinality-first
   *  reorder + the MAX_SERIES cap. When absent, reorder falls back to
   *  "leave them as-is" and the cap is not enforced. */
  cardinality?: CardinalityMap;
}

export interface AxisAssignment {
  xFields: string[];
  yFields: string[];
  /** Only set for bubble — 3rd-axis size field. */
  bubbleSizeField?: string;
}

function isTemporal(col: ColumnSchema): boolean {
  return TEMPORAL_TYPES.has(normalizeType(col.typeName));
}

/**
 * Pick the default (xFields, yFields) for a chart given the available
 * dims / measures and the chart type. Never returns an empty xFields for
 * viz that need an X (bar/line/etc.) — falls back to the first available
 * column of any kind so the widget can still render a placeholder.
 */
export function pickDefaultAxes(
  dims: ColumnSchema[],
  measures: ColumnSchema[],
  chartType: string,
  hints: AxisAssignmentHints = {},
): AxisAssignment {
  const cardinality = hints.cardinality ?? {};

  // ── Scatter — X and Y are both measures, no breakout ────────────────────
  if (chartType === "scatter") {
    if (measures.length >= 2) {
      return { xFields: [measures[0].columnName], yFields: [measures[1].columnName] };
    }
    // Degenerate: only 1 measure. Keep X empty; widget will nag the user.
    return { xFields: [], yFields: measures.map((m) => m.columnName) };
  }

  // ── Bubble — X, Y both measures; optional 3rd measure for radius ────────
  if (chartType === "bubble") {
    if (measures.length >= 2) {
      return {
        xFields: [measures[0].columnName],
        yFields: [measures[1].columnName],
        bubbleSizeField: measures[2]?.columnName,
      };
    }
    return { xFields: [], yFields: measures.map((m) => m.columnName) };
  }

  // ── Normal charts (bar/row/line/area/combo/pie/doughnut/waterfall/funnel) ──
  let xCandidates = dims.slice(0, 2);

  // Rule 3 — date-first: if the second dim is temporal and the first isn't,
  // swap. Dates belong on X as timelines.
  if (xCandidates.length === 2) {
    const d0 = xCandidates[0];
    const d1 = xCandidates[1];
    if (!isTemporal(d0) && isTemporal(d1)) {
      xCandidates = [d1, d0];
    } else if (!isTemporal(d0) && !isTemporal(d1)) {
      // Rule 4 — cardinality-first: lower-card dim goes to X so the
      // higher-card one becomes series-split (fewer series = more readable).
      const c0 = cardinality[d0.columnName];
      const c1 = cardinality[d1.columnName];
      if (typeof c0 === "number" && typeof c1 === "number" && c0 > c1) {
        xCandidates = [d1, d0];
      }
    }
  }

  // Rule 5 — MAX_SERIES safety cap: drop series-split dim if it has too
  // many distinct values.
  if (xCandidates.length === 2) {
    const splitCard = cardinality[xCandidates[1].columnName];
    if (typeof splitCard === "number" && splitCard > MAX_SERIES) {
      xCandidates = [xCandidates[0]];
    }
  }

  const xFields = xCandidates.map((c) => c.columnName);
  // Y = all measures in their canonical order (we don't cap the metric count).
  const yFields = measures.map((m) => m.columnName);

  return { xFields, yFields };
}

/**
 * Return true iff the previously-set fields are all still present in the
 * current schema. When true, keep the user's picks; when false, re-auto-pick.
 */
export function canReuseAxisPicks(
  previous: string[] | undefined,
  currentColumns: ColumnSchema[],
): boolean {
  if (!previous || previous.length === 0) return false;
  const names = new Set(currentColumns.map((c) => c.columnName));
  return previous.every((p) => names.has(p));
}

/** Convenience: compute dims + measures from the full column list. Mirrors
 *  the `getFieldKind` split used elsewhere in the codebase.
 *
 *  Numeric columns whose names match the id-by-convention regex (snake_case
 *  `*_id`, `*_code`, `*_key`) are excluded from measures — they look like
 *  IDs and charting them as Y-axis values is rarely meaningful. PK/FK
 *  columns are excluded from auto-selected metrics. */
export function splitDimsAndMeasures(columns: ColumnSchema[]): {
  dims: ColumnSchema[];
  measures: ColumnSchema[];
} {
  const dims = columns.filter((c) => getFieldKind(c) === "dimension");
  const measures = columns.filter(
    (c) => getFieldKind(c) === "measure" && !isIdColumn(c.columnName),
  );
  return { dims, measures };
}
