// The aggregates the Summarize step offers, in one place.
//
// This file writes no SQL. It holds the list the Summarize dropdown shows: the
// word the generator reads, and the label the user sees. The SQL for every one
// of them is written by `sql-builder.ts` (`aggregateExpr`, ANSI) through the
// vendor layer `sql-dialects.ts`.
//
// It lives here, next to the generator, and not inside `SummarizeStep.tsx`, for
// the same reason as `filter-operators.ts`: a test has to be able to walk every
// aggregate the UI offers and check that the generator really writes SQL for it.
// An aggregate offered without a case in the generator falls through to its
// `default:` branch and becomes `WORD(column)` - SQL no database runs.

/** One entry of the Summarize dropdown: the aggregation stored in the widget,
 *  and the label the user reads. */
export interface AggregationDef {
  value: string;
  label: string;
}

/**
 * What Summarize offers.
 *
 * `COUNT DISTINCT` is the everyday question after COUNT and SUM ("how many
 * customers ordered"), and the generator has always written `COUNT(DISTINCT c)`
 * for it - only the dropdown was missing it. Its label is a word rather than
 * SQL, because the user who needs it is the one who does not write SQL.
 *
 * The five SQL words keep their own names as labels: that is how every chart
 * legend, axis title and column header in the product already spells them.
 */
export const AGGREGATIONS: AggregationDef[] = [
  { value: "COUNT",          label: "COUNT" },
  { value: "COUNT DISTINCT", label: "Count distinct" },
  { value: "SUM",            label: "SUM" },
  { value: "AVG",            label: "AVG" },
  { value: "MIN",            label: "MIN" },
  { value: "MAX",            label: "MAX" },
];

/** The aggregations the dropdown offers, as the widget stores them. */
export const AGGREGATION_VALUES = AGGREGATIONS.map((a) => a.value);

/**
 * "% of total": the share one group holds of the whole result (F9).
 *
 * It is not a seventh aggregate but a way of reading one the query already has:
 * the share of a SUM of amount, or of a COUNT of rows. So it rides on the
 * aggregate as a flag, and the generator divides that aggregate by the total of
 * the same aggregate over every group - a window, because the total is a number
 * no single group holds. The SQL is written by `sql-builder.ts`
 * (`percentOfTotalExpr`, ANSI), and the column is named `<alias>_pct`.
 *
 * Absent on every aggregate saved before this existed, which means the plain
 * aggregate the query has always written.
 */
export const SHARE_LABEL = "% of total";

/**
 * "Running total": the aggregate accumulated up to this bucket (F10).
 *
 * Like the share, it is not another aggregate but a way of reading the one the
 * query already has - the money of the year so far, the deals so far - so it
 * rides on the aggregate as a flag too. It only means something in an order,
 * and the order a cumulative line is read in is time: `sql-builder.ts` writes
 * it (`runningTotalExpr`, ANSI) only when the query groups by one time bucket
 * and the aggregate is a SUM or a COUNT (`runsAsRunningTotal`, the one rule),
 * and names the column `<alias>_running`.
 *
 * Absent on every aggregate saved before this existed, which means the plain
 * aggregate the query has always written.
 */
export const RUNNING_TOTAL_LABEL = "running total";

/** The aggregations a running total may be taken of: adding up the buckets of a
 *  SUM or of a COUNT answers the money or the deals so far, while the running
 *  total of an average or of a MIN is not a number anyone asked for. */
export const RUNNING_TOTAL_AGGREGATIONS = ["SUM", "COUNT", "COUNT DISTINCT"];

/**
 * The quick calculations an aggregate can be read as (#11), one at a time:
 * - `change`: its change from the bucket before, in a series over one time bucket
 *   (the same shape a running total needs); the first bucket has none (NULL);
 * - `rank`: its rank among the groups, the largest 1 (ties share a rank).
 * Like the share and the running total, a way of reading the aggregate the query
 * already has; `sql-builder.ts` writes it (`changeExpr`, `rankExpr`, ANSI) under
 * `<alias>_change` / `<alias>_rank`, and only where it means something
 * (`quickCalcOf`, the one rule). Absent on every aggregate saved before it.
 */
export type QuickCalc = "change" | "rank";
export const QUICK_CALCS: { value: QuickCalc; label: string }[] = [
  { value: "change", label: "change vs previous" },
  { value: "rank", label: "rank" },
];
/** The aggregations a quick calculation is offered on: numbers that add or average. */
export const QUICK_CALC_AGGREGATIONS = ["SUM", "AVG", "COUNT", "COUNT DISTINCT"];

/** One entry of the condition dropdown beside an aggregate (F2). */
export interface HavingOpDef {
  value: string;
  label: string;
}

/**
 * The comparisons an aggregate can be kept by: "customers with more than 5
 * orders" is a condition on the COUNT, which no WHERE can express - a WHERE
 * reads a row, and the count exists only once the rows are grouped.
 *
 * Five comparisons and nothing else: an aggregate is a number, and the value is
 * read as a number too (`isCompleteCondition`), so a condition is one operator
 * out of this list and one decimal literal - there is no text of the user's in
 * the SQL. The SQL for it is written by `sql-builder.ts` (ANSI `HAVING`).
 */
export const HAVING_OPS: HavingOpDef[] = [
  { value: ">",  label: ">" },
  { value: ">=", label: "\u2265" },
  { value: "<",  label: "<" },
  { value: "<=", label: "\u2264" },
  { value: "=",  label: "=" },
];

/** The comparisons the dropdown offers, as the widget stores them. */
export const HAVING_OP_VALUES = HAVING_OPS.map((o) => o.value);

/** A condition on one aggregate: the comparison, and the number to compare to.
 *  Absent on every aggregate saved before this existed. */
export interface AggregateCondition {
  operator: string;
  value: string;
}

/**
 * The rows one aggregate is taken over ("Count where", "Sum where", #9): the
 * returned orders counted beside all of them, the web revenue summed beside the
 * total. It is a filter row of the aggregate's own - the Filter step's columns,
 * operators and value rules, written by the same code (`sql-builder.ts`,
 * `conditionFor`) - and the aggregate reads `CASE WHEN <condition> THEN <value>
 * END`, so a row the condition does not keep counts as nothing. Unlike a filter
 * it leaves the other aggregates of the query alone. Absent on every aggregate
 * saved before this existed.
 */
export interface AggregateWhere {
  column: string;
  operator: string;
  value: string;
  valueTo?: string;
}

/** The label of the button that gives an aggregate its own condition. */
export const WHERE_LABEL = "where";

/** True when a condition is finished enough to go into a query: a comparison
 *  this list offers, and a value that is a number. Anything else - a half-typed
 *  box, a word, an operator nobody offered - leaves the query as it was, the
 *  same rule an empty filter value box follows. */
export function isCompleteCondition(condition?: AggregateCondition | null): boolean {
  if (!condition || !HAVING_OP_VALUES.includes(condition.operator)) return false;
  const text = String(condition.value ?? "").trim();
  return text !== "" && Number.isFinite(Number(text));
}
