// Chart-ranking — pins the TOP-PICK contract for rankChartSubtypes().
// Each describe asserts ranked[0] (the #1 subtype) and the relative order of
// key subtypes for every major column shape. A future refactor that moves
// "line" from position 0 to position 3 for temporal dims fails immediately.
//
// Reference parity notes (verified against sensibility-grouping.ts):
//   MATCH   temporal → line #1                    ✓ ref line 122
//   MATCH   categorical → bar #1                  ✓ ref line 136
//   MATCH   cardinality-neutral pie at #3 (base)  ✓ ref line 138
//   DIVERGE extraction dims → bar (ref still puts line #1 for extractions)
//           Reason: day-of-week is discrete, not a timeline — bar is correct.
//   DIVERGE low-card ≤5 → pie promoted to #2 (ref keeps pie at #3 always)
//           Reason: pie shines for 2–5 slices — we expose it earlier.
//   DIVERGE high-card >20 → pie demoted past top 5 (ref keeps pie at #3)
//           Reason: 50-slice pie is unreadable — demote before user clicks it.
//   DIVERGE 0 dims + 2 measures → scatter #1 (ref routes to table for raw;
//           no explicit aggregated-scatter rule). RB treats as correlation.
//   DIVERGE 2+ dims + 1 measure → boxplot lifted to index ≤ 2 (ref omits).
//           Reason: grouped-distribution view is a natural pick for 2D shapes.

import { rankChartSubtypes } from "@/lib/explore-data/smart-defaults";
import type { ColumnSchema } from "../../../../asbl/src/main/external-resources/db-template/_apps/flowkraft/_ai-hub/ui-startpage/lib/explore-data/types";

const orderDate: ColumnSchema    = { columnName: "OrderDate",    typeName: "DATE",    isNullable: true };
const orderMonth: ColumnSchema   = { columnName: "order_month",  typeName: "DATE",    isNullable: true };
const category: ColumnSchema     = { columnName: "CategoryName", typeName: "VARCHAR", isNullable: true };
const product: ColumnSchema      = { columnName: "ProductName",  typeName: "VARCHAR", isNullable: true };
const dayOfWeek: ColumnSchema    = { columnName: "day_of_week",  typeName: "VARCHAR", isNullable: true };
const shipCountry: ColumnSchema  = { columnName: "ShipCountry",  typeName: "VARCHAR", isNullable: true };
const revenue: ColumnSchema      = { columnName: "revenue",      typeName: "DOUBLE",  isNullable: true };
const unitPrice: ColumnSchema    = { columnName: "UnitPrice",    typeName: "DOUBLE",  isNullable: true };
const unitsInStock: ColumnSchema = { columnName: "UnitsInStock", typeName: "SMALLINT", isNullable: true };
const reorderLevel: ColumnSchema = { columnName: "ReorderLevel", typeName: "SMALLINT", isNullable: true };

// ─── Canonical subtypes that must ALL appear in every ranking result ──────────
const CANONICAL = [
  "bar", "row", "line", "area", "combo",
  "scatter", "bubble",
  "pie", "doughnut",
  "boxplot", "waterfall", "funnel",
];

// ═══════════════════════════════════════════════════════════════════════════════
// Temporal dim → line leads
// ref: sensibility-grouping.ts line 122 — MATCH
// ═══════════════════════════════════════════════════════════════════════════════

