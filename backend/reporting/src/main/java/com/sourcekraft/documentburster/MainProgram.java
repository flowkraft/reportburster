/*
    DocumentBurster is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 2 of the License, or
    (at your option) any later version.

    DocumentBurster is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with DocumentBurster.  If not, see <http://www.gnu.org/licenses/>
 */
package com.sourcekraft.documentburster;

import java.io.File;
import java.io.FileNotFoundException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.List;

import org.apache.commons.cli.CommandLine;
import org.apache.commons.cli.CommandLineParser;
import org.apache.commons.cli.DefaultParser;
import org.apache.commons.cli.HelpFormatter;
import org.apache.commons.cli.Option;
import org.apache.commons.cli.OptionGroup;
import org.apache.commons.cli.Options;
import org.apache.commons.cli.ParseException;
import org.apache.commons.io.FileUtils;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.sourcekraft.documentburster.job.CliJob;

public class MainProgram {

	private static Logger log = LoggerFactory.getLogger(MainProgram.class);

	private GlobalContext global;

	public void setGlobal(GlobalContext global) {
		this.global = global;
	}

	public void execute(String[] args) throws Throwable {

		Options options = new Options();

		OptionGroup mainOptionsGrp = new OptionGroup();
		mainOptionsGrp.setRequired(false);

		mainOptionsGrp.addOption(new Option("f", "file", true, "Input file"));
		mainOptionsGrp.addOption(new Option("p", "poll", true, "Start polling a folder for reports"));
		mainOptionsGrp.addOption(new Option("mf", "mergefile", true, "Merge files"));

		mainOptionsGrp.addOption(new Option("rf", "resumefile", true, "Resume file processing"));

		options.addOptionGroup(mainOptionsGrp);

		options.addOption("c", "configuration", true, "Configuration file");

		options.addOption("o", "output", true, "Name of the output merged file");
		options.addOption("b", "burst", false, "Burst the merged file");

		OptionGroup checkConnectionsOptionsGrp = new OptionGroup();
		checkConnectionsOptionsGrp.setRequired(false);

		checkConnectionsOptionsGrp.addOption(new Option("cec", "checkemailconn", false,
				"Send a single test email using the main SMTP configured server"));

		checkConnectionsOptionsGrp
				.addOption(new Option("ctwlc", "checktwilioconn", false, "Send a single test SMS using Twilio"));

		options.addOption(new Option("from", "fromnumber", true, "From number"));
		options.addOption(new Option("to", "tonumber", true, "To number"));

		options.addOptionGroup(checkConnectionsOptionsGrp);

		OptionGroup qaOptionsGrp = new OptionGroup();
		qaOptionsGrp.setRequired(false);

		qaOptionsGrp
				.addOption(new Option("ta", "testall", false, "Test all the burst tokens found in the input document"));
		qaOptionsGrp.addOption(
				new Option("tl", "testlist", true, "Comma separated list of burst tokens which should be tested"));
		qaOptionsGrp.addOption(
				new Option("tr", "testrandom", true, "Number of random burst tokens which should be tested"));

		options.addOptionGroup(qaOptionsGrp);

		OptionGroup licenseOptionsGrp = new OptionGroup();
		licenseOptionsGrp.setRequired(false);

		licenseOptionsGrp.addOption(new Option("al", "activatelicense", false, "Activate license key"));
		licenseOptionsGrp.addOption(new Option("dl", "deactivatelicense", false, "Deactivate license key"));
		licenseOptionsGrp.addOption(
				new Option("cl", "checklicense", false, "Check if license key is valid, invalid or expired"));

		options.addOptionGroup(licenseOptionsGrp);

		OptionGroup otherOptionsGrp = new OptionGroup();
		otherOptionsGrp.setRequired(false);

		otherOptionsGrp.addOption(new Option("rnf", "requestnewfeature", true,
				"Full file path to an XML file containing the new feature details"));

		options.addOptionGroup(otherOptionsGrp);

		CommandLineParser parser = new DefaultParser();
		CommandLine cmd;

		try {

			cmd = parser.parse(options, args);

			if (cmd.hasOption("f"))
				_burst(cmd);
			else if (cmd.hasOption("rf"))
				_resumeBurst(cmd);
			else if (cmd.hasOption("mf"))
				_mergeAndBurst(cmd);
			else if ((cmd.hasOption("cec")))
				_checkEmailConnection(cmd);
			else if (cmd.hasOption("ctwlc"))
				_checkTwilioConnection(cmd);
			else if ((cmd.hasOption("al")) || (cmd.hasOption("dl")) || (cmd.hasOption("cl")))
				_checkSoftwareLicense(cmd);
			else if ((cmd.hasOption("p")))
				_poll(cmd);
			else if (cmd.hasOption("rnf"))
				_handleOtherOptions(cmd);

		} catch (ParseException e) {
			_usage(options);
			throw e;
		}

	}

