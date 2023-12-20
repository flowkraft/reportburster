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
package com.sourcekraft.documentburster.settings;

import java.io.File;
import java.io.FilenameFilter;

import javax.xml.bind.JAXBContext;
import javax.xml.bind.Unmarshaller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.sourcekraft.documentburster.settings.model.connection.EmailConnectionDetails;
import com.sourcekraft.documentburster.utils.Utils;

public class EmailConnection {

	private Logger log = LoggerFactory.getLogger(EmailConnection.class);

	private EmailConnectionDetails emailConnectionDetails = new EmailConnectionDetails();

	public void loadDetails(String connectionFilePath) throws Exception {

		JAXBContext jc = JAXBContext.newInstance(EmailConnectionDetails.class);

		Unmarshaller u = jc.createUnmarshaller();

		emailConnectionDetails = (EmailConnectionDetails) u.unmarshal(new File(connectionFilePath));

		log.debug("loadDetails - emailConnectionDetails = [" + emailConnectionDetails + "]");

	}

	public void loadDetailsUsingCode(String connectionCode, String configurationFilePath) throws Exception {

		FilenameFilter emailConnectionsFilesFilter = new FilenameFilter() {
			public boolean accept(File directory, String fileName) {
				return fileName.startsWith("eml-") && fileName.endsWith(".xml");
			};
		};

		File[] emailConnectionFiles = new File(Utils.getConfigurationFolderPath(configurationFilePath) + "/connections")
				.listFiles(emailConnectionsFilesFilter);

		boolean found = false;

		for (int i = 0; i < emailConnectionFiles.length && !found; i++) {

			File emailConnectionFile = emailConnectionFiles[i];

			String emailConnectionFilePath = emailConnectionFile.getAbsolutePath();
			this.loadDetails(emailConnectionFilePath);

			found = emailConnectionDetails.connection.code.equals(connectionCode);

		}
	}

	public void loadDetailsDefault(String configFolderPath) throws Exception {

		FilenameFilter emailConnectionsFilesFilter = new FilenameFilter() {
			public boolean accept(File directory, String fileName) {
				return fileName.startsWith("eml-") && fileName.endsWith(".xml");
			};
		};

		File[] emailConnectionFiles = new File(Utils.getConfigurationFolderPath(configFolderPath) + "/connections")
				.listFiles(emailConnectionsFilesFilter);

		boolean found = false;

		for (int i = 0; i < emailConnectionFiles.length && !found; i++) {

			File emailConnectionFile = emailConnectionFiles[i];

			String emailConnectionFilePath = emailConnectionFile.getAbsolutePath();
			this.loadDetails(emailConnectionFilePath);

			found = emailConnectionDetails.connection.defaultConnection;

		}
	}

	public EmailConnectionDetails getDetails() {
		return emailConnectionDetails;
	};

}
