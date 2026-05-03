package com.sourcekraft.documentburster.common.oauth;

import java.awt.Desktop;
import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.URI;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.sun.net.httpserver.HttpServer;

public class OAuthFlowHelper {

    private static final Logger log = LoggerFactory.getLogger(OAuthFlowHelper.class);

    public static class PkceChallenge {
        public final String verifier;
        public final String challenge;

        PkceChallenge(String verifier, String challenge) {
            this.verifier = verifier;
            this.challenge = challenge;
        }
    }

    public static class TokenResult {
        public final String refreshToken;
        public final String accessToken;
        public final String userEmail;

        TokenResult(String refreshToken, String accessToken, String userEmail) {
            this.refreshToken = refreshToken;
            this.accessToken = accessToken;
            this.userEmail = userEmail;
        }
    }

    public static PkceChallenge generatePkce() throws Exception {
        byte[] bytes = new byte[32];
        new SecureRandom().nextBytes(bytes);
        String verifier = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        byte[] digest = MessageDigest.getInstance("SHA-256").digest(verifier.getBytes(StandardCharsets.US_ASCII));
        String challenge = Base64.getUrlEncoder().withoutPadding().encodeToString(digest);
        return new PkceChallenge(verifier, challenge);
    }

    /**
     * Runs the interactive Authorization Code + PKCE flow.
     * Opens the system browser, waits for the loopback redirect callback (up to 5 min),
     * exchanges the code for tokens, and returns them.
     *
     * @param provider      MICROSOFT | GOOGLE | GENERIC
     * @param tenantId      Azure AD tenant ID / "common" (MICROSOFT only)
     * @param clientId      OAuth2 client ID
     * @param authorizeUrl  authorization endpoint (GENERIC only; ignored for known providers)
     * @param tokenUrl      token endpoint (GENERIC only; ignored for known providers)
     * @param scope         OAuth2 scope (GENERIC only; ignored for known providers)
     */
    public static TokenResult runAuthCodeFlow(String provider, String tenantId, String clientId,
            String authorizeUrl, String tokenUrl, String scope) throws Exception {

        String resolvedAuthorizeUrl;
        String resolvedTokenUrl;
        String resolvedScope;

        switch (provider.toUpperCase()) {
            case "MICROSOFT":
                String tid = StringUtils.isNotBlank(tenantId) ? tenantId : "common";
                resolvedAuthorizeUrl = "https://login.microsoftonline.com/" + tid + "/oauth2/v2.0/authorize";
                resolvedTokenUrl     = "https://login.microsoftonline.com/" + tid + "/oauth2/v2.0/token";
                resolvedScope        = "https://outlook.office.com/SMTP.Send offline_access openid email";
                break;
            case "GOOGLE":
                resolvedAuthorizeUrl = "https://accounts.google.com/o/oauth2/v2/auth";
                resolvedTokenUrl     = "https://oauth2.googleapis.com/token";
                resolvedScope        = "https://mail.google.com/ openid email";
                break;
            default: // GENERIC
                resolvedAuthorizeUrl = authorizeUrl;
                resolvedTokenUrl     = tokenUrl;
                resolvedScope        = scope;
        }

        PkceChallenge pkce = generatePkce();
        String state = UUID.randomUUID().toString();
        CountDownLatch latch = new CountDownLatch(1);
        AtomicReference<String> codeRef = new AtomicReference<>();
        AtomicReference<String> errorRef = new AtomicReference<>();

        // Start single-shot loopback HTTP listener on a random free port
        HttpServer loopback = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        int port = loopback.getAddress().getPort();
        String redirectUri = "http://localhost:" + port + "/callback";

        loopback.createContext("/callback", exchange -> {
            try {
                String query = exchange.getRequestURI().getQuery();
                Map<String, String> params = parseQuery(query);
                if (!state.equals(params.get("state"))) {
                    errorRef.set("state mismatch — possible CSRF");
                } else if (params.containsKey("error")) {
                    errorRef.set(params.get("error") + ": " + params.get("error_description"));
                } else {
                    codeRef.set(params.get("code"));
                }
                String html = "<html><body><p>Authentication complete. You can close this tab.</p></body></html>";
                byte[] body = html.getBytes(StandardCharsets.UTF_8);
                exchange.getResponseHeaders().add("Content-Type", "text/html; charset=utf-8");
                exchange.sendResponseHeaders(200, body.length);
                try (OutputStream os = exchange.getResponseBody()) { os.write(body); }
            } catch (Exception e) {
                errorRef.set(e.getMessage());
            } finally {
                latch.countDown();
            }
        });
        loopback.start();

        // Build the authorize URL
        String authUrl = resolvedAuthorizeUrl + "?" + String.join("&",
                "client_id=" + enc(clientId),
                "response_type=code",
                "redirect_uri=" + enc(redirectUri),
                "scope=" + enc(resolvedScope),
                "code_challenge=" + enc(pkce.challenge),
                "code_challenge_method=S256",
                "state=" + enc(state),
                "prompt=consent",
                "access_type=offline"  // Google requires this for refresh_token
        );

        // Open the system browser
        if (Desktop.isDesktopSupported() && Desktop.getDesktop().isSupported(Desktop.Action.BROWSE)) {
            log.info("Opening browser for OAuth2 authorization...");
            Desktop.getDesktop().browse(URI.create(authUrl));
        } else {
            System.out.println("\nPlease open this URL in your browser to authorize DataPallas:");
            System.out.println(authUrl);
        }

        // Wait up to 5 minutes for the callback
        boolean received = latch.await(5, TimeUnit.MINUTES);
        loopback.stop(0);

        if (!received)
            throw new RuntimeException("OAuth2 authorization timed out after 5 minutes.");
        if (errorRef.get() != null)
            throw new RuntimeException("OAuth2 authorization failed: " + errorRef.get());
        if (StringUtils.isBlank(codeRef.get()))
            throw new RuntimeException("No authorization code received.");

        // Exchange code for tokens
        return exchangeCodeForTokens(codeRef.get(), pkce.verifier, clientId, redirectUri,
                resolvedTokenUrl, provider);
    }

