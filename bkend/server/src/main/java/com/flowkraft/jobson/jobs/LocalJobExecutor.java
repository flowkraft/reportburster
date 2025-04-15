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

package com.flowkraft.jobson.jobs;

import static com.flowkraft.jobson.Helpers.attachTo;
import static com.flowkraft.jobson.Helpers.mapKeys;
import static com.flowkraft.jobson.Helpers.streamBinaryData;
import static com.flowkraft.jobson.jobs.JobStatus.FINISHED;
import static java.lang.String.format;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

import javax.annotation.PostConstruct;

import org.apache.commons.io.FileUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.flowkraft.common.AppPaths;
import com.flowkraft.jobson.Constants;
import com.flowkraft.jobson.Helpers;
import com.flowkraft.jobson.config.ApplicationConfig;
import com.flowkraft.jobson.config.RemoveAfterExecutionConfig;
import com.flowkraft.jobson.jobinputs.JobExpectedInputId;
import com.flowkraft.jobson.jobs.jobstates.PersistedJob;
import com.flowkraft.jobson.scripting.functions.JoinFunction;
import com.flowkraft.jobson.scripting.functions.ToDirFunction;
import com.flowkraft.jobson.scripting.functions.ToFileFunction;
import com.flowkraft.jobson.scripting.functions.ToJSONFunction;
import com.flowkraft.jobson.scripting.functions.ToStringFunction;
import com.flowkraft.jobson.specs.ExecutionConfiguration;
import com.flowkraft.jobson.specs.JobDependencyConfiguration;
import com.flowkraft.jobson.specs.JobExpectedOutput;
import com.flowkraft.jobson.specs.JobOutputId;
import com.flowkraft.jobson.specs.RawTemplateString;
import com.flowkraft.jobson.utils.BinaryData;
import com.flowkraft.jobson.utils.CancelablePromise;
import com.flowkraft.jobson.utils.SimpleCancelablePromise;

/**
 * Executes a job submission as a local subprocess.
 */
@Component
public final class LocalJobExecutor implements JobExecutor {

	private static final Logger log = LoggerFactory.getLogger(LocalJobExecutor.class);

	@Autowired
	ApplicationConfig appConfig;

	public static String resolveArg(PersistedJob persistedJob, Path jobWorkingDir, RawTemplateString arg) {
		final Map<String, Object> environment = new HashMap<>();

		environment.put("toJSON", new ToJSONFunction());
		environment.put("toFile", new ToFileFunction(jobWorkingDir));
		environment.put("join", new JoinFunction());
		environment.put("toString", new ToStringFunction());
		environment.put("request", persistedJob);
		environment.put("inputs", mapKeys(persistedJob.getInputs(), JobExpectedInputId::toString));
		environment.put("outputDir", jobWorkingDir.toString());
		environment.put("toDir", new ToDirFunction(jobWorkingDir));

		return arg.tryEvaluate(environment);
	}

	private static void handleJobDependency(PersistedJob persistedJob, Path workingDir,
			JobDependencyConfiguration jobDependencyConfiguration) {
		final String resolvedSourceStr = resolveArg(persistedJob, workingDir, jobDependencyConfiguration.getSource());
		final Path source = java.nio.file.Paths.get(resolvedSourceStr);

		final String resolvedTargetStr = resolveArg(persistedJob, workingDir, jobDependencyConfiguration.getTarget());
		final Path target = workingDir.resolve(resolvedTargetStr);

		if (jobDependencyConfiguration.isSoftLink()) {
			softLinkJobDependency(source, target);
		} else {
			copyJobDependency(source, target);
		}
	}

	private static void softLinkJobDependency(Path source, Path destination) {
		log.debug("softlink dependency: " + source.toString() + " -> " + destination.toString());
		try {
			Files.createSymbolicLink(destination, source);
		} catch (UnsupportedOperationException | IOException ex) {
			log.error(source.toString() + ": cannot create soft link: " + ex.toString());
		}
	}

