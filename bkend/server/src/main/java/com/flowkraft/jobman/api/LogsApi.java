package com.flowkraft.jobman.api;

import java.util.stream.Stream;

import com.flowkraft.jobman.models.FileInfo;

public interface LogsApi {

	//Stream<String> cat(String fileName) throws Exception;
	
	Stream<FileInfo> ls() throws Exception;
	
	public void clearLogs(String logFileName) throws Exception;
}
