package com.sourcekraft.documentburster;

import java.io.File;
import java.io.FileNotFoundException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Callable;

import org.apache.commons.io.FileUtils;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.sourcekraft.documentburster.common.settings.Settings;
import com.sourcekraft.documentburster.job.CliJob;

import picocli.CommandLine;
import picocli.CommandLine.ArgGroup;
import picocli.CommandLine.Command;
import picocli.CommandLine.Mixin;
import picocli.CommandLine.Model.CommandSpec;
import picocli.CommandLine.Option;
import picocli.CommandLine.Parameters;
import picocli.CommandLine.ParentCommand;
import picocli.CommandLine.Spec;

@Command(name = "reportburster", mixinStandardHelpOptions = true, version = "ReportBurster 10.3.0", description = "Report bursting and report generation software", subcommands = {
		MainProgram.BurstCommand.class, MainProgram.GenerateCommand.class, MainProgram.ResumeCommand.class,
		MainProgram.DocumentCommand.class, MainProgram.SystemCommand.class })
public class MainProgram implements Callable<Integer> {

	private static Logger log = LoggerFactory.getLogger(MainProgram.class);

	// Job type constants for tagging
	public static final String JOB_TYPE_BURST = "burst";
	public static final String JOB_TYPE_GENERATE = "generate";
	public static final String JOB_TYPE_MERGE = "merge";

	private GlobalContext global = new GlobalContext();

	@Spec
	CommandSpec spec;

	public void setGlobal(GlobalContext global) {
		this.global = global;
	}

	public GlobalContext getGlobal() {
		return this.global;
	}

	@Override
	public Integer call() {
		// Show help when no command is specified
		spec.commandLine().usage(System.out);
		return 0;
	}

	public void execute(String[] args) throws Throwable {
		int exitCode = new CommandLine(this).execute(args);
		if (exitCode != 0) {
			throw new RuntimeException("Command execution failed with exit code: " + exitCode);
		}
	}

	// Common options for configuration
	public static class ConfigOptions {
		@Option(names = { "-c", "--config" }, description = "Configuration file path")
		String configFile;
	}

	public static class QaOptions {
		@ArgGroup(exclusive = true, multiplicity = "0..1")
		private TestOptions testOptions = new TestOptions();

		static class TestOptions {
			@Option(names = { "-ta", "--testall" }, description = "Test all entries")
			boolean testAll = false;

			@Option(names = { "-tl", "--testlist" }, description = "Comma separated list of entries to test")
			String testList;

			@Option(names = { "-tr",
					"--testrandom" }, description = "Number of randomly selected entries to test (must be positive)", paramLabel = "<count>")
			Integer randomTests;
		}

		// Accessor methods to maintain compatibility with existing code
		public boolean isTestAll() {
			return testOptions != null && testOptions.testAll;
		}

		public String getTestList() {
			return (testOptions == null || testOptions.testList == null) ? StringUtils.EMPTY : testOptions.testList;
		}

		public int getRandomTestsCount() {
			return (testOptions == null || testOptions.randomTests == null) ? -1 : testOptions.randomTests;
		}
	}

	// Base command with shared functionality
	abstract static class BaseCommand {
		protected CliJob getJob(String configFilePath) throws Exception {
			if (StringUtils.isNotEmpty(configFilePath)) {
				File file = new File(configFilePath);
				if (!file.exists()) {
					throw new FileNotFoundException("Configuration file does not exist: " + configFilePath);
				}
			}

			MainProgram parent = getMainProgram();
			CliJob job = new CliJob(configFilePath);
			job.setGlobal(parent.global);
			return job;
		}

		protected abstract MainProgram getMainProgram();
	}

	@Command(name = "burst", description = "Burst a document into multiple documents")
	public static class BurstCommand extends BaseCommand implements Callable<Integer> {
		@ParentCommand
		protected MainProgram parent;

		@Parameters(index = "0", description = "Input file to process", arity = "1")
		protected File inputFile;

		@Mixin
		protected ConfigOptions config;

		@Mixin
		protected QaOptions qa;

		@Override
		protected MainProgram getMainProgram() {
			return parent;
		}

