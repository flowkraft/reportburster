package com.flowkraft.jobs.services;

import java.io.File;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

import org.apache.commons.io.input.Tailer;
import org.apache.commons.io.input.TailerListenerAdapter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.stereotype.Service;

import com.flowkraft.common.AppPaths;
import com.flowkraft.jobs.models.FileInfo;
import com.flowkraft.jobs.models.WebSocketJobsExecutionStatsInfo;

@Service
public class LogTailingService {

	@Autowired
	private SimpMessageSendingOperations messagingTemplate;

	private Map<String, Tailer> existingTailers = new HashMap<>();

	public void startTailer(String fileName) throws Exception {
		if (Objects.isNull(existingTailers.get(fileName))) {

			Tailer tailer = new Tailer(new File(AppPaths.LOGS_DIR_PATH + "/" + fileName), new TailerListenerAdapter() {
				public void handle(String line) {

					boolean trimContent = false;

					List<FileInfo> logsTailInfo = new ArrayList<FileInfo>();
					logsTailInfo.add(new FileInfo(fileName, line, trimContent));

					WebSocketJobsExecutionStatsInfo tailMessageInfo = new WebSocketJobsExecutionStatsInfo("logs.tailer",
							logsTailInfo.stream());

					messagingTemplate.convertAndSend("/topic/tailer", tailMessageInfo);
				}
			});
			existingTailers.put(fileName, tailer);
			new Thread(tailer, "log-tailer-" + fileName).start();
		} else
			throw new Exception("A tailer is already started for " + fileName);
	}

	public void stopTailer(String fileName) {

		Tailer tailer = existingTailers.get(fileName);

		if (!Objects.isNull(tailer)) {
			tailer.stop();
			existingTailers.remove(fileName);
		}

	}

}
