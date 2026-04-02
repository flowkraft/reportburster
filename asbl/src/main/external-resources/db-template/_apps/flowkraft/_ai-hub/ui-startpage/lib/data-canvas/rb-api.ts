// Client for ReportBurster Java backend (port 8123)

import type { SchemaInfo, ConnectionInfo, QueryResult } from "./types";

const RB_BASE = process.env.NEXT_PUBLIC_RB_API_URL || "http://localhost:8123/api";

export async function fetchConnections(): Promise<ConnectionInfo[]> {
  const res = await fetch(`${RB_BASE}/reports/load-connection-database-all`);
  if (!res.ok) throw new Error("Failed to load connections");
  return res.json();
}

export async function fetchSchema(connectionId: string): Promise<SchemaInfo> {
  const res = await fetch(`${RB_BASE}/queries/schema/${encodeURIComponent(connectionId)}`);
  if (!res.ok) throw new Error("Failed to load schema");
  return res.json();
}

export async function executeQuery(connectionId: string, sql: string): Promise<QueryResult> {
  const res = await fetch(`${RB_BASE}/queries/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ connectionId, sql }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Query failed");
  }
  return res.json();
}

// --- Associative exploration ---

export interface ExploreSelection {
  field: string;
  value: string;
}

export interface ExploreFieldState {
  associated: string[];
  excluded: string[];
}

export interface ExploreResponse {
  fieldStates: Record<string, ExploreFieldState>;
  metadata: {
    executionTimeMs: number;
    engine: string;
    cached: boolean;
    hint?: string;
  };
}

/**
 * Compute associated/excluded values per field given active selections.
 * Works transparently across DuckDB, ClickHouse, and regular SQL databases.
 */
export async function exploreAssociations(
  connectionCode: string,
  tableName: string,
  selections: ExploreSelection[],
  fields: string[],
): Promise<ExploreResponse> {
  const res = await fetch(`${RB_BASE}/analytics/explore`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ connectionCode, tableName, selections, fields }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Explore failed");
  }
  return res.json();
}
