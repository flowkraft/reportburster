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

package com.flowkraft.jobson.dao.jobs;

import static com.flowkraft.jobson.Constants.JOB_DIR_JOB_DETAILS_FILENAME;
import static com.flowkraft.jobson.Constants.JOB_DIR_OUTPUTS_DIRNAME;
import static com.flowkraft.jobson.Helpers.readJSON;
import static com.flowkraft.jobson.Helpers.tryResolve;
import static com.flowkraft.jobson.TestHelpers.STANDARD_VALID_REQUEST;
import static com.flowkraft.jobson.TestHelpers.createTmpDir;
import static com.flowkraft.jobson.TestHelpers.generateJobId;
import static com.flowkraft.jobson.TestHelpers.generateRandomBytes;
import static com.flowkraft.jobson.TestHelpers.generateRandomJobOutput;
import static org.assertj.core.api.Assertions.assertThat;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Optional;

import org.apache.commons.io.FileUtils;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import com.flowkraft.jobson.Constants;
import com.flowkraft.jobson.Helpers;
import com.flowkraft.jobson.TestHelpers;
import com.flowkraft.jobson.jobs.JobId;
import com.flowkraft.jobson.jobs.JobOutput;
import com.flowkraft.jobson.jobs.jobstates.PersistedJob;
import com.flowkraft.jobson.jobs.jobstates.ValidJobRequest;
import com.flowkraft.jobson.specs.JobOutputId;
import com.flowkraft.jobson.specs.JobSpec;
import com.flowkraft.jobson.utils.BinaryData;

public final class FileSystemJobsDAOTest extends JobsDAOTest {

	private static FileSystemJobsDAO createStandardFileSystemDAO() {
		try {
			final Path jobDir = createTmpDir(FileSystemJobsDAOTest.class);
			return createStandardFileSystemDAO(jobDir);
		} catch (Exception ex) {
			throw new RuntimeException(ex);
		}
	}

	private static FileSystemJobsDAO createStandardFileSystemDAO(Path jobDir) throws Exception {
		FileSystemJobsDAO fsJobsDAO = new FileSystemJobsDAO();
		fsJobsDAO.setJobsDirectory(jobDir);
		return fsJobsDAO;
	}

	@Override
	protected JobDAO getInstance() {
		return createStandardFileSystemDAO();
	}

	
	private PersistedJob persistValidRequest(Path jobsDir) throws Exception {
		return persistRequest(jobsDir, STANDARD_VALID_REQUEST);
	}

	private PersistedJob persistRequest(Path jobsDir, ValidJobRequest jobRequest) throws Exception {
		final FileSystemJobsDAO dao = createStandardFileSystemDAO(jobsDir);
		return dao.persist(jobRequest);
	}
	
	/*
	@Test
	public void testCtorThrowsIfPassedANonExistentJobsDir() throws Exception {
		// Assertions.assertThrows(FileNotFoundException.class, () -> {
		final Path invalidPath = java.nio.file.Paths.get(generateAlphanumStr());
		createStandardFileSystemDAO(invalidPath);
		// });

	}
	 */
	
	@Test
	public void testPersistNewJobCreatesAJobDirNamedWithTheJobID() throws Exception {
		final Path jobsDir = createTmpDir(FileSystemJobsDAOTest.class);
		final JobId jobId = persistValidRequest(jobsDir).getId();
		assertThat(tryResolve(jobsDir, jobId)).isPresent();
	}
	@Test
	public void testPersistNewJobJobDirectoryContainsAJobRequestJSONFile() throws Exception {
		final Path jobsDir = createTmpDir(FileSystemJobsDAOTest.class);
		final JobId jobId = persistValidRequest(jobsDir).getId();
		assertThat(tryResolve(jobsDir, jobId, JOB_DIR_JOB_DETAILS_FILENAME)).isPresent();
	}

