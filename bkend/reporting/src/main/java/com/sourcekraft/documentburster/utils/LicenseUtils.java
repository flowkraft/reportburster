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
package com.sourcekraft.documentburster.utils;

import java.io.IOException;
import java.security.cert.X509Certificate;

import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;
import javax.ws.rs.client.Client;
import javax.ws.rs.client.ClientBuilder;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sourcekraft.documentburster.common.settings.License;

import de.ailis.pherialize.Pherialize;

public class LicenseUtils {

	private Logger log = LoggerFactory.getLogger(License.class);

	private License license = new License();

	private static String BASE_LICENSE_SERVER_URL = Utils.PDFBURST_WEBSITE + "/store/";

	public License getLicense() {
		return this.license;
	}

	public String getLicenseFilePath() {
		return this.license.getLicenseFilePath();
	}

	public void setLicenseFilePath(String licenseFilePath) {
		this.license.setLicenseFilePath(licenseFilePath);
	}

	public void activateLicense() throws Exception {

		_doAction("activate_license");
		_getLatestVersionAndChangeLog();

	}

	public void deActivateLicense() throws Exception {

		_doAction("deactivate_license");

	}

	public void checkLicense() throws Exception {

		_doAction("check_license");
		_getLatestVersionAndChangeLog();

	}

	protected Response makeRequest(Client client, String url) throws IOException {

		return client.target(url).request(MediaType.TEXT_PLAIN_TYPE).post(null);

	}

	private void _doAction(String action) throws Exception {

		license.loadLicense();

		String url = BASE_LICENSE_SERVER_URL + "?edd_action=" + action + "&item_name="
				+ Utils.encodeURIComponent(Utils.getProduct()) + "&license="
				+ Utils.encodeURIComponent(license.getKey());

		_makeRequestAndHandleResponse(url);

	}

	private void _makeRequestAndHandleResponse(String url) throws Exception {

		// Client client = ClientBuilder.newClient();
		Client client = _newClient();

		try {

			Response response = makeRequest(client, url);

			JsonNode licenseJSONResult = (new ObjectMapper()).readTree(response.readEntity(String.class));

			license.setStatus(licenseJSONResult.get("license").asText());

			license.setProduct(licenseJSONResult.get("item_name").asText());

			license.setCustomerName(licenseJSONResult.get("customer_name").asText());
			license.setCustomerEmail(licenseJSONResult.get("customer_email").asText());

			license.setExpires(licenseJSONResult.get("expires").asText());

		} catch (Exception e) {

			/*
			 * https://github.com/sourcekraft/documentburster/issues/61 SSL Error when
			 * checking the license
			 * 
			 * javax.net.ssl.SSLHandshakeException is actually targeted here but could not
			 * compile when catching either javax.net.ssl.SSLHandshakeException or the
			 * parent javax.net.ssl.SSLException and finally decided that the safest is to
			 * catch java.lang.Exception
			 */

			log.warn(e.getMessage(), e);

			license.setCustomerName("License Exception (most probably SSL Exception)");
			license.setCustomerEmail("license@exception");

			license.setStatus(License.STATUS_VALID.toLowerCase());

		} finally {

			client.close();
			license.saveLicense();

		}

	}

	/*
	 * This disables the SSL validation on https://www.pdfburst.com SSL was working
	 * fine and suddenly, after a Java update (or Godaddy SSL update) it started to
	 * fail with various SSL validation exceptions. I had to disable the SSL
	 * validation otherwise nothing will work.
	 * 
	 * This method should be removed once the https://www.pdfburst.com SSL
	 * certificate will be fixed
	 * 
	 */
	private Client _newClient() throws Exception {
		TrustManager[] trustManager = new X509TrustManager[] { new X509TrustManager() {

			@Override
			public X509Certificate[] getAcceptedIssuers() {
				return null;
			}

			@Override
			public void checkClientTrusted(X509Certificate[] certs, String authType) {

			}

			@Override
			public void checkServerTrusted(X509Certificate[] certs, String authType) {

			}
		} };

		SSLContext sslContext = SSLContext.getInstance("SSL");
		sslContext.init(null, trustManager, null);

		return ClientBuilder.newBuilder().sslContext(sslContext).hostnameVerifier((s1, s2) -> true).build();
	}

	private void _getLatestVersionAndChangeLog() throws Exception {

		license.loadLicense();

		String url = BASE_LICENSE_SERVER_URL + "?edd_action=get_version&item_name="
				+ Utils.encodeURIComponent(Utils.getProduct()) + "&license="
				+ Utils.encodeURIComponent(license.getKey());

		String changeLog = StringUtils.EMPTY;
		String latestVersion = StringUtils.EMPTY;

		// Client client = ClientBuilder.newClient();
		Client client = _newClient();

		try {

			Response response = makeRequest(client, url);

			JsonNode licenseJSONResult = (new ObjectMapper()).readTree(response.readEntity(String.class));

			changeLog = Pherialize.unserialize(licenseJSONResult.get("sections").asText()).toArray()
					.getString("changelog");

			latestVersion = licenseJSONResult.get("new_version").asText();

		} catch (Exception e) {

			changeLog = StringUtils.EMPTY;
			latestVersion = StringUtils.EMPTY;

		} finally {

			client.close();

			if (StringUtils.isNotEmpty(changeLog)) {

				changeLog = StringUtils.replace(changeLog, "<p>", "\n");
				changeLog = StringUtils.replace(changeLog, "</p>", "\n");
				changeLog = StringUtils.replace(changeLog, "<br />", StringUtils.EMPTY);
				changeLog = StringUtils.replace(changeLog, "<br/>", StringUtils.EMPTY);

			}

			license.setLatestVersion(latestVersion);
			license.setChangeLog(changeLog);

			license.saveLicense();

		}

	}

}