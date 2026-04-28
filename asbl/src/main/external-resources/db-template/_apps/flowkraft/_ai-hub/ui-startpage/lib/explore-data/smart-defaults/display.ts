// Shape → display decision.
//
// Thin adapter over `pickWidget` (smart-defaults/widget-picker.ts) — the
// single source of truth shared with the palette. Given a SummarizeShape +
// optional table context, returns a DisplayDecision describing what to
// render (widget type + chart sub-type + config).
//
// The palette's `groupWidgetsByShape` and this function both call
// `pickWidget`, so the palette and the post-render default decision cannot
// diverge. Historically these were two independent cascades that drifted.

import type { ColumnSchema, TableSchema } from "../types";
import type { TimeBucket, WidgetType } from "@/lib/stores/canvas-store";
import {
  type ColumnKind,
  type CardinalityMap,
  classifyColumn,
  isState,
  isCountry,
  isCoordinate,
  isTemporalByName,
} from "./classification";
import { isTemporalExtraction } from "./buckets";
import { pickWidget } from "./widget-picker";

// ─────────────────────────────────────────────────────────────────────────────
// Shape types
// ─────────────────────────────────────────────────────────────────────────────

export interface SummarizeShape {
  dims: {
    name: string;
    kind: ColumnKind;
    /** Optional semantic hints populated by `shapeFromResult` when it can
     *  match the result column to a schema column. Drives map branches. */
    isState?: boolean;
    isCountry?: boolean;
    isCoordinate?: boolean;
    /** True when the dim was produced by a temporal extraction bucket
     *  (day-of-week / hour-of-day / month-of-year / quarter-of-year). */
    isExtraction?: boolean;
  }[];
  measures: { name: string; kind: ColumnKind }[];
}

// ─────────────────────────────────────────────────────────────────────────────
// DisplayDecision — the shape → render decision produced by `defaultDisplay`.
// ─────────────────────────────────────────────────────────────────────────────

