package com.sourcekraft.documentburster.engine;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.StringWriter;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Objects;

import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.sax.SAXResult;
import javax.xml.transform.stream.StreamSource;

import org.apache.commons.io.FileUtils;
import org.apache.commons.io.FilenameUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.fop.apps.Fop;
import org.apache.fop.apps.FopFactory;
import org.apache.fop.apps.MimeConstants;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.docx4j.Docx4J;
import org.docx4j.model.datastorage.migration.VariablePrepare;
import org.docx4j.openpackaging.packages.WordprocessingMLPackage;
import org.docx4j.openpackaging.parts.WordprocessingML.MainDocumentPart;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

//import com.haulmont.yarg.formatters.ReportFormatter;
//import com.haulmont.yarg.formatters.factory.DefaultFormatterFactory;
//import com.haulmont.yarg.formatters.factory.FormatterFactoryInput;
//import com.haulmont.yarg.structure.BandData;
//import com.haulmont.yarg.structure.BandOrientation;
//import com.haulmont.yarg.structure.ReportOutputType;
//import com.haulmont.yarg.structure.impl.ReportTemplateImpl;
import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import com.sourcekraft.documentburster.common.settings.model.ReportSettings;
import com.sourcekraft.documentburster.context.BurstingContext;
import com.sourcekraft.documentburster.utils.CsvUtils;
import com.sourcekraft.documentburster.utils.Scripts;
import com.sourcekraft.documentburster.utils.Utils;
import com.sourcekraft.documentburster.variables.Variables; // Assuming Variables class exists

import fr.opensagres.poi.xwpf.converter.pdf.PdfConverter;
import fr.opensagres.poi.xwpf.converter.pdf.PdfOptions;
import fr.opensagres.xdocreport.document.IXDocReport;
import fr.opensagres.xdocreport.document.registry.XDocReportRegistry;
import fr.opensagres.xdocreport.template.IContext;
import fr.opensagres.xdocreport.template.TemplateEngineKind;
import freemarker.template.Template;
import uk.co.certait.htmlexporter.writer.excel.ExcelExporter;

public abstract class AbstractReporter extends AbstractBurster {

	private static final Logger log = LoggerFactory.getLogger(AbstractReporter.class); // Added logger

	private Map<String, String> reportParameters;
	private boolean isPreviewMode = false;

	public AbstractReporter(String configFilePath) {
		super(configFilePath);
	}

	public void setReportParameters(Map<String, String> reportParameters) {

		System.out.println("[DEBUG] AbstractReporter.setReportParameters called with: " + reportParameters);

		this.reportParameters = reportParameters;
	}

	@Override
	protected void processAttachments() throws Exception {
		// Assuming Variables.EXTRACTED_FILE_PATH exists as a constant string
		String extractedFilePathVar = "${extracted_file_path}"; // Use a placeholder if constant unknown
		try {
			// Attempt to get the constant value if it exists
			java.lang.reflect.Field field = Variables.class.getDeclaredField("EXTRACTED_FILE_PATH");
			field.setAccessible(true);
			extractedFilePathVar = (String) field.get(null);
		} catch (NoSuchFieldException | IllegalAccessException e) {
			log.warn("Could not reflectively access Variables.EXTRACTED_FILE_PATH, using default placeholder.", e);
		}

		final String finalExtractedFilePathVar = extractedFilePathVar; // Final variable for lambda

		if (ctx.settings.getReportTemplate().outputtype.equals(CsvUtils.OUTPUT_TYPE_NONE))
			ctx.settings.getAttachments().removeIf(attachment -> attachment.path.contains(finalExtractedFilePathVar));

		super.processAttachments();
	}

	@Override
	protected void quarantineDocument() throws Exception {
		if (!ctx.settings.getReportTemplate().outputtype.equals(CsvUtils.OUTPUT_TYPE_NONE))
			super.quarantineDocument();
	}

	@Override
	protected void extractDocument() throws Exception {
		if (!ctx.settings.getReportTemplate().outputtype.equals(CsvUtils.OUTPUT_TYPE_NONE))
			super.extractDocument();
		else
			super.createOutputFoldersIfTheyDontExist();
	}