		@Override
		public Integer call() throws Exception {
			if (!inputFile.exists()) {
				throw new FileNotFoundException("Input file does not exist: " + inputFile.getAbsolutePath());
			}

			// Validate random tests parameter if it's provided (not -1)
			int randomTestsCount = qa.getRandomTestsCount();
			if (randomTestsCount != -1 && randomTestsCount <= 0) {
				throw new CommandLine.ParameterException(parent.spec.commandLine(),
						"Number of randomly selected entries to test must be positive");
			}

			CliJob job = getJob(config.configFile);
			job.doBurst(inputFile.getAbsolutePath(), qa.isTestAll(), qa.getTestList(), qa.getRandomTestsCount());
			return 0;
		}
	}

	@Command(name = "generate", description = "Generate reports from input data")
	public static class GenerateCommand extends BaseCommand implements Callable<Integer> {
		@ParentCommand
		MainProgram parent;

		@Parameters(index = "0", description = "Input to process", arity = "1")
		private String input;

		@Mixin
		private ConfigOptions config;

		@Mixin
		private QaOptions qa;

		@Option(names = { "-p",
				"--param" }, description = "Report parameters in key=value format (can be repeated)", paramLabel = "KEY=VALUE")
		private Map<String, String> parameters = new HashMap<>();

		@Override
		protected MainProgram getMainProgram() {
			return parent;
		}

		@Override
		public Integer call() throws Exception {
			// Check config required for all types
			if (config.configFile == null) {
				throw new CommandLine.ParameterException(parent.spec.commandLine(),
						"Configuration file (-c/--config) is required");
			}

			// Validate random tests parameter if provided (must be positive)
			int randomTestsCount = qa.getRandomTestsCount();
			if (randomTestsCount > 0 && randomTestsCount <= 0) {
				throw new CommandLine.ParameterException(parent.spec.commandLine(),
						"Number of random tests must be positive");
			}

			Settings settings = new Settings(config.configFile);
			settings.loadSettings();

			boolean isReportGenerationJob = settings.getCapabilities().reportgenerationmailmerge;

			// Validate and process parameters
			Map<String, String> typedParameters = ParameterParser.parseParameters(parameters);

			CliJob job = getJob(config.configFile);
			job.setJobType(isReportGenerationJob ? settings.getReportDataSource().type : "burst");

			job.setParameters(typedParameters);

			job.doBurst(input, qa.isTestAll(), qa.getTestList(), qa.getRandomTestsCount());

			return 0;
		}
	}

	@Command(name = "resume", description = "Resume a previously paused job")
	public static class ResumeCommand extends BaseCommand implements Callable<Integer> {
		@ParentCommand
		MainProgram parent;

		@Parameters(index = "0", description = "Job progress file to resume", arity = "1")
		private File jobProgressFile;

		@Override
		protected MainProgram getMainProgram() {
			return parent;
		}

		@Override
		public Integer call() throws Exception {
			if (!jobProgressFile.exists()) {
				throw new FileNotFoundException(
						"Job progress file does not exist: " + jobProgressFile.getAbsolutePath());
			}

			CliJob job = getJob(null);
			job.doResume(jobProgressFile.getAbsolutePath());
			return 0;
		}
	}

	@Command(name = "document", description = "Document operations", subcommands = {
			MainProgram.DocumentCommand.MergeCommand.class })
	public static class DocumentCommand implements Callable<Integer> {
		@ParentCommand
		MainProgram parent;

		@Spec
		CommandSpec spec;

		@Override
		public Integer call() {
			spec.commandLine().usage(System.out);
			return 0;
		}

		@Command(name = "merge", description = "Merge multiple documents into one")
		public static class MergeCommand extends BaseCommand implements Callable<Integer> {
			@ParentCommand
			DocumentCommand documentCommand;

			@Parameters(index = "0", description = "File containing list of documents to merge", arity = "1")
			private File listFile;

			@Option(names = { "-o", "--output" }, description = "Output file name")
			private String outputFileName;

			@Option(names = { "-b", "--burst" }, description = "Burst the merged file")
			private boolean burst = false;

			@Mixin
			private ConfigOptions config;

			@Override
			protected MainProgram getMainProgram() {
				return documentCommand.parent;
			}

