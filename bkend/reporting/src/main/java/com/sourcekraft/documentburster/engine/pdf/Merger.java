package com.sourcekraft.documentburster.engine.pdf;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

import org.apache.commons.io.FileUtils;
import org.apache.commons.io.FilenameUtils;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.lowagie.text.Document;
import com.lowagie.text.pdf.PdfCopy;
import com.lowagie.text.pdf.PdfReader;
import com.lowagie.text.pdf.PdfSmartCopy;
import com.sourcekraft.documentburster.common.settings.Settings;
import com.sourcekraft.documentburster.utils.Utils;
import com.sourcekraft.documentburster.variables.Variables;

public class Merger {

	protected Logger log = LoggerFactory.getLogger(Merger.class);

	private Settings settings;
	private Variables variables;

	private String outputFolder;
	private String backupFolder;

	private String outputFileName;
	private String mergedFilePath;

	private List<InputStream> streamOfPDFFiles = new ArrayList<InputStream>();

	public Merger(Settings settings) {

		this.settings = settings;

	}

	private void createFoldersAndPrepare(List<String> filePaths) throws Exception {

		if (StringUtils.isEmpty(outputFileName))
			outputFileName = settings.getMergeFileName();

		if (StringUtils.isEmpty(outputFileName))
			outputFileName = "merged.pdf";

		outputFolder = Utils.getStringFromTemplate(settings.getOutputFolder(), variables, "");

		backupFolder = Utils.getStringFromTemplate(settings.getBackupFolder(), variables, "") + "/merge/files";

		File outputDir = new File(outputFolder);
		if (!outputDir.exists())
			FileUtils.forceMkdir(outputDir);

		File backupDir = new File(backupFolder);
		if (!backupDir.exists())
			FileUtils.forceMkdir(backupDir);

		for (String filePath : filePaths) {

			String fileName = FilenameUtils.getName(filePath);
			File file = new File(backupFolder + "/" + fileName);
			FileUtils.copyFile(new File(filePath), file);

			streamOfPDFFiles.add(new FileInputStream(file));
		}

	}

	public String doMerge(List<String> filePaths, String outFileName) throws Exception {

		log.debug("Merger:doMerge filePaths = " + filePaths + ", outputFileName = " + outFileName);

		this.outputFileName = outFileName;

		if (StringUtils.isEmpty(outputFileName))
			this.outputFileName = settings.getMergeFileName();

		if (StringUtils.isEmpty(outputFileName))
			this.outputFileName = "merged.pdf";

		variables = new Variables(this.outputFileName, settings.getLanguage(), settings.getCountry(),
				settings.getNumberOfUserVariables());

		createFoldersAndPrepare(filePaths);

		mergedFilePath = outputFolder + "/" + this.outputFileName;

		List<InputStream> pdfs = streamOfPDFFiles;
		Iterator<InputStream> iteratorPDFs = pdfs.iterator();

		List<PdfReader> readers = new ArrayList<PdfReader>();

		while (iteratorPDFs.hasNext()) {
			InputStream pdf = iteratorPDFs.next();
			PdfReader pdfReader = new PdfReader(pdf);
			readers.add(pdfReader);
			pdf.close();
		}

		PdfCopy copy = null;
		Document document = new Document();

		try {

			copy = new PdfSmartCopy(document, new FileOutputStream(mergedFilePath));

			document.open();

			Iterator<PdfReader> iteratorPDFReaders = readers.iterator();

			while (iteratorPDFReaders.hasNext()) {
				PdfReader pdfReader = iteratorPDFReaders.next();
				int n = pdfReader.getNumberOfPages();
				for (int page = 0; page < n;) {
					copy.addPage(copy.getImportedPage(pdfReader, ++page));
				}
				copy.freeReader(pdfReader);
				pdfReader.close();
			}

		} finally {

			document.addCreator(Utils.getProductName(settings.getVersion()));
			document.addAuthor(Utils.getProductName(settings.getVersion()));

			if (document.isOpen())
				document.close();

			if (copy != null)
				copy.close();

		}

		return mergedFilePath;
	
	}

	public String getBackupFolder() {
		return backupFolder;
	}

	public String getOutputFolder() {
		return outputFolder;
	}

}
