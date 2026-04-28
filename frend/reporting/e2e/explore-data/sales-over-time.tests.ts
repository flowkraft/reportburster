// Sales-over-time scenarios — queries with a date/temporal dim + a measure.
// Full recommended list = [chart, trend, tabulator, pivot] (Pivot now recommended
// for 1-dim queries — reference parity, isSensibleWidget relaxed to dims.length >= 1).

import {
  groupWidgetsBySensibility,
  defaultDisplay,
  shapeFromResult,
  pickTrendFields,
  pickDefaultAxes,
  splitDimsAndMeasures,
  guessTimeBucket,
  rankChartSubtypes,
  isTemporalExtraction,
} from "@/lib/explore-data/smart-defaults";

import {
  salesByMonthColumns,
  salesByMonthResult,
  ordersByDayOfWeekColumns,
  ordersByDayOfWeekResult,
  SHAPE_DATE_MEASURE_1DIM_RB,
  SHAPE_CAT_MEASURE_1DIM_RB,
  REFERENCE_SHAPE_DATE_MEASURE_1DIM,
  REFERENCE_SHAPE_CAT_MEASURE_1DIM,
} from "./fixtures/northwind.fixture";

import { canonicalize } from "./helpers/canonicalize";

describe("Janet opens 'monthly sales' — 18 months of SUM(Freight) GROUP BY MONTH(OrderDate)", () => {
  const palette = groupWidgetsBySensibility(salesByMonthColumns, {
    isAggregated: true,
    rowCount: salesByMonthResult.rowCount,
  });

  // | 31 | Monthly sales | D1: 1 temporal dim + 1 measure |
  // | RB: `[chart, trend, tabulator, pivot]` |
  // | ref: `[line, area, bar, combo, smartscalar, row, waterfall, scatter, pie, table, pivot]` (11 items;
  //   RB rolls chart subtypes under one "chart" widget; user picks subtype inside.) |
  it("Janet sees — in order — Chart, Trend, Table, Pivot (full recommended palette)", () => {
    expect(palette.recommended).toEqual(SHAPE_DATE_MEASURE_1DIM_RB);
    // Reference parity — MATCH after canonicalize:
    //   ref canonical (sorted) = [chart, pivot, tabulator, trend]
    //   RB canonical  (sorted) = [chart, pivot, tabulator, trend]
    const rbFamilies: string[]  = [...palette.recommended].sort();
    const refFamilies = canonicalize(REFERENCE_SHAPE_DATE_MEASURE_1DIM).sort();
    expect(rbFamilies).toEqual(refFamilies);
  });

  // | 32 | Monthly sales — Pivot IS recommended (1 temporal dim + measure qualifies) |
  // | RB: pivot at tail | ref: pivot at tail too |
  it("Pivot IS in recommended — 1 temporal dim qualifies for cross-tab (reference parity)", () => {
    expect(palette.recommended).toContain("pivot");
  });

  // | 33 | Monthly sales — Map NOT recommended |
  // | RB: nonsensible contains map | ref: same (no geo) |
  it("Map is in 'More widgets' — no geo column in the result", () => {
    expect(palette.nonsensible).toContain("map");
  });
});

describe("Chart auto-picks LINE for temporal+measure", () => {
  // | 34 | Chart subtype = line | salesByMonthColumns | `defaultDisplay(...).chartType === "line"` |
  // | ref's date-branch puts Line at position #0 ✓ |
  // Root cause of previous failure: shapeFromResult received table=undefined
  // and groupByBuckets={} (no bucket for order_month). Without table schema,
  // schemaCol was undefined → kind defaulted to "category-low" → bar.
  // Fix: pass salesByMonthColumns as resultColumnSchemas — the function now
  // uses result column metadata for type lookup when table is unavailable —
  // query result column descriptors carry their own base type.
  it("defaultDisplay picks chartType='line' — the classic time-series curve", () => {
    const shape = shapeFromResult(
      salesByMonthColumns.map((c) => c.columnName),
      ["order_month"],
      {},
      ["total_freight"],
      undefined,      // no table schema
      undefined,      // no cardinality
      salesByMonthColumns,  // result column schemas carry type info (order_month = DATE)
    );
    const decision = defaultDisplay(shape);
    expect(decision.widgetType).toBe("chart");
    expect(decision.chartType).toBe("line");
  });
});

describe("Chart axis assignment for Janet's monthly sales", () => {
  const { dims, measures } = splitDimsAndMeasures(salesByMonthColumns);

  // | 35 | OrderDate on X | Same | xFields contains "order_month" |
  it("OrderDate lands on X — dates belong on the horizontal axis", () => {
    const assignment = pickDefaultAxes(dims, measures, "line");
    expect(assignment.xFields).toContain("order_month");
  });

  // | 36 | Freight on Y | Same | yFields contains "total_freight" |
  it("Freight total lands on Y — measures go on the vertical axis", () => {
    const assignment = pickDefaultAxes(dims, measures, "line");
    expect(assignment.yFields).toContain("total_freight");
  });
});

describe("Trend widget auto-picks OrderDate + Freight", () => {
  // | 37 | Trend picks date field | salesByMonthColumns |
  // | `pickTrendFields(...).dateField === "order_month"` |
  it("Trend picks 'order_month' as its date field", () => {
    const { dateField } = pickTrendFields(salesByMonthColumns);
    expect(dateField).toBe("order_month");
  });

  // | 38 | Trend picks value field | Same |
  // | `pickTrendFields(...).valueField === "total_freight"` |
  it("Trend picks 'total_freight' as its value field", () => {
    const { valueField } = pickTrendFields(salesByMonthColumns);
    expect(valueField).toBe("total_freight");
  });
});

