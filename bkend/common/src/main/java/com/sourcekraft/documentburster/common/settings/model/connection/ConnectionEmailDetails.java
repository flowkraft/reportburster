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

import jakarta.xml.bind.annotation.XmlElement;
import jakarta.xml.bind.annotation.XmlRootElement;

import org.apache.commons.lang3.StringUtils;

import com.sourcekraft.documentburster.common.settings.model.ServerEmailSettings;
import com.sourcekraft.documentburster.utils.DumpToString;

@XmlRootElement(name = "documentburster")
public class ConnectionEmailDetails extends DumpToString {

	private static final long serialVersionUID = -7381519393251971179L;

	public DocumentBursterConnectionEmail connection = new DocumentBursterConnectionEmail();

	public static class DocumentBursterConnectionEmail extends DumpToString {

		private static final long serialVersionUID = -7846509982169848227L;

		public String code = StringUtils.EMPTY;
		public String name = StringUtils.EMPTY;

		@XmlElement(name = "default")
		public boolean defaultConnection = false;

		public ServerEmailSettings emailserver = new ServerEmailSettings();

		
	}

}
