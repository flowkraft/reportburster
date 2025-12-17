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
            .cors().and()
            // === CSRF CONFIGURATION (Standard Spring Security + Angular pattern) ===
            // CookieCsrfTokenRepository: Puts CSRF token in XSRF-TOKEN cookie
            // Angular's HttpClient reads this cookie and sends as X-XSRF-TOKEN header
            .csrf(csrf -> csrf
                .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                .csrfTokenRequestHandler(requestHandler)
                // Ignore CSRF for API key authenticated requests (Electron, Grails, WordPress)
                .ignoringRequestMatchers(request -> request.getHeader("X-API-Key") != null)
            )

            // === SESSION MANAGEMENT ===
            // IF_REQUIRED: Create session when needed (for Angular web mode)
            // API key requests remain stateless
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))

            // === API KEY FILTER ===
            // For Electron/Grails/WordPress that send X-API-Key header
            .addFilterBefore(new ApiKeyAuthenticationFilter(apiKeyManager), BasicAuthenticationFilter.class)

            // === AUTHORIZATION RULES ===
            // Allow unauthenticated access to all static assets + web components (static resources for external embedding)
            // Remaining (API) requests require authentication
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/rb-webcomponents/**").permitAll()
                .requestMatchers("/", "/index.html", "/favicon.ico", "/assets/**", "/lib/frend/**").permitAll()
                // Permit direct requests for common static file extensions (safe replacement for /**/*.css / **/*.js which are invalid patterns)
                .requestMatchers(request -> {
                    String uri = request.getRequestURI();
                    return uri != null && (
                        uri.endsWith(".css") || uri.endsWith(".js") || uri.endsWith(".map") ||
                        uri.endsWith(".png") || uri.endsWith(".svg") ||
                        uri.endsWith(".woff") || uri.endsWith(".woff2") ||
                        uri.endsWith(".eot") || uri.endsWith(".ttf") || uri.endsWith(".ico") ||
                        uri.startsWith("/.well-known/")
                    );
                }).permitAll()
                .anyRequest().authenticated()
            );
        
        return http.build();
    }
}