	@Override
	protected void initializeResources() throws Exception {
		ctx.burstTokens = new ArrayList<>();
		ctx.variables.setVarAliases(Arrays.asList("col"));
		// Assuming Variables.OUTPUT_TYPE_EXTENSION exists as a constant string
		String outputTypeExtVar = "output_type_extension"; // Default key name
		try {
			// Attempt to get the constant value if it exists
			java.lang.reflect.Field field = Variables.class.getDeclaredField("OUTPUT_TYPE_EXTENSION");
			field.setAccessible(true);
			outputTypeExtVar = (String) field.get(null);
		} catch (NoSuchFieldException | IllegalAccessException e) {
			log.warn("Could not reflectively access Variables.OUTPUT_TYPE_EXTENSION, using default key name.", e);
		}
		ctx.variables.set(outputTypeExtVar, FilenameUtils.getExtension(ctx.settings.getReportTemplate().outputtype));

		if (reportParameters != null) {
			reportParameters.forEach((k, v) -> {
				System.out.println("[DEBUG] Setting ctx.variables " + k + " = " + v);
				ctx.variables.set(k, v);
			});
		}

		if (this.isPreviewMode)
			this._setPreviewMode();
	}

	@Override
	protected void parseBurstingMetaData() throws Exception {
		// Unified bursting metadata parsing for all reporters
		if (ctx.reportData == null || ctx.reportData.isEmpty()) {
			ctx.burstTokens = new ArrayList<>();
			log.warn("Source data is null or empty. No burst tokens generated.");
			return;
		}

		// Resolve idColumn from whichever dataSource options present
		String idColumnSetting = getIdColumnSetting(); // Use helper method
		if (StringUtils.isEmpty(idColumnSetting)) {
			idColumnSetting = CsvUtils.NOT_USED;
		}
		log.debug("Resolved idColumn setting: {}", idColumnSetting);

		ctx.burstTokens = new ArrayList<>();
		int index = 0;
		String lowerIdColumnSetting = idColumnSetting.toLowerCase(); // Lowercase once for comparisons

		for (Map<String, Object> row : ctx.reportData) {
			String token = null; // Initialize token for this row

			switch (lowerIdColumnSetting) {
			case CsvUtils.NOT_USED:
				// token = String.valueOf(index + 1);
				token = String.valueOf(index);
				log.trace("Using index as token (idcolumn=notused): {}", token);
				break;
			case CsvUtils.COLUMN_FIRST:
				if (!row.isEmpty()) {
					// Fallback to index if value is null
					token = Objects.toString(row.values().iterator().next(), String.valueOf(index + 1));
				} else {
					token = String.valueOf(index + 1); // Fallback if row is empty
				}
				log.trace("Using first column value as token: {}", token);
				break;
			case CsvUtils.COLUMN_LAST:
				Object lastValue = null;
				if (!row.isEmpty()) {
					for (Object v : row.values()) {
						lastValue = v;
					}
					// Fallback to index if value is null
					token = Objects.toString(lastValue, String.valueOf(index + 1));
				} else {
					token = String.valueOf(index + 1); // Fallback if row is empty
				}
				log.trace("Using last column value as token: {}", token);
				break;
			default:
				// Handle numeric index case
				if (StringUtils.isNumeric(idColumnSetting)) {
					try {
						List<String> keys = new ArrayList<>(row.keySet());
						int pos = Integer.parseInt(idColumnSetting);
						if (pos >= 0 && pos < keys.size()) {
							String key = keys.get(pos);
							token = Objects.toString(row.get(key), String.valueOf(index + 1)); // Fallback to index
							log.trace("Using numeric index {} (key='{}') as token: {}", pos, key, token);
						} else {
							log.warn(
									"Numeric idcolumn index {} out of bounds for row with {} columns. Falling back to index.",
									pos, keys.size());
							token = String.valueOf(index + 1);
						}
					} catch (NumberFormatException e) {
						log.error("Error parsing numeric idcolumn '{}'. Falling back to index.", idColumnSetting, e);
						token = String.valueOf(index + 1);
					}
				}
				// Handle named column case (case-insensitive)
				else {
					boolean found = false;
					for (Map.Entry<String, Object> entry : row.entrySet()) {
						String currentKey = entry.getKey();
						if (currentKey != null && currentKey.toLowerCase().equals(lowerIdColumnSetting)) {
							token = Objects.toString(entry.getValue(), String.valueOf(index + 1)); // Fallback to index
							log.trace("Found token using case-insensitive idcolumn '{}' (original key '{}'): {}",
									idColumnSetting, currentKey, token);
							found = true;
							break; // Found the key, stop searching this row
						}
					}
					// Fallback if named column not found
					if (!found) {
						log.warn("idcolumn '{}' not found (case-insensitive) in row keys {}. Falling back to index.",
								idColumnSetting, row.keySet());
						token = String.valueOf(index + 1);
					}
				}
				break; // End of default case
			} // End of switch

			// Ensure token is never null (should be handled by fallbacks, but as a
			// safeguard)
			if (token == null) {
				log.error("Token became null unexpectedly for row index {}. Using index as fallback.", index);
				token = String.valueOf(index + 1);
			}

			// *** Revert to original variable parsing method ***
			// This assumes parseUserVariablesFromMap handles setting all necessary
			// variables
			// including burst_token, row_index, row_number, varX, colX, and named ones.
			// You might need to adjust this call or the implementation of
			// parseUserVariablesFromMap if it doesn't cover all requirements.
			try {
				ctx.variables.parseUserVariablesFromMap(token, row);
				// Optionally, explicitly set standard variables if parseUserVariablesFromMap
				// doesn't
				ctx.variables.setUserVariable(token, "burst_token", token); // Assuming setUserVariable exists
				ctx.variables.setUserVariable(token, "row_index", String.valueOf(index));
				ctx.variables.setUserVariable(token, "row_number", String.valueOf(index + 1));
				log.trace("Populated variables for token '{}' using parseUserVariablesFromMap.", token);
			} catch (Exception e) {
				log.error("Error calling parseUserVariablesFromMap for token '{}'. Variables might be incomplete.",
						token, e);
				// Fallback or rethrow depending on desired behavior
			}

			ctx.burstTokens.add(token);
			index++;
		}
		log.debug("Generated {} burst tokens.", ctx.burstTokens.size());
	}

