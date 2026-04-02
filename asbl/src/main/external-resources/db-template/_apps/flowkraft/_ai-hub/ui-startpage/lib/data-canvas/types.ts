// Java backend response types

export interface SchemaInfo {
  notes: string | null;
  tables: TableSchema[];
}

export interface TableSchema {
  tableName: string;
  tableType: "TABLE" | "VIEW";
  columns: ColumnSchema[];
  primaryKeyColumns: string[];
}

export interface ColumnSchema {
  columnName: string;
  typeName: string;
  isNullable: boolean;
}

export interface ConnectionInfo {
  connectionCode: string;
  connectionName: string;
  dbserver: { type: string; database: string };
}

export interface QueryResult {
  data: Record<string, unknown>[];
  rowCount: number;
}
