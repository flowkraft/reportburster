// Vendor-specific SQL fragments. Each database has its own date-truncation
// syntax; this module centralizes the variations so the SQL builder stays
// readable.
//
// Coverage: SQLite, DuckDB, PostgreSQL, MySQL, MariaDB, ClickHouse, SQL Server,
// Oracle, DB2. The `dbserver.type` string returned by /api/connections/database
// is the key — matched case-insensitively.
//
// Two bucket families are handled by the same `bucketExpr()` entry point:
//   - Truncation (day/week/month/quarter/year) — produces sortable string
//     labels like "2024-03".
//   - Extraction (day-of-week/hour-of-day/month-of-year/quarter-of-year) —
//     produces discrete integers, used for "by hour" / "by weekday" charts.
//
// `numericBucketExpr()` handles numeric binning: FLOOR(col/width)*width (or
// the dialect's idiomatic equivalent).

import type { TimeBucket } from "@/lib/stores/canvas-store";

/** Normalize the dbserver.type strings we care about to a small enum. */
export type SqlDialect =
  | "sqlite"
  | "duckdb"
  | "postgres"
  | "mysql"
  | "mariadb"
  | "clickhouse"
  | "sqlserver"
  | "oracle"
  | "db2";

/** Default fallback for unknown / missing dialect — SQLite (our bundled default). */
const DEFAULT_DIALECT: SqlDialect = "sqlite";

export function dialectFor(connectionType?: string | null): SqlDialect {
  if (!connectionType) return DEFAULT_DIALECT;
  const t = connectionType.toLowerCase();
  if (t.includes("sqlite")) return "sqlite";
  if (t.includes("duckdb")) return "duckdb";
  if (t.includes("postgres") || t.includes("supabase")) return "postgres";
  if (t.includes("mariadb")) return "mariadb";
  if (t.includes("mysql")) return "mysql";
  if (t.includes("clickhouse")) return "clickhouse";
  if (t.includes("sqlserver") || t.includes("mssql") || t.includes("sql server")) return "sqlserver";
  if (t.includes("oracle")) return "oracle";
  if (t.includes("db2")) return "db2";
  return DEFAULT_DIALECT;
}

/**
 * Produce a vendor-appropriate SQL expression for a time bucket (truncation
 * or extraction). The expression is meant to be dropped into a SELECT list.
 * Caller adds `AS <alias>` separately.
 */
export function bucketExpr(column: string, bucket: TimeBucket, dialect: SqlDialect = DEFAULT_DIALECT): string {
  const c = quoteIdent(column, dialect);
  switch (dialect) {
    case "sqlite":
    case "duckdb":
      return sqliteBucket(c, bucket);
    case "postgres":
      return postgresBucket(c, bucket);
    case "mysql":
    case "mariadb":
      return mysqlBucket(c, bucket);
    case "clickhouse":
      return clickhouseBucket(c, bucket);
    case "sqlserver":
      return sqlserverBucket(c, bucket);
    case "oracle":
    case "db2":
      return oracleBucket(c, bucket);
    default:
      return sqliteBucket(c, bucket);
  }
}

/**
 * SQLite has no native DATETIME type. JDBC drivers (xerial sqlite-jdbc and
 * the Hibernate sqlite community dialect) write java.time.LocalDateTime as
 * BIGINT epoch milliseconds — so a column may legitimately hold either:
 *   - integer epoch-ms (e.g. 1710457200000)
 *   - integer epoch-seconds (rare in JDBC writes, common in Unix exports)
 *   - ISO 8601 TEXT ('2024-03-15' or '2024-03-15 00:00:00')
 *   - REAL Julian day numbers
 *
 * strftime() returns NULL for integer inputs without the 'unixepoch' modifier.
 * If the bucket SQL emits raw strftime over an epoch-ms column, every row
 * buckets to NULL, GROUP BY collapses to a single group, and downstream
 * smart-defaults thinks the result is scalar.
 *
 * This normalizer routes per-row by typeof() + magnitude so the bucket SQL
 * works regardless of how the source app stored the date. The typeof()
 * comparison uses lowercase literals which only match SQLite (DuckDB returns
 * uppercase like 'INTEGER'), so the duckdb path falls through to ELSE and
 * keeps its current pass-through behavior.
 *
 * Magnitude threshold 1e12 (~2001-09-09 in epoch ms) cleanly separates ms
 * from seconds without false matches on small integer columns.
 */
