// Unified widget picker — the single source of truth for "which widget type
// fits this data shape?" across explore-data.
//
// Two callers use this module:
//   - `groupWidgetsByShape` / `groupWidgetsBySensibility` in widget-sensibility.ts
//     → returns `pickWidget(...).ranked` for the palette's "recommended" bucket.
//   - `defaultDisplay` in display.ts → returns `{ widgetType: pickWidget(...).best,
//     chartType, displayConfig, reason }` for the widget's initial render config.
//
// Because both callers go through the same cascade, the palette and the
// post-render default decision can never diverge. That symmetry is the point:
// historically these were two independent trees that drifted and ended up
// producing contradictory recommendations for the same shape.
//
// Post-2026-04 refactor: widget.shape (on the widget record) is the cached
// output of shapeFromResult / shapeFromColumns. `groupWidgetsByShape` reads
// it directly, so the palette never reconstructs a shape locally.

import type { WidgetType } from "@/lib/stores/canvas-store";
import type { ColumnSchema, TableSchema } from "../types";
import {
  classifyColumn,
  isState,
  isCountry,
  isCoordinate,
  isIdColumn,
  type ColumnKind,
  type CardinalityMap,
} from "./classification";
import { getFieldKind } from "../field-utils";

// ─────────────────────────────────────────────────────────────────────────────
// Input — classified shape + hints.
// ─────────────────────────────────────────────────────────────────────────────

export interface PickShape {
  dims: {
    name: string;
    kind: ColumnKind;
    isState?: boolean;
    isCountry?: boolean;
    isCoordinate?: boolean;
    /** True when produced by a temporal-extraction bucket
     *  (day-of-week / hour-of-day / month-of-year / quarter-of-year). */
    isExtraction?: boolean;
  }[];
  measures: { name: string; kind: ColumnKind }[];
}

export interface PickHints {
  rowCount?: number;
  isAggregated?: boolean;
  tableSchema?: TableSchema | null;
  cardinality?: CardinalityMap;
}

export type ChartSubtype = "bar" | "line" | "pie" | "doughnut" | "scatter";

