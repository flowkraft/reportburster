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

package com.flowkraft.jobson.jobs.management;

import static com.flowkraft.jobson.TestConstants.DEFAULT_TIMEOUT;
import static com.flowkraft.jobson.TestHelpers.STANDARD_VALID_REQUEST;
import static com.flowkraft.jobson.TestHelpers.generateRandomBytes;
import static com.flowkraft.jobson.jobs.JobEventListeners.createNullListeners;
import static com.flowkraft.jobson.jobs.JobStatus.ABORTED;
import static com.flowkraft.jobson.jobs.JobStatus.FATAL_ERROR;
import static com.flowkraft.jobson.jobs.JobStatus.FINISHED;
import static com.flowkraft.jobson.jobs.JobStatus.RUNNING;
import static com.flowkraft.jobson.jobs.JobStatus.SUBMITTED;
import static com.flowkraft.jobson.utils.BinaryData.wrap;
import static java.util.Arrays.asList;
import static java.util.concurrent.TimeUnit.MILLISECONDS;
import static java.util.concurrent.TimeUnit.SECONDS;
import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;
import java.util.function.Supplier;

import org.apache.commons.lang3.tuple.Pair;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import com.flowkraft.jobson.Constants;
import com.flowkraft.jobson.TestHelpers;
import com.flowkraft.jobson.dao.jobs.WritingJobDAO;
import com.flowkraft.jobson.jobs.JobEventListeners;
import com.flowkraft.jobson.jobs.JobExecutionResult;
import com.flowkraft.jobson.jobs.JobExecutor;
import com.flowkraft.jobson.jobs.JobId;
import com.flowkraft.jobson.jobs.JobManager;
import com.flowkraft.jobson.jobs.JobOutput;
import com.flowkraft.jobson.jobs.JobOutputResult;
import com.flowkraft.jobson.jobs.JobStatus;
import com.flowkraft.jobson.jobs.MissingOutput;
import com.flowkraft.jobson.jobs.jobstates.FinalizedJob;
import com.flowkraft.jobson.jobs.jobstates.ValidJobRequest;
import com.flowkraft.jobson.specs.JobExpectedOutput;
import com.flowkraft.jobson.specs.JobOutputId;
import com.flowkraft.jobson.specs.JobSpec;
import com.flowkraft.jobson.specs.RawTemplateString;
import com.flowkraft.jobson.utils.CancelablePromise;
import com.flowkraft.jobson.utils.SimpleCancelablePromise;
import com.flowkraft.jobson.websockets.v1.JobEvent;

import io.reactivex.Observable;
import io.reactivex.Observer;
import io.reactivex.annotations.NonNull;
import io.reactivex.disposables.Disposable;
import io.reactivex.subjects.PublishSubject;
import io.reactivex.subjects.ReplaySubject;
import io.reactivex.subjects.Subject;

public final class JobManagerTest {

	private static JobManager createStandardManager() {
		return createManagerWith(new MockInMemoryJobWriter(),
				MockJobExecutor.thatResolvesWith(new JobExecutionResult(FINISHED)));
	}

	private static JobManager createManagerWith(JobExecutor jobExecutor) {
		return createManagerWith(new MockInMemoryJobWriter(), jobExecutor);
	}

	private static JobManager createManagerWith(JobExecutor jobExecutor, int maxRunningJobs) {
		return createManagerWith(new MockInMemoryJobWriter(), jobExecutor, maxRunningJobs);
	}

	private static JobManager createManagerWith(WritingJobDAO dao) {
		return createManagerWith(dao, MockJobExecutor.thatResolvesWith(new JobExecutionResult(FINISHED)));
	}

	private static JobManager createManagerWith(WritingJobDAO dao, JobExecutor executor) {
		return createManagerWith(dao, executor, Constants.MAX_CONCURRENT_JOBS);
	}

	private static JobManager createManagerWith(WritingJobDAO dao, JobExecutor executor, int maxRunningJobs) {
		JobManager jobManager = new JobManager();
		jobManager.setup(dao, executor, maxRunningJobs);
		return jobManager;
	}

	@Test
	public void testGetAllJobStatusChangesReturnsAnObservable() {
		final JobManager jobManager = createStandardManager();
		assertThat(jobManager.allJobStatusChanges()).isNotNull();
	}

