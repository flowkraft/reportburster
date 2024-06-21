package com.sourcekraft.documentburster.engine.csv;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.StringWriter;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

import org.apache.commons.io.FileUtils;
import org.apache.commons.io.FilenameUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.docx4j.Docx4J;
import org.docx4j.model.datastorage.migration.VariablePrepare;
import org.docx4j.openpackaging.packages.WordprocessingMLPackage;
import org.docx4j.openpackaging.parts.WordprocessingML.MainDocumentPart;

import com.haulmont.yarg.formatters.ReportFormatter;
import com.haulmont.yarg.formatters.factory.DefaultFormatterFactory;
import com.haulmont.yarg.formatters.factory.FormatterFactoryInput;
import com.haulmont.yarg.structure.BandData;
import com.haulmont.yarg.structure.BandOrientation;
import com.haulmont.yarg.structure.ReportOutputType;
import com.haulmont.yarg.structure.impl.ReportTemplateImpl;
import com.opencsv.CSVParserBuilder;
import com.opencsv.CSVReader;
import com.opencsv.CSVReaderBuilder;
import com.sourcekraft.documentburster.engine.AbstractBurster;
import com.sourcekraft.documentburster.utils.CsvUtils;
import com.sourcekraft.documentburster.utils.Utils;
import com.sourcekraft.documentburster.variables.Variables;

import fr.opensagres.poi.xwpf.converter.pdf.PdfConverter;
import fr.opensagres.poi.xwpf.converter.pdf.PdfOptions;
import fr.opensagres.xdocreport.document.IXDocReport;
import fr.opensagres.xdocreport.document.registry.XDocReportRegistry;
import fr.opensagres.xdocreport.template.IContext;
import fr.opensagres.xdocreport.template.TemplateEngineKind;
import freemarker.template.Template;

public class CsvReporter extends AbstractBurster {

	private List<String[]> parsedCsvLines;

	public CsvReporter(String configFilePath) {
		super(configFilePath);
		// TODO Auto-generated constructor stub
	}

	/*
	 * private CsvFormat getCsvFormat() throws Exception { Reader reader = new
	 * FileReader(filePath);
	 * 
	 * CsvParserSettings settings = new CsvParserSettings();
	 * settings.setReadInputOnSeparateThread(false);
	 * settings.detectFormatAutomatically();
	 * 
	 * CsvParser csvParser = new CsvParser(settings);
	 * csvParser.beginParsing(reader); CsvFormat format =
	 * csvParser.getDetectedFormat(); // here is the result csvParser.stopParsing();
	 * 
	 * return format; }
	 */

	protected void initializeResources() throws Exception {

		ctx.variables.setVarAliases(Arrays.asList("col"));
		// outputtype is output.docx, output.pdf, output.xlsx, output.html
		ctx.variables.set(Variables.OUTPUT_TYPE_EXTENSION,
				FilenameUtils.getExtension(ctx.settings.getReportTemplate().outputtype));

		char separatorChar = CsvUtils.DEFAULT_SEPARATOR;
		String sSeparator = ctx.settings.getReportDataSource().csvoptions.separatorchar;
		if ((StringUtils.isNotBlank(sSeparator))) {

			if ((sSeparator.equals(CsvUtils.AUTODETECT))) {

				// maybe in a future version
				/*
				 * CsvFormat csvFormat = this.getCsvFormat();
				 * 
				 */

			} else {
				separatorChar = sSeparator.charAt(0);
			}
		}

		char quotationChar = CsvUtils.DEFAULT_QUOTE_CHARACTER;
		String sQuotation = ctx.settings.getReportDataSource().csvoptions.quotationchar;
		if ((StringUtils.isNotBlank(sQuotation))) {

			if ((sQuotation.equals(CsvUtils.AUTODETECT))) {

				// maybe in a future version
				/*
				 * CsvFormat csvFormat = this.getCsvFormat();
				 * 
				 */

			} else {
				quotationChar = sQuotation.charAt(0);
			}
		}

		char escapeChar = CsvUtils.DEFAULT_ESCAPE_CHARACTER;
		String sEscape = ctx.settings.getReportDataSource().csvoptions.escapechar;
		if ((StringUtils.isNotBlank(sEscape))) {

			if ((sEscape.equals(CsvUtils.AUTODETECT))) {

				// maybe in a future version
				/*
				 * CsvFormat csvFormat = this.getCsvFormat();
				 * 
				 */

			} else {
				escapeChar = sEscape.charAt(0);
			}
		}

		boolean strictquotations = ctx.settings.getReportDataSource().csvoptions.strictquotations;
		boolean ignoreQuotations = ctx.settings.getReportDataSource().csvoptions.ignorequotations;
		boolean ignoreleadingwhitespace = ctx.settings.getReportDataSource().csvoptions.ignoreleadingwhitespace;

		int skipLines = 0;

		if (ctx.settings.getReportDataSource().csvoptions.skiplines > 0)
			skipLines = ctx.settings.getReportDataSource().csvoptions.skiplines;

		CSVParserBuilder parserBuilder = new CSVParserBuilder();

		if (separatorChar != CsvUtils.DEFAULT_SEPARATOR)
			parserBuilder.withSeparator(separatorChar);

		if (quotationChar != CsvUtils.DEFAULT_QUOTE_CHARACTER)
			parserBuilder.withQuoteChar(quotationChar);

		if (escapeChar != CsvUtils.DEFAULT_ESCAPE_CHARACTER)
			parserBuilder.withEscapeChar(escapeChar);

		if (strictquotations != CsvUtils.DEFAULT_STRICT_QUOTES)
			parserBuilder.withStrictQuotes(strictquotations);

		if (ignoreQuotations != CsvUtils.DEFAULT_IGNORE_QUOTATIONS)
			parserBuilder.withIgnoreQuotations(ignoreQuotations);

		if (ignoreleadingwhitespace != CsvUtils.DEFAULT_IGNORE_LEADING_WHITESPACE)
			parserBuilder.withIgnoreLeadingWhiteSpace(ignoreleadingwhitespace);

		CSVReaderBuilder csvReaderBuilder = new CSVReaderBuilder(Files.newBufferedReader(Paths.get(filePath)))
				.withCSVParser(parserBuilder.build());

		if (skipLines > 0)
			csvReaderBuilder.withSkipLines(skipLines);

		try (CSVReader csvReader = csvReaderBuilder.build()) {
			this.parsedCsvLines = csvReader.readAll();

			// do some basic sanity checks
			if ((this.parsedCsvLines.size() > 0) && (1 == this.parsedCsvLines.get(0).length)) {
				throw new IllegalArgumentException("Probably the configured separator '" + separatorChar
						+ "' is incorrect since only 1 column was parsed having the value '"
						+ this.parsedCsvLines.get(0)[0] + "'");
			}
		}

	}

