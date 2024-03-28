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

package com.flowkraft.jobson.jobs.execution;

import java.nio.file.Path;
import java.util.Collections;

import com.flowkraft.jobson.TestHelpers;
import com.flowkraft.jobson.fixtures.PersistedJobRequestFixture;
import com.flowkraft.jobson.jobs.JobExecutor;
import com.flowkraft.jobson.jobs.jobstates.PersistedJob;
import com.flowkraft.jobson.specs.ExecutionConfiguration;
import com.flowkraft.jobson.specs.JobDependencyConfiguration;
import com.flowkraft.jobson.specs.JobSpec;

public abstract class JobExecutorTest {

    private static final PersistedJob STANDARD_REQUEST;


    private static PersistedJob readJobRequestFixture(String path) {
        final PersistedJobRequestFixture fixture =
                TestHelpers.readJSONFixture(path, PersistedJobRequestFixture.class);
        return fixture.toPersistedJobRequest();
    }

    protected static PersistedJob createStandardRequestWithDependency(JobDependencyConfiguration dependency) {
        final JobSpec existingSpec = STANDARD_REQUEST.getSpec();
        final ExecutionConfiguration newExecutionConfig =
                existingSpec.getExecution().withDependencies(Collections.singletonList(dependency));

        return STANDARD_REQUEST
                .withSpec(existingSpec.withExecutionConfiguration(newExecutionConfig));
    }

    protected static PersistedJob createStandardRequest() {
        return STANDARD_REQUEST;
    }


    static {
        STANDARD_REQUEST = readJobRequestFixture("fixtures/jobson/job/execution/valid-persisted-request.json");
    }


    protected abstract JobExecutor getInstance() throws Exception;
    protected abstract JobExecutor getInstance(Path workingDir) throws Exception;