			@Override
			public Integer call() throws Exception {
				if (!listFile.exists()) {
					throw new FileNotFoundException("List file does not exist: " + listFile.getAbsolutePath());
				}

				List<String> filePaths = Files.readAllLines(listFile.toPath(), StandardCharsets.UTF_8);

				for (String filePath : filePaths) {
					File file = new File(filePath);
					if (!file.exists()) {
						throw new FileNotFoundException("Input file does not exist: " + filePath);
					}
				}

				CliJob job = getJob(config.configFile);
				String outputMergedFilePath = job.doMerge(filePaths, outputFileName);

				if (burst) {
					job.doBurst(outputMergedFilePath, false, StringUtils.EMPTY, -1);
				}

				FileUtils.deleteQuietly(listFile);
				return 0;
			}
		}
	}

	@Command(name = "system", description = "System operations", subcommands = {
			MainProgram.SystemCommand.TestEmailCommand.class, MainProgram.SystemCommand.TestSmsCommand.class,
			MainProgram.SystemCommand.LicenseCommand.class, MainProgram.SystemCommand.FeatureRequestCommand.class,
			MainProgram.SystemCommand.TestAndFetchDatabaseSchemaCommand.class })
	public static class SystemCommand implements Callable<Integer> {
		@ParentCommand
		MainProgram parent;

		@Spec
		CommandSpec spec;

		@Override
		public Integer call() {
			spec.commandLine().usage(System.out);
			return 0;
		}

		@Command(name = "test-email", description = "Test email connection")
		static class TestEmailCommand extends BaseCommand implements Callable<Integer> {
			@ParentCommand
			SystemCommand systemCommand;

			// --- START: Modification ---
			// Remove Mixin for ConfigOptions
			// @Mixin
			// private ConfigOptions config;

			// Add specific option for email connection file
			@Option(names = {
					"--email-connection-file" }, required = true, description = "Path to the email connection XML file (e.g., config/connections/eml-my-email.xml)")
			private File emailConnectionFile;
			// --- END: Modification ---

			@Override
			protected MainProgram getMainProgram() {
				return systemCommand.parent;
			}

			@Override
			public Integer call() throws Exception {
				// --- START: Modification ---
				// Validate the new option
				if (!emailConnectionFile.exists()) {
					throw new FileNotFoundException(
							"Email connection file does not exist: " + emailConnectionFile.getAbsolutePath());
				}
				if (!emailConnectionFile.isFile()) {
					throw new IllegalArgumentException("Email connection file path does not point to a file: "
							+ emailConnectionFile.getAbsolutePath());
				}

				// Use the specific file path in getJob
				CliJob job = getJob(emailConnectionFile.getAbsolutePath());
				// --- END: Modification ---
				job.doCheckEmail();
				return 0;
			}
		}

		@Command(name = "test-sms", description = "Test SMS through Twilio")
		static class TestSmsCommand extends BaseCommand implements Callable<Integer> {
			@ParentCommand
			SystemCommand systemCommand;

			@Option(names = { "--from", "--from-number" }, required = true, description = "From phone number")
			private String fromNumber;

			@Option(names = { "--to", "--to-number" }, required = true, description = "To phone number")
			private String toNumber;

			@Mixin
			private ConfigOptions config;

			@Override
			protected MainProgram getMainProgram() {
				return systemCommand.parent;
			}

			@Override
			public Integer call() throws Exception {
				CliJob job = getJob(config.configFile);
				job.doCheckTwilio(fromNumber, toNumber);
				return 0;
			}
		}

		@Command(name = "test-and-fetch-database-schema", description = "Test database connection and fetch schema information")
		static class TestAndFetchDatabaseSchemaCommand extends BaseCommand implements Callable<Integer> {

			@ParentCommand
			SystemCommand systemCommand;

			// --- START: Modification ---
			// Rename option and update description for clarity
			@Option(names = {
					"--database-connection-file" }, required = true, description = "Path to the database connection XML file (e.g., config/connections/db-my-db/db-my-db.xml)")
			private File databaseConnectionFile; // Renamed from connectionFile
			// --- END: Modification ---

			@Override
			protected MainProgram getMainProgram() {
				return systemCommand.parent;
			}

