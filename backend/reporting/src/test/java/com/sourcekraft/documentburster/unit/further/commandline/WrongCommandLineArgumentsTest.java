package com.sourcekraft.documentburster.unit.further.commandline;

import static org.junit.Assert.*;

import java.io.FileNotFoundException;

import org.apache.commons.cli.CommandLine;
import org.apache.commons.cli.ParseException;
import org.junit.Test;

import com.sourcekraft.documentburster.MainProgram;
import com.sourcekraft.documentburster._helpers.TestsUtils;
import com.sourcekraft.documentburster.job.CliJob;

public class WrongCommandLineArgumentsTest {

	private static final String PAYSLIPS_REPORT_PATH = "src/main/external-resources/template/samples/burst/Payslips.pdf";

	@Test
	public void invalidArgument() throws Throwable {

		String[] args = new String[2];

		args[0] = "-x";
		args[1] = PAYSLIPS_REPORT_PATH;

		try {
			(new MainProgram()).execute(args);
		} catch (ParseException e) {
			assertTrue("It should throw ParseException since there is not -x option", true);
		}
	}

	@Test
	public void invalidBurstInputFile() throws Throwable {

		String[] args = new String[2];
		args[0] = "-f";
		args[1] = "C:/inexistent_file.pdf";

		try {
			(new MainProgram()).execute(args);
		} catch (FileNotFoundException e) {
			assertTrue(e.getMessage().contains("Input file does not exist"));
		}
	}

	@Test
	public void pollFolderDoesNotExists() throws Throwable {

		final CliJob job;

		job = new CliJob("src/main/external-resources/template/config/burst/settings.xml") {

			public String getTempFolder() {
				return TestsUtils.TESTS_OUTPUT_FOLDER + "/temp/";
			}

		};

		MainProgram program = new MainProgram() {

			protected CliJob getJob(CommandLine cmd) {
				return job;
			};

		};

		String[] args = new String[2];
		args[0] = "-p";
		args[1] = "poll";

		try {
			program.execute(args);
		} catch (FileNotFoundException e) {
			assertTrue(e.getMessage().contains("Poll folder does not exist"));
		}

	}
}