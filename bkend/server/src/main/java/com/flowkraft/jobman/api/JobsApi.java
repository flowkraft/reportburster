package com.flowkraft.jobman.api;

import java.util.stream.Stream;

import com.flowkraft.jobman.models.FileInfo;

public interface JobsApi {

	Stream<FileInfo> fetchStats() throws Exception;
	
}
