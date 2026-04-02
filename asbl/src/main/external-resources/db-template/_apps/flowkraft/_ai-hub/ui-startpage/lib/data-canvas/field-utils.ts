// Tableau-inspired field type classification
// Dimensions (blue) = text, date, boolean — the WHO/WHAT/WHERE/WHEN
// Measures (green) = numbers — the HOW MUCH

import type { ColumnSchema } from "./types";

export type FieldKind = "dimension" | "measure";

const NUMERIC_TYPES = new Set([
  "INTEGER", "INT", "BIGINT", "SMALLINT", "TINYINT",
  "FLOAT", "DOUBLE", "REAL", "DECIMAL", "NUMERIC",
  "NUMBER", "MONEY", "INT4", "INT8", "INT2",
  "FLOAT4", "FLOAT8", "HUGEINT", "UINTEGER", "UBIGINT",
]);

export function getFieldKind(column: ColumnSchema): FieldKind {
  const type = (column.typeName || "").toUpperCase().split("(")[0].trim();
  return NUMERIC_TYPES.has(type) ? "measure" : "dimension";
}

// CSS classes for field type colors
export function getFieldColorClass(kind: FieldKind): string {
  return kind === "measure" ? "text-emerald-500" : "text-blue-500";
}

export function getFieldBgClass(kind: FieldKind): string {
  return kind === "measure" ? "bg-emerald-500/10 border-emerald-500/20" : "bg-blue-500/10 border-blue-500/20";
}