export interface WidgetPick {
  /** Ordered widget types, best first. `ranked[0] === best`. */
  ranked: WidgetType[];
  best: WidgetType;
  /** Populated only when `best === "chart"`. */
  chartSubtype?: ChartSubtype;
  /** Map region, series/grouped flags, etc. Read by the host widget. */
  displayConfig?: Record<string, unknown>;
  reason: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper — build a PickShape from raw ColumnSchema[] (pre-query use).
// Used by the palette adapter when only the source table's schema is known.
// Post-query callers should use shapeFromResult (in display.ts) which has
// the result's actual dim/measure split + temporal-bucket metadata.
// ─────────────────────────────────────────────────────────────────────────────

export function shapeFromColumns(
  cols: ColumnSchema[],
  tableSchema?: TableSchema | null,
  cardinality?: CardinalityMap,
): PickShape {
  const dims: PickShape["dims"] = [];
  const measures: PickShape["measures"] = [];
  for (const c of cols) {
    // Geographic columns route to dims regardless of numeric type — latitude
    // and longitude are numeric (float) but they're location identifiers,
    // not measures to aggregate. Same for state/country codes that might
    // happen to be numeric (e.g. state FIPS codes).
    const isGeo = isState(c) || isCountry(c) || isCoordinate(c);
    const kind = getFieldKind(c);
    // Numeric columns with exactly 2 distinct values are boolean dimensions, not measures.
    // Handles TINYINT(1)/MySQL, TINYINT/DuckDB, NUMBER(1)/Oracle, INTEGER/SQLite, UInt8/ClickHouse.
    // Databases with a real boolean type (BOOLEAN, BOOL, BIT) are already "dimension" via getFieldKind.
    const isBooleanNumeric =
      kind === "measure" &&
      (cardinality?.[c.columnName] ?? Infinity) === 2 &&
      !isIdColumn(c.columnName, tableSchema ?? undefined);
    if (!isGeo && kind === "measure" && !isIdColumn(c.columnName, tableSchema ?? undefined) && !isBooleanNumeric) {
      measures.push({ name: c.columnName, kind: "measure" });
    } else if (isGeo || kind === "dimension" || isBooleanNumeric) {
      dims.push({
        name: c.columnName,
        kind: isBooleanNumeric ? "boolean" : classifyColumn(c, tableSchema ?? undefined, cardinality),
        isState: isState(c),
        isCountry: isCountry(c),
        isCoordinate: isCoordinate(c),
      });
    }
  }
  return { dims, measures };
}

// ─────────────────────────────────────────────────────────────────────────────
// The unified cascade.
// ─────────────────────────────────────────────────────────────────────────────

export function pickWidget(shape: PickShape, hints: PickHints = {}): WidgetPick {
  const dims = shape.dims;
  const measures = shape.measures;
  const dimCount = dims.length;
  const measureCount = measures.length;
  const rowCount = hints.rowCount ?? Infinity;
  const isAggregated = hints.isAggregated;

  const hasCoordPair = dims.filter((d) => d.isCoordinate).length >= 2;
  const hasGeo = dims.some((d) => d.isState || d.isCountry) || hasCoordPair;
  const hasTemporal = dims.some((d) => d.kind === "temporal" && !d.isExtraction);
  const firstDim = dims[0];

  // ── Rule 0 — raw, unaggregated browse ────────────────────────────────────
  // User has NOT applied a summarize / group-by step. Chart / trend / pivot
  // are intentionally excluded — charting unaggregated rows is noise; trend's
  // "delta vs previous row" is meaningless without aggregation.
  if (isAggregated === false) {
    if (hasGeo) {
      return {
        ranked: ["tabulator", "map", "detail"],
        best: "tabulator",
        reason: "Raw geo data — table + map + detail",
      };
    }
    return {
      ranked: ["tabulator", "detail"],
      best: "tabulator",
      reason: "Raw data — table + detail",
    };
  }

  // ── Rule 1 — single-row scalar (post-aggregation) ────────────────────────
  if (rowCount === 1 && measureCount >= 1) {
    if (dimCount === 0 && measureCount >= 2) {
      // Multiple KPIs in a single row: show all columns, not just the first.
      // number/gauge/progress silently drop extra metrics — tabulator/detail show all.
      // Matches reference: rowCount=1 + cols>1 + dimCount=0 → ["table","object"].
      return {
        ranked: ["tabulator", "detail"],
        best: "tabulator",
        reason: "Multiple scalar KPIs — Table shows all metrics.",
      };
    }
    return {
      ranked: ["number", "gauge", "progress"],
      best: "number",
      reason: "Scalar KPI",
    };
  }

  // ── Rule 2a — 3+ dims: always tabulator, flat charts can't show this ────
  // Checked BEFORE the temporal/multi-dim rules because even a date dim can't
  // save a 3-dim shape — line + series + subseries is unreadable.
  if (dimCount >= 3 && measureCount >= 1) {
    return {
      ranked: ["tabulator", "pivot", "chart"],
      best: "tabulator",
      reason: "Too many dimensions for a flat chart → raw table.",
    };
  }

  // ── Rule 2 — temporal dim + measure (time series) ────────────────────────
  // Fires BEFORE the multi-dim / geo branches: when a date is grouped-by,
  // time-series is the primary intent even if another dim is present.
  if (hasTemporal && measureCount >= 1) {
    return {
      ranked: ["chart", "trend", "tabulator", "pivot"],
      best: "chart",
      chartSubtype: "line",
      displayConfig: dimCount >= 2 ? { series: true } : undefined,
      reason: dimCount >= 2
        ? "Date + other dim + measure — multi-series line"
        : measureCount > 1
          ? "Date + multiple measures — multi-line"
          : "Date + measure — line",
    };
  }

  // ── Rule 3 — multi-dim + measure (chart / pivot / sankey) ────────────────
  // Priority over single-geo choropleth (Rule 4) — when the user groups by
  // 2+ dims, multi-dim viz preserves both grouping dims, while a choropleth
  // would collapse the non-geo one.
  if (dimCount >= 2 && measureCount >= 1) {
    // 3+ dims — no flat chart handles this cleanly. Tabulator-first (pivot
    // available via palette) is safer than forcing a chart; the user can
    // still pivot if the cross-tab fits.
    if (dimCount >= 3) {
      return {
        ranked: ["tabulator", "pivot", "chart"],
        best: "tabulator",
        reason: "Too many dimensions for a flat chart → raw table.",
      };
    }
    // 2 dims, both coordinate → pin map.
    if (dims[0].isCoordinate && dims[1].isCoordinate) {
      return {
        ranked: ["map", "chart", "tabulator", "pivot"],
        best: "map",
        displayConfig: { mapType: "pin" },
        reason: "Latitude + longitude → pin map.",
      };
    }
    // 2 dims — check shape subtypes: categorical/categorical → grouped bar;
    // anything else (mixed) → tabulator to match the legacy fallback.
    const [d1, d2] = dims;
    // "id" (FK/PK column) is still categorical when used as a GROUP BY key —
    // The reference treats all breakout columns as categorical regardless of PK/FK status.
    const categoricalKinds: ColumnKind[] = ["boolean", "category-low", "category-high", "id"];
    const bothCategorical =
      categoricalKinds.includes(d1.kind) && categoricalKinds.includes(d2.kind);
    if (bothCategorical) {
      return {
        ranked: ["chart", "pivot", "sankey", "tabulator"],
        best: "chart",
        chartSubtype: "bar",
        displayConfig: { grouped: true, series: true },
        reason: "Two categorical dims → grouped bar with series.",
      };
    }
    return {
      ranked: ["tabulator", "pivot", "chart", "sankey"],
      best: "tabulator",
      reason: "Mixed two-dim shape → raw table.",
    };
  }

  // ── Rule 4 — single-dim aggregated geo (choropleth) ──────────────────────
  if (dimCount === 1 && measureCount >= 1 && firstDim) {
    if (firstDim.isState) {
      return {
        ranked: ["map", "chart", "tabulator"],
        best: "map",
        displayConfig: { mapType: "region", region: "us_states" },
        reason: "State + measure — choropleth",
      };
    }
    if (firstDim.isCountry) {
      return {
        ranked: ["map", "chart", "tabulator"],
        best: "map",
        displayConfig: { mapType: "region", region: "world_countries" },
        reason: "Country + measure — choropleth",
      };
    }
    // Single coordinate (no pair) falls through to Rule 5.
  }

  // ── Rule 4b — raw geo browse (no measure) ────────────────────────────────
  if (dimCount >= 1 && measureCount === 0 && hasGeo) {
    return {
      ranked: ["tabulator", "map", "detail"],
      best: "tabulator",
      reason: "Geo dim, no measure — table + map + detail",
    };
  }

  // ── Rule 5 — single-dim + measure ────────────────────────────────────────
  if (dimCount === 1 && measureCount >= 1 && firstDim) {
    // Extraction (day-of-week, hour-of-day, etc.) — discrete buckets, bar.
    if (firstDim.isExtraction) {
      return {
        ranked: ["chart", "tabulator", "pivot"],
        best: "chart",
        chartSubtype: "bar",
        reason: "Temporal extraction → discrete categories, bar.",
      };
    }
    // Boolean — two slices, bar beats pie (pie on 2 slices is a bar in
    // disguise and harder to read).
    if (firstDim.kind === "boolean") {
      return {
        ranked: ["chart", "tabulator", "pivot"],
        best: "chart",
        chartSubtype: "bar",
        reason: "Boolean split → bar (pie on 2 slices is just a bar in disguise).",
      };
    }
    // Multi-measure grouped bar.
    if (measureCount >= 2) {
      return {
        ranked: ["chart", "tabulator", "pivot"],
        best: "chart",
        chartSubtype: "bar",
        displayConfig: { grouped: true },
        reason: "Category + multiple measures → grouped bar.",
      };
    }
    return {
      ranked: ["chart", "tabulator", "pivot"],
      best: "chart",
      chartSubtype: "bar",
      reason: "Category + measure → bar.",
    };
  }

  // ── Zero-dim edge cases (defaultDisplay legacy coverage) ─────────────────
  if (dimCount === 0) {
    if (measureCount === 2) {
      return {
        ranked: ["chart", "number", "tabulator"],
        best: "chart",
        chartSubtype: "scatter",
        reason: "Two measures with no grouping → scatter (X = first, Y = second).",
      };
    }
    if (measureCount >= 1) {
      return {
        ranked: ["number", "gauge", "progress"],
        best: "number",
        reason: measureCount === 1
          ? "One summary value → Number."
          : "Summary values without a grouping → Number.",
      };
    }
    // 0 dims + 0 measures — defaultDisplay wants Number ("no shape yet");
    // the palette adapter short-circuits on empty-cols separately, so the
    // ranked here only matters when defaultDisplay is called directly.
    return {
      ranked: ["number", "tabulator", "detail"],
      best: "number",
      reason: "No shape yet — add a summarize step.",
    };
  }

  // ── Fallback — dims present but no measures ──────────────────────────────
  // Reference: ["table","pivot"] for no-metric queries. Chart is not sensible
  // without a measure column — isSensibleWidget requires measureCount>=1 for chart.
  // We add detail as a small divergence (per-row reader sensible when rows exist).
  if (dimCount === 1 && measureCount === 0) {
    return {
      ranked: ["tabulator", "pivot", "detail"],
      best: "tabulator",
      reason: "Dim only — no measures. Table + pivot (reference parity).",
    };
  }
  return {
    ranked: ["tabulator", "detail"],
    best: "tabulator",
    reason: "Unrecognized shape → raw table.",
  };
}
