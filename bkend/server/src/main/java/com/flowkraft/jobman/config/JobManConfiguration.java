package com.flowkraft.jobman.config;

import jakarta.servlet.MultipartConfigElement;

import java.util.Arrays;

import org.springframework.boot.web.servlet.MultipartConfigFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.unit.DataSize;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;
import com.flowkraft.common.Constants;

@Configuration
public class JobManConfiguration {

	/*
	 * @Bean
	 * 
	 * @Scope(value = "prototype") public MonitoringFileService
	 * monitorFileService(String fileName) throws Exception { return new
	 * MonitoringFileService(fileName); }
	 * 
	 * 
	 */

	// private static final String FRONTEND_LOCALHOST = "http://localhost:4200";
	// private static final String FRONTEND_STAGING = "https://somehost.github.io";

	@Bean
	MultipartConfigElement multipartConfigElement() {
		MultipartConfigFactory factory = new MultipartConfigFactory();
		factory.setMaxFileSize(DataSize.ofBytes(120000000L));
		factory.setMaxRequestSize(DataSize.ofBytes(120000000L));
		return factory.createMultipartConfig();
	}

	/*
	Provide CORS configuration as a bean so Spring Security and the servlet filter pick it up.
	*/
	@Bean
	public UrlBasedCorsConfigurationSource corsConfigurationSource() {
		UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();

		CorsConfiguration config = new CorsConfiguration().applyPermitDefaultValues();
		config.setAllowCredentials(true);
		// Allow the packaged frontend via file:// and allow localhost dev ports (4200, 4201)
		// setAllowedOriginPatterns permits host:port wildcard patterns which is helpful for dev
		config.setAllowedOriginPatterns(Arrays.asList("http://localhost:*", "file://"));
		config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
		// Allow all headers during local development so XSRF and X-API-Key are accepted.
		// For production tighten this to explicit headers.
		config.setAllowedHeaders(Arrays.asList("*"));
		source.registerCorsConfiguration("/**", config);
		return source;
	}

	@Bean
	public CorsFilter corsFilter(UrlBasedCorsConfigurationSource corsConfigurationSource) {
		return new CorsFilter(corsConfigurationSource);
	}
}
