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

import static com.flowkraft.jobson.Constants.DELAY_BEFORE_FORCIBLY_KILLING_JOBS_IN_MILLISECONDS;
import static com.flowkraft.jobson.TestHelpers.createTmpDir;

import java.io.IOException;
import java.nio.file.Path;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import com.flowkraft.jobson.jobs.JobExecutor;
import com.flowkraft.jobson.jobs.LocalJobExecutor;

public final class LocalJobExecutorTest extends JobExecutorTest {

	@Override
	protected JobExecutor getInstance() throws Exception {
		try {
			LocalJobExecutor jobExecutor = new LocalJobExecutor();
			jobExecutor.setup(createTmpDir(LocalJobExecutorTest.class),
					DELAY_BEFORE_FORCIBLY_KILLING_JOBS_IN_MILLISECONDS);
			return jobExecutor;
		} catch (IOException e) {
			throw new RuntimeException(e);
		}
	}

	@Override
	protected JobExecutor getInstance(Path workingDir) throws Exception {
		try {
			LocalJobExecutor jobExecutor = new LocalJobExecutor();
			jobExecutor.setup(workingDir.relativize(createTmpDir(LocalJobExecutorTest.class)),
					DELAY_BEFORE_FORCIBLY_KILLING_JOBS_IN_MILLISECONDS);
			return jobExecutor;

		} catch (IOException e) {
			throw new RuntimeException(e);
		}
	}

	/*
	@Test
	public void testCtorThrowsIfWorkingDirsDoesNotExist() throws Exception {
		
		//Assertions.assertThrows(FileNotFoundException.class, () -> {
			LocalJobExecutor jobExecutor = new LocalJobExecutor();
			jobExecutor.setup(java.nio.file.Paths.get(generateAlphanumStr()), DELAY_BEFORE_FORCIBLY_KILLING_JOBS_IN_MILLISECONDS);
		//});

	}
	*/
	
	@Test
	public void testCtorThrowsIfWorkingDirsIsNull() {

		Assertions.assertThrows(NullPointerException.class, () -> {
			LocalJobExecutor jobExecutor = new LocalJobExecutor();
			jobExecutor.setup(null, DELAY_BEFORE_FORCIBLY_KILLING_JOBS_IN_MILLISECONDS);
		});
	}
	
	@Test
	public void testCtorThrowsIfDelayIsNegative() throws IOException {
		
		Assertions.assertThrows(IllegalArgumentException.class, () -> {
			LocalJobExecutor jobExecutor = new LocalJobExecutor();
			jobExecutor.setup(createTmpDir(LocalJobExecutorTest.class), -1);
		});

	}