export function sqliteDateNormalize(c: string): string {
  return `(CASE
    WHEN typeof(${c}) IN ('integer','real') AND ${c} > 1000000000000
      THEN datetime(${c}/1000, 'unixepoch')
    WHEN typeof(${c}) IN ('integer','real')
      THEN datetime(${c}, 'unixepoch')
    ELSE ${c}
  END)`;
}

function sqliteBucket(c: string, b: TimeBucket): string {
  const n = sqliteDateNormalize(c);
  switch (b) {
    case "day":     return `strftime('%Y-%m-%d', ${n})`;
    case "week":    return `strftime('%Y-W%W', ${n})`;
    case "month":   return `strftime('%Y-%m', ${n})`;
    case "quarter": return `strftime('%Y', ${n}) || '-Q' || ((CAST(strftime('%m', ${n}) AS INTEGER) - 1) / 3 + 1)`;
    case "year":    return `strftime('%Y', ${n})`;
    case "day-of-week":     return `CAST(strftime('%w', ${n}) AS INTEGER)`;
    case "hour-of-day":     return `CAST(strftime('%H', ${n}) AS INTEGER)`;
    case "month-of-year":   return `CAST(strftime('%m', ${n}) AS INTEGER)`;
    case "quarter-of-year": return `((CAST(strftime('%m', ${n}) AS INTEGER) - 1) / 3 + 1)`;
  }
}

function postgresBucket(c: string, b: TimeBucket): string {
  switch (b) {
    case "day":     return `TO_CHAR(${c}, 'YYYY-MM-DD')`;
    case "week":    return `TO_CHAR(${c}, 'IYYY-"W"IW')`;
    case "month":   return `TO_CHAR(${c}, 'YYYY-MM')`;
    case "quarter": return `TO_CHAR(${c}, 'YYYY') || '-Q' || TO_CHAR(${c}, 'Q')`;
    case "year":    return `TO_CHAR(${c}, 'YYYY')`;
    case "day-of-week":     return `EXTRACT(DOW FROM ${c})::INTEGER`;
    case "hour-of-day":     return `EXTRACT(HOUR FROM ${c})::INTEGER`;
    case "month-of-year":   return `EXTRACT(MONTH FROM ${c})::INTEGER`;
    case "quarter-of-year": return `EXTRACT(QUARTER FROM ${c})::INTEGER`;
  }
}

function mysqlBucket(c: string, b: TimeBucket): string {
  switch (b) {
    case "day":     return `DATE_FORMAT(${c}, '%Y-%m-%d')`;
    case "week":    return `DATE_FORMAT(${c}, '%Y-W%v')`;
    case "month":   return `DATE_FORMAT(${c}, '%Y-%m')`;
    case "quarter": return `CONCAT(YEAR(${c}), '-Q', QUARTER(${c}))`;
    case "year":    return `DATE_FORMAT(${c}, '%Y')`;
    // MySQL DAYOFWEEK is 1..7 with Sunday=1; subtract 1 to align with 0..6.
    case "day-of-week":     return `DAYOFWEEK(${c}) - 1`;
    case "hour-of-day":     return `HOUR(${c})`;
    case "month-of-year":   return `MONTH(${c})`;
    case "quarter-of-year": return `QUARTER(${c})`;
  }
}

