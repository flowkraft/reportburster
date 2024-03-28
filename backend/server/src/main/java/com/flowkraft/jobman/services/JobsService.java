package com.flowkraft.jobman.services;

import java.io.File;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Stream;

import org.apache.commons.io.FileUtils;
import org.apache.commons.io.FilenameUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.unix4j.Unix4j;

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

		
		List<String> allJobFileNames = Unix4j.cd(AppPaths.JOBS_DIR_PATH).ls().toStringList();
		List<FileInfo> allJobDetails = new ArrayList<FileInfo>();

		boolean trimFileContent = false;

		for (String jobFileName : allJobFileNames) {
			String jobFilePath = AppPaths.JOBS_DIR_PATH + "/" + jobFileName;

			File jobFile = new File(jobFilePath);
			if (jobFile.exists())
				try {

					// System.out.println(jobFilePath);

					FileInfo jobFileInfo = new FileInfo(jobFileName,
							Unix4j.cd(AppPaths.JOBS_DIR_PATH).cat(jobFileName).toStringResult(), trimFileContent);
					jobFileInfo.filePath = jobFilePath;

					allJobDetails.add(jobFileInfo);
				} catch (Exception e) {
				}

		}

		return allJobDetails.stream();

	}

	public void doResume(ClientServerCommunicationInfo serverTransactionInfo) throws Exception {

		String jobFilePath = serverTransactionInfo.id;

		this.state.numberOfActiveJobs = 1;

		this.shellService.runDocumentBursterBatScriptFile("-rf \"" + jobFilePath + "\"", file -> {
			FileUtils.forceDelete(file);
			this.state.numberOfActiveJobs = 0;
		}, new File(serverTransactionInfo.info));

	}

	public void doBurst(ClientServerCommunicationInfo serverTransactionInfo) throws Exception {

		//System.out.println("submitJob - ClientServerCommunicationInfo = " + serverTransactionInfo);

		if (serverTransactionInfo.info.toLowerCase().equals(Constants.COMMAND_BURST)) {

			List<FileInfo> filesToProcess = Utils.getFilesToProcess(serverTransactionInfo.id, AppPaths.UPLOADS_DIR_PATH);

			//System.out.println("submitJob - filesToProcess.size = " + filesToProcess.size());

			if (filesToProcess.size() == 1) {

				FileInfo fileToProcess = filesToProcess.get(0);
				//System.out.println("submitJob - fileToProcess.filePath: " + fileToProcess.filePath);

				String filePath = fileToProcess.filePath;
				String fileName = FilenameUtils.getName(filePath);

				try {
					FileUtils.moveFile(new File(filePath), new File(AppPaths.POLL_DIR_PATH + "/" + fileName));
					FileUtils.deleteDirectory(new File(AppPaths.UPLOADS_DIR_PATH + "/" + serverTransactionInfo.id));
				} catch (Exception e) {
					throw new RuntimeException(e);
				}

			}

		}

	}

}
