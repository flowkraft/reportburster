package com.flowkraft.jobson.websockets.v1;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

import com.flowkraft.jobson.Constants;

@Configuration
// @EnableWebSocketMessageBroker
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

// WebSocketMessageBrokerConfigurer {

	@Autowired
	private JobEventSocket jobEventSocket;
	@Autowired
	private StdoutUpdateSocket stdoutUpdateSocket;
	@Autowired
	private StderrUpdateSocket stderrUpdateSocket;

	@Override
	public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {

		registry.addHandler(jobEventSocket, Constants.WEBSOCKET_JOB_EVENTS_PATH);
		registry.addHandler(stdoutUpdateSocket, Constants.WEBSOCKET_STDOUT_UPDATES_PATTERN);
		registry.addHandler(stderrUpdateSocket, Constants.WEBSOCKET_STDERR_UPDATES_PATTERN);

	}

	/*
	 * @Override public void configureMessageBroker(MessageBrokerRegistry config) {
	 * config.enableSimpleBroker("/topic");
	 * config.setApplicationDestinationPrefixes("/job"); }
	 * 
	 * @Override public void registerStompEndpoints(StompEndpointRegistry registry)
	 * {
	 * registry.addEndpoint("/quartzman/logs").setAllowedOrigins("/**").withSockJS()
	 * ; registry.addEndpoint("/quartzman/progress").setAllowedOrigins("/**").
	 * withSockJS(); }
	 * 
	 */
}