function clickhouseBucket(c: string, b: TimeBucket): string {
  switch (b) {
    case "day":     return `formatDateTime(${c}, '%F')`;
    case "week":    return `formatDateTime(toMonday(${c}), '%G-W%V')`;
    case "month":   return `formatDateTime(${c}, '%Y-%m')`;
    case "quarter": return `concat(toString(toYear(${c})), '-Q', toString(toQuarter(${c})))`;
    case "year":    return `toString(toYear(${c}))`;
    // ClickHouse toDayOfWeek is Mon=1..Sun=7; map to 0..6 Sun-first to match others.
    case "day-of-week":     return `(toDayOfWeek(${c}) % 7)`;
    case "hour-of-day":     return `toHour(${c})`;
    case "month-of-year":   return `toMonth(${c})`;
    case "quarter-of-year": return `toQuarter(${c})`;
  }
}

function sqlserverBucket(c: string, b: TimeBucket): string {
  // FORMAT() requires SQL Server 2012+. Acceptable for modern deployments.
  switch (b) {
    case "day":     return `FORMAT(${c}, 'yyyy-MM-dd')`;
    case "week":    return `CONCAT(DATEPART(YEAR, ${c}), '-W', RIGHT('0' + CAST(DATEPART(ISO_WEEK, ${c}) AS VARCHAR), 2))`;
    case "month":   return `FORMAT(${c}, 'yyyy-MM')`;
    case "quarter": return `CONCAT(DATEPART(YEAR, ${c}), '-Q', DATEPART(QUARTER, ${c}))`;
    case "year":    return `FORMAT(${c}, 'yyyy')`;
    // SQL Server WEEKDAY is 1..7 but start depends on DATEFIRST; subtract 1
    // to get 0..6 with the current DATEFIRST as day-0.
    case "day-of-week":     return `DATEPART(WEEKDAY, ${c}) - 1`;
    case "hour-of-day":     return `DATEPART(HOUR, ${c})`;
    case "month-of-year":   return `DATEPART(MONTH, ${c})`;
    case "quarter-of-year": return `DATEPART(QUARTER, ${c})`;
  }
}

function oracleBucket(c: string, b: TimeBucket): string {
  // Oracle/DB2 share TO_CHAR syntax.
  switch (b) {
    case "day":     return `TO_CHAR(${c}, 'YYYY-MM-DD')`;
    case "week":    return `TO_CHAR(${c}, 'IYYY') || '-W' || TO_CHAR(${c}, 'IW')`;
    case "month":   return `TO_CHAR(${c}, 'YYYY-MM')`;
    case "quarter": return `TO_CHAR(${c}, 'YYYY') || '-Q' || TO_CHAR(${c}, 'Q')`;
    case "year":    return `TO_CHAR(${c}, 'YYYY')`;
    // Oracle TO_CHAR 'D' is 1..7 with locale-dependent start; subtract 1.
    case "day-of-week":     return `TO_NUMBER(TO_CHAR(${c}, 'D')) - 1`;
    case "hour-of-day":     return `EXTRACT(HOUR FROM ${c})`;
    case "month-of-year":   return `EXTRACT(MONTH FROM ${c})`;
    case "quarter-of-year": return `TO_NUMBER(TO_CHAR(${c}, 'Q'))`;
  }
}

/**
 * Numeric binning: FLOOR(col / width) * width. Aliased back to the original
 * column name by the SQL builder. ClickHouse prefers intDiv for integer inputs
 * but FLOOR works across all its numeric types, so we keep the portable form.
 */
export function numericBucketExpr(column: string, width: number, dialect: SqlDialect = DEFAULT_DIALECT): string {
  const c = quoteIdent(column, dialect);
  const w = Number.isFinite(width) && width > 0 ? width : 1;
  return `FLOOR(${c} / ${w}) * ${w}`;
}

/**
 * Quote an identifier using the dialect's convention. Only applies quoting when
 * the name contains characters that would otherwise be ambiguous.
 * Note: MySQL/MariaDB use backticks; SQL Server uses brackets; most others use
 * double quotes.
 */
export function quoteIdent(name: string, dialect: SqlDialect = DEFAULT_DIALECT): string {
  switch (dialect) {
    case "mysql":
    case "mariadb":
      return `\`${name.replace(/`/g, "``")}\``;
    case "sqlserver":
      return `[${name.replace(/\]/g, "]]")}]`;
    default:
      return `"${name.replace(/"/g, '""')}"`;
  }
}
