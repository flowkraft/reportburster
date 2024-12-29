package com.sourcekraft.documentburster.engine.reporting;

import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import org.apache.commons.io.FilenameUtils;
import org.apache.commons.lang3.StringUtils;

import com.opencsv.CSVParserBuilder;
import com.opencsv.CSVReader;
import com.opencsv.CSVReaderBuilder;
import com.sourcekraft.documentburster.engine.AbstractReporter;
import com.sourcekraft.documentburster.utils.CsvUtils;
import com.sourcekraft.documentburster.variables.Variables;

public class CsvReporter extends AbstractReporter {

	public CsvReporter(String configFilePath) {
		super(configFilePath);
	}

	@Override
	protected void initializeResources() throws Exception {
		ctx.variables.setVarAliases(Arrays.asList("col"));
		ctx.variables.set(Variables.OUTPUT_TYPE_EXTENSION,
				FilenameUtils.getExtension(ctx.settings.getReportTemplate().outputtype));

		char separatorChar = CsvUtils.DEFAULT_SEPARATOR;
		String sSeparator = ctx.settings.getReportDataSource().csvoptions.separatorchar;

		if (StringUtils.isNotEmpty(sSeparator)) {
			if (sSeparator.equals(CsvUtils.AUTODETECT)) {
				// Future: Implement autodetect
			} else if (sSeparator.equals("→ [tab character]")) {
				separatorChar = '\t';
			} else {
				separatorChar = sSeparator.charAt(0);
			}
		}

		char quotationChar = CsvUtils.DEFAULT_QUOTE_CHARACTER;
		String sQuotation = ctx.settings.getReportDataSource().csvoptions.quotationchar;
		if (StringUtils.isNotBlank(sQuotation)) {
			if (!sQuotation.equals(CsvUtils.AUTODETECT)) {
				quotationChar = sQuotation.charAt(0);
			}
		}

		char escapeChar = CsvUtils.DEFAULT_ESCAPE_CHARACTER;
		String sEscape = ctx.settings.getReportDataSource().csvoptions.escapechar;
		if (StringUtils.isNotBlank(sEscape) && !sEscape.equals(CsvUtils.AUTODETECT)) {
			escapeChar = sEscape.charAt(0);
		}

		CSVParserBuilder parserBuilder = new CSVParserBuilder().withSeparator(separatorChar)
				.withQuoteChar(quotationChar).withEscapeChar(escapeChar)
				.withStrictQuotes(ctx.settings.getReportDataSource().csvoptions.strictquotations)
				.withIgnoreQuotations(ctx.settings.getReportDataSource().csvoptions.ignorequotations)
				.withIgnoreLeadingWhiteSpace(ctx.settings.getReportDataSource().csvoptions.ignoreleadingwhitespace);

		CSVReaderBuilder csvReaderBuilder = new CSVReaderBuilder(Files.newBufferedReader(Paths.get(filePath)))
				.withCSVParser(parserBuilder.build());

		if (ctx.settings.getReportDataSource().csvoptions.skiplines > 0) {
			csvReaderBuilder.withSkipLines(ctx.settings.getReportDataSource().csvoptions.skiplines);
		}

		try (CSVReader csvReader = csvReaderBuilder.build()) {
			this.parsedLines = csvReader.readAll();

			if ((this.parsedLines.size() > 0) && (1 == this.parsedLines.get(0).length)) {
				throw new IllegalArgumentException("Probably the configured separator '" + separatorChar
						+ "' is incorrect since only 1 column was parsed having the value '"
						+ this.parsedLines.get(0)[0] + "'");
			}
		}
	}

	@Override
	public List<String> parseBurstingMetaData() throws Exception {
		List<String> tokens = new ArrayList<>();
		int lineLength = 0;
		int lineIndex = 0;
		int codeColumnIndex = -1;

		String idColumn = ctx.settings.getReportDataSource().csvoptions.idcolumn;

		// Explicit NOT_USED means use sequential numbering
		// Empty/null would indicate misconfiguration
		if (StringUtils.isEmpty(idColumn))
			throw new IllegalArgumentException(
					"idcolumn setting must be configured - use 'not-used' for sequential numbering");

		if (!idColumn.contains(CsvUtils.NOT_USED)) {
			if (idColumn.contains(CsvUtils.COLUMN_FIRST))
				codeColumnIndex = 0;
			else if (idColumn.contains(CsvUtils.COLUMN_LAST))
				codeColumnIndex = -1; // Will be set when we know line length
			else if (StringUtils.isNumeric(idColumn))
				codeColumnIndex = Integer.valueOf(idColumn);
			else
				throw new IllegalArgumentException("idcolumn must be 'first', 'last', 'not-used' or a number");
		}

		for (String[] currentLine : this.parsedLines) {
			if (lineLength <= 0) {
				lineLength = currentLine.length;
				if (idColumn.contains(CsvUtils.COLUMN_LAST)) // Handle COLUMN_LAST case
					codeColumnIndex = lineLength - 1;
			}

			String token = codeColumnIndex >= 0 ? currentLine[codeColumnIndex] : String.valueOf(lineIndex);

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

	public List<String[]> getParsedCsvLines() {
		return this.parsedLines;
	}
}