export interface DisplayDecision {
  /** The best widget type for this shape. When this differs from the host
   *  widget's current type, the host auto-swaps (no banner, no user click). */
  widgetType: WidgetType;
  /** For widgetType === "chart" only. */
  chartType?: "bar" | "line" | "pie" | "doughnut" | "scatter";
  /** Extra viz settings that travel with the decision — grouped bar, series
   *  stacking, map region/type. Read by the host widget on swap.
   *  For widgetType === "map", carries { mapType, region } so the Map widget
   *  starts with the right mode / region. */
  displayConfig?: Record<string, unknown>;
  reason: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// defaultDisplay — the shape → widget-type cascade
// ─────────────────────────────────────────────────────────────────────────────

export function defaultDisplay(
  shape: SummarizeShape,
  _ctx?: { table?: TableSchema; currentWidgetType?: WidgetType },
): DisplayDecision {
  // Delegates to the unified classifier. `pickWidget.best` is guaranteed to
  // match the palette's first recommendation for the same shape.
  const pick = pickWidget(shape);
  return {
    widgetType: pick.best,
    chartType: pick.chartSubtype,
    displayConfig: pick.displayConfig,
    reason: pick.reason,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Chart-type limits — enforce pie slice caps + boolean-pie invariants.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Pie/doughnut slice cap: >5 slices is unreadable — downgrade to bar.
 * (User can manually pick pie via the Display tab if they really want it.)
 *
 * `dimKind` is accepted for call-site compat but unused now that boolean
 * dims route to bar by default rather than pie.
 */
export function enforceChartTypeLimits(
  chartType: string,
  sliceCount: number,
  _dimKind?: ColumnKind,
): string {
  const isPieLike = chartType === "pie" || chartType === "doughnut";
  if (!isPieLike) return chartType;
  if (sliceCount > 5) return "bar";
  return chartType;
}

// ─────────────────────────────────────────────────────────────────────────────
// Result-to-shape extraction
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build a SummarizeShape from result columns + visual query metadata.
 *
 * Column kind + semantic hints (isState / isCountry / isCoordinate) are
 * resolved via a 3-step lookup so that SQL/script results benefit from the
 * same type intelligence as visual-query results:
 *
 *   Step 1 — direct match in the selected table schema or result column metadata.
 *   Step 2 — cross-reference across ALL tables in the active connection schema
 *             (`connectionSchemas`). This is the "educated guess": result column
 *             names often come straight from source table columns (e.g. SELECT
 *             ShipCountry FROM Orders), so an exact case-insensitive match gives
 *             us the real DB type and geo hints without parsing any SQL or Groovy.
 *   Step 3 — common-sense name-based fallbacks for computed aliases that exist
 *             nowhere in the schema (e.g. order_month from strftime). Covers
 *             temporal patterns, geographic names, and coordinate column names.
 *
 * `connectionSchemas` is populated by useWidgetData from a module-level cache
 * (one /schema fetch per connectionId per session) — no extra HTTP cost.
 */
export function shapeFromResult(
  resultColumns: string[],
  groupByColumns: string[],
  groupByBuckets: Record<string, TimeBucket> | undefined,
  aggregatedColumns: string[],
  table: TableSchema | null,
  cardinality?: CardinalityMap,
  resultColumnSchemas?: ColumnSchema[],
  // All tables from the active connection (already loaded by SchemaBrowser).
  // Enables Step 2 cross-reference for SQL/script results — see JSDoc above.
  connectionSchemas?: TableSchema[],
): SummarizeShape {
  const dims: SummarizeShape["dims"] = [];
  const measures: SummarizeShape["measures"] = [];

  for (const col of resultColumns) {
    const isGroupBy = groupByColumns.includes(col);
    const isAgg = aggregatedColumns.includes(col)
      || col === "count"
      || col.endsWith("_count")
      || col.endsWith("_sum")
      || col.endsWith("_avg");
    if (isGroupBy) {
      const bucket = groupByBuckets?.[col];

      if (bucket && isTemporalExtraction(bucket)) {
        // Extraction produces discrete categories — classify as category-low
        // so defaultDisplay picks bar instead of line.
        dims.push({
          name: col,
          kind: "category-low",
          isExtraction: true,
        });
        continue;
      }

      // ── Step 1: direct match in the selected table or result column metadata.
      // Covers visual-query mode and callers that already resolved the schema.
      const directSchemaMatch: ColumnSchema | undefined =
        table?.columns.find((c) => c.columnName === col)
        ?? resultColumnSchemas?.find((c) => c.columnName === col);

      // ── Step 2: cross-reference all connection tables when Step 1 found nothing.
      // SQL/script modes have table=null, but result columns often share names with
      // source table columns (ShipCountry, CustomerID, etc.).  A case-insensitive
      // exact match lets us reuse the schema's type info and geo semantic hints
      // without any SQL parsing.  In 2 years: this replaced the old path where
      // SQL results always fell through to name-only patterns, losing isCountry /
      // isState hints that the schema already knew about.
      let crossReferenceMatch: { column: ColumnSchema; owningTable: TableSchema } | undefined;
      if (!directSchemaMatch && connectionSchemas) {
        for (const candidateTable of connectionSchemas) {
          const matchedColumn = candidateTable.columns.find(
            (c) => c.columnName.toLowerCase() === col.toLowerCase(),
          );
          if (matchedColumn) {
            crossReferenceMatch = { column: matchedColumn, owningTable: candidateTable };
            break;
          }
        }
      }

      // ── Resolve best schema info available.
      const resolvedColumn = directSchemaMatch ?? crossReferenceMatch?.column;
      const resolvedTable  = table ?? crossReferenceMatch?.owningTable ?? undefined;

      if (bucket) {
        // Truncation bucket — ALWAYS temporal regardless of column type.
        dims.push({
          name: col,
          kind: "temporal",
          isState:      resolvedColumn ? isState(resolvedColumn)      : false,
          isCountry:    resolvedColumn ? isCountry(resolvedColumn)     : false,
          isCoordinate: resolvedColumn ? isCoordinate(resolvedColumn)  : false,
        });
        continue;
      }

      if (resolvedColumn) {
        // Schema match found (Step 1 or 2) — use authoritative type + hints.
        dims.push({
          name: col,
          kind:         classifyColumn(resolvedColumn, resolvedTable, cardinality),
          isState:      isState(resolvedColumn),
          isCountry:    isCountry(resolvedColumn),
          isCoordinate: isCoordinate(resolvedColumn),
        });
        continue;
      }

      // ── Step 3: no schema match anywhere — apply common-sense name-based
      // fallbacks.  These cover the most frequent computed SQL aliases.
      //
      // Temporal: order_month, created_year, week_start, report_date …
      //   → shared with chart-ranking.ts via `isTemporalByName` (classification.ts).
      // Geographic: ship_country, customer_state, delivery_city → map widget
      // Coordinates: lat / lon / latitude / longitude → map scatter
      // Everything else defaults to low-cardinality category (safest fallback).
      const nameIsTemporal    = isTemporalByName(col);
      // \b prevents false positives like "estate", "statement", "interstate"
      const nameIsState       = /\bstate\b|\bprovince\b|\bprefecture\b/i.test(col);
      const nameIsCountry     = /\bcountry\b|\bnation\b|\bcountries\b/i.test(col);
      const nameIsCoordinate  = /^lat(itude)?$|^lon(gitude)?$|^lng$/i.test(col);
      // City / region / zip don't map to isState/isCountry but still warrant
      // category-low — the default — so no special branch needed.

      const inferredKind: ColumnKind = nameIsTemporal ? "temporal" : "category-low";

      dims.push({
        name: col,
        kind:         inferredKind,
        isState:      nameIsState,
        isCountry:    nameIsCountry,
        isCoordinate: nameIsCoordinate,
      });
    } else if (isAgg) {
      measures.push({ name: col, kind: "measure" });
    }
  }

  return { dims, measures };
}

// Silence unused-import warning for ColumnSchema — kept in type surface for callers.
export type { ColumnSchema };
