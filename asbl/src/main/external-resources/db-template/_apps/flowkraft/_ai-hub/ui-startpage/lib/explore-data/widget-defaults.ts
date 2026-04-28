// Pure helpers for widget-type and display-config defaults.
//
// These compose smart-defaults/* primitives (pickWidget, rankChartSubtypes,
// autoPickMeasure, pickGaugeField, …) into the shape that both the
// canvas-store's one-shot auto-switch (setWidgetQueryResult) and the
// ConfigPanel palette onClick need.  Kept outside `smart-defaults/` because
// they touch DataSource / WidgetDisplayConfig / WidgetType — types owned by
// the canvas-store — and because they write shapes (config patches, type
// choices) that are consumed imperatively by store mutators, not just
// classifier-side.

import type { DataSource, VisualQuery, WidgetDisplayConfig, WidgetType } from "@/lib/stores/canvas-store";
import type { ColumnSchema, QueryResult } from "./types";
import {
  autoPickMeasure, pickGaugeField, pickProgressField, pickTrendFields,
  pickSankeyFields, pickDetailDefaults, pickMapDefaults, splitDimsAndMeasures,
  rankChartSubtypes, shapeFromResult, pickDefaultAxes, type CardinalityMap,
} from "./smart-defaults";
import { pickWidget, type PickShape } from "./smart-defaults/widget-picker";
import { pickColumnFormat } from "./type-formatters";

/** Return only the raw ColumnSchema entries whose column names appear in
 *  `widget.shape.dims`.  Used by config panels (MapConfig, TrendConfig,
 *  SankeyConfig, …) to populate their "dimension" `<select>` dropdowns
 *  without re-running classification.  The shape is the single authority;
 *  this helper is pure lookup.  Falls back to the cols argument when shape
 *  is null (pre-query / pre-schema-fetch state). */
export function dimensionsOf(
  columns: ColumnSchema[] | null,
  shape: PickShape | null,
): ColumnSchema[] {
  const cols = columns ?? [];
  if (!shape) return cols;
  const names = new Set(shape.dims.map((d) => d.name));
  return cols.filter((c) => names.has(c.columnName));
}

/** Same as `dimensionsOf` but for the measures bucket. */
export function measuresOf(
  columns: ColumnSchema[] | null,
  shape: PickShape | null,
): ColumnSchema[] {
  const cols = columns ?? [];
  if (!shape) return cols;
  const names = new Set(shape.measures.map((m) => m.name));
  return cols.filter((c) => names.has(c.columnName));
}

/** Dims whose classified kind is "temporal" — the time-axis candidates
 *  for TrendConfig and any other panel that needs a date dropdown.  The
 *  `kind` flag is populated by `shapeFromResult` / `shapeFromColumns`
 *  using the same rules as `classifyColumn` + the computed-alias name
 *  fallback (order_month → temporal).  Consumers used to call
 *  `columns.filter(isTemporalLike)` locally, which ran the name tokenizer
 *  again per render — now they read the pre-classified flag. */
export function temporalDimensionsOf(
  columns: ColumnSchema[] | null,
  shape: PickShape | null,
): ColumnSchema[] {
  const cols = columns ?? [];
  if (!shape) return cols;
  const names = new Set(
    shape.dims.filter((d) => d.kind === "temporal").map((d) => d.name),
  );
  return cols.filter((c) => names.has(c.columnName));
}

/** Synthesize the post-aggregation column list from a raw table schema +
 *  a visual query's summarize/groupBy.  For raw-table drops (no summarize,
 *  no groupBy) returns `baseCols` unchanged — the table's schema IS the
 *  result shape.  For aggregated queries, walks groupBy (keeping schema
 *  types — TIMESTAMP / BOOLEAN / etc.) + adds one synthetic DOUBLE column
 *  per summarize entry.
 *
 *  Used by ConfigPanel during visual-mode pre-query setup so the
 *  `widget.columns` / `widget.shape` written to the store always reflects
 *  WHAT WILL APPEAR IN THE RESULT, not the raw table.  Eliminates the need
 *  for every palette / config consumer to re-synthesize locally. */