	private String getIdColumnSetting() {

		String typeString = ctx.settings.reportingSettings.report.datasource.type;

		log.debug("Determined active data source type string: {}", typeString);

		ReportSettings.DataSource dataSource = ctx.settings.getReportDataSource();

		// Use equalsIgnoreCase for robustness
		if (typeString.equalsIgnoreCase("ds.sqlquery")) {
			return dataSource.sqloptions.idcolumn;
		} else if (typeString.equalsIgnoreCase("ds.csvfile") || typeString.equalsIgnoreCase("ds.tsvfile")) {
			return dataSource.csvoptions.idcolumn;
		} else if (typeString.equalsIgnoreCase("ds.fixedwidthfile")) {
			return dataSource.fixedwidthoptions.idcolumn;
		} else if (typeString.equalsIgnoreCase("ds.xmlfile")) {
			return dataSource.xmloptions.idcolumn;
		} else if (typeString.equalsIgnoreCase("ds.excelfile")) {
			return dataSource.exceloptions.idcolumn;
		} else if (typeString.equalsIgnoreCase("ds.scriptfile")) {
			return dataSource.scriptoptions.idcolumn;
		} else if (typeString.equalsIgnoreCase("ds.gsheet") || typeString.equalsIgnoreCase("ds.o365sheet")) {
			// Assuming cloud sheets might not have a specific idcolumn setting in the same
			// way
			log.warn("idcolumn setting not currently implemented/checked for type: {}", typeString);
			return null;
		} else {
			log.warn("Unknown data source type string '{}'. Cannot determine idcolumn.", typeString);
			return null;
		}
	}

	@Override
	protected void extractOutputBurstDocument() throws Exception {

		String templateFilePath = ctx.settings.getReportTemplate().retrieveTemplateFilePath();

		// Existing template generation logic
		if (ctx.settings.getReportTemplate().outputtype.equals(CsvUtils.OUTPUT_TYPE_DOCX))
			generateDocxFromDocxTemplateUsingXDocReport(ctx.extractedFilePath, templateFilePath,
					ctx.variables.getUserVariables(ctx.token));
		else if (ctx.settings.getReportTemplate().outputtype.equals(CsvUtils.OUTPUT_TYPE_HTML))
			generateFileFromFreemarkerTemplate(ctx.extractedFilePath, templateFilePath,
					ctx.variables.getUserVariables(ctx.token), "Built by");
		else if (ctx.settings.getReportTemplate().outputtype.equals(CsvUtils.OUTPUT_TYPE_ANY))
			generateFileFromFreemarkerTemplate(ctx.extractedFilePath, templateFilePath,
					ctx.variables.getUserVariables(ctx.token), "none");
		else if (ctx.settings.getReportTemplate().outputtype.equals(CsvUtils.OUTPUT_TYPE_PDF)) {
			generatePDFFromHtmlTemplateUsingFlywingSaucer(ctx.extractedFilePath, templateFilePath,
					ctx.variables.getUserVariables(ctx.token));
		} else if (ctx.settings.getReportTemplate().outputtype.equals(CsvUtils.OUTPUT_TYPE_FOP2PDF)) {
			String foContent = generateFileContentFromFreemarkerTemplate(templateFilePath,
					ctx.variables.getUserVariables(ctx.token));

			renderPdfFromFoContent(ctx.extractedFilePath, foContent);
		} else if (ctx.settings.getReportTemplate().outputtype.equals(CsvUtils.OUTPUT_TYPE_EXCEL))
			generateExcelFromHtmlTemplateUsingHtmlExporter(ctx.extractedFilePath, templateFilePath,
					ctx.variables.getUserVariables(ctx.token));
	}

