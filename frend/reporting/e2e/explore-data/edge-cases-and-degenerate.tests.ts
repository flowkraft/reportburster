// Edge-cases + degenerate shapes — weird queries that should not crash the
// palette or make nonsensical recommendations.
//
// Comment above each `it(...)` is the matching row from README.md.

import {
  groupWidgetsBySensibility,
  isSensibleWidget,
  splitDimsAndMeasures,
  clipTopN,
  shouldShowLegend,
  sortBarsDesc,
} from "@/lib/explore-data/smart-defaults";

import type { ColumnSchema } from "../../../../asbl/src/main/external-resources/db-template/_apps/flowkraft/_ai-hub/ui-startpage/lib/explore-data/types";

import {
  SHAPE_EMPTY_RB,
  REFERENCE_SHAPE_EMPTY,
} from "./fixtures/northwind.fixture";

import { canonicalize } from "./helpers/canonicalize";

describe("User pastes an empty query — no columns come back", () => {
  const palette = groupWidgetsBySensibility([], { isAggregated: false });

  // | 141 | Empty query (no cols) → palette neutral state | `[]` |
  // | RB: `recommended=[]`, `sensible.length > 0`, `nonsensible=[]` |
  // | ref: cols.length≤1 → `[table]` (returns Table only). Ours stays neutral until data lands. |
  it("Palette returns all widgets as sensible (neutral pre-data state) — no crash, no weird recommendation", () => {
    expect(palette.recommended).toEqual(SHAPE_EMPTY_RB);
    expect(palette.sensible.length).toBeGreaterThan(0);
    expect(palette.nonsensible).toEqual([]);
    // Reference parity — intentional divergence:
    //   ref canonical = [tabulator] (returns table for 0-col queries)
    //   RB canonical  = [] — stays neutral rather than recommending anything
    expect(canonicalize(REFERENCE_SHAPE_EMPTY).sort()).toEqual(["tabulator"]);
    expect(palette.recommended).toEqual([]);
  });
});

describe("User drops a join table full of IDs — Order Details raw (all IDs + measures, no usable dim)", () => {
  const orderDetailsColumnsRaw: ColumnSchema[] = [
    { columnName: "OrderID",   typeName: "INTEGER",  isNullable: false },
    { columnName: "ProductID", typeName: "INTEGER",  isNullable: false },
    { columnName: "UnitPrice", typeName: "DECIMAL",  isNullable: false },
    { columnName: "Quantity",  typeName: "SMALLINT", isNullable: false },
    { columnName: "Discount",  typeName: "DECIMAL",  isNullable: false },
  ];

  const palette = groupWidgetsBySensibility(orderDetailsColumnsRaw, {
    isAggregated: false,
    rowCount: 200,
  });

  // | 142 | Junction table full of IDs (Order Details raw) → Table first |
  // | IDs+measures | `recommended[0] === "tabulator"` |
  // | ref "no aggregation" branch → Table first ✓ |
  it("Table is still the top recommendation — raw line items are readable in a grid", () => {
    expect(palette.recommended[0]).toBe("tabulator");
  });
});

describe("Tabulator widget sensibility — it's the 'always works' fallback", () => {
  // | 143 | Tabulator sensible with ≥1 column | `[any_col]` |
  // | `isSensibleWidget("tabulator") === true` | ref Table always sensible ✓ |
  it("Tabulator is sensible whenever there's at least one column", () => {
    const oneCol: ColumnSchema[] = [{ columnName: "any_col", typeName: "VARCHAR", isNullable: true }];
    expect(isSensibleWidget("tabulator", oneCol, { rowCount: 5 })).toBe(true);
  });

  // | 144 | Tabulator NOT sensible with 0 cols | `[]` |
  // | `isSensibleWidget("tabulator", []) === false` |
  // | ref: `cols.length<=1` still returns Table; we're stricter |
  it("Tabulator is NOT sensible with zero columns (nothing to show)", () => {
    expect(isSensibleWidget("tabulator", [], { rowCount: 5 })).toBe(false);
  });
});

describe("isAggregated=false + NO geo column — palette should offer Table + Detail only (no Map)", () => {
  const shippersColumnsRaw: ColumnSchema[] = [
    { columnName: "ShipperID",   typeName: "INTEGER", isNullable: false },
    { columnName: "CompanyName", typeName: "VARCHAR", isNullable: false },
    { columnName: "Phone",       typeName: "VARCHAR", isNullable: true  },
  ];

  const palette = groupWidgetsBySensibility(shippersColumnsRaw, {
    isAggregated: false,
    rowCount: 3,
  });

  // | 145 | Raw drop, no geo col → Table+Detail only (no Map) | Shippers-like cols |
  // | `recommended` contains Table, excludes Map |
  // | ref over-recommends Map regardless; we're cleaner |
  it("Table is recommended", () => {
    expect(palette.recommended).toContain("tabulator");
  });

  it("Map is NOT recommended — no geo column", () => {
    expect(palette.recommended).not.toContain("map");
  });
});

describe("splitDimsAndMeasures — excludes IDs from measures", () => {
  // | 146 | `splitDimsAndMeasures` excludes IDs from measures |
  // | mix of ID/text/date/measure | `measures` contains "freight", excludes "order_id" |
  // | ref: semantic_type PK/FK excluded from metrics |
  it("A mix of PK-looking INT + text + date + measure correctly separates dims from measures", () => {
    const mixedCols: ColumnSchema[] = [
      { columnName: "order_id",     typeName: "INTEGER",   isNullable: false },
      { columnName: "ship_country", typeName: "VARCHAR",   isNullable: true  },
      { columnName: "order_date",   typeName: "TIMESTAMP", isNullable: true  },
      { columnName: "freight",      typeName: "DECIMAL",   isNullable: true  },
    ];
    const { dims, measures } = splitDimsAndMeasures(mixedCols);
    expect(measures.map((c) => c.columnName)).toContain("freight");
    expect(measures.map((c) => c.columnName)).not.toContain("order_id");
    expect(dims.map((c) => c.columnName)).toContain("ship_country");
  });
});

describe("Rendering helpers — Chart widget internals that stop 10,000-row renders from killing the browser", () => {
  // | 147 | `clipTopN` keeps top 5 of 20 | 20 rows, n=5 | 5 rows, highest value first |
  it("clipTopN keeps the highest-value N rows and discards the rest", () => {
    const rows = Array.from({ length: 20 }, (_, i) => ({ category: `cat${i}`, value: i * 10 }));
    const clipped = clipTopN(rows, "value", 5);
    expect(clipped.rows.length).toBe(5);
    expect(clipped.rows[0]["value"]).toBe(190);
  });

  // | 148 | `sortBarsDesc` puts biggest bar first | 3 rows | sorted by measure descending |
  it("sortBarsDesc reorders rows so the tallest bar comes first", () => {
    const rows = [
      { label: "small",  value: 10  },
      { label: "big",    value: 100 },
      { label: "medium", value: 50  },
    ];
    const sorted = sortBarsDesc(rows, "value");
    expect(sorted[0].label).toBe("big");
    expect(sorted[sorted.length - 1].label).toBe("small");
  });

  // | 149 | `shouldShowLegend` true for 2+ series | `[revenue, cost]` | returns `true` |
  it("shouldShowLegend returns true when there are multiple series (2+ Y fields)", () => {
    expect(shouldShowLegend(2)).toBe(true);
  });

  // | 150 | `shouldShowLegend` false for single series | `[revenue]` | returns `false` |
  it("shouldShowLegend returns false for a single-series chart (legend would just say 'revenue')", () => {
    expect(shouldShowLegend(1)).toBe(false);
  });
});
