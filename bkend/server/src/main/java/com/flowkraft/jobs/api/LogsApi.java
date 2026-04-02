package com.flowkraft.jobs.api;

import java.util.stream.Stream;

import com.flowkraft.jobs.models.FileInfo;

public interface LogsApi {

	//Stream<String> cat(String fileName) throws Exception;
	
	Stream<FileInfo> ls() throws Exception;
	
	public void clearLogs(String logFileName) throws Exception;
}
