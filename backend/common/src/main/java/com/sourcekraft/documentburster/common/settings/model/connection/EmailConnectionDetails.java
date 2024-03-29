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
package com.sourcekraft.documentburster.common.settings.model.connection;

import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;

import org.apache.commons.lang3.StringUtils;

import com.sourcekraft.documentburster.common.utils.DumpToString;

@XmlRootElement(name = "documentburster")
public class EmailConnectionDetails extends DumpToString {

	private static final long serialVersionUID = -7381519393251971179L;

	public EmailDocumentBursterConnection connection = new EmailDocumentBursterConnection();

	public static class EmailDocumentBursterConnection extends DumpToString {

		private static final long serialVersionUID = -7846509982169848227L;

		public String code = StringUtils.EMPTY;
		public String name = StringUtils.EMPTY;

		@XmlElement(name = "default")
		public boolean defaultConnection = false;

		public EmailServer emailserver = new EmailServer();

		public static class EmailServer extends DumpToString {

			private static final long serialVersionUID = 8946763965142587248L;

			public String host = StringUtils.EMPTY;
			public String port = StringUtils.EMPTY;
			public String userid = StringUtils.EMPTY;
			public String userpassword = StringUtils.EMPTY;
			public boolean usessl = false;
			public boolean usetls = false;
			public String fromaddress = StringUtils.EMPTY;
			public String name = StringUtils.EMPTY;
		}
	}

}