	@Test
	public void testPersistNewJobJobDirectoryJobRequestJSONFileIsValidJSON() throws Exception {
		final Path jobsDir = createTmpDir(FileSystemJobsDAOTest.class);
		final JobId jobId = persistValidRequest(jobsDir).getId();
		readJSON(tryResolve(jobsDir, jobId, JOB_DIR_JOB_DETAILS_FILENAME).get(), Object.class);
	}

	@Test
	public void testPersistNewJobDirJobRequestJSONFileIsJobDetails() throws Exception {
		final Path jobsDir = createTmpDir(FileSystemJobsDAOTest.class);
		final JobId jobId = persistValidRequest(jobsDir).getId();
		readJSON(tryResolve(jobsDir, jobId, JOB_DIR_JOB_DETAILS_FILENAME).get(), JobDetails.class);
	}
 
	
	@Test
	public void testPersistNewJobJobDirectoryContainsTheJobsSchema() throws Exception {
		final Path jobsDir = createTmpDir(FileSystemJobsDAOTest.class);
		final JobId jobId = persistValidRequest(jobsDir).getId();
		assertThat(tryResolve(jobsDir, jobId, Constants.JOB_DIR_JOB_SPEC_FILENAME)).isPresent();
	}

	@Test
	public void testPersistNewJobJobDirectorySchemaFileIsValidJSON() throws Exception {
		final Path jobsDir = createTmpDir(FileSystemJobsDAOTest.class);
		final JobId jobId = persistValidRequest(jobsDir).getId();
		assertThat(Helpers.tryResolve(jobsDir, jobId, Constants.JOB_DIR_JOB_SPEC_FILENAME)).isPresent();
	}

	@Test
	public void testPersistNewJobJobDirectoryJSONParsesToAJobSchemaConfiguration() throws Exception {
		final Path jobsDir = createTmpDir(FileSystemJobsDAOTest.class);
		final JobId jobId = persistValidRequest(jobsDir).getId();
		readJSON(tryResolve(jobsDir, jobId, Constants.JOB_DIR_JOB_SPEC_FILENAME).get(), JobSpec.class);
	}

	@Test
	public void testHasStdoutReturnsFalseIfTheStdoutFileWasDeleted() throws Exception {
		final Path jobsDir = createTmpDir(FileSystemJobsDAOTest.class);
		final FileSystemJobsDAO FileSystemJobsDAO = createStandardFileSystemDAO(jobsDir);
		final JobId jobId = FileSystemJobsDAO.persist(STANDARD_VALID_REQUEST).getId();
		FileSystemJobsDAO.appendStdout(jobId, TestHelpers.generateRandomByteObservable());
		final Path stdoutFile = jobsDir.resolve(jobId.toString()).resolve(Constants.JOB_DIR_STDOUT_FILENAME);

		Files.delete(stdoutFile);

		assertThat(FileSystemJobsDAO.hasStdout(jobId)).isFalse();
	}

	@Test
	public void testHasStderrReturnsFalseIfTheStderrFileWasDeleted() throws Exception {
		final Path jobsDir = createTmpDir(FileSystemJobsDAOTest.class);
		final FileSystemJobsDAO dao = createStandardFileSystemDAO(jobsDir);
		final JobId jobId = dao.persist(STANDARD_VALID_REQUEST).getId();
		dao.appendStderr(jobId, TestHelpers.generateRandomByteObservable());
		final Path stderrFilePath = jobsDir.resolve(jobId.toString()).resolve(Constants.JOB_DIR_STDERR_FILENAME);

		Files.delete(stderrFilePath);

		assertThat(dao.hasStderr(jobId)).isFalse();
	}
	
	
	@Test
	public void testGetSpecJobWasSubmittedAgainstReturnsOptionalEmptyIfJobDoesntExist() throws Exception {
		final Path jobsDir = createTmpDir(FileSystemJobsDAOTest.class);
		final FileSystemJobsDAO dao = createStandardFileSystemDAO(jobsDir);
		assertThat(dao.getSpecJobWasSubmittedAgainst(generateJobId())).isNotPresent();
	}

