package com.flowkraft.jobman.services;

import java.util.Map;

import org.springframework.stereotype.Service;

import com.sourcekraft.documentburster.common.db.SqlQueryResult;
import com.sourcekraft.documentburster.job.CliJob;

@Service
public class ReportingService {

	public SqlQueryResult testFetchData(String configurationFilePath, Map<String, String> parameters)
			throws Exception {
		CliJob cliJob = new CliJob(configurationFilePath);

		return cliJob.doTestFetchData(parameters);

	}

}
