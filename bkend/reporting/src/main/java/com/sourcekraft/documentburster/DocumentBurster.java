package com.sourcekraft.documentburster;

import java.util.Arrays;

import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.sourcekraft.documentburster.utils.Utils;

import picocli.CommandLine;

public class DocumentBurster {

	private static Logger log = LoggerFactory.getLogger(DocumentBurster.class);

	public static void main(String[] args) throws Throwable {
		int exitCode = 0;

		// Filter out empty arguments
		args = Arrays.stream(args).filter(arg -> arg != null && !arg.trim().isEmpty() && !arg.startsWith("${arg"))
				.toArray(String[]::new);

		log.info("***********************Program Started with Arguments : " + Arrays.toString(args)
				+ "***********************");

		// Enable Picocli debug tracing
		// System.setProperty("picocli.trace", "DEBUG");

		GlobalContext global = new GlobalContext();

		try {
			// Create a MainProgram instance
			MainProgram program = new MainProgram();
			program.setGlobal(global);

			// Use picocli to execute the command directly with custom exception handlers
			CommandLine commandLine = new CommandLine(program);

			// Set parameter exception handler to capture validation errors
			commandLine.setParameterExceptionHandler((ex, args1) -> {
				String errorMsg = "Command parameter validation error: " + ex.getMessage();
				log.error(errorMsg, ex);
				ex.getCommandLine().usage(System.err);
				return 2; // Standard exit code for user errors
			});

			// Set execution exception handler to capture runtime errors
			commandLine.setExecutionExceptionHandler((ex, cmd, parseResult) -> {
				String errorMsg = ex.getMessage();
				log.error(errorMsg, ex);
				return 1; // Standard exit code for runtime errors
			});

			exitCode = commandLine.execute(args);

			// Check if execution failed
			if (exitCode != 0) {
				String errorMsg = "Command execution failed with exit code: " + exitCode;
				log.error(errorMsg);
				// Not throwing exception here to avoid hiding the real error
			}

		} catch (Throwable e) {
			exitCode = -1;
			log.error("Exception: ", e);
			throw e;
		} finally {
			log.info("***************************Execution Ended***************************");

			if (StringUtils.isNotEmpty(global.logsArchivesFolder))
				Utils.archiveLogFiles(global.logsArchivesFolder);

			System.exit(exitCode);
		}
	}
}