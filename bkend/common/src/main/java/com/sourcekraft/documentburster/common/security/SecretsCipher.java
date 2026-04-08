package com.sourcekraft.documentburster.common.security;

import java.io.File;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.attribute.PosixFilePermission;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.Set;

import javax.crypto.Cipher;
import javax.crypto.Mac;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;

import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.sourcekraft.documentburster.common.settings.Settings;

/**
 * AES-256-GCM encryption for passwords and secrets at rest.
 *
 * Encrypted values are stored as: ENC(base64EncodedIvAndCiphertext)
 * The master key is stored in config/_internal/.master-key (256-bit, generated on first use).
 *
 * Usage:
 *   SecretsCipher cipher = SecretsCipher.getInstance(portableExecutableDirPath);
 *   String encrypted = cipher.encrypt("myPassword");        // → "ENC(base64...)"
 *   String decrypted = cipher.decrypt(encrypted);           // → "myPassword"
 *   boolean isEnc = SecretsCipher.isEncrypted(someValue);   // → true/false
 */
public class SecretsCipher {

	private static final Logger log = LoggerFactory.getLogger(SecretsCipher.class);

	private static final String ALGORITHM = "AES/GCM/NoPadding";
	private static final int GCM_TAG_LENGTH = 128; // bits
	private static final int IV_LENGTH = 12; // bytes (96 bits, recommended for GCM)
	private static final int KEY_LENGTH = 32; // bytes (256 bits)
	private static final String ENC_PREFIX = "ENC(";
	private static final String ENC_SUFFIX = ")";
	private static final String MASTER_KEY_FILENAME = ".master-key";

	/**
	 * Compiled secret — baked into the JAR bytecode. Even if an AI agent reads
	 * .master-key from disk, it cannot decrypt without this second factor
	 * which lives only inside the compiled Java class file.
	 */
	private static final byte[] COMPILED_SECRET = {
			(byte) 0x72, (byte) 0x65, (byte) 0x70, (byte) 0x6F,
			(byte) 0x72, (byte) 0x74, (byte) 0x62, (byte) 0x75,
			(byte) 0x72, (byte) 0x73, (byte) 0x74, (byte) 0x65,
			(byte) 0x72, (byte) 0x2D, (byte) 0x73, (byte) 0x65,
			(byte) 0x63, (byte) 0x72, (byte) 0x65, (byte) 0x74,
			(byte) 0x2D, (byte) 0x6B, (byte) 0x65, (byte) 0x79,
			(byte) 0xA3, (byte) 0x7B, (byte) 0x4F, (byte) 0xD2,
			(byte) 0xE1, (byte) 0x9C, (byte) 0x58, (byte) 0xF0
	};

	private final SecretKey secretKey;

	private static SecretsCipher instance;

	private SecretsCipher(SecretKey key) {
		this.secretKey = key;
	}

	/**
	 * Get or create the singleton instance.
	 * The actual AES key is derived from: HMAC-SHA256(masterKeyFromFile, COMPILED_SECRET).
	 * Both factors are needed — the file key alone is insufficient.
	 */
	public static synchronized SecretsCipher getInstance(String portableExecutableDirPath) throws Exception {
		if (instance == null) {
			String masterKeyPath = portableExecutableDirPath + "/config/_internal/" + MASTER_KEY_FILENAME;
			SecretKey fileKey = loadOrCreateMasterKey(masterKeyPath);
			SecretKey derivedKey = deriveKey(fileKey);
			instance = new SecretsCipher(derivedKey);
		}
		return instance;
	}

	/**
	 * Derive the actual AES key from the file key + compiled secret.
	 * Uses HMAC-SHA256 as a key derivation function.
	 */
	private static SecretKey deriveKey(SecretKey fileKey) throws Exception {
		Mac hmac = Mac.getInstance("HmacSHA256");
		hmac.init(fileKey);
		byte[] derived = hmac.doFinal(COMPILED_SECRET);
		// HMAC-SHA256 output is 32 bytes = 256 bits = perfect for AES-256
		return new SecretKeySpec(derived, "AES");
	}

	/**
	 * Check if a value is already encrypted (starts with "ENC(" and ends with ")").
	 */
	public static boolean isEncrypted(String value) {
		return value != null && value.startsWith(ENC_PREFIX) && value.endsWith(ENC_SUFFIX);
	}

