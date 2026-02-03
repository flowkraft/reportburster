package com.flowkraft

/**
 * Pivot Tables Controller
 * Displays the pivot table analysis demo page
 * URL: /pivot-tables (matches Next.js exactly)
 */
class PivotTablesController {

    static layout = 'main'

    def index() {
        render(view: 'index')
    }
}