	@Test
	public void testGetAllJobStatusChangesObservableEmitsExpectedEvents()
			throws InterruptedException, ExecutionException, TimeoutException {
		final JobExecutionResult executorResult = new JobExecutionResult(FINISHED);
		final JobExecutor executor = MockJobExecutor.thatResolvesWith(executorResult);
		final JobManager jobManager = createManagerWith(executor);

		final List<JobStatus> statusesEmitted = new ArrayList<>();
		jobManager.allJobStatusChanges().map(JobEvent::getNewStatus).subscribe(statusesEmitted::add);

		final Pair<JobId, CancelablePromise<FinalizedJob>> ret = jobManager.submit(STANDARD_VALID_REQUEST);

		ret.getRight().get(DEFAULT_TIMEOUT, MILLISECONDS);

		assertThat(statusesEmitted).isEqualTo(asList(SUBMITTED, RUNNING, FINISHED));
	}

	@Test
	public void testGetAllJobStatusChangesObservableEmitsExpectedEventsWhenError()
			throws InterruptedException, ExecutionException, TimeoutException {
		final JobExecutionResult executorResult = new JobExecutionResult(FATAL_ERROR);
		final JobExecutor executor = MockJobExecutor.thatResolvesWith(executorResult);
		final JobManager jobManager = createManagerWith(executor);

		final List<JobStatus> statusesEmitted = new ArrayList<>();
		jobManager.allJobStatusChanges().map(JobEvent::getNewStatus).subscribe(statusesEmitted::add);

		final Pair<JobId, CancelablePromise<FinalizedJob>> ret = jobManager.submit(STANDARD_VALID_REQUEST);

		ret.getRight().get(DEFAULT_TIMEOUT, MILLISECONDS);

		assertThat(statusesEmitted).isEqualTo(asList(SUBMITTED, RUNNING, FATAL_ERROR));
	}

	@Test
	public void testGetAllJobStatusChangesObservableEmitsExpectedEventsWhenAborted()
			throws InterruptedException, ExecutionException, TimeoutException {
		final JobExecutionResult executorResult = new JobExecutionResult(ABORTED);
		final JobExecutor executor = MockJobExecutor.thatResolvesWith(executorResult);
		final JobManager jobManager = createManagerWith(executor);

		final List<JobStatus> statusesEmitted = new ArrayList<>();
		jobManager.allJobStatusChanges().map(JobEvent::getNewStatus).subscribe(statusesEmitted::add);

		final Pair<JobId, CancelablePromise<FinalizedJob>> ret = jobManager.submit(STANDARD_VALID_REQUEST);

		ret.getRight().get(DEFAULT_TIMEOUT, MILLISECONDS);

		assertThat(statusesEmitted).isEqualTo(asList(SUBMITTED, RUNNING, ABORTED));
	}

	@Test
	public void testGetStdoutUpdatesReturnsEmptyForNonExistentJob() {
		final JobManager jobManager = createStandardManager();
		assertThat(jobManager.stdoutUpdates(TestHelpers.generateJobId())).isNotPresent();
	}

	@Test
	public void testGetStdoutUpdatesReturnsObservableForNotYetFinishedJob() {
		final CancelablePromise<JobExecutionResult> executorPromise = new SimpleCancelablePromise<>();
		final JobExecutor executor = MockJobExecutor.thatUses(executorPromise);
		final JobManager jobManager = createManagerWith(executor);

		final JobId jobId = jobManager.submit(STANDARD_VALID_REQUEST).getLeft();

		assertThat(jobManager.stdoutUpdates(jobId)).isPresent();
	}

	@Test
	public void testGetStdoutUpdatesReturnsEmptyForFinishedJob() {
		final CancelablePromise<JobExecutionResult> executorPromise = new SimpleCancelablePromise<>();
		final JobExecutor executor = MockJobExecutor.thatUses(executorPromise);
		final JobManager jobManager = createManagerWith(executor);

		final JobId jobId = jobManager.submit(STANDARD_VALID_REQUEST).getLeft();

		executorPromise.complete(new JobExecutionResult(FINISHED));

		assertThat(jobManager.stdoutUpdates(jobId)).isNotPresent();
	}

