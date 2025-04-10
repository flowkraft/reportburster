package com.flowkraft.licenseman;

import java.io.File;
import java.security.cert.X509Certificate;

import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;
import javax.ws.rs.client.Client;
import javax.ws.rs.client.ClientBuilder;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.xml.bind.JAXBContext;
import javax.xml.bind.Marshaller;
import javax.xml.bind.Unmarshaller;

import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.flowkraft.cfgman.DocumentBursterSettingsService;
import com.flowkraft.common.Constants;
import com.flowkraft.common.Utils;
import com.flowkraft.common.AppPaths;
import com.flowkraft.jobman.services.ShellService;
import com.flowkraft.licenseman.model.LicenseDetails;
import de.ailis.pherialize.Pherialize;

@Service
public class LicenseService {

	@Autowired
	DocumentBursterSettingsService settingsService;

	@Autowired
	private ShellService shellService;

	private String licenseFilePath = AppPaths.WORKSPACE_DIR_PATH + "config/burst/internal/license.xml";

	public void activateLicense() throws Exception {

		shellService.runDocumentBursterBatScriptFile("system license activate");

	}

	public void deActivateLicense() throws Exception {

		shellService.runDocumentBursterBatScriptFile("system license deactivate");

	}

	public void checkLicense() throws Exception {

		shellService.runDocumentBursterBatScriptFile("system license check");

	}

	public LicenseDetails loadLicenseFile() throws Exception {

		JAXBContext jc = JAXBContext.newInstance(LicenseDetails.class);

		Unmarshaller u = jc.createUnmarshaller();

		return (LicenseDetails) u.unmarshal(new File(this.licenseFilePath));

	}

	public void saveLicenseFile(LicenseDetails licenseInfo) throws Exception {

		JAXBContext jc = JAXBContext.newInstance(LicenseDetails.class);
		Marshaller m = jc.createMarshaller();
		m.setProperty(Marshaller.JAXB_FORMATTED_OUTPUT, Boolean.TRUE);
		m.marshal(licenseInfo, new File(licenseFilePath));

	}

	public AboutInfo getLatestVersionAndChangeLogInformation() throws Exception {

		AboutInfo productInfo = new AboutInfo();

		productInfo.product = Utils.getProductName();

		//DocumentBursterSettings defaultSettings = this.settingsService.loadSettings("settings.xml");
		//productInfo.version = defaultSettings.settings.version;

		String url = Constants.LICENSING_SERVER_URL + "/?edd_action=get_version&item_name=" + Utils.getProductName();

		Client client = _newClient();

		try {

			Response response = client.target(url).request(MediaType.TEXT_PLAIN_TYPE).get();

			JsonNode jsonNodeResult = (new ObjectMapper()).readTree(response.readEntity(String.class));

			productInfo.latestversion = jsonNodeResult.get("new_version").asText();

			productInfo.changelog = Pherialize.unserialize(jsonNodeResult.get("sections").asText()).toArray()
					.getString("changelog");
		} catch (Exception e) {

			productInfo.changelog = StringUtils.EMPTY;
			productInfo.latestversion = StringUtils.EMPTY;

		} finally {
			client.close();

			if (StringUtils.isNotEmpty(productInfo.changelog)) {

				productInfo.changelog = StringUtils.replace(productInfo.changelog, "<p>", "\n");
				productInfo.changelog = StringUtils.replace(productInfo.changelog, "</p>", "\n");
				productInfo.changelog = StringUtils.replace(productInfo.changelog, "<br />", StringUtils.EMPTY);
				productInfo.changelog = StringUtils.replace(productInfo.changelog, "<br/>", StringUtils.EMPTY);

			}
		}

		return productInfo;

	}

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

}
