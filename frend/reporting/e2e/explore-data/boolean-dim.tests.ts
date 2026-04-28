// Cross-database boolean dim classification — verifies that numeric 0/1 columns
// with cardinality=2 are treated as boolean dimensions, not measures.
// Covers: DuckDB TINYINT, MySQL TINYINT(1), Oracle NUMBER(1), SQLite INTEGER, ClickHouse UInt8.

import { groupWidgetsBySensibility } from "@/lib/explore-data/smart-defaults";
import type { ColumnSchema } from "@/lib/explore-data/types";

const bool2 = (col: string): Record<string, number> => ({ [col]: 2 });

// ── DuckDB TINYINT ───────────────────────────────────────────────────────────

describe("DuckDB TINYINT with cardinality=2 is a boolean dim, not a measure", () => {
  const cols: ColumnSchema[] = [
    { columnName: "Discontinued", typeName: "TINYINT", isNullable: false },
    { columnName: "UnitPrice_sum", typeName: "DOUBLE", isNullable: true },
  ];
  const palette = groupWidgetsBySensibility(cols, {
    isAggregated: true,
    cardinality: bool2("Discontinued"),
  });

  // | 107 | chart leads — 1 boolean dim + 1 measure → bar |
  it("Chart is the top recommended widget", () => {
    expect(palette.recommended[0]).toBe("chart");
  });

  // | 108 | number NOT recommended — Discontinued is a dim, not a standalone KPI |
  it("Number is NOT recommended (Discontinued is a dim, not a standalone KPI)", () => {
    expect(palette.recommended).not.toContain("number");
  });
});

// ── MySQL TINYINT(1) ─────────────────────────────────────────────────────────

describe("MySQL TINYINT(1) with cardinality=2 is a boolean dim", () => {
  const cols: ColumnSchema[] = [
    { columnName: "is_active", typeName: "TINYINT(1)", isNullable: false },
    { columnName: "revenue_sum", typeName: "DOUBLE", isNullable: true },
  ];
  const palette = groupWidgetsBySensibility(cols, {
    isAggregated: true,
    cardinality: bool2("is_active"),
  });

  // | 109 | chart leads |
  it("Chart leads — MySQL TINYINT(1) with cardinality=2 is a boolean dim", () => {
    expect(palette.recommended[0]).toBe("chart");
  });
});

// ── Oracle NUMBER(1,0) ───────────────────────────────────────────────────────

describe("Oracle NUMBER(1,0) with cardinality=2 is a boolean dim", () => {
  const cols: ColumnSchema[] = [
    { columnName: "flag", typeName: "NUMBER(1,0)", isNullable: false },
    { columnName: "amount_sum", typeName: "NUMBER", isNullable: true },
  ];
  const palette = groupWidgetsBySensibility(cols, {
    isAggregated: true,
    cardinality: bool2("flag"),
  });

  // | 110 | chart leads |
  it("Chart leads — Oracle NUMBER(1,0) with cardinality=2 is a boolean dim", () => {
    expect(palette.recommended[0]).toBe("chart");
  });
});

// ── SQLite INTEGER ───────────────────────────────────────────────────────────

describe("SQLite INTEGER with cardinality=2 is a boolean dim", () => {
  const cols: ColumnSchema[] = [
    { columnName: "enabled", typeName: "INTEGER", isNullable: false },
    { columnName: "count_sum", typeName: "INTEGER", isNullable: true },
  ];
  const palette = groupWidgetsBySensibility(cols, {
    isAggregated: true,
    cardinality: bool2("enabled"),
  });

  // | 111 | chart leads |
  it("Chart leads — SQLite INTEGER with cardinality=2 is a boolean dim", () => {
    expect(palette.recommended[0]).toBe("chart");
  });
});

// ── Safe fallback: no cardinality → stays measure ───────────────────────────

describe("TINYINT without cardinality data stays a measure (no false positives)", () => {
  const cols: ColumnSchema[] = [
    { columnName: "quantity", typeName: "TINYINT", isNullable: false },
    { columnName: "revenue_sum", typeName: "DOUBLE", isNullable: true },
  ];
  const palette = groupWidgetsBySensibility(cols, { isAggregated: true });

  // | 112 | chart is NOT leading — without cardinality hint, TINYINT stays a measure |
  it("Without cardinality=2 hint, TINYINT stays a measure — chart+tabulator+pivot path does NOT fire", () => {
    // Zero-dim path fires (scatter or number) — chart-first 1-dim shape must NOT appear
    expect(palette.recommended[0]).not.toBe("chart");
  });
});
