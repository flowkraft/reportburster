package com.sourcekraft.documentburster.engine.jasper;

import java.io.File;
import java.sql.Connection;
import java.sql.DriverManager;
import java.util.HashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import net.sf.jasperreports.engine.JREmptyDataSource;
import net.sf.jasperreports.engine.JRParameter;
import net.sf.jasperreports.engine.JasperCompileManager;
import net.sf.jasperreports.engine.JasperFillManager;
import net.sf.jasperreports.engine.JasperPrint;
import net.sf.jasperreports.engine.JasperReport;
import net.sf.jasperreports.engine.export.HtmlExporter;
import net.sf.jasperreports.engine.export.JRCsvExporter;
import net.sf.jasperreports.engine.export.ooxml.JRXlsxExporter;
import net.sf.jasperreports.export.SimpleExporterInput;
import net.sf.jasperreports.export.SimpleHtmlExporterOutput;
import net.sf.jasperreports.export.SimpleOutputStreamExporterOutput;
import net.sf.jasperreports.export.SimpleWriterExporterOutput;
import net.sf.jasperreports.pdf.JRPdfExporter;

public class JasperReportRunner {

	private static final Logger log = LoggerFactory.getLogger(JasperReportRunner.class);

	public File generate(File reportDir, String jrxmlFileName, String format, File outputFile,
			String jdbcUrl, String jdbcUser, String jdbcPass, Map<String, String> params) throws Exception {

		File jrxmlFile = new File(reportDir, jrxmlFileName);
		if (!jrxmlFile.exists()) {
			throw new IllegalArgumentException("Template not found: " + jrxmlFile.getAbsolutePath());
		}

		// 1. Compile .jrxml -> JasperReport
		log.info("Compiling {} ...", jrxmlFile.getName());
		JasperReport report = JasperCompileManager.compileReport(jrxmlFile.getAbsolutePath());

		// 2. Build parameters map
		Map<String, Object> jasperParams = new HashMap<>();
		jasperParams.put("SUBREPORT_DIR", reportDir.getAbsolutePath() + File.separator);

		if (params != null && !params.isEmpty()) {
			coerceAndPutParams(report, jasperParams, params);
		}

		// 3. Fill report
		JasperPrint print;
		Connection conn = null;
		try {
			if (jdbcUrl != null && !jdbcUrl.isEmpty()) {
				log.info("Connecting to database ...");
				conn = DriverManager.getConnection(jdbcUrl, jdbcUser, jdbcPass != null ? jdbcPass : "");
				print = JasperFillManager.fillReport(report, jasperParams, conn);
			} else {
				print = JasperFillManager.fillReport(report, jasperParams, new JREmptyDataSource());
			}
			log.info("Report filled: {} page(s)", print.getPages().size());

			// 4. Ensure output directory exists
			if (outputFile.getParentFile() != null) {
				outputFile.getParentFile().mkdirs();
			}

			// 5. Export
			log.info("Exporting to {} ...", format.toUpperCase());
			export(print, format, outputFile);

			log.info("Output written to: {}", outputFile.getAbsolutePath());
			return outputFile;
		} finally {
			if (conn != null) {
				try {
					conn.close();
				} catch (Exception ignored) {
				}
			}
		}
	}

	private void export(JasperPrint print, String format, File outFile) throws Exception {
		switch (format.toLowerCase()) {
			case "pdf": {
				JRPdfExporter exporter = new JRPdfExporter();
				exporter.setExporterInput(new SimpleExporterInput(print));
				exporter.setExporterOutput(new SimpleOutputStreamExporterOutput(outFile));
				exporter.exportReport();
				break;
			}
			case "xlsx": {
				JRXlsxExporter exporter = new JRXlsxExporter();
				exporter.setExporterInput(new SimpleExporterInput(print));
				exporter.setExporterOutput(new SimpleOutputStreamExporterOutput(outFile));
				exporter.exportReport();
				break;
			}
			case "csv": {
				JRCsvExporter exporter = new JRCsvExporter();
				exporter.setExporterInput(new SimpleExporterInput(print));
				exporter.setExporterOutput(new SimpleWriterExporterOutput(outFile));
				exporter.exportReport();
				break;
			}
			case "html": {
				HtmlExporter exporter = new HtmlExporter();
				exporter.setExporterInput(new SimpleExporterInput(print));
				exporter.setExporterOutput(new SimpleHtmlExporterOutput(outFile));
				exporter.exportReport();
				break;
			}
			default:
				throw new IllegalArgumentException(
						"Unsupported format: " + format + ". Supported: pdf, xlsx, csv, html");
		}
	}

	private void coerceAndPutParams(JasperReport report, Map<String, Object> target,
			Map<String, String> source) {
		Map<String, Class<?>> paramTypes = new HashMap<>();
		for (JRParameter p : report.getParameters()) {
			paramTypes.put(p.getName(), p.getValueClass());
		}

		for (Map.Entry<String, String> entry : source.entrySet()) {
			String name = entry.getKey();
			String raw = entry.getValue();
			Class<?> type = paramTypes.get(name);
			target.put(name, type != null ? coerceValue(raw, type) : raw);
		}
	}

	private Object coerceValue(String raw, Class<?> type) {
		if (type == String.class)
			return raw;
		if (type == Integer.class || type == int.class)
			return Integer.parseInt(raw);
		if (type == Long.class || type == long.class)
			return Long.parseLong(raw);
		if (type == Double.class || type == double.class)
			return Double.parseDouble(raw);
		if (type == Float.class || type == float.class)
			return Float.parseFloat(raw);
		if (type == Boolean.class || type == boolean.class)
			return Boolean.parseBoolean(raw);
		if (type == Short.class || type == short.class)
			return Short.parseShort(raw);
		if (type == java.math.BigDecimal.class)
			return new java.math.BigDecimal(raw);
		if (type == java.sql.Date.class)
			return java.sql.Date.valueOf(raw);
		if (type == java.sql.Timestamp.class)
			return java.sql.Timestamp.valueOf(raw);
		if (type == java.util.Date.class)
			return java.sql.Date.valueOf(raw);
		return raw;
	}
}
