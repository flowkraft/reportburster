// Builds SQL from visual query steps

import type { VisualQuery } from "@/lib/stores/canvas-store";

export function buildSql(query: VisualQuery): string {
  if (!query.table) return "";

  const hasAgg = query.summarize.length > 0;
  const selectParts: string[] = [];

  if (hasAgg) {
    // Group-by columns first
    for (const col of query.groupBy) {
      selectParts.push(quote(col));
    }
    // Then aggregations
    for (const agg of query.summarize) {
      selectParts.push(`${agg.aggregation}(${quote(agg.field)}) AS ${quote(agg.field + "_" + agg.aggregation.toLowerCase())}`);
    }
  }

  const select = selectParts.length > 0 ? selectParts.join(", ") : "*";
  let sql = `SELECT ${select}\nFROM ${quote(query.table)}`;

  // WHERE
  if (query.filters.length > 0) {
    const conditions = query.filters.map((f) => {
      const col = quote(f.column);
      switch (f.operator) {
        case "equals": return `${col} = '${esc(f.value)}'`;
        case "not_equals": return `${col} != '${esc(f.value)}'`;
        case "contains": return `${col} LIKE '%${esc(f.value)}%'`;
        case "starts_with": return `${col} LIKE '${esc(f.value)}%'`;
        case "ends_with": return `${col} LIKE '%${esc(f.value)}'`;
        case "greater_than": return `${col} > '${esc(f.value)}'`;
        case "greater_or_equal": return `${col} >= '${esc(f.value)}'`;
        case "less_than": return `${col} < '${esc(f.value)}'`;
        case "less_or_equal": return `${col} <= '${esc(f.value)}'`;
        case "between": return `${col} BETWEEN '${esc(f.value)}' AND '${esc(f.valueTo || '')}'`;
        case "is_null": return `${col} IS NULL`;
        case "is_not_null": return `${col} IS NOT NULL`;
        default: return `${col} = '${esc(f.value)}'`;
      }
    });
    sql += `\nWHERE ${conditions.join("\n  AND ")}`;
  }

  // GROUP BY
  if (hasAgg && query.groupBy.length > 0) {
    sql += `\nGROUP BY ${query.groupBy.map(quote).join(", ")}`;
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

function quote(name: string): string {
  // Quote identifiers that have spaces or special chars
  if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) return name;
  return `"${name}"`;
}

function esc(value: string): string {
  return value.replace(/'/g, "''");
}
