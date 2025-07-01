package com.sourcekraft.documentburster.engine.reporting;

import java.io.File;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;

import com.sourcekraft.documentburster.engine.AbstractReporter;
import com.univocity.parsers.fixed.FixedWidthFields;
import com.univocity.parsers.fixed.FixedWidthParser;
import com.univocity.parsers.fixed.FixedWidthParserSettings;

public class FixedWidthReporter extends AbstractReporter {

	public FixedWidthReporter(String configFilePath) {
		super(configFilePath);
	}

	@Override
	protected void fetchData() throws Exception {

		// Parse column definitions from settings
		String[] columnDefs = ctx.settings.getReportDataSource().fixedwidthoptions.columns.split("\n");
		List<Integer> lengths = new ArrayList<>();
		List<String> reportColumnNames = new ArrayList<>();

		// Extract column names and lengths
		for (String def : columnDefs) {
			if (def.trim().isEmpty())
				continue;
			String[] parts = def.split(",");
			if (parts.length >= 2) {
				reportColumnNames.add(parts[0].trim());
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
		List<String[]> rawData = parser.parseAll(new File(filePath));

		// Convert raw data to List<LinkedHashMap<String, Object>>
		ctx.reportData = new ArrayList<>();
		for (String[] row : rawData) {
			LinkedHashMap<String, Object> rowMap = new LinkedHashMap<>();
			for (int i = 0; i < Math.min(row.length, reportColumnNames.size()); i++) {
				rowMap.put(reportColumnNames.get(i), toObject(row[i]));
			}
			// Only add non-empty rows
			if (!rowMap.isEmpty()
					&& rowMap.values().stream().anyMatch(v -> v != null && !v.toString().trim().isEmpty())) {
				ctx.reportData.add(rowMap);
			}
		}
	}
}