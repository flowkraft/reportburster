/*
    DocumentBurster is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 2 of the License, or
    (at your option) any later version.

    DocumentBurster is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with DocumentBurster.  If not, see <http://www.gnu.org/licenses/>
 */
package com.sourcekraft.documentburster.engine.pdf.extractor;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDDocumentInformation;
import org.apache.pdfbox.pdmodel.PDPage;
//import org.perf4j.aop.Profiled;

import com.sourcekraft.documentburster.common.settings.Settings;
import com.sourcekraft.documentburster.utils.Utils;

import java.util.Iterator;
import java.util.List;

public class PdfExtractor {

	private Logger log = LoggerFactory.getLogger(PdfExtractor.class);

	private PDDocument originalPdfDocument;
	private PDDocument outputDocument = null;

	private String outputFileName;
	private String token;
	private Settings settings;

	public PdfExtractor(PDDocument pdfDocument, Settings settings, String outputFileName, String token) {

		log.debug("settings = " + settings + ", outputFileName = " + outputFileName + ", token = " + token);

		this.originalPdfDocument = pdfDocument;
		this.settings = settings;

		this.outputFileName = outputFileName;
		this.token = token;

	}

	//@Profiled
	public void doExtract(List<PDPage> pages) throws Exception {

		log.debug("token = " + token);

		createNewDocument();

		Iterator<PDPage> iter = pages.iterator();

		while (iter.hasNext()) {
			PDPage page = (PDPage) iter.next();
			extractPage(page);
		}

		outputDocument.save(outputFileName);

		outputDocument.getDocument().close();
		outputDocument.close();

	}

	private void createNewDocument() throws Exception {

		log.debug("token = " + token);

		PDDocumentInformation docInformation = originalPdfDocument.getDocumentInformation();

		String productName = Utils.getProductName(settings.getVersion());

		docInformation.setCreator(productName);
		docInformation.setProducer(productName);

		docInformation.setKeywords(token);

		outputDocument = new PDDocument();

		outputDocument.setDocumentInformation(docInformation);
		outputDocument.getDocumentCatalog()
				.setViewerPreferences(originalPdfDocument.getDocumentCatalog().getViewerPreferences());
	}

	private void extractPage(PDPage page) throws Exception {

		log.debug("token = " + token);

		PDPage imported = outputDocument.importPage(page);
		imported.setCropBox(page.getCropBox());
		imported.setMediaBox(page.getMediaBox());
		imported.setResources(page.getResources());
		imported.setRotation(page.getRotation());

	}
}