	private static void copyJobDependency(Path source, Path destination) {
		log.debug("copy dependency: " + source.toString() + " -> " + destination.toString());
		try {
			Helpers.copyPath(source, destination);
		} catch (IOException ex) {
			log.error(source.toString() + ": cannot copy: " + ex.toString());
			throw new RuntimeException(ex);
		}
	}

	private Path workingDirs;
	private long delayBeforeForciblyKillingJobs;
	private boolean deleteWdAfterExecution;

	public void setup(Path workingDirs, long delayBeforeForciblyKillingJobs) throws Exception {

		setup(workingDirs, delayBeforeForciblyKillingJobs, new RemoveAfterExecutionConfig(false));

	}

	public void setup(Path workingDirs, long delayBeforeForciblyKillingJobs, RemoveAfterExecutionConfig wdRemovalConfig)
			throws Exception {

		if (!workingDirs.toFile().exists()) {
			Files.createDirectory(workingDirs);
			// throw new FileNotFoundException(workingDirs + ": does not exist");

		}

		if (delayBeforeForciblyKillingJobs < 0)
			throw new IllegalArgumentException(
					delayBeforeForciblyKillingJobs + ": delay before killing jobs must be positive");

		this.workingDirs = workingDirs;
		this.delayBeforeForciblyKillingJobs = delayBeforeForciblyKillingJobs;

		this.deleteWdAfterExecution = wdRemovalConfig.isEnabled();

	}

	@PostConstruct
	private void _init() throws Exception {

		setup(java.nio.file.Paths.get(AppPaths.WORKSPACE_DIR_PATH + this.appConfig.getWorkingDirs().getDir()).toAbsolutePath(),
				appConfig.getExecution().getDelayBeforeForciblyKillingJobs().toMillis(),
				appConfig.getWorkingDirs().getRemoveAfterExecution());

	}

	@Override
	public CancelablePromise<JobExecutionResult> execute(PersistedJob req, JobEventListeners jobEventListeners) {
		final ExecutionConfiguration executionConfiguration = req.getSpec().getExecution();

		try {
			final Path workingDir = workingDirs.resolve(req.getId().toString());
			Files.createDirectory(workingDir);
			log.debug(req.getId() + ": created working directory: " + workingDir.toString());

			executionConfiguration.getDependencies()
					.ifPresent(deps -> deps.forEach(dep -> handleJobDependency(req, workingDir, dep)));

			final String application = executionConfiguration.getApplication();
			final List<String> argList = new ArrayList<>();
			argList.add(application);

			log.debug(req.getId() + ": resolving args");

			executionConfiguration.getArguments().ifPresent(
					args -> args.stream().map(arg -> resolveArg(req, workingDir, arg)).forEach(argList::add));

			final ProcessBuilder processBuilder = new ProcessBuilder(argList);

			processBuilder.directory(workingDir.toFile());

			log.debug(req.getId() + ": launch subprocess: " + String.join(" ", argList));

			final Process runningProcess = processBuilder.start();

			// close process's stdin stream. If this isn't done, the
			// child process will block if it tries to read from stdin
			// (because it's connected to jobson's stdin, which isn't
			// being used)
			//
			// see https://github.com/adamkewley/jobson/issues/67 for
			// a breakdown of the kinds of problems this can create
			runningProcess.getOutputStream().close();

			log.info(req.getId() + ": launched: " + String.join(" ", argList));

			final SimpleCancelablePromise<JobExecutionResult> ret = new SimpleCancelablePromise<>();
			ret.onCancel(() -> abort(runningProcess));

			attachTo(runningProcess, jobEventListeners.getOnStdoutListener(), jobEventListeners.getOnStderrListener(),
					exitCode -> onProcessExit(req, workingDir, ret, exitCode));

			return ret;

		} catch (Exception ex) {
			log.error(req.getId() + ": cannot start: " + ex.toString());
			throw new RuntimeException(ex);
		}
	}

