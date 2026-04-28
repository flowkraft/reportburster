// Single-number scenarios — executive KPI questions. Each returns a
// one-row-one-measure result. The palette surfaces Number, Gauge, Progress
// as the full ordered recommendation list (mirroring the reference system's
// [scalar, gauge, progress] widget family).

import {
  groupWidgetsBySensibility,
  pickGaugeField,
  pickProgressField,
  pickProgressGoal,
  autoPickMeasure,
} from "@/lib/explore-data/smart-defaults";

import {
  totalFreightKpiColumns,
  totalFreightKpiResult,
  orderCountKpiColumns,
  orderCountKpiResult,
  totalRevenueKpiColumns,
  totalRevenueKpiResult,
  SHAPE_SCALAR_KPI_RB,
  REFERENCE_SHAPE_SCALAR_KPI,
} from "./fixtures/northwind.fixture";

import { canonicalize } from "./helpers/canonicalize";

describe("Andrew (VP Sales) asks 'what did we spend on freight this year?' — SUM(Freight)", () => {
  const palette = groupWidgetsBySensibility(totalFreightKpiColumns, {
    isAggregated: true,
    rowCount: totalFreightKpiResult.rowCount,
  });

  // | 20 | Total Freight KPI | 1 row × 1 measure |
  // | RB: `[number, gauge, progress]` (full ordered) |
  // | ref: `[scalar, progress, gauge, table]` (rows≤1 → all isSensible skipped; scalar/progress/gauge/table pass) |
  it("Andrew sees — in order — Number, Gauge, Progress", () => {
    expect(palette.recommended).toEqual(SHAPE_SCALAR_KPI_RB);
    // Reference parity — intentional divergence:
    //   ref canonical = [gauge, number, progress, tabulator] (includes table for rows≤1 branch)
    //   RB canonical  = [gauge, number, progress] — tabulator omitted (1-row grid adds no value)
    //   Also: ref has progress before gauge; RB has gauge before progress (cosmetic only).
    expect(canonicalize(REFERENCE_SHAPE_SCALAR_KPI).sort())
      .toEqual(["gauge", "number", "progress", "tabulator"]);
    // Shared core: number, gauge, progress all present in both
    expect(palette.recommended).toContain("number");
    expect(palette.recommended).toContain("gauge");
    expect(palette.recommended).toContain("progress");
  });

  // | 21 | Total Freight — Chart/Pivot NOT recommended | Same |
  // | RB: chart + pivot in nonsensible (rowCount=1 < 2); tabulator in sensible |
  // | ref: includes table in recommended for KPIs; RB keeps it sensible |
  it("Chart and Pivot are pushed to 'More widgets' — can't chart a single value (rowCount=1)", () => {
    expect(palette.nonsensible).toContain("chart");
    expect(palette.nonsensible).toContain("pivot");
  });

  it("Table (tabulator) is in 'sensible' — a 1-row grid is valid, just not the primary KPI view", () => {
    expect(palette.sensible).toContain("tabulator");
    expect(palette.recommended).not.toContain("tabulator");
  });
});

describe("Internal: Gauge widget picks the right column", () => {
  // | 22 | Gauge auto-picks measure | `[{total_freight: 4237.82}]` |
  // | `pickGaugeField(...).field === "total_freight"` |
  it("Gauge auto-picks 'total_freight' — the only measure in the result", () => {
    const { field } = pickGaugeField(totalFreightKpiColumns);
    expect(field).toBe("total_freight");
  });

  // | 23 | Progress same measure | Same |
  // | `pickProgressField(...).field === "total_freight"` |
  it("Progress picks 'total_freight' too (shared measure-pick logic)", () => {
    const { field } = pickProgressField(totalFreightKpiColumns);
    expect(field).toBe("total_freight");
  });

  // | 24 | Shared measure-pick | Same | `autoPickMeasure(...).columnName === "total_freight"` |
  it("autoPickMeasure returns the same 'total_freight'", () => {
    const measure = autoPickMeasure(totalFreightKpiColumns);
    expect(measure?.columnName).toBe("total_freight");
  });
});

describe("Progress widget auto-derives a 'nice round' goal", () => {
  // | 25 | Progress goal 80→100 | value=80 | `pickProgressGoal(80) === 100` |
  it("80 → goal 100 (80 × 1.25 rounded up)", () => {
    expect(pickProgressGoal(80)).toBe(100);
  });

  // | 26 | Progress goal 1200→2000 | value=1200 | `pickProgressGoal(1200) === 2000` |
  it("1200 → goal 2000", () => {
    expect(pickProgressGoal(1200)).toBe(2000);
  });

  // | 27 | Progress goal 4237→5000 | value=4237 | `pickProgressGoal(4237) === 5000` |
  // value=4237, mag=1000, norm=4.237 → next nice above 4.237 is 5 → 5×1000=5000
  it("4237 (matches real total freight) → goal 5000 (next nice above 4.237 × 1000)", () => {
    expect(pickProgressGoal(4237)).toBe(5000);
  });

  // | 28 | Progress goal 0→100 fallback | value=0 | `pickProgressGoal(0) === 100` |
  it("0 → goal 100 fallback (never divide by zero)", () => {
    expect(pickProgressGoal(0)).toBe(100);
  });
});

describe("Andrew asks 'how many orders did we process this year?' — COUNT(*) = 79", () => {
  const palette = groupWidgetsBySensibility(orderCountKpiColumns, {
    isAggregated: true,
    rowCount: orderCountKpiResult.rowCount,
  });

  // | 29 | Order Count KPI | 1 row × 1 measure |
  // | RB: `[number, gauge, progress]` | ref: `[scalar, progress, gauge, table]` |
  it("Andrew sees — in order — Number, Gauge, Progress (same as freight KPI)", () => {
    expect(palette.recommended).toEqual(SHAPE_SCALAR_KPI_RB);
    expect(canonicalize(REFERENCE_SHAPE_SCALAR_KPI).sort())
      .toEqual(["gauge", "number", "progress", "tabulator"]);
  });
});

describe("The CFO asks 'what's our total revenue?' — SUM(UnitPrice*Quantity) on Order Details", () => {
  const palette = groupWidgetsBySensibility(totalRevenueKpiColumns, {
    isAggregated: true,
    rowCount: totalRevenueKpiResult.rowCount,
  });

  // | 30 | Total Revenue KPI | 1 row × 1 measure |
  // | RB: `[number, gauge, progress]` | ref: `[scalar, progress, gauge, table]` |
  it("CFO sees — in order — Number, Gauge, Progress", () => {
    expect(palette.recommended).toEqual(SHAPE_SCALAR_KPI_RB);
    expect(canonicalize(REFERENCE_SHAPE_SCALAR_KPI).sort())
      .toEqual(["gauge", "number", "progress", "tabulator"]);
  });
});
