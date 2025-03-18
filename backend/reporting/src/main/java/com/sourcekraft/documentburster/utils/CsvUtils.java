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
package com.sourcekraft.documentburster.utils;

import com.opencsv.ICSVParser;
import com.opencsv.enums.CSVReaderNullFieldIndicator;

public class CsvUtils {

	public static final char DEFAULT_SEPARATOR = ICSVParser.DEFAULT_SEPARATOR;
	public static final char DEFAULT_QUOTE_CHARACTER = ICSVParser.DEFAULT_QUOTE_CHARACTER;

	public static final char DEFAULT_ESCAPE_CHARACTER = ICSVParser.DEFAULT_ESCAPE_CHARACTER;
	
	public static final boolean DEFAULT_STRICT_QUOTES = ICSVParser.DEFAULT_STRICT_QUOTES;
	public static final boolean DEFAULT_IGNORE_QUOTATIONS = ICSVParser.DEFAULT_IGNORE_QUOTATIONS;
	public static final boolean DEFAULT_IGNORE_LEADING_WHITESPACE = ICSVParser.DEFAULT_IGNORE_LEADING_WHITESPACE;
	
	public static final CSVReaderNullFieldIndicator DEFAULT_NULL_FIELD_INDICATOR = CSVReaderNullFieldIndicator.NEITHER;

	public static final String AUTODETECT = "autodetect";

	public static final String COLUMN_LAST = "columnlast";
	public static final String COLUMN_FIRST = "columnfirst";
	public static final String NOT_USED = "notused";
	
	public static final String OUTPUT_TYPE_NONE = "output.none";
	public static final String OUTPUT_TYPE_DOCX = "output.docx";
	public static final String OUTPUT_TYPE_HTML = "output.html";
	public static final String OUTPUT_TYPE_PDF = "output.pdf";
	public static final String OUTPUT_TYPE_EXCEL = "output.xlsx";
	
}