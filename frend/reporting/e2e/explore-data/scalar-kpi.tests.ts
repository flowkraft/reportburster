// Scalar KPI scenarios — verifies widget recommendations for single-row aggregations.
// Covers two distinct cases:
//   1. 0 dims + 1 measure  → number/gauge/progress  (classic KPI card)
//   2. 0 dims + 2+ measures → tabulator/detail        (all metrics visible, reference parity)

import { groupWidgetsBySensibility } from "@/lib/explore-data/smart-defaults";
import type { ColumnSchema } from "@/lib/explore-data/types";

import {
  SHAPE_SCALAR_KPI_RB,
  SHAPE_SCALAR_KPI_MULTI_RB,
} from "./fixtures/northwind.fixture";

// ── 0 dims + 1 measure (classic scalar KPI) ─────────────────────────────────

describe("Single scalar KPI (0 dims + 1 measure, rowCount=1)", () => {
  const cols: ColumnSchema[] = [
    { columnName: "Freight_sum", typeName: "DOUBLE", isNullable: true },
  ];
  const palette = groupWidgetsBySensibility(cols, { isAggregated: true, rowCount: 1 });

  // | 98 | Single KPI — number leads |
  it("Number, Gauge, Progress are all recommended for a single KPI", () => {
    expect(palette.recommended).toContain("number");
    expect(palette.recommended).toContain("gauge");
    expect(palette.recommended).toContain("progress");
  });

  // | 99 | Full palette matches SHAPE_SCALAR_KPI_RB |
  it("Full recommended palette matches SHAPE_SCALAR_KPI_RB fixture", () => {
    expect(palette.recommended).toEqual(SHAPE_SCALAR_KPI_RB);
  });
});

// ── 0 dims + 2 measures (multi-KPI row) ─────────────────────────────────────

describe("Multiple scalar KPIs (0 dims + 2 measures, rowCount=1) — reference parity", () => {
  const cols: ColumnSchema[] = [
    { columnName: "Freight_sum",   typeName: "DOUBLE", isNullable: true },
    { columnName: "OrderID_count", typeName: "DOUBLE", isNullable: true },
  ];
  const palette = groupWidgetsBySensibility(cols, { isAggregated: true, rowCount: 1 });

  // | 100 | tabulator is #1 — shows ALL metrics (reference: "table" first) |
  it("Tabulator is the top recommended widget — shows all metrics without loss", () => {
    expect(palette.recommended[0]).toBe("tabulator");
  });

  // | 101 | detail is recommended — key-value view of the single row |
  it("Detail is recommended (key-value view — reference parity: 'object')", () => {
    expect(palette.recommended).toContain("detail");
  });

  // | 102 | chart is nonsensible — scatter of 1 data point is meaningless |
  it("Chart is nonsensible for rowCount=1 (scatter of a single point is meaningless)", () => {
    expect(palette.nonsensible).toContain("chart");
    expect(palette.recommended).not.toContain("chart");
  });

  // | 103 | number is NOT recommended — would silently drop second metric |
  it("Number is NOT recommended — picks only first metric, second is lost", () => {
    expect(palette.recommended).not.toContain("number");
  });

  // | 104 | Full palette matches SHAPE_SCALAR_KPI_MULTI_RB |
  it("Full recommended palette matches SHAPE_SCALAR_KPI_MULTI_RB fixture", () => {
    expect(palette.recommended).toEqual(SHAPE_SCALAR_KPI_MULTI_RB);
  });
});

// ── Regression: 0 dims + 3 measures also gets tabulator+detail ──────────────

describe("Three scalar KPIs (0 dims + 3 measures, rowCount=1) — same tabulator-first rule", () => {
  const cols: ColumnSchema[] = [
    { columnName: "Freight_sum",   typeName: "DOUBLE", isNullable: true },
    { columnName: "OrderID_count", typeName: "DOUBLE", isNullable: true },
    { columnName: "avg_freight",   typeName: "DOUBLE", isNullable: true },
  ];
  const palette = groupWidgetsBySensibility(cols, { isAggregated: true, rowCount: 1 });

  // | 105 | tabulator leads for 3 measures too |
  it("Tabulator is still #1 for 3 measures — same 'show all' logic", () => {
    expect(palette.recommended[0]).toBe("tabulator");
  });

  // | 106 | number NOT recommended — would show only first of three |
  it("Number is NOT recommended for 3 measures", () => {
    expect(palette.recommended).not.toContain("number");
  });
});
