package com.flowkraft.jobs.services;

import java.io.File;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Stream;

import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.flowkraft.common.AppPaths;
import com.flowkraft.common.Constants;
import com.flowkraft.common.Utils;
import com.flowkraft.jobs.models.FileInfo;

@Service
public class LogsService {

	@Autowired
	LogTailingService logTailingService;

	public Stream<FileInfo> ls() throws Exception {

		// for normal log file names and log file content

		List<String> allLogFileNames = Arrays.asList("errors.log", "info.log", "warnings.log");

		List<FileInfo> allLogDetails = new ArrayList<FileInfo>();

		boolean trimFileContent = false;

		for (String logFileName : allLogFileNames) {
			File logFile = new File(AppPaths.LOGS_DIR_PATH + "/" + logFileName);
			if (logFile.exists()) {
				//System.out.println("logFileName = " + logFileName);

				FileInfo fileInfo = new FileInfo(logFileName,
						StringUtils.EMPTY, trimFileContent);
				fileInfo.fileSize = logFile.length();
				allLogDetails.add(fileInfo);
			}
		}

		//System.out.println("allLogDetails = " + allLogDetails);

		return allLogDetails.stream();

	}

	public void clearLogs(String logFileName) throws Exception {

		// magic string for "clear all log files"
		if (logFileName.equals(Constants.MAGIC_STRING_CLEAR_ALL_LOG_FILES)) {

			clearLogFile("info.log");
			clearLogFile("errors.log");
			clearLogFile("warnings.log");

		} else

		{

			clearLogFile(logFileName);

		}

	}

	private void clearLogFile(String logFileName) throws Exception {

		logTailingService.stopTailer(logFileName);
		Utils.emptyFile(AppPaths.LOGS_DIR_PATH + "/" + logFileName);
		logTailingService.startTailer(logFileName);

	}

}
