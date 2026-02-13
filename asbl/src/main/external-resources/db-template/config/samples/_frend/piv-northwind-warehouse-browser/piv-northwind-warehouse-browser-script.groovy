/*
 * Northwind Warehouse - In-Memory Mocked Data (Browser Engine)
 *
 * Calls the shared NorthwindOlapDataGenerator to produce the EXACT SAME dataset
 * as DuckDB vw_sales_detail and ClickHouse vw_sales_detail.
 *
 * Single source of truth: NorthwindOlapDataGenerator.java (seed=42, deterministic)
 * All 3 engines (Browser/DuckDB/ClickHouse) produce identical data.
 */

log.info("Starting piv-northwind-warehouse-browser-script.groovy - loading in-memory warehouse data...")

def data = com.sourcekraft.documentburster.common.db.northwind.NorthwindOlapDataGenerator.generateSalesDetailRows()

ctx.reportData = data
ctx.reportColumnNames = com.sourcekraft.documentburster.common.db.northwind.NorthwindOlapDataGenerator.getColumnNames()

log.info("Loaded {} warehouse sales records (in-memory mock via NorthwindOlapDataGenerator, seed=42).", ctx.reportData.size())