	// --- Template Generation Methods (Unchanged) ---

	protected void generateExcelFromHtmlTemplateUsingHtmlExporter(String documentPath, String templatePath,
			Map<String, Object> userVariables) throws Exception {

		// First generate HTML content using existing method
		String tempHtmlPath = documentPath.replace(".xlsx", ".html");
		generateFileFromFreemarkerTemplate(tempHtmlPath, templatePath, userVariables, "none");

		// Read the generated HTML
		String html = Files.readString(Paths.get(tempHtmlPath));

		// Convert HTML to Excel using html-exporter
		new ExcelExporter().exportHtml(html, new File(documentPath));

		// Clean up temporary HTML file
		Files.deleteIfExists(Paths.get(tempHtmlPath));
	}

	protected Object toObject(String value) {
		if (value == null || value.trim().isEmpty()) {
			return value;
		}
		String trimmed = value.trim();

		// 1) If it's an integer, return Integer
		if (trimmed.matches("-?\\d+")) {
			try {
				return Integer.parseInt(trimmed);
			} catch (NumberFormatException e) {
				// fallback below
			}
		}
		// 2) If it's a decimal, return Double
		if (trimmed.matches("-?\\d+\\.\\d+")) {
			try {
				return Double.parseDouble(trimmed);
			} catch (NumberFormatException e) {
				// fallback below
			}
		}
		// 3) Try to parse as a date
		List<SimpleDateFormat> dateFormats = new ArrayList<>();
		dateFormats.add(new SimpleDateFormat("MMMM yyyy"));
		dateFormats.add(new SimpleDateFormat("yyyy-MM-dd"));
		dateFormats.add(new SimpleDateFormat("MM/dd/yyyy"));
		dateFormats.add(new SimpleDateFormat("dd-MMM-yyyy"));
		for (SimpleDateFormat fmt : dateFormats) {
			try {
				fmt.setLenient(false);
				return fmt.parse(trimmed);
			} catch (ParseException ignored) {
			}
		}
		// 4) Fallback to the original string
		return value;
	}

	private void generateFileFromFreemarkerTemplate(String extractedFilePath, String templatePath,
			Map<String, Object> userVariables, String bType) throws Exception {
		String template = FileUtils.readFileToString(new File(templatePath), "UTF-8");
		Template engine = new Template("template", template, Utils.freeMarkerCfg);
		StringWriter stringWriter = new StringWriter();
		engine.process(userVariables, stringWriter);
		stringWriter.flush();

		String htmlContent = stringWriter.toString();

		if (!bType.equals("none")) {
			// Assuming com.sourcekraft.documentburster.common.utils.Utils.ibContent exists
			try {
				htmlContent = com.sourcekraft.documentburster.utils.Utils.ibContent(htmlContent, bType);
			} catch (Exception e) {
				log.error("Error calling common.utils.Utils.ibContent", e);
			}
		}

		FileUtils.writeStringToFile(new File(extractedFilePath), htmlContent, "UTF-8");
	}

	private String generateFileContentFromFreemarkerTemplate(String templatePath, Map<String, Object> userVariables)
			throws Exception {
		String template = FileUtils.readFileToString(new File(templatePath), "UTF-8");
		Template engine = new Template("template", template, Utils.freeMarkerCfg);
		StringWriter stringWriter = new StringWriter();
		engine.process(userVariables, stringWriter);
		stringWriter.flush();

		return stringWriter.toString();

	}

