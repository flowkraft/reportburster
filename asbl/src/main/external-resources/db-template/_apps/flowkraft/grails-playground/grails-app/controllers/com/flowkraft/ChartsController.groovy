package com.flowkraft

/**
 * Charts Controller
 * Displays the data visualization demo page
 * URL: /charts (matches Next.js exactly)
 */
class ChartsController {

    static layout = 'main'

    def index() {
        render(view: 'index')
    }
}