	public List<String> parseBurstingMetaData() throws Exception {

		List<String> tokens = new ArrayList<String>();

		int lineLength = 0;
		int lineIndex = 0;
		int codeColumnIndex = -1;

		String idColumn = ctx.settings.getReportDataSource().csvoptions.idcolumn;

		if (!idColumn.contains(CsvUtils.NOT_USED) && !idColumn.contains(CsvUtils.COLUMN_LAST)) {
			if (idColumn.contains(CsvUtils.COLUMN_FIRST))
				codeColumnIndex = 0;
			else
				codeColumnIndex = Integer.valueOf(ctx.settings.getReportDataSource().csvoptions.idcolumnindex);
		}

		for (String[] currentCsvLine : this.parsedCsvLines) {

			if (lineLength <= 0) {
				lineLength = currentCsvLine.length;
				if (idColumn.contains(CsvUtils.COLUMN_LAST))
					codeColumnIndex = lineLength - 1;
			}

			String token = StringUtils.EMPTY;

			if (codeColumnIndex >= 0)
				token = currentCsvLine[codeColumnIndex];
			else
				token = String.valueOf(lineIndex);

			StringBuilder userVariablesStringBuilder = new StringBuilder();

			for (int currentColumnIndex = 0; currentColumnIndex < lineLength; currentColumnIndex++) {
				userVariablesStringBuilder.append("<").append(currentColumnIndex).append(">")
						.append(currentCsvLine[currentColumnIndex]).append("</").append(currentColumnIndex).append(">");
			}

			ctx.variables.parseUserVariables(token, userVariablesStringBuilder.toString());

			tokens.add(token);
			lineIndex++;

		}

		return tokens;
	}

