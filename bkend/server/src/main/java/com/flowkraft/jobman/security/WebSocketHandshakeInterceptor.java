package com.flowkraft.jobman.security;

import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;
import org.springframework.web.util.UriComponentsBuilder;

import jakarta.servlet.http.HttpSession;
import java.util.Map;

/**
 * WebSocket Handshake Interceptor.
 * 
 * Intercepts the initial HTTP handshake before WebSocket upgrade to:
 * 
 * 1. Validate existing session authentication (web mode)
 *    - If user has valid JSESSIONID with authenticated session, mark as authenticated
 * 
 * 2. Extract API key from query parameter (Electron mode)
 *    - access_token=XXX is passed in URL
 *    - Stored in session attributes for later validation in STOMP CONNECT
 * 
 * This interceptor runs BEFORE the WebSocket upgrade happens.
 */
public class WebSocketHandshakeInterceptor implements HandshakeInterceptor {

    private final ApiKeyManager apiKeyManager;
    private final boolean securityEnabled;

    public WebSocketHandshakeInterceptor(ApiKeyManager apiKeyManager, boolean securityEnabled) {
        this.apiKeyManager = apiKeyManager;
        this.securityEnabled = securityEnabled;
    }

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                   WebSocketHandler wsHandler, Map<String, Object> attributes) throws Exception {
        
        if (!securityEnabled) {
            // Security disabled - allow all
            attributes.put("authenticated", true);
            return true;
        }

        // 1. Check if user is already authenticated via session (web mode)
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            // User is authenticated via session
            attributes.put("authenticated", true);
            attributes.put("username", auth.getName());
            return true;
        }

        // 2. Check for API key in query parameter (Electron mode)
        String query = request.getURI().getQuery();
        if (query != null) {
            Map<String, String> queryParams = UriComponentsBuilder
                .fromUriString("?" + query)
                .build()
                .getQueryParams()
                .toSingleValueMap();
            
            String accessToken = queryParams.get("access_token");
            if (accessToken != null && !accessToken.isEmpty()) {
                // Validate API key
                if (apiKeyManager.isValidApiKey(accessToken)) {
                    attributes.put("authenticated", true);
                    attributes.put("apiKey", accessToken);
                    return true;
                }
            }
        }

        // 3. Check session again (might have JSESSIONID cookie)
        if (request instanceof ServletServerHttpRequest) {
            HttpSession session = ((ServletServerHttpRequest) request).getServletRequest().getSession(false);
            if (session != null) {
                // Session exists - Spring Security would have validated it
                // Allow connection, STOMP CONNECT will do final validation
                attributes.put("sessionId", session.getId());
                return true;
            }
        }

        // Allow handshake to proceed - final security check happens in STOMP CONNECT
        // This is because SockJS needs to complete handshake before STOMP headers are available
        return true;
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                               WebSocketHandler wsHandler, Exception exception) {
        // Nothing to do after handshake
    }
}
