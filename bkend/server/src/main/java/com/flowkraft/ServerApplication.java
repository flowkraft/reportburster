package com.flowkraft;

import org.springframework.boot.ExitCodeGenerator;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.WebApplicationType;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
@ComponentScan(basePackages = "com.flowkraft")
public class ServerApplication implements ExitCodeGenerator {

    private static int exitCode;

    public static void main(String[] args) {

        boolean serveWeb = _getShouldServeWeb(args);

        SpringApplicationBuilder appBuilder = new SpringApplicationBuilder(ServerApplication.class);

        // Print PID in classic Spring Boot format (no timings)
        long pid = -1;
        try {
            pid = ProcessHandle.current().pid();
        } catch (Throwable t) {
            // Java 8 fallback: leave pid as -1
        }
        System.out.println("Started ServerApplication with PID " + pid);

        if (!serveWeb) {
            appBuilder.web(WebApplicationType.NONE);
            exitCode = SpringApplication.exit(appBuilder.run(args));
        } else {
            appBuilder.run(args);
        }

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
        return exitCode;
    }
}