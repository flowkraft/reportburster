package com.flowkraft.jobman.schedulers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.flowkraft.common.Constants;
import com.flowkraft.jobman.models.WebSocketJobsExecutionStatsInfo;
import com.flowkraft.jobman.services.JobsService;
import com.flowkraft.jobman.services.LogsService;

@Component
public class JobManScheduler {

	@Autowired
	JobsService jobsService;

	@Autowired
	LogsService logsService;

	@Autowired
	private SimpMessageSendingOperations messagingTemplate;

	@Scheduled(fixedRate = 250)
	public void publishExecutionStatsDetailsToWebSocket() throws Exception {

		//System.out.println("JobManScheduler.publishExecutionStatsDetailsToWebSocket");
		
		
		WebSocketJobsExecutionStatsInfo execStatsMessageInfo = new WebSocketJobsExecutionStatsInfo("stats.jobs", jobsService.fetchStats());
		
		messagingTemplate.convertAndSend(Constants.WS_TOPIC_EXECUTION_STATS, execStatsMessageInfo);
		
		execStatsMessageInfo = new WebSocketJobsExecutionStatsInfo("stats.logs", logsService.ls());
		messagingTemplate.convertAndSend(Constants.WS_TOPIC_EXECUTION_STATS, execStatsMessageInfo);
		
	}
}
