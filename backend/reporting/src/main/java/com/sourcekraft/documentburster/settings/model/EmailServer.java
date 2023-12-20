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
package com.sourcekraft.documentburster.settings.model;

import com.sourcekraft.documentburster.utils.DumpToString;

public class EmailServer extends DumpToString {

	/**
	 * 
	 */
	private static final long serialVersionUID = 2931753044751293518L;

	public boolean useconn;
	public String conncode;
	
	public String host;
	public int port = -1;

	public String userid;
	public String userpassword;

	public boolean usessl;
	public boolean usetls;

	public String keyfile;
	public String rootcertfile;
	public String servercertfile;

	public String fromaddress;
	public String name;

	public String weburl;

}