describe("Bucket auto-selection", () => {
  // | 39 | 7-day range → DAY bucket | 2024-06-01 to 2024-06-08 |
  // | `guessTimeBucket(...) === "day"` |
  it("7-day range suggests DAY — short ranges need day-level resolution", () => {
    const bucket = guessTimeBucket("2024-06-01", "2024-06-08");
    expect(bucket).toBe("day");
  });

  // | 40 | 12-month range → MONTH bucket | 2023-06 to 2024-06 |
  it("12-month range suggests MONTH", () => {
    const bucket = guessTimeBucket("2023-06-01", "2024-06-01");
    expect(bucket).toBe("month");
  });

  // | 41 | 5-year range → month/quarter/year | 2020-06 to 2025-06 |
  // | ref uses `year` for very long ranges |
  it("5-year range suggests month/quarter/year — stays readable", () => {
    const bucket = guessTimeBucket("2020-06-01", "2025-06-01");
    expect(["month", "quarter", "year"]).toContain(bucket);
  });
});

describe("Marketing analyst asks 'which day of the week has most orders?' — DOW is EXTRACTION", () => {
  const palette = groupWidgetsBySensibility(ordersByDayOfWeekColumns, {
    isAggregated: true,
    rowCount: ordersByDayOfWeekResult.rowCount,
  });

  // | 42 | Orders by DOW | 1 categorical dim + 1 measure |
  // | RB: `[chart, tabulator, pivot]` (cat-measure branch, NOT date-measure) |
  // | ref: `[bar, row, pie, line, area, combo, waterfall, scatter, table, pivot]` — Bar wins (categorical) |
  it("Marketing analyst sees — in order — Chart, Table, Pivot (DOW is categorical, treated like any cat dim)", () => {
    expect(palette.recommended).toEqual(SHAPE_CAT_MEASURE_1DIM_RB);
    // Reference parity — MATCH after canonicalize:
    //   ref canonical (sorted) = [chart, pivot, tabulator]
    //   RB canonical  (sorted) = [chart, pivot, tabulator]
    const refFamilies = canonicalize(REFERENCE_SHAPE_CAT_MEASURE_1DIM).sort();
    expect(refFamilies).toEqual(["chart", "pivot", "tabulator"]);
    expect(palette.recommended).toContain("chart");
    expect(palette.recommended).toContain("tabulator");
  });

  // | 43 | rankChartSubtypes: bar over line for DOW | Same | bar index < line index |
  // | ref treats extractions as categorical |
  it("Inside Chart, rank puts 'bar' ahead of 'line' — DOW isn't a timeline", () => {
    const ranked = rankChartSubtypes(
      [{ columnName: "day_of_week", typeName: "VARCHAR", isNullable: true }],
      [{ columnName: "order_count", typeName: "DOUBLE", isNullable: true }],
      { extractions: new Set(["day_of_week"]) },
    );
    const barIndex = ranked.indexOf("bar");
    const lineIndex = ranked.indexOf("line");
    expect(barIndex).toBeLessThan(lineIndex);
  });

  // | 44 | 'day-of-week' flagged as extraction | string | returns true |
  it("'day-of-week' is flagged as a temporal extraction (not a true timeline)", () => {
    expect(isTemporalExtraction("day-of-week")).toBe(true);
  });

  // | 45 | 'month' NOT an extraction | string | returns false |
  it("'month' truncation is NOT an extraction — it's a real timeline", () => {
    expect(isTemporalExtraction("month")).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// pickTrendFields — edge cases
// ═══════════════════════════════════════════════════════════════════════════════

describe("pickTrendFields — edge cases for the Trend widget auto-pick", () => {
  it("Multiple temporal columns → picks the first temporal column as dateField", () => {
    const multiDateCols = [
      { columnName: "OrderDate",    typeName: "TIMESTAMP", isNullable: true },
      { columnName: "RequiredDate", typeName: "TIMESTAMP", isNullable: true },
      { columnName: "ShippedDate",  typeName: "TIMESTAMP", isNullable: true },
      { columnName: "Freight",      typeName: "DECIMAL",   isNullable: true },
    ];
    const result = pickTrendFields(multiDateCols);
    expect(result.dateField).toBe("OrderDate");
    expect(result.valueField).toBe("Freight");
  });

  it("No temporal column → dateField is undefined", () => {
    const noDateCols = [
      { columnName: "ProductName", typeName: "VARCHAR", isNullable: true },
      { columnName: "revenue",     typeName: "DOUBLE",  isNullable: true },
    ];
    const result = pickTrendFields(noDateCols);
    expect(result.dateField).toBeUndefined();
    expect(result.valueField).toBe("revenue");
  });

  it("No measure column → valueField is undefined", () => {
    const noMeasureCols = [
      { columnName: "OrderDate",  typeName: "TIMESTAMP", isNullable: true },
      { columnName: "CustomerID", typeName: "VARCHAR",   isNullable: true },
    ];
    const result = pickTrendFields(noMeasureCols);
    expect(result.dateField).toBe("OrderDate");
    expect(result.valueField).toBeUndefined();
  });
});
