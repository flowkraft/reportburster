package com.sourcekraft.documentburster;

import java.util.Arrays;

import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.sourcekraft.documentburster.utils.Utils;

import picocli.CommandLine;

public class DocumentBurster {

	private static Logger log = LoggerFactory.getLogger(DocumentBurster.class);

	/**
	 * CLI entry point — called by reportburster.bat via Ant.
	 * Calls execute() then System.exit().
	 */
	public static void main(String[] args) throws Throwable {
		int exitCode = execute(args);
		System.exit(exitCode);
	}

	/**
	 * Execute a command with full lifecycle: log start, run, log end, archive logs.
	 * Called by both CLI (main → execute → System.exit) and REST (JobExecutionService → execute).
	 * Same code path, same logging, same behavior — only difference is CLI exits the JVM after.
	 */
	public static int execute(String[] args) throws Throwable {
		int exitCode = 0;

		// Filter out empty arguments and Ant's unresolved ${argN} placeholders
		args = Arrays.stream(args).filter(arg -> arg != null && !arg.trim().isEmpty() && !arg.startsWith("${arg"))
				.toArray(String[]::new);

		log.info("***********************Program Started with Arguments : " + Arrays.toString(args)
				+ "***********************");

		GlobalContext global = new GlobalContext();

		try {
			MainProgram program = new MainProgram();
			program.setGlobal(global);

			CommandLine commandLine = new CommandLine(program);

			commandLine.setParameterExceptionHandler((ex, args1) -> {
				String errorMsg = "Command parameter validation error: " + ex.getMessage();
				log.error(errorMsg, ex);
				ex.getCommandLine().usage(System.err);
				return 2;
			});

			commandLine.setExecutionExceptionHandler((ex, cmd, parseResult) -> {
				String errorMsg = ex.getMessage();
				log.error(errorMsg, ex);
				return 1;
			});

			exitCode = commandLine.execute(args);

			if (exitCode != 0) {
				String errorMsg = "Command execution failed with exit code: " + exitCode;
				log.error(errorMsg);
			}

		} catch (Throwable e) {
			exitCode = -1;
			log.error("Exception: ", e);
			throw e;
		} finally {
			log.info("***************************Execution Ended***************************");

			if (StringUtils.isNotEmpty(global.logsArchivesFolder))
				Utils.archiveLogFiles(global.logsArchivesFolder);
		}

		return exitCode;
	}
}
