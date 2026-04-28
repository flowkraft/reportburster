// Geographic-distribution scenarios — Map rises to the top when data is
// aggregated over country/state columns, or has lat/lon for pin-map.

import {
  groupWidgetsBySensibility,
  isCountry,
  isState,
  isLatitude,
  isLongitude,
  hasLatLonColumns,
} from "@/lib/explore-data/smart-defaults";

import type { ColumnSchema } from "../../../../asbl/src/main/external-resources/db-template/_apps/flowkraft/_ai-hub/ui-startpage/lib/explore-data/types";

import {
  salesByCountryColumns,
  salesByCountryResult,
  warehouseLocationsColumns,
  SHAPE_GEO_MEASURE_1DIM_RB,
  SHAPE_RAW_GEO_WITH_MEASURE_RB,
  REFERENCE_SHAPE_GEO_MEASURE_1DIM,
  REFERENCE_SHAPE_RAW_GEO_WITH_MEASURE,
} from "./fixtures/northwind.fixture";

import { canonicalize } from "./helpers/canonicalize";

describe("Marketing analyst asks 'which countries bring in the most freight?'", () => {
  const palette = groupWidgetsBySensibility(salesByCountryColumns, {
    isAggregated: true,
    rowCount: salesByCountryResult.rowCount,
  });

  // | 46 | Sales by country | G1: 1 geo dim + 1 measure, aggregated |
  // | RB: `[map, chart, tabulator]` (Chart added — fixes the gap) |
  // | ref: `[map, bar, row, pie, line, area, combo, waterfall, scatter, table]` (10 items).
  //   Chart groups ref's bar/row/pie/line/area/combo/waterfall/scatter subtypes;
  //   subtype picked inside Chart's config panel. |
  it("Marketing sees — in order — Map, Chart, Table (Chart for country-ranking bar view)", () => {
    expect(palette.recommended).toEqual(SHAPE_GEO_MEASURE_1DIM_RB);
    // Reference parity — MATCH after canonicalize:
    //   ref canonical (sorted) = [chart, map, tabulator]
    //   RB canonical  (sorted) = [chart, map, tabulator]
    const rbFamilies: string[]  = [...palette.recommended].sort();
    const refFamilies = canonicalize(REFERENCE_SHAPE_GEO_MEASURE_1DIM).sort();
    expect(rbFamilies).toEqual(refFamilies);
  });

  // | 47 | Sales by country — Pivot NOT recommended (1 dim) |
  // | RB: pivot filtered | ref: pivot at tail |
  it("Pivot is NOT in recommended — only 1 dim, pivots need 2", () => {
    expect(palette.recommended).not.toContain("pivot");
  });
});

describe("Regression guards — 'Ship*' / 'Billing*' / 'Customer*' geo prefixes", () => {
  // | 48 | ShipCountry detected | col ShipCountry | `isCountry === true` |
  // | ref relies on `semantic_type`; our name-tokenizer is more automatic |
  it("'ShipCountry' is recognized as a country column", () => {
    const col: ColumnSchema = { columnName: "ShipCountry", typeName: "VARCHAR", isNullable: true };
    expect(isCountry(col)).toBe(true);
  });

  // | 49 | BillingCountry detected | col | true | ref: only via metadata |
  it("'BillingCountry' is recognized", () => {
    const col: ColumnSchema = { columnName: "BillingCountry", typeName: "VARCHAR", isNullable: true };
    expect(isCountry(col)).toBe(true);
  });

  // | 50 | CustomerCountry detected | col | true | ref: only via metadata |
  it("'CustomerCountry' is recognized", () => {
    const col: ColumnSchema = { columnName: "CustomerCountry", typeName: "VARCHAR", isNullable: true };
    expect(isCountry(col)).toBe(true);
  });

  // | 51 | country_code detected | col | true |
  it("'country_code' is recognized (snake_case prefix)", () => {
    const col: ColumnSchema = { columnName: "country_code", typeName: "VARCHAR", isNullable: true };
    expect(isCountry(col)).toBe(true);
  });

  // | 52 | OrderID NOT country | col | false |
  it("'OrderID' is NOT a country — no false positive on IDs", () => {
    const col: ColumnSchema = { columnName: "OrderID", typeName: "INTEGER", isNullable: false };
    expect(isCountry(col)).toBe(false);
  });

  // | 53 | ShipRegion detected as state | col | true | ref: only via metadata |
  it("'ShipRegion' is recognized as state/region", () => {
    const col: ColumnSchema = { columnName: "ShipRegion", typeName: "VARCHAR", isNullable: true };
    expect(isState(col)).toBe(true);
  });

  // | 54 | BillingState detected | col | true | ref: only via metadata |
  it("'BillingState' is recognized", () => {
    const col: ColumnSchema = { columnName: "BillingState", typeName: "VARCHAR", isNullable: true };
    expect(isState(col)).toBe(true);
  });
});

