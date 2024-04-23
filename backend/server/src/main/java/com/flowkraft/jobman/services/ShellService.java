package com.flowkraft.jobman.services;

import java.io.File;

import org.apache.commons.exec.CommandLine;
import org.apache.commons.exec.DefaultExecuteResultHandler;
import org.apache.commons.exec.DefaultExecutor;
import org.apache.commons.exec.ExecuteException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.stereotype.Service;

import com.flowkraft.common.Constants;
import com.flowkraft.common.AppPaths;
import com.flowkraft.common.Utils.CallBackMethod;
import com.flowkraft.jobman.models.WebSocketJobsExecutionStatsInfo;

@Service
public class ShellService {

	@Autowired
	JobsService jobsService;

	@Autowired
	private SimpMessageSendingOperations messagingTemplate;

	public void runDocumentBursterBatScriptFile(String arrguments, CallBackMethod<File> exitHandler, File file)
			throws Exception {
		DefaultExecuteResultHandler resultHandler = new DefaultExecuteResultHandler() {
			@Override
			public void onProcessComplete(int exitValue) {

				try {
					if (exitValue == 0)
						exitHandler.handle(file);
				} catch (Exception e) {
					throw new RuntimeException(e);
				} finally {

					WebSocketJobsExecutionStatsInfo executeResultInfo = new WebSocketJobsExecutionStatsInfo(
							"on.process.complete", exitValue);

					messagingTemplate.convertAndSend(Constants.WS_TOPIC_EXECUTION_STATS, executeResultInfo);

					super.onProcessComplete(exitValue);

				}
			}

			@Override
			public void onProcessFailed(ExecuteException e) {

				WebSocketJobsExecutionStatsInfo executeResultInfo = new WebSocketJobsExecutionStatsInfo(
						"on.process.failed");

				executeResultInfo.setExceptionMessage(e.getMessage());
				messagingTemplate.convertAndSend(Constants.WS_TOPIC_EXECUTION_STATS, executeResultInfo);

				super.onProcessFailed(e);

			}
		};

		DefaultExecutor executor = new DefaultExecutor();
		executor.setWorkingDirectory(new File(AppPaths.WORKSPACE_DIR_PATH));

		CommandLine cmdLine = CommandLine.parse("cmd.exe /c reportburster.bat" + " " + arrguments);

		//System.out.println("cmd.exe /c reportburster.bat" + " " + arrguments);
		executor.execute(cmdLine, resultHandler);

	}

	public void runDocumentBursterBatScriptFile(String arrguments) throws Exception {
		runDocumentBursterBatScriptFile(arrguments, (T) -> {
		}, (File) Constants.NULLL_OBJ);
	}

}