	private void onProcessExit(PersistedJob req, Path workingDir, SimpleCancelablePromise<JobExecutionResult> promise,
			int exitCode) {

		final JobStatus exitStatus = JobStatus.fromExitCode(exitCode);

		final JobExecutionResult jobExecutionResult;
		if (exitStatus == FINISHED) {
			final List<JobOutputResult> outputs = tryResolveJobOutputs(req, workingDir,
					req.getSpec().getExpectedOutputs());
			jobExecutionResult = new JobExecutionResult(exitStatus, outputs);
		} else {
			jobExecutionResult = new JobExecutionResult(exitStatus);
		}

		promise.complete(jobExecutionResult);

		//System.out.println("Received 'onProcessExit' in LocalJobExecutor and jobExecutionResult = "
		//		+ jobExecutionResult.toString());

		if (this.deleteWdAfterExecution) {

			try {

				//System.out.println(
				//		format("deleteWdAfterExecution is true so try removing : %s", workingDir.toAbsolutePath()));

				// FileUtils.deleteDirectory(workingDir.toFile());
				FileUtils.forceDelete(workingDir.toFile());

			} catch (IOException e) {
				//System.out.println(format("Tried to remove a working directory, %s, but couldn't: %s", workingDir,
				//		e.getMessage()));

				log.warn(format("Tried to remove a working directory, %s, but couldn't: %s", workingDir,
						e.getMessage()));
			}
		}
	}

	private List<JobOutputResult> tryResolveJobOutputs(PersistedJob req, Path workingDir,
			List<JobExpectedOutput> expectedOutputs) {

		return expectedOutputs.stream().map(e -> {
			final JobOutputId jobOutputId = new JobOutputId(resolveArg(req, workingDir, e.getId()));
			return tryGetJobOutput(workingDir, req, jobOutputId, e);
		}).collect(Collectors.toList());
	}

	private JobOutputResult tryGetJobOutput(Path workingDir, PersistedJob job, JobOutputId outputId,
			JobExpectedOutput expectedOutput) {
		final Path expectedOutputFile = workingDir.resolve(resolveArg(job, workingDir, expectedOutput.getPath()));

		if (expectedOutputFile.toFile().exists()) {
			final String mimeType = establishMimeType(expectedOutput, expectedOutputFile);
			final BinaryData data = streamBinaryData(expectedOutputFile, mimeType);
			return new JobOutput(outputId, data, expectedOutput.getName(), expectedOutput.getDescription(),
					expectedOutput.getMetadata());
		} else {
			return new MissingOutput(outputId, expectedOutput.isRequired(),
					expectedOutputFile.relativize(workingDir).toString());
		}
	}

	private String establishMimeType(JobExpectedOutput jobExpectedOutput, Path p) {
		if (jobExpectedOutput.getMimeType().isPresent()) {
			return jobExpectedOutput.getMimeType().get();
		} else {
			try {
				return Helpers.getMimeType(Files.newInputStream(p), p.toString());
			} catch (IOException ex) {
				log.warn("Encountered IO error when determining an output's MIME type. Skipping MIME type detection");
				return Constants.DEFAULT_BINARY_MIME_TYPE;
			}
		}
	}

	private void abort(Process process) {
		log.debug("Aborting process: " + process);

		process.destroy();

		try {
			final boolean terminated = process.waitFor(delayBeforeForciblyKillingJobs, TimeUnit.MILLISECONDS);

			//System.out.println("Aborting process: " + process + ", terminated: " + terminated);

			if (!terminated) {
				log.warn(process + " did not abort within " + delayBeforeForciblyKillingJobs
						+ " seconds, aborting forcibly (SIGKILL)");
				process.destroyForcibly();
			}
		} catch (InterruptedException e) {
			log.error("Abortion interrupted while waiting on process (this shouldn't happen)");
		}
	}
}
