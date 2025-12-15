package com.flowkraft.jobman.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import com.flowkraft.common.AppPaths;

/**
 * Static resource configuration for serving web components.
 * 
 * This allows external applications (Grails, WordPress, custom HTML pages, etc.)
 * to include the web components directly from the ReportBurster server:
 * 
 * <script src="http://reportburster-server:9090/rb-webcomponents/rb-webcomponents.umd.js"></script>
 * 
 * The files are served from {PORTABLE_EXECUTABLE_DIR}/tools/rb-webcomponents/
 * 
 * Benefits:
 * - No API endpoint needed (just static file serving)
 * - No authentication required (static resources bypass security)
 * - Eliminates need to stage web components to Grails, WordPress, etc.
 * - Single source of truth for web components
 */
@Configuration
public class WebComponentsResourceConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Serve web components from tools/rb-webcomponents folder
        // URL: /rb-webcomponents/** -> file:{PORTABLE_EXECUTABLE_DIR}/tools/rb-webcomponents/
        String webComponentsPath = AppPaths.PORTABLE_EXECUTABLE_DIR_PATH + "/tools/rb-webcomponents/";
        
        registry.addResourceHandler("/rb-webcomponents/**")
                .addResourceLocations("file:" + webComponentsPath)
                .setCachePeriod(3600); // Cache for 1 hour
    }
}
