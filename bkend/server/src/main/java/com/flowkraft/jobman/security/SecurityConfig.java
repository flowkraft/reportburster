package com.flowkraft.jobman.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.www.BasicAuthenticationFilter;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;

/**
 * Spring Security configuration using the STANDARD pattern for Angular SPA + Spring Boot.
 * 
 * This is the official Spring Security recommended approach when:
 * - Angular SPA is bundled with Spring Boot (same origin)
 * - You need to protect API endpoints from unauthorized access
 * 
 * TWO authentication methods are supported:
 * 
 * 1. SESSION + CSRF (for Angular web mode - same origin):
 *    - Spring Security creates session (JSESSIONID cookie)
 *    - CSRF token provided via XSRF-TOKEN cookie
 *    - Angular's HttpClient automatically handles CSRF via HttpClientXsrfModule
 *    - No API key needed - session is the authentication
 * 
 * 2. API KEY (for Electron, Grails, WordPress - file system access):
 *    - Read API key from config/_internal/api-key.txt
 *    - Send as X-API-Key header
 *    - Stateless - no session needed
 * 
 * This is the standard pattern that emerged in the Spring community for SPA + Spring Boot.
 * See: https://docs.spring.io/spring-security/reference/servlet/exploits/csrf.html#csrf-integration-javascript
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    @Autowired
    private ApiKeyManager apiKeyManager;
    
    @Value("${reportburster.security.enabled:true}")
    private boolean securityEnabled;
    
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        
        if (!securityEnabled) {
            // Security disabled - allow all requests (development mode)
            http
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth.anyRequest().permitAll());
            return http.build();
        }
        
        // Standard CSRF token handler for SPAs
        CsrfTokenRequestAttributeHandler requestHandler = new CsrfTokenRequestAttributeHandler();
        // Don't require the token to be in the request attribute (allows header-based)
        requestHandler.setCsrfRequestAttributeName(null);
        
        http
            // === CSRF CONFIGURATION (Standard Spring Security + Angular pattern) ===
            // CookieCsrfTokenRepository: Puts CSRF token in XSRF-TOKEN cookie
            // Angular's HttpClient reads this cookie and sends as X-XSRF-TOKEN header
            // This is the STANDARD pattern documented by Spring Security for SPAs
            .csrf(csrf -> csrf
                .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                .csrfTokenRequestHandler(requestHandler)
                // Ignore CSRF for API key authenticated requests (Electron, Grails, WordPress)
                .ignoringRequestMatchers(request -> 
                    request.getHeader("X-API-Key") != null)
            )
            
            // === SESSION MANAGEMENT ===
            // IF_REQUIRED: Create session when needed (for Angular web mode)
            // API key requests remain stateless
            .sessionManagement(session -> 
                session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
            
            // === API KEY FILTER ===
            // For Electron/Grails/WordPress that send X-API-Key header
            .addFilterBefore(
                new ApiKeyAuthenticationFilter(apiKeyManager), 
                BasicAuthenticationFilter.class)
            
            // === AUTHORIZATION RULES ===
            .authorizeHttpRequests(auth -> auth
                // Public endpoints - no authentication required
                .requestMatchers(
                    "/api/health/**",
                    "/api/info/**",
                    // WebSocket endpoint - authentication handled by WebSocketSecurityConfig
                    // SockJS needs initial handshake to be accessible, then STOMP CONNECT is validated
                    "/api/jobman/ws/**",
                    "/webjars/**",
                    "/",
                    "/favicon.ico",
                    "/error",
                    // Static frontend files (Angular app served by Spring Boot)
                    "/*.html",
                    "/*.js", 
                    "/*.css",
                    "/*.ico",
                    "/*.png",
                    "/*.svg",
                    "/*.woff",
                    "/*.woff2",
                    "/*.ttf",
                    "/*.map",
                    "/assets/**"
                ).permitAll()
                
                // All API endpoints require authentication
                // Either: valid session (Angular) OR valid API key (Electron/Grails/WordPress)
                .anyRequest().authenticated()
            );
        
        return http.build();
    }
}
