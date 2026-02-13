package com.flowkraft.jobman.services;

import java.io.File;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Stream;

import org.apache.commons.io.FileUtils;
import org.apache.commons.io.FilenameUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.flowkraft.common.Constants;
import com.flowkraft.common.Utils;
import com.flowkraft.common.AppPaths;
import com.flowkraft.jobman.api.JobsApi;
import com.flowkraft.jobman.models.FileInfo;
import com.flowkraft.jobman.models.ClientServerCommunicationInfo;

@Service
public class JobsService implements JobsApi {

	public class State {
		public int numberOfActiveJobs = 0;
	}

	public State state = new State();

	@Autowired
	private ShellService shellService;

	@Override
	public Stream<FileInfo> fetchStats() throws Exception {

		Path jobsDir = Path.of(AppPaths.JOBS_DIR_PATH);
		List<FileInfo> allJobDetails = new ArrayList<FileInfo>();

		if (!Files.exists(jobsDir) || !Files.isDirectory(jobsDir))
			return allJobDetails.stream();

		boolean trimFileContent = false;

		// Use NIO Files.readString() instead of Unix4j.cat() — Unix4j can hold
		// file handles open on Windows, preventing deletion by other threads.
		try (java.util.stream.Stream<Path> entries = Files.list(jobsDir)) {
			for (Path entry : (Iterable<Path>) entries::iterator) {
				String jobFileName = entry.getFileName().toString();
				try {
					String content = Files.readString(entry, StandardCharsets.UTF_8);
					FileInfo jobFileInfo = new FileInfo(jobFileName, content, trimFileContent);
					jobFileInfo.filePath = entry.toString();
					allJobDetails.add(jobFileInfo);
				} catch (Exception e) {
					// File may have been deleted between listing and reading — ignore
				}
			}
		}

		return allJobDetails.stream();

	}

	public void doResume(ClientServerCommunicationInfo serverTransactionInfo) throws Exception {

		String jobFilePath = serverTransactionInfo.id;

		this.state.numberOfActiveJobs = 1;

		// Updated to use the new CLI interface
		// Instead of passing "-rf filepath", we now use the new command structure
		// "resume filepath"
		this.shellService.runDocumentBursterBatScriptFile("resume \"" + jobFilePath + "\"", file -> {
			FileUtils.forceDelete(file);
			this.state.numberOfActiveJobs = 0;
		}, new File(serverTransactionInfo.info));

	}

	public void doBurst(ClientServerCommunicationInfo serverTransactionInfo) throws Exception {

		// System.out.println("submitJob - ClientServerCommunicationInfo = " +
		// serverTransactionInfo);

		if (serverTransactionInfo.info.toLowerCase().equals(Constants.COMMAND_BURST)) {

			List<FileInfo> filesToProcess = Utils.getFilesToProcess(serverTransactionInfo.id,
					AppPaths.UPLOADS_DIR_PATH);

			// System.out.println("submitJob - filesToProcess.size = " +
			// filesToProcess.size());

			if (filesToProcess.size() == 1) {

				FileInfo fileToProcess = filesToProcess.get(0);
				// System.out.println("submitJob - fileToProcess.filePath: " +
				// fileToProcess.filePath);

				String filePath = fileToProcess.filePath;
				String fileName = FilenameUtils.getName(filePath);

				try {
					FileUtils.moveFile(new File(filePath), new File(AppPaths.DEFAULT_POLL_DIR_PATH + "/" + fileName));
					FileUtils.deleteDirectory(new File(AppPaths.UPLOADS_DIR_PATH + "/" + serverTransactionInfo.id));
				} catch (Exception e) {
					throw new RuntimeException(e);
				}

			}

		}

	}

}