	@Test
	public void testGetStdoutUpdatesEchoesUpdatesFromExecutorObservers()
			throws InterruptedException, ExecutionException, TimeoutException {
		final CancelablePromise<JobExecutionResult> executorPromise = new SimpleCancelablePromise<>();
		final Subject<byte[]> stdoutSubject = PublishSubject.create();
		final JobExecutor executor = MockJobExecutor.thatUses(executorPromise, stdoutSubject,
				Observable.just(TestHelpers.generateRandomBytes()));
		final JobManager jobManager = createManagerWith(executor);

		final Pair<JobId, CancelablePromise<FinalizedJob>> ret = jobManager.submit(STANDARD_VALID_REQUEST);

		final Observable<byte[]> stdoutObservable = jobManager.stdoutUpdates(ret.getLeft()).get();

		final AtomicReference<byte[]> bytesFromObservable = new AtomicReference<>();
		stdoutObservable.subscribe(bytesFromObservable::set);

		final byte[] bytesExpected = TestHelpers.generateRandomBytes();
		stdoutSubject.onNext(bytesExpected);

		executorPromise.complete(new JobExecutionResult(FINISHED));

		ret.getRight().get(DEFAULT_TIMEOUT, MILLISECONDS);

		assertThat(bytesFromObservable.get()).isEqualTo(bytesExpected);
	}

	@Test
	public void testGetStderrUpdatesReturnsEmptyForNonExistentJob() {
		final JobManager jobManager = createStandardManager();
		assertThat(jobManager.stderrUpdates(TestHelpers.generateJobId())).isNotPresent();
	}

	@Test
	public void testGetStderrUpdatesReturnsObservableForNotYetFinishedJob() {
		final CancelablePromise<JobExecutionResult> executorPromise = new SimpleCancelablePromise<>();
		final JobExecutor executor = MockJobExecutor.thatUses(executorPromise);
		final JobManager jobManager = createManagerWith(executor);

		final JobId jobId = jobManager.submit(STANDARD_VALID_REQUEST).getLeft();

		assertThat(jobManager.stderrUpdates(jobId)).isPresent();
	}

	@Test
	public void testGetStderrUpdatesReturnsEmptyForFinishedJob() {
		final CancelablePromise<JobExecutionResult> executorPromise = new SimpleCancelablePromise<>();
		final JobExecutor executor = MockJobExecutor.thatUses(executorPromise);
		final JobManager jobManager = createManagerWith(executor);

		final JobId jobId = jobManager.submit(STANDARD_VALID_REQUEST).getLeft();

		executorPromise.complete(new JobExecutionResult(FINISHED));

		assertThat(jobManager.stderrUpdates(jobId)).isNotPresent();
	}

	@Test
	public void testGetStderrUpdatesEchoesUpdatesFromExecutorObservers()
			throws InterruptedException, ExecutionException, TimeoutException {
		final CancelablePromise<JobExecutionResult> executorPromise = new SimpleCancelablePromise<>();
		final Subject<byte[]> stderrSubject = PublishSubject.create();
		final JobExecutor executor = MockJobExecutor.thatUses(executorPromise,
				Observable.just(TestHelpers.generateRandomBytes()), stderrSubject);
		final JobManager jobManager = createManagerWith(executor);

		final Pair<JobId, CancelablePromise<FinalizedJob>> ret = jobManager.submit(STANDARD_VALID_REQUEST);

		final Observable<byte[]> stderrObservable = jobManager.stderrUpdates(ret.getLeft()).get();

		final AtomicReference<byte[]> bytesFromObservable = new AtomicReference<>();
		stderrObservable.subscribe(bytesFromObservable::set);

		final byte[] bytesExpected = TestHelpers.generateRandomBytes();
		stderrSubject.onNext(bytesExpected);

		executorPromise.complete(new JobExecutionResult(FINISHED));

		ret.getRight().get(DEFAULT_TIMEOUT, MILLISECONDS);

		assertThat(bytesFromObservable.get()).isEqualTo(bytesExpected);
	}

	// Submit /w listeners

	@Test
	public void testSubmitThrowsIfArgsNull() {

		final JobManager jobManager = createStandardManager();

		Assertions.assertThrows(NullPointerException.class, () -> {
			jobManager.submit(null, createNullListeners());
		});

		Assertions.assertThrows(NullPointerException.class, () -> {

			jobManager.submit(STANDARD_VALID_REQUEST, null);
		});

	}

	@Test
	public void testSubmitReturnsExpectedReturnForValidRequest()
			throws InterruptedException, ExecutionException, TimeoutException {
		final JobManager jobManager = createStandardManager();
		final Pair<JobId, CancelablePromise<FinalizedJob>> ret = jobManager.submit(STANDARD_VALID_REQUEST,
				createNullListeners());

		assertThat(ret).isNotNull();
		assertThat(ret.getLeft()).isNotNull();
		assertThat(ret.getRight()).isNotNull();
		assertThat(ret.getRight().get(DEFAULT_TIMEOUT, MILLISECONDS)).isNotNull();
	}

