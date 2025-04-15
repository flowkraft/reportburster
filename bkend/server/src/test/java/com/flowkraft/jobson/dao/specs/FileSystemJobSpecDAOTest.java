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

package com.flowkraft.jobson.dao.specs;

import static com.flowkraft.jobson.Constants.SPEC_DIR_SPEC_FILENAME;
import static com.flowkraft.jobson.Helpers.generateRandomBase36String;
import static com.flowkraft.jobson.TestHelpers.createTmpDir;
import static com.flowkraft.jobson.TestHelpers.fixture;
import static com.flowkraft.jobson.TestHelpers.readYAML;
import static java.nio.file.Files.createDirectory;
import static java.nio.file.Files.createTempFile;
import static org.assertj.core.api.Assertions.assertThat;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import com.flowkraft.jobson.TestHelpers;
import com.flowkraft.jobson.specs.JobSpec;
import com.flowkraft.jobson.specs.JobSpecId;

public final class FileSystemJobSpecDAOTest {

	private JobSpecDAO getInstance(Path jobSpecDir) throws Exception {
		FileSystemJobSpecDAO fsJobSpecDAO = new FileSystemJobSpecDAO();
		fsJobSpecDAO.setJobSpecDirectory(jobSpecDir);
		return fsJobSpecDAO;
	}

	/*
	 * @Test public void testCtorThrowsIfDirDoesNotExist() throws Exception { //
	 * Assertions.assertThrows(FileNotFoundException.class, () -> {
	 * getInstance(java.nio.file.Paths.get(generateRandomBase36String(10))); //}); }
	 * 
	 */

	@Test
	public void testCtorThrowsIfDirIsNull() throws Exception {

		Assertions.assertThrows(NullPointerException.class, () -> {
			getInstance(null);
		});

	}

	@Test
	public void testCtorThrowsIfPathExistsButIsNotADirectory() throws Exception {
		final Path pathToFile = createTempFile(FileSystemJobSpecDAOTest.class.getSimpleName(), "");

		// Assertions.assertThrows(NotDirectoryException.class, () -> {
		getInstance(pathToFile);
		// });

	}

	@Test
	public void testGetJobSpecDetailsByIdReturnsEmptyOptionalIfJobSpecIdDoesntExistInTheDir() throws Exception {
		final Path jobSpecsDir = createTmpDir(FileSystemJobSpecDAOTest.class);

		final JobSpecDAO fsJobSpecDAO = getInstance(jobSpecsDir);

		final JobSpecId jobSpecId = new JobSpecId(generateRandomBase36String(10));

		final Optional<JobSpecSummary> jobSpecDetailsResponse = fsJobSpecDAO.getJobSpecSummaryById(jobSpecId);

		assertThat(jobSpecDetailsResponse.isPresent()).isFalse();
	}

	@Test
	public void testGetJobSpecDetailsByIdLoadsJobSpecDetailsFromTheDirectory() throws Exception {
		final Path jobSpecsDir = createTmpDir(FileSystemJobSpecDAOTest.class);

		final JobSpecId jobSpecId = new JobSpecId("test");
		final Path jobSpecPath = jobSpecsDir.resolve(jobSpecId.toString());

		createDirectory(jobSpecPath);

		final Path jobSpecConfigurationPath = jobSpecPath.resolve(SPEC_DIR_SPEC_FILENAME);
		final String jobSpecConfigurationText = fixture(
				"fixtures/jobson/dao/specs/FilesystemBasedJobSpecDAO/valid-job-spec-configuration.yml");

		Files.write(jobSpecConfigurationPath, jobSpecConfigurationText.getBytes());

		final JobSpecDAO fsJobSpecDAO = getInstance(jobSpecsDir);

		final Optional<JobSpec> maybeJobSpec = fsJobSpecDAO.getJobSpecById(jobSpecId);

		assertThat(maybeJobSpec).isPresent();

		final JobSpec jobSpec = maybeJobSpec.get();

		assertThat(jobSpec.getId()).isEqualTo(jobSpecId);

		final JobSpec originalJobSpec = readYAML(jobSpecConfigurationText, JobSpec.class);

		originalJobSpec.setId(jobSpecId);

		assertThat(jobSpec).isEqualTo(originalJobSpec.withDependenciesResolvedRelativeTo(jobSpecPath));
	}

	@Test
	public void testGetJobSpecConfigurationByIdReturnsEmptyOptionalIfJobSpecDoesNotExist() throws Exception {
		final Path jobSpecsDir = Files.createTempDirectory(FileSystemJobSpecDAOTest.class.getSimpleName());

		final JobSpecDAO fsJobSpecDAO = getInstance(jobSpecsDir);

		final JobSpecId jobSpecId = new JobSpecId(generateRandomBase36String(10));

		final Optional<JobSpec> jobSpecDetailsResponse = fsJobSpecDAO.getJobSpecById(jobSpecId);

		assertThat(jobSpecDetailsResponse.isPresent()).isFalse();
	}

