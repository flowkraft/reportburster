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
package com.sourcekraft.documentburster.unit.further.other;

import static org.junit.Assert.assertEquals;

import java.io.File;

import org.apache.commons.io.FileUtils;
import org.apache.commons.lang3.RandomStringUtils;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;

import com.sourcekraft.documentburster._helpers.TestsUtils;
import com.sourcekraft.documentburster.utils.LicenseUtils;

public class LicenseTest {

	private static final String licenseXmlPath = "../../assembly/src/main/external-resources/db-template/config/_internal/license.xml";
	private static final String TEST_LICENSE_KEY = System.getenv("TEST_LICENSE_KEY");
	
	private LicenseUtils _getTestLicenseUtils() throws Exception {
		String randomTestLicenseXmlPath = TestsUtils.TESTS_OUTPUT_FOLDER + "/"
				+ RandomStringUtils.random(10, true, false) + ".xml";
		File randomTestLicenseXmlFile = new File(randomTestLicenseXmlPath);

		FileUtils.copyFile(new File(licenseXmlPath), randomTestLicenseXmlFile);

		LicenseUtils licenseUtils = new LicenseUtils();
		licenseUtils.setLicenseFilePath(randomTestLicenseXmlPath);
		licenseUtils.getLicense().loadLicense();
		licenseUtils.getLicense().setKey(TEST_LICENSE_KEY);
		licenseUtils.getLicense().setStatus("valid");
		licenseUtils.getLicense().saveLicense();

		return licenseUtils;
	}

	@Before
	public void init() throws Exception {

		_getTestLicenseUtils().deActivateLicense();

	}

	@After
	public void teardown() throws Exception {

		_getTestLicenseUtils().deActivateLicense();

	}

	@Test
	public final void shouldActivateCheckAndDeactivateLicense() throws Exception {

		LicenseUtils licenseUtils = _getTestLicenseUtils();

		licenseUtils.deActivateLicense();
		licenseUtils.getLicense().loadLicense();
		//assertEquals(licenseUtils.getLicense().getStatus(), "deactivated");

		licenseUtils.checkLicense();
		licenseUtils.getLicense().loadLicense();
		assertEquals(licenseUtils.getLicense().getStatus(), "valid");

		licenseUtils.deActivateLicense();
		licenseUtils.getLicense().loadLicense();
		//assertEquals(licenseUtils.getLicense().getStatus(), "deactivated");

		licenseUtils.activateLicense();
		licenseUtils.getLicense().loadLicense();
		assertEquals(licenseUtils.getLicense().getStatus(), "valid");

		licenseUtils.checkLicense();
		licenseUtils.getLicense().loadLicense();
		assertEquals(licenseUtils.getLicense().getStatus(), "valid");

		licenseUtils.deActivateLicense();
		licenseUtils.getLicense().loadLicense();
		//assertEquals(licenseUtils.getLicense().getStatus(), "deactivated");

	};

}
