package com.flowkraft.common;

import java.nio.file.Path;

import org.apache.commons.lang3.StringUtils;

public class AppPaths {

	public static String PORTABLE_EXECUTABLE_DIR_PATH = StringUtils.EMPTY;

	// jobman and jobson
	public static String WORKSPACE_DIR_PATH = StringUtils.EMPTY;
	// end jobman and jobson

	// jobman only
	public static String CONFIG_DIR_PATH = StringUtils.EMPTY;
	public static String LOGS_DIR_PATH = StringUtils.EMPTY;
	public static String QUARANTINE_DIR_PATH = StringUtils.EMPTY;

	public static String UPLOADS_DIR_PATH = StringUtils.EMPTY;
	public static String JOBS_DIR_PATH = StringUtils.EMPTY;
	public static String DEFAULT_POLL_DIR_PATH = StringUtils.EMPTY;
	public static String DEFAULT_POLL_RECEIVED_DIR_PATH = StringUtils.EMPTY;

	// public static String PROCESSING_DIR_PATH = StringUtils.EMPTY;
	// end jobman only

	static {

		PORTABLE_EXECUTABLE_DIR_PATH = toAbsolutePath(
				Utils.getJvmArgumentValue("-D" + Constants.PORTABLE_EXECUTABLE_DIR + "=")).replace("\\", "/");

		if (StringUtils.isNotBlank(PORTABLE_EXECUTABLE_DIR_PATH)) {

			WORKSPACE_DIR_PATH = PORTABLE_EXECUTABLE_DIR_PATH + "/config/";

			CONFIG_DIR_PATH = PORTABLE_EXECUTABLE_DIR_PATH + "/config";
			LOGS_DIR_PATH = PORTABLE_EXECUTABLE_DIR_PATH + "/logs";
			QUARANTINE_DIR_PATH = PORTABLE_EXECUTABLE_DIR_PATH + "/quarantine";

			UPLOADS_DIR_PATH = PORTABLE_EXECUTABLE_DIR_PATH + "/uploads";
			JOBS_DIR_PATH = PORTABLE_EXECUTABLE_DIR_PATH + "/temp";
			// PROCESSING_DIR_PATH = POLL_DIR_PATH + "/" + Constants.PROCESSING_DIR_NAME;
		}
	}

	public static String toAbsolutePath(String maybeRelative) {

		if (!StringUtils.isBlank(maybeRelative)) {
			Path path = java.nio.file.Paths.get(maybeRelative);
			Path effectivePath = path;
			if (!path.isAbsolute()) {
				Path base = java.nio.file.Paths.get(StringUtils.EMPTY);
				effectivePath = base.resolve(path).toAbsolutePath();
			}
			return effectivePath.normalize().toString();
		}

		return StringUtils.EMPTY;
	}

}
