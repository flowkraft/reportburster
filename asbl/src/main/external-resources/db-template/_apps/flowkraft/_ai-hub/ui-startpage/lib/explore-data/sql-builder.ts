// Builds SQL from visual query steps.
//
// All identifiers (table, columns, aliases) are quoted via quoteIdent(name, dialect)
// from sql-dialects.ts. This makes SQL correct regardless of how tables/columns were
// named at creation time (upper, lower, mixed, spaces) and regardless of DB vendor —
// double-quotes for PostgreSQL/DuckDB/SQLite, backticks for MySQL/MariaDB, brackets
// for SQL Server.
//
// Time bucketing is vendor-aware: when `groupByBuckets[col]` is set, the
// column is replaced with a date-truncation or date-extraction expression
// chosen by the connection's dialect. Numeric binning (`groupByNumericBuckets`)
// replaces the column with `FLOOR(col/width)*width`. Both forms are aliased to
// the original column name so downstream code sees the same identifier.

import type { DataSource, VisualQuery } from "@/lib/stores/canvas-store";
import { bucketExpr, numericBucketExpr, quoteIdent, dialectFor, type SqlDialect } from "./sql-dialects";
import { nicerBinWidth } from "./smart-defaults";

/** Returns true if the value is a canvas parameter reference: `${paramName}`. */
export function isParamRef(value: string): boolean {
  return /^\$\{\w+\}$/.test((value ?? "").trim());
}

/**
 * Extracts parameter IDs from a `filterDsl` Groovy string via regex.
 * Used to populate the "bind to parameter" toggle in VisualQueryBuilder's
 * FilterStep without needing a backend round-trip.
 */
