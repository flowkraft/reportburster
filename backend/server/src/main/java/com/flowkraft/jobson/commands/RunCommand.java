/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 * 
 *   http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

package com.flowkraft.jobson.commands;

import static com.flowkraft.jobson.Helpers.commaSeparatedList;
import static com.flowkraft.jobson.Helpers.readJSON;
import static com.flowkraft.jobson.controllers.v1.JobController.validateAPIRequest;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.flowkraft.jobson.api.v1.APIJobRequest;
import com.flowkraft.jobson.api.v1.UserId;
import com.flowkraft.jobson.dao.specs.FileSystemJobSpecDAO;
import com.flowkraft.jobson.jobs.JobEventListeners;
import com.flowkraft.jobson.jobs.JobManager;
import com.flowkraft.jobson.jobs.jobstates.FinalizedJob;
import com.flowkraft.jobson.jobs.jobstates.ValidJobRequest;
import com.flowkraft.jobson.utils.EitherVisitor;
import com.flowkraft.jobson.utils.ValidationError;

import io.reactivex.Observer;
import io.reactivex.annotations.NonNull;
import io.reactivex.disposables.Disposable;
import picocli.CommandLine.Command;
import picocli.CommandLine.Parameters;

@Command(name = "run", description = "run a request locally")
@Component
public class RunCommand extends BaseCommand {

	@Autowired
	FileSystemJobSpecDAO filesystemJobSpecDAO;

	@Autowired
	JobManager jobManager;

	@Parameters(arity = "1", description = "REQUEST_JSON")
	private String requestJSONFile;

	@Override
	public void run() {

		//System.out.println("RunCommand -> run -> requestJSONFile = " + requestJSONFile + ", AppConfig = "
		//		+ appConfig.toString());

		final Path requestPath = java.nio.file.Paths.get(requestJSONFile.toString());

		if (!Files.exists(requestPath)) {
			System.err.println(requestPath.toString() + ": No such file");
			System.exit(1);
		}

		final byte[] requestBytes;
		try {
			requestBytes = Files.readAllBytes(requestPath);
		} catch (IOException ex) {
			System.err.println(requestPath + ": cannot read: " + ex.getMessage());
			System.exit(1);
			return;
		}

		final String requestJson = new String(requestBytes);

		final APIJobRequest jobSubmissionRequest;
		try {
			jobSubmissionRequest = readJSON(requestJson, APIJobRequest.class);
		} catch (Exception ex) {
			System.err.println("Could not parse json. Message: " + ex.getMessage());
			System.exit(1);
			return;
		}

		log.debug("Job submission request parsed successfully.");

		Path tmpDir;
		try {
			tmpDir = Files.createTempDirectory(RunCommand.class.getSimpleName());
		} catch (Exception ex) {
			System.err.println("Could not parse json. Message: " + ex.getMessage());
			System.exit(1);
			return;
		}

		log.debug("Created temporary directory: " + tmpDir);

		// final FileSystemJobSpecDAO filesystemJobSpecDAO = new FileSystemJobSpecDAO(
		// AppPaths.get(appConfig.getJobSpecConfiguration().getDir()));

		log.info("Creating temporary directory for job working dirs");
		try {
			final Path jobWorkingDirs = Files.createTempDirectory("wds");
		} catch (IOException ex) {
			System.err.println("Could not parse json. Message: " + ex.getMessage());
			System.exit(1);
			return;
		}
		// final JobExecutor jobExecutor = new LocalJobExecutor(jobWorkingDirs,
		// Constants.DELAY_BEFORE_FORCIBLY_KILLING_JOBS_IN_MILLISECONDS);

		// final FileSystemJobsDAO filesystemJobsDAO = new FileSystemJobsDAO(tmpDir,
		// () -> Helpers.generateRandomBase36String(10));

		// final JobManager jobManager = new JobManager(filesystemJobsDAO, jobExecutor,
		// Constants.MAX_CONCURRENT_JOBS);

		final JobEventListeners listeners = createJobEventListeners();

		final UserId userId = new UserId("jobson-run-info");
		log.debug("Submitting job request");

		validateAPIRequest(jobSubmissionRequest, filesystemJobSpecDAO, userId)
				.visit(createResultVisitor(jobManager, listeners));

	}

	private JobEventListeners createJobEventListeners() {
		return JobEventListeners.create(new Observer<byte[]>() {
			@Override
			public void onSubscribe(@NonNull Disposable disposable) {
			}

			@Override
			public void onNext(@NonNull byte[] bytes) {
				try {
					System.out.write(bytes);
				} catch (IOException ex) {
					throw new RuntimeException(ex);
				}
			}

			@Override
			public void onError(@NonNull Throwable throwable) {
				System.err.println("Error in stdout: " + throwable.toString());
				System.exit(1);
			}

			@Override
			public void onComplete() {
				System.exit(0);
			}
		}, new Observer<byte[]>() {
			@Override
			public void onSubscribe(@NonNull Disposable disposable) {
			}

			@Override
			public void onNext(@NonNull byte[] bytes) {
				try {
					System.out.write(bytes);
				} catch (IOException ex) {
					throw new RuntimeException(ex);
				}
			}

			@Override
			public void onError(@NonNull Throwable throwable) {
				System.err.println("Error in stderr: " + throwable.toString());
				System.exit(1);
			}

			@Override
			public void onComplete() {
				System.exit(0);
			}
		});
	}

	private EitherVisitor<ValidJobRequest, List<ValidationError>> createResultVisitor(JobManager jobManager,
			JobEventListeners listeners) {

		return new EitherVisitor<ValidJobRequest, List<ValidationError>>() {
			@Override
			public void whenLeft(ValidJobRequest left) {
				try {
					final FinalizedJob f = jobManager.submit(left, listeners).getRight().get();
					System.exit(f.getFinalStatus().toExitCode());
				} catch (Exception ex) {
					System.err.println("Error encountered: " + ex.toString());
					System.exit(1);
				}
			}

			@Override
			public void whenRight(List<ValidationError> right) {
				System.err.println("Invalid request: " + commaSeparatedList(right));
				System.exit(1);
			}
		};
	}

}
