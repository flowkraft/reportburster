/**
 * What a reader's selections do to the other widgets of the canvas.
 *
 * A selection is made in one of two ways, and one rule answers both:
 *   - a slicer, which applies by itself to every widget built on its table, and the author writes
 *     nothing;
 *   - a click on a chart bar, a table cell or a map point, on a widget whose author ticked "Clicks
 *     filter the dashboard" (`clicksFilter` in the widget's own DSL). The click selects the value
 *     it points at, exactly as a slicer click does, and a second click drops it again.
 * (The filter bar is the other half and keeps its own job: a parameter the author places in their
 * own SQL as `${param}`.)
 *
 * A widget is never filtered by a field its own clicks select, the same way a slicer's own list is
 * not narrowed by its own pick: a chart that collapsed to the one bar just clicked would be a
 * chart nobody can click twice.
 *
 * The rule, in one place:
 *   - the values picked for ONE field are OR-ed together — one `IN (…)` list;
 *   - different fields are AND-ed together — one line each;
 *   - a field with no selection is no condition at all: every row.
 *
 * How a value reaches the database: never pasted into the SQL text. Each slicer field owns one
 * parameter, `__slicer_<field>`, and the condition is written once — for every slicer field of the
 * widget's table, whether or not anything is selected:
 *
 *     AND "ship_country" IN (${__slicer_ship_country})
 *
 * The selected values travel as that parameter's value, comma separated. An empty value means the
 * line is not applied, and the server writes `AND 1=1` in its place
 * (`SqlParameterLines.linesThatApply`, the same rule the published dashboard's script applies with
 * its `has<P> && listHasValues` guard). So one SQL text answers both "nothing selected" and "these
 * three countries", in the canvas and on the published dashboard alike.
 *
 * A value holding a comma cannot be told from two values: the list is split on commas where it is
 * bound, which is what every multi-select dashboard parameter has always done.
 */

import type { Widget } from "@/lib/stores/canvas-store";
import type { ExploreSelection } from "@/lib/stores/canvas-store";
import type { SlicerDslOptions } from "./dsl-sync/slicer-mapping";
import { paramRefOf } from "./sql-builder";
import { quoteIdent, type SqlDialect } from "./sql-dialects";
import { tableKey } from "./table-ref";

/**
 * The event a widget fires when a click of its own makes a selection.
 *
 * LOGIC-MIRROR of {@code CROSS_FILTER_EVENT} in
 * `frend/rb-webcomponents/src/shared/slicer-selections.ts` - the components dispatch it and both
 * hosts listen for it, so the two have to spell it the same way.
 */
export const CROSS_FILTER_EVENT = "crossFilterSelect";

/** The one prefix a slicer parameter carries, so nothing else can be taken for one. */
export const SLICER_PARAM_PREFIX = "__slicer_";

/**
 * The parameter one slicer field binds its values to.
 *
 * The name is a bind name in SQL (`:name` after conversion) and a variable name in the published
 * script, so anything that is not a word character becomes `_`. Two fields whose names differ only
 * in such characters would share a parameter; no vendor column name of the samples does.
 */
export function slicerParamName(field: string): string {
  return SLICER_PARAM_PREFIX + field.replace(/[^A-Za-z0-9_]/g, "_");
}

/** True for a parameter this file owns — not a dashboard filter the author declared. */
export function isSlicerParamName(name: string): boolean {
  return name.startsWith(SLICER_PARAM_PREFIX);
}

/** The field one slicer widget filters by, from its canonical DSL Map; "" when none yet. */
export function slicerFieldOf(widget: Widget): string {
  if (widget.type !== "slicer") return "";
  const field = (widget.displayConfig?.dslConfig as SlicerDslOptions | undefined)?.field;
  return typeof field === "string" ? field : "";
}

/** The table one widget reads, as `schema.table` or `table`; "" when it reads none. */
export function slicerTableKeyOf(widget: Widget): string {
  const vq = widget.dataSource?.visualQuery;
  if (!vq?.table) return "";
  return tableKey(vq.table, vq.tableSchema);
}

/**
 * The fields the slicers of this canvas filter by, for one table: in canvas order, no repeats.
 *
 * A slicer with no field yet filters nothing, and is left out.
 */
export function slicerFieldsForTable(widgets: Widget[], tableKeyOfWidget: string): string[] {
  if (!tableKeyOfWidget) return [];
  const fields: string[] = [];
  for (const w of widgets) {
    if (w.type !== "slicer") continue;
    if (slicerTableKeyOf(w) !== tableKeyOfWidget) continue;
    const field = slicerFieldOf(w);
    if (field && !fields.includes(field)) fields.push(field);
  }
  return fields;
}

/** Every field any slicer of this canvas filters by, in canvas order, no repeats. */
export function allSlicerFields(widgets: Widget[]): string[] {
  const fields: string[] = [];
  for (const w of widgets) {
    if (w.type !== "slicer") continue;
    const field = slicerFieldOf(w);
    if (field && !fields.includes(field)) fields.push(field);
  }
  return fields;
}