	@Test
	public void testGetJobSpecConfigurationByIdReturnsLoadsAJobSpecConfigurationFromTheDirectory() throws Exception {
		final Path jobSpecsDir = Files.createTempDirectory(FileSystemJobSpecDAOTest.class.getSimpleName());

		final JobSpecId jobSpecId = new JobSpecId("test");
		final Path jobSpecPath = jobSpecsDir.resolve(jobSpecId.toString());

		createDirectory(jobSpecPath);

		final Path jobSpecConfigurationPath = jobSpecPath.resolve(SPEC_DIR_SPEC_FILENAME);
		final String jobSpecConfigurationText = fixture(
				"fixtures/jobson/dao/specs/FilesystemBasedJobSpecDAO/valid-job-spec-configuration-with-abs-path.yml");

		Files.write(jobSpecConfigurationPath, jobSpecConfigurationText.getBytes());

		final JobSpecDAO fsJobSpecDAO = getInstance(jobSpecsDir);

		final Optional<JobSpec> maybeJobSpecConfiguration = fsJobSpecDAO.getJobSpecById(jobSpecId);

		assertThat(maybeJobSpecConfiguration.isPresent()).isTrue();

		final JobSpec jobSpec = maybeJobSpecConfiguration.get();

		final JobSpec expectedJobSpec = readYAML(jobSpecConfigurationText, JobSpec.class);

		expectedJobSpec.setId(jobSpecId);

		assertThat(jobSpec).isEqualTo(expectedJobSpec);
	}

	@Test
	public void testJobSpecConfigurationDependencyPathsAreResolvedRelativeToTheJobSpecFolderAsAbsolutePaths()
			throws Exception {
		final Path jobSpecsDir = Files.createTempDirectory(FileSystemJobSpecDAOTest.class.getSimpleName());

		final JobSpecId jobSpecId = new JobSpecId("test");
		final Path jobSpecPath = jobSpecsDir.resolve(jobSpecId.toString());

		createDirectory(jobSpecPath);

		final Path jobSpecConfigurationPath = jobSpecPath.resolve(SPEC_DIR_SPEC_FILENAME);
		final String jobSpecConfigurationText = fixture(
				"fixtures/jobson/dao/specs/FilesystemBasedJobSpecDAO/valid-job-spec-configuration.yml");

		Files.write(jobSpecConfigurationPath, jobSpecConfigurationText.getBytes());

		final JobSpecDAO fsJobSpecDAO = getInstance(jobSpecsDir);

		final Optional<JobSpec> maybeJobSpecConfiguration = fsJobSpecDAO.getJobSpecById(jobSpecId);

		assertThat(maybeJobSpecConfiguration.isPresent()).isTrue();

		final JobSpec jobSpec = maybeJobSpecConfiguration.get();

		final String source = jobSpec.getExecution().getDependencies().get().get(0).getSource().getValue();

		assertThat(source).isNotEqualTo("libyaml.so");
		assertThat(source).isEqualTo(jobSpecPath.resolve("libyaml.so").toString());
	}
	// .getJobSpecSummaries (with query)

	@Test
	public void testGetJobSpecSummariesWithQueryThrowsInvalidArgumentExceptionIfPageSizeIsNegative() throws Exception {
		final Path jobSpecsDir = Files.createTempDirectory(FileSystemJobSpecDAOTest.class.getSimpleName());
		final JobSpecDAO fsJobSpecDAO = getInstance(jobSpecsDir);

		Assertions.assertThrows(IllegalArgumentException.class, () -> {
			fsJobSpecDAO.getJobSpecSummaries(-1, 0, TestHelpers.generateRandomString());
		});
	}

	@Test
	public void testGetJobSpecSummariesWithQueryThrowsInvalidArgumentExceptionIfPageIsNegative() throws Exception {
		final Path jobSpecsDir = Files.createTempDirectory(FileSystemJobSpecDAOTest.class.getSimpleName());
		final JobSpecDAO fsJobSpecDAO = getInstance(jobSpecsDir);

		Assertions.assertThrows(IllegalArgumentException.class, () -> {
			fsJobSpecDAO.getJobSpecSummaries(20, -1, TestHelpers.generateRandomString());
		});

	}

	@Test
	public void testGetJobSpecSummariesWithQueryThrowsNPEIfQueryIsNull() throws Exception {
		final Path jobSpecsDir = Files.createTempDirectory(FileSystemJobSpecDAOTest.class.getSimpleName());
		final JobSpecDAO fsJobSpecDAO = getInstance(jobSpecsDir);

		Assertions.assertThrows(NullPointerException.class, () -> {
			fsJobSpecDAO.getJobSpecSummaries(20, 0, null);
		});
	}