	/*
		Most of the following is executing Unix specific commands which
		are failing on Windows
	
	@Test
	public void testFileDependencyIsCopiedWithExecutePermissionsMaintained()
			throws Exception {
		final File someFile = File.createTempFile("dependencytest", "");
		assertThat(someFile.canExecute()).isFalse();
		someFile.setExecutable(true);
		final Path source = someFile.toPath().toAbsolutePath();

		final Path workingDir = createTmpDir(LocalJobExecutor.class);
		final Path dest = workingDir.resolve("copied-file");

		final JobDependencyConfiguration dep = new JobDependencyConfiguration(source.toString(), dest.toString());
		final PersistedJob job = createStandardRequestWithDependency(dep);

		LocalJobExecutor jobExecutor = new LocalJobExecutor();
		jobExecutor.setup(workingDir,
				DELAY_BEFORE_FORCIBLY_KILLING_JOBS_IN_MILLISECONDS);
	
		final CancelablePromise<JobExecutionResult> p = jobExecutor.execute(job,
				JobEventListeners.createNullListeners());

		p.get();

		final File destAfterCopy = new File(dest.toString());

		assertThat(destAfterCopy.canExecute()).isTrue();
	}

	@Test
	public void testDirectoryDependencyIsCopiedWithFileExecutePermissionMaintained()
			throws Exception {
		final Path sourceDir = Files.createTempDirectory(JobExecutorTest.class.getSimpleName());
		final String filenameOfExecutableFileInSrcDir = "some-file-with-exec-permissions";
		final File fileInSourceDir = Files.createFile(sourceDir.resolve(filenameOfExecutableFileInSrcDir)).toFile();
		fileInSourceDir.setExecutable(true);

		final Path workingDir = createTmpDir(LocalJobExecutor.class);
		final Path dest = workingDir.resolve("copied-dir");

		final JobDependencyConfiguration dep = new JobDependencyConfiguration(sourceDir.toAbsolutePath().toString(),
				dest.toAbsolutePath().toString());
		final PersistedJob job = createStandardRequestWithDependency(dep);

		LocalJobExecutor jobExecutor = new LocalJobExecutor();
		jobExecutor.setup(workingDir,
				DELAY_BEFORE_FORCIBLY_KILLING_JOBS_IN_MILLISECONDS);
	
		final CancelablePromise<JobExecutionResult> p = jobExecutor.execute(job,
				JobEventListeners.createNullListeners());

		p.get();

		final File fileAfterCopy = new File(dest.resolve(filenameOfExecutableFileInSrcDir).toString());

		assertThat(fileAfterCopy.canExecute()).isTrue();
	}

	@Test
	public void testSoftlinkedFileDependencyIsSoftLinkedFromTheDestinationToTheSource()
			throws Exception {
		final Path sourceDir = Files.createTempDirectory(JobExecutorTest.class.getSimpleName());
		final Path sourceFile = Files.createFile(sourceDir.resolve(generateAlphanumStr()));

		final Path workingDir = Files.createTempDirectory(LocalJobExecutorTest.class.getSimpleName());
		final Path destination = workingDir.resolve(generateAlphanumStr());

		final JobDependencyConfiguration dep = new JobDependencyConfiguration(sourceFile.toString(),
				destination.toString(), true);

		final PersistedJob job = createStandardRequestWithDependency(dep);

		LocalJobExecutor jobExecutor = new LocalJobExecutor();
		jobExecutor.setup(workingDir,
				DELAY_BEFORE_FORCIBLY_KILLING_JOBS_IN_MILLISECONDS);
	
		final CancelablePromise<JobExecutionResult> p = jobExecutor.execute(job,
				JobEventListeners.createNullListeners());

		p.get();

		assertThat(Files.isSymbolicLink(destination)).isTrue();
		assertThat(Files.readSymbolicLink(destination)).isEqualTo(sourceFile);
	}

	@Test
	public void testWdRemovalConfigEnabledCausesWorkingDirectoriesToBeRemovedAfterTheJobCompletes()
			throws Exception {
		// FIXME: This test is a bit of a hack to get around the job pipeline not being
		// cleanly architected
		// it lets the job run + finish, but then needs to wait a while (1 sec) for the
		// wd cleanup to happen
		final Path workingDir = Files.createTempDirectory(LocalJobExecutorTest.class.getSimpleName());

		final RemoveAfterExecutionConfig config = new RemoveAfterExecutionConfig(true);

		LocalJobExecutor jobExecutor = new LocalJobExecutor();
		jobExecutor.setup(workingDir,
				DELAY_BEFORE_FORCIBLY_KILLING_JOBS_IN_MILLISECONDS, config);
	
		final PersistedJob req = createStandardRequest();

		// It's on a bg thread so that the job finalization can also get a chance to
		// kick off
		final Thread t = new Thread(() -> {
			final CancelablePromise<JobExecutionResult> p = jobExecutor.execute(req,
					JobEventListeners.createNullListeners());

			try {
				p.get();
			} catch (Exception ex) {
			}
		});

		t.start();
		t.join();

		Thread.sleep(1000);

		assertThat(workingDir.resolve(req.getId().toString()).toFile().exists()).isFalse();
	}

	@Test
	public void testTemplatedDependencySourceIsResolvedAsATemplateString()
			throws Exception {
		final String templatedSource = "${request.id}";
		final Path actualSourceDir = Files.createTempDirectory(JobExecutorTest.class.getSimpleName());
		final String templatedSourcePath = actualSourceDir.resolve(templatedSource).toString();

		final Path jobsDir = Files.createTempDirectory(LocalJobExecutorTest.class.getSimpleName());
		final String destinationName = generateAlphanumStr();
		final JobDependencyConfiguration dep = new JobDependencyConfiguration(templatedSourcePath, destinationName);
		final PersistedJob job = createStandardRequestWithDependency(dep);

		final Path pathToSourceFileContainingJobId = Files.createFile(actualSourceDir.resolve(job.getId().toString())); // The
																														// template,
		final byte[] bytesInSourceFileNamedByJobId = TestHelpers.generateRandomBytes();
		Files.write(pathToSourceFileContainingJobId, bytesInSourceFileNamedByJobId);

		LocalJobExecutor jobExecutor = new LocalJobExecutor();
		jobExecutor.setup(jobsDir,
				DELAY_BEFORE_FORCIBLY_KILLING_JOBS_IN_MILLISECONDS);
	
		final CancelablePromise<JobExecutionResult> p = jobExecutor.execute(job,
				JobEventListeners.createNullListeners());

		p.get();

		final Path destinationPath = jobsDir.resolve(job.getId().toString()).resolve(destinationName);

		final byte[] bytesInOutputFile = Files.readAllBytes(destinationPath);

		assertThat(Files.exists(destinationPath)).isTrue();
		assertThat(bytesInOutputFile).isEqualTo(bytesInSourceFileNamedByJobId);
	}

	@Test
	public void testTemplatedDependencyDestinationIsResolvedAsATemplateArg()
			throws Exception {
		final Path sourceDir = Files.createTempDirectory(JobExecutorTest.class.getSimpleName());
		final Path sourceFile = Files.createFile(sourceDir.resolve(generateAlphanumStr()));
		final byte[] sourceBytes = TestHelpers.generateRandomBytes();
		Files.write(sourceFile, sourceBytes);

		final String templatedDestinationName = "${request.id}";
		final JobDependencyConfiguration dep = new JobDependencyConfiguration(sourceFile.toString(),
				templatedDestinationName);

		final PersistedJob job = createStandardRequestWithDependency(dep);
		final Path workingDir = Files.createTempDirectory(LocalJobExecutorTest.class.getSimpleName());
		LocalJobExecutor jobExecutor = new LocalJobExecutor();
		jobExecutor.setup(workingDir,
				DELAY_BEFORE_FORCIBLY_KILLING_JOBS_IN_MILLISECONDS);
	
		final CancelablePromise<JobExecutionResult> p = jobExecutor.execute(job,
				JobEventListeners.createNullListeners());

		p.get();

		final Path expectedDestination = workingDir.resolve(job.getId().toString()).resolve(job.getId().toString());

		assertThat(expectedDestination.toFile().exists()).isTrue();

		final byte[] bytesInDestination = Files.readAllBytes(expectedDestination);

		assertThat(bytesInDestination).isEqualTo(sourceBytes);
	}

	@Test
	public void testTemplatedDependencySourceCanBeResolvedWithJobInputs()
			throws Exception {
		final String templatedSource = "${inputs.foo}"; // In fixture: resolves to 'a'
		final Path actualSourceDir = Files.createTempDirectory(JobExecutorTest.class.getSimpleName());
		final String templatedSourcePath = actualSourceDir.resolve(templatedSource).toString();

		final Path workingDir = Files.createTempDirectory(LocalJobExecutorTest.class.getSimpleName());
		final Path destination = workingDir.resolve(generateAlphanumStr());
		final JobDependencyConfiguration dep = new JobDependencyConfiguration(templatedSourcePath,
				destination.toString());
		final PersistedJob job = createStandardRequestWithDependency(dep);

		final Path pathToSourceFileNamedByInput = Files.createFile(actualSourceDir.resolve("a")); // "a" comes from the
																									// fixture
		final byte[] bytesInSourceFileNamedByJobId = TestHelpers.generateRandomBytes();
		Files.write(pathToSourceFileNamedByInput, bytesInSourceFileNamedByJobId);

		LocalJobExecutor jobExecutor = new LocalJobExecutor();
		jobExecutor.setup(workingDir,
				DELAY_BEFORE_FORCIBLY_KILLING_JOBS_IN_MILLISECONDS);
	
		final CancelablePromise<JobExecutionResult> p = jobExecutor.execute(job,
				JobEventListeners.createNullListeners());

		p.get();

		final byte[] bytesInOutputFile = Files.readAllBytes(destination);

		assertThat(Files.exists(destination)).isTrue();
		assertThat(bytesInOutputFile).isEqualTo(bytesInSourceFileNamedByJobId);
	}

	@Test
	public void testTemplatedDependencyDestinationCanBeResolvedWithInputs()
			throws Exception {
		final Path sourceDir = Files.createTempDirectory(JobExecutorTest.class.getSimpleName());
		final Path sourceFile = Files.createFile(sourceDir.resolve(generateAlphanumStr()));
		final byte[] sourceBytes = TestHelpers.generateRandomBytes();
		Files.write(sourceFile, sourceBytes);

		final String templatedDestinationName = "${inputs.foo}"; // This is set in fixture
		final JobDependencyConfiguration dep = new JobDependencyConfiguration(sourceFile.toString(),
				templatedDestinationName);

		final PersistedJob job = createStandardRequestWithDependency(dep);
		final Path jobsDir = Files.createTempDirectory(LocalJobExecutorTest.class.getSimpleName());
		LocalJobExecutor jobExecutor = new LocalJobExecutor();
		jobExecutor.setup(jobsDir,
				DELAY_BEFORE_FORCIBLY_KILLING_JOBS_IN_MILLISECONDS);
	
		final CancelablePromise<JobExecutionResult> p = jobExecutor.execute(job,
				JobEventListeners.createNullListeners());

		p.get();

		final Path expectedDestination = jobsDir.resolve(job.getId().toString()).resolve("a"); // "a" comes from fixture

		assertThat(expectedDestination.toFile().exists()).isTrue();

		final byte[] bytesInDestination = Files.readAllBytes(expectedDestination);

		assertThat(bytesInDestination).isEqualTo(sourceBytes);
	}
	*/
}