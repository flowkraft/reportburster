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
package com.sourcekraft.documentburster.common.settings;

import java.io.File;

import jakarta.xml.bind.JAXBContext;
import jakarta.xml.bind.Unmarshaller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.sourcekraft.documentburster.common.settings.model.nfr.NewFeatureRequestDetails;

public class NewFeatureRequest {

	private Logger log = LoggerFactory.getLogger(NewFeatureRequest.class);

	private NewFeatureRequestDetails newFeatureRequestDetails;

	public void loadDetails(String newFeatureRequestFilePath) throws Exception {

		JAXBContext jc = JAXBContext.newInstance(NewFeatureRequestDetails.class);

		Unmarshaller u = jc.createUnmarshaller();

		newFeatureRequestDetails = (NewFeatureRequestDetails) u.unmarshal(new File(newFeatureRequestFilePath));

		log.debug("loadDetails - newFeatureRequestDetails = [" + newFeatureRequestDetails + "]");

	}
	
	public NewFeatureRequestDetails getDetails() {
		return newFeatureRequestDetails;
	};

}
