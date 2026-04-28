package com.sourcekraft.documentburster;

import java.util.Arrays;

import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.sourcekraft.documentburster.utils.Utils;

import picocli.CommandLine;

/**
 * DocumentBurster — CLI + embedded entry point for the reporting engine.
 *
 * <h2>Exception handling philosophy</h2>
 * Business code (MainProgram, burst/extract pipelines, Groovy hooks, etc.)
 * NEVER catches. Every `Throwable` bubbles up to this file's single
 * {@code try/catch} below. That one handler does three things:
 * <ol>
 *   <li>log the full stack trace via SLF4J — the {@code com.sourcekraft} logger
 *       is wired to both the Console appender (stdout) and the error-out
 *       appender ({@code errors.log}), so the stack is visible in the shell
 *       AND persisted to disk;</li>
 *   <li>rethrow — so the JVM's uncaught-exception handler also prints to
 *       stderr, and so the CLI wrapper ({@code DataPallas.bat}) sees a
 *       non-zero exit code and can fail the whole batch run;</li>
 *   <li>finally — always archive the run's log files even on failure, so a
 *       post-mortem has everything in one place.</li>
 * </ol>
 * This is the sibling pattern to {@code bkend/server}'s
 * {@code GlobalExceptionHandler} (the single {@code @RestControllerAdvice}
 * for the Spring Boot REST app). Same philosophy — business code never
 * catches, one top-level handler logs with full stack — but GlobalExceptionHandler
 * returns HTTP 500 instead of rethrowing, since the server must stay up for
 * the next request while DocumentBurster exits the JVM after each run.
 *
 * <p><b>Note:</b> this is the DEFAULT general approach, not an absolute rule.
 * A handful of scattered {@code catch} blocks still exist throughout the
 * reporting codebase, and each remaining one is there for a specific reason:
 * <ul>
 *   <li><b>Business-logic-justified</b> — the catch site is where the
 *       recovery/fallback actually belongs (e.g. a probe that must return a
 *       safe default when the target resource is missing, a best-effort
 *       cleanup that should not mask the original failure);</li>
 *   <li><b>Technical obligation</b> — a third-party API mandates a checked
 *       exception that can't be rethrown across a framework boundary, or a
 *       callback signature doesn't allow propagation.</li>
 * </ul>
 * No {@code catch} block should exist just because leaving one in was the
 * path of least resistance. Every surviving catch needs to be justifiable
 * under one of the two rules above; if it isn't, delete it and let the
 * exception reach this top-level handler.
 *
 * <p>Such exceptions to the rule should be <b>very few and genuinely
 * exceptional</b> — if you find yourself reaching for a catch in new code,
 * assume the default rule applies and push back hard on any attempt to
 * introduce another one. The further this codebase drifts from "one catch
 * total", the harder it becomes to see what actually went wrong.
 */
public class DocumentBurster {

	private static Logger log = LoggerFactory.getLogger(DocumentBurster.class);

	/**
	 * CLI entry point — called by DataPallas.bat via Ant.
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
			// The ONE catch for the whole reporting engine. Everything above
			// is allowed to throw freely; we land here for any Throwable.
			exitCode = -1;                       // non-zero = CLI wrapper sees failure
			log.error("Exception: ", e);         // full stack → Console (stdout) + errors.log
			                                     // (SLF4J formats the Throwable with its stack trace
			                                     //  when it's the last arg to log.error)
			throw e;                             // rethrow so the JVM's default handler also
			                                     // prints to stderr, and so main()'s System.exit()
			                                     // gets the non-zero code set above
		} finally {
			// `finally` runs on both success AND after the `throw` above, so
			// the "Execution Ended" line is always present in the log —
			// a reliable end-of-run marker for support/diagnostics.
			log.info("***************************Execution Ended***************************");

			// Archive this run's log files even on failure — post-mortems
			// need the logs AND the archive in one place.
			if (StringUtils.isNotEmpty(global.logsArchivesFolder))
				Utils.archiveLogFiles(global.logsArchivesFolder);
		}

		return exitCode;
	}
}
