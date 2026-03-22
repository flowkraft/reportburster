/*
 * Northwind Warehouse - DuckDB Query
 *
 * NOTE: This script is kept for compatibility with reporting.xml (created at packaging time).
 * However, for server-side pivot aggregation (engine='duckdb'), the pivot config's explicit
 * tableName='vw_sales_detail' is used directly - this script is NOT executed.
 *
 * DuckDB fetches directly from table name specified in pivot config.
 */

log.info("IT SHOULD NOT GO HERE piv-northwind-warehouse-duckdb-script.groovy ...")
