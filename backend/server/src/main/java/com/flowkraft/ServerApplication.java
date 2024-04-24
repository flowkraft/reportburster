package com.flowkraft;

import org.apache.commons.lang3.StringUtils;
import org.springframework.boot.ExitCodeGenerator;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.WebApplicationType;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.scheduling.annotation.EnableScheduling;

//import com.flowkraft.jobson.config.ApplicationConfig;

@SpringBootApplication
@EnableScheduling
@ComponentScan(basePackages = "com.flowkraft", excludeFilters = {
		@ComponentScan.Filter(type = FilterType.REGEX, pattern = "com\\.flowkraft\\.jobson\\..*"),
		@ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = com.flowkraft.CommandLineHandler.class) })
public class ServerApplication implements ExitCodeGenerator {

	private static int exitCode;

	public static void main(String[] args) {

		if (StringUtils.isBlank(System.getProperty("config.protocol")))
			System.setProperty("config.protocol", "classpath");

		if (StringUtils.isBlank(System.getProperty("config.file")))
			System.setProperty("config.file", "jobson/config-template.yml");

		// ApplicationConfig.serveWeb = _getShouldServeWeb(args);
		boolean serveWeb = _getShouldServeWeb(args);

		SpringApplicationBuilder appBuilder = new SpringApplicationBuilder(ServerApplication.class);

		// System.out.println("main serveWeb: " + ApplicationConfig.serveWeb);
		// System.out.println("main serveWeb: " + serveWeb);
		// System.out.println("main PORTABLE_EXECUTABLE_DIR: " +
		// System.getProperty("PORTABLE_EXECUTABLE_DIR"));

		// if (!ApplicationConfig.serveWeb) {
		if (!serveWeb) {
			appBuilder.web(WebApplicationType.NONE);
			exitCode = SpringApplication.exit(appBuilder.run(args));
		} else
			appBuilder.run(args);

		System.setProperty("spring.devtools.restart.enabled", "false");

	}

	private static boolean _getShouldServeWeb(String... args) {

		boolean serve = false;

		int i = 0;

		while (i < args.length && args[i].startsWith("-")) {
			String arg = args[i];

			if (arg.equals("-serve"))
				serve = true;

			i++;
		}

		return serve;

	}

	@Override
	public int getExitCode() {
		// TODO Auto-generated method stub
		return exitCode;
	}

}
