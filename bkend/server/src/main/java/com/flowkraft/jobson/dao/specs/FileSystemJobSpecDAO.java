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

import static com.flowkraft.jobson.Helpers.listDirectories;
import static com.flowkraft.jobson.Helpers.readYAML;
import static java.util.Objects.requireNonNull;
import static java.util.stream.Collectors.toList;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Optional;

import javax.annotation.PostConstruct;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.flowkraft.jobson.Constants;
import com.flowkraft.jobson.config.ApplicationConfig;
import com.flowkraft.jobson.specs.JobSpec;
import com.flowkraft.jobson.specs.JobSpecId;
import com.flowkraft.common.AppPaths;
@Component
public final class FileSystemJobSpecDAO implements JobSpecDAO {

	private static final Logger log = LoggerFactory.getLogger(FileSystemJobSpecDAO.class);

	@Autowired
	ApplicationConfig appConfig;

	private static Optional<JobSpec> loadJobSpec(Path jobSpecDir) {
		final Path jobSpecPath = jobSpecDir.resolve(Constants.SPEC_DIR_SPEC_FILENAME);

		try {
			if (jobSpecPath.toFile().exists()) {
				final JobSpec jobSpec = readYAML(jobSpecPath.toFile(), JobSpec.class);
				jobSpec.setId(new JobSpecId(jobSpecDir.toFile().getName()));

				final JobSpec resolvedJobSpec = jobSpec.withDependenciesResolvedRelativeTo(jobSpecDir);
				return Optional.of(resolvedJobSpec);
			} else {
				log.error(jobSpecPath.toString() + ": does not exist");
				return Optional.empty();
			}
		} catch (IOException ex) {
			throw new RuntimeException(ex);
		}
	}

	private Path jobSpecsDir;

	public void setJobSpecDirectory(Path jobSpecsDir) throws Exception {

		this.jobSpecsDir = jobSpecsDir;
		requireNonNull(this.jobSpecsDir);

		if (!jobSpecsDir.toFile().exists()) {
			Files.createDirectories(this.jobSpecsDir);
			// throw new FileNotFoundException(jobSpecsDir.toString() + ": No such
			// directory");
		}
		// if (!jobSpecsDir.toFile().isDirectory())
		// throw new NotDirectoryException(jobSpecsDir.toString() + ": Is not a
		// directory");

	}

	@PostConstruct
	private void _init() throws Exception {

		setJobSpecDirectory(java.nio.file.Paths.get(AppPaths.WORKSPACE_DIR_PATH + this.appConfig.getSpecs().getDir()));

	}

	@Override
	public Optional<JobSpec> getJobSpecById(JobSpecId jobSpecId) {
		final Path jobSpecDir = jobSpecsDir.resolve(jobSpecId.toString());

		if (!jobSpecDir.toFile().exists()) {
			return Optional.empty();
		} else if (!jobSpecDir.toFile().isDirectory()) {
			log.error(jobSpecDir.toString() + ": is not a directory");
			return Optional.empty();
		} else {
			return loadJobSpec(jobSpecDir);
		}
	}

	@Override
	public Optional<JobSpecSummary> getJobSpecSummaryById(JobSpecId jobSpecId) {
		return getJobSpecById(jobSpecId).map(JobSpec::toSummary);
	}

	@Override
	public List<JobSpecSummary> getJobSpecSummaries(int pageSize, int page) {
		return getJobSpecSummaries(pageSize, page, "");
	}

	@Override
	public List<JobSpecSummary> getJobSpecSummaries(int pageSize, int page, String query) {

		if (pageSize < 0)
			throw new IllegalArgumentException("pageSize is negative");
		if (page < 0)
			throw new IllegalArgumentException("page is negative");
		requireNonNull(query);

		return listDirectories(jobSpecsDir).map(File::toPath).map(path -> loadJobSpec(path).map(JobSpec::toSummary))
				.filter(Optional::isPresent).map(Optional::get).skip(page * pageSize).limit(pageSize)
				.sorted(FileSystemJobSpecDAO::bySpecName).collect(toList());
	}

	private static int bySpecName(JobSpecSummary a, JobSpecSummary b) {
		return a.getName().compareTo(b.getName());
	}
}