	@Test
	public void testGetSpecJobWasSubmittedAgainstReturnsSpecIfJobDoesExist() throws Exception {
		final Path jobsDir = createTmpDir(FileSystemJobsDAOTest.class);
		final FileSystemJobsDAO dao = createStandardFileSystemDAO(jobsDir);
		final JobId jobId = dao.persist(STANDARD_VALID_REQUEST).getId();
		final Optional<JobSpec> maybeJobSpec = dao.getSpecJobWasSubmittedAgainst(jobId);

		assertThat(maybeJobSpec).isPresent();
		assertThat(maybeJobSpec.get()).isEqualTo(STANDARD_VALID_REQUEST.getSpec());
	}

	@Test
	public void testPersistJobOutputOutputFolderDoesNotExistBeforePersisting() throws Exception {
		final Path jobsDir = createTmpDir(FileSystemJobsDAOTest.class);
		final FileSystemJobsDAO dao = createStandardFileSystemDAO(jobsDir);

		final JobId jobId = dao.persist(STANDARD_VALID_REQUEST).getId();

		assertThat(jobsDir.resolve(jobId.toString()).resolve(JOB_DIR_OUTPUTS_DIRNAME)).doesNotExist();
	}

	@Test
	public void testPersistJobOutputThrowsIfJobDoesNotExist() throws Exception {

		Assertions.assertThrows(RuntimeException.class, () -> {
			final Path jobsDir = createTmpDir(FileSystemJobsDAOTest.class);
			final FileSystemJobsDAO dao = createStandardFileSystemDAO(jobsDir);

			dao.persistOutput(generateJobId(), generateRandomJobOutput());
		});

	}

	@Test
	public void testPersistJobOutputSavesTheJobOutputToAnOutputsSubfolder() throws Exception {
		final Path jobsDir = createTmpDir(FileSystemJobsDAOTest.class);
		final FileSystemJobsDAO dao = createStandardFileSystemDAO(jobsDir);

		final JobId jobId = dao.persist(STANDARD_VALID_REQUEST).getId();

		final byte[] data = generateRandomBytes();
		final JobOutput jobOutput = generateRandomJobOutput(data);

		dao.persistOutput(jobId, jobOutput);

		final Path outputsDir = jobsDir.resolve(jobId.toString()).resolve(JOB_DIR_OUTPUTS_DIRNAME);

		assertThat(outputsDir.toFile()).exists();

		final Path outputFile = outputsDir.resolve(jobOutput.getId().toString());

		assertThat(outputFile).exists();

		final byte[] outputFileContent = Files.readAllBytes(outputFile);

		assertThat(outputFileContent).isEqualTo(data);
	}

	@Test
	public void testPersistJobOutputOverwritesExistingOutputWithSameId() throws Exception {
		final Path jobsDir = createTmpDir(FileSystemJobsDAOTest.class);
		final FileSystemJobsDAO dao = createStandardFileSystemDAO(jobsDir);

		final JobId jobId = dao.persist(STANDARD_VALID_REQUEST).getId();

		final JobOutput firstJobOutput = generateRandomJobOutput();
		final JobOutputId outputId = firstJobOutput.getId();

		dao.persistOutput(jobId, firstJobOutput);

		final byte secondJobData[] = generateRandomBytes();
		final JobOutput secondJobOutput = generateRandomJobOutput(firstJobOutput.getId(), secondJobData);

		dao.persistOutput(jobId, secondJobOutput);

		final Path outputsDir = jobsDir.resolve(jobId.toString()).resolve(JOB_DIR_OUTPUTS_DIRNAME);

		assertThat(outputsDir.toFile()).exists();

		final Path outputFile = outputsDir.resolve(outputId.toString());

		assertThat(outputFile).exists();

		final byte[] outputFileContent = Files.readAllBytes(outputFile);

		assertThat(outputFileContent).isEqualTo(secondJobData);
	}

	
	