export function extractParamIds(dsl: string): string[] {
  if (!dsl?.trim()) return [];
  return [...dsl.matchAll(/\bid:\s*['"](\w+)['"]/g)].map((m) => m[1]);
}

/**
 * Scan the visual query's filter list for bounds on `col`. Returns the
 * tightest `[min, max]` span expressed by any `>`/`>=`/`<`/`<=`/`between`
 * filter on the same column, or `null` if none apply. The SQL builder uses
 * this to recompute a tighter bin width when the user narrows the column
 * via a filter — bins follow the visible range, not the full table span.
 */
function filterBoundsForColumn(
  filters: VisualQuery["filters"],
  col: string,
): { min: number; max: number } | null {
  let min: number | undefined;
  let max: number | undefined;
  for (const f of filters) {
    if (f.column !== col) continue;
    const v = Number(f.value);
    const v2 = f.valueTo != null ? Number(f.valueTo) : NaN;
    const op = (f.operator || "").toLowerCase();
    // `>` / `>=` → raise min; `<` / `<=` → lower max; `between` → both.
    if ((op === ">" || op === ">=" || op === "gt" || op === "gte") && Number.isFinite(v)) {
      min = min == null ? v : Math.max(min, v);
    } else if ((op === "<" || op === "<=" || op === "lt" || op === "lte") && Number.isFinite(v)) {
      max = max == null ? v : Math.min(max, v);
    } else if ((op === "between" || op === "btw") && Number.isFinite(v) && Number.isFinite(v2)) {
      min = min == null ? v : Math.max(min, v);
      max = max == null ? v2 : Math.min(max, v2);
    } else if (op === "=" || op === "eq") {
      // Equality filter collapses the range — not useful for binning.
      if (Number.isFinite(v)) { min = v; max = v; }
    }
  }
  if (min == null || max == null || !(max > min)) return null;
  return { min, max };
}

export interface BuildSqlOptions {
  /** Optional connection type (from `dbserver.type`) to drive dialect choice.
   *  If omitted, defaults to SQLite — matches the bundled Northwind sample. */
  connectionType?: string | null;
}

export function buildSql(query: VisualQuery, options: BuildSqlOptions = {}): string {
  // Cube-bound widgets do not generate SQL here — the cube renderer
  // (rb-cube-renderer) drives its own SQL via /api/cubes/{id}/generate-sql.
  if (query.kind === "cube") return "";
  if (!query.table) return "";

  const dialect: SqlDialect = dialectFor(options.connectionType);
  const hasAgg = query.summarize.length > 0;
  const timeBuckets = query.groupByBuckets ?? {};
  const numericBuckets = query.groupByNumericBuckets ?? {};
  const selectParts: string[] = [];

  const quote = (name: string) => quoteIdent(name, dialect);

  const bucketedSelectExpr = (col: string): string | null => {
    const t = timeBuckets[col];
    if (t) return bucketExpr(col, t, dialect);
    const n = numericBuckets[col];
    if (n) {
      // Filter-aware refinement: when the user's pick captured an intent
      // (numBins) AND there's a narrowing filter on the column, recompute
      // the bin width over the tighter range. Without a filter or intent
      // we fall back to the stored width.
      let width = n.width;
      if (typeof n.numBins === "number" && n.numBins > 0) {
        const bounds = filterBoundsForColumn(query.filters, col);
        if (bounds) {
          const refined = nicerBinWidth(bounds.min, bounds.max, n.numBins);
          if (Number.isFinite(refined) && refined > 0) width = refined;
        }
      }
      return numericBucketExpr(col, width, dialect);
    }
    return null;
  };

  const bucketSelect = (col: string): string => {
    const expr = bucketedSelectExpr(col);
    if (!expr) return quote(col);
    return `${expr} AS ${quote(col)}`;
  };

  const bucketGroupBy = (col: string): string => {
    const expr = bucketedSelectExpr(col);
    return expr ?? quote(col);
  };

  if (hasAgg) {
    for (const col of query.groupBy) {
      selectParts.push(bucketSelect(col));
    }
    for (const agg of query.summarize) {
      const fn = agg.aggregation.toUpperCase();
      const isCountStar = fn === "COUNT" && agg.field === "*";
      const expr = isCountStar ? "COUNT(*)" : `${fn}(${quote(agg.field)})`;
      const aliasField = isCountStar ? "count" : agg.field + "_" + agg.aggregation.toLowerCase();
      selectParts.push(`${isCountStar ? expr : `ROUND(${expr}, 4)`} AS ${quote(aliasField)}`);
    }
  }

  const select = selectParts.length > 0 ? selectParts.join(", ") : "*";
  let sql = `SELECT ${select}\nFROM ${quote(query.table)}`;

  // WHERE
  if (query.filters.length > 0) {
    const conditions = query.filters.map((f) => {
      const col = quote(f.column);
      const param = isParamRef(f.value);
      switch (f.operator) {
        case "equals":          return param ? `${col} = ${f.value}`   : `${col} = '${esc(f.value)}'`;
        case "not_equals":      return param ? `${col} != ${f.value}`  : `${col} != '${esc(f.value)}'`;
        case "greater_than":    return param ? `${col} > ${f.value}`   : `${col} > '${esc(f.value)}'`;
        case "greater_or_equal":return param ? `${col} >= ${f.value}`  : `${col} >= '${esc(f.value)}'`;
        case "less_than":       return param ? `${col} < ${f.value}`   : `${col} < '${esc(f.value)}'`;
        case "less_or_equal":   return param ? `${col} <= ${f.value}`  : `${col} <= '${esc(f.value)}'`;
        case "contains":        return `${col} LIKE '%${esc(f.value)}%'`;
        case "starts_with":     return `${col} LIKE '${esc(f.value)}%'`;
        case "ends_with":       return `${col} LIKE '%${esc(f.value)}'`;
        case "between":         return `${col} BETWEEN '${esc(f.value)}' AND '${esc(f.valueTo || '')}'`;
        case "is_null":         return `${col} IS NULL`;
        case "is_not_null":     return `${col} IS NOT NULL`;
        default:                return param ? `${col} = ${f.value}`   : `${col} = '${esc(f.value)}'`;
      }
    });
    sql += `\nWHERE ${conditions.join("\n  AND ")}`;
  }

  // GROUP BY (using dialect-specific bucket expressions when applicable)
  if (hasAgg && query.groupBy.length > 0) {
    sql += `\nGROUP BY ${query.groupBy.map(bucketGroupBy).join(", ")}`;
  }

  // ORDER BY
  if (query.sort.length > 0) {
    const parts = query.sort.map((s) => `${quote(s.column)} ${s.direction}`);
    sql += `\nORDER BY ${parts.join(", ")}`;
  }

  // LIMIT
  if (query.limit > 0) {
    sql += `\nLIMIT ${query.limit}`;
  }

  return sql;
}

function esc(value: string): string {
  return value.replace(/'/g, "''");
}

/** Resolve the dataSource's raw SQL text — visual-mode buildSql result falling
 *  through to generatedSql for cube queries, direct sql for sql/ai-sql mode,
 *  and generatedSql as last resort. `${paramName}` placeholders are preserved
 *  verbatim; the backend resolves them via JDBI named-parameter binding
 *  (QueriesService → DatabaseHelper.convertToJdbiParameters).
 *
 *  Shared by useWidgetData (widget render / store write) and ConfigPanel's
 *  manual "Detect columns from query" path — one source of truth for
 *  dataSource → raw SQL. */
export function sqlForDataSource(
  ds: DataSource,
  connectionType: string | null,
): string | null {
  if (ds.mode === "visual" && ds.visualQuery) {
    const built = buildSql(ds.visualQuery, { connectionType });
    if (built) return built;
    // buildSql returns "" for cube queries — fall through.
  }
  if ((ds.mode === "sql" || ds.mode === "ai-sql") && ds.sql) {
    return ds.sql;
  }
  return ds.generatedSql || null;
}
