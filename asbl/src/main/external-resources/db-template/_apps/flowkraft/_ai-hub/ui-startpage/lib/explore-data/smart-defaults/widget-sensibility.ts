// Widget sensibility & recommendation.
//
// Each visualization declares an `isSensible(data)` predicate; a rule-cascade
// recommender picks which predicates to privilege based on the data shape.
//
// Three buckets:
//   - recommended: top picks for this data shape (highlighted in palette)
//   - sensible:    fit the data, shown in main grid
//   - nonsensible: fit poorly, hidden under "More widgets" collapsible
//
// All predicates dispatch to existing pickers — no new classification logic.

import type { ColumnSchema, TableSchema } from "../types";
import type { WidgetType } from "@/lib/stores/canvas-store";
import {
  isLatitude,
  isLongitude,
  isState,
  isCountry,
  TEMPORAL_TYPES,
  normalizeType,
  type CardinalityMap,
} from "./classification";
import { splitDimsAndMeasures } from "./axis-assignment";
import { autoPickMeasure } from "./auto-pick";
import {
  pickSankeyFields,
  pickGaugeField,
  pickTrendFields,
  pickProgressField,
} from "./row2-auto-pick";
import { pickWidget, shapeFromColumns, type PickShape } from "./widget-picker";

export type WidgetSensibility = "recommended" | "sensible" | "nonsensible";

export interface SensibilityHints {
  cardinality?: CardinalityMap;
  tableSchema?: TableSchema | null;
  /** Row count when known (post-aggregation result size). Drives 1-row gates
   *  for Number/Gauge/Progress and the "≥2 rows" gate for Chart/Pivot/Sankey. */
  rowCount?: number;
  /** Whether the user has applied any summarize / group-by step. When false we
   *  treat the data as a raw table drop and bias recommendations toward
   *  Table/Detail (+Map if geo) — the "no aggregation" branch. Chart / Trend /
   *  Pivot are skipped because charting unaggregated rows is typically noise. */
  isAggregated?: boolean;
}

export interface SensibilityGroups {
  recommended: WidgetType[];
  sensible: WidgetType[];
  nonsensible: WidgetType[];
}

// All data-renderable widget types in the order they appear in the palette.
export const ALL_WIDGETS: WidgetType[] = [
  "tabulator", "chart", "number", "pivot", "trend",
  "gauge", "progress", "detail", "map", "sankey",
];

function isTemporal(col: ColumnSchema): boolean {
  return TEMPORAL_TYPES.has(normalizeType(col.typeName));
}

function hasGeo(cols: ColumnSchema[]): boolean {
  if (cols.some(isLatitude) && cols.some(isLongitude)) return true;
  return cols.some(isState) || cols.some(isCountry);
}

/**
 * Per-widget sensibility predicate. Returns true if `type` makes sense for
 * the given column shape. Reuses existing pickers; gates on row count where
 * the widget naturally needs single-row vs multi-row data.
 */