			@Override
			public Integer call() throws Exception {
				log.info("Initiating test-and-fetch-database-schema via CliJob...");

				// Validate file existence
				if (!databaseConnectionFile.exists()) {
					throw new FileNotFoundException(
							"Database connection file does not exist: " + databaseConnectionFile.getAbsolutePath());
				}
				if (!databaseConnectionFile.isFile()) {
					throw new IllegalArgumentException("Database connection file path does not point to a file: "
							+ databaseConnectionFile.getAbsolutePath());
				}

				// instantiate job and execute
				CliJob job = getJob(databaseConnectionFile.getAbsolutePath());
				job.doTestAndFetchDatabaseSchema(databaseConnectionFile.getAbsolutePath());

				log.info("CliJob execution for test-and-fetch-database-schema requested.");
				return 0;
			}
		}

		@Command(name = "test-sql-query", description = "Test SQL query execution")
		static class TestSqlQueryCommand extends BaseCommand implements Callable<Integer> {

			@ParentCommand
			SystemCommand systemCommand;

			@Option(names = { "--sql-query" }, required = true, description = "SQL query to execute")
			private String sqlQuery;

			@Mixin
			protected ConfigOptions config;

			@Option(names = { "-p",
					"--param" }, description = "Query parameters in key=value format (can be repeated)", paramLabel = "KEY=VALUE")
			private Map<String, String> parameters = new HashMap<>();

			@Override
			protected MainProgram getMainProgram() {
				return systemCommand.parent;
			}

			@Override
			public Integer call() throws Exception {
				Map<String, String> typedParameters = ParameterParser.parseParameters(parameters);

				CliJob job = getJob(config.configFile);
				job.doTestFetchData(typedParameters);
				return 0;
			}
		}

		@Command(name = "license", description = "License management", subcommands = {
				SystemCommand.LicenseCommand.ActivateCommand.class,
				SystemCommand.LicenseCommand.DeactivateCommand.class, SystemCommand.LicenseCommand.CheckCommand.class })
		public static class LicenseCommand implements Callable<Integer> {
			@ParentCommand
			SystemCommand systemCommand;

			@Spec
			CommandSpec spec;

			@Override
			public Integer call() {
				spec.commandLine().usage(System.out);
				return 0;
			}

			abstract static class LicenseBaseCommand extends BaseCommand {
				@ParentCommand
				LicenseCommand licenseCommand;

				@Override
				protected MainProgram getMainProgram() {
					return licenseCommand.systemCommand.parent;
				}
			}

			@Command(name = "activate", description = "Activate license key")
			public static class ActivateCommand extends LicenseBaseCommand implements Callable<Integer> {
				@Override
				public Integer call() throws Exception {
					CliJob job = getJob(null);
					job.doActivateLicenseKey();
					return 0;
				}
			}

			@Command(name = "deactivate", description = "Deactivate license key")
			public static class DeactivateCommand extends LicenseBaseCommand implements Callable<Integer> {
				@Override
				public Integer call() throws Exception {
					CliJob job = getJob(null);
					job.doDeactivateLicense();
					return 0;
				}
			}

			@Command(name = "check", description = "Check license status")
			public static class CheckCommand extends LicenseBaseCommand implements Callable<Integer> {
				@Override
				public Integer call() throws Exception {
					CliJob job = getJob(null);
					job.doCheckLicense();
					return 0;
				}
			}
		}

		@Command(name = "feature-request", description = "Submit a feature request")
		public static class FeatureRequestCommand extends BaseCommand implements Callable<Integer> {
			@ParentCommand
			SystemCommand systemCommand;

			@Option(names = { "-f", "--file" }, required = true, description = "XML file with feature request details")
			private File featureRequestFile;

			@Override
			protected MainProgram getMainProgram() {
				return systemCommand.parent;
			}

			@Override
			public Integer call() throws Exception {
				if (!featureRequestFile.exists()) {
					throw new FileNotFoundException(
							"Feature request file does not exist: " + featureRequestFile.getAbsolutePath());
				}

				CliJob job = getJob(null);
				job.doSendFeatureRequestEmail(featureRequestFile.getAbsolutePath());
				return 0;
			}
		}
	}

}