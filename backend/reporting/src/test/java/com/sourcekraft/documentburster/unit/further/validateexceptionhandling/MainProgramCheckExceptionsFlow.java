package com.sourcekraft.documentburster.unit.further.validateexceptionhandling;

import org.apache.commons.cli.CommandLine;
import org.junit.Test;

import com.sourcekraft.documentburster.MainProgram;
import com.sourcekraft.documentburster._helpers.TestsUtils;
import com.sourcekraft.documentburster.engine.AbstractBurster;
import com.sourcekraft.documentburster.engine.pdf.PdfBurster;
import com.sourcekraft.documentburster.job.CliJob;

public class MainProgramCheckExceptionsFlow {

	@SuppressWarnings("serial")
	public class CustomBurstingException extends Exception {

		public CustomBurstingException(String message) {
			super(message);
		}

	}

	private static final String PAYSLIPS_REPORT_PATH = "src/main/external-resources/template/samples/burst/Payslips.pdf";

	@Test(expected = CustomBurstingException.class)
	public void testMainProgramValidExceptionsFlow() throws Throwable {

		String[] args = new String[2];
		args[0] = "-f";
		args[1] = PAYSLIPS_REPORT_PATH;

		MainProgram main = new MainProgram() {

			protected CliJob getJob(CommandLine cmd) throws Exception {

				return new CliJob(null) {

					public String getTempFolder() {
						return TestsUtils.TESTS_OUTPUT_FOLDER + "/temp";
					}

					protected AbstractBurster getBurster(String filePath) throws Exception {

						return new PdfBurster(configurationFilePath) {

							public void burst(String filePath, boolean testAll, String listOfTestTokens,
									int numberOfRandomTestTokens) throws Exception {

								throw new CustomBurstingException("CustomBurstingException");

							};
						};

					}

				};
			}
		};

		main.execute(args);

	};
}