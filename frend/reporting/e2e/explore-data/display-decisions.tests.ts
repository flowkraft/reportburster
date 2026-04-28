// Display-decision scenarios — tests for defaultDisplay(), enforceChartTypeLimits(),
// and shapeFromResult().
//
// defaultDisplay() is the single source of truth: given a SummarizeShape, it
// returns a DisplayDecision (widget type + chart sub-type + config + reason).
// The cascade: 0 dims → 0 measures → 1 dim → 2 dims → 3+ dims → fallthrough.
//
// enforceChartTypeLimits() caps pie/doughnut at 5 slices — more is unreadable.
//
// shapeFromResult() builds a SummarizeShape from result columns + visual query
// metadata, populating semantic hints (isState/isCountry/isCoordinate).

import {
  defaultDisplay,
  enforceChartTypeLimits,
  shapeFromResult,
  type SummarizeShape,
} from "@/lib/explore-data/smart-defaults";

import {
  ordersSchema,
  salesByMonthColumns,
  salesByCountryColumns,
  top10ProductsByRevenueColumns,
  ordersByDayOfWeekColumns,
  warehouseLocationsColumns,
} from "./fixtures/northwind.fixture";

// ═══════════════════════════════════════════════════════════════════════════════
// defaultDisplay — 0 dims branch
// ═══════════════════════════════════════════════════════════════════════════════

