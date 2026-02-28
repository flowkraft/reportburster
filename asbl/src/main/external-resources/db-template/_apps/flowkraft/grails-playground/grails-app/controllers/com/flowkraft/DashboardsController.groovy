package com.flowkraft

/**
 * Dashboards Controller
 * Displays pre-built dashboard pages with multiple visualizations
 * URL: /dashboards (matches Next.js exactly)
 */
class DashboardsController {

    static layout = 'main'

    def index() {
        render(view: 'index')
    }
}