export function isSensibleWidget(
  type: WidgetType,
  cols: ColumnSchema[],
  hints: SensibilityHints = {},
): boolean {
  // Pre-data state — caller decides; treat as "not sensible" so the palette
  // can show neutral all-enabled UI without us claiming false positives.
  if (cols.length === 0) return false;

  const table = hints.tableSchema ?? undefined;
  const rowCount = hints.rowCount ?? Infinity;
  const { dims: rawDims, measures: rawMeasures } = splitDimsAndMeasures(cols);
  // When cardinality is available, use shapeFromColumns for dim/measure counts so
  // numeric 0/1 columns (TINYINT/DuckDB, TINYINT(1)/MySQL, NUMBER(1)/Oracle,
  // INTEGER/SQLite, UInt8/ClickHouse) are counted as dims, not measures.
  // splitDimsAndMeasures is type-only and cannot make this distinction.
  const cardShape = hints.cardinality
    ? shapeFromColumns(cols, hints.tableSchema, hints.cardinality)
    : null;
  const dimCount = cardShape ? cardShape.dims.length : rawDims.length;
  const measureCount = cardShape ? cardShape.measures.length : rawMeasures.length;

  switch (type) {
    case "tabulator":
      // Always sensible if any column exists.
      return true;

    case "detail":
      // Per-row reader. Sensible whenever there are rows + cols.
      return rowCount >= 1;

    case "number":
      // Needs at least one measure; usually a single-row aggregate
      // (we still allow N-row results — Number shows the first row's value).
      return autoPickMeasure(cols, table) !== null;

    case "gauge":
      // Single numeric value — measure required, single-row preferred.
      return rowCount === 1 && pickGaugeField(cols, table).field !== undefined;

    case "progress":
      // Single numeric value with implicit goal — same shape as gauge.
      return rowCount === 1 && pickProgressField(cols, table).field !== undefined;

    case "trend": {
      // Temporal dim + measure + ≥2 rows for a meaningful line.
      // Raw (unaggregated) data: delta-vs-previous-row is meaningless.
      if (hints.isAggregated === false) return false;
      const t = pickTrendFields(cols, table);
      return rowCount >= 2 && t.dateField !== undefined && t.valueField !== undefined;
    }

    case "chart":
      // Standard cartesian: ≥1 dim + ≥1 measure + ≥2 rows.
      // Raw (unaggregated) data: charting individual rows is typically noise.
      if (hints.isAggregated === false) return false;
      return rowCount >= 2 && dimCount >= 1 && measureCount >= 1;

    case "pivot":
      // Crosstab: ≥1 dim + ≥2 rows. Matches the reference isSensible gate
      // (cols.length ≥ 2, all breakouts/aggregations). 1-dim + 1-measure is
      // a valid cross-tab (rows = dim values, cells = measure values).
      if (hints.isAggregated === false) return false;
      return rowCount >= 2 && dimCount >= 1;

    case "sankey": {
      // Source dim + target dim (low-card) + value measure + ≥2 rows.
      const s = pickSankeyFields(cols, {
        cardinality: hints.cardinality,
        tableSchema: hints.tableSchema,
      });
      return (
        rowCount >= 2 &&
        s.sourceField !== undefined &&
        s.targetField !== undefined &&
        s.valueField !== undefined
      );
    }

    case "map":
      // Either lat/lon pair or state/country column.
      return hasGeo(cols);

    // Non-data widget types — never appear in the palette switcher.
    case "text":
    case "divider":
    case "iframe":
    case "filter-pane":
      return false;
  }
}

/**
 * Shape-reading palette grouping — the authoritative entry point.
 *
 * Takes a PRE-COMPUTED `PickShape` (from `widget.shape`, written by
 * `canvas-store.setWidgetQueryResult` / `setWidgetColumnsFromSchema`) plus
 * the widget's `columns` and hints.  Does NOT rebuild the shape locally,
 * so every palette call and the post-query auto-switch share the same
 * classified view.  This closes the drift class where `shapeFromColumns`
 * was called independently at each consumer with potentially different
 * `cols` inputs.
 *
 * `cols` is still required because `isSensibleWidget` runs per-widget
 * fit checks (`pickSankeyFields`, `autoPickMeasure`, etc.) that need the
 * full ColumnSchema metadata, not just the classified dim/measure names.
 */
export function groupWidgetsByShape(
  shape: PickShape,
  cols: ColumnSchema[],
  hints: SensibilityHints = {},
): SensibilityGroups {
  if (cols.length === 0) {
    return { recommended: [], sensible: [...ALL_WIDGETS], nonsensible: [] };
  }
  const pick = pickWidget(shape, {
    rowCount: hints.rowCount,
    isAggregated: hints.isAggregated,
    tableSchema: hints.tableSchema,
    cardinality: hints.cardinality,
  });
  const recommended = pick.ranked.filter((t) => isSensibleWidget(t, cols, hints));
  const recSet = new Set(recommended);
  const sensible: WidgetType[] = [];
  const nonsensible: WidgetType[] = [];
  for (const t of ALL_WIDGETS) {
    if (recSet.has(t)) continue;
    if (isSensibleWidget(t, cols, hints)) sensible.push(t);
    else nonsensible.push(t);
  }
  return { recommended, sensible, nonsensible };
}

/**
 * Cols-only variant — callers without a precomputed shape (legacy / tests)
 * fall through here, which rebuilds the shape once via `shapeFromColumns`.
 * Prefer `groupWidgetsByShape` when a `widget.shape` is already in hand.
 */
export function groupWidgetsBySensibility(
  cols: ColumnSchema[],
  hints: SensibilityHints = {},
): SensibilityGroups {
  if (cols.length === 0) {
    return { recommended: [], sensible: [...ALL_WIDGETS], nonsensible: [] };
  }
  const shape = shapeFromColumns(cols, hints.tableSchema, hints.cardinality);
  return groupWidgetsByShape(shape, cols, hints);
}