    /**
     * Exchanges an authorization code for tokens.
     */
    private static TokenResult exchangeCodeForTokens(String code, String verifier, String clientId,
            String redirectUri, String tokenUrl, String provider) throws Exception {

        String body = String.join("&",
                "grant_type=authorization_code",
                "code=" + enc(code),
                "redirect_uri=" + enc(redirectUri),
                "client_id=" + enc(clientId),
                "code_verifier=" + enc(verifier)
        );

        String responseBody = postForm(tokenUrl, body);
        return parseTokenResponse(responseBody, provider);
    }

    /**
     * Refreshes an access token using a stored refresh token.
     * Returns the new access token.
     */
    public static String refreshAccessToken(String provider, String tenantId, String clientId,
            String customTokenUrl, String customScope, String refreshToken) throws Exception {

        String resolvedTokenUrl;
        String resolvedScope;

        switch (provider.toUpperCase()) {
            case "MICROSOFT":
                String tid = StringUtils.isNotBlank(tenantId) ? tenantId : "common";
                resolvedTokenUrl = "https://login.microsoftonline.com/" + tid + "/oauth2/v2.0/token";
                resolvedScope    = "https://outlook.office.com/SMTP.Send offline_access";
                break;
            case "GOOGLE":
                resolvedTokenUrl = "https://oauth2.googleapis.com/token";
                resolvedScope    = "https://mail.google.com/";
                break;
            default:
                resolvedTokenUrl = customTokenUrl;
                resolvedScope    = customScope;
        }

        String body = String.join("&",
                "grant_type=refresh_token",
                "client_id=" + enc(clientId),
                "refresh_token=" + enc(refreshToken),
                "scope=" + enc(resolvedScope)
        );

        String responseBody = postForm(resolvedTokenUrl, body);
        // Parse only the access_token from the response
        Map<String, Object> json = parseJson(responseBody);
        if (json.containsKey("error"))
            throw new RuntimeException("Token refresh error: " + json.get("error") + " — " + json.get("error_description"));
        return (String) json.get("access_token");
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private static String postForm(String url, String body) throws IOException, InterruptedException {
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Content-Type", "application/x-www-form-urlencoded")
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();
        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        return response.body();
    }

    private static TokenResult parseTokenResponse(String responseBody, String provider) throws Exception {
        Map<String, Object> json = parseJson(responseBody);
        if (json.containsKey("error"))
            throw new RuntimeException("Token exchange error: " + json.get("error") + " — " + json.get("error_description"));

        String refreshToken = (String) json.get("refresh_token");
        String accessToken  = (String) json.get("access_token");
        String idToken      = (String) json.get("id_token");
        String userEmail    = extractEmailFromIdToken(idToken, provider);
        return new TokenResult(refreshToken, accessToken, userEmail);
    }

    private static String extractEmailFromIdToken(String idToken, String provider) {
        if (StringUtils.isBlank(idToken)) return "";
        try {
            String[] parts = idToken.split("\\.");
            if (parts.length < 2) return "";
            String payload = new String(Base64.getUrlDecoder().decode(padBase64(parts[1])), StandardCharsets.UTF_8);
            Map<String, Object> claims = parseJson(payload);
            // Microsoft returns preferred_username; Google returns email
            String email = (String) claims.getOrDefault("preferred_username",
                    claims.getOrDefault("email", ""));
            return StringUtils.defaultString(email);
        } catch (Exception e) {
            log.warn("Could not extract email from id_token: {}", e.getMessage());
            return "";
        }
    }

    /** Minimal JSON parser that handles flat string/number/boolean maps. */
    @SuppressWarnings("unchecked")
    static Map<String, Object> parseJson(String json) {
        Map<String, Object> map = new HashMap<>();
        if (StringUtils.isBlank(json)) return map;
        // Strip outer braces
        String s = json.trim();
        if (s.startsWith("{")) s = s.substring(1);
        if (s.endsWith("}")) s = s.substring(0, s.length() - 1);
        // Split by top-level commas (naive but sufficient for flat token responses)
        for (String token : splitTopLevel(s)) {
            int colon = token.indexOf(':');
            if (colon < 0) continue;
            String key   = unquote(token.substring(0, colon).trim());
            String value = token.substring(colon + 1).trim();
            if (value.startsWith("\"")) {
                map.put(key, unquote(value));
            } else if ("true".equals(value)) {
                map.put(key, Boolean.TRUE);
            } else if ("false".equals(value)) {
                map.put(key, Boolean.FALSE);
            } else if ("null".equals(value)) {
                map.put(key, null);
            } else {
                try { map.put(key, Long.parseLong(value)); } catch (NumberFormatException e) { map.put(key, value); }
            }
        }
        return map;
    }

    private static String[] splitTopLevel(String s) {
        java.util.List<String> parts = new java.util.ArrayList<>();
        int depth = 0; int start = 0; boolean inString = false;
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (c == '"' && (i == 0 || s.charAt(i - 1) != '\\')) inString = !inString;
            else if (!inString && (c == '{' || c == '[')) depth++;
            else if (!inString && (c == '}' || c == ']')) depth--;
            else if (!inString && depth == 0 && c == ',') {
                parts.add(s.substring(start, i).trim());
                start = i + 1;
            }
        }
        if (start < s.length()) parts.add(s.substring(start).trim());
        return parts.toArray(new String[0]);
    }

    private static String unquote(String s) {
        if (s.startsWith("\"") && s.endsWith("\""))
            return s.substring(1, s.length() - 1).replace("\\\"", "\"").replace("\\\\", "\\");
        return s;
    }

    private static String padBase64(String s) {
        return s + "==".substring(0, (4 - s.length() % 4) % 4);
    }

    private static Map<String, String> parseQuery(String query) {
        Map<String, String> map = new HashMap<>();
        if (StringUtils.isBlank(query)) return map;
        for (String pair : query.split("&")) {
            int eq = pair.indexOf('=');
            if (eq < 0) continue;
            map.put(URLDecoder.decode(pair.substring(0, eq), StandardCharsets.UTF_8),
                    URLDecoder.decode(pair.substring(eq + 1), StandardCharsets.UTF_8));
        }
        return map;
    }

    private static String enc(String s) {
        return s == null ? "" : URLEncoder.encode(s, StandardCharsets.UTF_8);
    }
}
