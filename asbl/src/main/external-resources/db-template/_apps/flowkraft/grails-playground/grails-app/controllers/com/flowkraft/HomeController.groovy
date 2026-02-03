package com.flowkraft

/**
 * Home Controller
 * Main landing page with component grid - matches Next.js exactly
 * URL: / (matches Next.js exactly)
 */
class HomeController {

    static layout = 'main'

    /**
     * Home page with component grid
     */
    def index() {
        render view: 'index'
    }
}