	@Test
	public void testGetJobSpecSummariesWithQueryReturnsAList() throws Exception {
		final Path jobSpecsDir = Files.createTempDirectory(FileSystemJobSpecDAOTest.class.getSimpleName());
		final JobSpecDAO fsJobSpecDAO = getInstance(jobSpecsDir);

		final List<JobSpecSummary> jobSpecSummaries = fsJobSpecDAO.getJobSpecSummaries(20, 0, "");

		assertThat(jobSpecSummaries).isNotNull();
	}

	@Test
	public void testGetJobSpecSummariesWithQueryReturnsOnlyTheNumberOfEntriesSpecifiedByPageSize() throws Exception {
		final Path jobSpecsDir = Files.createTempDirectory(FileSystemJobSpecDAOTest.class.getSimpleName());

		final int pageSize = 10;
		final int numberOfSpecs = pageSize * 3;
		final String jobSpecConfigurationText = fixture(
				"fixtures/jobson/dao/specs/FilesystemBasedJobSpecDAO/valid-job-spec-configuration.yml");

		for (int i = 0; i < numberOfSpecs; i++) {
			final JobSpecId jobSpecId = new JobSpecId(generateRandomBase36String(5));
			final Path jobSpecPath = jobSpecsDir.resolve(jobSpecId.toString());

			createDirectory(jobSpecPath);

			final Path jobSpecConfigurationPath = jobSpecPath.resolve(SPEC_DIR_SPEC_FILENAME);

			Files.write(jobSpecConfigurationPath, jobSpecConfigurationText.getBytes());
		}

		final JobSpecDAO fsJobSpecDAO = getInstance(jobSpecsDir);

		final List<JobSpecSummary> jobSpecSummaries = fsJobSpecDAO.getJobSpecSummaries(pageSize, 0, "");

		assertThat(jobSpecSummaries.size()).isEqualTo(pageSize);
	}

	// .getJobSpecSummaries (without query)

	@Test
	public void testGetJobSpecSummariesWithoutQueryThrowsInvalidArgumentExceptionIfPageSizeIsNegative()
			throws Exception {
		final Path jobSpecsDir = Files.createTempDirectory(FileSystemJobSpecDAOTest.class.getSimpleName());
		final JobSpecDAO fsJobSpecDAO = getInstance(jobSpecsDir);

		Assertions.assertThrows(IllegalArgumentException.class, () -> {
			fsJobSpecDAO.getJobSpecSummaries(-1, 0);
		});

	}

	@Test
	public void testGetJobSpecSummariesWithoutQueryThrowsInvalidArgumentExceptionIfPageIsNegative() throws Exception {
		final Path jobSpecsDir = Files.createTempDirectory(FileSystemJobSpecDAOTest.class.getSimpleName());
		final JobSpecDAO fsJobSpecDAO = getInstance(jobSpecsDir);

		Assertions.assertThrows(IllegalArgumentException.class, () -> {
			fsJobSpecDAO.getJobSpecSummaries(20, -1);
		});

	}

	@Test
	public void testGetJobSpecSummariesWithoutQueryReturnsAList() throws Exception {
		final Path jobSpecsDir = Files.createTempDirectory(FileSystemJobSpecDAOTest.class.getSimpleName());
		final JobSpecDAO fsJobSpecDAO = getInstance(jobSpecsDir);

		final List<JobSpecSummary> jobSpecSummaries = fsJobSpecDAO.getJobSpecSummaries(20, 0);

		assertThat(jobSpecSummaries).isNotNull();
	}

	@Test
	public void testGetJobSpecSummariesWithoutQueryReturnsOnlyTheNumberOfEntriesSpecifiedByPageSize() throws Exception {
		final Path jobSpecsDir = Files.createTempDirectory(FileSystemJobSpecDAOTest.class.getSimpleName());

		final int pageSize = 10;
		final int numberOfSpecs = pageSize * 3;
		final String jobSpecConfigurationText = fixture(
				"fixtures/jobson/dao/specs/FilesystemBasedJobSpecDAO/valid-job-spec-configuration.yml");

		for (int i = 0; i < numberOfSpecs; i++) {
			final JobSpecId jobSpecId = new JobSpecId(generateRandomBase36String(5));
			final Path jobSpecPath = jobSpecsDir.resolve(jobSpecId.toString());

			createDirectory(jobSpecPath);

			final Path jobSpecConfigurationPath = jobSpecPath.resolve(SPEC_DIR_SPEC_FILENAME);

			Files.write(jobSpecConfigurationPath, jobSpecConfigurationText.getBytes());
		}

		final JobSpecDAO fsJobSpecDAO = getInstance(jobSpecsDir);

		final List<JobSpecSummary> jobSpecSummaries = fsJobSpecDAO.getJobSpecSummaries(pageSize, 0);

		assertThat(jobSpecSummaries.size()).isEqualTo(pageSize);
	}

}