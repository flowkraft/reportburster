package com.sourcekraft.documentburster.engine.pdf;

import java.io.File;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.text.PDFTextStripper;
//import org.perf4j.aop.Profiled;

import com.sourcekraft.documentburster.engine.AbstractBurster;
import com.sourcekraft.documentburster.engine.pdf.extractor.PdfExtractor;
import com.sourcekraft.documentburster.utils.Utils;

public class PdfBurster extends AbstractBurster {

	private Logger log = LoggerFactory.getLogger(PdfBurster.class);

	private static final String CFG_START_SHORT = "<c>";
	private static final String CFG_END_SHORT = "</c>";
	private static final String CFG_START_LONG = "<config>";
	private static final String CFG_END_LONG = "</config>";

	private PDDocument document;

	protected Map<String, List<PDPage>> burstDocuments;

	private PDPage currentPage;

	private String[] lastNonEmptyTokens;

	public PdfBurster(String configFilePath) {
		super(configFilePath);
	}

	protected void initializeResources() throws Exception {

		ctx.burstTokens = new ArrayList<String>();
		burstDocuments = new HashMap<String, List<PDPage>>();

		document = PDDocument.load(new File(filePath));

	}

	protected void closeResources() throws Exception {

		if (document != null)
			document.close();

	}

	protected void parseBurstingMetaData() throws Exception {

		int numberOfPages = document.getNumberOfPages();

		ctx.numberOfPages = numberOfPages;

		ctx.previousPageText = StringUtils.EMPTY;
		ctx.currentPageText = StringUtils.EMPTY;
		ctx.currentPageIndex = -1;

		this.requestedCancelOrPauseProcessing = checkIfRequestedCancelOrPauseProcessing();

		for (int i = 1; i < numberOfPages + 1; i++) {

			if (!requestedCancelOrPauseProcessing) {

				ctx.currentPageIndex = i;

				scripting.executeBurstingLifeCycleScript(ctx.scripts.startParsePage, ctx);
				processPage(i);
				scripting.executeBurstingLifeCycleScript(ctx.scripts.endParsePage, ctx);

				ctx.previousPageText = ctx.currentPageText;
				ctx.currentPageText = StringUtils.EMPTY;

				this.requestedCancelOrPauseProcessing = checkIfRequestedCancelOrPauseProcessing();

			}

		}

		ctx.previousPageText = StringUtils.EMPTY;
		ctx.currentPageText = StringUtils.EMPTY;
		ctx.currentPageIndex = -1;

		if (ctx.burstTokens.size() == 0) {

			log.info("No burst tokens were found in the document -> Burting the document into " + numberOfPages
					+ " documents of one page each...");

			for (int i = 1; i <= numberOfPages; i++) {
				String token = Integer.toString(i);

				ctx.burstTokens.add(token);

				List<PDPage> pages = new ArrayList<PDPage>();
				pages.add(((PDPage) document.getDocumentCatalog().getPages().get(i - 1)));
				burstDocuments.put(token, pages);

			}
		}

	}

	// @Profiled
	public void processPage(int pageIndex) throws Exception {

		PDFTextStripper stripper;

		stripper = new PDFTextStripper() {
			protected void endPage(PDPage page) {
				currentPage = page;
			}
		};

		/* start text extraction options */
		if (ctx.settings.getAverageCharTolerance() > 0)
			stripper.setAverageCharTolerance(ctx.settings.getAverageCharTolerance());

		if (ctx.settings.getSpacingTolerance() > 0)
			stripper.setSpacingTolerance(ctx.settings.getSpacingTolerance());

		stripper.setSortByPosition(ctx.settings.isSortByPosition());
		stripper.setSuppressDuplicateOverlappingText(ctx.settings.isSuppressDuplicateOverlappingText());
		stripper.setShouldSeparateByBeads(ctx.settings.isShouldSeparateByBeads());
		/* end text extraction options */

		stripper.setStartPage(pageIndex);
		stripper.setEndPage(pageIndex);

		ctx.currentPageText = stripper.getText(document);

		if (pageIndex == 1) {
			checkForCustomConfigFile();
		}

		stripper = null;

		scripting.executeBurstingLifeCycleScript(ctx.scripts.parsePageTokens, ctx);

		if (ctx.settings.isReuseTokensWhenNotFound()) {
			if (ctx.currentPageTokens == null || ctx.currentPageTokens.length == 0)
				ctx.currentPageTokens = lastNonEmptyTokens;
			else
				lastNonEmptyTokens = ctx.currentPageTokens;
		}

		if (ctx.currentPageTokens != null && ctx.currentPageTokens.length > 0)

			for (int i = 0; i < ctx.currentPageTokens.length; i++) {

				// https://stackoverflow.com/questions/9057083/remove-all-control-characters-from-a-java-string
				String token = Utils.removeControlCharactersFromString(ctx.currentPageTokens[i].trim());

				if (token.length() > 0) {

					if (ctx.burstTokens.contains(token))
						burstDocuments.get(token).add(currentPage);
					else {
						ctx.burstTokens.add(token);
						List<PDPage> pages = new ArrayList<PDPage>();
						pages.add(currentPage);
						burstDocuments.put(token, pages);
					}

					ctx.variables.parseUserVariables(token, ctx.currentPageText);

				}
			}

		log.info("Done reading page " + pageIndex + " ...");
		log.debug("Page " + pageIndex + " contains following tokens: " + Arrays.toString(ctx.currentPageTokens));

		currentPage = null;

	}

	protected void checkForCustomConfigFile() throws Exception {

		String customConfigFilePath = StringUtils.substringBetween(ctx.currentPageText, CFG_START_SHORT, CFG_END_SHORT);

		if (StringUtils.isEmpty(customConfigFilePath))
			customConfigFilePath = StringUtils.substringBetween(ctx.currentPageText, CFG_START_LONG, CFG_END_LONG);

		log.debug("customConfigFilePath = " + customConfigFilePath);

		if (StringUtils.isNotEmpty(customConfigFilePath)) {
			ctx.configurationFilePath = customConfigFilePath;
			ctx.settings.setConfigurationFilePath(customConfigFilePath);
			executeController();
		}

	}

	protected void extractOutputBurstDocument() throws Exception {

		List<PDPage> pages = burstDocuments.get(ctx.token);

		PdfExtractor extractor = getPdfExtractor(document, ctx.extractedFilePath, ctx.token);

		extractor.doExtract(pages);

		writeDistributedBy();

		if (ctx.settings.isSplit2ndTime())
			// make sure it will not go here more than 2 levels deep
			if (!ctx.configurationFilePath.contains(Utils.SPLIT_2ND_TIME))
				_split2ndTime(ctx.extractedFilePath);

	}

	private void _split2ndTime(String filePathToSplit2ndTime) throws Exception {

		AbstractBurster split2ndSplitter = new Pdf2ndTimeSplitter(this);
		split2ndSplitter.burst(filePathToSplit2ndTime, false, StringUtils.EMPTY, -1);

	}

	protected PdfExtractor getPdfExtractor(PDDocument pdf, String outputFileName, String token) {

		log.debug("outputFileName = " + outputFileName + ", token = " + token);
		return new PdfExtractor(pdf, ctx.settings, outputFileName, token);

	}

	private void writeDistributedBy() {
		try {
			scripting.executeBurstingLifeCycleScript(ctx.scripts.distributedBy, ctx);
		} catch (Exception e) {
			// log.error("Error executing distributedBy script", e);
		}
	}

}
