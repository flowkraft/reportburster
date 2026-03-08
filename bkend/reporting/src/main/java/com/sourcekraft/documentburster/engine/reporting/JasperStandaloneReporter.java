package com.sourcekraft.documentburster.engine.reporting;

import java.util.ArrayList;
import java.util.LinkedHashMap;

import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.sourcekraft.documentburster.engine.AbstractReporter;
import com.sourcekraft.documentburster.utils.Utils;
import com.sourcekraft.documentburster.variables.Variables;

/**
 * Reporter for standalone JasperReports from config/reports-jasper/.
 * These reports handle their own data (via .jrxml query or parameters) —
 * this reporter just creates a single token so the AbstractBurster pipeline
 * runs once and correctly resolves output folders, burst filenames, etc.
 */
public class JasperStandaloneReporter extends AbstractReporter {

	private static final Logger log = LoggerFactory.getLogger(JasperStandaloneReporter.class);

	public JasperStandaloneReporter(String configFilePath) {
		super(configFilePath);
	}

	@Override
	protected void initializeResources() throws Exception {
		super.initializeResources();
		// Set input_document_name from the template name (used in output folder path)
		String templateName = ctx.settings.getTemplateName();
		if (StringUtils.isNotBlank(templateName)) {
			ctx.variables.set(Variables.INPUT_DOCUMENT_NAME, Utils.sanitizeFileName(templateName));
		}
	}

	@Override
	protected void fetchData() throws Exception {
		// Standalone JasperReports don't need external data —
		// data comes from the .jrxml query or is parameter-driven.
		// Create a single empty row so the pipeline runs once.
		ctx.reportData = new ArrayList<>();
		ctx.reportData.add(new LinkedHashMap<>());
		ctx.reportColumnNames = new ArrayList<>();
		log.info("JasperStandaloneReporter: created single empty row for pipeline execution.");
	}

	@Override
	protected void backupFile() throws Exception {
		// No input file to backup for standalone jasper reports
		log.debug("Skipping backupFile for JasperStandaloneReporter.");
	}
}
