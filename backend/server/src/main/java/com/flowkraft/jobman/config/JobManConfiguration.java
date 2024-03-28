package com.flowkraft.jobman.config;

import javax.servlet.MultipartConfigElement;

import org.springframework.boot.web.servlet.MultipartConfigFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.unit.DataSize;

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
	@Bean
	public CorsWebFilter corsFilter() {
		return new CorsWebFilter(corsConfigurationSource());
	}

	@Bean
	CorsConfigurationSource corsConfigurationSource() {

		// System.out.println("cors");

		final UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();

		CorsConfiguration config = new CorsConfiguration().applyPermitDefaultValues();
		config.setAllowCredentials(true);
		
		config.setAllowedOrigins(Arrays.asList(Constants.FRONTEND_URL));
		//config.setAllowedOrigins(Arrays.asList("*", "file://"));

		config.addAllowedMethod(HttpMethod.PUT);
		config.addAllowedMethod(HttpMethod.DELETE);
		config.addAllowedMethod(HttpMethod.GET);
		config.addAllowedMethod(HttpMethod.POST);

		source.registerCorsConfiguration("/**", config);
		return source;
	}
	*/
}
