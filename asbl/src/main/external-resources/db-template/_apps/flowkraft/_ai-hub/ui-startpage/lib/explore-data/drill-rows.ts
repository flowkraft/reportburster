/**
 * The rows behind a bar or a table row of a Visual-tab widget (#21).
 *
 * A grouped Visual query answers one line per group. A click on one of them asks the query again
 * without its aggregation: the rows of its table, under its own filters and the selections that
 * reach it, plus one condition per group column, each bound to a parameter of its own that holds the
 * value clicked (`__drill_<column>`). That second query is written here, once, when the widget's
 * query is written (`useWidgetData`), and kept on the data source beside it as `rowsSql`, so the
 * canvas and the published dashboard ask the database the same question - the way `slicerSql` is.
 *
 * Only a group a person can name by what they clicked can be drilled: a column grouped by its own
 * text value. A date bucket, a numeric bin, a computed column or a number column groups by
 * something a chart label does not hand back as it is stored, so a widget grouped by one has no
 * rows query, and a click on it does what it always did.
 */
import type { VisualQuery } from "@/lib/stores/canvas-store";
import type { SqlLiteralKind } from "./sql-dialects";

/**
 * The prefix of a clicked group value's parameter, `__drill_<column>`.
 *
 * LOGIC-MIRROR of {@code DRILL_PARAM_PREFIX} in {@code ScriptAssembler.java}, which declares these
 * parameters in the published script from the SQL itself, and of {@code drillParamName} in
 * {@code rb-webcomponents/src/shared/drill-through.ts}, which sends the value clicked.
 */
export const DRILL_PARAM_PREFIX = "__drill_";

/** How many rows a click opens: a look at them, not an export (the tile's CSV is that). */
export const DRILL_ROWS_LIMIT = 500;

/** The parameter one group column's clicked value travels in. */
export function drillParamName(column: string): string {
  return DRILL_PARAM_PREFIX + column.replace(/[^A-Za-z0-9_]/g, "_");
}

/**
 * The group columns a click on this query names, in the order it groups by them; none when the
 * query cannot be drilled (see the file comment).
 */
export function drillFieldsOf(
  query: VisualQuery | null | undefined,
  columnKinds?: ReadonlyMap<string, SqlLiteralKind>,
): string[] {
  if (!query || query.kind === "cube" || !query.table) return [];
  if (!query.groupBy?.length || !query.summarize?.length) return [];
  const computed = new Set((query.computed ?? []).map((c) => c.name));
  for (const column of query.groupBy) {
    if (query.groupByBuckets?.[column] || query.groupByNumericBuckets?.[column]) return [];
    if (computed.has(column)) return [];
    // The published tile names its group columns in one attribute, separated by commas.
    if (column.includes(",")) return [];
    if ((columnKinds?.get(column) ?? "string") !== "string") return [];
  }
  return [...query.groupBy];
}

/** The same question without its aggregation: the table's rows, under the query's own filters. */
export function rowsQueryOf(query: VisualQuery): VisualQuery {
  return {
    ...query,
    summarize: [],
    groupBy: [],
    groupByBuckets: undefined,
    groupByNumericBuckets: undefined,
    sort: [],
    limitParam: undefined,
    limit: DRILL_ROWS_LIMIT,
  };
}

/** One condition per group column, bound to the value clicked; AND-ed after the query's own. */
export function drillFiltersOf(fields: readonly string[]): { column: string; operator: string; value: string }[] {
  return fields.map((column) => ({ column, operator: "equals", value: "${" + drillParamName(column) + "}" }));
}

/** The parameters a click sends: each group column's value, as text. */
export function drillValuesOf(fields: readonly string[], clicked: Record<string, unknown>): Record<string, string> | null {
  const values: Record<string, string> = {};
  for (const column of fields) {
    const value = clicked[column];
    if (value === null || value === undefined || String(value) === "") return null;
    values[drillParamName(column)] = String(value);
  }
  return values;
}