	@Test
	public void testHasJobInputsReturnsFalseIfJobExistsButInputsWereDeleted() throws Exception {
		final Path jobsDir = createTmpDir(FileSystemJobsDAOTest.class);
		final FileSystemJobsDAO dao = createStandardFileSystemDAO(jobsDir);
		final JobId jobId = dao.persist(STANDARD_VALID_REQUEST).getId();

		final Path pathToInputsJSONFile = jobsDir.resolve(jobId.toString())
				.resolve(Constants.JOB_DIR_JOB_INPUTS_FILENAME);

		Files.delete(pathToInputsJSONFile);

		assertThat(dao.hasJobInputs(jobId)).isFalse();
	}

	@Test
	public void testGetJobsDoesNotThrowWhenANoneJobDirectoryIsInTheJobsDirectory() throws Exception {

		final Path jobsDir = createTmpDir(FileSystemJobsDAOTest.class);
		final FileSystemJobsDAO dao = createStandardFileSystemDAO(jobsDir);

		dao.persist(STANDARD_VALID_REQUEST).getId();
		Files.createDirectory(jobsDir.resolve(".git"));

		final List<JobDetails> jobs = dao.getJobs(100, 0);

		assertThat(jobs.size()).isEqualTo(1);
	}

	@Test
	public void testGetJobsDoesNotThrowWhenAnArbitraryFileIsInTheJobsDirectory() throws Exception {

		final Path jobsDir = createTmpDir(FileSystemJobsDAOTest.class);
		final FileSystemJobsDAO dao = createStandardFileSystemDAO(jobsDir);

		dao.persist(STANDARD_VALID_REQUEST).getId();
		Files.createFile(jobsDir.resolve("README.md"));

		final List<JobDetails> jobs = dao.getJobs(100, 0);

		assertThat(jobs.size()).isEqualTo(1);
	}

	@Test
	public void testGetJobsDoesNotThrowWhenAJobDirectoryDoesntContainARequestJson() throws Exception {

		final Path jobsDir = createTmpDir(FileSystemJobsDAOTest.class);
		final FileSystemJobsDAO dao = createStandardFileSystemDAO(jobsDir);

		final JobId jobId = dao.persist(STANDARD_VALID_REQUEST).getId();
		Files.delete(jobsDir.resolve(jobId.toString()).resolve(Constants.JOB_DIR_JOB_DETAILS_FILENAME));

		final List<JobDetails> jobs = dao.getJobs(100, 0);

		assertThat(jobs.size()).isEqualTo(0);
	}

	@Test
	public void testGetJobsDoesNotThrowWhenASpecIsDeletedFromAJobDirectory() throws Exception {

		final Path jobsDir = createTmpDir(FileSystemJobsDAOTest.class);
		final FileSystemJobsDAO dao = createStandardFileSystemDAO(jobsDir);

		final JobId jobId = dao.persist(STANDARD_VALID_REQUEST).getId();
		Files.delete(jobsDir.resolve(jobId.toString()).resolve(Constants.JOB_DIR_JOB_SPEC_FILENAME));

		final List<JobDetails> jobs = dao.getJobs(100, 0);

		assertThat(jobs.size()).isEqualTo(1);
	}

	@Test
	public void testGetJobSpecJustReturnsEmptyOptionalIfDeletedFromAJobDirectory() throws Exception {
		final Path jobsDir = createTmpDir(FileSystemJobsDAOTest.class);
		final FileSystemJobsDAO dao = createStandardFileSystemDAO(jobsDir);

		final JobId jobId = dao.persist(STANDARD_VALID_REQUEST).getId();
		Files.delete(jobsDir.resolve(jobId.toString()).resolve(Constants.JOB_DIR_JOB_SPEC_FILENAME));

		final Optional<JobSpec> maybeSpec = dao.getSpecJobWasSubmittedAgainst(jobId);

		assertThat(maybeSpec).isNotPresent();
	}

