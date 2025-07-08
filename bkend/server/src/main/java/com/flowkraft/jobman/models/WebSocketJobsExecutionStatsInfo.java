package com.flowkraft.jobman.models;

import java.util.stream.Stream;

import lombok.Data;

@Data
public class WebSocketJobsExecutionStatsInfo {

	String eventType;

	Stream<FileInfo> filesPayload;

	int exitValue;

	private String exceptionMessage;

	public WebSocketJobsExecutionStatsInfo(String eventType) {
		this.eventType = eventType;
	}

	public WebSocketJobsExecutionStatsInfo(String eventType, Stream<FileInfo> filesPayload) {
		this.eventType = eventType;
		this.filesPayload = filesPayload;
	}

	public WebSocketJobsExecutionStatsInfo(String eventType, int exitValue) {
		this.eventType = eventType;
		this.exitValue = exitValue;
	}
}
