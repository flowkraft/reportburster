package com.sourcekraft.documentburster.update;

//DON'T USE / IMPORT ANY 3rd party Java library, only standard Java should be used in the Java Update project

import java.io.File;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class KillOldExeThenCopyAndStartNewExe {

	private static final String APP_ID = "java.update.KillOldExeThenCopyAndStartNewExe";

	// command used to kill a task
	private static final String _KILL_COMMAND = "taskkill /f /t /fi \"IMAGENAME eq DocumentBurster*\" /im *";

	public static void main(String[] args) throws Throwable {

		String jobFilePath = null;
		String newExeFilePath = null;
		String tempFolderPath = null;

		try {

			Map<String, List<String>> arrgs = _getParams(args);

			System.out.println(APP_ID + " - arrgs: " + arrgs);

			jobFilePath = arrgs.get("jfp").get(0);
			newExeFilePath = arrgs.get("nefp").get(0);
			tempFolderPath = arrgs.get("tfp").get(0);

			_doKillOldExeThenCopyAndStartNewExe(jobFilePath, newExeFilePath, tempFolderPath);

		} finally {

			File jobFile = new File(jobFilePath);
			if (jobFile.exists())
				jobFile.delete();

		}

	}

	private static void _doKillOldExeThenCopyAndStartNewExe(String jobFilePath, String newExeFilePath,
			String upgDbTempFolderPath) throws Exception {

		System.out.println(String.format("%s - jobFilePath = %s; newExeFilePath = %s; upgDbTempFolderPath = %s", APP_ID,
				jobFilePath, newExeFilePath, upgDbTempFolderPath));

		System.out.println(APP_ID + " - _KILL_COMMAND: " + _KILL_COMMAND);

		System.out.println(APP_ID + " - STEP 1 - \"Kill -9\" the running ReportBurster.exe process ... ");

		_killProcess();

		File oldExe = new File(_getWorkingDirectoryPath() + "/ReportBurster.exe");

		String message;

		if (!oldExe.exists()) {
			message = APP_ID + " - STEP 2 - Could not delete the old '" + oldExe.getAbsolutePath()
					+ "' file WAS NOT FOUND !";
			System.out.println(message);
			throw new Exception(message);
		} else {
			oldExe.delete();
			System.out.println(APP_ID + " - STEP 2 - Deleted the old '" + oldExe.getAbsolutePath() + "' file ... ");
		}

		File newExe = new File(newExeFilePath);
		if (!newExe.exists()) {
			message = APP_ID + " - STEP 3 - Could not copy the new '" + newExe.getAbsolutePath()
					+ "' file WAS NOT FOUND !";
			System.out.println(message);
			throw new Exception(message);
		} else {
			newExe.renameTo(oldExe);
			System.out.println(APP_ID + " - STEP 3 - Copied the new '" + newExe.getAbsolutePath() + "' file to '"
					+ oldExe.getAbsolutePath() + "' ... ");

		}

		File upgDbTempFolder = new File(upgDbTempFolderPath);
		if (!upgDbTempFolder.exists()) {
			message = APP_ID + " - STEP 4 - Could not delete the temporarily '" + upgDbTempFolder.getAbsolutePath()
					+ "' folder WAS NOT FOUND !";
			System.out.println(message);
			throw new Exception(message);
		} else {
			_forceDeleteDirectory(upgDbTempFolder);
			System.out.println(APP_ID + " - STEP 4 - Deleted the temporarily '" + upgDbTempFolder.getAbsolutePath()
					+ "' folder ... ");
		}

		File jobFile = new File(jobFilePath);
		if (!jobFile.exists()) {
			message = APP_ID + " - STEP 5 - Could not delete the job '" + jobFile.getAbsolutePath()
					+ "' file WAS NOT FOUND !";
			System.out.println(message);
			// throw new Exception(message);
		} else {
			jobFile.delete();
			System.out.println(APP_ID + " - STEP 5 - Deleted the job '" + jobFile.getAbsolutePath() + "' file ... ");
		}

		if (!oldExe.exists()) {
			message = APP_ID + " - STEP 6 - Could not start the new / updated ReportBurster.exe... '"
					+ oldExe.getAbsolutePath() + "' file WAS NOT FOUND !";
			System.out.println(message);
			throw new Exception(message);
		} else {
			System.out.println(APP_ID + " - STEP 6 - Starting the new / updated ReportBurster.exe ... ");
			Runtime.getRuntime().exec(oldExe.getAbsolutePath());
		}
	}

	private static boolean _forceDeleteDirectory(File directoryToBeDeleted) {

		File[] allContents = directoryToBeDeleted.listFiles();
		if (allContents != null) {
			for (File file : allContents) {
				_forceDeleteDirectory(file);
			}
		}
		return directoryToBeDeleted.delete();

	}

	private static Map<String, List<String>> _getParams(String[] args) throws Exception {
		final Map<String, List<String>> params = new HashMap<>();

		List<String> options = null;

		for (int i = 0; i < args.length; i++) {
			final String a = args[i];

			if (a.charAt(0) == '-') {
				if (a.length() < 2) {
					throw new Exception("Error at argument " + a);
				}

				options = new ArrayList<>();
				params.put(a.substring(1), options);
			} else if (options != null) {
				options.add(a);
			} else {
				throw new Exception("Illegal parameter usage");
			}
		}

		return params;

	}

	private static void _killProcess() throws Exception {

		Runtime.getRuntime().exec(_KILL_COMMAND);

	}

	private static String _getWorkingDirectoryPath() {
		return System.getProperty("user.dir").replace("\\", "/");
	}

}
