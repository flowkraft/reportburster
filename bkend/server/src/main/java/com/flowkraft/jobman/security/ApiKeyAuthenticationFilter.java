package com.flowkraft.jobman.security;

import java.io.IOException;
import java.util.List;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Authentication filter for API key-based access (Electron, Grails, WordPress).
 * 
 * This filter handles machine-to-machine authentication where the client
 * reads the API key from the file system (config/_internal/api-key.txt)
 * and sends it as X-API-Key header.
 * 
 * This is used alongside Spring Security's standard session-based auth:
 * - Angular web mode: Uses session + CSRF (standard Spring pattern)
 * - Electron/Grails/WordPress: Uses API key (this filter)
 * 
 * If X-API-Key header is present and valid, this filter authenticates the request.
 * If not present, the request continues to standard session-based authentication.
 */
public class ApiKeyAuthenticationFilter extends OncePerRequestFilter {
    
    private static final String API_KEY_HEADER = "X-API-Key";
    
    private final ApiKeyManager apiKeyManager;
    
    public ApiKeyAuthenticationFilter(ApiKeyManager apiKeyManager) {
        this.apiKeyManager = apiKeyManager;
    }
    
    @Override
    protected void doFilterInternal(HttpServletRequest request, 
                                    HttpServletResponse response, 
                                    FilterChain filterChain) 
            throws ServletException, IOException {
        
        String apiKey = request.getHeader(API_KEY_HEADER);
        
        // If API key header is present, validate it
        if (apiKey != null && !apiKey.isEmpty()) {
            if (apiKeyManager.isValidApiKey(apiKey)) {
                // Create authentication token
                UsernamePasswordAuthenticationToken authentication = 
                    new UsernamePasswordAuthenticationToken(
                        "api-key-user",
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_API"))
                    );
                
                // Set in security context - request is now authenticated
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
            // If API key is invalid, don't set authentication
            // The request will continue and Spring Security will deny it
        }
        
        // Continue filter chain
        // If no API key, session-based auth will handle it
        filterChain.doFilter(request, response);
    }
}