/**
 * Whether this widget's clicks make a selection: the author's tick, off everywhere until ticked.
 *
 * A chart, a table and a pivot keep it in their canonical DSL Map (Principle 4) beside every other
 * display setting, so it travels into the published config file with them. A map has no DSL of its
 * own - its settings are display-config keys - so there it is one of those.
 */
export function clicksFilterOf(widget: Widget): boolean {
  const dsl = widget.displayConfig?.dslConfig as Record<string, unknown> | undefined;
  if (typeof dsl?.clicksFilter === "boolean") return dsl.clicksFilter;
  return widget.displayConfig?.clicksFilter === true;
}

/**
 * The fields one widget's clicks can select a value of - nothing unless its author ticked the box.
 *
 * What a click points at is a value of the widget's own grouping, so that is what it selects:
 *   - a chart: the field its labels come from, and the one its series come from;
 *   - a table: the columns it groups by, or, when it groups by nothing, its dimension columns -
 *     a click lands on one cell, and the cell's column is the field;
 *   - a map: the field its regions or points are named by.
 *
 * These are also the fields every OTHER widget of the table carries a condition for, so the set
 * has to be the same before and after a click: it is read from the widget's configuration, never
 * from what happens to be on screen.
 */
export function crossFilterFieldsOf(widget: Widget): string[] {
  if (!clicksFilterOf(widget)) return [];
  const dsl = (widget.displayConfig?.dslConfig ?? {}) as Record<string, unknown>;
  const out: string[] = [];
  const add = (v: unknown) => {
    if (typeof v === "string" && v && !out.includes(v)) out.push(v);
  };
  if (widget.type === "chart") {
    const data = (dsl.data ?? {}) as Record<string, unknown>;
    add(data.labelField);
    add(data.seriesField);
    return out;
  }
  if (widget.type === "tabulator") {
    const groupBy = widget.dataSource?.visualQuery?.groupBy ?? [];
    if (groupBy.length > 0) {
      groupBy.forEach(add);
      return out;
    }
    (widget.shape?.dims ?? []).forEach((d) => add(d.name));
    return out;
  }
  if (widget.type === "map") {
    add(widget.displayConfig?.dimension);
    return out;
  }
  return out;
}

/**
 * Every field a selection can be made on for one table: its slicers' fields and the fields the
 * cross-filtering widgets of that table click on, in canvas order, no repeats.
 *
 * This is the set each widget of the table carries one condition for, so a click can only ever
 * narrow a query that was already written to expect it.
 */
export function selectableFieldsForTable(widgets: Widget[], tableKeyOfWidget: string): string[] {
  if (!tableKeyOfWidget) return [];
  const fields = slicerFieldsForTable(widgets, tableKeyOfWidget);
  for (const w of widgets) {
    if (slicerTableKeyOf(w) !== tableKeyOfWidget) continue;
    for (const field of crossFilterFieldsOf(w)) if (!fields.includes(field)) fields.push(field);
  }
  return fields;
}

/** Every field any selection of this canvas can be made on, in canvas order, no repeats. */
export function allSelectableFields(widgets: Widget[]): string[] {
  const fields = allSlicerFields(widgets);
  for (const w of widgets)
    for (const field of crossFilterFieldsOf(w)) if (!fields.includes(field)) fields.push(field);
  return fields;
}

/** The values picked for one field, in the order they were picked. */
export function selectedValuesOf(selections: ExploreSelection[], field: string): string[] {
  return selections.filter((s) => s.field === field).map((s) => s.value);
}

/**
 * The value of every selection parameter of this canvas: the picked values, comma separated, and
 * the empty string for a field nothing is picked in (which is what turns its line off).
 *
 * Every one is always sent, because a `${…}` the request says nothing about is not a parameter the
 * server can leave out of the SQL. A cross-filter field is one of them: it binds through the same
 * `__slicer_<field>` parameter, because it is the same kind of selection made another way.
 */
export function slicerParamValues(
  widgets: Widget[],
  selections: ExploreSelection[],
): Record<string, string> {
  const values: Record<string, string> = {};
  for (const field of allSelectableFields(widgets)) {
    values[slicerParamName(field)] = selectedValuesOf(selections, field).join(",");
  }
  return values;
}

/** One `in` filter per selectable field, each bound to the field's own parameter. */
export function slicerFiltersFor(
  fields: readonly string[],
): { column: string; operator: string; value: string }[] {
  return fields.map((field) => ({
    column: field,
    operator: "in",
    value: `\${${slicerParamName(field)}}`,
  }));
}

/**
 * What one widget does with the slicers of its canvas.
 *
 * `filters` are for a Visual-tab widget: they go into the visual query before the SQL is built, so
 * the condition lands in the WHERE — before the aggregation, which is the only place it can be
 * right for a KPI that has no column of its own to filter on.
 *
 * `wrapFields` are for a widget whose data is pasted SQL: its query is wrapped, and only the slicer
 * fields its result really has a column for can be asked of it.
 *
 * `notFiltered` is what the widget has to say for itself: the slicer fields it is NOT filtered by.
 */
