package com.flowkraft.jobman.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.flowkraft.jobman.security.ApiKeyManager;

import jakarta.servlet.http.HttpServletRequest;

import java.util.Map;

/**
 * Controller for API security-related endpoints.
 * 
 * Security model for API key:
 * 1. /api/security/bootstrap - Returns the API key (localhost-only access)
 * 2. All /jobman/* endpoints require the API key in X-API-Key header
 * 
 * This allows internal apps (Angular, Grails, WordPress on same machine)
 * to auto-discover the API key, while external apps cannot access it.
 */
@RestController
@RequestMapping("/api/security")
public class SecurityController {
    
    @Autowired
    private ApiKeyManager apiKeyManager;
    
    /**
     * Bootstrap endpoint to get the API key.
     * 
     * SECURITY: Only accessible from localhost (same machine).
     * 
     * Internal apps call this once on startup, store the key in memory,
     * and include it in all subsequent API requests.
     */
    @GetMapping("/bootstrap")
    public Map<String, Object> bootstrap(HttpServletRequest request) {
        // Only allow localhost access
        String remoteAddr = request.getRemoteAddr();
        boolean isLocalhost = "127.0.0.1".equals(remoteAddr) || 
                              "0:0:0:0:0:0:0:1".equals(remoteAddr) ||
                              "localhost".equalsIgnoreCase(remoteAddr);
        
        if (!isLocalhost) {
            throw new SecurityException("Bootstrap endpoint only accessible from localhost");
        }
        
        return Map.of(
            "apiKey", apiKeyManager.getApiKey(),
            "header", "X-API-Key",
            "queryParam", "apiKey"
        );
    }
    
    /**
     * Get the path to the API key file (for file-based discovery).
     * 
     * This is public - it just tells WHERE the file is, not the key itself.
     */
    @GetMapping("/key-path")
    public Map<String, String> getApiKeyPath() {
        return Map.of(
            "apiKeyPath", apiKeyManager.getApiKeyPath().toString(),
            "header", "X-API-Key",
            "queryParam", "apiKey"
        );
    }
}
