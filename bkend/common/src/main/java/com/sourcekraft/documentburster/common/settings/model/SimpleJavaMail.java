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

public class SimpleJavaMail extends DumpToString {

	/**
	 * 
	 */
	private static final long serialVersionUID = 6448148827920935702L;

	public boolean active = false;

	public String replytoaddress;
	public String replytoname;

	public String bouncetoaddress;
	public String bouncetoname;

	public String receipttoaddress;
	public String receipttoname;

	public String dispositionnotificationtoaddress;
	public String dispositionnotificationtoname;

	public String customemailheaders;
	public String customsessionproperties;

	public boolean javaxmaildebug = false;
	public boolean transportmodeloggingonly = false;

	public Proxy proxy;

	// start not yet used

	public boolean async = false;

	public int poolsize = -1;
	public int poolsizekeepalivetime = -1;

	public ConnectionPool connectionpool;

	public int sessiontimeoutmillis = -1;

	public boolean trustallhosts;
	public String trustedhosts;
	public boolean verifyserveridentity;

	public boolean opportunistictls;

	public DKIM dkim;

	public SMIME smime;

	// end not yet used

}
