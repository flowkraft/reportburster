package com.sourcekraft.documentburster._helpers;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.junit.Assert.assertEquals;

import java.io.File;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDDocumentInformation;
import org.apache.pdfbox.text.PDFTextStripper;
import org.hamcrest.CoreMatchers;

public class DocumentTester {

	private String _path;
	private PDDocument _document;

	public enum TextSearchType {
		CONTAINS;
	};

	public DocumentTester(String path) {

		this._path = path;

	}

	private void _ifNeededLoadDocument() throws Exception {

		if (this._document == null)
			this._document = PDDocument.load(new File(this._path));

	}

	public void assertKeywordsEquals(String expected) throws Exception {

		_ifNeededLoadDocument();

		PDDocumentInformation info = _document.getDocumentInformation();

		assertEquals(info.getKeywords(), expected);

	}

	public void assertPageCountEquals(int expected) throws Exception {

		_ifNeededLoadDocument();

		assertEquals(_document.getNumberOfPages(), expected);

	}

	public void assertContentContainsTextOnPage(String text, int page, TextSearchType type) throws Exception {

		_ifNeededLoadDocument();

		PDFTextStripper stripper = new PDFTextStripper();

		// This example uses sorting, but in some cases it is more useful to switch it
		// off,
		// e.g. in some files with columns where the PDF content stream respects the
		// column order.
		stripper.setSortByPosition(true);

		stripper.setStartPage(page);
		stripper.setEndPage(page);

		String extractedText = stripper.getText(_document);

		if (type.compareTo(TextSearchType.CONTAINS) == 0) {
			assertThat(extractedText, CoreMatchers.containsString(text));
		} else
			throw new Exception("It Should Not Come Here");

	}

	public void assertContentDoesNotContainTextOnPage(String text, int page, TextSearchType type) throws Exception {

		_ifNeededLoadDocument();

		PDFTextStripper stripper = new PDFTextStripper();

		// This example uses sorting, but in some cases it is more useful to switch it
		// off,
		// e.g. in some files with columns where the PDF content stream respects the
		// column order.
		stripper.setSortByPosition(true);

		stripper.setStartPage(page);
		stripper.setEndPage(page);

		String extractedText = stripper.getText(_document);

		if (type.compareTo(TextSearchType.CONTAINS) == 0) {
			assertThat(extractedText, CoreMatchers.not(CoreMatchers.containsString(text)));
		} else
			throw new Exception("It Should Not Come Here");
	}

	public void close() throws Exception {

		if (this._document != null)
			this._document.close();

	}

}
