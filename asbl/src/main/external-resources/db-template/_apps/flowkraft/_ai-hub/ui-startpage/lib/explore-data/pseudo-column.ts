// Lightweight ColumnSchema inferred from a field name + one sample value.
//
// Widgets that only see query results (rows) — not the full table schema
// from `fetchSchema` — use this to feed the semantic predicates
// (`isCurrency`/`isEmail`/etc.) and the formatter dispatch in
// `type-formatters.ts`. The inferred `typeName` maps JS types to the closest
// JDBC-style string that our predicates already understand.

import type { ColumnSchema } from "./types";

/** Build a best-effort ColumnSchema from a field name + a single sample value.
 *  Falls back to VARCHAR when the sample doesn't match a primitive. */
export function pseudoColumnSchema(field: string, sample: unknown): ColumnSchema {
  let typeName: string;
  if (typeof sample === "number") typeName = Number.isInteger(sample) ? "INTEGER" : "DOUBLE";
  else if (typeof sample === "boolean") typeName = "BOOLEAN";
  else if (sample instanceof Date) typeName = "TIMESTAMP";
  else typeName = "VARCHAR";
  return { columnName: field, typeName, isNullable: true };
}