	private void generateDocxFromDocxTemplateUsingXDocReport(String documentPath, String templatePath,
			Map<String, Object> variablesData) throws Exception {
		InputStream is = Files.newInputStream(Paths.get(templatePath));
		IXDocReport report = XDocReportRegistry.getRegistry().loadReport(is, TemplateEngineKind.Freemarker);
		IContext context = report.createContext();
		context.putMap(variablesData);
		OutputStream out = new FileOutputStream(new File(documentPath));
		report.process(context, out);
		out.close(); // Ensure stream is closed
		is.close(); // Ensure stream is closed
	}

	public void generateDocxFromDocxTemplateUsingDocx4j(String documentPath, String templatePath,
			Map<String, String> variablesData) throws Exception {

		File outputFile = new File(documentPath);
		outputFile.getParentFile().mkdirs();

		WordprocessingMLPackage wordMLPackage = WordprocessingMLPackage.load(new File(templatePath));
		MainDocumentPart documentPart = wordMLPackage.getMainDocumentPart();
		VariablePrepare.prepare(wordMLPackage);
		documentPart.variableReplace(variablesData);

		wordMLPackage.save(outputFile);

	}

	public void convertDocxToPDFUsingDocx4j(String docxFilePath, String pdfFilePath) throws Exception {

		InputStream templateInputStream = new FileInputStream(docxFilePath);
		WordprocessingMLPackage wordMLPackage = WordprocessingMLPackage.load(templateInputStream);

		FileOutputStream os = new FileOutputStream(pdfFilePath);
		try {
			Docx4J.toPDF(wordMLPackage, os);
		} finally {
			os.flush();
			os.close();
			templateInputStream.close(); // Close input stream
		}
	}

	public void convertDocxToPDFUsingXDocReport(String docxFilePath, String pdfFilePath) throws Exception {

		InputStream in = new FileInputStream(new File(docxFilePath));
		XWPFDocument document = new XWPFDocument(in);
		PdfOptions options = PdfOptions.create();
		OutputStream out = new FileOutputStream(new File(pdfFilePath));
		try {
			PdfConverter.getInstance().convert(document, out, options);
		} finally {
			out.close(); // Ensure stream is closed
			in.close(); // Ensure stream is closed
			document.close(); // Close document
		}
	}

	/*
	 * public void generatePDFFromDocxTemplateUsingYarg(String documentPath, String
	 * templatePath, Map<String, Object> variablesData) throws IOException {
	 * 
	 * BandData root = new BandData("Root", null, BandOrientation.HORIZONTAL);
	 * 
	 * BandData documentData = new BandData("documentData", root,
	 * BandOrientation.HORIZONTAL);
	 * 
	 * for (Map.Entry<String, Object> entry : variablesData.entrySet()) {
	 * documentData.addData(entry.getKey(), entry.getValue()); }
	 * 
	 * root.addChild(documentData);
	 * 
	 * String templateCode = FilenameUtils.getBaseName(templatePath); String
	 * templateName = FilenameUtils.getName(templatePath); String templateExtension
	 * = FilenameUtils.getExtension(templatePath);
	 * 
	 * String documentExtension = FilenameUtils.getExtension(documentPath);
	 * 
	 * ReportOutputType outputType = ReportOutputType.pdf;
	 * 
	 * if (documentExtension.equals("xlsx")) outputType = ReportOutputType.xlsx;
	 * 
	 * try (FileOutputStream outputStream = FileUtils.openOutputStream(new
	 * File(documentPath))) {
	 * 
	 * DefaultFormatterFactory defaultFormatterFactory = new
	 * DefaultFormatterFactory(); // Consider making font directory configurable or
	 * finding fonts differently
	 * defaultFormatterFactory.setFontsDirectory("C:/Windows/Fonts");
	 * ReportFormatter formatter = defaultFormatterFactory.createFormatter(new
	 * FormatterFactoryInput( templateExtension, documentData, // Changed rootBand
	 * to documentData as it holds the variables new
	 * ReportTemplateImpl(templateCode, templateName, templatePath, outputType),
	 * outputStream));
	 * 
	 * formatter.renderDocument();
	 * 
	 * } }
	 */