	@Override
	protected void processAttachments() throws Exception {

		// if outputtype == 'OUTPUT_TYPE_NONE' remove extracted_file_path from the
		// attachments list

		if (ctx.settings.getReportTemplate().outputtype.equals(CsvUtils.OUTPUT_TYPE_NONE))
			ctx.settings.getAttachments()
					.removeIf(attachment -> attachment.path.contains(Variables.EXTRACTED_FILE_PATH));

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
	protected void extractOutputBurstDocument() throws Exception {

		// generatePDFFromDocxTemplateUsingYarg(ctx.extractedFilePath,
		// ctx.settings.getReportTemplate().documentpath,
		// variablesDataForCurrentToken);
		if (ctx.settings.getReportTemplate().outputtype.equals(CsvUtils.OUTPUT_TYPE_DOCX))
			generateDocxFromDocxTemplateUsingXDocReport(ctx.extractedFilePath,
					ctx.settings.getReportTemplate().retrieveTemplateFilePath(), ctx.variables.getUserVariables(ctx.token));
		else if (ctx.settings.getReportTemplate().outputtype.equals(CsvUtils.OUTPUT_TYPE_HTML))
			generateHtmlFromHtmlTemplateUsingFreemarker(ctx.extractedFilePath,
					ctx.settings.getReportTemplate().retrieveTemplateFilePath(), ctx.variables.getUserVariables(ctx.token));

	}

	private void generateHtmlFromHtmlTemplateUsingFreemarker(String extractedFilePath, String templatePath,
			Map<String, Object> userVariables) throws Exception {

		String template = FileUtils.readFileToString(new File(templatePath), "UTF-8");

		Template engine = new Template("template", template, Utils.freeMarkerCfg);

		StringWriter stringWriter = new StringWriter();
		engine.process(userVariables, stringWriter);
		stringWriter.flush();

		FileUtils.writeStringToFile(new File(extractedFilePath), stringWriter.toString(), "UTF-8");

	}

	public void generatePDFFromDocxTemplateUsingDocx4j(String documentPath, String templatePath,
			Map<String, Object> variablesData) throws Exception {

		/*
		 * Map<String, String> variablesDataForCurrentToken =
		 * variablesData.entrySet().stream() .filter(e -> Objects.nonNull(e.getValue())
		 * && e.getValue().getClass().equals(String.class))
		 * .collect(Collectors.toMap(Map.Entry::getKey, e -> (String) e.getValue()));
		 * 
		 * String tempDocxFilePath = ctx.tempFolder + "/" +
		 * Utils.getRandomFileName("temp.docx");
		 */

		// generateDocxFromDocxTemplateUsingDocx4j(tempDocxFilePath,
		// ctx.settings.getReportTemplate().documentpath,
		// variablesDataForCurrentToken);
		generateDocxFromDocxTemplateUsingXDocReport(documentPath, templatePath, variablesData);
		// convertDocxToPDFUsingXDocReport(tempDocxFilePath, ctx.extractedFilePath);
		// convertDocxToPDFUsingDocx4j(tempDocxFilePath, ctx.extractedFilePath);

		/*
		 * File tempOutputDocxFile = new File(tempDocxFilePath); if
		 * (tempOutputDocxFile.exists()) tempOutputDocxFile.delete();
		 */
	}

	public void generatePDFFromDocxTemplateUsingYarg(String documentPath, String templatePath,
			Map<String, Object> variablesData) throws IOException {

		BandData root = new BandData("Root", null, BandOrientation.HORIZONTAL);

		BandData documentData = new BandData("documentData", root, BandOrientation.HORIZONTAL);

		for (Map.Entry<String, Object> entry : variablesData.entrySet()) {
			documentData.addData(entry.getKey(), entry.getValue());
		}

		root.addChild(documentData);

		String templateCode = FilenameUtils.getBaseName(templatePath);
		String templateName = FilenameUtils.getName(templatePath);
		String templateExtension = FilenameUtils.getExtension(templatePath);

		String documentExtension = FilenameUtils.getExtension(documentPath);

		ReportOutputType outputType = ReportOutputType.pdf;

		if (documentExtension.equals("xlsx"))
			outputType = ReportOutputType.xlsx;

		try (FileOutputStream outputStream = FileUtils.openOutputStream(new File(documentPath))) {

			DefaultFormatterFactory defaultFormatterFactory = new DefaultFormatterFactory();
			defaultFormatterFactory.setFontsDirectory("C:/Windows/Fonts");
			ReportFormatter formatter = defaultFormatterFactory.createFormatter(new FormatterFactoryInput(
					templateExtension, documentData,
					new ReportTemplateImpl(templateCode, templateName, templatePath, outputType), outputStream));

			formatter.renderDocument();

		}
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

	public void generateDocxFromDocxTemplateUsingXDocReport(String documentPath, String templatePath,
			Map<String, Object> variablesData) throws Exception {

		InputStream is = Files.newInputStream(Paths.get(templatePath));
		IXDocReport report = XDocReportRegistry.getRegistry().loadReport(is, TemplateEngineKind.Freemarker);

		IContext context = report.createContext();
		context.putMap(variablesData);
		OutputStream out = new FileOutputStream(new File(documentPath));
		report.process(context, out);
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
		}
	}

	public void convertDocxToPDFUsingXDocReport(String docxFilePath, String pdfFilePath) throws Exception {

		InputStream in = new FileInputStream(new File(docxFilePath));
		XWPFDocument document = new XWPFDocument(in);
		PdfOptions options = PdfOptions.create();
		OutputStream out = new FileOutputStream(new File(pdfFilePath));
		PdfConverter.getInstance().convert(document, out, options);

	}

	public List<String[]> getParsedCsvLines() {
		return parsedCsvLines;
	}
}
