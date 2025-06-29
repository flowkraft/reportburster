package com.sourcekraft.documentburster.engine.reporting;

import java.io.BufferedReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.opencsv.CSVParserBuilder;
import com.opencsv.CSVReader;
import com.opencsv.CSVReaderBuilder;
import com.sourcekraft.documentburster.engine.AbstractReporter;
import com.sourcekraft.documentburster.utils.CsvUtils;

public class CsvReporter extends AbstractReporter {

	private static final Logger log = LoggerFactory.getLogger(CsvReporter.class);

	public CsvReporter(String configFilePath) {
		super(configFilePath);
	}

	@Override
	protected void fetchData() throws Exception {
		log.trace("Entering fetchData...");

		// --- Read CSV Options ---
		char separatorChar = CsvUtils.DEFAULT_SEPARATOR;
		String sSeparator = ctx.settings.getReportDataSource().csvoptions.separatorchar;
		if (StringUtils.isNotEmpty(sSeparator)) {
			if (sSeparator.equals(CsvUtils.AUTODETECT)) {
				// Future: Implement autodetect
			} else if (sSeparator.contains("[tab character]") || sSeparator.equals("\\t")) {
				separatorChar = '\t';
			} else {
				separatorChar = sSeparator.charAt(0);
			}
		}
		log.debug("Using separator character: '{}'", separatorChar);

		char quotationChar = CsvUtils.DEFAULT_QUOTE_CHARACTER;
		String sQuotation = ctx.settings.getReportDataSource().csvoptions.quotationchar;
		if (!StringUtils.isEmpty(sQuotation)) {
			quotationChar = sQuotation.charAt(0);
		}
		log.debug("Using quotation character: '{}'", quotationChar);

		char escapeChar = CsvUtils.DEFAULT_ESCAPE_CHARACTER;
		String sEscape = ctx.settings.getReportDataSource().csvoptions.escapechar;
		if (!StringUtils.isEmpty(sEscape)) {
			escapeChar = sEscape.charAt(0);
		}
		log.debug("Using escape character: '{}'", escapeChar);

		boolean ignoreLeadingWhitespace = ctx.settings.getReportDataSource().csvoptions.ignoreleadingwhitespace;
		boolean strictQuotes = ctx.settings.getReportDataSource().csvoptions.strictquotations;
		boolean ignoreQuotations = ctx.settings.getReportDataSource().csvoptions.ignorequotations;
		// User-defined lines to skip *before* reading data. Header is within these
		// lines if hasHeader=true.
		int skipLines = ctx.settings.getReportDataSource().csvoptions.skiplines;
		String headerSetting = ctx.settings.getReportDataSource().csvoptions.header;

		// Ensure skipLines is non-negative
		if (skipLines < 0) {
			log.warn("Invalid negative skipLines ({}) provided. Defaulting to 0.", skipLines);
			skipLines = 0;
		}

		// Determine if a header row is expected based on settings
		boolean hasHeader = !CsvUtils.HEADER_NOHEADER.equalsIgnoreCase(headerSetting);
		// If header=firstline or header=multiline, the header is assumed to be the
		// *first* line of the file.
		// If header=noheader, there's no header row to read.

		log.debug(
				"CSV Options: headerSetting={}, skipLines={}, hasHeader={}, ignoreLeadingWhitespace={}, strictQuotes={}, ignoreQuotations={}",
				headerSetting, skipLines, hasHeader, ignoreLeadingWhitespace, strictQuotes, ignoreQuotations);

		// --- Build CSV Parser ---
		com.opencsv.CSVParser parser = new CSVParserBuilder().withSeparator(separatorChar).withQuoteChar(quotationChar)
				.withEscapeChar(escapeChar).withStrictQuotes(strictQuotes).withIgnoreQuotations(ignoreQuotations)
				.withIgnoreLeadingWhiteSpace(ignoreLeadingWhitespace).build();

		ctx.reportData = new ArrayList<>(); // Initialize reportData
		ctx.reportColumnNames = new ArrayList<>(); // Initialize reportColumnNames
		String[] headers = null;

		// --- Read Header Row (if applicable) ---
		// The header is always the *first* line if hasHeader is true.
		// It is read regardless of skipLines, but skipLines determines where data
		// starts.
		if (hasHeader) {
			log.debug("Attempting to read header from the first line of the file.");
			try (BufferedReader bufferedReader = Files.newBufferedReader(Paths.get(filePath), StandardCharsets.UTF_8);
					// Use a reader that skips 0 lines to get the very first line
					CSVReader headerReader = new CSVReaderBuilder(bufferedReader).withCSVParser(parser).withSkipLines(0) // Always
																															// read
																															// the
																															// first
																															// line
																															// for
																															// the
																															// header
							.build()) {

				headers = headerReader.readNext(); // Read the first line

				if (headers == null) {
					log.warn(
							"Could not read header from the first line. File might be empty. Will attempt to generate generic headers from data.");
				} else {
					log.debug("Successfully read header from first line ({} columns): {}", headers.length,
							Arrays.toString(headers));
					// Basic check for separator issues based on header
					if (headers.length == 1 && headers[0].contains(String.valueOf(separatorChar))) {
						log.warn(
								"Header row ('{}') only has one column and contains the separator '{}'. Check if separator is correct.",
								headers[0], separatorChar);
					}
					// Ensure skipLines is at least 1 if a header exists, as the header itself must
					// be skipped before data
					if (skipLines < 1) {
						log.warn(
								"Header setting implies at least one line (the header) should be skipped, but skipLines is {}. Adjusting skipLines to 1.",
								skipLines);
						skipLines = 1;
					}
				}
			} catch (Exception e) {
				log.error(
						"Error reading header from the first line of file '{}'. Will attempt to generate generic headers from data.",
						filePath, e);
				headers = null; // Ensure headers is null if reading failed
			}
		} else {
			log.debug("Header setting is 'noheader'. No header row will be read.");
			// skipLines remains as configured by the user.
		}

		// --- Read Data Rows ---
		// Data reading *always* starts after skipping exactly 'skipLines'.
		log.debug("Configuring main CSVReader to skip {} lines before reading data.", skipLines);
		try (BufferedReader bufferedReader = Files.newBufferedReader(Paths.get(filePath), StandardCharsets.UTF_8);
				CSVReader dataReader = new CSVReaderBuilder(bufferedReader).withCSVParser(parser)
						.withSkipLines(skipLines) // Skip exactly 'skipLines' lines before reading the first data row
						.build()) {

			String[] row;
			int dataRowIndex = 0; // 0-based index relative to the *start* of data reading

			while ((row = dataReader.readNext()) != null) {
				log.trace("Reading data row index: {} (physical line approx {})", dataRowIndex,
						skipLines + dataRowIndex + 1);

				// --- START: Workaround for OpenCSV ignoreleadingwhitespace bug ---
				// If ignoreleadingwhitespace is true, trim both leading/trailing whitespace
				// from all fields.
				if (ignoreLeadingWhitespace) {
					for (int i = 0; i < row.length; i++) {
						// Check for null just in case, though OpenCSV usually returns empty strings
						if (row[i] != null) {
							row[i] = row[i].trim();
						}
					}
					log.trace("Applied trim() to row fields due to ignoreleadingwhitespace=true");
				}
				// --- END: Workaround ---

				// Generate generic headers if needed (only on the first data row read if no
				// headers were successfully read/set)
				if (headers == null && dataRowIndex == 0) {
					headers = new String[row.length];
					for (int i = 0; i < row.length; i++) {
						headers[i] = "col" + i;
					}
					log.debug("Generated generic headers based on first data row read: {}", Arrays.toString(headers));
				} else if (headers == null) {
					// Should not happen if there's data after the first row, but safeguard
					log.error("Headers are null but reading subsequent data row {}. Stopping data read.", dataRowIndex);
					break;
				}

				// Check for potential separator issues on the first data row read
				if (dataRowIndex == 0 && headers.length == 1 && row.length == 1
						&& row[0].contains(String.valueOf(separatorChar))) {
					log.warn("First data row ('{}') also suggests the configured separator '{}' might be incorrect.",
							row[0], separatorChar);
				}

				// Create map using headers
				LinkedHashMap<String, Object> rowMap = new LinkedHashMap<>();
				for (int j = 0; j < headers.length; j++) {
					String headerName = headers[j];
					String value = (j < row.length) ? row[j] : ""; // Handle rows shorter than header
					// Handle potential duplicate header names
					String uniqueHeaderName = headerName;
					int duplicateCount = 2;
					while (rowMap.containsKey(uniqueHeaderName)) {
						uniqueHeaderName = headerName + "_" + duplicateCount++;
					}
					if (!uniqueHeaderName.equals(headerName)) {
						log.trace("Duplicate header '{}' found, using '{}' instead for this row.", headerName,
								uniqueHeaderName);
					}
					rowMap.put(uniqueHeaderName, toObject(value));
				}
				ctx.reportData.add(rowMap);
				log.trace("Added data row map: {}", rowMap);
				dataRowIndex++;
			}
			log.info("Finished reading CSV data. Total data rows processed: {}", dataRowIndex);

		}

		// Store final headers in context if they exist
		if (headers != null) {
			// Handle potential duplicates in the final header list
			List<String> finalHeaders = new ArrayList<>();
			Map<String, Integer> headerCounts = new LinkedHashMap<>();
			for (String header : headers) {
				int count = headerCounts.getOrDefault(header, 0) + 1;
				headerCounts.put(header, count);
				String uniqueHeader = (count > 1) ? header + "_" + count : header;
				finalHeaders.add(uniqueHeader);
			}
			ctx.reportColumnNames.addAll(finalHeaders);
			log.debug("Stored final column names (duplicates adjusted): {}", ctx.reportColumnNames);
		} else if (!ctx.reportData.isEmpty()) {
			log.warn("No headers were read or generated, but data rows exist. Column names context will be empty.");
		} else {
			log.debug("No headers found and no data rows processed.");
		}

		log.info("CSV data fetched successfully. Headers: {}. Data rows: {}", ctx.reportColumnNames.size(),
				ctx.reportData.size());
		log.trace("Exiting fetchData.");
	}
}