	private void renderPdfFromFoContent(String pdfPath, String foContent) throws Exception {
		// Base URI for resolving includes/images/fonts
		URI baseUri = new File(".").toURI();
		FopFactory fopFactory = FopFactory.newInstance(baseUri);

		try (OutputStream out = new FileOutputStream(pdfPath);
				InputStream in = new ByteArrayInputStream(foContent.getBytes(StandardCharsets.UTF_8))) {

			Fop fop = fopFactory.newFop(MimeConstants.MIME_PDF, out);

			// Use an "identity" transformer (no stylesheet) to pass the FO content to FOP
			Transformer transformer = TransformerFactory.newInstance().newTransformer();

			// The source is now the in-memory stream of our FO content
			StreamSource src = new StreamSource(in);

			// The result is still the FOP handler
			SAXResult res = new SAXResult(fop.getDefaultHandler());

			// Start the transformation (which is just a pass-through)
			transformer.transform(src, res);
		}
	}

	private void generatePDFFromHtmlTemplateUsingFlywingSaucer(String documentPath, String templatePath,
			Map<String, Object> variablesData) throws Exception {

		// First generate the HTML using the existing method
		String tempHtmlPath = documentPath.replace(".pdf", ".html");
		this.generateFileFromFreemarkerTemplate(tempHtmlPath, templatePath, variablesData, "Built by");

		// Read the generated HTML
		String html = Files.readString(Paths.get(tempHtmlPath));

		// Setup the PDF renderer
		File parentDir = new File(templatePath).getParentFile();
		String baseUri = parentDir.toURI().toString();

		// Create the PDF
		try (FileOutputStream os = new FileOutputStream(documentPath)) {
			PdfRendererBuilder builder = new PdfRendererBuilder();
			builder.withHtmlContent(html, baseUri);
			builder.toStream(os);
			builder.run();
		} finally {
			// Clean up temporary HTML file
			try {
				Files.deleteIfExists(Paths.get(tempHtmlPath));
			} catch (IOException e) {
				log.warn("Failed to delete temporary HTML file: {}", tempHtmlPath, e);
			}
		}
	}

	public void _setPreviewMode() {

		ctx.settings.setSendFilesEmail(false);
		ctx.settings.setSendFilesSms(false);
		ctx.settings.setSendFilesUpload(false);
		ctx.settings.setSendFilesWeb(false);

		ctx.settings.getReportTemplate().outputtype = CsvUtils.OUTPUT_TYPE_NONE;
		
	}

	public void setPreviewMode(boolean isPreviewMode) {
		this.isPreviewMode = isPreviewMode;
	}

	protected void checkLicense() throws Exception {
		if (!this.isPreviewMode)
			super.checkLicense();
	}

	protected void executeBurstingLifeCycleScript(String scriptFileName, BurstingContext context) throws Exception {
		if (!this.isPreviewMode)
			super.executeBurstingLifeCycleScript(scriptFileName, context);
		else {
			if (scriptFileName.equals(Scripts.CONTROLLER)) {
				ctx.settings.loadSettings();
				ctx.variables = new Variables(fileName, ctx.settings.getLanguage(), ctx.settings.getCountry(),
						ctx.settings.getNumberOfUserVariables());
			}

			if (scriptFileName.endsWith("-additional-transformation.groovy")
					|| scriptFileName.endsWith("-script.groovy")) {
				super.executeBurstingLifeCycleScript(scriptFileName, context);
			}
		}
	}

	protected void writeStatsFile() throws Exception {
		if (!this.isPreviewMode)
			super.writeStatsFile();
	}

	protected String getReportFolderName() {

		// Get config folder and its name (used as base for the script)
		File configFile = new File(configurationFilePath);
		File configFolder = configFile.getParentFile();
		return configFolder.getName(); // e.g., "sql-payslips"

	}

	protected void setUpScriptingRoots() {
		// Default roots
		String[] defaultRoots = new String[] { "scripts/burst", "scripts/burst/internal" };

		File configFile = new File(configurationFilePath);
		File configFolder = configFile.getParentFile();
		String configFolderPath = configFolder.getAbsolutePath();

		String[] roots = new String[] { configFolderPath, defaultRoots[0], defaultRoots[1] };
		scripting.setRoots(roots);
		//log.info("Added config folder to scripting roots: {}", configFolderPath);

		// Compose expected script file name
		String additionalScriptName = this.getReportFolderName() + "-additional-transformation.groovy";
		File additionalScriptFile = new File(configFolder, additionalScriptName);

		if ((additionalScriptFile.exists() && additionalScriptFile.length() > 0)) {
			// Add config folder as first root so GroovyScriptEngine finds the script
			ctx.scripts.transformFetchedData = additionalScriptName;
			log.info("Configured ctx.scripts.transformFetchedData to be: {}", additionalScriptName);
		}
	}
}