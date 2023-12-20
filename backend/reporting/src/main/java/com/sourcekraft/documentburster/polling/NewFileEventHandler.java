package com.sourcekraft.documentburster.polling;

import java.io.File;

import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.sadun.util.polling.BasePollManager;
import org.sadun.util.polling.FileMovedEvent;

import com.sourcekraft.documentburster.job.CliJob;

public class NewFileEventHandler extends BasePollManager {

	private static Logger log = LoggerFactory.getLogger(NewFileEventHandler.class);

	private CliJob cliJob;

	public NewFileEventHandler(CliJob job) {
		this.cliJob = job;
	}

	public void fileMoved(FileMovedEvent evt) {

		String filePath = evt.getPath().getAbsolutePath();

		log.debug("evt.getPath().getAbsolutePath() = " + filePath);

		try {
			cliJob.doBurst(filePath, false, StringUtils.EMPTY, -1);
		} catch (Exception e) {
			log.error("Error bursting file '" + filePath + "'", e);
		} finally {

			File receivedFile = new File(filePath);

			if ((receivedFile.exists()) && (!receivedFile.delete()))
				log.warn("Could not delete received file ' " + filePath + "'!");

		}
	}

}