describe("defaultDisplay — no dimensions (scalar territory)", () => {
  it("0 dims + 0 measures → number widget (no shape yet)", () => {
    const shape: SummarizeShape = { dims: [], measures: [] };
    const decision = defaultDisplay(shape);
    expect(decision.widgetType).toBe("number");
    expect(decision.reason).toContain("No shape");
  });

  it("0 dims + 1 measure → number widget (single summary value)", () => {
    const shape: SummarizeShape = {
      dims: [],
      measures: [{ name: "total_freight", kind: "measure" }],
    };
    const decision = defaultDisplay(shape);
    expect(decision.widgetType).toBe("number");
    expect(decision.reason).toContain("One summary");
  });

  it("0 dims + 2 measures → chart/scatter (X = first, Y = second)", () => {
    const shape: SummarizeShape = {
      dims: [],
      measures: [
        { name: "UnitPrice", kind: "measure" },
        { name: "UnitsInStock", kind: "measure" },
      ],
    };
    const decision = defaultDisplay(shape);
    expect(decision.widgetType).toBe("chart");
    expect(decision.chartType).toBe("scatter");
    expect(decision.reason).toContain("scatter");
  });

  it("0 dims + 3 measures → number widget (summary without grouping)", () => {
    const shape: SummarizeShape = {
      dims: [],
      measures: [
        { name: "price", kind: "measure" },
        { name: "stock", kind: "measure" },
        { name: "reorder", kind: "measure" },
      ],
    };
    const decision = defaultDisplay(shape);
    expect(decision.widgetType).toBe("number");
    expect(decision.reason).toContain("without a grouping");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// defaultDisplay — 0 measures branch
// ═══════════════════════════════════════════════════════════════════════════════

describe("defaultDisplay — dimensions but no measures (reference parity: table+pivot)", () => {
  it("1 dim + 0 measures → tabulator (reference: 'table' leads for no-metric queries)", () => {
    const shape: SummarizeShape = {
      dims: [{ name: "CategoryName", kind: "category-low" }],
      measures: [],
    };
    const decision = defaultDisplay(shape);
    expect(decision.widgetType).toBe("tabulator");
    expect(decision.chartType).toBeUndefined();
    expect(decision.reason).toContain("Dim only");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// defaultDisplay — 1 dim branch
// ═══════════════════════════════════════════════════════════════════════════════

describe("defaultDisplay — single dimension (the most common analytical shape)", () => {
  it("1 state dim + measure → map with region=us_states", () => {
    const shape: SummarizeShape = {
      dims: [{ name: "State", kind: "category-low", isState: true }],
      measures: [{ name: "revenue", kind: "measure" }],
    };
    const decision = defaultDisplay(shape);
    expect(decision.widgetType).toBe("map");
    expect(decision.displayConfig?.mapType).toBe("region");
    expect(decision.displayConfig?.region).toBe("us_states");
  });

  it("1 country dim + measure → map with region=world_countries", () => {
    const shape: SummarizeShape = {
      dims: [{ name: "ShipCountry", kind: "category-low", isCountry: true }],
      measures: [{ name: "total_freight", kind: "measure" }],
    };
    const decision = defaultDisplay(shape);
    expect(decision.widgetType).toBe("map");
    expect(decision.displayConfig?.region).toBe("world_countries");
  });

  it("1 temporal dim (not extraction) + measure → chart/line (classic time-series)", () => {
    const shape: SummarizeShape = {
      dims: [{ name: "order_month", kind: "temporal" }],
      measures: [{ name: "total_freight", kind: "measure" }],
    };
    const decision = defaultDisplay(shape);
    expect(decision.widgetType).toBe("chart");
    expect(decision.chartType).toBe("line");
    expect(decision.reason).toContain("Date + measure");
  });

  it("1 temporal extraction dim + measure → chart/bar (discrete categories)", () => {
    const shape: SummarizeShape = {
      dims: [{ name: "day_of_week", kind: "category-low", isExtraction: true }],
      measures: [{ name: "order_count", kind: "measure" }],
    };
    const decision = defaultDisplay(shape);
    expect(decision.widgetType).toBe("chart");
    expect(decision.chartType).toBe("bar");
    expect(decision.reason).toContain("extraction");
  });

  it("1 boolean dim + measure → chart/bar", () => {
    const shape: SummarizeShape = {
      dims: [{ name: "Discontinued", kind: "boolean" }],
      measures: [{ name: "avg_price", kind: "measure" }],
    };
    const decision = defaultDisplay(shape);
    expect(decision.widgetType).toBe("chart");
    expect(decision.chartType).toBe("bar");
    expect(decision.reason).toContain("Boolean");
  });

  it("1 category dim + 2 measures → chart/bar grouped", () => {
    const shape: SummarizeShape = {
      dims: [{ name: "ProductName", kind: "category-low" }],
      measures: [
        { name: "revenue", kind: "measure" },
        { name: "quantity", kind: "measure" },
      ],
    };
    const decision = defaultDisplay(shape);
    expect(decision.widgetType).toBe("chart");
    expect(decision.chartType).toBe("bar");
    expect(decision.displayConfig?.grouped).toBe(true);
  });

  it("1 category dim + 1 measure → chart/bar (the default analytical chart)", () => {
    const shape: SummarizeShape = {
      dims: [{ name: "ProductName", kind: "category-low" }],
      measures: [{ name: "revenue", kind: "measure" }],
    };
    const decision = defaultDisplay(shape);
    expect(decision.widgetType).toBe("chart");
    expect(decision.chartType).toBe("bar");
    expect(decision.reason).toContain("Category + measure");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// defaultDisplay — 2 dims branch
// ═══════════════════════════════════════════════════════════════════════════════

describe("defaultDisplay — two dimensions (multi-series territory)", () => {
  it("2 dims (date + cat) + 1 measure → chart/line with series=true", () => {
    const shape: SummarizeShape = {
      dims: [
        { name: "order_month", kind: "temporal" },
        { name: "ShipCountry", kind: "category-low" },
      ],
      measures: [{ name: "total_freight", kind: "measure" }],
    };
    const decision = defaultDisplay(shape);
    expect(decision.widgetType).toBe("chart");
    expect(decision.chartType).toBe("line");
    expect(decision.displayConfig?.series).toBe(true);
    expect(decision.reason).toContain("multi-series");
  });

  it("2 dims (lat + lon) + 1 measure → map/pin (point map)", () => {
    const shape: SummarizeShape = {
      dims: [
        { name: "Latitude", kind: "measure", isCoordinate: true },
        { name: "Longitude", kind: "measure", isCoordinate: true },
      ],
      measures: [{ name: "StockValue", kind: "measure" }],
    };
    const decision = defaultDisplay(shape);
    expect(decision.widgetType).toBe("map");
    expect(decision.displayConfig?.mapType).toBe("pin");
    expect(decision.reason).toContain("pin");
  });

  it("2 dims (cat + cat) + 1 measure → chart/bar grouped+series", () => {
    const shape: SummarizeShape = {
      dims: [
        { name: "CustomerID", kind: "category-low" },
        { name: "ProductName", kind: "category-low" },
      ],
      measures: [{ name: "total_quantity", kind: "measure" }],
    };
    const decision = defaultDisplay(shape);
    expect(decision.widgetType).toBe("chart");
    expect(decision.chartType).toBe("bar");
    expect(decision.displayConfig?.grouped).toBe(true);
    expect(decision.displayConfig?.series).toBe(true);
  });

  it("2 dims (mixed/unclear) + 1 measure → tabulator fallback", () => {
    const shape: SummarizeShape = {
      dims: [
        { name: "dim_a", kind: "category-high" },
        { name: "dim_b", kind: "text-free" },
      ],
      measures: [{ name: "value", kind: "measure" }],
    };
    const decision = defaultDisplay(shape);
    expect(decision.widgetType).toBe("tabulator");
    expect(decision.reason).toContain("Mixed");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// defaultDisplay — 3+ dims branch
// ═══════════════════════════════════════════════════════════════════════════════

describe("defaultDisplay — three or more dimensions", () => {
  it("3 dims → tabulator (too many for a flat chart)", () => {
    const shape: SummarizeShape = {
      dims: [
        { name: "Country", kind: "category-low" },
        { name: "Month", kind: "temporal" },
        { name: "Product", kind: "category-low" },
      ],
      measures: [{ name: "revenue", kind: "measure" }],
    };
    const decision = defaultDisplay(shape);
    expect(decision.widgetType).toBe("tabulator");
    expect(decision.reason).toContain("Too many");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// enforceChartTypeLimits — pie slice cap
// ═══════════════════════════════════════════════════════════════════════════════

describe("enforceChartTypeLimits — pie/doughnut slice cap (>5 → demote to bar)", () => {
  it("pie with 3 slices → stays pie (readable)", () => {
    expect(enforceChartTypeLimits("pie", 3)).toBe("pie");
  });

  it("pie with 5 slices → stays pie (boundary)", () => {
    expect(enforceChartTypeLimits("pie", 5)).toBe("pie");
  });

  it("pie with 6 slices → demoted to bar (unreadable pie)", () => {
    expect(enforceChartTypeLimits("pie", 6)).toBe("bar");
  });

  it("doughnut with 4 slices → stays doughnut", () => {
    expect(enforceChartTypeLimits("doughnut", 4)).toBe("doughnut");
  });

  it("doughnut with 10 slices → demoted to bar", () => {
    expect(enforceChartTypeLimits("doughnut", 10)).toBe("bar");
  });

  it("bar always stays bar (no cap applied)", () => {
    expect(enforceChartTypeLimits("bar", 200)).toBe("bar");
  });

  it("line always stays line (no cap applied)", () => {
    expect(enforceChartTypeLimits("line", 500)).toBe("line");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// shapeFromResult — builds SummarizeShape from query result metadata
// ═══════════════════════════════════════════════════════════════════════════════

describe("shapeFromResult — extracts dims and measures from result columns", () => {
  it("Temporal extraction bucket → kind=category-low, isExtraction=true", () => {
    const shape = shapeFromResult(
      ["day_of_week", "order_count"],
      ["day_of_week"],
      { day_of_week: "day-of-week" }, // extraction bucket (matches TEMPORAL_EXTRACTIONS set)
      ["order_count"],
      null,
    );
    // day_of_week with extraction bucket → category-low + isExtraction
    const dim = shape.dims.find((d) => d.name === "day_of_week");
    expect(dim).toBeDefined();
    expect(dim?.isExtraction).toBe(true);
  });

  it("Truncation bucket (month) → kind=temporal", () => {
    const shape = shapeFromResult(
      ["order_month", "total_freight"],
      ["order_month"],
      { order_month: "month" }, // truncation bucket
      ["total_freight"],
      null,
    );
    const dim = shape.dims.find((d) => d.name === "order_month");
    expect(dim).toBeDefined();
    expect(dim?.kind).toBe("temporal");
  });

  it("Country column matched from table schema → isCountry=true", () => {
    const shape = shapeFromResult(
      ["ShipCountry", "total_freight"],
      ["ShipCountry"],
      {},
      ["total_freight"],
      ordersSchema, // has ShipCountry column
    );
    const dim = shape.dims.find((d) => d.name === "ShipCountry");
    expect(dim).toBeDefined();
    expect(dim?.isCountry).toBe(true);
  });

  it("Aggregated column (ends with _sum) → goes to measures", () => {
    const shape = shapeFromResult(
      ["ProductName", "revenue_sum"],
      ["ProductName"],
      {},
      ["revenue_sum"],
      null,
    );
    expect(shape.dims.length).toBe(1);
    expect(shape.dims[0].name).toBe("ProductName");
    expect(shape.measures.length).toBe(1);
    expect(shape.measures[0].name).toBe("revenue_sum");
  });

  it("GroupBy column without bucket → classified via classifyColumn", () => {
    const shape = shapeFromResult(
      ["ProductName", "revenue"],
      ["ProductName"],
      undefined, // no buckets
      ["revenue"],
      null,
    );
    // ProductName is VARCHAR → classifyColumn without table → "category-low"
    const dim = shape.dims.find((d) => d.name === "ProductName");
    expect(dim).toBeDefined();
    expect(dim?.kind).toBe("category-low");
  });

  it("Mixed groupBy + aggregated → correct dims/measures split", () => {
    const shape = shapeFromResult(
      ["ShipCountry", "order_month", "total_freight", "order_count"],
      ["ShipCountry", "order_month"],
      { order_month: "month" },
      ["total_freight", "order_count"],
      ordersSchema,
    );
    // 2 groupBy columns → 2 dims
    expect(shape.dims.length).toBe(2);
    // 2 aggregated columns → 2 measures
    expect(shape.measures.length).toBe(2);
    // order_month is temporal (truncation bucket)
    const monthDim = shape.dims.find((d) => d.name === "order_month");
    expect(monthDim?.kind).toBe("temporal");
    // ShipCountry is a country column
    const countryDim = shape.dims.find((d) => d.name === "ShipCountry");
    expect(countryDim?.isCountry).toBe(true);
  });
});
