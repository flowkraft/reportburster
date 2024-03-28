package com.flowkraft.jobman.filter;

import java.io.IOException;

import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.FilterConfig;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Component;

@Component
public class JobManFilter implements Filter {
	 @Override
	    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain) throws IOException, ServletException {
	        //System.out.println("doFilter *****************************************");
	        
		 	HttpServletRequest request = (HttpServletRequest) req;
	        
		 	//System.out.println(request.getHeader("origin"));
		 	
		 	HttpServletResponse response = (HttpServletResponse) res;

	        response.setHeader("Access-Control-Allow-Credentials", "true");
	        
	        //response.setHeader("Access-Control-Allow-Origin", "http://localhost:4200, file://");
	        String requestOrigin = request.getHeader("origin");
	        if (StringUtils.isBlank(requestOrigin))
	        	requestOrigin = "*";
	        
	        response.setHeader("Access-Control-Allow-Origin", requestOrigin);
	        response.setHeader("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE, OPTIONS");	        
	        response.setHeader("Access-Control-Allow-Headers", "Content-Type");

	        chain.doFilter(req, res);
	    }

	    @Override
	    public void init(FilterConfig filterConfig) {
	        // System.out.println("init *****************************************");

	    }

	    @Override
	    public void destroy() {
	    }
}