    /*
    Most of these tests are running Unix info which are failing on Windows

    @Test
    public void testExecuteReturnsExpectedPromiseForValidReq() throws Throwable {
        final JobExecutor jobExecutor = getInstance();
        final CancelablePromise<JobExecutionResult> ret =
                jobExecutor.execute(STANDARD_REQUEST, createNullListeners());

        assertThat(ret).isNotNull();

        promiseAssert(ret, result ->
                assertThat(result.getFinalStatus()).isEqualTo(JobStatus.FINISHED));
    }

    @Test
    public void testExecutePromiseResolvesWithFatalErrorForFailingCommand() throws Throwable {
        final JobExecutor jobExecutor = getInstance();
        final PersistedJob req =
                standardRequestWithCommand("cat", "does-not-exist");
        final CancelablePromise<JobExecutionResult> ret =
                jobExecutor.execute(req, createNullListeners());

        promiseAssert(ret, result ->
                assertThat(result.getFinalStatus()).isEqualTo(JobStatus.FATAL_ERROR));
    }

    @Test
    public void testExecutePromiseResolvesWithAbortedIfPromiseIsCancelled() throws Throwable {
        final JobExecutor jobExecutor = getInstance();
        final PersistedJob req = standardRequestWithCommand("sleep", "100");
        final CancelablePromise<JobExecutionResult> ret =
                jobExecutor.execute(req, createNullListeners());

        promiseAssert(
                ret,
                result -> assertThat(result.getFinalStatus()).isEqualTo(JobStatus.ABORTED),
                () -> ret.cancel(true));
    }

    @Test
    public void testExecutePromiseResolvesCompletedIfApplicationReadsFromStdin() throws Throwable {
        // jobson should close `stdin`, so that any application
        // attempting to read from stdin reads nothing (rather than
        // deadlocking indefinitely on content Jobson will never
        // write)
        //
        // see: https://github.com/adamkewley/jobson/issues/67
        //
        // (abstract): user ran an application that reads from stdin
        // in certain circumstances and Jobson was deadlocking on that
        final JobExecutor jobExecutor = getInstance();
        final PersistedJob req = standardRequestWithCommand("cat");  // reads from stdin
        final CancelablePromise<JobExecutionResult> ret =
                jobExecutor.execute(req, createNullListeners());

        promiseAssert(
                ret,
                result -> assertThat(result.getFinalStatus()).isEqualTo(JobStatus.FINISHED),
                () -> ret.cancel(true));
    }

    @Test
    public void testExecutePromiseResolvesWithTheOutputsWrittenByTheApplication() throws Throwable {
        final JobExecutor jobExecutor = getInstance();

        final RawTemplateString outputId = new RawTemplateString("outfile");
        final RawTemplateString outputPath = outputId;


        final JobExpectedOutput expectedOutput = generateJobOutput(outputId, outputPath, "text/plain");
        final List<JobExpectedOutput> expectedOutputs = Collections.singletonList(expectedOutput);

        final PersistedJob req =
                standardRequestWithExpectedOutputs(expectedOutputs, "touch", outputPath.toString());

        final CancelablePromise<JobExecutionResult> ret = jobExecutor.execute(req, createNullListeners());

        promiseAssert(
                ret,
                result -> {
                    assertThat(result.getOutputs()).isNotEmpty();

                    final Optional<JobOutput> maybeJobOutput = getJobOutputById(result.getOutputs(), new JobOutputId(outputId.toString()));
                    assertThat(maybeJobOutput).isPresent();

                    final JobOutput jobOutput = maybeJobOutput.get();
                    assertThat(jobOutput.getData().getSizeOf()).isEqualTo(0);
                    assertThat(jobOutput.getDescription()).isEqualTo(expectedOutput.getDescription());
                    assertThat(jobOutput.getName()).isEqualTo(expectedOutput.getName());
                },
                () -> {});
    }

    private Optional<JobOutput> getJobOutputById(List<JobOutputResult> jobOutputs, JobOutputId jobOutputId) {
        final JobOutputResultVisitorT<Optional<JobOutput>> visitor = new JobOutputResultVisitorT<Optional<JobOutput>>() {
            @Override
            public Optional<JobOutput> visit(MissingOutput missingOutput) {
                return Optional.empty();
            }

            @Override
            public Optional<JobOutput> visit(JobOutput jobOutput) {
                return Optional.of(jobOutput);
            }
        };

        return jobOutputs.stream()
                .map(jobOutputResult -> jobOutputResult.accept(visitor))
                .filter(Optional::isPresent)
                .map(Optional::get)
                .filter(jobOutput -> jobOutput.getId().equals(jobOutputId))
                .findFirst();
    }

    @Test
    public void testExecutePromiseResolvesWithMissingOutputs() throws Exception {
        final String firstId = "should-exist";
        final JobExpectedOutput expectedOutputThatShouldExist =
                generateJobOutput(new RawTemplateString(firstId), new RawTemplateString(firstId), "text/plain");
        final String secondId = "shouldnt-exist";
        final JobExpectedOutput expectedOutputThatIsMissing =
                generateJobOutput(new RawTemplateString(secondId), new RawTemplateString(secondId), "text/plain");
        final String thirdId = "shouldnt-exist-and-required";
        final JobExpectedOutput expectedOutputThatIsMissingAndRequired =
                generateRequiredJobOutput(new RawTemplateString(thirdId), new RawTemplateString(secondId), "text/plain");


        final PersistedJob req =
                standardRequestWithExpectedOutputs(
                        Arrays.asList(
                                expectedOutputThatShouldExist,
                                expectedOutputThatIsMissing,
                                expectedOutputThatIsMissingAndRequired),
                        "touch",
                        firstId);

        final JobExecutor executor = getInstance();


        final JobExecutionResult ret = executor.execute(req, createNullListeners()).get();

        assertThat(ret.getFinalStatus()).isEqualTo(JobStatus.FINISHED);
        assertThat(ret.getOutputs()).hasSize(3);

        final JobOutputResult first = ret.getOutputs().get(0);

        assertThat(first).isInstanceOf(JobOutput.class);
        assertThat(((JobOutput)first).getId().toString()).isEqualTo(firstId);



        final JobOutputResult second = ret.getOutputs().get(1);

        assertThat(second).isInstanceOf(MissingOutput.class);
        assertThat(((MissingOutput)second).getId().toString()).isEqualTo(secondId);
        assertThat(((MissingOutput)second).isRequired()).isFalse();


        final JobOutputResult third = ret.getOutputs().get(2);

        assertThat(third).isInstanceOf(MissingOutput.class);
        assertThat(((MissingOutput)third).getId().toString()).isEqualTo(thirdId);
        assertThat(((MissingOutput)third).isRequired()).isTrue();
    }

    @Test
    public void testExecutePromiseResolvesWithTheExepectedOutputData() throws Throwable {
        final JobExecutor jobExecutor = getInstance();

        final byte[] randomNoise = generateRandomBytes();
        final Path tmpFile = createTempFile(JobExecutorTest.class.getSimpleName(), "");
        Files.write(tmpFile, randomNoise);

        final RawTemplateString outputIdTemplateString = new RawTemplateString("out");
        final JobOutputId outputId = new JobOutputId(outputIdTemplateString.toString());
        final RawTemplateString outputPath = new RawTemplateString(outputId.toString());

        final List<JobExpectedOutput> expectedOutputs = Collections.singletonList(
                new JobExpectedOutput(outputIdTemplateString, outputPath, "application/octet-stream"));

        final PersistedJob jobRequest =
                standardRequestWithExpectedOutputs(
                        expectedOutputs,
                        "cp",
                        tmpFile.toAbsolutePath().toString(),
                        outputPath.toString());

        final CancelablePromise<JobExecutionResult> ret =
                jobExecutor.execute(jobRequest, createNullListeners());

        promiseAssert(
                ret,
                result -> {
                    assertThat(result.getOutputs()).isNotEmpty();
                    assertThat(getJobOutputById(result.getOutputs(), outputId)).isPresent();
                    assertThat(getJobOutputById(result.getOutputs(), outputId).get().getData().getSizeOf()).isEqualTo(randomNoise.length);
                    try {
                        assertThat(IOUtils.toByteArray(getJobOutputById(result.getOutputs(), outputId).get().getData().getData())).isEqualTo(randomNoise);
                    } catch (IOException ex) {
                        throw new RuntimeException(ex);
                    }

                },
                () -> {});
    }

    @Test
    public void testSettingAnAbsoluteExpectedOutputWorksIfItExists() throws Throwable {
        final JobExecutor jobExecutor = getInstance();

        final Path absTmpDirPath = Files.createTempDirectory(JobExecutorTest.class.getSimpleName()).toAbsolutePath();
        final RawTemplateString outputId = new RawTemplateString("outfile");
        final RawTemplateString outputPath = new RawTemplateString(absTmpDirPath.resolve(outputId.toString()).toString());


        final JobExpectedOutput expectedOutput = generateJobOutput(outputId, outputPath, "text/plain");
        final List<JobExpectedOutput> expectedOutputs = Collections.singletonList(expectedOutput);

        final PersistedJob req =
                standardRequestWithExpectedOutputs(expectedOutputs, "touch", outputPath.toString());

        final CancelablePromise<JobExecutionResult> ret = jobExecutor.execute(req, createNullListeners());

        promiseAssert(
                ret,
                result -> {
                    assertThat(result.getOutputs()).isNotEmpty();
                    assertThat(getJobOutputById(result.getOutputs(), new JobOutputId(outputId.toString()))).isPresent();
                },
                () -> {});
    }

    @Test
    public void testSettingAnAbsoluteExpectedOutputWorksIfItDoesntExist() throws Throwable {
        final JobExecutor jobExecutor = getInstance();

        final Path absTmpDirPath = Files.createTempDirectory(JobExecutorTest.class.getSimpleName()).toAbsolutePath();
        final RawTemplateString outputId = new RawTemplateString("outfile");
        final RawTemplateString outputPath = new RawTemplateString(absTmpDirPath.resolve(outputId.toString()).toString());


        final JobExpectedOutput expectedOutput = generateJobOutput(outputId, outputPath, "text/plain");
        final List<JobExpectedOutput> expectedOutputs = Collections.singletonList(expectedOutput);

        final PersistedJob req =
                standardRequestWithExpectedOutputs(expectedOutputs, "touch", "some-unrelated-path");

        final CancelablePromise<JobExecutionResult> ret = jobExecutor.execute(req, createNullListeners());

        ret.get();
    }

    @Test
    public void testSettingAnAbsoluteExpectedOutputWorksIfItDoesntExistANDTheExecutorIsUsingARelativeWorkingDirectory() throws Throwable {
        final JobExecutor jobExecutor = getInstance(java.nio.file.Paths.get(".").toAbsolutePath());

        final Path absTmpDirPath = Files.createTempDirectory(JobExecutorTest.class.getSimpleName()).toAbsolutePath();
        final RawTemplateString outputId = new RawTemplateString("outfile");
        final RawTemplateString outputPath = new RawTemplateString(absTmpDirPath.resolve(outputId.toString()).toString());


        final JobExpectedOutput expectedOutput = generateJobOutput(outputId, outputPath, "text/plain");
        final List<JobExpectedOutput> expectedOutputs = Collections.singletonList(expectedOutput);

        final PersistedJob req =
                standardRequestWithExpectedOutputs(expectedOutputs, "touch", "some-unrelated-path");

        final CancelablePromise<JobExecutionResult> ret = jobExecutor.execute(req, createNullListeners());

        ret.get(5, TimeUnit.SECONDS);
    }


    @Test
    public void testExecuteWritesStdoutToTheStdoutListener() throws Throwable {
        final JobExecutor jobExecutor = getInstance();
        final String msgSuppliedToEcho = generateRandomString();
        final PersistedJob req =
                standardRequestWithCommand("echo", msgSuppliedToEcho);
        final AtomicReference<byte[]> bytesEchoedToStdout = new AtomicReference<>(new byte[]{});
        final Subject<byte[]> stdoutSubject = PublishSubject.create();

        stdoutSubject.subscribe(bytes ->
                bytesEchoedToStdout.getAndUpdate(existingBytes ->
                        Bytes.concat(existingBytes, bytes)));

        final Semaphore s = new Semaphore(1);
        s.acquire();
        stdoutSubject.doOnComplete(s::release).subscribe();

        final JobEventListeners listeners =
                createStdoutListener(stdoutSubject);

        jobExecutor.execute(req, listeners);

        s.tryAcquire(TestConstants.DEFAULT_TIMEOUT, MILLISECONDS);

        final String stringFromStdout = new String(bytesEchoedToStdout.get()).trim();
        assertThat(stringFromStdout).isEqualTo(msgSuppliedToEcho);
    }

    @Test
    public void testExecuteStdoutListenerIsCalledWithCompletedOnceApplicationExecutionEnds() throws Throwable {
        final JobExecutor jobExecutor = getInstance();
        final AtomicBoolean completedCalled = new AtomicBoolean(false);
        final Subject<byte[]> stdoutSubject = PublishSubject.create();
        stdoutSubject.doOnComplete(() -> completedCalled.set(true)).subscribe();
        final JobEventListeners listeners = createStdoutListener(stdoutSubject);
        final CancelablePromise<JobExecutionResult> ret =
                jobExecutor.execute(STANDARD_REQUEST, listeners);

        promiseAssert(ret, result -> {
            try {
                // The stdout thread can race with the exit thread
                Thread.sleep(50);
                assertThat(completedCalled.get()).isTrue();
            } catch (InterruptedException ignored) {}
        });
    }

    @Test
    public void testExecuteWritesStderrToTheStderrListener() throws Throwable {
        final JobExecutor jobExecutor = getInstance();
        final String msgSuppliedToEcho = generateRandomString();
        final String bashArg = "echo " + msgSuppliedToEcho + " 1>&2"; // TODO: Naughty.
        final PersistedJob req =
                standardRequestWithCommand("bash", "-c", bashArg);
        final AtomicReference<byte[]> bytesEchoedToStderr = new AtomicReference<>(new byte[]{});
        final Subject<byte[]> stderrSubject = PublishSubject.create();

        stderrSubject.subscribe(bytes ->
                bytesEchoedToStderr.getAndUpdate(existingBytes ->
                        Bytes.concat(existingBytes, bytes)));

        final Semaphore s = new Semaphore(1);
        s.acquire();
        stderrSubject.doOnComplete(s::release).subscribe();

        final JobEventListeners listeners =
                createStderrListener(stderrSubject);

        jobExecutor.execute(req, listeners);

        s.tryAcquire(TestConstants.DEFAULT_TIMEOUT, MILLISECONDS);

        final String stringFromStderr = new String(bytesEchoedToStderr.get()).trim();
        assertThat(stringFromStderr).isEqualTo(msgSuppliedToEcho);
    }

    @Test
    public void testExecuteStderrListenerIsCompletedOnceApplicationExecutionEnds() throws Throwable {
        final JobExecutor jobExecutor = getInstance();
        final AtomicBoolean completedCalled = new AtomicBoolean(false);
        final Subject<byte[]> stderrSubject = PublishSubject.create();
        stderrSubject.doOnComplete(() -> completedCalled.set(true)).subscribe();
        final JobEventListeners listeners = createStderrListener(stderrSubject);
        final CancelablePromise<JobExecutionResult> ret =
                jobExecutor.execute(STANDARD_REQUEST, listeners);

        promiseAssert(ret, result -> {
            try {
                // The stderr thread can race with the exit thread
                Thread.sleep(50);
                assertThat(completedCalled.get()).isTrue();
            } catch (InterruptedException ignored) {}
        });
    }

    @Test
    public void testExecuteEvaluatesJobInputsAsExpected() throws Exception {
        final JobExecutor jobExecutor = getInstance();
        final PersistedJob req =
                standardRequestWithCommand("echo", "${inputs.foo}");
        final AtomicReference<byte[]> bytesEchoedToStdout = new AtomicReference<>(new byte[]{});
        final Subject<byte[]> stdoutSubject = PublishSubject.create();

        stdoutSubject.subscribe(bytes ->
                bytesEchoedToStdout.getAndUpdate(existingBytes ->
                        Bytes.concat(existingBytes, bytes)));

        final Semaphore s = new Semaphore(1);
        s.acquire();
        stdoutSubject.doOnComplete(s::release).subscribe();

        final JobEventListeners listeners =
                createStdoutListener(stdoutSubject);

        jobExecutor.execute(req, listeners);

        s.tryAcquire(TestConstants.DEFAULT_TIMEOUT, MILLISECONDS);

        final String stringFromStdout = new String(bytesEchoedToStdout.get()).trim();
        assertThat(stringFromStdout).isEqualTo("a"); // from spec
    }

    @Test
    public void testExecuteEvaluatesToJSONFunctionAsExpected() throws Exception {
        final JobExecutor jobExecutor = getInstance();
        final PersistedJob req =
                standardRequestWithCommand("echo", "${toJSON(inputs)}");
        final AtomicReference<byte[]> bytesEchoedToStdout = new AtomicReference<>(new byte[]{});
        final Subject<byte[]> stdoutSubject = PublishSubject.create();

        stdoutSubject.subscribe(bytes ->
                bytesEchoedToStdout.getAndUpdate(existingBytes ->
                        Bytes.concat(existingBytes, bytes)));

        final Semaphore s = new Semaphore(1);
        s.acquire();
        stdoutSubject.doOnComplete(s::release).subscribe();

        final JobEventListeners listeners =
                createStdoutListener(stdoutSubject);

        jobExecutor.execute(req, listeners);

        s.tryAcquire(TestConstants.DEFAULT_TIMEOUT, MILLISECONDS);

        final String stringFromStdout = new String(bytesEchoedToStdout.get()).trim();

        TestHelpers.assertJSONEqual(stringFromStdout, toJSON(STANDARD_REQUEST.getInputs()));
    }

    @Test
    public void testExecuteEvaluatesToFileAsExpected() throws Exception {
        final JobExecutor jobExecutor = getInstance();
        final PersistedJob req =
                standardRequestWithCommand("echo", "${toFile(toJSON(inputs))}");
        final AtomicReference<byte[]> bytesEchoedToStdout = new AtomicReference<>(new byte[]{});
        final Subject<byte[]> stdoutSubject = PublishSubject.create();

        stdoutSubject.subscribe(bytes ->
                bytesEchoedToStdout.getAndUpdate(existingBytes ->
                        Bytes.concat(existingBytes, bytes)));

        final Semaphore s = new Semaphore(1);
        s.acquire();
        stdoutSubject.doOnComplete(s::release).subscribe();

        final JobEventListeners listeners =
                createStdoutListener(stdoutSubject);

        jobExecutor.execute(req, listeners);

        s.tryAcquire(TestConstants.DEFAULT_TIMEOUT, MILLISECONDS);

        final String stringFromStdout = new String(bytesEchoedToStdout.get()).trim();
        final Path p = java.nio.file.Paths.get(stringFromStdout);

        assertThat(p.toFile().exists());

        final String loadedJson = new String(Files.readAllBytes(p));

        TestHelpers.assertJSONEqual(loadedJson, toJSON(STANDARD_REQUEST.getInputs()));
    }

    @Test
    public void testExecuteEvaluatesJoinAsExpected() throws Exception {
        final JobExecutor jobExecutor = getInstance();
        final PersistedJob req =
                standardRequestWithCommand("echo", "${join(',', inputs.someList)}");
        final AtomicReference<byte[]> bytesEchoedToStdout = new AtomicReference<>(new byte[]{});
        final Subject<byte[]> stdoutSubject = PublishSubject.create();
        stdoutSubject.subscribe(bytes ->
                bytesEchoedToStdout.getAndUpdate(existingBytes ->
                        Bytes.concat(existingBytes, bytes)));

        final Semaphore s = new Semaphore(1);
        s.acquire();
        stdoutSubject.doOnComplete(s::release).subscribe();

        final JobEventListeners listeners =
                createStdoutListener(stdoutSubject);

        jobExecutor.execute(req, listeners);

        s.tryAcquire(TestConstants.DEFAULT_TIMEOUT, MILLISECONDS);

        final String stringFromStdout = new String(bytesEchoedToStdout.get()).trim();

        assertThat(stringFromStdout).isEqualTo("a,b,c,d"); // From the input fixture
    }

    @Test
    public void testExecuteEvaluatesToStringAsExpected() throws Exception {
        final JobExecutor jobExecutor = getInstance();
        final PersistedJob req =
                standardRequestWithCommand("echo", "${toString(inputs.someString)}");
        final AtomicReference<byte[]> bytesEchoedToStdout = new AtomicReference<>(new byte[]{});
        final Subject<byte[]> stdoutSubject = PublishSubject.create();
        stdoutSubject.subscribe(bytes ->
                bytesEchoedToStdout.getAndUpdate(existingBytes ->
                        Bytes.concat(existingBytes, bytes)));

        final Semaphore s = new Semaphore(1);
        s.acquire();
        stdoutSubject.doOnComplete(s::release).subscribe();

        final JobEventListeners listeners =
                createStdoutListener(stdoutSubject);

        jobExecutor.execute(req, listeners);

        s.tryAcquire(TestConstants.DEFAULT_TIMEOUT, MILLISECONDS);

        final String stringFromStdout = new String(bytesEchoedToStdout.get()).trim();

        assertThat(stringFromStdout).isEqualTo("hello, world!"); // from input fixture
    }

    @Test
    public void testExecuteEvaluatesOutputDirAsExpected() throws Exception {
        final JobExecutor jobExecutor = getInstance();
        final PersistedJob req =
                standardRequestWithCommand("echo", "${outputDir}");
        final AtomicReference<byte[]> bytesEchoedToStdout = new AtomicReference<>(new byte[]{});
        final Subject<byte[]> stdoutSubject = PublishSubject.create();
        stdoutSubject.subscribe(bytes ->
                bytesEchoedToStdout.getAndUpdate(existingBytes ->
                        Bytes.concat(existingBytes, bytes)));

        final Semaphore s = new Semaphore(1);
        s.acquire();
        stdoutSubject.doOnComplete(s::release).subscribe();

        final JobEventListeners listeners =
                createStdoutListener(stdoutSubject);

        jobExecutor.execute(req, listeners);

        s.tryAcquire(TestConstants.DEFAULT_TIMEOUT, MILLISECONDS);

        final String stringFromStdout = new String(bytesEchoedToStdout.get()).trim();

        assertThat(Files.exists(java.nio.file.Paths.get(stringFromStdout)));
    }

    @Test
    public void testExecuteEvaluatesTemplateStringsInTheExpectedOutputs() throws Throwable {
        final JobExecutor jobExecutor = getInstance();

        final RawTemplateString rawTemplateIdStr = new RawTemplateString("${request.id}");
        final RawTemplateString rawTemplatePathStr = new RawTemplateString("${toString('foo')}");
        final JobExpectedOutput jobExpectedOutput = new JobExpectedOutput(rawTemplateIdStr, rawTemplatePathStr, "application/octet-stream");
        final List<JobExpectedOutput> expectedOutputs = Collections.singletonList(jobExpectedOutput);

        final PersistedJob req =
                standardRequestWithExpectedOutputs(expectedOutputs, "touch", "foo");

        final JobEventListeners listeners = createNullListeners();

        promiseAssert(
                jobExecutor.execute(req, listeners),
                result -> {
                    assertThat(result.getOutputs()).isNotEmpty();

                    final JobOutputId expectedOutputIdAfterEvaluation =
                            new JobOutputId(STANDARD_REQUEST.getId().toString());

                    final Optional<JobOutput> maybeJobOutput =
                            getJobOutputById(result.getOutputs(), expectedOutputIdAfterEvaluation);

                    assertThat(maybeJobOutput).isPresent();

                    final JobOutput jobOutput = maybeJobOutput.get();

                    assertThat(jobOutput.getId().toString()).isEqualTo(req.getId().toString());
                });
    }
     */

}
