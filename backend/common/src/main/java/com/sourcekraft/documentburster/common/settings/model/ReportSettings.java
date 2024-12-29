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
package com.sourcekraft.documentburster.common.settings.model;

import java.util.ArrayList;
import java.util.List;

import com.sourcekraft.documentburster.common.utils.DumpToString;

public class ReportSettings extends DumpToString {

	/**
	 * 
	 */
	private static final long serialVersionUID = -6958891508875181693L;

	public DataSource datasource;
	public Template template;

	public static class DataSource extends DumpToString {

		/**
		 * 
		 */
		private static final long serialVersionUID = -989054855315988479L;
		public String type;
		public String parser;
		public boolean showmorecsvoptions;
		public boolean showmorefixedwidthoptions;

		public CSVOptions csvoptions;
		public FixedWidthOptions fixedwidthoptions;

		public static class CSVOptions extends DumpToString {

			/**
			 * 
			 */
			private static final long serialVersionUID = 2691588813086554914L;

			public String separatorchar;
			public String quotationchar;
			public String escapechar;

			public boolean strictquotations;
			public boolean ignorequotations;
			public boolean ignoreleadingwhitespace;

			public String header;
			public int skiplines;

			public String idcolumn;
			
			public LinesRegExValidator linesregexvalidator;

			static class LinesRegExValidator extends DumpToString {
				/**
				 * 
				 */
				private static final long serialVersionUID = 4303178532924813244L;

				static class LineMatcher extends DumpToString {
					/**
					 * 
					 */
					private static final long serialVersionUID = -3495825773742591476L;

					public int index;
					public String expressionpattern;
				}

				public List<LineMatcher> linematcher = new ArrayList<LineMatcher>();;
			}

		}

		public static class FixedWidthOptions extends DumpToString {

			private static final long serialVersionUID = 2691588813086554914L;

			public String columns;
			public String header;
			public int skiplines;
			public boolean ignoreleadingwhitespace;

			public String idcolumn;
			public String idcolumnindex;

		}
	}

	public static class Template extends DumpToString {

		/**
		 * 
		 */
		private static final long serialVersionUID = 8368806508871014150L;

		public String outputtype;
		public String documentpath;

		public String retrieveTemplateFilePath() {
			if (documentpath.startsWith("/") || documentpath.startsWith("\\"))
				return documentpath.substring(1);
			else
				// paths like
				// "src/main/external-resources/template/samples/reports/payslips/payslips-template.docx"
				return documentpath;
		}

	}

}
