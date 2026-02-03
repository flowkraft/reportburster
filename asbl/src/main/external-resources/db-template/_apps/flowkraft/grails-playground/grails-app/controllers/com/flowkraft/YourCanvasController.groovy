package com.flowkraft

/**
 * Your Canvas Controller
 * Displays the "build your own" canvas page
 * URL: /your-canvas (matches Next.js exactly)
 */
class YourCanvasController {

    static layout = 'main'

    def index() {
        render(view: 'index')
    }
}