	@Test
	public void testSubmitReturnsJobIdProducedByDAO() {
		final MockInMemoryJobWriter dao = new MockInMemoryJobWriter();
		final JobManager jobManager = createManagerWith(dao);
		final JobId ret = jobManager.submit(STANDARD_VALID_REQUEST, createNullListeners()).getLeft();

		assertThat(ret).isEqualTo(dao.getReturnedPersistedReq().getId());
	}

	@Test
	public void testSubmitPromiseResolvesWhenExecutorPromiseResolves()
			throws InterruptedException, ExecutionException, TimeoutException {
		final CancelablePromise<JobExecutionResult> p = new SimpleCancelablePromise<>();
		final JobExecutor jobExecutor = MockJobExecutor.thatUses(p);
		final JobManager jobManager = createManagerWith(jobExecutor);

		final CancelablePromise<FinalizedJob> ret = jobManager.submit(STANDARD_VALID_REQUEST, createNullListeners())
				.getRight();

		p.complete(JobExecutionResult.fromExitCode(0));

		assertThat(ret.get(DEFAULT_TIMEOUT, MILLISECONDS)).isNotNull();
	}

	@Test
	public void testSubmitJobEventListenersEchoStdoutWhenExecutorEchoesStdout() throws InterruptedException {
		final Subject<byte[]> stdoutSubject = ReplaySubject.create();
		final byte[] expectedStdoutBytes = generateRandomBytes();
		stdoutSubject.onNext(expectedStdoutBytes);

		final JobExecutor jobExecutor = MockJobExecutor.thatUses(stdoutSubject, Observable.never());
		final JobManager jobManager = createManagerWith(jobExecutor);

		final Semaphore s = new Semaphore(1);
		s.acquire();

		final JobEventListeners listeners = JobEventListeners.createStdoutListener(new Observer<byte[]>() {
			@Override
			public void onSubscribe(@NonNull Disposable disposable) {
			}

			@Override
			public void onNext(@NonNull byte[] bytes) {
				assertThat(bytes).isEqualTo(expectedStdoutBytes);
				s.release();
			}

			@Override
			public void onError(@NonNull Throwable throwable) {
				Assertions.fail("Error from observable");
				s.release();
			}

			@Override
			public void onComplete() {
			}
		});

		jobManager.submit(STANDARD_VALID_REQUEST, listeners);

		if (!s.tryAcquire(1, SECONDS)) {
			Assertions.fail("Timed out before any bytes received");
		}
	}

	@Test
	public void testSubmitJobEventListenersEchoStderrWhenExecutorEchoesStderr() throws InterruptedException {
		final Subject<byte[]> stderr = ReplaySubject.create();
		final byte[] stderrBytes = generateRandomBytes();
		stderr.onNext(stderrBytes);

		final JobExecutor jobExecutor = MockJobExecutor.thatUses(Observable.never(), stderr);
		final JobManager jobManager = createManagerWith(jobExecutor);

		final Semaphore s = new Semaphore(1);
		s.acquire();

		final JobEventListeners listeners = JobEventListeners.createStderrListener(new Observer<byte[]>() {
			@Override
			public void onSubscribe(@NonNull Disposable disposable) {
			}

			@Override
			public void onNext(@NonNull byte[] bytes) {
				assertThat(bytes).isEqualTo(stderrBytes);
				s.release();
			}

			@Override
			public void onError(@NonNull Throwable throwable) {
				Assertions.fail("Error from observable");
				s.release();
			}

			@Override
			public void onComplete() {
			}
		});

		jobManager.submit(STANDARD_VALID_REQUEST, listeners);

		if (!s.tryAcquire(1, SECONDS)) {
			Assertions.fail("Timed out before any bytes received");
		}
	}

	// Submit w/o listeners

	@Test
	public void testSubmitThrowsIfJobRequestIsNull() {
		final JobManager jobManager = createStandardManager();

		Assertions.assertThrows(NullPointerException.class, () -> {
			jobManager.submit(null);
		});

	}

