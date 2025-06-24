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

import com.sourcekraft.documentburster.utils.DumpToString;

public class WebUploadSettings extends DumpToString {

    /**
	 * 
	 */
	private static final long serialVersionUID = 9083980881277667869L;
	
	public String documentbursterwebcommand;
    public String mssharepointcommand;
    public String wordpresscommand;
    public String drupalcommand;
    public String joomlacommand;
    public String otherwebcommand;

}
