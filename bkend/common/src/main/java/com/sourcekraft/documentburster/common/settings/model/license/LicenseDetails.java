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
package com.sourcekraft.documentburster.common.settings.model.license;

import jakarta.xml.bind.annotation.XmlRootElement;

import org.apache.commons.lang3.StringUtils;

import com.sourcekraft.documentburster.utils.DumpToString;

@XmlRootElement(name = "license")
public class LicenseDetails extends DumpToString {

    /**
	 * 
	 */
	private static final long serialVersionUID = -142182984693841240L;
	
	public String key = StringUtils.EMPTY;
    public String product = StringUtils.EMPTY;
    public String status = StringUtils.EMPTY;
    public String expires = StringUtils.EMPTY;

    public String customername = StringUtils.EMPTY;
    public String customeremail = StringUtils.EMPTY;
 
    public String latestversion = StringUtils.EMPTY;
    public String changelog = StringUtils.EMPTY;
    
}
