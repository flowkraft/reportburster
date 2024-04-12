package com.flowkraft.jobman.schedulers;

import java.io.File;
import java.util.Collection;
import java.util.LinkedList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

import org.apache.commons.io.FileUtils;
import org.apache.commons.io.FilenameUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.flowkraft.common.AppPaths;
import com.flowkraft.common.Constants;
import com.flowkraft.common.Utils;
import com.flowkraft.jobman.models.FileInfo;
import com.flowkraft.jobman.services.JobsService;
import com.flowkraft.jobman.services.ShellService;

@Component
public class PollScheduler {

	@Autowired
	JobsService jobsService;

	@Autowired
	private ShellService shellService;

	// put the new files in a waitQueue just to be sure we don't try to process
	// incomplete files which are not yet fully copied to the "poll" folder
	private List<String> waitQueue = new LinkedList<String>();

	@Scheduled(fixedRate = 5000)
	public void poll() throws Exception {

		Collection<File> allFilesInPollFolder = FileUtils.listFiles(new File(AppPaths.POLL_DIR_PATH),
				Utils.filesWhichCanBeProcessedFilter, null);

		for (File polledFile : allFilesInPollFolder) {

			String polledFilePath = polledFile.getAbsolutePath();

			String baseName = FilenameUtils.getBaseName(polledFilePath); // get filename without extension
			String extension = FilenameUtils.getExtension(polledFilePath); // get file extension

			String randomUUID = UUID.randomUUID().toString(); // generate random UUID

			// construct new filename with random UUID
			String polledFileName = baseName + "-" + randomUUID + "." + extension;

			Collection<File> processingFiles = FileUtils.listFiles(new File(AppPaths.POLL_RECEIVED_DIR_PATH),
					Utils.filesWhichCanBeProcessedFilter, null);

			jobsService.state.numberOfActiveJobs = processingFiles.size();

			if (jobsService.state.numberOfActiveJobs > 0)
				return;

			if (!waitQueue.contains(polledFilePath)) {
				waitQueue.add(polledFilePath);
			} else {

				String filePathToProcess = AppPaths.POLL_RECEIVED_DIR_PATH + "/" + polledFileName;

				jobsService.state.numberOfActiveJobs = 1;

				File fileToProcess = new File(filePathToProcess);

				FileUtils.moveFile(polledFile, fileToProcess);
				shellService.runDocumentBursterBatScriptFile("-f \"" + filePathToProcess + "\"", file -> {

					List<FileInfo> progressFile = this.jobsService.fetchStats()
							.filter(f -> f.fileName.endsWith(Constants.EXTENTION_PROGRESS_FILE)
									&& f.fileContent.contains(filePathToProcess))
							.collect(Collectors.toList());

					// if there is a corresponding .progress file do not remove the file since it
					// might be "Resumed" later
					if (Objects.isNull(progressFile) || progressFile.size() == 0)
						FileUtils.forceDelete(file);

					waitQueue.remove(polledFilePath);
					jobsService.state.numberOfActiveJobs = 0;

				}, fileToProcess);

			}

		}

	}
}