export function synthesizePostAggColumns(
  baseCols: ColumnSchema[],
  visualQuery: VisualQuery | undefined,
): ColumnSchema[] {
  if (!visualQuery) return baseCols;
  const hasSummarize = (visualQuery.summarize?.length ?? 0) > 0;
  const hasGroupBy = (visualQuery.groupBy?.length ?? 0) > 0;
  if (!hasSummarize && !hasGroupBy) return baseCols;

  const result: ColumnSchema[] = [];
  for (const col of (visualQuery.groupBy ?? [])) {
    const schemaCol = baseCols.find((c) => c.columnName === col);
    if (schemaCol) result.push(schemaCol);
  }
  for (const s of (visualQuery.summarize ?? [])) {
    result.push({
      columnName: `${s.field}_${(s.aggregation as string).toLowerCase()}`,
      typeName: "DOUBLE",
      isNullable: true,
    });
  }
  return result.length > 0 ? result : baseCols;
}

/** Infer column metadata from a single result row.
 *
 *  Used in non-visual modes (SQL/AI-SQL/Script) where we don't have source
 *  table schema.  Type inference is purely from the JS primitive (number →
 *  DOUBLE, boolean → BOOLEAN, else VARCHAR).  We do NOT try to detect
 *  date-shaped strings as TIMESTAMP — that would force narrow `isTemporal`
 *  (used by date formatters) to treat a string like "2024-01" as a real
 *  date, which it isn't.  Name-based temporal detection lives in
 *  `classifyColumn` / `isTemporalLike`; shape.dims[].kind already reports
 *  "temporal" for such columns without lying about the JDBC type. */
export function inferColumnsFromRow(row: Record<string, unknown>): ColumnSchema[] {
  return Object.entries(row).map(([name, value]) => ({
    columnName: name,
    typeName: typeof value === "number" ? "DOUBLE"
            : typeof value === "boolean" ? "BOOLEAN"
            : "VARCHAR",
    isNullable: true,
  }));
}

/** Compute the auto-pick displayConfig patch for a target widget type.
 *
 *  Shared by (a) the canvas-store's one-shot auto-switch on first query
 *  result and (b) ConfigPanel's palette onClick when a user picks a widget
 *  type explicitly.  Without this, switching to Number / Gauge / Progress /
 *  Trend / Sankey would leave the ConfigPanel's `<select>` empty even though
 *  the Widget has perfectly good render-time auto-pick logic — because the
 *  select reads `config.<field>` directly and render-time picks never write
 *  back to displayConfig.
 *
 *  Returns `null` when nothing needs to change (user already set the fields,
 *  or no suitable columns exist).  Each seeded field carries an
 *  `_auto_<field>` flag so future UX can show a "picked for you" badge and
 *  distinguish auto-picked vs. user-picked values. */
export function seedDisplayConfigForType(
  type: WidgetType,
  currentConfig: WidgetDisplayConfig,
  columns: ColumnSchema[],
  hints: { cardinality: CardinalityMap; extractions: Set<string> },
  shape?: PickShape | null,
): WidgetDisplayConfig | null {
  const next: WidgetDisplayConfig = { ...currentConfig };
  let changed = false;

  const seed = (key: string, value: unknown) => {
    if (value === undefined || value === null || value === "") return;
    if (currentConfig[key]) return;   // respect any value the user already set
    next[key] = value;
    next[`_auto_${key}`] = true;
    changed = true;
  };

  switch (type) {
    case "chart": {
      // When shape is available, use it to partition columns — avoids re-classifying
      // inferColumnsFromRow output where numeric GROUP BY columns appear as DOUBLE.
      const { dims, measures } = shape
        ? {
            dims: columns.filter((c) => shape.dims.some((d) => d.name === c.columnName)),
            measures: columns.filter((c) => shape.measures.some((m) => m.name === c.columnName)),
          }
        : splitDimsAndMeasures(columns);
      if (!currentConfig.chartType) {
        const subtype = rankChartSubtypes(dims, measures, {
          cardinality: hints.cardinality,
          extractions: hints.extractions,
        })[0];
        if (subtype) {
          next.chartType = subtype;
          next._auto_chartType = true;
          changed = true;
        }
      }
      if (!currentConfig.xFields || (currentConfig.xFields as string[]).length === 0) {
        const chartType = (next.chartType ?? currentConfig.chartType ?? "bar") as string;
        const axes = pickDefaultAxes(dims, measures, chartType);
        if (axes.xFields.length > 0) {
          next.xFields = axes.xFields;
          next._auto_xFields = true;
          changed = true;
        }
        if (axes.yFields.length > 0) {
          next.yFields = axes.yFields;
          next._auto_yFields = true;
          changed = true;
        }
      }
      break;
    }
    case "number": {
      const col = autoPickMeasure(columns);
      seed("numberField", col?.columnName);
      if (col) {
        const spec = pickColumnFormat(col);
        seed("numberFormat", spec.kind === "currency" ? "currency" : "number");
      }
      break;
    }
    case "gauge": {
      const { field } = pickGaugeField(columns);
      seed("field", field);
      break;
    }
    case "progress": {
      const { field } = pickProgressField(columns);
      seed("field", field);
      break;
    }
    case "trend": {
      const picks = pickTrendFields(columns);
      seed("dateField", picks.dateField);
      seed("valueField", picks.valueField);
      break;
    }
    case "sankey": {
      const picks = pickSankeyFields(columns, { cardinality: hints.cardinality });
      seed("sourceField", picks.sourceField);
      seed("targetField", picks.targetField);
      seed("valueField", picks.valueField);
      break;
    }
    case "detail": {
      if (!currentConfig.hiddenColumns) {
        const { hiddenColumns } = pickDetailDefaults(columns);
        if (hiddenColumns.length > 0) {
          next.hiddenColumns = hiddenColumns;
          next._auto_hiddenColumns = true;
          changed = true;
        }
      }
      break;
    }
    case "map": {
      // Geo seed — mirrors the reference defaultDisplay() for country/state +
      // measure: state → us_states region, country → world_countries region,
      // lat+lon pair → pin. Without this, palette-click → map left mapType
      // unset and MapConfig's `btnMapType-region` was never aria-pressed.
      const picks = pickMapDefaults(columns);
      seed("mapType",   picks.mapType);
      seed("region",    picks.region);
      seed("dimension", picks.dimension);
      seed("latField",  picks.latField);
      seed("lonField",  picks.lonField);
      seed("metric",    picks.metric);
      break;
    }
    // tabulator / pivot / filter-pane / text / divider / iframe —
    // no deterministic "first column to pre-select" default worth writing.
  }
  return changed ? next : null;
}

