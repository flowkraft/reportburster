package com.flowkraft.jobman.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * WebSocket Security Configuration.
 * 
 * Secures WebSocket/STOMP connections using the same dual authentication pattern as REST:
 * 
 * 1. SESSION (for Angular web mode):
 *    - SockJS automatically includes cookies (JSESSIONID)
 *    - Session is already authenticated via Spring Security
 *    - Validated during handshake via WebSocketHandshakeInterceptor
 * 
 * 2. API KEY (for Electron/Grails/WordPress):
 *    - Passed as query parameter: /api/jobman/ws?access_token=XXX
 *    - Validated during STOMP CONNECT via ChannelInterceptor
 * 
 * This is the standard Spring Security approach for WebSocket security.
 */
@Configuration
@Order(Ordered.HIGHEST_PRECEDENCE + 99)
public class WebSocketSecurityConfig implements WebSocketMessageBrokerConfigurer {

    @Autowired
    private ApiKeyManager apiKeyManager;

    @Value("${reportburster.security.enabled:true}")
    private boolean securityEnabled;

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

                if (!securityEnabled) {
                    // Security disabled - allow all
                    return message;
                }

                if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                    // Check if already authenticated via session (web mode)
                    // The WebSocketHandshakeInterceptor will have set user on the session
                    if (accessor.getUser() != null) {
                        // Already authenticated via session
                        return message;
                    }
                    
                    // TEMP (2025-12-19): API key authentication disabled for rollback.
                    // We return early to avoid executing the API key/STOMP authentication block below
                    // which is preserved (commented) for easy re-enabling in the future.
                    return message;

                    /* ORIGINAL AUTHENTICATION LOGIC (PRESERVED FOR RE-ENABLING)
                    // Check for API key in STOMP headers (Electron/Grails/WordPress)
                    String apiKey = accessor.getFirstNativeHeader("X-API-Key");
                    
                    // Also check in session attributes (set by handshake interceptor from query param)
                    if (apiKey == null) {
                        Map<String, Object> sessionAttributes = accessor.getSessionAttributes();
                        if (sessionAttributes != null) {
                            apiKey = (String) sessionAttributes.get("apiKey");
                        }
                    }

                    if (apiKey != null && apiKeyManager.isValidApiKey(apiKey)) {
                        // Valid API key - create authentication
                        List<SimpleGrantedAuthority> authorities = 
                            Collections.singletonList(new SimpleGrantedAuthority("ROLE_API"));
                        UsernamePasswordAuthenticationToken auth = 
                            new UsernamePasswordAuthenticationToken("api-client", null, authorities);
                        accessor.setUser(auth);
                        SecurityContextHolder.getContext().setAuthentication(auth);
                        return message;
                    }

                    // Check if session-authenticated user exists
                    Map<String, Object> sessionAttributes = accessor.getSessionAttributes();
                    if (sessionAttributes != null) {
                        Object authenticated = sessionAttributes.get("authenticated");
                        if (Boolean.TRUE.equals(authenticated)) {
                            // Already authenticated via session handshake
                            List<SimpleGrantedAuthority> authorities = 
                                Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER"));
                            UsernamePasswordAuthenticationToken auth = 
                                new UsernamePasswordAuthenticationToken("web-user", null, authorities);
                            accessor.setUser(auth);
                            return message;
                        }
                    }

                    // No valid authentication found - reject connection
                    throw new SecurityException("WebSocket connection requires authentication. " +
                        "Provide either a valid session (web mode) or X-API-Key header/access_token parameter (Electron mode).");
                    END ORIGINAL */
                }

                return message;
            }
        });
    }
}
