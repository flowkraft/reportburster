// Pivot parity tests — verifies pivot is recommended for 1-dim shapes where
// The reference tool also shows pivot (at the tail). Covers the 3 gaps we closed:
//   1. 1-dim + 1-measure (categorical)
//   2. 1-dim + 1-measure (temporal)
//   3. 1-dim + 0-measures (dims only)

import { groupWidgetsBySensibility } from "@/lib/explore-data/smart-defaults";
import type { ColumnSchema } from "@/lib/explore-data/types";

import {
  SHAPE_CAT_MEASURE_1DIM_RB,
  SHAPE_DATE_MEASURE_1DIM_RB,
  SHAPE_DIM_ONLY_1DIM_RB,
} from "./fixtures/northwind.fixture";

// ── 1-dim + 1-measure (categorical) ─────────────────────────────────────────

describe("Reference parity: pivot in recommended for 1 categorical dim + 1 measure", () => {
  const cols: ColumnSchema[] = [
    { columnName: "CategoryName", typeName: "VARCHAR", isNullable: true },
    { columnName: "product_count", typeName: "DOUBLE",  isNullable: true },
  ];
  const palette = groupWidgetsBySensibility(cols, { isAggregated: true, rowCount: 8 });

  // | 84 | 1-cat-dim + 1-measure → pivot at tail of recommended |
  it("Pivot IS in recommended for 1 categorical dim + 1 measure", () => {
    expect(palette.recommended).toContain("pivot");
  });

  // | 85 | Pivot at tail — chart leads |
  it("Pivot is at the TAIL — chart leads for cat+measure", () => {
    const chartIdx = palette.recommended.indexOf("chart");
    const pivotIdx  = palette.recommended.indexOf("pivot");
    expect(chartIdx).toBeLessThan(pivotIdx);
  });

  // | 86 | Pivot NOT in nonsensible |
  it("Pivot is NOT in nonsensible (hidden) bucket for 1-dim+measure", () => {
    expect(palette.nonsensible).not.toContain("pivot");
  });

  // | 87 | Full palette matches SHAPE_CAT_MEASURE_1DIM_RB |
  it("Full recommended palette matches SHAPE_CAT_MEASURE_1DIM_RB fixture", () => {
    expect(palette.recommended).toEqual(SHAPE_CAT_MEASURE_1DIM_RB);
  });
});

// ── 1-dim + 1-measure (temporal) ────────────────────────────────────────────

describe("Reference parity: pivot in recommended for 1 temporal dim + 1 measure", () => {
  const cols: ColumnSchema[] = [
    { columnName: "order_month",   typeName: "DATE",   isNullable: true },
    { columnName: "total_freight", typeName: "DOUBLE", isNullable: true },
  ];
  const palette = groupWidgetsBySensibility(cols, { isAggregated: true, rowCount: 18 });

  // | 88 | 1-temporal-dim + 1-measure → pivot at tail |
  it("Pivot IS in recommended for 1 temporal dim + 1 measure", () => {
    expect(palette.recommended).toContain("pivot");
  });

  // | 89 | Chart leads, trend 2nd, pivot at tail |
  it("Chart leads, pivot is at the tail — time-series chart still wins", () => {
    const chartIdx = palette.recommended.indexOf("chart");
    const pivotIdx  = palette.recommended.indexOf("pivot");
    expect(chartIdx).toBeLessThan(pivotIdx);
  });

  // | 90 | Pivot NOT in nonsensible |
  it("Pivot is NOT in nonsensible (hidden) bucket for temporal 1-dim+measure", () => {
    expect(palette.nonsensible).not.toContain("pivot");
  });

  // | 91 | Full palette matches SHAPE_DATE_MEASURE_1DIM_RB |
  it("Full recommended palette matches SHAPE_DATE_MEASURE_1DIM_RB fixture", () => {
    expect(palette.recommended).toEqual(SHAPE_DATE_MEASURE_1DIM_RB);
  });
});

// ── 1-dim + 0-measures (dims only) ──────────────────────────────────────────

describe("Reference parity: pivot in recommended for 1-dim + 0 measures (dims-only browse)", () => {
  const cols: ColumnSchema[] = [
    { columnName: "CategoryName", typeName: "VARCHAR", isNullable: true },
  ];
  const palette = groupWidgetsBySensibility(cols, { isAggregated: true, rowCount: 8 });

  // | 92 | 1-dim + 0-measures → pivot in recommended |
  it("Pivot IS in recommended for 1 dim + 0 measures", () => {
    expect(palette.recommended).toContain("pivot");
  });

  // | 93 | Tabulator leads dims-only list — chart requires measures (Reference parity: "table" leads) |
  it("Tabulator leads the dims-only recommended list (no measures → chart not sensible)", () => {
    expect(palette.recommended[0]).toBe("tabulator");
  });

  // | 94 | Pivot NOT in nonsensible for dims-only |
  it("Pivot is NOT in nonsensible (hidden) bucket for dims-only", () => {
    expect(palette.nonsensible).not.toContain("pivot");
  });

  // | 95 | Full palette matches SHAPE_DIM_ONLY_1DIM_RB |
  it("Full recommended palette matches SHAPE_DIM_ONLY_1DIM_RB fixture", () => {
    expect(palette.recommended).toEqual(SHAPE_DIM_ONLY_1DIM_RB);
  });
});

// ── Guard: 2-dim shapes still work (regression) ─────────────────────────────

describe("Regression: pivot still recommended for 2-dim + measure (existing behavior preserved)", () => {
  const cols: ColumnSchema[] = [
    { columnName: "CategoryName", typeName: "VARCHAR", isNullable: true },
    { columnName: "SupplierName", typeName: "VARCHAR", isNullable: true },
    { columnName: "revenue",      typeName: "DOUBLE",  isNullable: true },
  ];
  const palette = groupWidgetsBySensibility(cols, { isAggregated: true, rowCount: 20 });

  // | 96 | 2-cat-dims + measure → pivot still in recommended |
  it("Pivot is still recommended for 2 categorical dims + measure", () => {
    expect(palette.recommended).toContain("pivot");
  });
});

// ── Guard: unaggregated data still excludes pivot ────────────────────────────

describe("Regression: pivot NOT recommended for unaggregated (raw) data", () => {
  const cols: ColumnSchema[] = [
    { columnName: "ProductName", typeName: "VARCHAR", isNullable: true },
    { columnName: "UnitPrice",   typeName: "DOUBLE",  isNullable: true },
  ];
  const palette = groupWidgetsBySensibility(cols, { isAggregated: false, rowCount: 77 });

  // | 97 | Unaggregated → pivot nonsensible |
  it("Pivot is nonsensible for unaggregated (raw) data — cross-tab of raw rows is meaningless", () => {
    expect(palette.nonsensible).toContain("pivot");
    expect(palette.recommended).not.toContain("pivot");
  });
});
