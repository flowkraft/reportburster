package com.flowkraft

/**
 * Reports Controller
 * Displays the full report embedding demo page
 * URL: /reports (matches Next.js exactly)
 */
class ReportsController {

    static layout = 'main'

    def index() {
        render(view: 'index')
    }
}
