package com.sourcekraft.documentburster.engine.reporting;

import java.io.File;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import org.apache.commons.io.FilenameUtils;
import org.apache.commons.lang3.StringUtils;

import com.sourcekraft.documentburster.engine.AbstractReporter;
import com.sourcekraft.documentburster.utils.CsvUtils;
import com.sourcekraft.documentburster.variables.Variables;
import com.univocity.parsers.fixed.FixedWidthFields;
import com.univocity.parsers.fixed.FixedWidthParser;
import com.univocity.parsers.fixed.FixedWidthParserSettings;

public class FixedWidthReporter extends AbstractReporter {

	public FixedWidthReporter(String configFilePath) {
		super(configFilePath);
	}

	@Override
	protected void initializeResources() throws Exception {
		ctx.variables.setVarAliases(Arrays.asList("col"));
		ctx.variables.set(Variables.OUTPUT_TYPE_EXTENSION,
				FilenameUtils.getExtension(ctx.settings.getReportTemplate().outputtype));

		// Parse column definitions from settings
		String[] columnDefs = ctx.settings.getReportDataSource().fixedwidthoptions.columns.split("\n");
		List<Integer> lengths = new ArrayList<>();

		for (String def : columnDefs) {
			if (def.trim().isEmpty())
				continue;
			String[] parts = def.split(",");
			if (parts.length >= 2) {
				String lengthStr = parts[1].trim();
				lengths.add(Integer.parseInt(lengthStr));
			}
		}

		// Configure parser
		FixedWidthFields fields = new FixedWidthFields(lengths.stream().mapToInt(i -> i).toArray());
		FixedWidthParserSettings settings = new FixedWidthParserSettings(fields);

		// Configure options
		settings.setSkipEmptyLines(true);
		settings.setIgnoreLeadingWhitespaces(
				ctx.settings.getReportDataSource().fixedwidthoptions.ignoreleadingwhitespace);
		settings.setIgnoreTrailingWhitespaces(true);

		if (ctx.settings.getReportDataSource().fixedwidthoptions.skiplines > 0) {
			settings.setNumberOfRowsToSkip(ctx.settings.getReportDataSource().fixedwidthoptions.skiplines);
		}

		// Parse file
		FixedWidthParser parser = new FixedWidthParser(settings);
		this.parsedLines = parser.parseAll(new File(filePath));
	}

	@Override
	public List<String> parseBurstingMetaData() throws Exception {
		List<String> tokens = new ArrayList<>();
		int lineLength = 0;
		int lineIndex = 0;
		int codeColumnIndex = -1;

		// Add idcolumn handling like in CsvReporter
		String idColumn = ctx.settings.getReportDataSource().fixedwidthoptions.idcolumn;

		// Explicit NOT_USED means use sequential numbering
		// Empty/null would indicate misconfiguration
		if (StringUtils.isEmpty(idColumn))
			throw new IllegalArgumentException(
					"idcolumn setting must be configured - use 'notused' for sequential numbering");

		// Determine which column to use for tokens
		if (!idColumn.contains(CsvUtils.NOT_USED)) {
			if (idColumn.contains(CsvUtils.COLUMN_FIRST))
				codeColumnIndex = 0;
			else if (idColumn.contains(CsvUtils.COLUMN_LAST))
				codeColumnIndex = -1; // Will be set when we know line length
			else if (StringUtils.isNumeric(idColumn))
				codeColumnIndex = Integer.valueOf(idColumn);
			else
				throw new IllegalArgumentException("idcolumn must be 'first', 'last', 'notused' or a number");
		}

		for (String[] currentLine : this.parsedLines) {
			if (lineLength <= 0) {
				lineLength = currentLine.length;
				// If using last column, set the index now that we know the line length
				if (idColumn.contains(CsvUtils.COLUMN_LAST))
					codeColumnIndex = lineLength - 1;
			}

			// Use column value for token if specified, otherwise use line index
			String token;
			if (codeColumnIndex >= 0 && codeColumnIndex < currentLine.length) {
				token = currentLine[codeColumnIndex];
			} else {
				token = String.valueOf(lineIndex);
			}

			StringBuilder userVariablesStringBuilder = new StringBuilder();
			for (int currentColumnIndex = 0; currentColumnIndex < lineLength; currentColumnIndex++) {
				userVariablesStringBuilder.append("<").append(currentColumnIndex).append(">")
						.append(currentLine[currentColumnIndex]).append("</").append(currentColumnIndex).append(">");
			}

			ctx.variables.parseUserVariables(token, userVariablesStringBuilder.toString());
			tokens.add(token);
			lineIndex++;
		}

		return tokens;
	}
}