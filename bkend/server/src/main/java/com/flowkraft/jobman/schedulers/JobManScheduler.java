package com.flowkraft.jobman.schedulers;

import java.io.BufferedReader;
import java.io.InputStreamReader;

import jakarta.annotation.PostConstruct;

import org.apache.commons.lang3.StringUtils;
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
	private String parentElectronPid;

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

		// stop the server if the user closed the "parent" ReportBurster.exe (Electron)
		// which initiated the
		// server
		if (StringUtils.isNotBlank(parentElectronPid)) {
			long pid = Long.parseLong(parentElectronPid);
			// Execute a command to check if the process is running
			Process process = Runtime.getRuntime().exec("tasklist /FI \"PID eq " + pid + "\"");
			BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
			String line;
			boolean isRunning = false;
			while ((line = reader.readLine()) != null && !isRunning) {
				if (line.contains(String.valueOf(pid))) {
					isRunning = true;
				}
			}
			if (!isRunning) {
				// Electron process is not running, stop the Spring Boot application
				System.out.println("rbsj.JobManScheduler - ReportBurster.exe (Electron) process having PID " + pid
						+ " was closed => stop its corresponding SpringBoot server application");

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

	@PostConstruct
	public void killAnyHangedElectronProcesses() throws Exception {
		// this code makes sense only if the SpringBoot server was initiated from
		// ReportBurster.exe

		/*
		 * if (StringUtils.isNotBlank(parentElectronPid)) {
		 * 
		 * String parentElectronCreationDate =
		 * Utils.getProcessCreationDate(Long.parseLong(parentElectronPid));
		 * 
		 * List<Long> pIDs =
		 * Utils.getPidsOfProcessesOfExecutableRunning("ReportBurster.exe"); if
		 * (pIDs.size() > 0) { for (Long pid : pIDs) {
		 * 
		 * String processCreationDate = Utils.getProcessCreationDate(pid);
		 * 
		 * // kill all "hanged" ReportBurster.exe but make sure the current "parent" //
		 * ReportBurster.exe which // triggered the server is not killed also if
		 * (!processCreationDate.equals(parentElectronCreationDate)) { boolean
		 * isRunning; do { System.out.println(
		 * "rbsj.JobManScheduler.killAnyHangedElectronProcesses() - Attempting to kill 'hanged' ReportBurster.exe process having PID "
		 * + pid);
		 * 
		 * Process killProcess = Runtime.getRuntime().exec("taskkill /F /PID " + pid);
		 * BufferedReader killReader = new BufferedReader( new
		 * InputStreamReader(killProcess.getErrorStream())); String killLine; boolean
		 * accessDenied = false; while ((killLine = killReader.readLine()) != null) { if
		 * (killLine.contains("Access is denied")) { accessDenied = true;
		 * System.out.println("Warning: Unable to kill process with PID: " + pid +
		 * " due to insufficient permissions."); break; } } if (accessDenied) { break; }
		 * 
		 * // Check if the process is still running Process process =
		 * Runtime.getRuntime().exec("cmd /c tasklist /FI \"PID eq " + pid + "\"");
		 * BufferedReader reader = new BufferedReader(new
		 * InputStreamReader(process.getInputStream())); String line; isRunning = false;
		 * while ((line = reader.readLine()) != null) { if (line.contains(" " + pid +
		 * " ")) { Thread.sleep(1000); isRunning = true; } } } while (isRunning); } } }
		 * }
		 */
	}
}
