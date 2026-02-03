package com.flowkraft

/**
 * Report Parameters Controller
 * Displays the report parameters demo page
 * URL: /report-parameters (matches Next.js exactly)
 */
class ReportParametersController {

    static layout = 'main'

    def index() {
        render(view: 'index')
    }
}
