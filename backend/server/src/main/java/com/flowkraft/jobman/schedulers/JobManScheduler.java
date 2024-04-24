package com.flowkraft.jobman.schedulers;

import org.apache.catalina.core.ApplicationContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ExitCodeGenerator;
import org.springframework.boot.SpringApplication;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.flowkraft.common.Constants;
import com.flowkraft.jobman.models.WebSocketJobsExecutionStatsInfo;
import com.flowkraft.jobman.services.JobsService;
import com.flowkraft.jobman.services.LogsService;

@Component
public class JobManScheduler {

	@Value("${ELECTRON_PID:}")
	private String electronPid;

	@Autowired
	JobsService jobsService;

	@Autowired
	LogsService logsService;

	@Autowired
	private SimpMessageSendingOperations messagingTemplate;

	private final ConfigurableApplicationContext context;

	public JobManScheduler(ConfigurableApplicationContext context) {
		this.context = context;
	}

	@Scheduled(fixedRate = 250)
	public void publishExecutionStatsDetailsToWebSocket() throws Exception {

		if (electronPid != null && !electronPid.isEmpty()) {
			long pid = Long.parseLong(electronPid);
			ProcessHandle processHandle = ProcessHandle.of(pid).orElse(null);
			if (processHandle == null || !processHandle.isAlive()) {
				// Electron process is not running, stop the Spring Boot application
				System.out.println("Electron process with ID " + pid + " was closed, stop the Spring Boot application");

				int exitCode = SpringApplication.exit(this.context, (ExitCodeGenerator) () -> 0);
				System.exit(exitCode);
			}
		}

		WebSocketJobsExecutionStatsInfo execStatsMessageInfo = new WebSocketJobsExecutionStatsInfo("stats.jobs",
				jobsService.fetchStats());

		messagingTemplate.convertAndSend(Constants.WS_TOPIC_EXECUTION_STATS, execStatsMessageInfo);

		execStatsMessageInfo = new WebSocketJobsExecutionStatsInfo("stats.logs", logsService.ls());
		messagingTemplate.convertAndSend(Constants.WS_TOPIC_EXECUTION_STATS, execStatsMessageInfo);

	}
}
