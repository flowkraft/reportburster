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

import com.sourcekraft.documentburster.common.utils.DumpToString;

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
}
