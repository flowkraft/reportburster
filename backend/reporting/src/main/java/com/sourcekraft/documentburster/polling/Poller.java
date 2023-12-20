package com.sourcekraft.documentburster.polling;

import java.io.File;
import java.io.FilenameFilter;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.sadun.util.polling.DirectoryPoller;

import com.sourcekraft.documentburster.job.CliJob;

public class Poller {

	private Logger log = LoggerFactory.getLogger(Poller.class);

	private CliJob cliJob;

	private DirectoryPoller poller;
	private NewFileEventHandler manager;

	private String pollPidFilePath;

	private FilenameFilter pdfFilesFilter = new FilenameFilter() {

		public boolean accept(File dir, String name) {

			String lowerCaseName = name.toLowerCase();
			return lowerCaseName.endsWith(".pdf") || lowerCaseName.endsWith(".xls") || lowerCaseName.endsWith(".xlsx");

		}

	};

	public Poller(CliJob job, String pollPidFilePath) {

		this.cliJob = job;
		this.pollPidFilePath = pollPidFilePath;

	}

	public void poll(String pollFolderPath) throws Exception {

		File pollPidFile = new File(pollPidFilePath);

		if (!pollPidFile.createNewFile())
			log.warn("PID file '" + pollPidFilePath + "' already exists!'");

		manager = new NewFileEventHandler(cliJob);

		poller = new DirectoryPoller();
		poller.setFilter(pdfFilesFilter);

		poller.addDirectory(new File(pollFolderPath));

		poller.setAutoMove(true);
		poller.setPollInterval(1000);
		poller.addPollManager(manager);

		log.info("***********************Poller.start()***********************");

		poller.start();

		boolean shutDown = false;

		while (!shutDown) {
			shutDown = !pollPidFile.exists();
			Thread.sleep(500);
		}

		poller.shutdown();
		while (poller.isAlive()) {
			Thread.sleep(100);
		}

		log.info("***********************Poller.shutdown()***********************");

	}
}
