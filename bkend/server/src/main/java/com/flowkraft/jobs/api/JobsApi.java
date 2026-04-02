package com.flowkraft.jobs.api;

import java.util.stream.Stream;

import com.flowkraft.jobs.models.FileInfo;

public interface JobsApi {

	Stream<FileInfo> fetchStats() throws Exception;
	
}
