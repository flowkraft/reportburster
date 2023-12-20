package com.sourcekraft.documentburster.unit.further.commandline;

import static org.junit.Assert.*;

import java.io.FileNotFoundException;
import org.junit.Test;

import com.sourcekraft.documentburster.MainProgram;

/*
 * Arguments are correct. The program environment (paths) is not set up.
 * FileNotFound should be raised for various files: settings.xml, job file etc
 */
public class CommandLineWrongProgramSetUpTest {

	private static final String PAYSLIPS_REPORT_PATH = "src/main/external-resources/template/samples/burst/Payslips.pdf";

	@Test
	public void testForValidBurstArguments() throws Throwable {

		String[] args = new String[2];
		args[0] = "-f";
		args[1] = PAYSLIPS_REPORT_PATH;

		try {
			(new MainProgram()).execute(args);
			assertTrue(
					"It should not come here and it should fail with IOException since the ./temp folder does not exist to create the job file",
					false);
		} catch (Exception e) {
			assertTrue(e.getCause().getMessage().contains("temp"));
		}

	}

	@Test
	public void testForValidMergeArguments1() throws Throwable {

		String[] args = new String[2];
		args[0] = "-mf";
		args[1] = "src/test/resources/input/unit/other/merge-file-Invoicec-Oct-Nov-Dec-bCpvjjzdk1.mf";

		try {
			(new MainProgram()).execute(args);
			assertTrue(
					"It should not come here and it should fail with IOException since the ./temp folder does not exist to create the job file",
					false);
		} catch (Exception e) {
			assertTrue(e.getCause().getMessage().contains("temp"));
		}

	}

	@Test
	public void testForValidMergeArguments2() throws Throwable {

		String[] args = new String[4];
		args[0] = "-mf";
		args[1] = "src/test/resources/input/unit/other/merge-file-Invoicec-Oct-Nov-Dec-bCpvjjzdk1.mf";
		args[2] = "-o";
		args[3] = "mergedTest.pdf";

		try {
			(new MainProgram()).execute(args);
			assertTrue(
					"It should not come here and it should fail with IOException since the ./temp folder does not exist to create the job file",
					false);
		} catch (Exception e) {
			assertTrue(e.getCause().getMessage().contains("temp"));
		}

	}

	@Test
	public void testForValidMergeArguments3() throws Throwable {

		String[] args = new String[5];
		args[0] = "-mf";
		args[1] = "src/test/resources/input/unit/other/merge-file-Invoicec-Oct-Nov-Dec-bCpvjjzdk1.mf";
		args[2] = "-o";
		args[3] = "mergedTest.pdf";
		args[4] = "-b";

		try {
			(new MainProgram()).execute(args);
			assertTrue(
					"It should not come here and it should fail with IOException since the ./temp folder does not exist to create the job file",
					false);
		} catch (Exception e) {
			assertTrue(e.getCause().getMessage().contains("temp"));
		}

	}

	@Test
	public void testForValidPollArguments() throws Throwable {

		String[] args = new String[2];
		args[0] = "-p";
		args[1] = "poll";

		try {
			(new MainProgram()).execute(args);
			assertTrue(
					"It should not come here and it should fail with IOException since the ./temp folder does not exist to create the job file",
					false);
		} catch (FileNotFoundException e) {
			assertTrue(e.getMessage().contains("does not exist"));
		}

	}

}