/** Compute the classified shape + raw columns from a query result.
 *
 *  This is the ONE authoritative place that translates a raw QueryResult into
 *  the `{ columns, shape }` pair that every downstream consumer needs.
 *  Called by the store mutator `setWidgetQueryResult` to write both fields
 *  onto the widget record atomically.  After this refactor, no consumer
 *  (ConfigPanel, MapConfig, TrendConfig, widget-sensibility, palette, widget
 *  renderers) re-runs classification locally — they read `widget.columns`
 *  and `widget.shape` from the store.
 *
 *  Returns `null` for empty result sets so callers can distinguish "we ran
 *  the query and got no data" from "we have data but it's un-classifiable". */
export function computeWidgetShape(
  result: QueryResult,
  dataSource: DataSource | null,
): { columns: ColumnSchema[]; shape: PickShape } | null {
  if (!result.data || result.data.length === 0) return null;
  const columns = inferColumnsFromRow(result.data[0]);
  const { dims: dimCols, measures: measureCols } = splitDimsAndMeasures(columns);
  const allNames = columns.map((c) => c.columnName);
  const vq = dataSource?.mode === "visual" ? dataSource.visualQuery : undefined;
  // Visual query has the authoritative GROUP BY list — use it instead of type-inferred dims.
  // inferColumnsFromRow assigns typeName="DOUBLE" to all numeric JS values, so
  // splitDimsAndMeasures cannot distinguish a GROUP BY TINYINT from an aggregated DOUBLE.
  const dimNames = vq?.groupBy?.length ? vq.groupBy : dimCols.map((c) => c.columnName);
  const measureNames = measureCols.map((c) => c.columnName);
  // shapeFromResult honors temporal-extraction buckets (day-of-week etc.) and
  // cross-references the schema for semantic hints — see display.ts.
  const shape = shapeFromResult(
    allNames,
    dimNames,
    vq?.groupByBuckets,
    measureNames,
    null,
    undefined,
    columns,
  );
  return { columns, shape };
}

/** Derive the best-fit widget type + default displayConfig given a
 *  precomputed shape.  Mirrors the reference `defaultDisplay()`: returns both
 *  the type and the per-rule displayConfig (e.g. Rule 4 returns
 *  `{ mapType: "region", region: "world_countries" }` for country+measure).
 *
 *  Accepts a `PickShape` directly rather than rebuilding it — the store
 *  mutator calls `computeWidgetShape` once and shares the result with this
 *  function, so no double classification. */
export function resolveAutoWidget(
  shape: PickShape,
  rowCount: number | undefined,
  isAggregated: boolean | undefined,
): { type: WidgetType; displayConfig?: Record<string, unknown> } {
  const pick = pickWidget(shape, { rowCount, isAggregated });
  return { type: pick.best, displayConfig: pick.displayConfig };
}