describe("rankChartSubtypes — temporal dim → line leads (MATCH ref behaviour)", () => {
  it("1 DATE dim + 1 measure → top pick is 'line'", () => {
    const ranked = rankChartSubtypes([orderDate], [revenue]);
    expect(ranked[0]).toBe("line");
  });

  it("DATE + cat dim (multi-series line) → top pick is still 'line'", () => {
    const ranked = rankChartSubtypes([orderMonth, category], [revenue]);
    expect(ranked[0]).toBe("line");
  });

  it("temporal dim → 'line' ranked before 'bar'", () => {
    const ranked = rankChartSubtypes([orderDate], [revenue]);
    expect(ranked.indexOf("line")).toBeLessThan(ranked.indexOf("bar"));
  });

  it("temporal dim → 'area' ranked in top 3 (natural stacked variant)", () => {
    const ranked = rankChartSubtypes([orderDate], [revenue]);
    expect(ranked.indexOf("area")).toBeLessThanOrEqual(2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Temporal extraction dim → bar leads
// ref: still puts line #1 for extractions (hasDateDimension=true).
// RB DIVERGES: extractions are discrete categories, not timelines → bar is right.
// ═══════════════════════════════════════════════════════════════════════════════

describe("rankChartSubtypes — extraction dim → bar leads (DIVERGE: ref puts line #1)", () => {
  it("Extraction dim (day-of-week) → top pick is 'bar'", () => {
    const ranked = rankChartSubtypes([dayOfWeek], [revenue], {
      extractions: new Set(["day_of_week"]),
    });
    expect(ranked[0]).toBe("bar");
  });

  it("Extraction dim → 'line' is NOT in top 4 (discrete bins, not a timeline)", () => {
    const ranked = rankChartSubtypes([dayOfWeek], [revenue], {
      extractions: new Set(["day_of_week"]),
    });
    expect(ranked.indexOf("line")).toBeGreaterThanOrEqual(4);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Categorical dim, no cardinality hints → bar #1, pie in top 3
// ref: bar at #1, pie at #3 — MATCH (ref doesn't factor cardinality in ranking)
// ═══════════════════════════════════════════════════════════════════════════════

describe("rankChartSubtypes — categorical dim, no cardinality → bar #1, pie top-3", () => {
  it("No hints → top pick is 'bar'", () => {
    const ranked = rankChartSubtypes([category], [revenue]);
    expect(ranked[0]).toBe("bar");
  });

  it("No hints → 'pie' is in top 3 (medium-card baseline)", () => {
    const ranked = rankChartSubtypes([category], [revenue]);
    expect(ranked.indexOf("pie")).toBeLessThanOrEqual(3);
  });

  it("No hints → 'bar' ranked before 'pie'", () => {
    const ranked = rankChartSubtypes([category], [revenue]);
    expect(ranked.indexOf("bar")).toBeLessThan(ranked.indexOf("pie"));
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Low-cardinality categorical dim → bar #1, pie PROMOTED to #2
// ref: pie always at #3 regardless of cardinality — RB DIVERGES (promotion)
// Reason: 2–5 slices is exactly where pie shines — expose it earlier.
// ═══════════════════════════════════════════════════════════════════════════════

describe("rankChartSubtypes — low-card dim (≤5) → pie promoted to #2 (DIVERGE: ref keeps pie at #3)", () => {
  it("Low-card (3 distinct) → top pick is 'bar'", () => {
    const ranked = rankChartSubtypes([category], [revenue], {
      cardinality: { CategoryName: 3 },
    });
    expect(ranked[0]).toBe("bar");
  });

  it("Low-card (3) → 'pie' is at position 1 (promoted past row)", () => {
    const ranked = rankChartSubtypes([category], [revenue], {
      cardinality: { CategoryName: 3 },
    });
    expect(ranked[1]).toBe("pie");
  });

  it("Low-card boundary (5) → 'pie' still at position ≤ 2", () => {
    const ranked = rankChartSubtypes([category], [revenue], {
      cardinality: { CategoryName: 5 },
    });
    expect(ranked.indexOf("pie")).toBeLessThanOrEqual(2);
  });

  it("Low-card → 'doughnut' is also promoted near the top", () => {
    const ranked = rankChartSubtypes([category], [revenue], {
      cardinality: { CategoryName: 3 },
    });
    expect(ranked.indexOf("doughnut")).toBeLessThanOrEqual(3);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// High-cardinality categorical dim → bar #1, pie DEMOTED
// ref: pie always at #3 regardless of cardinality — RB DIVERGES (demotion)
// Reason: 50-slice pie is unreadable — expose row and demote pie before click.
// ═══════════════════════════════════════════════════════════════════════════════

describe("rankChartSubtypes — high-card dim (>20) → pie demoted (DIVERGE: ref keeps pie at #3)", () => {
  it("High-card (25 distinct) → top pick is 'bar'", () => {
    const ranked = rankChartSubtypes([category], [revenue], {
      cardinality: { CategoryName: 25 },
    });
    expect(ranked[0]).toBe("bar");
  });

  it("High-card → 'row' is at position 1 (horizontal bar for many items)", () => {
    const ranked = rankChartSubtypes([category], [revenue], {
      cardinality: { CategoryName: 25 },
    });
    expect(ranked[1]).toBe("row");
  });

  it("High-card → 'bar' ranked before 'pie'", () => {
    const ranked = rankChartSubtypes([category], [revenue], {
      cardinality: { CategoryName: 25 },
    });
    expect(ranked.indexOf("bar")).toBeLessThan(ranked.indexOf("pie"));
  });

  it("High-card (100) → 'pie' is NOT in top 5 (100 slices = browser crash)", () => {
    const ranked = rankChartSubtypes([product], [revenue], {
      cardinality: { ProductName: 100 },
    });
    expect(ranked.indexOf("pie")).toBeGreaterThanOrEqual(5);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 0 dims + 2 measures → scatter leads (DIVERGE: ref routes to table for raw data;
// no explicit scatter rule for aggregated 0D+2M in ref)
// RB: treats aggregated 0D+2M as a correlation use-case → scatter.
// ═══════════════════════════════════════════════════════════════════════════════

describe("rankChartSubtypes — 0 dims + 2 measures → scatter leads (DIVERGE: ref uses table)", () => {
  it("0 dims + 2 measures → top pick is 'scatter'", () => {
    const ranked = rankChartSubtypes([], [unitPrice, unitsInStock]);
    expect(ranked[0]).toBe("scatter");
  });

  it("0 dims + 3 measures → top pick is still 'scatter'", () => {
    const ranked = rankChartSubtypes([], [unitPrice, unitsInStock, reorderLevel]);
    expect(ranked[0]).toBe("scatter");
  });

  it("0 dims + 2 measures → 'bubble' is rank #2 (natural pairing)", () => {
    const ranked = rankChartSubtypes([], [unitPrice, unitsInStock]);
    expect(ranked[1]).toBe("bubble");
  });

  it("0 dims + 2 measures → 'scatter' ranked before 'bar'", () => {
    const ranked = rankChartSubtypes([], [unitPrice, unitsInStock]);
    expect(ranked.indexOf("scatter")).toBeLessThan(ranked.indexOf("bar"));
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 2+ dims + 1 measure → boxplot lifted to index ≤ 2 (DIVERGE: ref omits boxplot)
// ref: BoxPlot isSensible requires ≥2 dims but ref doesn't promote it in ranking.
// RB: lifts boxplot near front so distribution view is easily discoverable.
// ═══════════════════════════════════════════════════════════════════════════════

describe("rankChartSubtypes — 2+ dims + 1 measure → boxplot in top 3 (DIVERGE: ref omits promotion)", () => {
  it("2 dims + 1 measure → 'boxplot' at index ≤ 2", () => {
    const ranked = rankChartSubtypes([category, orderDate], [revenue]);
    expect(ranked.indexOf("boxplot")).toBeLessThanOrEqual(2);
  });

  it("3 dims + 1 measure → 'boxplot' still at index ≤ 2", () => {
    const ranked = rankChartSubtypes([category, orderDate, shipCountry], [revenue]);
    expect(ranked.indexOf("boxplot")).toBeLessThanOrEqual(2);
  });

  it("1 dim only → 'boxplot' is NOT in top 3 (single-dim = no distribution grouping)", () => {
    const ranked = rankChartSubtypes([category], [revenue]);
    expect(ranked.indexOf("boxplot")).toBeGreaterThan(2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Exhaustiveness — every canonical subtype must appear in every ranking result
// ═══════════════════════════════════════════════════════════════════════════════

describe("rankChartSubtypes — every canonical subtype appears in every result", () => {
  it("temporal shape → all canonical subtypes present", () => {
    const ranked = rankChartSubtypes([orderDate], [revenue]);
    for (const ct of CANONICAL) {
      expect(ranked).toContain(ct);
    }
  });

  it("categorical shape → all canonical subtypes present", () => {
    const ranked = rankChartSubtypes([category], [revenue]);
    for (const ct of CANONICAL) {
      expect(ranked).toContain(ct);
    }
  });

  it("0D + 2M shape → all canonical subtypes present", () => {
    const ranked = rankChartSubtypes([], [unitPrice, unitsInStock]);
    for (const ct of CANONICAL) {
      expect(ranked).toContain(ct);
    }
  });

  it("2D + 1M shape → all canonical subtypes present", () => {
    const ranked = rankChartSubtypes([category, orderDate], [revenue]);
    for (const ct of CANONICAL) {
      expect(ranked).toContain(ct);
    }
  });
});