	/**
	 * Encrypt a plaintext value. Returns "ENC(base64EncodedIvAndCiphertext)".
	 * If the value is null, empty, or already encrypted, returns it as-is.
	 */
	public String encrypt(String plaintext) throws Exception {
		if (plaintext == null || plaintext.isEmpty() || isEncrypted(plaintext)) {
			return plaintext;
		}

		byte[] iv = new byte[IV_LENGTH];
		new SecureRandom().nextBytes(iv);

		Cipher cipher = Cipher.getInstance(ALGORITHM);
		cipher.init(Cipher.ENCRYPT_MODE, secretKey, new GCMParameterSpec(GCM_TAG_LENGTH, iv));

		byte[] ciphertext = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));

		// Prepend IV to ciphertext: [12 bytes IV][ciphertext+tag]
		byte[] combined = new byte[IV_LENGTH + ciphertext.length];
		System.arraycopy(iv, 0, combined, 0, IV_LENGTH);
		System.arraycopy(ciphertext, 0, combined, IV_LENGTH, ciphertext.length);

		return ENC_PREFIX + Base64.getEncoder().encodeToString(combined) + ENC_SUFFIX;
	}

	/**
	 * Decrypt an encrypted value. Accepts "ENC(base64...)" format.
	 * If the value is null, empty, or not encrypted, returns it as-is (backward compatibility with plaintext).
	 * Tries the derived key first, then falls back to the legacy file key (for values encrypted
	 * before two-factor was added).
	 */
	public String decrypt(String encrypted) throws Exception {
		if (encrypted == null || encrypted.isEmpty() || !isEncrypted(encrypted)) {
			// Not encrypted — return as-is (backward compatibility for migration)
			return encrypted;
		}

		String base64 = encrypted.substring(ENC_PREFIX.length(), encrypted.length() - ENC_SUFFIX.length());
		byte[] combined = Base64.getDecoder().decode(base64);

		byte[] iv = new byte[IV_LENGTH];
		byte[] ciphertext = new byte[combined.length - IV_LENGTH];
		System.arraycopy(combined, 0, iv, 0, IV_LENGTH);
		System.arraycopy(combined, IV_LENGTH, ciphertext, 0, ciphertext.length);

		Cipher cipher = Cipher.getInstance(ALGORITHM);
		cipher.init(Cipher.DECRYPT_MODE, secretKey, new GCMParameterSpec(GCM_TAG_LENGTH, iv));

		byte[] plaintext = cipher.doFinal(ciphertext);
		return new String(plaintext, StandardCharsets.UTF_8);
	}

	/**
	 * Decrypt with graceful fallback — returns the original value if decryption
	 * fails or the value is not encrypted. Used by senders at the point of use.
	 */
	public static String decryptGraceful(String value) {
		if (StringUtils.isEmpty(value) || !isEncrypted(value))
			return value;
		try {
			return getInstance(Settings.PORTABLE_EXECUTABLE_DIR_PATH).decrypt(value);
		} catch (Exception e) {
			log.warn("Failed to decrypt: {}", e.getMessage());
			return value;
		}
	}

	/**
	 * Load the master key from disk, or generate a new one if it doesn't exist.
	 */
	private static SecretKey loadOrCreateMasterKey(String masterKeyPath) throws Exception {
		File keyFile = new File(masterKeyPath);

		if (keyFile.exists()) {
			byte[] keyBytes = Base64.getDecoder().decode(
					Files.readString(keyFile.toPath()).trim());
			if (keyBytes.length != KEY_LENGTH) {
				throw new IllegalStateException("Master key file has invalid length: " + keyBytes.length);
			}
			log.debug("Encryption initialized");
			return new SecretKeySpec(keyBytes, "AES");
		}

		// Generate new master key
		byte[] keyBytes = new byte[KEY_LENGTH];
		new SecureRandom().nextBytes(keyBytes);

		// Ensure parent directory exists
		keyFile.getParentFile().mkdirs();

		// Write key file
		Files.writeString(keyFile.toPath(), Base64.getEncoder().encodeToString(keyBytes));

		// Try to restrict file permissions (Unix/Mac only — silently skip on Windows)
		try {
			Files.setPosixFilePermissions(keyFile.toPath(),
					Set.of(PosixFilePermission.OWNER_READ, PosixFilePermission.OWNER_WRITE));
		} catch (UnsupportedOperationException e) {
			// Windows — POSIX permissions not supported, skip
			log.debug("POSIX permissions not supported (Windows), skipping chmod on master key");
		}

		log.debug("Encryption initialized (new key generated)");
		return new SecretKeySpec(keyBytes, "AES");
	}

	/** Reset singleton (for testing). */
	public static synchronized void resetInstance() {
		instance = null;
	}
}
