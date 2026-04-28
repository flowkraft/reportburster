// Java backend response types

export interface SchemaInfo {
  notes: string | null;
  tables: TableSchema[];
}

/** Mirrors Java `ForeignKeySchema` DTO. */
export interface ForeignKeySchema {
  fkName?: string;
  fkColumnName: string;
  pkTableName?: string;
  pkColumnName?: string;
}

export interface TableSchema {
  tableName: string;
  tableType: "TABLE" | "VIEW";
  columns: ColumnSchema[];
  primaryKeyColumns: string[];
  /** Foreign-key metadata from the backend DTO — when present, `isIdColumn`
   *  uses `fkColumnName` entries as authoritative FK hints, catching cases
   *  where the name doesn't match the `/id|code|key$/i` pattern (e.g.,
   *  `ShipVia` in Orders → FK to `Shippers`). */
  foreignKeys?: ForeignKeySchema[];
}

export interface ColumnSchema {
  columnName: string;
  typeName: string;
  isNullable: boolean;
  /** Optional semantic-type hint, set by the value-fingerprint probe in
   *  `probeSemanticType`. When present, predicates like `isEmail`/`isURL`/
   *  `isState`/`isJson` consult this first — it catches columns whose names
   *  don't match our regexes but whose values clearly belong to a known type
   *  (e.g., a `contact` column holding all emails). Populated by fingerprinting
   *  a sample of rows against per-type value matchers. */
  semanticHint?: SemanticHint;
}

export type SemanticHint =
  | "email" | "url" | "image_url" | "avatar_url"
  | "state" | "country" | "city" | "zip_code"
  | "latitude" | "longitude"
  | "currency" | "percentage"
  | "json";

export interface ConnectionInfo {
  connectionCode: string;
  connectionName: string;
  defaultConnection?: boolean;
  dbserver: { type: string; database: string };
}

export interface QueryResult {
  data: Record<string, unknown>[];
  rowCount: number;
}