	@Test
	public void testSubmitReturnsExpectedReturnForValidRequest2()
			throws InterruptedException, ExecutionException, TimeoutException {
		final JobManager jobManager = createStandardManager();
		final Pair<JobId, CancelablePromise<FinalizedJob>> ret = jobManager.submit(STANDARD_VALID_REQUEST);

		assertThat(ret).isNotNull();
		assertThat(ret.getLeft()).isNotNull();
		assertThat(ret.getRight()).isNotNull();
		assertThat(ret.getRight().get(DEFAULT_TIMEOUT, MILLISECONDS)).isNotNull();
	}

	@Test
	public void testSubmitReturnsJobIdProducedByDAO2() {
		final MockInMemoryJobWriter dao = new MockInMemoryJobWriter();
		final JobManager jobManager = createManagerWith(dao);
		final JobId ret = jobManager.submit(STANDARD_VALID_REQUEST).getLeft();

		assertThat(ret).isEqualTo(dao.getReturnedPersistedReq().getId());
	}

	@Test
	public void testSubmitPromiseResolvesWhenExecutorPromiseResolves2()
			throws InterruptedException, ExecutionException, TimeoutException {
		final CancelablePromise<JobExecutionResult> p = new SimpleCancelablePromise<>();
		final JobExecutor jobExecutor = MockJobExecutor.thatUses(p);
		final JobManager jobManager = createManagerWith(jobExecutor);

		final CancelablePromise<FinalizedJob> ret = jobManager.submit(STANDARD_VALID_REQUEST).getRight();

		p.complete(JobExecutionResult.fromExitCode(0));

		assertThat(ret.get(DEFAULT_TIMEOUT, MILLISECONDS)).isNotNull();
	}

	@Test
	public void testTryAbortReturnsFalseForNonExistentJob() {
		final JobManager jobManager = createStandardManager();
		assertThat(jobManager.tryAbort(TestHelpers.generateJobId())).isFalse();
	}

	@Test
	public void testTryAbortReturnsFalseForACompletedJob()
			throws InterruptedException, ExecutionException, TimeoutException {
		final JobManager jobManager = createStandardManager();

		final Pair<JobId, CancelablePromise<FinalizedJob>> ret = jobManager.submit(STANDARD_VALID_REQUEST);

		ret.getRight().get(DEFAULT_TIMEOUT, MILLISECONDS);

		assertThat(jobManager.tryAbort(ret.getLeft())).isFalse();
	}

	@Test
	public void testTryAbortReturnsTrueForARunningJob() {
		final CancelablePromise<JobExecutionResult> executorPromise = new SimpleCancelablePromise<>();
		final JobManager jobManager = createManagerWith(MockJobExecutor.thatUses(executorPromise));

		final Pair<JobId, CancelablePromise<FinalizedJob>> ret = jobManager.submit(STANDARD_VALID_REQUEST);

		assertThat(jobManager.tryAbort(ret.getLeft())).isTrue();

		// TODO: Check status is aborted.
	}

	@Test
	public void testSubmitPersistsJobOutputsAfterExecution()
			throws InterruptedException, ExecutionException, TimeoutException {
		final CancelablePromise<JobExecutionResult> executorPromise = new SimpleCancelablePromise<>();
		final MockInMemoryJobWriter writingJobDAO = new MockInMemoryJobWriter();

		final JobManager jobManager = createManagerWith(writingJobDAO, MockJobExecutor.thatUses(executorPromise));

		final byte[] executorOutputBytes = generateRandomBytes();
		final List<JobOutputResult> outputsFromExecutor = new ArrayList<>();

		for (JobExpectedOutput expectedOutput : STANDARD_VALID_REQUEST.getSpec().getExpectedOutputs()) {
			if (expectedOutput.getMimeType().isPresent()) {
				outputsFromExecutor.add(new JobOutput(new JobOutputId(expectedOutput.getId().toString()),
						wrap(executorOutputBytes, expectedOutput.getMimeType().get()), expectedOutput.getName(),
						expectedOutput.getDescription(), expectedOutput.getMetadata()));
			} else {
				outputsFromExecutor.add(new JobOutput(new JobOutputId(expectedOutput.getId().toString()),
						wrap(executorOutputBytes), expectedOutput.getName(), expectedOutput.getDescription(),
						expectedOutput.getMetadata()));
			}
		}

		final JobExecutionResult jobExecutionResult = new JobExecutionResult(FINISHED, outputsFromExecutor);

		final CancelablePromise<FinalizedJob> p = jobManager.submit(STANDARD_VALID_REQUEST).getRight();

		executorPromise.complete(jobExecutionResult);

		p.get(DEFAULT_TIMEOUT, MILLISECONDS);

		for (JobExpectedOutput output : STANDARD_VALID_REQUEST.getSpec().getExpectedOutputs()) {
			final PersistOutputArgs expectedArgs = new PersistOutputArgs(
					writingJobDAO.getReturnedPersistedReq().getId(), new JobOutputId(output.getId().toString()),
					wrap(executorOutputBytes, output.getMimeType().orElse("application/octet-stream")));

			assertThat(writingJobDAO.getPersistOutputCalledWith()).contains(expectedArgs);
		}
	}

