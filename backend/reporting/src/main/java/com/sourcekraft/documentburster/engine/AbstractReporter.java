package com.sourcekraft.documentburster.engine;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.StringWriter;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;

import org.apache.commons.io.FileUtils;
import org.apache.commons.io.FilenameUtils;
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

public abstract class AbstractReporter extends AbstractBurster {

    protected List<String[]> parsedLines;

    public AbstractReporter(String configFilePath) {
        super(configFilePath);
    }

    @Override
    protected void processAttachments() throws Exception {
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
        if (ctx.settings.getReportTemplate().outputtype.equals(CsvUtils.OUTPUT_TYPE_DOCX))
            generateDocxFromDocxTemplateUsingXDocReport(ctx.extractedFilePath,
                    ctx.settings.getReportTemplate().retrieveTemplateFilePath(), 
                    ctx.variables.getUserVariables(ctx.token));
        else if (ctx.settings.getReportTemplate().outputtype.equals(CsvUtils.OUTPUT_TYPE_HTML))
            generateHtmlFromHtmlTemplateUsingFreemarker(ctx.extractedFilePath,
                    ctx.settings.getReportTemplate().retrieveTemplateFilePath(), 
                    ctx.variables.getUserVariables(ctx.token));
    }

    protected void generateHtmlFromHtmlTemplateUsingFreemarker(String extractedFilePath, String templatePath,
            Map<String, Object> userVariables) throws Exception {
        String template = FileUtils.readFileToString(new File(templatePath), "UTF-8");
        Template engine = new Template("template", template, Utils.freeMarkerCfg);
        StringWriter stringWriter = new StringWriter();
        engine.process(userVariables, stringWriter);
        stringWriter.flush();
        FileUtils.writeStringToFile(new File(extractedFilePath), stringWriter.toString(), "UTF-8");
    }

    protected void generateDocxFromDocxTemplateUsingXDocReport(String documentPath, String templatePath,
            Map<String, Object> variablesData) throws Exception {
        InputStream is = Files.newInputStream(Paths.get(templatePath));
        IXDocReport report = XDocReportRegistry.getRegistry().loadReport(is, TemplateEngineKind.Freemarker);
        IContext context = report.createContext();
        context.putMap(variablesData);
        OutputStream out = new FileOutputStream(new File(documentPath));
        report.process(context, out);
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
		}
	}

	public void convertDocxToPDFUsingXDocReport(String docxFilePath, String pdfFilePath) throws Exception {

		InputStream in = new FileInputStream(new File(docxFilePath));
		XWPFDocument document = new XWPFDocument(in);
		PdfOptions options = PdfOptions.create();
		OutputStream out = new FileOutputStream(new File(pdfFilePath));
		PdfConverter.getInstance().convert(document, out, options);

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

	
    public List<String[]> getParsedLines() {
        return parsedLines;
    }

}