describe("Latitude / Longitude detection — pin-map territory", () => {
  // | 55 | Latitude detected (numeric) | col DOUBLE | true |
  it("'Latitude' (DOUBLE) is detected", () => {
    const col: ColumnSchema = { columnName: "Latitude", typeName: "DOUBLE", isNullable: true };
    expect(isLatitude(col)).toBe(true);
  });

  // | 56 | Longitude detected | col DOUBLE | true |
  it("'Longitude' (DOUBLE) is detected", () => {
    const col: ColumnSchema = { columnName: "Longitude", typeName: "DOUBLE", isNullable: true };
    expect(isLongitude(col)).toBe(true);
  });

  // | 57 | HomeLatitude detected | col | true | ref: only via metadata |
  it("'HomeLatitude' is detected (prefix convention)", () => {
    const col: ColumnSchema = { columnName: "HomeLatitude", typeName: "DOUBLE", isNullable: true };
    expect(isLatitude(col)).toBe(true);
  });

  // | 58 | VARCHAR 'lat' NOT latitude | col VARCHAR | false |
  it("VARCHAR 'lat' is NOT latitude — type guard rejects non-numeric", () => {
    const col: ColumnSchema = { columnName: "lat", typeName: "VARCHAR", isNullable: true };
    expect(isLatitude(col)).toBe(false);
  });

  // | 59 | hasLatLonColumns finds pair | cols | true |
  it("hasLatLonColumns finds both lat+lon in the warehouse fixture", () => {
    expect(hasLatLonColumns(warehouseLocationsColumns)).toBe(true);
  });
});

describe("Warehouse manager opens hypothetical warehouse table with lat/lon + StockValue", () => {
  const palette = groupWidgetsBySensibility(warehouseLocationsColumns, {
    isAggregated: false,
    rowCount: 5,
  });

  // | 60 | Warehouse raw with lat/lon | raw drop, hasCoords |
  // | RB: `[tabulator, map, detail]` (raw + geo branch) |
  // | ref: `[table, line, area, bar, combo, row, scatter, pie, waterfall, map, pivot]` (raw branch) |
  it("Warehouse manager sees — in order — Table, Map, Detail (lat/lon makes pin-map viable)", () => {
    expect(palette.recommended).toEqual(SHAPE_RAW_GEO_WITH_MEASURE_RB);
    // Reference parity — intentional divergence (raw-drop rule):
    //   ref canonical (sorted) = [chart, map, pivot, tabulator]
    //   RB canonical  (sorted) = [detail, map, tabulator]
    expect(canonicalize(REFERENCE_SHAPE_RAW_GEO_WITH_MEASURE).sort())
      .toEqual(["chart", "map", "pivot", "tabulator"]);
    expect(palette.recommended).toContain("tabulator");
    expect(palette.recommended).toContain("map");
  });
});

describe("Negative case — 'orders by employee ID' has NO geo column", () => {
  const ordersByEmployeeColumns: ColumnSchema[] = [
    { columnName: "EmployeeID",  typeName: "INTEGER", isNullable: false },
    { columnName: "order_count", typeName: "DOUBLE",  isNullable: true  },
  ];

  const palette = groupWidgetsBySensibility(ordersByEmployeeColumns, {
    isAggregated: true,
    rowCount: 3,
  });

  // | 61 | Orders by employee (no geo) | aggregated, no geo col |
  // | RB: map in nonsensible | ref: same |
  it("Map is under 'More widgets' — no country, no state, no lat/lon = no map", () => {
    expect(palette.nonsensible).toContain("map");
  });
});
