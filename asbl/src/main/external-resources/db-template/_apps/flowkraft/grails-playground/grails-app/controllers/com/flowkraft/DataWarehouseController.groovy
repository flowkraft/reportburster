package com.flowkraft

/**
 * Data Warehouse Controller
 * Displays the Northwind Data Warehouse OLAP analysis page with Browser, DuckDB, and ClickHouse engines
 * URL: /data-warehouse (new dedicated page for warehouse analytics)
 */
class DataWarehouseController {

    static layout = 'main'

    def index() {
        render(view: 'index')
    }

    def browser() {
        render(view: 'index', model: [activeEngine: 'browser'])
    }

    def duckdb() {
        render(view: 'index', model: [activeEngine: 'duckdb'])
    }

    def clickhouse() {
        render(view: 'index', model: [activeEngine: 'clickhouse'])
    }
}