	private void _checkSoftwareLicense(CommandLine cmd) throws Exception {

		CliJob job = getJob(cmd);

		if (cmd.hasOption("al")) {
			job.doActivateLicenseKey();
		} else if (cmd.hasOption("dl")) {
			job.doDeactivateLicense();
		} else if (cmd.hasOption("cl")) {
			job.doCheckLicense();
		}
	}

	private void _checkEmailConnection(CommandLine cmd) throws Exception {

		CliJob job = getJob(cmd);

		if (cmd.hasOption("cec")) {
			job.doCheckEmail();
		}

	}

	private void _checkTwilioConnection(CommandLine cmd) throws Exception {

		String fromNumber = cmd.getOptionValue("from");
		String toNumber = cmd.getOptionValue("to");

		CliJob job = getJob(cmd);

		job.doCheckTwilio(fromNumber, toNumber);

	}

	private void _poll(CommandLine cmd) throws Exception {

		String pollFolderPath = cmd.getOptionValue('p');

		File pollDir = new File(pollFolderPath);

		CliJob job = getJob(cmd);

		if (pollDir.exists())
			job.doPoll(pollFolderPath);
		else
			throw new FileNotFoundException("Poll folder does not exist: " + pollFolderPath);

	}

	private void _mergeAndBurst(CommandLine cmd) throws Exception {

		String mergeFilePath = cmd.getOptionValue("mf");
		File mergeFile = new File(mergeFilePath);

		if (mergeFile.exists()) {

			List<String> filePaths = Files.readAllLines(Paths.get(mergeFilePath), StandardCharsets.UTF_8);

			for (String filePath : filePaths) {

				File file = new File(filePath);

				if (!file.exists())
					throw new FileNotFoundException("Input file does not exist: " + filePath);

			}

			String outputMergedFileName = null;

			if (cmd.hasOption("o"))
				outputMergedFileName = cmd.getOptionValue('o');

			CliJob job = getJob(cmd);

			String outputMergedFilePath = job.doMerge(filePaths, outputMergedFileName);
			if (cmd.hasOption("b"))
				job.doBurst(outputMergedFilePath, false, StringUtils.EMPTY, -1);

			FileUtils.deleteQuietly(mergeFile);

		} else
			throw new FileNotFoundException("Merge file does not exist: " + mergeFilePath);

	}

	private void _burst(CommandLine cmd) throws Exception {

		// either Burst an input file
		String filePath = cmd.getOptionValue('f');

		File file = new File(filePath);

		if (file.exists()) {

			boolean testAll = false;
			String listOfTestTokens = StringUtils.EMPTY;
			int numberOfRandomTestTokens = -1;

			if (cmd.hasOption("ta")) {
				testAll = true;
			} else if (cmd.hasOption("tl")) {
				listOfTestTokens = cmd.getOptionValue("tl");
			}

			if (cmd.hasOption("tr"))
				try {
					numberOfRandomTestTokens = Integer.parseInt(cmd.getOptionValue("tr"));

					if (numberOfRandomTestTokens < 0)
						throw new NumberFormatException();

				} catch (NumberFormatException e) {
					throw new NumberFormatException(cmd.getOptionValue("tr")
							+ " is not a valid positive (>0) integer number. Please provide a valid positive (>0) integer number of random burst tokens which should be tested!"
							+ filePath);
				}

			CliJob job = getJob(cmd);

			job.doBurst(filePath, testAll, listOfTestTokens, numberOfRandomTestTokens);

		} else
			throw new FileNotFoundException("Input file does not exist: " + filePath);

	}

	private void _resumeBurst(CommandLine cmd) throws Exception {

		String jobProgressFilePath = cmd.getOptionValue("rf");

		File jobProgressFile = new File(jobProgressFilePath);

		if (jobProgressFile.exists()) {

			CliJob job = getJob(cmd);
			job.doResumeBurst(jobProgressFilePath);

		} else
			throw new FileNotFoundException("Job progress file does not exist: " + jobProgressFilePath);

	}

	private void _handleOtherOptions(CommandLine cmd) throws Exception {

		CliJob job = getJob(cmd);

		if (cmd.hasOption("rnf")) {
			job.doSendFeatureRequestEmail(cmd.getOptionValue("rnf"));
		}

	}

	private void _usage(Options options) {

		log.debug("usage(Options options)");

		HelpFormatter formatter = new HelpFormatter();
		formatter.printHelp("DocumentBurster", options);

	}

	protected CliJob getJob(CommandLine cmd) throws Exception {

		String configurationFilePath = null;

		if (cmd.hasOption("c")) {
			File file = new File(cmd.getOptionValue("c"));
			if (file.exists())
				configurationFilePath = cmd.getOptionValue("c");
			else
				throw new FileNotFoundException("Configuration file does not exist: " + cmd.getOptionValue("c"));
		}

		CliJob job = new CliJob(configurationFilePath);
		job.setGlobal(global);

		return job;
	}

}
