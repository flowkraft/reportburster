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

import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.cert.X509Certificate;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

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

	private volatile String cachedCurlPath = null;

	// seconds timeout for curl; can be overridden with env
	// LICENSE_CURL_TIMEOUT_SECS
	private final int CURL_TIMEOUT_SECS = Integer
			.parseInt(System.getenv().getOrDefault("LICENSE_CURL_TIMEOUT_SECS", "90"));

	private final int CURL_ATTEMPTS = Integer.parseInt(System.getenv().getOrDefault("LICENSE_CURL_ATTEMPTS", "3"));

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

	protected Object makeRequest(Client client, String url, String action) throws Exception {

		final String reqId = UUID.randomUUID().toString().substring(0, 8);
		// Changed to INFO so you see request start in your current logs
		//log.info("[{}] action={} makeRequest START url={}", reqId, action == null ? "-" : action, url);

		// If we've previously decided to use JAX-RS, do it immediately
		if ("JAXRS".equals(cachedCurlPath)) {
			log.debug("[{}] using cached JAXRS fallback for url={}", reqId, url);
			return client.target(url).request(MediaType.TEXT_PLAIN_TYPE).post(null);
		}

		// If we have a cached working curl path, try it first (with attempts)
		if (cachedCurlPath != null && !"JAXRS".equals(cachedCurlPath)) {
			for (int a = 1; a <= CURL_ATTEMPTS; a++) {
				long tStart = System.nanoTime();
				String out = tryCurlAndReturnString(cachedCurlPath, url, reqId);
				double attemptSec = (System.nanoTime() - tStart) / 1_000_000_000.0;
				log.debug("[{}] cachedCandidateAttempt elapsed={}s candidate={}", reqId,
						String.format("%.3f", attemptSec), cachedCurlPath);
				if (out != null && isValidLicenseResponse(out)) {
					log.debug("[{}] cached candidate {} produced valid response", reqId, cachedCurlPath);
					return out;
				}
				log.debug("[{}] cached curl {} attempt {}/{} failed/invalid", reqId, cachedCurlPath, a, CURL_ATTEMPTS);
				try {
					Thread.sleep(150);
				} catch (InterruptedException ie) {
					Thread.currentThread().interrupt();
					break;
				}
			}
			// cached path didn't produce a validated response -> clear and continue to try
			// other candidates
			cachedCurlPath = null;
			log.debug("[{}] cleared cachedCurlPath after failed attempts", reqId);
		}

		// Build ordered candidate list: bundled (preferred) -> system "curl.exe" ->
		// located via where/which
		List<String> candidates = new ArrayList<>();

		String portableEnv = System.getenv("PORTABLE_EXECUTABLE_DIR");
		if (portableEnv != null && !portableEnv.isEmpty()) {
			candidates.add(Paths.get(portableEnv).resolve("tools").resolve("curl").resolve("win").resolve("curl.exe")
					.toAbsolutePath().toString());
		}
		candidates.add(Paths.get(System.getProperty("user.dir")).resolve("tools").resolve("curl").resolve("win")
				.resolve("curl.exe").toAbsolutePath().toString());
		candidates.add(Paths.get("").toAbsolutePath().resolve("tools").resolve("curl").resolve("win")
				.resolve("curl.exe").toAbsolutePath().toString());
		candidates.add("curl.exe");
		String located = findCurlWithWhere();
		if (located != null && !located.isEmpty())
			candidates.add(located);

		LinkedHashSet<String> uniq = new LinkedHashSet<>(candidates);

		for (String cand : uniq) {
			Path p = Paths.get(cand);
			boolean allowPathLookup = "curl.exe".equalsIgnoreCase(cand);
			if (!allowPathLookup && (!p.toFile().exists() || !p.toFile().isFile())) {
				log.debug("[{}] curl candidate not present on disk, skipping: {}", reqId, cand);
				continue;
			}

			for (int a = 1; a <= CURL_ATTEMPTS; a++) {
				long tStart = System.nanoTime();
				String out = tryCurlAndReturnString(cand, url, reqId);
				double attemptSec = (System.nanoTime() - tStart) / 1_000_000_000.0;
				log.debug("[{}] attempt {} for candidate {} elapsed={}s", reqId, a, cand,
						String.format("%.3f", attemptSec));

				if (out != null) {
					if (isValidLicenseResponse(out)) {
						cachedCurlPath = cand;
						log.debug("[{}] candidate {} produced valid response and is cached", reqId, cand);
						return out;
					} else {
						log.debug(
								"[{}] curl (candidate {}) returned invalid payload attempt {}/{}. will retry/candidate-skip",
								reqId, cand, a, CURL_ATTEMPTS);
					}
				} else {
					log.debug("[{}] curl (candidate {}) failed attempt {}/{}", reqId, cand, a, CURL_ATTEMPTS);
				}
				try {
					Thread.sleep(150);
				} catch (InterruptedException ie) {
					Thread.currentThread().interrupt();
					break;
				}
			}
			// emit a single warn for this candidate exhaustion
			log.warn(
					"[{}] url={} curl candidate {} exhausted after {} attempts and did not return a valid license payload",
					reqId, url, cand, CURL_ATTEMPTS);
		}

		// none of the curl candidates produced a validated response -> fallback to
		// JAX-RS and cache that decision
		cachedCurlPath = "JAXRS";
		log.debug("[{}] falling back to JAX-RS for url={}", reqId, url);
		return client.target(url).request(MediaType.TEXT_PLAIN_TYPE).post(null);
	}

	private boolean isValidLicenseResponse(String responseStr) {
		if (responseStr == null)
			return false;
		String trimmed = responseStr.trim();
		if (!trimmed.startsWith("{")) {
			String preview = trimmed.length() > 1000 ? trimmed.substring(0, 1000) + "..." : trimmed;
			log.info("Invalid license response (not JSON). preview: {}", preview);
			return false;
		}
		try {
			JsonNode n = (new ObjectMapper()).readTree(trimmed);
			// Accept either the normal license response OR the get_version response
			boolean hasLicenseShape = n.has("license") && n.has("item_name");
			boolean hasGetVersionShape = n.has("new_version") && n.has("sections");
			boolean ok = hasLicenseShape || hasGetVersionShape;
			if (!ok) {
				String preview = trimmed.length() > 1000 ? trimmed.substring(0, 1000) + "..." : trimmed;
				log.info("Invalid license response (missing expected keys). preview: {}", preview);
			}
			return ok;
		} catch (Exception e) {
			String preview = trimmed.length() > 1000 ? trimmed.substring(0, 1000) + "..." : trimmed;
			log.info("Invalid license response (parse error: {}). preview: {}", e.getMessage(), preview);
			return false;
		}
	}

	private String tryCurlAndReturnString(String curlPath, String url, String reqId) {
		List<String> cmd = new ArrayList<>();
		cmd.add(curlPath);
		cmd.add("-sS");
		boolean useInsecure = Boolean.parseBoolean(System.getenv().getOrDefault("LICENSE_CURL_INSECURE", "false"));
		if (useInsecure)
			cmd.add("-k");

		boolean useGet = url != null && url.toLowerCase().contains("edd_action=get_version");

		if (useGet) {
			cmd.add("-H");
			cmd.add("Accept: text/plain");
			cmd.add("-L");
			cmd.add(url);
			log.debug("[{}] using GET for get_version url: {}", reqId, url);
		} else {
			cmd.add("-X");
			cmd.add("POST");
			cmd.add("-H");
			cmd.add("Accept: text/plain");
			cmd.add("-d");
			cmd.add("");
			cmd.add(url);
		}

		String cmdLine = cmd.stream().collect(Collectors.joining(" "));
		log.debug("[{}] invoking curl: {}", reqId, cmdLine);

		ProcessBuilder pb = new ProcessBuilder(cmd);
		pb.redirectErrorStream(false); // keep streams separate but we will drain both
		Process p = null;

		ByteArrayOutputStream stdoutBaos = new ByteArrayOutputStream();
		ByteArrayOutputStream stderrBaos = new ByteArrayOutputStream();
		Thread stdoutReader = null;
		Thread stderrReader = null;

		try {
			p = pb.start();

			// start threads that continuously drain stdout/stderr into buffers
			final InputStream pis = p.getInputStream();
			final InputStream perr = p.getErrorStream();

			stdoutReader = new Thread(() -> {
				try (InputStream is = pis) {
					byte[] buf = new byte[4096];
					int r;
					while ((r = is.read(buf)) != -1) {
						stdoutBaos.write(buf, 0, r);
					}
				} catch (Throwable ignored) {
				}
			}, "curl-stdout-" + reqId);
			stderrReader = new Thread(() -> {
				try (InputStream is = perr) {
					byte[] buf = new byte[4096];
					int r;
					while ((r = is.read(buf)) != -1) {
						stderrBaos.write(buf, 0, r);
					}
				} catch (Throwable ignored) {
				}
			}, "curl-stderr-" + reqId);

			stdoutReader.setDaemon(true);
			stderrReader.setDaemon(true);
			stdoutReader.start();
			stderrReader.start();

			// wait for process with timeout
			boolean finished = p.waitFor(CURL_TIMEOUT_SECS, TimeUnit.SECONDS);
			if (!finished) {
				p.destroyForcibly();
				log.debug("[{}] curl timeout for: {}", reqId, curlPath);
				// give readers a moment to collect partial output
				try {
					stdoutReader.join(200);
					stderrReader.join(200);
				} catch (InterruptedException ie) {
					Thread.currentThread().interrupt();
				}
				return null;
			}

			// process exited — wait for readers to finish reading remaining bytes
			try {
				stdoutReader.join(1000);
				stderrReader.join(1000);
			} catch (InterruptedException ie) {
				Thread.currentThread().interrupt();
			}

			String out = stdoutBaos.toString(StandardCharsets.UTF_8.name());
			double readSec = 0.0; // not measuring read time here (kept minimal)
			String stderrPreview = stderrBaos.toString(StandardCharsets.UTF_8.name());

			int exit = p.exitValue();
			if (exit == 0) {
				log.debug("[{}] curl succeeded (path={}) exit=0 out-start={}  stderrPreview={}", reqId, curlPath,
						out == null ? "null" : (out.length() > 200 ? out.substring(0, 200) + "..." : out),
						stderrPreview.isEmpty() ? "none" : stderrPreview.replaceAll("\\r?\\n", " | "));
				return out;
			} else {
				log.debug("[{}] curl failed (path={}, exit={}) out-start={} stderrPreview={}", reqId, curlPath, exit,
						out == null ? "null" : (out.length() > 200 ? out.substring(0, 200) + "..." : out),
						stderrPreview.isEmpty() ? "none" : stderrPreview.replaceAll("\\r?\\n", " | "));
				return null;
			}
		} catch (Exception e) {
			log.debug("[{}] curl invocation failed for {}: {}", reqId, curlPath, e.getMessage());
			return null;
		} finally {
			if (p != null)
				p.destroyForcibly();
		}
	}

	private String findCurlWithWhere() {
		boolean isWindows = System.getProperty("os.name", "").toLowerCase().contains("win");
		try {
			ProcessBuilder pb;
			if (isWindows) {
				pb = new ProcessBuilder("where.exe", "curl.exe");
			} else {
				pb = new ProcessBuilder("which", "curl");
			}
			pb.redirectErrorStream(true);
			Process p = pb.start();
			ByteArrayOutputStream baos = new ByteArrayOutputStream();
			try (InputStream is = p.getInputStream()) {
				byte[] buf = new byte[4096];
				int r;
				while ((r = is.read(buf)) != -1)
					baos.write(buf, 0, r);
			}
			int exit = p.waitFor();
			if (exit == 0) {
				String out = baos.toString(StandardCharsets.UTF_8.name()).trim();
				if (!out.isEmpty())
					return out.split("\\r?\\n")[0].trim();
			}
		} catch (Exception ignored) {
		}
		return null;
	}

	private void _makeRequestAndHandleResponse(String url, String action) throws Exception {
		Client client = _newClient();
		try {
			long t0 = System.nanoTime();
			Object responseObj = makeRequest(client, url, action);
			double elapsedSec = (System.nanoTime() - t0) / 1_000_000_000.0;
			String elapsed = String.format("%.3f", elapsedSec);

			String responseStr;

			if (responseObj instanceof String) {
				responseStr = (String) responseObj;
				//log.info("action={} makeRequest returned String (curl). time={}s preview: {}", action, elapsed,
				//		responseStr == null ? "null"
				//				: responseStr.length() > 300 ? responseStr.substring(0, 300) + "..." : responseStr);
			} else if (responseObj instanceof Response) {
				Response resp = (Response) responseObj;
				responseStr = resp.readEntity(String.class);
				//log.info("action={} makeRequest returned Response (JAX-RS). time={}s preview: {}", action, elapsed,
				//		responseStr == null ? "null"
				//				: responseStr.length() > 300 ? responseStr.substring(0, 300) + "..." : responseStr);
			} else {
				throw new IOException("makeRequest returned unexpected type: "
						+ (responseObj == null ? "null" : responseObj.getClass()));
			}

			// parse JSON (let any exception bubble to the catch below and be masked exactly
			// like before)
			JsonNode licenseJSONResult = (new ObjectMapper()).readTree(responseStr);

			license.setStatus(licenseJSONResult.get("license").asText());
			license.setProduct(licenseJSONResult.get("item_name").asText());
			license.setCustomerName(licenseJSONResult.get("customer_name").asText());
			license.setCustomerEmail(licenseJSONResult.get("customer_email").asText());
			license.setExpires(licenseJSONResult.get("expires").asText());

		} catch (Exception e) {
			/*
			 * Preserve old behavior: any problem contacting/parsing the license server
			 * should NOT stop normal application flow. Log warn and set fallback values
			 * exactly as previously done.
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

	private void _doAction(String action) throws Exception {

		license.loadLicense();

		if (StringUtils.isEmpty(license.getKey())) {
			throw new IllegalStateException("License key is not defined. Cannot perform action '" + action
					+ "'. Please enter a valid license key before performing this action.");
		}

		String url = BASE_LICENSE_SERVER_URL + "?edd_action=" + action + "&item_name="
				+ Utils.encodeURIComponent(Utils.getProduct()) + "&license="
				+ Utils.encodeURIComponent(license.getKey());

		_makeRequestAndHandleResponse(url, action);

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

			// makeRequest now returns Object: String (curl) or Response (JAX-RS)
			Object responseObj = makeRequest(client, url, "get_version");
			String responseStr;

			if (responseObj instanceof String) {
				responseStr = (String) responseObj;
			} else if (responseObj instanceof Response) {
				responseStr = ((Response) responseObj).readEntity(String.class);
			} else {
				throw new IOException("makeRequest returned unexpected type: "
						+ (responseObj == null ? "null" : responseObj.getClass()));
			}

			JsonNode licenseJSONResult = (new ObjectMapper()).readTree(responseStr);

			changeLog = Pherialize.unserialize(licenseJSONResult.get("sections").asText()).toArray()
					.getString("changelog");

			latestVersion = licenseJSONResult.get("new_version").asText();

		} catch (Exception e) {

			changeLog = StringUtils.EMPTY;
			latestVersion = StringUtils.EMPTY;

		} finally {

			client.close();

			if (StringUtils.isNotEmpty(changeLog)) {

				changeLog = changeLog.replace("<p>", "\n").replace("</p>", "\n").replace("<br />", "").replace("<br/>",
						"");

			}

			license.setLatestVersion(latestVersion);
			license.setChangeLog(changeLog);

			license.saveLicense();

		}

	}

}