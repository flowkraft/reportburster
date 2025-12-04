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
import java.util.Map;

import com.sourcekraft.documentburster.common.reportparameters.ReportParameter;
import com.sourcekraft.documentburster.utils.DumpToString;

public class ConfigurationFileInfo extends DumpToString {

	public String fileName;
	public String filePath;
	public String relativeFilePath;
	public String templateName;
	public boolean isFallback;
	public boolean capReportDistribution;
	public boolean capReportGenerationMailMerge;
	public String dsInputType;
	public String visibility;
	public String notes;
	public String folderName;
	public String type;
	public boolean activeClicked;
	public boolean useEmlConn;
	public String emlConnCode;

	public String scriptOptionsSelectFileExplorer;

	public List<ReportParameter> reportParameters = new ArrayList<>();
	
	// Parsed Tabulator DSL options (layoutOptions, columns, data)
	public Map<String, Object> tabulatorOptions;
	
	// Parsed Chart DSL options (type, labelField, options, labels, datasets, data)
	public Map<String, Object> chartOptions;
	
	// Parsed Pivot Table DSL options (rows, cols, vals, aggregatorName, rendererName, etc.)
	public Map<String, Object> pivotTableOptions;

}
