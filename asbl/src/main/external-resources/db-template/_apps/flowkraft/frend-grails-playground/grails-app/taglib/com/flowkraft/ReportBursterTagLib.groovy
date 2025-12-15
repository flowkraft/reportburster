package com.flowkraft

import groovy.util.logging.Slf4j

/**
 * TagLib for ReportBurster configuration in GSP views.
 * 
 * Provides tags to access ReportBurster configuration values like API key and backend URL.
 * The API key is read from config/_internal/api-key.txt (production) with fallback to '123' (development).
 */
@Slf4j
class ReportBursterTagLib {
    
    static namespace = "rb"
    
    // Relative path from grails-app directory to api-key.txt
    static final String API_KEY_PATH = '../../../config/_internal/api-key.txt'
    static final String DEFAULT_API_KEY = '123'
    
    // Cache the API key (it doesn't change at runtime)
    private static String cachedApiKey = null
    
    /**
     * Outputs the API key for use in JavaScript.
     * 
     * Reads from config/_internal/api-key.txt if available (production),
     * otherwise returns '123' (development fallback, same as init.service.ts).
     * 
     * Usage: ${rb.apiKey()}
     */
    def apiKey = { attrs ->
        out << getApiKey()
    }
    
    /**
     * Outputs the backend base URL.
     * 
     * Usage: ${rb.backendUrl()}
     */
    def backendUrl = { attrs ->
        out << grailsApplication.config.getProperty('reportburster.backend.baseUrl', 'http://localhost:9090')
    }
    
    /**
     * Outputs the full API base URL (backend URL + /api/jobman/reporting).
     * 
     * Usage: ${rb.apiBaseUrl()}
     */
    def apiBaseUrl = { attrs ->
        def baseUrl = grailsApplication.config.getProperty('reportburster.backend.baseUrl', 'http://localhost:9090')
        out << "${baseUrl}/api/jobman/reporting"
    }
    
    /**
     * Outputs a complete rbConfig JavaScript object for use in layouts.
     * 
     * Usage: <rb:configScript/>
     */
    def configScript = { attrs ->
        def baseUrl = grailsApplication.config.getProperty('reportburster.backend.baseUrl', 'http://localhost:9090')
        def apiKey = getApiKey()
        
        out << """
        // ReportBurster configuration (auto-discovered)
        window.rbConfig = {
            apiBaseUrl: '${baseUrl}/api/jobman/reporting',
            apiKey: '${apiKey}'
        };
        """
    }
    
    /**
     * Get the API key, reading from file or using fallback.
     * Result is cached for performance.
     */
    private String getApiKey() {
        if (cachedApiKey != null) {
            return cachedApiKey
        }
        
        cachedApiKey = discoverApiKey() ?: DEFAULT_API_KEY
        return cachedApiKey
    }
    
    /**
     * Auto-discover API key from ReportBurster's api-key.txt file.
     * 
     * The api-key.txt is created by the Spring Boot backend on first startup.
     * It contains a UUID that must be sent in the X-API-Key header.
     * 
     * @return The API key or null if unavailable
     */
    private String discoverApiKey() {
        try {
            // Resolve path relative to grails-app directory
            def apiKeyFile = new File(System.getProperty('user.dir'), API_KEY_PATH)
            
            if (!apiKeyFile.exists()) {
                // Try alternate path from application root
                apiKeyFile = new File('config/_internal/api-key.txt')
            }
            
            if (!apiKeyFile.exists()) {
                log.info("api-key.txt not found, using default key for development")
                return null
            }
            
            def key = apiKeyFile.text?.trim()
            
            if (key) {
                log.info("Auto-discovered API key from api-key.txt")
                return key
            }
            
            log.info("api-key.txt is empty, using default key for development")
            return null
            
        } catch (Exception e) {
            log.warn("Error reading api-key.txt: ${e.message}, using default key")
            return null
        }
    }
    
    /**
     * Clear the cached API key (useful if the key file is regenerated).
     */
    static void clearCache() {
        cachedApiKey = null
    }
}
