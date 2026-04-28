// Smart-defaults for the Row-2 widgets: Sankey, Gauge, Trend, Progress, Detail.
//
// Each function returns the field picks for its widget. Widgets use
// `effective = userPick || autoPick || fallback` (the NumberWidget pattern) — no
// writes back to the store. Reuses existing classifiers; no duplicate logic.

import type { ColumnSchema, TableSchema } from "../types";
import {
  isIdColumn,
  isTemporalLike,
  isState,
  isCountry,
  isLatitude,
  isLongitude,
  type CardinalityMap,
} from "./classification";
import { splitDimsAndMeasures } from "./axis-assignment";
import { autoPickMeasure } from "./auto-pick";

// ──────────────────────────────────────────────────────────────────────────
// Sankey — two dims + one measure
// High-cardinality target guard prevents the ~589-node meltdown that freezes
// the browser when target is a high-unique-value column like ShipAddress.
//
// A 100-distinct-value cap on dimension cardinality. Columns exceeding this
// limit are excluded from the candidate pool entirely (no fallback). When no
// valid target remains, targetField is undefined and isSensibleWidget("sankey")
// returns false — the widget is not recommended.
// ──────────────────────────────────────────────────────────────────────────

export const SANKEY_MAX_TARGET_CARDINALITY = 100;

export interface Row2Hints {
  cardinality?: CardinalityMap;
  tableSchema?: TableSchema | null;
}

export function pickSankeyFields(
  columns: ColumnSchema[],
  hints: Row2Hints = {},
): { sourceField?: string; targetField?: string; valueField?: string } {
  const table = hints.tableSchema ?? undefined;
  const card = hints.cardinality ?? {};

  const { dims } = splitDimsAndMeasures(columns);
  const nonIdDims = dims.filter((c) => !isIdColumn(c.columnName, table));

  // Sort by cardinality ascending when hints are available — low-card dims
  // make readable sankeys. Schema order otherwise.
  const sorted = [...nonIdDims].sort((a, b) => {
    const ca = card[a.columnName];
    const cb = card[b.columnName];
    if (typeof ca === "number" && typeof cb === "number") return ca - cb;
    return 0;
  });

  const sourceField = sorted[0]?.columnName;

  // Target: skip source; only use candidates with cardinality ≤ SANKEY_MAX.
  // No fallback — if all remaining candidates exceed the limit, targetField
  // is undefined and the Sankey widget is not recommended (isSensibleWidget
  // checks that both sourceField and targetField are defined).
  const targetOk = (c: ColumnSchema) => {
    const n = card[c.columnName];
    return typeof n !== "number" || n <= SANKEY_MAX_TARGET_CARDINALITY;
  };
  const targetField = sorted.slice(1).find(targetOk)?.columnName;

  const valueCol = autoPickMeasure(columns, table);
  const valueField = valueCol?.columnName;

  return { sourceField, targetField, valueField };
}

// ──────────────────────────────────────────────────────────────────────────
// Gauge — first non-ID measure
// ──────────────────────────────────────────────────────────────────────────

export function pickGaugeField(
  columns: ColumnSchema[],
  tableSchema?: TableSchema | null,
): { field?: string } {
  const col = autoPickMeasure(columns, tableSchema ?? undefined);
  return { field: col?.columnName };
}

// ──────────────────────────────────────────────────────────────────────────
// Trend — first temporal column + first non-ID measure
// ──────────────────────────────────────────────────────────────────────────

export function pickTrendFields(
  columns: ColumnSchema[],
  tableSchema?: TableSchema | null,
): { dateField?: string; valueField?: string } {
  const table = tableSchema ?? undefined;
  const dateField = columns.filter(isTemporalLike).map((c) => c.columnName)[0];
  const valueCol = autoPickMeasure(columns, table);
  return { dateField, valueField: valueCol?.columnName };
}

// ──────────────────────────────────────────────────────────────────────────
// Progress — first non-ID measure
// ──────────────────────────────────────────────────────────────────────────

export function pickProgressField(
  columns: ColumnSchema[],
  tableSchema?: TableSchema | null,
): { field?: string } {
  const col = autoPickMeasure(columns, tableSchema ?? undefined);
  return { field: col?.columnName };
}

// ──────────────────────────────────────────────────────────────────────────
// Detail — hide ID columns by default, show everything else
// ──────────────────────────────────────────────────────────────────────────

export function pickDetailDefaults(
  columns: ColumnSchema[],
  tableSchema?: TableSchema | null,
): { hiddenColumns: string[] } {
  const table = tableSchema ?? undefined;
  const hidden = columns
    .filter((c) => isIdColumn(c.columnName, table))
    .map((c) => c.columnName);
  return { hiddenColumns: hidden };
}

// ──────────────────────────────────────────────────────────────────────────
// Map — geo seed: choose region (state vs country choropleth) or pin (lat+lon),
// plus metric. Mirrors the reference defaultDisplay(): state → us_states region,
// country → world_countries region, lat+lon → pin. The widget-picker's Rule 4
// emits the same shape for the one-shot store auto-switch; this helper lets
// ConfigPanel's palette onClick seed the same fields without reconstructing a
// SummarizeShape.
// ──────────────────────────────────────────────────────────────────────────

export interface MapDefaults {
  mapType?: string;
  region?: string;
  dimension?: string;
  latField?: string;
  lonField?: string;
  metric?: string;
}

export function pickMapDefaults(
  columns: ColumnSchema[],
  tableSchema?: TableSchema | null,
): MapDefaults {
  const table = tableSchema ?? undefined;
  const out: MapDefaults = {};

  const stateCol = columns.find(isState);
  const countryCol = columns.find(isCountry);
  const geo = stateCol ?? countryCol;

  if (geo) {
    out.mapType = "region";
    out.region = stateCol ? "us_states" : "world_countries";
    out.dimension = geo.columnName;
  } else {
    const latCol = columns.find(isLatitude);
    const lonCol = columns.find(isLongitude);
    if (latCol && lonCol) {
      out.mapType = "pin";
      out.latField = latCol.columnName;
      out.lonField = lonCol.columnName;
    }
  }

  const metric = autoPickMeasure(columns, table);
  if (metric) out.metric = metric.columnName;

  return out;
}

// ──────────────────────────────────────────────────────────────────────────
// Progress goal derivation — at render time from the single value.
// Finds the SMALLEST "nice" number (from the {1, 2, 2.5, 5, 10} × 10^n
// scale) that is STRICTLY GREATER than the current value. Tick-rounding
// keeps the target always above the current reading without requiring a
// fixed percentage stretch (which could skip over intuitive round numbers).
// ──────────────────────────────────────────────────────────────────────────

const NICE_STEPS = [1, 2, 2.5, 5, 10] as const;

export function pickProgressGoal(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 100;
  const mag = Math.pow(10, Math.floor(Math.log10(value)));
  const norm = value / mag;
  for (const n of NICE_STEPS) {
    if (n > norm) return n * mag;
  }
  // norm ≥ 10 (shouldn't normally happen); go to next magnitude
  return 10 * mag * 10;
}
