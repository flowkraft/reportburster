package com.flowkraft

import grails.converters.JSON

/**
 * REST API Controller for Settings
 * Provides GET/POST endpoints for reading/writing settings from SQLite
 * Similar to Next.js /api/settings route
 */
class SettingsController {

    static allowedMethods = [
        index: ['GET'],
        get: ['GET'],
        save: ['POST', 'PUT'],
        byCategory: ['GET']
    ]

    /**
     * GET /settings - Get all settings or filter by key/category
     * Query params: ?key=xxx or ?category=xxx
     */
    def index() {
        def key = params.key
        def category = params.category

        if (key) {
            // Get single setting by key
            def setting = Setting.findByKey(key)
            if (setting) {
                render([
                    id: setting.id,
                    key: setting.key,
                    value: setting.value,
                    category: setting.category,
                    description: setting.description
                ] as JSON)
            } else {
                render([key: key, value: null] as JSON)
            }
            return
        }

        if (category) {
            // Get settings by category
            def settings = Setting.findAllByCategory(category)
            render(settings.collect { [
                id: it.id,
                key: it.key,
                value: it.value,
                category: it.category,
                description: it.description
            ]} as JSON)
            return
        }

        // Get all settings
        def settings = Setting.list()
        render(settings.collect { [
            id: it.id,
            key: it.key,
            value: it.value,
            category: it.category,
            description: it.description
        ]} as JSON)
    }

    /**
     * GET /settings/get?key=xxx - Get a single setting
     */
    def get() {
        def key = params.key
        if (!key) {
            response.status = 400
            render([error: "Key is required"] as JSON)
            return
        }

        def setting = Setting.findByKey(key)
        if (setting) {
            render([
                id: setting.id,
                key: setting.key,
                value: setting.value,
                category: setting.category,
                description: setting.description
            ] as JSON)
        } else {
            render([key: key, value: null] as JSON)
        }
    }

    /**
     * POST /settings/save - Create or update a setting
     * Body: { key: "xxx", value: "yyy", category: "zzz", description: "..." }
     */
    def save() {
        def json = request.JSON
        def key = json.key ?: params.key
        def value = json.value ?: params.value
        def category = json.category ?: params.category ?: 'general'
        def description = json.description ?: params.description

        if (!key) {
            response.status = 400
            render([error: "Key is required"] as JSON)
            return
        }

        def setting = Setting.setValue(key, value, category, description)
        
        render([
            id: setting.id,
            key: setting.key,
            value: setting.value,
            category: setting.category,
            description: setting.description,
            success: true
        ] as JSON)
    }

    /**
     * GET /settings/byCategory?category=xxx - Get settings by category
     */
    def byCategory() {
        def category = params.category
        if (!category) {
            response.status = 400
            render([error: "Category is required"] as JSON)
            return
        }

        def settings = Setting.findAllByCategory(category)
        render(settings.collect { [
            id: it.id,
            key: it.key,
            value: it.value,
            category: it.category,
            description: it.description
        ]} as JSON)
    }
}
