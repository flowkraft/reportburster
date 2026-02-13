package com.flowkraft

/**
 * Setting domain class - à la Django Constance key-value config store
 * Simple key-value pair storage for application configuration
 */
class Setting {

    String key           // Unique setting key (e.g., 'company.name')
    String value         // Setting value
    String description   // Optional description of what this setting does
    String category = 'general'  // Category for grouping (company, preferences, etc.)

    Date dateCreated
    Date lastUpdated

    static constraints = {
        key blank: false, unique: true, maxSize: 100
        value nullable: true, maxSize: 2000
        description nullable: true, maxSize: 500
        category nullable: false, maxSize: 50
    }

    static mapping = {
        table 'settings'
        key column: 'setting_key'  // 'key' is reserved in some DBs
        value column: 'setting_value'
    }

    /**
     * Get a setting value by key
     */
    static String getValue(String key, String defaultValue = null) {
        def setting = Setting.findByKey(key)
        return setting?.value ?: defaultValue
    }

    /**
     * Set a setting value (creates if doesn't exist, updates if exists)
     */
    static Setting setValue(String key, String value, String category = 'general', String description = null) {
        def setting = Setting.findByKey(key)
        if (!setting) {
            setting = new Setting(key: key, category: category)
        } else {
            setting.category = category  // Update category on existing settings
        }
        setting.value = value
        if (description) {
            setting.description = description
        }
        setting.save(flush: true, failOnError: true)
        return setting
    }

    /**
     * Get all settings for a category
     */
    static List<Setting> getByCategory(String category) {
        return Setting.findAllByCategory(category, [sort: 'key', order: 'asc'])
    }

    /**
     * Get all settings as a Map
     */
    static Map<String, String> getAllAsMap() {
        def settings = Setting.list()
        return settings.collectEntries { [(it.key): it.value] }
    }

    String toString() {
        return "${key} = ${value}"
    }
}