export interface SlicerFilterPlan {
  filters: { column: string; operator: string; value: string }[];
  wrapFields: string[];
  notFiltered: string[];
}

const NO_PLAN: SlicerFilterPlan = { filters: [], wrapFields: [], notFiltered: [] };

/**
 * The plan for one widget.
 *
 * @param resultColumns the names the widget's result carries, for the wrap of a pasted-SQL widget.
 *                      Unknown (null) counts as "no column of that name": a wrap that asks for a
 *                      column the result has not got would fail the whole query.
 */
export function slicerFilterPlanFor(
  widget: Widget | undefined,
  widgets: Widget[],
  resultColumns?: readonly string[] | null,
): SlicerFilterPlan {
  if (!widget || widget.type === "slicer") return NO_PLAN;
  const own = crossFilterFieldsOf(widget);
  const fields = selectableFieldsForTable(widgets, slicerTableKeyOf(widget))
    .filter((f) => !own.includes(f));
  if (fields.length === 0) return NO_PLAN;

  const mode = widget.dataSource?.mode;
  const kind = widget.dataSource?.visualQuery?.kind ?? "table";

  // A cube answers its own questions. The renderer does take a filter from outside
  // (`initialFilters`), but a slicer names a column of a table and a cube names a member of its own
  // star: which member sits on that column is in the cube's file and is deliberately not in what
  // the canvas is told about a cube (`CubeRuntimeService.shown`: name, title, type, format). A
  // guess there would filter the tile by the wrong field and show a wrong number, so the tile says
  // it is not filtered instead.
  if (kind === "cube") return { filters: [], wrapFields: [], notFiltered: fields };

  if (mode === "visual") {
    return { filters: slicerFiltersFor(fields), wrapFields: [], notFiltered: [] };
  }

  // A Groovy script is not SQL to wrap, and its rows are whatever the script made of them: filtering
  // them afterwards would re-answer an aggregate it already computed. So a script widget says it is
  // not filtered.
  if (mode === "script") return { filters: [], wrapFields: [], notFiltered: fields };

  const columns = resultColumns ?? [];
  const wrapFields = fields.filter((f) => columns.includes(f));
  return {
    filters: [],
    wrapFields,
    notFiltered: fields.filter((f) => !wrapFields.includes(f)),
  };
}

/**
 * A pasted-SQL widget under the slicers: its own query, untouched, with the slicer conditions asked of
 * its result.
 *
 * The author's SQL is not rewritten - it is read as a derived table, so whatever it does (a CTE, a
 * UNION feed, its own GROUP BY) still answers exactly what it answered, and the slicer only takes
 * rows away from the answer. Only a field the result really has a column for is asked (the caller
 * decides that, `slicerFilterPlanFor`), and each condition is one line, so an empty parameter is a
 * line the server does not apply.
 */
export function wrapWithSlicerFilters(
  sql: string,
  fields: readonly string[],
  dialect: SqlDialect,
): string {
  if (fields.length === 0) return sql;
  const conditions = fields.map(
    (field) => `${quoteIdent(field, dialect)} IN (${paramRefOf(slicerParamName(field))})`,
  );
  return `SELECT * FROM (\n${sql}\n) slicer_src\nWHERE ${conditions.join("\n  AND ")}`;
}

/**
 * The condition lines that narrow ONE slicer's value list by the OTHER slicers' picks.
 *
 * This is how a published slicer greys out. The canvas asks `/api/analytics/explore` which values of a
 * field still answer rows; a published dashboard cannot ask that - the endpoint answers to report
 * authors, and it reads the table directly, which is past the parameters a share link locked (a
 * server-side pivot refuses a locked view for exactly that reason). What a published slicer has
 * instead is its own value query, which it fetches through its report, so the report's locks hold:
 * with these lines it comes back holding the values that still answer rows, and the values missing
 * from the list it got while nothing was picked are the greys.
 *
 * The slicer's own field is never among `fields`: picking a value has to leave the rest of ITS list
 * clickable, which is the whole of associative exploration.
 *
 * One line each, and every line is always written: an empty parameter is a line the server does not
 * apply (`SqlParameterLines.linesThatApply`), so one SQL text answers every combination of picks.
 */
export function slicerNarrowingLines(
  fields: readonly string[],
  dialect: SqlDialect,
): string[] {
  return fields.map(
    (field) => `AND ${quoteIdent(field, dialect)} IN (${paramRefOf(slicerParamName(field))})`,
  );
}

/** How the widget says which slicer fields do not reach it. */
export function notFilteredNote(fields: readonly string[]): string {
  if (fields.length === 0) return "";
  return `not filtered by ${fields.join(", ")}`;
}
