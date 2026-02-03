package com.flowkraft

/**
 * Tabulator Controller
 * Displays the interactive data tables demo page
 * URL: /tabulator (matches Next.js exactly)
 */
class TabulatorController {

    static layout = 'main'

    def index() {
        render(view: 'index')
    }
}
