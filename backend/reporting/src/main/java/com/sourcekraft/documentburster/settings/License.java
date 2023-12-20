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

import javax.xml.bind.JAXBContext;
import javax.xml.bind.Marshaller;
import javax.xml.bind.Unmarshaller;

import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.sourcekraft.documentburster.settings.model.license.LicenseDetails;

public class License {

	private Logger log = LoggerFactory.getLogger(License.class);

	private String licenseFilePath = "config/_internal/license.xml";

	private LicenseDetails licenseDetails = new LicenseDetails();
	private boolean mockPaid = false;

	public static String STATUS_DEMO = "DEMO";
	public static String STATUS_VALID = "VALID";
	public static String STATUS_EXPIRED = "EXPIRED";

	public String getLicenseFilePath() {
		return this.licenseFilePath;
	}

	public void setLicenseFilePath(String licenseFilePath) {
		this.licenseFilePath = licenseFilePath;
	}

	public void loadLicense() throws Exception {

		JAXBContext jc = JAXBContext.newInstance(LicenseDetails.class);

		Unmarshaller u = jc.createUnmarshaller();

		licenseDetails = (LicenseDetails) u.unmarshal(new File(this.licenseFilePath));

		log.debug("loadLicense - license = [" + licenseDetails + "]");

	}

	public void saveLicense() throws Exception {

		log.debug("saveLicense - licenseFilePath='" + licenseFilePath + "', license = [" + licenseDetails + "]");

		JAXBContext jc = JAXBContext.newInstance(LicenseDetails.class);
		Marshaller m = jc.createMarshaller();
		m.setProperty(Marshaller.JAXB_FORMATTED_OUTPUT, Boolean.TRUE);
		m.marshal(licenseDetails, new File(licenseFilePath));

	}

	public String getKey() {
		return licenseDetails.key;
	};

	public String getProduct() {
		return licenseDetails.product;
	};

	public String getStatus() {
		return licenseDetails.status;
	};

	public String getCustomerName() {
		return licenseDetails.customername;
	};

	public String getCustomerEmail() {
		return licenseDetails.customeremail;
	};

	public String getExpires() {
		return licenseDetails.expires;
	};

	public String getWhatsNew() {
		return licenseDetails.changelog;
	};

	public void setKey(String key) {
		licenseDetails.key = key;
	};

	public void setProduct(String product) {
		licenseDetails.product = product;
	};

	public void setStatus(String status) {
		licenseDetails.status = status;
	};

	public void setCustomerName(String customerName) {
		licenseDetails.customername = customerName;
	};

	public void setCustomerEmail(String customerEmail) {
		licenseDetails.customeremail = customerEmail;
	};

	public void setExpires(String expires) {
		licenseDetails.expires = expires;
	};

	public void setChangeLog(String changeLog) {
		licenseDetails.changelog = changeLog;
	};

	public void setLatestVersion(String latestVersion) {
		licenseDetails.latestversion = latestVersion;
	};

	public boolean isValid() {
		return getStatus().equalsIgnoreCase("valid");
	}

	public boolean isExpired() {
		return getStatus().equalsIgnoreCase("expired");
	}

	public boolean itWasPaid() {
		return (isValid() || isExpired() || mockPaid);
	}

	public boolean isInvalid() {
		return getStatus().equalsIgnoreCase("invalid");
	}

	public boolean isDemo() {
		return StringUtils.isEmpty(getStatus());
	}

	public void setMockPaid(boolean mockPaid) {
		this.mockPaid = mockPaid;
	}

}