	@Test
	public void testGetJobJobsDoesNotThrowWhenInputsAreDeletedFromJobDirectory() throws Exception {
		final Path jobsDir = createTmpDir(FileSystemJobsDAOTest.class);
		final FileSystemJobsDAO dao = createStandardFileSystemDAO(jobsDir);

		final JobId jobId = dao.persist(STANDARD_VALID_REQUEST).getId();
		Files.delete(jobsDir.resolve(jobId.toString()).resolve(Constants.JOB_DIR_JOB_INPUTS_FILENAME));

		final List<JobDetails> jobs = dao.getJobs(100, 0);

		assertThat(jobs.size()).isEqualTo(1);
	}

	@Test
	public void testGetJobsDoesNotThrowWhenStdoutIsDeletedFromJobDirectory() throws Exception {
		final Path jobsDir = createTmpDir(FileSystemJobsDAOTest.class);
		final FileSystemJobsDAO dao = createStandardFileSystemDAO(jobsDir);

		final JobId jobId = dao.persist(STANDARD_VALID_REQUEST).getId();
		dao.appendStdout(jobId, TestHelpers.generateRandomByteObservable());
		Files.delete(jobsDir.resolve(jobId.toString()).resolve(Constants.JOB_DIR_STDOUT_FILENAME));

		final List<JobDetails> jobs = dao.getJobs(100, 0);

		assertThat(jobs.size()).isEqualTo(1);
	}

	@Test
	public void testGetJobsDoesNotThrowWhenStderrIsDeletedFromJobDirectory() throws Exception {
		final Path jobsDir = createTmpDir(FileSystemJobsDAOTest.class);
		final FileSystemJobsDAO dao = createStandardFileSystemDAO(jobsDir);

		final JobId jobId = dao.persist(STANDARD_VALID_REQUEST).getId();
		dao.appendStderr(jobId, TestHelpers.generateRandomByteObservable());
		Files.delete(jobsDir.resolve(jobId.toString()).resolve(Constants.JOB_DIR_STDERR_FILENAME));

		final List<JobDetails> jobs = dao.getJobs(100, 0);

		assertThat(jobs.size()).isEqualTo(1);
	}

	@Test
	public void testGetJobOutputsDoesntFailIfOutputDeletedButStillInMetadata() throws Exception {
		final Path jobsDir = createTmpDir(FileSystemJobsDAOTest.class);
		final FileSystemJobsDAO dao = createStandardFileSystemDAO(jobsDir);

		final JobId jobId = dao.persist(STANDARD_VALID_REQUEST).getId();
		final JobOutput persistedOutput = generateRandomJobOutput();
		dao.persistOutput(jobId, persistedOutput);

		boolean deleted = false;
		while (!deleted) {
			try {
				FileUtils.forceDelete(jobsDir.resolve(jobId.toString()).resolve(Constants.JOB_DIR_OUTPUTS_DIRNAME)
						.resolve(persistedOutput.getId().toString()).toFile());
				deleted = true;
			} catch (Exception ex) {
				deleted = false;
			}
		}

		final List<JobOutputDetails> jobOutputs = dao.getJobOutputs(jobId);

		assertThat(jobOutputs.size()).isEqualTo(1);

		final Optional<BinaryData> data = dao.getOutput(jobId, persistedOutput.getId());

		assertThat(data).isNotPresent(); // Because the data itself has been deleted
	}

	@Test
	public void testRemoveDeletesTheJobsDirectory() throws Exception {
		final Path jobsDir = createTmpDir(FileSystemJobsDAOTest.class);
		final FileSystemJobsDAO dao = createStandardFileSystemDAO(jobsDir);

		final JobId jobId = dao.persist(STANDARD_VALID_REQUEST).getId();

		assertThat(Files.exists(jobsDir.resolve(jobId.toString()))).isTrue();

		dao.remove(jobId);

		assertThat(Files.exists(jobsDir.resolve(jobId.toString()))).isFalse();
	}
	
}