	@Test
	public void testFailsIfARequiredOutputDoesNotExistInExecutionResult()
			throws InterruptedException, ExecutionException, TimeoutException {
		final CancelablePromise<JobExecutionResult> executorPromise = new SimpleCancelablePromise<>();
		final MockInMemoryJobWriter writingJobDAO = new MockInMemoryJobWriter();
		final JobManager jobManager = createManagerWith(writingJobDAO, MockJobExecutor.thatUses(executorPromise));

		final String jobOutputId = "some-id";
		final String jobOutputPath = "some-non-existent-path";

		final JobExpectedOutput expectedOutput = new JobExpectedOutput(new RawTemplateString(jobOutputId),
				new RawTemplateString("some-non-existent-path"), Optional.empty(), Optional.empty(), Optional.empty(),
				Collections.emptyMap(), true);

		final JobSpec jobSpec = STANDARD_VALID_REQUEST.getSpec()
				.withExpectedOutputs(Collections.singletonList(expectedOutput));
		final ValidJobRequest jobRequest = STANDARD_VALID_REQUEST.withSpec(jobSpec);

		final JobExecutionResult result = new JobExecutionResult(JobStatus.FINISHED,
				Collections.singletonList(new MissingOutput(new JobOutputId(jobOutputId), true, jobOutputPath)));
		final Pair<JobId, CancelablePromise<FinalizedJob>> submissionReturn = jobManager.submit(jobRequest);
		final JobId jobId = submissionReturn.getLeft();
		final CancelablePromise<FinalizedJob> p = submissionReturn.getRight();
		executorPromise.complete(result);

		final FinalizedJob finalJobState = p.get();
		final List<AddNewJobStatusArgs> addNewJobStatusArgs = writingJobDAO.getAddNewJobStatusArgsCalledWith();

		assertThat(finalJobState.getFinalStatus()).isEqualTo(JobStatus.FATAL_ERROR);

		final boolean anyStatusUpdateContainsMissingOutput = addNewJobStatusArgs.stream()
				.map(AddNewJobStatusArgs::getStatusMessage)
				.anyMatch(msg -> msg.toLowerCase().contains("missing required output"));

		assertThat(anyStatusUpdateContainsMissingOutput);
	}

	@Test
	public void testJobManagerAdvancesJobQueueOnceAJobFinishesExecuting()
			throws InterruptedException, ExecutionException, TimeoutException {
		final AtomicBoolean isFirst = new AtomicBoolean(true);
		final SimpleCancelablePromise<JobExecutionResult> firstExcutionPromise = new SimpleCancelablePromise<>();
		final SimpleCancelablePromise<JobExecutionResult> secondExecutionPromise = new SimpleCancelablePromise<>();

		final Supplier<CancelablePromise<JobExecutionResult>> promiseSupplier = () -> isFirst.getAndSet(false)
				? firstExcutionPromise
				: secondExecutionPromise;

		final MockJobExecutor mockJobExecutor = MockJobExecutor.thatUses(promiseSupplier);

		final int maxRunningJobs = 1;

		final JobManager jobManager = createManagerWith(mockJobExecutor, maxRunningJobs);

		final CancelablePromise<FinalizedJob> firstJobPromise = jobManager.submit(STANDARD_VALID_REQUEST).getRight();
		final CancelablePromise<FinalizedJob> secondJobPromise = jobManager.submit(STANDARD_VALID_REQUEST).getRight();

		firstExcutionPromise.complete(new JobExecutionResult(FINISHED));
		firstJobPromise.get(1, TimeUnit.SECONDS);

		secondExecutionPromise.complete(new JobExecutionResult(FINISHED));
		secondJobPromise.get(1, TimeUnit.SECONDS);
	}
}