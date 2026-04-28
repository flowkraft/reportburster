import type { WidgetDisplayConfig } from "@/lib/stores/canvas-store";

/**
 * Pivot-specific UI ↔ DSL mapping.
 *
 * UI keys:    pivotRows, pivotCols, pivotVals, pivotAggregator, pivotSortOrder
 * DSL keys:   rows, cols, vals, aggregatorName, rendererName, rowOrder, colOrder,
 *             sorters, derivedAttributes, valueFilter, tableName, hiddenAttributes,
 *             hiddenFromAggregators, ...
 *
 * Round-trip fidelity:
 *   _pivotDslOptions stores the full parsed options object from the last DSL parse.
 *   uiToPivotDsl merges UI field overrides on top of _pivotDslOptions so that
 *   extra DSL properties the user wrote (rendererName, rowOrder, tableName, etc.)
 *   survive any UI-driven re-serialize cycle without being stripped.
 *
 * Export:
 *   useDslSync stores the serialized DSL text in displayConfig.customDsl after
 *   every successful serialize/parse. DashboardFileGenerator (server-side) reads
 *   customDsl from the auto-saved SQLite state, so the user's full pivot DSL
 *   (including extras) is always exported correctly.
 */

export type PivotDslOptions = {
  rows?: string[];
  cols?: string[];
  vals?: string[];
  aggregatorName?: string;
  // Pass-through for anything else the parser captured (rendererName, sorters,
  // rowOrder, colOrder, tableName, hiddenAttributes, hiddenFromAggregators, etc.)
  [k: string]: unknown;
};

/**
 * UI displayConfig → DSL options map for /api/dsl/pivot/serialize.
 *
 * Starts from _pivotDslOptions (preserves all user-written DSL extras like
 * rendererName, rowOrder, tableName, hiddenAttributes, etc.) and then overrides
 * with the current UI-owned fields (pivotRows, pivotCols, pivotVals, pivotAggregator).
 */
export function uiToPivotDsl(dc: WidgetDisplayConfig): PivotDslOptions {
  // Start from stored DSL extras — this preserves rendererName, rowOrder,
  // tableName, hiddenAttributes, hiddenFromAggregators, etc.
  const extras = (dc._pivotDslOptions ?? {}) as PivotDslOptions;
  const opts: PivotDslOptions = { ...extras };

  // UI-owned fields override stored extras
  const rows = dc.pivotRows as string[] | undefined;
  if (Array.isArray(rows) && rows.length > 0) opts.rows = rows;
  else delete opts.rows;

  const cols = dc.pivotCols as string[] | undefined;
  if (Array.isArray(cols) && cols.length > 0) opts.cols = cols;
  else delete opts.cols;

  const vals = dc.pivotVals as string[] | undefined;
  if (Array.isArray(vals) && vals.length > 0) opts.vals = vals;
  else delete opts.vals;

  const agg = dc.pivotAggregator as string | undefined;
  if (agg) opts.aggregatorName = agg;
  else delete opts.aggregatorName;

  // pivotSortOrder → rowOrder / colOrder
  // pivotSortOrder is per-field; rowOrder/colOrder are global per-axis.
  // We derive a single direction from the first sorted field in each axis.
  const sortOrder = (dc.pivotSortOrder ?? {}) as Record<string, string>;
  const rowSorts = (Array.isArray(rows) ? rows : []).map((f) => sortOrder[f]).filter(Boolean);
  if (rowSorts.length > 0) {
    opts.rowOrder = rowSorts[0] === "descending" ? "key_z_to_a" : "key_a_to_z";
  } else {
    delete opts.rowOrder;
  }
  const colSorts = (Array.isArray(cols) ? cols : []).map((f) => sortOrder[f]).filter(Boolean);
  if (colSorts.length > 0) {
    opts.colOrder = colSorts[0] === "descending" ? "key_z_to_a" : "key_a_to_z";
  } else {
    delete opts.colOrder;
  }

  return opts;
}

/**
 * Parsed DSL options → UI displayConfig.
 *
 * Stores ALL parsed options (including extras) in _pivotDslOptions so that
 * uiToPivotDsl can include them in future serialize cycles without losing
 * user-written DSL properties.
 */
export function pivotDslToUi(
  opts: PivotDslOptions,
  dc: WidgetDisplayConfig,
): WidgetDisplayConfig {
  const next: WidgetDisplayConfig = { ...dc };

  // Preserve ALL parsed options (including extras) for round-trip fidelity.
  next._pivotDslOptions = opts;

  if ("rows" in opts) next.pivotRows = Array.isArray(opts.rows) ? opts.rows : [];
  if ("cols" in opts) next.pivotCols = Array.isArray(opts.cols) ? opts.cols : [];
  if ("vals" in opts) next.pivotVals = Array.isArray(opts.vals) ? opts.vals : [];
  if ("aggregatorName" in opts && typeof opts.aggregatorName === "string") {
    next.pivotAggregator = opts.aggregatorName;
  }

  // rowOrder / colOrder → pivotSortOrder (per-field)
  const pivotRows = Array.isArray(opts.rows) ? (opts.rows as string[]) : [];
  const pivotCols = Array.isArray(opts.cols) ? (opts.cols as string[]) : [];
  const nextSortOrder: Record<string, string> = { ...(next.pivotSortOrder as Record<string, string> ?? {}) };
  if (typeof opts.rowOrder === "string") {
    const dir = opts.rowOrder.includes("z_to_a") ? "descending" : "ascending";
    for (const f of pivotRows) nextSortOrder[f] = dir;
  } else {
    for (const f of pivotRows) delete nextSortOrder[f];
  }
  if (typeof opts.colOrder === "string") {
    const dir = opts.colOrder.includes("z_to_a") ? "descending" : "ascending";
    for (const f of pivotCols) nextSortOrder[f] = dir;
  } else {
    for (const f of pivotCols) delete nextSortOrder[f];
  }
  if (Object.keys(nextSortOrder).length > 0) next.pivotSortOrder = nextSortOrder;
  else delete (next as Record<string, unknown>).pivotSortOrder;

  return next;
}
